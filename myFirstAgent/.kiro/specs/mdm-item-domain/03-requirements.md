# MDM Item 领域 - 需求规格

## 术语表

引用 domain-analysis.md 中的统一语言。

---

## 需求列表

### 需求 1：行业创建

**用户故事**：Story 1
**限界上下文**：Industry Context
**业务规则**：BR-INDUSTRY-001, BR-INDUSTRY-003, BR-INDUSTRY-004

#### 验收标准

1. WHEN 管理员填写行业代码、名称、描述并提交 THEN THE Industry_System SHALL 创建行业并生成唯一 ID
2. IF 行业代码在同一租户下已存在 THEN THE Industry_System SHALL 拒绝创建并返回错误码 INDUSTRY_CODE_DUPLICATE
3. IF 行业代码为空或超过 50 字符 THEN THE Industry_System SHALL 拒绝创建并返回错误码 INDUSTRY_CODE_INVALID
4. IF 行业名称为空或超过 100 字符 THEN THE Industry_System SHALL 拒绝创建并返回错误码 INDUSTRY_NAME_INVALID

---

### 需求 2：行业更新

**用户故事**：Story 1
**限界上下文**：Industry Context
**业务规则**：BR-INDUSTRY-001

#### 验收标准

1. WHEN 管理员修改行业信息并提交 THEN THE Industry_System SHALL 更新行业信息并记录更新时间
2. IF 修改后的行业代码与其他行业重复 THEN THE Industry_System SHALL 拒绝更新并返回错误码 INDUSTRY_CODE_DUPLICATE
3. IF 行业不存在 THEN THE Industry_System SHALL 返回错误码 INDUSTRY_NOT_FOUND

---

### 需求 3：行业删除

**用户故事**：Story 1
**限界上下文**：Industry Context
**业务规则**：BR-INDUSTRY-002

#### 验收标准

1. WHEN 管理员删除行业 THEN THE Industry_System SHALL 检查是否有商品关联该行业
2. IF 有商品关联该行业 THEN THE Industry_System SHALL 拒绝删除并返回错误码 INDUSTRY_HAS_ITEMS
3. IF 行业不存在 THEN THE Industry_System SHALL 返回错误码 INDUSTRY_NOT_FOUND

---

### 需求 4：行业查询

**用户故事**：Story 1
**限界上下文**：Industry Context

#### 验收标准

1. WHEN 管理员查询行业列表 THEN THE Industry_System SHALL 按排序顺序返回行业列表
2. WHEN 管理员查询行业详情 THEN THE Industry_System SHALL 返回行业信息及其属性模板列表

---

### 需求 5：行业属性模板管理

**用户故事**：Story 2
**限界上下文**：Industry Context
**业务规则**：BR-TEMPLATE-001, BR-TEMPLATE-002, BR-TEMPLATE-003, BR-TEMPLATE-004

#### 验收标准

1. WHEN 管理员添加属性模板 THEN THE Industry_System SHALL 保存属性名称、类型、是否必填
2. IF 属性模板名称在同一行业下已存在 THEN THE Industry_System SHALL 拒绝并返回错误码 TEMPLATE_NAME_DUPLICATE
3. IF 属性类型不是 TEXT/DATE/NUMBER/SELECT THEN THE Industry_System SHALL 拒绝并返回错误码 TEMPLATE_TYPE_INVALID
4. WHEN 属性类型为 SELECT IF 未提供选项列表 THEN THE Industry_System SHALL 拒绝并返回错误码 TEMPLATE_OPTIONS_REQUIRED
5. WHEN 管理员修改属性模板 THEN THE Industry_System SHALL 更新模板信息并记录更新时间
6. WHEN 管理员删除属性模板 THEN THE Industry_System SHALL 移除模板记录
7. WHEN 管理员调整排序 THEN THE Industry_System SHALL 更新排序顺序

---

### 需求 6：危险品定义创建

**用户故事**：Story 3
**限界上下文**：Hazard Context
**业务规则**：BR-HAZARD-001, BR-HAZARD-003, BR-HAZARD-004

#### 验收标准

