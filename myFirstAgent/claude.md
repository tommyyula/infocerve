AI Agent 开发项目规范

本文件定义了 Claude Code 在此项目中的工作方式。
核心原则：先思考，再设计，最后编码。


🎯 项目概述

项目类型: AI Agent / 自动化工具
开发者: [你的名字]
目标用户: [描述目标用户群体]
核心价值: [这个 Agent 解决什么问题？]


📋 开发流程规范

**强制要求**

在开始任何新功能或新项目开发之前，必须按 12 阶段门禁流程完成文档（详见后文 "Kiro 开发指导原则"）。

文档存放位置：`.kiro/specs/{feature-name}/`

只有在用户明确确认（说 "确认"、"proceed"、"开始编码" 等）后，才能进入下一阶段或开始写代码。

---

🔄 编码阶段规范

**开始编码前的检查清单**

在用户确认开始编码后（阶段 12），先检查：
- [ ] 阶段 1-11 的所有文档已创建且已确认
- [ ] progress.md 中前 11 个阶段状态均为"已通过"
- [ ] 当前要实现的任务已标记为进行中

**编码规范**
- 一次一个任务：按任务顺序，每次只实现一个任务
- 小步提交：每完成一个任务，提示用户检查
- 更新状态：完成后更新任务状态
- 保持一致：代码实现必须与 design.md 保持一致

**代码风格**
- 使用有意义的变量名和函数名
- 代码注释使用英文
- 遵循项目的代码风格（如果有 .eslintrc 或 .prettierrc）
- API 密钥等敏感信息使用环境变量

---

🚨 特殊指令

**快捷命令**

| 用户说... | Claude 应该... |
|-----------|---------------|
| "spec mode" 或 "规格模式" | 进入 12 阶段 Spec 流程 |
| "确认" 或 "proceed" | 进入下一阶段或开始编码 |
| "跳过规格" | 提醒规格的重要性，但如果用户坚持则直接编码 |
| "状态" 或 "status" | 显示当前阶段和任务进度 |
| "下一个任务" | 执行下一个待完成任务 |

**遇到问题时**
- 需求不清晰：主动提问，列出需要澄清的点
- 技术方案有多个选择：列出选项和各自优缺点，让用户决定
- 发现设计缺陷：停下来，说明问题，建议修改设计文档

**沟通风格**
- 使用中文回复（除非用户使用英文）
- 代码注释使用英文
- 解释技术决策时，假设用户可能是初学者
- 每完成一个步骤，简要说明做了什么、为什么这样做

---

📁 项目结构模板

```
project-root/
├── claude.md              # 本文件
├── README.md              # 项目说明
├── .env.example           # 环境变量模板
├── .gitignore
│
├── .kiro/                 # Kiro 配置目录
│   ├── specs/             # 规格文档（按功能分目录）
│   │   └── {feature-name}/
│   │       ├── 01-story.md
│   │       ├── 02-domain-analysis.md
│   │       ├── 03-requirements.md
│   │       ├── 04-domain-model.md
│   │       ├── 05-demo/
│   │       ├── 06-fsd/
│   │       ├── 07-design.md
│   │       ├── 08-repository-design.md
│   │       ├── 09-e2e-test-cases.md
│   │       ├── 10-unit-test-cases.md
│   │       ├── 11-api-test-cases.md
│   │       └── progress.md
│   └── steering/          # AI 行为指导规则
│
├── src/                   # 源代码
│   ├── index.js           # 入口文件
│   ├── agent/             # Agent 相关
│   │   ├── prompts.js     # System Prompts
│   │   ├── tools.js       # Agent 工具定义
│   │   └── context.js     # 上下文管理
│   ├── api/               # API 路由
│   ├── services/          # 业务逻辑
│   └── utils/             # 工具函数
│
├── tests/                 # 测试文件
│
└── docs/                  # 其他文档
    └── api.md             # API 文档
```

---

🎓 学习模式（可选）

如果用户说 "学习模式" 或 "教我"，Claude 应该：
- 解释为什么：每个决策背后的原因
- 展示替代方案：其他可能的实现方式
- 推荐资源：相关的学习材料
- 循序渐进：从简单到复杂，确保用户理解每一步

---

📌 记住

**核心原则：好的软件开发是 20% 编码 + 80% 思考和设计。**

这套流程的目的不是制造官僚主义，而是：
- 确保我们理解要做什么（story + requirements）
- 确保我们知道怎么做（domain-model + design）
- 确保我们有清晰的执行路径（tasks）
- 确保质量有保障（test-cases）

