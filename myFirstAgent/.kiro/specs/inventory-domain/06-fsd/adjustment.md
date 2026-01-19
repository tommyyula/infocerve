# 调整单管理 FSD

## 1. 功能概述

### 1.1 功能目标

提供库存调整单的创建、查询、审批和调整行管理功能，覆盖 10 种调整类型（新增库存、调整数量、状态、货权、货类、批次、到期、生产日期、LP、库位），用于库存数据修正与追溯。

### 1.2 关联用户故事

- US-ADJ-001：创建调整单
- US-ADJ-002：审批调整单
- US-ADJ-003：查询调整单
- US-ADJ-004：管理调整行

### 1.3 关联需求项

- FR-ADJ-001：创建调整单
- FR-ADJ-002：审批调整单
- FR-ADJ-003：查询调整单
- FR-ADJ-004：管理调整行

---

## 2. 用户场景

### 场景 1：创建调整单

角色：仓库管理员
前置条件：用户已登录，有调整单创建权限
操作流程：
1. 用户进入调整单页面
2. 用户点击"新建调整单"按钮
3. 系统弹出创建表单
4. 用户选择客户、输入原因和备注
5. 用户添加调整行（选择调整类型、填写调整信息）
6. 用户点击"保存"或"保存并审批"
7. 系统调用 API 创建调整单

预期结果：调整单创建成功

### 场景 2：审批调整单

角色：仓库管理员
前置条件：调整单存在且状态为 NEW
操作流程：
1. 用户在调整单列表中找到待审批的调整单
2. 用户点击"审批"按钮
3. 系统弹出确认对话框
4. 用户确认审批
5. 系统调用 API 审批调整单
6. 系统显示审批成功提示

预期结果：调整单状态变为 APPROVED，库存数据已调整

### 场景 3：查询调整单

角色：仓库管理员
前置条件：用户已登录，有调整单查询权限
操作流程：
1. 用户进入调整单页面
2. 用户输入查询条件（调整单号、客户、状态等）
3. 用户点击"查询"按钮
4. 系统调用 API 查询调整单数据
5. 系统显示查询结果列表

预期结果：显示符合条件的调整单记录

---

## 3. 界面说明

### 3.1 页面布局

对应 Demo：05-demo/index.html#adjustment

页面分为三个区域：
- 查询区域：顶部卡片，包含查询表单和操作按钮
- 操作按钮：新建调整单、批量审批
- 结果区域：底部卡片，显示调整单列表表格

新建/编辑页新增“新增调整行”区域：
- 库存查询表单（筛选库存/LP）
- 查询结果表格（勾选 + 可调整字段）
- 右侧调整类型列表（切换影响查询与调整字段）
- 明细面板（Adjustment Line，支持多类型共存）

### 3.2 页面区域

区域 A：查询表单
- 位置：页面顶部卡片
- 功能：输入查询条件
- 包含元素：
  - 第一行：Adjustment ID（输入）、Customer（下拉）、Status（下拉）、Reason（输入）
  - 第二行：Created Time（日期范围）
  - 按钮组：查询、重置、新建调整单、批量审批

区域 B：调整单列表表格
- 位置：结果卡片内容区
- 功能：显示调整单列表
- 包含列：选择框、Adjustment ID、Customer、Status、Reason、Note、Created By、Created Time、操作

---

## 4. 交互逻辑

### 4.1 页面加载

触发时机：页面首次加载
处理逻辑：
1. 初始化查询表单，所有字段为空
2. 不自动查询，等待用户操作
3. 显示空的结果区域

### 4.2 查询调整单

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/adjustment
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示

### 4.3 新建调整单

触发时机：用户点击"新建调整单"按钮
处理逻辑：
1. 弹出创建表单弹窗或跳转到创建页面
2. 用户填写基本信息（客户、原因、备注）
3. 用户添加调整行（选择调整类型 -> 查询库存 -> 勾选记录 -> 批量或逐条填写调整字段 -> 添加到明细）
4. 用户点击"保存"或"保存并审批"
5. 调用 API：POST /api/adjustment
6. 成功后关闭弹窗，刷新列表

字段提示：
- 新增库存（ADD_INVENTORY）：提供 Title / Item / Location 搜索下拉，LP 支持新建
- 调整数量（ADJUST_QTY）：仅使用 Qty Adjust To
- 调整属性（ADJUST_STATUS / ADJUST_TITLE / ADJUST_GOOD_TYPE / ADJUST_LOT_NO / ADJUST_EXPIRATION_DATE / ADJUST_MFG_DATE）使用 Adjust From/To
- 调整 LP（ADJUST_LP）：可选调整 Qty（Qty Adjust To 可选）
- 调整库位（ADJUST_LOCATION）：查询结果以 LP 为维度，展示子表库存明细

