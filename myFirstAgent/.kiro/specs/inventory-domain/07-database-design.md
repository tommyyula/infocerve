# 库存领域 - 数据库设计

## 1. 表清单

| 序号 | 表名 | 说明 | 类型 |
|------|------|------|------|
| 1 | wms_inventory | 库存表 | 核心业务表 |
| 2 | wms_lp | LP容器表 | 核心业务表 |
| 3 | wms_inventory_lock | 库存锁定表 | 核心业务表 |
| 4 | wms_adjustment | 调整单表 | 调整相关表 |
| 5 | wms_adjustment_line | 调整行表 | 调整相关表 |
| 6 | wms_adjustment_history | 调整历史表 | 调整相关表 |
| 7 | wms_inventory_log | 库存变更日志表 | 事件日志表 |
| 8 | wms_inventory_activity | 库存活动记录表 | 事件日志表 |
| 9 | wms_inv_sequences | 序列号表 | 配置表 |
| 10 | wms_customize_fields | 自定义字段配置表 | 配置表 |
| 11 | wms_dynproperty_mapping | 动态属性映射表 | 配置表 |

---

## 2. 表间关系

```
wms_lp (1) -----> (N) wms_inventory
wms_adjustment (1) -----> (N) wms_adjustment_line
wms_adjustment (1) -----> (N) wms_adjustment_history
wms_inventory (1) -----> (N) wms_inventory_log
wms_inventory (1) -----> (N) wms_inventory_activity
wms_inventory <----> wms_inventory_lock (虚拟关联)
wms_inv_sequences -----> 各业务表 (生成ID)
```

---

## 3. 核心表结构

### 3.1 wms_inventory（库存表）