写代码是最后一步，也是最简单的一步。

---

## 编码前检查清单

在写任何代码之前，确认以下条件满足：
- [ ] `.kiro/specs/{feature-name}/` 目录下阶段 1-11 文档已创建
- [ ] 每个阶段文档已获得用户确认（progress.md 状态为"已通过"）
- [ ] 当前处于阶段 12（实现阶段）

如果用户直接要求写代码而跳过规格阶段，提醒用户：
"建议先完成需求和设计文档。要继续 spec-driven 模式吗？还是直接编码？"


---

## Kiro 开发指导原则

以下原则源自 .kiro/steering 规范文件，必须在项目开发中严格遵守。

### 📂 specs 文件夹使用说明

specs 文件夹用于存放每个功能的规格文档，按功能名称创建子目录。

**目录结构：**
```
.kiro/specs/{feature-name}/
├── 01-story.md              # 用户故事
├── 02-domain-analysis.md    # 领域分析
├── 03-requirements.md       # 需求规格
├── 04-domain-model.md       # 领域建模
├── 05-demo/                 # 前端原型
│   ├── index.html           # PC端 Demo
│   └── mobile.html          # 手持端 Demo
├── 06-fsd/                  # FSD 文档
│   ├── README.md            # FSD 索引
│   └── {module}.md          # 各模块 FSD
├── 07-design.md             # 技术设计
├── 08-repository-design.md  # 仓储设计
├── 09-e2e-test-cases.md     # E2E 测试用例
├── 10-unit-test-cases.md    # 单元测试用例
├── 11-api-test-cases.md     # API 测试用例
└── progress.md              # 进度状态
```

**使用时机：**
- 开始新功能开发时，创建 `.kiro/specs/{feature-name}/` 目录
- 按序号顺序创建文档，每个阶段完成后请求用户确认
- 参考已有的 specs 示例了解文档格式

**阅读顺序：**
1. story -> 2. domain-analysis -> 3. requirements -> 4. domain-model
5. demo -> 6. fsd -> 7. design -> 8. repository-design
9. e2e-test-cases -> 10. unit-test-cases -> 11. api-test-cases

### 📂 steering 文件夹使用说明

steering 文件夹包含 AI 行为指导规则，通过 front-matter 配置触发方式。

**三种触发方式：**

1. **Always（始终加载）** - 每次对话都自动加载
   ```yaml
   ---
   inclusion: always
   ---
   ```
   - `00-SCENARIO-ROUTER.md` - 场景路由规则
   - `01-OUTPUT-FORMAT.md` - 输出格式规范
   - `02-LANGUAGE-GUIDELINES.md` - 语言使用规范

2. **FileMatch（文件匹配时加载）** - 编辑特定文件时自动加载
   ```yaml
   ---
   inclusion: fileMatch
   fileMatchPattern: "**/*.java"
   ---
   ```
   - `10-JAVA-CHECKLIST.md` - 编辑 *.java 文件时加载
   - `11-CRITICAL-REMINDERS.md` - 编辑 *.java 文件时加载

3. **Manual（手动引用）** - 特殊场景时手动引用
   ```yaml
   ---
   inclusion: manual
   ---
   ```
   用户可在对话中使用 `#文件名` 手动引用

**AI 自动加载规则（按阶段）：**

进入 Spec 流程后，AI 根据当前阶段**自动引用**对应规范，无需用户手动加载：

| 阶段 | 自动加载的规范 | 产出文档 |
|-----|---------------|---------|
| 阶段 1 | `#21-STORY-GUIDELINES` | 01-story.md |
| 阶段 2 | `#22-DOMAIN-ANALYSIS` | 02-domain-analysis.md |
| 阶段 3 | `#23-REQUIREMENTS-GUIDELINES` | 03-requirements.md |
| 阶段 4 | `#24-DOMAIN-MODEL` | 04-domain-model.md |
| 阶段 5 | `#25-FRONTEND-DEMO` | 05-demo/ |
| 阶段 6 | `#28-FSD-GUIDELINES` | 06-fsd/ |
| 阶段 7 | `#26-DESIGN-GUIDELINES` + `#40-API-GUIDELINES` | 07-design.md |
| 阶段 8 | `#27-REPOSITORY-DESIGN` | 08-repository-design.md |
| 阶段 9-11 | `#30-TEST-CASE-GUIDELINES` | 09/10/11-*-test-cases.md |
| 阶段 12 | `#10-JAVA-CHECKLIST` + `#31-UNIT-TEST-GUIDELINES` | 代码实现 |

