# 库存领域 - API 测试用例

## 1. 测试范围

本文档定义库存领域的 API 测试用例，覆盖所有 REST 接口：
- 库存管理 API
- LP 管理 API
- 调整单 API
- 库存锁定 API
- 日志查询 API
- 配置管理 API

---

## 2. 测试环境

- 测试框架：Spring Boot Test + MockMvc
- 数据库：H2 内存数据库
- 认证：Mock JWT Token

---

## 3. 库存管理 API 测试

### 3.1 创建库存

用例编号：API-INV-001
接口：POST /api/inventory
用例名称：创建库存 - 成功

请求体：
```json
{
  "customerId": "CUST-001",
  "itemId": "ITEM-001",
  "qty": 100.0,
  "uomId": "UOM-001",
  "status": "AVAILABLE",
  "lpId": "PALLET-001",
  "locationId": "LOC-A01"
}
```

预期响应：
- 状态码：201
- 响应体：{ "id": 1 }

---

用例编号：API-INV-002
接口：POST /api/inventory
用例名称：创建库存 - 缺少必填字段

请求体：
```json
{
  "itemId": "ITEM-001",
  "qty": 100.0
}
```

预期响应：
- 状态码：400
- 错误信息包含 "customerId is required"

---

用例编号：API-INV-003
接口：POST /api/inventory
用例名称：创建库存 - 数量为负数

请求体：
```json
{
  "customerId": "CUST-001",
  "itemId": "ITEM-001",
  "qty": -10.0
}
```

预期响应：
- 状态码：400
- 错误码：INV-002

---

### 3.2 查询库存

用例编号：API-INV-004
接口：GET /api/inventory
用例名称：查询库存列表 - 成功

请求参数：
- customerId: CUST-001
- itemId: ITEM-001

预期响应：
- 状态码：200
- 响应体：库存列表数组

---

用例编号：API-INV-005
接口：GET /api/inventory/page
用例名称：分页查询库存 - 成功

请求参数：
- page: 0
- size: 10
- customerId: CUST-001

预期响应：
- 状态码：200
- 响应体包含：content, totalElements, totalPages

---

### 3.3 库存移动

用例编号：API-INV-006
接口：POST /api/inventory/move
用例名称：库存移动 - 成功

请求体：
```json
{
  "from": {
    "inventoryId": 1,
    "lpId": "PALLET-001"
  },
  "to": {
    "lpId": "PALLET-002",
    "locationId": "LOC-B01"
  },
  "moveInventoryQty": 50.0
}
```

预期响应：
- 状态码：200

---

用例编号：API-INV-007
接口：POST /api/inventory/move
用例名称：库存移动 - 库存不足

请求体：
```json
{
  "from": {
    "inventoryId": 1
  },
  "to": {
    "lpId": "PALLET-002"
  },
  "moveInventoryQty": 1000.0
}
```

预期响应：
- 状态码：400
- 错误码：INV-003

---

用例编号：API-INV-008
接口：POST /api/inventory/batch-move
用例名称：批量库存移动 - 成功

请求体：
```json
[
  {
    "from": { "inventoryId": 1 },
    "to": { "lpId": "PALLET-002" },
    "moveInventoryQty": 30.0
  },
  {
    "from": { "inventoryId": 2 },
    "to": { "lpId": "PALLET-002" },
    "moveInventoryQty": 20.0
  }
]
```

预期响应：
- 状态码：200

---

### 3.4 更新库存状态

用例编号：API-INV-009
接口：PUT /api/inventory/status
用例名称：更新库存状态 - 成功

请求体：
```json
{
  "inventoryIds": [1, 2, 3],
  "status": "HOLD"
}
```

预期响应：
- 状态码：200

---

用例编号：API-INV-010
接口：PUT /api/inventory/status
用例名称：更新库存状态 - 无效状态转换

请求体：
```json
{
  "inventoryIds": [1],
  "status": "AVAILABLE"
}
```

前置条件：库存状态为 SHIPPED

预期响应：
- 状态码：400
- 错误码：INV-004

---

## 4. LP 管理 API 测试

### 4.1 创建LP

用例编号：API-LP-001
接口：POST /api/lp
用例名称：创建LP - 成功

请求体：
```json
{
  "type": "PALLET",
  "code": "001",
  "locationId": "LOC-A01"
}
```

