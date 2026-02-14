# 库存领域 - 领域分析

## 1. 统一语言（Ubiquitous Language）

### 核心业务术语

库存（Inventory）
- 定义：仓库中实际存放的货物记录，包含商品、数量、位置、状态等信息
- 英文：Inventory

LP / 容器（License Plate）
- 定义：物理载体的唯一标识，可以是托盘、料箱、纸箱等，用于承载和追踪库存
- 英文：Lp

库存锁定（Inventory Lock）
- 定义：为订单预留库存的虚拟占用记录，防止超卖
- 英文：InventoryLock

调整单（Adjustment）
- 定义：记录和执行库存调整操作的单据，包含多个调整行
- 英文：Adjustment

调整行（Adjustment Line）
- 定义：调整单中的明细记录，描述单个调整操作
- 英文：AdjustmentLine

调整历史（Adjustment History）
- 定义：调整单审批执行后的历史记录，用于追溯
- 英文：AdjustmentHistory

库存日志（Inventory Log）
- 定义：库存数据变更的详细记录，包含变更前后快照
- 英文：InventoryLog

库存活动（Inventory Activity）
- 定义：库存业务操作的流转记录，如收货、上架、拣货等
- 英文：InventoryActivity

---

### LP 类型术语

ILP（内部LP）
- 定义：系统内部生成的标准容器标识
- 英文：ILP (Internal License Plate)

HLP（库位别名LP）
- 定义：与库位关联的虚拟LP，用于拣货位等场景
- 英文：HLP (Holding License Plate)

CLP（纸箱LP）
- 定义：纸箱类型的容器标识
- 英文：CLP (Carton License Plate)

SLP（发货LP）
- 定义：发货使用的容器标识
- 英文：SLP (Shipping License Plate)

TLP（料箱LP）
- 定义：料箱类型的容器标识
- 英文：TLP (Tote License Plate)

RLP（退货LP）
- 定义：退货使用的容器标识
- 英文：RLP (Return License Plate)

---

### 状态术语

库存状态（Inventory Status）
- OPEN - 可用
- DAMAGE - 损坏
- ONHOLD - 冻结
- ADJUSTOUT - 调整出库
- RECEIVING - 收货中
- PICKED - 已拣货
- PACKED - 已打包
- LOADED - 已装车
- SHIPPED - 已发货
- RESTOCKED - 已返库

LP状态（LP Status）
- NEW - 新建
- RECEIVING - 收货中
- IN_STOCK - 在库
- PICKED - 已拣货
- STAGED - 已暂存
- STAGE_TO_LOAD - 暂存待装车
- LOADED - 已装车
- PACKED - 已打包
- SHIPPED - 已发货
- ON_HOLD - 冻结
- QUARANTINE - 隔离
- EXCEPTIONAL - 异常

调整单状态（Adjustment Status）
- NEW - 新建
- APPROVED - 已审批
- DECLINED - 已拒绝

锁定状态（Inventory Lock Status）
- ACTIVE - 激活
- INACTIVE - 失效

---

### 业务操作术语

库存移动（Inventory Move）
- 定义：将库存从一个位置/状态移动到另一个位置/状态的操作
- 英文：InventoryMove

库存调整类型（Adjustment Type）
- ADD_INVENTORY - 新增库存
- ADJUST_QTY - 调整数量
- ADJUST_STATUS - 调整状态
- ADJUST_TITLE - 调整货权
- ADJUST_GOOD_TYPE - 调整货物类型
- ADJUST_LOT_NO - 调整批次号
- ADJUST_EXPIRATION_DATE - 调整过期日期
- ADJUST_MFG_DATE - 调整生产日期
- ADJUST_LP - 调整LP
- ADJUST_LOCATION - 调整库位

