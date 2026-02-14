# WCS-1680 device-app RCS 任务 API 与设备驱动层

## 任务概述

- **Jira Issue**: WCS-1680
- **预估工时**: 6 人天（48 小时）
- **前置依赖**: WCS-1647（基础设施与领域模型）
- **后续任务**: WCS-1651（CLI命令与集成测试）、前端 WCS 模块开发

> **[说明]** 本任务实现 device-app 的完整功能，包括原 wcs-app 的所有设备驱动：
> - RCS Vendor 厂商配置 API
> - RCS Mission 任务管理 API
> - RCS 回调处理
> - 设备驱动层完整架构（从原 wcs-app 搬迁并重构）
> - 所有厂商驱动实现（立标、Hermes、蓝芯、基恩士、奥普特、永顺）
> 
> **[架构说明]** device-app 负责 RCS 对接和设备驱动。
> API 路径前缀：`/device/`
>
> **[重要]** 原 wcs-app 的所有驱动实现全部搬过来，同时进行重构优化提升可读性！

## 参考文档

- 需求文档: [requirements.md](../requirements.md)
- 设计文档: [design.md](../design.md)
  - 第 2.3 节「device-app 项目结构」
  - 第五章「设备驱动层架构设计」
- 原 wcs-app 驱动实现: `wms-backend-read-only/wcs-app/src/main/java/com/item/wcs/infrastructure/driver/`

## 重构要求

**[重要]** 从原 wcs-app 搬迁代码时，必须进行重构优化：

1. **命名规范**: 类名、方法名、变量名符合本项目规范
2. **代码结构**: 拆分过长方法，单一职责
3. **注释完善**: 添加 JavaDoc，关键逻辑加注释
4. **异常处理**: 统一异常处理，使用项目 ErrorCode
5. **日志规范**: 统一日志格式，关键节点记录
6. **包路径调整**: 从 com.item.wcs 改为 com.t5.device

---

## 任务清单

### 任务 6.1：RCS Vendor 厂商配置 API（4h）

**目标**: 实现 RCS 厂商配置的 CRUD API

**交付物**:
- [ ] RcsVendorController（REST API）
  - GET /device/rcs-vendors - 查询列表
  - GET /device/rcs-vendors/{vendorId} - 详情
  - POST /device/rcs-vendors - 创建
  - PUT /device/rcs-vendors/{vendorId} - 更新
  - DELETE /device/rcs-vendors/{vendorId} - 删除
  - PUT /device/rcs-vendors/{vendorId}/status - 状态切换
  - POST /device/rcs-vendors/{vendorId}/test-connection - 测试连接
- [ ] RcsVendorApplicationService
- [ ] RcsVendorConfig 实体、Repository、Mapper

**表名**: def_rcs_vendor_config

---

### 任务 6.2：RCS Mission API（6h）

**目标**: 实现 RCS 任务管理 API，供 wcs-lite-app 的 DeviceAppClient 调用

**交付物**:
- [ ] RcsMissionController（REST API）
  ```
  POST /device/rcs/missions - 创建搬运任务
  DELETE /device/rcs/missions/{missionId} - 取消任务
  GET /device/rcs/missions/{missionId}/status - 查询任务状态
  ```
- [ ] RcsMissionApplicationService
- [ ] RcsMission 实体、Repository、Mapper
- [ ] 请求/响应 DTO

**表名**: doc_rcs_mission

---

### 任务 6.3：RCS 回调处理（4h）

**目标**: 实现接收 RCS 厂商回调，转发给 wcs-lite-app

**交付物**:
- [ ] RcsCallbackController（接收 RCS 厂商回调）
- [ ] RcsCallbackHandler
- [ ] WcsCallbackService（转发回调给 wcs-lite-app）
- [ ] CallbackRetryService（回调重试机制）
- [ ] CallbackLog 实体、Repository、Mapper

