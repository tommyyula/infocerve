# MDM Item 领域 - 领域分析

## 1. 统一语言（Ubiquitous Language）

### 核心概念

- 商品 - 仓库管理的基本单元，具有唯一 SKU 标识 - Item
- SKU - 库存单位，商品的唯一标识码 - Sku
- 商品属性 - 商品的扩展信息，支持自定义 - ItemProperty
- 商品单位 - 商品的计量单位，支持多单位换算 - ItemUom
- 基本单位 - 商品的最小计量单位 - BaseUom
- 默认单位 - 商品的默认展示单位 - DefaultUom
- 双单位 - 同时使用两种单位计量的模式 - DualUom
- 套装商品 - 由多个组件商品组成的商品 - KittingItem
- 套装组件 - 套装商品中的组成部分 - KittingComponent
- 托盘配置 - 商品在托盘上的堆码规则 - PalletConfig
- 危险品定义 - 预先维护的危险品类型信息 - HazardDefinition
- 行业 - 商品所属的业务分类 - Industry
- 行业属性模板 - 行业预定义的标准属性定义 - IndustryPropertyTemplate

### 条码相关

- EAN 码 - 欧洲商品编码，13 位数字 - EanCode
- UPC 码 - 通用产品代码，12 位数字 - UpcCode
- 箱装 UPC 码 - 箱装商品的 UPC 码 - CaseUpcCode
- ISBN 码 - 国际标准书号 - IsbnCode

### 批次与序列号

- 批次号 - 同一批次生产的商品标识 - LotNo
- 序列号 - 单个商品的唯一标识 - SerialNumber
- 保质期 - 商品的有效期限 - ShelfLife
- 过期日期 - 商品失效的日期 - ExpirationDate
- 生产日期 - 商品生产的日期 - ManufactureDate

### 托盘配置

- TI - 托盘每层数量（Tier） - Ti
- HI - 托盘层数（Height Index） - Hi

### 状态与类型

- 商品状态 - 商品的生命周期状态（草稿/启用/禁用） - ItemStatus
- 商品类型 - 商品的分类（物料/产品） - ItemType

---

## 2. 领域识别

### 核心域（Core Domain）

商品管理（Item Management）
- 商品是仓库管理的核心数据
- 直接影响收货、发货、盘点等核心业务
- 需要高度定制，支持多种业务场景
- 投入优先级：最高

### 支撑域（Supporting Domain）

属性管理（Property Management）
- 支持商品的扩展信息管理
- 提供灵活的自定义属性能力
- 投入优先级：中等

行业管理（Industry Management）
- 支持行业分类和属性模板管理
- 为商品提供标准化属性定义
- 投入优先级：中等

单位管理（UOM Management）
- 支持商品的多单位换算
- 影响收发货数量计算
- 投入优先级：中等

危险品管理（Hazard Management）
- 独立维护危险品定义
- 商品关联危险品定义
- 投入优先级：中等

### 通用域（Generic Domain）

文件管理（File Management）
- 商品图片、附件的存储
- 可使用通用文件服务
- 投入优先级：低

---

## 3. 限界上下文（Bounded Context）

### 上下文划分

商品上下文（Item Context）
- 职责：管理商品基础信息、条码、批次/序列号配置、关联危险品
- 核心概念：Item, Sku, EanCode, UpcCode, LotNo, SerialNumber
- 所属领域：核心域

属性上下文（Property Context）
- 职责：管理商品的自定义属性
- 核心概念：ItemProperty, PropertyType, PropertyValue
- 所属领域：支撑域

行业上下文（Industry Context）
- 职责：管理行业分类和属性模板
- 核心概念：Industry, IndustryPropertyTemplate
- 所属领域：支撑域

单位上下文（UOM Context）
- 职责：管理商品的计量单位和换算关系
- 核心概念：ItemUom, BaseUom, UomConversion
- 所属领域：支撑域

套装上下文（Kitting Context）
- 职责：管理套装商品的组件关系
- 核心概念：KittingItem, KittingComponent
- 所属领域：支撑域

托盘配置上下文（Pallet Config Context）
- 职责：管理商品的托盘堆码规则
- 核心概念：PalletConfig, Ti, Hi, Carrier
- 所属领域：支撑域
- 外部依赖：引用 Carrier（承运商）聚合

危险品上下文（Hazard Context）
- 职责：独立管理危险品定义
- 核心概念：HazardDefinition, HazardClass, PackingGroup
- 所属领域：支撑域

### 上下文映射

