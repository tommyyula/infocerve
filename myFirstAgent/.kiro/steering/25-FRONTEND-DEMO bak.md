---
inclusion: manual
---

# 前端原型 Demo 规范（Frontend Demo Guidelines）

## 概述

本规范定义了在设计阶段创建前端原型 Demo 的标准，帮助：
1. 验证业务流程是否合理
2. 与业务方确认 UI 交互
3. 为技术设计提供参考

---

## 文件位置

支持两种组织方式，根据功能复杂度选择：

### 方式一：单文件（简单功能）

```
.kiro/specs/{feature-name}/demo/
  index.html          # PC端 Demo（单文件）
  mobile.html         # 手持端 Demo（可选）
```

### 方式二：多文件（复杂功能）

按模块或业务划分，适用于涉及多个聚合、多页面的复杂功能：

```
.kiro/specs/{feature-name}/demo/
  index.html              # 主入口/首页
  {module1}.html          # 模块1页面
  {module2}.html          # 模块2页面
  mobile/                 # 手持端目录（可选）
    index.html
    task.html
  assets/                 # 静态资源（可选）
    styles.css            # 公共样式
    scripts.js            # 公共脚本
```

选择建议：
- 单聚合、3 个以内页面：使用单文件
- 多聚合、多页面、多端：使用多文件
- 单文件超过 800 行：考虑拆分

---

## 创建时机

Demo 应在领域建模完成后、技术设计之前创建：

```
domain-model.md -> [创建 Demo] -> design.md
```

---

## 前置依赖文档

创建 Demo 前必须参考以下已完成的文档：

1. 01-story.md（用户故事）
   - 参考内容：用户角色、业务场景、验收标准
   - 用途：理解用户需求和业务目标

2. 02-domain-analysis.md（领域分析）
   - 参考内容：统一语言、业务流程图、业务规则
   - 用途：理解业务术语和流程逻辑

3. 03-requirements.md（需求规格）
   - 参考内容：功能需求列表、验收标准
   - 用途：确保 Demo 覆盖所有功能点

4. 04-domain-model.md（领域建模）
   - 参考内容：聚合根、实体、值对象、状态机
   - 用途：确保 UI 结构与领域模型一致

[重要] Demo 必须基于以上文档设计，不能凭空想象界面和流程。

---

## 如何完整模拟 01-04 阶段约束

### 模拟阶段 1：用户故事（01-story.md）

#### 需要模拟的内容

1. 用户角色体现
   - Demo 应该体现不同用户角色的视角
   - 不同角色看到不同的功能入口和操作按钮

2. 业务场景覆盖
   - 每个用户故事对应一个完整的操作流程
   - Demo 能够演示从开始到结束的完整场景

3. 验收标准验证
   - 验收标准中的每个条件都能在 Demo 中体现
   - 通过 UI 交互可以验证验收标准是否满足

#### 模拟示例

假设用户故事：
```
作为仓库管理员
我想要创建收货单
以便于安排收货任务

验收标准：
1. 可以选择收货类型（ASN、退货、调拨）
2. 可以输入来源单据信息
3. 可以添加收货明细
4. 保存后生成唯一的收货单号
5. 收货单状态为"草稿"
```

