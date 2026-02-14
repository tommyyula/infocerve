# 领域建模编写规范（Domain Model Guidelines）

## 概述

本规范定义了领域建模（战术设计）的编写标准，是 DDD 战术设计阶段的核心产出。

### 相关规范

- **DDD 架构规范**：参见 `ddd-architecture.md`
- **领域分析规范**：参见 `domain-analysis-guidelines.md`
- **TDD 工作流程**：参见 `test-driven-development-workflow.md`

---

## 文件位置

```
.kiro/specs/{feature-name}/domain-model.md
```

---

## 模板结构

```markdown
# {功能名称} - 领域建模

## 1. 聚合设计

### 1.1 聚合：{聚合名称}
### 1.2 聚合边界规则

## 2. 实体设计

## 3. 值对象设计

## 4. 领域服务

## 5. 领域事件

## 6. 仓储接口
```

---

## 1. 聚合设计（Aggregate）

### 1.1 聚合结构描述

```markdown
### 1.1 聚合：InboundOrder（入库单）

**聚合根**：InboundOrder

| 属性 | 类型 | 说明 |
|-----|------|------|
| id | InboundOrderId | 唯一标识 |
| orderNo | OrderNo | 单号（值对象） |
| supplierId | SupplierId | 供应商ID |
| status | InboundStatus | 状态（枚举） |
| lines | List<InboundOrderLine> | 入库明细（实体集合） |
| createdAt | LocalDateTime | 创建时间 |
| updatedAt | LocalDateTime | 更新时间 |

**实体**：InboundOrderLine

| 属性 | 类型 | 说明 |
|-----|------|------|
| id | LineId | 明细ID |
| itemId | ItemId | 物料ID |
| plannedQuantity | Quantity | 计划数量 |
| receivedQuantity | Quantity | 已收数量 |
| locationId | LocationId | 库位ID（可空） |

**聚合方法**：

| 方法 | 说明 | 业务规则 |
|-----|------|---------|
| create() | 创建入库单 | 生成单号，状态=草稿 |
| addLine() | 添加明细 | 状态必须为草稿 |
| removeLine() | 删除明细 | 状态必须为草稿 |
| confirm() | 确认入库单 | 至少有一条明细，状态→待收货 |
| receive() | 执行收货 | 状态必须为待收货 |
| complete() | 完成入库 | 所有明细收货完成，状态→已完成 |
```

### 1.2 聚合边界规则

| 规则 | 说明 | 示例 |
|-----|------|------|
| 一个事务一个聚合 | 事务边界不跨聚合 | 入库完成后，通过事件更新库存 |
| 通过聚合根访问 | 外部不直接访问聚合内实体 | 通过 InboundOrder 访问 Line |
| ID 引用 | 聚合间通过 ID 引用 | InboundOrder 持有 SupplierId |
| 小聚合原则 | 聚合尽量小，避免大聚合 | Line 数量有上限 |

### 聚合设计检查

```
✅ 正确：
- 聚合根有唯一标识
- 聚合内实体通过聚合根访问
- 聚合间通过 ID 引用

❌ 错误：
- 聚合直接引用另一个聚合对象
- 外部直接操作聚合内实体
- 一个事务修改多个聚合
```

---

## 2. 实体设计（Entity）

### 实体特征

| 特征 | 说明 |
|-----|------|
| 唯一标识 | 有 ID，生命周期内不变 |
| 可变性 | 属性可以变化 |
| 生命周期 | 有创建、修改、删除 |
| 业务行为 | 包含业务方法 |

### 实体设计模板

```markdown
## 2. 实体设计

### 2.1 实体：InboundOrder（入库单）

**标识**：InboundOrderId

**属性**：

| 属性 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| id | InboundOrderId | ✅ | 唯一标识 |
| orderNo | OrderNo | ✅ | 单号 |
| supplierId | SupplierId | ✅ | 供应商 |
| status | InboundStatus | ✅ | 状态 |
| remark | String | ❌ | 备注 |

**行为**：

| 方法 | 参数 | 返回值 | 业务规则 |
|-----|------|-------|---------|
| confirm() | 无 | void | BR-IN-003, BR-IN-004 |
| receive(lineId, quantity, locationId) | LineId, Quantity, LocationId | void | BR-IN-001, BR-IN-002 |
| complete() | 无 | void | 所有明细收货完成 |

**状态机**：

```
草稿(DRAFT) → 待收货(PENDING) → 已完成(COMPLETED)
     ↓              ↓
   已取消(CANCELLED)
```
```

### 实体代码示例