预期响应：
- 状态码：201
- 响应体包含：id (格式 PALLET-001)

---

用例编号：API-LP-002
接口：POST /api/lp/batch
用例名称：批量创建LP - 成功

请求体：
```json
{
  "type": "TOTE",
  "count": 5,
  "locationId": "LOC-A01"
}
```

预期响应：
- 状态码：201
- 响应体：5个LP对象的数组

---

### 4.2 查询LP

用例编号：API-LP-003
接口：GET /api/lp/{id}
用例名称：查询LP详情 - 成功

请求参数：
- id: PALLET-001

预期响应：
- 状态码：200
- 响应体包含LP详细信息

---

用例编号：API-LP-004
接口：GET /api/lp/{id}
用例名称：查询LP详情 - 不存在

请求参数：
- id: PALLET-999

预期响应：
- 状态码：404
- 错误码：LP-001

---

### 4.3 LP移动

用例编号：API-LP-005
接口：PUT /api/lp/{id}/move
用例名称：LP移动 - 成功

请求体：
```json
{
  "locationId": "LOC-B02"
}
```

预期响应：
- 状态码：200

---

### 4.4 删除LP

用例编号：API-LP-006
接口：DELETE /api/lp/{id}
用例名称：删除LP - 成功

前置条件：LP下无库存

预期响应：
- 状态码：204

---

用例编号：API-LP-007
接口：DELETE /api/lp/{id}
用例名称：删除LP - LP下有库存

前置条件：LP下存在库存

预期响应：
- 状态码：400
- 错误信息：LP下存在库存，无法删除

---

## 5. 调整单 API 测试

### 5.1 创建调整单

用例编号：API-ADJ-001
接口：POST /api/adjustment
用例名称：创建调整单 - 成功

请求体：
```json
{
  "customerId": "CUST-001",
  "reason": "盘点差异",
  "lines": [
    {
      "type": "ADJUST_QTY",
      "inventoryIdentifier": {
        "itemId": "ITEM-001",
        "lpId": "PALLET-001"
      },
      "adjustQty": 10.0
    }
  ]
}
```

预期响应：
- 状态码：201
- 响应体：{ "id": "ADJ-001" }

---

### 5.2 审批调整单

用例编号：API-ADJ-002
接口：PUT /api/adjustment/{id}/approve
用例名称：审批调整单 - 成功

请求参数：
- id: ADJ-001

前置条件：调整单状态为 NEW

预期响应：
- 状态码：200

---

用例编号：API-ADJ-003
接口：PUT /api/adjustment/{id}/approve
用例名称：审批调整单 - 已审批

请求参数：
- id: ADJ-001

前置条件：调整单状态为 APPROVED

预期响应：
- 状态码：400
- 错误码：ADJ-004

---

### 5.3 批量审批

用例编号：API-ADJ-004
接口：PUT /api/adjustment/batch-approve
用例名称：批量审批 - 成功

请求体：
```json
["ADJ-001", "ADJ-002", "ADJ-003"]
```

预期响应：
- 状态码：200

---

## 6. 库存锁定 API 测试

### 6.1 创建库存锁定

用例编号：API-LOCK-001
接口：POST /api/inventory-lock
用例名称：创建库存锁定 - 成功

请求体：
```json
{
  "orderId": "ORDER-001",
  "customerId": "CUST-001",
  "items": [
    {
      "itemId": "ITEM-001",
      "qty": 50.0
    }
  ]
}
```

预期响应：
- 状态码：201

---

用例编号：API-LOCK-002
接口：POST /api/inventory-lock
用例名称：创建库存锁定 - 库存不足

请求体：
```json
{
  "orderId": "ORDER-001",
  "customerId": "CUST-001",
  "items": [
    {
      "itemId": "ITEM-001",
      "qty": 10000.0
    }
  ]
}
```

预期响应：
- 状态码：400
- 错误码：INV-003

---

### 6.2 释放锁定

用例编号：API-LOCK-003
接口：PUT /api/inventory-lock/{id}/deactivate
用例名称：释放锁定 - 成功

预期响应：
- 状态码：200

---

## 7. 日志查询 API 测试

### 7.1 查询库存日志