1. WHEN 管理员填写危险品 ID、名称、运输名称、分类、包装组并提交 THEN THE Hazard_System SHALL 创建危险品定义
2. IF 危险品 ID 在同一租户下已存在 THEN THE Hazard_System SHALL 拒绝创建并返回错误码 HAZARD_ID_DUPLICATE
3. IF 危险品名称为空 THEN THE Hazard_System SHALL 拒绝创建并返回错误码 HAZARD_NAME_REQUIRED
4. IF 危险品分类为空 THEN THE Hazard_System SHALL 拒绝创建并返回错误码 HAZARD_CLASS_REQUIRED

---

### 需求 7：危险品定义更新

**用户故事**：Story 3
**限界上下文**：Hazard Context

#### 验收标准

1. WHEN 管理员修改危险品定义并提交 THEN THE Hazard_System SHALL 更新危险品信息并记录更新时间
2. IF 危险品定义不存在 THEN THE Hazard_System SHALL 返回错误码 HAZARD_NOT_FOUND

---

### 需求 8：危险品定义删除

**用户故事**：Story 3
**限界上下文**：Hazard Context
**业务规则**：BR-HAZARD-002

#### 验收标准

1. WHEN 管理员删除危险品定义 THEN THE Hazard_System SHALL 检查是否有商品关联
2. IF 有商品关联该危险品定义 THEN THE Hazard_System SHALL 拒绝删除并返回错误码 HAZARD_HAS_ITEMS
3. IF 危险品定义不存在 THEN THE Hazard_System SHALL 返回错误码 HAZARD_NOT_FOUND

---

### 需求 9：危险品定义查询

**用户故事**：Story 3
**限界上下文**：Hazard Context

#### 验收标准

1. WHEN 管理员查询危险品列表 THEN THE Hazard_System SHALL 返回危险品定义列表
2. WHEN 管理员查询危险品详情 THEN THE Hazard_System SHALL 返回危险品完整信息

---

### 需求 10：商品创建

**用户故事**：Story 4
**限界上下文**：Item Context
**业务规则**：BR-ITEM-001, BR-ITEM-004, BR-ITEM-005, BR-ITEM-006, BR-ITEM-007

#### 验收标准

1. WHEN 管理员填写 SKU、描述等必填信息并提交 THEN THE Item_System SHALL 创建商品并生成唯一 ID
2. IF SKU 在同一租户下已存在 THEN THE Item_System SHALL 拒绝创建并返回错误码 ITEM_SKU_DUPLICATE
3. IF 商品类型不是 MATERIAL 或 PRODUCT THEN THE Item_System SHALL 拒绝创建并返回错误码 ITEM_TYPE_INVALID
4. IF 包装材料字段有值但格式不是 ITEM-xxx THEN THE Item_System SHALL 拒绝创建并返回错误码 PACKAGING_MATERIAL_INVALID_FORMAT
5. IF 包装材料字段有值但引用的商品不存在 THEN THE Item_System SHALL 拒绝创建并返回错误码 PACKAGING_MATERIAL_NOT_FOUND
6. IF 包装材料字段有值但引用的商品类型不是 MATERIAL THEN THE Item_System SHALL 拒绝创建并返回错误码 PACKAGING_MATERIAL_INVALID_TYPE
7. IF 客户字段有值但引用的组织不存在 THEN THE Item_System SHALL 拒绝创建并返回错误码 CUSTOMER_NOT_FOUND
8. IF 客户字段有值但引用的组织 tags 不包含 CUSTOMER THEN THE Item_System SHALL 拒绝创建并返回错误码 CUSTOMER_INVALID_TAG
9. IF 品牌字段有值但引用的组织不存在 THEN THE Item_System SHALL 拒绝创建并返回错误码 BRAND_NOT_FOUND
10. IF 品牌字段有值但引用的组织 tags 不包含 BRAND THEN THE Item_System SHALL 拒绝创建并返回错误码 BRAND_INVALID_TAG
11. WHEN 商品创建成功 THEN THE Item_System SHALL 发布 ItemCreatedEvent 事件

---

### 需求 11：商品更新

**用户故事**：Story 4
**限界上下文**：Item Context
**业务规则**：BR-ITEM-001, BR-ITEM-005, BR-ITEM-006, BR-ITEM-007

#### 验收标准

