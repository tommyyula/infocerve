# MDM Item 领域 - 单元测试用例

## 概述

本文档定义了 Item 领域的单元测试用例，按领域对象类型分组。

---

## 1. 值对象测试

### UT-VO-001: Sku - 创建有效 SKU

**关联值对象**：Sku
**测试类型**：值对象测试

**测试场景**：
- 使用有效字符串创建 SKU

**输入**：
- value: "SKU-001"

**预期结果**：
- 创建成功
- value() 返回 "SKU-001"

---

### UT-VO-002: Sku - 创建空 SKU 失败

**关联值对象**：Sku
**测试类型**：值对象测试

**测试场景**：
- 使用空字符串创建 SKU

**输入**：
- value: ""

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "SKU cannot be empty"

---

### UT-VO-003: Sku - 创建超长 SKU 失败

**关联值对象**：Sku
**测试类型**：值对象测试

**测试场景**：
- 使用超过 127 字符的字符串创建 SKU

**输入**：
- value: 128 个字符的字符串

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "SKU length exceeds maximum"


---

### UT-VO-004: BarcodeInfo - 验证有效 EAN 码

**关联值对象**：BarcodeInfo
**测试类型**：值对象测试
**关联业务规则**：BR-BARCODE-001

**测试场景**：
- 使用 13 位数字创建 EAN 码

**输入**：
- eanCode: "1234567890123"

**预期结果**：
- 创建成功
- validateEanCode() 返回 true

---

### UT-VO-005: BarcodeInfo - 验证无效 EAN 码

**关联值对象**：BarcodeInfo
**测试类型**：值对象测试
**关联业务规则**：BR-BARCODE-001

**测试场景**：
- 使用非 13 位数字创建 EAN 码

**输入**：
- eanCode: "123456789"

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "EAN code must be 13 digits"

---

### UT-VO-006: BarcodeInfo - 验证有效 UPC 码

**关联值对象**：BarcodeInfo
**测试类型**：值对象测试
**关联业务规则**：BR-BARCODE-002

**测试场景**：
- 使用 12 位数字创建 UPC 码

**输入**：
- upcCode: "123456789012"

**预期结果**：
- 创建成功
- validateUpcCode() 返回 true

---

### UT-VO-007: Quantity - 创建有效数量

**关联值对象**：Quantity
**测试类型**：值对象测试

**测试场景**：
- 使用正数创建数量

**输入**：
- value: BigDecimal.valueOf(10)

**预期结果**：
- 创建成功
- isPositive() 返回 true

---

### UT-VO-008: Quantity - 创建负数数量失败

**关联值对象**：Quantity
**测试类型**：值对象测试

**测试场景**：
- 使用负数创建数量

**输入**：
- value: BigDecimal.valueOf(-1)

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "Quantity cannot be negative"


---

### UT-VO-009: Quantity - 数量加法

**关联值对象**：Quantity
**测试类型**：值对象测试

**测试场景**：
- 两个数量相加

**输入**：
- qty1: Quantity(10)
- qty2: Quantity(5)

**预期结果**：
- qty1.add(qty2) 返回 Quantity(15)

---

### UT-VO-010: SerialNumberConfig - 验证序列号配置

**关联值对象**：SerialNumberConfig
**测试类型**：值对象测试
**关联业务规则**：BR-SN-003

**测试场景**：
- 启用序列号但未启用 hasSerialNumber 时配置收货收集

**输入**：
- hasSerialNumber: false
- requireCollectSnOnReceive: true

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "Serial number must be enabled"

---

### UT-VO-011: LotConfig - 验证批次配置

**关联值对象**：LotConfig
**测试类型**：值对象测试
**关联业务规则**：BR-LOT-001

**测试场景**：
- 启用批次收集但未启用 hasLotNo

**输入**：
- hasLotNo: false
- requireCollectLotNoOnReceive: true

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "Lot number must be enabled"

---

### UT-VO-012: ShippingConfig - 验证发货天数

**关联值对象**：ShippingConfig
**测试类型**：值对象测试
**关联业务规则**：BR-SHIP-001

**测试场景**：
- 允许发货天数大于保质期天数

**输入**：
- shipAllowDays: 400
- shelfLifeDays: 365

**预期结果**：
- 抛出 IllegalArgumentException
- 消息包含 "Ship allow days cannot exceed shelf life"

