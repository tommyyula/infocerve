# Spec-Driven 开发模式

当我说 "spec mode" 或 "规格模式" 时，请按以下流程工作：

## Phase 1: Requirements (需求)
创建 `specs/requirements.md`：
- 背景和目标
- 用户角色定义
- 功能需求（用 EARS 语法）
- 非功能需求
- 约束和假设

## Phase 2: Design (设计)
创建 `specs/design.md`：
- 架构概览（用 Mermaid 图）
- 组件设计
- 数据流
- 接口定义
- 错误处理策略

## Phase 3: Tasks (任务)
创建 `specs/tasks.md`：
- [ ] 任务1 - 描述 (预估: Xh)
- [ ] 任务2 - 描述 (预估: Xh)
...

## Phase 4: Implementation (实现)
只有在我明确说 "开始编码" 或 "proceed" 后才执行任务。
每完成一个任务，更新 tasks.md 的复选框。
