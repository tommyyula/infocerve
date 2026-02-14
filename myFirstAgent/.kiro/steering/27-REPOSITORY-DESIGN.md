---
inclusion: manual
---

# 仓储设计规范（Repository Design Guidelines）

## 概述

本规范定义了 DDD 仓储层（Infrastructure Layer）的设计标准，专注于 Repository 实现类、Entity-PO 映射、数据库表结构和缓存策略的设计。

[重要] Repository 接口在阶段 4 概要定义（职责和方法名），在阶段 6 详细设计（具体参数、返回值类型），本阶段聚焦于实现类设计。

---

## 文件位置

```
.kiro/specs/{feature-name}/07-repository-design.md
```

---

## 创建时机

仓储设计应在技术设计完成后创建：

```
06-design.md -> 07-repository-design.md -> 08-e2e-test-cases.md
```

---

## 前置依赖

本阶段依赖以下已完成的设计：

- 阶段 4（领域建模）：聚合根、实体、值对象定义
- 阶段 6（技术设计）：Repository 接口详细设计（具体参数、返回值类型）

---

## 模板结构

### 新模块设计模板

```markdown
# {功能名称} - 仓储设计

## 1. 设计概述
## 2. Repository 实现设计
## 3. Entity-PO 映射
## 4. 表结构设计
## 5. 索引设计
## 6. 缓存策略
## 7. 查询优化
## 8. 数据迁移脚本
```

### 迭代设计模板

```markdown
# {功能名称} - 仓储设计

[设计类型] 迭代设计（基于已有 {模块名称} 模块）

## 1. 设计概述

## 2. 影响范围分析
### 2.1 需要新增的仓储实现
### 2.2 需要修改的仓储实现
### 2.3 数据库变更影响

## 3. 兼容性分析
### 3.1 Repository 实现兼容性
### 3.2 数据库兼容性
### 3.3 缓存兼容性

## 4. Repository 实现设计
### 4.1 新增的 Repository 实现
### 4.2 修改的 Repository 实现

## 5. Entity-PO 映射
### 5.1 新增的映射
### 5.2 修改的映射

## 6. 表结构设计
### 6.1 新增的表
### 6.2 修改的表

## 7. 索引设计
### 7.1 新增的索引
### 7.2 修改的索引

## 8. 缓存策略
### 8.1 新增的缓存
### 8.2 修改的缓存

## 9. 查询优化

## 10. 数据迁移脚本
### 10.1 表结构变更脚本
### 10.2 数据迁移脚本
### 10.3 回滚脚本
```

---

## 1. 设计概述

描述仓储层设计的范围和原则。

### 新模块设计概述

```markdown
## 1. 设计概述

[设计类型] 新模块设计

### 设计范围

- Repository 实现类（RepositoryImpl）
- 持久化对象（PO）
- MyBatis Mapper
- 数据库表结构（MySQL）
- 缓存策略（Redis）
- 查询优化方案

### 设计原则

1. 领域驱动 - 基于领域模型设计存储结构
2. 聚合边界 - 一个聚合对应一组表
3. 接口隔离 - Repository 接口已在领域层定义，本阶段只设计实现类
4. 扩展性 - 预留扩展字段（ext1~ext10）
5. 审计追踪 - 包含创建/更新时间和操作人
6. 软删除 - 使用 is_deleted 标记而非物理删除
7. 性能优先 - 合理使用缓存和索引
```

### 迭代设计概述

```markdown
## 1. 设计概述

[设计类型] 迭代设计（基于已有收货模块）

本设计在现有收货模块仓储层基础上，支持质检流程的数据持久化：
- 新增 QualityInspectionRepositoryImpl
- 修改 ReceiptRepositoryImpl（支持质检状态查询）
- 修改 ReceiptPO（新增质检字段）
- 修改 wms_receipt 表（新增质检字段）
- 新增 wms_quality_inspection 表

### 设计范围

新增部分：
- QualityInspectionRepositoryImpl
- QualityInspectionPO
- QualityInspectionMapper
- wms_quality_inspection 表及索引
- 质检数据缓存策略

修改部分：
- ReceiptRepositoryImpl（查询方法）
- ReceiptPO（新增字段）
- ReceiptMapper（修改 SQL）
- wms_receipt 表（新增字段）
- Receipt 缓存策略（Key 不变）

### 设计原则

1. 向后兼容 - 已有功能不受影响
2. 最小改动 - 只修改必要的部分
3. 数据安全 - 提供回滚方案
4. 性能保持 - 不降低已有查询性能
```

