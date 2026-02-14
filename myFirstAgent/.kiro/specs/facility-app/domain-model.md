# Facility 模块 - 领域建模

## 1. 聚合设计

### 1.1 Equipment 聚合（设备聚合）

聚合根：Equipment

属性：
- id: EquipmentId - 设备唯一标识（UUID）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID（Facility ID）
- name: String - 设备名称
- type: EquipmentType - 设备类型（TOTE/TOTE_CART/TOTE_SEC/CUBI_SCANNER）
- status: EquipmentStatus - 设备状态（ACTIVE/INACTIVE/OCCUPIED）
- hlpId: String - HLP ID
- barcode: String - 条码
- barcodeNum: Long - 条码数字
- length: Double - 长度（CM）
- width: Double - 宽度（CM）
- height: Double - 高度（CM）
- capacity: Double - 容量
- currentFillRate: Double - 当前填充率
- occupiedBy: String - 占用者（任务 ID）
- parentId: EquipmentId - 父设备 ID
- spaceStatus: EquipmentSpaceStatus - 空间状态（EMPTY/OCCUPIED/RESERVED/FULL）
- reservedBy: String - 预留者
- locationId: LocationId - 位置 ID
- locationType: String - 位置类型
- serverName: String - 服务器名称
- tags: List of String - 标签列表
- rfids: List of String - RFID 列表
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(builder: EquipmentBuilder): Equipment
- 说明：创建设备
- 业务规则：BR-EQ-001, BR-EQ-002
- 发布事件：EquipmentCreatedEvent

update(command: UpdateEquipmentCommand): void
- 说明：更新设备信息
- 发布事件：EquipmentUpdatedEvent

delete(): void
- 说明：删除设备
- 业务规则：BR-EQ-003
- 发布事件：EquipmentDeletedEvent

occupy(occupiedBy: String): void
- 说明：占用设备
- 业务规则：BR-EQ-004
- 发布事件：EquipmentOccupiedEvent

release(): void
- 说明：释放设备
- 发布事件：EquipmentReleasedEvent

forceRelease(): void
- 说明：强制释放设备
- 发布事件：EquipmentReleasedEvent

updateLocation(locationId: LocationId): void
- 说明：更新设备位置
- 业务规则：BR-EQ-007

updateFillRate(fillRate: Double): void
- 说明：更新填充率
- 业务规则：BR-EQ-005

getOccupiedTaskId(): String
- 说明：获取占用的任务 ID

getTypeDisplayName(): String
- 说明：获取类型显示名称

聚合不变量：
- 设备 ID 不能为空
- 设施 ID 不能为空
- 设备类型必须是有效枚举值
- 已被占用的设备不能再次被占用

---

### 1.2 EquipmentFillRateRecord 聚合（设备填充率记录聚合）

聚合根：EquipmentFillRateRecord

属性：
- id: Long - 记录唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- equipmentId: EquipmentId - 设备 ID
- barcode: String - 条码
- slotCode: String - 槽位代码
- fillRate: Double - 填充率
- overFlow: Boolean - 是否溢出
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(equipmentId: EquipmentId, fillRate: Double): EquipmentFillRateRecord
- 说明：创建填充率记录
- 发布事件：FillRateRecordedEvent

聚合不变量：
- 设备 ID 不能为空
- 填充率不能为负数

---

### 1.3 VirtualLocationGroup 聚合（虚拟位置组聚合）

聚合根：VirtualLocationGroup

属性：
- id: VlgId - VLG 唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- name: String - VLG 名称
- tagIds: List of Long - 标签 ID 列表
- type: VirtualLocationGroupType - VLG 类型
- supportPickType: PickType - 支持的拣选类型
- disallowToMixItemOnSameLocation: Boolean - 禁止同库位混放
- disallowToMixLotNoOnSameLocation: Boolean - 禁止同库位混批次
- skipOccupiedLocationOnPutAway: Boolean - 上架跳过已占用位置
- occupiedBy: List of String - 占用者列表
- airRobLocationIds: List of String - AirRob 位置 ID 列表
- stagingVlgConnectionIds: List of String - 暂存 VLG 连接 ID 列表
- maximumAllowedPartialPallet: Integer - 最大部分托盘数
- enableDepletedLocation: Boolean - 启用耗尽位置
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateVlgCommand): VirtualLocationGroup
- 说明：创建虚拟位置组
- 业务规则：BR-VLG-001, BR-VLG-003
- 发布事件：VirtualLocationGroupCreatedEvent