1. WHEN 管理员修改商品信息并提交 THEN THE Item_System SHALL 更新商品信息并记录更新时间
2. IF 修改后的 SKU 与其他商品重复 THEN THE Item_System SHALL 拒绝更新并返回错误码 ITEM_SKU_DUPLICATE
3. IF 商品不存在 THEN THE Item_System SHALL 返回错误码 ITEM_NOT_FOUND
4. IF 修改后的包装材料字段有值但格式不是 ITEM-xxx THEN THE Item_System SHALL 拒绝更新并返回错误码 PACKAGING_MATERIAL_INVALID_FORMAT
5. IF 修改后的包装材料字段有值但引用的商品不存在 THEN THE Item_System SHALL 拒绝更新并返回错误码 PACKAGING_MATERIAL_NOT_FOUND
6. IF 修改后的包装材料字段有值但引用的商品类型不是 MATERIAL THEN THE Item_System SHALL 拒绝更新并返回错误码 PACKAGING_MATERIAL_INVALID_TYPE
7. IF 修改后的客户字段有值但引用的组织不存在 THEN THE Item_System SHALL 拒绝更新并返回错误码 CUSTOMER_NOT_FOUND
8. IF 修改后的客户字段有值但引用的组织 tags 不包含 CUSTOMER THEN THE Item_System SHALL 拒绝更新并返回错误码 CUSTOMER_INVALID_TAG
9. IF 修改后的品牌字段有值但引用的组织不存在 THEN THE Item_System SHALL 拒绝更新并返回错误码 BRAND_NOT_FOUND
10. IF 修改后的品牌字段有值但引用的组织 tags 不包含 BRAND THEN THE Item_System SHALL 拒绝更新并返回错误码 BRAND_INVALID_TAG
11. WHEN 商品更新成功 THEN THE Item_System SHALL 发布 ItemUpdatedEvent 事件

---

### 需求 12：商品查询

**用户故事**：Story 4, Story 13
**限界上下文**：Item Context

#### 验收标准

1. WHEN 管理员查询商品详情 THEN THE Item_System SHALL 返回商品完整信息（包含属性、单位、套装组件、托盘配置、危险品关联）
2. WHEN 管理员按 SKU 关键字搜索 THEN THE Item_System SHALL 返回 SKU 包含关键字的商品列表
3. WHEN 管理员按状态筛选 THEN THE Item_System SHALL 返回对应状态的商品列表
4. WHEN 管理员按客户筛选 THEN THE Item_System SHALL 返回对应客户的商品列表
5. WHEN 管理员按商品类型筛选 THEN THE Item_System SHALL 返回对应类型的商品列表
6. WHEN 商品列表数据量大 THEN THE Item_System SHALL 支持分页查询并返回总数

---

### 需求 13：商品删除

**用户故事**：Story 4
**限界上下文**：Item Context
**业务规则**：BR-ITEM-002

#### 验收标准

1. WHEN 管理员删除商品 THEN THE Item_System SHALL 检查是否有关联库存
2. IF 商品有关联库存 THEN THE Item_System SHALL 拒绝删除并返回错误码 ITEM_HAS_INVENTORY
3. IF 商品不存在 THEN THE Item_System SHALL 返回错误码 ITEM_NOT_FOUND
4. WHEN 商品删除成功 THEN THE Item_System SHALL 发布 ItemDeletedEvent 事件

---

### 需求 14：商品状态管理

**用户故事**：Story 4
**限界上下文**：Item Context
**业务规则**：BR-ITEM-003

#### 验收标准

1. WHEN 管理员启用商品 THEN THE Item_System SHALL 将商品状态更新为 ENABLED
2. WHEN 管理员禁用商品 THEN THE Item_System SHALL 检查是否有未完成订单
3. IF 商品有未完成订单 THEN THE Item_System SHALL 拒绝禁用并返回错误码 ITEM_HAS_PENDING_ORDER
4. WHEN 商品状态变更成功 THEN THE Item_System SHALL 发布对应的状态变更事件

---

### 需求 15：商品选择行业加载属性

**用户故事**：Story 5
**限界上下文**：Industry Context, Property Context

#### 验收标准

1. WHEN 管理员在新建商品时选择行业 THEN THE Industry_System SHALL 返回该行业的所有属性模板
2. WHEN 属性模板加载后 THEN THE Property_System SHALL 允许管理员删除不需要的属性
3. WHEN 属性模板加载后 THEN THE Property_System SHALL 允许管理员添加自定义属性
4. WHEN 管理员填写属性值并保存 THEN THE Property_System SHALL 将属性保存到 mdm_item_property 表
5. WHEN 商品已保存属性后切换行业 THEN THE Item_System SHALL 提示是否清空现有属性
6. IF 属性模板标记为必填 WHEN 商品保存时未填写该属性 THEN THE Property_System SHALL 拒绝并返回错误码 REQUIRED_PROPERTY_MISSING