**AirRob回调接口（7个）**:
- [ ] /air-rob/system/report - 系统状态上报
- [ ] /air-rob/EStop/report - 急停上报
- [ ] /air-rob/task/report - 任务状态上报（核心）
- [ ] /air-rob/tote/report - 料箱状态上报
- [ ] /air-rob/task/request-tote-task - 请求料箱任务
- [ ] /air-rob/fire-alarm-report - 火警上报
- [ ] /air-rob/location/report - 位置上报

**OPS回调接口（3个）**:
- [ ] /ops/task/report - OPS任务状态上报
- [ ] /ops/tote/report - OPS料箱状态上报
- [ ] /ops/system/report - OPS系统状态上报

**回调重试机制**:
- 重试策略：指数退避（1s, 5s, 30s, 5min）
- 最大重试次数：4次
- 超过最大重试次数后标记为FAILED，等待人工处理

**表名**: doc_device_callback_log

---

### 任务 6.3.1：驱动层架构概述（参考）

**[重要] 驱动层核心架构**:

```
ClientCreateFactory（策略模式工厂）
    |
    +-- ClientCreator（创建器接口）
    |       |
    |       +-- LibiaoAirRobClientCreator
    |       +-- HermesAgvHttpClientCreator
    |       +-- LanxinAGVClientCreator
    |       +-- KeyenceBarcodeReaderClientCreator
    |       +-- OptmvBarcodeReaderClientCreator
    |       +-- YoungSunLabelerClientCreator
    |       +-- YoungSunPrinterClientCreator
    |       +-- MockClientCreator
    |
    +-- Client（客户端接口）
            |
            +-- AbstractClientAdapter（抽象适配器）
                    |
                    +-- HTTPClientAdapter（HTTP协议）
                    +-- TCPClientAdapter（TCP协议）
                    +-- ModbusTcpClientAdapter（Modbus协议）
                    +-- GrpcClientAdapter（gRPC协议）
```

**Client接口核心方法**:
- connect() - 建立连接
- disconnect() - 断开连接
- checkHealth() - 健康检查
- isConnected() - 是否已连接
- sendMessage(Command) - 发送命令
- fetchCommandStatus(Command) - 查询命令状态
- getClientType() - 获取客户端类型

**ClientCreator接口核心方法**:
- supportType() - 返回支持的ClientType
- createClient(Equipment, EquipmentModel) - 创建客户端
- createClient(EquipmentModel) - 厂家协议模式
- createClient(Equipment) - 自主控制模式

**参考**: design.md 第68节 Infrastructure层结构分析

---

### 任务 6.4：设备驱动层基础架构（8h）

**目标**: 搬迁并重构原 wcs-app 的驱动层基础架构

**原文件位置**: `wms-backend-read-only/wcs-app/.../infrastructure/driver/factory/`

**参考设计**: design.md 第五章
- 5.1 Client 接口定义
- 5.2 AbstractClientAdapter 基类
- 5.3 HTTPClientAdapter 协议适配器
- 5.5 ClientCreateFactory 驱动工厂（策略模式）
- 5.6.1 ClientCreator 接口与 AbstractClientCreatorAdapter
- 5.6.2 TCPClientConfig 配置类
- 5.6.3 连接池设计
- 5.6.4 TCPClientAdapter 协议适配器

**交付物**:

**核心接口与基类** (com.t5.device.infrastructure.driver/):
- [ ] Client.java - 设备客户端统一接口
  - 方法: connect(), disconnect(), checkHealth(), isConnected(), isHealth(), isFaulty()
  - 方法: sendMessage(Command), sendMessage(List<Command>), fetchCommandStatus(Command)
  - 方法: sendMessage(JSONObject), buildSendBody(Command)
  - 方法: getClientType()
- [ ] ClientCreator.java - 客户端创建器接口
  - 方法: supportType() 返回 ClientType
  - 方法: createClient(Equipment, EquipmentModel)
  - 方法: createClient(EquipmentModel) 厂家协议模式
  - 方法: createClient(Equipment) 自主控制模式
- [ ] AbstractClientAdapter.java - 抽象适配器基类
  - 实现 Client 接口的通用方法
  - 提供日志、异常处理等公共逻辑