```
+------------------+
|   Item Context   |  <-- 核心上下文
+------------------+
        |
        | OHS (Open Host Service)
        |
   +----+----+----+----+----+----+
   |    |    |    |    |    |    |
   v    v    v    v    v    v    v
+------+ +------+ +------+ +------+ +------+ +------+
|Prop  | |Indus | | UOM  | |Kitting| |Pallet| |Hazard|
|Ctx   | | Ctx  | | Ctx  | | Ctx   | | Ctx  | | Ctx  |
+------+ +------+ +------+ +------+ +------+ +------+
   |         |         |        |        |        |
   +---------+---------+--------+--------+--------+
                    |
                    v
            Customer-Supplier
            (Item 是上游)
```

### 上下文关系说明

- Item Context 是核心上下文，提供 OHS（Open Host Service）
- Industry Context 为 Property Context 提供属性模板
- Hazard Context 独立管理危险品定义，Item 通过 hazardId 关联
- Pallet Config Context 引用外部 Carrier（承运商）聚合，通过 carrierId 关联
- Property/UOM/Kitting/Pallet 是下游上下文
- 下游上下文通过 Item ID 引用商品
- 上下文之间通过 API 同步调用

### 托盘配置与外部实体的关系

```
[Organization Context]      [Carrier Context]       [Pallet Config Context]
(外部 mdm-app)              (外部 mdm-app)                |
      |                           |                       v
      v                           v                 +-------------+
+------------+              +------------+          | PalletConfig|
| Organization|             | Carrier    |  <------ | (carrierId) |
| (RETAILER) | <-----------------------            | (retailerId)|
+------------+   引用                               | (uomId)     |
                                                    +-------------+
                                                          |
                                                          v
                                                    [ItemUom Context]
                                                    (本领域)
```

业务流程：
1. 承运商（Carrier）在 mdm-app 中独立维护
2. 零售商是 Organization 聚合中 tags 包含 RETAILER 的组织
3. 创建/编辑托盘配置时，可选择承运商和零售商
4. 托盘配置保存 carrierId 关联到承运商
5. 托盘配置保存 retailerId 关联到零售商组织
6. 托盘配置保存 uomId 关联到商品的单位
7. 不同承运商/零售商可能有不同的托盘堆码要求

### 行业与属性的关系

```
[Industry Context]          [Property Context]
      |                           |
      v                           v
+------------+              +-------------+
| Industry   |              | ItemProperty|
+------------+              +-------------+
      |                           ^
      v                           |
+--------------------+            |
| IndustryProperty   |  -------->-+
| Template           |   (加载模板创建属性)
+--------------------+
```

业务流程：
1. 管理员在 Industry Context 维护行业和属性模板
2. 创建商品时选择行业
3. 系统从 Industry Context 加载该行业的属性模板
4. 用户可删减属性、填写属性值
5. 保存时属性存入 Property Context 的 ItemProperty

### 危险品与商品的关系

```
[Hazard Context]            [Item Context]
      |                           |
      v                           v
+----------------+          +------------+
| HazardDefinition|  <----  | Item       |
+----------------+   关联    | (hazardId) |
                            +------------+
```

业务流程：
1. 管理员在 Hazard Context 预先维护危险品定义
2. 创建/编辑商品时，打开危险品开关
3. 从已维护的危险品定义中选择
4. 商品保存 hazardId 关联到危险品定义

---

## 4. 业务流程

### 4.1 商品创建流程（新版）

```
[仓库管理员]
     |
     v
(1) 填写商品基础信息
     |
     v
(2) 选择行业（可选）
     |
     +-- 选择行业 --> 加载行业属性模板
     |                    |
     |                    v
     |               (2.1) 显示属性模板列表
     |                    |
     |                    v
     |               (2.2) 管理员可删减属性
     |                    |
     |                    v
     |               (2.3) 管理员填写属性值
     |
     v
(3) 单位 Tab - 添加单位
     |
     +-- 点击添加 --> 弹出单位模态框
     |                    |
     |                    v
     |               填写单位信息
     |                    |
     |                    v
     |               保存 --> 暂存到页面列表
     |
     v
(4) Pallet 配置 Tab - 添加托盘配置
     |
     +-- 点击添加 --> 弹出托盘配置模态框
     |                    |
     |                    v
     |               填写 TI/HI 等信息
     |                    |
     |                    v
     |               保存 --> 暂存到页面列表
     |
     v
(5) Kitting 开关（可选）
     |
     +-- 打开开关 --> 显示 Kitting Tab
     |                    |
     |                    v
     |               点击添加组合品
     |                    |
     |                    v
     |               弹出商品选择模态框
     |                    |
     |                    v
     |               选择商品、填写数量
     |                    |
     |                    v
     |               保存 --> 暂存到页面列表
     |
     v
(6) 危险品开关（可选）
     |
     +-- 打开开关 --> 显示危险品选择框
     |                    |
     |                    v
     |               选择已维护的危险品定义
     |
     v
(7) 保存商品
     |
     +-- 提交表单
     |
     v
[商品创建完成，所有暂存数据一并保存]
```

