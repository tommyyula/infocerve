---
inclusion: fileMatch
fileMatchPattern: "**/requirements.md,**/design.md"
---

# 📋 Kiro Spec 文件规范

> **触发条件**：编辑 requirements.md 或 design.md 时自动加载
> **核心原则**：Kiro spec 只管理需求和设计文档，任务执行由 task-manager 管理

---

## 🔴 重要提醒

```
❌ 禁止使用 Kiro spec 的 tasks.md
✅ 任务管理使用 task-manager (split_tasks, execute_task, verify_task)
✅ 设计文档跟随 task-manager 思考结果，不能自作主张
```

---

## 📝 requirements.md 编写规范

### 内容要求
- 用户原始需求描述
- 需求澄清过程中的问答记录
- 最终确认的需求范围
- 约束条件和边界

### 编写流程
1. 使用 `research_mode + process_thought` 深度理解需求
2. 与用户反复确认，直到达成共识
3. 将共识记录到 requirements.md

---

## 📝 design.md 编写规范

### 内容要求
- 技术方案概述
- 核心设计思路（不追求完美代码）
- 关键决策和理由
- 不确定的地方（标注待确认）

### 编写流程
1. 基于 requirements.md 进行技术分析
2. 使用 `research_mode + process_thought` 探索方案
3. 与用户确认设计方向
4. 记录设计共识

---

*设计阶段的具体原则见 `02-DESIGN-RULES.md`（编辑 design.md 时自动加载）*
*最后更新：2025-12-23*