```java
@Getter
public class InboundOrder {
    private final InboundOrderId id;
    private final OrderNo orderNo;
    private final SupplierId supplierId;
    private InboundStatus status;
    private final List<InboundOrderLine> lines;
    
    // Factory method
    public static InboundOrder create(SupplierId supplierId, OrderNo orderNo) {
        return new InboundOrder(
            InboundOrderId.generate(),
            orderNo,
            supplierId,
            InboundStatus.DRAFT,
            new ArrayList<>()
        );
    }
    
    // Business method
    public void confirm() {
        if (this.status != InboundStatus.DRAFT) {
            throw new InvalidStatusException("Only draft order can be confirmed");
        }
        if (this.lines.isEmpty()) {
            throw new BusinessException("Order must have at least one line");
        }
        this.status = InboundStatus.PENDING;
    }
    
    public void addLine(InboundOrderLine line) {
        if (this.status != InboundStatus.DRAFT) {
            throw new InvalidStatusException("Cannot add line to non-draft order");
        }
        this.lines.add(line);
    }
}
```

---

## 3. 值对象设计（Value Object）

### 值对象特征

| 特征 | 说明 |
|-----|------|
| 无标识 | 没有 ID |
| 不可变 | 创建后不能修改 |
| 值相等 | 通过属性值判断相等 |
| 可替换 | 整体替换而非修改 |

### 值对象设计模板

```markdown
## 3. 值对象设计

### 3.1 值对象：Quantity（数量）

**属性**：

| 属性 | 类型 | 约束 |
|-----|------|------|
| value | BigDecimal | 不能为负数 |

**行为**：

| 方法 | 说明 |
|-----|------|
| add(Quantity) | 加法，返回新对象 |
| subtract(Quantity) | 减法，返回新对象 |
| isZero() | 是否为零 |
| isNegative() | 是否为负（用于校验） |
| lessThan(Quantity) | 小于比较 |
| greaterThan(Quantity) | 大于比较 |

**不变量**：
- 数量不能为负数
- 数量精度为小数点后4位

### 3.2 值对象：OrderNo（单号）

**属性**：

| 属性 | 类型 | 约束 |
|-----|------|------|
| value | String | 格式：IN + yyyyMMdd + 4位序号 |

**行为**：

| 方法 | 说明 |
|-----|------|
| generate() | 生成新单号（静态工厂） |
| getDate() | 提取日期部分 |

**不变量**：
- 单号格式必须符合规范
- 单号不能为空
```

### 值对象代码示例

```java
// Use Java record for immutability
public record Quantity(BigDecimal value) {
    
    public Quantity {
        if (value == null) {
            throw new IllegalArgumentException("Quantity value cannot be null");
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        // Normalize scale
        value = value.setScale(4, RoundingMode.HALF_UP);
    }
    
    public static Quantity of(BigDecimal value) {
        return new Quantity(value);
    }
    
    public static Quantity zero() {
        return new Quantity(BigDecimal.ZERO);
    }
    
    public Quantity add(Quantity other) {
        return new Quantity(this.value.add(other.value));
    }
    
    public Quantity subtract(Quantity other) {
        return new Quantity(this.value.subtract(other.value));
    }
    
    public boolean lessThan(Quantity other) {
        return this.value.compareTo(other.value) < 0;
    }
    
    public boolean isZero() {
        return this.value.compareTo(BigDecimal.ZERO) == 0;
    }
}
```

### 常用值对象类型

| 类型 | 示例 | 说明 |
|-----|------|------|
| 标识类 | ItemId, OrderId | 封装 ID，类型安全 |
| 数量类 | Quantity, Money | 数值 + 单位 |
| 编码类 | ItemCode, OrderNo | 业务编码 |
| 范围类 | DateRange, QuantityRange | 区间值 |
| 组合类 | Address, Contact | 多属性组合 |

---

## 4. 领域服务（Domain Service）

### 何时使用领域服务

| 场景 | 说明 | 示例 |
|-----|------|------|
| 跨聚合操作 | 涉及多个聚合的业务逻辑 | 库存转移 |
| 无状态计算 | 不属于任何实体的计算 | 价格计算 |
| 外部依赖 | 需要调用外部服务 | 库存校验 |

### 领域服务设计模板

```markdown
## 4. 领域服务

### 4.1 InventoryDomainService（库存领域服务）

**职责**：处理跨库存聚合的业务逻辑

**方法**：

| 方法 | 参数 | 返回值 | 说明 |
|-----|------|-------|------|
| transfer() | from, to, quantity | void | 库存转移 |
| checkAvailability() | itemId, quantity | boolean | 检查可用库存 |

**依赖**：
- InventoryRepository

### 4.2 InboundDomainService（入库领域服务）

**职责**：处理入库相关的跨聚合逻辑

**方法**：

| 方法 | 参数 | 返回值 | 说明 |
|-----|------|-------|------|
| validateOverReceive() | planned, received | boolean | 校验超收 |
```

