# 库存领域 - E2E 测试用例

## 1. 测试范围

本文档定义库存领域的端到端测试用例，覆盖以下功能模块：
- 库存管理
- LP 管理
- 调整单管理
- 库存锁定

---

## 2. 测试环境

- 前端：React + Ant Design
- 后端：Spring Boot 3.x
- 数据库：MySQL 8.0
- 测试工具：Playwright MCP

---

## 3. 库存管理测试用例

### 3.1 库存列表查询

用例编号：E2E-INV-001
用例名称：库存列表分页查询
前置条件：
- 用户已登录系统
- 存在测试库存数据

测试步骤：
1. 导航到库存管理页面
2. 验证库存列表正确显示
3. 输入商品ID进行搜索
4. 验证搜索结果正确
5. 点击下一页
6. 验证分页功能正常

预期结果：
- 库存列表正确显示
- 搜索功能正常
- 分页功能正常

---

### 3.2 库存移动

用例编号：E2E-INV-002
用例名称：库存移动到新LP
前置条件：
- 存在可移动的库存记录
- 目标LP已创建

测试步骤：
1. 导航到库存管理页面
2. 选择要移动的库存记录
3. 点击"移动"按钮
4. 在弹窗中选择目标LP
5. 输入移动数量
6. 点击确认
7. 验证移动成功提示
8. 验证库存数量变化

预期结果：
- 移动操作成功
- 原库存数量减少
- 目标LP库存增加
- 库存日志记录正确

---

### 3.3 库存状态变更

用例编号：E2E-INV-003
用例名称：更新库存状态
前置条件：
- 存在状态为 AVAILABLE 的库存

测试步骤：
1. 导航到库存管理页面
2. 选择库存记录
3. 点击"更新状态"按钮
4. 选择新状态 HOLD
5. 点击确认
6. 验证状态更新成功

预期结果：
- 状态更新成功
- 页面显示新状态
- 库存日志记录状态变更

---

### 3.4 库存导入

用例编号：E2E-INV-004
用例名称：批量导入库存
前置条件：
- 准备好导入模板文件
- 文件包含有效的库存数据

测试步骤：
1. 导航到库存管理页面
2. 点击"导入"按钮
3. 下载导入模板
4. 上传填写好的文件
5. 验证导入预览
6. 确认导入
7. 验证导入结果

预期结果：
- 模板下载成功
- 文件上传成功
- 预览数据正确
- 导入成功，数据正确入库

---

## 4. LP 管理测试用例

### 4.1 创建LP

用例编号：E2E-LP-001
用例名称：创建新LP
前置条件：
- 用户已登录
- 有创建LP权限

测试步骤：
1. 导航到LP管理页面
2. 点击"新建LP"按钮
3. 选择LP类型（PALLET）
4. 输入LP编码
5. 选择库位
6. 点击保存
7. 验证创建成功

预期结果：
- LP创建成功
- LP列表显示新记录
- LP ID格式正确（PALLET-xxx）

---

### 4.2 LP移动

用例编号：E2E-LP-002
用例名称：LP移动到新库位
前置条件：
- 存在可移动的LP
- 目标库位存在且可用

测试步骤：
1. 导航到LP管理页面
2. 选择要移动的LP
3. 点击"移动"按钮
4. 选择目标库位
5. 点击确认
6. 验证移动成功

预期结果：
- LP移动成功
- LP的库位信息更新
- LP下所有库存的库位同步更新

---

### 4.3 批量创建LP

用例编号：E2E-LP-003
用例名称：批量创建LP
前置条件：
- 用户已登录
- 有创建LP权限

测试步骤：
1. 导航到LP管理页面
2. 点击"批量创建"按钮
3. 选择LP类型
4. 输入创建数量（5个）
5. 选择库位
6. 点击确认
7. 验证批量创建成功

预期结果：
- 5个LP创建成功
- LP编码自动生成且连续
- 所有LP状态为OPEN

---

## 5. 调整单测试用例

### 5.1 创建调整单

用例编号：E2E-ADJ-001
用例名称：创建库存调整单
前置条件：
- 存在可调整的库存
- 用户有创建调整单权限

测试步骤：
1. 导航到调整单管理页面
2. 点击"新建调整单"
3. 选择客户
4. 输入调整原因
5. 选择调整类型（如 ADJUST_QTY）
6. 查询库存，勾选记录
7. 批量或逐条填写调整字段（Qty Adjust To）
8. 点击“Add To Adjustment Line”
9. 可切换另一类型继续添加明细（例如 ADJUST_STATUS）
10. 点击保存
11. 验证创建成功

预期结果：
- 调整单创建成功
- 状态为 NEW
- 调整行信息正确（支持多类型明细）

---

### 5.2 审批调整单

用例编号：E2E-ADJ-002
用例名称：审批调整单
前置条件：
- 存在待审批的调整单
- 用户有审批权限

测试步骤：
1. 导航到调整单管理页面
2. 找到待审批的调整单
3. 点击"审批"按钮
4. 确认审批
5. 验证审批成功

