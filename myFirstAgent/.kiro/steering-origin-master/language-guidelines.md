---
inclusion: always
title: 语言使用规范
---

# 语言使用规范（Language Guidelines）

## 概述

本规范定义了 AI 助手与开发团队交互时的语言使用规则，确保沟通高效、文档易于 review。

---

## 核心规则

### 1. AI 回答语言

| 场景 | 语言 | 说明 |
|-----|------|------|
| 对话回复 | **中文** | AI 的所有回答、解释、建议都使用中文 |
| 问题澄清 | **中文** | 向用户确认需求时使用中文 |
| 错误说明 | **中文** | 解释错误原因和修复方案时使用中文 |

### 2. 代码语言

| 场景 | 语言 | 说明 |
|-----|------|------|
| 代码 | **英文** | 变量名、函数名、类名等使用英文 |
| 代码注释 | **英文** | 代码内的注释使用英文 |
| 提交信息 | **英文** | Git commit message 使用英文 |

### 3. 文档语言

| 场景 | 语言 | 说明 |
|-----|------|------|
| Spec 文档 | **中文** | story.md、requirements.md 等使用中文 |
| 设计文档 | **中文** | design.md、domain-model.md 使用中文 |
| 测试用例文档 | **中文** | e2e-test-cases.md、unit-test-cases.md 使用中文 |
| README | **中文** | 项目说明文档使用中文 |
| API 文档 | **中文** | 接口说明使用中文，字段名使用英文 |

---

## 示例

### AI 回答示例

```
✅ 正确：
"我来帮你实现这个功能。首先需要在领域层创建 Inventory 聚合根..."

❌ 错误：
"I'll help you implement this feature. First we need to create..."
```

### 代码注释示例

```java
// ✅ Correct: English comments
public class Inventory {
    // Increase inventory quantity
    public void increase(Quantity amount) {
        this.quantity = this.quantity.add(amount);
    }
}

// ❌ Wrong: Chinese comments
public class Inventory {
    // 增加库存数量
    public void increase(Quantity amount) {
        this.quantity = this.quantity.add(amount);
    }
}
```

### 文档示例

```markdown
# ✅ 正确：中文文档

## 需求 1：创建入库单
**用户故事**：Story 1
**限界上下文**：入库上下文

### 验收标准
1. WHEN 仓库管理员提交入库单 THEN 系统 SHALL 创建入库单
```

---

## 特殊情况

### 术语处理

- 专业术语首次出现时，使用「中文（English）」格式
- 例如：聚合根（Aggregate Root）、值对象（Value Object）

### 代码块中的说明

- 代码块外的说明使用中文
- 代码块内的注释使用英文

```java
// 下面是库存增加的实现（中文说明在代码块外）

public void increase(Quantity amount) {
    // Validate amount is positive (英文注释在代码块内)
    if (amount.isNegative()) {
        throw new IllegalArgumentException("Amount must be positive");
    }
    this.quantity = this.quantity.add(amount);
}
```

---

## 检查清单

- [ ] AI 回答使用中文
- [ ] 代码使用英文
- [ ] 代码注释使用英文
- [ ] Spec 文档使用中文
- [ ] 设计文档使用中文
- [ ] 测试用例文档使用中文