update(command: UpdateVlgCommand): void
- 说明：更新 VLG 信息
- 发布事件：VirtualLocationGroupUpdatedEvent

delete(): void
- 说明：删除 VLG
- 业务规则：BR-VLG-002
- 发布事件：VirtualLocationGroupDeletedEvent

associateTags(tagIds: List of Long): void
- 说明：关联标签
- 业务规则：BR-TAG-003

updateConfig(config: VlgConfig): void
- 说明：更新配置

聚合不变量：
- VLG 名称不能为空
- 设施 ID 不能为空
- VLG 类型必须是有效枚举值

---

### 1.4 VirtualLocationTag 聚合（虚拟位置标签聚合）

聚合根：VirtualLocationTag

属性：
- id: TagId - 标签唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- name: String - 标签名称
- desc: String - 标签描述
- locationIds: List of String - 库位 ID 列表
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateTagCommand): VirtualLocationTag
- 说明：创建标签
- 业务规则：BR-TAG-001
- 发布事件：VirtualLocationTagCreatedEvent

update(command: UpdateTagCommand): void
- 说明：更新标签
- 发布事件：VirtualLocationTagUpdatedEvent

delete(): void
- 说明：删除标签
- 业务规则：BR-TAG-002
- 发布事件：VirtualLocationTagDeletedEvent

associateLocations(locationIds: List of String): void
- 说明：关联库位

removeLocations(locationIds: List of String): void
- 说明：移除库位关联

聚合不变量：
- 标签名称不能为空
- 设施 ID 不能为空

---

### 1.5 CustomerVlgAllocation 聚合（客户 VLG 分配聚合）

聚合根：CustomerVlgAllocation

属性：
- id: AllocationId - 分配唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- vlgId: VlgId - VLG ID
- customerId: CustomerId - 客户 ID
- category: CustomerVlgAllocationCategory - 分配类别（PUBLIC/PRIMARY/SECONDARY）
- percentage: Integer - 分配百分比
- timeRangeFrom: String - 时间范围开始（HH:mm）
- timeRangeTo: String - 时间范围结束（HH:mm）
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateAllocationCommand): CustomerVlgAllocation
- 说明：创建客户分配
- 业务规则：BR-CVA-001, BR-CVA-002, BR-CVA-003
- 发布事件：CustomerVlgAllocatedEvent

update(command: UpdateAllocationCommand): void
- 说明：更新分配
- 发布事件：CustomerVlgAllocationUpdatedEvent

delete(): void
- 说明：删除分配
- 发布事件：CustomerVlgAllocationDeletedEvent

聚合不变量：
- VLG ID 不能为空
- 客户 ID 不能为空
- 分配百分比必须在 0-100 之间

---

### 1.6 ItemVlg 聚合（物料 VLG 关联聚合）

聚合根：ItemVlg

属性：
- id: ItemVlgId - 关联唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- vlgId: VlgId - VLG ID
- customerId: CustomerId - 客户 ID
- itemId: ItemId - 物料 ID
- palletType: PalletType - 托盘类型（FULL/PARTIAL/CARTON）
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateItemVlgCommand): ItemVlg
- 说明：创建物料关联
- 业务规则：BR-IVLG-001, BR-IVLG-002
- 发布事件：ItemVlgAssociatedEvent

delete(): void
- 说明：删除物料关联
- 发布事件：ItemVlgDeletedEvent

聚合不变量：
- VLG ID 不能为空
- 物料 ID 不能为空
- 托盘类型必须是有效枚举值

---

### 1.7 ItemGroupVlg 聚合（物料组 VLG 关联聚合）

聚合根：ItemGroupVlg

