# 需求规格编写规范（Requirements Guidelines）

## 概述

本规范定义了需求规格（Requirements）的编写标准，使用 EARS（Easy Approach to Requirements Syntax）模式确保需求清晰、可测试。

### 相关规范

- **用户故事规范**：参见 `story-guidelines.md`
- **领域分析规范**：参见 `domain-analysis-guidelines.md`
- **TDD 工作流程**：参见 `test-driven-development-workflow.md`

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

引用 `domain-analysis.md` 中的统一语言，列出核心术语。

---

## 需求列表

### 需求 1：{需求标题}

**用户故事**：Story X
**限界上下文**：{上下文名称}
**业务规则**：BR-XXX-001, BR-XXX-002

#### 验收标准

1. WHEN {触发条件} THEN THE {系统} SHALL {响应}
2. IF {异常条件} THEN THE {系统} SHALL {处理}
3. WHILE {状态条件} THE {系统} SHALL {行为}
```

---

## EARS 模式

### 1. 基本模式

| 模式 | 格式 | 适用场景 |
|-----|------|---------|
| 无条件 | THE {系统} SHALL {响应} | 系统始终执行的行为 |
| 事件驱动 | WHEN {事件} THE {系统} SHALL {响应} | 由事件触发的行为 |
| 状态驱动 | WHILE {状态} THE {系统} SHALL {响应} | 在特定状态下的行为 |
| 条件驱动 | IF {条件} THEN THE {系统} SHALL {响应} | 满足条件时的行为 |
| 可选功能 | WHERE {功能启用} THE {系统} SHALL {响应} | 可配置的功能 |

### 2. 复合模式

```
WHEN {事件} IF {条件} THEN THE {系统} SHALL {响应}
WHILE {状态} WHEN {事件} THE {系统} SHALL {响应}
```

### 3. 示例

```markdown
#### 验收标准

1. WHEN 收货员扫描 SSCC 条码 THEN THE Receipt_System SHALL 查询并显示关联的 ASN 信息
2. IF SSCC 已被收货 THEN THE Receipt_System SHALL 拒绝重复收货并提示"该 SSCC 已收货"
3. WHILE 收货单状态为"草稿" THE Receipt_System SHALL 允许修改收货明细
4. WHERE 系统配置允许超收 THE Receipt_System SHALL 接受超过计划数量的收货
```

---

## 编写规则

### 1. 系统命名

使用统一语言中定义的系统名称，格式为 `{系统名}_System`。

```
✅ 正确：Receipt_System、Inventory_System、Task_System
❌ 错误：系统、the system、it
```

### 2. 动词使用

| 动词 | 含义 | 示例 |
|-----|------|------|
| SHALL | 必须（强制要求） | THE System SHALL validate... |
| SHOULD | 应该（推荐） | THE System SHOULD log... |
| MAY | 可以（可选） | THE System MAY cache... |

### 3. 可测试性

每条验收标准必须可测试：

```
✅ 可测试：WHEN 收货数量超过计划数量110% THEN THE System SHALL 拒绝并提示"超出计划数量"
❌ 不可测试：THE System SHALL 快速响应（"快速"不可量化）
```

### 4. 关联性

每个需求必须关联：
- 用户故事（Story）
- 限界上下文（Bounded Context）
- 业务规则（Business Rule）

---

## 需求分类

### 1. 功能需求

描述系统应该做什么。

```markdown
### 需求 1：创建收货单

**用户故事**：Story 1
**限界上下文**：收货上下文
**业务规则**：BR-RCV-001

#### 验收标准

1. WHEN 仓库管理员选择来源单据并确认 THEN THE Receipt_System SHALL 创建收货单并生成单号
2. WHEN 收货单创建成功 THEN THE Receipt_System SHALL 显示收货单详情页面
```

### 2. 数据需求

描述数据的校验和处理规则。

```markdown
### 需求 2：收货数量校验

**用户故事**：Story 2
**限界上下文**：收货上下文
**业务规则**：BR-RCV-010, BR-RCV-011

#### 验收标准

1. WHEN 收货员录入收货数量 THEN THE Receipt_System SHALL 校验数量是否在容差范围内
2. IF 收货数量超出容差范围 THEN THE Receipt_System SHALL 根据配置决定是否允许超收
```

### 3. 界面需求

描述用户界面的行为。

```markdown
### 需求 3：收货任务列表

**用户故事**：Story 5
**限界上下文**：收货上下文

#### 验收标准

1. WHEN 收货员打开任务列表 THEN THE Task_System SHALL 显示分配给该用户的待执行任务
2. WHEN 显示任务列表 THEN THE Task_System SHALL 按优先级和创建时间排序
```

### 4. 接口需求

描述系统间的交互。

```markdown
### 需求 4：库存更新

**用户故事**：Story 6
**限界上下文**：收货上下文、库存上下文

#### 验收标准

1. WHEN 收货单完成 THEN THE Receipt_System SHALL 发布 ReceiptCompletedEvent
2. WHEN Inventory_System 收到 ReceiptCompletedEvent THEN THE Inventory_System SHALL 增加对应库位的库存
```

### 5. 配置需求

描述可配置的功能。

```markdown
### 需求 5：收货配置

**用户故事**：Story 14
**限界上下文**：收货上下文

#### 验收标准

1. WHERE 配置收货容差 THE Config_System SHALL 支持按物料、供应商、全局三个层级配置
2. WHERE 配置超收规则 THE Config_System SHALL 支持设置是否允许超收及超收上限
```

---

## 需求编号规范

```
需求 {序号}：{需求标题}

序号从 1 开始递增
标题简洁明了，描述需求的核心内容
```

---

## 检查清单

### 格式检查
- [ ] 每个需求有唯一编号和标题
- [ ] 关联了用户故事
- [ ] 关联了限界上下文
- [ ] 关联了业务规则（如有）

### 内容检查
- [ ] 使用 EARS 模式编写验收标准
- [ ] 系统名称使用统一语言
- [ ] 每条验收标准可测试
- [ ] 覆盖正常流程和异常流程

### 完整性检查
- [ ] 覆盖所有用户故事的验收标准
- [ ] 覆盖所有业务规则
- [ ] 包含必要的数据校验需求
- [ ] 包含必要的界面需求
- [ ] 包含必要的接口需求

---

## 常见问题

### Q: 一个需求应该包含多少条验收标准？
A: 通常 3-8 条。太少可能遗漏场景，太多说明需求太大需要拆分。

### Q: 如何处理跨上下文的需求？
A: 在"限界上下文"字段列出所有涉及的上下文，验收标准中明确指出各系统的职责。

### Q: 验收标准和测试用例的关系？
A: 验收标准是测试用例的来源，每条验收标准应该对应一个或多个测试用例。

---

## 下一步

完成 `requirements.md` 后，进入领域建模阶段，编写 `domain-model.md`。