---

### 需求 16：商品属性管理

**用户故事**：Story 5
**限界上下文**：Property Context
**业务规则**：BR-PROP-001, BR-PROP-002, BR-PROP-003, BR-PROP-004

#### 验收标准

1. WHEN 管理员添加属性 THEN THE Property_System SHALL 保存属性名称、类型、值
2. IF 属性名称在同一商品下已存在 THEN THE Property_System SHALL 拒绝并返回错误码 PROPERTY_NAME_DUPLICATE
3. WHEN 属性类型为 SELECT IF 值不在选项列表中 THEN THE Property_System SHALL 拒绝并返回错误码 PROPERTY_VALUE_INVALID
4. WHEN 属性类型为 NUMBER IF 值不是有效数字 THEN THE Property_System SHALL 拒绝并返回错误码 PROPERTY_VALUE_NOT_NUMBER
5. WHEN 保存商品 IF 必填属性没有值 THEN THE Property_System SHALL 拒绝并返回错误码 REQUIRED_PROPERTY_MISSING
6. WHEN 管理员修改属性值 THEN THE Property_System SHALL 更新属性值并记录更新时间
7. WHEN 管理员删除属性 THEN THE Property_System SHALL 移除属性记录

---

### 需求 17：商品单位管理

**用户故事**：Story 6
**限界上下文**：UOM Context
**业务规则**：BR-UOM-001, BR-UOM-002, BR-UOM-003, BR-UOM-004, BR-UOM-005

#### 验收标准

1. WHEN 管理员在单位 Tab 点击添加 THEN THE UOM_System SHALL 弹出单位维护模态框
2. WHEN 管理员填写单位信息并保存 THEN THE UOM_System SHALL 将单位暂存到页面列表
3. WHEN 管理员开启基本单位开关 THEN THE UOM_System SHALL 隐藏内包装单位和换算数量字段，并设置 isBaseUom = true, baseQty = 1
4. WHEN 管理员关闭基本单位开关 THEN THE UOM_System SHALL 显示内包装单位和换算数量字段，要求填写换算信息
5. IF 商品已有基本单位 WHEN 添加另一个基本单位 THEN THE UOM_System SHALL 拒绝并返回错误码 BASE_UOM_EXISTS
6. WHEN 管理员添加非基本单位 IF 未选择内包装单位 THEN THE UOM_System SHALL 拒绝并返回错误码 INSIDE_UOM_REQUIRED
7. WHEN 管理员添加非基本单位 IF baseQty 小于等于 0 THEN THE UOM_System SHALL 拒绝并返回错误码 BASE_QTY_INVALID
8. WHEN 管理员填写尺寸信息 THEN THE UOM_System SHALL 保存长、宽、高及线性单位（cm/m/in）
9. WHEN 管理员填写重量信息 THEN THE UOM_System SHALL 保存重量及重量单位（g/kg/lb）
10. WHEN 管理员填写体积信息 THEN THE UOM_System SHALL 保存体积及体积单位（m3/ft3/in3）
11. WHEN 管理员填写价格信息 THEN THE UOM_System SHALL 保存价格、币种（CNY/USD/EUR）及保险价格
12. WHEN 管理员设置默认单位 THEN THE UOM_System SHALL 更新 isDefaultUom 标记（只能有一个）
13. WHEN 管理员启用双单位 IF 未配置双单位类型 THEN THE UOM_System SHALL 拒绝并返回错误码 DUAL_UOM_TYPE_REQUIRED
14. WHEN 管理员删除基本单位 IF 商品还有其他单位 THEN THE UOM_System SHALL 拒绝并返回错误码 CANNOT_DELETE_BASE_UOM
15. WHEN 商品保存 THEN THE UOM_System SHALL 将暂存的单位列表一并保存到数据库

---

### 需求 18：托盘配置管理

**用户故事**：Story 7
**限界上下文**：Pallet Config Context
**业务规则**：BR-PALLET-001, BR-PALLET-002, BR-PALLET-003

#### 验收标准