属性：
- id: ItemGroupVlgId - 关联唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- vlgId: VlgId - VLG ID
- customerId: CustomerId - 客户 ID
- titleId: TitleId - 货主 ID
- itemGroupId: ItemGroupId - 物料组 ID
- palletType: PalletType - 托盘类型
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateItemGroupVlgCommand): ItemGroupVlg
- 说明：创建物料组关联
- 业务规则：BR-IGVLG-001
- 发布事件：ItemGroupVlgAssociatedEvent

delete(): void
- 说明：删除物料组关联
- 发布事件：ItemGroupVlgDeletedEvent

聚合不变量：
- VLG ID 不能为空
- 物料组 ID 不能为空

---

### 1.8 TitleVlg 聚合（货主 VLG 关联聚合）

聚合根：TitleVlg

属性：
- id: TitleVlgId - 关联唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- vlgId: VlgId - VLG ID
- customerId: CustomerId - 客户 ID
- titleId: TitleId - 货主 ID
- palletType: PalletType - 托盘类型
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(command: CreateTitleVlgCommand): TitleVlg
- 说明：创建货主关联
- 业务规则：BR-TVLG-001
- 发布事件：TitleVlgAssociatedEvent

delete(): void
- 说明：删除货主关联
- 发布事件：TitleVlgDeletedEvent

聚合不变量：
- VLG ID 不能为空
- 货主 ID 不能为空

---

### 1.9 PickToLight 聚合（拣选灯聚合）

聚合根：PickToLight

属性：
- id: PickToLightId - 拣选灯唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- lightId: String - 灯编号
- groupId: PickToLightGroupId - 灯组 ID
- locationId: LocationId - 库位 ID
- equipmentId: EquipmentId - 设备 ID
- occupiedBy: String - 占用者
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(builder: PickToLightBuilder): PickToLight
- 说明：创建拣选灯
- 业务规则：BR-PTL-001
- 发布事件：PickToLightCreatedEvent

batchCreate(builders: List of PickToLightBuilder): List of PickToLight
- 说明：批量创建拣选灯

update(command: UpdatePickToLightCommand): void
- 说明：更新拣选灯
- 发布事件：PickToLightUpdatedEvent

delete(): void
- 说明：删除拣选灯
- 业务规则：BR-PTL-002
- 发布事件：PickToLightDeletedEvent

associateLocation(locationId: LocationId): void
- 说明：关联库位
- 业务规则：BR-PTL-004

associateEquipment(equipmentId: EquipmentId): void
- 说明：关联设备
- 业务规则：BR-PTL-005

disassociate(): void
- 说明：取消关联

occupy(occupiedBy: String): void
- 说明：占用拣选灯
- 业务规则：BR-PTL-003
- 发布事件：PickToLightOccupiedEvent

release(): void
- 说明：释放拣选灯
- 发布事件：PickToLightReleasedEvent

聚合不变量：
- 灯编号不能为空
- 设施 ID 不能为空
- 已被占用的拣选灯不能再次被占用

---

### 1.10 PickToLightGroup 聚合（拣选灯组聚合）

聚合根：PickToLightGroup

属性：
- id: PickToLightGroupId - 灯组唯一标识（自增）
- tenantId: TenantId - 租户 ID
- isolationId: IsolationId - 设施 ID
- name: String - 灯组名称
- ip: String - IP 地址
- port: String - 端口
- type: PickToLightGroupType - 灯组类型（EQUIPMENT/LOCATION）
- vlgId: VlgId - VLG ID
- toteCartId: EquipmentId - 料箱车 ID
- deviceType: PickToLightDeviceType - 设备类型（带屏/不带屏）
- auditInfo: AuditInfo - 审计信息

聚合方法：

create(builder: PickToLightGroupBuilder): PickToLightGroup
- 说明：创建灯组
- 发布事件：PickToLightGroupCreatedEvent

update(command: UpdatePickToLightGroupCommand): void
- 说明：更新灯组
- 发布事件：PickToLightGroupUpdatedEvent

delete(): void
- 说明：删除灯组
- 发布事件：PickToLightGroupDeletedEvent