### 4.2 商品条码识别流程

```
[收货员]
     |
     v
(1) 扫描条码
     |
     v
(2) 系统识别条码类型
     |
     +-- EAN 码 --> 查询 eanCode 字段
     |
     +-- UPC 码 --> 查询 upcCode 字段
     |
     +-- 箱装 UPC --> 查询 caseUpcCode 字段
     |
     +-- ISBN 码 --> 查询 isbnCode 字段
     |
     v
(3) 返回商品信息
     |
     v
[识别完成]
```

### 4.3 商品单位换算流程

```
[系统]
     |
     v
(1) 获取商品单位列表
     |
     v
(2) 查找基本单位（isBaseUom = true）
     |
     v
(3) 计算换算关系
     |
     +-- 目标单位数量 = 源单位数量 * (源单位.baseQty / 目标单位.baseQty)
     |
     v
(4) 返回换算结果
     |
     v
[换算完成]
```

### 4.4 事件风暴

命令 - 事件 - 策略

创建商品
- 命令：CreateItem
- 事件：ItemCreatedEvent
- 策略：无

更新商品
- 命令：UpdateItem
- 事件：ItemUpdatedEvent
- 策略：通知库存系统更新商品信息

启用商品
- 命令：EnableItem
- 事件：ItemEnabledEvent
- 策略：无

禁用商品
- 命令：DisableItem
- 事件：ItemDisabledEvent
- 策略：检查是否有未完成的订单

删除商品
- 命令：DeleteItem
- 事件：ItemDeletedEvent
- 策略：检查是否有关联库存

添加商品属性
- 命令：AddItemProperty
- 事件：ItemPropertyAddedEvent
- 策略：无

添加商品单位
- 命令：AddItemUom
- 事件：ItemUomAddedEvent
- 策略：无

配置套装组件
- 命令：ConfigureKitting
- 事件：KittingConfiguredEvent
- 策略：无

创建行业
- 命令：CreateIndustry
- 事件：IndustryCreatedEvent
- 策略：无

更新行业
- 命令：UpdateIndustry
- 事件：IndustryUpdatedEvent
- 策略：无

删除行业
- 命令：DeleteIndustry
- 事件：IndustryDeletedEvent
- 策略：检查是否有商品关联该行业

添加行业属性模板
- 命令：AddIndustryPropertyTemplate
- 事件：IndustryPropertyTemplateAddedEvent
- 策略：无

加载行业属性模板
- 命令：LoadIndustryPropertyTemplates
- 事件：无（查询操作）
- 策略：返回行业的所有属性模板供商品使用

创建危险品定义
- 命令：CreateHazardDefinition
- 事件：HazardDefinitionCreatedEvent
- 策略：无

更新危险品定义
- 命令：UpdateHazardDefinition
- 事件：HazardDefinitionUpdatedEvent
- 策略：无

删除危险品定义
- 命令：DeleteHazardDefinition
- 事件：HazardDefinitionDeletedEvent
- 策略：检查是否有商品关联该危险品定义

---

## 5. 业务规则

### 商品基础规则

BR-ITEM-001
- 规则：同一租户下 SKU 必须唯一
- 触发场景：创建商品、修改 SKU

BR-ITEM-002
- 规则：商品删除前必须检查是否有关联库存
- 触发场景：删除商品

BR-ITEM-003
- 规则：商品禁用前必须检查是否有未完成订单
- 触发场景：禁用商品

BR-ITEM-004
- 规则：商品类型（type）只能是 MATERIAL 或 PRODUCT
- 触发场景：创建商品、修改商品类型

BR-ITEM-005
- 规则：包装材料（packagingMaterial）如果有值，必须是已存在的商品 ID，且该商品类型必须为 MATERIAL
- 触发场景：创建商品、修改包装材料

BR-ITEM-006
- 规则：客户（customerId）如果有值，必须是已存在的组织 ID，且该组织的 tags 必须包含 CUSTOMER
- 触发场景：创建商品、修改客户

BR-ITEM-007
- 规则：品牌（brandId）如果有值，必须是已存在的组织 ID，且该组织的 tags 必须包含 BRAND
- 触发场景：创建商品、修改品牌

### 条码规则

BR-BARCODE-001
- 规则：EAN 码必须是 13 位数字
- 触发场景：配置 EAN 码

BR-BARCODE-002
- 规则：UPC 码必须是 12 位数字
- 触发场景：配置 UPC 码

BR-BARCODE-003
- 规则：同一租户下条码（EAN/UPC/ISBN）必须唯一
- 触发场景：配置条码

### 序列号规则

BR-SN-001
- 规则：启用序列号时，序列号长度必须大于 0
- 触发场景：配置序列号

