# MDM Item 领域 - 技术设计

## 1. 概述

### 实现目标

- 采用 DDD 分层架构重构 Item 领域
- 实现商品、属性、单位、套装、托盘配置、危险品的完整 CRUD
- 支持条码识别、序列号/批次配置、发货规则等业务功能
- 提供 RESTful API 供前端和其他系统调用

### 技术选型

- 框架：Spring Boot 2.x
- ORM：MyBatis-Plus
- 数据库：MySQL 8.0
- 缓存：Redis（可选）
- 消息：Spring Event（领域事件）

### 关键设计决策

1. 聚合设计：Item 作为核心聚合，Property/Uom/Kitting/PalletConfig/Hazard 作为独立聚合
2. 值对象：使用 Java record 实现不可变值对象
3. 仓储：接口定义在领域层，实现在基础设施层
4. 事件：使用 Spring Event 发布领域事件

---

## 2. 架构设计

### 分层结构

```
mdm-app/
  src/main/java/com/t5/mdm/
    interfaces/           # 接口层
      controller/         # REST Controller
      dto/               # DTO 对象
      assembler/         # DTO-Entity 转换
    application/         # 应用层
      service/           # 应用服务
      command/           # 命令对象
      query/             # 查询对象
    domain/              # 领域层
      model/             # 聚合、实体、值对象
      service/           # 领域服务
      repository/        # 仓储接口
      event/             # 领域事件
    infrastructure/      # 基础设施层
      persistence/       # 仓储实现、PO、Mapper
      gateway/           # 外部服务网关
      config/            # 配置
```

### 模块依赖

```
interfaces --> application --> domain <-- infrastructure
```

- interfaces 依赖 application
- application 依赖 domain
- domain 不依赖其他层（核心）
- infrastructure 依赖 domain（实现仓储接口）

---

## 3. API 设计

### 3.1 商品 API

创建商品
- 方法：POST
- 路径：/api/v1/items
- 说明：创建新商品
- 请求体：CreateItemRequest
- 响应体：ItemResponse

更新商品
- 方法：PUT
- 路径：/api/v1/items/{id}
- 说明：更新商品信息
- 请求体：UpdateItemRequest
- 响应体：ItemResponse

查询商品详情
- 方法：GET
- 路径：/api/v1/items/{id}
- 说明：获取商品完整信息
- 响应体：ItemDetailResponse

查询商品列表
- 方法：GET
- 路径：/api/v1/items
- 说明：分页查询商品列表
- 参数：sku, status, type, customerId, page, size
- 响应体：PageResponse<ItemListResponse>

删除商品
- 方法：DELETE
- 路径：/api/v1/items/{id}
- 说明：删除商品
- 响应体：void

启用商品
- 方法：POST
- 路径：/api/v1/items/{id}/enable
- 说明：启用商品
- 响应体：void

禁用商品
- 方法：POST
- 路径：/api/v1/items/{id}/disable
- 说明：禁用商品
- 响应体：void

条码识别
- 方法：GET
- 路径：/api/v1/items/barcode/{barcode}
- 说明：通过条码查询商品
- 响应体：ItemResponse

### 3.2 属性 API

添加属性
- 方法：POST
- 路径：/api/v1/items/{itemId}/properties
- 说明：为商品添加属性
- 请求体：CreatePropertyRequest
- 响应体：PropertyResponse

更新属性
- 方法：PUT
- 路径：/api/v1/items/{itemId}/properties/{propertyId}
- 说明：更新属性值
- 请求体：UpdatePropertyRequest
- 响应体：PropertyResponse

删除属性
- 方法：DELETE
- 路径：/api/v1/items/{itemId}/properties/{propertyId}
- 说明：删除属性
- 响应体：void

查询属性列表
- 方法：GET
- 路径：/api/v1/items/{itemId}/properties
- 说明：获取商品所有属性
- 响应体：List<PropertyResponse>

### 3.3 单位 API

添加单位
- 方法：POST
- 路径：/api/v1/items/{itemId}/uoms
- 说明：为商品添加单位
- 请求体：CreateUomRequest
- 响应体：UomResponse

更新单位
- 方法：PUT
- 路径：/api/v1/items/{itemId}/uoms/{uomId}
- 说明：更新单位信息
- 请求体：UpdateUomRequest
- 响应体：UomResponse

删除单位
- 方法：DELETE
- 路径：/api/v1/items/{itemId}/uoms/{uomId}
- 说明：删除单位
- 响应体：void

设置默认单位
- 方法：POST
- 路径：/api/v1/items/{itemId}/uoms/{uomId}/default
- 说明：设置为默认单位
- 响应体：void

