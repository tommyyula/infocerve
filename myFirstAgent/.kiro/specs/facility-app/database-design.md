# Facility 模块 - 数据库设计

## 1. 设计概述

### 设计原则

- 每个聚合根对应一张主表
- 所有表使用 FacilityIsolation（isolationId = facilityId）进行数据隔离
- 基础字段继承自 BaseFacilityEntity（tenantId, isolationId, createdTime, createdBy, updatedTime, updatedBy）
- 聚合间通过 ID 关联，不使用外键约束

### 表清单

设备模块（3 张表）：
- wms_equipment - 设备表
- wms_history_equipment_fill_rate_record - 设备填充率记录表
- wms_history_equipment_inspection - 设备检查历史表

虚拟位置组模块（6 张表）：
- wms_virtual_location_group - 虚拟位置组表
- wms_virtual_location_tag - 虚拟位置标签表
- wms_customer_vlg_allocation - 客户 VLG 分配表
- wms_item_vlg - 物料 VLG 关联表
- wms_item_group_vlg - 物料组 VLG 关联表
- wms_title_vlg - 货主 VLG 关联表

拣选灯模块（2 张表）：
- def_pick_to_light - 拣选灯表
- def_pick_to_light_group - 拣选灯组表

---

## 2. 设备模块表结构

### 2.1 wms_equipment（设备表）

说明：管理仓库中的设备，如料箱、托盘等

字段列表：
- id - VARCHAR(32) - 设备 ID - PK
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- name - VARCHAR(255) - 设备名称
- type - VARCHAR(50) - 设备类型（EquipmentType 枚举）
- status - VARCHAR(50) - 设备状态（EquipmentStatus 枚举）
- hlpId - VARCHAR(32) - HLP ID
- barcode - VARCHAR(64) - 条码
- barcodeNum - BIGINT - 条码数字
- length - DECIMAL(10,2) - 长度（CM）
- width - DECIMAL(10,2) - 宽度（CM）
- height - DECIMAL(10,2) - 高度（CM）
- capacity - DECIMAL(10,2) - 容量
- currentFillRate - DECIMAL(10,4) - 当前填充率
- occupiedBy - VARCHAR(32) - 占用者（任务 ID）
- parentId - VARCHAR(32) - 父设备 ID
- spaceStatus - VARCHAR(50) - 空间状态（EquipmentSpaceStatus 枚举）
- reservedBy - VARCHAR(32) - 预留者
- locationId - VARCHAR(32) - 位置 ID
- locationType - VARCHAR(50) - 位置类型
- serverName - VARCHAR(255) - 服务器名称
- tags - JSON - 标签列表
- rfids - JSON - RFID 列表
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_isolationId (isolationId)
- idx_tenantId (tenantId)
- idx_type (type)
- idx_status (status)
- idx_locationId (locationId)
- idx_barcode (barcode)

### 2.2 wms_history_equipment_fill_rate_record（设备填充率记录表）

说明：记录设备的填充率历史数据

字段列表：
- id - BIGINT UNSIGNED - 记录 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- equipmentId - VARCHAR(32) - 设备 ID
- barcode - VARCHAR(64) - 条码
- slotCode - VARCHAR(50) - 槽位代码
- fillRate - DECIMAL(10,4) - 填充率
- overFlow - TINYINT(1) - 是否溢出
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_equipmentId (equipmentId)
- idx_isolationId (isolationId)
- idx_createdTime (createdTime)

### 2.3 wms_history_equipment_inspection（设备检查历史表）

说明：记录设备的检查历史

字段列表：
- id - BIGINT - 记录 ID - PK, AUTO_INCREMENT
- targetId - VARCHAR(50) - 目标 ID - NOT NULL
- photoIds - JSON - 照片 ID 列表 - NOT NULL
- comment - VARCHAR(100) - 备注
- inspectionCondition - VARCHAR(50) - 检查条件 - NOT NULL
- photoTime - TIMESTAMP - 拍照时间
- direction - VARCHAR(50) - 方向 - NOT NULL
- equipmentNo - VARCHAR(50) - 设备编号
- equipmentType - VARCHAR(50) - 设备类型
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID
- createdTime - TIMESTAMP - 创建时间 - DEFAULT CURRENT_TIMESTAMP
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id)
- idx_targetId (targetId)
- idx_tenantId (tenantId)
- idx_isolationId (isolationId)

