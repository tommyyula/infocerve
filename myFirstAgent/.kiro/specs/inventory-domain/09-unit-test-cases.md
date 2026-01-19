# 库存领域 - 单元测试用例

## 1. 测试范围

本文档定义库存领域的单元测试用例，按 DDD 分层组织：
- 领域层测试（聚合根、实体、值对象、领域服务）
- 应用层测试（应用服务）

---

## 2. 领域层测试

### 2.1 Inventory 聚合根测试

测试类：InventoryTest

---

用例编号：UT-INV-001
用例名称：创建库存 - 成功
测试方法：shouldCreateInventorySuccessfully
输入：
- customerId: "CUST-001"
- itemId: "ITEM-001"
- qty: 100.0
- status: AVAILABLE
预期结果：
- 库存对象创建成功
- 所有属性正确设置

---

用例编号：UT-INV-002
用例名称：创建库存 - 数量为负数
测试方法：shouldThrowExceptionWhenQtyIsNegative
输入：
- qty: -10.0
预期结果：
- 抛出 IllegalArgumentException
- 错误信息包含"数量不能为负数"

---

用例编号：UT-INV-003
用例名称：增加库存数量
测试方法：shouldIncreaseQuantitySuccessfully
输入：
- 初始数量: 100.0
- 增加数量: 50.0
预期结果：
- 最终数量: 150.0

---

用例编号：UT-INV-004
用例名称：减少库存数量 - 成功
测试方法：shouldDecreaseQuantitySuccessfully
输入：
- 初始数量: 100.0
- 减少数量: 30.0
预期结果：
- 最终数量: 70.0

---

用例编号：UT-INV-005
用例名称：减少库存数量 - 库存不足
测试方法：shouldThrowExceptionWhenInsufficientQuantity
输入：
- 初始数量: 100.0
- 减少数量: 150.0
预期结果：
- 抛出 InventoryInsufficientException
- 错误码: INV-003

---

用例编号：UT-INV-006
用例名称：更新库存状态 - 成功
测试方法：shouldUpdateStatusSuccessfully
输入：
- 初始状态: AVAILABLE
- 目标状态: HOLD
预期结果：
- 状态更新为 HOLD

---

用例编号：UT-INV-007
用例名称：更新库存状态 - 不允许的状态转换
测试方法：shouldThrowExceptionWhenInvalidStatusTransition
输入：
- 初始状态: SHIPPED
- 目标状态: AVAILABLE
预期结果：
- 抛出 InventoryStatusNotAllowException
- 错误码: INV-004

---

用例编号：UT-INV-008
用例名称：设置差异标记
测试方法：shouldSetDiscrepancyFlagSuccessfully
输入：
- discrepancyFlag: "DAMAGED"
预期结果：
- 差异标记设置成功
- discrepancyReportTime 自动设置为当前时间

---

用例编号：UT-INV-009
用例名称：移动库存到新LP
测试方法：shouldMoveToNewLpSuccessfully
输入：
- 原LP: "PALLET-001"
- 目标LP: "PALLET-002"
预期结果：
- lpId 更新为 "PALLET-002"

---

### 2.2 Lp 聚合根测试

测试类：LpTest

---

用例编号：UT-LP-001
用例名称：创建LP - 成功
测试方法：shouldCreateLpSuccessfully
输入：
- type: PALLET
- code: "001"
预期结果：
- LP创建成功
- id 格式为 "PALLET-001"
- status 为 OPEN

---

用例编号：UT-LP-002
用例名称：创建LP - 类型为空
测试方法：shouldThrowExceptionWhenTypeIsNull
输入：
- type: null
预期结果：
- 抛出 IllegalArgumentException

---

用例编号：UT-LP-003
用例名称：LP移动到新库位
测试方法：shouldMoveToNewLocationSuccessfully
输入：
- 原库位: "LOC-A01"
- 目标库位: "LOC-B02"
预期结果：
- locationId 更新为 "LOC-B02"

---

用例编号：UT-LP-004
用例名称：更新LP状态
测试方法：shouldUpdateStatusSuccessfully
输入：
- 初始状态: OPEN
- 目标状态: SHIPPED
预期结果：
- 状态更新为 SHIPPED

---

