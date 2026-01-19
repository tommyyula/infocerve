# 库存台账 FSD

## 1. 功能概述

### 1.1 功能目标

提供库存数据的查询、展示和管理功能，支持多条件筛选、商品汇总视图和库存明细视图，是库存管理的核心模块。

### 1.2 关联用户故事

- US-INV-003：查询库存列表
- US-INV-008：库存统计查询
- US-INV-010：库存数据导出

### 1.3 关联需求项

- FR-INV-003：查询库存列表
- FR-INV-008：库存统计查询
- FR-INV-010：库存数据导出

---

## 2. 用户场景

### 场景 1：按条件查询库存

角色：仓库管理员
前置条件：用户已登录，有库存查询权限
操作流程：
1. 用户进入库存台账页面
2. 系统显示查询表单和空的结果列表
3. 用户输入查询条件（Customer、Item、LP、Location 等）
4. 用户点击"查询"按钮
5. 系统调用 API 查询库存数据
6. 系统显示查询结果列表

预期结果：显示符合条件的库存记录

### 场景 2：切换库存视图

角色：仓库管理员
前置条件：已查询到库存数据
操作流程：
1. 用户点击"商品汇总"或"库存列表"标签
2. 系统切换显示对应视图
3. 商品汇总视图按 Item 聚合显示
4. 库存列表视图显示明细记录

预期结果：视图正确切换，数据正确显示

### 场景 3：查看库存详情

角色：仓库管理员
前置条件：库存列表中有数据
操作流程：
1. 用户点击某条库存记录的"详情"链接
2. 系统弹出详情弹窗
3. 弹窗显示库存的完整信息

预期结果：详情弹窗正确显示所有字段

### 场景 4：导出库存数据

角色：仓库管理员
前置条件：已设置查询条件
操作流程：
1. 用户点击"导出数据"按钮
2. 系统按当前查询条件导出数据
3. 浏览器下载 Excel 文件

预期结果：成功下载包含查询结果的 Excel 文件

---

## 3. 界面说明

### 3.1 页面布局

对应 Demo：05-demo/index.html#inventory

页面分为三个区域：
- 查询区域：顶部卡片，包含查询表单和操作按钮
- 视图切换：中部标签栏，切换商品汇总/库存列表
- 结果区域：底部卡片，显示查询结果表格

### 3.2 页面区域

区域 A：查询表单
- 位置：页面顶部卡片
- 功能：输入查询条件
- 包含元素：
  - 第一行：Customer（下拉）、Title（下拉）、Item（输入）、Inventory Status（下拉）
  - 第二行：LP（输入）、Original LP（输入）、Location（输入）、Lot No（输入）
  - 第三行：Goods Type（下拉）、Inventory Channel（下拉）、Order#（输入）、Receipt（输入）
  - 第四行：Receipt Task（输入）、Putaway Task（输入）、Trailer Nos（输入）、Container Nos（输入）
  - 按钮组：查询、重置、批量导入、导出数据

区域 B：视图切换标签
- 位置：结果卡片顶部
- 功能：切换商品汇总/库存列表视图
- 包含元素：商品汇总按钮、库存列表按钮

区域 C：商品汇总表格
- 位置：结果卡片内容区
- 功能：按商品聚合显示库存
- 包含列：Item、Description、Status、Item Status、Type、Total Qty、Total Base Qty

区域 D：库存列表表格
- 位置：结果卡片内容区
- 功能：显示库存明细
- 包含列：Id、Customer、Title、Item、Description、Qty、Base Qty、Status、Type、Lot#、LP、Location、Receipt、Order、Receive Task、PutAway Task、Adjustment Id、Original LP、差异标记、Received Time、Shipped Time、Created Time、操作

区域 E：分页控件
- 位置：表格底部
- 功能：分页导航
- 包含元素：总条数、每页条数选择、页码按钮

---

## 4. 交互逻辑

### 4.1 页面加载

