# 库存领域 - 技术设计

## 1. 架构设计

### 1.1 整体架构

```
wms-app/
  src/main/java/com/t5/wms/inventory/
    interfaces/           # 接口层
      rest/               # REST Controller
    application/          # 应用层
      inventory/          # 库存应用服务
      lp/                 # LP应用服务
      adjustment/         # 调整单应用服务
      inventorylock/      # 库存锁定应用服务
    domain/               # 领域层
      inventory/          # 库存领域
      lp/                 # LP领域
      adjustment/         # 调整单领域
      inventorylock/      # 库存锁定领域
      common/             # 公共领域对象
    infrastructure/       # 基础设施层
      persistence/        # 持久化实现
      handler/            # 处理器
      enums/              # 错误码枚举
```

---

### 1.2 分层职责

接口层（interfaces）
- 处理 HTTP 请求
- 参数校验
- 调用应用服务
- 返回响应

应用层（application）
- 用例编排
- 事务管理
- DTO 转换
- 调用领域服务

领域层（domain）
- 核心业务逻辑
- 领域规则验证
- 聚合根管理
- 领域事件发布

基础设施层（infrastructure）
- 持久化实现
- 外部服务调用
- 技术组件封装

---

## 2. API 设计

### 2.1 库存管理 API

创建库存
- 路径：POST /api/inventory
- 请求体：InventoryCreateCmd
- 响应：{ id: Long }

更新库存
- 路径：PUT /api/inventory/{id}
- 请求体：InventoryUpdateCmd
- 响应：void

查询库存列表
- 路径：GET /api/inventory
- 参数：InventoryQuery
- 响应：List<InventoryDto>

分页查询库存
- 路径：GET /api/inventory/page
- 参数：InventoryQuery + 分页参数
- 响应：PageResult<InventoryDto>

库存移动
- 路径：POST /api/inventory/move
- 请求体：InventoryMoveCmd
- 响应：void

批量库存移动
- 路径：POST /api/inventory/batch-move
- 请求体：List<InventoryMoveCmd>
- 响应：void

更新库存状态
- 路径：PUT /api/inventory/status
- 请求体：InventoryStatusUpdateCmd
- 响应：void

设置差异标记
- 路径：PUT /api/inventory/discrepancy-flag
- 请求体：InventoryDiscrepancyFlagCmd
- 响应：void

释放差异标记
- 路径：PUT /api/inventory/release-discrepancy
- 请求体：InventoryDiscrepancyReleaseCmd
- 响应：void

单位转换
- 路径：POST /api/inventory/change-uom
- 请求体：InventoryChangeUomCmd
- 响应：List<InventoryDto>

库存统计
- 路径：GET /api/inventory/statistics/quantity
- 参数：InventoryStatisticsQuery
- 响应：{ totalQty: Double }

下载导入模板
- 路径：GET /api/inventory/import/template
- 响应：File

批量导入
- 路径：POST /api/inventory/upload
- 请求体：List<InventoryImportDto>
- 响应：void

导出库存
- 路径：GET /api/inventory/export
- 参数：InventoryExportQuery
- 响应：File

---

### 2.2 LP 管理 API

创建LP
- 路径：POST /api/lp
- 请求体：LpCreateCmd
- 响应：LpDto

批量创建LP
- 路径：POST /api/lp/batch
- 请求体：LpBatchCreateCmd
- 响应：List<LpDto>

更新LP
- 路径：PUT /api/lp/{id}
- 请求体：LpUpdateCmd
- 响应：void

批量更新LP状态
- 路径：PUT /api/lp/batch-status
- 请求体：LpBatchStatusUpdateCmd
- 响应：void

查询LP列表
- 路径：GET /api/lp
- 参数：LpQuery
- 响应：List<LpDto>

分页查询LP
- 路径：GET /api/lp/page
- 参数：LpQuery + 分页参数
- 响应：PageResult<LpDto>

查询LP详情
- 路径：GET /api/lp/{id}
- 响应：LpDto

删除LP
- 路径：DELETE /api/lp/{id}
- 响应：void

LP移动
- 路径：PUT /api/lp/{id}/move
- 请求体：LpMoveCmd
- 响应：void

---

### 2.3 调整单 API

创建调整单
- 路径：POST /api/adjustment
- 请求体：AdjustmentCreateCmd
- 响应：{ id: String }

批量创建调整单
- 路径：POST /api/adjustment/batch
- 请求体：List<AdjustmentCreateCmd>
- 响应：void

审批调整单
- 路径：PUT /api/adjustment/{id}/approve
- 响应：void

