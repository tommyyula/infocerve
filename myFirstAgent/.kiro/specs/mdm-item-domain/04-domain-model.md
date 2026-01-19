# MDM Item 领域 - 领域建模

## 1. 聚合设计

### 1.1 Item 聚合（商品聚合）

聚合根：Item

属性：
- id: ItemId - 商品唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- sku: Sku - SKU 编码
- description: String - 商品描述
- shortDescription: String - 简短描述
- abbreviation: String - 缩写
- customerId: CustomerId - 客户 ID
- supplierIds: List<SupplierId> - 供应商 ID 列表
- brandId: BrandId - 品牌 ID
- industryId: IndustryId - 行业 ID
- hazardId: HazardDefinitionId - 危险品定义 ID（关联）
- isHazardous: Boolean - 是否危险品
- status: ItemStatus - 商品状态
- type: ItemType - 商品类型（MATERIAL/PRODUCT）
- barcodeInfo: BarcodeInfo - 条码信息（值对象）
- serialNumberConfig: SerialNumberConfig - 序列号配置（值对象）
- lotConfig: LotConfig - 批次配置（值对象）
- shippingConfig: ShippingConfig - 发货配置（值对象）
- kittingConfig: KittingConfig - 套装配置（值对象）
- classificationInfo: ClassificationInfo - 商品分类信息（值对象）
- akas: List<String> - 别名列表
- fileIds: List<FileId> - 文件 ID 列表
- imageFileIds: List<FileId> - 图片文件 ID 列表
- tags: List<String> - 标签列表
- auditInfo: AuditInfo - 审计信息（值对象）

聚合方法：

create(command: CreateItemCommand): Item
- 说明：创建商品
- 业务规则：BR-ITEM-001, BR-ITEM-004
- 发布事件：ItemCreatedEvent

update(command: UpdateItemCommand): void
- 说明：更新商品信息
- 业务规则：BR-ITEM-001
- 发布事件：ItemUpdatedEvent

enable(): void
- 说明：启用商品
- 业务规则：无
- 发布事件：ItemEnabledEvent

disable(): void
- 说明：禁用商品
- 业务规则：BR-ITEM-003
- 发布事件：ItemDisabledEvent

delete(): void
- 说明：删除商品
- 业务规则：BR-ITEM-002
- 发布事件：ItemDeletedEvent

updateBarcodeInfo(barcodeInfo: BarcodeInfo): void
- 说明：更新条码信息
- 业务规则：BR-BARCODE-001, BR-BARCODE-002, BR-BARCODE-003

configureSerialNumber(config: SerialNumberConfig): void
- 说明：配置序列号
- 业务规则：BR-SN-001, BR-SN-002, BR-SN-003

configureLot(config: LotConfig): void
- 说明：配置批次
- 业务规则：BR-LOT-001, BR-LOT-002, BR-LOT-003

configureShipping(config: ShippingConfig): void
- 说明：配置发货规则
- 业务规则：BR-SHIP-001, BR-SHIP-002

configureKitting(config: KittingConfig): void
- 说明：配置套装
- 业务规则：BR-KIT-001

associateHazard(hazardId: HazardDefinitionId): void
- 说明：关联危险品定义
- 业务规则：设置 isHazardous = true

disassociateHazard(): void
- 说明：取消危险品关联
- 业务规则：设置 isHazardous = false, hazardId = null

addAlias(alias: String): void
- 说明：添加别名

removeAlias(alias: String): void
- 说明：移除别名

聚合不变量：
- SKU 不能为空
- 租户 ID 不能为空
- 隔离 ID 不能为空
- 商品类型必须是 MATERIAL 或 PRODUCT
- 如果 isHazardous = true，则 hazardId 不能为空

---

### 1.2 HazardDefinition 聚合（危险品定义聚合）

聚合根：HazardDefinition

属性：
- id: HazardDefinitionId - 危险品定义唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- hazardCode: String - 危险品代码
- hazardName: String - 危险品名称
- properShippingName: String - 正确运输名称
- hazardClass: String - 危险品分类
- packingGroup: String - 包装组
- description: String - 描述
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateHazardDefinitionCommand): HazardDefinition
- 说明：创建危险品定义
- 业务规则：BR-HAZARD-001, BR-HAZARD-003, BR-HAZARD-004
- 发布事件：HazardDefinitionCreatedEvent

