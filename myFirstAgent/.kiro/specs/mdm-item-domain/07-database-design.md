# MDM Item 领域 - 数据库设计

## 1. 设计概述

### 设计范围

- mdm_item - 商品主表
- mdm_item_property - 商品属性表
- mdm_item_uom - 商品单位表
- mdm_item_kitting - 套装组件表
- mdm_pallet_config - 托盘配置表
- mdm_hazard_definition - 危险品定义表（独立聚合）
- mdm_industry - 行业表
- mdm_industry_property_template - 行业属性模板表

### 设计原则

1. 领域驱动 - 表结构基于领域模型设计
2. 聚合边界 - 每个聚合对应一张主表
3. 租户隔离 - 所有表包含 tenantId 和 isolationId
4. 审计追踪 - 包含创建/更新时间和操作人
5. 冗余存储 - 属性表采用冗余存储设计提升查询性能

---

## 2. 表结构设计

### 2.1 mdm_item（商品主表）

```sql
CREATE TABLE mdm_item (
  id              VARCHAR(32)     NOT NULL    COMMENT '商品ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  sku             VARCHAR(127)    NOT NULL    COMMENT 'SKU编码',
  description     TEXT            NULL        COMMENT '商品描述',
  shortDescription VARCHAR(500)   NULL        COMMENT '简短描述',
  customerId      VARCHAR(32)     NULL        COMMENT '客户ID（关联 Organization，tags 包含 CUSTOMER）',
  supplierIds     JSON            NULL        COMMENT '供应商ID列表',
  brandId         VARCHAR(32)     NULL        COMMENT '品牌ID（关联 Organization，tags 包含 BRAND）',
  industryId      BIGINT          NULL        COMMENT '行业ID',
  itemHazardId    VARCHAR(32)     NULL        COMMENT '危险品ID',
  hazardId        BIGINT          NULL        COMMENT '危险品定义ID（关联 mdm_hazard_definition）',
  isHazardous     TINYINT(1)      DEFAULT 0   COMMENT '是否危险品',
  fileIds         JSON            NULL        COMMENT '文件ID列表',
  tags            JSON            NULL        COMMENT '标签列表',
  status          VARCHAR(20)     NULL        COMMENT '状态(DRAFT/ENABLED/DISABLED)',
  type            VARCHAR(50)     NULL        COMMENT '类型(MATERIAL/PRODUCT)',
  -- Barcode Info
  eanCode         VARCHAR(32)     NULL        COMMENT 'EAN码',
  isbnCode        VARCHAR(32)     NULL        COMMENT 'ISBN码',
  upcCode         VARCHAR(32)     NULL        COMMENT 'UPC码',
  caseUpcCode     VARCHAR(32)     NULL        COMMENT '箱装UPC码',
  -- Serial Number Config
  hasSerialNumber TINYINT(1)      NULL        COMMENT '是否启用序列号',
  requireCollectSnOnReceive TINYINT(1) NULL   COMMENT '收货时收集序列号',
  requireCollectSnOnShipping TINYINT(1) NULL  COMMENT '发货时收集序列号',
  serialNoLength  INT             NULL        COMMENT '序列号长度',
  serialNoValidationRule VARCHAR(255) NULL    COMMENT '序列号验证规则',
  validationInboundSerialNo TINYINT(1) NULL   COMMENT '入库验证序列号',
  validationOutboundSerialNo TINYINT(1) NULL  COMMENT '出库验证序列号',
  -- Lot Config
  hasLotNo        TINYINT(1)      NULL        COMMENT '是否启用批次号',
  requireCollectLotNoOnReceive TINYINT(1) NULL COMMENT '收货时收集批次号',
  requireCollectLotNoOnShipping TINYINT(1) NULL COMMENT '发货时收集批次号',
  requireCollectExpirationDateOnReceive TINYINT(1) NULL COMMENT '收货时收集过期日期',
  requireCollectMfgDateOnReceive TINYINT(1) NULL COMMENT '收货时收集生产日期',
  shelfLifeDays   INT             NULL        COMMENT '保质期天数',
  expirationDate  TIMESTAMP       NULL        COMMENT '过期日期',
  -- Shipping Config
  shippingRule    VARCHAR(50)     NULL        COMMENT '发货规则',
  shipAllowDays   INT             NULL        COMMENT '允许发货天数',
  shippingRuleTimeWindow INT      NULL        COMMENT '发货规则时间窗口',
  countryOfOrigin VARCHAR(50)     NULL        COMMENT '原产国',
  -- Kitting Config
  isKitting       TINYINT(1)      NULL        COMMENT '是否套装',
  kitItemFulfillBy VARCHAR(20)    NULL        COMMENT '套装履行方式',
  -- Other
  enableDualUom   TINYINT(1)      NULL        COMMENT '是否启用双单位',
  abbreviation    VARCHAR(100)    NULL        COMMENT '缩写',
  packagingMaterial VARCHAR(32)   NULL        COMMENT '包装材料（关联类型为 MATERIAL 的商品 ID，格式：ITEM-xxx）',
  imageFileIds    JSON            NULL        COMMENT '图片文件ID列表',
  grade           VARCHAR(50)     NULL        COMMENT '等级',
  nmfc            VARCHAR(50)     NULL        COMMENT 'NMFC代码',
  commodityCode   VARCHAR(50)     NULL        COMMENT '商品代码',
  commodityDescription TEXT       NULL        COMMENT '商品描述',
  akas            JSON            NULL        COMMENT '别名列表',
  -- Audit
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品主表';
```