批量审批
- 路径：PUT /api/adjustment/batch-approve
- 请求体：List<String>
- 响应：void

查询调整单列表
- 路径：GET /api/adjustment
- 参数：AdjustmentQuery
- 响应：List<AdjustmentDto>

查询调整单详情
- 路径：GET /api/adjustment/{id}
- 响应：AdjustmentDto

创建调整行
- 路径：POST /api/adjustment-line
- 请求体：AdjustmentLineCreateCmd
- 响应：{ id: Long }

批量创建调整行
- 路径：POST /api/adjustment-line/batch
- 请求体：List<AdjustmentLineCreateCmd>
- 响应：{ ids: List<Long> }

更新调整行
- 路径：PUT /api/adjustment-line/{id}
- 请求体：AdjustmentLineUpdateCmd
- 响应：void

删除调整行
- 路径：DELETE /api/adjustment-line/{id}
- 响应：void

---

### 2.4 库存锁定 API

创建库存锁定
- 路径：POST /api/inventory-lock
- 请求体：InventoryLockByOrderCmd
- 响应：void

查询库存锁定
- 路径：GET /api/inventory-lock
- 参数：InventoryLockQuery
- 响应：List<InventoryLockDto>

分页查询
- 路径：GET /api/inventory-lock/page
- 参数：InventoryLockQuery + 分页参数
- 响应：PageResult<InventoryLockDto>

释放锁定
- 路径：PUT /api/inventory-lock/{id}/deactivate
- 响应：void

导出锁定数据
- 路径：GET /api/inventory-lock/export
- 参数：InventoryLockExportQuery
- 响应：File

---

### 2.5 日志查询 API

查询库存日志
- 路径：GET /api/inventory-log
- 参数：InventoryLogQuery
- 响应：List<InventoryLogDto>

查询库存活动
- 路径：GET /api/inventory-activity
- 参数：InventoryActivityQuery
- 响应：List<InventoryActivityDto>

创建库存活动
- 路径：POST /api/inventory-activity
- 请求体：InventoryActivityCreateCmd
- 响应：{ id: Long }

---

### 2.6 配置管理 API

查询动态属性映射
- 路径：GET /api/dynproperty-mapping
- 参数：DynPropertyMappingQuery
- 响应：List<DynPropertyMappingDto>

创建动态属性映射
- 路径：POST /api/dynproperty-mapping
- 请求体：DynPropertyMappingCreateCmd
- 响应：{ id: Long }

更新动态属性映射
- 路径：PUT /api/dynproperty-mapping/{id}
- 请求体：DynPropertyMappingUpdateCmd
- 响应：void

删除动态属性映射
- 路径：DELETE /api/dynproperty-mapping/{id}
- 响应：void

查询自定义字段配置
- 路径：GET /api/customize-fields
- 参数：CustomizeFieldsQuery
- 响应：List<CustomizeFieldsDto>

---

## 3. DTO 设计

### 3.1 库存 DTO

```java
public class InventoryDto {
    private Long id;
    private String customerId;
    private String titleId;
    private String itemId;
    private Double qty;
    private String uomId;
    private String uom;
    private Double baseQty;
    private Double qty2;
    private String uomId2;
    private String sn;
    private String status;
    private String type;
    private String mode;
    private String channel;
    private String lotNo;
    private LocalDateTime expirationDate;
    private LocalDateTime mfgDate;
    private String lpId;
    private String locationId;
    private String receiptId;
    private String orderId;
    private String adjustmentId;
    private String supplierId;
    // Dynamic properties
    private Map<String, String> dynamicTextProperties;
    private Map<String, LocalDateTime> dynamicDateProperties;
    // Audit fields
    private String createdBy;
    private LocalDateTime createdTime;
    private String updatedBy;
    private LocalDateTime updatedTime;
}
```

---

### 3.2 库存移动命令

```java
public class InventoryMoveCmd {
    private InventoryMoveFrom from;
    private InventoryMoveTo to;
    private Double moveInventoryQty;
    private Double moveInventoryQty2;
    private Boolean isEntireLPMove;
    private String inventoryMoveType;
    private String inventoryActivityType;
    private String taskId;
    private String taskType;
}

public class InventoryMoveFrom {
    private Long inventoryId;
    private String itemId;
    private String lpId;
    private String locationId;
    private String lotNo;
    private String titleId;
    private String sn;
    private String status;
}

public class InventoryMoveTo {
    private String lpId;
    private String locationId;
    private String status;
    private String titleId;
    private String type;
    private String adjustmentId;
    private String uomId;
}
```