库存活动类型（Inventory Activity Type）
- RECEIVE - 收货
- PUT_AWAY - 上架
- REPLENISH_COLLECT - 补货拣取
- REPLENISH_DROP - 补货放置
- MOVEMENT_COLLECT - 移动拣取
- MOVEMENT_DROP - 移动放置
- PICK - 拣货
- STAGE - 暂存
- LOAD - 装车
- PUT_BACK - 放回
- PACK - 打包
- ADJUST - 调整
- CONSOLIDATE - 合并
- TOTE_SPLIT - 料箱拆分
- SMALL_PARCEL - 小包裹
- MOVE - 移动
- MATERIAL - 物料

---

### 其他术语

货权（Title）
- 定义：货物所有权的标识，用于区分不同货主的库存
- 英文：titleId

批次号（Lot Number）
- 定义：同一批次生产的货物标识，用于追溯
- 英文：lotNo

序列号（Serial Number）
- 定义：单个货物的唯一标识，用于精确追踪
- 英文：sn

基础数量（Base Quantity）
- 定义：换算为基础计量单位后的数量，用于不同单位间的统一计算
- 英文：baseQty

双单位（Dual UOM）
- 定义：同时使用两种计量单位管理库存的模式
- 英文：Dual UOM (Unit of Measure)

动态属性（Dynamic Property）
- 定义：可配置的扩展字段，支持多租户个性化
- 英文：dynTxtPropertyValue / dynDatePropertyValue

差异标记（Discrepancy Flag）
- 定义：盘点差异的标记，用于追踪和处理
- 英文：discrepancyFlag

---

## 2. 领域识别

### 核心域（Core Domain）

库存核心域
- 职责：管理仓库中的实际货物记录，是 WMS 系统的核心
- 核心概念：Inventory、LP、InventoryMove
- 投入策略：重点自研，高度定制
- 理由：库存管理是 WMS 的核心竞争力，直接影响仓库运营效率

---

### 支撑域（Supporting Domain）

调整管理域
- 职责：管理库存调整操作，支持库存核心域的数据修正
- 核心概念：Adjustment、AdjustmentLine、AdjustmentHistory
- 投入策略：自研，中度定制
- 理由：调整功能支持库存数据的修正和追溯，但不是核心竞争力

库存锁定域
- 职责：为订单预留库存，防止超卖
- 核心概念：InventoryLock
- 投入策略：自研，中度定制
- 理由：锁定功能支持订单履约，但逻辑相对独立

---

### 通用域（Generic Domain）

配置管理域
- 职责：管理动态属性映射、自定义字段显示、序列号生成
- 核心概念：DynPropertyMapping、CustomizeFields、Sequences
- 投入策略：标准方案，低度定制
- 理由：配置功能是通用能力，可复用现有方案

日志审计域
- 职责：记录库存变更日志和业务活动
- 核心概念：InventoryLog、InventoryActivity
- 投入策略：标准方案，低度定制
- 理由：日志功能是通用能力，主要用于追溯和审计

---

## 3. 限界上下文（Bounded Context）

### 上下文划分

库存核心上下文（Inventory Core Context）
- 职责：管理库存记录的创建、更新、查询、移动
- 核心概念：Inventory、InventoryMove、InventoryStatus
- 所属领域：核心域

LP管理上下文（LP Management Context）
- 职责：管理容器的创建、更新、查询、状态流转
- 核心概念：Lp、LpType、LpStatus
- 所属领域：核心域

调整管理上下文（Adjustment Context）
- 职责：管理调整单的创建、审批、执行
- 核心概念：Adjustment、AdjustmentLine、AdjustmentHistory、AdjustmentType
- 所属领域：支撑域

库存锁定上下文（Inventory Lock Context）
- 职责：管理库存锁定的创建、查询、释放
- 核心概念：InventoryLock、InventoryLockStatus
- 所属领域：支撑域

配置管理上下文（Configuration Context）
- 职责：管理动态属性映射、自定义字段、序列号
- 核心概念：DynPropertyMapping、CustomizeFields、Sequences
- 所属领域：通用域

日志审计上下文（Audit Context）
- 职责：记录库存变更日志和业务活动
- 核心概念：InventoryLog、InventoryActivity
- 所属领域：通用域

---

### 上下文映射