用例编号：UT-LP-005
用例名称：设置父LP
测试方法：shouldSetParentLpSuccessfully
输入：
- parentId: "HLP-001"
预期结果：
- parentId 设置成功

---

### 2.3 Adjustment 聚合根测试

测试类：AdjustmentTest

---

用例编号：UT-ADJ-001
用例名称：创建调整单 - 成功
测试方法：shouldCreateAdjustmentSuccessfully
输入：
- customerId: "CUST-001"
- reason: "盘点差异"
预期结果：
- 调整单创建成功
- status 为 NEW
- id 格式为 "ADJ-xxx"

---

用例编号：UT-ADJ-002
用例名称：添加调整行
测试方法：shouldAddAdjustmentLineSuccessfully
输入：
- type: ADJUST_QTY
- adjustQty: 10.0
预期结果：
- 调整行添加成功
- lines 列表包含新行

---

用例编号：UT-ADJ-003
用例名称：审批调整单 - 成功
测试方法：shouldApproveSuccessfully
输入：
- 调整单状态: NEW
- 审批人: "admin"
预期结果：
- status 变为 APPROVED
- approveTime 设置为当前时间
- approveBy 设置为 "admin"

---

用例编号：UT-ADJ-004
用例名称：审批调整单 - 已审批
测试方法：shouldThrowExceptionWhenAlreadyApproved
输入：
- 调整单状态: APPROVED
预期结果：
- 抛出 AdjustmentAlreadyApprovedException
- 错误码: ADJ-004

---

用例编号：UT-ADJ-005
用例名称：删除调整行
测试方法：shouldRemoveAdjustmentLineSuccessfully
输入：
- 调整行ID: 1
预期结果：
- 调整行从列表中移除

---

### 2.4 InventoryLock 聚合根测试

测试类：InventoryLockTest

---

用例编号：UT-LOCK-001
用例名称：创建库存锁定 - 成功
测试方法：shouldCreateInventoryLockSuccessfully
输入：
- orderId: "ORDER-001"
- itemId: "ITEM-001"
- qty: 50.0
预期结果：
- 锁定记录创建成功
- status 为 ACTIVE

---

用例编号：UT-LOCK-002
用例名称：释放锁定
测试方法：shouldDeactivateSuccessfully
输入：
- 锁定状态: ACTIVE
预期结果：
- status 变为 INACTIVE

---

用例编号：UT-LOCK-003
用例名称：释放已释放的锁定
测试方法：shouldThrowExceptionWhenAlreadyInactive
输入：
- 锁定状态: INACTIVE
预期结果：
- 抛出 IllegalStateException

---

### 2.5 值对象测试

测试类：QuantityTest

---

用例编号：UT-VO-001
用例名称：Quantity 加法
测试方法：shouldAddQuantitySuccessfully
输入：
- qty1: 100.0
- qty2: 50.0
预期结果：
- 结果: 150.0

---

用例编号：UT-VO-002
用例名称：Quantity 减法
测试方法：shouldSubtractQuantitySuccessfully
输入：
- qty1: 100.0
- qty2: 30.0
预期结果：
- 结果: 70.0

---

用例编号：UT-VO-003
用例名称：Quantity 比较
测试方法：shouldCompareQuantityCorrectly
输入：
- qty1: 100.0
- qty2: 50.0
预期结果：
- qty1 > qty2 返回 true

---

测试类：InventoryIdentifierTest

---

用例编号：UT-VO-004
用例名称：InventoryIdentifier 相等性
测试方法：shouldBeEqualWhenAllFieldsMatch
输入：
- identifier1: {itemId: "ITEM-001", lpId: "LP-001", lotNo: "LOT-001"}
- identifier2: {itemId: "ITEM-001", lpId: "LP-001", lotNo: "LOT-001"}
预期结果：
- equals 返回 true
- hashCode 相同

---

### 2.6 领域服务测试

测试类：InventoryDomainServiceTest

---

用例编号：UT-DS-001
用例名称：计算可用库存
测试方法：shouldCalculateAvailableQuantityCorrectly
输入：
- 总库存: 100.0
- 锁定数量: 30.0
预期结果：
- 可用库存: 70.0

---