## 2. 影响范围分析（仅迭代设计）

### 2.1 需要新增的仓储实现

```markdown
### 2.1 需要新增的仓储实现

QualityInspectionRepositoryImpl：
- 实现 QualityInspectionRepository 接口
- 依赖 QualityInspectionMapper
- 使用 Redis 缓存

QualityInspectionPO：
- 映射 wms_quality_inspection 表
- 包含质检单主要信息

QualityInspectionMapper：
- 基本 CRUD 操作
- 按收货单 ID 查询
- 按状态分页查询

新增表：
- wms_quality_inspection（质检单主表）
- wms_inspection_task（质检任务表）
```

### 2.2 需要修改的仓储实现

```markdown
### 2.2 需要修改的仓储实现

ReceiptRepositoryImpl：
- [修改] findByWarehouseAndStatus() - 支持质检状态过滤
- [新增] findByQcStatus() - 按质检状态查询
- [修改] save() - 保存时处理质检字段

ReceiptPO：
- [新增] qcStatus 字段
- [新增] qcRequired 字段
- [新增] qcCompletedAt 字段

ReceiptMapper.xml：
- [修改] 查询 SQL - 增加质检字段
- [修改] 插入 SQL - 增加质检字段
- [修改] 更新 SQL - 增加质检字段
- [新增] findByQcStatus 查询

ReceiptConverter：
- [修改] toEntity() - 转换质检字段
- [修改] toPO() - 转换质检字段
```

### 2.3 数据库变更影响

```markdown
### 2.3 数据库变更影响

表结构变更：
- wms_receipt 表新增 3 个字段
- 新增 2 个表（wms_quality_inspection、wms_inspection_task）

索引变更：
- wms_receipt 新增索引：idx_qc_status
- wms_quality_inspection 新增索引：idx_receipt_id、idx_status

数据迁移：
- 已有收货单的 qc_status 设置为 'NOT_REQUIRED'
- 已有收货单的 qc_required 设置为 0

性能影响：
- wms_receipt 表增加 3 个字段，行大小增加约 50 字节
- 新增索引可能影响插入性能（预计影响小于 5%）
- 查询性能：新增索引后按质检状态查询性能提升
```

## 3. 兼容性分析（仅迭代设计）

### 3.1 Repository 实现兼容性

```markdown
### 3.1 Repository 实现兼容性

接口方法兼容性：

[不兼容] ReceiptRepository.findByWarehouseAndStatus()
- 原方法签名：
  Page<Receipt> findByWarehouseAndStatus(
      WarehouseId warehouseId, 
      ReceiptStatus status, 
      Pageable pageable
  )
  
- 新方法签名（增加参数）：
  Page<Receipt> findByWarehouseAndStatusAndQc(
      WarehouseId warehouseId, 
      ReceiptStatus status,
      QcStatus qcStatus,
      Pageable pageable
  )

- 兼容性方案：保留原方法，新增重载方法
  ```java
  // 保留原方法（向后兼容）
  @Override
  public Page<Receipt> findByWarehouseAndStatus(
      WarehouseId warehouseId, 
      ReceiptStatus status, 
      Pageable pageable
  ) {
      // 调用新方法，qcStatus 传 null（查询所有）
      return findByWarehouseAndStatusAndQc(
          warehouseId, status, null, pageable
      );
  }
  
  // 新增重载方法
  public Page<Receipt> findByWarehouseAndStatusAndQc(
      WarehouseId warehouseId, 
      ReceiptStatus status,
      QcStatus qcStatus,
      Pageable pageable
  ) {
      // 实现支持质检状态过滤的查询
  }
  ```

[兼容] 新增方法不影响已有功能
- findByQcStatus() - 新增方法
- QualityInspectionRepository 所有方法 - 新增接口

实现类依赖兼容性：
- [兼容] 新增 QualityInspectionMapper 不影响已有 Mapper
- [兼容] ReceiptMapper 修改 SQL，但保持结果集兼容
- [需注意] ReceiptConverter 需要处理新字段的 null 值
```