```
+------------------------------------------------------------------+
|                      库存服务限界上下文                            |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------+     +------------------------+       |
|  |   库存核心上下文        |     |    LP管理上下文         |       |
|  |   (Inventory Core)     |<--->|    (LP Management)     |       |
|  |                        |  SK |                        |       |
|  | - Inventory            |     | - Lp                   |       |
|  | - InventoryMove        |     | - LpType               |       |
|  | - InventoryStatus      |     | - LpStatus             |       |
|  +------------------------+     +------------------------+       |
|           |                              |                       |
|           | U/D                          | U/D                   |
|           v                              v                       |
|  +------------------------+     +------------------------+       |
|  |   调整管理上下文        |     |   库存锁定上下文        |       |
|  |   (Adjustment)         |     |   (Inventory Lock)     |       |
|  |                        |     |                        |       |
|  | - Adjustment           |     | - InventoryLock        |       |
|  | - AdjustmentLine       |     | - InventoryLockStatus  |       |
|  | - AdjustmentHistory    |     |                        |       |
|  +------------------------+     +------------------------+       |
|           |                              |                       |
|           +------------+  +--------------+                       |
|                        |  |                                      |
|                        v  v                                      |
|  +------------------------+     +------------------------+       |
|  |   日志审计上下文        |     |   配置管理上下文        |       |
|  |   (Audit)              |     |   (Configuration)      |       |
|  |                        |     |                        |       |
|  | - InventoryLog         |     | - DynPropertyMapping   |       |
|  | - InventoryActivity    |     | - CustomizeFields      |       |
|  |                        |     | - Sequences            |       |
|  +------------------------+     +------------------------+       |
|                                                                  |
+------------------------------------------------------------------+
                              |
                              | ACL
                              v
+------------------------------------------------------------------+
|                        外部系统                                   |
+------------------------------------------------------------------+
|  +----------------+  +----------------+  +----------------+       |
|  | 订单系统       |  | 收货系统       |  | 库位系统       |       |
|  | (Order)        |  | (Receive)      |  | (Location)     |       |
|  +----------------+  +----------------+  +----------------+       |
+------------------------------------------------------------------+
```

#### 4.3.1 调整类型执行规则

- ADD_INVENTORY：按 inventoryIdentifier 创建库存；若携带 sns，则按 SN 拆分为多条库存记录（qty=1）
- ADJUST_QTY：adjustTo - adjustFrom 计算差值；正数创建库存（ADJUSTIN），负数走库存移动并标记 ADJUSTOUT；双单位同步计算 adjustQty2
- ADJUST_STATUS / ADJUST_TITLE / ADJUST_GOOD_TYPE / ADJUST_LOT_NO / ADJUST_EXPIRATION_DATE / ADJUST_MFG_DATE：通过库存移动更新目标字段，adjustTo 为目标值
- ADJUST_LP：目标 LP 不能为 SHIPPED 或 HLP；如设置 adjustQty 则按数量移动，否则直接更新 lpId
- ADJUST_LOCATION：校验 LP 不可关联拣货位 HLP；若目标库位为 PICK 类型，LP 取库位的 HLP
- 调整历史：属性类调整按分组记录两条历史（旧值→0、0→新值），数量类记录 from/to 与差值

---

### 上下文关系说明

库存核心 <-> LP管理：Shared Kernel (SK)
- 库存记录通过 lpId 关联 LP
- 库存移动时需要验证 LP 状态
- 共享 LP 状态验证逻辑

库存核心 -> 调整管理：Customer-Supplier (U/D)
- 调整管理依赖库存核心提供的库存数据
- 调整审批时调用库存核心的创建/移动接口

库存核心 -> 库存锁定：Customer-Supplier (U/D)
- 库存锁定依赖库存核心计算可用库存
- 锁定时需要查询库存核心的库存数据

库存核心 -> 日志审计：Customer-Supplier (U/D)
- 库存变更时自动触发日志记录
- 库存操作时自动触发活动记录

所有上下文 -> 配置管理：Customer-Supplier (U/D)
- 各上下文依赖配置管理提供动态属性映射
- 依赖序列号服务生成业务ID

