---
inclusion: manual
---

# 前端原型 Demo 规范（Frontend Demo Guidelines）

## 概述

本规范定义了在设计阶段创建前端原型 Demo 的标准，Demo 是 01-04 阶段文档的可视化呈现，帮助：
1. 验证业务流程是否合理
2. 与业务方确认 UI 交互
3. 为技术设计提供参考

[重要] Demo 必须基于 01-04 阶段文档设计，不能凭空想象界面和流程。

---

## Demo 实现范围（必读）

[重要] Demo 必须完整实现，禁止省略任何内容：

1. 聚合根覆盖
   - 领域模型中的每个聚合根必须有对应的管理页面
   - 禁止遗漏任何聚合根

2. 字段完整性
   - 表单必须包含聚合根的所有业务属性字段
   - 列表必须展示所有关键字段
   - 详情页必须显示完整信息
   - 禁止省略任何字段

3. 功能完整性
   - 用户故事中的所有操作场景必须有对应的功能实现
   - 状态机的所有状态转换必须可操作
   - 所有查询条件必须可用
   - 禁止省略任何功能

4. 特殊页面
   - 历史数据查询页面（如操作日志、变更记录）
   - 统计报表页面（如果需求中有）
   - 其他非聚合根但业务需要的页面

5. 检查清单
   - [ ] Demo 模块数量 >= 领域模型聚合根数量（多出的是特殊页面）
   - [ ] 每个聚合根的所有属性都有对应的表单字段
   - [ ] 用户故事中的所有操作场景都有对应的操作按钮
   - [ ] 需求文档中的所有功能点都能在 Demo 中操作

---

## 文件位置

按模块划分，采用分层文件组织结构：

```
.kiro/specs/{feature-name}/05-demo/
  index.html                    # 主入口页面，SPA 路由
  mobile.html                   # 手持端主页（可选）
  assets/                       # 静态资源
    styles.css                  # 公共样式
    app.js                      # 主应用逻辑（路由、导航）
    utils.js                    # 公共工具函数
    pages/                      # 模块页面（JS 文件导出 HTML）
      {module1}.js              # 模块1页面 + 逻辑
      {module2}.js              # 模块2页面 + 逻辑
      {moduleN}.js              # 模块N页面 + 逻辑
```

[重要] 浏览器同源策略限制 fetch 无法加载本地文件，因此模块页面使用 JS 文件导出 HTML 字符串的方式实现。

### 文件职责划分

**主入口文件（index.html）：**
- 定义整体布局结构（侧边栏、顶部栏、内容区）
- 按顺序引用所有 JS 文件（先 utils，再 pages，最后 app）
- 提供 SPA 路由容器

**样式文件（assets/styles.css）：**
- 全局 CSS 变量定义
- 通用组件样式（按钮、表单、模态框等）
- 布局样式（侧边栏、顶部栏、网格等）

**主应用逻辑（assets/app.js）：**
- SPA 路由管理（从 Pages 对象读取模块配置）
- 页面切换逻辑
- 全局状态管理
- 通用 UI 交互（模态框、主题切换等）

**工具函数（assets/utils.js）：**
- 数据格式化函数
- 日期时间处理
- 表单验证工具

**模块页面（assets/pages/{module}.js）：**
- 导出 HTML 模板字符串
- 模块特定的模拟数据
- 模块特定的业务逻辑
- 模块特定的 UI 交互
- 注册到全局 Pages 对象

---

## 创建时机

Demo 应在领域建模完成后、技术设计之前创建：

```
04-domain-model.md -> [创建 Demo] -> 06-design.md
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

---

## Demo 设计思路

### 核心原则

以聚合根为主线，一个聚合根对应一个功能模块：

```
04-domain-model.md（聚合根）
    |
    +---> 找对应的用户故事（01-story.md）
    +---> 找对应的业务规则（02-domain-analysis.md）
    +---> 找对应的功能需求（03-requirements.md）
    +---> 设计模块页面和交互