update(command: UpdateHazardDefinitionCommand): void
- 说明：更新危险品定义
- 发布事件：HazardDefinitionUpdatedEvent

delete(): void
- 说明：删除危险品定义
- 业务规则：BR-HAZARD-002
- 发布事件：HazardDefinitionDeletedEvent

聚合不变量：
- 租户 ID 不能为空
- 隔离 ID 不能为空
- 危险品代码不能为空
- 危险品名称不能为空
- 危险品分类不能为空

---

### 1.3 ItemProperty 聚合（商品属性聚合）

聚合根：ItemProperty

属性：
- id: ItemPropertyId - 属性唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- itemId: ItemId - 商品 ID
- name: PropertyName - 属性名称
- type: PropertyType - 属性类型
- options: List<String> - 选项列表（SELECT 类型）
- uom: String - 单位（NUMBER 类型）
- isRequired: Boolean - 是否必填
- sortOrder: Integer - 排序顺序
- value: PropertyValue - 属性值
- valueUom: String - 值单位
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateItemPropertyCommand): ItemProperty
- 说明：创建属性
- 业务规则：BR-PROP-004
- 发布事件：ItemPropertyCreatedEvent

updateValue(value: PropertyValue, valueUom: String): void
- 说明：更新属性值
- 业务规则：BR-PROP-002, BR-PROP-003
- 发布事件：ItemPropertyUpdatedEvent

delete(): void
- 说明：删除属性
- 发布事件：ItemPropertyDeletedEvent

聚合不变量：
- 属性名称不能为空
- 属性类型不能为空
- SELECT 类型必须有选项列表
- NUMBER 类型的值必须是有效数字

---

### 1.4 ItemUom 聚合（商品单位聚合）

聚合根：ItemUom

属性：
- id: ItemUomId - 单位唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- itemId: ItemId - 商品 ID
- uomId: UomId - 单位定义 ID
- name: String - 单位名称
- dualUomType: DualUomType - 双单位类型
- qty: Quantity - 数量
- baseQty: Quantity - 基本单位数量
- insideUomId: ItemUomId - 内部单位 ID
- isDefaultUom: Boolean - 是否默认单位
- isBaseUom: Boolean - 是否基本单位
- dimension: Dimension - 尺寸信息（值对象）
- pricing: Pricing - 价格信息（值对象）
- status: UomStatus - 单位状态
- auditInfo: AuditInfo - 审计信息

聚合方法：

createBaseUom(command: CreateBaseUomCommand): ItemUom
- 说明：创建基本单位
- 业务规则：BR-UOM-001, BR-UOM-002
- 发布事件：ItemUomCreatedEvent

createUom(command: CreateUomCommand): ItemUom
- 说明：创建非基本单位
- 业务规则：BR-UOM-003
- 发布事件：ItemUomCreatedEvent

setAsDefault(): void
- 说明：设置为默认单位
- 业务规则：BR-UOM-004

updateDimension(dimension: Dimension): void
- 说明：更新尺寸信息

updatePricing(pricing: Pricing): void
- 说明：更新价格信息

delete(): void
- 说明：删除单位
- 业务规则：BR-UOM-001
- 发布事件：ItemUomDeletedEvent

聚合不变量：
- 商品 ID 不能为空
- 基本单位的 baseQty 必须为 1
- 非基本单位的 baseQty 必须大于 0

---

### 1.5 ItemKitting 聚合（套装组件聚合）

聚合根：ItemKitting

属性：
- id: ItemKittingId - 组件唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- itemId: ItemId - 套装商品 ID
- componentItemId: ItemId - 组件商品 ID
- lpType: String - LP 类型
- qty: Quantity - 组件数量
- uomId: UomId - 单位 ID
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateKittingComponentCommand): ItemKitting
- 说明：创建组件
- 业务规则：BR-KIT-002, BR-KIT-003
- 发布事件：KittingComponentCreatedEvent