库存服务 -> 外部系统：Anti-Corruption Layer (ACL)
- 通过防腐层隔离外部系统
- 订单系统调用库存锁定接口
- 收货系统调用库存创建接口
- 库位系统提供库位信息（只读引用）

---

## 4. 业务流程

### 4.1 库存入库流程

```
[操作员(PDA)]                    [系统]
     |                              |
     v                              |
(1) 扫描收货单 -----------------> 生成收货任务
     |                              |
     v                              |
(2) 扫描商品/LP                     |
     |                              |
     v                              |
(3) 确认收货数量 ----------------> 创建库存记录(status=RECEIVING)
     |                              |
     |                              v
     |                         创建LP记录(status=RECEIVING)
     |                              |
     |                              v
     |                         记录库存日志(INSERT)
     |                              |
     |                              v
     |                         记录库存活动(RECEIVE)
     |                              |
     v                              v
[收货完成]                    [生成上架任务]
     |                              |
     v                              |
(4) 扫描LP                          |
     |                              |
     v                              |
(5) 扫描目标库位 ----------------> 库存移动(locationId变更)
     |                              |
     |                              v
     |                         更新库存状态(RECEIVING -> OPEN)
     |                              |
     |                              v
     |                         更新LP状态(RECEIVING -> IN_STOCK)
     |                              |
     |                              v
     |                         记录库存活动(PUT_AWAY)
     |                              |
     v                              v
[上架完成]                    [入库流程结束]
```

---

### 4.2 库存出库流程

```
[订单系统]                    [库存系统]                    [操作员(PDA)]
     |                              |                              |
     v                              |                              |
(1) 创建订单                        |                              |
     |                              |                              |
     v                              |                              |
(2) 调用库存锁定接口 ------------> 查询可用库存                    |
     |                              |                              |
     |                              v                              |
     |                         计算可锁定数量                      |
     |                         (可用库存 - 已锁定)                 |
     |                              |                              |
     |                              v                              |
     |                         创建锁定记录(status=ACTIVE)         |
     |                              |                              |
     v                              v                              |
[收到锁定结果]               [生成拣货任务] -----------------> 接收任务
     |                              |                              |
     |                              |                              v
     |                              |                         (3) 扫描源LP
     |                              |                              |
     |                              |                              v
     |                              |                         (4) 扫描目标LP
     |                              |                              |
     |                              v                              |
     |                         库存移动(lpId变更) <--------------- 确认拣货
     |                              |                              |
     |                              v                              |
     |                         更新库存状态(OPEN -> PICKED)        |
     |                              |                              |
     |                              v                              |
     |                         更新LP状态(IN_STOCK -> PICKED)      |
     |                              |                              |
     |                              v                              |
     |                         记录库存活动(PICK)                  |
     |                              |                              v
     |                              |                         (5) 扫描LP确认打包
     |                              |                              |
     |                              v                              |
     |                         更新库存状态(PICKED -> PACKED) <--- 确认
     |                              |                              |
     |                              v                              |
     |                         更新LP状态(PICKED -> PACKED)        |
     |                              |                              |
     |                              v                              |
     |                         记录库存活动(PACK)                  |
     |                              |                              v
     |                              |                         (6) 扫描LP确认发货
     |                              |                              |
     |                              v                              |
     |                         更新库存状态(PACKED -> SHIPPED) <-- 确认
     |                              |                              |
     |                              v                              |
     |                         更新LP状态(PACKED -> SHIPPED)       |
     |                              |                              |
     |                              v                              |
     |                         删除库存锁定记录                    |
     |                              |                              |
     |                              v                              |
     |                         记录库存活动(LOAD)                  |
     |                              |                              |
     v                              v                              v
[订单完成]                   [出库流程结束]                  [发货完成]
```

---

### 4.3 库存调整流程