1. WHEN 管理员在 Pallet 配置 Tab 点击添加 THEN THE PalletConfig_System SHALL 弹出托盘配置模态框
2. WHEN 管理员填写 TI/HI/单位等信息并保存 THEN THE PalletConfig_System SHALL 将配置暂存到页面列表
3. IF TI 或 HI 小于等于 0 THEN THE PalletConfig_System SHALL 拒绝并返回错误码 TI_HI_INVALID
4. IF uomId 不是该商品已配置的单位 THEN THE PalletConfig_System SHALL 拒绝并返回错误码 UOM_NOT_FOUND
5. WHEN 管理员设置默认配置 THEN THE PalletConfig_System SHALL 更新 isDefault 标记（只能有一个）
6. WHEN 管理员按零售商查询配置 THEN THE PalletConfig_System SHALL 返回对应零售商的配置（零售商是 tag 为 RETAILER 的组织）
7. WHEN 管理员按场景查询配置 THEN THE PalletConfig_System SHALL 返回对应场景的配置
8. WHEN 商品保存 THEN THE PalletConfig_System SHALL 将暂存的托盘配置列表一并保存到数据库

---

### 需求 19：套装商品管理

**用户故事**：Story 8
**限界上下文**：Kitting Context
**业务规则**：BR-KIT-001, BR-KIT-002, BR-KIT-003

#### 验收标准

1. WHEN 管理员打开 Kitting 开关 THEN THE Kitting_System SHALL 显示 Kitting Tab
2. WHEN 管理员点击添加组合品 THEN THE Kitting_System SHALL 弹出商品选择模态框
3. WHEN 管理员选择商品并填写数量后保存 THEN THE Kitting_System SHALL 将组件暂存到页面列表
4. IF 组件是套装商品本身 THEN THE Kitting_System SHALL 拒绝并返回错误码 CANNOT_ADD_SELF_AS_COMPONENT
5. IF 组件数量小于等于 0 THEN THE Kitting_System SHALL 拒绝并返回错误码 COMPONENT_QTY_INVALID
6. WHEN 保存套装商品 IF 没有任何组件 THEN THE Kitting_System SHALL 拒绝并返回错误码 KITTING_NO_COMPONENT
7. WHEN 管理员修改组件数量 THEN THE Kitting_System SHALL 更新组件数量
8. WHEN 管理员删除组件 THEN THE Kitting_System SHALL 移除组件记录
9. WHEN 商品保存 THEN THE Kitting_System SHALL 将暂存的组件列表一并保存到数据库

---

### 需求 20：商品关联危险品

**用户故事**：Story 9
**限界上下文**：Item Context, Hazard Context

#### 验收标准

1. WHEN 管理员打开危险品开关 THEN THE Item_System SHALL 显示危险品选择框
2. WHEN 管理员选择危险品定义 THEN THE Item_System SHALL 记录商品与危险品的关联（hazardId）
3. WHEN 查询商品详情 IF 商品已关联危险品 THEN THE Item_System SHALL 返回关联的危险品信息
4. WHEN 管理员关闭危险品开关 THEN THE Item_System SHALL 清除危险品关联

---

### 需求 21：条码识别

**用户故事**：Story 10
**限界上下文**：Item Context
**业务规则**：BR-BARCODE-001, BR-BARCODE-002, BR-BARCODE-003

#### 验收标准

1. WHEN 收货员扫描 EAN 条码 THEN THE Item_System SHALL 查询 eanCode 字段并返回对应商品
2. WHEN 收货员扫描 UPC 条码 THEN THE Item_System SHALL 查询 upcCode 字段并返回对应商品
3. WHEN 收货员扫描箱装 UPC 条码 THEN THE Item_System SHALL 查询 caseUpcCode 字段并返回对应商品
4. WHEN 收货员扫描 ISBN 条码 THEN THE Item_System SHALL 查询 isbnCode 字段并返回对应商品
5. IF 条码不存在 THEN THE Item_System SHALL 返回错误码 BARCODE_NOT_FOUND

---

### 需求 22：条码配置

**用户故事**：Story 10
**限界上下文**：Item Context
**业务规则**：BR-BARCODE-001, BR-BARCODE-002, BR-BARCODE-003

#### 验收标准