Demo 实现：
```javascript
// 1. 角色体现 - 侧边栏显示角色相关功能
<div class="sidebar">
    <div class="user-info">
        <span>仓库管理员</span>
    </div>
    <div class="nav">
        <button>收货管理</button>
        <button>任务管理</button>
    </div>
</div>

// 2. 场景覆盖 - 创建收货单流程
function createReceiptFlow() {
    // 打开创建表单
    showModal('modal-create-receipt');
}

// 3. 验收标准验证 - 表单包含所有必需字段
<div class="modal" id="modal-create-receipt">
    <div class="modal-content">
        <h4>创建收货单</h4>
        
        <!-- 验收标准 1: 选择收货类型 -->
        <div class="form-row">
            <label>收货类型 *</label>
            <select id="receiptType">
                <option value="ASN">ASN收货</option>
                <option value="RETURN">退货收货</option>
                <option value="TRANSFER">调拨收货</option>
            </select>
        </div>
        
        <!-- 验收标准 2: 来源单据信息 -->
        <div class="form-row">
            <label>来源单据号</label>
            <input type="text" id="sourceDocumentNo" placeholder="请输入来源单据号" />
        </div>
        
        <!-- 验收标准 3: 添加收货明细 -->
        <div class="form-row">
            <label>收货明细</label>
            <button class="btn btn-sm" onclick="addReceiptLine()">添加明细</button>
            <table id="lines-table">
                <tr><th>物料</th><th>计划数量</th><th>操作</th></tr>
            </table>
        </div>
        
        <div class="form-actions">
            <button class="btn" onclick="saveReceipt()">保存</button>
        </div>
    </div>
</div>

// 验收标准 4 & 5: 保存后生成单号和状态
function saveReceipt() {
    const receiptType = document.getElementById('receiptType').value;
    const sourceDocumentNo = document.getElementById('sourceDocumentNo').value;
    
    // 生成收货单号（验收标准 4）
    const receiptNo = 'RCV' + new Date().toISOString().slice(0,10).replace(/-/g,'') 
                      + String(mockReceipts.length + 1).padStart(6, '0');
    
    const newReceipt = {
        id: 'rcv-' + Date.now(),
        receiptNo: receiptNo,
        receiptType: receiptType,
        sourceDocumentNo: sourceDocumentNo,
        status: 'DRAFT',  // 验收标准 5：状态为草稿
        lines: [],
        createdAt: new Date().toISOString()
    };
    
    mockReceipts.push(newReceipt);
    hideModal('modal-create-receipt');
    renderReceiptList();
    
    // 显示成功消息，体现验收标准
    alert(`收货单创建成功！\n单号：${receiptNo}\n状态：草稿`);
}
```

---

### 模拟阶段 2：领域分析（02-domain-analysis.md）

#### 需要模拟的内容

1. 统一语言使用
   - UI 上的所有术语必须使用统一语言表中定义的术语
   - 字段标签、按钮文字、提示信息都使用统一术语

2. 业务流程体现
   - Demo 的页面流转应该符合业务流程图
   - 操作顺序与业务流程一致

3. 业务规则校验
   - 在 UI 交互中体现业务规则的约束
   - 违反业务规则时给出提示

#### 模拟示例

假设领域分析定义：
```
统一语言：
- Receipt（收货单）
- ReceiptLine（收货明细）
- ReceivingTask（收货任务）
- Warehouse（仓库）

业务流程：
1. 创建收货单（草稿状态）
2. 添加收货明细
3. 确认收货单（生成任务）
4. 分配任务给收货员
5. 执行任务
6. 完成收货单

业务规则：
- BR-001：收货单必须至少有一条明细才能确认
- BR-002：收货单确认后不能修改明细
- BR-003：所有任务完成后才能完成收货单
```

Demo 实现：
```javascript
// 1. 统一语言使用 - 所有标签使用统一术语
<div class="page-header">
    <h3>收货单管理</h3>  <!-- 使用"收货单"而非"入库单" -->
</div>

<table>
    <tr>
        <th>收货单号</th>
        <th>收货类型</th>
        <th>仓库</th>
        <th>状态</th>
        <th>操作</th>
    </tr>
</table>

// 2. 业务流程体现 - 状态驱动的操作按钮
function renderReceiptActions(receipt) {
    let actions = '';
    
    // 根据业务流程，不同状态显示不同操作
    switch(receipt.status) {
        case 'DRAFT':
            // 草稿状态：可以添加明细、确认
            actions = `
                <button class="btn btn-sm" onclick="editReceipt('${receipt.id}')">编辑明细</button>
                <button class="btn btn-sm" onclick="confirmReceipt('${receipt.id}')">确认</button>
            `;
            break;
        case 'CONFIRMED':
            // 已确认：可以分配任务、查看任务
            actions = `
                <button class="btn btn-sm" onclick="viewTasks('${receipt.id}')">查看任务</button>
                <button class="btn btn-sm" onclick="assignTasks('${receipt.id}')">分配任务</button>
            `;
            break;
        case 'EXECUTING':
            // 执行中：可以查看进度
            actions = `
                <button class="btn btn-sm" onclick="viewProgress('${receipt.id}')">查看进度</button>
            `;
            break;
        case 'COMPLETED':
            // 已完成：只能查看
            actions = `
                <button class="btn btn-sm" onclick="viewReceipt('${receipt.id}')">查看详情</button>
            `;
            break;
    }
    
    return actions;
}

// 3. 业务规则校验 - BR-001：至少一条明细才能确认
function confirmReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    
    if (!receipt) {
        alert('收货单不存在');
        return;
    }
    
    // 业务规则 BR-001 校验
    if (!receipt.lines || receipt.lines.length === 0) {
        alert('业务规则校验失败：收货单必须至少有一条明细才能确认（BR-001）');
        return;
    }
    
    // 业务规则 BR-002：确认后状态变更
    receipt.status = 'CONFIRMED';
    
    // 生成收货任务（业务流程第3步）
    generateReceivingTasks(receipt);
    
    renderReceiptList();
    alert('收货单已确认，已生成收货任务');
}

// 业务规则 BR-002：确认后不能修改明细
function editReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    
    if (receipt.status !== 'DRAFT') {
        alert('业务规则校验失败：收货单确认后不能修改明细（BR-002）');
        return;
    }
    
    // 打开编辑表单
    showEditModal(receipt);
}

// 业务规则 BR-003：所有任务完成后才能完成收货单
function completeReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    const tasks = mockTasks.filter(t => t.receiptId === receiptId);
    
    // 检查是否所有任务都已完成
    const allTasksCompleted = tasks.every(t => t.status === 'COMPLETED');
    
    if (!allTasksCompleted) {
        alert('业务规则校验失败：所有任务完成后才能完成收货单（BR-003）');
        return;
    }
    
    receipt.status = 'COMPLETED';
    renderReceiptList();
    alert('收货单已完成');
}
```