### 4.4 审批调整单

触发时机：用户点击"审批"按钮
处理逻辑：
1. 弹出确认对话框
2. 用户确认后调用 API：PUT /api/adjustment/{id}/approve
3. 成功后刷新列表
4. 失败后显示错误提示

---

## 5. 数据字段

### 5.1 查询表单字段

字段名：Adjustment ID
- 字段标识：adjustmentId
- 控件类型：input
- 数据类型：string
- 是否必填：否

字段名：Customer
- 字段标识：customerId
- 控件类型：select（可搜索）
- 数据类型：string
- 是否必填：否

字段名：Status
- 字段标识：status
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：NEW、APPROVED、DECLINED

### 5.2 列表字段

字段名：Adjustment ID
- 字段标识：id
- 数据类型：string
- 显示格式：原样显示

字段名：Status
- 字段标识：status
- 数据类型：enum
- 显示格式：Tag 标签，不同状态不同颜色

字段名：Created Time
- 字段标识：createdTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm

### 5.3 调整行字段

字段名：Type
- 字段标识：type
- 数据类型：enum
- 说明：调整类型（见 5.4 AdjustmentType）

字段名：Inventory Identifier
- 字段标识：inventoryIdentifier
- 数据类型：object
- 说明：定位库存的复合标识（inventoryId、itemId、lpId、locationId、uomId、titleId、lotNo、sn、status、qty/qty2 等）

字段名：Adjust From / Adjust To
- 字段标识：adjustFrom / adjustTo
- 数据类型：string
- 说明：属性类调整的原值/目标值（状态、货权、货类、SN、批次、日期等）

字段名：Adjust Qty / Adjust Qty2
- 字段标识：adjustQty / adjustQty2
- 数据类型：number
- 说明：调整或移动数量（双单位场景支持 qty2）

字段名：To LP ID
- 字段标识：toLpId
- 数据类型：string
- 说明：目标 LP（用于 ADJUST_LP 或部分属性调整）

### 5.4 枚举定义

枚举名：AdjustmentStatus
- NEW：待审批
- APPROVED：已审批
- DECLINED：已拒绝

枚举名：AdjustmentType
- ADD_INVENTORY：新增库存
- ADJUST_QTY：调整数量
- ADJUST_STATUS：调整状态
- ADJUST_TITLE：调整货权
- ADJUST_GOOD_TYPE：调整货类
- ADJUST_LOT_NO：调整批次号
- ADJUST_EXPIRATION_DATE：调整过期日期
- ADJUST_MFG_DATE：调整生产日期
- ADJUST_LP：调整 LP
- ADJUST_LOCATION：调整库位

---

## 6. 业务规则

### 6.1 创建规则

BR-ADJ-001：调整单 ID 格式
- 触发条件：创建调整单
- 处理逻辑：调整单 ID 格式为 ADJ-{SEQUENCE}
- 影响范围：Adjustment ID 字段

BR-ADJ-002：默认状态
- 触发条件：创建调整单
- 处理逻辑：默认状态为 NEW
- 影响范围：Status 字段

### 6.2 审批规则

BR-ADJ-003：审批前置条件
- 触发条件：审批调整单
- 处理逻辑：只有 NEW 状态的调整单才能审批
- 影响范围：审批按钮状态

BR-ADJ-004：新增库存（ADD_INVENTORY）
- 触发条件：审批调整单且类型为 ADD_INVENTORY
- 处理逻辑：按 inventoryIdentifier 创建库存；如携带 sns 列表则每个 SN 创建 qty=1 的库存记录

BR-ADJ-005：调整数量（ADJUST_QTY）
- 触发条件：审批调整单且类型为 ADJUST_QTY
- 处理逻辑：adjustQty = adjustTo - adjustFrom；正数创建库存（ADJUSTIN），负数走库存移动并标记 ADJUSTOUT
- 双单位：如提供 adjustFrom2/adjustTo2，则同步计算 adjustQty2

BR-ADJ-006：调整属性（ADJUST_STATUS / ADJUST_TITLE / ADJUST_GOOD_TYPE / ADJUST_LOT_NO / ADJUST_EXPIRATION_DATE / ADJUST_MFG_DATE）
- 触发条件：审批调整单且类型为上述之一
- 处理逻辑：以库存移动执行调整，目标字段取 adjustTo，调整数量取 adjustQty/adjustQty2