```

### 设计步骤

以 Receipt 聚合根为例：

步骤 1：从 04-domain-model.md 提取聚合根信息
```
聚合根：Receipt
- 属性：receiptNo, receiptType, status, warehouse, lines
- 状态：DRAFT -> CONFIRMED -> EXECUTING -> COMPLETED
- 方法：create(), confirm(), complete()
```

步骤 2：从 01-story.md 找对应的用户故事
```
用户故事：
- 作为仓库管理员，我想要创建收货单
- 作为仓库管理员，我想要确认收货单
- 作为收货员，我想要执行收货任务

验收标准：
- 可以选择收货类型
- 可以添加收货明细
- 确认后生成任务
```

步骤 3：从 02-domain-analysis.md 找业务规则
```
业务规则：
- BR-001：收货单必须至少有一条明细才能确认
- BR-002：确认后不能修改明细
- BR-003：所有任务完成后才能完成收货单

统一语言：
- Receipt（收货单）
- ReceiptLine（收货明细）
```

步骤 4：从 03-requirements.md 找功能需求
```
功能需求：
- FR-001：收货单查询（按单号、状态、日期）
- FR-002：收货单创建
- FR-003：收货单确认
```

步骤 5：设计模块页面
```
Receipt 模块页面：
1. 列表页 - 查询、新建入口
2. 创建表单 - 映射聚合根属性
3. 详情页 - 显示聚合根完整信息
4. 操作按钮 - 根据状态机显示
```

---

## 领域模型一致性要求（重要）

Demo 必须准确反映 04-domain-model.md 中的领域设计：

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

## 实现示例

### 示例：Receipt 聚合根模块

```javascript
// 1. 模拟数据结构（基于 04-domain-model.md）
const mockReceipts = [
    {
        id: 'rcv-001',
        receiptNo: 'RCV20241231000001',  // 值对象
        receiptType: 'ASN',               // 枚举
        status: 'DRAFT',                  // 状态机
        warehouseId: 'wh-001',            // 引用
        lines: [                          // 实体集合
            {
                lineNo: 1,
                itemId: 'item-001',
                plannedQuantity: 100
            }
        ]
    }
];

// 2. 状态枚举（基于 04-domain-model.md 状态机）
const ReceiptStatus = {
    DRAFT: { label: '草稿', color: 'gray' },
    CONFIRMED: { label: '已确认', color: 'blue' },
    EXECUTING: { label: '执行中', color: 'orange' },
    COMPLETED: { label: '已完成', color: 'green' }
};

// 3. 创建表单（基于 01-story.md 验收标准）
function renderCreateForm() {
    return `
        <div class="modal">
            <h4>创建收货单</h4>
            
            <!-- 验收标准：可以选择收货类型 -->
            <div class="form-row">
                <label>收货类型</label>
                <select id="receiptType">
                    <option value="ASN">ASN收货</option>
                    <option value="RETURN">退货收货</option>
                </select>
            </div>
            
            <!-- 验收标准：可以添加收货明细 -->
            <div class="form-row">
                <label>收货明细</label>
                <button onclick="addLine()">添加明细</button>
                <table id="lines-table"></table>
            </div>
            
            <button onclick="saveReceipt()">保存</button>
        </div>
    `;
}

// 4. 业务规则校验（基于 02-domain-analysis.md）
function confirmReceipt(receiptId) {
    const receipt = mockReceipts.find(r => r.id === receiptId);
    
    // BR-001：至少一条明细才能确认
    if (receipt.lines.length === 0) {
        alert('业务规则校验失败：收货单必须至少有一条明细（BR-001）');
        return;
    }
    
    // 状态变更（基于 04-domain-model.md 状态机）
    receipt.status = 'CONFIRMED';
    
    // 验收标准：确认后生成任务
    generateTasks(receipt);
    
    alert('收货单已确认');
}

