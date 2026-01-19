# Facility 模块 - 领域分析

## 1. 统一语言（Ubiquitous Language）

### 设备管理（Equipment）

- 设备 - 仓库中可用的工具与器械，如托盘、料箱等 - Equipment
- 设备 ID - 设备的唯一标识符 - EquipmentId
- 设备类型 - 设备的分类（料箱/料箱车/料箱区/扫描仪） - EquipmentType
- 设备状态 - 设备的可用状态（启用/禁用/占用） - EquipmentStatus
- 空间状态 - 设备的空间占用状态（空/占用/预留/满） - EquipmentSpaceStatus
- 填充率 - 设备当前的容积利用比率 - FillRate
- 设备检查 - 对设备状态和安全的标准化检视 - EquipmentInspection
- 占用者 - 当前占用设备的任务或用户 - OccupiedBy
- 条码 - 设备的条码标识 - Barcode

### 库位管理（Location）

- 库位 - 仓库中用于存储货物的最小物理空间单元 - Location
- 库位 ID - 库位的唯一标识符 - LocationId
- 库位类型 - 库位的分类 - LocationType
- 库位状态 - 库位的可用状态 - LocationStatus
- 空间状态 - 库位的空间占用状态 - SpaceStatus
- 月台状态 - 月台库位的状态 - DockStatus
- 设备状态 - 库位关联设备的状态 - DeviceStatus
- 巷道 - 仓库货物摆放通道 - Aisle
- 动态属性 - 库位的自定义扩展属性 - DynamicProperty
- 特性列表 - 库位的特性标记 - Features

### 虚拟位置组管理（VirtualLocationGroup）

- 虚拟位置组 - 若干实际库位的逻辑组合 - VirtualLocationGroup (VLG)
- VLG 类型 - 虚拟位置组的分类 - VirtualLocationGroupType
- 虚拟位置标签 - 用于标识和归类位置的标签 - VirtualLocationTag
- 客户 VLG 分配 - 客户与虚拟位置组之间的关系 - CustomerVlgAllocation
- 分配类别 - 客户分配的类型（公共/主要/次要） - AllocationCategory
- 物料 VLG 关联 - 物料与虚拟位置组的绑定关系 - ItemVlg
- 物料组 VLG 关联 - 物料组与虚拟位置组的绑定关系 - ItemGroupVlg
- 货主 VLG 关联 - 货主与虚拟位置组的绑定关系 - TitleVlg
- 托盘类型 - 托盘的分类（整托/部分托/箱） - PalletType
- 拣选类型 - VLG 支持的拣选方式 - PickType

### 拣选灯管理（PickToLight）

- 拣选灯 - 用于指示拣选位置的灯光设备 - PickToLight
- 灯组 - 拣选灯的分组 - PickToLightGroup
- 灯组类型 - 灯组的分类（设备/库位） - PickToLightGroupType
- 设备类型 - 拣选灯设备的类型（带屏/不带屏） - PickToLightDeviceType
- 拣选灯关联 - 拣选灯与库位/设备的关联关系 - PickToLightRelation

---

## 2. 枚举定义

### EquipmentStatus（设备状态）

- ACTIVE - 启用，设备可正常使用
- INACTIVE - 禁用，设备暂停使用
- OCCUPIED - 占用，设备正在被使用

### EquipmentType（设备类型）

- TOTE - 料箱
- TOTE_CART - 料箱车
- TOTE_SEC - 料箱区
- CUBI_SCANNER - 扫描仪

### EquipmentSpaceStatus（设备空间状态）

- EMPTY - 空，设备内无货物
- OCCUPIED - 占用，设备内有货物
- RESERVED - 预留，设备已被预留
- FULL - 满，设备已满载

### VirtualLocationGroupType（虚拟位置组类型）

- ZONE - 普通区域（优先级 0）
- STAGING_ZONE - 暂存区域（优先级 0）
- PICKING_ZONE - 拣选区域（优先级 1）
- AUTOMATED_PICKING_ZONE - 自动拣选区域（优先级 1）
- AIRROB_ZONE - AirRob 区域（优先级 1）

### CustomerVlgAllocationCategory（客户分配类别）

- PUBLIC - 公共，所有客户共享
- PRIMARY - 主要，客户的主要分配
- SECONDARY - 次要，客户的次要分配

### PalletType（托盘类型）

- FULL - 整托
- PARTIAL - 部分托
- CARTON - 箱

### PickToLightGroupType（灯组类型）