---

## 3. 虚拟位置组模块表结构

### 3.1 wms_virtual_location_group（虚拟位置组表）

说明：虚拟位置组管理，用于将多个物理位置组合成一个逻辑位置组

字段列表：
- id - BIGINT UNSIGNED - VLG ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- name - VARCHAR(255) - VLG 名称
- tagIds - JSON - 标签 ID 列表
- type - VARCHAR(50) - VLG 类型（VirtualLocationGroupType 枚举）
- supportPickType - VARCHAR(50) - 支持的拣选类型（PickType 枚举）
- disallowToMixItemOnSameLocation - TINYINT(1) - 禁止同位置混放不同商品
- disallowToMixLotNoOnSameLocation - TINYINT(1) - 禁止同位置混放不同批次
- skipOccupiedLocationOnPutAway - TINYINT(1) - 上架时跳过已占用位置
- occupiedBy - JSON - 占用者列表（计划 ID 列表）
- airRobLocationIds - JSON - AirRob 位置 ID 列表
- stagingVlgConnectionIds - JSON - 暂存 VLG 连接 ID 列表
- maximumAllowedPartialPallet - INT - 最大允许部分托盘数量
- enableDepletedLocation - TINYINT(1) - 是否启用耗尽位置
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_isolationId (isolationId)
- idx_type (type)
- idx_name (name)

### 3.2 wms_virtual_location_tag（虚拟位置标签表）

说明：虚拟位置标签，用于标记和管理位置

字段列表：
- id - BIGINT UNSIGNED - 标签 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- name - VARCHAR(255) - 标签名称
- desc - VARCHAR(500) - 标签描述
- locationIds - JSON - 位置 ID 列表
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_isolationId (isolationId)
- idx_name (name)

### 3.3 wms_customer_vlg_allocation（客户 VLG 分配表）

说明：客户与虚拟位置组的分配关系

字段列表：
- id - BIGINT UNSIGNED - 分配 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- vlgId - BIGINT - 虚拟位置组 ID
- customerId - VARCHAR(32) - 客户 ID
- category - VARCHAR(50) - 分配类别（CustomerVlgAllocationCategory 枚举）
- percentage - INT - 分配百分比
- timeRangeFrom - VARCHAR(20) - 时间范围开始（如 08:00）
- timeRangeTo - VARCHAR(20) - 时间范围结束（如 18:00）
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_vlgId (vlgId)
- idx_customerId (customerId)
- idx_isolationId (isolationId)

### 3.4 wms_item_vlg（物料 VLG 关联表）

说明：物料与虚拟位置组的关联关系

字段列表：
- id - BIGINT UNSIGNED - 关联 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- vlgId - BIGINT - 虚拟位置组 ID
- customerId - VARCHAR(32) - 客户 ID
- itemId - VARCHAR(32) - 物料 ID
- palletType - VARCHAR(20) - 托盘类型（FULL/PARTIAL/CARTON）
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_vlgId (vlgId)
- idx_itemId (itemId)
- idx_customerId (customerId)
- idx_isolationId (isolationId)
- uk_vlg_item_customer (vlgId, itemId, customerId, isolationId) - UNIQUE

### 3.5 wms_item_group_vlg（物料组 VLG 关联表）

说明：物料组与虚拟位置组的关联关系

字段列表：
- id - BIGINT UNSIGNED - 关联 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- vlgId - BIGINT - 虚拟位置组 ID
- customerId - VARCHAR(32) - 客户 ID
- titleId - VARCHAR(32) - 货主 ID
- itemGroupId - VARCHAR(32) - 物料组 ID
- palletType - VARCHAR(20) - 托盘类型（FULL/PARTIAL/CARTON）
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_vlgId (vlgId)
- idx_itemGroupId (itemGroupId)
- idx_titleId (titleId)
- idx_customerId (customerId)
- idx_isolationId (isolationId)
- uk_vlg_itemGroup_title_customer (vlgId, itemGroupId, titleId, customerId, isolationId) - UNIQUE

### 3.6 wms_title_vlg（货主 VLG 关联表）

说明：货主与虚拟位置组的关联关系