// 5. 状态驱动的操作按钮（基于 04-domain-model.md 状态机）
function renderActions(receipt) {
    switch(receipt.status) {
        case 'DRAFT':
            return `
                <button onclick="confirmReceipt('${receipt.id}')">确认</button>
            `;
        case 'CONFIRMED':
            return `
                <button onclick="viewTasks('${receipt.id}')">查看任务</button>
            `;
        case 'EXECUTING':
            return `
                <button onclick="completeReceipt('${receipt.id}')">完成</button>
            `;
        default:
            return `<button onclick="viewReceipt('${receipt.id}')">查看</button>`;
    }
}

// 6. 查询功能（基于 03-requirements.md FR-001）
function searchReceipts() {
    const receiptNo = document.getElementById('searchReceiptNo').value;
    const status = document.getElementById('searchStatus').value;
    
    let results = mockReceipts;
    
    // 按单号查询
    if (receiptNo) {
        results = results.filter(r => r.receiptNo.includes(receiptNo));
    }
    
    // 按状态筛选
    if (status) {
        results = results.filter(r => r.status === status);
    }
    
    renderReceiptList(results);
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
        renderReceiptList();
        alert('收货单已确认');
    }
}

// 模拟表单提交
function createReceipt(formData) {
    const newReceipt = {
        id: 'rcv-' + Date.now(),
        receiptNo: 'RCV' + new Date().toISOString().slice(0,10).replace(/-/g,'') 
                    + String(mockReceipts.length + 1).padStart(6, '0'),
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
|   系统名称        |   顶部栏（面包屑、用户信息）                      |
|   - 固定侧边栏    +------------------------------------------------+
|   - 白色背景      |              内容区域                           |
|   - 简洁导航      |   - 浅灰背景 #f5f7fb                           |
|                  |   - 白色卡片（圆角、阴影）                       |
+------------------+------------------------------------------------+
```

### CSS 变量定义

```css
:root {
    --primary-color: #1677ff;
    --success-color: #52c41a;
    --warning-color: #fa8c16;
    --error-color: #ff4d4f;
    --text-color: #1f2a37;
    --muted-color: #6b7280;
    --border-color: #e6ebf2;
    --background-color: #f5f7fb;
    --card-shadow: 0 8px 24px rgba(16, 24, 40, 0.06);
}
```

### 字体规范

```css
body {
    font-family: "Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", sans-serif;
    color: var(--text-color);
    background: #eef2f7;
}
```

### 侧边栏规范

- 宽度：220px（固定，不可折叠）
- 背景：白色 #fff
- 边框：右侧 1px 边框 #e6ebf2
- Logo 区域：系统名称，蓝色 #1d4ed8，字号 20px
- 菜单项：圆角 8px，hover 浅蓝背景 #eef5ff
- 当前选中：浅蓝背景 #e6f1ff + 蓝色文字 #1d4ed8

### 顶部栏规范

- 背景：白色 #fff
- 边框：1px 边框 #e6ebf2
- 圆角：10px
- 阴影：0 2px 10px rgba(16, 24, 40, 0.04)
- 内边距：12px 16px
- 左侧：系统名称 "WMS Pro"，字号 16px，字重 600，蓝色 #1677ff
- 右侧：功能区域，包含语言切换、主题切换、用户信息

### 顶部栏功能区域

右侧功能区域从左到右依次包含：

1. 语言切换下拉框
   - 默认显示：简体中文
   - 可选项：简体中文、繁体中文、English
   - 样式：芯片样式，带下拉箭头

2. 主题切换按钮
   - 亮色主题图标：太阳图标
   - 暗色主题图标：月亮图标
   - 点击切换主题模式

3. 当前用户信息
   - 显示用户名，如：Administrator
   - 样式：芯片样式
   - 可点击展开用户菜单（退出登录等）

### 主内容区域

- 背景：浅灰色 #f5f7fb
- 内边距：16px 24px 28px
- 卡片：白色背景，圆角 12px，阴影 0 8px 24px rgba(16, 24, 40, 0.06)

### 组件样式

顶部栏：
```css
.topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}
.system-name {
    font-size: 16px;
    font-weight: 600;
    color: #1677ff;
}
.topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--muted-color);
    font-size: 13px;
}
.topbar-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s ease;
}
.topbar-chip:hover {
    background: #e2e8f0;
}
.topbar-chip.dropdown::after {
    content: "▼";
    font-size: 10px;
    color: #6b7280;
    margin-left: 4px;
}
.theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    transition: background 0.2s ease;
}
.theme-toggle:hover {
    background: #e2e8f0;
}
.theme-icon {
    font-size: 16px;
}
.user-info {
    font-weight: 500;
    color: var(--text-color);
}
```

按钮：
```css
.btn {
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 10px rgba(22, 119, 255, 0.18);
}
.btn:hover { background: #4096ff; }
.btn-sm { 
    padding: 4px 10px; 
    font-size: 12px; 
    margin-right: 6px;
    box-shadow: none;
}
.btn-default { 
    background: #fff; 
    color: #344054; 
    border: 1px solid var(--border-color);
    box-shadow: none;
}
.btn-danger { background: var(--error-color); }
```

状态标签：
```css
.tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    color: #fff;
}
.tag-blue { background: var(--primary-color); }
.tag-green { background: var(--success-color); }
.tag-orange { background: var(--warning-color); }
.tag-red { background: var(--error-color); }
.tag-gray { background: #9aa4b2; }
```

搜索栏：
```css
.search-bar {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr auto;
    gap: 10px;
    align-items: center;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 14px;
}
```

表格：
```css
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}
.data-table th,
.data-table td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
    vertical-align: top;
}
.data-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #0f172a;
}
```

模态框：
```css
.modal {
    display: none;
    position: fixed;
    z-index: 100;
    left: 0; top: 0;
    width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.5);
    justify-content: center;
    align-items: flex-start;
    padding-top: 60px;
}
.modal.show { display: flex; }
.modal-content {
    background: #fff;
    border-radius: 12px;
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}
.modal-header h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
}
.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background 0.2s ease;
}
.modal-close:hover {
    background: #e5e7eb;
    color: #374151;
}
.modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
}
```

表单：
```css
/* 表单容器 */
.form-container {
    max-width: 600px;
    margin: 0 auto;
}

