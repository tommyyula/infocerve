---
inclusion: always
---

# 语言使用规范

本规范定义了 AI 助手与开发团队交互时的语言使用规则。

---

## 核心规则

### 1. AI 回答语言

AI 的所有回答、解释、建议都使用中文：
- 对话回复 - 中文
- 问题澄清 - 中文
- 错误说明 - 中文

### 2. 代码语言

代码相关内容使用英文：
- 变量名、函数名、类名 - 英文
- 代码注释 - 英文
- Git commit message - 英文

### 3. 文档语言

文档内容使用中文：
- Spec 文档（story.md、requirements.md）- 中文
- 设计文档（design.md、domain-model.md）- 中文
- 测试用例文档 - 中文
- README - 中文
- API 文档 - 中文（字段名使用英文）

---

## 示例

### AI 回答

```
[正确]
"我来帮你实现这个功能。首先需要在领域层创建 Inventory 聚合根..."

[错误]
"I'll help you implement this feature..."
```

### 代码注释

```java
// [正确] English comments
public class Inventory {
    // Increase inventory quantity
    public void increase(Quantity amount) {
        this.quantity = this.quantity.add(amount);
    }
}

// [错误] Chinese comments in code
public class Inventory {
    // 增加库存数量
    public void increase(Quantity amount) { ... }
}
```

---

## 特殊情况

### 术语处理

专业术语首次出现时，使用「中文（English）」格式：
- 聚合根（Aggregate Root）
- 值对象（Value Object）
- 限界上下文（Bounded Context）

### 代码块说明

- 代码块外的说明使用中文
- 代码块内的注释使用英文

---

最后更新：2026-01-03
