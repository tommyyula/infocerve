# LP 容器管理 FSD

## 1. 功能概述

### 1.1 功能目标

提供 LP（License Plate，容器）的创建、查询、更新、删除和移动功能，支持多种容器类型管理，是库存存放和流转的基础模块。

### 1.2 关联用户故事

- US-LP-001：创建 LP
- US-LP-002：更新 LP
- US-LP-003：查询 LP
- US-LP-004：删除 LP
- US-LP-005：LP 整体移动

### 1.3 关联需求项

- FR-LP-001：创建 LP
- FR-LP-002：更新 LP
- FR-LP-003：查询 LP
- FR-LP-004：删除 LP
- FR-LP-005：LP 整体移动

---

## 2. 用户场景

### 场景 1：创建新 LP

角色：仓库操作员
前置条件：用户已登录，有 LP 创建权限
操作流程：
1. 用户进入 LP 容器页面
2. 用户点击"新建 LP"按钮
3. 系统弹出创建表单
4. 用户选择 LP 类型、输入前缀等信息
5. 用户点击"确定"按钮
6. 系统调用 API 创建 LP
7. 系统显示创建成功提示，刷新列表

预期结果：LP 创建成功，列表显示新记录

### 场景 2：批量创建 LP

角色：仓库操作员
前置条件：用户已登录，有 LP 创建权限
操作流程：
1. 用户点击"批量创建"按钮
2. 系统弹出批量创建表单
3. 用户选择 LP 类型、输入前缀、输入数量
4. 用户点击"确定"按钮
5. 系统批量创建 LP
6. 系统显示创建成功提示

预期结果：批量创建成功，列表显示新记录

### 场景 3：查询 LP 列表

角色：仓库管理员
前置条件：用户已登录，有 LP 查询权限
操作流程：
1. 用户进入 LP 容器页面
2. 用户输入查询条件（LP ID、库位、状态、类型等）
3. 用户点击"查询"按钮
4. 系统调用 API 查询 LP 数据
5. 系统显示查询结果列表

预期结果：显示符合条件的 LP 记录

### 场景 4：查看 LP 详情

角色：仓库管理员
前置条件：LP 列表中有数据
操作流程：
1. 用户点击某条 LP 记录的"详情"链接
2. 系统弹出详情弹窗
3. 弹窗显示 LP 的完整信息和包含的库存

预期结果：详情弹窗正确显示所有字段

### 场景 5：删除 LP

角色：仓库管理员
前置条件：LP 存在
操作流程：
1. 用户点击某条 LP 记录的"删除"按钮
2. 系统弹出确认对话框
3. 用户确认删除
4. 系统调用 API 删除 LP（软删除）
5. 系统显示删除成功提示

预期结果：LP 状态变为 ON_HOLD

---

## 3. 界面说明

### 3.1 页面布局

对应 Demo：05-demo/index.html#lp

页面分为三个区域：
- 查询区域：顶部卡片，包含查询表单和操作按钮
- 操作按钮：新建 LP、批量创建
- 结果区域：底部卡片，显示 LP 列表表格

### 3.2 页面区域

区域 A：查询表单
- 位置：页面顶部卡片
- 功能：输入查询条件
- 包含元素：
  - 第一行：LP ID（输入）、Location（输入）、Status（下拉）、Type（下拉）
  - 第二行：Parent LP（输入）、External LPN（输入）
  - 按钮组：查询、重置、新建 LP、批量创建

区域 B：LP 列表表格
- 位置：结果卡片内容区
- 功能：显示 LP 列表
- 包含列：LP ID、Type、Status、Location、Parent LP、External LPN、Created Time、操作

区域 C：分页控件
- 位置：表格底部
- 功能：分页导航

---

## 4. 交互逻辑

### 4.1 页面加载

触发时机：页面首次加载
处理逻辑：
1. 初始化查询表单，所有字段为空
2. 不自动查询，等待用户操作
3. 显示空的结果区域

### 4.2 查询 LP