查询单位列表
- 方法：GET
- 路径：/api/v1/items/{itemId}/uoms
- 说明：获取商品所有单位
- 响应体：List<UomResponse>

### 3.4 套装 API

添加组件
- 方法：POST
- 路径：/api/v1/items/{itemId}/kitting/components
- 说明：为套装添加组件
- 请求体：CreateKittingComponentRequest
- 响应体：KittingComponentResponse

更新组件
- 方法：PUT
- 路径：/api/v1/items/{itemId}/kitting/components/{componentId}
- 说明：更新组件数量
- 请求体：UpdateKittingComponentRequest
- 响应体：KittingComponentResponse

删除组件
- 方法：DELETE
- 路径：/api/v1/items/{itemId}/kitting/components/{componentId}
- 说明：删除组件
- 响应体：void

查询组件列表
- 方法：GET
- 路径：/api/v1/items/{itemId}/kitting/components
- 说明：获取套装所有组件
- 响应体：List<KittingComponentResponse>

### 3.5 托盘配置 API

添加配置
- 方法：POST
- 路径：/api/v1/items/{itemId}/pallet-configs
- 说明：为商品添加托盘配置
- 请求体：CreatePalletConfigRequest（包含 carrierId、retailerId、uomId 字段）
- 响应体：PalletConfigResponse

更新配置
- 方法：PUT
- 路径：/api/v1/items/{itemId}/pallet-configs/{configId}
- 说明：更新托盘配置
- 请求体：UpdatePalletConfigRequest（包含 carrierId、retailerId、uomId 字段）
- 响应体：PalletConfigResponse

删除配置
- 方法：DELETE
- 路径：/api/v1/items/{itemId}/pallet-configs/{configId}
- 说明：删除托盘配置
- 响应体：void

设置默认配置
- 方法：POST
- 路径：/api/v1/items/{itemId}/pallet-configs/{configId}/default
- 说明：设置为默认配置
- 响应体：void

查询配置列表
- 方法：GET
- 路径：/api/v1/items/{itemId}/pallet-configs
- 说明：获取商品所有托盘配置
- 响应体：List<PalletConfigResponse>

[说明] 
- retailerId：零售商 ID，引用 Organization 聚合，该组织的 tags 必须包含 RETAILER
- uomId：单位 ID，必须是该商品已配置的单位

### 3.6 行业 API

创建行业
- 方法：POST
- 路径：/api/v1/industries
- 说明：创建新行业
- 请求体：CreateIndustryRequest
- 响应体：IndustryResponse

更新行业
- 方法：PUT
- 路径：/api/v1/industries/{id}
- 说明：更新行业信息
- 请求体：UpdateIndustryRequest
- 响应体：IndustryResponse

查询行业详情
- 方法：GET
- 路径：/api/v1/industries/{id}
- 说明：获取行业详情
- 响应体：IndustryResponse

查询行业列表
- 方法：GET
- 路径：/api/v1/industries
- 说明：查询所有行业
- 响应体：List<IndustryResponse>

删除行业
- 方法：DELETE
- 路径：/api/v1/industries/{id}
- 说明：删除行业
- 响应体：void

### 3.7 行业属性模板 API

添加属性模板
- 方法：POST
- 路径：/api/v1/industries/{industryId}/property-templates
- 说明：为行业添加属性模板
- 请求体：CreatePropertyTemplateRequest
- 响应体：PropertyTemplateResponse

更新属性模板
- 方法：PUT
- 路径：/api/v1/industries/{industryId}/property-templates/{templateId}
- 说明：更新属性模板
- 请求体：UpdatePropertyTemplateRequest
- 响应体：PropertyTemplateResponse

删除属性模板
- 方法：DELETE
- 路径：/api/v1/industries/{industryId}/property-templates/{templateId}
- 说明：删除属性模板
- 响应体：void

查询属性模板列表
- 方法：GET
- 路径：/api/v1/industries/{industryId}/property-templates
- 说明：获取行业所有属性模板
- 响应体：List<PropertyTemplateResponse>

加载行业属性模板（商品使用）
- 方法：GET
- 路径：/api/v1/industries/{industryId}/property-templates/for-item
- 说明：加载行业属性模板供商品创建时使用
- 响应体：List<PropertyTemplateForItemResponse>

### 3.8 危险品定义 API

创建危险品定义
- 方法：POST
- 路径：/api/v1/hazard-definitions
- 说明：创建新的危险品定义
- 请求体：CreateHazardDefinitionRequest
- 响应体：HazardDefinitionResponse