---

### 模拟阶段 3：需求规格（03-requirements.md）

#### 需要模拟的内容

1. 功能需求覆盖
   - Demo 必须包含所有功能需求的入口
   - 每个功能需求都能通过 Demo 演示

2. 验收标准体现
   - EARS 模式的验收标准在 UI 中体现
   - 正常流程和异常流程都能演示

3. 非功能需求提示
   - 在 Demo 中用注释或提示说明非功能需求
   - 如性能要求、安全要求等

#### 模拟示例

假设需求规格定义：
```
功能需求 FR-001：收货单查询
- 当用户在收货单列表页时
- 系统应该提供按单号、状态、日期范围查询的功能
- 查询结果应该分页显示

验收标准（EARS）：
- WHEN 用户输入收货单号并点击查询
  THEN 系统应该显示匹配的收货单
- WHEN 用户选择状态筛选
  THEN 系统应该只显示该状态的收货单
- IF 查询结果超过20条
  THEN 系统应该分页显示，每页20条

非功能需求：
- 查询响应时间应小于2秒
- 支持模糊查询
```

Demo 实现：
```javascript
// 1. 功能需求覆盖 - FR-001：收货单查询
<div class="search-bar">
    <div class="search-row">
        <!-- 验收标准：按单号查询 -->
        <input type="text" id="searchReceiptNo" placeholder="收货单号" />
        
        <!-- 验收标准：按状态筛选 -->
        <select id="searchStatus">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="CONFIRMED">已确认</option>
            <option value="EXECUTING">执行中</option>
            <option value="COMPLETED">已完成</option>
        </select>
        
        <!-- 验收标准：按日期范围查询 -->
        <input type="date" id="searchDateFrom" />
        <span>至</span>
        <input type="date" id="searchDateTo" />
        
        <button class="btn" onclick="searchReceipts()">查询</button>
        <button class="btn btn-default" onclick="resetSearch()">重置</button>
    </div>
</div>

// 2. 验收标准体现 - 查询逻辑
function searchReceipts() {
    const receiptNo = document.getElementById('searchReceiptNo').value;
    const status = document.getElementById('searchStatus').value;
    const dateFrom = document.getElementById('searchDateFrom').value;
    const dateTo = document.getElementById('searchDateTo').value;
    
    // 模拟查询逻辑
    let results = mockReceipts;
    
    // WHEN 用户输入收货单号
    if (receiptNo) {
        results = results.filter(r => r.receiptNo.includes(receiptNo));
    }
    
    // WHEN 用户选择状态筛选
    if (status) {
        results = results.filter(r => r.status === status);
    }
    
    // 日期范围筛选
    if (dateFrom) {
        results = results.filter(r => r.createdAt >= dateFrom);
    }
    if (dateTo) {
        results = results.filter(r => r.createdAt <= dateTo);
    }
    
    // IF 查询结果超过20条 THEN 分页显示
    const pageSize = 20;
    const totalPages = Math.ceil(results.length / pageSize);
    
    if (results.length > pageSize) {
        // 显示分页控件
        renderPagination(totalPages);
        // 只显示第一页
        results = results.slice(0, pageSize);
    }
    
    // 渲染查询结果
    renderReceiptList(results);
    
    // 3. 非功能需求提示
    console.log(`[性能要求] 查询耗时：${Math.random() * 2}秒（应小于2秒）`);
    console.log(`[功能说明] 支持模糊查询：收货单号部分匹配`);
}

// 分页控件
function renderPagination(totalPages) {
    const paginationHtml = `
        <div class="pagination">
            <button onclick="goToPage(1)">首页</button>
            <button onclick="goToPage(currentPage - 1)">上一页</button>
            <span>第 <span id="currentPage">1</span> / ${totalPages} 页</span>
            <button onclick="goToPage(currentPage + 1)">下一页</button>
            <button onclick="goToPage(${totalPages})">末页</button>
        </div>
    `;
    document.getElementById('pagination-container').innerHTML = paginationHtml;
}
```