### 2.2 mdm_item_property（商品属性表）

```sql
CREATE TABLE mdm_item_property (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '属性ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  itemId          VARCHAR(32)     NULL        COMMENT '商品ID',
  name            VARCHAR(50)     NULL        COMMENT '属性名称',
  type            VARCHAR(20)     NULL        COMMENT '属性类型(TEXT/NUMBER/SELECT)',
  options         JSON            NULL        COMMENT '选项列表(SELECT类型)',
  uom             VARCHAR(20)     NULL        COMMENT '单位(NUMBER类型)',
  isRequired      TINYINT(1)      DEFAULT 0   COMMENT '是否必填',
  sortOrder       INT             DEFAULT 0   COMMENT '排序顺序',
  value           VARCHAR(255)    NULL        COMMENT '属性值',
  valueUom        VARCHAR(50)     NULL        COMMENT '值单位',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品属性表';
```


### 2.3 mdm_item_uom（商品单位表）

```sql
CREATE TABLE mdm_item_uom (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '单位ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  itemId          VARCHAR(32)     NOT NULL    COMMENT '商品ID',
  uomId           VARCHAR(32)     NULL        COMMENT '单位定义ID',
  name            VARCHAR(50)     NULL        COMMENT '单位名称',
  dualUomType     VARCHAR(20)     NULL        COMMENT '双单位类型',
  qty             DECIMAL(10,2)   NULL        COMMENT '数量',
  baseQty         DECIMAL(10,2)   NULL        COMMENT '基本单位数量',
  insideUomId     BIGINT          NULL        COMMENT '内部单位ID',
  isDefaultUom    TINYINT(1)      NULL        COMMENT '是否默认单位',
  isBaseUom       TINYINT(1)      NULL        COMMENT '是否基本单位',
  -- Dimension
  length          DECIMAL(10,2)   NULL        COMMENT '长度',
  width           DECIMAL(10,2)   NULL        COMMENT '宽度',
  height          DECIMAL(12,2)   NULL        COMMENT '高度',
  linearUom       VARCHAR(20)     NULL        COMMENT '线性单位',
  weight          DECIMAL(10,2)   NULL        COMMENT '重量',
  weightUom       VARCHAR(20)     NULL        COMMENT '重量单位',
  volume          DECIMAL(10,2)   NULL        COMMENT '体积',
  volumeUom       VARCHAR(20)     NULL        COMMENT '体积单位',
  -- Pricing
  price           DECIMAL(10,2)   NULL        COMMENT '价格',
  insurancePrice  DECIMAL(10,2)   NULL        COMMENT '保险价格',
  currency        VARCHAR(50)     NULL        COMMENT '币种',
  status          VARCHAR(20)     NULL        COMMENT '状态',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品单位表';
```

### 2.4 mdm_item_kitting（套装组件表）

```sql
CREATE TABLE mdm_item_kitting (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '组件ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  itemId          VARCHAR(32)     NOT NULL    COMMENT '套装商品ID',
  componentItemId VARCHAR(32)     NULL        COMMENT '组件商品ID',
  lpType          VARCHAR(50)     NULL        COMMENT 'LP类型',
  qty             DECIMAL(10,2)   NULL        COMMENT '组件数量',
  uomId           BIGINT          NULL        COMMENT '单位ID',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套装组件表';
```


### 2.5 mdm_pallet_config（托盘配置表）