更新危险品定义
- 方法：PUT
- 路径：/api/v1/hazard-definitions/{id}
- 说明：更新危险品定义信息
- 请求体：UpdateHazardDefinitionRequest
- 响应体：HazardDefinitionResponse

查询危险品定义详情
- 方法：GET
- 路径：/api/v1/hazard-definitions/{id}
- 说明：获取危险品定义详情
- 响应体：HazardDefinitionResponse

查询危险品定义列表
- 方法：GET
- 路径：/api/v1/hazard-definitions
- 说明：查询所有危险品定义
- 参数：hazardCode, hazardName, hazardClass, page, size
- 响应体：PageResponse<HazardDefinitionListResponse>

删除危险品定义
- 方法：DELETE
- 路径：/api/v1/hazard-definitions/{id}
- 说明：删除危险品定义
- 响应体：void

---

## 4. 请求/响应示例

### 创建商品请求

```json
{
  "sku": "SKU-001",
  "description": "Test Item",
  "shortDescription": "Test",
  "type": "MATERIAL",
  "customerId": "customer-001",
  "brandId": "brand-001",
  "barcodeInfo": {
    "eanCode": "1234567890123",
    "upcCode": "123456789012"
  },
  "serialNumberConfig": {
    "hasSerialNumber": true,
    "requireCollectSnOnReceive": true,
    "serialNoLength": 20
  },
  "lotConfig": {
    "hasLotNo": true,
    "requireCollectLotNoOnReceive": true,
    "shelfLifeDays": 365
  }
}
```

### 商品详情响应

```json
{
  "id": "item-001",
  "sku": "SKU-001",
  "description": "Test Item",
  "type": "MATERIAL",
  "status": "ENABLED",
  "customerId": "customer-001",
  "isHazardous": true,
  "hazardId": 1001,
  "hazardInfo": {
    "id": 1001,
    "hazardCode": "UN1203",
    "hazardName": "Gasoline",
    "hazardClass": "3",
    "packingGroup": "II"
  },
  "barcodeInfo": {
    "eanCode": "1234567890123",
    "upcCode": "123456789012"
  },
  "properties": [
    {"id": "prop-001", "name": "Color", "type": "SELECT", "value": "Red"}
  ],
  "uoms": [
    {"id": "uom-001", "name": "EA", "baseQty": 1, "isBaseUom": true, "isDefaultUom": true}
  ],
  "createdTime": "2026-01-01T00:00:00",
  "updatedTime": "2026-01-01T00:00:00"
}
```

### 创建危险品定义请求

```json
{
  "hazardCode": "UN1203",
  "hazardName": "Gasoline",
  "properShippingName": "GASOLINE",
  "hazardClass": "3",
  "packingGroup": "II",
  "description": "Flammable liquid"
}
```

### 危险品定义响应

```json
{
  "id": 1001,
  "hazardCode": "UN1203",
  "hazardName": "Gasoline",
  "properShippingName": "GASOLINE",
  "hazardClass": "3",
  "packingGroup": "II",
  "description": "Flammable liquid",
  "createdTime": "2026-01-01T00:00:00",
  "updatedTime": "2026-01-01T00:00:00"
}
```

---

## 5. 领域对象映射

### Entity - PO 映射

Item - MdmItemPO
- ItemId.value -> id
- TenantId.value -> tenantId
- Sku.value -> sku
- BarcodeInfo.eanCode -> eanCode
- BarcodeInfo.upcCode -> upcCode
- SerialNumberConfig.* -> hasSerialNumber, requireCollectSnOnReceive, ...
- LotConfig.* -> hasLotNo, requireCollectLotNoOnReceive, ...
- Converter: ItemConverter

ItemProperty - MdmItemPropertyPO
- ItemPropertyId.value -> id
- ItemId.value -> itemId
- PropertyName.value -> name
- PropertyValue.value -> value
- Converter: ItemPropertyConverter

ItemUom - MdmItemUomPO
- ItemUomId.value -> id
- ItemId.value -> itemId
- Dimension.* -> length, width, height, weight, volume, ...
- Pricing.* -> price, insurancePrice, currency
- Converter: ItemUomConverter

ItemKitting - MdmItemKittingPO
- ItemKittingId.value -> id
- ItemId.value -> itemId
- Quantity.value -> qty
- Converter: ItemKittingConverter

PalletConfig - MdmPalletConfigPO
- PalletConfigId.value -> id
- ItemId.value -> itemId
- CarrierId.value -> carrierId
- Converter: PalletConfigConverter

ItemHazard - MdmItemHazardPO
- ItemHazardId.value -> id
- Converter: ItemHazardConverter

