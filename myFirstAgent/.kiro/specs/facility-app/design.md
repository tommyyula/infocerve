# Facility 模块 - 技术设计

## 1. 概述

### 实现目标

- 采用 DDD 分层架构实现 Facility 领域
- 实现设备、库位、虚拟位置组、拣选灯的完整 CRUD
- 支持设备状态管理、填充率采集、检查记录等业务功能
- 提供 RESTful API 供前端和其他系统调用

### 技术选型

- 框架：Spring Boot 2.x
- ORM：MyBatis-Plus
- 数据库：MySQL 8.0
- 消息：Spring Event（领域事件）

### 关键设计决策

1. 聚合设计：Equipment、VirtualLocationGroup、PickToLight 作为核心聚合
2. 数据隔离：所有数据按 facilityId（isolationId）隔离
3. 仓储：接口定义在领域层，实现在基础设施层

---

## 2. 架构设计

### 分层结构

```
wms-app/
  src/main/java/com/t5/wms/
    interfaces/           # 接口层
      rest/facility/      # REST Controller
    application/         # 应用层
      facility/          # 应用服务、DTO、Command
    domain/              # 领域层
      facility/          # 聚合、实体、仓储接口
    infrastructure/      # 基础设施层
      persistence/       # 仓储实现、Mapper
```

### 模块依赖

```
interfaces --> application --> domain <-- infrastructure
```

---

## 3. API 设计

### 3.1 设备管理 API（Equipment）

创建设备
- 方法：POST
- 路径：/equipment/create
- 说明：创建新设备
- 请求体：EquipmentCreateCmd
- 响应体：R of Void

批量创建空料箱
- 方法：POST
- 路径：/equipment/create/empty-tote/batch
- 说明：批量创建空料箱设备
- 请求体：EquipmentBatchToteCreateCmd
- 响应体：R of Void

更新设备
- 方法：PUT
- 路径：/equipment/update
- 说明：更新设备信息
- 请求体：EquipmentUpdateCmd
- 响应体：R of Void

查询设备详情
- 方法：GET
- 路径：/equipment/{id}
- 说明：获取设备完整信息
- 响应体：R of EquipmentDto

查询设备列表
- 方法：POST
- 路径：/equipment/search
- 说明：查询设备列表
- 请求体：EquipmentQuery
- 响应体：R of List of EquipmentDto

分页查询设备
- 方法：POST
- 路径：/equipment/search-by-paging
- 说明：分页查询设备列表
- 请求体：EquipmentQuery
- 响应体：R of PageResult of EquipmentDto

删除设备
- 方法：DELETE
- 路径：/equipment/{id}
- 说明：删除设备
- 响应体：R of Void

禁用设备
- 方法：PUT
- 路径：/equipment/{id}/inactive
- 说明：将设备状态设为 INACTIVE
- 响应体：R of Void

占用设备
- 方法：PUT
- 路径：/equipment/{id}/occupy
- 说明：占用设备
- 参数：occupy（占用者标识）
- 响应体：R of Void

释放设备
- 方法：PUT
- 路径：/equipment/{id}/release
- 说明：释放设备
- 响应体：R of Void

强制释放设备
- 方法：PUT
- 路径：/equipment/{id}/force-release
- 说明：强制释放设备
- 响应体：R of Void

检查是否可释放
- 方法：GET
- 路径：/equipment/{id}/check-can-release
- 说明：检查设备是否可以释放
- 响应体：R of Void

变更设备位置
- 方法：POST
- 路径：/equipment/{barcode}/change-location
- 说明：变更设备位置，toLocationName 为空时下架
- 请求体：ChangeEquipmentLocationCmd
- 响应体：R of Void

记录填充率
- 方法：POST
- 路径：/equipment/fillrate-record
- 说明：记录设备填充率
- 请求体：EquipmentFillRateRecordCmd
- 响应体：R of Void

重新计算填充率
- 方法：POST
- 路径：/equipment/{barcode}/recalculate-fillrate
- 说明：手动触发填充率重新计算
- 响应体：R of Void


---

### 3.2 虚拟位置组 API（VirtualLocationGroup）