字段列表：
- id - BIGINT UNSIGNED - 关联 ID - PK, AUTO_INCREMENT
- tenantId - VARCHAR(32) - 租户 ID
- isolationId - VARCHAR(50) - 设施 ID - PK, NOT NULL
- vlgId - BIGINT - 虚拟位置组 ID
- customerId - VARCHAR(32) - 客户 ID
- titleId - VARCHAR(32) - 货主 ID
- palletType - VARCHAR(20) - 托盘类型（FULL/PARTIAL/CARTON）
- createdTime - TIMESTAMP - 创建时间
- createdBy - VARCHAR(50) - 创建人
- updatedTime - TIMESTAMP - 更新时间
- updatedBy - VARCHAR(50) - 更新人

索引：
- PRIMARY KEY (id, isolationId)
- idx_vlgId (vlgId)
- idx_titleId (titleId)
- idx_customerId (customerId)
- idx_isolationId (isolationId)
- uk_vlg_title_customer (vlgId, titleId, customerId, isolationId) - UNIQUE

---

## 4. 拣选灯模块表结构

### 4.1 def_pick_to_light（拣选灯表）

说明：拣选灯设备管理

字段列表：
- id - BIGINT - 拣选灯 ID - PK, AUTO_INCREMENT
- lightId - VARCHAR(64) - 灯编号 - NOT NULL
- groupId - VARCHAR(64) - 灯组 ID
- locationId - VARCHAR(64) - 关联库位 ID
- equipmentId - VARCHAR(64) - 关联设备 ID
- occupiedBy - VARCHAR(64) - 当前占用工号
- facilityId - VARCHAR(32) - 所属库房 - NOT NULL
- tenantId - VARCHAR(32) - 租户 ID
- createdTime - DATETIME - 创建时间 - DEFAULT CURRENT_TIMESTAMP
- createdBy - VARCHAR(32) - 创建人
- updatedTime - DATETIME - 更新时间 - ON UPDATE CURRENT_TIMESTAMP
- updatedBy - VARCHAR(32) - 更新人

索引：
- PRIMARY KEY (id, facilityId)
- idx_lightId (lightId)
- idx_groupId (groupId)
- idx_locationId (locationId)

### 4.2 def_pick_to_light_group（拣选灯组表）

说明：拣选灯组管理

字段列表：
- id - BIGINT - 灯组 ID - PK, AUTO_INCREMENT
- name - VARCHAR(128) - 灯组名称 - NOT NULL
- ip - VARCHAR(64) - IP 地址
- port - INT - 端口号
- type - VARCHAR(32) - 灯组类型
- vlgId - BIGINT - 关联 VLG ID
- deviceType - VARCHAR(32) - 设备类型
- facilityId - VARCHAR(32) - 所属库房 - NOT NULL
- tenantId - VARCHAR(32) - 租户 ID
- createdTime - DATETIME - 创建时间 - DEFAULT CURRENT_TIMESTAMP
- createdBy - VARCHAR(32) - 创建人
- updatedTime - DATETIME - 更新时间 - ON UPDATE CURRENT_TIMESTAMP
- updatedBy - VARCHAR(32) - 更新人

索引：
- PRIMARY KEY (id, facilityId)
- idx_name (name)
- idx_vlgId (vlgId)

---

## 5. 索引设计说明

### 设计原则

- 所有表必须有 isolationId/facilityId 索引，支持数据隔离查询
- 高频查询字段建立单列索引
- 联合唯一约束使用复合唯一索引
- 避免过多索引影响写入性能

### 索引类型

主键索引：
- 设备表使用复合主键 (id, isolationId)
- 历史表使用自增主键 + isolationId 复合主键
- VLG 相关表使用自增主键 + isolationId 复合主键

唯一索引：
- wms_item_vlg: uk_vlg_item_customer - 防止重复关联
- wms_item_group_vlg: uk_vlg_itemGroup_title_customer - 防止重复关联
- wms_title_vlg: uk_vlg_title_customer - 防止重复关联

普通索引：
- 外键字段：vlgId, customerId, itemId, locationId 等
- 状态字段：type, status
- 时间字段：createdTime（用于历史数据查询）

---

## 6. 约束设计说明

### 非空约束

必填字段：
- 所有表的 isolationId/facilityId
- 设备表的 id
- VLG 表的 id
- 拣选灯表的 lightId

### 唯一约束

业务唯一性：
- 物料 VLG 关联：同一 VLG + 物料 + 客户 + 设施 唯一
- 物料组 VLG 关联：同一 VLG + 物料组 + 货主 + 客户 + 设施 唯一
- 货主 VLG 关联：同一 VLG + 货主 + 客户 + 设施 唯一

