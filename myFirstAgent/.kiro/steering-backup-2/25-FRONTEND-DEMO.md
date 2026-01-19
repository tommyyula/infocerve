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

领域模型一致性（必检）：
- [ ] 页面结构与聚合根一一对应
- [ ] 表单字段覆盖聚合根所有业务属性
- [ ] 枚举值与领域模型定义一致
- [ ] 操作按钮使用用户友好的中文标签（非方法名）
- [ ] 聚合间关联通过 ID 引用体现
- [ ] 状态流转符合领域模型设计

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