- EQUIPMENT - 设备类型
- LOCATION - 库位类型

### PickToLightDeviceType（拣选灯设备类型）

- ITEM_PICK_TO_LIGHT_1B4D - 带屏幕
- ITEM_PICK_TO_LIGHT_1B - 不带屏幕

---

## 3. 领域识别

### 核心域（Core Domain）

设备管理（Equipment Management）
- 设备是仓库作业的核心资源
- 直接影响收货、上架、拣选等核心业务
- 需要实时跟踪设备状态和位置
- 投入优先级：最高

库位管理（Location Management）
- 库位是仓库存储的基础单元
- 直接影响库存管理和作业效率
- 需要支持灵活的属性配置
- 投入优先级：最高

### 支撑域（Supporting Domain）

虚拟位置组管理（VLG Management）
- 支持库位的逻辑分组
- 提供灵活的客户和物料分配能力
- 投入优先级：高

拣选灯管理（PickToLight Management）
- 支持拣选作业的灯光指引
- 提高拣选效率和准确率
- 投入优先级：中等

### 通用域（Generic Domain）

文件管理（File Management）
- 设备检查照片的存储
- 可使用通用文件服务
- 投入优先级：低

---

## 4. 限界上下文（Bounded Context）

### 上下文划分

设备上下文（Equipment Context）
- 职责：管理设备基础信息、状态、填充率、检查记录
- 核心概念：Equipment, EquipmentStatus, FillRate, Inspection
- 所属领域：核心域

库位上下文（Location Context）
- 职责：管理库位基础数据、空间属性、动态属性
- 核心概念：Location, LocationStatus, SpaceStatus, DynamicProperty
- 所属领域：核心域

虚拟位置组上下文（VLG Context）
- 职责：管理虚拟位置组、标签、客户分配、物料关联
- 核心概念：VirtualLocationGroup, VirtualLocationTag, CustomerVlgAllocation, ItemVlg, ItemGroupVlg, TitleVlg
- 所属领域：支撑域

拣选灯上下文（PickToLight Context）
- 职责：管理拣选灯设备、灯组、关联关系
- 核心概念：PickToLight, PickToLightGroup, PickToLightRelation
- 所属领域：支撑域

### 上下文映射

```
+------------------+     +------------------+
| Equipment Context|     | Location Context |
+------------------+     +------------------+
        |                        |
        | 引用                   | 引用
        v                        v
+------------------------------------------+
|           VLG Context                    |
| (VirtualLocationGroup, Tag, Allocation)  |
+------------------------------------------+
        |
        | 引用
        v
+------------------+
| PickToLight Ctx  |
+------------------+
```

### 上下文关系说明

- Equipment Context 和 Location Context 是核心上下文
- VLG Context 引用 Location Context 的库位信息
- VLG Context 引用外部 Customer（客户）和 Item（物料）聚合
- PickToLight Context 引用 Equipment Context 和 Location Context
- 上下文之间通过 ID 引用，API 同步调用

### 外部依赖

```
[Customer Context]      [Item Context]        [Facility Context]
(外部 mdm-app)          (外部 mdm-app)              |
      |                       |                     v
      v                       v              +-------------+
+------------+          +------------+       | VLG         |
| Customer   |  <------ | Item       | <---- | (customerId)|
| (客户)     |          | (物料)     |       | (itemId)    |
+------------+          +------------+       +-------------+
```

---

## 5. 业务流程

### 5.1 设备管理流程

```
[仓库管理员]
     |
     v
(1) 创建设备
     |
     +-- 填写设备 ID、名称、类型
     |
     +-- 设置尺寸、容量
     |
     v
(2) 设备状态管理
     |
     +-- 启用/禁用设备
     |
     +-- 占用/释放设备
     |
     v
(3) 设备位置变更
     |
     +-- 上架到库位
     |
     +-- 下架离开库位
     |
     v
(4) 填充率采集
     |
     +-- 系统自动采集
     |
     +-- 记录历史数据
     |
     v
(5) 设备检查
     |
     +-- 操作员提交检查记录
     |
     +-- 上传检查照片
     |
     v
[设备管理完成]
```

### 5.2 库位管理流程

