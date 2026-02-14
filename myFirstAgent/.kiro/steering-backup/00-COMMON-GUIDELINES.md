# 🎯 Kiro AI 核心原则

> **一句话**：先判断场景，不确定就问，遵守规范

---

## 🔍 场景判断（每次对话首先判断）

| 场景 | 判断标准 | 行为 |
|------|----------|------|
| **复杂开发** | 需求讨论、设计评审、功能开发 | 见下方完整流程 |
| **元任务** | 优化steering、管理任务、归档 | research_mode → process_thought → 迭代 |

**说明**：所有任务都需要留痕，通过 task-manager 管理。

---

## 🔴 复杂开发流程（3阶段）

```
阶段1：需求澄清 → research_mode + process_thought → 记录到 Kiro spec
阶段2：执行开发 → plan → analyze → reflect → split_tasks → execute → verify(≥80分)
阶段3：迭代反馈 → split_tasks(append) 追加任务 → 继续执行
```

**关键点**：
- ❌ 禁止使用 Kiro spec 的 tasks.md（任务由 task-manager 管理）
- ✅ 设计共识记录到 Kiro spec 的 requirements.md + design.md

---

## 🔴 核心原则（始终遵守）

1. **不确定就问** - 宁可多问，禁止猜测
2. **确认后再做** - 得到用户确认才开发
3. **设计阶段不改代码** - 用户明确说只做设计时，只更新设计文档，禁止修改代码文件
4. **复杂任务用 task-manager** - 思考(research_mode)、拆分(split)、执行(execute)、验证(verify)
5. **写代码看规范** - 自动加载 `03-JAVA-CHECKLIST`
6. **善用 MCP 工具** - 数据库查表、API查规范（见下方）

---

## 🛠️ MCP 工具（开发时主动使用）

| 类型 | 识别特征 | 用途 |
|------|----------|------|
| 数据库 | `*mysql_query`、`*db*` | 查表结构、验证数据 |
| API文档 | `*api*fox*`、`*oas*` | 查接口规范 |

---

*最后更新：2025-12-23*