---

### 模拟阶段 4：领域建模（04-domain-model.md）

#### 需要模拟的内容

1. 聚合根对应页面
   - 每个聚合根对应一个管理页面
   - 页面结构反映聚合边界

2. 实体和值对象映射
   - 表单字段映射聚合根的属性
   - 值对象展示为组合字段

3. 状态机体现
   - UI 根据状态显示不同操作
   - 状态流转符合状态机定义

4. 领域事件提示
   - 在操作完成后提示触发的领域事件
   - 帮助理解系统行为

#### 模拟示例

假设领域建模定义：
```
聚合根：Receipt
- 属性：
  - id: ReceiptId（值对象）
  - receiptNo: ReceiptNo（值对象）
  - receiptType: ReceiptType（枚举）
  - status: ReceiptStatus（枚举）
  - warehouse: WarehouseId（值对象，引用）
  - lines: List<ReceiptLine>（实体集合）

实体：ReceiptLine
- 属性：
  - id: ReceiptLineId
  - lineNo: int
  - item: ItemId（值对象，引用）
  - plannedQuantity: Quantity（值对象）
  - receivedQuantity: Quantity（值对象）

值对象：Quantity
- 属性：
  - value: BigDecimal
  - unit: String

状态机：ReceiptStatus
- DRAFT -> CONFIRMED -> EXECUTING -> COMPLETED
- DRAFT -> CANCELLED

领域事件：
- ReceiptCreatedEvent：收货单创建时触发
- ReceiptConfirmedEvent：收货单确认时触发
- ReceiptCompletedEvent：收货单完成时触发
```