触发时机：页面首次加载
处理逻辑：
1. 初始化查询表单，所有字段为空
2. 不自动查询，等待用户操作
3. 显示空的结果区域

### 4.2 查询库存

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/inventory/page
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示
6. 更新分页信息

### 4.3 重置查询

触发时机：用户点击"重置"按钮
处理逻辑：
1. 清空所有查询条件
2. 清空结果列表
3. 重置分页到第一页

### 4.4 切换视图

触发时机：用户点击"商品汇总"或"库存列表"标签
处理逻辑：
1. 切换标签激活状态
2. 显示对应的表格视图
3. 如果是商品汇总，调用统计 API 获取汇总数据
4. 如果是库存列表，显示明细数据

### 4.5 查看详情

触发时机：用户点击"详情"链接
处理逻辑：
1. 获取当前行的库存 ID
2. 调用 API：GET /api/inventory/{id}（可选，如果列表数据不完整）
3. 弹出详情弹窗
4. 渲染库存完整信息

### 4.6 导出数据

触发时机：用户点击"导出数据"按钮
处理逻辑：
1. 收集当前查询条件
2. 调用 API：GET /api/inventory/export
3. 显示导出中提示
4. 成功后触发文件下载
5. 失败后显示错误提示

### 4.7 分页切换

触发时机：用户点击页码或切换每页条数
处理逻辑：
1. 更新分页参数
2. 使用当前查询条件重新查询
3. 渲染新的结果

### 4.8 跳转批量导入

触发时机：用户点击"批量导入"按钮
处理逻辑：
1. 跳转到库存导入页面

---

## 5. 数据字段

### 5.1 查询表单字段

字段名：Customer
- 字段标识：customerId
- 控件类型：select（可搜索）
- 数据类型：string
- 是否必填：否
- 占位符：搜索组织
- 数据来源：客户列表 API

字段名：Title
- 字段标识：titleId
- 控件类型：select（可搜索）
- 数据类型：string
- 是否必填：否
- 占位符：搜索组织
- 数据来源：货权列表 API

字段名：Item
- 字段标识：itemId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：itemId

字段名：Inventory Status
- 字段标识：status
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：见 5.3 枚举定义

字段名：LP
- 字段标识：lpId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：lpId

字段名：Original LP
- 字段标识：originalLpId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：originalLpId

字段名：Location
- 字段标识：locationId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：locationId

字段名：Lot No
- 字段标识：lotNo
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：lotNo

字段名：Goods Type
- 字段标识：type
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：GOOD、DAMAGE、RETURN

字段名：Inventory Channel
- 字段标识：channel
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：RECEIVE、MOVE、PICK、PACK、SHIP

字段名：Order#
- 字段标识：orderId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：orderId

字段名：Receipt
- 字段标识：receiptId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：receiptId

字段名：Receipt Task
- 字段标识：receiveTaskId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：receiptTaskId

字段名：Putaway Task
- 字段标识：putAwayTaskId
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：putawayTaskId

字段名：Trailer Nos
- 字段标识：trailerNos
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：trailerNos

字段名：Container Nos
- 字段标识：containerNos
- 控件类型：input
- 数据类型：string
- 是否必填：否
- 占位符：containerNos

### 5.2 列表字段

字段名：Id
- 字段标识：id
- 数据类型：number
- 显示格式：原样显示

字段名：Customer
- 字段标识：customerId
- 数据类型：string
- 显示格式：原样显示

字段名：Title
- 字段标识：titleId
- 数据类型：string
- 显示格式：原样显示

字段名：Item
- 字段标识：itemId
- 数据类型：string
- 显示格式：原样显示

字段名：Description
- 字段标识：itemDescription
- 数据类型：string
- 显示格式：原样显示
- 备注：来自商品主数据

字段名：Qty
- 字段标识：qty
- 数据类型：number
- 显示格式：{qty} {uom}