### 领域服务代码示例

```java
public class InventoryDomainService {
    
    // Cross-aggregate operation
    public void transfer(Inventory from, Inventory to, Quantity quantity) {
        if (from.getQuantity().lessThan(quantity)) {
            throw new InsufficientInventoryException();
        }
        from.decrease(quantity);
        to.increase(quantity);
    }
    
    // Stateless calculation
    public boolean checkOverReceive(Quantity planned, Quantity received, BigDecimal threshold) {
        Quantity limit = new Quantity(
            planned.value().multiply(threshold)
        );
        return received.greaterThan(limit);
    }
}
```

---

## 5. 领域事件（Domain Event）

### 领域事件设计模板

```markdown
## 5. 领域事件

### 5.1 事件列表

| 事件 | 触发时机 | 携带数据 | 订阅者 |
|-----|---------|---------|-------|
| InboundOrderCreatedEvent | 入库单创建后 | orderId, orderNo, supplierId | 通知服务 |
| InboundOrderConfirmedEvent | 入库单确认后 | orderId, orderNo | 任务服务 |
| InboundOrderCompletedEvent | 入库单完成后 | orderId, lines[] | 库存服务 |
| InventoryChangedEvent | 库存变动后 | inventoryId, itemId, oldQty, newQty | 预警服务 |

### 5.2 事件结构

**InboundOrderCompletedEvent**

| 属性 | 类型 | 说明 |
|-----|------|------|
| eventId | String | 事件唯一ID |
| occurredAt | LocalDateTime | 发生时间 |
| orderId | String | 入库单ID |
| orderNo | String | 入库单号 |
| lines | List<LineData> | 明细数据 |

**LineData**

| 属性 | 类型 | 说明 |
|-----|------|------|
| itemId | String | 物料ID |
| locationId | String | 库位ID |
| quantity | BigDecimal | 入库数量 |
```

### 领域事件代码示例

```java
public record InboundOrderCompletedEvent(
    String eventId,
    LocalDateTime occurredAt,
    String orderId,
    String orderNo,
    List<LineData> lines
) {
    public static InboundOrderCompletedEvent from(InboundOrder order) {
        return new InboundOrderCompletedEvent(
            UUID.randomUUID().toString(),
            LocalDateTime.now(),
            order.getId().getValue(),
            order.getOrderNo().getValue(),
            order.getLines().stream()
                .map(LineData::from)
                .toList()
        );
    }
    
    public record LineData(
        String itemId,
        String locationId,
        BigDecimal quantity
    ) {
        public static LineData from(InboundOrderLine line) {
            return new LineData(
                line.getItemId().getValue(),
                line.getLocationId().getValue(),
                line.getReceivedQuantity().value()
            );
        }
    }
}
```

### 事件命名规范

```
{聚合名}{动作过去式}Event

示例：
- InboundOrderCreatedEvent    入库单已创建
- InboundOrderConfirmedEvent  入库单已确认
- InventoryChangedEvent       库存已变动
- ItemDeletedEvent            物料已删除
```

---

## 6. 仓储接口（Repository）

### 仓储设计模板

```markdown
## 6. 仓储接口

### 6.1 InboundOrderRepository

**职责**：入库单聚合的持久化

**方法**：

| 方法 | 参数 | 返回值 | 说明 |
|-----|------|-------|------|
| findById() | InboundOrderId | Optional<InboundOrder> | 按ID查询 |
| findByOrderNo() | OrderNo | Optional<InboundOrder> | 按单号查询 |
| save() | InboundOrder | void | 保存（新增或更新） |
| remove() | InboundOrder | void | 删除 |
| nextOrderNo() | 无 | OrderNo | 生成下一个单号 |

### 6.2 InventoryRepository

**职责**：库存聚合的持久化

**方法**：

| 方法 | 参数 | 返回值 | 说明 |
|-----|------|-------|------|
| findById() | InventoryId | Optional<Inventory> | 按ID查询 |
| findByItemAndLocation() | ItemId, LocationId | Optional<Inventory> | 按物料和库位查询 |
| findByItemId() | ItemId | List<Inventory> | 按物料查询所有库存 |
| save() | Inventory | void | 保存 |
```

### 仓储接口代码示例

```java
// Domain layer - interface only
public interface InboundOrderRepository {
    
    Optional<InboundOrder> findById(InboundOrderId id);
    
    Optional<InboundOrder> findByOrderNo(OrderNo orderNo);
    
    List<InboundOrder> findByStatus(InboundStatus status);
    
    void save(InboundOrder order);
    
    void remove(InboundOrder order);
    
    OrderNo nextOrderNo();
}
```