预期结果：
- 调整单状态变为 APPROVED
- 库存数量按调整行更新
- 调整历史记录生成
- 库存日志记录变更

---

### 5.3 批量审批

用例编号：E2E-ADJ-003
用例名称：批量审批调整单
前置条件：
- 存在多个待审批的调整单

测试步骤：
1. 导航到调整单管理页面
2. 勾选多个待审批调整单
3. 点击"批量审批"按钮
4. 确认操作
5. 验证批量审批成功

预期结果：
- 所有选中的调整单状态变为 APPROVED
- 对应库存数量更新
- 调整历史记录生成

---

## 6. 库存锁定测试用例

### 6.1 创建库存锁定

用例编号：E2E-LOCK-001
用例名称：按订单锁定库存
前置条件：
- 存在可用库存
- 订单信息已准备

测试步骤：
1. 调用库存锁定API
2. 传入订单ID和商品信息
3. 验证锁定成功
4. 查询库存锁定记录
5. 验证可用库存减少

预期结果：
- 库存锁定记录创建成功
- 锁定状态为 ACTIVE
- 可用库存 = 总库存 - 锁定数量

---

### 6.2 释放库存锁定

用例编号：E2E-LOCK-002
用例名称：释放库存锁定
前置条件：
- 存在活跃的库存锁定记录

测试步骤：
1. 导航到库存锁定页面
2. 找到要释放的锁定记录
3. 点击"释放"按钮
4. 确认操作
5. 验证释放成功

预期结果：
- 锁定状态变为 INACTIVE
- 可用库存恢复

---

## 7. 综合场景测试

### 7.1 完整库存流转

用例编号：E2E-FLOW-001
用例名称：库存完整生命周期
前置条件：
- 系统初始化完成

测试步骤：
1. 创建LP
2. 创建库存（入库）
3. 移动库存到新LP
4. 创建调整单调整数量
5. 审批调整单
6. 验证库存最终状态

预期结果：
- 每个步骤执行成功
- 库存数量和位置正确
- 所有日志记录完整

---

## 8. 表间关系触发测试

### 8.1 库存创建触发日志和活动

用例编号：E2E-TRIGGER-001
用例名称：库存创建自动触发日志和活动记录
前置条件：
- LP已创建
- 用户有创建权限

测试步骤：
1. 调用创建库存API
2. 验证库存创建成功
3. 查询 event_inventory_log 表
4. 验证日志记录存在且 actionType=INSERT
5. 查询 event_inventory_activity 表
6. 验证活动记录存在

预期结果：
- doc_inventory 创建成功
- event_inventory_log 自动创建，包含完整快照
- event_inventory_activity 自动创建，activityType 正确

---

### 8.2 库存移动触发多表更新

用例编号：E2E-TRIGGER-002
用例名称：库存移动触发源库存扣减、目标库存创建、日志和活动
前置条件：
- 源库存存在，数量100
- 目标LP存在

测试步骤：
1. 调用库存移动API，移动数量30
2. 验证源库存数量变为70
3. 验证目标LP下创建新库存，数量30
4. 查询 event_inventory_log
5. 验证有两条日志：源库存UPDATE、目标库存INSERT
6. 查询 event_inventory_activity
7. 验证活动记录包含 fromLpId、toLpId、fromLocationId、toLocationId

预期结果：
- 源库存 qty 从100减为70
- 目标库存创建，qty=30
- event_inventory_log 有2条记录
- event_inventory_activity 有1条记录，流转信息完整

---

### 8.3 调整单审批触发库存变更和历史记录

用例编号：E2E-TRIGGER-003
用例名称：调整单审批触发库存创建和调整历史
前置条件：
- 调整单已创建，状态NEW
- 调整类型为 ADD_INVENTORY

测试步骤：
1. 调用调整单审批API
2. 验证调整单状态变为 APPROVED
3. 查询 doc_inventory
4. 验证新库存记录创建
5. 查询 doc_adjustment_history
6. 验证历史记录创建

预期结果：
- doc_adjustment.status = APPROVED
- doc_inventory 新增记录
- doc_adjustment_history 创建，包含审批信息
- event_inventory_log 记录库存创建

---

### 8.4 调整单审批（数量减少）触发库存状态变更

用例编号：E2E-TRIGGER-004
用例名称：ADJUST_QTY减少触发库存移动到ADJUSTOUT
前置条件：
- 库存存在，数量100
- 调整单已创建，调整类型ADJUST_QTY，adjustQty=-30

测试步骤：
1. 调用调整单审批API
2. 验证原库存数量变为70
3. 验证创建新库存记录，status=ADJUSTOUT，qty=30
4. 查询 event_inventory_activity
5. 验证活动类型为 ADJUST

预期结果：
- 原库存 qty 从100减为70
- 新库存 status=ADJUSTOUT, qty=30
- event_inventory_activity.activityType = ADJUST

---

### 8.5 LP删除触发调整单创建

