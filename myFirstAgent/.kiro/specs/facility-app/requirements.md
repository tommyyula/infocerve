# Facility 模块 - 需求规格

## 术语表

引用 domain-analysis.md 中的统一语言。

---

## 模块范围

本文档覆盖 4 个核心模块：
1. 设备管理（Equipment）
2. 库位管理（Location）
3. 虚拟位置组管理（VirtualLocationGroup）- 含 6 个子模块
4. 拣选灯管理（PickToLight）

---

## 一、设备管理（Equipment）

### 需求 EQ-1：设备创建

**限界上下文**：Equipment Context
**业务规则**：BR-EQ-001, BR-EQ-002

#### 验收标准

1. WHEN 管理员填写设备 ID、名称、类型等信息并提交 THEN THE Equipment_System SHALL 创建设备记录
2. IF 设备 ID 在同一设施下已存在 THEN THE Equipment_System SHALL 拒绝创建并返回错误码 EQUIPMENT_ID_DUPLICATE
3. IF 设备类型不是有效枚举值 THEN THE Equipment_System SHALL 拒绝创建并返回错误码 EQUIPMENT_TYPE_INVALID

---

### 需求 EQ-2：设备更新

**限界上下文**：Equipment Context

#### 验收标准

1. WHEN 管理员修改设备信息并提交 THEN THE Equipment_System SHALL 更新设备信息并记录更新时间
2. IF 设备不存在 THEN THE Equipment_System SHALL 返回错误码 EQUIPMENT_NOT_FOUND

---

### 需求 EQ-3：设备删除

**限界上下文**：Equipment Context
**业务规则**：BR-EQ-003

#### 验收标准

1. WHEN 管理员删除设备 THEN THE Equipment_System SHALL 检查设备是否被占用
2. IF 设备当前被占用 THEN THE Equipment_System SHALL 拒绝删除并返回错误码 EQUIPMENT_OCCUPIED
3. IF 设备不存在 THEN THE Equipment_System SHALL 返回错误码 EQUIPMENT_NOT_FOUND

---

### 需求 EQ-4：设备查询

**限界上下文**：Equipment Context

#### 验收标准

1. WHEN 管理员查询设备详情 THEN THE Equipment_System SHALL 返回设备完整信息
2. WHEN 管理员按类型筛选 THEN THE Equipment_System SHALL 返回对应类型的设备列表
3. WHEN 管理员按状态筛选 THEN THE Equipment_System SHALL 返回对应状态的设备列表
4. WHEN 管理员按位置筛选 THEN THE Equipment_System SHALL 返回对应位置的设备列表
5. WHEN 设备列表数据量大 THEN THE Equipment_System SHALL 支持分页查询并返回总数

---

### 需求 EQ-5：设备状态管理

**限界上下文**：Equipment Context
**业务规则**：BR-EQ-004

#### 验收标准

1. WHEN 管理员将设备设为不可用 THEN THE Equipment_System SHALL 更新设备状态为 INACTIVE
2. WHEN 管理员占用设备 THEN THE Equipment_System SHALL 记录占用者并更新 occupiedBy 字段
3. WHEN 管理员释放设备 THEN THE Equipment_System SHALL 清空 occupiedBy 字段
4. WHEN 管理员强制释放设备 THEN THE Equipment_System SHALL 无条件清空占用信息
5. IF 设备已被占用 WHEN 尝试再次占用 THEN THE Equipment_System SHALL 拒绝并返回错误码 EQUIPMENT_ALREADY_OCCUPIED

---

### 需求 EQ-6：设备填充率记录

**限界上下文**：Equipment Context
**业务规则**：BR-EQ-005

#### 验收标准

1. WHEN 系统采集设备填充率 THEN THE Equipment_System SHALL 记录填充率到历史表
2. WHEN 记录填充率 THEN THE Equipment_System SHALL 同时更新设备的 currentFillRate 字段
3. IF 填充率超过 100% THEN THE Equipment_System SHALL 标记 overFlow = true
4. WHEN 查询填充率历史 THEN THE Equipment_System SHALL 按时间倒序返回记录列表

---

### 需求 EQ-7：设备检查记录

