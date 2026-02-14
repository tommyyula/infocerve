---
inclusion: manual
title: DDD 领域驱动设计规范
---

# DDD 领域驱动设计规范

## 概述

本规范定义了 WMS-Lite 项目的领域驱动设计（Domain-Driven Design）架构规范，包含战略设计和战术设计两个层面。

### 相关规范

- **开发工作流程**：参见 `test-driven-development-workflow.md`
- **技术架构规范**：参见 `tech-stack.md`

---

## DDD 两个层面

| 层面 | 阶段 | 关注点 | 产出 |
|-----|------|--------|------|
| **战略设计** | 需求分析 | 业务边界、团队协作 | 限界上下文、上下文映射、统一语言 |
| **战术设计** | 详细设计 | 领域模型、代码结构 | 聚合、实体、值对象、领域服务、领域事件 |

---

# 第一部分：战略设计

## 1. 统一语言（Ubiquitous Language）

### 1.1 什么是统一语言

统一语言是团队（开发、产品、业务）共同使用的业务术语，确保沟通无歧义。

### 1.2 WMS 统一语言表

| 中文术语 | 英文 | 定义 |
|---------|------|------|
| 物料 | Item | 仓库管理的最小单位，具有唯一编码 |
| 库存 | Inventory | 某物料在某库位的数量 |
| 库位 | Location | 仓库中存放物料的具体位置 |
| 入库单 | Inbound Order | 记录物料入库的单据 |
| 出库单 | Outbound Order | 记录物料出库的单据 |
| 收货 | Receipt | 入库单执行过程中的实际收货动作 |
| 拣货 | Picking | 出库单执行过程中的实际拣货动作 |
| 盘点 | Stock Take | 核对实际库存与系统库存的过程 |
| 批次 | Batch/Lot | 同一批次生产或入库的物料标识 |
| 库存变动 | Inventory Transaction | 库存数量发生变化的记录 |

### 1.3 统一语言规则

1. **代码中使用英文术语**：类名、方法名、变量名使用统一语言的英文
2. **文档中使用中文术语**：需求、设计文档使用统一语言的中文
3. **禁止自造术语**：不使用统一语言表之外的术语
4. **术语表持续更新**：发现新术语时更新统一语言表

---

## 2. 领域分类

### 2.1 核心域（Core Domain）

核心竞争力所在，需要重点投入。

| 领域 | 说明 | 投入策略 |
|-----|------|---------|
| 库存管理 | 实时库存、库存预警、库存分析 | 自研，精细设计 |
| 入库管理 | 入库流程、收货、上架 | 自研，精细设计 |
| 出库管理 | 出库流程、拣货、发货 | 自研，精细设计 |

### 2.2 支撑域（Supporting Domain）

支持核心域运作，但不是核心竞争力。

| 领域 | 说明 | 投入策略 |
|-----|------|---------|
| 基础数据 | 物料、仓库、库位、供应商 | 自研，标准设计 |
| 报表统计 | 库存报表、出入库统计 | 自研，标准设计 |

### 2.3 通用域（Generic Domain）

可以使用通用方案或外购。

| 领域 | 说明 | 投入策略 |
|-----|------|---------|
| 用户认证 | 登录、权限、角色 | 使用成熟方案 |
| 消息通知 | 邮件、短信、推送 | 使用第三方服务 |
| 文件存储 | 附件、图片 | 使用云存储 |

---

## 3. 限界上下文（Bounded Context）

### 3.1 上下文划分