Industry - MdmIndustryPO
- IndustryId.value -> id
- TenantId.value -> tenantId
- IsolationId.value -> isolationId
- IndustryCode.value -> code
- name -> name
- description -> description
- AuditInfo.* -> createdTime, createdBy, updatedTime, updatedBy
- Converter: IndustryConverter

IndustryPropertyTemplate - MdmIndustryPropertyTemplatePO
- IndustryPropertyTemplateId.value -> id
- TenantId.value -> tenantId
- IsolationId.value -> isolationId
- IndustryId.value -> industryId
- PropertyName.value -> name
- PropertyType.name() -> type
- isRequired -> isRequired
- options -> options (JSON)
- uom -> uom
- AuditInfo.* -> createdTime, createdBy, updatedTime, updatedBy
- Converter: IndustryPropertyTemplateConverter

HazardDefinition - MdmHazardDefinitionPO
- HazardDefinitionId.value -> id
- TenantId.value -> tenantId
- IsolationId.value -> isolationId
- hazardCode -> hazardCode
- hazardName -> hazardName
- properShippingName -> properShippingName
- hazardClass -> hazardClass
- packingGroup -> packingGroup
- description -> description
- AuditInfo.* -> createdTime, createdBy, updatedTime, updatedBy
- Converter: HazardDefinitionConverter

### DTO - Entity 映射

CreateItemRequest -> CreateItemCommand -> Item
- Assembler: ItemAssembler.toCommand()

Item -> ItemResponse
- Assembler: ItemAssembler.toResponse()

Item + Properties + Uoms -> ItemDetailResponse
- Assembler: ItemAssembler.toDetailResponse()

---

## 6. 错误处理

### 错误码设计

商品错误码（MDM-ITEM-xxx）：
- MDM-ITEM-001 - 商品不存在 - 404
- MDM-ITEM-002 - SKU 重复 - 400
- MDM-ITEM-003 - 商品类型无效 - 400
- MDM-ITEM-004 - 商品有关联库存 - 400
- MDM-ITEM-005 - 商品有未完成订单 - 400
- MDM-ITEM-006 - 包装材料格式无效（应为 ITEM-xxx） - 400
- MDM-ITEM-007 - 包装材料引用的商品不存在 - 400
- MDM-ITEM-008 - 包装材料引用的商品类型不是 MATERIAL - 400
- MDM-ITEM-009 - 客户引用的组织不存在 - 400
- MDM-ITEM-010 - 客户引用的组织 tags 不包含 CUSTOMER - 400
- MDM-ITEM-011 - 品牌引用的组织不存在 - 400
- MDM-ITEM-012 - 品牌引用的组织 tags 不包含 BRAND - 400

条码错误码（MDM-BARCODE-xxx）：
- MDM-BARCODE-001 - 条码不存在 - 404
- MDM-BARCODE-002 - 条码重复 - 400
- MDM-BARCODE-003 - EAN 码格式无效 - 400
- MDM-BARCODE-004 - UPC 码格式无效 - 400

序列号错误码（MDM-SN-xxx）：
- MDM-SN-001 - 序列号未启用 - 400
- MDM-SN-002 - 序列号长度无效 - 400
- MDM-SN-003 - 序列号验证规则无效 - 400

批次错误码（MDM-LOT-xxx）：
- MDM-LOT-001 - 批次号未启用 - 400

属性错误码（MDM-PROP-xxx）：
- MDM-PROP-001 - 属性名称重复 - 400
- MDM-PROP-002 - 属性值无效 - 400
- MDM-PROP-003 - 必填属性缺失 - 400

单位错误码（MDM-UOM-xxx）：
- MDM-UOM-001 - 基本单位已存在 - 400
- MDM-UOM-002 - 基本数量无效 - 400
- MDM-UOM-003 - 不能删除基本单位 - 400

套装错误码（MDM-KIT-xxx）：
- MDM-KIT-001 - 不能添加自身为组件 - 400
- MDM-KIT-002 - 组件数量无效 - 400
- MDM-KIT-003 - 套装没有组件 - 400

托盘错误码（MDM-PALLET-xxx）：
- MDM-PALLET-001 - TI/HI 值无效 - 400

行业错误码（MDM-INDUSTRY-xxx）：
- MDM-INDUSTRY-001 - 行业不存在 - 404
- MDM-INDUSTRY-002 - 行业代码重复 - 400
- MDM-INDUSTRY-003 - 行业代码无效 - 400
- MDM-INDUSTRY-004 - 行业有关联商品 - 400

行业属性模板错误码（MDM-TEMPLATE-xxx）：
- MDM-TEMPLATE-001 - 属性模板不存在 - 404
- MDM-TEMPLATE-002 - 属性模板名称重复 - 400
- MDM-TEMPLATE-003 - 属性类型无效 - 400
- MDM-TEMPLATE-004 - SELECT 类型缺少选项 - 400