```sql
CREATE TABLE mdm_pallet_config (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  itemId          VARCHAR(32)     NOT NULL    COMMENT '商品ID',
  name            VARCHAR(255)    NULL        COMMENT '配置名称',
  scene           VARCHAR(50)     NULL        COMMENT '场景',
  retailerId      VARCHAR(32)     NULL        COMMENT '零售商ID（关联 Organization，tags 包含 RETAILER）',
  carrierId       VARCHAR(32)     NULL        COMMENT '承运商ID（关联 def_carrier 表）',
  uomId           VARCHAR(32)     NULL        COMMENT '单位ID',
  status          VARCHAR(30)     NULL        COMMENT '状态',
  isDefault       TINYINT(1)      NULL        COMMENT '是否默认',
  ti              DECIMAL(10,2)   NULL        COMMENT 'TI(每层数量)',
  hi              DECIMAL(10,2)   NULL        COMMENT 'HI(层数)',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='托盘配置表';
```

### 2.6 mdm_hazard_definition（危险品定义表）

```sql
CREATE TABLE mdm_hazard_definition (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '危险品定义ID',
  tenantId        VARCHAR(32)     NOT NULL    COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  hazardCode      VARCHAR(32)     NOT NULL    COMMENT '危险品代码（如：UN1203）',
  hazardName      VARCHAR(100)    NOT NULL    COMMENT '危险品名称',
  properShippingName VARCHAR(200) NULL        COMMENT '正确运输名称',
  hazardClass     VARCHAR(50)     NOT NULL    COMMENT '危险品分类（如：3）',
  packingGroup    VARCHAR(20)     NULL        COMMENT '包装组（如：I/II/III）',
  description     VARCHAR(500)    NULL        COMMENT '描述',
  createdBy       VARCHAR(64)     NULL        COMMENT '创建人',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  updatedBy       VARCHAR(64)     NULL        COMMENT '更新人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  PRIMARY KEY (id, isolationId),
  UNIQUE INDEX uk_hazardCode_isolationId(hazardCode, isolationId),
  INDEX idx_isolationId(isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='危险品定义表';
```

[说明] 危险品定义是独立聚合，商品通过 hazardId 字段关联危险品定义。

### 2.7 mdm_industry（行业表）

```sql
CREATE TABLE mdm_industry (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '行业ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  code            VARCHAR(50)     NOT NULL    COMMENT '行业代码（如：CLOTHING）',
  name            VARCHAR(100)    NOT NULL    COMMENT '行业名称（如：服装）',
  description     VARCHAR(500)    NULL        COMMENT '行业描述',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId),
  UNIQUE INDEX uk_code_isolationId(code, isolationId),
  INDEX idx_isolationId(isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行业表';
```

### 2.8 mdm_industry_property_template（行业属性模板表）

```sql
CREATE TABLE mdm_industry_property_template (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  tenantId        VARCHAR(32)     NULL        COMMENT '租户ID',
  isolationId     VARCHAR(50)     NOT NULL    COMMENT '隔离ID',
  industryId      BIGINT          NOT NULL    COMMENT '行业ID，关联到 mdm_industry 表',
  name            VARCHAR(50)     NOT NULL    COMMENT '属性名称（如：颜色）',
  type            VARCHAR(20)     NOT NULL    COMMENT '属性类型（TEXT/DATE/NUMBER/SELECT）',
  isRequired      TINYINT(1)      DEFAULT 0   COMMENT '是否必填',
  options         JSON            NULL        COMMENT '选项列表（SELECT类型使用）',
  uom             VARCHAR(20)     NULL        COMMENT '单位（NUMBER类型使用）',
  createdTime     TIMESTAMP       NULL        COMMENT '创建时间',
  createdBy       VARCHAR(50)     NULL        COMMENT '创建人',
  updatedTime     TIMESTAMP       NULL        COMMENT '更新时间',
  updatedBy       VARCHAR(50)     NULL        COMMENT '更新人',
  PRIMARY KEY (id, isolationId),
  INDEX idx_industryId(industryId, isolationId),
  INDEX idx_isolationId(isolationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行业属性模板表';
```

---

## 3. 索引设计

### mdm_item 索引