/* 表单行 - 使用网格布局 */
.form-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 16px;
    align-items: start;
    margin-bottom: 20px;
}

/* 标签样式 */
.form-row label {
    padding-top: 8px;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    text-align: right;
}

/* 必填标记 */
.form-row label.required::after {
    content: " *";
    color: #ef4444;
}

/* 输入框样式 */
.form-row input,
.form-row select,
.form-row textarea {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* 输入框焦点状态 */
.form-row input:focus,
.form-row select:focus,
.form-row textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 文本域 */
.form-row textarea {
    min-height: 100px;
    resize: vertical;
}

/* 禁用状态 */
.form-row input:disabled,
.form-row select:disabled,
.form-row textarea:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
}

/* 只读状态 */
.form-row input[readonly] {
    background: #f9fafb;
    color: #374151;
}

/* 错误状态 */
.form-row.error input,
.form-row.error select,
.form-row.error textarea {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 错误提示 */
.form-error {
    grid-column: 2;
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
}

/* 帮助文本 */
.form-help {
    grid-column: 2;
    color: #6b7280;
    font-size: 12px;
    margin-top: 4px;
}

/* 分组标题 */
.form-group {
    margin: 32px 0 20px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
}

.form-group-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

/* 内联表单（多列布局） */
.form-row.inline {
    grid-template-columns: 120px 1fr 1fr;
    gap: 12px;
}

/* 全宽表单项 */
.form-row.full-width {
    grid-template-columns: 1fr;
}

.form-row.full-width label {
    text-align: left;
    padding-top: 0;
    margin-bottom: 8px;
}

/* 复选框和单选框 */
.form-row.checkbox,
.form-row.radio {
    grid-template-columns: 120px 1fr;
    align-items: center;
}

.form-row.checkbox input[type="checkbox"],
.form-row.radio input[type="radio"] {
    width: auto;
    margin-right: 8px;
}

/* 按钮组 */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
    
    .form-row label {
        text-align: left;
        padding-top: 0;
    }
    
    .form-row.inline {
        grid-template-columns: 1fr;
    }
}
```

## 表单设计最佳实践

### 设计原则

1. **清晰的视觉层次**
   - 使用网格布局对齐标签和输入框
   - 标签右对齐，与输入框顶部对齐
   - 合理的间距和分组

2. **用户体验优化**
   - 必填字段使用红色星号标记
   - 焦点状态有明显的视觉反馈
   - 错误状态有清晰的提示信息
   - 禁用和只读状态有明确区分

3. **响应式设计**
   - 移动端自动切换为垂直布局
   - 保持良好的可读性和可操作性

### 表单布局规范

**标准表单行：**
- 标签宽度：120px，右对齐
- 输入框：占据剩余空间
- 行间距：20px
- 标签与输入框间距：16px

**分组设计：**
- 使用分组标题区分不同类型的字段
- 分组间距：32px
- 分组标题下方有分隔线

**按钮区域：**
- 顶部有分隔线
- 按钮右对齐
- 主要操作按钮在右侧

### 字段类型规范

**文本输入框：**
- 高度：40px（包含边框）
- 内边距：10px 12px
- 圆角：6px
- 占位符文本使用灰色

**下拉选择框：**
- 与文本输入框保持一致的样式
- 默认选项："请选择..."

**文本域：**
- 最小高度：100px
- 支持垂直调整大小
- 适用于长文本输入

**复选框/单选框：**
- 与标签在同一行
- 复选框/单选框在左，文字在右
- 间距：8px

### 状态设计

**焦点状态：**
- 边框颜色：#3b82f6（蓝色）
- 外发光：蓝色阴影，透明度 10%

**错误状态：**
- 边框颜色：#ef4444（红色）
- 外发光：红色阴影，透明度 10%
- 错误提示文字：红色，12px

**禁用状态：**
- 背景色：#f9fafb（浅灰）
- 文字颜色：#6b7280（灰色）
- 鼠标样式：not-allowed

页面动画：
```css
.page {
    display: none;
    animation: fadeIn 0.2s ease-in;
}
.page.active { display: block; }
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