- [ ] AbstractClientCreatorAdapter.java - 抽象创建器基类
  - 提供默认空实现，子类只需覆盖需要的方法
- [ ] ClientCreateFactory.java - 驱动工厂
  - 使用策略模式，收集所有 ClientCreator 实现
  - 根据 ClientType 选择对应的 Creator 创建 Client

**协议适配器** (com.t5.device.infrastructure.driver/):
- [ ] HTTPClientAdapter.java - HTTP 协议适配器
  - 封装 RestTemplate 调用
  - 提供 sendPostRequest(), sendGetRequest() 等方法
- [ ] TCPClientAdapter.java - TCP 协议适配器
  - 使用连接缓存管理 TCP 连接
  - 提供 sendRawMessage(), sendTcpMessage() 等方法
  - 抽象方法: performHealthCheck(), sendTcpMessage(), sendTcpRawMessage()
- [ ] GrpcClientAdapter.java - gRPC 协议适配器
- [ ] ModbusTcpClientAdapter.java - Modbus TCP 协议适配器

**配置类** (com.t5.device.infrastructure.driver.config/):
- [ ] TCPClientConfig.java
  - 字段: host, port, connectionTimeoutMs, readTimeoutMs, writeTimeoutMs
  - 字段: enableKeepalive, keepaliveTime, keepaliveInterval, keepaliveProbes
  - 字段: receiveBufferSize, sendBufferSize, noDelay, reuseAddress, idleTimeoutMs
  - 方法: getTarget(), isValid(), createDefault(host, port)
- [ ] GrpcConnectionConfig.java
- [ ] ModbusTcpConfig.java

**协议处理器** (com.t5.device.infrastructure.driver.handler/):
- [ ] ModbusTcpProtocolHandler.java

**模型类** (com.t5.device.infrastructure.driver.model/):
- [ ] BaseCommandResponse.java
  - 字段: success, code, message, data
  - 静态方法: success(), failure(message)
- [ ] Position.java

**连接池** (com.t5.device.infrastructure.driver.pool/):
- [ ] Connection.java - 连接接口
  - 方法: getConnectionId(), isValid(), isConnected(), getConfig()
  - 方法: updateLastActivityTime(), healthCheck(), close()
- [ ] ConnectionCache.java - 连接缓存接口
  - 方法: register(key, connection), get(key), remove(key)
  - 方法: isValid(key), size(), clear()
- [ ] ConnectionKeyGenerator.java - 连接键生成器
  - 静态方法: generateTcpKey(host, port), generateGrpcKey(host, port), generateHttpKey(baseUrl)
- [ ] SimpleConnectionCache.java - 简单连接缓存实现
  - 使用 ConcurrentHashMap 管理连接
  - 定时清理无效连接 @Scheduled(fixedDelay = 60000)
- [ ] TCPConnection.java - TCP 连接实现
  - 管理 Socket 连接生命周期
  - 方法: connect(), send(data), receive(timeoutMs)
- [ ] GrpcConnection.java - gRPC 连接实现

**重构重点**:
- Client 接口方法命名优化
- 连接池管理逻辑简化
- 配置类使用 @Builder 模式
- TCPClientAdapter 使用连接缓存而非直接管理 Socket

---

### 任务 6.5：立标驱动 Libiao（6h）

**目标**: 搬迁并重构立标系列驱动

**原文件位置**: `wms-backend-read-only/wcs-app/.../infrastructure/driver/libiao/`

**交付物**:

**料箱机器人 AirRob**:
- [ ] LibiaoAirRobClient.java - 料箱机器人客户端
- [x] LibiaoAirRobClientCreator.java - 创建器
- [ ] LibiaoAirRobResponse.java - 响应模型

**OPS 系统**:
- [ ] LibiaoOPSClient.java - OPS 客户端
- [ ] LibiaoOPSClientCreator.java - 创建器
- [ ] LibiaoOPSResponse.java - 响应模型