聚合不变量：
- 灯组名称不能为空
- 设施 ID 不能为空


---

## 2. 值对象设计

### 2.1 标识类值对象

EquipmentId
- 属性：value: String
- 不变量：不能为空，UUID 格式

VlgId
- 属性：value: Long
- 不变量：不能为空

TagId
- 属性：value: Long
- 不变量：不能为空

LocationId
- 属性：value: String
- 不变量：不能为空

PickToLightId
- 属性：value: Long
- 不变量：不能为空

PickToLightGroupId
- 属性：value: Long
- 不变量：不能为空

CustomerId
- 属性：value: String
- 不变量：可以为空
- 说明：引用外部 Customer 聚合

ItemId
- 属性：value: String
- 不变量：可以为空
- 说明：引用外部 Item 聚合

TitleId
- 属性：value: String
- 不变量：可以为空

ItemGroupId
- 属性：value: String
- 不变量：可以为空

TenantId
- 属性：value: String
- 不变量：不能为空

IsolationId
- 属性：value: String
- 不变量：不能为空
- 说明：设施 ID（Facility ID）

### 2.2 枚举类值对象

EquipmentStatus（设备状态）
- ACTIVE - 启用
- INACTIVE - 禁用
- OCCUPIED - 占用

EquipmentType（设备类型）
- TOTE - 料箱
- TOTE_CART - 料箱车
- TOTE_SEC - 料箱区
- CUBI_SCANNER - 扫描仪

EquipmentSpaceStatus（设备空间状态）
- EMPTY - 空
- OCCUPIED - 占用
- RESERVED - 预留
- FULL - 满

VirtualLocationGroupType（VLG 类型）
- ZONE - 普通区域
- STAGING_ZONE - 暂存区域
- PICKING_ZONE - 拣选区域
- AUTOMATED_PICKING_ZONE - 自动拣选区域
- AIRROB_ZONE - AirRob 区域

CustomerVlgAllocationCategory（客户分配类别）
- PUBLIC - 公共
- PRIMARY - 主要
- SECONDARY - 次要

PalletType（托盘类型）
- FULL - 整托
- PARTIAL - 部分托
- CARTON - 箱

PickToLightGroupType（灯组类型）
- EQUIPMENT - 设备类型
- LOCATION - 库位类型

PickToLightDeviceType（拣选灯设备类型）
- ITEM_PICK_TO_LIGHT_1B4D - 带屏幕
- ITEM_PICK_TO_LIGHT_1B - 不带屏幕

### 2.3 审计信息值对象

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

## 3. 领域服务

### 3.1 EquipmentUniquenessService（设备唯一性服务）

职责：检查设备 ID 的唯一性

方法：

checkIdUniqueness(isolationId: IsolationId, equipmentId: EquipmentId): void
- 参数：设施 ID、设备 ID
- 返回：无（不唯一时抛出异常）
- 说明：检查设备 ID 在设施下是否唯一

依赖：
- EquipmentRepository

### 3.2 EquipmentDeletionService（设备删除服务）

职责：检查设备是否可以删除

方法：

checkCanDelete(equipmentId: EquipmentId): void
- 参数：设备 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查设备是否被占用

依赖：
- EquipmentRepository

### 3.3 EquipmentFillRateService（设备填充率服务）

职责：管理设备填充率的采集和记录

方法：

recordFillRate(equipmentId: EquipmentId, fillRate: Double): void
- 参数：设备 ID、填充率
- 返回：无
- 说明：记录填充率并更新设备当前填充率

依赖：
- EquipmentRepository
- EquipmentFillRateRecordRepository

### 3.4 VlgUniquenessService（VLG 唯一性服务）

职责：检查 VLG 名称的唯一性

方法：

checkNameUniqueness(isolationId: IsolationId, name: String, excludeVlgId: VlgId): void
- 参数：设施 ID、名称、排除的 VLG ID
- 返回：无（不唯一时抛出异常）

依赖：
- VirtualLocationGroupRepository

### 3.5 VlgDeletionService（VLG 删除服务）