创建虚拟位置组
- 方法：POST
- 路径：/location/virtual-group
- 说明：创建新的虚拟位置组
- 请求体：CreateVirtualLocationGroupCmd
- 响应体：R of String（VLG ID）

更新虚拟位置组
- 方法：PUT
- 路径：/location/virtual-group
- 说明：更新虚拟位置组信息
- 请求体：UpdateVirtualLocationGroupCmd
- 响应体：R of Void

查询虚拟位置组详情
- 方法：GET
- 路径：/location/virtual-group/{id}
- 说明：获取虚拟位置组完整信息
- 响应体：R of VirtualLocationGroupDto

查询虚拟位置组列表
- 方法：POST
- 路径：/location/virtual-group/search
- 说明：查询虚拟位置组列表
- 请求体：VirtualLocationGroupSearch
- 响应体：R of List of VirtualLocationGroupDto

分页查询虚拟位置组
- 方法：POST
- 路径：/location/virtual-group/search-by-paging
- 说明：分页查询虚拟位置组列表
- 请求体：VirtualLocationGroupSearch
- 响应体：R of PageResult of VirtualLocationGroupDto

按库位查询虚拟位置组
- 方法：POST
- 路径：/location/virtual-group/by-location/map
- 说明：根据库位 ID 列表查询关联的虚拟位置组
- 请求体：VirtualLocationGroupByLocationQuery
- 响应体：R of Map of String to VirtualLocationGroupDto

删除虚拟位置组
- 方法：DELETE
- 路径：/location/virtual-group/{id}
- 说明：删除虚拟位置组
- 响应体：R of String（VLG ID）

占用虚拟位置组
- 方法：PUT
- 路径：/location/virtual-group/occupied/{vlgId}/{planId}
- 说明：标记虚拟位置组被订单计划占用
- 响应体：R of Void

---

### 3.3 虚拟位置标签 API（VirtualLocationTag）

创建标签
- 方法：POST
- 路径：/location/virtual-tag
- 说明：创建新的虚拟位置标签
- 请求体：CreateVirtualLocationTagCmd
- 响应体：R of Long（Tag ID）

更新标签
- 方法：PUT
- 路径：/location/virtual-tag
- 说明：更新虚拟位置标签信息
- 请求体：UpdateVirtualLocationTagCmd
- 响应体：R of Void

查询标签详情
- 方法：GET
- 路径：/location/virtual-tag/{id}
- 说明：获取标签完整信息
- 响应体：R of VirtualLocationTagDto

查询标签列表
- 方法：POST
- 路径：/location/virtual-tag/search
- 说明：查询标签列表
- 请求体：VirtualLocationTagQuery
- 响应体：R of List of VirtualLocationTagDto

分页查询标签
- 方法：POST
- 路径：/location/virtual-tag/search-by-paging
- 说明：分页查询标签列表
- 请求体：VirtualLocationTagQuery
- 响应体：R of PageResult of VirtualLocationTagDto

删除标签
- 方法：DELETE
- 路径：/location/virtual-tag/{id}
- 说明：删除虚拟位置标签
- 响应体：R of Long（Tag ID）

---

### 3.4 物料 VLG 关联 API（ItemVlg）

创建物料关联
- 方法：POST
- 路径：/location/item-vlg
- 说明：创建物料与虚拟位置组的关联
- 请求体：ItemVlgCreate
- 响应体：R of Long（关联 ID）

更新物料关联
- 方法：POST
- 路径：/location/item-vlg/{id}/update
- 说明：更新物料关联信息
- 请求体：ItemVlgUpdate
- 响应体：R of Long（关联 ID）

查询物料关联详情
- 方法：GET
- 路径：/location/item-vlg/{id}
- 说明：获取物料关联完整信息
- 响应体：R of ItemVlgDto

查询物料关联列表
- 方法：POST
- 路径：/location/item-vlg/search
- 说明：查询物料关联列表
- 请求体：ItemVlgSearch
- 响应体：R of List of ItemVlgDto

分页查询物料关联
- 方法：POST
- 路径：/location/item-vlg/search-by-paging
- 说明：分页查询物料关联列表
- 请求体：ItemVlgSearch
- 响应体：R of PageResult of ItemVlgDto