**溢出处理**:
- [ ] LibiaoOverflowClient.java - 溢出处理客户端
- [ ] LibiaoOverflowClientCreator.java - 创建器
- [ ] LibiaoOverflowResponse.java - 响应模型

**包路径**: com.t5.device.infrastructure.driver.libiao

**重构重点**:
- API 端点常量提取
- 请求构建逻辑封装
- 响应解析统一处理

---

### 任务 6.6：Hermes AGV 驱动（3h）

**目标**: 搬迁并重构 Hermes AGV 驱动

**原文件位置**: `wms-backend-read-only/wcs-app/.../infrastructure/driver/hermes/`

**交付物**:
- [ ] HermesAgvHttpClient.java - Hermes AGV 客户端
- [ ] HermesAgvHttpClientCreator.java - 创建器
- [ ] HermesCommandResponse.java - 响应模型

**包路径**: com.t5.device.infrastructure.driver.hermes

---

### 任务 6.7：蓝芯 AGV 驱动 Lanxin（3h）

**目标**: 搬迁并重构蓝芯 AGV 驱动

**原文件位置**: `wms-backend-read-only/wcs-app/.../infrastructure/driver/lanxin/`

**交付物**:
- [ ] LanxinAGVClient.java - 蓝芯 AGV 客户端
- [ ] LanxinAGVClientCreator.java - 创建器
- [ ] LanxinAGVResponse.java - 响应模型

**包路径**: com.t5.device.infrastructure.driver.lanxin

---

### 任务 6.8：扫码枪驱动（4h）

**目标**: 搬迁并重构扫码枪驱动（基恩士、奥普特）

**原文件位置**: 
- `wms-backend-read-only/wcs-app/.../infrastructure/driver/keyence/`
- `wms-backend-read-only/wcs-app/.../infrastructure/driver/optmv/`

**交付物**:

**基恩士 Keyence**:
- [ ] KeyenceBarcodeReaderTcpClient.java - 基恩士扫码枪客户端
- [ ] KeyenceBarcodeReaderClientCreator.java - 创建器
- [ ] KeyenceBarcodeReaderResponse.java - 响应模型

**奥普特 Optmv**:
- [ ] OptmvBarcodeReaderTcpClient.java - 奥普特扫码枪客户端
- [ ] OptmvBarcodeReaderClientCreator.java - 创建器
- [ ] OptmvBarcodeReaderResponse.java - 响应模型

**包路径**: 
- com.t5.device.infrastructure.driver.keyence
- com.t5.device.infrastructure.driver.optmv

---

### 任务 6.9：永顺设备驱动 Yongsun（4h）

**目标**: 搬迁并重构永顺设备驱动（贴标机、打印机）

**原文件位置**: `wms-backend-read-only/wcs-app/.../infrastructure/driver/yongsun/`

**交付物**:

**贴标机 Labeler**:
- [ ] YoungSunLabelerClient.java - 贴标机客户端
- [ ] YoungSunLabelerClientCreator.java - 创建器
- [ ] YoungSunLabelerResponse.java - 响应模型

**打印机 Printer**:
- [ ] YoungSunPrinterSocketClient.java - 打印机客户端
- [ ] YoungSunPrinterClientCreator.java - 创建器
- [ ] YoungSunPrinterSocketResponse.java - 响应模型

**包路径**: com.t5.device.infrastructure.driver.yongsun

---

### 任务 6.10：Command 命令模型（4h）

**目标**: 实现设备命令模型，管理与外部设备的通信

**参考**: design.md 第 5.8 节

**交付物**:
- [ ] Command 实体
- [ ] CmdType 枚举（命令类型）
- [ ] CmdStatus 枚举（命令状态）
- [ ] CmdErrorType 枚举（错误类型）
- [ ] SchedulingMethod 枚举（调度方式）
- [ ] CommandRepository, CommandMapper
- [ ] CommandService（命令管理服务）

**表名**: event_device_command

---

### 任务 6.11：RCS 适配器工厂（4h）

**目标**: 实现 RCS 适配器工厂，整合各厂商驱动

