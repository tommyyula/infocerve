---
inclusion: always
---

# 场景路由规则

本规范定义了 AI 助手在每次对话开始时的场景判断规则，确保按需加载对应阶段的规范。

---

## 核心原则（始终遵守）

1. 不确定就问 - 宁可多问，禁止猜测
2. 确认后再做 - 得到用户确认才开发
3. 设计阶段不改代码 - 用户明确说只做设计时，只更新设计文档，禁止修改代码文件
4. 复杂任务用 task-manager - 思考(research_mode)、拆分(split)、执行(execute)、验证(verify)
5. 写代码看规范 - 编辑 Java 文件时自动加载 #10-JAVA-CHECKLIST
6. 善用 MCP 工具 - 数据库查表、API 查规范（见下方 MCP 工具章节）

[重要] 禁止使用 Kiro spec 的 tasks.md，任务管理统一使用 task-manager

---

## MCP 工具（开发时主动使用）

数据库工具：
- 识别特征：*mysql_query、*db*
- 用途：查表结构、验证数据

API 文档工具：
- 识别特征：*api*fox*、*oas*
- 用途：查接口规范

Playwright 工具：
- 识别特征：mcp_playwright_*
- 用途：E2E 自动化测试

---

## 场景判断流程

```
用户输入
    |
    v
[判断场景类型]
    |
    +---> 场景 A：需求分析（Spec 流程）
    |         |
    |         v
    |     引用 #20-TDD-WORKFLOW
    |     按 11 阶段门禁执行
    |
    +---> 场景 B：快速修改（直接执行）
    |         |
    |         v
    |     使用 task-manager 创建任务
    |     任务必须包含单元测试
    |
    +---> 场景 C：Bug 修复
              |
              v
          先定位问题
          简单 bug -> 场景 B
          设计问题 -> 场景 A
```

---

## 场景 A：需求分析（Spec 流程）

### 触发条件（满足任一）

触发词：
- "新功能"、"新需求"、"新模块"、"新接口"
- "设计"、"分析"、"规划"、"架构"
- "重构"（涉及多文件）

判断条件：
- 涉及 3 个以上文件改动
- 需要新建数据库表
- 需要新建 API 接口
- 涉及多个限界上下文
- 用户不确定实现方案
- 需要与业务方确认需求

### 执行流程

1. 创建或进入 Spec 目录：`.kiro/specs/{feature-name}/`
2. 引用 #20-TDD-WORKFLOW 规范
3. 严格按 11 阶段门禁执行：
   - 阶段 1-3：需求分析（story -> domain-analysis -> requirements）
   - 阶段 4-7：设计（domain-model -> demo -> design -> database-design）
   - 阶段 8-10：测试用例设计（e2e -> unit -> api）
   - 阶段 11：实现任务
4. 使用 task-manager MCP 工具管理实现任务
5. 每个阶段必须人工确认后才能进入下一阶段

### 阶段规范引用

根据当前阶段，引用对应规范：

- 阶段 1（用户故事）：#21-STORY-GUIDELINES
- 阶段 2（领域分析）：#22-DOMAIN-ANALYSIS
- 阶段 3（需求规格）：#23-REQUIREMENTS-GUIDELINES
- 阶段 4（领域建模）：#24-DOMAIN-MODEL
- 阶段 5（前端原型）：#25-FRONTEND-DEMO
- 阶段 6（技术设计）：#26-DESIGN-GUIDELINES
- 阶段 7（数据库设计）：#27-DATABASE-DESIGN
- 阶段 8-10（测试用例）：#30-TEST-CASE-GUIDELINES
- 阶段 11（实现）：#10-JAVA-CHECKLIST + #31-UNIT-TEST-GUIDELINES

---

## 场景 B：快速修改（直接执行）

### 触发条件（同时满足）

触发词：
- "修复"、"修改"、"调整"、"优化"
- "改一下"、"加个"、"删掉"

判断条件：
- 改动范围明确（1-2 个文件）
- 不涉及新表、新接口
- 逻辑简单，无需设计
- 用户明确知道要改什么

### 执行流程

1. 确认改动范围和影响
2. 使用 task-manager MCP 工具创建任务
3. 任务必须包含：
   - 代码修改
   - 单元测试（必须）
   - 验证方式
4. 执行任务并验证

### 任务模板

```
任务 1：{修改描述}
  - 文件：{待修改文件}
  - 改动：{具体改动内容}
  - 测试：{测试文件} - {测试方法}
  - 验证：{验证命令或方式}
```

---

## 场景 C：Bug 修复

### 触发条件

触发词：
- "bug"、"问题"、"报错"、"异常"
- "不工作"、"失败"、"错误"

### 执行流程

1. 使用 research_mode 定位问题
2. 分析问题类型：
   - 简单 bug（代码逻辑错误）-> 按场景 B 处理
   - 设计问题（架构/接口问题）-> 按场景 A 处理
3. 修复后必须添加回归测试

---

## 任务结构规范

### Spec 流程任务（阶段 11）

使用 task-manager 的 split_tasks 创建任务，按 DDD 分层组织：