---

## 2. 聚合测试

### UT-AGG-001: Item - 创建商品

**关联聚合**：Item
**关联方法**：create()
**关联业务规则**：BR-ITEM-001, BR-ITEM-004
**测试类型**：聚合根测试

**测试场景**：
- 使用有效命令创建商品

**前置状态**：
- 无

**输入**：
- CreateItemCommand(sku="SKU-001", type=MATERIAL)

**预期结果**：
- 商品创建成功
- 状态为 DRAFT
- 发布 ItemCreatedEvent


---

### UT-AGG-002: Item - 创建商品类型无效

**关联聚合**：Item
**关联方法**：create()
**关联业务规则**：BR-ITEM-004
**测试类型**：聚合根测试

**测试场景**：
- 使用无效类型创建商品

**前置状态**：
- 无

**输入**：
- CreateItemCommand(sku="SKU-001", type=null)

**预期结果**：
- 抛出 ItemValidationException
- 消息包含 "Item type is required"

---

### UT-AGG-003: Item - 启用商品

**关联聚合**：Item
**关联方法**：enable()
**测试类型**：聚合根测试

**测试场景**：
- 启用草稿状态的商品

**前置状态**：
- 商品状态为 DRAFT

**输入**：
- 无

**预期结果**：
- 状态变为 ENABLED
- 发布 ItemEnabledEvent

---

### UT-AGG-004: Item - 禁用商品

**关联聚合**：Item
**关联方法**：disable()
**关联业务规则**：BR-ITEM-003
**测试类型**：聚合根测试

**测试场景**：
- 禁用启用状态的商品

**前置状态**：
- 商品状态为 ENABLED

**输入**：
- 无

**预期结果**：
- 状态变为 DISABLED
- 发布 ItemDisabledEvent

---

### UT-AGG-005: Item - 更新条码信息

**关联聚合**：Item
**关联方法**：updateBarcodeInfo()
**关联业务规则**：BR-BARCODE-001, BR-BARCODE-002
**测试类型**：聚合根测试

**测试场景**：
- 更新商品的条码信息

**前置状态**：
- 商品已创建

**输入**：
- BarcodeInfo(eanCode="1234567890123", upcCode="123456789012")

**预期结果**：
- 条码信息更新成功
- 发布 ItemUpdatedEvent


---

### UT-AGG-006: Item - 配置序列号

**关联聚合**：Item
**关联方法**：configureSerialNumber()
**关联业务规则**：BR-SN-001, BR-SN-002, BR-SN-003
**测试类型**：聚合根测试

**测试场景**：
- 配置商品的序列号规则

**前置状态**：
- 商品已创建

**输入**：
- SerialNumberConfig(hasSerialNumber=true, serialNoLength=20)

**预期结果**：
- 序列号配置更新成功

---

### UT-AGG-007: ItemProperty - 创建属性

**关联聚合**：ItemProperty
**关联方法**：create()
**关联业务规则**：BR-PROP-004
**测试类型**：聚合根测试

**测试场景**：
- 创建商品属性

**前置状态**：
- 无

**输入**：
- CreateItemPropertyCommand(itemId="item-001", name="Color", type=SELECT, value="Red")

**预期结果**：
- 属性创建成功
- 发布 ItemPropertyCreatedEvent

---

### UT-AGG-008: ItemProperty - 更新 SELECT 类型属性值

**关联聚合**：ItemProperty
**关联方法**：updateValue()
**关联业务规则**：BR-PROP-002
**测试类型**：聚合根测试

**测试场景**：
- 更新 SELECT 类型属性的值，值在选项列表中

**前置状态**：
- 属性已创建，type=SELECT, options=["Red","Blue","Green"]

**输入**：
- value: "Blue"

**预期结果**：
- 属性值更新成功

---

### UT-AGG-009: ItemProperty - 更新 SELECT 类型属性值失败

**关联聚合**：ItemProperty
**关联方法**：updateValue()
**关联业务规则**：BR-PROP-002
**测试类型**：聚合根测试

**测试场景**：
- 更新 SELECT 类型属性的值，值不在选项列表中

**前置状态**：
- 属性已创建，type=SELECT, options=["Red","Blue","Green"]

**输入**：
- value: "Yellow"

**预期结果**：
- 抛出 PropertyValidationException
- 消息包含 "Value not in options"