**交付物**:
- [ ] RcsAdapter 接口
- [ ] RcsAdapterFactory
- [ ] LibiaoRcsAdapter（封装 LibiaoAirRobClient）
- [ ] HermesRcsAdapter（封装 HermesAgvHttpClient）
- [ ] LanxinRcsAdapter（封装 LanxinAGVClient）
- [ ] MockRcsAdapter（Mock 实现，用于测试）

**包路径**: com.t5.device.infrastructure.rcs

---

### 任务 6.12：Robot 机器人管理 API（3h）

**目标**: 实现 Robot 机器人的 CRUD 和控制 API

**交付物**:
- [ ] RobotController（REST API）
  ```
  GET /device/robots - 分页查询（支持按 status 筛选）
  GET /device/robots/{robotId} - 详情
  POST /device/robots - 创建
  PUT /device/robots/{robotId} - 更新
  DELETE /device/robots/{robotId} - 删除
  PUT /device/robots/{robotId}/status - 状态切换
  GET /device/robots/{robotId}/position - 获取实时位置
  POST /device/robots/{robotId}/command - 发送控制命令
  ```
- [ ] RobotApplicationService
- [ ] Robot 实体、Repository、Mapper
- [ ] RobotPositionDto、RobotCommandDto

**表名**: def_robot

**控制命令类型**:
- MOVE - 移动到指定位置
- STOP - 停止
- CHARGE - 去充电
- RELEASE - 释放机器人

---

### 任务 6.13：TrafficLight 信号灯管理 API（2h）

**目标**: 实现 TrafficLight 信号灯/电子标签的 CRUD 和控制 API

**交付物**:
- [ ] TrafficLightController（REST API）
  ```
  GET /device/traffic-lights - 分页查询（支持按 stationCode、zoneCode 筛选）
  GET /device/traffic-lights/{lightId} - 详情
  POST /device/traffic-lights - 创建
  PUT /device/traffic-lights/{lightId} - 更新
  DELETE /device/traffic-lights/{lightId} - 删除
  POST /device/traffic-lights/{lightId}/control - 控制灯光
  POST /device/traffic-lights/batch-control - 批量控制
  ```
- [ ] TrafficLightApplicationService
- [ ] TrafficLight 实体、Repository、Mapper
- [ ] TrafficLightControlDto

**表名**: def_traffic_light

**控制参数**:
- color - 颜色（RED, GREEN, YELLOW, BLUE, WHITE）
- blinkMode - 闪烁模式（SOLID, BLINK_SLOW, BLINK_FAST）
- isBuzzerEnabled - 是否启用蜂鸣器
- buzzerMode - 蜂鸣器模式（OFF, BEEP, CONTINUOUS）

---

## 文件清单汇总

**从原 wcs-app 搬迁的文件（共 48 个）**:

factory/ 基础架构: 21 个文件
- 核心接口: 5 个
- 协议适配器: 4 个
- 配置类: 3 个
- 处理器: 1 个
- 模型: 2 个
- 连接池: 6 个

厂商驱动: 27 个文件
- libiao/: 9 个
- hermes/: 3 个
- lanxin/: 3 个
- keyence/: 3 个
- optmv/: 3 个
- yongsun/: 6 个

---

## 验收标准

1. RCS Vendor API 能正常调用
2. RCS Mission API 能正常创建、取消、查询任务
3. 所有厂商驱动能正确调用对应设备 API
4. ClientCreateFactory 能根据配置创建正确的 Client
5. Command 命令能正确记录和状态流转
6. 回调能正确转发给 wcs-lite-app
7. 回调失败时能按间隔重试
8. 代码符合本项目规范，可读性良好

---

## 注意事项

- API 路径统一前缀 `/device/`
- 敏感配置（如 authConfig）返回时脱敏
- 回调处理遵循 WAL 原则：先记录日志再发送
- **[重要]** 搬迁代码时必须重构，不能直接复制
- 包路径从 com.item.wcs 改为 com.t5.device
- 使用本项目的 ErrorCode 体系
- 日志格式统一

---

最后更新：2025-12-24