**限界上下文**：Equipment Context
**业务规则**：BR-EQ-006

#### 验收标准

1. WHEN 操作员提交设备检查记录 THEN THE Equipment_System SHALL 保存检查信息和照片
2. WHEN 记录检查 THEN THE Equipment_System SHALL 保存检查条件、方向、备注等信息
3. WHEN 查询检查历史 THEN THE Equipment_System SHALL 按时间倒序返回记录列表
4. IF 检查记录已保存 THEN THE Equipment_System SHALL 禁止修改（只读）

---

### 需求 EQ-8：设备位置变更

**限界上下文**：Equipment Context

#### 验收标准

1. WHEN 管理员变更设备位置 THEN THE Equipment_System SHALL 更新 locationId 字段
2. IF 目标位置不存在 THEN THE Equipment_System SHALL 返回错误码 LOCATION_NOT_FOUND
3. WHEN 设备下架（toLocationName 为空）THEN THE Equipment_System SHALL 清空 locationId

---

### 需求 EQ-9：批量创建空料箱

**限界上下文**：Equipment Context

#### 验收标准

1. WHEN 管理员批量创建空料箱 THEN THE Equipment_System SHALL 按指定数量创建设备
2. WHEN 批量创建 THEN THE Equipment_System SHALL 自动生成设备 ID 和条码

---

## 二、库位管理（Location）

### 需求 LOC-1：库位创建

**限界上下文**：Location Context
**业务规则**：BR-LOC-001

#### 验收标准

1. WHEN 管理员填写库位 ID、名称、类型等信息并提交 THEN THE Location_System SHALL 创建库位记录
2. IF 库位 ID 在同一设施下已存在 THEN THE Location_System SHALL 拒绝创建并返回错误码 LOCATION_ID_DUPLICATE
3. IF 库位类型不是有效枚举值 THEN THE Location_System SHALL 拒绝创建并返回错误码 LOCATION_TYPE_INVALID

---

### 需求 LOC-2：库位更新

**限界上下文**：Location Context

#### 验收标准

1. WHEN 管理员修改库位信息并提交 THEN THE Location_System SHALL 更新库位信息并记录更新时间
2. IF 库位不存在 THEN THE Location_System SHALL 返回错误码 LOCATION_NOT_FOUND

---

### 需求 LOC-3：库位删除

**限界上下文**：Location Context
**业务规则**：BR-LOC-002

#### 验收标准

1. WHEN 管理员删除库位 THEN THE Location_System SHALL 检查库位是否有库存
2. IF 库位有库存 THEN THE Location_System SHALL 拒绝删除并返回错误码 LOCATION_HAS_INVENTORY
3. IF 库位不存在 THEN THE Location_System SHALL 返回错误码 LOCATION_NOT_FOUND

---

### 需求 LOC-4：库位查询

**限界上下文**：Location Context

#### 验收标准

1. WHEN 管理员查询库位详情 THEN THE Location_System SHALL 返回库位完整信息
2. WHEN 管理员按类型筛选 THEN THE Location_System SHALL 返回对应类型的库位列表
3. WHEN 管理员按状态筛选 THEN THE Location_System SHALL 返回对应状态的库位列表
4. WHEN 管理员按巷道筛选 THEN THE Location_System SHALL 返回对应巷道的库位列表
5. WHEN 库位列表数据量大 THEN THE Location_System SHALL 支持分页查询并返回总数

---

### 需求 LOC-5：库位状态管理

**限界上下文**：Location Context
**业务规则**：BR-LOC-003

#### 验收标准

1. WHEN 管理员更新库位状态 THEN THE Location_System SHALL 更新 status 字段
2. WHEN 管理员更新空间状态 THEN THE Location_System SHALL 更新 spaceStatus 字段
3. WHEN 管理员更新月台状态 THEN THE Location_System SHALL 更新 dockStatus 字段
4. WHEN 管理员更新设备状态 THEN THE Location_System SHALL 更新 deviceStatus 字段

---

### 需求 LOC-6：库位动态属性维护

**限界上下文**：Location Context

#### 验收标准