删除物料关联
- 方法：POST
- 路径：/location/item-vlg/{id}/delete
- 说明：删除物料关联
- 响应体：R of Void

---

### 3.5 拣选灯 API（PickToLight）

创建拣选灯
- 方法：POST
- 路径：/pick-to-light/create
- 说明：创建新的拣选灯
- 请求体：CreatePickToLightCmd
- 响应体：R of Long（拣选灯 ID）

批量创建拣选灯
- 方法：POST
- 路径：/pick-to-light/batch-create
- 说明：批量创建拣选灯
- 请求体：List of CreatePickToLightCmd
- 响应体：R of List of Long（拣选灯 ID 列表）

更新拣选灯
- 方法：PUT
- 路径：/pick-to-light/update
- 说明：更新拣选灯信息
- 请求体：UpdatePickToLightCmd
- 响应体：R of Void

查询拣选灯详情
- 方法：GET
- 路径：/pick-to-light/{id}
- 说明：获取拣选灯完整信息
- 响应体：R of PickToLightDto

查询拣选灯列表
- 方法：POST
- 路径：/pick-to-light/search
- 说明：查询拣选灯列表
- 请求体：PickToLightQuery
- 响应体：R of List of PickToLightDto

分页查询拣选灯
- 方法：POST
- 路径：/pick-to-light/search-by-paging
- 说明：分页查询拣选灯列表
- 请求体：PickToLightQuery
- 响应体：R of PageResult of PickToLightDto

删除拣选灯
- 方法：DELETE
- 路径：/pick-to-light/{id}
- 说明：删除拣选灯
- 响应体：R of Long（拣选灯 ID）

批量删除拣选灯
- 方法：POST
- 路径：/pick-to-light/batch-delete
- 说明：批量删除拣选灯
- 请求体：List of Long（拣选灯 ID 列表）
- 响应体：R of List of Long

---

### 3.6 拣选灯组 API（PickToLightGroup）

创建灯组
- 方法：POST
- 路径：/pick-to-light-group/create
- 说明：创建新的拣选灯组
- 请求体：CreatePickToLightGroupCmd
- 响应体：R of Long（灯组 ID）

更新灯组
- 方法：PUT
- 路径：/pick-to-light-group/update
- 说明：更新拣选灯组信息
- 请求体：UpdatePickToLightGroupCmd
- 响应体：R of Void

查询灯组详情
- 方法：GET
- 路径：/pick-to-light-group/{id}
- 说明：获取灯组完整信息
- 响应体：R of PickToLightGroupDto

查询灯组列表
- 方法：POST
- 路径：/pick-to-light-group/search
- 说明：查询灯组列表
- 请求体：PickToLightGroupQuery
- 响应体：R of List of PickToLightGroupDto

分页查询灯组
- 方法：POST
- 路径：/pick-to-light-group/search-by-paging
- 说明：分页查询灯组列表
- 请求体：PickToLightGroupQuery
- 响应体：R of PageResult of PickToLightGroupDto

删除灯组
- 方法：DELETE
- 路径：/pick-to-light-group/{id}
- 说明：删除拣选灯组
- 响应体：R of Long（灯组 ID）


---

## 4. 请求/响应示例

### 创建设备请求

```json
{
  "id": "TOTE-001",
  "name": "料箱001",
  "type": "TOTE",
  "status": "ACTIVE",
  "barcode": "TOTE001",
  "length": 60.0,
  "width": 40.0,
  "height": 30.0,
  "capacity": 72000.0,
  "tags": ["STANDARD", "PICKING"]
}
```

### 设备详情响应

```json
{
  "code": 0,
  "data": {
    "id": "TOTE-001",
    "name": "料箱001",
    "type": "TOTE",
    "status": "ACTIVE",
    "spaceStatus": "EMPTY",
    "barcode": "TOTE001",
    "barcodeNum": 1001,
    "length": 60.0,
    "width": 40.0,
    "height": 30.0,
    "capacity": 72000.0,
    "currentFillRate": 0.0,
    "occupiedBy": null,
    "locationId": "LOC-A01-01",
    "locationType": "STORAGE",
    "tags": ["STANDARD", "PICKING"],
    "createdTime": "2026-01-01T00:00:00",
    "updatedTime": "2026-01-01T00:00:00"
  }
}
```