updateQty(qty: Quantity): void
- 说明：更新组件数量
- 业务规则：BR-KIT-003

delete(): void
- 说明：删除组件
- 发布事件：KittingComponentDeletedEvent

聚合不变量：
- 套装商品 ID 不能为空
- 组件商品 ID 不能为空
- 组件商品 ID 不能等于套装商品 ID
- 组件数量必须大于 0

---

### 1.6 PalletConfig 聚合（托盘配置聚合）

聚合根：PalletConfig

属性：
- id: PalletConfigId - 配置唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- itemId: ItemId - 商品 ID
- name: String - 配置名称
- scene: String - 场景
- retailerId: RetailerId - 零售商 ID（引用 Organization 聚合，tags 包含 RETAILER）
- carrierId: CarrierId - 承运商 ID（引用外部 Carrier 聚合）
- uomId: UomId - 单位 ID（必须是该商品已配置的单位）
- status: ConfigStatus - 配置状态
- isDefault: Boolean - 是否默认
- ti: Decimal - TI（每层数量）
- hi: Decimal - HI（层数）
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreatePalletConfigCommand): PalletConfig
- 说明：创建托盘配置
- 业务规则：BR-PALLET-001, BR-PALLET-003
- 发布事件：PalletConfigCreatedEvent

update(ti: Decimal, hi: Decimal): void
- 说明：更新 TI/HI
- 业务规则：BR-PALLET-001

setAsDefault(): void
- 说明：设置为默认配置
- 业务规则：BR-PALLET-002

delete(): void
- 说明：删除配置
- 发布事件：PalletConfigDeletedEvent

聚合不变量：
- 商品 ID 不能为空
- uomId 不能为空，且必须是该商品已配置的单位
- TI 必须大于 0
- HI 必须大于 0

---

### 1.7 Industry 聚合（行业聚合）

聚合根：Industry

属性：
- id: IndustryId - 行业唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- code: IndustryCode - 行业代码
- name: String - 行业名称
- description: String - 行业描述
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateIndustryCommand): Industry
- 说明：创建行业
- 业务规则：BR-INDUSTRY-001, BR-INDUSTRY-003, BR-INDUSTRY-004
- 发布事件：IndustryCreatedEvent

update(command: UpdateIndustryCommand): void
- 说明：更新行业信息
- 业务规则：BR-INDUSTRY-001
- 发布事件：IndustryUpdatedEvent

delete(): void
- 说明：删除行业
- 业务规则：BR-INDUSTRY-002
- 发布事件：IndustryDeletedEvent

聚合不变量：
- 行业代码不能为空
- 行业名称不能为空
- 租户 ID 不能为空
- 隔离 ID 不能为空

---

### 1.8 IndustryPropertyTemplate 聚合（行业属性模板聚合）

聚合根：IndustryPropertyTemplate

属性：
- id: IndustryPropertyTemplateId - 模板唯一标识
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 隔离 ID
- industryId: IndustryId - 行业 ID
- name: PropertyName - 属性名称
- type: PropertyType - 属性类型（TEXT/DATE/NUMBER/SELECT）
- isRequired: Boolean - 是否必填
- options: List<String> - 选项列表（SELECT 类型）
- uom: String - 单位（NUMBER 类型）
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateIndustryPropertyTemplateCommand): IndustryPropertyTemplate
- 说明：创建属性模板
- 业务规则：BR-TEMPLATE-001, BR-TEMPLATE-002, BR-TEMPLATE-003, BR-TEMPLATE-004
- 发布事件：IndustryPropertyTemplateCreatedEvent

update(command: UpdateIndustryPropertyTemplateCommand): void
- 说明：更新属性模板
- 业务规则：BR-TEMPLATE-001, BR-TEMPLATE-002, BR-TEMPLATE-003
- 发布事件：IndustryPropertyTemplateUpdatedEvent

delete(): void
- 说明：删除属性模板
- 发布事件：IndustryPropertyTemplateDeletedEvent

聚合不变量：
- 行业 ID 不能为空
- 属性名称不能为空
- 属性类型不能为空
- SELECT 类型必须有选项列表

---

## 2. 实体设计