```
[仓库管理员]
     |
     v
(1) 创建库位
     |
     +-- 填写库位 ID、名称、类型
     |
     +-- 设置物理属性（尺寸、容量）
     |
     v
(2) 库位状态管理
     |
     +-- 更新库位状态
     |
     +-- 更新空间状态
     |
     +-- 更新月台/设备状态
     |
     v
(3) 动态属性维护
     |
     +-- 设置文本属性
     |
     +-- 设置日期属性
     |
     +-- 设置特性列表
     |
     v
(4) 批量操作
     |
     +-- 批量导入库位
     |
     +-- 批量导出库位
     |
     v
[库位管理完成]
```

### 5.3 虚拟位置组管理流程

```
[仓库管理员]
     |
     v
(1) 创建虚拟位置组
     |
     +-- 填写名称、类型
     |
     +-- 配置业务规则
     |
     v
(2) 标签管理
     |
     +-- 创建标签
     |
     +-- 关联库位到标签
     |
     +-- 关联标签到 VLG
     |
     v
(3) 客户分配
     |
     +-- 分配客户到 VLG
     |
     +-- 设置分配类别和百分比
     |
     +-- 设置时间范围
     |
     v
(4) 物料关联
     |
     +-- 关联物料到 VLG
     |
     +-- 关联物料组到 VLG
     |
     +-- 关联货主到 VLG
     |
     v
[VLG 管理完成]
```

### 5.4 拣选灯管理流程

```
[仓库管理员]
     |
     v
(1) 创建拣选灯
     |
     +-- 填写灯编号、灯组
     |
     +-- 设置设备类型
     |
     v
(2) 关联管理
     |
     +-- 关联到库位
     |
     +-- 关联到设备
     |
     v
(3) 占用管理
     |
     +-- 操作员占用拣选灯
     |
     +-- 操作员释放拣选灯
     |
     v
[拣选灯管理完成]
```

---

## 6. 业务规则

### 设备规则（BR-EQ-xxx）

BR-EQ-001
- 规则：同一设施下设备 ID 必须唯一
- 触发场景：创建设备、修改设备 ID

BR-EQ-002
- 规则：设备类型必须是有效的 EquipmentType 枚举值
- 触发场景：创建设备、修改设备类型

BR-EQ-003
- 规则：设备删除前必须检查是否被占用
- 触发场景：删除设备

BR-EQ-004
- 规则：已被占用的设备不能再次被占用
- 触发场景：占用设备

BR-EQ-005
- 规则：填充率变动需实时记录到历史表
- 触发场景：更新填充率

BR-EQ-006
- 规则：设备检查记录一旦保存不可修改（只读）
- 触发场景：保存检查记录

BR-EQ-007
- 规则：设备位置变更时目标库位必须存在
- 触发场景：变更设备位置

BR-EQ-008
- 规则：批量创建空料箱时自动生成设备 ID 和条码
- 触发场景：批量创建空料箱

### 库位规则（BR-LOC-xxx）

BR-LOC-001
- 规则：同一设施下库位 ID 必须唯一
- 触发场景：创建库位、修改库位 ID

BR-LOC-002
- 规则：库位删除前必须检查是否有库存
- 触发场景：删除库位

BR-LOC-003
- 规则：库位状态变更需记录变更时间
- 触发场景：更新库位状态

BR-LOC-004
- 规则：批量导入时重复的库位 ID 标记错误并跳过
- 触发场景：批量导入库位

BR-LOC-005
- 规则：库位类型必须是有效的枚举值
- 触发场景：创建库位、修改库位类型

### 虚拟位置组规则（BR-VLG-xxx）

BR-VLG-001
- 规则：同一设施下 VLG 名称必须唯一
- 触发场景：创建 VLG、修改 VLG 名称

BR-VLG-002
- 规则：VLG 删除前必须检查是否有客户分配或物料关联
- 触发场景：删除 VLG

BR-VLG-003
- 规则：VLG 类型必须是有效的 VirtualLocationGroupType 枚举值
- 触发场景：创建 VLG、修改 VLG 类型

BR-VLG-004
- 规则：最大部分托盘数必须大于等于 0
- 触发场景：配置 VLG

### 标签规则（BR-TAG-xxx）

BR-TAG-001
- 规则：同一设施下标签名称必须唯一
- 触发场景：创建标签、修改标签名称

BR-TAG-002
- 规则：标签删除前必须检查是否被 VLG 使用
- 触发场景：删除标签

BR-TAG-003
- 规则：同一标签不能被多个同类型 VLG 使用
- 触发场景：VLG 关联标签

### 客户分配规则（BR-CVA-xxx）

BR-CVA-001
- 规则：同一客户在同一 VLG 下不能有相同类别的重复分配
- 触发场景：创建客户分配

