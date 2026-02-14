---
inclusion: manual
---

# 需求规格编写规范（Requirements Guidelines）

## 概述

本规范定义了需求规格的编写标准，使用 EARS 模式确保需求清晰、可测试。

---

## 文件位置

```
.kiro/specs/{feature-name}/requirements.md
```

---

## 模板结构

```markdown
# {功能名称} - 需求规格

## 术语表
引用 domain-analysis.md 中的统一语言

## 需求列表

### 需求 1：{需求标题}

**用户故事**：Story X
**限界上下文**：{上下文名称}
**业务规则**：BR-XXX-001, BR-XXX-002

#### 验收标准
1. WHEN {触发条件} THEN THE {系统} SHALL {响应}
2. IF {异常条件} THEN THE {系统} SHALL {处理}
```

---

## EARS 模式

### 基本模式

无条件：
THE {系统} SHALL {响应}
适用场景：系统始终执行的行为

事件驱动：
WHEN {事件} THE {系统} SHALL {响应}
适用场景：由事件触发的行为

状态驱动：
WHILE {状态} THE {系统} SHALL {响应}
适用场景：在特定状态下的行为

条件驱动：
IF {条件} THEN THE {系统} SHALL {响应}
适用场景：满足条件时的行为

可选功能：
WHERE {功能启用} THE {系统} SHALL {响应}
适用场景：可配置的功能

### 复合模式

```
WHEN {事件} IF {条件} THEN THE {系统} SHALL {响应}
WHILE {状态} WHEN {事件} THE {系统} SHALL {响应}
```

### 示例

```markdown
1. WHEN 收货员扫描 SSCC 条码 THEN THE Receipt_System SHALL 查询并显示关联的 ASN 信息
2. IF SSCC 已被收货 THEN THE Receipt_System SHALL 拒绝重复收货并提示"该 SSCC 已收货"
3. WHILE 收货单状态为"草稿" THE Receipt_System SHALL 允许修改收货明细
4. WHERE 系统配置允许超收 THE Receipt_System SHALL 接受超过计划数量的收货
```

---

## 编写规则

### 1. 系统命名

使用统一语言中定义的系统名称，格式为 {系统名}_System。

正确：Receipt_System、Inventory_System、Task_System
错误：系统、the system、it

### 2. 动词使用

- SHALL - 必须（强制要求）
- SHOULD - 应该（推荐）
- MAY - 可以（可选）

### 3. 可测试性

每条验收标准必须可测试：

可测试：WHEN 收货数量超过计划数量110% THEN THE System SHALL 拒绝并提示"超出计划数量"
不可测试：THE System SHALL 快速响应（"快速"不可量化）

### 4. 关联性

每个需求必须关联：
- 用户故事（Story）
- 限界上下文（Bounded Context）
- 业务规则（Business Rule）

---

## 需求分类

### 功能需求
描述系统应该做什么。

### 数据需求
描述数据的校验和处理规则。

### 界面需求
描述用户界面的行为。

### 接口需求
描述系统间的交互。

### 配置需求
描述可配置的功能。

---

## 检查清单

格式检查：
- [ ] 每个需求有唯一编号和标题
- [ ] 关联了用户故事
- [ ] 关联了限界上下文
- [ ] 关联了业务规则（如有）

内容检查：
- [ ] 使用 EARS 模式编写验收标准
- [ ] 系统名称使用统一语言
- [ ] 每条验收标准可测试
- [ ] 覆盖正常流程和异常流程

完整性检查：
- [ ] 覆盖所有用户故事的验收标准
- [ ] 覆盖所有业务规则
- [ ] 包含必要的数据校验需求
- [ ] 包含必要的界面需求
- [ ] 包含必要的接口需求

---

## 常见问题

Q: 一个需求应该包含多少条验收标准？
A: 通常 3-8 条。太少可能遗漏场景，太多说明需求太大需要拆分。

Q: 如何处理跨上下文的需求？
A: 在"限界上下文"字段列出所有涉及的上下文，验收标准中明确指出各系统的职责。

Q: 验收标准和测试用例的关系？
A: 验收标准是测试用例的来源，每条验收标准应该对应一个或多个测试用例。

---

## 下一步

完成 requirements.md 后，进入领域建模阶段，编写 domain-model.md。

---

最后更新：2026-01-03