用例编号：API-LOG-001
接口：GET /api/inventory-log
用例名称：查询库存日志 - 成功

请求参数：
- inventoryId: 1
- startTime: 2026-01-01T00:00:00
- endTime: 2026-01-31T23:59:59

预期响应：
- 状态码：200
- 响应体：日志列表

---

### 7.2 查询库存活动

用例编号：API-LOG-002
接口：GET /api/inventory-activity
用例名称：查询库存活动 - 成功

请求参数：
- activityType: MOVE
- itemId: ITEM-001

预期响应：
- 状态码：200
- 响应体：活动列表

---

## 8. 配置管理 API 测试

### 8.1 动态属性映射

用例编号：API-CFG-001
接口：POST /api/dynproperty-mapping
用例名称：创建动态属性映射 - 成功

请求体：
```json
{
  "customField": "生产批号",
  "originalField": "dyn_txt_property_value_01",
  "type": "INVENTORY"
}
```

预期响应：
- 状态码：201
- 响应体：{ "id": 1 }

---

用例编号：API-CFG-002
接口：GET /api/dynproperty-mapping
用例名称：查询动态属性映射 - 成功

请求参数：
- type: INVENTORY

预期响应：
- 状态码：200
- 响应体：映射列表

---

## 10. 表间关系触发 API 测试

### 10.1 库存创建触发日志和活动

用例编号：API-TRIGGER-001
接口：POST /api/inventory
用例名称：创建库存自动触发日志和活动记录

请求体：
```json
{
  "customerId": "CUST-001",
  "itemId": "ITEM-001",
  "qty": 100.0,
  "uomId": "EA",
  "lpId": "ILP-001"
}
```

预期响应：
- 状态码：201
- 响应体：{ "id": 1 }

验证步骤：
1. 查询 GET /api/inventory-log?inventoryId=1
2. 验证返回日志记录，actionType=INSERT
3. 查询 GET /api/inventory-activity?inventoryId=1
4. 验证返回活动记录

---

### 10.2 库存移动触发多表更新

用例编号：API-TRIGGER-002
接口：POST /api/inventory/move
用例名称：库存移动触发源库存扣减、目标库存创建、日志和活动

前置条件：
- 源库存存在，id=1, qty=100

请求体：
```json
{
  "from": { "inventoryId": 1 },
  "to": { "lpId": "ILP-002", "locationId": "LOC-B01" },
  "moveInventoryQty": 30.0,
  "inventoryActivityType": "MOVE"
}
```

预期响应：
- 状态码：200

验证步骤：
1. 查询 GET /api/inventory/1，验证 qty=70
2. 查询 GET /api/inventory?lpId=ILP-002，验证新库存 qty=30
3. 查询 GET /api/inventory-log?inventoryId=1，验证有 UPDATE 日志
4. 查询 GET /api/inventory-activity，验证有 MOVE 活动记录

---

### 10.3 调整单审批触发库存变更

用例编号：API-TRIGGER-003
接口：PUT /api/adjustment/{id}/approve
用例名称：ADD_INVENTORY审批触发库存创建

前置条件：
- 调整单存在，id=ADJ-001，状态NEW
- 调整类型 ADD_INVENTORY

预期响应：
- 状态码：200

验证步骤：
1. 查询 GET /api/adjustment/ADJ-001，验证 status=APPROVED
2. 查询 GET /api/inventory?adjustmentId=ADJ-001，验证库存创建
3. 查询 GET /api/adjustment-history?adjustmentId=ADJ-001，验证历史记录

---

### 10.4 调整单审批（数量减少）触发ADJUSTOUT

用例编号：API-TRIGGER-004
接口：PUT /api/adjustment/{id}/approve
用例名称：ADJUST_QTY减少触发库存移动到ADJUSTOUT

前置条件：
- 库存存在，qty=100
- 调整单存在，调整类型ADJUST_QTY，adjustQty=-30

预期响应：
- 状态码：200

验证步骤：
1. 查询原库存，验证 qty=70
2. 查询 GET /api/inventory?status=ADJUSTOUT，验证存在 qty=30 的记录
3. 查询活动记录，验证 activityType=ADJUST

---

### 10.5 LP删除触发调整单

用例编号：API-TRIGGER-005
接口：DELETE /api/lp/{id}
用例名称：删除有库存的LP触发调整单创建

