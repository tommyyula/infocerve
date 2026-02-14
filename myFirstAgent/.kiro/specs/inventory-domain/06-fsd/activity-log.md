# 库存活动与日志 FSD

## 1. 功能概述

### 1.1 功能目标

提供库存活动记录和库存日志的查询功能，支持追踪库存的业务操作历史和数据变更历史，是库存审计和问题排查的重要模块。

### 1.2 关联用户故事

- US-LOG-001：库存日志记录
- US-LOG-002：库存活动记录

### 1.3 关联需求项

- FR-LOG-001：库存日志记录
- FR-LOG-002：库存活动记录

---

## 2. 用户场景

### 场景 1：查询库存活动

角色：仓库管理员
前置条件：用户已登录，有库存活动查询权限
操作流程：
1. 用户进入库存活动页面
2. 用户输入查询条件（活动类型、客户、商品、LP、库位等）
3. 用户点击"查询"按钮
4. 系统调用 API 查询库存活动数据
5. 系统显示查询结果列表

预期结果：显示符合条件的库存活动记录

### 场景 2：查看活动详情

角色：仓库管理员
前置条件：库存活动列表中有数据
操作流程：
1. 用户点击某条活动记录的"详情"链接
2. 系统弹出详情弹窗
3. 弹窗显示活动的完整信息

预期结果：详情弹窗正确显示所有字段

### 场景 3：查询库存日志

角色：仓库管理员
前置条件：用户已登录，有库存日志查询权限
操作流程：
1. 用户进入库存日志页面
2. 用户输入查询条件（库存ID、商品、操作类型等）
3. 用户点击"查询"按钮
4. 系统调用 API 查询库存日志数据
5. 系统显示查询结果列表

预期结果：显示符合条件的库存日志记录

### 场景 4：查看日志快照

角色：仓库管理员
前置条件：库存日志列表中有数据
操作流程：
1. 用户点击某条日志记录的"查看快照"链接
2. 系统弹出快照对比弹窗
3. 弹窗显示变更前后的数据对比

预期结果：快照弹窗正确显示变更前后数据

---

## 3. 界面说明

### 3.1 库存活动页面布局

对应 Demo：05-demo/index.html#inventory-activity

页面分为两个区域：
- 查询区域：顶部卡片，包含查询表单和操作按钮
- 结果区域：底部卡片，显示活动列表表格

### 3.2 库存活动页面区域

区域 A：查询表单
- 位置：页面顶部卡片
- 功能：输入查询条件
- 包含元素：
  - 第一行：Activity Type（下拉）、Customer（下拉）、Title（下拉）、Item（下拉）
  - 第二行：From LP（输入）、To LP（输入）、From Location（输入）、To Location（输入）
  - 第三行：Task ID（输入）、Adjustment ID（输入）、Created Time（日期范围）
  - 按钮组：查询、重置

区域 B：活动列表表格
- 位置：结果卡片内容区
- 功能：显示活动列表
- 包含列：Activity Type、Item、Qty、From LP、To LP、From Location、To Location、Task ID、Created Time、操作

---

## 4. 交互逻辑

### 4.1 页面加载

触发时机：页面首次加载
处理逻辑：
1. 初始化查询表单，所有字段为空
2. 不自动查询，等待用户操作
3. 显示空的结果区域

### 4.2 查询库存活动

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/inventory-activity
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示

### 4.3 查询库存日志

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/inventory-log
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示

### 4.4 查看日志快照

触发时机：用户点击"查看快照"链接
处理逻辑：
1. 获取当前行的日志数据
2. 解析 changeBefore 和 changeAfter JSON
3. 弹出快照对比弹窗
4. 左右对比显示变更前后数据

---

## 5. 数据字段

### 5.1 库存活动查询表单字段

字段名：Activity Type
- 字段标识：activityType
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：见 5.3 枚举定义

字段名：Customer
- 字段标识：customerId
- 控件类型：select（可搜索）
- 数据类型：string
- 是否必填：否

字段名：Item
- 字段标识：itemId
- 控件类型：select（可搜索）
- 数据类型：string
- 是否必填：否

### 5.2 库存活动列表字段

字段名：Activity Type
- 字段标识：activityType
- 数据类型：enum
- 显示格式：Tag 标签

字段名：Item
- 字段标识：itemId
- 数据类型：string
- 显示格式：原样显示