### 3.2 数据库兼容性

```markdown
### 3.2 数据库兼容性

表结构变更兼容性：

[兼容] wms_receipt 新增字段
```sql
-- 新增字段设置默认值，保证已有数据兼容
ALTER TABLE wms_receipt 
ADD COLUMN qc_status VARCHAR(16) DEFAULT 'NOT_REQUIRED' 
    COMMENT '质检状态: NOT_REQUIRED-无需质检, PENDING-待质检, IN_PROGRESS-质检中, PASSED-质检通过, FAILED-质检不通过',
ADD COLUMN qc_required TINYINT DEFAULT 0 
    COMMENT '是否需要质检: 0-否, 1-是',
ADD COLUMN qc_completed_at DATETIME NULL 
    COMMENT '质检完成时间';

-- 已有数据自动使用默认值，无需额外迁移
```

[兼容] 新增表不影响已有表
```sql
-- 新增表，不影响已有表结构
CREATE TABLE wms_quality_inspection (
    id VARCHAR(36) NOT NULL COMMENT '主键ID',
    ...
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='质检单表';
```

索引兼容性：

[需注意] 新增索引对写入性能的影响
```sql
-- 新增索引，可能影响插入/更新性能
ALTER TABLE wms_receipt 
ADD INDEX idx_qc_status (qc_status);

-- 性能影响评估：
-- - 插入性能：预计下降 3-5%（可接受）
-- - 更新性能：预计下降 3-5%（可接受）
-- - 查询性能：按质检状态查询提升 80%+
```

查询兼容性：

[兼容] 已有查询 SQL 自动包含新字段
```sql
-- 原查询（使用 SELECT *）
SELECT * FROM wms_receipt WHERE id = ?;

-- 新字段自动包含在结果集中，ReceiptPO 需要处理
```

[需注意] 如果原查询使用显式字段列表，需要更新
```sql
-- 原查询（显式字段列表）
SELECT id, receipt_no, status, ... FROM wms_receipt;

-- 需要更新为：
SELECT id, receipt_no, status, ..., qc_status, qc_required, qc_completed_at 
FROM wms_receipt;
```

数据迁移兼容性：

[兼容] 使用默认值处理已有数据
```sql
-- 方案 1：使用默认值（推荐）
-- 新增字段时设置 DEFAULT，已有数据自动使用默认值

-- 方案 2：显式更新（如果需要特殊逻辑）
UPDATE wms_receipt 
SET qc_status = 'NOT_REQUIRED',
    qc_required = 0
WHERE qc_status IS NULL;
```

回滚方案：
```sql
-- 回滚脚本（如果需要）
ALTER TABLE wms_receipt 
DROP COLUMN qc_status,
DROP COLUMN qc_required,
DROP COLUMN qc_completed_at;

DROP TABLE IF EXISTS wms_quality_inspection;
DROP TABLE IF EXISTS wms_inspection_task;
```
```

### 3.3 缓存兼容性

```markdown
### 3.3 缓存兼容性

缓存 Key 兼容性：

[兼容] Receipt 缓存 Key 不变
- 原 Key：wms:receipt:{id}
- 新 Key：wms:receipt:{id}（不变）
- 影响：无，已有缓存继续有效

[兼容] 缓存内容扩展
- 原缓存内容：Receipt 对象（不含质检字段）
- 新缓存内容：Receipt 对象（含质检字段）
- 影响：已有缓存在 TTL 过期后自动更新为新格式

缓存更新策略兼容性：

[兼容] save() 方法更新缓存
```java
@CachePut(value = "receipt", key = "#receipt.id")
public Receipt save(Receipt receipt) {
    // 保存时自动更新缓存，包含新字段
    ReceiptPO po = converter.toPO(receipt);
    mapper.save(po);
    return receipt;
}
```

[需注意] 缓存反序列化兼容性
```java
// 已有缓存（旧格式）反序列化时，新字段为 null
// ReceiptPO 需要处理 null 值

@Data
public class ReceiptPO {
    // 已有字段
    private String id;
    private String receiptNo;
    
    // 新增字段（需要处理 null）
    private String qcStatus;  // 可能为 null（旧缓存）
    private Integer qcRequired;  // 可能为 null（旧缓存）
    
    // 提供默认值处理
    public String getQcStatus() {
        return qcStatus != null ? qcStatus : "NOT_REQUIRED";
    }
    
    public Integer getQcRequired() {
        return qcRequired != null ? qcRequired : 0;
    }
}
```

缓存失效策略：

[可选] 主动清除旧缓存
```java
// 如果需要立即生效，可以在部署时清除旧缓存
redisTemplate.delete("wms:receipt:*");

// 或者等待 TTL 自然过期（推荐）
// TTL: 5 分钟，最多 5 分钟后所有缓存更新为新格式
```

新增缓存策略：

[新增] QualityInspection 缓存
```markdown
Key 格式：
  - wms:inspection:{id}
  - wms:inspection:receipt:{receiptId}

TTL：
  - 5 分钟

更新策略：
  - save() - 更新缓存
  - delete() - 删除缓存
  - findById() - 缓存未命中时回写
```
```

---

## 2. Repository 实现设计

### 实现类职责

描述每个 Repository 实现类的职责和关键方法实现。

```markdown
### ReceiptRepositoryImpl

实现接口：ReceiptRepository（定义在领域层）

职责：
- 实现 Receipt 聚合的持久化
- 处理 Receipt 和 ReceiptLine 的级联保存
- 实现缓存策略
- 处理并发控制（乐观锁）

关键方法实现：

save(Receipt receipt)
  - 转换：Receipt -> ReceiptPO + List<ReceiptLinePO>
  - 保存：主表 + 明细表（事务）
  - 缓存：更新 Redis 缓存
  - 返回：保存后的 Receipt

findById(ReceiptId id)
  - 缓存：先查 Redis
  - 数据库：缓存未命中时查 MySQL
  - 转换：ReceiptPO + List<ReceiptLinePO> -> Receipt
  - 缓存：回写 Redis

findByReceiptNo(ReceiptNo receiptNo)
  - 类似 findById
  - 使用 receiptNo 作为缓存 key

依赖组件：
- ReceiptMapper（MyBatis）
- ReceiptLineMapper（MyBatis）
- RedisTemplate（缓存）
- ReceiptConverter（Entity-PO 转换）
```

---

## 3. Entity-PO 映射

### 映射规则

- 聚合根 -> 主表 PO（一对一映射）
- 聚合内实体 -> 子表 PO（通过外键关联）
- 值对象 -> 字段/嵌入（展开为多个字段）
- 枚举 -> VARCHAR（存储枚举名称）
- ID 类型 -> VARCHAR(36)（UUID 字符串）

### 映射示例

```markdown
Receipt（聚合根）-> ReceiptPO + List<ReceiptLinePO>

Receipt 字段映射：
  - id: ReceiptId -> ReceiptPO.id: VARCHAR(36)
  - receiptNo: ReceiptNo -> ReceiptPO.receipt_no: VARCHAR(32)
  - receiptType: ReceiptType -> ReceiptPO.receipt_type: VARCHAR(16)
  - status: ReceiptStatus -> ReceiptPO.status: VARCHAR(16)
  - lines: List<ReceiptLine> -> List<ReceiptLinePO>（关联表）

ReceiptLine（实体）-> ReceiptLinePO

ReceiptLine 字段映射：
  - id: ReceiptLineId -> ReceiptLinePO.id: VARCHAR(36)
  - receiptId: ReceiptId -> ReceiptLinePO.receipt_id: VARCHAR(36)
  - lineNo: int -> ReceiptLinePO.line_no: INT
  - itemId: ItemId -> ReceiptLinePO.item_id: VARCHAR(36)
  - plannedQuantity: Quantity -> ReceiptLinePO.planned_quantity: DECIMAL(18,4)
  - receivedQuantity: Quantity -> ReceiptLinePO.received_quantity: DECIMAL(18,4)
```

---

## 4. 表结构设计

### 表命名规范

表名使用下划线命名（snake_case）：

前缀分类：
- def_ - 定义类表（Definition）：基础数据、配置数据
  - 示例：def_equipment、def_station、def_map_info
- doc_ - 单据类表（Document）：业务单据、日志记录
  - 示例：doc_file、doc_message_info、doc_api_log
- event_ - 事件类表（Event）：业务事件、任务执行
  - 示例：event_job、event_task、event_command
- history_ - 历史类表（History）：归档数据
  - 示例：history_job、history_pick

命名规则：
- 格式：{prefix}_{table_name}
- 使用小写字母
- 多个单词用下划线连接
- 避免使用缩写（除非是通用缩写）

表命名示例：
- def_receipt - 收货单定义
- doc_receipt - 收货单据
- doc_receipt_line - 收货单明细
- event_receiving_task - 收货任务
- def_inventory - 库存定义
- def_location - 库位定义

### 字段命名规范

字段名使用驼峰命名（camelCase），禁止使用下划线：

基础字段：
- 主键：id
- 外键：{关联表名}Id（如 taskId、equipmentId）
- 状态：status
- 类型：{xxx}Type（如 equipmentType、actionType）
- 编码：{xxx}Code（如 equipmentCode、stationCode）
- 名称：{xxx}Name（如 itemName、locationName）
- 数量：qty 或 {xxx}Qty（如 completedQty、issueQty）
- 时间：{xxx}Time（如 createdTime、updatedTime、startTime、endTime）
- 人员：{xxx}By（如 createdBy、updatedBy、operatedBy）
- 布尔：is{Xxx}（如 isDeleted、isTaskAction）

[重要] 字段名使用驼峰而非下划线：
- 正确：equipmentCode、createdTime、isDeleted
- 错误：equipment_code、created_time、is_deleted

### 通用字段（基于 BaseEntity 系列）

#### BaseEntity 字段（所有表必须包含）

```sql
-- 审计字段
createdTime     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
createdBy       VARCHAR(50)                                     COMMENT '创建人',
updatedTime     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '更新时间',
updatedBy       VARCHAR(50)                                     COMMENT '更新人',

-- 软删除
isDeleted       TINYINT         NOT NULL DEFAULT 0              COMMENT '是否删除: 0-否, 1-是',
```

#### BaseCompanyEntity 字段（租户级别表）

```sql
-- 租户隔离
tenantId        VARCHAR(32)                                     COMMENT '租户ID',
isolationId     VARCHAR(50)     NOT NULL                        COMMENT '隔离ID（公司ID）',
```

#### BaseFacilityEntity 字段（设施级别表）

```sql
-- 设施隔离
tenantId        VARCHAR(32)                                     COMMENT '租户ID',
isolationId     VARCHAR(50)     NOT NULL                        COMMENT '隔离ID（设施ID/仓库ID）',
```

### 主键设计

主键设计方案：

方案 1：自增 ID + 复合主键（推荐用于高并发表）
```sql
id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
isolationId     VARCHAR(50)     NOT NULL,
PRIMARY KEY (id, isolationId)
```

方案 2：UUID + 复合主键（推荐用于分布式场景）
```sql
id              VARCHAR(32)     NOT NULL,
isolationId     VARCHAR(50)     NOT NULL,
PRIMARY KEY (id, isolationId)
```

[重要] 复合主键必须包含 isolationId，支持数据隔离。

### 扩展字段

动态扩展字段设计：

```sql
-- 文本扩展字段（用于业务扩展）
dynTxtValue01 ~ dynTxtValue15   VARCHAR(50)     COMMENT '动态文本字段',

-- JSON 扩展字段（用于复杂数据）
extensionJson                   JSON            COMMENT '扩展JSON数据',
```

### 字段类型规范

字段类型标准：

- 主键 ID：BIGINT UNSIGNED（自增）或 VARCHAR(32)（UUID）
- 外键 ID：VARCHAR(32) 或 VARCHAR(50)
- 编码/代码：VARCHAR(50)
- 名称：VARCHAR(50) ~ VARCHAR(150)
- 描述：VARCHAR(255) ~ VARCHAR(1000)
- 状态/类型：VARCHAR(50)
- 数量：DECIMAL(10,2) 或 DECIMAL(12,2)
- 布尔：TINYINT(1) 或 TINYINT
- 时间：TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
- JSON：JSON

### 字符集和排序规则

```sql
ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_0900_ai_ci
ROW_FORMAT=DYNAMIC
```

### 表结构示例

```sql
CREATE TABLE doc_receipt (
    -- 主键
    id              VARCHAR(36)     NOT NULL                        COMMENT '主键ID',
    
    -- 隔离字段（BaseFacilityEntity）
    tenantId        VARCHAR(32)                                     COMMENT '租户ID',
    isolationId     VARCHAR(50)     NOT NULL                        COMMENT '隔离ID（仓库ID）',
    
    -- 业务字段
    receiptNo       VARCHAR(32)     NOT NULL                        COMMENT '收货单号',
    receiptType     VARCHAR(16)     NOT NULL                        COMMENT '收货类型',
    sourceDocumentId VARCHAR(36)                                    COMMENT '来源单据ID',
    sourceDocumentNo VARCHAR(32)                                    COMMENT '来源单据号',
    sourceType      VARCHAR(16)                                     COMMENT '来源类型',
    supplierId      VARCHAR(36)                                     COMMENT '供应商ID',
    customerId      VARCHAR(36)                                     COMMENT '客户ID',
    warehouseId     VARCHAR(36)     NOT NULL                        COMMENT '仓库ID',
    status          VARCHAR(16)     NOT NULL                        COMMENT '状态',
    receivedBy      VARCHAR(36)                                     COMMENT '收货人',
    receivedTime    TIMESTAMP       NULL                            COMMENT '收货时间',
    
    -- 扩展字段
    dynTxtValue01   VARCHAR(50)                                     COMMENT '扩展字段1',
    dynTxtValue02   VARCHAR(50)                                     COMMENT '扩展字段2',
    dynTxtValue03   VARCHAR(50)                                     COMMENT '扩展字段3',
    extensionJson   JSON                                            COMMENT '扩展JSON',
    
    -- 审计字段（BaseEntity）
    createdTime     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    createdBy       VARCHAR(50)                                     COMMENT '创建人',
    updatedTime     TIMESTAMP       NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '更新时间',
    updatedBy       VARCHAR(50)                                     COMMENT '更新人',
    
    -- 软删除
    isDeleted       TINYINT         NOT NULL DEFAULT 0              COMMENT '是否删除: 0-否, 1-是',
    
    -- 主键和索引
    PRIMARY KEY (id, isolationId),
    UNIQUE KEY uk_receiptNo (receiptNo, isolationId),
    KEY idx_status (status, isolationId, createdTime, isDeleted),
    KEY idx_warehouse (warehouseId, isolationId, createdTime, isDeleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='收货单表';
```

---

## 5. 索引设计

### 索引命名规范

- 主键 - pk_{表名}
- 唯一索引 - uk_{表名}_{字段}
- 普通索引 - idx_{表名}_{字段}
- 组合索引 - idx_{表名}_{字段1}_{字段2}

### 索引设计原则

1. 主键索引 - 每个表必须有主键
2. 唯一索引 - 业务编号字段建立唯一索引
3. 外键索引 - 外键字段建立索引
4. 查询索引 - 高频查询条件建立索引
5. 组合索引 - 遵循最左前缀原则

---

## 6. 缓存策略

### 缓存设计原则

- 聚合根缓存 - 以聚合根 ID 为 key
- 缓存时效 - 根据数据变更频率设置 TTL
- 缓存更新 - 写操作时更新缓存
- 缓存失效 - 删除操作时清除缓存

### 缓存 Key 设计

```markdown
Receipt 聚合缓存：

Key 格式：
  - wms:receipt:{id}
  - wms:receipt:no:{receiptNo}

TTL：
  - 5 分钟（高频查询）

更新策略：
  - save() - 更新缓存
  - delete() - 删除缓存
  - findById() - 缓存未命中时回写

示例：
  - wms:receipt:rcv-001
  - wms:receipt:no:RCV20241231000001
```

### 缓存实现

```markdown
使用 Spring Cache + Redis：

@Cacheable(value = "receipt", key = "#id")
public Receipt findById(ReceiptId id) { ... }

@CachePut(value = "receipt", key = "#receipt.id")
public Receipt save(Receipt receipt) { ... }

@CacheEvict(value = "receipt", key = "#id")
public void delete(ReceiptId id) { ... }
```

---

## 7. 查询优化

### 查询场景分析

列出高频查询场景和优化方案。

```markdown
场景 1：按收货单号查询

查询频率：高
查询条件：receipt_no
优化方案：
  - 建立唯一索引 uk_receipt_no
  - 使用 Redis 缓存

场景 2：按状态和仓库查询列表

查询频率：高
查询条件：warehouse_id + status + created_at
优化方案：
  - 建立组合索引 idx_warehouse_status_date
  - 分页查询
  - 考虑使用 ES（如果数据量大）

场景 3：按来源单据查询

查询频率：中
查询条件：source_document_id + source_type
优化方案：
  - 建立组合索引 idx_source_document
```

### 批量操作优化

```markdown
批量保存：
  - 使用 MyBatis 批量插入
  - 单次批量不超过 1000 条

批量查询：
  - 使用 IN 查询
  - 单次 IN 不超过 500 个 ID
```

---

## 8. 数据迁移脚本

### 脚本命名规范

```
V{版本号}__{描述}.sql

示例：
V1__create_receipt_tables.sql
V2__create_task_tables.sql
```

---

## 检查清单

### 设计类型确认
- [ ] 明确标注设计类型（新模块设计 / 迭代设计）
- [ ] 如果是迭代设计，明确基于哪个已有模块

### 影响范围分析（仅迭代设计）
- [ ] 列出需要新增的仓储实现
- [ ] 列出需要修改的仓储实现
- [ ] 评估数据库变更影响（表结构、索引、性能）
- [ ] 评估对已有单元测试的影响

### 兼容性分析（仅迭代设计）
- [ ] Repository 实现兼容性：接口方法、依赖组件
- [ ] 数据库兼容性：表结构、索引、查询、数据迁移
- [ ] 缓存兼容性：Key 格式、内容格式、反序列化
- [ ] 确定兼容性解决方案（保留原方法、默认值、回滚脚本）

### Repository 实现
- [ ] 实现类职责清晰
- [ ] 关键方法实现完整
- [ ] 依赖组件明确
- [ ] 事务边界正确
- [ ] 迭代设计：明确标注"新增"和"修改"

### Entity-PO 映射
- [ ] 映射规则清晰
- [ ] 值对象展开正确
- [ ] 枚举存储方式明确
- [ ] 转换器设计完整
- [ ] 迭代设计：处理新字段的 null 值

### 表结构
- [ ] 表名符合命名规范
- [ ] 字段名符合命名规范
- [ ] 包含通用审计字段
- [ ] 包含扩展字段（如需要）
- [ ] 字段类型合理
- [ ] 字段注释完整
- [ ] 迭代设计：新增字段设置默认值

### 索引
- [ ] 主键索引
- [ ] 唯一索引（业务编号）
- [ ] 外键索引
- [ ] 查询索引
- [ ] 索引命名规范
- [ ] 迭代设计：评估新索引对性能的影响

### 缓存策略
- [ ] 缓存 Key 设计合理
- [ ] TTL 设置合理
- [ ] 更新策略明确
- [ ] 失效策略明确
- [ ] 迭代设计：缓存 Key 保持兼容或提供迁移方案

### 查询优化
- [ ] 高频查询场景分析
- [ ] 索引覆盖查询条件
- [ ] 批量操作优化
- [ ] 分页查询设计

### 迁移脚本
- [ ] 脚本命名规范
- [ ] 脚本可重复执行
- [ ] 包含回滚方案
- [ ] 迭代设计：数据迁移脚本处理已有数据

### 测试就绪性
- [ ] 仓储设计完成后，能编写 Repository 集成测试
- [ ] 技术设计 + 仓储设计完成后，能进行端到端测试
- [ ] 迭代设计：确认修改完成后能 run app

---

## 下一步

完成 07-repository-design.md 后，进入测试设计阶段，编写测试用例文档。

---

最后更新：2026-01-03