前置条件：
- LP存在，id=ILP-001
- LP内有库存，qty=50

预期响应：
- 状态码：200

验证步骤：
1. 查询 GET /api/lp/ILP-001，验证 status=ON_HOLD
2. 查询 GET /api/adjustment?lpId=ILP-001，验证调整单创建
3. 验证调整单 status=APPROVED（自动审批）

---

### 10.6 LP移动触发库存位置同步

用例编号：API-TRIGGER-006
接口：PUT /api/lp/{id}/move
用例名称：LP移动同步更新内部库存位置

前置条件：
- LP存在，id=ILP-001，locationId=LOC-A01
- LP内有3条库存记录

请求体：
```json
{
  "locationId": "LOC-B02"
}
```

预期响应：
- 状态码：200

验证步骤：
1. 查询 GET /api/lp/ILP-001，验证 locationId=LOC-B02
2. 查询 GET /api/inventory?lpId=ILP-001，验证所有库存 locationId=LOC-B02

---

## 11. 导入导出 API 测试

说明：/api/inventory/upload 作为兼容接口不纳入当前测试范围。

### 11.1 库存导入模板下载

用例编号：API-IMPORT-001
接口：GET /file/template/inventory-import
用例名称：下载导入模板（file-app）

预期响应：
- 状态码：200
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- 文件包含必填字段列（customerId、itemId、qty、uomId、lpId）

---

### 11.2 库存导入预览

用例编号：API-IMPORT-002
接口：POST /inventory/import/preview
用例名称：导入预览成功

前置条件：
- 模板文件已上传到 file-app，获得 fileId

请求体：
```json
{
  "fileId": 10001,
  "sheetName": "Sheet1"
}
```

预期响应：
- 状态码：200
- 响应体包含 sheetNames、sheetName、sheet.previewData、sheet.fieldMapping
- unmappedRequiredFields 为空

---

### 11.3 库存导入执行

用例编号：API-IMPORT-003
接口：POST /inventory/import/execute
用例名称：导入执行成功

前置条件：
- 已完成预览并确认字段映射

请求体：
```json
{
  "fileId": 10001,
  "sheetName": "Sheet1",
  "fieldMapping": {
    "customerId": 0,
    "itemId": 2,
    "qty": 3,
    "uomId": 4,
    "lpId": 6
  }
}
```

预期响应：
- 状态码：200
- 响应体包含 totalRows、successCount、failedCount、failedRows
- successCount > 0 且 failedCount = 0

---

### 11.4 库存导入 - 不同客户

用例编号：API-IMPORT-004
接口：POST /inventory/import/execute
用例名称：导入失败 - 不同客户

前置条件：
- 文件中包含不同 customerId 的记录

请求体：
```json
{
  "fileId": 10002,
  "sheetName": "Sheet1",
  "fieldMapping": {
    "customerId": 0,
    "itemId": 2,
    "qty": 3,
    "uomId": 4,
    "lpId": 6
  }
}
```

预期响应：
- 状态码：200
- failedCount > 0
- failedRows[0].errorCode = "IMPORT_CUSTOMER_NOT_MATCH"

---

### 11.5 库存导出

用例编号：API-EXPORT-001
接口：GET /api/inventory/export
用例名称：导出库存数据

请求参数：
- customerId: CUST-001
- format: csv

预期响应：
- 状态码：200
- Content-Type: text/csv
- 文件包含筛选后的库存数据

---

### 11.6 库存异步导出

用例编号：API-EXPORT-002
接口：POST /api/inventory/export/async
用例名称：大数据量异步导出

请求体：
```json
{
  "customerId": "CUST-001",
  "format": "excel"
}
```

预期响应：
- 状态码：202
- 响应体：{ "taskId": "TASK-001" }

验证步骤：
1. 查询 GET /api/inventory/export/task/TASK-001
2. 验证任务状态和下载链接

---

### 11.7 库存锁定导出

用例编号：API-EXPORT-003
接口：GET /api/inventory-lock/export
用例名称：导出库存锁定数据

请求参数：
- customerId: CUST-001
- status: ACTIVE

预期响应：
- 状态码：200
- 文件包含锁定记录

---

## 12. 差异标记 API 测试

### 12.1 设置差异标记