字段名：Qty
- 字段标识：qty
- 数据类型：number
- 显示格式：{qty} {uom}

字段名：Created Time
- 字段标识：createdTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm:ss

### 5.3 枚举定义

枚举名：InventoryActivityType
- RECEIVE：收货
- PUT_AWAY：上架
- PICK：拣货
- PACK：打包
- ADJUST：调整
- MOVE：移动

枚举名：InventoryActionType
- INSERT：新增
- UPDATE：更新
- DELETE：删除

---

## 6. 业务规则

### 6.1 活动记录规则

BR-LOG-001：自动记录活动
- 触发条件：库存创建、移动
- 处理逻辑：系统自动创建活动记录
- 影响范围：库存活动表

### 6.2 日志记录规则

BR-LOG-002：自动记录日志
- 触发条件：库存创建、更新、移动
- 处理逻辑：系统自动创建日志记录，包含变更前后快照
- 影响范围：库存日志表

### 6.3 显示规则

BR-LOG-003：活动类型标签颜色
- 触发条件：渲染活动类型字段
- 处理逻辑：
  - RECEIVE/PUT_AWAY：绿色（tag-success）
  - PICK/PACK：黄色（tag-warning）
  - ADJUST：蓝色（tag-info）
- 影响范围：Activity Type 列

---

## 7. 异常处理

### 7.1 查询失败

错误场景：API 返回错误
错误提示：查询失败，请稍后重试
处理方式：显示错误提示，保持当前页面状态

### 7.2 快照解析失败

错误场景：JSON 快照解析失败
错误提示：快照数据解析失败
处理方式：显示错误提示，显示原始 JSON

---

## 8. 依赖说明

### 8.1 API 接口

接口：查询库存活动
- 路径：GET /api/inventory-activity
- 详细设计：07-design.md#2.5
- 用途：查询库存活动列表

接口：查询库存日志
- 路径：GET /api/inventory-log
- 详细设计：07-design.md#2.5
- 用途：查询库存日志列表

### 8.2 权限要求

- inventory-activity:read：查询库存活动
- inventory-log:read：查询库存日志

---

## 9. 国际化（i18n）

### 9.1 静态文案

页面标题：
- key：inventoryActivity.title
- 中文：库存活动
- 英文：Inventory Activity

- key：inventoryLog.title
- 中文：库存日志
- 英文：Inventory Log

按钮文案：
- key：inventoryLog.viewSnapshot
- 中文：查看快照
- 英文：View Snapshot

### 9.2 枚举值翻译

枚举名：InventoryActivityType
- RECEIVE：中文=收货 / 英文=Receive
- PUT_AWAY：中文=上架 / 英文=Put Away
- PICK：中文=拣货 / 英文=Pick
- ADJUST：中文=调整 / 英文=Adjust

---

## 10. 数据模型引用

### 10.1 涉及的实体

实体：InventoryActivity
- 详细定义：04-domain-model.md#5.2
- 本模块使用的属性：id、activityType、fromLPId、toLPId、fromLocationId、toLocationId、itemId、qty、uomId、createdTime

实体：InventoryLog
- 详细定义：04-domain-model.md#5.1
- 本模块使用的属性：id、inventoryId、itemId、fromQty、toQty、actionType、changeBefore、changeAfter、createdTime

---

## 11. API 接口引用

### 11.1 查询接口

接口：查询库存活动
- 路径：GET /api/inventory-activity
- 详细设计：07-design.md#2.5
- 用途：获取库存活动列表数据

接口：查询库存日志
- 路径：GET /api/inventory-log
- 详细设计：07-design.md#2.5
- 用途：获取库存日志列表数据

---

## 12. 验收标准引用

### 12.1 关联的验收标准

来源：03-requirements.md

AC-001（FR-LOG-001）：创建库存时自动记录日志
- 对应交互：本文档 4.3 查询库存日志
- 验证方式：创建库存后查询日志，验证日志存在

AC-002（FR-LOG-002）：创建库存时自动记录活动
- 对应交互：本文档 4.2 查询库存活动
- 验证方式：创建库存后查询活动，验证活动存在

### 12.2 前端特有验收标准

AC-FE-001：活动类型标签颜色正确
- 验证方式：验证不同活动类型显示不同颜色标签

AC-FE-002：快照对比显示正确
- 验证方式：点击查看快照，验证左右对比显示变更前后数据