```sql
CREATE TABLE `wms_inventory` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `customer_id` varchar(64) NOT NULL COMMENT '客户ID',
  `title_id` varchar(64) DEFAULT NULL COMMENT '货权ID',
  `item_id` varchar(64) NOT NULL COMMENT '商品ID',
  `qty` decimal(18,4) NOT NULL COMMENT '数量',
  `uom_id` varchar(64) DEFAULT NULL COMMENT '计量单位ID',
  `uom` varchar(64) DEFAULT NULL COMMENT '计量单位名称',
  `base_qty` decimal(18,4) DEFAULT NULL COMMENT '基础数量',
  `qty2` decimal(18,4) DEFAULT NULL COMMENT '第二单位数量',
  `uom_id2` varchar(64) DEFAULT NULL COMMENT '第二计量单位ID',
  `sn` varchar(128) DEFAULT NULL COMMENT '序列号',
  `status` varchar(32) NOT NULL COMMENT '库存状态',
  `type` varchar(32) DEFAULT NULL COMMENT '货物类型',
  `mode` varchar(32) DEFAULT NULL COMMENT '库存模式',
  `channel` varchar(32) DEFAULT NULL COMMENT '库存渠道',
  `lot_no` varchar(128) DEFAULT NULL COMMENT '批次号',
  `expiration_date` datetime DEFAULT NULL COMMENT '过期日期',
  `mfg_date` datetime DEFAULT NULL COMMENT '生产日期',
  `lp_id` varchar(64) DEFAULT NULL COMMENT 'LP ID',
  `location_id` varchar(64) DEFAULT NULL COMMENT '库位ID',
  `receipt_id` varchar(64) DEFAULT NULL COMMENT '收货单ID',
  `order_id` varchar(64) DEFAULT NULL COMMENT '订单ID',
  `adjustment_id` varchar(64) DEFAULT NULL COMMENT '调整单ID',
  `slot_code` varchar(64) DEFAULT NULL COMMENT '槽位编码',
  `original_lp_id` varchar(64) DEFAULT NULL COMMENT '原始LP ID',
  `original_base_qty` decimal(18,4) DEFAULT NULL COMMENT '原始基础数量',
  `original_created_time` datetime DEFAULT NULL COMMENT '原始创建时间',
  `original_id` bigint DEFAULT NULL COMMENT '原始库存ID',
  `supplier_id` varchar(64) DEFAULT NULL COMMENT '供应商ID',
  `receive_task_id` varchar(64) DEFAULT NULL COMMENT '收货任务ID',
  `put_away_task_id` varchar(64) DEFAULT NULL COMMENT '上架任务ID',
  `pick_task_id` varchar(64) DEFAULT NULL COMMENT '拣货任务ID',
  `pack_task_id` varchar(64) DEFAULT NULL COMMENT '打包任务ID',
  `load_task_id` varchar(64) DEFAULT NULL COMMENT '装车任务ID',
  `workflow_task_id` varchar(64) DEFAULT NULL COMMENT '工作流任务ID',
  `replenish_task_id` varchar(64) DEFAULT NULL COMMENT '补货任务ID',
  `movement_task_id` varchar(64) DEFAULT NULL COMMENT '移动任务ID',
  `return_task_id` varchar(64) DEFAULT NULL COMMENT '退货任务ID',
  `dyn_txt_property_value_01` varchar(256) DEFAULT NULL COMMENT '动态文本属性01',
  `dyn_txt_property_value_02` varchar(256) DEFAULT NULL COMMENT '动态文本属性02',
  `dyn_txt_property_value_03` varchar(256) DEFAULT NULL COMMENT '动态文本属性03',
  `dyn_txt_property_value_04` varchar(256) DEFAULT NULL COMMENT '动态文本属性04',
  `dyn_txt_property_value_05` varchar(256) DEFAULT NULL COMMENT '动态文本属性05',
  `dyn_txt_property_value_06` varchar(256) DEFAULT NULL COMMENT '动态文本属性06',
  `dyn_txt_property_value_07` varchar(256) DEFAULT NULL COMMENT '动态文本属性07',
  `dyn_txt_property_value_08` varchar(256) DEFAULT NULL COMMENT '动态文本属性08',
  `dyn_txt_property_value_09` varchar(256) DEFAULT NULL COMMENT '动态文本属性09',
  `dyn_txt_property_value_10` varchar(256) DEFAULT NULL COMMENT '动态文本属性10',
  `dyn_txt_property_value_11` varchar(256) DEFAULT NULL COMMENT '动态文本属性11',
  `dyn_txt_property_value_12` varchar(256) DEFAULT NULL COMMENT '动态文本属性12',
  `dyn_txt_property_value_13` varchar(256) DEFAULT NULL COMMENT '动态文本属性13',
  `dyn_txt_property_value_14` varchar(256) DEFAULT NULL COMMENT '动态文本属性14',
  `dyn_txt_property_value_15` varchar(256) DEFAULT NULL COMMENT '动态文本属性15',
  `dyn_txt_property_value_16` varchar(256) DEFAULT NULL COMMENT '动态文本属性16',
  `dyn_txt_property_value_17` varchar(256) DEFAULT NULL COMMENT '动态文本属性17',
  `dyn_txt_property_value_18` varchar(256) DEFAULT NULL COMMENT '动态文本属性18',
  `dyn_txt_property_value_19` varchar(256) DEFAULT NULL COMMENT '动态文本属性19',
  `dyn_txt_property_value_20` varchar(256) DEFAULT NULL COMMENT '动态文本属性20',
  `dyn_date_property_value_01` datetime DEFAULT NULL COMMENT '动态日期属性01',
  `dyn_date_property_value_02` datetime DEFAULT NULL COMMENT '动态日期属性02',
  `dyn_date_property_value_03` datetime DEFAULT NULL COMMENT '动态日期属性03',
  `dyn_date_property_value_04` datetime DEFAULT NULL COMMENT '动态日期属性04',
  `dyn_date_property_value_05` datetime DEFAULT NULL COMMENT '动态日期属性05',
  `dyn_date_property_value_06` datetime DEFAULT NULL COMMENT '动态日期属性06',
  `dyn_date_property_value_07` datetime DEFAULT NULL COMMENT '动态日期属性07',
  `dyn_date_property_value_08` datetime DEFAULT NULL COMMENT '动态日期属性08',
  `dyn_date_property_value_09` datetime DEFAULT NULL COMMENT '动态日期属性09',
  `dyn_date_property_value_10` datetime DEFAULT NULL COMMENT '动态日期属性10',
  `profiles` json DEFAULT NULL COMMENT '库存配置文件',
  `received_time` datetime DEFAULT NULL COMMENT '收货时间',
  `received_by` varchar(64) DEFAULT NULL COMMENT '收货人',
  `pallet_no` varchar(64) DEFAULT NULL COMMENT '托盘号',
  `adjust_out_time` datetime DEFAULT NULL COMMENT '调整出库时间',
  `adjust_out_by` varchar(64) DEFAULT NULL COMMENT '调整出库人',
  `shipped_time` datetime DEFAULT NULL COMMENT '发货时间',
  `shipped_by` varchar(64) DEFAULT NULL COMMENT '发货人',
  `discrepancy_flag` varchar(32) DEFAULT NULL COMMENT '差异标记',
  `discrepancy_report_time` datetime DEFAULT NULL COMMENT '差异报告时间',
  `load_id` varchar(64) DEFAULT NULL COMMENT '装载ID',
  `tracking_no` varchar(128) DEFAULT NULL COMMENT '追踪号',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_lp_id` (`lp_id`),
  KEY `idx_location_id` (`location_id`),
  KEY `idx_status` (`status`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';
```

### 3.2 wms_lp（LP容器表）

```sql
CREATE TABLE `wms_lp` (
  `id` varchar(64) NOT NULL COMMENT '主键（格式：TYPE-CODE）',
  `code` varchar(64) DEFAULT NULL COMMENT 'LP编码',
  `location_id` varchar(64) DEFAULT NULL COMMENT '当前库位ID',
  `type` varchar(32) NOT NULL COMMENT 'LP类型',
  `hlp_category` varchar(32) DEFAULT NULL COMMENT 'HLP分类',
  `hlp_reference` varchar(64) DEFAULT NULL COMMENT 'HLP引用',
  `seq` int DEFAULT NULL COMMENT '序号',
  `status` varchar(32) NOT NULL COMMENT 'LP状态',
  `parent_id` varchar(64) DEFAULT NULL COMMENT '父LP ID',
  `weight` decimal(18,4) DEFAULT NULL COMMENT '重量',
  `weight_unit` varchar(16) DEFAULT NULL COMMENT '重量单位',
  `length` decimal(18,4) DEFAULT NULL COMMENT '长度',
  `width` decimal(18,4) DEFAULT NULL COMMENT '宽度',
  `height` decimal(18,4) DEFAULT NULL COMMENT '高度',
  `linear_unit` varchar(16) DEFAULT NULL COMMENT '长度单位',
  `volume` decimal(18,4) DEFAULT NULL COMMENT '体积',
  `is_partial_pallet` tinyint(1) DEFAULT NULL COMMENT '是否部分托盘',
  `space_status` varchar(32) DEFAULT NULL COMMENT '空间状态',
  `pallet_type` varchar(32) DEFAULT NULL COMMENT '托盘类型',
  `external_lpn` varchar(128) DEFAULT NULL COMMENT '外部LPN',
  `net_weight` decimal(18,4) DEFAULT NULL COMMENT '净重',
  `gross_weight` decimal(18,4) DEFAULT NULL COMMENT '毛重',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_location_id` (`location_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_external_lpn` (`external_lpn`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='LP容器表';
```

### 3.3 wms_adjustment（调整单表）

```sql
CREATE TABLE `wms_adjustment` (
  `id` varchar(64) NOT NULL COMMENT '主键（格式：ADJ-序号）',
  `customer_id` varchar(64) NOT NULL COMMENT '客户ID',
  `status` varchar(32) NOT NULL COMMENT '调整单状态',
  `reason` varchar(256) DEFAULT NULL COMMENT '调整原因',
  `note` text COMMENT '备注',
  `approve_time` datetime DEFAULT NULL COMMENT '审批时间',
  `approve_by` varchar(64) DEFAULT NULL COMMENT '审批人',
  `has_send_947_report` tinyint(1) DEFAULT NULL COMMENT '是否发送947报告',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调整单表';
```

### 3.4 wms_adjustment_line（调整行表）

```sql
CREATE TABLE `wms_adjustment_line` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `customer_id` varchar(64) NOT NULL COMMENT '客户ID',
  `adjustment_id` varchar(64) NOT NULL COMMENT '调整单ID',
  `type` varchar(32) NOT NULL COMMENT '调整类型',
  `inventory_identifier` json DEFAULT NULL COMMENT '库存标识',
  `adjust_from` varchar(256) DEFAULT NULL COMMENT '调整前值',
  `adjust_to` varchar(256) DEFAULT NULL COMMENT '调整后值',
  `adjust_qty` decimal(18,4) DEFAULT NULL COMMENT '调整数量',
  `to_lp_id` varchar(64) DEFAULT NULL COMMENT '目标LP ID',
  `adjust_from2` varchar(256) DEFAULT NULL COMMENT '调整前第二单位值',
  `adjust_to2` varchar(256) DEFAULT NULL COMMENT '调整后第二单位值',
  `adjust_qty2` decimal(18,4) DEFAULT NULL COMMENT '调整第二单位数量',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_adjustment_id` (`adjustment_id`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调整行表';
```

### 3.5 wms_adjustment_history（调整历史表）

```sql
CREATE TABLE `wms_adjustment_history` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `adjustment_id` varchar(64) NOT NULL COMMENT '调整单ID',
  `customer_id` varchar(64) DEFAULT NULL COMMENT '客户ID',
  `adjust_type` varchar(32) DEFAULT NULL COMMENT '调整类型',
  `item_id` varchar(64) DEFAULT NULL COMMENT '商品ID',
  `lp_id` varchar(64) DEFAULT NULL COMMENT 'LP ID',
  `location_id` varchar(64) DEFAULT NULL COMMENT '库位ID',
  `title_id` varchar(64) DEFAULT NULL COMMENT '货权ID',
  `lot_no` varchar(128) DEFAULT NULL COMMENT '批次号',
  `sn` varchar(128) DEFAULT NULL COMMENT '序列号',
  `status` varchar(32) DEFAULT NULL COMMENT '状态',
  `type` varchar(32) DEFAULT NULL COMMENT '货物类型',
  `expiration_date` datetime DEFAULT NULL COMMENT '过期日期',
  `mfg_date` datetime DEFAULT NULL COMMENT '生产日期',
  `uom_id` varchar(64) DEFAULT NULL COMMENT '计量单位ID',
  `from_qty` decimal(18,4) DEFAULT NULL COMMENT '调整前数量',
  `to_qty` decimal(18,4) DEFAULT NULL COMMENT '调整后数量',
  `adjust_qty` decimal(18,4) DEFAULT NULL COMMENT '调整数量',
  `from_qty2` decimal(18,4) DEFAULT NULL COMMENT '调整前第二单位数量',
  `to_qty2` decimal(18,4) DEFAULT NULL COMMENT '调整后第二单位数量',
  `adjust_qty2` decimal(18,4) DEFAULT NULL COMMENT '调整第二单位数量',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_adjustment_id` (`adjustment_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调整历史表';
```

### 3.6 wms_inventory_lock（库存锁定表）

```sql
CREATE TABLE `wms_inventory_lock` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` varchar(64) NOT NULL COMMENT '订单ID',
  `order_item_line_id` varchar(64) DEFAULT NULL COMMENT '订单行ID',
  `item_id` varchar(64) NOT NULL COMMENT '商品ID',
  `uom_id` varchar(64) DEFAULT NULL COMMENT '计量单位ID',
  `qty` decimal(18,4) DEFAULT NULL COMMENT '锁定数量',
  `base_qty` decimal(18,4) DEFAULT NULL COMMENT '基础数量',
  `title_id` varchar(64) DEFAULT NULL COMMENT '货权ID',
  `customer_id` varchar(64) NOT NULL COMMENT '客户ID',
  `lot_no` varchar(128) DEFAULT NULL COMMENT '批次号',
  `status` varchar(32) NOT NULL COMMENT '锁定状态',
  `goods_type` varchar(32) DEFAULT NULL COMMENT '货物类型',
  `available_base_qty` decimal(18,4) DEFAULT NULL COMMENT '可用基础数量',
  `uom_id2` varchar(64) DEFAULT NULL COMMENT '第二计量单位ID',
  `qty2` decimal(18,4) DEFAULT NULL COMMENT '第二单位数量',
  `supplier_id` varchar(64) DEFAULT NULL COMMENT '供应商ID',
  `receive_task_id` varchar(64) DEFAULT NULL COMMENT '收货任务ID',
  `put_away_task_id` varchar(64) DEFAULT NULL COMMENT '上架任务ID',
  `pick_task_id` varchar(64) DEFAULT NULL COMMENT '拣货任务ID',
  `pack_task_id` varchar(64) DEFAULT NULL COMMENT '打包任务ID',
  `load_task_id` varchar(64) DEFAULT NULL COMMENT '装车任务ID',
  `dyn_txt_property_value_01` varchar(256) DEFAULT NULL COMMENT '动态文本属性01',
  `dyn_txt_property_value_02` varchar(256) DEFAULT NULL COMMENT '动态文本属性02',
  `dyn_txt_property_value_03` varchar(256) DEFAULT NULL COMMENT '动态文本属性03',
  `dyn_txt_property_value_04` varchar(256) DEFAULT NULL COMMENT '动态文本属性04',
  `dyn_txt_property_value_05` varchar(256) DEFAULT NULL COMMENT '动态文本属性05',
  `dyn_txt_property_value_06` varchar(256) DEFAULT NULL COMMENT '动态文本属性06',
  `dyn_txt_property_value_07` varchar(256) DEFAULT NULL COMMENT '动态文本属性07',
  `dyn_txt_property_value_08` varchar(256) DEFAULT NULL COMMENT '动态文本属性08',
  `dyn_txt_property_value_09` varchar(256) DEFAULT NULL COMMENT '动态文本属性09',
  `dyn_txt_property_value_10` varchar(256) DEFAULT NULL COMMENT '动态文本属性10',
  `dyn_txt_property_value_11` varchar(256) DEFAULT NULL COMMENT '动态文本属性11',
  `dyn_txt_property_value_12` varchar(256) DEFAULT NULL COMMENT '动态文本属性12',
  `dyn_txt_property_value_13` varchar(256) DEFAULT NULL COMMENT '动态文本属性13',
  `dyn_txt_property_value_14` varchar(256) DEFAULT NULL COMMENT '动态文本属性14',
  `dyn_txt_property_value_15` varchar(256) DEFAULT NULL COMMENT '动态文本属性15',
  `dyn_txt_property_value_16` varchar(256) DEFAULT NULL COMMENT '动态文本属性16',
  `dyn_txt_property_value_17` varchar(256) DEFAULT NULL COMMENT '动态文本属性17',
  `dyn_txt_property_value_18` varchar(256) DEFAULT NULL COMMENT '动态文本属性18',
  `dyn_txt_property_value_19` varchar(256) DEFAULT NULL COMMENT '动态文本属性19',
  `dyn_txt_property_value_20` varchar(256) DEFAULT NULL COMMENT '动态文本属性20',
  `dyn_date_property_value_01` datetime DEFAULT NULL COMMENT '动态日期属性01',
  `dyn_date_property_value_02` datetime DEFAULT NULL COMMENT '动态日期属性02',
  `dyn_date_property_value_03` datetime DEFAULT NULL COMMENT '动态日期属性03',
  `dyn_date_property_value_04` datetime DEFAULT NULL COMMENT '动态日期属性04',
  `dyn_date_property_value_05` datetime DEFAULT NULL COMMENT '动态日期属性05',
  `dyn_date_property_value_06` datetime DEFAULT NULL COMMENT '动态日期属性06',
  `dyn_date_property_value_07` datetime DEFAULT NULL COMMENT '动态日期属性07',
  `dyn_date_property_value_08` datetime DEFAULT NULL COMMENT '动态日期属性08',
  `dyn_date_property_value_09` datetime DEFAULT NULL COMMENT '动态日期属性09',
  `dyn_date_property_value_10` datetime DEFAULT NULL COMMENT '动态日期属性10',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_status` (`status`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存锁定表';
```

### 3.7 wms_inventory_log（库存日志表）

```sql
CREATE TABLE `wms_inventory_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `inventory_id` bigint NOT NULL COMMENT '库存ID',
  `customer_id` varchar(64) DEFAULT NULL COMMENT '客户ID',
  `title_id` varchar(64) DEFAULT NULL COMMENT '货权ID',
  `item_id` varchar(64) DEFAULT NULL COMMENT '商品ID',
  `from_qty` decimal(18,4) DEFAULT NULL COMMENT '变更前数量',
  `to_qty` decimal(18,4) DEFAULT NULL COMMENT '变更后数量',
  `uom_id` varchar(64) DEFAULT NULL COMMENT '计量单位ID',
  `from_qty2` decimal(18,4) DEFAULT NULL COMMENT '变更前第二单位数量',
  `to_qty2` decimal(18,4) DEFAULT NULL COMMENT '变更后第二单位数量',
  `uom_id2` varchar(64) DEFAULT NULL COMMENT '第二计量单位ID',
  `status` varchar(32) DEFAULT NULL COMMENT '状态',
  `type` varchar(32) DEFAULT NULL COMMENT '类型',
  `action_type` varchar(32) DEFAULT NULL COMMENT '操作类型',
  `change_before` json DEFAULT NULL COMMENT '变更前快照',
  `change_after` json DEFAULT NULL COMMENT '变更后快照',
  `original_inventory_id` bigint DEFAULT NULL COMMENT '原始库存ID',
  `change_from_inventory_id` bigint DEFAULT NULL COMMENT '变更来源库存ID',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_inventory_id` (`inventory_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存日志表';
```

### 3.8 wms_inventory_activity（库存活动表）

```sql
CREATE TABLE `wms_inventory_activity` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `activity_type` varchar(32) NOT NULL COMMENT '活动类型',
  `from_lp_id` varchar(64) DEFAULT NULL COMMENT '来源LP ID',
  `to_lp_id` varchar(64) DEFAULT NULL COMMENT '目标LP ID',
  `from_location_id` varchar(64) DEFAULT NULL COMMENT '来源库位ID',
  `to_location_id` varchar(64) DEFAULT NULL COMMENT '目标库位ID',
  `item_id` varchar(64) DEFAULT NULL COMMENT '商品ID',
  `goods_type` varchar(32) DEFAULT NULL COMMENT '货物类型',
  `title_id` varchar(64) DEFAULT NULL COMMENT '货权ID',
  `lot_no` varchar(128) DEFAULT NULL COMMENT '批次号',
  `qty` decimal(18,4) DEFAULT NULL COMMENT '数量',
  `uom_id` varchar(64) DEFAULT NULL COMMENT '计量单位ID',
  `from_status` varchar(32) DEFAULT NULL COMMENT '来源状态',
  `to_status` varchar(32) DEFAULT NULL COMMENT '目标状态',
  `customer_id` varchar(64) DEFAULT NULL COMMENT '客户ID',
  `adjustment_id` varchar(64) DEFAULT NULL COMMENT '调整单ID',
  `task_id` varchar(64) DEFAULT NULL COMMENT '任务ID',
  `task_type` varchar(32) DEFAULT NULL COMMENT '任务类型',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_created_time` (`created_time`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存活动表';
```

### 3.9

### 3.9 wms_inv_sequences（序列号表）

```sql
CREATE TABLE `wms_inv_sequences` (
  `id` varchar(64) NOT NULL COMMENT '序列ID',
  `current_value` bigint NOT NULL COMMENT '当前值',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='序列号表';
```

### 3.10 wms_customize_fields（自定义字段配置表）

```sql
CREATE TABLE `wms_customize_fields` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(128) DEFAULT NULL COMMENT '配置名称',
  `customer_id` varchar(64) DEFAULT NULL COMMENT '客户ID',
  `mode` varchar(32) DEFAULT NULL COMMENT '库存模式',
  `display_fields` json DEFAULT NULL COMMENT '显示字段列表',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_mode` (`customer_id`, `mode`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自定义字段配置表';
```

### 3.11 wms_dynproperty_mapping（动态属性映射表）

```sql
CREATE TABLE `wms_dynproperty_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `custom_field` varchar(128) DEFAULT NULL COMMENT '自定义字段名（业务名称）',
  `original_field` varchar(64) DEFAULT NULL COMMENT '原始字段名（如dyn_txt_property_value_01）',
  `type` varchar(32) DEFAULT NULL COMMENT '映射类型（INVENTORY/LOCATION）',
  `tenant_id` varchar(64) NOT NULL COMMENT '租户ID',
  `isolation_id` varchar(64) DEFAULT NULL COMMENT '隔离ID',
  `created_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `created_time` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_by` varchar(64) DEFAULT NULL COMMENT '更新人',
  `updated_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_tenant_isolation` (`tenant_id`, `isolation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态属性映射表';
```

---

## 4. 索引设计

### 4.1 核心查询场景索引

wms_inventory 表
- idx_customer_id：按客户查询库存
- idx_item_id：按商品查询库存
- idx_lp_id：按LP查询库存
- idx_location_id：按库位查询库存
- idx_status：按状态筛选
- idx_tenant_isolation：租户隔离

wms_lp 表
- idx_location_id：按库位查询LP
- idx_parent_id：查询子LP
- idx_status：按状态筛选
- idx_type：按类型筛选
- idx_external_lpn：外部LPN查询

wms_adjustment 表
- idx_customer_id：按客户查询调整单
- idx_status：按状态筛选

---

## 5. 领域对象与表映射

### 5.1 聚合根映射

Inventory 聚合根
- 表：wms_inventory
- 主键：id (bigint)
- 租户隔离：tenant_id + isolation_id

Lp 聚合根
- 表：wms_lp
- 主键：id (varchar, 格式 TYPE-CODE)
- 租户隔离：tenant_id + isolation_id

Adjustment 聚合根
- 表：wms_adjustment + wms_adjustment_line
- 主键：id (varchar, 格式 ADJ-序号)
- 租户隔离：tenant_id + isolation_id

InventoryLock 聚合根
- 表：wms_inventory_lock
- 主键：id (bigint)
- 租户隔离：tenant_id + isolation_id

---

## 参考文档

- .kiro/specs/inventory-domain/04-domain-model.md（领域建模）
- .kiro/specs/inventory-domain/06-design.md（技术设计）