---

### 3.3 调整单 DTO

```java
public class AdjustmentDto {
    private String id;
    private String customerId;
    private String status;
    private String reason;
    private String note;
    private LocalDateTime approveTime;
    private String approveBy;
    private List<AdjustmentLineDto> lines;
    private LocalDateTime createdTime;
    private String createdBy;
}

public class AdjustmentLineDto {
    private Long id;
    private String adjustmentId;
    private String type;
    private InventoryIdentifierDto inventoryIdentifier;
    private String adjustFrom;
    private String adjustTo;
    private Double adjustQty;
    private String toLpId;
}
```

---

## 4. 错误码设计

### 4.1 库存错误码

INVENTORY_NOT_FOUND_ERROR
- 编码：INV-001
- 描述：库存不存在
- HTTP状态：404

INVENTORY_CREATE_FAILED
- 编码：INV-002
- 描述：库存创建失败
- HTTP状态：500

INVENTORY_NO_ENOUGH
- 编码：INV-003
- 描述：库存不足
- HTTP状态：400

INVENTORY_STATUS_NOT_ALLOW_TO_UPDATE
- 编码：INV-004
- 描述：库存状态不允许更新
- HTTP状态：400

DUAL_UOM_QTY2_REQUIRED
- 编码：INV-005
- 描述：双单位模式下qty2必填
- HTTP状态：400

UNIT_CONVERT_ERROR
- 编码：INV-006
- 描述：单位转换错误
- HTTP状态：400

---

### 4.2 LP 错误码

LP_NOT_FOUND
- 编码：LP-001
- 描述：LP不存在
- HTTP状态：404

LP_CREATE_FAILED
- 编码：LP-002
- 描述：LP创建失败
- HTTP状态：500

CANNOT_MOVE_TO_SHIPPED_LP
- 编码：LP-003
- 描述：不能移动到已发货的LP
- HTTP状态：400

CANNOT_MOVE_LP_TO_HLP
- 编码：LP-004
- 描述：不能移动LP到HLP
- HTTP状态：400

---

### 4.3 调整单错误码

ADJUSTMENT_CREATE_FAILED
- 编码：ADJ-001
- 描述：调整单创建失败
- HTTP状态：500

ADJUSTMENT_NOT_FOUND
- 编码：ADJ-002
- 描述：调整单不存在
- HTTP状态：404

ADJUSTMENT_STATUS_INVALID
- 编码：ADJ-003
- 描述：调整单状态无效
- HTTP状态：400

ADJUSTMENT_ALREADY_APPROVED
- 编码：ADJ-004
- 描述：调整单已审批
- HTTP状态：400

---

## 5. 安全设计

### 5.1 认证授权

- 所有 API 需要 JWT Token 认证
- 基于角色的权限控制（RBAC）
- 租户隔离通过 TenantContext 实现

### 5.2 权限矩阵

库存管理员
- 库存：查询、创建、更新、移动、导入、导出
- LP：查询、创建、更新、删除
- 调整单：查询、创建、审批
- 配置：查询、创建、更新、删除

库存操作员
- 库存：查询、移动
- LP：查询、创建
- 调整单：查询、创建

库存查看者
- 库存：查询
- LP：查询
- 调整单：查询

---

## 6. 性能设计

### 6.1 查询优化

- 库存表按 customer_id、item_id、lp_id、location_id 建立索引
- 分页查询使用游标分页（大数据量）
- 统计查询使用缓存（5分钟过期）

### 6.2 批量处理

- 批量创建库存使用 batch insert
- 批量移动使用事务批处理
- 导入使用异步任务处理

### 6.3 并发控制

- 序列号生成使用行锁 + 乐观锁重试
- 调整单审批使用防重复提交
- 库存移动使用乐观锁

---

## 7. 事件设计

### 7.1 领域事件

InventoryCreatedEvent
- Topic：inventory.created
- 触发：库存创建成功

InventoryMovedEvent
- Topic：inventory.moved
- 触发：库存移动成功

InventoryStatusChangedEvent
- Topic：inventory.status.changed
- 触发：库存状态变更为 OPEN

AdjustmentApprovedEvent
- Topic：adjustment.approved
- 触发：调整单审批成功

### 7.2 事件发布

使用 DomainEventPublisher 发布事件，支持同步和异步两种模式。

---

## 参考文档

- .kiro/specs/inventory-domain/04-domain-model.md（领域建模）
- .kiro/specs/inventory-domain/03-requirements.md（需求规格）