用例编号：UT-DS-002
用例名称：验证库存移动规则 - 不能移动到已发货LP
测试方法：shouldThrowExceptionWhenMoveToShippedLp
输入：
- 目标LP状态: SHIPPED
预期结果：
- 抛出 CannotMoveToShippedLpException
- 错误码: LP-003

---

用例编号：UT-DS-003
用例名称：验证库存移动规则 - 不能移动LP到HLP
测试方法：shouldThrowExceptionWhenMoveLpToHlp
输入：
- 源LP类型: PALLET
- 目标LP类型: HLP
预期结果：
- 抛出 CannotMoveLpToHlpException
- 错误码: LP-004

---

## 3. 应用层测试

### 3.1 InventoryApplicationService 测试

测试类：InventoryApplicationServiceTest

---

用例编号：UT-APP-001
用例名称：创建库存
测试方法：shouldCreateInventorySuccessfully
Mock：
- InventoryRepository.save() 返回成功
输入：
- InventoryCreateCmd
预期结果：
- 返回创建的库存ID
- Repository.save() 被调用一次

---

用例编号：UT-APP-002
用例名称：库存移动
测试方法：shouldMoveInventorySuccessfully
Mock：
- InventoryRepository.findById() 返回库存
- LpRepository.findById() 返回目标LP
输入：
- InventoryMoveCmd
预期结果：
- 库存LP更新
- 库存日志记录
- 库存活动记录

---

用例编号：UT-APP-003
用例名称：批量库存移动
测试方法：shouldBatchMoveInventorySuccessfully
Mock：
- InventoryRepository.findByIds() 返回库存列表
输入：
- List<InventoryMoveCmd>
预期结果：
- 所有库存移动成功
- 批量保存调用一次

---

### 3.2 LpApplicationService 测试

测试类：LpApplicationServiceTest

---

用例编号：UT-APP-004
用例名称：创建LP
测试方法：shouldCreateLpSuccessfully
Mock：
- SequencesService.getNextSequence() 返回序号
- LpRepository.save() 返回成功
输入：
- LpCreateCmd
预期结果：
- 返回创建的LP
- LP ID格式正确

---

用例编号：UT-APP-005
用例名称：批量创建LP
测试方法：shouldBatchCreateLpSuccessfully
Mock：
- SequencesService.getNextSequence() 返回连续序号
输入：
- LpBatchCreateCmd (count: 5)
预期结果：
- 返回5个LP
- LP编码连续

---

### 3.3 AdjustmentApplicationService 测试

测试类：AdjustmentApplicationServiceTest

---

用例编号：UT-APP-006
用例名称：创建调整单
测试方法：shouldCreateAdjustmentSuccessfully
Mock：
- SequencesService.getNextSequence() 返回序号
- AdjustmentRepository.save() 返回成功
输入：
- AdjustmentCreateCmd
预期结果：
- 返回调整单ID
- ID格式为 "ADJ-xxx"

---

用例编号：UT-APP-007
用例名称：审批调整单
测试方法：shouldApproveAdjustmentSuccessfully
Mock：
- AdjustmentRepository.findById() 返回调整单
- InventoryRepository.findByIdentifier() 返回库存
输入：
- adjustmentId: "ADJ-001"
预期结果：
- 调整单状态变为 APPROVED
- 库存数量按调整行更新
- 调整历史记录生成

---

## 4. 表间关系触发单元测试

### 4.1 库存创建触发日志测试

测试类：InventoryLogTriggerTest

---

用例编号：UT-TRIGGER-001
用例名称：创建库存时自动创建日志
测试方法：shouldCreateInventoryLogWhenInventoryCreated
Mock：
- InventoryLogRepository.save() 返回成功
输入：
- 新创建的 Inventory 对象
预期结果：
- InventoryLog 创建
- actionType = INSERT
- afterSnapshot 包含完整库存信息
- beforeSnapshot 为空

---

用例编号：UT-TRIGGER-002
用例名称：更新库存时自动创建日志
测试方法：shouldCreateInventoryLogWhenInventoryUpdated
Mock：
- InventoryLogRepository.save() 返回成功
输入：
- 更新前的 Inventory
- 更新后的 Inventory
预期结果：
- InventoryLog 创建
- actionType = UPDATE
- beforeSnapshot 包含更新前信息
- afterSnapshot 包含更新后信息

---