职责：检查 VLG 是否可以删除

方法：

checkCanDelete(vlgId: VlgId): void
- 参数：VLG ID
- 返回：无（不能删除时抛出异常）
- 说明：检查是否有客户分配或物料关联

依赖：
- CustomerVlgAllocationRepository
- ItemVlgRepository
- ItemGroupVlgRepository
- TitleVlgRepository

### 3.6 TagUniquenessService（标签唯一性服务）

职责：检查标签名称的唯一性

方法：

checkNameUniqueness(isolationId: IsolationId, name: String, excludeTagId: TagId): void
- 参数：设施 ID、名称、排除的标签 ID
- 返回：无（不唯一时抛出异常）

依赖：
- VirtualLocationTagRepository

### 3.7 TagDeletionService（标签删除服务）

职责：检查标签是否可以删除

方法：

checkCanDelete(tagId: TagId): void
- 参数：标签 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查是否被 VLG 使用

依赖：
- VirtualLocationGroupRepository

### 3.8 PickToLightUniquenessService（拣选灯唯一性服务）

职责：检查灯编号的唯一性

方法：

checkLightIdUniqueness(isolationId: IsolationId, lightId: String): void
- 参数：设施 ID、灯编号
- 返回：无（不唯一时抛出异常）

依赖：
- PickToLightRepository

### 3.9 PickToLightDeletionService（拣选灯删除服务）

职责：检查拣选灯是否可以删除

方法：

checkCanDelete(pickToLightId: PickToLightId): void
- 参数：拣选灯 ID
- 返回：无（不能删除时抛出异常）
- 说明：检查是否被占用

依赖：
- PickToLightRepository


---

## 4. 领域事件

### 设备事件

EquipmentCreatedEvent
- 触发时机：设备创建成功
- 携带数据：equipmentId, isolationId, type, status
- 订阅者：无

EquipmentUpdatedEvent
- 触发时机：设备更新成功
- 携带数据：equipmentId, isolationId, changedFields
- 订阅者：无

EquipmentDeletedEvent
- 触发时机：设备删除成功
- 携带数据：equipmentId, isolationId
- 订阅者：无

EquipmentOccupiedEvent
- 触发时机：设备被占用
- 携带数据：equipmentId, isolationId, occupiedBy
- 订阅者：无

EquipmentReleasedEvent
- 触发时机：设备被释放
- 携带数据：equipmentId, isolationId
- 订阅者：无

FillRateRecordedEvent
- 触发时机：填充率记录成功
- 携带数据：equipmentId, fillRate, overFlow
- 订阅者：无

### VLG 事件

VirtualLocationGroupCreatedEvent
- 触发时机：VLG 创建成功
- 携带数据：vlgId, isolationId, name, type
- 订阅者：无

VirtualLocationGroupUpdatedEvent
- 触发时机：VLG 更新成功
- 携带数据：vlgId, isolationId, changedFields
- 订阅者：无

VirtualLocationGroupDeletedEvent
- 触发时机：VLG 删除成功
- 携带数据：vlgId, isolationId, name
- 订阅者：无

### 标签事件

VirtualLocationTagCreatedEvent
- 触发时机：标签创建成功
- 携带数据：tagId, isolationId, name
- 订阅者：无

VirtualLocationTagUpdatedEvent
- 触发时机：标签更新成功
- 携带数据：tagId, isolationId, changedFields
- 订阅者：无

VirtualLocationTagDeletedEvent
- 触发时机：标签删除成功
- 携带数据：tagId, isolationId, name
- 订阅者：无

### 客户分配事件

CustomerVlgAllocatedEvent
- 触发时机：客户分配创建成功
- 携带数据：allocationId, vlgId, customerId, category
- 订阅者：无

CustomerVlgAllocationUpdatedEvent
- 触发时机：客户分配更新成功
- 携带数据：allocationId, vlgId, changedFields
- 订阅者：无

CustomerVlgAllocationDeletedEvent
- 触发时机：客户分配删除成功
- 携带数据：allocationId, vlgId, customerId
- 订阅者：无

### 物料关联事件