```sql
-- 唯一索引
CREATE UNIQUE INDEX uk_sku_companyId ON mdm_item(sku, customerId, tenantId);
CREATE UNIQUE INDEX uk_sku_isolationId ON mdm_item(isolationId, sku, customerId);

-- 普通索引
CREATE INDEX idx_industryId ON mdm_item(industryId);
CREATE INDEX idx_companyId ON mdm_item(tenantId);
CREATE INDEX idx_sku ON mdm_item(sku);
CREATE INDEX idx_customerId ON mdm_item(customerId);
CREATE INDEX idx_isolationId_status ON mdm_item(isolationId, status);
CREATE INDEX idx_createdTime_isolationId ON mdm_item(createdTime, isolationId);
CREATE INDEX idx_isolationId_customerId_status_createdTime ON mdm_item(isolationId, customerId, status, createdTime);
CREATE INDEX idx_isolationId_sku ON mdm_item(isolationId, sku);
CREATE INDEX idx_isolationId_eanCode ON mdm_item(isolationId, eanCode);
CREATE INDEX idx_isolationId_abbreviation ON mdm_item(isolationId, abbreviation);
CREATE INDEX idx_isolationId_upcCode ON mdm_item(isolationId, upcCode);
CREATE INDEX idx_type ON mdm_item(type);
```


### mdm_item_property 索引

```sql
CREATE UNIQUE INDEX uk_item_property ON mdm_item_property(isolationId, itemId, name, value);
CREATE INDEX idx_companyId ON mdm_item_property(tenantId);
CREATE INDEX idx_itemId ON mdm_item_property(itemId);
CREATE INDEX idx_itemId_name ON mdm_item_property(itemId, name, isolationId);
```

### mdm_item_uom 索引

```sql
CREATE INDEX idx_itemId ON mdm_item_uom(itemId);
CREATE INDEX idx_companyId ON mdm_item_uom(tenantId);
CREATE INDEX idx_isolationId ON mdm_item_uom(isolationId);
CREATE INDEX idx_uomId ON mdm_item_uom(uomId);
CREATE INDEX idx_createdTime ON mdm_item_uom(createdTime);
```

### mdm_item_kitting 索引

```sql
CREATE INDEX idx_itemId ON mdm_item_kitting(itemId);
CREATE INDEX idx_companyId ON mdm_item_kitting(tenantId);
```

### mdm_pallet_config 索引

```sql
CREATE INDEX idx_itemId ON mdm_pallet_config(itemId);
CREATE INDEX idx_companyId ON mdm_pallet_config(tenantId);
CREATE INDEX idx_carrierId ON mdm_pallet_config(carrierId);
```

### mdm_industry 索引

```sql
-- 已在建表语句中定义
CREATE UNIQUE INDEX uk_code_isolationId ON mdm_industry(code, isolationId);
CREATE INDEX idx_isolationId ON mdm_industry(isolationId);
```

### mdm_industry_property_template 索引

```sql
-- 已在建表语句中定义
CREATE INDEX idx_industryId ON mdm_industry_property_template(industryId, isolationId);
CREATE INDEX idx_isolationId ON mdm_industry_property_template(isolationId);
```

### mdm_hazard_definition 索引

```sql
-- 已在建表语句中定义
CREATE UNIQUE INDEX uk_hazardCode_isolationId ON mdm_hazard_definition(hazardCode, isolationId);
CREATE INDEX idx_isolationId ON mdm_hazard_definition(isolationId);
```

---

## 4. Entity-PO 映射

### Item - MdmItemPO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- sku.value -> sku
- description -> description
- shortDescription -> shortDescription
- customerId.value -> customerId
- supplierIds -> supplierIds (JSON)
- brandId.value -> brandId
- industryId.value -> industryId
- hazardId.value -> hazardId
- isHazardous -> isHazardous
- status.name() -> status
- type.name() -> type
- barcodeInfo.eanCode -> eanCode
- barcodeInfo.upcCode -> upcCode
- barcodeInfo.caseUpcCode -> caseUpcCode
- barcodeInfo.isbnCode -> isbnCode
- serialNumberConfig.hasSerialNumber -> hasSerialNumber
- serialNumberConfig.requireCollectSnOnReceive -> requireCollectSnOnReceive
- serialNumberConfig.requireCollectSnOnShipping -> requireCollectSnOnShipping
- serialNumberConfig.serialNoLength -> serialNoLength
- serialNumberConfig.serialNoValidationRule -> serialNoValidationRule
- lotConfig.hasLotNo -> hasLotNo
- lotConfig.requireCollectLotNoOnReceive -> requireCollectLotNoOnReceive
- lotConfig.requireCollectLotNoOnShipping -> requireCollectLotNoOnShipping
- lotConfig.requireCollectExpirationDateOnReceive -> requireCollectExpirationDateOnReceive
- lotConfig.requireCollectMfgDateOnReceive -> requireCollectMfgDateOnReceive
- lotConfig.shelfLifeDays -> shelfLifeDays
- shippingConfig.shippingRule -> shippingRule
- shippingConfig.shipAllowDays -> shipAllowDays
- shippingConfig.shippingRuleTimeWindow -> shippingRuleTimeWindow
- kittingConfig.isKitting -> isKitting
- kittingConfig.kitItemFulfillBy -> kitItemFulfillBy
- akas -> akas (JSON)
- auditInfo.createdTime -> createdTime
- auditInfo.createdBy -> createdBy
- auditInfo.updatedTime -> updatedTime
- auditInfo.updatedBy -> updatedBy