BR-ADJ-007：调整 LP（ADJUST_LP）
- 触发条件：审批调整单且类型为 ADJUST_LP
- 处理逻辑：目标 LP 不能为 SHIPPED 或 HLP；如设置 adjustQty 则按数量移动，否则直接更新 lpId

BR-ADJ-008：调整库位（ADJUST_LOCATION）
- 触发条件：审批调整单且类型为 ADJUST_LOCATION
- 处理逻辑：校验 LP 不可关联拣货位 HLP；若目标库位为 PICK 类型，LP 取库位的 HLP

BR-ADJ-009：明细支持多类型
- 触发条件：新增调整行
- 处理逻辑：明细面板可同时包含多种调整类型，切换类型仅影响查询与新增区域

BR-ADJ-010：批量输入/复制
- 触发条件：批量修改调整字段
- 处理逻辑：支持“复制首行到已选”和“批量应用到已选”

### 6.3 显示规则

BR-ADJ-005：状态标签颜色
- 触发条件：渲染状态字段
- 处理逻辑：
  - NEW：蓝色（tag-info）
  - APPROVED：绿色（tag-success）
  - DECLINED：红色（tag-danger）
- 影响范围：Status 列

---

## 7. 异常处理

### 7.1 创建失败

错误场景：调整单创建失败
错误提示：调整单创建失败，请稍后重试
处理方式：显示错误提示，保持表单状态

### 7.2 审批失败

错误场景：调整单审批失败
错误提示：调整单审批失败，请检查调整单状态
处理方式：显示错误提示

---

## 8. 依赖说明

### 8.1 API 接口

接口：查询调整单列表
- 路径：GET /api/adjustment
- 详细设计：07-design.md#2.3
- 用途：查询调整单列表

接口：创建调整单
- 路径：POST /api/adjustment
- 详细设计：07-design.md#2.3
- 用途：创建调整单

接口：审批调整单
- 路径：PUT /api/adjustment/{id}/approve
- 详细设计：07-design.md#2.3
- 用途：审批调整单

### 8.2 权限要求

- adjustment:read：查询调整单
- adjustment:create：创建调整单
- adjustment:approve：审批调整单

---

## 9. 国际化（i18n）

### 9.1 静态文案

页面标题：
- key：adjustment.title
- 中文：调整单
- 英文：Adjustment

按钮文案：
- key：adjustment.create
- 中文：新建调整单
- 英文：Create Adjustment

- key：adjustment.approve
- 中文：审批
- 英文：Approve

### 9.2 枚举值翻译

枚举名：AdjustmentStatus
- NEW：中文=待审批 / 英文=New
- APPROVED：中文=已审批 / 英文=Approved
- DECLINED：中文=已拒绝 / 英文=Declined

---

## 10. 数据模型引用

### 10.1 涉及的聚合/实体

聚合根：Adjustment
- 详细定义：04-domain-model.md#3.1
- 本模块使用的属性：id、customerId、status、reason、note、approveTime、approveBy、lines、createdTime、createdBy

实体：AdjustmentLine
- 详细定义：04-domain-model.md#3.1
- 本模块使用的属性：id、adjustmentId、type、inventoryIdentifier、adjustFrom、adjustTo、adjustQty

---

## 11. API 接口引用

### 11.1 查询接口

接口：查询调整单列表
- 路径：GET /api/adjustment
- 详细设计：07-design.md#2.3
- 用途：获取调整单列表数据

### 11.2 命令接口

接口：创建调整单
- 路径：POST /api/adjustment
- 详细设计：07-design.md#2.3
- 用途：创建调整单

接口：审批调整单
- 路径：PUT /api/adjustment/{id}/approve
- 详细设计：07-design.md#2.3
- 用途：审批调整单

---

## 12. 验收标准引用

### 12.1 关联的验收标准

来源：03-requirements.md

AC-001（FR-ADJ-001）：创建调整单成功
- 对应交互：本文档 4.3 新建调整单
- 验证方式：创建调整单，验证创建成功

AC-002（FR-ADJ-002）：审批调整单成功
- 对应交互：本文档 4.4 审批调整单
- 验证方式：审批调整单，验证状态变为 APPROVED

### 12.2 前端特有验收标准

AC-FE-001：调整类型切换表单联动
- 验证方式：切换调整类型，验证表单字段正确显示

AC-FE-002：状态标签颜色正确
- 验证方式：验证不同状态显示不同颜色标签