1. WHEN 管理员配置 EAN 码 IF EAN 码不是 13 位数字 THEN THE Item_System SHALL 拒绝并返回错误码 EAN_CODE_INVALID
2. WHEN 管理员配置 UPC 码 IF UPC 码不是 12 位数字 THEN THE Item_System SHALL 拒绝并返回错误码 UPC_CODE_INVALID
3. IF 条码在同一租户下已存在 THEN THE Item_System SHALL 拒绝并返回错误码 BARCODE_DUPLICATE

---

### 需求 23：序列号配置

**用户故事**：Story 11
**限界上下文**：Item Context
**业务规则**：BR-SN-001, BR-SN-002, BR-SN-003

#### 验收标准

1. WHEN 管理员启用序列号 THEN THE Item_System SHALL 保存 hasSerialNumber = true
2. WHEN 管理员配置序列号长度 IF 长度小于等于 0 THEN THE Item_System SHALL 拒绝并返回错误码 SN_LENGTH_INVALID
3. WHEN 管理员配置序列号验证规则 IF 规则不是有效正则表达式 THEN THE Item_System SHALL 拒绝并返回错误码 SN_RULE_INVALID
4. WHEN 管理员配置收货时收集序列号 IF 商品未启用序列号 THEN THE Item_System SHALL 拒绝并返回错误码 SN_NOT_ENABLED
5. WHEN 管理员配置发货时收集序列号 IF 商品未启用序列号 THEN THE Item_System SHALL 拒绝并返回错误码 SN_NOT_ENABLED

---

### 需求 24：批次配置

**用户故事**：Story 12
**限界上下文**：Item Context
**业务规则**：BR-LOT-001, BR-LOT-002, BR-LOT-003

#### 验收标准

1. WHEN 管理员启用批次号 THEN THE Item_System SHALL 保存 hasLotNo = true
2. WHEN 管理员配置收货时收集批次号 IF 商品未启用批次号 THEN THE Item_System SHALL 拒绝并返回错误码 LOT_NOT_ENABLED
3. WHEN 管理员配置收货时收集过期日期 IF 商品未启用批次号 THEN THE Item_System SHALL 拒绝并返回错误码 LOT_NOT_ENABLED
4. WHEN 管理员配置收货时收集生产日期 IF 商品未启用批次号 THEN THE Item_System SHALL 拒绝并返回错误码 LOT_NOT_ENABLED
5. WHEN 管理员配置发货时收集批次号 IF 商品未启用批次号 THEN THE Item_System SHALL 拒绝并返回错误码 LOT_NOT_ENABLED

---

### 需求 25：发货规则管理

**用户故事**：Story 14
**限界上下文**：Item Context
**业务规则**：BR-SHIP-001, BR-SHIP-002

#### 验收标准

1. WHEN 管理员配置允许发货天数 IF 大于保质期天数 THEN THE Item_System SHALL 拒绝并返回错误码 SHIP_DAYS_EXCEED_SHELF_LIFE
2. WHEN 管理员配置发货规则时间窗口 IF 小于等于 0 THEN THE Item_System SHALL 拒绝并返回错误码 SHIP_TIME_WINDOW_INVALID
3. WHEN 发货时商品剩余保质期不足 THEN THE Item_System SHALL 返回警告信息

---

### 需求 26：商品导入页面

**用户故事**：Story 15
**限界上下文**：Item Context
**业务规则**：BR-IMPORT-001, BR-IMPORT-002

#### 验收标准

1. WHEN 管理员点击导入按钮 THEN THE Item_System SHALL 跳转到商品导入页面
2. WHEN 管理员点击下载模板 THEN THE Item_System SHALL 返回标准 Excel 模板文件
3. WHEN 管理员上传 Excel 文件 THEN THE Item_System SHALL 解析文件并返回数据预览
4. IF 上传的文件不是 Excel 格式 THEN THE Item_System SHALL 拒绝并返回错误码 IMPORT_FILE_FORMAT_INVALID
5. IF 上传的文件超过 10MB THEN THE Item_System SHALL 拒绝并返回错误码 IMPORT_FILE_TOO_LARGE
6. IF 上传的文件数据行数超过 5000 THEN THE Item_System SHALL 拒绝并返回错误码 IMPORT_DATA_TOO_MANY

---

### 需求 27：商品导入字段映射

**用户故事**：Story 15
**限界上下文**：Item Context

#### 验收标准

