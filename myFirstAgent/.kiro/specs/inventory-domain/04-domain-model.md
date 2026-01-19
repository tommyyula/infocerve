# 库存领域 - 领域建模

## 1. 聚合设计总览

```
库存核心上下文
  - Inventory 聚合（聚合根）
  - Lp 聚合（聚合根）

调整管理上下文
  - Adjustment 聚合（聚合根）
    - AdjustmentLine（实体）

库存锁定上下文
  - InventoryLock 聚合（聚合根）

日志审计上下文
  - InventoryLog（实体，无聚合根）
  - InventoryActivity（实体，无聚合根）

配置管理上下文
  - DynPropertyMapping（实体）
  - CustomizeFields（实体）
  - Sequences（实体）
```

---

## 2. 库存核心上下文

### 2.1 Inventory 聚合

#### 聚合根：Inventory

职责：管理仓库中的实际货物记录

不变量：
- qty 必须大于等于 0
- baseQty = qty x 单位换算系数
- 双单位模式下 qty2 和 uomId2 必须同时存在
- status 不能直接设置为 ADJUSTOUT

```java
public class Inventory extends BaseEntity {
    // Identity
    private Long id;
    
    // Core attributes
    private String customerId;      // Required
    private String titleId;
    private String itemId;          // Required
    private Quantity qty;           // Required, Value Object
    private String uomId;           // Required
    private String uom;
    private Double baseQty;         // Auto-calculated
    private Quantity qty2;          // Dual UOM
    private String uomId2;
    private String sn;
    
    // Status
    private InventoryStatus status;
    private String type;
    private InventoryMode mode;
    private InventoryChannel channel;
    
    // Batch info
    private String lotNo;
    private LocalDateTime expirationDate;
    private LocalDateTime mfgDate;
    
    // Location
    private String lpId;            // Required
    private String locationId;
    
    // References
    private String receiptId;
    private String orderId;
    private String adjustmentId;
    private String supplierId;
    
    // Task references
    private String receiveTaskId;
    private String putAwayTaskId;
    private String pickTaskId;
    private String packTaskId;
    private String loadTaskId;
    private String workflowTaskId;
    private String replenishTaskId;
    private String movementTaskId;
    private String returnTaskId;
    
    // Dynamic properties (20 text + 10 date)
    private DynamicProperties dynamicProperties;
    
    // Traceability
    private String originalLPId;
    private Double originalBaseQty;
    private LocalDateTime originalCreatedTime;
    private Long originalId;
    
    // Discrepancy
    private DiscrepancyFlag discrepancyFlag;
    private LocalDateTime discrepancyReportTime;
    
    // Shipping
    private LocalDateTime receivedTime;
    private String receivedBy;
    private LocalDateTime adjustOutTime;
    private String adjustOutBy;
    private LocalDateTime shippedTime;
    private String shippedBy;
    
    // Methods
    public void create(CreateInventoryCmd cmd);
    public void updateQuantity(Quantity newQty);
    public void updateStatus(InventoryStatus newStatus);
    public void setDiscrepancyFlag(DiscrepancyFlag flag);
    public void releaseDiscrepancy();
    public Inventory split(Quantity splitQty, String targetLpId);
    public void markAsAdjustOut(String adjustmentId);
}
```

---

#### 值对象：Quantity

职责：表示数量，支持精度控制和运算

不变量：
- value 必须大于等于 0
- 精度为 4 位小数

```java
public class Quantity {
    private final Double value;
    
    public static Quantity of(Double value);
    public static Quantity zero();
    
    public Quantity add(Quantity other);
    public Quantity subtract(Quantity other);
    public Quantity multiply(Double factor);
    public boolean isZero();
    public boolean isGreaterThan(Quantity other);
    public boolean isLessThan(Quantity other);
}
```

---

#### 值对象：DynamicProperties

职责：封装动态属性字段

```java
public class DynamicProperties {
    private Map<String, String> textProperties;   // 01-20
    private Map<String, LocalDateTime> dateProperties; // 01-10
    
    public String getTextProperty(int index);
    public void setTextProperty(int index, String value);
    public LocalDateTime getDateProperty(int index);
    public void setDateProperty(int index, LocalDateTime value);
}
```