---

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

### 主入口页面（index.html）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统名称 - 前端原型 Demo</title>
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<div class="layout">
    <div class="sidebar">
        <h2>WMS Pro</h2>
        <div class="nav" id="nav">
            <!-- 导航菜单由 app.js 动态生成 -->
        </div>
    </div>
    <div class="main">
        <div class="topbar">
            <div class="topbar-left">
                <div class="system-name">WMS Pro</div>
            </div>
            <div class="topbar-right">
                <div class="topbar-chip dropdown" onclick="toggleLanguage()">
                    <span id="current-language">简体中文</span>
                </div>
                <div class="theme-toggle" onclick="toggleTheme()" title="切换主题">
                    <span class="theme-icon" id="theme-icon">☀️</span>
                </div>
                <div class="topbar-chip user-info" onclick="toggleUserMenu()">
                    <span id="current-user">Administrator</span>
                </div>
            </div>
        </div>
        <!-- 页面内容容器，由路由动态加载 -->
        <div id="page-container"></div>
    </div>
</div>

<!-- 通用模态框 -->
<div class="modal" id="modal-generic">
    <div class="modal-content">
        <div class="modal-header">
            <h4 id="modal-title"></h4>
            <button class="modal-close" onclick="hideModal('modal-generic')">&times;</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="form-actions" id="modal-actions"></div>
    </div>