```
┌─────────────────────────────────────────────────────────────────┐
│                        WMS-Lite 系统                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   基础数据上下文  │   库存上下文     │                             │
│  (Master Data)  │  (Inventory)    │                             │
│                 │                 │                             │
│  - Item         │  - Inventory    │                             │
│  - Warehouse    │  - StockTake    │                             │
│  - Location     │                 │                             │
│  - Supplier     │                 │                             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│   入库上下文     │   出库上下文     │   用户上下文（通用域）        │
│  (Inbound)      │  (Outbound)     │  (Identity)                 │
│                 │                 │                             │
│  - InboundOrder │  - OutboundOrder│  - User                     │
│  - Receipt      │  - Picking      │  - Role                     │
│                 │  - Shipment     │  - Permission               │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 3.2 上下文职责

| 上下文 | 职责 | 核心聚合 | 团队 |
|-------|------|---------|------|
| 基础数据 | 物料、仓库、库位的增删改查 | Item, Warehouse | 全栈 |
| 库存 | 库存查询、盘点、库存变动记录 | Inventory | 全栈 |
| 入库 | 入库单管理、收货、上架 | InboundOrder | 全栈 |
| 出库 | 出库单管理、拣货、发货 | OutboundOrder | 全栈 |
| 用户 | 认证、授权、用户管理 | User | 全栈 |

### 3.3 上下文映射（Context Map）

```
                    ┌─────────────────┐
                    │   基础数据上下文  │
                    │  (Master Data)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │ OHS          │ OHS          │ OHS
              ↓              ↓              ↓
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   入库上下文     │ │   库存上下文     │ │   出库上下文     │
    │  (Inbound)      │ │  (Inventory)    │ │  (Outbound)     │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   ↑                   │
             │      U/D          │       U/D         │
             └───────────────────┴───────────────────┘
                                 │
                                 │ ACL
                                 ↓
                    ┌─────────────────┐
                    │    ERP 系统     │
                    │   (外部系统)    │
                    └─────────────────┘
```

### 3.4 上下文关系类型

| 关系类型 | 缩写 | 说明 | 示例 |
|---------|------|------|------|
| 合作关系 | Partnership | 两个上下文紧密合作，共同演进 | - |
| 共享内核 | SK | 共享部分模型代码 | - |
| 客户-供应商 | U/D | 下游依赖上游，上游需考虑下游需求 | 入库→库存 |
| 遵奉者 | Conformist | 下游完全遵从上游模型 | - |
| 防腐层 | ACL | 隔离外部系统，转换模型 | WMS→ERP |
| 开放主机服务 | OHS | 提供标准化 API 供多方使用 | 基础数据→其他 |
| 发布语言 | PL | 定义标准的数据交换格式 | - |

---

## 4. 事件风暴（Event Storming）

### 4.1 核心流程：入库

```
[命令]              [事件]                [策略]
创建入库单    →    入库单已创建      →    通知仓库准备
    ↓
确认入库单    →    入库单已确认      →    生成收货任务
    ↓
执行收货      →    收货完成          →    更新库存
    ↓
完成入库      →    入库单已完成      →    记录日志、通知
```

### 4.2 核心流程：出库

```
[命令]              [事件]                [策略]
创建出库单    →    出库单已创建      →    校验库存
    ↓
确认出库单    →    出库单已确认      →    生成拣货任务
    ↓
执行拣货      →    拣货完成          →    锁定库存
    ↓
执行发货      →    发货完成          →    扣减库存
    ↓
完成出库      →    出库单已完成      →    记录日志、通知
```

---

# 第二部分：战术设计

## 5. 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Interfaces 接口层                         │
│              (Controller / DTO / Assembler)                 │
├─────────────────────────────────────────────────────────────┤
│                   Application 应用层                         │
│                (ApplicationService / Command / Query)        │
├─────────────────────────────────────────────────────────────┤
│                     Domain 领域层                            │
│    (Entity / ValueObject / Aggregate / DomainService /      │
│     Repository接口 / DomainEvent)                           │
├─────────────────────────────────────────────────────────────┤
│                 Infrastructure 基础设施层                    │
│      (RepositoryImpl / Gateway / Config / External)         │
└─────────────────────────────────────────────────────────────┘
```

### 依赖规则

- 上层可以依赖下层，下层不能依赖上层
- Domain 层是核心，不依赖任何其他层
- Infrastructure 层实现 Domain 层定义的接口

---

## 6. 聚合设计

