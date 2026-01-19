# 前端原型 Demo 规范（Frontend Demo Guidelines）

## 概述

本规范定义了在设计阶段创建前端原型 Demo 的标准，确保在编码实现之前能够直观展示 UI 交互和业务流程。

### 相关规范

- **TDD 工作流程**：参见 `test-driven-development-workflow.md`
- **技术架构规范**：参见 `tech-stack.md`
- **设计规范**：参见 `design-guidelines.md`

---

## 文件位置

```
.kiro/specs/{feature-name}/demo/
├── index.html          # PC端 Demo 文件（单文件，包含 HTML/CSS/JS）
├── mobile.html         # 手持端 Demo 文件（模拟 PDA/移动端）
└── assets/             # 可选：图片等静态资源
```

---

## 创建时机

Demo 应在以下阶段创建：

```
story.md → domain-analysis.md → requirements.md → domain-model.md
                                                        ↓
                                              ★ 创建 Demo ★
                                                        ↓
                                                  design.md
```

**原则**：在技术设计（design.md）之前创建 Demo，帮助：
1. 验证业务流程是否合理
2. 与业务方确认 UI 交互
3. 为技术设计提供参考

---

## Demo 技术规范

### 单文件结构

Demo 使用单个 HTML 文件，包含内联 CSS 和 JavaScript，便于分享和预览。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{功能名称} - 前端原型 Demo</title>
    <style>
        /* 内联样式 */
    </style>
</head>
<body>
    <!-- 页面内容 -->
    <script>
        // 内联脚本
    </script>
</body>
</html>
```

### 样式规范

使用简洁的 CSS，模拟 Ant Design 风格：

```css
/* 基础变量 */
:root {
    --primary-color: #1890ff;
    --success-color: #52c41a;
    --warning-color: #fa8c16;
    --error-color: #ff4d4f;
    --text-color: #333;
    --text-secondary: #8c8c8c;
    --border-color: #d9d9d9;
    --background-color: #f5f5f5;
}

/* 布局 */
.layout { display: flex; min-height: 100vh; }
.sider { width: 200px; background: #001529; color: #fff; }
.content { flex: 1; padding: 24px; }

/* 卡片 */
.card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
.card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

/* 表格 */
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }

/* 按钮 */
.btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
.btn-primary { background: var(--primary-color); color: #fff; }
.btn-default { background: #fff; border: 1px solid var(--border-color); }

/* 标签 */
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.tag-blue { background: #e6f7ff; color: #1890ff; }
.tag-green { background: #f6ffed; color: #52c41a; }
.tag-orange { background: #fff7e6; color: #fa8c16; }
.tag-red { background: #fff2f0; color: #ff4d4f; }
```

### 交互规范

使用简单的 JavaScript 实现页面切换和模态框：

```javascript
// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById('page-' + pageId).classList.remove('hidden');
}

// 模态框
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
```

---

## Demo 内容规范

### 必须包含的元素

1. **侧边栏导航**：展示功能模块结构
2. **页面导航**：快速切换不同页面
3. **列表页**：展示数据列表、搜索、筛选、分页
4. **详情页**：展示数据详情、操作按钮
5. **表单页**：展示创建/编辑表单
6. **模态框**：展示弹窗交互

### 数据展示

使用静态模拟数据，展示典型场景：

```html
<table class="table">
    <thead>
        <tr>
            <th>单号</th>
            <th>类型</th>
            <th>状态</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>RCV20241231000001</td>
            <td><span class="tag tag-blue">ASN</span></td>
            <td><span class="tag tag-orange">待收货</span></td>
            <td><button class="btn btn-primary btn-sm">处理</button></td>
        </tr>
    </tbody>
</table>
```

### 状态展示

使用不同颜色的标签展示状态：

| 状态类型 | 颜色 | CSS 类 |
|---------|------|--------|
| 信息/默认 | 蓝色 | tag-blue |
| 成功/完成 | 绿色 | tag-green |
| 警告/待处理 | 橙色 | tag-orange |
| 错误/异常 | 红色 | tag-red |
| 禁用/草稿 | 灰色 | tag-gray |

---

## 页面结构模板

### 列表页

```html
<div id="page-list" class="page">
    <div class="header">
        <h2>📋 {功能名称}管理</h2>
    </div>
    
    <div class="card">
        <!-- 搜索栏 -->
        <div class="search-bar">
            <input type="text" class="form-input" placeholder="搜索...">
            <select class="form-select">
                <option value="">全部状态</option>
            </select>
            <button class="btn btn-primary">查询</button>
            <button class="btn btn-success" style="margin-left: auto;">+ 新建</button>
        </div>
        
        <!-- 数据表格 -->
        <table class="table">
            <thead>...</thead>
            <tbody>...</tbody>
        </table>
        
        <!-- 分页 -->
        <div class="pagination">
            <span>共 X 条</span>
            <button class="btn btn-default btn-sm">上一页</button>
            <button class="btn btn-primary btn-sm">1</button>
            <button class="btn btn-default btn-sm">下一页</button>
        </div>
    </div>
</div>
```

### 详情页

```html
<div id="page-detail" class="page hidden">
    <div class="header">
        <h2>📋 {功能名称}详情</h2>
        <button class="btn btn-default btn-sm" onclick="showPage('list')">← 返回列表</button>
    </div>
    
    <div class="card">
        <div class="card-title">基本信息</div>
        <div class="desc-list">
            <div class="desc-item">
                <div class="desc-label">字段名</div>
                <div class="desc-value">字段值</div>
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-primary">确认</button>
            <button class="btn btn-default">编辑</button>
            <button class="btn btn-danger">取消</button>
        </div>
    </div>
    
    <div class="card">
        <div class="card-title">明细列表</div>
        <table class="table">...</table>
    </div>
</div>
```

### 表单页

```html
<div id="page-create" class="page hidden">
    <div class="header">
        <h2>➕ 创建{功能名称}</h2>
        <button class="btn btn-default btn-sm" onclick="showPage('list')">← 返回列表</button>
    </div>
    
    <div class="card">
        <div class="card-title">基本信息</div>
        <div class="row">
            <div class="col col-6">
                <div class="form-group">
                    <label class="form-label">字段名 *</label>
                    <input type="text" class="form-input" placeholder="请输入">
                </div>
            </div>
            <div class="col col-6">
                <div class="form-group">
                    <label class="form-label">下拉选择 *</label>
                    <select class="form-select">
                        <option value="">请选择</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card" style="text-align: center;">
        <button class="btn btn-primary">保存</button>
        <button class="btn btn-default" onclick="showPage('list')">取消</button>
    </div>
</div>
```

---

## 业务流程展示

### 多端协作流程

对于涉及多端协作的功能，Demo 应展示完整流程：

```
┌─────────────────────────────────────────────────────────────────┐
│ 阶段1：PC端操作                                                  │
├─────────────────────────────────────────────────────────────────┤
│ - 列表页：查看待处理数据                                          │
│ - 创建页：创建新单据                                              │
│ - 详情页：确认单据、分配任务                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 阶段2：手持端操作（模拟）                                         │
├─────────────────────────────────────────────────────────────────┤
│ - 任务列表：查看待执行任务                                        │
│ - 扫描页面：扫描条码                                              │
│ - 数据采集：录入批次、数量等                                       │
│ - 执行确认：提交执行结果                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 阶段3：系统自动处理                                               │
├─────────────────────────────────────────────────────────────────┤
│ - 状态更新：单据状态自动变更                                       │
│ - 数据汇总：执行结果汇总到主单据                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 状态流转展示

在详情页展示状态流转：

```html
<div class="card">
    <div class="card-title">操作日志</div>
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-time">2024-12-31 11:15:00</div>
            <div class="timeline-content">收货员A 执行收货，数量 50</div>
        </div>
        <div class="timeline-item">
            <div class="timeline-time">2024-12-31 10:40:00</div>
            <div class="timeline-content">张三 分配任务给 收货员A</div>
        </div>
        <div class="timeline-item">
            <div class="timeline-time">2024-12-31 10:35:00</div>
            <div class="timeline-content">系统 自动创建任务</div>
        </div>
    </div>
</div>
```

---

## 检查清单

### 结构完整性
- [ ] 包含侧边栏导航
- [ ] 包含页面快速导航
- [ ] 所有页面可切换
- [ ] 模态框可打开/关闭

### 页面覆盖
- [ ] 列表页（搜索、筛选、分页）
- [ ] 详情页（信息展示、操作按钮）
- [ ] 创建/编辑页（表单）
- [ ] 配置页（如有）

### 数据展示
- [ ] 使用真实格式的模拟数据
- [ ] 状态使用正确的颜色标签
- [ ] 表格包含典型数据行

### 交互体验
- [ ] 页面切换流畅
- [ ] 按钮有 hover 效果
- [ ] 表单有焦点样式

---

## 示例参考

参考已有的 Demo 文件：
- `.kiro/specs/warehouse-receiving/demo/index.html` - 仓库收货功能 PC端 Demo
- `.kiro/specs/warehouse-receiving/demo/mobile.html` - 仓库收货功能手持端 Demo

---

## 手持端 Demo 规范

### 设计原则

手持端 Demo 模拟 PDA/移动端设备，需要考虑：
1. **屏幕尺寸**：模拟 375px 宽度的移动设备
2. **触摸操作**：按钮足够大，便于点击
3. **扫描优先**：突出扫码功能入口
4. **简洁高效**：减少输入，快速完成任务

### 必须包含的页面

| 页面 | 说明 |
|-----|------|
| 登录页 | 用户名、密码、仓库选择 |
| 首页 | 统计数据、功能入口 |
| 任务列表 | 待执行、执行中、已完成 |
| 任务详情 | 任务信息、物料信息、采集要求 |
| 任务执行 | 扫码、数据采集、数量输入、库位选择 |
| 扫码页 | 扫描区域、手动输入、历史记录 |
| 执行记录 | 历史执行记录查询 |
| 成功页 | 执行成功反馈 |

### 交互特点

```javascript
// 模拟扫描
function simulateScan(inputId, value) {
    document.getElementById(inputId).value = value;
    showToast('扫描成功');
}

// 数量调整（大按钮）
function adjustQty(delta) {
    const input = document.getElementById('receive-qty');
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta);
    input.value = value;
}

// Toast 提示
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
```

### 样式要点

```css
/* 移动端容器 */
.mobile-container {
    max-width: 375px;
    margin: 0 auto;
    min-height: 100vh;
}

/* 大按钮便于触摸 */
.btn {
    padding: 12px 20px;
    min-height: 44px;
}

/* 扫描区域 */
.scan-area {
    background: #000;
    height: 200px;
}

/* 底部导航 */
.bottom-nav {
    position: fixed;
    bottom: 0;
    padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 下一步

完成 Demo 后，进入技术设计阶段，编写 `design.md`。

Demo 可以帮助：
1. 验证 API 设计是否满足 UI 需求
2. 确定数据模型的字段
3. 明确前后端交互流程