BR-SN-002
- 规则：序列号验证规则必须是有效的正则表达式
- 触发场景：配置序列号验证规则

BR-SN-003
- 规则：收货时收集序列号要求商品必须启用序列号
- 触发场景：配置收货收集序列号

### 批次规则

BR-LOT-001
- 规则：收货时收集批次号要求商品必须启用批次号
- 触发场景：配置收货收集批次号

BR-LOT-002
- 规则：收货时收集过期日期要求商品必须启用批次号
- 触发场景：配置收货收集过期日期

BR-LOT-003
- 规则：收货时收集生产日期要求商品必须启用批次号
- 触发场景：配置收货收集生产日期

### 单位规则

BR-UOM-001
- 规则：商品必须有且仅有一个基本单位
- 触发场景：添加单位、删除单位

BR-UOM-002
- 规则：基本单位的 baseQty 必须为 1
- 触发场景：添加基本单位

BR-UOM-003
- 规则：非基本单位的 baseQty 必须大于 0
- 触发场景：添加非基本单位

BR-UOM-004
- 规则：商品最多有一个默认单位
- 触发场景：设置默认单位

BR-UOM-005
- 规则：启用双单位时必须配置双单位类型
- 触发场景：启用双单位

### 属性规则

BR-PROP-001
- 规则：必填属性在商品保存时必须有值
- 触发场景：保存商品

BR-PROP-002
- 规则：SELECT 类型属性的值必须在选项列表中
- 触发场景：设置属性值

BR-PROP-003
- 规则：NUMBER 类型属性的值必须是有效数字
- 触发场景：设置属性值

BR-PROP-004
- 规则：同一商品的属性名称不能重复
- 触发场景：添加属性

### 套装规则

BR-KIT-001
- 规则：套装商品必须至少有一个组件
- 触发场景：保存套装商品

BR-KIT-002
- 规则：组件商品不能是套装商品本身
- 触发场景：添加组件

BR-KIT-003
- 规则：组件数量必须大于 0
- 触发场景：添加组件

### 托盘配置规则

BR-PALLET-001
- 规则：TI 和 HI 必须大于 0
- 触发场景：配置托盘

BR-PALLET-002
- 规则：同一商品最多有一个默认托盘配置
- 触发场景：设置默认配置

BR-PALLET-003
- 规则：uomId 必须是该商品已配置的单位
- 触发场景：创建/更新托盘配置

### 发货规则

BR-SHIP-001
- 规则：允许发货天数必须小于等于保质期天数
- 触发场景：配置允许发货天数

BR-SHIP-002
- 规则：发货规则时间窗口必须大于 0
- 触发场景：配置发货规则时间窗口

### 行业规则

BR-INDUSTRY-001
- 规则：同一租户下行业代码必须唯一
- 触发场景：创建行业、修改行业代码

BR-INDUSTRY-002
- 规则：行业删除前必须检查是否有商品关联
- 触发场景：删除行业

BR-INDUSTRY-003
- 规则：行业代码不能为空，最大长度 50
- 触发场景：创建行业

BR-INDUSTRY-004
- 规则：行业名称不能为空，最大长度 100
- 触发场景：创建行业

### 行业属性模板规则

BR-TEMPLATE-001
- 规则：同一行业下属性模板名称必须唯一
- 触发场景：添加属性模板

BR-TEMPLATE-002
- 规则：属性模板类型必须是 TEXT/DATE/NUMBER/SELECT 之一
- 触发场景：添加属性模板

BR-TEMPLATE-003
- 规则：SELECT 类型的属性模板必须有选项列表
- 触发场景：添加 SELECT 类型属性模板

BR-TEMPLATE-004
- 规则：NUMBER 类型的属性模板可以配置单位
- 触发场景：添加 NUMBER 类型属性模板

### 危险品定义规则

BR-HAZARD-001
- 规则：同一租户下危险品 ID 必须唯一
- 触发场景：创建危险品定义

BR-HAZARD-002
- 规则：危险品定义删除前必须检查是否有商品关联
- 触发场景：删除危险品定义

BR-HAZARD-003
- 规则：危险品名称不能为空
- 触发场景：创建危险品定义

BR-HAZARD-004
- 规则：危险品分类不能为空
- 触发场景：创建危险品定义

### 导入规则

BR-IMPORT-001
- 规则：导入文件格式必须是 xlsx 或 xls
- 触发场景：上传导入文件

BR-IMPORT-002
- 规则：导入文件大小不能超过 10MB
- 触发场景：上传导入文件

BR-IMPORT-003
- 规则：导入数据行数不能超过 5000 行
- 触发场景：解析导入文件

BR-IMPORT-004
- 规则：导入失败的行不影响其他行的导入
- 触发场景：执行批量导入
