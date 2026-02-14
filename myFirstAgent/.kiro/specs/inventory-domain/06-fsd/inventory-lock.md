# 库存锁定 FSD

## 1. 功能概述

### 1.1 功能目标

提供库存锁定记录的查询、释放和导出功能，支持按订单预留库存，是订单履约的关键模块。

### 1.2 关联用户故事

- US-LOCK-001：创建库存锁定
- US-LOCK-002：查询库存锁定
- US-LOCK-003：释放库存锁定
- US-LOCK-004：库存锁定数据导出

### 1.3 关联需求项

- FR-LOCK-001：创建库存锁定
- FR-LOCK-002：查询库存锁定
- FR-LOCK-003：释放库存锁定
- FR-LOCK-004：库存锁定数据导出

---

## 2. 用户场景

### 场景 1：查询库存锁定

角色：仓库管理员
前置条件：用户已登录，有库存锁定查询权限
操作流程：
1. 用户进入库存锁定页面
2. 用户输入查询条件（客户、商品、订单号、状态等）
3. 用户点击"查询"按钮
4. 系统调用 API 查询库存锁定数据
5. 系统显示查询结果列表

预期结果：显示符合条件的库存锁定记录

### 场景 2：查看锁定详情

角色：仓库管理员
前置条件：库存锁定列表中有数据
操作流程：
1. 用户点击某条锁定记录的商品链接
2. 系统弹出详情弹窗
3. 弹窗显示锁定的完整信息

预期结果：详情弹窗正确显示所有字段

### 场景 3：释放库存锁定

角色：订单系统/仓库管理员
前置条件：锁定记录存在且状态为 ACTIVE
操作流程：
1. 用户在锁定列表中找到需要释放的记录
2. 用户点击"释放"按钮
3. 系统弹出确认对话框
4. 用户确认释放
5. 系统调用 API 释放锁定
6. 系统显示释放成功提示

预期结果：锁定状态变为 INACTIVE

### 场景 4：导出锁定数据

角色：仓库管理员
前置条件：用户已登录，有导出权限
操作流程：
1. 用户设置查询条件
2. 用户点击"导出"按钮
3. 系统按当前查询条件导出数据
4. 浏览器下载 Excel 文件

预期结果：成功下载包含查询结果的 Excel 文件

---

## 3. 界面说明

### 3.1 页面布局

对应 Demo：05-demo/index.html#inventory-lock

页面分为两个区域：
- 查询区域：顶部卡片，包含查询表单和操作按钮
- 结果区域：底部卡片，显示锁定列表表格

### 3.2 页面区域

区域 A：查询表单
- 位置：页面顶部卡片
- 功能：输入查询条件
- 包含元素：
  - 第一行：Customer（下拉）、Item（下拉）、Order ID（输入）、Status（下拉）
  - 第二行：Lot No（输入）
  - 按钮组：查询、重置、导出

区域 B：锁定列表表格
- 位置：结果卡片内容区
- 功能：显示锁定列表
- 包含列：Item、Description、Qty、Order#、Order Status、Customer、Title、Status、Lot No

---

## 4. 交互逻辑

### 4.1 页面加载

触发时机：页面首次加载
处理逻辑：
1. 初始化查询表单，所有字段为空
2. 不自动查询，等待用户操作
3. 显示空的结果区域

### 4.2 查询锁定

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/inventory-lock/page
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示

### 4.3 释放锁定

触发时机：用户点击"释放"按钮
处理逻辑：
1. 弹出确认对话框
2. 用户确认后调用 API：PUT /api/inventory-lock/{id}/deactivate
3. 成功后刷新列表
4. 失败后显示错误提示

### 4.4 导出数据

触发时机：用户点击"导出"按钮
处理逻辑：
1. 收集当前查询条件
2. 调用 API：GET /api/inventory-lock/export
3. 显示导出中提示
4. 成功后触发文件下载
5. 失败后显示错误提示

---

## 5. 数据字段

### 5.1 查询表单字段

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

字段名：Order ID
- 字段标识：orderId
- 控件类型：input
- 数据类型：string
- 是否必填：否

字段名：Status
- 字段标识：status
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：ACTIVE、INACTIVE