1. WHEN 管理员设置动态文本属性 THEN THE Location_System SHALL 保存到 dynTxtPropertyValue01-10 字段
2. WHEN 管理员设置动态日期属性 THEN THE Location_System SHALL 保存到 dynDatePropertyValue01-05 字段
3. WHEN 管理员设置特性列表 THEN THE Location_System SHALL 保存到 features JSON 字段

---

### 需求 LOC-7：库位批量导入

**限界上下文**：Location Context
**业务规则**：BR-LOC-004

#### 验收标准

1. WHEN 管理员上传库位 Excel 文件 THEN THE Location_System SHALL 解析并批量创建库位
2. IF 导入数据中库位 ID 重复 THEN THE Location_System SHALL 标记错误并跳过该行
3. WHEN 导入完成 THEN THE Location_System SHALL 返回成功数量和失败明细

---

### 需求 LOC-8：库位批量导出

**限界上下文**：Location Context

#### 验收标准

1. WHEN 管理员导出库位 THEN THE Location_System SHALL 生成 Excel 文件
2. WHEN 导出时有筛选条件 THEN THE Location_System SHALL 只导出符合条件的库位

---

## 三、虚拟位置组管理（VirtualLocationGroup）

### 需求 VLG-1：虚拟位置组创建

**限界上下文**：VLG Context
**业务规则**：BR-VLG-001

#### 验收标准

1. WHEN 管理员填写 VLG 名称、类型等信息并提交 THEN THE VLG_System SHALL 创建虚拟位置组
2. IF VLG 名称在同一设施下已存在 THEN THE VLG_System SHALL 拒绝创建并返回错误码 VLG_NAME_DUPLICATE
3. IF VLG 类型不是有效枚举值 THEN THE VLG_System SHALL 拒绝创建并返回错误码 VLG_TYPE_INVALID

---

### 需求 VLG-2：虚拟位置组更新

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员修改 VLG 信息并提交 THEN THE VLG_System SHALL 更新 VLG 信息并记录更新时间
2. IF VLG 不存在 THEN THE VLG_System SHALL 返回错误码 VLG_NOT_FOUND

---

### 需求 VLG-3：虚拟位置组删除

**限界上下文**：VLG Context
**业务规则**：BR-VLG-002

#### 验收标准

1. WHEN 管理员删除 VLG THEN THE VLG_System SHALL 检查是否有关联数据
2. IF VLG 有客户分配 THEN THE VLG_System SHALL 拒绝删除并返回错误码 VLG_HAS_CUSTOMER_ALLOCATION
3. IF VLG 有物料关联 THEN THE VLG_System SHALL 拒绝删除并返回错误码 VLG_HAS_ITEM_ALLOCATION
4. IF VLG 不存在 THEN THE VLG_System SHALL 返回错误码 VLG_NOT_FOUND

---

### 需求 VLG-4：虚拟位置组查询

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员查询 VLG 详情 THEN THE VLG_System SHALL 返回 VLG 完整信息（含标签、客户分配、物料关联）
2. WHEN 管理员按类型筛选 THEN THE VLG_System SHALL 返回对应类型的 VLG 列表
3. WHEN 管理员按标签筛选 THEN THE VLG_System SHALL 返回包含指定标签的 VLG 列表

---

### 需求 VLG-5：虚拟位置组配置管理

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员配置禁止同库位混放 THEN THE VLG_System SHALL 保存 disallowToMixItemOnSameLocation = true
2. WHEN 管理员配置禁止同库位混批次 THEN THE VLG_System SHALL 保存 disallowToMixLotNoOnSameLocation = true
3. WHEN 管理员配置上架跳过已占用位置 THEN THE VLG_System SHALL 保存 skipOccupiedLocationOnPutAway = true
4. WHEN 管理员配置最大部分托盘数 THEN THE VLG_System SHALL 保存 maximumAllowedPartialPallet 值
5. WHEN 管理员配置启用耗尽位置 THEN THE VLG_System SHALL 保存 enableDepletedLocation = true

---

### 子模块 1：虚拟位置标签管理（VirtualLocationTag）

### 需求 TAG-1：标签创建

**限界上下文**：VLG Context
**业务规则**：BR-TAG-001

#### 验收标准

