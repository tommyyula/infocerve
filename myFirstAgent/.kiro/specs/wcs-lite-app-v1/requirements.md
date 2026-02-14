# WCS-Lite V1 需求文档

## 〇、WCS 系统定位与交互全景图

### 0.1 WCS 在仓储系统中的位置

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              业务系统层                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │   OMS   │  │   TMS   │  │   ERP   │  │  其他   │                        │
│  │ 订单系统 │  │ 运输系统 │  │ 企业资源 │  │ 业务系统 │                        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘                        │
│       │            │            │            │                              │
│       └────────────┴─────┬──────┴────────────┘                              │
│                          ▼                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         WMS（仓库管理系统）                             │  │
│  │  - 库存管理：SKU、批次、库位                                           │  │
│  │  - 入库管理：收货、上架、质检                                          │  │
│  │  - 出库管理：波次、分配、发货                                          │  │
│  │  - 盘点管理：周期盘点、动态盘点                                        │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      Job 下发 / 状态回调     │
                    ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      WCS（仓库控制系统）← 本项目                        │  │
│  │                                                                       │  │
│  │  职责：                                                               │  │
│  │  - 接收 WMS 的 Job（出库、入库、移库、盘点等）                          │  │
│  │  - 将 Job 拆解为 Task，编排执行流程（Workflow）                        │  │
│  │  - 调度和协调各类设备（RCS、输送线、分拣机等）                          │  │
│  │  - 向 WMS 回报 Job 执行状态                                           │  │
│  │                                                                       │  │
│  │  核心能力：                                                           │  │
│  │  - Workflow 编排引擎（Flowable BPMN）                                 │  │
│  │  - 多厂商设备适配（RCS、PLC、输送线）                                  │  │
│  │  - 任务状态管理与追踪                                                 │  │
│  │  - 异常处理与人工干预                                                 │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                    设备指令下发 / 状态上报                                   │
│       ┌────────────────┼────────────────┬────────────────┐                  │
│       ▼                ▼                ▼                ▼                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │   RCS   │     │  ASRS   │     │ 输送线   │     │ 其他设备 │               │
│  │ 机器人   │     │ 立体库  │     │ Conveyor │     │ 分拣机等 │               │
│  │ 调度系统 │     │ 控制系统 │     │ 控制系统  │     │         │               │
│  └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘               │
│       │               │               │               │                     │
│       ▼               ▼               ▼               ▼                     │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │  AMR    │     │ 堆垛机   │     │ 皮带线   │     │ 交叉带   │               │
│  │  AGV    │     │ 穿梭车   │     │ 滚筒线   │     │ 滑块分拣 │               │
│  │  叉车   │     │ 提升机   │     │ 顶升移载 │     │ 摆轮分拣 │               │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘               │
│                              物理设备层                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 0.2 WCS 核心交互流程

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          典型出库流程交互                                  │
└──────────────────────────────────────────────────────────────────────────┘

  WMS                    WCS                     RCS                  设备
   │                      │                       │                    │
   │  1. 创建出库 Job     │                       │                    │
   │─────────────────────▶│                       │                    │
   │                      │                       │                    │
   │  2. 返回 jobId       │                       │                    │
   │◀─────────────────────│                       │                    │
   │                      │                       │                    │
   │                      │  3. 创建搬运任务       │                    │
   │                      │──────────────────────▶│                    │
   │                      │                       │                    │
   │                      │  4. 返回 missionId    │                    │
   │                      │◀──────────────────────│                    │
   │                      │                       │                    │
   │                      │                       │  5. 调度 AMR       │
   │                      │                       │───────────────────▶│
   │                      │                       │                    │
   │                      │                       │  6. AMR 执行搬运   │
   │                      │                       │◀───────────────────│
   │                      │                       │                    │
   │                      │  7. 任务完成回调       │                    │
   │                      │◀──────────────────────│                    │
   │                      │                       │                    │
   │  8. Job 状态回调     │                       │                    │
   │◀─────────────────────│                       │                    │
   │                      │                       │                    │
   ▼                      ▼                       ▼                    ▼
```

---

### 0.3 WCS 与各系统的接口关系

```
                              ┌─────────────────┐
                              │      WMS        │
                              │   (上游系统)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  Job 创建    │  │  Job 查询    │  │  状态回调    │
            │  POST /jobs  │  │  GET /jobs   │  │  Callback    │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                              ┌────────▼────────┐
                              │                 │
                              │      WCS        │
                              │   (本系统)      │
                              │                 │
                              └────────┬────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
        ▼              ▼               ▼               ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│     RCS      ││    ASRS      ││   输送线      ││   拣选墙     ││   其他设备    │