### 4.2 库存创建触发活动测试

测试类：InventoryActivityTriggerTest

---

用例编号：UT-TRIGGER-003
用例名称：创建库存时自动创建活动记录
测试方法：shouldCreateInventoryActivityWhenInventoryCreated
Mock：
- InventoryActivityRepository.save() 返回成功
输入：
- 新创建的 Inventory 对象
- activityType = RECEIVE
预期结果：
- InventoryActivity 创建
- toLpId = inventory.lpId
- toLocationId = inventory.locationId
- toStatus = inventory.status

---

用例编号：UT-TRIGGER-004
用例名称：库存移动时自动创建活动记录
测试方法：shouldCreateInventoryActivityWhenInventoryMoved
Mock：
- InventoryActivityRepository.save() 返回成功
输入：
- 源库存信息
- 目标库存信息
- activityType = MOVE
预期结果：
- InventoryActivity 创建
- fromLpId = 源库存.lpId
- toLpId = 目标库存.lpId
- fromStatus = 源库存.status
- toStatus = 目标库存.status

---

### 4.3 调整单审批触发测试

测试类：AdjustmentApproveTriggerTest

---

用例编号：UT-TRIGGER-005
用例名称：ADD_INVENTORY审批触发库存创建
测试方法：shouldCreateInventoryWhenAddInventoryApproved
Mock：
- InventoryRepository.save() 返回成功
输入：
- 调整单，类型 ADD_INVENTORY
- 调整行包含 itemId, qty, lpId
预期结果：
- Inventory 创建
- qty = 调整行.qty
- lpId = 调整行.lpId
- adjustmentId = 调整单.id

---

用例编号：UT-TRIGGER-006
用例名称：ADJUST_QTY减少审批触发库存移动到ADJUSTOUT
测试方法：shouldMoveToAdjustOutWhenQtyDecreaseApproved
Mock：
- InventoryRepository.findByIdentifier() 返回库存
- InventoryMoveService.move() 返回成功
输入：
- 调整单，类型 ADJUST_QTY
- 调整行 adjustQty = -30
- 原库存 qty = 100
预期结果：
- 原库存 qty 变为 70
- 新库存创建，status = ADJUSTOUT, qty = 30

---

用例编号：UT-TRIGGER-007
用例名称：审批触发调整历史创建
测试方法：shouldCreateAdjustmentHistoryWhenApproved
Mock：
- AdjustmentHistoryRepository.save() 返回成功
输入：
- 调整单
- 审批人 = "admin"
预期结果：
- AdjustmentHistory 创建
- adjustmentId = 调整单.id
- approveBy = "admin"
- approveTime 不为空

---

### 4.4 LP删除触发测试

测试类：LpDeleteTriggerTest

---

用例编号：UT-TRIGGER-008
用例名称：删除有库存的LP触发调整单创建
测试方法：shouldCreateAdjustmentWhenDeleteLpWithInventory
Mock：
- InventoryRepository.findByLpId() 返回库存列表
- AdjustmentRepository.save() 返回成功
输入：
- LP ID = "ILP-001"
- LP内库存数量 = 50
预期结果：
- Adjustment 创建
- 调整类型 = ADJUST_QTY
- adjustQty = -50
- 自动审批

---

### 4.5 LP移动触发库存同步测试

测试类：LpMoveTriggerTest

---

用例编号：UT-TRIGGER-009
用例名称：LP移动触发内部库存位置同步
测试方法：shouldSyncInventoryLocationWhenLpMoved
Mock：
- InventoryRepository.findByLpId() 返回3条库存
- InventoryRepository.batchUpdate() 返回成功
输入：
- LP ID = "ILP-001"
- 原位置 = "LOC-A01"
- 目标位置 = "LOC-B02"
预期结果：
- 3条库存的 locationId 都更新为 "LOC-B02"
- batchUpdate 调用一次

---

## 5. 导入导出单元测试

### 5.1 库存导入测试

测试类：InventoryImportApplicationServiceTest

---

用例编号：UT-IMPORT-001
用例名称：导入预览 - 解析成功
测试方法：shouldPreviewSuccessfully
Mock：
- FileClient.downloadFile() 返回模板文件流
输入：
- fileId、sheetName
预期结果：
- 返回 sheetNames、sheetName、previewData
- fieldMapping 可自动匹配部分字段