用例编号：E2E-TRIGGER-005
用例名称：删除有库存的LP触发调整单
前置条件：
- LP存在，内有库存数量50

测试步骤：
1. 调用删除LP API
2. 验证LP状态变为 ON_HOLD
3. 查询 doc_adjustment
4. 验证自动创建调整单
5. 验证调整单状态为 APPROVED（自动审批）
6. 验证库存数量变为0或状态变为ADJUSTOUT

预期结果：
- doc_lp.status = ON_HOLD
- doc_adjustment 自动创建并审批
- 库存被清零或移动到ADJUSTOUT

---

### 8.6 LP移动触发库存位置同步

用例编号：E2E-TRIGGER-006
用例名称：LP整体移动同步更新内部库存位置
前置条件：
- LP存在，locationId=LOC-A01
- LP内有3条库存记录

测试步骤：
1. 调用LP移动API，目标位置LOC-B02
2. 验证LP的locationId更新为LOC-B02
3. 查询LP内所有库存
4. 验证所有库存的locationId都更新为LOC-B02

预期结果：
- doc_lp.locationId = LOC-B02
- 所有 doc_inventory.locationId = LOC-B02（3条记录）

---

## 9. 导入导出测试

### 9.1 库存导入完整流程

用例编号：E2E-IMPORT-001
用例名称：库存批量导入
前置条件：
- 准备CSV文件，包含5条库存记录
- LP和库位已存在

测试步骤：
1. 导航到库存导入页面
2. 下载导入模板
3. 上传CSV文件
4. 验证数据预览正确
5. 配置字段映射
6. 点击提交
7. 验证导入成功

预期结果：
- 模板下载成功
- 数据预览显示5条记录
- 字段映射正确
- 自动创建调整单并审批
- 5条库存记录创建成功

---

### 9.2 库存导出

用例编号：E2E-EXPORT-001
用例名称：库存数据导出
前置条件：
- 存在测试库存数据

测试步骤：
1. 导航到库存页面
2. 设置筛选条件
3. 点击导出CSV
4. 验证文件下载
5. 打开文件验证内容

预期结果：
- CSV文件下载成功
- 文件包含筛选后的数据
- 字段完整（包含动态属性映射后的业务名称）

---

### 9.3 库存锁定导出

用例编号：E2E-EXPORT-002
用例名称：库存锁定数据导出
前置条件：
- 存在库存锁定记录

测试步骤：
1. 导航到库存锁定页面
2. 设置筛选条件
3. 点击导出
4. 验证文件下载

预期结果：
- 导出文件包含锁定记录
- 字段完整

---

## 10. 配置管理测试

### 10.1 动态属性映射配置

用例编号：E2E-CFG-001
用例名称：动态属性映射CRUD
前置条件：
- 用户有配置权限

测试步骤：
1. 导航到动态属性映射页面
2. 点击新建映射
3. 输入：customField=生产批次, originalField=dynStr1, type=INVENTORY
4. 保存
5. 验证列表显示新记录
6. 编辑记录
7. 删除记录

预期结果：
- 创建成功
- 查询显示正确
- 编辑成功
- 删除成功

---

## 11. 差异标记和单位转换测试

### 11.1 库存差异标记

用例编号：E2E-DISC-001
用例名称：设置和释放差异标记
前置条件：
- 存在库存记录

测试步骤：
1. 选择库存记录
2. 设置差异标记为 DISCREPANCY
3. 验证标记设置成功
4. 释放差异标记
5. 验证标记释放

预期结果：
- 差异标记设置成功
- 释放时联动释放 WARNING 标记

---

### 11.2 库存单位转换

用例编号：E2E-UOM-001
用例名称：库存计量单位转换
前置条件：
- 存在库存，uomId=EA，qty=100

测试步骤：
1. 选择库存记录
2. 执行单位转换，目标单位CS（1CS=10EA）
3. 验证转换结果

预期结果：
- 转换后 qty=10, uomId=CS
- baseQty 保持不变

---

## 8. Playwright 测试脚本示例

```javascript
// E2E-INV-001: Inventory list query test
async function testInventoryListQuery(page) {
  // Navigate to inventory page
  await page.goto('/inventory');
  
  // Wait for list to load
  await page.waitForSelector('.inventory-table');
  
  // Verify list is displayed
  const rows = await page.$$('.inventory-row');
  expect(rows.length).toBeGreaterThan(0);
  
  // Search by item ID
  await page.fill('#search-item-id', 'ITEM-001');
  await page.click('#search-button');
  
  // Verify search results
  await page.waitForSelector('.inventory-row');
  const searchResults = await page.$$('.inventory-row');
  expect(searchResults.length).toBeGreaterThan(0);
  
  // Test pagination
  await page.click('.pagination-next');
  await page.waitForSelector('.inventory-row');
}
```

---

## 参考文档

- .kiro/specs/inventory-domain/06-design.md（技术设计）
- .kiro/specs/inventory-domain/03-requirements.md（需求规格）
