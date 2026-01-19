---
inclusion: manual
---

# TDD 工作流程（测试驱动开发）

## 概述

本规范定义了结合 DDD（领域驱动设计）和 TDD（测试驱动开发）的完整开发流程。

相关规范：
- DDD 架构规范：#210-DDD-GUIDELINES
- 技术栈规范：#230-TECH-STACK

---

## 开发流程（11 阶段）

```
战略设计阶段
├── 1. Story（用户故事）      -> #110-STORY-GUIDELINES
├── 2. Domain Analysis（领域分析）-> #120-DOMAIN-ANALYSIS
└── 3. Requirements（需求规格）  -> #130-REQUIREMENTS

战术设计阶段
├── 4. Domain Model（领域建模）  -> #140-DOMAIN-MODEL
└── 5. Frontend Demo（前端原型） -> #320-DEMO-GUIDELINES

技术设计阶段
├── 6. Design（技术设计）       -> #150-DESIGN-GUIDELINES
└── 7. Database Design（数据库设计）-> #220-DATABASE-DESIGN

测试设计阶段
├── 8. E2E Test Cases         -> #400-TEST-CASE-DESIGN
├── 9. Unit Test Cases        -> #410-UNIT-TEST
└── 10. API Test Cases        -> #400-TEST-CASE-DESIGN

实现阶段
└── 11. Tasks（实现任务）       -> #200-JAVA-CHECKLIST
```

---

## 核心原则

1. 领域优先 - 先理解业务领域，再考虑技术实现
2. 测试先行 - 先定义测试用例，再实现功能
3. 持续验证 - 每完成一个功能立即运行测试
4. 统一语言 - 团队使用一致的业务术语
5. 关注点分离 - 每个阶段专注于自己的职责，不越界
6. 延迟技术决策 - 技术细节尽可能延迟到后面的阶段

---

## 关注点分离原则

各阶段抽象层次：

业务层（Business Layer）：
- 阶段 1 Story：业务视角，用户价值，Given-When-Then 格式
- 阶段 2 Domain Analysis：业务概念，统一语言，领域边界

需求层（Requirements Layer）：
- 阶段 3 Requirements：系统视角，EARS 模式，可测试需求

设计层（Design Layer）：
- 阶段 4 Domain Model：业务概念和约束（不涉及技术类型）
- 阶段 5 Frontend Demo：可交互原型，验证业务流程
- 阶段 6 Design：架构和 API 设计（不涉及数据库实现）
- 阶段 7 Database Design：唯一定义具体数据类型的地方

测试层（Testing Layer）：
- 阶段 8 E2E Test Cases：端到端业务流程验证
- 阶段 9 Unit Test Cases：领域逻辑和业务规则验证
- 阶段 10 API Test Cases：接口正确性验证

实现层（Implementation Layer）：
- 阶段 11 Tasks：可执行的开发任务

关键原则：
- 抽象层次递进：从业务概念 -> 系统需求 -> 技术设计 -> 测试验证 -> 代码实现
- 互补而非冗余：所有阶段都是互补关系，每个阶段有独特价值
- 技术细节下沉：业务层和需求层不涉及技术实现细节

---

## AI 角色总览

阶段 1 Story - 业务分析师：理解业务需求，定义用户故事
阶段 2 Domain Analysis - 领域专家/DDD 战略设计师：识别领域边界，定义统一语言
阶段 3 Requirements - 需求工程师：编写精确可测试的需求规格
阶段 4 Domain Model - DDD 战术设计师：设计聚合、实体、值对象
阶段 5 Frontend Demo - UX 设计师：设计交互原型，验证业务流程
阶段 6 Design - 解决方案架构师：设计技术实现方案
阶段 7 Database Design - 数据库架构师：设计数据库结构
阶段 8-10 Test Cases - 质量保证工程师：设计全面的测试用例
阶段 11 Tasks - 技术负责人：分解可执行的开发任务

---

## 阶段门禁机制

核心原则：
1. 人工确认 - 每个阶段必须由人工明确确认"通过"后才能进入下一阶段
2. 质量优先 - 不允许跳过任何阶段，不允许带着问题进入下一阶段
3. 可追溯 - 每个阶段的确认状态记录在 progress.md 中

AI 行为规范：

阶段开始时：
1. 检查 progress.md，确认上一阶段状态为"已通过"
2. 如果上一阶段未通过，拒绝开始当前阶段
3. 宣布当前角色："我现在以 {角色名称} 的身份开始阶段 N"

阶段结束时：
1. 完成阶段产出文档
2. 进行自检，输出检查清单和自检结果
3. 请求人工审核
4. 等待人工确认，不主动进入下一阶段

---

## Spec 文档结构

[重要] 阶段文档使用数字前缀命名，与阶段编号对应

```
.kiro/specs/{feature-name}/
├── 01-story.md                 # 1. 用户故事
├── 02-domain-analysis.md       # 2. 领域分析
├── 03-requirements.md          # 3. 需求规格
├── 04-domain-model.md          # 4. 领域建模
├── 05-frontend-demo.md         # 5. 前端原型说明
├── demo/                       # 5. 前端原型文件
│   ├── index.html              #    PC端 Demo
│   └── mobile.html             #    手持端 Demo
├── 06-design.md                # 6. 技术设计（内嵌 PlantUML）
├── diagrams/                   # 6. PlantUML 独立文件（见 #151-PLANTUML-GUIDELINES）
│   ├── 01-system-architecture.puml
│   ├── 02-xxx-sequence.puml
│   ├── 03-xxx-activity.puml
│   ├── 04-xxx-class.puml
│   ├── 05-xxx-state.puml
│   └── ...
├── 07-database-design.md       # 7. 数据库设计
├── 08-e2e-test-cases.md        # 8. E2E 测试用例
├── 09-unit-test-cases.md       # 9. 单元测试用例
├── 10-api-test-cases.md        # 10. API 测试用例
├── 11-tasks.md                 # 11. 实现任务（仅用于记录，不用于执行）
└── progress.md                 # 进度状态（无前缀）
```

[重要] tasks.md 仅用于记录任务清单，实际任务执行使用 task-manager MCP

---

## 测试覆盖率要求

领域层单元测试：行覆盖率 >= 90%，分支覆盖率 >= 85%
应用层单元测试：行覆盖率 >= 80%，分支覆盖率 >= 75%
API 测试：行覆盖率 >= 90%
E2E 测试：核心流程 100%

---

## 注意事项

1. 领域优先 - 先完成领域分析和建模，再考虑技术实现
2. 统一语言 - 团队必须使用一致的业务术语
3. 聚合边界 - 一个事务只修改一个聚合
4. 测试先行 - 先写测试用例文档，再实现功能
5. 分层实现 - 按 Domain -> Application -> Infrastructure -> Interfaces 顺序实现