---

### UT-AGG-010: ItemUom - 创建基本单位

**关联聚合**：ItemUom
**关联方法**：createBaseUom()
**关联业务规则**：BR-UOM-001, BR-UOM-002
**测试类型**：聚合根测试

**测试场景**：
- 创建商品的基本单位

**前置状态**：
- 无

**输入**：
- CreateBaseUomCommand(itemId="item-001", name="EA")

**预期结果**：
- 单位创建成功
- isBaseUom=true
- baseQty=1
- 发布 ItemUomCreatedEvent

---

### UT-AGG-011: ItemUom - 创建非基本单位

**关联聚合**：ItemUom
**关联方法**：createUom()
**关联业务规则**：BR-UOM-003
**测试类型**：聚合根测试

**测试场景**：
- 创建商品的非基本单位

**前置状态**：
- 商品已有基本单位

**输入**：
- CreateUomCommand(itemId="item-001", name="BOX", baseQty=12)

**预期结果**：
- 单位创建成功
- isBaseUom=false
- baseQty=12

---

### UT-AGG-012: ItemUom - 创建非基本单位 baseQty 无效

**关联聚合**：ItemUom
**关联方法**：createUom()
**关联业务规则**：BR-UOM-003
**测试类型**：聚合根测试

**测试场景**：
- 创建非基本单位时 baseQty <= 0

**前置状态**：
- 商品已有基本单位

**输入**：
- CreateUomCommand(itemId="item-001", name="BOX", baseQty=0)

**预期结果**：
- 抛出 UomValidationException
- 消息包含 "Base quantity must be positive"

---

### UT-AGG-013: ItemKitting - 创建组件

**关联聚合**：ItemKitting
**关联方法**：create()
**关联业务规则**：BR-KIT-002, BR-KIT-003
**测试类型**：聚合根测试

**测试场景**：
- 为套装添加组件

**前置状态**：
- 无

**输入**：
- CreateKittingComponentCommand(itemId="kit-001", componentItemId="item-001", qty=2)

**预期结果**：
- 组件创建成功
- 发布 KittingComponentCreatedEvent


---

### UT-AGG-014: ItemKitting - 创建组件自引用失败

**关联聚合**：ItemKitting
**关联方法**：create()
**关联业务规则**：BR-KIT-002
**测试类型**：聚合根测试

**测试场景**：
- 添加套装自身为组件

**前置状态**：
- 无

**输入**：
- CreateKittingComponentCommand(itemId="kit-001", componentItemId="kit-001", qty=1)

**预期结果**：
- 抛出 KittingValidationException
- 消息包含 "Cannot add self as component"

---

### UT-AGG-015: PalletConfig - 创建托盘配置

**关联聚合**：PalletConfig
**关联方法**：create()
**关联业务规则**：BR-PALLET-001, BR-PALLET-003
**测试类型**：聚合根测试

**测试场景**：
- 创建托盘配置

**前置状态**：
- 商品已配置单位（uomId 有效）

**输入**：
- CreatePalletConfigCommand(itemId="item-001", uomId="uom-001", ti=4, hi=5)

**预期结果**：
- 配置创建成功
- 发布 PalletConfigCreatedEvent

---

### UT-AGG-016: PalletConfig - 创建托盘配置 TI 无效

**关联聚合**：PalletConfig
**关联方法**：create()
**关联业务规则**：BR-PALLET-001
**测试类型**：聚合根测试

**测试场景**：
- 创建托盘配置时 TI <= 0

**前置状态**：
- 无

**输入**：
- CreatePalletConfigCommand(itemId="item-001", uomId="uom-001", ti=0, hi=5)

**预期结果**：
- 抛出 PalletConfigValidationException
- 消息包含 "TI must be positive"

---

### UT-AGG-017: PalletConfig - 创建托盘配置 uomId 无效

**关联聚合**：PalletConfig
**关联方法**：create()
**关联业务规则**：BR-PALLET-003
**测试类型**：聚合根测试

**测试场景**：
- 创建托盘配置时 uomId 不是该商品已配置的单位

**前置状态**：
- 商品 item-001 只配置了 uom-001 单位

**输入**：
- CreatePalletConfigCommand(itemId="item-001", uomId="uom-999", ti=4, hi=5)

