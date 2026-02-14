# MDM Item 领域 - API 测试用例

## 概述

本文档定义了 Item 领域的 API 测试用例，覆盖所有 REST 接口。

---

## 1. 商品 API 测试

### API-001: 创建商品 - 正常流程

**关联需求**：需求 1
**API**：POST /api/v1/items
**测试类型**：正常

**请求**：
```json
{
  "sku": "TEST-API-001",
  "description": "API Test Item",
  "type": "MATERIAL",
  "customerId": "customer-001"
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含 id, sku, description, type, status

**验证点**：
- 返回的 id 不为空
- status 为 DRAFT
- sku 与请求一致

---

### API-002: 创建商品 - SKU 重复

**关联需求**：需求 1
**API**：POST /api/v1/items
**测试类型**：异常

**请求**：
```json
{
  "sku": "EXISTING-SKU",
  "description": "Duplicate SKU Item",
  "type": "MATERIAL"
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-ITEM-002
- 消息包含 SKU 重复提示

---

### API-003: 创建商品 - 类型无效

**关联需求**：需求 1
**API**：POST /api/v1/items
**测试类型**：异常

**请求**：
```json
{
  "sku": "TEST-API-003",
  "description": "Invalid Type Item",
  "type": "INVALID"
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-ITEM-003


---

### API-004: 查询商品详情 - 正常流程

**关联需求**：需求 3
**API**：GET /api/v1/items/{id}
**测试类型**：正常

**请求**：
- id: existing-item-id

**预期响应**：
- HTTP 状态码：200
- 响应体包含完整商品信息

**验证点**：
- 返回的 id 与请求一致
- 包含 properties 数组
- 包含 uoms 数组

---

### API-005: 查询商品详情 - 商品不存在

**关联需求**：需求 3
**API**：GET /api/v1/items/{id}
**测试类型**：异常

**请求**：
- id: non-existing-id

**预期响应**：
- HTTP 状态码：404
- 错误码：MDM-ITEM-001

---

### API-006: 查询商品列表 - 分页查询

**关联需求**：需求 3
**API**：GET /api/v1/items?page=0&size=10
**测试类型**：正常

**请求**：
- page: 0
- size: 10

**预期响应**：
- HTTP 状态码：200
- 响应体包含 content, totalElements, totalPages, number, size

**验证点**：
- content 数组长度 <= 10
- 分页信息正确

---

### API-007: 查询商品列表 - 按 SKU 搜索

**关联需求**：需求 3
**API**：GET /api/v1/items?sku=TEST
**测试类型**：正常

**请求**：
- sku: TEST

**预期响应**：
- HTTP 状态码：200
- 响应体中所有商品的 SKU 包含 "TEST"

---

### API-008: 删除商品 - 正常流程

**关联需求**：需求 4
**API**：DELETE /api/v1/items/{id}
**测试类型**：正常

**请求**：
- id: deletable-item-id

**预期响应**：
- HTTP 状态码：204

**验证点**：
- 再次查询该商品返回 404


---

### API-009: 删除商品 - 有关联库存

**关联需求**：需求 4
**API**：DELETE /api/v1/items/{id}
**测试类型**：异常

**请求**：
- id: item-with-inventory-id

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-ITEM-004

---

### API-010: 启用商品 - 正常流程

**关联需求**：需求 5
**API**：POST /api/v1/items/{id}/enable
**测试类型**：正常

**请求**：
- id: draft-item-id

**预期响应**：
- HTTP 状态码：200

**验证点**：
- 查询商品状态为 ENABLED

---

### API-011: 禁用商品 - 正常流程

**关联需求**：需求 5
**API**：POST /api/v1/items/{id}/disable
**测试类型**：正常

**请求**：
- id: enabled-item-id

**预期响应**：
- HTTP 状态码：200

**验证点**：
- 查询商品状态为 DISABLED

---

### API-012: 条码识别 - 正常流程

**关联需求**：需求 6
**API**：GET /api/v1/items/barcode/{barcode}
**测试类型**：正常

**请求**：
- barcode: 1234567890123

**预期响应**：
- HTTP 状态码：200
- 响应体包含商品信息

**验证点**：
- 返回的商品 eanCode 或 upcCode 与请求条码匹配

---

### API-013: 条码识别 - 条码不存在

**关联需求**：需求 6
**API**：GET /api/v1/items/barcode/{barcode}
**测试类型**：异常

**请求**：
- barcode: 9999999999999

**预期响应**：
- HTTP 状态码：404
- 错误码：MDM-BARCODE-001


---

## 2. 属性 API 测试

### API-014: 添加属性 - 正常流程

**关联需求**：需求 10
**API**：POST /api/v1/items/{itemId}/properties
**测试类型**：正常

**请求**：
```json
{
  "name": "Color",
  "type": "SELECT",
  "options": ["Red", "Blue", "Green"],
  "value": "Red",
  "isRequired": true
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含属性信息

**验证点**：
- 返回的 name 为 "Color"
- type 为 "SELECT"

---

### API-015: 添加属性 - 名称重复

**关联需求**：需求 10
**API**：POST /api/v1/items/{itemId}/properties
**测试类型**：异常

**请求**：
```json
{
  "name": "ExistingProperty",
  "type": "TEXT",
  "value": "test"
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-PROP-001

---

### API-016: 更新属性值 - SELECT 类型值无效

**关联需求**：需求 10
**API**：PUT /api/v1/items/{itemId}/properties/{propertyId}
**测试类型**：异常

**请求**：
```json
{
  "value": "Yellow"
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-PROP-002

---

## 3. 单位 API 测试

### API-017: 添加基本单位 - 正常流程

**关联需求**：需求 11
**API**：POST /api/v1/items/{itemId}/uoms
**测试类型**：正常

**请求**：
```json
{
  "name": "EA",
  "isBaseUom": true
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含 id, name, isBaseUom, baseQty

**验证点**：
- isBaseUom 为 true
- baseQty 为 1


---

### API-018: 添加基本单位 - 已存在基本单位

**关联需求**：需求 11
**API**：POST /api/v1/items/{itemId}/uoms
**测试类型**：异常

**请求**：
```json
{
  "name": "PC",
  "isBaseUom": true
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-UOM-001

---

### API-019: 添加非基本单位 - baseQty 无效

**关联需求**：需求 11
**API**：POST /api/v1/items/{itemId}/uoms
**测试类型**：异常

**请求**：
```json
{
  "name": "BOX",
  "isBaseUom": false,
  "baseQty": 0
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-UOM-002

---

### API-020: 设置默认单位 - 正常流程

**关联需求**：需求 11
**API**：POST /api/v1/items/{itemId}/uoms/{uomId}/default
**测试类型**：正常

**请求**：
- itemId: item-001
- uomId: uom-002

**预期响应**：
- HTTP 状态码：200

**验证点**：
- 查询单位列表，uom-002 的 isDefaultUom 为 true
- 其他单位的 isDefaultUom 为 false

---

## 4. 套装 API 测试

### API-021: 添加组件 - 正常流程

**关联需求**：需求 12
**API**：POST /api/v1/items/{itemId}/kitting/components
**测试类型**：正常

**请求**：
```json
{
  "componentItemId": "component-item-001",
  "qty": 2
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含组件信息

**验证点**：
- componentItemId 正确
- qty 为 2


---

### API-022: 添加组件 - 自引用

**关联需求**：需求 12
**API**：POST /api/v1/items/{itemId}/kitting/components
**测试类型**：异常

**请求**：
```json
{
  "componentItemId": "kit-item-001",
  "qty": 1
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-KIT-001

---

### API-023: 添加组件 - 数量无效

**关联需求**：需求 12
**API**：POST /api/v1/items/{itemId}/kitting/components
**测试类型**：异常

**请求**：
```json
{
  "componentItemId": "component-item-001",
  "qty": 0
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-KIT-002

---

## 5. 托盘配置 API 测试

### API-024: 添加托盘配置 - 正常流程

**关联需求**：需求 18
**API**：POST /api/v1/items/{itemId}/pallet-configs
**测试类型**：正常

**请求**：
```json
{
  "name": "Standard Config",
  "uomId": "uom-001",
  "ti": 4,
  "hi": 5,
  "isDefault": true
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含配置信息

**验证点**：
- uomId 为 "uom-001"
- ti 为 4
- hi 为 5
- isDefault 为 true

---

### API-025: 添加托盘配置 - TI/HI 无效

**关联需求**：需求 18
**API**：POST /api/v1/items/{itemId}/pallet-configs
**测试类型**：异常

**请求**：
```json
{
  "name": "Invalid Config",
  "uomId": "uom-001",
  "ti": 0,
  "hi": 5
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-PALLET-001

---

### API-026: 添加托盘配置 - uomId 无效

**关联需求**：需求 18
**API**：POST /api/v1/items/{itemId}/pallet-configs
**测试类型**：异常

**请求**：
```json
{
  "name": "Invalid UOM Config",
  "uomId": "non-existing-uom",
  "ti": 4,
  "hi": 5
}
```

**预期响应**：
- HTTP 状态码：400
- 错误码：MDM-PALLET-002
- 消息包含 "UOM not found for this item"

---

### API-027: 添加托盘配置 - 带零售商和承运商

**关联需求**：需求 18
**API**：POST /api/v1/items/{itemId}/pallet-configs
**测试类型**：正常

**请求**：
```json
{
  "name": "Retailer Config",
  "uomId": "uom-001",
  "retailerId": "org-retailer-001",
  "carrierId": "carrier-001",
  "scene": "出库",
  "ti": 6,
  "hi": 4,
  "isDefault": false
}
```

**预期响应**：
- HTTP 状态码：201
- 响应体包含配置信息

**验证点**：
- retailerId 为 "org-retailer-001"（必须是 tag 为 RETAILER 的组织）
- carrierId 为 "carrier-001"
- scene 为 "出库"