### ItemProperty - MdmItemPropertyPO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- itemId.value -> itemId
- name.value -> name
- type.name() -> type
- options -> options (JSON)
- uom -> uom
- isRequired -> isRequired
- sortOrder -> sortOrder
- value.value -> value
- valueUom -> valueUom
- auditInfo.* -> createdTime, createdBy, updatedTime, updatedBy

### ItemUom - MdmItemUomPO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- itemId.value -> itemId
- uomId.value -> uomId
- name -> name
- dualUomType.name() -> dualUomType
- qty.value -> qty
- baseQty.value -> baseQty
- isDefaultUom -> isDefaultUom
- isBaseUom -> isBaseUom
- dimension.length -> length
- dimension.width -> width
- dimension.height -> height
- dimension.linearUom -> linearUom
- dimension.weight -> weight
- dimension.weightUom -> weightUom
- dimension.volume -> volume
- dimension.volumeUom -> volumeUom
- pricing.price -> price
- pricing.insurancePrice -> insurancePrice
- pricing.currency -> currency
- status.name() -> status
- auditInfo.* -> createdTime, createdBy, updatedTime, updatedBy

### Industry - MdmIndustryPO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- code.value -> code
- name -> name
- description -> description
- auditInfo.* -> createdTime, createdBy, updatedTime, updatedBy

### IndustryPropertyTemplate - MdmIndustryPropertyTemplatePO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- industryId.value -> industryId
- name.value -> name
- type.name() -> type
- isRequired -> isRequired
- options -> options (JSON)
- uom -> uom
- auditInfo.* -> createdTime, createdBy, updatedTime, updatedBy

### HazardDefinition - MdmHazardDefinitionPO

领域对象属性 -> 数据库字段：
- id.value -> id
- tenantId.value -> tenantId
- isolationId.value -> isolationId
- hazardCode -> hazardCode
- hazardName -> hazardName
- properShippingName -> properShippingName
- hazardClass -> hazardClass
- packingGroup -> packingGroup
- description -> description
- auditInfo.* -> createdTime, createdBy, updatedTime, updatedBy

---

## 5. 数据字典

### 商品状态（ItemStatus）

- DRAFT - 草稿
- ENABLED - 启用
- DISABLED - 禁用

### 商品类型（ItemType）

- MATERIAL - 物料
- PRODUCT - 产品

### 属性类型（PropertyType）

- TEXT - 文本
- NUMBER - 数字
- SELECT - 选择

### 单位状态（UomStatus）

- ACTIVE - 启用
- INACTIVE - 禁用

### 配置状态（ConfigStatus）

- ACTIVE - 启用
- INACTIVE - 禁用

---

## 6. 迁移脚本

脚本位置：mdm-app/src/main/resources/db/migration/

已有脚本：
- ItemMaster_修改后表结构.sql - 完整表结构定义（包含所有 8 张表）

表结构包含：
- mdm_item - 商品主表
- mdm_item_property - 商品属性表
- mdm_hazard_definition - 危险品定义表（独立聚合）
- mdm_item_kitting - 套装组件表
- mdm_item_uom - 商品单位表
- mdm_pallet_config - 托盘配置表
- mdm_industry - 行业表
- mdm_industry_property_template - 行业属性模板表
- mdm_sequence - 序列号表

[注意] 
1. 表结构已在 ItemMaster_修改后表结构.sql 中定义，无需额外迁移脚本。
2. 危险品定义（mdm_hazard_definition）是独立聚合，商品通过 hazardId 字段关联。
3. 原 mdm_item_hazard 表已废弃，改用 mdm_hazard_definition 表。