**预期结果**：
- 抛出 PalletConfigValidationException
- 消息包含 "UOM not found for this item"

---

## 3. 领域服务测试

### UT-DS-001: ItemUniquenessService - SKU 唯一性检查通过

**关联服务**：ItemUniquenessService
**关联方法**：checkSkuUniqueness()
**测试类型**：领域服务测试

**测试场景**：
- SKU 在租户下不存在

**Mock 依赖**：
- ItemRepository.existsByTenantIdAndSku() 返回 false

**输入**：
- tenantId: "tenant-001"
- sku: "SKU-NEW"
- excludeItemId: null

**预期结果**：
- 方法正常返回，不抛出异常


---

### UT-DS-002: ItemUniquenessService - SKU 唯一性检查失败

**关联服务**：ItemUniquenessService
**关联方法**：checkSkuUniqueness()
**测试类型**：领域服务测试

**测试场景**：
- SKU 在租户下已存在

**Mock 依赖**：
- ItemRepository.existsByTenantIdAndSku() 返回 true

**输入**：
- tenantId: "tenant-001"
- sku: "SKU-EXISTS"
- excludeItemId: null

**预期结果**：
- 抛出 ItemDuplicateException
- 消息包含 "SKU already exists"

---

### UT-DS-003: BarcodeSearchService - 条码查找成功

**关联服务**：BarcodeSearchService
**关联方法**：findByBarcode()
**测试类型**：领域服务测试

**测试场景**：
- 通过 EAN 码查找商品

**Mock 依赖**：
- ItemRepository.findByBarcode() 返回 Item

**输入**：
- tenantId: "tenant-001"
- barcode: "1234567890123"

**预期结果**：
- 返回对应的 Item

---

### UT-DS-004: BarcodeSearchService - 条码查找失败

**关联服务**：BarcodeSearchService
**关联方法**：findByBarcode()
**测试类型**：领域服务测试

**测试场景**：
- 条码不存在

**Mock 依赖**：
- ItemRepository.findByBarcode() 返回 Optional.empty()

**输入**：
- tenantId: "tenant-001"
- barcode: "9999999999999"

**预期结果**：
- 抛出 ItemNotFoundException
- 消息包含 "Barcode not found"

---

### UT-DS-005: ItemUomService - 单位换算

**关联服务**：ItemUomService
**关联方法**：convertQuantity()
**测试类型**：领域服务测试

**测试场景**：
- 从箱换算到个

**Mock 依赖**：
- ItemUomRepository.findById() 返回对应单位
- 箱的 baseQty=12，个的 baseQty=1

**输入**：
- itemId: "item-001"
- qty: Quantity(2)
- fromUomId: "box-uom"
- toUomId: "ea-uom"

**预期结果**：
- 返回 Quantity(24)


---

## 4. 应用服务测试

### UT-AS-001: ItemApplicationService - 创建商品

**关联服务**：ItemApplicationService
**关联方法**：createItem()
**测试类型**：应用服务测试

**测试场景**：
- 创建商品完整流程

**Mock 依赖**：
- ItemUniquenessService.checkSkuUniqueness() 正常返回
- ItemRepository.save() 正常返回

**输入**：
- CreateItemCommand(sku="SKU-001", type=MATERIAL)

**预期结果**：
- 商品创建成功
- 返回商品 ID

---

### UT-AS-002: ItemApplicationService - 删除商品

**关联服务**：ItemApplicationService
**关联方法**：deleteItem()
**测试类型**：应用服务测试

**测试场景**：
- 删除无关联库存的商品

**Mock 依赖**：
- ItemRepository.findById() 返回 Item
- ItemDeletionService.checkCanDelete() 正常返回
- ItemRepository.delete() 正常返回

**输入**：
- itemId: "item-001"

**预期结果**：
- 商品删除成功

---

### UT-AS-003: ItemApplicationService - 删除商品失败（有库存）

**关联服务**：ItemApplicationService
**关联方法**：deleteItem()
**测试类型**：应用服务测试

**测试场景**：
- 删除有关联库存的商品

**Mock 依赖**：
- ItemRepository.findById() 返回 Item
- ItemDeletionService.checkCanDelete() 抛出 ItemDeletionException

**输入**：
- itemId: "item-with-inv"

**预期结果**：
- 抛出 ItemDeletionException
- 消息包含 "Item has inventory"