---

#### 枚举：InventoryStatus

```java
public enum InventoryStatus {
    OPEN,       // Available
    DAMAGE,     // Damaged
    ONHOLD,     // On hold
    ADJUSTOUT,  // Adjusted out
    RECEIVING,  // Receiving
    PICKED,     // Picked
    PACKED,     // Packed
    LOADED,     // Loaded
    SHIPPED,    // Shipped
    RESTOCKED   // Restocked
}
```

---

#### 枚举：InventoryMode

```java
public enum InventoryMode {
    WMS,        // WMS mode
    MATERIAL    // Material mode
}
```

---

#### 枚举：InventoryChannel

```java
public enum InventoryChannel {
    RECEIVE,    // Receive channel
    RETURN,     // Return channel
    TRANSFER    // Transfer channel
}
```

---

#### 枚举：DiscrepancyFlag

```java
public enum DiscrepancyFlag {
    DISCREPANCY,  // Discrepancy
    WARNING       // Warning
}
```

---

### 2.2 Lp 聚合

#### 聚合根：Lp

职责：管理容器的生命周期和状态

不变量：
- id 格式必须为 {TYPE}-{CODE}
- 删除时只能软删除（状态变为 ON_HOLD）
- SHIPPED 状态的 LP 不能接收新库存

```java
public class Lp extends BaseEntity {
    // Identity
    private String id;              // Format: {TYPE}-{CODE}
    private String code;
    
    // Location
    private String locationId;
    
    // Type and status
    private LpType type;            // Required
    private LpStatus status;
    private HlpCategory hlpCategory;
    private String hlpReference;
    
    // Hierarchy
    private String parentId;
    private String consolidateLp;
    
    // Dimensions
    private Double weight;
    private WeightUnit weightUnit;
    private Double length;
    private Double width;
    private Double height;
    private LinearUnit linearUnit;
    private Double volume;
    private Double netWeight;
    private Double grossWeight;
    
    // References
    private String confId;
    private String orderId;
    private String taskId;
    private String trackingNo;
    private String cartonNo;
    private String palletNo;
    private String equipmentId;
    private Integer seq;
    private String packagingTypeSpecId;
    private Boolean isPartialPallet;
    private Integer stack;
    private SpaceStatus spaceStatus;
    private String palletType;
    private Double cartonQty;
    private String externalLPN;
    
    // Methods
    public static Lp create(LpType type, String prefix);
    public void updateStatus(LpStatus newStatus);
    public void moveTo(String newLocationId, String newParentId);
    public void softDelete();
    public boolean canReceiveInventory();
    public boolean isHlp();
}
```

---

#### 枚举：LpType

```java
public enum LpType {
    ILP,    // Internal LP
    HLP,    // Holding LP (location alias)
    CLP,    // Carton LP
    SLP,    // Shipping LP
    TLP,    // Tote LP
    RLP     // Return LP
}
```

---

#### 枚举：LpStatus

```java
public enum LpStatus {
    NEW,            // New
    RECEIVING,      // Receiving
    IN_STOCK,       // In stock
    PICKED,         // Picked
    STAGED,         // Staged
    STAGE_TO_LOAD,  // Stage to load
    LOADED,         // Loaded
    PACKED,         // Packed
    SHIPPED,        // Shipped
    ON_HOLD,        // On hold (soft deleted)
    QUARANTINE,     // Quarantine
    EXCEPTIONAL     // Exceptional
}
```

---

## 3. 调整管理上下文

### 3.1 Adjustment 聚合

#### 聚合根：Adjustment

职责：管理库存调整单的生命周期

不变量：
- 只有 NEW 状态的调整单才能审批
- 审批后状态必须变为 APPROVED
- 调整单 ID 格式为 ADJ-{SEQUENCE}

