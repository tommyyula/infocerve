---
inclusion: fileMatch
fileMatchPattern: "**/domain/**/*.java,**/application/**/*.java"
---

# 🎯 DDD 充血模型检查清单

---

## 🔴 核心原则

| 层 | 应该做 | 禁止做 |
|---|--------|--------|
| **Domain** | 业务逻辑、状态转换、规则验证 | 依赖基础设施、框架注解 |
| **Application** | 协调领域对象、管理事务、转换DTO | 包含业务逻辑 |

---

## 🔴 实体设计检查

```
写 Domain 实体时必须检查：
□ 1. 是否包含业务行为方法？（不只是 getter/setter）
□ 2. 状态转换是否通过业务方法？（不直接 setStatus）
□ 3. 是否有工厂方法创建实体？
□ 4. 内部集合是否返回只读视图？
```

### ❌ 贫血模型（错误）
```java
public class Order {
    private OrderStatus status;
    public void setStatus(OrderStatus status) { this.status = status; }
}

// Service 层包含业务逻辑
order.setStatus(OrderStatus.CONFIRMED);  // 直接修改状态
```

### ✅ 充血模型（正确）
```java
public class Order {
    private OrderStatus status;
    
    public void confirm() {
        if (this.status != OrderStatus.CREATED) {
            throw new IllegalStateException("状态错误");
        }
        this.status = OrderStatus.CONFIRMED;
    }
}

// Service 层只协调
order.confirm();  // 调用业务方法
```

---

## 🔴 Application Service 检查

```
写 Application Service 时必须检查：
□ 1. 是否只协调领域对象？（不包含业务逻辑）
□ 2. 是否调用领域对象的方法？（不直接修改状态）
□ 3. 业务规则验证是否在领域层？
```

### ❌ 错误
```java
// 业务逻辑在 Application Service
if (order.getStatus() != OrderStatus.CREATED) { throw ... }
order.setStatus(OrderStatus.CONFIRMED);
```

### ✅ 正确
```java
// Application Service 只协调
Order order = orderRepository.findById(orderId);
order.confirm();  // 业务逻辑在领域对象
orderRepository.update(order);
```

---

## 🔵 聚合设计要点

- 一个聚合只有一个聚合根
- 聚合之间通过 ID 引用，不直接持有对象
- 聚合根控制对内部对象的访问
- 内部集合返回 `Collections.unmodifiableList()`

---

*详细示例见完整版 DDD 指南*
*最后更新：2025-12-22*