### 5.2 列表字段

字段名：Item
- 字段标识：itemId
- 数据类型：string
- 显示格式：链接样式，可点击查看详情

字段名：Qty
- 字段标识：qty
- 数据类型：number
- 显示格式：{qty} {uom}

字段名：Status
- 字段标识：status
- 数据类型：enum
- 显示格式：Tag 标签，不同状态不同颜色

### 5.3 枚举定义

枚举名：InventoryLockStatus
- ACTIVE：有效
- INACTIVE：已释放

---

## 6. 业务规则

### 6.1 查询规则

BR-LOCK-001：默认查询有效锁定
- 触发条件：查询库存锁定
- 处理逻辑：默认 status = ACTIVE
- 影响范围：查询结果

### 6.2 释放规则

BR-LOCK-002：只能释放有效锁定
- 触发条件：释放库存锁定
- 处理逻辑：只有 ACTIVE 状态的锁定才能释放
- 影响范围：释放按钮状态

### 6.3 显示规则

BR-LOCK-003：状态标签颜色
- 触发条件：渲染状态字段
- 处理逻辑：
  - ACTIVE：绿色（tag-success）
  - INACTIVE：红色（tag-danger）
- 影响范围：Status 列

---

## 7. 异常处理

### 7.1 查询失败

错误场景：API 返回错误
错误提示：查询失败，请稍后重试
处理方式：显示错误提示，保持当前页面状态

### 7.2 释放失败

错误场景：锁定释放失败
错误提示：释放失败，请检查锁定状态
处理方式：显示错误提示

---

## 8. 依赖说明

### 8.1 API 接口

接口：分页查询库存锁定
- 路径：GET /api/inventory-lock/page
- 详细设计：07-design.md#2.4
- 用途：查询库存锁定列表

接口：释放锁定
- 路径：PUT /api/inventory-lock/{id}/deactivate
- 详细设计：07-design.md#2.4
- 用途：释放库存锁定

接口：导出锁定数据
- 路径：GET /api/inventory-lock/export
- 详细设计：07-design.md#2.4
- 用途：导出库存锁定数据

### 8.2 权限要求

- inventory-lock:read：查询库存锁定
- inventory-lock:release：释放库存锁定
- inventory-lock:export：导出库存锁定

---

## 9. 国际化（i18n）

### 9.1 静态文案

页面标题：
- key：inventoryLock.title
- 中文：库存锁定
- 英文：Inventory Lock

按钮文案：
- key：inventoryLock.release
- 中文：释放
- 英文：Release

### 9.2 枚举值翻译

枚举名：InventoryLockStatus
- ACTIVE：中文=有效 / 英文=Active
- INACTIVE：中文=已释放 / 英文=Inactive

---

## 10. 数据模型引用

### 10.1 涉及的聚合/实体

聚合根：InventoryLock
- 详细定义：04-domain-model.md#4.1
- 本模块使用的属性：id、orderId、orderItemLineId、itemId、uomId、qty、baseQty、titleId、customerId、lotNo、goodsType、status

---

## 11. API 接口引用

### 11.1 查询接口

接口：分页查询库存锁定
- 路径：GET /api/inventory-lock/page
- 详细设计：07-design.md#2.4
- 用途：获取库存锁定列表数据

### 11.2 命令接口

接口：释放锁定
- 路径：PUT /api/inventory-lock/{id}/deactivate
- 详细设计：07-design.md#2.4
- 用途：释放库存锁定

---

## 12. 验收标准引用

### 12.1 关联的验收标准

来源：03-requirements.md

AC-001（FR-LOCK-002）：按条件查询成功
- 对应交互：本文档 4.2 查询锁定
- 验证方式：输入条件查询，验证结果正确

AC-002（FR-LOCK-003）：释放锁定成功，状态变为 INACTIVE
- 对应交互：本文档 4.3 释放锁定
- 验证方式：释放锁定，验证状态变为 INACTIVE

### 12.2 前端特有验收标准

AC-FE-001：状态标签颜色正确
- 验证方式：验证 ACTIVE 显示绿色，INACTIVE 显示红色

AC-FE-002：商品链接可点击查看详情
- 验证方式：点击商品链接，验证详情弹窗显示