### 6.1 WMS 核心聚合

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Warehouse    │     │      Item       │     │   Inventory     │
│    仓库聚合      │     │    物料聚合      │     │    库存聚合      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ - Warehouse     │     │ - Item          │     │ - Inventory     │
│ - Location      │     │ - ItemCode      │     │ - Quantity      │
│ - Zone          │     │ - Category      │     │ - Batch         │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   InboundOrder      │     │   OutboundOrder     │
│   入库单聚合         │     │   出库单聚合         │
├─────────────────────┤     ├─────────────────────┤
│ - InboundOrder      │     │ - OutboundOrder     │
│ - InboundOrderLine  │     │ - OutboundOrderLine │
└─────────────────────┘     └─────────────────────┘
```

### 6.2 聚合设计原则

1. **聚合边界**：一个事务只修改一个聚合
2. **聚合根**：外部只能通过聚合根访问聚合内对象
3. **ID 引用**：聚合间通过 ID 引用，不直接引用对象
4. **小聚合**：聚合尽量小，避免大聚合

---

## 7. 实体与值对象

### 7.1 实体（Entity）

具有唯一标识的对象，生命周期内标识不变。

```java
@Getter
public class Inventory {
    private final InventoryId id;
    private final ItemId itemId;
    private final LocationId locationId;
    private Quantity quantity;
    
    public void increase(Quantity amount) {
        this.quantity = this.quantity.add(amount);
    }
    
    public void decrease(Quantity amount) {
        if (this.quantity.lessThan(amount)) {
            throw new InsufficientInventoryException();
        }
        this.quantity = this.quantity.subtract(amount);
    }
}
```

### 7.2 值对象（Value Object）

无唯一标识，通过属性值判断相等性，不可变。

```java
public record Quantity(BigDecimal value) {
    public Quantity {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("数量不能为负");
        }
    }
    
    public Quantity add(Quantity other) {
        return new Quantity(this.value.add(other.value));
    }
    
    public boolean lessThan(Quantity other) {
        return this.value.compareTo(other.value) < 0;
    }
}
```

---

## 8. 领域服务

跨聚合的业务逻辑，不属于任何单一实体。

```java
public class InventoryDomainService {
    
    // 库存转移（涉及两个库存聚合）
    public void transfer(Inventory from, Inventory to, Quantity quantity) {
        from.decrease(quantity);
        to.increase(quantity);
    }
}
```

---

## 9. 领域事件

### 9.1 事件定义

```java
public record InventoryChangedEvent(
    InventoryId inventoryId,
    ItemId itemId,
    Quantity oldQuantity,
    Quantity newQuantity,
    String reason,
    LocalDateTime occurredAt
) {}
```

### 9.2 WMS 核心事件

| 事件 | 触发时机 | 订阅者 |
|-----|---------|-------|
| InboundOrderCreatedEvent | 入库单创建 | 通知服务 |
| InboundOrderCompletedEvent | 入库单完成 | 库存服务 |
| OutboundOrderCreatedEvent | 出库单创建 | 库存服务（校验） |
| OutboundOrderCompletedEvent | 出库单完成 | 库存服务 |
| InventoryChangedEvent | 库存变动 | 日志服务、预警服务 |
| InventoryWarningEvent | 库存预警 | 通知服务 |

---

## 10. 仓储（Repository）

### 10.1 接口定义（领域层）

```java
public interface InventoryRepository {
    Optional<Inventory> findById(InventoryId id);
    Optional<Inventory> findByItemAndLocation(ItemId itemId, LocationId locationId);
    List<Inventory> findByItemId(ItemId itemId);
    void save(Inventory inventory);
    void remove(Inventory inventory);
}
```

### 10.2 实现（基础设施层）

```java
@Repository
public class InventoryRepositoryImpl implements InventoryRepository {
    private final InventoryMapper mapper;
    private final InventoryConverter converter;
    
    @Override
    public Optional<Inventory> findById(InventoryId id) {
        InventoryPO po = mapper.selectById(id.getValue());
        return Optional.ofNullable(converter.toDomain(po));
    }
    
    @Override
    public void save(Inventory inventory) {
        InventoryPO po = converter.toPO(inventory);
        if (po.getId() == null) {
            mapper.insert(po);
        } else {
            mapper.updateById(po);
        }
    }
}
```

---

## 11. 应用服务

编排领域对象，处理事务，不包含业务逻辑。

```java
@Service
@Transactional
public class InventoryApplicationService {
    private final InventoryRepository inventoryRepository;
    private final InventoryDomainService domainService;
    private final EventPublisher eventPublisher;
    