### 默认值

时间字段：
- createdTime: CURRENT_TIMESTAMP
- updatedTime: ON UPDATE CURRENT_TIMESTAMP

布尔字段：
- 默认 NULL 或 0

---

## 7. Entity-PO 映射

### 设备模块

Equipment -> wms_equipment
- Equipment.id -> id
- Equipment.tenantId -> tenantId
- Equipment.isolationId -> isolationId
- Equipment.name -> name
- Equipment.type -> type
- Equipment.status -> status
- Equipment.barcode -> barcode
- Equipment.currentFillRate -> currentFillRate
- Equipment.occupiedBy -> occupiedBy
- Equipment.locationId -> locationId
- Equipment.tags -> tags (JSON)
- Converter: EquipmentConverter

EquipmentFillRateRecord -> wms_history_equipment_fill_rate_record
- EquipmentFillRateRecord.id -> id
- EquipmentFillRateRecord.equipmentId -> equipmentId
- EquipmentFillRateRecord.fillRate -> fillRate
- EquipmentFillRateRecord.overFlow -> overFlow
- Converter: EquipmentFillRateRecordConverter

### 虚拟位置组模块

VirtualLocationGroup -> wms_virtual_location_group
- VirtualLocationGroup.id -> id
- VirtualLocationGroup.name -> name
- VirtualLocationGroup.type -> type
- VirtualLocationGroup.tagIds -> tagIds (JSON)
- VirtualLocationGroup.occupiedBy -> occupiedBy (JSON)
- Converter: VirtualLocationGroupConverter

VirtualLocationTag -> wms_virtual_location_tag
- VirtualLocationTag.id -> id
- VirtualLocationTag.name -> name
- VirtualLocationTag.desc -> desc
- VirtualLocationTag.locationIds -> locationIds (JSON)
- Converter: VirtualLocationTagConverter

CustomerVlgAllocation -> wms_customer_vlg_allocation
- CustomerVlgAllocation.id -> id
- CustomerVlgAllocation.vlgId -> vlgId
- CustomerVlgAllocation.customerId -> customerId
- CustomerVlgAllocation.percentage -> percentage
- Converter: CustomerVlgAllocationConverter

ItemVlg -> wms_item_vlg
- ItemVlg.id -> id
- ItemVlg.vlgId -> vlgId
- ItemVlg.itemId -> itemId
- ItemVlg.palletType -> palletType
- Converter: ItemVlgConverter

ItemGroupVlg -> wms_item_group_vlg
- ItemGroupVlg.id -> id
- ItemGroupVlg.vlgId -> vlgId
- ItemGroupVlg.itemGroupId -> itemGroupId
- ItemGroupVlg.palletType -> palletType
- Converter: ItemGroupVlgConverter

TitleVlg -> wms_title_vlg
- TitleVlg.id -> id
- TitleVlg.vlgId -> vlgId
- TitleVlg.titleId -> titleId
- TitleVlg.palletType -> palletType
- Converter: TitleVlgConverter

### 拣选灯模块

PickToLight -> def_pick_to_light
- PickToLight.id -> id
- PickToLight.lightId -> lightId
- PickToLight.groupId -> groupId
- PickToLight.locationId -> locationId
- PickToLight.equipmentId -> equipmentId
- PickToLight.occupiedBy -> occupiedBy
- Converter: PickToLightConverter

PickToLightGroup -> def_pick_to_light_group
- PickToLightGroup.id -> id
- PickToLightGroup.name -> name
- PickToLightGroup.ip -> ip
- PickToLightGroup.port -> port
- PickToLightGroup.vlgId -> vlgId
- Converter: PickToLightGroupConverter

---

## 8. 迁移脚本

### 命名规范

格式：V{版本号}__{描述}.sql
示例：V1__create_facility_tables.sql

### 执行顺序

1. V1__create_equipment_tables.sql - 创建设备相关表
2. V2__create_vlg_tables.sql - 创建 VLG 相关表
3. V3__create_pick_to_light_tables.sql - 创建拣选灯相关表

### 回滚策略

- 每个迁移脚本对应一个回滚脚本
- 回滚脚本命名：R{版本号}__{描述}.sql
- 回滚操作需要 DBA 审批