```java
public class Adjustment extends BaseEntity {
    // Identity
    private String id;              // Format: ADJ-{SEQUENCE}
    
    // Core attributes
    private String customerId;      // Required
    private AdjustmentStatus status;
    private String reason;
    private String note;
    
    // Approval info
    private LocalDateTime approveTime;
    private String approveBy;
    
    // Lines
    private List<AdjustmentLine> lines;
    
    // Flags
    private Boolean hasSend947Report;
    
    // Methods
    public static Adjustment create(String customerId, String reason);
    public void addLine(AdjustmentLine line);
    public void removeLine(Long lineId);
    public void approve(String approveBy);
    public boolean canApprove();
}
```

---

#### 实体：AdjustmentLine

职责：调整单的明细行

```java
public class AdjustmentLine extends BaseEntity {
    // Identity
    private Long id;
    
    // References
    private String customerId;
    private String adjustmentId;
    
    // Adjustment info
    private AdjustmentType type;    // Required
    private InventoryIdentifier inventoryIdentifier;
    private String adjustFrom;
    private String adjustTo;
    private Double adjustQty;
    private String toLpId;
    
    // Dual UOM
    private String adjustFrom2;
    private String adjustTo2;
    private Double adjustQty2;
}
```

---

#### 值对象：InventoryIdentifier

职责：标识库存记录的条件组合

```java
public class InventoryIdentifier {
    private Long inventoryId;
    private String lineId;
    private String itemId;
    private String lpId;
    private String locationId;
    private String titleId;
    private String lotNo;
    private String sn;
    private String uomId;
    private Double qty;
    private Double qty2;
    private String uomId2;
    private InventoryStatus status;
    private String type;
    private List<String> sns;       // Batch SN
    private DynamicProperties dynamicProperties;
}
```

---

#### 枚举：AdjustmentStatus

```java
public enum AdjustmentStatus {
    NEW,        // New
    APPROVED,   // Approved
    DECLINED    // Declined
}
```

---

#### 枚举：AdjustmentType

```java
public enum AdjustmentType {
    ADD_INVENTORY,          // Add inventory
    ADJUST_QTY,             // Adjust quantity
    ADJUST_STATUS,          // Adjust status
    ADJUST_TITLE,           // Adjust title
    ADJUST_GOOD_TYPE,       // Adjust goods type
    ADJUST_LOT_NO,          // Adjust lot number
    ADJUST_EXPIRATION_DATE, // Adjust expiration date
    ADJUST_MFG_DATE,        // Adjust manufacturing date
    ADJUST_LP,              // Adjust LP
    ADJUST_LOCATION         // Adjust location
}
```

---

### 3.2 AdjustmentHistory 实体

职责：记录调整单审批后的历史

```java
public class AdjustmentHistory extends BaseEntity {
    private Long id;
    private String adjustmentId;
    private String customerId;
    private AdjustmentType adjustType;
    private String itemId;
    private String lpId;
    private String locationId;
    private String titleId;
    private String lotNo;
    private String sn;
    private InventoryStatus status;
    private String type;
    private LocalDateTime expirationDate;
    private LocalDateTime mfgDate;
    private String uomId;
    private Double fromQty;
    private Double toQty;
    private Double adjustQty;
    private Double fromQty2;
    private Double toQty2;
    private Double adjustQty2;
}
```

---

## 4. 库存锁定上下文

### 4.1 InventoryLock 聚合

#### 聚合根：InventoryLock

职责：管理订单的库存预留

不变量：
- 锁定数量不能超过可用库存
- 释放后状态必须变为 INACTIVE

```java
public class InventoryLock extends BaseEntity {
    // Identity
    private Long id;
    
    // Order reference
    private String orderId;         // Required
    private String orderItemLineId;
    
    // Item info
    private String itemId;          // Required
    private String uomId;
    private Double qty;
    private Double baseQty;
    private String titleId;
    private String customerId;      // Required
    private String lotNo;
    private String goodsType;
    private Double availableBaseQty;
    
    // Dual UOM
    private String uomId2;
    private Double qty2;
    
    // Status
    private InventoryLockStatus status;
    
    // References
    private String supplierId;
    private String receiveTaskId;
    private String putAwayTaskId;
    private String pickTaskId;
    private String packTaskId;
    private String loadTaskId;
    
    // Dynamic properties
    private DynamicProperties dynamicProperties;
    
    // Methods
    public static InventoryLock create(String orderId, String itemId, Double qty);
    public void deactivate();
    public boolean isActive();
}
```