│  (机器人)    ││  (立体库)    ││  (Conveyor)  ││ (Pick Wall) ││  (扩展)      │
├──────────────┤├──────────────┤├──────────────┤├──────────────┤├──────────────┤
│ 接口方式：   ││ 接口方式：   ││ 接口方式：   ││ 接口方式：   ││ 接口方式：   │
│ - REST API   ││ - REST API   ││ - Modbus TCP ││ - TCP/IP    ││ - 按需对接   │
│ - WebSocket  ││ - WebSocket  ││ - OPC UA     ││ - REST API  ││              │
│              ││              ││              ││              ││              │
│ 主要操作：   ││ 主要操作：   ││ 主要操作：   ││ 主要操作：   ││              │
│ - 创建任务   ││ - 出库指令   ││ - 启动/停止  ││ - 点亮格口   ││              │
│ - 取消任务   ││ - 入库指令   ││ - 路由控制   ││ - 确认拣选   ││              │
│ - 状态查询   ││ - 状态查询   ││ - 状态查询   ││ - 状态查询   ││              │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────────────┘
```

---

### 0.4 WCS 核心概念说明

| 概念 | 说明 | 举例 |
|------|------|------|
| Job | WMS 下发的业务作业，是 WCS 的输入 | 出库 Job、空容器回收 Job、补货 Job |
| Task | Job 拆解后的系统任务，对应一个设备操作 | AMR 搬运任务、ASRS 出库任务、拣选任务 |
| Workflow | 任务执行流程的编排定义 | 出库流程：立库出库 → AMR搬运 → 拣选 → 包装 |
| Node | Workflow 中的一个执行节点 | RcsMissionNode、AsrsPickNode、HumanTaskNode |
| RCS | Robot Control System，机器人调度系统 | 海康、极智嘉、快仓等厂商的调度系统 |
| ASRS | Automated Storage and Retrieval System，自动化立体仓库 | 堆垛机、穿梭车、提升机组成的立体库 |
| Station | 工作站，人机交互的物理位置 | 拣选站、包装站、复核站 |
| Zone | 仓库区域，逻辑划分 | 存储区、拣选区、包装区、出库区 |

---

### 0.5 V1 实现范围

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              V1 实现范围                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ 业务场景 ─────────────────────────────────────────────────────────────┐ │
│  │  [x] 出库 Job（门店订单、线上订单）                                     │ │
│  │  [x] 空容器回收 Job                                                    │ │
│  │  [x] 补货 Job（预实现，Job API + Workflow + 默认规则）                  │ │
│  │  [x] 移库 Job（预实现，Job API + Workflow + 默认规则）                  │ │
│  │  [x] 盘点 Job（预实现，Job API + Workflow + 默认规则）                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 设备对接（device-app 真实驱动层架构）─────────────────────────────────┐ │
│  │                                                                        │ │
│  │  驱动层分层架构：                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Application Layer (CommandService, RcsMissionService)           │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                              │                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Client Factory (ClientCreateFactory)                            │   │ │
│  │  │ - 根据 equipmentModelCode 或 Equipment 创建 Client              │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                              │                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Protocol Adapters                                               │   │ │
│  │  │ - [x] HTTPClientAdapter（HTTP 协议）                            │   │ │
│  │  │ - [x] TCPClientAdapter（TCP 协议，接口定义 + Mock）             │   │ │
│  │  │ - [x] ModbusTcpClientAdapter（Modbus 协议，接口定义 + Mock）    │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                              │                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Vendor Drivers（厂商驱动）                                       │   │ │
│  │  │ - [x] LibiaoAirRobClient（立标料箱机器人 RCS，真实对接）         │   │ │
│  │  │ - [x] HermesAgvClient（AGV，参考 wms-backend-read-only）        │   │ │
│  │  │ - [x] MockRcsClient（测试用 Mock 驱动）                         │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                        │ │
│  │  核心组件：                                                            │ │
│  │  - Client 接口：设备通信统一抽象                                       │ │
│  │  - AbstractClientAdapter：基类适配器                                   │ │
│  │  - Command 命令模型：任务下发、状态管理                                │ │
│  │  - RCS 回调处理：TaskReport、ToteReport、SystemReport                 │ │
│  │                                                                        │ │
│  │  [x] 消息总线（RabbitMQ 实现）                                         │ │
│  │  [x] ASRS 适配器（接口定义 + Mock，待厂商协议文档后真实对接）          │ │
│  │  [x] 输送线驱动（接口定义 + Mock，待 PLC 点位表后真实对接）            │ │
│  │  [x] 拣选墙驱动（接口定义 + Mock，待厂商协议文档后真实对接）           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 核心能力 ─────────────────────────────────────────────────────────────┐ │
│  │  [x] Job/Task 生命周期管理                                             │ │
│  │  [x] Workflow 引擎（Flowable）                                         │ │
│  │  [x] 异步回调机制（重试 + 轮询补偿）                                   │ │
│  │  [x] 状态回调（通知 WMS）                                              │ │
│  │  [x] 规则引擎/策略管理                                                 │ │
│  │  [x] 容器管理                                                          │ │
│  │  [ ] 可视化监控（V2）                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 资源管理（facility-app）──────────────────────────────────────────────┐ │
│  │  [x] Zone 区域管理                                                     │ │
│  │  [x] Station 站点管理                                                  │ │
│  │  [x] Device 设备管理                                                   │ │
│  │  [x] StationDevice 站点设备绑定                                        │ │
│  │  [x] Point 点位管理                                                    │ │
│  │  [x] Map 地图管理                                                      │ │
│  │  [x] ContainerSpec 容器规格                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ 设备驱动（device-app）────────────────────────────────────────────────┐ │
│  │  [x] RcsVendor 厂商配置                                                │ │
│  │  [x] RcsMission 任务管理                                               │ │
│  │  [x] Robot 机器人状态                                                  │ │
│  │  [x] TrafficLight 交通灯控制                                           │ │
│  │  [x] 设备回调处理                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 0.6 V1 预实现说明

#### 0.6.1 业务场景预实现

V1 预实现补货/移库/盘点 Job，包含完整的 Job API、Task 分解、Workflow 编排，业务规则使用默认值：

**补货 Job（预实现）**
- V1 实现内容：
  - Job API：POST /api/wcs/jobs（jobType=REPLENISHMENT）
  - Task 分解：根据 Workflow 自动创建 Task
  - Workflow：ASRS 出库 -> AMR 搬运 -> 上架确认
  - 默认规则：WMS 直接指定 fromStation、toStation、containerId
- 待 WMS 定义后扩展：
  - 补货触发条件（库存低于安全库存、拣选区缺货等）
  - 补货数量计算、优先级、来源选择

**移库 Job（预实现）**
- V1 实现内容：
  - Job API：POST /api/wcs/jobs（jobType=TRANSFER）
  - Task 分解：根据 Workflow 自动创建 Task
  - Workflow：取货 -> AMR 搬运 -> 放货确认
  - 默认规则：WMS 直接指定 fromStation、toStation、containerId
- 待 WMS 定义后扩展：
  - 移库原因、目标库位选择规则、优先级、时机

**盘点 Job（预实现）**
- V1 实现内容：
  - Job API：POST /api/wcs/jobs（jobType=INVENTORY）
  - Task 分解：根据 Workflow 自动创建 Task
  - Workflow：料箱出库 -> 送到盘点站 -> 等待盘点确认 -> 回库
  - 默认规则：WMS 直接指定 containerId、盘点站
- 待 WMS 定义后扩展：
  - 盘点计划、盘点范围、差异处理规则

#### 0.6.2 设备驱动预实现

V1 预实现 ASRS/输送线/拣选墙驱动，包含接口定义和 Mock 实现，待获取厂商协议文档后真实对接：

**ASRS 适配器（接口定义 + Mock）**
- V1 实现内容：
  - AsrsClient 接口定义（outbound/inbound/queryStatus）
  - MockAsrsClient 模拟实现
  - AsrsPickDelegate / AsrsPutDelegate（Flowable JavaDelegate）
- 真实对接条件：
  - 厂商 API 文档（REST/WebSocket）
  - 出库/入库指令格式、状态回调格式
  - 现场对接调试
- 参考厂商：大福、德马泰克、昆船等

**输送线驱动（接口定义 + Mock）**
- V1 实现内容：
  - ConveyorDevice 接口定义（start/stop/setDestination/getStatus）
  - MockConveyorDriver 模拟实现
  - ConveyorDelegate（Flowable JavaDelegate）
- 真实对接条件：
  - PLC 点位表（寄存器地址、数据类型、读写权限）
  - Modbus TCP 或 OPC UA 协议对接
  - 现场对接调试
- 参考 PLC：西门子、三菱、欧姆龙

**拣选墙驱动（接口定义 + Mock）**
- V1 实现内容：
  - PickWallDevice 接口定义（lightCell/turnOff/confirmPick/displayInfo）
  - MockPickWallDriver 模拟实现
  - PickWallDelegate（Flowable JavaDelegate）
- 真实对接条件：
  - 厂商通信协议文档（TCP/IP 或串口）
  - 点亮格口、熄灭、显示数量等指令格式
  - 按钮确认回调机制
  - 现场对接调试

**参考实现**
- wms-backend-read-only/wcs-app 已实现的驱动可作为参考：
  - LibiaoAirRobClient - 立标料箱机器人 RCS（HTTP 协议）
  - HermesAgvHttpClient - Hermes AGV（HTTP 协议）
  - LanxinAGVClient - 蓝芯 AGV（HTTP 协议）
  - KeyenceBarcodeReaderTcpClient - 基恩士条码阅读器（TCP 协议）
  - YoungSunLabelerClient - 永顺贴标机（TCP 协议）

---

## 一、项目概述

### 1.1 项目目标

在 wms-lite-backend/wcs-app 中实现一个通用 WCS 平台，用可配置的 Workflow 编排业务 Job，统一对接多厂商设备。

### 1.2 技术选型

| 组件 | 选型 | 说明 |
|------|------|------|
| Workflow 引擎 | Flowable 7.1.0 | BPMN 2.0 标准引擎，支持异步等待、可视化建模 |
| 后端框架 | Java 21 + Spring Boot 3.2.2 | 沿用现有技术栈 |
| 数据库 | MySQL | 沿用现有技术栈 |
| 消息总线 | 抽象接口 + RabbitMQ 实现 | V1 默认 RabbitMQ，支持扩展其他 MQ |
| 前端 BPMN | bpmn.io | BPMN 流程建模器和查看器 |

> **[技术选型说明]** 
> - Flowable 7.x 是唯一支持 Spring Boot 3.x 的版本（6.x 不支持）
> - Flowable 7.x 移除了开源 UI Modeler，使用 bpmn.io 作为前端建模工具

### 1.3 V1 优先支持的业务场景

1. 出库 Job（门店订单、线上订单）
2. 空容器回收 Job

### 1.4 设备对接方式

混合方式：核心设备真实对接，其他设备模拟实现

### 1.5 代码策略

完全重写 wcs-app，不复用现有代码

### 1.6 核心设计原则

**设备宝贵尽量不休息**

这是 WCS 系统的核心设计原则，贯穿所有设计决策：

- 设备（AMR、AGV、输送线等）是昂贵的资产，闲置 = 浪费
- WCS 的核心目标之一是最大化设备利用率

设计影响：

1. 任务调度策略
   - 优先分配任务给空闲设备
   - 任务队列管理，确保设备有活干
   - 预调度：提前准备下一个任务

2. 异常处理策略
   - 快速故障恢复，减少设备停机时间
   - 任务重分配：设备故障时快速转移任务
   - 降级策略：部分功能故障不影响整体运行

3. 流程编排策略
   - 并行执行：多设备同时工作
   - 流水线：上一步完成前启动下一步准备
   - 批量处理：合并小任务减少空跑

4. 监控告警
   - 设备利用率监控
   - 空闲时间告警
   - 瓶颈分析

---

## 二、系统架构

### 2.1 五层架构

```
┌─────────────────────────────────────────────────────────────┐
│  L1 接入层（Northbound API Layer）                           │
│  - REST API：Job 创建、查询、取消                            │
│  - 状态回调：通知上游系统                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L2 业务编排层（Orchestration & Workflow Layer）             │
│  - Job & Task 管理                                          │
│  - Workflow 引擎（Flowable BPMN）                            │
│  - 规则引擎                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L3 资源拓扑层（Resource & Topology Layer）                  │
│  - 仓库拓扑：区域、库位、工作站                               │
│  - 设备资源：RCS 集群、输送线、拣选墙等                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L4 设备适配层（Device & RCS Integration Layer）             │
│  - RCS 适配器：统一接口 + 厂商适配                           │
│  - 设备驱动：Modbus / OPC UA / TCP                          │
│  - 设备抽象：Move、Pick、Put、Scan 等                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L5 基础设施层（Infrastructure Layer）                       │
│  - 消息总线（抽象接口 + RabbitMQ/Kafka/... 实现）            │
│  - 数据库（MySQL）                                           │
│  - 日志 / 监控                                               │
└─────────────────────────────────────────────────────────────┘
```

> **[V1 架构说明]** WCS-Lite V1 采用双应用架构：
> - **wcs-lite-app**：L1 接入层、L2 业务编排层、L5 基础设施层
> - **device-app**：L3 资源拓扑层、L4 设备适配层
> - wcs-lite-app 通过 HTTP REST API 调用 device-app

### 2.2 核心领域模型

```
┌─────────────┐     1:N     ┌─────────────┐
│    Job      │────────────▶│    Task     │
│  (业务作业)  │             │  (系统任务)  │
└─────────────┘             └─────────────┘
       │                           │
       │ 1:1                       │
       ▼                           │