本领域模型中，所有聚合根同时也是实体。聚合内部没有其他独立实体。

---

## 3. 值对象设计

### 3.1 标识类值对象

ItemId
- 属性：value: String
- 不变量：不能为空，长度 32 位

TenantId
- 属性：value: String
- 不变量：不能为空

IsolationId
- 属性：value: String
- 不变量：不能为空

HazardDefinitionId
- 属性：value: Long
- 不变量：不能为空

CustomerId
- 属性：value: String
- 不变量：可以为空
- 说明：引用 Organization 聚合的 ID，该组织的 tags 必须包含 CUSTOMER

SupplierId
- 属性：value: String
- 不变量：不能为空

BrandId
- 属性：value: String
- 不变量：可以为空
- 说明：引用 Organization 聚合的 ID，该组织的 tags 必须包含 BRAND

IndustryId
- 属性：value: Long
- 不变量：可以为空

IndustryPropertyTemplateId
- 属性：value: Long
- 不变量：不能为空

UomId
- 属性：value: String
- 不变量：不能为空

FileId
- 属性：value: String
- 不变量：不能为空

RetailerId
- 属性：value: String
- 不变量：可以为空
- 说明：引用 Organization 聚合的 ID，该组织的 tags 必须包含 RETAILER

CarrierId
- 属性：value: String
- 不变量：可以为空
- 说明：引用外部 Carrier 聚合的 ID

### 3.2 编码类值对象

Sku
- 属性：value: String
- 不变量：不能为空，最大长度 127
- 行为：equals(), hashCode()

PropertyName
- 属性：value: String
- 不变量：不能为空，最大长度 50

IndustryCode
- 属性：value: String
- 不变量：不能为空，最大长度 50
- 行为：equals(), hashCode()

### 3.3 条码信息值对象

BarcodeInfo
- 属性：
  - eanCode: String - EAN 码
  - upcCode: String - UPC 码
  - caseUpcCode: String - 箱装 UPC 码
  - isbnCode: String - ISBN 码
- 不变量：
  - EAN 码如果有值必须是 13 位数字
  - UPC 码如果有值必须是 12 位数字
- 行为：
  - validateEanCode(): Boolean
  - validateUpcCode(): Boolean

### 3.4 序列号配置值对象

SerialNumberConfig
- 属性：
  - hasSerialNumber: Boolean - 是否启用序列号
  - requireCollectSnOnReceive: Boolean - 收货时收集序列号
  - requireCollectSnOnShipping: Boolean - 发货时收集序列号
  - serialNoLength: Integer - 序列号长度
  - serialNoValidationRule: String - 序列号验证规则
  - validationInboundSerialNo: Boolean - 入库验证序列号
  - validationOutboundSerialNo: Boolean - 出库验证序列号
- 不变量：
  - 收集序列号要求必须先启用序列号
  - 序列号长度必须大于 0（如果启用）
  - 验证规则必须是有效正则表达式

### 3.5 批次配置值对象

LotConfig
- 属性：
  - hasLotNo: Boolean - 是否启用批次号
  - requireCollectLotNoOnReceive: Boolean - 收货时收集批次号
  - requireCollectLotNoOnShipping: Boolean - 发货时收集批次号
  - requireCollectExpirationDateOnReceive: Boolean - 收货时收集过期日期
  - requireCollectMfgDateOnReceive: Boolean - 收货时收集生产日期
  - shelfLifeDays: Integer - 保质期天数
  - expirationDate: LocalDateTime - 过期日期
- 不变量：
  - 收集批次信息要求必须先启用批次号

### 3.6 发货配置值对象

ShippingConfig
- 属性：
  - shippingRule: String - 发货规则
  - shipAllowDays: Integer - 允许发货天数
  - shippingRuleTimeWindow: Integer - 发货规则时间窗口
  - countryOfOrigin: String - 原产国
- 不变量：
  - 允许发货天数必须小于等于保质期天数
  - 发货规则时间窗口必须大于 0

### 3.7 套装配置值对象

KittingConfig
- 属性：
  - isKitting: Boolean - 是否套装
  - kitItemFulfillBy: String - 套装履行方式
- 不变量：无

### 3.8 商品分类信息值对象

