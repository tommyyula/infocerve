---
inclusion: manual
---

# 数据库设计规范（Database Design Guidelines）

## 概述

本规范定义了数据库设计文档的编写标准。

---

## 文件位置

```
.kiro/specs/{feature-name}/database-design.md
```

---

## 创建时机

数据库设计应在技术设计完成后创建：

```
design.md - database-design.md - e2e-test-cases.md
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

## 1. 设计概述

描述数据库设计的范围和原则：
- 设计范围（主表、关联表、配置表）
- 设计原则

设计原则：
1. 领域驱动 - 表结构基于领域模型设计
2. 聚合边界 - 一个聚合对应一组表
3. 扩展性 - 预留扩展字段（ext1~ext10）
4. 审计追踪 - 包含创建/更新时间和操作人
5. 软删除 - 使用 deleted 标记而非物理删除

---

## 2. 表结构设计

### 表命名规范

- 前缀 - 使用系统前缀（如 wms_）
- 命名 - 使用下划线分隔
- 关联表 - 主表名_子表名
- 配置表 - 主表名_config

### 字段命名规范

- 主键 - id
- 外键 - 关联表名_id
- 状态 - status
- 类型 - xxx_type
- 编码 - xxx_code 或 xxx_no
- 数量 - xxx_quantity
- 时间 - xxx_at 或 xxx_time
- 人员 - xxx_by
- 布尔 - is_xxx 或 require_xxx

### 通用字段

每个表必须包含：

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

### 扩展字段

```sql
ext1 ~ ext10    VARCHAR(255)                COMMENT '扩展字段',
```

---

## 3. 索引设计

### 索引命名规范

- 主键 - pk_{表名}
- 唯一索引 - uk_{表名}_{字段}
- 普通索引 - idx_{表名}_{字段}
- 组合索引 - idx_{表名}_{字段1}_{字段2}

### 索引设计原则

1. 主键索引 - 每个表必须有主键
2. 唯一索引 - 业务编号字段建立唯一索引
3. 外键索引 - 外键字段建立索引
4. 查询索引 - 高频查询条件建立索引
5. 组合索引 - 遵循最左前缀原则

---

## 4. 约束设计

### 约束类型

- PRIMARY KEY - 主键约束
- UNIQUE - 唯一约束
- NOT NULL - 非空约束
- DEFAULT - 默认值约束
- CHECK - 检查约束
- FOREIGN KEY - 外键约束（可选）

### 外键策略

- 逻辑外键 - 不建立物理外键，应用层保证（推荐）
- 物理外键 - 建立 FOREIGN KEY 约束

---

## 5. Entity-PO 映射

### 映射规则

- 聚合根 - 主表（一对一映射）
- 实体 - 子表（通过外键关联）
- 值对象 - 字段/嵌入（展开为多个字段）
- 枚举 - VARCHAR（存储枚举名称）
- ID类型 - VARCHAR(36)（UUID 字符串）

---

## 6. 数据字典

### 枚举值定义

描述枚举值：
- 值
- 说明
- 备注

### 状态流转

描述状态流转图。

---

## 7. 迁移脚本

### 脚本命名规范

```
V{版本号}__{描述}.sql

示例：
V1__create_receipt_tables.sql
V2__create_task_tables.sql
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
- [ ] 包含回滚方案

---

## 下一步

完成 database-design.md 后，进入测试设计阶段，编写测试用例文档。

---

最后更新：2026-01-03