Demo 实现：
```javascript
// 1. 聚合根对应页面 - Receipt 聚合根对应收货单管理页面
<div class="page" id="page-receipt">
    <div class="page-header">
        <h3>收货单管理</h3>
        <button class="btn" onclick="createReceipt()">新建收货单</button>
    </div>
    
    <!-- 收货单列表 -->
    <table id="receipt-table">
        <tr>
            <th>收货单号</th>
            <th>收货类型</th>
            <th>仓库</th>
            <th>状态</th>
            <th>明细数量</th>
            <th>操作</th>
        </tr>
    </table>
</div>

// 2. 实体和值对象映射 - 创建表单映射聚合根属性
<div class="modal" id="modal-create-receipt">
    <div class="modal-content">
        <h4>创建收货单</h4>
        
        <!-- 值对象：ReceiptType（枚举） -->
        <div class="form-row">
            <label>收货类型 *</label>
            <select id="receiptType">
                <option value="ASN">ASN收货</option>
                <option value="RETURN">退货收货</option>
                <option value="TRANSFER">调拨收货</option>
            </select>
        </div>
        
        <!-- 值对象：WarehouseId（引用） -->
        <div class="form-row">
            <label>仓库 *</label>
            <select id="warehouseId">
                <option value="wh-001">主仓库</option>
                <option value="wh-002">分仓库</option>
            </select>
        </div>
        
        <!-- 实体集合：ReceiptLine -->
        <div class="form-row">
            <label>收货明细</label>
            <button class="btn btn-sm" onclick="addLine()">添加明细</button>
            <table id="lines-table">
                <tr>
                    <th>行号</th>
                    <th>物料</th>
                    <th>计划数量</th>
                    <th>单位</th>
                    <th>操作</th>
                </tr>
            </table>
        </div>
    </div>
</div>

// 添加明细 - 实体 ReceiptLine
function addLine() {
    const lineNo = document.querySelectorAll('#lines-table tr').length;
    const row = `
        <tr>
            <td>${lineNo}</td>
            <td>
                <select class="line-item">
                    <option value="item-001">物料A</option>
                    <option value="item-002">物料B</option>
                </select>
            </td>
            <td>
                <!-- 值对象：Quantity -->
                <input type="number" class="line-quantity" placeholder="数量" />
            </td>
            <td>
                <select class="line-unit">
                    <option value="EA">个</option>
                    <option value="BOX">箱</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm" onclick="removeLine(this)">删除</button>
            </td>
        </tr>
    `;
    document.querySelector('#lines-table').innerHTML += row;
}

// 3. 状态机体现 - 根据状态显示操作
function renderReceiptRow(receipt) {
    const statusInfo = getStatusInfo(receipt.status);
    
    // 根据状态机定义，显示可用操作
    let actions = '';
    switch(receipt.status) {
        case 'DRAFT':
            // DRAFT 可以 -> CONFIRMED 或 CANCELLED
            actions = `
                <button class="btn btn-sm" onclick="confirmReceipt('${receipt.id}')">确认</button>
                <button class="btn btn-sm btn-danger" onclick="cancelReceipt('${receipt.id}')">取消</button>
            `;
            break;
        case 'CONFIRMED':
            // CONFIRMED 可以 -> EXECUTING
            actions = `
                <button class="btn btn-sm" onclick="startExecution('${receipt.id}')">开始执行</button>
            `;
            break;
        case 'EXECUTING':
            // EXECUTING 可以 -> COMPLETED
            actions = `
                <button class="btn btn-sm" onclick="completeReceipt('${receipt.id}')">完成</button>
            `;
            break;
        case 'COMPLETED':
        case 'CANCELLED':
            // 终态，只能查看
            actions = `
                <button class="btn btn-sm" onclick="viewReceipt('${receipt.id}')">查看</button>
            `;
            break;
    }
    
    return `
        <tr>
            <td>${receipt.receiptNo}</td>
            <td>${receipt.receiptType}</td>
            <td>${receipt.warehouseName}</td>
            <td><span class="tag tag-${statusInfo.color}">${statusInfo.label}</span></td>
            <td>${receipt.lines.length}</td>
            <td>${actions}</td>
        </tr>
    `;
}

// 4. 领域事件提示 - 操作完成后提示触发的事件
function confirmReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    
    // 业务规则校验
    if (receipt.lines.length === 0) {
        alert('收货单必须至少有一条明细');
        return;
    }
    
    // 状态变更
    receipt.status = 'CONFIRMED';
    
    // 生成任务
    generateReceivingTasks(receipt);
    
    // 领域事件提示
    console.log(`[领域事件] ReceiptConfirmedEvent 已触发`);
    console.log(`  - 聚合根ID: ${receipt.id}`);
    console.log(`  - 收货单号: ${receipt.receiptNo}`);
    console.log(`  - 触发时间: ${new Date().toISOString()}`);
    console.log(`  - 后续动作: 已生成 ${receipt.lines.length} 个收货任务`);
    
    renderReceiptList();
    alert(`收货单已确认\n\n[领域事件] ReceiptConfirmedEvent\n已生成收货任务`);
}

function completeReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    
    receipt.status = 'COMPLETED';
    
    // 领域事件提示
    console.log(`[领域事件] ReceiptCompletedEvent 已触发`);
    console.log(`  - 聚合根ID: ${receipt.id}`);
    console.log(`  - 收货单号: ${receipt.receiptNo}`);
    console.log(`  - 触发时间: ${new Date().toISOString()}`);
    console.log(`  - 后续动作: 更新库存、通知上游系统`);
    
    renderReceiptList();
    alert(`收货单已完成\n\n[领域事件] ReceiptCompletedEvent\n将更新库存并通知上游系统`);
}
```

---

## Demo 代码实现逻辑

### 核心原则

Demo 是用于验证业务流程和 UI 交互的原型，不是真实的前端实现：

1. 数据模拟 - 使用硬编码的模拟数据，不调用真实 API
2. 状态模拟 - 使用 JavaScript 变量模拟状态变化
3. 交互模拟 - 实现页面切换、模态框、表单提交等基础交互
4. 流程演示 - 能够演示完整的业务流程

### 数据模拟规范

```javascript
// 模拟数据结构应与领域模型一致
const mockReceipts = [
    {
        id: 'rcv-001',
        receiptNo: 'RCV20241231000001',
        receiptType: 'ASN',
        status: 'DRAFT',
        warehouseId: 'wh-001',
        warehouseName: '主仓库',
        lines: [
            {
                id: 'line-001',
                lineNo: 1,
                itemId: 'item-001',
                itemCode: 'MAT001',
                itemName: '物料A',
                plannedQuantity: 100,
                receivedQuantity: 0
            }
        ],
        createdAt: '2024-12-31 10:00:00',
        createdBy: 'user-001'
    }
];

// 状态枚举应与领域模型一致
const ReceiptStatus = {
    DRAFT: { label: '草稿', color: 'gray' },
    CONFIRMED: { label: '已确认', color: 'blue' },
    EXECUTING: { label: '执行中', color: 'orange' },
    COMPLETED: { label: '已完成', color: 'green' },
    CANCELLED: { label: '已取消', color: 'red' }
};
```