```
[管理员(PC)]                                [系统]
     |                                         |
     v                                         |
(1) 选择调整类型                               |
     |                                         |
     v                                         |
(2) 填写调整信息                               |
     |                                         |
     +-- ADD_INVENTORY ----------------------> |
     |   (新增库存)                            |
     |                                         |
     +-- ADJUST_QTY -------------------------> |
     |   (调整数量)                            |
     |                                         |
     +-- ADJUST_STATUS ----------------------> |
     |   (调整状态)                            |
     |                                         |
     +-- ADJUST_TITLE -----------------------> |
     |   (调整货权)                            |
     |                                         |
     +-- ADJUST_LP --------------------------> |
     |   (调整LP)                              |
     |                                         |
     +-- ADJUST_LOCATION --------------------> |
         (调整库位)                            |
     |                                         |
     v                                         v
(3) 提交调整单 --------------------------> 生成调整单ID(ADJ-{SEQUENCE})
     |                                         |
     |                                         v
     |                                    创建调整单(status=NEW)
     |                                         |
     |                                         v
     |                                    创建调整行
     |                                         |
     v                                         v
[调整单创建完成]                          [等待审批]
     |                                         |
     v                                         |
(4) 审批调整单 --------------------------> 验证调整单状态(必须为NEW)
     |                                         |
     |                                         v
     |                                    遍历调整行，按类型执行：
     |                                         |
     |                                    +----+----+
     |                                    |         |
     |                                    v         v
     |                              [数量增加]  [数量减少/属性变更]
     |                                    |         |
     |                                    v         v
     |                              创建库存    库存移动
     |                                    |         |
     |                                    +----+----+
     |                                         |
     |                                         v
     |                                    创建调整历史记录
     |                                         |
     |                                         v
     |                                    更新调整单状态(NEW -> APPROVED)
     |                                         |
     |                                         v
     |                                    发送调整审批事件
     |                                         |
     v                                         v
[审批完成]                               [调整流程结束]
```

---

### 4.4 库存导入流程

```
[管理员(PC)]                                [系统]
     |                                         |
     v                                         |
(1) 上传CSV/Excel文件 --------------------> 解析文件内容
     |                                         |
     |                                         v
     |                                    显示数据预览
     |                                         |
     v                                         |
(2) 配置字段映射 -------------------------> 验证必填字段
     |                                         |
     |                                    +----+----+
     |                                    |         |
     |                                    v         v
     |                              [验证通过]  [验证失败]
     |                                    |         |
     |                                    |         v
     |                                    |    返回错误信息
     |                                    |         |
     v                                    v         |
(3) 确认导入 ----------------------------> 验证数据完整性
     |                                         |
     |                                    +----+----+----+
     |                                    |    |    |    |
     |                                    v    v    v    v
     |                              验证客户 验证LP 验证库位 验证商品
     |                                    |    |    |    |
     |                                    +----+----+----+
     |                                         |
     |                                    +----+----+
     |                                    |         |
     |                                    v         v
     |                              [全部通过]  [存在错误]
     |                                    |         |
     |                                    |         v
     |                                    |    返回错误明细
     |                                    |         |
     |                                    v         |
     |                              创建调整单(type=ADD_INVENTORY)
     |                                    |
     |                                    v
     |                              自动审批调整单
     |                                    |
     |                                    v
     |                              创建库存记录
     |                                    |
     |                                    v
     |                              记录库存日志
     |                                    |
     v                                    v
[导入完成]                           [导入流程结束]
```

---

### 4.5 事件风暴摘要

库存核心上下文：
- 命令：CreateInventory -> 事件：InventoryCreated -> 策略：记录日志、记录活动
- 命令：MoveInventory -> 事件：InventoryMoved -> 策略：记录日志、记录活动、发送变更事件
- 命令：UpdateInventoryStatus -> 事件：InventoryStatusUpdated -> 策略：记录日志

LP管理上下文：
- 命令：CreateLp -> 事件：LpCreated
- 命令：UpdateLpStatus -> 事件：LpStatusUpdated
- 命令：MoveLp -> 事件：LpMoved -> 策略：同步更新LP内库存位置

调整管理上下文：
- 命令：CreateAdjustment -> 事件：AdjustmentCreated
- 命令：ApproveAdjustment -> 事件：AdjustmentApproved -> 策略：执行库存调整、记录历史