---

#### 枚举：InventoryLockStatus

```java
public enum InventoryLockStatus {
    ACTIVE,     // Active
    INACTIVE    // Inactive
}
```

---

## 5. 日志审计上下文

### 5.1 InventoryLog 实体

职责：记录库存数据变更

```java
public class InventoryLog extends BaseEntity {
    private Long id;
    private Long inventoryId;
    private String customerId;
    private String titleId;
    private String itemId;
    private Double fromQty;
    private Double toQty;
    private String uomId;
    private Double fromQty2;
    private Double toQty2;
    private String uomId2;
    private InventoryStatus status;
    private String type;
    private InventoryActionType actionType;
    private String changeBefore;    // JSON snapshot
    private String changeAfter;     // JSON snapshot
    private Long originalInventoryId;
    private Long changeFromInventoryId;
}
```

---

#### 枚举：InventoryActionType

```java
public enum InventoryActionType {
    INSERT,     // Insert
    UPDATE,     // Update
    DELETE      // Delete
}
```

---

### 5.2 InventoryActivity 实体

职责：记录库存业务操作

```java
public class InventoryActivity extends BaseEntity {
    private Long id;
    private InventoryActivityType activityType;
    private String fromLPId;
    private String toLPId;
    private String fromLocationId;
    private String toLocationId;
    private String itemId;
    private String goodsType;
    private String titleId;
    private String lotNo;
    private Double qty;
    private String uomId;
    private InventoryStatus fromStatus;
    private InventoryStatus toStatus;
    private String customerId;
    private String adjustmentId;
    private String taskId;
    private String taskType;
}
```

---

#### 枚举：InventoryActivityType

```java
public enum InventoryActivityType {
    RECEIVE,            // Receive
    PUT_AWAY,           // Put away
    REPLENISH_COLLECT,  // Replenish collect
    REPLENISH_DROP,     // Replenish drop
    MOVEMENT_COLLECT,   // Movement collect
    MOVEMENT_DROP,      // Movement drop
    PICK,               // Pick
    STAGE,              // Stage
    LOAD,               // Load
    PUT_BACK,           // Put back
    PACK,               // Pack
    ADJUST,             // Adjust
    CONSOLIDATE,        // Consolidate
    TOTE_SPLIT,         // Tote split
    SMALL_PARCEL,       // Small parcel
    MOVE,               // Move
    MATERIAL            // Material
}
```

---

## 6. 配置管理上下文

### 6.1 DynPropertyMapping 实体

职责：动态属性字段映射

```java
public class DynPropertyMapping extends BaseEntity {
    private Long id;
    private String customField;     // Business name
    private String originalField;   // e.g., dyn_txt_property_value_01
    private DynPropertyType type;   // INVENTORY or LOCATION
}
```

---

### 6.2 CustomizeFields 实体

职责：自定义字段显示配置

```java
public class CustomizeFields extends BaseEntity {
    private Long id;
    private String name;
    private String customerId;
    private InventoryMode mode;
    private List<String> displayFields;
}
```

---

### 6.3 Sequences 实体

职责：序列号管理

```java
public class Sequences extends BaseEntity {
    private String id;              // e.g., ADJUSTMENT, LP
    private Long currentValue;
    
    public Long getNextValue();
    public List<Long> getNextValues(int count);
}
```

---

## 7. 领域服务

### 7.1 InventoryMoveService

职责：处理库存移动的复杂逻辑

```java
public interface InventoryMoveService {
    // Move inventory from source to target
    void move(InventoryMove moveCmd);
    
    // Batch move
    void batchMove(List<InventoryMove> moveCmds);
}
```

---

### 7.2 InventoryLockCalculationService

职责：计算可锁定库存数量