1. WHEN 管理员填写标签名称、描述并提交 THEN THE Tag_System SHALL 创建标签
2. IF 标签名称在同一设施下已存在 THEN THE Tag_System SHALL 拒绝创建并返回错误码 TAG_NAME_DUPLICATE

---

### 需求 TAG-2：标签更新

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员修改标签信息并提交 THEN THE Tag_System SHALL 更新标签信息
2. IF 标签不存在 THEN THE Tag_System SHALL 返回错误码 TAG_NOT_FOUND

---

### 需求 TAG-3：标签删除

**限界上下文**：VLG Context
**业务规则**：BR-TAG-002

#### 验收标准

1. WHEN 管理员删除标签 THEN THE Tag_System SHALL 检查是否有 VLG 使用该标签
2. IF 标签被 VLG 使用 THEN THE Tag_System SHALL 拒绝删除并返回错误码 TAG_IN_USE
3. IF 标签不存在 THEN THE Tag_System SHALL 返回错误码 TAG_NOT_FOUND

---

### 需求 TAG-4：标签关联库位

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员为标签关联库位 THEN THE Tag_System SHALL 保存 locationIds 列表
2. WHEN 管理员移除标签的库位关联 THEN THE Tag_System SHALL 从 locationIds 中移除

---

### 需求 TAG-5：VLG 关联标签

**限界上下文**：VLG Context
**业务规则**：BR-TAG-003

#### 验收标准

1. WHEN 管理员为 VLG 关联标签 THEN THE VLG_System SHALL 保存 tagIds 列表
2. IF 标签已被其他同类型 VLG 使用 THEN THE VLG_System SHALL 拒绝并返回错误码 TAG_ALREADY_EXIST_IN_OTHER_ZONE

---

### 子模块 2：客户 VLG 分配（CustomerVlgAllocation）

### 需求 CVA-1：客户分配创建

**限界上下文**：VLG Context
**业务规则**：BR-CVA-001

#### 验收标准

1. WHEN 管理员为 VLG 分配客户 THEN THE VLG_System SHALL 创建客户分配记录
2. WHEN 分配时 THEN THE VLG_System SHALL 保存分配类别、百分比、时间范围
3. IF 同一客户在同一 VLG 下已有相同类别的分配 THEN THE VLG_System SHALL 拒绝并返回错误码 CUSTOMER_ALLOCATION_DUPLICATE

---

### 需求 CVA-2：客户分配更新

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员修改客户分配 THEN THE VLG_System SHALL 更新分配信息
2. IF 分配记录不存在 THEN THE VLG_System SHALL 返回错误码 CUSTOMER_ALLOCATION_NOT_FOUND

---

### 需求 CVA-3：客户分配删除

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员删除客户分配 THEN THE VLG_System SHALL 移除分配记录
2. IF 分配记录不存在 THEN THE VLG_System SHALL 返回错误码 CUSTOMER_ALLOCATION_NOT_FOUND

---

### 需求 CVA-4：客户分配查询

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员查询 VLG 的客户分配 THEN THE VLG_System SHALL 返回该 VLG 的所有客户分配列表
2. WHEN 管理员按客户查询分配 THEN THE VLG_System SHALL 返回该客户的所有 VLG 分配

---

### 子模块 3：物料 VLG 关联（ItemVlg）

### 需求 IVLG-1：物料关联创建

**限界上下文**：VLG Context
**业务规则**：BR-IVLG-001

#### 验收标准

1. WHEN 管理员为 VLG 关联物料 THEN THE VLG_System SHALL 创建物料关联记录
2. WHEN 关联时 THEN THE VLG_System SHALL 保存客户 ID、物料 ID、托盘类型
3. IF 同一物料在同一 VLG 和客户下已存在 THEN THE VLG_System SHALL 拒绝并返回错误码 ITEM_VLG_DUPLICATE

---

### 需求 IVLG-2：物料关联删除

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员删除物料关联 THEN THE VLG_System SHALL 移除关联记录
2. IF 关联记录不存在 THEN THE VLG_System SHALL 返回错误码 ITEM_VLG_NOT_FOUND

---

### 需求 IVLG-3：物料关联查询

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员查询 VLG 的物料关联 THEN THE VLG_System SHALL 返回该 VLG 的所有物料关联列表
2. WHEN 管理员按物料查询关联 THEN THE VLG_System SHALL 返回该物料的所有 VLG 关联