触发时机：用户点击"查询"按钮
处理逻辑：
1. 收集表单中的查询条件
2. 调用 API：GET /api/lp/page
3. 显示 loading 状态
4. 成功后渲染结果表格
5. 失败后显示错误提示

### 4.3 新建 LP

触发时机：用户点击"新建 LP"按钮
处理逻辑：
1. 弹出创建表单弹窗
2. 用户填写 LP 类型、前缀等信息
3. 用户点击"确定"
4. 调用 API：POST /api/lp
5. 成功后关闭弹窗，刷新列表
6. 失败后显示错误提示

### 4.4 批量创建 LP

触发时机：用户点击"批量创建"按钮
处理逻辑：
1. 弹出批量创建表单弹窗
2. 用户填写 LP 类型、前缀、数量
3. 用户点击"确定"
4. 调用 API：POST /api/lp/batch
5. 成功后关闭弹窗，刷新列表
6. 失败后显示错误提示

### 4.5 查看详情

触发时机：用户点击"详情"链接
处理逻辑：
1. 获取当前行的 LP ID
2. 调用 API：GET /api/lp/{id}
3. 弹出详情弹窗
4. 渲染 LP 完整信息

### 4.6 删除 LP

触发时机：用户点击"删除"按钮
处理逻辑：
1. 弹出确认对话框
2. 用户确认后调用 API：DELETE /api/lp/{id}
3. 成功后刷新列表
4. 失败后显示错误提示

### 4.7 LP 移动

触发时机：用户点击"移动"按钮
处理逻辑：
1. 弹出移动表单弹窗
2. 用户选择目标库位、目标父 LP
3. 用户点击"确定"
4. 调用 API：PUT /api/lp/{id}/move
5. 成功后关闭弹窗，刷新列表

---

## 5. 数据字段

### 5.1 查询表单字段

字段名：LP ID
- 字段标识：lpId
- 控件类型：input
- 数据类型：string
- 是否必填：否

字段名：Location
- 字段标识：locationId
- 控件类型：input
- 数据类型：string
- 是否必填：否

字段名：Status
- 字段标识：status
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：见 5.3 枚举定义

字段名：Type
- 字段标识：type
- 控件类型：select
- 数据类型：enum
- 是否必填：否
- 枚举值：见 5.3 枚举定义

### 5.2 列表字段

字段名：LP ID
- 字段标识：id
- 数据类型：string
- 显示格式：原样显示

字段名：Type
- 字段标识：type
- 数据类型：enum
- 显示格式：Tag 标签

字段名：Status
- 字段标识：status
- 数据类型：enum
- 显示格式：Tag 标签，不同状态不同颜色

字段名：Location
- 字段标识：locationId
- 数据类型：string
- 显示格式：原样显示

字段名：Created Time
- 字段标识：createdTime
- 数据类型：datetime
- 显示格式：YYYY-MM-DD HH:mm

### 5.3 枚举定义

枚举名：LpType
- ILP：内部容器
- HLP：库位容器
- CLP：纸箱容器
- SLP：发货容器
- TLP：周转箱
- RLP：退货容器

枚举名：LpStatus
- NEW：新建
- RECEIVING：收货中
- IN_STOCK：在库
- PICKED：已拣货
- STAGED：已暂存
- LOADED：已装车
- PACKED：已打包
- SHIPPED：已发货
- ON_HOLD：冻结

---

## 6. 业务规则

### 6.1 创建规则

BR-LP-001：LP ID 格式
- 触发条件：创建 LP
- 处理逻辑：LP ID 格式为 {TYPE}-{PREFIX}{SEQUENCE}
- 影响范围：LP ID 字段

BR-LP-002：默认状态
- 触发条件：创建 LP
- 处理逻辑：默认状态为 NEW
- 影响范围：Status 字段

### 6.2 删除规则

BR-LP-003：软删除
- 触发条件：删除 LP
- 处理逻辑：不物理删除，状态变为 ON_HOLD
- 影响范围：Status 字段

### 6.3 显示规则