### 状态变更模拟

```javascript
// 模拟业务操作，更新模拟数据的状态
function confirmReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    if (receipt && receipt.status === 'DRAFT') {
        receipt.status = 'CONFIRMED';
        // 刷新页面显示
        renderReceiptList();
        alert('收货单已确认');
    }
}

// 模拟表单提交
function createReceipt(formData) {
    const newReceipt = {
        id: 'rcv-' + Date.now(),
        receiptNo: 'RCV' + new Date().toISOString().slice(0,10).replace(/-/g,'') + String(mockReceipts.length + 1).padStart(6, '0'),
        ...formData,
        status: 'DRAFT',
        lines: [],
        createdAt: new Date().toISOString(),
        createdBy: 'current-user'
    };
    mockReceipts.push(newReceipt);
    renderReceiptList();
    hideModal('modal-create');
}
```

### 页面渲染逻辑

```javascript
// 根据模拟数据渲染列表
function renderReceiptList() {
    const tbody = document.querySelector('#receipt-table tbody');
    tbody.innerHTML = '';
    
    mockReceipts.forEach(receipt => {
        const statusInfo = ReceiptStatus[receipt.status];
        const row = `
            <tr>
                <td>${receipt.receiptNo}</td>
                <td>${receipt.warehouseName}</td>
                <td><span class="tag tag-${statusInfo.color}">${statusInfo.label}</span></td>
                <td>${receipt.createdAt}</td>
                <td>
                    <button class="btn btn-sm" onclick="viewReceipt('${receipt.id}')">详情</button>
                    ${receipt.status === 'DRAFT' ? `<button class="btn btn-sm" onclick="confirmReceipt('${receipt.id}')">确认</button>` : ''}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 页面加载时初始化
window.onload = function() {
    renderReceiptList();
};
```

### 业务流程模拟

```javascript
// 模拟完整的业务流程
// 示例：收货流程

// 1. 创建收货单
function createReceiptFlow() {
    showModal('modal-create');
}

// 2. 确认收货单
function confirmReceiptFlow(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    if (!receipt) return;
    
    // 模拟业务规则校验
    if (receipt.lines.length === 0) {
        alert('请先添加收货明细');
        return;
    }
    
    // 更新状态
    receipt.status = 'CONFIRMED';
    
    // 模拟生成任务
    generateReceivingTasks(receipt);
    
    renderReceiptList();
    alert('收货单已确认，已生成收货任务');
}

