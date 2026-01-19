# MDM Item 导入模板规格

## 模板文件

文件名：item-template.xlsx
Sheet：Item（73 列） + PalletConfig（10 列）

---

## 字段分组

### 1. Item 基础信息 (列 1-15)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 1 | sku | SKU | 是 | 商品唯一标识，同一租户下不可重复 |
| 2 | description | 描述 | 否 | 商品完整描述 |
| 3 | shortDescription | 简短描述 | 否 | 商品简短描述 |
| 4 | abbreviation | 缩写 | 否 | 商品缩写名称 |
| 5 | customerId | 客户ID | 否 | 关联的客户组织ID |
| 6 | brandId | 品牌ID | 否 | 关联的品牌组织ID |
| 7 | industryId | 行业ID | 否 | 关联的行业ID |
| 8 | type | 类型 | 否 | MATERIAL(物料) 或 PRODUCT(产品)，默认 PRODUCT |
| 9 | status | 状态 | 否 | ENABLED(启用) 或 DISABLED(禁用)，默认 ENABLED |
| 10 | grade | 等级 | 否 | 商品等级 |
| 11 | nmfc | NMFC | 否 | 国家汽车货运分类代码 |
| 12 | commodityCode | 商品代码 | 否 | 商品分类代码 |
| 13 | countryOfOrigin | 原产国 | 否 | 商品原产国代码 |
| 14 | packagingMaterial | 包装材料 | 否 | 包装材料商品ID，格式 ITEM-xxx |
| 15 | tags | 标签 | 否 | 商品标签，多个用逗号分隔 |

### 2. 条码信息 (列 16-19)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 16 | eanCode | EAN码 | 否 | 欧洲商品编码，13位数字 |
| 17 | upcCode | UPC码 | 否 | 通用产品代码，12位数字 |
| 18 | caseUpcCode | 箱装UPC码 | 否 | 箱装商品UPC码 |
| 19 | isbnCode | ISBN码 | 否 | 国际标准书号 |

### 3. 序列号配置 (列 20-23)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 20 | hasSerialNumber | 是否有序列号 | 否 | true/false，默认 false |
| 21 | serialNoLength | 序列号长度 | 否 | 序列号长度限制 |
| 22 | requireCollectSnOnReceive | 收货时收集序列号 | 否 | true/false |
| 23 | requireCollectSnOnShipping | 发货时收集序列号 | 否 | true/false |

### 4. 批次配置 (列 24-29)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 24 | hasLotNo | 是否有批次号 | 否 | true/false，默认 false |
| 25 | requireCollectLotNoOnReceive | 收货时收集批次号 | 否 | true/false |
| 26 | requireCollectLotNoOnShipping | 发货时收集批次号 | 否 | true/false |
| 27 | requireCollectExpirationDateOnReceive | 收货时收集过期日期 | 否 | true/false |
| 28 | requireCollectMfgDateOnReceive | 收货时收集生产日期 | 否 | true/false |
| 29 | shelfLifeDays | 保质期天数 | 否 | 商品保质期天数 |

### 5. 发货配置 (列 30-31)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 30 | shippingRule | 发货规则 | 否 | 发货规则类型 |
| 31 | shipAllowDays | 允许发货天数 | 否 | 距过期日期允许发货的天数 |

### 6. 危险品配置 (列 32-33)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 32 | isHazardous | 是否危险品 | 否 | true/false，默认 false |
| 33 | hazardId | 危险品ID | 否 | 关联的危险品定义ID |

### 7. 套装配置 (列 34-35)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 34 | isKitting | 是否套装 | 否 | true/false，默认 false |
| 35 | kitItemFulfillBy | 套装履行方式 | 否 | 套装商品的履行方式 |