危险品定义错误码（MDM-HAZARD-xxx）：
- MDM-HAZARD-001 - 危险品定义不存在 - 404
- MDM-HAZARD-002 - 危险品 ID 重复 - 400
- MDM-HAZARD-003 - 危险品名称必填 - 400
- MDM-HAZARD-004 - 危险品分类必填 - 400
- MDM-HAZARD-005 - 危险品有关联商品 - 400

### 异常类设计

ItemNotFoundException - 商品不存在
ItemDuplicateException - SKU/条码重复
ItemValidationException - 商品验证失败
ItemDeletionException - 商品删除失败
PackagingMaterialValidationException - 包装材料验证失败（格式无效、商品不存在、类型不是 MATERIAL）
CustomerValidationException - 客户验证失败（组织不存在、tags 不包含 CUSTOMER）
BrandValidationException - 品牌验证失败（组织不存在、tags 不包含 BRAND）
PropertyValidationException - 属性验证失败
UomValidationException - 单位验证失败
KittingValidationException - 套装验证失败
PalletConfigValidationException - 托盘配置验证失败
IndustryNotFoundException - 行业不存在
IndustryDuplicateException - 行业代码重复
IndustryDeletionException - 行业删除失败（有关联商品）
IndustryPropertyTemplateNotFoundException - 属性模板不存在
IndustryPropertyTemplateValidationException - 属性模板验证失败
HazardDefinitionNotFoundException - 危险品定义不存在
HazardDefinitionDuplicateException - 危险品代码重复
HazardDefinitionValidationException - 危险品定义验证失败
HazardDefinitionDeletionException - 危险品定义删除失败（有关联商品）

---

## 7. 安全设计

### 权限控制

商品管理权限：
- item:create - 创建商品
- item:update - 更新商品
- item:delete - 删除商品
- item:view - 查看商品
- item:enable - 启用商品
- item:disable - 禁用商品

属性管理权限：
- item:property:create - 添加属性
- item:property:update - 更新属性
- item:property:delete - 删除属性

单位管理权限：
- item:uom:create - 添加单位
- item:uom:update - 更新单位
- item:uom:delete - 删除单位

行业管理权限：
- industry:create - 创建行业
- industry:update - 更新行业
- industry:delete - 删除行业
- industry:view - 查看行业

行业属性模板管理权限：
- industry:template:create - 添加属性模板
- industry:template:update - 更新属性模板
- industry:template:delete - 删除属性模板

危险品定义管理权限：
- hazard:create - 创建危险品定义
- hazard:update - 更新危险品定义
- hazard:delete - 删除危险品定义
- hazard:view - 查看危险品定义

### 数据权限

- 所有数据按 tenantId 隔离
- 查询时自动添加 tenantId 条件
- 使用 ThreadLocal 存储当前租户信息

---

## 8. 性能考虑

### 缓存策略

商品详情缓存：
- 数据：商品基础信息
- 缓存位置：Redis
- TTL：30 分钟
- 说明：更新时清除缓存

条码索引缓存：
- 数据：条码 -> 商品 ID 映射
- 缓存位置：Redis
- TTL：1 小时
- 说明：条码识别高频场景

### 批量处理

- 批量创建商品：支持一次创建多个商品
- 批量更新状态：支持批量启用/禁用
- 批量导入：支持 Excel 导入商品

### 异步处理

- 领域事件异步发布
- 大批量导入异步处理
- 缓存预热异步执行

---

## 9. 商品导入功能设计

### 9.1 导入 API

[重要] 采用前端直传方案，模板下载和文件上传由 file-app 提供

#### file-app API（前端直接调用）

下载导入模板
- 方法：GET
- 路径：/file/template/item-import
- 说明：下载商品导入 Excel 模板
- 响应：Excel 文件流（item-import.xlsx）
- 备注：file-app 新增接口

上传导入文件
- 方法：POST
- 路径：/file/upload
- 说明：上传 Excel 文件
- 参数：file, bucket=mdm-import, objectType=ITEM_IMPORT
- 响应体：FilePreviewDto（包含 id, filename, previewUrl）
- 备注：file-app 现有接口

#### mdm-app API

解析预览
- 方法：POST
- 路径：/api/v1/items/import/preview
- 说明：根据 fileId 解析 Excel 并返回预览数据
- 请求体：{ fileId: Long }
- 响应体：ImportPreviewResponse（包含列头、前 N 行数据、自动映射建议）

