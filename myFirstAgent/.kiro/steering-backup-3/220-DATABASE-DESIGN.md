---
inclusion: manual
---

# 数据库设计规范

## 文件位置

```
.kiro/specs/{feature-name}/07-database-design.md
```

---

## 模板结构

```markdown
# {功能名称} - 数据库设计

## 1. 设计概述
## 2. 表结构设计
## 3. 索引设计
## 4. 约束设计
## 5. Entity-PO 映射
## 6. 数据字典
## 7. 迁移脚本
```

---

## 表命名规范

前缀：使用系统前缀（wms_）
命名：使用下划线分隔（wms_receipt）
关联表：主表名_子表名（wms_receipt_line）
配置表：主表名_config（wms_receiving_config）

---

## 字段命名规范

[重要] 字段使用驼峰命名（lowerCamelCase），与 Java 实体属性保持一致

主键：id（使用 BIGINT 自增，禁止使用 UUID）
外键：关联表名Id（receiptId）
状态：status
类型：xxxType（receiptType）
编码：xxxCode 或 xxxNo（receiptNo）
数量：xxxQuantity（plannedQuantity）
时间：xxxTime（createdTime, updatedTime）
人员：xxxBy（createdBy, updatedBy）
布尔：isXxx（isDeleted）

[重要] 主键设计原则：
- 禁止使用 UUID 作为主键 - UUID 是无序的，会导致 InnoDB 存储页频繁分裂，严重影响插入性能和索引效率
- 推荐使用 BIGINT 自增主键 - 有序递增，插入性能好，索引紧凑
- 业务标识使用独立字段（如 facilityId、zoneId）存储 UUID，并建立唯一索引

---

## 字段类型规范

[重要] 根据字段特性选择合适的数据类型

布尔类型字段：
- 使用 TINYINT(1) 或 BOOLEAN
- 明确只有两个值的字段（是/否、启用/禁用、真/假）
- 示例：enabled, isDeleted, isCargoPassable, isActive
- 默认值：通常设置为 0（false）或 1（true）

多值字段：
- 使用 JSON 类型
- 包含多个值的列表、数组、复杂对象
- 示例：capabilities（能力列表）、controlledLocationCodes（控制位置列表）、dependentEntities（依赖实体列表）
- 优点：灵活扩展、支持复杂查询、避免逗号分隔字符串的解析问题

字符串类型：
- VARCHAR(n)：变长字符串，n 为最大长度
- TEXT/LONGTEXT：大文本内容

数值类型：
- INT：整数
- BIGINT：大整数（如主键 ID）
- DOUBLE/DECIMAL：浮点数/精确小数

日期时间类型：
- TIMESTAMP：时间戳（推荐，统一使用）
- DATE：日期（仅需要日期时使用）
- TIME：时间（仅需要时间时使用）

---

## 通用字段（继承基类）

[重要] 参考 common 模块的基类定义

BaseEntity 字段：
- createdTime: LocalDateTime - 创建时间
- createdBy: String - 创建人
- updatedTime: LocalDateTime - 更新时间
- updatedBy: String - 更新人

BaseCompanyEntity 字段（继承 BaseEntity）：
- tenantId: String - 租户ID（自动填充）
- isolationId: String - 隔离ID（自动填充）

BaseFacilityEntity 字段（继承 BaseEntity）：
- tenantId: String - 租户ID（自动填充）
- isolationId: String - 隔离ID

每个表必须包含：

```sql
-- 主键（BIGINT 自增，禁止使用 UUID）
id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '主键ID',
PRIMARY KEY (id),

-- 审计字段（来自 BaseEntity）
createdTime     TIMESTAMP       NOT NULL    DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
createdBy       VARCHAR(36)                 COMMENT '创建人ID',
updatedTime     TIMESTAMP       NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
updatedBy       VARCHAR(36)                 COMMENT '更新人ID',

-- 租户隔离字段（来自 BaseCompanyEntity/BaseFacilityEntity）
tenantId        VARCHAR(36)     NOT NULL    COMMENT '租户ID',
isolationId     VARCHAR(36)                 COMMENT '隔离ID',
```

---

## 扩展字段

为业务扩展预留：

```sql
ext1 ~ ext10    VARCHAR(255)    COMMENT '扩展字段1~10',
```

---

## 索引命名规范

主键：pk_{表名}
唯一索引：uk_{表名}_{字段}
普通索引：idx_{表名}_{字段}
组合索引：idx_{表名}_{字段1}_{字段2}

---

## 索引设计原则

1. 主键索引 - 每个表必须有主键（BIGINT 自增）
2. 唯一索引 - 业务编号字段建立唯一索引（使用业务编码，不使用 UUID）
3. 外键索引 - 外键字段建立索引（使用业务编码关联）
4. 查询索引 - 高频查询条件建立索引
5. 组合索引 - 遵循最左前缀原则

[重要] 索引字段选择原则：
- 禁止对 UUID 字段建立索引 - UUID 是无序的，索引效率低，占用空间大
- 唯一索引使用业务编码（facilityCode、zoneCode 等）- 业务编码通常较短且有序
- 外键关联使用业务编码 - 避免使用 UUID 进行表关联
- 查询条件优先使用枚举、状态、类型等字段 - 区分度高且占用空间小

---

## Entity-PO 映射规则

聚合根 -> 主表
实体 -> 子表（通过外键关联）
值对象 -> 字段/嵌入（展开为多个字段）
枚举 -> VARCHAR（存储枚举名称）
ID类型 -> BIGINT（主键自增）或 VARCHAR(36)（业务标识 UUID）
布尔类型 -> TINYINT(1) 或 BOOLEAN
集合类型 -> JSON（多值字段、列表、数组）

[重要] 主键与业务标识分离：
- 主键 id：BIGINT 自增，用于数据库内部关联和索引
- 业务标识（如 facilityId、zoneId）：VARCHAR(36) 存储 UUID，用于业务逻辑和外部接口
- 业务标识建立唯一索引，确保业务唯一性

---

## 迁移脚本命名

```
V{版本号}__{描述}.sql

示例：
V1__create_receipt_tables.sql
V2__create_task_tables.sql
V3__add_receipt_ext_fields.sql
```

---

## 检查清单

表结构：
- [ ] 表名符合命名规范
- [ ] 字段名符合命名规范
- [ ] 包含通用审计字段
- [ ] 包含扩展字段（如需要）
- [ ] 字段类型合理
- [ ] 字段注释完整

索引：
- [ ] 主键索引
- [ ] 唯一索引（业务编号）
- [ ] 外键索引
- [ ] 查询索引
- [ ] 索引命名规范

映射：
- [ ] Entity-PO 映射清晰
- [ ] 值对象展开正确
- [ ] 枚举存储方式明确

迁移脚本：
- [ ] 脚本命名规范
- [ ] 脚本可重复执行