用例编号：API-DISC-001
接口：PUT /api/inventory/discrepancy-flag
用例名称：设置差异标记

请求体：
```json
{
  "inventoryIds": [1, 2],
  "discrepancyFlag": "DISCREPANCY"
}
```

预期响应：
- 状态码：200

验证步骤：
1. 查询库存，验证 discrepancyFlag=DISCREPANCY
2. 验证 discrepancyReportTime 已设置

---

### 12.2 释放差异标记

用例编号：API-DISC-002
接口：PUT /api/inventory/{id}/release-discrepancy
用例名称：释放单条差异标记

前置条件：
- 库存存在，discrepancyFlag=DISCREPANCY
- 该商品无其他 DISCREPANCY 记录

预期响应：
- 状态码：200

验证步骤：
1. 验证 discrepancyFlag 已清空
2. 验证同商品的 WARNING 标记也被释放

---

## 13. 单位转换 API 测试

### 13.1 单位转换成功

用例编号：API-UOM-001
接口：POST /api/inventory/change-uom
用例名称：库存单位转换

请求体：
```json
{
  "from": { "inventoryId": 1 },
  "newUomId": "CS"
}
```

前置条件：
- 库存存在，qty=100, uomId=EA
- 1CS = 10EA

预期响应：
- 状态码：200
- 响应体：转换后的库存列表

验证步骤：
1. 验证 qty=10, uomId=CS
2. 验证 baseQty 不变

---

### 13.2 单位转换 - 结果非整数

用例编号：API-UOM-002
接口：POST /api/inventory/change-uom
用例名称：单位转换失败 - 结果非整数

请求体：
```json
{
  "from": { "inventoryId": 1 },
  "newUomId": "CS"
}
```

前置条件：
- 库存存在，qty=15, uomId=EA
- 1CS = 10EA

预期响应：
- 状态码：400
- 错误信息包含"转换结果必须为整数"

---

## 14. 统计查询 API 测试

### 14.1 库存总数量统计

用例编号：API-STAT-001
接口：GET /api/inventory/statistics/quantity
用例名称：统计库存总数量

请求参数：
- customerId: CUST-001
- itemId: ITEM-001

预期响应：
- 状态码：200
- 响应体：{ "totalQty": 250.0 }

---

### 14.2 LP数量统计

用例编号：API-STAT-002
接口：GET /api/inventory/statistics/lp-count
用例名称：统计LP数量

请求参数：
- customerId: CUST-001

预期响应：
- 状态码：200
- 响应体：{ "lpCount": 15 }

---

### 14.3 按LP统计商品种类

用例编号：API-STAT-003
接口：GET /api/inventory/statistics/item-count
用例名称：按LP统计商品种类数量

请求参数：
- lpIds: ["ILP-001", "ILP-002"]

预期响应：
- 状态码：200
- 响应体：
```json
{
  "itemCounts": [
    { "lpId": "ILP-001", "itemCount": 5 },
    { "lpId": "ILP-002", "itemCount": 3 }
  ]
}
```

---

## 9. 测试代码示例

```java
@SpringBootTest
@AutoConfigureMockMvc
class InventoryControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void shouldCreateInventorySuccessfully() throws Exception {
        // Given
        String requestBody = """
            {
              "customerId": "CUST-001",
              "itemId": "ITEM-001",
              "qty": 100.0,
              "status": "AVAILABLE"
            }
            """;
        
        // When & Then
        mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());
    }
    
    @Test
    void shouldReturnBadRequestWhenQtyIsNegative() throws Exception {
        // Given
        String requestBody = """
            {
              "customerId": "CUST-001",
              "itemId": "ITEM-001",
              "qty": -10.0
            }
            """;
        
        // When & Then
        mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INV-002"));
    }
    
    @Test
    void shouldMoveInventorySuccessfully() throws Exception {
        // Given
        String requestBody = """
            {
              "from": { "inventoryId": 1 },
              "to": { "lpId": "PALLET-002" },
              "moveInventoryQty": 50.0
            }
            """;
        
        // When & Then
        mockMvc.perform(post("/api/inventory/move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk());
    }
}
```

---

## 参考文档

- .kiro/specs/inventory-domain/06-design.md（技术设计）
- .kiro/specs/inventory-domain/03-requirements.md（需求规格）

