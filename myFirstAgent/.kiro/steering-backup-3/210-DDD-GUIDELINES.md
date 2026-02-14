---
inclusion: manual
---

# DDD 领域驱动设计规范

## 概述

本规范定义了 WMS-Lite 项目的领域驱动设计架构规范，包含战略设计和战术设计两个层面。

---

## DDD 两个层面

战略设计（需求分析阶段）：
- 关注点：业务边界、团队协作
- 产出：限界上下文、上下文映射、统一语言

战术设计（详细设计阶段）：
- 关注点：领域模型、代码结构
- 产出：聚合、实体、值对象、领域服务、领域事件

---

## 分层架构

```
Interfaces 接口层（Controller / DTO / Assembler）
    |
Application 应用层（ApplicationService / Command / Query）
    |
Domain 领域层（Entity / ValueObject / Aggregate / DomainService / Repository接口 / DomainEvent）
    |
Infrastructure 基础设施层（RepositoryImpl / Gateway / Config / External）
```

依赖规则：
- 上层可以依赖下层，下层不能依赖上层
- Domain 层是核心，不依赖任何其他层
- Infrastructure 层实现 Domain 层定义的接口

---

## 聚合设计原则

1. 聚合边界 - 一个事务只修改一个聚合
2. 聚合根 - 外部只能通过聚合根访问聚合内对象
3. ID 引用 - 聚合间通过 ID 引用，不直接引用对象
4. 小聚合 - 聚合尽量小，避免大聚合

---

## 实体与值对象

实体（Entity）：
- 具有唯一标识
- 生命周期内标识不变
- 属性可变

值对象（Value Object）：
- 无唯一标识
- 通过属性值判断相等性
- 不可变（使用 record 定义）

---

## 领域服务

使用场景：
- 跨聚合的业务逻辑
- 不属于任何单一实体的操作

```java
public class InventoryDomainService {
    // Cross-aggregate operation
    public void transfer(Inventory from, Inventory to, Quantity quantity) {
        from.decrease(quantity);
        to.increase(quantity);
    }
}
```

---

## 领域事件

核心事件示例：
- InboundOrderCreatedEvent - 入库单创建
- InboundOrderCompletedEvent - 入库单完成
- InventoryChangedEvent - 库存变动
- InventoryWarningEvent - 库存预警

---

## 仓储（Repository）

接口定义在领域层：
```java
public interface InventoryRepository {
    Optional<Inventory> findById(InventoryId id);
    void save(Inventory inventory);
}
```

实现在基础设施层：
```java
@Repository
public class InventoryRepositoryImpl implements InventoryRepository {
    // Implementation
}
```

---

## 应用服务

编排领域对象，处理事务，不包含业务逻辑：

```java
@Service
@Transactional
public class InventoryApplicationService {
    public void inbound(CreateInboundCommand command) {
        // 1. 查找或创建库存
        // 2. 执行领域逻辑
        // 3. 持久化
        // 4. 发布事件
    }
}
```

---

## 对象转换

```
Controller <-> DTO <-> Domain Entity <-> PO <-> Database
              |           |            |
          Assembler   (领域层内部)   Converter
```

---

## 命名规范

聚合根：名词（Inventory、InboundOrder）
实体：名词（InboundOrderLine）
值对象：名词 record（Quantity、ItemCode）
领域服务：名词 + DomainService（InventoryDomainService）
应用服务：名词 + ApplicationService（InventoryApplicationService）
仓储接口：名词 + Repository（InventoryRepository）
仓储实现：名词 + RepositoryImpl（InventoryRepositoryImpl）
命令对象：动词 + 名词 + Command（CreateInboundCommand）
领域事件：名词 + 动词过去式 + Event（InventoryChangedEvent）
DTO：名词 + Request/Response（InboundRequest）
PO：名词 + PO（InventoryPO）

---

## 注意事项

战略设计：
1. 统一语言 - 团队必须使用一致的业务术语
2. 上下文边界 - 明确每个上下文的职责边界
3. 防腐层 - 与外部系统集成时使用防腐层隔离

战术设计：
1. 领域层纯净 - Domain 层不依赖 Spring、MyBatis 等框架
2. 聚合边界 - 一个事务只修改一个聚合
3. 值对象不可变 - 使用 record 或 final 字段
4. 贫血模型禁止 - 业务逻辑放在领域对象中，不是 Service
5. 仓储只操作聚合根 - 不直接操作聚合内部实体
6. 领域事件解耦 - 跨聚合通信使用领域事件