1. WHEN 数据预览显示 THEN THE Item_System SHALL 展示 Item 基础字段映射区域
2. WHEN 数据预览显示 THEN THE Item_System SHALL 展示 Base UOM 字段映射区域
3. WHEN 数据预览显示 THEN THE Item_System SHALL 展示 Inner UOM 字段映射区域（可选）
4. WHEN 数据预览显示 THEN THE Item_System SHALL 展示 Case UOM 字段映射区域（可选）
5. WHEN 管理员选择 Excel 列与系统字段的对应关系 THEN THE Item_System SHALL 记录映射配置
6. WHEN 使用标准模板上传 THEN THE Item_System SHALL 根据列名自动匹配默认映射

---

### 需求 28：商品导入数据校验

**用户故事**：Story 16
**限界上下文**：Item Context
**业务规则**：BR-ITEM-001, BR-BARCODE-001, BR-BARCODE-002, BR-UOM-001, BR-IMPORT-003

#### 验收标准

1. WHEN 导入数据 SKU 为空 THEN THE Item_System SHALL 标记错误并返回 IMPORT_SKU_REQUIRED
2. WHEN 导入数据 SKU 在系统中已存在 THEN THE Item_System SHALL 标记错误并返回 IMPORT_SKU_DUPLICATE
3. WHEN 导入数据客户 ID 有值但不存在 THEN THE Item_System SHALL 标记错误并返回 IMPORT_CUSTOMER_NOT_FOUND
4. WHEN 导入数据危险品 ID 有值但不存在 THEN THE Item_System SHALL 标记错误并返回 IMPORT_HAZARD_NOT_FOUND
5. WHEN 导入数据行业 ID 有值但不存在 THEN THE Item_System SHALL 标记错误并返回 IMPORT_INDUSTRY_NOT_FOUND
6. WHEN 导入数据基本单位信息缺失 THEN THE Item_System SHALL 标记错误并返回 IMPORT_BASE_UOM_REQUIRED
7. WHEN 导入数据单位换算数量小于等于 0 THEN THE Item_System SHALL 标记错误并返回 IMPORT_UOM_QTY_INVALID
8. WHEN 导入数据 EAN 码格式不正确 THEN THE Item_System SHALL 标记错误并返回 IMPORT_EAN_CODE_INVALID
9. WHEN 导入数据 UPC 码格式不正确 THEN THE Item_System SHALL 标记错误并返回 IMPORT_UPC_CODE_INVALID

---

### 需求 29：商品批量导入执行

**用户故事**：Story 15
**限界上下文**：Item Context
**业务规则**：BR-IMPORT-004

#### 验收标准

1. WHEN 管理员确认导入 THEN THE Item_System SHALL 逐行校验并执行导入
2. WHEN 某行数据校验失败 THEN THE Item_System SHALL 记录错误信息并继续处理其他行
3. WHEN 导入完成 THEN THE Item_System SHALL 返回成功数量、失败数量和错误详情列表
4. WHEN 导入成功的商品 THEN THE Item_System SHALL 发布 ItemCreatedEvent 事件
5. WHEN 导入包含单位信息 THEN THE Item_System SHALL 同时创建商品单位记录

---

## 非功能需求

### NFR-1：性能要求

1. THE Item_System SHALL 在 500ms 内返回商品列表查询结果（1000 条数据以内）
2. THE Item_System SHALL 在 200ms 内返回商品详情查询结果
3. THE Item_System SHALL 在 100ms 内返回条码识别结果

### NFR-2：数据一致性

1. THE Item_System SHALL 保证商品 SKU 在同一租户下唯一
2. THE Item_System SHALL 在删除商品前检查关联数据
3. THE Item_System SHALL 保证属性、单位、套装组件的增删改事务一致性

### NFR-3：安全要求

1. THE Item_System SHALL 按租户隔离商品数据
2. THE Item_System SHALL 记录敏感操作的操作日志

---

## 错误码清单

商品相关：
- ITEM_NOT_FOUND - 商品不存在
- ITEM_SKU_DUPLICATE - SKU 重复
- ITEM_TYPE_INVALID - 商品类型无效
- ITEM_HAS_INVENTORY - 商品有关联库存
- ITEM_HAS_PENDING_ORDER - 商品有未完成订单
- PACKAGING_MATERIAL_INVALID_FORMAT - 包装材料格式无效（应为 ITEM-xxx）
- PACKAGING_MATERIAL_NOT_FOUND - 包装材料引用的商品不存在
- PACKAGING_MATERIAL_INVALID_TYPE - 包装材料引用的商品类型不是 MATERIAL
- CUSTOMER_NOT_FOUND - 客户引用的组织不存在
- CUSTOMER_INVALID_TAG - 客户引用的组织 tags 不包含 CUSTOMER
- BRAND_NOT_FOUND - 品牌引用的组织不存在
- BRAND_INVALID_TAG - 品牌引用的组织 tags 不包含 BRAND