执行导入
- 方法：POST
- 路径：/api/v1/items/import/execute
- 说明：执行批量导入
- 请求体：ImportExecuteRequest（包含 fileId、字段映射配置）
- 响应体：ImportResultResponse

查询导入历史
- 方法：GET
- 路径：/api/v1/items/import/history
- 说明：查询导入历史记录
- 参数：page, size
- 响应体：PageResponse<ImportHistoryResponse>

### 9.2 文件存储方案（方案 C：前端直传）

[重要] 采用前端直传方案，前端直接调用 file-app 上传文件，mdm-app 通过 fileId 获取文件

#### 调用流程

1. 下载模板
   - 前端调用：GET /file/template/item-import
   - file-app 返回模板文件流

2. 上传导入文件
   - 前端调用：POST /file/upload?bucket=mdm-import&objectType=ITEM_IMPORT
   - file-app 返回：FilePreviewDto（包含 id, filename, previewUrl）

3. 执行导入
   - 前端调用：POST /api/v1/items/import/execute
   - 请求体：{ fileId: 123, fieldMapping: {...} }
   - mdm-app 通过 Feign Client 调用 file-app 下载文件
   - 解析 Excel 并执行导入

4. 清理临时文件
   - 导入完成后，mdm-app 调用 file-app 删除临时文件
   - 或由 file-app 定时任务清理过期文件

#### file-app 需要调整

1. 新增模板目录
   - 路径：file-app/src/main/resources/templates/
   - 文件：item-import.xlsx（商品导入模板）

2. 新增模板下载 API
   - 路径：GET /file/template/{templateName}
   - 说明：下载指定名称的模板文件
   - 实现：从 classpath:templates/{templateName}.xlsx 读取并返回

3. 新增 Bucket 配置
   - Bucket 名称：mdm-import
   - 用途：存储导入临时文件
   - 清理策略：7 天自动清理

4. 新增 FileClient Feign 接口（common 模块）

```java
// common/src/main/java/com/t5/file/FileClient.java
@FeignClient(name = "file-app", contextId = "file-app-FileClient")
public interface FileClient {
    
    @GetMapping("/file/{id}")
    Response download(@PathVariable("id") Long id);
    
    @DeleteMapping("/file/{id}")
    R<Void> deleteFile(@PathVariable("id") Long id);
    
    @GetMapping("/file/{id}/info")
    R<FileDto> getFileInfo(@PathVariable("id") Long id);
}
```

#### 模板文件存储

- 存储位置：file-app/src/main/resources/templates/item-import.xlsx
- 下载地址：GET /file/template/item-import
- 版本管理：随 file-app 版本更新

#### 导入文件临时存储

- Bucket：mdm-import
- objectType：ITEM_IMPORT
- 清理策略：file-app 定时任务每天凌晨 2:00 清理 7 天前的文件

#### 导入结果文件

- Bucket：mdm-import
- objectType：ITEM_IMPORT_RESULT
- 保留策略：30 天

---

### 9.3 涉及文件清单

#### file-app 模块（需要调整）

1. 新增模板文件
   - file-app/src/main/resources/templates/item-import.xlsx

2. 新增模板下载 Controller
   - file-app/src/main/java/com/t5/file/interfaces/rest/template/TemplateController.java

3. 配置 Bucket 清理策略
   - file-app/src/main/java/com/t5/file/infrastructure/config/FileStorageProperties.java

#### common 模块（需要新增）

1. FileClient Feign 接口
   - common/src/main/java/com/t5/file/FileClient.java

#### mdm-app 模块（需要新增）

1. 导入 Controller
   - mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/ItemImportController.java

2. 导入应用服务
   - mdm-app/src/main/java/com/t5/mdm/application/itemmaster/service/ItemImportApplicationService.java

3. 导入相关 DTO
   - mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/dto/ImportPreviewResponse.java
   - mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/dto/ImportExecuteRequest.java
   - mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/dto/ImportResultResponse.java
   - mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/dto/ImportHistoryResponse.java

4. 导入历史表（可选）
   - mdm_item_import_history（记录导入历史）

### 9.4 配置项

```yaml
# application.yml
mdm:
  import:
    # 临时文件保留天数
    temp-file-retention-days: 7
    # 结果文件保留天数
    result-file-retention-days: 30
    # 单次导入最大行数
    max-rows: 5000
    # 单次导入最大文件大小（MB）
    max-file-size: 10
    # 批量插入每批数量
    batch-size: 100
```

### 9.5 定时清理任务

```java
/**
 * 导入临时文件清理任务
 * 每天凌晨 2:00 执行
 */
@Scheduled(cron = "0 0 2 * * ?")
public void cleanupTempFiles() {
    // 1. 查询 mdm-import-temp bucket 下超过 retention-days 的文件
    // 2. 调用 StorageAdapter.delete() 删除文件
    // 3. 记录清理日志
}
```