### 8. 基本单位 Base UOM (列 36-47)

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 36 | baseUom_name | 单位名称 | 是 | 基本单位名称，如 EA、PCS |
| 37 | baseUom_isDefault | 是否默认单位 | 否 | true/false |
| 38 | baseUom_length | 长度 | 否 | 单位长度 |
| 39 | baseUom_width | 宽度 | 否 | 单位宽度 |
| 40 | baseUom_height | 高度 | 否 | 单位高度 |
| 41 | baseUom_linearUom | 线性单位 | 否 | cm/m/in |
| 42 | baseUom_weight | 重量 | 否 | 单位重量 |
| 43 | baseUom_weightUom | 重量单位 | 否 | g/kg/lb |
| 44 | baseUom_volume | 体积 | 否 | 单位体积 |
| 45 | baseUom_volumeUom | 体积单位 | 否 | m3/ft3/in3 |
| 46 | baseUom_price | 价格 | 否 | 单位价格 |
| 47 | baseUom_currency | 币种 | 否 | CNY/USD/EUR |

### 9. 内包装单位 Inner UOM (列 48-60) - 可选

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 48 | innerUom_name | 单位名称 | 否 | 内包装单位名称 |
| 49 | innerUom_baseQty | 换算数量 | 否 | 1个内包装 = N个基本单位 |
| 50 | innerUom_isDefault | 是否默认单位 | 否 | true/false |
| 51 | innerUom_length | 长度 | 否 | 单位长度 |
| 52 | innerUom_width | 宽度 | 否 | 单位宽度 |
| 53 | innerUom_height | 高度 | 否 | 单位高度 |
| 54 | innerUom_linearUom | 线性单位 | 否 | cm/m/in |
| 55 | innerUom_weight | 重量 | 否 | 单位重量 |
| 56 | innerUom_weightUom | 重量单位 | 否 | g/kg/lb |
| 57 | innerUom_volume | 体积 | 否 | 单位体积 |
| 58 | innerUom_volumeUom | 体积单位 | 否 | m3/ft3/in3 |
| 59 | innerUom_price | 价格 | 否 | 单位价格 |
| 60 | innerUom_currency | 币种 | 否 | CNY/USD/EUR |

### 10. 箱装单位 Case UOM (列 61-73) - 可选

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 61 | caseUom_name | 单位名称 | 否 | 箱装单位名称 |
| 62 | caseUom_baseQty | 换算数量 | 否 | 1箱 = N个基本单位 |
| 63 | caseUom_isDefault | 是否默认单位 | 否 | true/false |
| 64 | caseUom_length | 长度 | 否 | 单位长度 |
| 65 | caseUom_width | 宽度 | 否 | 单位宽度 |
| 66 | caseUom_height | 高度 | 否 | 单位高度 |
| 67 | caseUom_linearUom | 线性单位 | 否 | cm/m/in |
| 68 | caseUom_weight | 重量 | 否 | 单位重量 |
| 69 | caseUom_weightUom | 重量单位 | 否 | g/kg/lb |
| 70 | caseUom_volume | 体积 | 否 | 单位体积 |
| 71 | caseUom_volumeUom | 体积单位 | 否 | m3/ft3/in3 |
| 72 | caseUom_price | 价格 | 否 | 单位价格 |
| 73 | caseUom_currency | 币种 | 否 | CNY/USD/EUR |

---

### 11. 托盘配置 PalletConfig（Sheet：PalletConfig）

| 列号 | 字段名 | 中文名 | 必填 | 说明 |
|------|--------|--------|------|------|
| 1 | sku | SKU | 是 | 关联 Item SKU |
| 2 | name | 配置名称 | 否 | 托盘配置名称 |
| 3 | scene | 场景 | 否 | 托盘配置场景 |
| 4 | retailerId | 零售商ID | 否 | 组织ID，Tag=RETAILER |
| 5 | carrierId | 承运商ID | 否 | 承运商ID |
| 6 | uomId | 单位 | 是 | 关联 Item 已配置单位（如 EA） |
| 7 | status | 状态 | 否 | ACTIVE/INACTIVE，默认 ACTIVE |
| 8 | isDefault | 是否默认 | 否 | true/false |
| 9 | ti | TI | 是 | 每层数量 |
| 10 | hi | HI | 是 | 层数 |