┌─────────────────┐                │
│ WorkflowInstance │◀──────────────┘
│   (流程实例)     │
└─────────────────┘
       │
       │ N:1
       ▼
┌─────────────────┐
│WorkflowDefinition│
│   (流程定义)     │
└─────────────────┘
```

---

## 三、用户角色

| 角色 | 描述 | 主要职责 |
|------|------|----------|
| WMS 系统 | 上游业务系统 | 下发 Job、接收状态回调 |
| 仓库管理员 | 系统配置人员 | 配置 Workflow、管理设备、监控运行 |
| 现场操作员 | 一线作业人员 | 执行人工任务（拣选、复核、装箱） |
| 运维人员 | 系统运维人员 | 监控系统、处理异常、干预流程 |
| 系统集成商 | 设备对接人员 | 对接新的 RCS/设备厂商 |

---

## 四、用户故事

### 4.1 L1 接入层

#### US-L1-01：Job 创建接口

**用户故事**：
- 作为 WMS 系统
- 我希望能够通过 REST API 创建出库 Job
- 以便 WCS 能够接收并处理我的业务请求

**验收标准**：
1. 提供 POST /api/wcs/jobs 接口
2. 支持 JSON 格式的 Job 请求体
3. 返回 jobId 和初始状态
4. 支持幂等性（相同 jobNo 不重复创建）

**优先级**：P0

---

#### US-L1-02：Job 状态查询接口

**用户故事**：
- 作为 WMS 系统
- 我希望能够查询 Job 的执行状态
- 以便了解业务请求的处理进度

**验收标准**：
1. 提供 GET /api/wcs/jobs/{jobId} 接口
2. 返回 Job 当前状态、进度、子任务列表
3. 支持批量查询

**优先级**：P0

---

#### US-L1-03：Job 取消接口

**用户故事**：
- 作为 WMS 系统
- 我希望能够取消未完成的 Job
- 以便在业务变更时及时终止任务

**验收标准**：
1. 提供 POST /api/wcs/jobs/{jobId}/cancel 接口
2. 只能取消未完成的 Job
3. 触发相关设备任务的取消

**优先级**：P1

---

#### US-L1-04：状态回调机制

**用户故事**：
- 作为 WMS 系统
- 我希望在 Job 状态变更时收到回调通知
- 以便及时更新业务状态

**验收标准**：
1. 支持配置回调 URL
2. Job 状态变更时主动推送
3. 支持重试机制

**优先级**：P1

---

#### US-L1-05：Job 重试接口

**用户故事**：
- 作为 WMS 系统
- 我希望能够重试失败的 Job
- 以便在问题修复后继续执行任务

**验收标准**：
1. 提供 POST /api/wcs/jobs/{jobId}/retry 接口
2. 只能重试 FAILED 状态的 Job
3. 重试后 Job 状态变为 PENDING
4. 重新启动 Workflow 执行

**优先级**：P1

---

### 4.2 L2 业务编排层

#### US-L2-01：Job 管理

**用户故事**：
- 作为 WCS 系统
- 我希望能够管理 Job 的生命周期
- 以便跟踪每个业务请求的执行状态

**验收标准**：
1. Job 状态：PENDING / IN_PROGRESS / COMPLETED / FAILED / CANCELLED
2. 支持 Job 优先级
3. 支持 Job 超时处理

**优先级**：P0

---

#### US-L2-02：Task 分解

**用户故事**：
- 作为 WCS 系统
- 我希望能够将 Job 分解为多个 Task
- 以便分配给不同的设备执行

**验收标准**：
1. 根据 Workflow 定义自动分解
2. Task 状态独立管理
3. 支持 Task 依赖关系

**优先级**：P0

---

#### US-L2-03：Workflow 定义管理

**用户故事**：
- 作为仓库管理员
- 我希望能够配置 Workflow 流程定义
- 以便灵活编排不同业务场景的执行流程

**验收标准**：
1. 支持 JSON/YAML 格式定义 Workflow
2. 支持多种节点类型（RCS Mission、Device IO、Human Task、Decision）
3. 支持条件分支和异常处理

**优先级**：P1

---

#### US-L2-04：Workflow 执行引擎

**用户故事**：
- 作为 WCS 系统
- 我希望能够按照 Workflow 定义执行任务
- 以便自动化编排设备协作

**验收标准**：
1. 基于 Flowable BPMN 实现
2. 支持节点状态跟踪
3. 支持异常重试
4. 支持人工干预

**优先级**：P0

---

#### US-L2-05：策略配置管理（Strategy）

**用户故事**：
- 作为仓库管理员
- 我希望能够配置各类策略规则
- 以便根据业务条件优化任务执行

**验收标准**：
1. 支持策略 CRUD（创建、查询、更新、删除）
2. 支持多种策略类型（参考原 wcs-app）：
   - TASK_COORDINATION_STRATEGY（任务协调策略）：自动执行、执行频率、分组属性
   - TASK_EXECUTION_STRATEGY（任务执行策略）：跨地图拆分、并行执行、自动分配站点
   - TASK_ASSIGNMENT_STRATEGY（任务分配策略）：车辆优先级、路径重叠、周期执行
   - CHARGING_STRATEGY（充电策略）：充电阈值、空闲充电、校准周期
   - WORKER_WORKSTATION_CONFIGURATION（工作站配置）：入库确认、AGV离开时间、盘点模式
   - ACTION_MODE（动作模式策略）：动作模式匹配
3. 支持策略映射条件（StrategyMapping）：
   - 按动作类型（ActionType）
   - 按任务类型（TaskType）
   - 按设备类型（EquipmentType）
   - 按地图代码（MapCode）
   - 按拣选方式（PickMethod）
4. 支持策略内容配置（StrategyContent）：JSON 格式的策略参数
5. 支持策略启用/禁用
6. 支持系统默认策略

**数据模型**（参考原 wcs-app）：
```
StrategyConfiguration {
  id: Long                      // 策略ID
  strategyType: StrategyType    // 策略类型
  strategyCode: String          // 策略编码
  strategyDescription: String   // 策略描述
  strategyContent: JSON         // 策略内容（各类策略参数）
  strategyMapping: JSON         // 策略映射条件
  isEnabled: Boolean            // 是否启用
}
```

**优先级**：P1

---

#### US-L2-06：容器管理（Container）

**用户故事**：
- 作为 WCS 系统
- 我希望能够管理容器的运行时状态
- 以便跟踪容器位置和状态

**验收标准**：
1. 支持容器 CRUD（创建、查询、更新、删除）
2. 支持容器位置更新（站点、点位、区域）
3. 支持容器状态管理（可用/运输中/在站点/锁定/故障）
4. 支持容器锁定/解锁（被任务占用时锁定）
5. 支持容器移动历史查询
6. 支持容器内容信息（是否空箱、SKU数、总数量）

**数据模型**：
```
Container {
  containerId: String       // 容器ID
  containerCode: String     // 容器编码
  containerSpecId: String   // 容器规格ID（关联ContainerSpec）
  currentStationId: String  // 当前站点ID
  currentPointId: String    // 当前点位ID
  currentZoneId: String     // 当前区域ID
  status: ContainerStatus   // 容器状态（AVAILABLE/IN_TRANSIT/AT_STATION/LOCKED/FAULT）
  lockStatus: LockStatus    // 锁定状态（UNLOCKED/LOCKED_BY_TASK）
  lockTaskId: String        // 锁定的任务ID
  isEmpty: Boolean          // 是否空箱
  skuCount: Integer         // SKU种类数
  totalQty: Integer         // 总数量
  lastMoveTime: DateTime    // 最后移动时间
  lastInventoryTime: DateTime // 最后盘点时间
}
```

**优先级**：P1

---

#### US-L2-07：策略管理（Strategy）

**用户故事**：
- 作为仓库管理员
- 我希望能够配置任务分配和路由策略
- 以便根据业务规则优化任务执行

**验收标准**：
1. 支持策略 CRUD（创建、查询、更新、删除）
2. 支持策略类型（设备选择、路由选择、站点选择、优先级计算、容器选择、机器人选择）
3. 支持策略适用范围（Job类型、区域）
4. 支持规则配置（JSON格式的规则参数）
5. 支持策略优先级和默认策略
6. 支持策略测试（模拟执行）
7. 支持策略评估（根据上下文返回匹配的策略）

**数据模型**：
```
Strategy {
  strategyId: String        // 策略ID
  strategyCode: String      // 策略编码
  strategyName: String      // 策略名称
  strategyType: StrategyType // 策略类型（DEVICE_SELECTION/ROUTE_SELECTION/STATION_SELECTION/PRIORITY_CALCULATION/CONTAINER_SELECTION/ROBOT_SELECTION）
  jobType: JobType          // 适用的Job类型（可选）
  zoneId: String            // 适用的区域（可选）
  ruleExpression: String    // 规则表达式（SpEL或简单条件）
  ruleConfig: JSON          // 规则配置（结构化参数）
  priority: Integer         // 优先级
  status: StrategyStatus    // 状态（ENABLED/DISABLED）
  isDefault: Boolean        // 是否默认策略
  effectiveFrom: DateTime   // 生效开始时间
  effectiveTo: DateTime     // 生效结束时间
}
```

**优先级**：P1（基础功能）

---

### 4.3 L3 资源拓扑层

> **[数据归属说明]** L3 资源拓扑层的数据（Zone、Station、Device）由 device-app 管理，
> wcs-lite-app 通过 DeviceAppClient（HTTP API）查询这些数据。

#### US-L3-01：区域管理（Zone）

**用户故事**：
- 作为仓库管理员
- 我希望能够配置仓库的区域
- 以便系统了解仓库的物理布局

**验收标准**：
1. 支持区域定义（ASRS 区、拣选区、包装区、出库区、缓冲区）
2. 支持区域类型（STORAGE、PICKING、PACKING、SHIPPING、BUFFER）
3. 支持区域状态管理（启用/禁用）
4. 支持区域层级关系（可选）

**数据模型**：
```
Zone {
  zoneId: String        // 区域ID
  zoneCode: String      // 区域代码
  zoneName: String      // 区域名称
  zoneType: String      // 区域类型（STORAGE/PICKING/PACKING/SHIPPING/RECEIVING/BUFFER/SORTING）
  warehouseCode: String // 所属仓库（可选）
  description: String   // 描述（可选）
  isActive: Boolean     // 是否启用
}
```

**优先级**：P1

---

#### US-L3-02：站点管理（Station）

**用户故事**：
- 作为仓库管理员
- 我希望能够配置仓库的工作站
- 以便系统知道有哪些工作站可用

**验收标准**：
1. 支持工作站定义（拣选站、包装站、复核站等）
2. 支持工作站与区域的关联
3. 支持工作站状态管理（在线/离线/维护）
4. 支持工作站能力描述

**数据模型**：
```
Station {
  stationId: String     // 站点ID
  stationCode: String   // 站点代码
  stationName: String   // 站点名称
  stationType: String   // 站点类型（PICKING/PACKING/RECEIVING/SHIPPING/BUFFER/SORTING/WORKSTATION/ASRS_BUFFER/CONVEYOR_NODE）
  zoneId: String        // 所属区域
  zoneName: String      // 区域名称（可选）
  capacity: Integer     // 容量（可选）
  status: String        // 状态（ONLINE/OFFLINE/MAINTENANCE）
  isActive: Boolean     // 是否启用
}
```

**优先级**：P1

---

#### US-L3-03：设备管理（Device）

**用户故事**：
- 作为仓库管理员
- 我希望能够管理仓库中的设备资源
- 以便系统知道有哪些设备可用

**验收标准**：
1. 支持设备注册和配置
2. 支持设备类型（输送线、分拣机、播种墙、扫码枪等）
3. 支持设备状态管理（在线/离线/故障/维护）
4. 支持设备能力描述
5. 支持设备连接参数配置

**数据模型**：
```
Device {
  deviceId: String        // 设备ID
  deviceCode: String      // 设备代码
  deviceName: String      // 设备名称
  deviceType: String      // 设备类型（CONVEYOR/SORTER/PICK_WALL/SCANNER/PRINTER/SCALE/LIFT/PLC/AGV/AMR）
  vendorCode: String      // 厂商代码（可选）
  stationId: String       // 所属站点（可选）
  zoneId: String          // 所属区域（可选）
  ipAddress: String       // IP地址（可选）
  port: Integer           // 端口（可选）
  capabilities: JSON      // 设备能力（可选）
  config: JSON            // 设备配置（可选）
  status: String          // 状态（ONLINE/OFFLINE/FAULT/MAINTENANCE）
  isActive: Boolean       // 是否启用
}
```

**优先级**：P1

---

#### US-L3-04：站点设备绑定管理

**用户故事**：
- 作为仓库管理员
- 我希望能够配置站点与设备的绑定关系
- 以便系统知道每个站点有哪些设备

**验收标准**：
1. 支持站点与设备的多对多绑定
2. 支持绑定关系的启用/禁用
3. 支持查询站点的所有设备
4. 支持查询设备关联的所有站点

**数据模型**：
```
StationDevice {
  id: String            // 绑定ID
  stationId: String     // 站点ID
  deviceId: String      // 设备ID
  deviceName: String    // 设备名称（可选）
  bindingType: String   // 绑定类型（PRIMARY/SECONDARY）
  status: String        // 状态（ENABLED/DISABLED）
}
```

**优先级**：P1

---

#### US-L3-05：站点映射管理

**用户故事**：
- 作为系统集成商
- 我希望能够配置 WCS 逻辑站点与 RCS 物理节点的映射
- 以便不同厂商的设备能够正确对接

**验收标准**：
1. 支持站点 ID 映射
2. 支持坐标系转换
3. 支持多 RCS 厂商

**优先级**：P2

---

#### US-L3-06：RCS 厂商配置管理

**用户故事**：
- 作为系统集成商
- 我希望能够配置不同 RCS 厂商的连接参数
- 以便系统能够对接多个 RCS 厂商

**验收标准**：
1. 支持厂商注册和配置
2. 支持连接参数配置（URL、认证信息等）
3. 支持厂商状态管理
4. 支持 Mock 厂商配置

**优先级**：P1

---

#### US-L3-07：点位管理（Point）

**用户故事**：
- 作为仓库管理员
- 我希望能够管理仓库的点位信息
- 以便系统知道机器人可以到达的位置

**验收标准**：
1. 支持点位 CRUD（创建、查询、更新、删除）
2. 支持点位类型（存储点、拣选点、缓冲点、充电点、停车点等）
3. 支持点位与地图、区域、站点的关联
4. 支持点位坐标信息（x, y, z, theta）
5. 支持与 RCS 厂商点位编码的映射
6. 支持批量导入点位（从 RCS 同步）
7. 支持点位状态管理（可用/占用/禁用）

**数据模型**：
```
Point {
  pointId: String           // 点位ID
  pointCode: String         // 点位编码
  pointName: String         // 点位名称
  pointType: PointType      // 点位类型（STORAGE/PICKING/BUFFER/CHARGING/PARKING/TRANSFER/CONVEYOR/WORKSTATION）
  mapId: String             // 所属地图ID
  zoneId: String            // 所属区域ID
  stationId: String         // 关联站点ID（可选）
  x: Double                 // X坐标
  y: Double                 // Y坐标
  z: Double                 // Z坐标（楼层/高度）
  theta: Double             // 朝向角度
  rcsPointCode: String      // RCS厂商点位编码
  rcsVendorId: String       // RCS厂商ID
  status: PointStatus       // 状态（AVAILABLE/OCCUPIED/DISABLED）
  isActive: Boolean         // 是否启用
}
```

**优先级**：P1

---

#### US-L3-08：地图管理（Map）

**用户故事**：
- 作为仓库管理员
- 我希望能够管理仓库的地图信息
- 以便系统了解仓库的物理布局和机器人活动范围

**验收标准**：
1. 支持地图 CRUD（创建、查询、更新、删除）
2. 支持地图类型（仓库地图、楼层地图、区域地图）
3. 支持地图范围信息（minX, maxX, minY, maxY）
4. 支持与 RCS 厂商地图的映射
5. 支持从 RCS 同步地图数据
6. 支持地图版本管理
7. 支持查询地图下的所有点位

**数据模型**：
```
Map {
  mapId: String             // 地图ID
  mapCode: String           // 地图编码
  mapName: String           // 地图名称
  mapType: MapType          // 地图类型（WAREHOUSE/FLOOR/ZONE）
  minX: Double              // X最小值
  maxX: Double              // X最大值
  minY: Double              // Y最小值
  maxY: Double              // Y最大值
  floor: Integer            // 楼层
  rcsMapId: String          // RCS厂商地图ID
  rcsVendorId: String       // RCS厂商ID
  status: MapStatus         // 状态（ACTIVE/INACTIVE）
  isActive: Boolean         // 是否启用
  version: String           // 地图版本
  lastSyncTime: DateTime    // 最后同步时间
}
```

**优先级**：P1

---

#### US-L3-09：容器规格管理（ContainerSpec）

**用户故事**：
- 作为仓库管理员
- 我希望能够管理容器规格信息
- 以便系统知道有哪些类型的容器可用

**验收标准**：
1. 支持容器规格 CRUD（创建、查询、更新、删除）
2. 支持容器类型（料箱 TOTE、托盘 PALLET、纸箱 CARTON）
3. 支持尺寸信息（长、宽、高、最大承重）
4. 支持分格配置（行数、列数）

**数据模型**：
```
ContainerSpec {
  specId: String            // 规格ID
  specCode: String          // 规格编码
  specName: String          // 规格名称
  containerType: ContainerType // 容器类型（TOTE/PALLET/CARTON）
  length: Integer           // 长(mm)
  width: Integer            // 宽(mm)
  height: Integer           // 高(mm)
  maxWeight: Integer        // 最大承重(g)
  gridRows: Integer         // 分格行数
  gridCols: Integer         // 分格列数
  isActive: Boolean         // 是否启用
}
```

**优先级**：P1

---

### 4.4 L4 设备适配层

#### US-L4-01：RCS 统一接口

**用户故事**：
- 作为 WCS 系统
- 我希望有一个统一的 RCS 接口
- 以便屏蔽不同厂商的差异

**验收标准**：
1. 定义统一的 RcsService 接口
2. 支持 createMission / cancelMission / queryStatus
3. 支持事件订阅

**优先级**：P0

---

#### US-L4-02：RCS 适配器

**用户故事**：
- 作为系统集成商
- 我希望能够为不同厂商实现适配器
- 以便对接各种 RCS 系统

**验收标准**：
1. 提供适配器基类/接口
2. V1 实现模拟适配器（MockRcsAdapter）
3. 支持配置化的厂商参数

**优先级**：P0

---

#### US-L4-03：设备抽象接口

**用户故事**：
- 作为 WCS 系统
- 我希望有统一的设备操作接口
- 以便 Workflow 节点不关心具体设备实现

**验收标准**：
1. 定义设备能力接口（Move、Pick、Put、Scan 等）
2. 支持设备状态查询
3. 支持设备事件上报

**优先级**：P2

---

#### US-L4-04：设备驱动

**用户故事**：
- 作为系统集成商
- 我希望能够实现各种设备的驱动
- 以便对接 PLC、输送线、分拣机等设备

**验收标准**：
1. V1 实现模拟驱动（MockDeviceDriver）
2. 支持 Modbus TCP 协议（预留）
3. 支持 OPC UA 协议（预留）

**优先级**：P1

---

#### US-L4-05：机器人管理（Robot）

**用户故事**：
- 作为运维人员
- 我希望能够查看和管理机器人状态
- 以便监控机器人运行情况

**验收标准**：
1. 支持机器人列表查询（按厂商、类型、状态筛选）
2. 支持机器人详情查询（位置、状态、电量、当前任务）
3. 支持机器人实时位置查询
4. 支持从 RCS 同步机器人列表
5. 支持手动更新机器人状态（维护、离线）

**数据模型**：
```
Robot {
  robotId: String           // 机器人ID
  robotCode: String         // 机器人编码
  robotName: String         // 机器人名称
  robotType: RobotType      // 机器人类型（AMR/AGV/FORKLIFT/SHUTTLE）
  rcsVendorId: String       // RCS厂商ID
  rcsRobotId: String        // RCS厂商机器人ID
  currentMapId: String      // 当前地图ID
  currentPointId: String    // 当前点位ID
  currentX: Double          // 当前X坐标
  currentY: Double          // 当前Y坐标
  currentTheta: Double      // 当前朝向
  status: RobotStatus       // 状态（IDLE/BUSY/CHARGING/ERROR/OFFLINE/MAINTENANCE）
  batteryLevel: Integer     // 电量百分比
  isCharging: Boolean       // 是否充电中
  currentMissionId: String  // 当前任务ID
  lastHeartbeatTime: DateTime // 最后心跳时间
}
```

**优先级**：P1

---

#### US-L4-06：交通灯管理（TrafficLight）

**用户故事**：
- 作为运维人员
- 我希望能够配置和控制交通灯
- 以便协调机器人和人员的通行

**验收标准**：
1. 支持交通灯配置（关联点位、设备连接参数）
2. 支持单个交通灯控制（颜色、闪烁模式、蜂鸣器）
3. 支持批量交通灯控制
4. 支持交通灯状态查询

**数据模型**：
```
TrafficLight {
  lightId: String           // 交通灯ID
  lightCode: String         // 交通灯编码
  lightName: String         // 交通灯名称
  pointId: String           // 关联点位ID
  mapId: String             // 所属地图ID
  currentColor: LightColor  // 当前颜色（OFF/RED/YELLOW/GREEN/BLUE）
  blinkMode: BlinkMode      // 闪烁模式（STEADY/SLOW_BLINK/FAST_BLINK）
  buzzerMode: BuzzerMode    // 蜂鸣器模式（OFF/CONTINUOUS/INTERMITTENT）
  controlMode: ControlMode  // 控制模式（AUTO/MANUAL）
  deviceId: String          // 关联设备ID
  ipAddress: String         // IP地址
  port: Integer             // 端口
}
```

**优先级**：P1

---

### 4.5 L5 基础设施层

#### US-L5-01：消息总线（抽象接口）

**用户故事**：
- 作为 WCS 系统
- 我希望有可靠的消息传递机制
- 以便各组件之间异步通信

**验收标准**：
1. 定义统一的消息总线抽象接口（MessageBus）
2. 支持 publish / subscribe / request-reply 模式
3. V1 默认实现 RabbitMQ 适配器
4. 支持后续扩展其他 MQ（Kafka、RocketMQ 等）
5. 支持设备事件发布/订阅
6. 支持任务状态变更通知

**优先级**：P1

---

#### US-L5-02：数据持久化

**用户故事**：
- 作为 WCS 系统
- 我希望能够持久化 Job、Task、Workflow 数据
- 以便支持故障恢复和历史查询

**验收标准**：
1. 使用 MySQL 存储
2. 支持事务
3. 支持审计日志

**优先级**：P0

---

#### US-L5-03：监控与日志

**用户故事**：
- 作为运维人员
- 我希望能够监控系统运行状态
- 以便及时发现和处理问题

**验收标准**：
1. 关键操作记录日志
2. 支持 Job/Task 执行追踪
3. 支持设备状态监控

**优先级**：P2

---

### 4.6 出库 Job 业务场景

#### 场景描述

门店/线上订单出库流程：
1. WMS 下发出库 Job
2. ASRS 立库出库到缓冲区
3. AMR 搬运到拣选墙
4. 人工拣选
5. 拣选完成，AMR 搬运到包装区
6. 人工包装
7. 输送线送到出库月台

---

#### US-OB-01：创建出库 Job

**用户故事**：
- 作为 WMS 系统
- 我希望能够创建出库 Job
- 以便启动门店/线上订单的出库流程

**请求示例**：
```json
{
  "jobType": "OUTBOUND",
  "jobNo": "OB20251218001",
  "priority": 5,
  "orderType": "STORE",
  "storeCode": "S001",
  "items": [
    { "skuCode": "SKU001", "qty": 10 },
    { "skuCode": "SKU002", "qty": 5 }
  ],
  "callbackUrl": "http://wms/callback"
}
```

**验收标准**：
1. 创建 Job 记录
2. 根据 jobType 加载对应的 Workflow 定义
3. 创建 WorkflowInstance
4. 返回 jobId

**优先级**：P0

---

#### US-OB-02：ASRS 出库节点

**用户故事**：
- 作为 WCS 系统
- 我希望能够执行 ASRS 出库任务
- 以便将货物从立库出到缓冲区

**验收标准**：
1. 创建 ASRS_PICK Task
2. 调用 ASRS 接口出库
3. 等待 ASRS 回调"到位"
4. 更新 Task 状态，流转到下一节点

**优先级**：P2（V1 可模拟）

---

#### US-OB-03：AMR 搬运节点

**用户故事**：
- 作为 WCS 系统
- 我希望能够执行 AMR 搬运任务
- 以便将货物从缓冲区搬运到拣选墙

**验收标准**：
1. 创建 AMR_MOVE Task
2. 调用 RcsService.createMission()
3. 等待 RCS 回调"任务完成"
4. 更新 Task 状态，流转到下一节点

**优先级**：P0

---

#### US-OB-04：拣选墙拣选节点

**用户故事**：
- 作为现场操作员
- 我希望能够在拣选墙完成拣选任务
- 以便按订单拣出货物

**验收标准**：
1. 创建 PICK_WALL_PICK Task
2. 点亮拣选墙对应格口
3. 显示拣选信息（SKU、数量）
4. 等待操作员确认拣选完成
5. 更新 Task 状态，流转到下一节点

**优先级**：P2（V1 可模拟）

---

#### US-OB-05：包装节点

**用户故事**：
- 作为现场操作员
- 我希望能够完成包装任务
- 以便将拣选的货物打包

**验收标准**：
1. 创建 PACK Task
2. 显示包装信息
3. 等待操作员确认包装完成
4. 更新 Task 状态，流转到下一节点

**优先级**：P2（V1 可模拟）

---

#### US-OB-06：出库完成

**用户故事**：
- 作为 WCS 系统
- 我希望在出库流程完成后通知 WMS
- 以便 WMS 更新订单状态

**验收标准**：
1. 所有节点完成后，标记 Job 为 COMPLETED
2. 调用 WMS 回调接口
3. 返回出库明细

**优先级**：P0

---

### 4.7 空容器回收 Job 业务场景

#### 场景描述

空容器回收流程：
1. 拣选完成后，空容器需要回收
2. AMR 将空容器从拣选墙搬运到回收区
3. 或者搬运回 ASRS 立库

---

#### US-ER-01：创建空容器回收 Job

**用户故事**：
- 作为 WCS 系统
- 我希望能够创建空容器回收 Job
- 以便回收拣选完成后的空容器

**请求示例**：
```json
{
  "jobType": "EMPTY_CONTAINER_RETURN",
  "jobNo": "ER20251218001",
  "priority": 3,
  "containerId": "TOTE001",
  "fromStation": "PICK_WALL_STATION_01",
  "toStation": "EMPTY_CONTAINER_BUFFER"
}
```

**验收标准**：
1. 创建 Job 记录
2. 加载空容器回收 Workflow
3. 创建 WorkflowInstance

**优先级**：P0

---

#### US-ER-02：AMR 搬运空容器

**用户故事**：
- 作为 WCS 系统
- 我希望能够调度 AMR 搬运空容器
- 以便将空容器从拣选墙搬运到回收区

**验收标准**：
1. 创建 AMR_MOVE Task
2. 调用 RcsService.createMission()
3. 等待 RCS 回调"任务完成"
4. 更新 Task 状态

**优先级**：P0

---

#### US-ER-03：空容器入库（可选）

**用户故事**：
- 作为 WCS 系统
- 我希望能够将空容器入库到 ASRS
- 以便空容器可以循环使用

**验收标准**：
1. 创建 ASRS_PUT Task
2. 调用 ASRS 接口入库
3. 等待 ASRS 回调"入库完成"
4. 更新 Task 状态

**优先级**：P2

---

### 4.8 运维管理

#### 运维方案说明

采用 **CRUD 界面 + CLI 批量处理** 的混合方案：

| 场景 | 方案 | 说明 |
|------|------|------|
| 日常查看 Job 列表 | CRUD 界面 | 表格展示，支持筛选、排序、分页 |
| 查看 Job/Task 详情 | CRUD 界面 | 详情页，展示 Task 列表、Workflow 状态 |
| 单个 Job 操作 | CRUD 界面 | 按钮操作：取消、重试、暂停 |
| 批量操作 | CLI | `job cancel --status FAILED --before 2025-12-17` |
| 复杂查询 | CLI | `job list --type OUTBOUND --status IN_PROGRESS --limit 100` |
| 脚本自动化 | CLI | 定时任务、运维脚本 |

---

#### US-OP-01：Job 管理界面

**用户故事**：
- 作为运维人员
- 我希望有一个 Job 管理界面
- 以便直观地查看和操作 Job

**验收标准**：
1. Job 列表页面：表格展示，支持筛选（状态、类型、时间）、排序、分页
2. Job 详情页面：显示 Job 信息、Task 列表、Workflow 执行状态
3. 单个操作按钮：取消、重试（失败的 Job）
4. 提供 REST API 支持前端调用

**优先级**：P1

---

#### US-OP-02：Workflow 干预界面

**用户故事**：
- 作为运维人员
- 我希望能够通过界面干预 Workflow 的执行
- 以便处理异常情况

**验收标准**：
1. 在 Job 详情页显示 Workflow 节点执行状态
2. 支持暂停/恢复 Workflow（按钮操作）
3. 支持重试失败节点（按钮操作）
4. 支持跳过当前节点（按钮操作）

**优先级**：P1

---

#### US-OP-03：设备状态监控界面

**用户故事**：
- 作为运维人员
- 我希望有一个设备状态监控界面
- 以便了解设备可用性

**验收标准**：
1. 设备列表页面：显示设备在线/离线状态
2. 设备详情页面：显示设备当前任务、历史任务
3. 支持设备告警展示

**优先级**：P2

---

#### US-OP-04：CLI 命令执行

**用户故事**：
- 作为运维人员
- 我希望能够通过 Web 终端执行 CLI 命令
- 以便进行批量操作和复杂查询

**验收标准**：
1. 提供 Web 终端界面（嵌入运维控制台）
2. 支持命令执行：POST /api/wcs/cli/execute
3. 支持命令历史（上下箭头浏览）
4. 支持彩色输出（成功/失败/警告）

**优先级**：P1

---

#### US-OP-05：CLI 命令帮助

**用户故事**：
- 作为运维人员
- 我希望能够查看 CLI 命令的帮助信息
- 以便了解可用的命令和参数

**验收标准**：
1. 支持 `help` 命令显示所有可用命令
2. 支持 `help <command>` 显示指定命令的详细帮助
3. 提供 GET /api/wcs/cli/help 接口

**优先级**：P1

---

#### US-OP-06：CLI 批量操作

**用户故事**：
- 作为运维人员
- 我希望能够通过 CLI 进行批量操作
- 以便高效处理大量 Job

**验收标准**：
1. 支持批量取消：`job cancel --status FAILED --before <date>`
2. 支持批量重试：`workflow retry --status FAILED --limit 100`
3. 支持批量查询导出：`job list --format json > jobs.json`
4. 操作前显示影响范围，需要确认

**CLI 命令列表**：

```
# Job 命令
job list [--status <status>] [--type <type>] [--limit <n>]
job show <jobId>
job cancel <jobId> [--reason <reason>]
job cancel --status <status> [--before <date>] [--confirm] [--token=xxx]  # 批量取消（两阶段确认）
job retry <jobId>                                           # 重试失败的 Job
job retry --status FAILED [--type <type>] [--limit <n>] [--confirm] [--token=xxx]  # 批量重试（两阶段确认）