库存锁定上下文：
- 命令：LockInventory -> 事件：InventoryLocked
- 命令：ReleaseInventoryLock -> 事件：InventoryLockReleased

---

### 4.6 库存状态流转图

```
                              +-------------+
                              |  RECEIVING  |  <-- 收货创建
                              +-------------+
                                    |
                                    | 上架完成
                                    v
+-------------+              +-------------+              +-------------+
|  ADJUSTOUT  | <-- 调整出库 |    OPEN     | -- 拣货 --> |   PICKED    |
+-------------+              +-------------+              +-------------+
                                    ^                           |
                                    |                           | 打包
                                    |                           v
                              +-------------+              +-------------+
                              |  RESTOCKED  |              |   PACKED    |
                              +-------------+              +-------------+
                                    ^                           |
                                    |                           | 装车
                                    | 返库                      v
                              +-------------+              +-------------+
                              |   DAMAGE    |              |   LOADED    |
                              +-------------+              +-------------+
                                    ^                           |
                                    |                           | 发货
                                    | 损坏标记                  v
                              +-------------+              +-------------+
                              |   ONHOLD    |              |   SHIPPED   |
                              +-------------+              +-------------+
```

---

### 4.7 LP 状态流转图

```
+-------------+
|     NEW     |  <-- 创建LP
+-------------+
      |
      | 开始收货
      v
+-------------+              +-------------+
|  RECEIVING  | -- 收货完成 -->|  IN_STOCK   |
+-------------+              +-------------+
                                    |
                    +---------------+---------------+
                    |               |               |
                    v               v               v
              +-------------+ +-------------+ +-------------+
              |   PICKED    | |   STAGED    | |  ON_HOLD    |
              +-------------+ +-------------+ +-------------+
                    |               |               |
                    v               v               |
              +-------------+ +-------------+       |
              |   PACKED    | |STAGE_TO_LOAD|       |
              +-------------+ +-------------+       |
                    |               |               |
                    +-------+-------+               |
                            |                       |
                            v                       |
                      +-------------+               |
                      |   LOADED    |               |
                      +-------------+               |
                            |                       |
                            | 发货                  |
                            v                       |
                      +-------------+               |
                      |   SHIPPED   | <-------------+
                      +-------------+   (异常处理)
                            
特殊状态：
+-------------+    +-------------+
| QUARANTINE  |    | EXCEPTIONAL |
+-------------+    +-------------+
   (隔离)            (异常)
```

---

### 4.8 调整单状态流转图

```
+-------------+
|     NEW     |  <-- 创建调整单
+-------------+
      |
      +------------------+------------------+
      |                  |                  |
      | 审批通过         | 审批拒绝         | 取消
      v                  v                  v
+-------------+    +-------------+    +-------------+
|  APPROVED   |    |  DECLINED   |    |  CANCELLED  |
+-------------+    +-------------+    +-------------+
      |
      | 执行调整
      v
+-------------+
|  EXECUTED   |  (可选状态，部分系统使用)
+-------------+
```

---

## 5. 业务规则

### 库存核心上下文规则

BR-INV-001 库存创建必填字段
- 规则：创建库存时必须提供 customerId、itemId、qty、uomId、lpId
- 触发场景：创建库存记录

BR-INV-002 基础数量自动计算
- 规则：baseQty = qty x 单位换算系数
- 触发场景：创建或更新库存数量

BR-INV-003 双单位验证
- 规则：如果开启双单位模式，必须提供有效的 qty2 和 uomId2
- 触发场景：创建或更新库存

BR-INV-004 库存移动源验证
- 规则：源库存必须存在且数量充足
- 触发场景：库存移动

BR-INV-005 库存移动目标LP验证
- 规则：目标LP状态不能为SHIPPED，且不能是HLP类型
- 触发场景：库存移动

BR-INV-006 拣货位自动关联HLP
- 规则：移动到拣货位时，LP应自动关联到库位的HLP
- 触发场景：库存移动到PICK类型库位