字段名：Base Qty
- 字段标识：baseQty
- 数据类型：number
- 显示格式：{baseQty} {baseUom}

字段名：Status
- 字段标识：status
- 数据类型：enum
- 显示格式：Tag 标签，不同状态不同颜色

字段名：Type
- 字段标识：type
- 数据类型：string
- 显示格式：原样显示

字段名：Lot#
- 字段标识：lotNo
- 数据类型：string
- 显示格式：原样显示

字段名：LP
- 字段标识：lpId
- 数据类型：string
- 显示格式：原样显示

字段名：Location
- 字段标识：locationId
- 数据类型：string
- 显示格式：原样显示

字段名：Receipt
- 字段标识：receiptId
- 数据类型：string
- 显示格式：原样显示

字段名：Order
- 字段标识：orderId
- 数据类型：string
- 显示格式：原样显示

字段名：Receive Task
- 字段标识：receiveTaskId
- 数据类型：string
- 显示格式：原样显示

字段名：PutAway Task
- 字段标识：putAwayTaskId
- 数据类型：string
- 显示格式：原样显示

字段名：Adjustment Id
- 字段标识：adjustmentId
- 数据类型：string
- 显示格式：原样显示

字段名：Original LP
- 字段标识：originalLPId
- 数据类型：string
- 显示格式：原样显示

字段名：差异标记
- 字段标识：discrepancyFlag
- 数据类型：enum
- 显示格式：Tag 标签
- 枚举值：DISCREPANCY（红色）、WARNING（蓝色）、空（显示 -）

字段名：Received Time
- 字段标识：receivedTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm

字段名：Shipped Time
- 字段标识：shippedTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm

字段名：Created Time
- 字段标识：createdTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm

### 5.3 枚举定义

枚举名：InventoryStatus
- OPEN：可用
- DAMAGE：损坏
- ONHOLD：冻结
- ADJUSTOUT：已调出
- RECEIVING：收货中
- PICKED：已拣货
- PACKED：已打包
- LOADED：已装车
- SHIPPED：已发货
- RESTOCKED：已回库

枚举名：DiscrepancyFlag
- DISCREPANCY：差异
- WARNING：警告

---

## 6. 业务规则

### 6.1 查询规则

BR-INV-001：默认排除零库存
- 触发条件：查询库存列表
- 处理逻辑：默认排除 qty <= 0 的记录
- 影响范围：查询结果

BR-INV-002：默认排除已调出库存
- 触发条件：查询库存列表
- 处理逻辑：默认排除 status = ADJUSTOUT 的记录
- 影响范围：查询结果

### 6.2 显示规则

BR-INV-003：状态标签颜色
- 触发条件：渲染状态字段
- 处理逻辑：
  - OPEN：绿色（tag-success）
  - PICKED/PACKED/LOADED：黄色（tag-warning）
  - SHIPPED/ADJUSTOUT：红色（tag-danger）
  - 其他：蓝色（tag-info）
- 影响范围：Status 列

---

## 7. 异常处理

### 7.1 查询失败

错误场景：API 返回错误
错误提示：查询失败，请稍后重试
处理方式：显示错误提示，保持当前页面状态

### 7.2 导出失败

错误场景：导出数据量过大或网络超时
错误提示：导出失败，数据量过大请缩小查询范围
处理方式：显示错误提示，建议用户添加筛选条件

### 7.3 网络异常

错误场景：网络请求超时/断网
错误提示：网络异常，请检查网络连接
处理方式：显示错误提示，提供重试按钮

---

## 8. 依赖说明

### 8.1 API 接口

接口：分页查询库存
- 路径：GET /api/inventory/page
- 详细设计：07-design.md#2.1
- 用途：查询库存列表
- 调用时机：点击查询按钮、切换分页

接口：导出库存
- 路径：GET /api/inventory/export
- 详细设计：07-design.md#2.1
- 用途：导出库存数据
- 调用时机：点击导出按钮
- 成功后处理：触发文件下载
- 失败后处理：显示错误提示