ClassificationInfo
- 属性：
  - grade: String - 等级
  - nmfc: String - NMFC 代码（美国货运分类代码）
  - commodityCode: String - 商品代码
  - packagingMaterial: ItemId - 包装材料（关联类型为 MATERIAL 的商品 ID）
- 不变量：
  - packagingMaterial 如果有值，必须是已存在的商品 ID，且该商品类型必须为 MATERIAL

### 3.9 尺寸信息值对象

Dimension
- 属性：
  - length: BigDecimal - 长度
  - width: BigDecimal - 宽度
  - height: BigDecimal - 高度
  - linearUom: String - 线性单位
  - weight: BigDecimal - 重量
  - weightUom: String - 重量单位
  - volume: BigDecimal - 体积
  - volumeUom: String - 体积单位
- 行为：
  - calculateVolume(): BigDecimal

### 3.10 价格信息值对象

Pricing
- 属性：
  - price: BigDecimal - 价格
  - insurancePrice: BigDecimal - 保险价格
  - currency: String - 币种
- 不变量：
  - 价格不能为负数
  - 保险价格不能为负数

### 3.11 属性值值对象

PropertyValue
- 属性：
  - value: String - 值
  - type: PropertyType - 类型
- 不变量：
  - NUMBER 类型的值必须是有效数字
- 行为：
  - asNumber(): BigDecimal
  - asString(): String

### 3.12 数量值对象

Quantity
- 属性：
  - value: BigDecimal - 数值
- 不变量：
  - 不能为 null
  - 不能为负数
- 行为：
  - add(other: Quantity): Quantity
  - subtract(other: Quantity): Quantity
  - multiply(factor: BigDecimal): Quantity
  - isZero(): Boolean
  - isPositive(): Boolean

### 3.13 审计信息值对象

AuditInfo
- 属性：
  - createdTime: LocalDateTime - 创建时间
  - createdBy: String - 创建人
  - updatedTime: LocalDateTime - 更新时间
  - updatedBy: String - 更新人
- 行为：
  - markCreated(operator: String): AuditInfo
  - markUpdated(operator: String): AuditInfo

---

## 4. 领域服务

### 4.1 ItemUniquenessService（商品唯一性服务）

职责：检查商品 SKU 和条码的唯一性

方法：

checkSkuUniqueness(tenantId: TenantId, sku: Sku, excludeItemId: ItemId): void
- 参数：租户 ID、SKU、排除的商品 ID（更新时使用）
- 返回：无（不唯一时抛出异常）
- 说明：检查 SKU 在租户下是否唯一

checkBarcodeUniqueness(tenantId: TenantId, barcodeInfo: BarcodeInfo, excludeItemId: ItemId): void
- 参数：租户 ID、条码信息、排除的商品 ID
- 返回：无（不唯一时抛出异常）
- 说明：检查条码在租户下是否唯一

依赖：
- ItemRepository

### 4.2 ItemDeletionService（商品删除服务）

职责：检查商品是否可以删除

方法：

checkCanDelete(itemId: ItemId): void
- 参数：商品 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查商品是否有关联库存

依赖：
- InventoryGateway（外部网关）

### 4.3 ItemDisableService（商品禁用服务）

职责：检查商品是否可以禁用

方法：

checkCanDisable(itemId: ItemId): void
- 参数：商品 ID
- 返回：无（不能禁用时抛出异常）
- 说明：检查商品是否有未完成订单

依赖：
- OrderGateway（外部网关）

### 4.4 BarcodeSearchService（条码搜索服务）

职责：通过条码查找商品

方法：

findByBarcode(tenantId: TenantId, barcode: String): Item
- 参数：租户 ID、条码
- 返回：商品（未找到时抛出异常）
- 说明：支持 EAN、UPC、箱装 UPC、ISBN 条码

依赖：
- ItemRepository

### 4.5 ItemUomService（商品单位服务）

职责：管理商品单位的业务逻辑

方法：

ensureBaseUomExists(itemId: ItemId): void
- 参数：商品 ID
- 返回：无（不存在时抛出异常）
- 说明：确保商品有基本单位