**场景触发自动加载：**

| 场景 | 自动加载的规范 |
|-----|---------------|
| Bug 修复 | `#33-TROUBLESHOOTING-GUIDE` |
| 任务完成归档 | `#34-TASK-ARCHIVE-GUIDE` |
| 错误处理设计 | `#41-ERROR-CODE-GUIDELINES` |
| E2E 测试执行 | `#32-PLAYWRIGHT-GUIDE` |

**手动引用（仅特殊情况）：**
- 用户可在对话中输入 `#文件名` 强制引用特定规范
- 例如：`#20-TDD-WORKFLOW` 查看完整工作流概览

### 核心原则（始终遵守）

1. **不确定就问** - 宁可多问，禁止猜测
2. **确认后再做** - 得到用户确认才开发
3. **设计阶段不改代码** - 用户明确说只做设计时，只更新设计文档，禁止修改代码文件
4. **复杂任务用任务管理** - 思考、拆分、执行、验证
5. **写代码看规范** - 编辑代码文件时检查相关规范
6. **善用工具** - 数据库查表、API 查规范

### 场景判断规则

**场景 A：需求分析（Spec 流程）**
- 触发词："新功能"、"新需求"、"新模块"、"设计"、"分析"、"规划"、"重构"
- 适用条件：涉及 3 个以上文件改动、需要新建数据库表/API 接口、涉及多个模块
- 执行流程：创建 Spec 目录 -> 按阶段门禁执行 -> 每阶段人工确认

**场景 B：快速修改（直接执行）**
- 触发词："修复"、"修改"、"调整"、"优化"、"改一下"、"加个"、"删掉"
- 适用条件：改动范围明确（1-2 个文件）、不涉及新表/新接口、逻辑简单

**场景 C：Bug 修复**
- 触发词："bug"、"问题"、"报错"、"异常"、"不工作"、"失败"、"错误"
- 执行流程：先定位问题 -> 简单 bug 按场景 B、设计问题按场景 A

### TDD + DDD 开发流程（12阶段门禁）

```
战略设计阶段（理解业务）
  1. Story（用户故事）
  2. Domain Analysis（领域分析）
  3. Requirements（需求规格）

战术设计阶段（领域建模）
  4. Domain Model（领域建模）
  5. Frontend Demo（前端原型）
  6. FSD（前端规格文档）

技术设计阶段（技术实现方案）
  7. Design（技术设计）
  8. Repository Design（仓储设计）

测试设计阶段（测试先行）
  9. E2E Test Cases
  10. Unit Test Cases
  11. API Test Cases

实现阶段（编码实现）
  12. Tasks - 实现 - 测试验证
```

**阶段门禁机制**：
- 每个阶段必须由人工明确确认"通过"后才能进入下一阶段
- 阶段结束时输出自检清单，请求人工审核
- 不允许跳过任何阶段

### 语言使用规范

| 内容类型 | 语言 |
|---------|------|
| AI 回答、解释、建议 | 中文 |
| 变量名、函数名、类名 | 英文 |
| 代码注释 | 英文 |
| Git commit message | 英文 |
| Spec 文档、设计文档、README | 中文 |
| API 文档 | 中文（字段名使用英文）|

专业术语首次出现时，使用「中文（English）」格式：
- 聚合根（Aggregate Root）
- 值对象（Value Object）
- 限界上下文（Bounded Context）

### 问题排查原则

1. **禁止猜测** - 不能根据文档示例、历史记录推断实际配置
2. **先确认再改** - 任何代码修改前必须与用户确认
3. **查实际数据** - 用数据库查询、日志、API 响应验证假设
4. **不确定就问** - 无法验证时直接询问用户
5. **结论验证（反证法）** - 在得出结论前，检查依赖同一配置的其他功能是否正常

### 事后反思流程

代码写完后必须执行全局检查，发现问题立即修复：

1. **全局检查** - 检查所有修改的文件
2. **分析问题** - 问题类型、原因、范围
3. **修复并改进** - 立即修复所有错误，举一反三检查相同问题
4. **更新文档** - 如发现设计问题，更新设计文档

### 不确定时的处理

当无法明确判断场景时，询问用户：

```
这个需求涉及 [改动范围描述]，我建议按以下方式处理：

方式 A - Spec 流程（推荐用于新功能）：
  - 完整的需求分析、设计、测试用例、实现
  - 质量有保障

方式 B - 直接执行（推荐用于小改动）：
  - 快速修改 + 单元测试

请确认处理方式？
```

---

最后更新: [1/17/2026]
版本: 1.5