---

### 子模块 4：物料组 VLG 关联（ItemGroupVlg）

### 需求 IGVLG-1：物料组关联创建

**限界上下文**：VLG Context
**业务规则**：BR-IGVLG-001

#### 验收标准

1. WHEN 管理员为 VLG 关联物料组 THEN THE VLG_System SHALL 创建物料组关联记录
2. WHEN 关联时 THEN THE VLG_System SHALL 保存客户 ID、货主 ID、物料组 ID、托盘类型
3. IF 同一物料组在同一 VLG、客户、货主下已存在 THEN THE VLG_System SHALL 拒绝并返回错误码 ITEM_GROUP_VLG_DUPLICATE

---

### 需求 IGVLG-2：物料组关联删除

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员删除物料组关联 THEN THE VLG_System SHALL 移除关联记录
2. IF 关联记录不存在 THEN THE VLG_System SHALL 返回错误码 ITEM_GROUP_VLG_NOT_FOUND

---

### 需求 IGVLG-3：物料组关联查询

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员查询 VLG 的物料组关联 THEN THE VLG_System SHALL 返回该 VLG 的所有物料组关联列表

---

### 子模块 5：货主 VLG 关联（TitleVlg）

### 需求 TVLG-1：货主关联创建

**限界上下文**：VLG Context
**业务规则**：BR-TVLG-001

#### 验收标准

1. WHEN 管理员为 VLG 关联货主 THEN THE VLG_System SHALL 创建货主关联记录
2. WHEN 关联时 THEN THE VLG_System SHALL 保存客户 ID、货主 ID、托盘类型
3. IF 同一货主在同一 VLG 和客户下已存在 THEN THE VLG_System SHALL 拒绝并返回错误码 TITLE_VLG_DUPLICATE

---

### 需求 TVLG-2：货主关联删除

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员删除货主关联 THEN THE VLG_System SHALL 移除关联记录
2. IF 关联记录不存在 THEN THE VLG_System SHALL 返回错误码 TITLE_VLG_NOT_FOUND

---

### 需求 TVLG-3：货主关联查询

**限界上下文**：VLG Context

#### 验收标准

1. WHEN 管理员查询 VLG 的货主关联 THEN THE VLG_System SHALL 返回该 VLG 的所有货主关联列表

---

## 四、拣选灯管理（PickToLight）

### 需求 PTL-1：拣选灯创建

**限界上下文**：PickToLight Context
**业务规则**：BR-PTL-001

#### 验收标准

1. WHEN 管理员填写灯编号、灯组 ID 等信息并提交 THEN THE PTL_System SHALL 创建拣选灯记录
2. IF 灯编号在同一设施下已存在 THEN THE PTL_System SHALL 拒绝创建并返回错误码 PTL_LIGHT_ID_DUPLICATE

---

### 需求 PTL-2：拣选灯更新

**限界上下文**：PickToLight Context

#### 验收标准

1. WHEN 管理员修改拣选灯信息并提交 THEN THE PTL_System SHALL 更新拣选灯信息
2. IF 拣选灯不存在 THEN THE PTL_System SHALL 返回错误码 PTL_NOT_FOUND

---

### 需求 PTL-3：拣选灯删除

**限界上下文**：PickToLight Context
**业务规则**：BR-PTL-002

#### 验收标准

1. WHEN 管理员删除拣选灯 THEN THE PTL_System SHALL 检查是否被占用
2. IF 拣选灯当前被占用 THEN THE PTL_System SHALL 拒绝删除并返回错误码 PTL_OCCUPIED
3. IF 拣选灯不存在 THEN THE PTL_System SHALL 返回错误码 PTL_NOT_FOUND

---

### 需求 PTL-4：拣选灯查询

**限界上下文**：PickToLight Context

#### 验收标准

1. WHEN 管理员查询拣选灯详情 THEN THE PTL_System SHALL 返回拣选灯完整信息
2. WHEN 管理员按灯组筛选 THEN THE PTL_System SHALL 返回对应灯组的拣选灯列表
3. WHEN 管理员按库位筛选 THEN THE PTL_System SHALL 返回对应库位的拣选灯列表