clearDefaultUom(itemId: ItemId, excludeUomId: ItemUomId): void
- 参数：商品 ID、排除的单位 ID
- 返回：无
- 说明：清除其他单位的默认标记

convertQuantity(itemId: ItemId, qty: Quantity, fromUomId: UomId, toUomId: UomId): Quantity
- 参数：商品 ID、数量、源单位 ID、目标单位 ID
- 返回：转换后的数量
- 说明：单位换算

依赖：
- ItemUomRepository

### 4.6 ItemPropertyValidationService（商品属性验证服务）

职责：验证商品属性

方法：

validateRequiredProperties(itemId: ItemId): void
- 参数：商品 ID
- 返回：无（验证失败时抛出异常）
- 说明：验证必填属性是否都有值

validatePropertyValue(property: ItemProperty, value: PropertyValue): void
- 参数：属性、值
- 返回：无（验证失败时抛出异常）
- 说明：验证属性值是否符合类型要求

依赖：
- ItemPropertyRepository

### 4.7 IndustryUniquenessService（行业唯一性服务）

职责：检查行业代码的唯一性

方法：

checkCodeUniqueness(tenantId: TenantId, code: IndustryCode, excludeIndustryId: IndustryId): void
- 参数：租户 ID、行业代码、排除的行业 ID（更新时使用）
- 返回：无（不唯一时抛出异常）
- 说明：检查行业代码在租户下是否唯一

依赖：
- IndustryRepository

### 4.8 IndustryDeletionService（行业删除服务）

职责：检查行业是否可以删除

方法：

checkCanDelete(industryId: IndustryId): void
- 参数：行业 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查是否有商品关联该行业

依赖：
- ItemRepository

### 4.9 IndustryPropertyTemplateService（行业属性模板服务）

职责：管理行业属性模板的业务逻辑

方法：

loadTemplatesByIndustryId(industryId: IndustryId): List<IndustryPropertyTemplate>
- 参数：行业 ID
- 返回：属性模板列表
- 说明：加载行业的所有属性模板

checkTemplateNameUniqueness(industryId: IndustryId, name: PropertyName, excludeTemplateId: IndustryPropertyTemplateId): void
- 参数：行业 ID、属性名称、排除的模板 ID
- 返回：无（不唯一时抛出异常）
- 说明：检查属性模板名称在行业下是否唯一

convertTemplatesToProperties(templates: List<IndustryPropertyTemplate>, itemId: ItemId): List<ItemProperty>
- 参数：属性模板列表、商品 ID
- 返回：商品属性列表
- 说明：将属性模板转换为商品属性（用于新建商品时）

依赖：
- IndustryPropertyTemplateRepository
- ItemPropertyRepository

### 4.10 HazardDefinitionUniquenessService（危险品定义唯一性服务）

职责：检查危险品代码的唯一性

方法：

checkCodeUniqueness(tenantId: TenantId, hazardCode: String, excludeId: HazardDefinitionId): void
- 参数：租户 ID、危险品代码、排除的 ID（更新时使用）
- 返回：无（不唯一时抛出异常）
- 说明：检查危险品代码在租户下是否唯一

依赖：
- HazardDefinitionRepository

### 4.11 HazardDefinitionDeletionService（危险品定义删除服务）

职责：检查危险品定义是否可以删除

方法：

checkCanDelete(hazardId: HazardDefinitionId): void
- 参数：危险品定义 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查是否有商品关联该危险品定义

依赖：
- ItemRepository

---

## 5. 领域事件

### 商品事件

ItemCreatedEvent
- 触发时机：商品创建成功
- 携带数据：itemId, tenantId, sku, type
- 订阅者：无

ItemUpdatedEvent
- 触发时机：商品更新成功
- 携带数据：itemId, tenantId, changedFields
- 订阅者：库存服务（更新商品缓存）

ItemEnabledEvent
- 触发时机：商品启用成功
- 携带数据：itemId, tenantId
- 订阅者：无

ItemDisabledEvent
- 触发时机：商品禁用成功
- 携带数据：itemId, tenantId
- 订阅者：无

ItemDeletedEvent
- 触发时机：商品删除成功
- 携带数据：itemId, tenantId
- 订阅者：无