### 9.6 导入流程

1. 下载模板
   - 前端调用 file-app：GET /file/template/item-import
   - 返回 Excel 模板文件

2. 上传文件
   - 前端调用 file-app：POST /file/upload?bucket=mdm-import&objectType=ITEM_IMPORT
   - 返回 FilePreviewDto（包含 fileId）

3. 解析预览
   - 前端调用 mdm-app：POST /api/v1/items/import/preview { fileId }
   - mdm-app 通过 FileClient 下载文件
   - 解析 Excel 获取列头和前 N 行数据
   - 执行字段自动匹配（见 9.8 字段匹配规则）
   - 返回预览数据和自动匹配的字段映射

4. 调整映射
   - 前端展示预览数据
   - 用户调整字段映射关系

5. 执行导入
   - 前端调用 mdm-app：POST /api/v1/items/import/execute { fileId, fieldMapping }
   - mdm-app 分批处理数据（每批 100 条）
   - 使用事务保证单批数据一致性
   - 记录导入结果（成功/失败明细）

6. 返回结果
   - 返回导入统计（成功数、失败数）
   - 提供失败明细

7. 清理文件
   - 导入完成后，mdm-app 调用 FileClient 删除临时文件
   - 或由 file-app 定时任务清理过期文件

### 9.7 导入错误码

导入错误码（MDM-IMPORT-xxx）：
- MDM-IMPORT-001 - 文件格式不支持（仅支持 xlsx/xls） - 400
- MDM-IMPORT-002 - 文件大小超限 - 400
- MDM-IMPORT-003 - 数据行数超限 - 400
- MDM-IMPORT-004 - 必填字段未映射 - 400
- MDM-IMPORT-005 - 字段映射无效 - 400
- MDM-IMPORT-006 - 数据校验失败 - 400
- MDM-IMPORT-007 - SKU 重复（文件内） - 400
- MDM-IMPORT-008 - SKU 已存在（数据库） - 400
- MDM-IMPORT-009 - 关联数据不存在（客户/品牌/行业/危险品） - 400
- MDM-IMPORT-010 - 条码格式无效 - 400
- MDM-IMPORT-011 - 条码已存在 - 400
- MDM-IMPORT-012 - 导入任务不存在 - 404

### 9.8 字段自动匹配规则

#### 匹配时机

在 mdm-app 的 /api/v1/items/import/preview 接口中执行

#### 匹配策略（优先级从高到低）

1. 精确匹配（EXACT）
   - Excel 列名 == 系统字段名（忽略大小写）
   - 示例：Excel 列名 "sku" 匹配系统字段 "sku"

2. 别名匹配（ALIAS）
   - Excel 列名 == 系统字段别名
   - 示例：Excel 列名 "Item Code" 匹配系统字段 "sku"

3. 中文名匹配（CHINESE）
   - Excel 列名 == 系统字段中文名
   - 示例：Excel 列名 "商品编码" 匹配系统字段 "sku"

4. 模糊匹配（FUZZY）
   - Excel 列名包含系统字段关键字
   - 示例：Excel 列名 "SKU编码" 匹配系统字段 "sku"

5. 未匹配（NONE）
   - 无法匹配的列标记为 "-- 不导入 --"

#### 字段定义结构

```java
public class ImportFieldDefinition {
    String fieldName;      // 系统字段名：sku
    String chineseName;    // 中文名：SKU
    List<String> aliases;  // 别名：["Item Code", "itemID", "商品编码"]
    boolean required;      // 是否必填
    String group;          // 分组：ITEM_BASIC, BASE_UOM, INNER_UOM, CASE_UOM
}
```

#### 预览响应结构

```json
{
  "fileId": 123,
  "totalRows": 100,
  "columns": [
    { "index": 0, "name": "Item Code" },
    { "index": 1, "name": "描述" },
    { "index": 2, "name": "Base_UOM" }
  ],
  "previewData": [
    ["SKU-001", "商品A", "EA"],
    ["SKU-002", "商品B", "PCS"]
  ],
  "fieldMapping": {
    "sku": { "columnIndex": 0, "columnName": "Item Code", "matchType": "ALIAS" },
    "description": { "columnIndex": 1, "columnName": "描述", "matchType": "CHINESE" },
    "baseUom_name": { "columnIndex": 2, "columnName": "Base_UOM", "matchType": "EXACT" }
  },
  "unmappedColumns": [3, 5, 7],
  "unmappedRequiredFields": []
}
```