### 8.2 组件依赖

- SearchableSelect：可搜索下拉组件（Customer、Title）
- DataTable：数据表格组件
- Pagination：分页组件
- Modal：弹窗组件
- Tag：标签组件

### 8.3 权限要求

- inventory:read：查询库存
- inventory:export：导出库存

---

## 9. 国际化（i18n）

### 9.1 静态文案

页面标题：
- key：inventory.title
- 中文：库存台账
- 英文：Inventory

按钮文案：
- key：common.query
- 中文：查询
- 英文：Search

- key：common.reset
- 中文：重置
- 英文：Reset

- key：inventory.import
- 中文：批量导入
- 英文：Batch Import

- key：common.export
- 中文：导出数据
- 英文：Export

标签文案：
- key：inventory.summary
- 中文：商品汇总
- 英文：Item Summary

- key：inventory.list
- 中文：库存列表
- 英文：Inventory List

### 9.2 枚举值翻译

枚举名：InventoryStatus
- OPEN：中文=可用 / 英文=Open
- PICKED：中文=已拣货 / 英文=Picked
- PACKED：中文=已打包 / 英文=Packed
- SHIPPED：中文=已发货 / 英文=Shipped

---

## 10. 数据模型引用

### 10.1 涉及的聚合/实体

聚合根：Inventory
- 详细定义：04-domain-model.md#2.1
- 本模块使用的属性：id、customerId、titleId、itemId、qty、uomId、baseQty、status、type、lotNo、lpId、locationId、discrepancyFlag、receivedTime、shippedTime、createdTime

### 10.2 涉及的值对象

值对象：Quantity
- 详细定义：04-domain-model.md#2.1
- 用途：表示库存数量

值对象：DynamicProperties
- 详细定义：04-domain-model.md#2.1
- 用途：动态属性字段

---

## 11. API 接口引用

### 11.1 查询接口

接口：分页查询库存
- 路径：GET /api/inventory/page
- 详细设计：07-design.md#2.1
- 用途：获取库存列表数据
- 调用时机：页面查询、分页切换

接口：库存统计
- 路径：GET /api/inventory/statistics/quantity
- 详细设计：07-design.md#2.1
- 用途：获取商品汇总数据
- 调用时机：切换到商品汇总视图

### 11.2 命令接口

接口：导出库存
- 路径：GET /api/inventory/export
- 详细设计：07-design.md#2.1
- 用途：导出库存数据
- 调用时机：点击导出按钮
- 成功后处理：触发文件下载
- 失败后处理：显示错误提示

---

## 12. 验收标准引用

### 12.1 关联的验收标准

来源：03-requirements.md

AC-001（FR-INV-003）：按单个条件查询返回正确结果
- 对应交互：本文档 4.2 查询库存
- 验证方式：输入单个条件查询，验证结果正确

AC-002（FR-INV-003）：按多个条件组合查询返回正确结果
- 对应交互：本文档 4.2 查询库存
- 验证方式：输入多个条件查询，验证结果正确

AC-003（FR-INV-003）：默认不返回 qty <= 0 的记录
- 对应交互：本文档 4.2 查询库存
- 验证方式：查询结果中不包含零库存记录

AC-004（FR-INV-003）：默认不返回 ADJUSTOUT 状态的记录
- 对应交互：本文档 4.2 查询库存
- 验证方式：查询结果中不包含已调出记录

AC-005（FR-INV-003）：分页参数正确生效
- 对应交互：本文档 4.7 分页切换
- 验证方式：切换分页，验证数据正确加载

### 12.2 前端特有验收标准

AC-FE-001：视图切换正确
- 验证方式：点击标签切换，验证视图正确显示

AC-FE-002：详情弹窗显示完整
- 验证方式：点击详情，验证弹窗显示所有字段

AC-FE-003：状态标签颜色正确
- 验证方式：验证不同状态显示不同颜色标签