### 属性事件

ItemPropertyCreatedEvent
- 触发时机：属性创建成功
- 携带数据：propertyId, itemId, name
- 订阅者：无

ItemPropertyUpdatedEvent
- 触发时机：属性更新成功
- 携带数据：propertyId, itemId, name, oldValue, newValue
- 订阅者：无

ItemPropertyDeletedEvent
- 触发时机：属性删除成功
- 携带数据：propertyId, itemId, name
- 订阅者：无

### 单位事件

ItemUomCreatedEvent
- 触发时机：单位创建成功
- 携带数据：uomId, itemId, name, isBaseUom
- 订阅者：无

ItemUomDeletedEvent
- 触发时机：单位删除成功
- 携带数据：uomId, itemId, name
- 订阅者：无

### 套装事件

KittingComponentCreatedEvent
- 触发时机：套装组件创建成功
- 携带数据：kittingId, itemId, componentItemId, qty
- 订阅者：无

KittingComponentDeletedEvent
- 触发时机：套装组件删除成功
- 携带数据：kittingId, itemId, componentItemId
- 订阅者：无

### 托盘配置事件

PalletConfigCreatedEvent
- 触发时机：托盘配置创建成功
- 携带数据：configId, itemId, ti, hi
- 订阅者：无

PalletConfigDeletedEvent
- 触发时机：托盘配置删除成功
- 携带数据：configId, itemId
- 订阅者：无

### 危险品定义事件

HazardDefinitionCreatedEvent
- 触发时机：危险品定义创建成功
- 携带数据：hazardId, tenantId, hazardCode, hazardName, hazardClass
- 订阅者：无

HazardDefinitionUpdatedEvent
- 触发时机：危险品定义更新成功
- 携带数据：hazardId, tenantId, changedFields
- 订阅者：无

HazardDefinitionDeletedEvent
- 触发时机：危险品定义删除成功
- 携带数据：hazardId, tenantId, hazardCode
- 订阅者：无

### 行业事件

IndustryCreatedEvent
- 触发时机：行业创建成功
- 携带数据：industryId, tenantId, code, name
- 订阅者：无

IndustryUpdatedEvent
- 触发时机：行业更新成功
- 携带数据：industryId, tenantId, changedFields
- 订阅者：无

IndustryDeletedEvent
- 触发时机：行业删除成功
- 携带数据：industryId, tenantId, code
- 订阅者：无

### 行业属性模板事件

IndustryPropertyTemplateCreatedEvent
- 触发时机：属性模板创建成功
- 携带数据：templateId, industryId, name, type
- 订阅者：无

IndustryPropertyTemplateUpdatedEvent
- 触发时机：属性模板更新成功
- 携带数据：templateId, industryId, changedFields
- 订阅者：无

IndustryPropertyTemplateDeletedEvent
- 触发时机：属性模板删除成功
- 携带数据：templateId, industryId, name
- 订阅者：无

---

## 6. 仓储接口

### ItemRepository

职责：Item 聚合的持久化

方法：

save(item: Item): void
- 参数：商品聚合
- 返回：无
- 说明：保存商品

findById(id: ItemId): Optional<Item>
- 参数：商品 ID
- 返回：商品（可选）
- 说明：根据 ID 查询商品

findByTenantIdAndSku(tenantId: TenantId, sku: Sku): Optional<Item>
- 参数：租户 ID、SKU
- 返回：商品（可选）
- 说明：根据租户和 SKU 查询商品

findByBarcode(tenantId: TenantId, barcode: String): Optional<Item>
- 参数：租户 ID、条码
- 返回：商品（可选）
- 说明：根据条码查询商品

delete(item: Item): void
- 参数：商品聚合
- 返回：无
- 说明：删除商品

existsByTenantIdAndSku(tenantId: TenantId, sku: Sku): Boolean
- 参数：租户 ID、SKU
- 返回：是否存在
- 说明：检查 SKU 是否存在

existsByTenantIdAndBarcode(tenantId: TenantId, barcode: String): Boolean
- 参数：租户 ID、条码
- 返回：是否存在
- 说明：检查条码是否存在