---

用例编号：UT-IMPORT-002
用例名称：导入预览 - 必填字段未映射
测试方法：shouldReturnUnmappedRequiredFields
Mock：
- FileClient.downloadFile() 返回模板文件流
输入：
- fileId、sheetName（缺少必填列）
预期结果：
- unmappedRequiredFields 包含 customerId、itemId、qty、uomId、lpId

---

用例编号：UT-IMPORT-003
用例名称：导入执行 - 不同客户
测试方法：shouldFailWhenDifferentCustomers
输入：
- 预览数据包含不同 customerId
预期结果：
- failedCount > 0
- failedRows 错误码为 IMPORT_CUSTOMER_NOT_MATCH

---

用例编号：UT-IMPORT-004
用例名称：导入执行 - LP不存在
测试方法：shouldFailWhenLpNotExists
Mock：
- LpRepository.findById() 返回空
输入：
- fieldMapping 映射到不存在的 lpId
预期结果：
- failedCount > 0
- failedRows 错误信息包含"LP不存在"

---

用例编号：UT-IMPORT-005
用例名称：导入执行 - 成功
测试方法：shouldExecuteSuccessfully
Mock：
- AdjustmentRepository.save() 返回成功
输入：
- 合法的 fieldMapping 和数据列表
预期结果：
- successCount > 0
- failedCount = 0
- Adjustment 创建，类型 = ADD_INVENTORY，自动审批

---

### 5.2 库存导出测试

测试类：InventoryExportServiceTest

---

用例编号：UT-EXPORT-001
用例名称：导出CSV格式
测试方法：shouldExportCsvSuccessfully
Mock：
- InventoryRepository.findByQuery() 返回库存列表
输入：
- 导出查询条件
- 格式 = CSV
预期结果：
- 返回CSV格式文件
- 包含所有字段

---

用例编号：UT-EXPORT-002
用例名称：导出Excel格式
测试方法：shouldExportExcelSuccessfully
Mock：
- InventoryRepository.findByQuery() 返回库存列表
输入：
- 导出查询条件
- 格式 = Excel
预期结果：
- 返回Excel格式文件
- 包含所有字段

---

用例编号：UT-EXPORT-003
用例名称：导出包含动态属性映射
测试方法：shouldExportWithDynPropertyMapping
Mock：
- DynPropertyMappingRepository.findByType() 返回映射配置
输入：
- 库存数据包含 dynStr1 = "BATCH001"
- 映射配置：dynStr1 → "生产批次"
预期结果：
- 导出文件列名为"生产批次"
- 值为"BATCH001"

---

## 6. 配置管理单元测试

### 6.1 动态属性映射测试

测试类：DynPropertyMappingServiceTest

---

用例编号：UT-CFG-001
用例名称：创建动态属性映射
测试方法：shouldCreateDynPropertyMappingSuccessfully
Mock：
- DynPropertyMappingRepository.save() 返回成功
输入：
- customField = "生产批次"
- originalField = "dynStr1"
- type = INVENTORY
预期结果：
- 映射创建成功
- 返回映射ID

---

用例编号：UT-CFG-002
用例名称：查询动态属性映射
测试方法：shouldQueryDynPropertyMappingSuccessfully
Mock：
- DynPropertyMappingRepository.findByType() 返回映射列表
输入：
- type = INVENTORY
预期结果：
- 返回 INVENTORY 类型的所有映射

---

用例编号：UT-CFG-003
用例名称：多租户映射隔离
测试方法：shouldIsolateMappingByTenant
Mock：
- TenantContext.getCurrentTenant() 返回 "TENANT001"
输入：
- 查询映射
预期结果：
- 只返回 TENANT001 的映射配置

---

### 6.2 序列号管理测试

测试类：SequencesServiceTest

---

用例编号：UT-CFG-004
用例名称：获取序列号
测试方法：shouldGetNextSequenceSuccessfully
Mock：
- SequencesRepository.incrementAndGet() 返回新序号
输入：
- type = "LP"
预期结果：
- 返回递增的序列号

---