</div>

<!-- 加载脚本（顺序重要：utils -> pages -> app） -->
<script src="assets/utils.js"></script>
<script src="assets/pages/receipt.js"></script>
<script src="assets/pages/inventory.js"></script>
<!-- 添加更多模块页面脚本... -->
<script src="assets/app.js"></script>
</body>
</html>
```

[重要] 脚本加载顺序：
1. utils.js - 工具函数
2. pages/*.js - 各模块页面（注册到 window.Pages）
3. app.js - 主应用逻辑（读取 Pages 并初始化导航）

### 模块页面文件（assets/pages/receipt.js）

模块页面使用 JS 文件，导出 HTML 模板字符串并注册到全局 Pages 对象：

```javascript
// Receipt module - register to global Pages
(function() {
    // Mock data
    const mockReceipts = [
        { id: 'rcv-001', receiptNo: 'RCV20241231000001', receiptType: 'ASN', status: 'DRAFT', warehouseName: '主仓库', createdAt: '2024-12-31 10:00' }
    ];

    const ReceiptStatus = {
        DRAFT: { label: '草稿', color: 'gray' },
        CONFIRMED: { label: '已确认', color: 'blue' },
        EXECUTING: { label: '执行中', color: 'orange' },
        COMPLETED: { label: '已完成', color: 'green' }
    };

    // Register page
    Pages.receipt = {
        name: '收货管理',
        template: () => `
            <div class="page-content">
                <div class="card">
                    <div class="page-header">
                        <h3>收货单管理</h3>
                        <button class="btn" onclick="Pages.receipt.showCreateModal()">新建收货单</button>
                    </div>
                    <div class="search-bar">
                        <input type="text" id="search-receipt-no" placeholder="收货单号" />
                        <select id="search-status">
                            <option value="">全部状态</option>
                            <option value="DRAFT">草稿</option>
                            <option value="CONFIRMED">已确认</option>
                        </select>
                        <button class="btn" onclick="Pages.receipt.search()">搜索</button>
                    </div>
                    <table class="data-table" id="receipt-table">
                        <thead><tr><th>收货单号</th><th>类型</th><th>仓库</th><th>状态</th><th>操作</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `,
        init() { this.renderList(); },
        renderList() {
            const tbody = document.querySelector('#receipt-table tbody');
            tbody.innerHTML = mockReceipts.map(r => {
                const s = ReceiptStatus[r.status];
                return `<tr><td>${r.receiptNo}</td><td>${r.receiptType}</td><td>${r.warehouseName}</td>
                    <td><span class="tag tag-${s.color}">${s.label}</span></td>
                    <td><button class="btn btn-sm">详情</button></td></tr>`;
            }).join('');
        },
        search() { this.renderList(); },
        showCreateModal() { UI.showModal('新建收货单', '<p>表单内容...</p>', '<button class="btn">保存</button>'); }
    };
})();
```

### 主应用逻辑（assets/app.js）

```javascript
// 全局页面注册表（由各模块 JS 文件注册）
window.Pages = window.Pages || {};