```java
public interface InventoryLockCalculationService {
    // Calculate available quantity for locking
    Double calculateAvailableQty(String itemId, String customerId);
    
    // Get unoccupied inventory
    List<Inventory> getUnoccupiedInventory(InventoryLockQuery query);
}
```

---

### 7.3 AdjustmentExecutionService

职责：执行调整单审批逻辑

```java
public interface AdjustmentExecutionService {
    // Execute adjustment line
    void executeLine(AdjustmentLine line);
    
    // Execute ADD_INVENTORY
    void executeAddInventory(AdjustmentLine line);
    
    // Execute ADJUST_QTY
    void executeAdjustQty(AdjustmentLine line);
    
    // Execute other adjustment types
    void executeAdjustAttribute(AdjustmentLine line);
}
```

---

## 8. 仓储接口

### 8.1 InventoryRepository

```java
public interface InventoryRepository {
    Inventory findById(Long id);
    List<Inventory> findByQuery(InventoryQuery query);
    Page<Inventory> findPageByQuery(InventoryQuery query);
    void save(Inventory inventory);
    void saveAll(List<Inventory> inventories);
    void update(Inventory inventory);
    void updateBatch(List<Inventory> inventories);
}
```

---

### 8.2 LpRepository

```java
public interface LpRepository {
    Lp findById(String id);
    List<Lp> findByIds(List<String> ids);
    List<Lp> findByQuery(LpQuery query);
    Page<Lp> findPageByQuery(LpQuery query);
    void save(Lp lp);
    void saveAll(List<Lp> lps);
    void update(Lp lp);
}
```

---

### 8.3 AdjustmentRepository

```java
public interface AdjustmentRepository {
    Adjustment findById(String id);
    List<Adjustment> findByQuery(AdjustmentQuery query);
    Page<Adjustment> findPageByQuery(AdjustmentQuery query);
    void save(Adjustment adjustment);
    void update(Adjustment adjustment);
}
```

---

### 8.4 InventoryLockRepository

```java
public interface InventoryLockRepository {
    InventoryLock findById(Long id);
    List<InventoryLock> findByQuery(InventoryLockQuery query);
    Page<InventoryLock> findPageByQuery(InventoryLockQuery query);
    void save(InventoryLock lock);
    void saveAll(List<InventoryLock> locks);
    void update(InventoryLock lock);
    void deleteByOrderId(String orderId);
}
```

---

## 9. 领域事件

### 9.1 InventoryCreatedEvent

```java
public class InventoryCreatedEvent {
    private Long inventoryId;
    private String customerId;
    private String itemId;
    private Double qty;
    private String lpId;
    private LocalDateTime createdTime;
}
```

---

### 9.2 InventoryMovedEvent

```java
public class InventoryMovedEvent {
    private Long sourceInventoryId;
    private Long targetInventoryId;
    private String itemId;
    private Double movedQty;
    private String fromLpId;
    private String toLpId;
    private String fromLocationId;
    private String toLocationId;
    private InventoryStatus fromStatus;
    private InventoryStatus toStatus;
    private LocalDateTime movedTime;
}
```

---

### 9.3 InventoryStatusChangedEvent

```java
public class InventoryStatusChangedEvent {
    private Long inventoryId;
    private String itemId;
    private InventoryStatus fromStatus;
    private InventoryStatus toStatus;
    private LocalDateTime changedTime;
}
```

---

### 9.4 AdjustmentApprovedEvent

```java
public class AdjustmentApprovedEvent {
    private String adjustmentId;
    private String customerId;
    private String approveBy;
    private LocalDateTime approveTime;
    private List<AdjustmentLineResult> lineResults;
}
```

---

### 9.5 InventoryLockedEvent

```java
public class InventoryLockedEvent {
    private String orderId;
    private String itemId;
    private Double lockedQty;
    private InventoryLockStatus status;
    private LocalDateTime lockedTime;
}
```

---

## 参考文档

- .kiro/specs/inventory-domain/02-domain-analysis.md（领域分析）
- .kiro/specs/inventory-domain/03-requirements.md（需求规格）