用例编号：UT-CFG-005
用例名称：批量获取序列号
测试方法：shouldGetBatchSequencesSuccessfully
Mock：
- SequencesRepository.incrementAndGet() 返回新序号
输入：
- type = "LP"
- count = 5
预期结果：
- 返回5个连续的序列号

---

用例编号：UT-CFG-006
用例名称：并发获取序列号不重复
测试方法：shouldNotDuplicateWhenConcurrentAccess
Mock：
- 使用真实数据库
输入：
- 10个线程同时获取序列号
预期结果：
- 所有序列号唯一
- 无重复

---

## 7. 差异标记和单位转换单元测试

### 7.1 差异标记测试

测试类：InventoryDiscrepancyServiceTest

---

用例编号：UT-DISC-001
用例名称：设置差异标记
测试方法：shouldSetDiscrepancyFlagSuccessfully
Mock：
- InventoryRepository.update() 返回成功
输入：
- inventoryId = 1
- discrepancyFlag = DISCREPANCY
预期结果：
- 差异标记设置成功
- discrepancyReportTime 自动设置

---

用例编号：UT-DISC-002
用例名称：释放差异标记联动释放WARNING
测试方法：shouldReleaseWarningWhenNoOtherDiscrepancy
Mock：
- InventoryRepository.countByItemIdAndDiscrepancyFlag() 返回 0
输入：
- 释放单条库存的 DISCREPANCY 标记
- 该商品无其他 DISCREPANCY 记录
预期结果：
- DISCREPANCY 标记释放
- WARNING 标记也被释放

---

### 7.2 单位转换测试

测试类：InventoryUomConversionServiceTest

---

用例编号：UT-UOM-001
用例名称：单位转换成功
测试方法：shouldConvertUomSuccessfully
Mock：
- UomService.getConversionRate() 返回换算系数
输入：
- 源库存 qty=100, uomId=EA
- 目标 uomId=CS (1CS=10EA)
预期结果：
- 转换后 qty=10, uomId=CS
- baseQty 不变

---

用例编号：UT-UOM-002
用例名称：单位转换 - 源库存uomId不一致
测试方法：shouldThrowExceptionWhenUomIdInconsistent
输入：
- 库存1 uomId=EA
- 库存2 uomId=CS
预期结果：
- 抛出 ValidationException
- 错误信息包含"所有源库存必须具有相同的计量单位"

---

用例编号：UT-UOM-003
用例名称：单位转换 - 结果非整数
测试方法：shouldThrowExceptionWhenResultNotInteger
输入：
- 源库存 qty=15, uomId=EA
- 目标 uomId=CS (1CS=10EA)
预期结果：
- 抛出 ValidationException
- 错误信息包含"转换结果必须为整数"

---

## 4. 测试代码示例

```java
// InventoryTest.java
class InventoryTest {
    
    @Test
    void shouldCreateInventorySuccessfully() {
        // Given
        String customerId = "CUST-001";
        String itemId = "ITEM-001";
        Double qty = 100.0;
        
        // When
        Inventory inventory = Inventory.create(customerId, itemId, qty);
        
        // Then
        assertNotNull(inventory);
        assertEquals(customerId, inventory.getCustomerId());
        assertEquals(itemId, inventory.getItemId());
        assertEquals(qty, inventory.getQty());
        assertEquals(InventoryStatus.AVAILABLE, inventory.getStatus());
    }
    
    @Test
    void shouldThrowExceptionWhenQtyIsNegative() {
        // Given
        Double negativeQty = -10.0;
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            Inventory.create("CUST-001", "ITEM-001", negativeQty);
        });
    }
    
    @Test
    void shouldDecreaseQuantitySuccessfully() {
        // Given
        Inventory inventory = createInventoryWithQty(100.0);
        
        // When
        inventory.decrease(30.0);
        
        // Then
        assertEquals(70.0, inventory.getQty());
    }
    
    @Test
    void shouldThrowExceptionWhenInsufficientQuantity() {
        // Given
        Inventory inventory = createInventoryWithQty(100.0);
        
        // When & Then
        assertThrows(InventoryInsufficientException.class, () -> {
            inventory.decrease(150.0);
        });
    }
}
```

---

## 参考文档

- .kiro/specs/inventory-domain/04-domain-model.md（领域建模）
- .kiro/specs/inventory-domain/06-design.md（技术设计）