BR-CVA-002
- 规则：分配百分比必须在 0-100 之间
- 触发场景：创建/更新客户分配

BR-CVA-003
- 规则：时间范围格式必须是 HH:mm
- 触发场景：创建/更新客户分配

### 物料关联规则（BR-IVLG-xxx）

BR-IVLG-001
- 规则：同一物料在同一 VLG 和客户下不能重复关联
- 触发场景：创建物料关联

BR-IVLG-002
- 规则：托盘类型必须是有效的 PalletType 枚举值
- 触发场景：创建物料关联

### 物料组关联规则（BR-IGVLG-xxx）

BR-IGVLG-001
- 规则：同一物料组在同一 VLG、客户、货主下不能重复关联
- 触发场景：创建物料组关联

### 货主关联规则（BR-TVLG-xxx）

BR-TVLG-001
- 规则：同一货主在同一 VLG 和客户下不能重复关联
- 触发场景：创建货主关联

### 拣选灯规则（BR-PTL-xxx）

BR-PTL-001
- 规则：同一设施下灯编号必须唯一
- 触发场景：创建拣选灯

BR-PTL-002
- 规则：拣选灯删除前必须检查是否被占用
- 触发场景：删除拣选灯

BR-PTL-003
- 规则：已被占用的拣选灯不能再次被占用
- 触发场景：占用拣选灯

BR-PTL-004
- 规则：关联库位时库位必须存在
- 触发场景：关联拣选灯到库位

BR-PTL-005
- 规则：关联设备时设备必须存在
- 触发场景：关联拣选灯到设备

---

## 7. 事件风暴

### 设备相关

创建设备
- 命令：CreateEquipment
- 事件：EquipmentCreatedEvent
- 策略：无

更新设备
- 命令：UpdateEquipment
- 事件：EquipmentUpdatedEvent
- 策略：无

删除设备
- 命令：DeleteEquipment
- 事件：EquipmentDeletedEvent
- 策略：检查是否被占用

占用设备
- 命令：OccupyEquipment
- 事件：EquipmentOccupiedEvent
- 策略：检查是否已被占用

释放设备
- 命令：ReleaseEquipment
- 事件：EquipmentReleasedEvent
- 策略：无

记录填充率
- 命令：RecordFillRate
- 事件：FillRateRecordedEvent
- 策略：更新设备当前填充率

记录设备检查
- 命令：RecordInspection
- 事件：InspectionRecordedEvent
- 策略：无

### 库位相关

创建库位
- 命令：CreateLocation
- 事件：LocationCreatedEvent
- 策略：无

更新库位
- 命令：UpdateLocation
- 事件：LocationUpdatedEvent
- 策略：无

删除库位
- 命令：DeleteLocation
- 事件：LocationDeletedEvent
- 策略：检查是否有库存

更新库位状态
- 命令：UpdateLocationStatus
- 事件：LocationStatusUpdatedEvent
- 策略：无

### VLG 相关

创建 VLG
- 命令：CreateVirtualLocationGroup
- 事件：VirtualLocationGroupCreatedEvent
- 策略：无

更新 VLG
- 命令：UpdateVirtualLocationGroup
- 事件：VirtualLocationGroupUpdatedEvent
- 策略：无

删除 VLG
- 命令：DeleteVirtualLocationGroup
- 事件：VirtualLocationGroupDeletedEvent
- 策略：检查是否有关联数据

创建标签
- 命令：CreateVirtualLocationTag
- 事件：VirtualLocationTagCreatedEvent
- 策略：无

分配客户
- 命令：AllocateCustomerToVlg
- 事件：CustomerVlgAllocatedEvent
- 策略：无

关联物料
- 命令：AssociateItemToVlg
- 事件：ItemVlgAssociatedEvent
- 策略：无

### 拣选灯相关

创建拣选灯
- 命令：CreatePickToLight
- 事件：PickToLightCreatedEvent
- 策略：无

更新拣选灯
- 命令：UpdatePickToLight
- 事件：PickToLightUpdatedEvent
- 策略：无

删除拣选灯
- 命令：DeletePickToLight
- 事件：PickToLightDeletedEvent
- 策略：检查是否被占用

占用拣选灯
- 命令：OccupyPickToLight
- 事件：PickToLightOccupiedEvent
- 策略：检查是否已被占用

释放拣选灯
- 命令：ReleasePickToLight
- 事件：PickToLightReleasedEvent
- 策略：无