#### 前端展示逻辑

- 已匹配字段：下拉框默认选中匹配的列
- 未匹配字段：下拉框显示 "-- 请选择 --"
- 必填未匹配：红色提示，阻止提交

#### 字段别名配置（部分示例）

sku 字段别名：
- Item Code, itemID, itemCode, 商品编码, SKU编码, 物料编码

description 字段别名：
- itemDescription, Item Description, 商品描述, 描述, 名称

baseUom_name 字段别名：
- Base_UOM, baseUom, Base UOM, 基本单位, 单位

[注意] 完整字段别名配置见 11-import-template-spec.md 的"与旧模板字段对照"章节

### 9.9 导入执行逻辑

#### 整体流程

```
POST /api/v1/items/import/execute { fileId, fieldMapping }
    |
    v
1. 参数校验
2. 下载 Excel 文件
3. 解析全部数据行
4. 数据校验（逐行）
5. 分批入库（每批 100 条）
6. 汇总结果
7. 清理临时文件
8. 返回结果
```

#### 步骤 1：参数校验

- 校验 fileId 是否存在
- 校验 fieldMapping 是否包含必填字段（sku, baseUom_name）
- 校验 fieldMapping 格式是否正确

#### 步骤 2：下载 Excel 文件

- 通过 FileClient 调用 file-app
- GET /file/{fileId}
- 获取 InputStream

#### 步骤 3：解析全部数据行

- 使用 EasyExcel 解析
- 根据 fieldMapping 提取每行数据
- 转换为 ImportRowData 对象列表

#### 步骤 4：数据校验（逐行）

必填校验：
- sku 不能为空
- baseUom_name 不能为空

格式校验：
- eanCode：13 位数字
- upcCode：12 位数字
- type：MATERIAL 或 PRODUCT
- status：ENABLED 或 DISABLED
- 布尔字段：true/false/1/0/是/否

唯一性校验（文件内）：
- sku 不能重复
- eanCode/upcCode 不能重复

唯一性校验（数据库）：
- sku 不能与已有商品重复
- eanCode/upcCode 不能与已有商品重复

关联校验：
- customerId：组织存在且 tags 包含 CUSTOMER
- brandId：组织存在且 tags 包含 BRAND
- industryId：行业存在
- hazardId：危险品定义存在

校验结果：
- 通过：标记为 VALID
- 失败：标记为 INVALID，记录失败原因

#### 步骤 5：分批入库

```
伪代码：
validRows = filter(rows, status == VALID)
batches = split(validRows, batchSize=100)

successCount = 0
failedRows = []

for batch in batches:
    try:
        beginTransaction()
        for row in batch:
            // 创建 Item
            item = createItem(row)
            itemRepository.save(item)
            
            // 创建 Base UOM
            baseUom = createUom(row.baseUom, item.id, isBase=true)
            uomRepository.save(baseUom)
            
            // 创建 Inner UOM（如果有）
            if row.hasInnerUom:
                innerUom = createUom(row.innerUom, item.id, isBase=false)
                uomRepository.save(innerUom)
            
            // 创建 Case UOM（如果有）
            if row.hasCaseUom:
                caseUom = createUom(row.caseUom, item.id, isBase=false)
                uomRepository.save(caseUom)
        
        commitTransaction()
        successCount += batch.size
    catch Exception:
        rollbackTransaction()
        // 单批失败，记录失败行
        for row in batch:
            failedRows.add(row, "批次入库失败")
```

[注意] 单批事务失败不影响其他批次

#### 步骤 6：汇总结果

```java
ImportResultResponse {
    int totalRows;           // 总行数
    int successCount;        // 成功数
    int failedCount;         // 失败数
    List<FailedRow> failedRows;  // 失败明细
}

FailedRow {
    int rowNumber;           // 行号
    String sku;              // SKU（如果有）
    String errorCode;        // 错误码
    String errorMessage;     // 错误信息
}
```

#### 步骤 7：清理临时文件

- 调用 FileClient 删除临时文件
- DELETE /file/{fileId}

#### 步骤 8：返回结果

```json
{
  "totalRows": 100,
  "successCount": 95,
  "failedCount": 5,
  "failedRows": [
    { "rowNumber": 3, "sku": "SKU-003", "errorCode": "MDM-IMPORT-008", "errorMessage": "SKU已存在" },
    { "rowNumber": 15, "sku": "", "errorCode": "MDM-IMPORT-006", "errorMessage": "SKU为必填字段" },
    { "rowNumber": 28, "sku": "SKU-028", "errorCode": "MDM-IMPORT-010", "errorMessage": "EAN码格式无效" }
  ]
}
```