```
任务组 1：领域层实现
  - 任务 1.1：实现值对象
    - 开发：创建 {ValueObject}.java
    - 测试：{ValueObject}Test.java
    - 验证：mvn test -Dtest={ValueObject}Test
  
  - 任务 1.2：实现聚合根
    - 开发：创建 {Aggregate}.java
    - 测试：{Aggregate}Test.java
    - 验证：mvn test -Dtest={Aggregate}Test

任务组 2：应用层实现
  - 任务 2.1：实现应用服务
    - 开发：创建 {Feature}ApplicationService.java
    - 测试：{Feature}ApplicationServiceTest.java
    - 验证：mvn test

任务组 3：基础设施层实现
  - 任务 3.1：实现 Repository
  - 任务 3.2：实现 PO 和 Mapper

任务组 4：接口层实现
  - 任务 4.1：实现 Controller
  - 任务 4.2：实现 DTO

任务组 5：测试验证
  - 任务 5.1：运行单元测试
  - 任务 5.2：运行 API 测试
  - 任务 5.3：运行 E2E 测试（Playwright MCP）
```

### 快速修改任务

```
任务 1：{修改描述}
  - 开发：修改 {文件路径}
  - 测试：{测试文件} - {测试用例}
  - 验证：{验证命令}
```

---

## 测试要求

### 最低要求（快速修改）

- 单元测试覆盖改动代码
- 验证命令：mvn test 或 npm test

### 标准要求（一般功能）

- 单元测试（领域层、应用层）
- API 测试（接口层）

### 完整要求（新功能/Spec 流程）

- 单元测试（领域层、应用层）
- API 测试（接口层）
- E2E 测试（使用 Playwright MCP 工具）

### Playwright MCP 测试流程

```
1. 启动开发服务器
   controlPwshProcess({ action: 'start', command: 'npm run dev' })

2. 导航到页面
   mcp_playwright_browser_navigate({ url: 'http://localhost:xxx' })

3. 获取页面快照
   mcp_playwright_browser_snapshot()

4. 执行交互操作
   mcp_playwright_browser_click({ element: '...', ref: '...' })
   mcp_playwright_browser_type({ element: '...', ref: '...', text: '...' })

5. 验证结果
   mcp_playwright_browser_snapshot()
   mcp_playwright_browser_take_screenshot({ filename: 'result.png' })

6. 清理
   mcp_playwright_browser_close()
```

---

## 不确定时的处理

当无法明确判断场景时，询问用户：

```
这个需求涉及 [改动范围描述]，我建议按以下方式处理：

方式 A - Spec 流程（推荐用于新功能）：
  - 完整的需求分析、设计、测试用例、实现
  - 预计时间较长，但质量有保障

方式 B - 直接执行（推荐用于小改动）：
  - 快速修改 + 单元测试
  - 预计时间较短

请确认处理方式？
```

---

## 规范文件索引

### 始终加载（always）
- 00-SCENARIO-ROUTER.md - 本文件
- 01-OUTPUT-FORMAT.md - 输出格式规范
- 02-LANGUAGE-GUIDELINES.md - 语言使用规范

### 编码时自动加载（fileMatch）
- 10-JAVA-CHECKLIST.md - Java 编码检查（*.java, *.sql）
- 11-CRITICAL-REMINDERS.md - 关键提醒（*.java）

### 按需引用（manual）
- 20-TDD-WORKFLOW.md - TDD 完整工作流
- 21-STORY-GUIDELINES.md - 用户故事规范
- 22-DOMAIN-ANALYSIS.md - 领域分析规范
- 23-REQUIREMENTS-GUIDELINES.md - 需求规格规范
- 24-DOMAIN-MODEL.md - 领域建模规范
- 25-FRONTEND-DEMO.md - 前端原型规范
- 26-DESIGN-GUIDELINES.md - 技术设计规范
- 27-DATABASE-DESIGN.md - 数据库设计规范
- 30-TEST-CASE-GUIDELINES.md - 测试用例设计
- 31-UNIT-TEST-GUIDELINES.md - 单元测试规范
- 32-PLAYWRIGHT-GUIDE.md - Playwright 自动化测试
- 33-TROUBLESHOOTING-GUIDE.md - 线上问题排查指南
- 34-TASK-ARCHIVE-GUIDE.md - 任务归档指南

---

## 事后反思流程

代码写完后必须执行全局检查，发现问题立即修复。

### 反思步骤（4步）

1. 全局检查
   ```bash
   # 使用 getDiagnostics 检查所有修改的文件
   getDiagnostics(paths=["修改的文件列表"])
   
   # 使用 MCP 数据库工具验证数据变更（如有）
   ```

2. 分析问题
   - 问题类型：语法/类型/引用错误？
   - 问题原因：违反了哪条规范？
   - 问题范围：影响多少文件？

3. 修复并改进
   - 立即修复所有错误
   - 举一反三：grepSearch 搜索相同问题
   - 更新规范文档（如果发现新问题）

4. 与 task-manager 配合
   - 如果发现需要追加任务 -> split_tasks(updateMode="append")
   - 如果发现设计问题 -> 更新 Kiro spec 的 design.md
   - 如果任务需要调整 -> update_task

### 反思检查清单

- [ ] 执行 getDiagnostics 检查
- [ ] 分析问题原因
- [ ] 修复所有错误
- [ ] 举一反三检查
- [ ] 是否需要追加/调整任务？

---

最后更新：2026-01-03