条码相关：
- BARCODE_NOT_FOUND - 条码不存在
- BARCODE_DUPLICATE - 条码重复
- EAN_CODE_INVALID - EAN 码格式无效
- UPC_CODE_INVALID - UPC 码格式无效

序列号相关：
- SN_NOT_ENABLED - 序列号未启用
- SN_LENGTH_INVALID - 序列号长度无效
- SN_RULE_INVALID - 序列号验证规则无效

批次相关：
- LOT_NOT_ENABLED - 批次号未启用

属性相关：
- PROPERTY_NAME_DUPLICATE - 属性名称重复
- PROPERTY_VALUE_INVALID - 属性值无效
- PROPERTY_VALUE_NOT_NUMBER - 属性值不是数字
- REQUIRED_PROPERTY_MISSING - 必填属性缺失

单位相关：
- BASE_UOM_EXISTS - 基本单位已存在
- BASE_QTY_INVALID - 基本数量无效
- INSIDE_UOM_REQUIRED - 内包装单位必填
- DUAL_UOM_TYPE_REQUIRED - 双单位类型必填
- CANNOT_DELETE_BASE_UOM - 不能删除基本单位

套装相关：
- CANNOT_ADD_SELF_AS_COMPONENT - 不能添加自身为组件
- COMPONENT_QTY_INVALID - 组件数量无效
- KITTING_NO_COMPONENT - 套装没有组件

托盘配置相关：
- TI_HI_INVALID - TI/HI 值无效

发货规则相关：
- SHIP_DAYS_EXCEED_SHELF_LIFE - 允许发货天数超过保质期
- SHIP_TIME_WINDOW_INVALID - 发货规则时间窗口无效

行业相关：
- INDUSTRY_NOT_FOUND - 行业不存在
- INDUSTRY_CODE_DUPLICATE - 行业代码重复
- INDUSTRY_CODE_INVALID - 行业代码无效
- INDUSTRY_NAME_INVALID - 行业名称无效
- INDUSTRY_HAS_ITEMS - 行业有关联商品

行业属性模板相关：
- TEMPLATE_NOT_FOUND - 属性模板不存在
- TEMPLATE_NAME_DUPLICATE - 属性模板名称重复
- TEMPLATE_TYPE_INVALID - 属性类型无效
- TEMPLATE_OPTIONS_REQUIRED - SELECT 类型缺少选项

危险品相关：
- HAZARD_NOT_FOUND - 危险品定义不存在
- HAZARD_ID_DUPLICATE - 危险品 ID 重复
- HAZARD_NAME_REQUIRED - 危险品名称必填
- HAZARD_CLASS_REQUIRED - 危险品分类必填
- HAZARD_HAS_ITEMS - 危险品有关联商品

导入相关：
- IMPORT_FILE_FORMAT_INVALID - 导入文件格式无效（仅支持 xlsx/xls）
- IMPORT_FILE_TOO_LARGE - 导入文件过大（超过 10MB）
- IMPORT_DATA_TOO_MANY - 导入数据过多（超过 5000 行）
- IMPORT_SKU_REQUIRED - 导入数据 SKU 必填
- IMPORT_SKU_DUPLICATE - 导入数据 SKU 在系统中已存在
- IMPORT_CUSTOMER_NOT_FOUND - 导入数据客户不存在
- IMPORT_HAZARD_NOT_FOUND - 导入数据危险品定义不存在
- IMPORT_INDUSTRY_NOT_FOUND - 导入数据行业不存在
- IMPORT_BASE_UOM_REQUIRED - 导入数据基本单位必填
- IMPORT_UOM_QTY_INVALID - 导入数据单位换算数量无效
- IMPORT_EAN_CODE_INVALID - 导入数据 EAN 码格式无效
- IMPORT_UPC_CODE_INVALID - 导入数据 UPC 码格式无效