ItemVlgAssociatedEvent
- 触发时机：物料关联创建成功
- 携带数据：itemVlgId, vlgId, itemId, customerId
- 订阅者：无

ItemVlgDeletedEvent
- 触发时机：物料关联删除成功
- 携带数据：itemVlgId, vlgId, itemId
- 订阅者：无

ItemGroupVlgAssociatedEvent
- 触发时机：物料组关联创建成功
- 携带数据：itemGroupVlgId, vlgId, itemGroupId
- 订阅者：无

ItemGroupVlgDeletedEvent
- 触发时机：物料组关联删除成功
- 携带数据：itemGroupVlgId, vlgId, itemGroupId
- 订阅者：无

TitleVlgAssociatedEvent
- 触发时机：货主关联创建成功
- 携带数据：titleVlgId, vlgId, titleId
- 订阅者：无

TitleVlgDeletedEvent
- 触发时机：货主关联删除成功
- 携带数据：titleVlgId, vlgId, titleId
- 订阅者：无

### 拣选灯事件

PickToLightCreatedEvent
- 触发时机：拣选灯创建成功
- 携带数据：pickToLightId, isolationId, lightId, groupId
- 订阅者：无

PickToLightUpdatedEvent
- 触发时机：拣选灯更新成功
- 携带数据：pickToLightId, isolationId, changedFields
- 订阅者：无

PickToLightDeletedEvent
- 触发时机：拣选灯删除成功
- 携带数据：pickToLightId, isolationId, lightId
- 订阅者：无

PickToLightOccupiedEvent
- 触发时机：拣选灯被占用
- 携带数据：pickToLightId, isolationId, occupiedBy
- 订阅者：无

PickToLightReleasedEvent
- 触发时机：拣选灯被释放
- 携带数据：pickToLightId, isolationId
- 订阅者：无

PickToLightGroupCreatedEvent
- 触发时机：灯组创建成功
- 携带数据：groupId, isolationId, name, type
- 订阅者：无

PickToLightGroupUpdatedEvent
- 触发时机：灯组更新成功
- 携带数据：groupId, isolationId, changedFields
- 订阅者：无

PickToLightGroupDeletedEvent
- 触发时机：灯组删除成功
- 携带数据：groupId, isolationId, name
- 订阅者：无

---

## 5. 仓储接口

### EquipmentRepository

职责：Equipment 聚合的持久化

方法：
- save(equipment: Equipment): void
- findById(id: EquipmentId): Optional of Equipment
- findByIsolationIdAndId(isolationId: IsolationId, id: EquipmentId): Optional of Equipment
- findByIsolationIdAndBarcode(isolationId: IsolationId, barcode: String): Optional of Equipment
- findByIsolationIdAndType(isolationId: IsolationId, type: EquipmentType): List of Equipment
- findByIsolationIdAndStatus(isolationId: IsolationId, status: EquipmentStatus): List of Equipment
- findByIsolationIdAndLocationId(isolationId: IsolationId, locationId: LocationId): List of Equipment
- delete(equipment: Equipment): void
- existsByIsolationIdAndId(isolationId: IsolationId, id: EquipmentId): Boolean

### EquipmentFillRateRecordRepository

职责：EquipmentFillRateRecord 聚合的持久化

方法：
- save(record: EquipmentFillRateRecord): void
- findByEquipmentId(equipmentId: EquipmentId): List of EquipmentFillRateRecord
- findByEquipmentIdOrderByCreatedTimeDesc(equipmentId: EquipmentId): List of EquipmentFillRateRecord

### VirtualLocationGroupRepository

职责：VirtualLocationGroup 聚合的持久化

方法：
- save(vlg: VirtualLocationGroup): void
- findById(id: VlgId): Optional of VirtualLocationGroup
- findByIsolationIdAndName(isolationId: IsolationId, name: String): Optional of VirtualLocationGroup
- findByIsolationIdAndType(isolationId: IsolationId, type: VirtualLocationGroupType): List of VirtualLocationGroup
- findByIsolationIdAndTagIdsContaining(isolationId: IsolationId, tagId: Long): List of VirtualLocationGroup
- delete(vlg: VirtualLocationGroup): void
- existsByIsolationIdAndName(isolationId: IsolationId, name: String): Boolean