// 3. 执行任务（手持端）
function executeTaskFlow(taskId) {
    // 模拟扫码
    const scannedCode = prompt('请扫描物料条码：');
    if (!scannedCode) return;
    
    // 模拟数据采集
    const quantity = prompt('请输入数量：');
    const location = prompt('请输入库位：');
    
    // 更新任务状态
    const task = mockTasks.find(t => t.id === taskId);
    task.executedQuantity += parseFloat(quantity);
    task.executions.push({
        quantity: quantity,
        location: location,
        executedAt: new Date().toISOString()
    });
    
    if (task.executedQuantity >= task.plannedQuantity) {
        task.status = 'COMPLETED';
    }
    
    renderTaskList();
    alert('执行成功');
}
```

### 不需要实现的功能

Demo 是原型，以下功能不需要实现：

1. 真实 API 调用 - 使用模拟数据即可
2. 数据持久化 - 刷新页面数据重置即可
3. 用户认证 - 不需要真实登录
4. 权限控制 - 不需要真实权限判断
5. 表单校验 - 基础校验即可，不需要完整校验
6. 错误处理 - 简单 alert 提示即可
7. 分页功能 - 显示全部数据即可
8. 搜索过滤 - 可选实现，不强制
9. 响应式布局 - PC 端固定宽度即可
10. 浏览器兼容 - 只需支持 Chrome 即可

---

## 领域模型一致性要求（重要）

Demo 必须准确反映 domain-model.md 中的领域设计：

### 实体与聚合对齐

1. 页面结构对应聚合根
   - 每个聚合根对应一个管理页面
   - 页面名称使用领域模型中的实体名称
   - 列表/详情/表单围绕聚合根设计

2. 字段完整映射
   - 表单字段必须覆盖聚合根的所有业务属性
   - 字段名称与领域模型保持一致（可加中文标签）
   - 值对象展示为组合字段或嵌套结构

3. 状态与枚举对齐
   - 状态标签使用领域模型定义的枚举值
   - 下拉选项与枚举定义一致
   - 状态流转按领域模型的业务行为设计

### 关联关系体现

1. 聚合间引用
   - 通过 ID 关联的聚合，在 UI 上体现为选择器或链接
   - 不直接嵌套展示其他聚合的完整信息
   - 关联字段显示编码/名称，点击可跳转

2. 聚合内实体
   - 聚合内的实体作为子表或嵌套列表展示
   - 在聚合根的详情页或编辑页内管理
   - 不单独提供管理入口

### 业务行为对齐

1. 操作按钮使用用户友好的中文标签
   - 禁止直接使用领域模型方法名（如 cancel()、release()）
   - 使用中文标签：enable() -> "启用"，cancel() -> "取消"
   - 带参数的操作提供输入框：cancel(reason) -> "取消" + 原因输入

2. 状态驱动的按钮可见性
   - 根据当前状态决定哪些操作可用
   - 与领域模型的状态机设计一致

---

## 技术栈约束

统一技术栈：
- 框架：原生 JavaScript（不使用 Vue/React）
- 样式：内联 CSS 或独立 CSS 文件，使用基础 CSS 变量
- 脚本：内联 JavaScript 或独立 JS 文件
- 无构建：直接浏览器打开即可运行

禁止使用：
- Vue、React、Angular 等框架
- 外部 CSS 框架（Bootstrap、Tailwind）
- 构建工具（Webpack、Vite）
- npm 依赖

---

## PC 端页面风格

### 整体布局

```
+------------------+------------------------------------------------+
|   系统名称        |                                                |
|   - 固定侧边栏    |              内容区域                           |
|   - 白色背景      |   - 浅灰背景 #f5f5f5                           |
|   - 简洁导航      |   - 白色卡片                                   |
|                  |   - 表格布局                                   |
+------------------+------------------------------------------------+
```

### CSS 变量定义

```css
:root {
    --primary-color: #1890ff;
    --success-color: #52c41a;
    --warning-color: #fa8c16;
    --error-color: #ff4d4f;
    --text-color: #333;
    --border-color: #d9d9d9;
    --background-color: #f5f5f5;
}
```

### 侧边栏规范

- 宽度：220px（固定，不可折叠）
- 背景：白色 #fff
- 边框：右侧 1px 边框
- Logo 区域：顶部，系统名称
- 菜单项：简洁按钮样式，hover 蓝色背景
- 当前选中：蓝色背景 + 白色文字

### 主内容区域

- 背景：浅灰色 #f5f5f5
- 内边距：24px
- 卡片：白色背景，圆角 8px，阴影效果

### 组件样式

按钮：
```css
.btn {
    padding: 6px 16px;
    border: none;
    border-radius: 4px;
    background: var(--primary-color);
    color: #fff;
    cursor: pointer;
    font-size: 14px;
}
.btn:hover { background: #40a9ff; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
```

状态标签：
```css
.tag {
    display: inline-block;
    margin-right: 6px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
}
.tag-blue { background: var(--primary-color); }
.tag-green { background: var(--success-color); }
.tag-orange { background: var(--warning-color); }
.tag-red { background: var(--error-color); }
.tag-gray { background: #999; }
```

模态框：
```css
.modal {
    display: none;
    position: fixed;
    z-index: 100;
    left: 0; top: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3);
    justify-content: center;
    align-items: flex-start;
    padding-top: 50px;
}
.modal.show { display: flex; }
.modal-content {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
}
```

表单：
```css
.form-row { margin-bottom: 16px; }
.form-row label {
    display: block;
    margin-bottom: 6px;
    color: #333;
    font-size: 14px;
}
.form-row input, .form-row select, .form-row textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
}
```

Tab 标签页：
```css
.tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 20px;
}
.tabs button {
    background: none;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color);
    border-bottom: 2px solid transparent;
}
.tabs button.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}
```

---

## JavaScript 功能规范

```javascript
// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('page-' + pageId).classList.remove('hidden');
    document.querySelectorAll('.nav button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('nav-' + pageId).classList.add('active');
}

