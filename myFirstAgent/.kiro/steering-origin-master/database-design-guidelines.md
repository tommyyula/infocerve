# 数据库设计规范（Database Design Guidelines）

## 概述

本规范定义了数据库设计文档的编写标准，确保数据模型与领域模型的正确映射，以及数据库设计的规范性。

### 相关规范

- **领域建模规范**：参见 `domain-model-guidelines.md`
- **技术设计规范**：参见 `design-guidelines.md`
- **DDD 架构规范**：参见 `ddd-architecture.md`

---

## 文件位置

```
.kiro/specs/{feature-name}/database-design.md
```

---

## 创建时机

数据库设计应在以下阶段创建：

```
domain-model.md (战术设计)
    ↓
demo/ (前端原型)
    ↓
design.md (技术设计)
    ↓
★ database-design.md ★  ← 在技术设计之后
    ↓
e2e-test-cases.md
```

**原则**：
1. 基于领域模型设计数据库结构
2. 在技术设计确定后细化数据库设计
3. 为测试用例和实现任务提供数据基础

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

## 1. 设计概述

简要描述数据库设计的范围和原则。

```markdown
## 1. 设计概述

### 1.1 设计范围

本文档定义 {功能名称} 相关的数据库表结构，包括：
- 主表：{列出主要表}
- 关联表：{列出关联表}
- 配置表：{列出配置表}

### 1.2 设计原则

1. **领域驱动**：表结构基于领域模型设计
2. **聚合边界**：一个聚合对应一组表
3. **扩展性**：预留扩展字段（ext1~ext10）
4. **审计追踪**：包含创建/更新时间和操作人
5. **软删除**：使用 deleted 标记而非物理删除
```

---

## 2. 表结构设计

### 2.1 表命名规范

| 规则 | 说明 | 示例 |
|-----|------|------|
| 前缀 | 使用系统前缀 | wms_ |
| 命名 | 使用下划线分隔 | wms_receipt |
| 关联表 | 主表名_子表名 | wms_receipt_line |
| 配置表 | 主表名_config | wms_receiving_config |

### 2.2 字段命名规范

| 规则 | 说明 | 示例 |
|-----|------|------|
| 主键 | id | id |
| 外键 | 关联表名_id | receipt_id |
| 状态 | status | status |
| 类型 | xxx_type | receipt_type |
| 编码 | xxx_code 或 xxx_no | receipt_no |
| 数量 | xxx_quantity | planned_quantity |
| 时间 | xxx_at 或 xxx_time | created_at |
| 人员 | xxx_by | created_by |
| 布尔 | is_xxx 或 require_xxx | is_deleted, require_qc |

### 2.3 通用字段

每个表必须包含以下通用字段：

```sql
-- 主键
id              VARCHAR(36)     NOT NULL    COMMENT '主键ID',

-- 审计字段
created_at      DATETIME        NOT NULL    COMMENT '创建时间',
created_by      VARCHAR(36)                 COMMENT '创建人ID',
updated_at      DATETIME        NOT NULL    COMMENT '更新时间',
updated_by      VARCHAR(36)                 COMMENT '更新人ID',

-- 软删除
is_deleted      TINYINT         DEFAULT 0   COMMENT '是否删除: 0-否, 1-是',

-- 乐观锁
version         INT             DEFAULT 0   COMMENT '版本号',
```

### 2.4 扩展字段

为业务扩展预留字段：

```sql
-- 扩展字段（根据需要选择）
ext1            VARCHAR(255)                COMMENT '扩展字段1',
ext2            VARCHAR(255)                COMMENT '扩展字段2',
ext3            VARCHAR(255)                COMMENT '扩展字段3',
ext4            VARCHAR(255)                COMMENT '扩展字段4',
ext5            VARCHAR(255)                COMMENT '扩展字段5',
ext6            VARCHAR(255)                COMMENT '扩展字段6',
ext7            VARCHAR(255)                COMMENT '扩展字段7',
ext8            VARCHAR(255)                COMMENT '扩展字段8',
ext9            VARCHAR(255)                COMMENT '扩展字段9',
ext10           VARCHAR(255)                COMMENT '扩展字段10',
```

### 2.5 表结构模板

```markdown
### 2.X {表名}（{表说明}）

**对应聚合**：{聚合名}
**对应实体**：{实体名}

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| id | VARCHAR(36) | ✅ | - | 主键ID |
| xxx_no | VARCHAR(32) | ✅ | - | 编号 |
| status | VARCHAR(16) | ✅ | - | 状态 |
| ... | ... | ... | ... | ... |
| created_at | DATETIME | ✅ | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ✅ | CURRENT_TIMESTAMP | 更新时间 |

**状态枚举**：
- DRAFT: 草稿
- CONFIRMED: 已确认
- COMPLETED: 已完成
- CANCELLED: 已取消
```

---

## 3. 索引设计

### 3.1 索引命名规范

| 类型 | 命名格式 | 示例 |
|-----|---------|------|
| 主键 | pk_{表名} | pk_wms_receipt |
| 唯一索引 | uk_{表名}_{字段} | uk_wms_receipt_receipt_no |
| 普通索引 | idx_{表名}_{字段} | idx_wms_receipt_status |
| 组合索引 | idx_{表名}_{字段1}_{字段2} | idx_wms_receipt_warehouse_status |