---

## 字段映射规则

### 自动映射

当使用标准模板上传时，系统根据列名自动匹配字段映射：
- 列名完全匹配：直接映射
- 列名包含关键字：智能匹配（如 "SKU" 匹配 sku 字段）

### 手动映射

用户可在导入页面手动调整 Excel 列与系统字段的对应关系。

---

## 数据校验规则

### 必填校验
- sku：必填
- baseUom_name：必填

### 格式校验
- eanCode：13位数字
- upcCode：12位数字
- type：MATERIAL 或 PRODUCT
- status：ENABLED 或 DISABLED
- 布尔字段：true 或 false

### 关联校验
- customerId：必须是存在的组织ID，且 tags 包含 CUSTOMER
- brandId：必须是存在的组织ID，且 tags 包含 BRAND
- industryId：必须是存在的行业ID
- hazardId：必须是存在的危险品定义ID

### 唯一性校验
- sku：同一租户下唯一
- eanCode/upcCode/isbnCode：同一租户下唯一

---

## 导入限制

- 文件格式：xlsx 或 xls
- 文件大小：最大 10MB
- 数据行数：最大 5000 行
- 单次导入失败不影响其他行

---

## 与旧模板字段对照

| 旧模板字段 | 新模板字段 | 说明 |
|-----------|-----------|------|
| Item Code / itemID | sku | SKU 字段 |
| itemDescription | description | 描述 |
| shortDescription | shortDescription | 简短描述 |
| abbreviation | abbreviation | 缩写 |
| customerId | customerId | 客户ID |
| supplierId | - | 已移除，改为 supplierIds 数组 |
| groupID | industryId | 行业ID |
| grade | grade | 等级 |
| nmfc | nmfc | NMFC |
| commodityDescription | commodityCode | 商品代码 |
| countryOrigin | countryOfOrigin | 原产国 |
| UPCCode | upcCode | UPC码 |
| UPCCode_Case | caseUpcCode | 箱装UPC码 |
| EANCode | eanCode | EAN码 |
| hasSerialNumber | hasSerialNumber | 是否有序列号 |
| serialNoLength | serialNoLength | 序列号长度 |
| isHazardousMaterial | isHazardous | 是否危险品 |
| itemHazardId | hazardId | 危险品ID |
| status | status | 状态 |
| storageDays | shelfLifeDays | 保质期天数 |
| requireCollectLotNoOnReceive | requireCollectLotNoOnReceive | 收货时收集批次号 |
| Shipping Rule | shippingRule | 发货规则 |
| requireCollectExpirationDateOnReceive | requireCollectExpirationDateOnReceive | 收货时收集过期日期 |
| Ship Allowed Days | shipAllowDays | 允许发货天数 |
| requireCollectMfgDateOnReceive | requireCollectMfgDateOnReceive | 收货时收集生产日期 |
| Base_UOM | baseUom_name | 基本单位名称 |
| Base_SetDefaultUOM | baseUom_isDefault | 基本单位是否默认 |
| Base_Length | baseUom_length | 基本单位长度 |
| Base_Width | baseUom_width | 基本单位宽度 |
| Base_Height | baseUom_height | 基本单位高度 |
| Base_UnitLength | baseUom_linearUom | 基本单位线性单位 |
| Base_Weight | baseUom_weight | 基本单位重量 |
| Base_UnitWeight | baseUom_weightUom | 基本单位重量单位 |
| Base_Volume | baseUom_volume | 基本单位体积 |
| Base_UnitVolume | baseUom_volumeUom | 基本单位体积单位 |
| Inner_Pack_Qty | innerUom_baseQty | 内包装换算数量 |
| Inner_Pack_UOM | innerUom_name | 内包装单位名称 |
| Case_UOM | caseUom_name | 箱装单位名称 |
| Case_Qty | caseUom_baseQty | 箱装换算数量 |