    public void inbound(CreateInboundCommand command) {
        // 1. 查找或创建库存
        Inventory inventory = inventoryRepository
            .findByItemAndLocation(command.getItemId(), command.getLocationId())
            .orElseGet(() -> Inventory.create(command));
        
        Quantity oldQuantity = inventory.getQuantity();
        
        // 2. 执行领域逻辑
        inventory.increase(command.getQuantity());
        
        // 3. 持久化
        inventoryRepository.save(inventory);
        
        // 4. 发布事件
        eventPublisher.publish(new InventoryChangedEvent(
            inventory.getId(),
            inventory.getItemId(),
            oldQuantity,
            inventory.getQuantity(),
            "入库",
            LocalDateTime.now()
        ));
    }
}
```

---

## 12. 对象转换

```
Controller ←→ DTO ←→ Domain Entity ←→ PO ←→ Database
              ↑           ↑            ↑
          Assembler   (领域层内部)   Converter
```

| 对象类型 | 位置 | 用途 |
|---------|------|------|
| DTO | interfaces/dto | 接口层数据传输 |
| Entity | domain/model | 领域模型，包含业务逻辑 |
| PO | infrastructure/persistence/po | 持久化对象，映射数据库 |
| Assembler | interfaces/assembler | DTO ↔ Entity 转换 |
| Converter | infrastructure/persistence/converter | Entity ↔ PO 转换 |

---

## 13. 命名规范

| 类型 | 命名规范 | 示例 |
|-----|---------|------|
| 聚合根 | 名词 | `Inventory`、`InboundOrder` |
| 实体 | 名词 | `InboundOrderLine` |
| 值对象 | 名词（record） | `Quantity`、`ItemCode` |
| 领域服务 | 名词 + DomainService | `InventoryDomainService` |
| 应用服务 | 名词 + ApplicationService | `InventoryApplicationService` |
| 仓储接口 | 名词 + Repository | `InventoryRepository` |
| 仓储实现 | 名词 + RepositoryImpl | `InventoryRepositoryImpl` |
| 命令对象 | 动词 + 名词 + Command | `CreateInboundCommand` |
| 查询对象 | 名词 + Query | `InventoryQuery` |
| 领域事件 | 名词 + 动词过去式 + Event | `InventoryChangedEvent` |
| DTO | 名词 + Request/Response | `InboundRequest` |
| PO | 名词 + PO | `InventoryPO` |

---

## 14. 后端项目结构

```
backend/src/main/java/com/wms/
├── interfaces/                      # 接口层
│   ├── controller/
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   └── assembler/
│
├── application/                     # 应用层
│   ├── service/
│   ├── command/
│   └── query/
│
├── domain/                          # 领域层（核心）
│   ├── model/
│   │   ├── inventory/
│   │   ├── item/
│   │   ├── warehouse/
│   │   ├── inbound/
│   │   └── outbound/
│   ├── service/
│   ├── repository/
│   ├── event/
│   └── exception/
│
├── infrastructure/                  # 基础设施层
│   ├── persistence/
│   │   ├── repository/
│   │   ├── mapper/
│   │   ├── po/
│   │   └── converter/
│   ├── config/
│   ├── gateway/
│   └── common/
│
└── WmsLiteApplication.java
```

---

## 15. 注意事项

### 战略设计
1. **统一语言**：团队必须使用一致的业务术语
2. **上下文边界**：明确每个上下文的职责边界
3. **防腐层**：与外部系统集成时使用防腐层隔离

### 战术设计
1. **领域层纯净**：Domain 层不依赖 Spring、MyBatis 等框架
2. **聚合边界**：一个事务只修改一个聚合
3. **值对象不可变**：使用 record 或 final 字段
4. **贫血模型禁止**：业务逻辑放在领域对象中，不是 Service
5. **仓储只操作聚合根**：不直接操作聚合内部实体
6. **领域事件解耦**：跨聚合通信使用领域事件