# Workflow 命令
workflow show <jobId>
workflow pause <jobId>
workflow resume <jobId>
workflow retry <jobId>
workflow retry --status FAILED [--limit <n>] [--confirm] [--token=xxx]    # 批量重试（两阶段确认）
workflow skip <jobId>
workflow goto <jobId> <nodeId>                              # 跳转到指定节点执行

# Task 命令
task list [--job <jobId>] [--status <status>]
task show <taskId>
task complete <taskId>                                      # 手动完成人工任务
task fail <taskId> --reason <reason>                        # 手动标记 Task 失败

# System 命令
system status             # 系统状态概览
system config             # 系统配置信息

# Device 命令
device list               # 设备列表
device show <deviceId>    # 设备详情

# Station 命令
station list              # 站点列表

# 帮助命令
help                      # 显示所有命令
help <command>            # 显示指定命令帮助
```

**优先级**：P1

---

## 五、用户故事优先级汇总

### P0 - V1 必须实现

| 编号 | 用户故事 | 说明 |
|------|----------|------|
| US-L1-01 | Job 创建接口 | 核心入口 |
| US-L1-02 | Job 状态查询接口 | 基础功能 |
| US-L2-01 | Job 管理 | 核心功能 |
| US-L2-02 | Task 分解 | 核心功能 |
| US-L2-04 | Workflow 执行引擎 | 核心功能 |
| US-L4-01 | RCS 统一接口 | 核心抽象 |
| US-L4-02 | RCS 适配器（Mock） | V1 模拟实现 |
| US-L5-02 | 数据持久化 | 基础功能 |
| US-OB-01 | 创建出库 Job | 核心场景 |
| US-OB-03 | AMR 搬运节点 | 核心场景 |
| US-OB-06 | 出库完成 | 核心场景 |
| US-ER-01 | 创建空容器回收 Job | 核心场景 |
| US-ER-02 | AMR 搬运空容器 | 核心场景 |

### P1 - V1 应该实现

| 编号 | 用户故事 | 说明 |
|------|----------|------|
| US-L1-03 | Job 取消接口 | 重要功能 |
| US-L1-04 | 状态回调机制 | 重要功能 |
| US-L1-05 | Job 重试接口 | 重要功能 |
| US-L2-03 | Workflow 定义管理 | 配置功能 |
| US-L2-05 | 策略配置管理（Strategy） | 核心功能 |
| US-L2-06 | 容器管理（Container） | 核心功能 |
| US-L2-07 | 策略管理（Strategy）-高级 | 核心功能 |
| US-L3-01 | 区域管理（Zone） | 配置功能 |
| US-L3-02 | 站点管理（Station） | 配置功能 |
| US-L3-03 | 设备管理（Device） | 配置功能 |
| US-L3-04 | 站点设备绑定管理 | 配置功能 |
| US-L3-05 | 站点映射管理 | 对接功能 |
| US-L3-06 | RCS 厂商配置管理 | 配置功能 |
| US-L3-07 | 点位管理（Point） | 配置功能 |
| US-L3-08 | 地图管理（Map） | 配置功能 |
| US-L3-09 | 容器规格管理（ContainerSpec） | 配置功能 |
| US-L4-03 | 设备抽象接口 | 扩展功能 |
| US-L4-04 | 设备驱动 | 扩展功能 |
| US-L4-05 | 机器人管理（Robot） | 核心功能 |
| US-L4-06 | 交通灯管理（TrafficLight） | 扩展功能 |
| US-L5-01 | 消息总线 | 异步通信 |
| US-L5-03 | 监控与日志 | 运维功能 |
| US-OB-02 | ASRS 出库节点 | 可模拟 |
| US-OB-04 | 拣选墙拣选节点 | 可模拟 |
| US-OB-05 | 包装节点 | 可模拟 |
| US-ER-03 | 空容器入库 | 可模拟 |
| US-OP-01 | Job 管理界面 | 运维界面 |
| US-OP-02 | Workflow 干预界面 | 运维界面 |
| US-OP-03 | 设备状态监控界面 | 运维功能 |
| US-OP-04 | CLI 命令执行 | 运维 CLI |
| US-OP-05 | CLI 命令帮助 | 运维 CLI |
| US-OP-06 | CLI 批量操作 | 运维 CLI |

### P2 - V1 可以延后

（暂无）

---

## 六、非功能性需求

### 6.1 性能要求

- Job 创建响应时间 < 500ms
- 单节点支持 1000+ 并发 Job
- Workflow 节点流转延迟 < 100ms

### 6.2 可用性要求

- 系统可用性 > 99.9%
- 支持故障恢复（Job/Task 状态持久化）
- 支持优雅停机

### 6.3 可扩展性要求

- 支持水平扩展
- 支持新增 Workflow 节点类型
- 支持新增设备适配器

### 6.4 安全要求

- API 接口鉴权
- 操作审计日志
- 敏感数据加密

---

*文档版本：V1.2*
*创建时间：2025-12-18*
*最后更新：2025-12-25*
*更新内容：补充 Point、Map、ContainerSpec、Robot、TrafficLight、Container、Strategy 用户故事*