// SPA 路由管理
const Router = {
    currentModule: null,

    // 加载页面（从 Pages 注册表读取）
    loadPage(moduleId) {
        const page = Pages[moduleId];
        if (!page) return;

        // 渲染 HTML
        document.getElementById('page-container').innerHTML = page.template();

        // 更新导航状态
        this.updateNavigation(moduleId);
        this.currentModule = moduleId;

        // 初始化模块
        if (page.init) page.init();
    },

    updateNavigation(activeId) {
        document.querySelectorAll('.nav button').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-module="${activeId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
};

// 导航管理
const Navigation = {
    // 初始化导航菜单（从 Pages 注册表读取）
    init() {
        const nav = document.getElementById('nav');
        Object.keys(Pages).forEach(moduleId => {
            const page = Pages[moduleId];
            const button = document.createElement('button');
            button.textContent = page.name;
            button.dataset.module = moduleId;
            button.onclick = () => Router.loadPage(moduleId);
            nav.appendChild(button);
        });

        // 加载默认页面
        const firstModule = Object.keys(Pages)[0];
        if (firstModule) Router.loadPage(firstModule);
    }
};

// 通用 UI 交互
const UI = {
    // 显示模态框
    showModal(title, content, actions) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-actions').innerHTML = actions;
        document.getElementById('modal-generic').classList.add('show');
    },

    // 隐藏模态框
    hideModal(modalId = 'modal-generic') {
        document.getElementById(modalId).classList.remove('show');
    },

    // 显示消息提示
    showMessage(message, type = 'info') {
        // 简单的 alert 实现，可以扩展为 toast
        alert(message);
    }
};

// 主题切换
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

// 语言切换
function toggleLanguage() {
    const languages = ['简体中文', '繁体中文', 'English'];
    const current = document.getElementById('current-language').textContent;
    const currentIndex = languages.indexOf(current);
    const nextIndex = (currentIndex + 1) % languages.length;
    
    document.getElementById('current-language').textContent = languages[nextIndex];
    localStorage.setItem('language', languages[nextIndex]);
}

// 用户菜单
function toggleUserMenu() {
    // 简单实现，可以扩展为下拉菜单
    if (confirm('确定要退出登录吗？')) {
        alert('已退出登录');
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航
    Navigation.init();
    
    // 恢复主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-icon').textContent = '🌙';
    }
    
    // 恢复语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        document.getElementById('current-language').textContent = savedLanguage;
    }
});

// 全局函数
window.showModal = UI.showModal;
window.hideModal = UI.hideModal;
window.showMessage = UI.showMessage;
```

```html
<div class="page" id="page-module">
    <div class="card">
        <div class="page-header">
            <h3>模块管理</h3>
            <button class="btn" onclick="showModal('modal-add')">新增</button>
        </div>
        <div class="search-bar">
            <input type="text" placeholder="搜索..." />
            <select><option value="">全部状态</option></select>
            <button class="btn">搜索</button>
        </div>
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr><th>字段1</th><th>字段2</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>数据1</td><td>数据2</td>
                        <td><span class="tag tag-green">正常</span></td>
                        <td><button class="btn btn-sm">详情</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
```

### 模态框模板

```html
<div class="modal" id="modal-add">
    <div class="modal-content">
        <div class="modal-header">
            <h4>新增记录</h4>
            <button class="modal-close" onclick="hideModal('modal-add')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-container">
                <!-- 基础信息分组 -->
                <div class="form-group">
                    <h5 class="form-group-title">基础信息</h5>
                </div>
                
                <div class="form-row">
                    <label class="required">编码</label>
                    <input type="text" placeholder="请输入编码" required />
                </div>
                
                <div class="form-row">
                    <label class="required">名称</label>
                    <input type="text" placeholder="请输入名称" required />
                </div>
                
                <div class="form-row">
                    <label>类型</label>
                    <select>
                        <option value="">请选择类型</option>
                        <option value="type1">类型1</option>
                        <option value="type2">类型2</option>
                    </select>
                </div>
                
                <!-- 详细信息分组 -->
                <div class="form-group">
                    <h5 class="form-group-title">详细信息</h5>
                </div>
                
                <div class="form-row">
                    <label>描述</label>
                    <textarea placeholder="请输入描述信息"></textarea>
                </div>
                
                <div class="form-row checkbox">
                    <label>启用状态</label>
                    <div>
                        <input type="checkbox" id="enabled" checked />
                        <label for="enabled">启用</label>
                    </div>
                </div>
            </div>
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

完成 Demo 后，进入技术设计阶段，编写 06-design.md。

---

最后更新：2026-01-13