// 模态框控制
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Tab 切换
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}
```

---

## 页面结构模板

### 基础 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统名称 - 前端原型 Demo</title>
    <style>/* CSS 样式 */</style>
</head>
<body>
<div class="sidebar">
    <h2>系统名称</h2>
    <div class="nav">
        <button onclick="showPage('module1')" id="nav-module1" class="active">模块1</button>
        <button onclick="showPage('module2')" id="nav-module2">模块2</button>
    </div>
</div>
<div class="main">
    <!-- 页面内容 -->
</div>
<script>/* JavaScript 功能 */</script>
</body>
</html>
```

### 列表页模板

```html
<div class="page" id="page-module">
    <div class="page-header">
        <h3>模块管理</h3>
        <button class="btn" onclick="showModal('modal-add')">新增</button>
    </div>
    <div class="search-bar">
        <input type="text" placeholder="搜索..." />
        <select><option value="">全部状态</option></select>
        <button class="btn">搜索</button>
    </div>
    <table>
        <tr><th>字段1</th><th>字段2</th><th>状态</th><th>操作</th></tr>
        <tr>
            <td>数据1</td><td>数据2</td>
            <td><span class="tag tag-green">正常</span></td>
            <td><button class="btn btn-sm">详情</button></td>
        </tr>
    </table>
</div>
```

### 模态框模板

```html
<div class="modal" id="modal-add">
    <div class="modal-content">
        <h4>新增记录</h4>
        <div class="form-row">
            <label>字段名</label>
            <input type="text" placeholder="请输入..." />
        </div>
        <div class="form-actions">
            <button class="btn btn-default" onclick="hideModal('modal-add')">取消</button>
            <button class="btn">保存</button>
        </div>
    </div>
</div>
```

---

## 手持端 Demo 规范

### 设计原则

1. 屏幕尺寸 - 模拟 375px 宽度的移动设备
2. 触摸操作 - 按钮足够大，便于点击
3. 扫描优先 - 突出扫码功能入口
4. 简洁高效 - 减少输入，快速完成任务

### 必须包含的页面

- 登录页 - 用户名、密码、仓库选择
- 首页 - 统计数据、功能入口
- 任务列表 - 待执行、执行中、已完成
- 任务详情 - 任务信息、物料信息、采集要求
- 任务执行 - 扫码、数据采集、数量输入、库位选择
- 扫码页 - 扫描区域、手动输入、历史记录
- 执行记录 - 历史执行记录查询
- 成功页 - 执行成功反馈

---

## 必须包含的元素

PC 端：
1. 固定左侧导航栏 - 白色背景，简洁菜单
2. 主内容区域 - 浅灰背景，白色卡片
3. 列表页 - 搜索栏 + 表格
4. 模态框 - 表单弹窗
5. Tab 标签页 - 多功能切换
6. 状态标签 - 彩色标签显示状态

---

## 检查清单

前置依赖（必检）：
- [ ] 已阅读 01-story.md（用户故事）
- [ ] 已阅读 02-domain-analysis.md（领域分析）
- [ ] 已阅读 03-requirements.md（需求规格）
- [ ] 已阅读 04-domain-model.md（领域建模）

领域模型一致性（必检）：
- [ ] 页面结构与聚合根一一对应
- [ ] 表单字段覆盖聚合根所有业务属性
- [ ] 枚举值与领域模型定义一致
- [ ] 操作按钮使用用户友好的中文标签（非方法名）
- [ ] 聚合间关联通过 ID 引用体现
- [ ] 状态流转符合领域模型设计

数据模拟（必检）：
- [ ] 模拟数据结构与领域模型一致
- [ ] 状态枚举与领域模型一致
- [ ] 业务流程可完整演示
- [ ] 状态变更逻辑正确

技术栈与风格（必检）：
- [ ] 使用原生 JavaScript（不使用框架）
- [ ] 固定侧边栏 + 白色背景
- [ ] 浅灰主内容区 + 白色卡片
- [ ] 简洁表格样式
- [ ] 基础模态框功能
- [ ] 状态标签使用规范定义的样式

结构完整性：
- [ ] 包含侧边栏导航
- [ ] 所有页面可切换
- [ ] 模态框可打开/关闭

页面覆盖：
- [ ] 列表页
- [ ] 详情页（模态框或独立页面）
- [ ] 创建/编辑页（模态框表单）

数据展示：
- [ ] 使用真实格式的模拟数据
- [ ] 状态使用正确的颜色标签

交互体验：
- [ ] 页面切换流畅
- [ ] 按钮有 hover 效果
- [ ] 模态框背景点击关闭

---

## 下一步

完成 Demo 后，进入技术设计阶段，编写 design.md。

---

最后更新：2026-01-12