### 仓储设计规则

| 规则 | 说明 |
|-----|------|
| 只操作聚合根 | 不直接操作聚合内实体 |
| 接口在领域层 | 实现在基础设施层 |
| 返回领域对象 | 不返回 PO 或 DTO |
| 封装查询逻辑 | 复杂查询封装在仓储中 |

---

## 完整示例

```markdown
# 入库管理 - 领域建模

## 1. 聚合设计

### 1.1 聚合：InboundOrder（入库单）

**聚合根**：InboundOrder

| 属性 | 类型 | 说明 |
|-----|------|------|
| id | InboundOrderId | 唯一标识 |
| orderNo | OrderNo | 单号 |
| supplierId | SupplierId | 供应商ID |
| status | InboundStatus | 状态 |
| lines | List<InboundOrderLine> | 入库明细 |
| createdAt | LocalDateTime | 创建时间 |

**实体**：InboundOrderLine

| 属性 | 类型 | 说明 |
|-----|------|------|
| id | LineId | 明细ID |
| itemId | ItemId | 物料ID |
| plannedQuantity | Quantity | 计划数量 |
| receivedQuantity | Quantity | 已收数量 |

**聚合方法**：

| 方法 | 说明 | 业务规则 |
|-----|------|---------|
| create() | 创建入库单 | 生成单号 |
| addLine() | 添加明细 | 状态=草稿 |
| confirm() | 确认 | 至少一条明细 |
| receive() | 收货 | 校验超收 |
| complete() | 完成 | 全部收货完成 |

### 1.2 聚合边界规则

- 一个事务只修改 InboundOrder 聚合
- 入库完成后通过事件通知库存上下文

## 2. 实体设计

### 2.1 InboundOrder 状态机

```
DRAFT → PENDING → COMPLETED
  ↓        ↓
CANCELLED
```

## 3. 值对象设计

### 3.1 Quantity（数量）

| 属性 | 类型 | 约束 |
|-----|------|------|
| value | BigDecimal | ≥ 0 |

| 方法 | 说明 |
|-----|------|
| add() | 加法 |
| subtract() | 减法 |
| lessThan() | 比较 |

### 3.2 OrderNo（单号）

| 属性 | 类型 | 约束 |
|-----|------|------|
| value | String | IN + yyyyMMdd + 4位序号 |

## 4. 领域服务

### 4.1 InboundDomainService

| 方法 | 说明 |
|-----|------|
| validateOverReceive() | 校验超收（>110%） |

## 5. 领域事件

| 事件 | 触发时机 | 订阅者 |
|-----|---------|-------|
| InboundOrderCreatedEvent | 创建后 | 通知服务 |
| InboundOrderCompletedEvent | 完成后 | 库存服务 |

## 6. 仓储接口

### 6.1 InboundOrderRepository

| 方法 | 说明 |
|-----|------|
| findById() | 按ID查询 |
| findByOrderNo() | 按单号查询 |
| save() | 保存 |
| nextOrderNo() | 生成单号 |
```

---

## 检查清单

### 聚合设计
- [ ] 聚合根有唯一标识
- [ ] 聚合边界清晰
- [ ] 聚合间通过 ID 引用
- [ ] 聚合方法包含业务规则

### 实体设计
- [ ] 实体有唯一标识
- [ ] 业务方法在实体中
- [ ] 状态变化有状态机描述

### 值对象设计
- [ ] 值对象不可变
- [ ] 使用 record 定义
- [ ] 包含必要的校验逻辑

### 领域服务
- [ ] 只用于跨聚合逻辑
- [ ] 无状态
- [ ] 命名清晰

### 领域事件
- [ ] 事件命名符合规范
- [ ] 携带必要数据
- [ ] 订阅者明确

### 仓储接口
- [ ] 只操作聚合根
- [ ] 接口定义在领域层
- [ ] 返回领域对象

---

## 常见问题

### Q: 实体和值对象如何区分？
A: 需要跟踪生命周期、有唯一标识的是实体；只关心值、可替换的是值对象。

### Q: 聚合应该多大？
A: 尽量小。一个聚合通常包含1个聚合根 + 少量实体/值对象。如果聚合太大，考虑拆分。

### Q: 领域服务和应用服务的区别？
A: 领域服务包含业务逻辑，应用服务只做编排（调用领域对象、事务管理、发布事件）。

---

## 下一步

完成 `domain-model.md` 后，进入技术设计阶段，编写 `design.md`。