---

### 需求 PTL-5：拣选灯关联管理

**限界上下文**：PickToLight Context

#### 验收标准

1. WHEN 管理员关联拣选灯到库位 THEN THE PTL_System SHALL 更新 locationId 字段
2. WHEN 管理员关联拣选灯到设备 THEN THE PTL_System SHALL 更新 equipmentId 字段
3. WHEN 管理员取消关联 THEN THE PTL_System SHALL 清空对应字段

---

### 需求 PTL-6：拣选灯占用管理

**限界上下文**：PickToLight Context

#### 验收标准

1. WHEN 操作员占用拣选灯 THEN THE PTL_System SHALL 更新 occupiedBy 字段
2. WHEN 操作员释放拣选灯 THEN THE PTL_System SHALL 清空 occupiedBy 字段
3. IF 拣选灯已被占用 WHEN 尝试再次占用 THEN THE PTL_System SHALL 拒绝并返回错误码 PTL_ALREADY_OCCUPIED

---

## 非功能需求

### NFR-1：性能要求

1. THE Facility_System SHALL 在 500ms 内返回设备/库位列表查询结果（1000 条数据以内）
2. THE Facility_System SHALL 在 200ms 内返回详情查询结果
3. THE Facility_System SHALL 支持批量导入 5000 条库位数据

### NFR-2：数据一致性

1. THE Facility_System SHALL 保证设备 ID 在同一设施下唯一
2. THE Facility_System SHALL 保证库位 ID 在同一设施下唯一
3. THE Facility_System SHALL 保证 VLG 名称在同一设施下唯一
4. THE Facility_System SHALL 在删除前检查关联数据

### NFR-3：安全要求

1. THE Facility_System SHALL 按设施（Facility）隔离数据
2. THE Facility_System SHALL 记录敏感操作的操作日志

---

## 错误码清单

设备相关：
- EQUIPMENT_NOT_FOUND - 设备不存在
- EQUIPMENT_ID_DUPLICATE - 设备 ID 重复
- EQUIPMENT_TYPE_INVALID - 设备类型无效
- EQUIPMENT_OCCUPIED - 设备被占用
- EQUIPMENT_ALREADY_OCCUPIED - 设备已被占用

库位相关：
- LOCATION_NOT_FOUND - 库位不存在
- LOCATION_ID_DUPLICATE - 库位 ID 重复
- LOCATION_TYPE_INVALID - 库位类型无效
- LOCATION_HAS_INVENTORY - 库位有库存

虚拟位置组相关：
- VLG_NOT_FOUND - 虚拟位置组不存在
- VLG_NAME_DUPLICATE - VLG 名称重复
- VLG_TYPE_INVALID - VLG 类型无效
- VLG_HAS_CUSTOMER_ALLOCATION - VLG 有客户分配
- VLG_HAS_ITEM_ALLOCATION - VLG 有物料关联

标签相关：
- TAG_NOT_FOUND - 标签不存在
- TAG_NAME_DUPLICATE - 标签名称重复
- TAG_IN_USE - 标签被使用中
- TAG_ALREADY_EXIST_IN_OTHER_ZONE - 标签已存在于其他区域

客户分配相关：
- CUSTOMER_ALLOCATION_NOT_FOUND - 客户分配不存在
- CUSTOMER_ALLOCATION_DUPLICATE - 客户分配重复

物料关联相关：
- ITEM_VLG_NOT_FOUND - 物料关联不存在
- ITEM_VLG_DUPLICATE - 物料关联重复
- ITEM_GROUP_VLG_NOT_FOUND - 物料组关联不存在
- ITEM_GROUP_VLG_DUPLICATE - 物料组关联重复
- TITLE_VLG_NOT_FOUND - 货主关联不存在
- TITLE_VLG_DUPLICATE - 货主关联重复

拣选灯相关：
- PTL_NOT_FOUND - 拣选灯不存在
- PTL_LIGHT_ID_DUPLICATE - 灯编号重复
- PTL_OCCUPIED - 拣选灯被占用
- PTL_ALREADY_OCCUPIED - 拣选灯已被占用