### VirtualLocationTagRepository

职责：VirtualLocationTag 聚合的持久化

方法：
- save(tag: VirtualLocationTag): void
- findById(id: TagId): Optional of VirtualLocationTag
- findByIsolationIdAndName(isolationId: IsolationId, name: String): Optional of VirtualLocationTag
- findAllByIsolationId(isolationId: IsolationId): List of VirtualLocationTag
- delete(tag: VirtualLocationTag): void
- existsByIsolationIdAndName(isolationId: IsolationId, name: String): Boolean

### CustomerVlgAllocationRepository

职责：CustomerVlgAllocation 聚合的持久化

方法：
- save(allocation: CustomerVlgAllocation): void
- findById(id: AllocationId): Optional of CustomerVlgAllocation
- findByVlgId(vlgId: VlgId): List of CustomerVlgAllocation
- findByCustomerId(customerId: CustomerId): List of CustomerVlgAllocation
- findByVlgIdAndCustomerIdAndCategory(vlgId: VlgId, customerId: CustomerId, category: CustomerVlgAllocationCategory): Optional of CustomerVlgAllocation
- delete(allocation: CustomerVlgAllocation): void
- existsByVlgId(vlgId: VlgId): Boolean

### ItemVlgRepository

职责：ItemVlg 聚合的持久化

方法：
- save(itemVlg: ItemVlg): void
- findById(id: ItemVlgId): Optional of ItemVlg
- findByVlgId(vlgId: VlgId): List of ItemVlg
- findByItemId(itemId: ItemId): List of ItemVlg
- findByVlgIdAndItemIdAndCustomerId(vlgId: VlgId, itemId: ItemId, customerId: CustomerId): Optional of ItemVlg
- delete(itemVlg: ItemVlg): void
- existsByVlgId(vlgId: VlgId): Boolean

### ItemGroupVlgRepository

职责：ItemGroupVlg 聚合的持久化

方法：
- save(itemGroupVlg: ItemGroupVlg): void
- findById(id: ItemGroupVlgId): Optional of ItemGroupVlg
- findByVlgId(vlgId: VlgId): List of ItemGroupVlg
- delete(itemGroupVlg: ItemGroupVlg): void
- existsByVlgId(vlgId: VlgId): Boolean

### TitleVlgRepository

职责：TitleVlg 聚合的持久化

方法：
- save(titleVlg: TitleVlg): void
- findById(id: TitleVlgId): Optional of TitleVlg
- findByVlgId(vlgId: VlgId): List of TitleVlg
- findByVlgIdAndTitleIdAndCustomerId(vlgId: VlgId, titleId: TitleId, customerId: CustomerId): Optional of TitleVlg
- delete(titleVlg: TitleVlg): void
- existsByVlgId(vlgId: VlgId): Boolean

### PickToLightRepository

职责：PickToLight 聚合的持久化

方法：
- save(pickToLight: PickToLight): void
- findById(id: PickToLightId): Optional of PickToLight
- findByIsolationIdAndLightId(isolationId: IsolationId, lightId: String): Optional of PickToLight
- findByGroupId(groupId: PickToLightGroupId): List of PickToLight
- findByLocationId(locationId: LocationId): List of PickToLight
- delete(pickToLight: PickToLight): void
- existsByIsolationIdAndLightId(isolationId: IsolationId, lightId: String): Boolean

### PickToLightGroupRepository

职责：PickToLightGroup 聚合的持久化

方法：
- save(group: PickToLightGroup): void
- findById(id: PickToLightGroupId): Optional of PickToLightGroup
- findByIsolationIdAndName(isolationId: IsolationId, name: String): Optional of PickToLightGroup
- findByIsolationIdAndType(isolationId: IsolationId, type: PickToLightGroupType): List of PickToLightGroup
- findAllByIsolationId(isolationId: IsolationId): List of PickToLightGroup
- delete(group: PickToLightGroup): void
