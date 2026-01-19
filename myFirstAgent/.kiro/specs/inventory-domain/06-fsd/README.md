# 库存领域 FSD 文档索引

## 概述

本目录包含库存领域的前端规格文档（FSD - Frontend Specification Document），面向前端开发，按功能模块拆分。每个 FSD 文档综合了用户故事、需求规格、Demo 原型和领域模型，提供完整的前端开发指导。

## 模块列表

1. [库存台账](./inventory.md) - 库存查询、列表展示、商品汇总、详情查看
2. [库存导入](./inventory-import.md) - 批量导入库存数据、模板下载、字段映射
3. [LP 容器管理](./lp.md) - LP 创建、查询、更新、删除、移动
4. [调整单管理](./adjustment.md) - 调整单创建、审批、查询、调整行管理
5. [库存锁定](./inventory-lock.md) - 库存锁定查询、释放、导出
6. [库存活动与日志](./activity-log.md) - 库存活动记录、库存日志查询
7. [动态属性配置](./config.md) - 动态属性映射、自定义字段配置

## 关联文档

- 用户故事：[01-story.md](../01-story.md)
- 领域分析：[02-domain-analysis.md](../02-domain-analysis.md)
- 需求规格：[03-requirements.md](../03-requirements.md)
- 领域建模：[04-domain-model.md](../04-domain-model.md)
- 前端原型：[05-demo/index.html](../05-demo/index.html)
- 技术设计：[07-design.md](../07-design.md)

## 模块依赖关系

```
config（配置）
    |
    v
lp（LP容器） <---> inventory（库存台账）
    |                   |
    v                   v
adjustment（调整单） <--+
    |
    v
inventory-lock（库存锁定）
    |
    v
activity-log（活动日志）
```

## 开发顺序建议

1. config - 基础配置模块，无依赖
2. lp - LP 容器管理，依赖 config
3. inventory - 库存台账，依赖 lp、config
4. inventory-import - 库存导入，依赖 inventory
5. adjustment - 调整单管理，依赖 inventory、lp
6. inventory-lock - 库存锁定，依赖 inventory
7. activity-log - 活动日志，依赖 inventory

## 通用说明

### 多租户

所有模块都需要支持多租户隔离，租户信息从登录上下文获取。

### 权限控制

- 库存管理员：全部功能
- 库存操作员：查询、创建、移动
- 库存查看者：仅查询

### 国际化

系统支持中英文切换，所有文案需要支持 i18n。