countByHazardId(hazardId: HazardDefinitionId): Integer
- 参数：危险品定义 ID
- 返回：关联商品数量
- 说明：统计关联某危险品定义的商品数量

### HazardDefinitionRepository

职责：HazardDefinition 聚合的持久化

方法：

save(hazard: HazardDefinition): void
- 参数：危险品定义聚合
- 返回：无
- 说明：保存危险品定义

findById(id: HazardDefinitionId): Optional<HazardDefinition>
- 参数：危险品定义 ID
- 返回：危险品定义（可选）
- 说明：根据 ID 查询危险品定义

findByTenantIdAndCode(tenantId: TenantId, hazardCode: String): Optional<HazardDefinition>
- 参数：租户 ID、危险品代码
- 返回：危险品定义（可选）
- 说明：根据租户和代码查询危险品定义

findAllByTenantId(tenantId: TenantId): List<HazardDefinition>
- 参数：租户 ID
- 返回：危险品定义列表
- 说明：查询租户下所有危险品定义

delete(hazard: HazardDefinition): void
- 参数：危险品定义聚合
- 返回：无
- 说明：删除危险品定义

existsByTenantIdAndCode(tenantId: TenantId, hazardCode: String): Boolean
- 参数：租户 ID、危险品代码
- 返回：是否存在
- 说明：检查危险品代码是否存在

### ItemPropertyRepository

职责：ItemProperty 聚合的持久化

方法：

save(property: ItemProperty): void
findById(id: ItemPropertyId): Optional<ItemProperty>
findByItemId(itemId: ItemId): List<ItemProperty>
delete(property: ItemProperty): void
existsByItemIdAndName(itemId: ItemId, name: PropertyName): Boolean

### ItemUomRepository

职责：ItemUom 聚合的持久化

方法：

save(uom: ItemUom): void
findById(id: ItemUomId): Optional<ItemUom>
findByItemId(itemId: ItemId): List<ItemUom>
findBaseUomByItemId(itemId: ItemId): Optional<ItemUom>
findDefaultUomByItemId(itemId: ItemId): Optional<ItemUom>
delete(uom: ItemUom): void
existsBaseUomByItemId(itemId: ItemId): Boolean

### ItemKittingRepository

职责：ItemKitting 聚合的持久化

方法：

save(kitting: ItemKitting): void
findById(id: ItemKittingId): Optional<ItemKitting>
findByItemId(itemId: ItemId): List<ItemKitting>
delete(kitting: ItemKitting): void
countByItemId(itemId: ItemId): Integer

### PalletConfigRepository

职责：PalletConfig 聚合的持久化

方法：

save(config: PalletConfig): void
findById(id: PalletConfigId): Optional<PalletConfig>
findByItemId(itemId: ItemId): List<PalletConfig>
findByItemIdAndRetailerId(itemId: ItemId, retailerId: RetailerId): List<PalletConfig>
findByItemIdAndScene(itemId: ItemId, scene: String): List<PalletConfig>
findByItemIdAndCarrierId(itemId: ItemId, carrierId: CarrierId): List<PalletConfig>
findDefaultByItemId(itemId: ItemId): Optional<PalletConfig>
delete(config: PalletConfig): void

### IndustryRepository

职责：Industry 聚合的持久化

方法：

save(industry: Industry): void
findById(id: IndustryId): Optional<Industry>
findByTenantIdAndCode(tenantId: TenantId, code: IndustryCode): Optional<Industry>
findAllByTenantId(tenantId: TenantId): List<Industry>
delete(industry: Industry): void
existsByTenantIdAndCode(tenantId: TenantId, code: IndustryCode): Boolean

### IndustryPropertyTemplateRepository

职责：IndustryPropertyTemplate 聚合的持久化

方法：

save(template: IndustryPropertyTemplate): void
findById(id: IndustryPropertyTemplateId): Optional<IndustryPropertyTemplate>
findByIndustryId(industryId: IndustryId): List<IndustryPropertyTemplate>
delete(template: IndustryPropertyTemplate): void
existsByIndustryIdAndName(industryId: IndustryId, name: PropertyName): Boolean
deleteByIndustryId(industryId: IndustryId): void