BR-INV-007 禁止直接更新为ADJUSTOUT
- 规则：不允许直接将库存状态更新为ADJUSTOUT，必须通过调整单
- 触发场景：更新库存状态

BR-INV-008 默认排除无效库存
- 规则：查询时默认排除 qty <= 0 和 status = ADJUSTOUT 的记录
- 触发场景：查询库存列表

BR-INV-009 单位转换整数验证
- 规则：单位转换后的数量必须为整数，否则报错
- 触发场景：库存单位转换

BR-INV-010 差异标记联动释放
- 规则：释放单条库存差异时，如果该商品无其他DISCREPANCY记录，应同时释放WARNING记录
- 触发场景：释放库存差异标记

---

### LP管理上下文规则

BR-LP-001 LP ID格式
- 规则：LP ID格式为 {TYPE}-{PREFIX}{SEQUENCE}
- 触发场景：创建LP

BR-LP-002 LP删除软删除
- 规则：删除LP时不物理删除，而是标记为ON_HOLD状态
- 触发场景：删除LP

BR-LP-003 LP删除库存处理
- 规则：如果LP中有库存，应创建调整单将库存数量调整为0
- 触发场景：删除有库存的LP

BR-LP-004 LP移动同步库存
- 规则：LP整体移动时，应同步更新LP内所有库存的locationId
- 触发场景：LP整体移动

---

### 调整管理上下文规则

BR-ADJ-001 调整单ID格式
- 规则：调整单ID格式为 ADJ-{SEQUENCE}
- 触发场景：创建调整单

BR-ADJ-002 审批状态验证
- 规则：只有状态为NEW的调整单才能审批
- 触发场景：审批调整单

BR-ADJ-003 防重复提交
- 规则：审批操作需要防止重复提交
- 触发场景：审批调整单

BR-ADJ-004 调整数量增加处理
- 规则：ADJUST_QTY类型且数量增加时，创建新库存记录
- 触发场景：审批调整单

BR-ADJ-005 调整数量减少处理
- 规则：ADJUST_QTY类型且数量减少时，将库存移动到ADJUSTOUT状态
- 触发场景：审批调整单

BR-ADJ-006 调整LP目标验证
- 规则：ADJUST_LP类型时，目标LP不能是SHIPPED状态且不能是HLP类型
- 触发场景：审批调整单

BR-ADJ-007 调整库位拣货位处理
- 规则：ADJUST_LOCATION类型时，PICK类型库位自动关联HLP
- 触发场景：审批调整单

---

### 库存锁定上下文规则

BR-LOCK-001 锁定数量计算
- 规则：可锁定数量 = 可用库存baseQty - 已锁定baseQty(status=ACTIVE)
- 触发场景：创建库存锁定

BR-LOCK-002 锁定状态判定
- 规则：全部满足需求则status=ACTIVE，部分满足或无法满足则status=INACTIVE
- 触发场景：创建库存锁定

BR-LOCK-003 重新分配清理
- 规则：重新分配前需要先释放该订单已有的锁定记录
- 触发场景：订单重新分配

---

### 配置管理上下文规则

BR-CFG-001 序列号并发安全
- 规则：序列号生成使用行锁保证并发安全
- 触发场景：获取序列号

BR-CFG-002 序列号单调递增
- 规则：序列号必须单调递增，不重复
- 触发场景：获取序列号

BR-CFG-003 动态属性映射隔离
- 规则：不同租户可以有不同的动态属性映射配置
- 触发场景：读写动态属性

---

### 日志审计上下文规则

BR-LOG-001 库存变更自动记录
- 规则：库存创建、更新、移动时自动记录日志
- 触发场景：库存数据变更

BR-LOG-002 日志快照完整性
- 规则：日志应包含变更前后的完整快照（JSON格式）
- 触发场景：记录库存日志

BR-LOG-003 活动记录完整性
- 规则：活动记录应包含完整的流转信息（from/to位置、状态、任务关联）
- 触发场景：记录库存活动

---

## 参考文档

- .kiro/specs/inventory-domain/01-story.md（用户故事）
- docs/Inventory_Service_User_Stories.md（原始需求文档）