### 创建虚拟位置组请求

```json
{
  "name": "拣选区A",
  "type": "PICKING_ZONE",
  "tagIds": [1, 2, 3],
  "supportPickType": "PIECE",
  "disallowToMixItemOnSameLocation": true,
  "disallowToMixLotNoOnSameLocation": false,
  "skipOccupiedLocationOnPutAway": true,
  "maximumAllowedPartialPallet": 5,
  "enableDepletedLocation": false
}
```

### 虚拟位置组详情响应

```json
{
  "code": 0,
  "data": {
    "id": "1001",
    "name": "拣选区A",
    "type": "PICKING_ZONE",
    "tagIds": [1, 2, 3],
    "supportPickType": "PIECE",
    "disallowToMixItemOnSameLocation": true,
    "disallowToMixLotNoOnSameLocation": false,
    "skipOccupiedLocationOnPutAway": true,
    "occupiedBy": [],
    "maximumAllowedPartialPallet": 5,
    "enableDepletedLocation": false,
    "createdTime": "2026-01-01T00:00:00",
    "updatedTime": "2026-01-01T00:00:00"
  }
}
```

### 创建拣选灯请求

```json
{
  "lightId": "PTL-001",
  "groupId": "1",
  "locationId": "LOC-A01-01",
  "equipmentId": null
}
```

### 拣选灯详情响应

```json
{
  "code": 0,
  "data": {
    "id": 1001,
    "lightId": "PTL-001",
    "groupId": "1",
    "locationId": "LOC-A01-01",
    "equipmentId": null,
    "occupiedBy": null,
    "createdTime": "2026-01-01T00:00:00",
    "updatedTime": "2026-01-01T00:00:00"
  }
}
```

---

## 5. 领域对象映射

### Entity - PO 映射

Equipment - wms_equipment
- id -> id
- tenantId -> tenantId
- isolationId -> isolationId
- name -> name
- type -> type
- status -> status
- barcode -> barcode
- currentFillRate -> currentFillRate
- occupiedBy -> occupiedBy
- locationId -> locationId
- tags -> tags (JSON)
- Converter: EquipmentConverter

VirtualLocationGroup - wms_virtual_location_group
- id -> id
- tenantId -> tenantId
- isolationId -> isolationId
- name -> name
- type -> type
- tagIds -> tagIds (JSON)
- disallowToMixItemOnSameLocation -> disallowToMixItemOnSameLocation
- occupiedBy -> occupiedBy (JSON)
- Converter: VirtualLocationGroupConverter

VirtualLocationTag - wms_virtual_location_tag
- id -> id
- name -> name
- desc -> desc
- locationIds -> locationIds (JSON)
- Converter: VirtualLocationTagConverter

CustomerVlgAllocation - wms_customer_vlg_allocation
- id -> id
- vlgId -> vlgId
- customerId -> customerId
- category -> category
- percentage -> percentage
- timeRangeFrom -> timeRangeFrom
- timeRangeTo -> timeRangeTo
- Converter: CustomerVlgAllocationConverter

ItemVlg - wms_item_vlg
- id -> id
- vlgId -> vlgId
- customerId -> customerId
- itemId -> itemId
- palletType -> palletType
- Converter: ItemVlgConverter

PickToLight - def_pick_to_light
- id -> id
- lightId -> lightId
- groupId -> groupId
- locationId -> locationId
- equipmentId -> equipmentId
- occupiedBy -> occupiedBy
- Converter: PickToLightConverter

PickToLightGroup - def_pick_to_light_group
- id -> id
- name -> name
- ip -> ip
- port -> port
- type -> type
- vlgId -> vlgId
- deviceType -> deviceType
- Converter: PickToLightGroupConverter

---

## 6. 错误处理

### 错误码设计

设备错误码（FAC-EQ-xxx）：
- FAC-EQ-001 - 设备不存在 - 404
- FAC-EQ-002 - 设备 ID 重复 - 400
- FAC-EQ-003 - 设备类型无效 - 400
- FAC-EQ-004 - 设备被占用，无法删除 - 400
- FAC-EQ-005 - 设备已被占用，无法再次占用 - 400
- FAC-EQ-006 - 设备未被占用，无法释放 - 400