### 3.2 索引设计原则

1. **主键索引**：每个表必须有主键
2. **唯一索引**：业务编号字段建立唯一索引
3. **外键索引**：外键字段建立索引
4. **查询索引**：高频查询条件建立索引
5. **组合索引**：遵循最左前缀原则

### 3.3 索引模板

```markdown
### 3.X {表名} 索引

| 索引名 | 类型 | 字段 | 说明 |
|-------|------|------|------|
| pk_wms_receipt | PRIMARY | id | 主键 |
| uk_wms_receipt_receipt_no | UNIQUE | receipt_no | 收货单号唯一 |
| idx_wms_receipt_status | INDEX | status | 状态查询 |
| idx_wms_receipt_warehouse_date | INDEX | warehouse_id, created_at | 仓库+日期查询 |
```

---

## 4. 约束设计

### 4.1 约束类型

| 类型 | 说明 | 示例 |
|-----|------|------|
| PRIMARY KEY | 主键约束 | id |
| UNIQUE | 唯一约束 | receipt_no |
| NOT NULL | 非空约束 | status |
| DEFAULT | 默认值约束 | is_deleted DEFAULT 0 |
| CHECK | 检查约束 | quantity >= 0 |
| FOREIGN KEY | 外键约束（可选） | receipt_id |

### 4.2 外键策略

| 策略 | 说明 | 适用场景 |
|-----|------|---------|
| 逻辑外键 | 不建立物理外键，应用层保证 | 推荐，便于分库分表 |
| 物理外键 | 建立 FOREIGN KEY 约束 | 数据一致性要求高 |

---

## 5. Entity-PO 映射

### 5.1 映射规则

| 领域对象 | 数据库对象 | 说明 |
|---------|----------|------|
| 聚合根 | 主表 | 一对一映射 |
| 实体 | 子表 | 通过外键关联 |
| 值对象 | 字段/嵌入 | 展开为多个字段 |
| 枚举 | VARCHAR | 存储枚举名称 |
| ID类型 | VARCHAR(36) | UUID 字符串 |

### 5.2 映射模板

```markdown
### 5.X {聚合名} 映射

| 领域对象 | 属性 | PO 类 | 字段 | 说明 |
|---------|------|-------|------|------|
| Receipt | id | ReceiptPO | id | 主键 |
| Receipt | receiptNo | ReceiptPO | receipt_no | 单号 |
| Receipt | status | ReceiptPO | status | 状态枚举 |
| Receipt.lines | - | ReceiptLinePO | - | 一对多关联 |
| ReceiptLine | quantity | ReceiptLinePO | planned_quantity | 值对象展开 |
```

---

## 6. 数据字典

### 6.1 枚举值定义

```markdown
### 6.X {枚举名}

| 值 | 说明 | 备注 |
|---|------|------|
| DRAFT | 草稿 | 初始状态 |
| CONFIRMED | 已确认 | 确认后 |
| COMPLETED | 已完成 | 完成后 |
| CANCELLED | 已取消 | 取消后 |
```

### 6.2 状态流转

```markdown
### 状态流转图

```
DRAFT → CONFIRMED → COMPLETED
  ↓         ↓
CANCELLED
```
```

---

## 7. 迁移脚本

### 7.1 脚本命名规范

```
V{版本号}__{描述}.sql

示例：
V1__create_receipt_tables.sql
V2__create_task_tables.sql
V3__add_receipt_ext_fields.sql
```

### 7.2 脚本模板

```sql
-- V1__create_receipt_tables.sql
-- 创建收货单相关表

-- 收货单主表
CREATE TABLE IF NOT EXISTS wms_receipt (
    id              VARCHAR(36)     NOT NULL    COMMENT '主键ID',
    receipt_no      VARCHAR(32)     NOT NULL    COMMENT '收货单号',
    -- ... 其他字段
    PRIMARY KEY (id),
    UNIQUE KEY uk_wms_receipt_receipt_no (receipt_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货单主表';

-- 收货单明细表
CREATE TABLE IF NOT EXISTS wms_receipt_line (
    -- ... 字段定义
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货单明细表';
```

---

## 检查清单

### 表结构
- [ ] 表名符合命名规范
- [ ] 字段名符合命名规范
- [ ] 包含通用审计字段
- [ ] 包含扩展字段（如需要）
- [ ] 字段类型合理
- [ ] 字段注释完整

### 索引
- [ ] 主键索引
- [ ] 唯一索引（业务编号）
- [ ] 外键索引
- [ ] 查询索引
- [ ] 索引命名规范

### 映射
- [ ] Entity-PO 映射清晰
- [ ] 值对象展开正确
- [ ] 枚举存储方式明确

### 迁移脚本
- [ ] 脚本命名规范
- [ ] 脚本可重复执行
- [ ] 包含回滚方案

---

## 下一步

完成 `database-design.md` 后，进入测试设计阶段，编写测试用例文档。