BR-LP-005：状态标签颜色
- 触发条件：渲染状态字段
- 处理逻辑：
  - NEW/IN_STOCK：绿色（tag-success）
  - RECEIVING/PICKED/STAGED：黄色（tag-warning）
  - SHIPPED/ON_HOLD：红色（tag-danger）
- 影响范围：Status 列

---

## 7. 异常处理

### 7.1 创建失败

错误场景：LP 创建失败
错误提示：LP 创建失败，请稍后重试
处理方式：显示错误提示，保持弹窗状态

### 7.2 删除失败

错误场景：LP 删除失败
错误提示：LP 删除失败，请检查是否有关联数据
处理方式：显示错误提示

---

## 8. 依赖说明

### 8.1 API 接口

接口：分页查询 LP
- 路径：GET /api/lp/page
- 详细设计：07-design.md#2.2
- 用途：查询 LP 列表

接口：创建 LP
- 路径：POST /api/lp
- 详细设计：07-design.md#2.2
- 用途：创建单个 LP

接口：批量创建 LP
- 路径：POST /api/lp/batch
- 详细设计：07-design.md#2.2
- 用途：批量创建 LP

接口：删除 LP
- 路径：DELETE /api/lp/{id}
- 详细设计：07-design.md#2.2
- 用途：删除 LP

### 8.2 权限要求

- lp:read：查询 LP
- lp:create：创建 LP
- lp:update：更新 LP
- lp:delete：删除 LP

---

## 9. 国际化（i18n）

### 9.1 静态文案

页面标题：
- key：lp.title
- 中文：LP 容器
- 英文：License Plate

按钮文案：
- key：lp.create
- 中文：新建 LP
- 英文：Create LP

- key：lp.batchCreate
- 中文：批量创建
- 英文：Batch Create

### 9.2 枚举值翻译

枚举名：LpType
- ILP：中文=内部容器 / 英文=Internal LP
- HLP：中文=库位容器 / 英文=Holding LP
- CLP：中文=纸箱容器 / 英文=Carton LP
- SLP：中文=发货容器 / 英文=Shipping LP

枚举名：LpStatus
- NEW：中文=新建 / 英文=New
- IN_STOCK：中文=在库 / 英文=In Stock
- SHIPPED：中文=已发货 / 英文=Shipped
- ON_HOLD：中文=冻结 / 英文=On Hold

---

## 10. 数据模型引用

### 10.1 涉及的聚合/实体

聚合根：Lp
- 详细定义：04-domain-model.md#2.2
- 本模块使用的属性：id、code、locationId、type、status、parentId、externalLPN、createdTime

---

## 11. API 接口引用

### 11.1 查询接口

接口：分页查询 LP
- 路径：GET /api/lp/page
- 详细设计：07-design.md#2.2
- 用途：获取 LP 列表数据

### 11.2 命令接口

接口：创建 LP
- 路径：POST /api/lp
- 详细设计：07-design.md#2.2
- 用途：创建单个 LP

接口：批量创建 LP
- 路径：POST /api/lp/batch
- 详细设计：07-design.md#2.2
- 用途：批量创建 LP

---

## 12. 验收标准引用

### 12.1 关联的验收标准

来源：03-requirements.md

AC-001（FR-LP-001）：创建各类型 LP 成功
- 对应交互：本文档 4.3 新建 LP
- 验证方式：创建不同类型 LP，验证创建成功

AC-002（FR-LP-001）：LP ID 格式正确
- 对应交互：本文档 4.3 新建 LP
- 验证方式：验证 LP ID 格式为 {TYPE}-{PREFIX}{SEQUENCE}

AC-003（FR-LP-003）：按条件查询返回正确结果
- 对应交互：本文档 4.2 查询 LP
- 验证方式：输入条件查询，验证结果正确

### 12.2 前端特有验收标准

AC-FE-001：创建弹窗表单验证
- 验证方式：必填字段为空时显示错误提示

AC-FE-002：状态标签颜色正确
- 验证方式：验证不同状态显示不同颜色标签