库位错误码（FAC-LOC-xxx）：
- FAC-LOC-001 - 库位不存在 - 404
- FAC-LOC-002 - 库位 ID 重复 - 400
- FAC-LOC-003 - 库位类型无效 - 400
- FAC-LOC-004 - 库位有库存，无法删除 - 400

虚拟位置组错误码（FAC-VLG-xxx）：
- FAC-VLG-001 - 虚拟位置组不存在 - 404
- FAC-VLG-002 - VLG 名称重复 - 400
- FAC-VLG-003 - VLG 类型无效 - 400
- FAC-VLG-004 - VLG 有客户分配，无法删除 - 400
- FAC-VLG-005 - VLG 有物料关联，无法删除 - 400

标签错误码（FAC-TAG-xxx）：
- FAC-TAG-001 - 标签不存在 - 404
- FAC-TAG-002 - 标签名称重复 - 400
- FAC-TAG-003 - 标签被 VLG 使用，无法删除 - 400
- FAC-TAG-004 - 标签已存在于其他同类型区域 - 400

客户分配错误码（FAC-CVA-xxx）：
- FAC-CVA-001 - 客户分配不存在 - 404
- FAC-CVA-002 - 客户分配重复 - 400
- FAC-CVA-003 - 分配百分比无效（0-100） - 400

物料关联错误码（FAC-IVLG-xxx）：
- FAC-IVLG-001 - 物料关联不存在 - 404
- FAC-IVLG-002 - 物料关联重复 - 400
- FAC-IVLG-003 - 托盘类型无效 - 400

拣选灯错误码（FAC-PTL-xxx）：
- FAC-PTL-001 - 拣选灯不存在 - 404
- FAC-PTL-002 - 灯编号重复 - 400
- FAC-PTL-003 - 拣选灯被占用，无法删除 - 400
- FAC-PTL-004 - 拣选灯已被占用，无法再次占用 - 400
- FAC-PTL-005 - 关联的库位不存在 - 400
- FAC-PTL-006 - 关联的设备不存在 - 400

灯组错误码（FAC-PTLG-xxx）：
- FAC-PTLG-001 - 灯组不存在 - 404
- FAC-PTLG-002 - 灯组名称重复 - 400
- FAC-PTLG-003 - 灯组类型无效 - 400

---

## 7. 安全设计

### 数据权限

- 所有数据按 isolationId（facilityId）隔离
- 查询时自动添加 isolationId 条件
- 使用 @FacilityIsolation 注解标记需要隔离的实体

### 权限控制

设备管理权限：
- equipment:create - 创建设备
- equipment:update - 更新设备
- equipment:delete - 删除设备
- equipment:view - 查看设备
- equipment:occupy - 占用/释放设备

虚拟位置组管理权限：
- vlg:create - 创建 VLG
- vlg:update - 更新 VLG
- vlg:delete - 删除 VLG
- vlg:view - 查看 VLG

拣选灯管理权限：
- picktolight:create - 创建拣选灯
- picktolight:update - 更新拣选灯
- picktolight:delete - 删除拣选灯
- picktolight:view - 查看拣选灯

---

## 8. 性能考虑

### 索引设计

设备表索引：
- idx_isolationId - 设施隔离查询
- idx_type - 按类型查询
- idx_status - 按状态查询
- idx_locationId - 按位置查询
- idx_barcode - 条码查询

虚拟位置组表索引：
- idx_isolationId - 设施隔离查询
- idx_type - 按类型查询
- idx_name - 按名称查询

### 批量处理

- 批量创建设备：支持一次创建多个空料箱
- 批量删除拣选灯：支持批量删除操作
- 批量变更位置：支持批量变更设备位置

### 缓存策略

设备缓存：
- 数据：设备基础信息
- 缓存位置：本地缓存
- TTL：5 分钟
- 说明：高频查询场景

VLG 缓存：
- 数据：VLG 配置信息
- 缓存位置：本地缓存
- TTL：10 分钟
- 说明：配置相对稳定



