# WCS-1650 wcs-lite-app v1 版本后端开发——4-接入层 API 与运维功能

## 任务概述

- **Jira Issue**: WCS-1650
- **预估工时**: 5 人天（40 小时）
- **前置依赖**: WCS-1649（Flowable JavaDelegate 与回调机制）
- **后续任务**: WCS-1651

## 参考文档

- 需求文档: [requirements.md](../requirements.md)
  - 第 2 节「Job 管理需求」
  - 第 7 节「运维需求」
- 设计文档: [design.md](../design.md)
  - 第八章「API 设计」
  - 第九章「运维接口设计」- REST API 和 CLI 部分

---

## 任务清单

### 任务 4.1：Job API 实现（8h）

**目标**: 实现 Job 管理的完整 API

**交付物**:
- [ ] 创建 JobApplicationService
  ```java
  @Service
  @RequiredArgsConstructor
  public class JobApplicationService {
      
      private final JobRepository jobRepository;
      private final WorkflowService workflowService;
      
      /**
       * 创建 Job 并启动 Workflow
       * 
       * [重要] createJob 内部流程：
       * 1. 幂等性检查（根据 jobNo）
       * 2. 创建 Job 实体
       * 3. 保存 Job
       * 4. 调用 workflowService.startWorkflow(job) 启动流程
       * 5. 更新 Job.workflowInstanceId
       * 6. 返回 JobDto
       */
      public JobDto createJob(CreateJobCmd cmd);
      public JobDto getJob(String jobId);
      public PageResult<JobDto> queryJobs(JobQuery query);
      public void cancelJob(String jobId);
      public void retryJob(String jobId);
  }
  ```
- [ ] 创建 JobController
  ```java
  @RestController
  @RequestMapping("/wcs/jobs")
  public class JobController {
      @PostMapping
      public Result<JobDto> createJob(@RequestBody CreateJobCmd cmd);
      
      @GetMapping("/{jobId}")
      public Result<JobDto> getJob(@PathVariable String jobId);
      
      @GetMapping
      public Result<PageResult<JobDto>> queryJobs(JobQuery query);
      
      @PostMapping("/{jobId}/cancel")
      public Result<Void> cancelJob(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/retry")
      public Result<Void> retryJob(@PathVariable String jobId);
  }
  ```
- [ ] 创建 DTO 类
  - CreateJobCmd（jobNo, jobType, orderType, fromStation, toStation, containerId, priority, callbackUrl, payload）
  - JobDto（jobId, jobNo, jobType, status, priority, fromStation, toStation, startTime, endTime, errorMessage）
  - JobQuery（jobNo, jobType, status, startTimeFrom, startTimeTo, page, size）
- [ ] 创建 JobAssembler
- [ ] 编写 Job API 集成测试

**参考**: design.md 第 7.1 节「Job API」

---

### 任务 4.2：Task API 实现（4h）

**目标**: 实现 Task 查询和人工任务确认 API

**交付物**:
- [ ] 创建 TaskApplicationService
  ```java
  @Service
  @RequiredArgsConstructor
  public class TaskApplicationService {
      
      private final TaskRepository taskRepository;
      
      public List<TaskDto> queryTasks(TaskQuery query);
      public TaskDto getTask(String taskId);
      public List<TaskDto> getHumanTasks(HumanTaskQuery query);
      public void confirmHumanTask(String taskId, ConfirmHumanTaskCmd cmd);
  }
  ```
- [ ] 创建 TaskController
  ```java
  @RestController
  @RequestMapping("/wcs/tasks")
  @RequiredArgsConstructor
  public class TaskController {
      
      private final TaskApplicationService taskApplicationService;
      
      @GetMapping
      public Result<List<TaskDto>> queryTasks(TaskQuery query);
      
      @GetMapping("/{taskId}")
      public Result<TaskDto> getTask(@PathVariable String taskId);
      
      @GetMapping("/human-tasks")
      public Result<List<TaskDto>> getHumanTasks(HumanTaskQuery query);
      
      @PostMapping("/{taskId}/confirm")
      public Result<Void> confirmHumanTask(
          @PathVariable String taskId, 
          @RequestBody ConfirmHumanTaskCmd cmd);
  }
  ```
- [ ] 创建 DTO 类
  - TaskDto（taskId, jobId, taskType, status, sequence, deviceId, deviceType, vendorCode, externalTaskId, fromStation, toStation, containerId, dispatchTime, startTime, endTime, errorMessage, retryCount）
  - TaskQuery（jobId, status, taskType）
  - HumanTaskQuery（stationCode, status）
  - ConfirmHumanTaskCmd（confirmed, operatorId, remark）
- [ ] 创建 TaskAssembler
- [ ] 编写 Task API 集成测试

**参考**: 与前端 taskApi.ts 保持一致

---

### 任务 4.3：运维 REST API（8h）

**目标**: 实现运维管理 REST API

**交付物**:
- [ ] 创建 OpsJobController
  ```java
  @RestController
  @RequestMapping("/wcs/ops/jobs")
  public class OpsJobController {
      @GetMapping
      public Result<PageResult<JobDto>> listJobs(OpsJobQuery query);
      
      @GetMapping("/{jobId}")
      public Result<JobDetailDto> getJobDetail(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/cancel")
      public Result<Void> cancelJob(@PathVariable String jobId, @RequestBody(required = false) CancelJobCmd cmd);
      
      @PostMapping("/{jobId}/retry")
      public Result<Void> retryJob(@PathVariable String jobId);
      
      @PostMapping("/batch-cancel")
      public Result<BatchOperationResult> batchCancelJobs(@RequestBody BatchJobCmd cmd);
      
      @PostMapping("/batch-retry")
      public Result<BatchOperationResult> batchRetryJobs(@RequestBody BatchJobCmd cmd);
      
      @GetMapping("/statistics")
      public Result<JobStatisticsDto> getJobStatistics(StatisticsQuery query);
  }
  ```
- [ ] 创建 WorkflowApplicationService（供 OpsWorkflowController 使用）
  ```java
  @Service
  @RequiredArgsConstructor
  public class WorkflowApplicationService {
      public WorkflowStatusDto getWorkflowByJobId(String jobId);
      public void pauseWorkflow(String jobId);
      public void resumeWorkflow(String jobId);
      public void retryCurrentNode(String jobId);
      public void skipCurrentNode(String jobId);
  }
  ```
- [ ] 创建 OpsWorkflowController
  ```java
  @RestController
  @RequestMapping("/wcs/ops/workflows")
  public class OpsWorkflowController {
      @GetMapping("/{jobId}")
      public Result<WorkflowStatusDto> getWorkflowStatus(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/pause")
      public Result<Void> pauseWorkflow(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/resume")
      public Result<Void> resumeWorkflow(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/retry")
      public Result<Void> retryCurrentNode(@PathVariable String jobId);
      
      @PostMapping("/{jobId}/skip")
      public Result<Void> skipCurrentNode(@PathVariable String jobId);
  }
  ```
- [ ] 创建运维相关 DTO
  - OpsJobQuery（扩展 JobQuery，增加更多过滤条件）
  - JobDetailDto（包含 Job + Tasks + WorkflowInstance 完整信息）
  - BatchJobCmd（jobIds）
  - BatchOperationResult（successCount, failedCount, failedItems）
  - JobStatisticsDto（totalCount, pendingCount, inProgressCount, completedCount, failedCount）
  - WorkflowStatusDto（instanceId, jobId, status, currentNode, nodes）
  - NodeExecutionDto（nodeId, nodeName, nodeType, status, startTime, endTime, taskId, errorMessage）
- [ ] 编写运维 API 集成测试

**参考**: design.md 第 2.3.1 节「Workflow API（运维）」

**说明**: V1 版本 Workflow API 统一使用 jobId 作为参数，与前端 workflowApi.ts 保持一致。

---

### 任务 4.3.1：统计 API（2h）

**目标**: 实现 Dashboard 所需的统计 API

**交付物**:
- [ ] 创建 StatisticsController
  ```java
  @RestController
  @RequestMapping("/wcs/stats")
  public class StatisticsController {
      @GetMapping("/jobs/summary")
      public Result<JobStatisticsDto> getJobStatistics();
      
      @GetMapping("/jobs/trend")
      public Result<List<JobTrendDto>> getJobTrend(
          @RequestParam String startDate,
          @RequestParam String endDate);
  }
  ```
- [ ] 创建 StatisticsApplicationService
- [ ] 创建 DTO 类
  - JobStatisticsDto（total, pending, inProgress, completed, failed, cancelled）
  - JobTrendDto（hour, count）
- [ ] 编写统计 API 单元测试

**说明**: 此 API 供前端 Dashboard 页面调用，路径为 /wcs/statistics/jobs/summary。

---

### 任务 4.4.1：ErrorCode 错误码体系（2h）

**目标**: 建立统一的错误码体系，从原wcs-app迁移400+错误码

**交付物**:

**WcsErrorCode 错误码枚举（5001-5999）**:
- [ ] Job相关（5001-5100）
  - JOB_NOT_FOUND(5001, "Job不存在")
  - JOB_STATUS_INVALID(5002, "Job状态不允许此操作")
  - JOB_ALREADY_EXISTS(5003, "Job已存在")
  - JOB_CANCEL_FAILED(5004, "Job取消失败")
  - JOB_RETRY_FAILED(5005, "Job重试失败")
- [ ] Task相关（5101-5200）
  - TASK_NOT_FOUND(5101, "Task不存在")
  - TASK_STATUS_INVALID(5102, "Task状态不允许此操作")
  - TASK_DISPATCH_FAILED(5103, "Task下发失败")
  - TASK_TIMEOUT(5104, "Task执行超时")
- [ ] Step相关（5201-5300）
- [ ] Command相关（5301-5400）
- [ ] Workflow相关（5401-5500）
- [ ] Container相关（5501-5600）
- [ ] Strategy相关（5601-5700）

**FacilityErrorCode 错误码枚举（6001-6999）**:
- [ ] Point相关（6001-6100）
- [ ] Map相关（6101-6200）
- [ ] Station相关（6201-6300）
- [ ] Zone相关（6301-6400）

**DeviceErrorCode 错误码枚举（7001-7999）**:
- [ ] Robot相关（7001-7100）
- [ ] RCS相关（7101-7200）
- [ ] TrafficLight相关（7201-7300）
- [ ] Driver相关（7301-7400）
  - DRIVER_CONNECTION_FAILED(7301, "设备连接失败")
  - DRIVER_TIMEOUT(7302, "设备响应超时")
  - DRIVER_INVALID_RESPONSE(7303, "设备响应无效")

**参考**: design.md 第56节枚举对比检查

---

### 任务 4.4.2：WebSocket 消息推送（3h）

**目标**: 实现实时消息推送，从原wcs-app迁移完整的WebSocket模块

**交付物**:

**WebSocket配置（接收端）**:
- [ ] WebSocketConfig - WebSocket配置类
- [ ] WebSocketHandler - 消息处理器
- [ ] WebSocketSessionManager - 会话管理

**WebSocket发送端（从原wcs-app迁移）**:
- [ ] WCSWebSocketMessagePublisher - 消息发布器
  - 依赖：WebSocketClient、ApplicationEventPublisher、WmsTenantFieldProvider、AfterCompletionExecutor
  - sendMessageToEquipment(topic, target, payload) - 发送到设备
  - sendMessageToStation(topic, target, payload) - 发送到工位
  - sendMessageToLocation(topic, target, payload) - 发送到位置
  - sendMessageToEquipmentAfterTransactionCommit() - 事务提交后发送到设备
  - sendMessageToStationAfterTransactionCommit() - 事务提交后发送到工位
  - asyncSendMessageToEquipmentAfterTransactionCommit() - 异步事务提交后发送到设备
  - asyncSendMessageToStationAfterTransactionCommit() - 异步事务提交后发送到工位
  - asyncSendMessageToLocationAfterTransactionCommit() - 异步事务提交后发送到位置
  - sendMessage(Object) - 发布Spring事件
- [ ] MessageContent - 消息内容模型
  - 字段：companyId、facilityId、equipmentCode、stationCode、locationName、topic、payload
- [ ] WebSocketClient - WebSocket客户端
  - send(topicName, message) - 发送消息

**消息类型常量 WebSocketConstant（10种）**:
- [ ] EQUIPMENT_DATA_CHANGE - 设备数据变更
- [ ] TASK_STATUS_CHANGE - 任务状态变更
- [ ] BARCODE_READ_RESULT - 条码读取结果
- [ ] CONTAINER_ARRIVE - 容器到达
- [ ] LOCATION_CHANGE - 位置变更
- [ ] EQUIPMENT_DEPARTURE - 设备离开
- [ ] EQUIPMENT_EXCEPTION_NOTIFICATION - 设备异常通知
- [ ] EQUIPMENT_EXCEPTION_RECOVERY - 设备异常恢复
- [ ] SYSTEM_STATUS_CHANGE - 系统状态变更
- [ ] STATION_TAKEN_OVER - 工位接管

**消息格式**:
```java
@Data
public class WcsWebSocketMessage {
    private String messageType;     // 消息类型
    private String entityId;        // 实体ID（jobId/taskId/robotId等）
    private String entityType;      // 实体类型
    private Object payload;         // 消息内容
    private LocalDateTime timestamp; // 时间戳
}
```

**包路径**: com.t5.wcs.infrastructure.websocket

**参考**: design.md 第68节 WebSocket分析

---

### 任务 4.4.3：Redis 缓存机制（3h）

**目标**: 实现Redis缓存，从原wcs-app迁移13种缓存Key设计

**交付物**:

**缓存Key设计（13种）**:
- [ ] wcs:job:{jobId} - Job缓存
- [ ] wcs:task:{taskId} - Task缓存
- [ ] wcs:robot:{robotId} - 机器人状态缓存
- [ ] wcs:robot:position:{robotId} - 机器人位置缓存
- [ ] wcs:station:{stationCode} - 工作站缓存
- [ ] wcs:point:{pointCode} - 点位缓存
- [ ] wcs:strategy:{strategyType} - 策略缓存
- [ ] wcs:lock:job:{jobId} - Job分布式锁
- [ ] wcs:lock:task:{taskId} - Task分布式锁
- [ ] wcs:lock:robot:{robotId} - 机器人分布式锁
- [ ] wcs:lock:scheduler:{schedulerName} - 定时任务锁
- [ ] wcs:counter:job:daily - 每日Job计数器
- [ ] wcs:queue:callback - 回调队列

**缓存服务**:
- [ ] WcsCacheManager - WCS缓存管理器
- [ ] WcsCacheKeyGenerator - 缓存Key生成器
- [ ] WcsDistributedLock - 分布式锁服务

**缓存策略**:
- Job/Task缓存：TTL 1小时，状态变更时更新
- Robot状态缓存：TTL 30秒，心跳时更新
- 策略缓存：TTL 5分钟，配置变更时清除
- 分布式锁：TTL 30秒，支持续期

**参考**: design.md 第68节 Redis缓存分析

---

### 任务 4.4.4：常量类定义（2h）

**目标**: 定义WCS系统常量，从原wcs-app迁移完整的常量体系

**交付物**:

**Constant.java 通用常量**:
- [ ] 基础常量：ZERO、EMPTY、JSON_EMPTY、UNKNOWN
- [ ] RCS/OPS常量：RCS、OPS
- [ ] 执行函数常量：EXECUTION_FUNCTION_BEFORE、EXECUTION_FUNCTION_AFTER
- [ ] 消息处理前缀：MESSAGE_PROCESS_PREFIX
- [ ] 租户属性常量：TENANT_PROPERTY_GROUP、TENANT_ID_KEY、FACILITY_ID_KEY
- [ ] 系统配置常量：SYSTEM_CONFIG_PROPERTY_GROUP、SYSTEM_PICKING_WALL_DEPART_PROPERTY_NAME_KEY
- [ ] 请求方法常量：GET_ROBOTS、SAY_HELLO、CANCEL_TASK等
- [ ] 内部类 Sequence：TASK_ID、JOB_ID、STEP_ID、COMMAND_ID
- [ ] 内部类 Prefix：TASK_ID、JOB_ID、STEP_ID、COMMAND_ID、WCS_ID
- [ ] 内部类 ContainerReplenishment：SLOT_LIST、EQUIPMENT_CONTAINER_INFO、TOTE_RACK_SPEC
- [ ] 内部类 GroupLocation：buildLocationKey()、buildGroupKey()、isPointLocation()、getPointCode()、extractPointCode()
- [ ] 内部类 NotificationEntityTypes：WCS_EQUIPMENT_EXCEPTION、WCS_TASK_EXCEPTION

**RedisConstant.java Redis键常量（16个内部类）**:
- [ ] EQUIPMENT_INFO - 设备信息（20+方法）
  - getKey()、getPositionKey()、getPointCodeKey()、getElectricityKey()
  - getCheckStateKey()、getHasInProgressCmdKey()、getLastStayKey()
  - getStatusKey()、getCommandIdKey()、getContainerCodesKey()
  - getExceptionMessageKey()、getLastUpdateTimeKey()
- [ ] STATION - 工位相关
  - getRunningStatusKeyByCode()、getCurrentEquipmentCodeKey()
  - getActiveCapabilityKeyByCode()、getSystemStopStatusKeyByCode()、getExitLockKey()
- [ ] SYSTEM - 系统相关：getStatusKey()
- [ ] JOB - Job相关
  - getCoordinationLockKey()、getCancelLockKey()
  - 常量：COORDINATION_LOCK_EXPIRE_SECONDS(10L)、CANCEL_LOCK_EXPIRE_SECONDS(120L)
- [ ] TASK - Task相关
  - getCoordinationLockKey()、getCancelledKey()
  - 常量：COORDINATION_LOCK_EXPIRE_SECONDS(10L)、CANCELLED_EXPIRE_HOURS(24L)
- [ ] RESOURCE_LOCK - 资源锁：getKey(mapCode, stationCode)
- [ ] COMMAND - 命令相关
  - getFinishedStatusKey()、getEquipmentCodeKey()、getContainerCodeKey()
  - 常量：FINISHED_STATUS_EXPIRE_SECONDS(300L)、DELAYED_RELEASE_MILLIS(1000L)
- [ ] EQUIPMENT_STATISTICS - 设备统计：getKey()
- [ ] EQUIPMENT_MODELS - 设备型号：getKey()
- [ ] EquipmentWarehouseData - 仓库设备数据常量
- [ ] EQUIPMENT_WAREHOUSE_MONITOR - 仓库监控：getKey()
- [ ] CONTAINER - 容器相关
  - getNextLocationNameKey()、getNextLocationTypeKey()、getConsolidationCompleteTriggeredKey()
- [ ] AIR_ROB_ZONE - 飞箱区域：getZoneContainerSetKey()
- [ ] COMMAND_SEND - 命令发送锁：getSendLockKey()
- [ ] SCHEDULER - 定时器调度：getNextExecutionKey()、getCronHashKey()
- [ ] LOCATION_ALLOCATION - 位置分配：getAllocatedLocationKey()

**WebSocketConstant.java WebSocket消息类型常量**:
- 已在任务4.4.2中定义

**包路径**: com.t5.wcs.domain.common.constant

---

### 任务 4.4：CLI 引擎核心（8h）

**目标**: 实现 CLI 引擎核心框架

**交付物**:
- [ ] 创建 CliController（REST 端点）
  ```java
  @RestController
  @RequestMapping("/wcs/cli")
  @RequiredArgsConstructor
  public class CliController {
      
      private final CliEngine cliEngine;
      
      @PostMapping("/execute")
      public Result<CliResponse> execute(@RequestBody CliRequest request);
      
      @GetMapping("/help")
      public Result<String> help(@RequestParam(required = false) String command);
      
      @GetMapping("/suggest")
      public Result<List<String>> suggest(@RequestParam String input);
  }
  ```
- [ ] 创建 CliEngine 核心引擎
  ```java
  @Component
  public class CliEngine {
      private final Map<String, CommandHandler> handlers;
      
      public CliResponse execute(CliRequest request);
      public String getHelp(String command);
      public List<String> suggest(String input);
      public void registerHandler(String command, CommandHandler handler);
      public List<String> getAvailableCommands();
  }
  ```
- [ ] 创建 CliRequest/CliResponse 模型
  ```java
  @Data
  public class CliRequest {
      private String sessionId;
      private String command;      // 完整命令行
      private String mainCommand;  // 主命令（job, workflow, task, system, help）
      private String subCommand;   // 子命令（list, get, cancel, retry）
      private Map<String, String> options;  // 选项（--status, --limit）
      private List<String> args;   // 位置参数
  }
  
  @Data
  public class CliResponse {
      private boolean success;
      private String output;       // 文本输出
      private Object data;         // 结构化数据（可选）
      private String errorMessage;
  }
  ```
- [ ] 创建 CommandHandler 接口
  ```java
  public interface CommandHandler {
      String getCommand();
      String getDescription();
      String getUsage();
      CliResponse handle(CliRequest request);
  }
  ```
- [ ] 实现 HelpCommandHandler
- [ ] 实现 SystemCommandHandler（system status, system info）
- [ ] 创建命令解析工具类 CommandParser
- [ ] 编写 CLI 引擎单元测试

**参考**: design.md 第 9.4-9.5 节「CLI 引擎设计」

---

### 任务 4.5：定时任务调度器（原wcs-app完整迁移）（6h）

**目标**: 实现定时任务调度器，从原wcs-app迁移完整的调度机制

**定时任务调度器（10个类，15个@Scheduled方法）**:

**1. EquipmentDataSyncScheduler - 设备数据同步**:
- [ ] syncRcsEquipmentData()
  - 执行间隔：60秒
  - 初始延迟：30秒
  - 职责：同步RCS设备状态数据

**2. MessageScheduler - 消息调度**:
- [ ] executeMessage()
  - 执行间隔：6秒
  - 初始延迟：22秒
  - 职责：处理消息队列

**3. EquipmentDispatchScheduler - 设备调度**:
- [ ] processEquipmentDispatch()
  - 执行间隔：6秒
  - 初始延迟：31秒
  - 职责：设备任务调度

**4. LocationSyncScheduler - 位置同步**:
- [ ] syncLocation()
  - 执行时间：每天3点（cron: 0 0 3 * * ?）
  - 职责：同步位置数据
- [ ] syncLocationDeviceStatus()
  - 执行间隔：30秒
  - 初始延迟：30秒
  - 职责：同步位置设备状态

**5. OpsScheduler - OPS调度**:
- [ ] sayHello()
  - 执行间隔：60秒
  - 初始延迟：30秒
  - 职责：OPS系统心跳

**6. EquipmentDecisionScheduler - 设备决策**:
- [ ] checkEquipmentState()
  - 执行间隔：2秒
  - 初始延迟：20秒
  - 职责：检查设备状态
- [ ] doEquipmentBehaviorDecision()
  - 执行间隔：6秒
  - 初始延迟：21秒
  - 职责：设备行为决策

**7. TaskDispatchScheduler - 任务调度（5个方法）**:
- [ ] taskGenerateFromAction()
  - 执行间隔：6秒
  - 初始延迟：23秒
  - 职责：从Action生成Task
- [ ] initializeTask()
  - 执行间隔：6秒
  - 初始延迟：24秒
  - 职责：初始化Task
- [ ] taskExecutionDecision()
  - 执行间隔：6秒
  - 初始延迟：26秒
  - 职责：任务执行决策
- [ ] wallPickToAgvTaskExecutionDecision()
  - 执行间隔：5秒
  - 初始延迟：27秒
  - 职责：拣选墙到AGV任务决策
- [ ] pickingWallReplenishmentDecision()
  - 执行间隔：5秒
  - 初始延迟：30秒
  - 职责：拣选墙补货决策

**8. CommandScheduler - 命令调度**:
- [ ] executeMessage()
  - 执行间隔：6秒
  - 初始延迟：30秒
  - 职责：执行命令消息
- [ ] gatherCommand()
  - 执行间隔：1秒
  - 初始延迟：30秒
  - 职责：收集命令

**9. NotificationTaskRetryScheduleService - 通知重试**:
- [ ] retryFailedNotificationTasks()
  - 执行时间：每2分钟（cron: 0 0/2 * * * ?）
  - 职责：重试失败的通知任务

**10. EquipmentWarehouseDataApplicationService - 仓库数据**:
- [ ] prewarmEquipmentWarehouseCache()
  - 执行间隔：5分钟（300秒）
  - 职责：预热设备仓库缓存

**调度器通用配置**:
- [ ] @SchedulerLock 分布式锁注解
- [ ] 初始延迟错开，避免启动时并发
- [ ] 异常处理和日志记录

**包路径**: com.t5.wcs.infrastructure.scheduler

**参考**: design.md 第68节 定时任务分析

---

### 任务 4.6：日志管理模块（原wcs-app完整迁移）（4h）

**目标**: 实现日志管理功能，从原wcs-app迁移完整的日志模块

**交付物**:

**ApiLogApplicationService - API日志服务**:
- [ ] create(ApiLogCmd) - 创建API日志
- [ ] update(Long id, ApiLogCmd) - 更新API日志
- [ ] get(Long id) - 获取API日志
- [ ] delete(Long id) - 删除API日志
- [ ] search(ApiLogQuery) - 查询API日志
- [ ] searchByPaging(ApiLogQuery) - 分页查询API日志

**DBChangeLogApplicationService - 数据库变更日志服务**:
- [ ] create(DBChangeLogCmd) - 创建数据库变更日志
- [ ] update(Long id, DBChangeLogCmd) - 更新数据库变更日志
- [ ] get(Long id) - 获取数据库变更日志
- [ ] delete(Long id) - 删除数据库变更日志
- [ ] search(DBChangeLogQuery) - 查询数据库变更日志
- [ ] searchByPaging(DBChangeLogQuery) - 分页查询数据库变更日志

**EquipmentDispatchLogApplicationService - 设备调度日志服务**:
- [ ] create(EquipmentDispatchLogCmd) - 创建设备调度日志
- [ ] update(Long id, EquipmentDispatchLogCmd) - 更新设备调度日志
- [ ] get(Long id) - 获取设备调度日志
- [ ] delete(Long id) - 删除设备调度日志
- [ ] search(EquipmentDispatchLogQuery) - 查询设备调度日志
- [ ] searchByPaging(EquipmentDispatchLogQuery) - 分页查询设备调度日志

**包路径**: com.t5.wcs.application.log.service

---

### 任务 4.7：维护工具模块（原wcs-app完整迁移）（8h）

**目标**: 实现WCS系统维护工具，从原wcs-app迁移完整的维护功能

**交付物**:

**MaintenanceToolsApplicationService - 维护工具服务（11个公开方法）**:
- [ ] releaseEquipment(String equipmentCode) - 设备释放
  - 生成设备释放命令并立即执行
  - 清除工位的当前设备编码
- [ ] equipmentArrivalTrigger(String equipmentCode, String stationCode) - 设备到达触发
  - 获取进行中任务，判断搬运命令完成状态
  - 自动生成业务命令（拣选、盘点等）
- [ ] cancelTask(String taskId) - 取消任务
  - 取消指定任务及相关步骤和命令
  - 通知WES
- [ ] resendCommand(String cmdId) - 重发命令
  - 重新发送指定命令到设备
  - 无状态控制，所有命令可直接重发
- [ ] forceCompleteCommand(String cmdId) - 强制完成命令
  - 将命令变更为完成状态
  - 更新容器位置并触发下一步操作
- [ ] createContainerOutbound(String containerCode, String stationCode) - 容器出库
  - 查询容器库存
  - 生成容器出库任务
- [ ] forceContainerDepart(ContainerDepartCmd cmd) - 强制料箱离站
  - 用于异常情况下小车带着料箱无法离开工作站的处理
  - 向WES请求下个位置
  - 执行料箱返库
- [ ] getToteLocation(String toteId) - 获取容器位置
  - 调用RCS接口查询容器位置信息
- [ ] queryLocation(String locationName) - 查询位置信息
  - 调用RCS接口查询位置详情
- [ ] getToteErrorInfo(String toteId) - 获取容器异常信息
  - 调用RCS接口查询容器异常
- [ ] getTaskErrorInfo(String taskId) - 获取任务异常信息
  - 调用RCS接口查询任务异常

**依赖服务**:
- StationApplicationService、TaskApplicationService、CommandApplicationService
- MessageInfoApplicationService、StationService、JobService
- CommandService、TaskService、ContainerService、EquipmentService
- ClientCreateFactory（用于创建RCS客户端）

**包路径**: com.t5.wcs.application.maintenance.service

---

### 任务 4.8：数据字典模块（原wcs-app完整迁移）（2h）

**目标**: 实现数据字典管理功能

**交付物**:

**DataDictionaryApplicationService - 数据字典服务**:
- [ ] create(DataDictionaryCreateCmd) - 创建数据字典
- [ ] update(Long id, DataDictionaryUpdateCmd) - 更新数据字典
- [ ] get(Long id) - 获取数据字典
- [ ] delete(Long id) - 删除数据字典
- [ ] search(DataDictionaryQuery) - 查询数据字典
- [ ] searchByPaging(DataDictionaryQuery) - 分页查询数据字典
- [ ] searchByParentDataCode(String parentDataCode, DataDictionaryQuery) - 按父级编码查询

**包路径**: com.t5.wcs.application.datadictionary.service

---

### 任务 4.9：数据同步状态模块（原wcs-app完整迁移）（2h）

**目标**: 实现数据同步状态管理功能

**交付物**:

**DataSyncStateApplicationService - 数据同步状态服务**:
- [ ] create(DataSyncStateCmd) - 创建数据同步状态
- [ ] update(Long id, DataSyncStateCmd) - 更新数据同步状态
- [ ] get(Long id) - 获取数据同步状态
- [ ] delete(Long id) - 删除数据同步状态
- [ ] search(DataSyncStateQuery) - 查询数据同步状态
- [ ] searchByPaging(DataSyncStateQuery) - 分页查询数据同步状态
- [ ] getByEntityType(String entityType) - 按实体类型获取同步状态

**包路径**: com.t5.wcs.application.datasyncstate.service

---

### 任务 4.10：缓存管理模块（原wcs-app完整迁移）（2h）

**目标**: 实现缓存管理功能

**交付物**:

**CacheApplicationService - 缓存管理服务**:
- [ ] clearCache(String cacheKey) - 清除指定缓存
- [ ] clearAllCache() - 清除所有缓存
- [ ] getCacheStats() - 获取缓存统计信息
- [ ] refreshCache(String cacheType) - 刷新指定类型缓存

**包路径**: com.t5.wcs.application.common.service

---

### 任务 4.11：ContainerApplicationService（容器应用服务）（6h）

**目标**: 实现容器管理应用服务，从原wcs-app迁移完整的容器管理功能

> **[原wcs-app参考]** ContainerApplicationService.java（2226行，41+方法）
> **[职责]** 容器CRUD、位置管理、事件处理、合箱/拆箱、库存查询

**ContainerApplicationService方法列表（41个公开方法）**:

**基础CRUD方法（7个）**:
- [ ] create(ContainerCreateCmd) - 创建容器
- [ ] update(Long id, ContainerUpdateCmd) - 更新容器
- [ ] get(Long id) - 获取容器
- [ ] delete(Long id) - 删除容器
- [ ] search(ContainerQuery) - 搜索容器
- [ ] searchByPaging(ContainerQuery) - 分页搜索
- [ ] batchCreate(BatchContainerCreateCmd) - 批量创建容器

**容器验证方法（3个）**:
- [ ] validateContainer(ContainerValidateCmd) - 验证容器（完整验证）
- [ ] validateBaseContainer(ContainerValidateCmd) - 基础验证（不检查位置）
- [ ] validateContainerForRelease(String containerCode) - 释放前验证

**容器位置管理方法（6个）**:
- [ ] positionReset(PositionResetCmd) - 位置重置
- [ ] transportContainer(ContainerTransportCmd) - 容器搬运（创建Task和Job）
- [ ] clearAndReturnToInventory(ContainerTransportCmd) - 清除并返库
- [ ] putAwayContainer(ContainerPutAwayCmd) - 容器上架
- [ ] retrievalContainer(ContainerRetrievalCmd) - 容器取出
- [ ] updateStatus(ContainerPutAwayCmd) - 更新状态（关闭Step/Task）

**容器事件处理方法（6个）**:
- [ ] processContainerReturnToInventory(String taskId) - 处理容器返库（Task完成时）
- [ ] processContainerReturnMessage(String containerCode, Task task) - 处理返库消息
- [ ] processContainerTakenEvent(String commandId, String containerCode, String equipmentCode) - 处理容器取走事件
- [ ] processContainerPutEvent(String commandId, String containerCode, String equipmentCode, String location) - 处理容器放置事件
- [ ] processContainerStatusChange(String commandId, String containerCode, String eventType, String equipmentCode, String location) - 处理容器状态变更
- [ ] processPlacedOnEvent(String commandId, String equipmentCode, String location) - 处理放置事件

**设备绑定相关方法（3个）**:
- [ ] handleContainerBindToEquipment(String equipmentCode, Container container) - 处理容器绑定到设备
- [ ] handleContainerArriveAtStation(Container container, String stationCode, String equipmentCode) - 处理容器到达工位
- [ ] handleContainerPreDepartureProcessing(String containerCode, String stationCode) - 处理容器离站前处理（异步）

**容器检查方法（2个）**:
- [ ] overflowCheck(ContainerOverflowCheckCmd) - 溢出检查（调用视觉相机）
- [ ] updateContainerFillRate(ContainerFillRateUpdateCmd) - 更新容器容积率

**合箱/拆箱相关方法（6个）**:
- [ ] consolidateContainer(ContainerConsolidationCmd) - 合箱容器（创建或重置容器到工位）
- [ ] mergeInInventory(ContainerMergeInCmd) - 合入库存（从源箱转移到目标箱）
- [ ] mergeReturnInventory(ContainerMergeReturnCmd) - 退回库存（从目标箱退回源箱）
- [ ] completeConsolidation(ConsolidationCompleteCmd) - 完成合箱（标记容器为FULL）
- [ ] updateContainerDataExt(List<Job> jobList) - 更新容器扩展数据
- [ ] validateAndResetContainerLocations(Map<String, String> containerLocationMap) - 验证并重置容器位置

**位置搜索方法（3个）**:
- [ ] locationSearch(String containerCode, boolean notifyWes) - 位置搜索（单个）
- [ ] locationSearch(List<String> containerCodes, boolean notifyWes) - 位置搜索（批量）
- [ ] searchInventoryByContainerCode(String containerCode) - 按容器编码搜索库存

**其他业务方法（5个）**:
- [ ] manualUnloadContainers(ContainerManualUnloadCmd) - 手动卸载容器
- [ ] dispatchToTarget(ContainerDispatchCmd, String containerCode, ActionType actionType) - 派发到目标（PACK/STAGE）
- [ ] returnToStorage(String stationCode, String containerCode) - 返回存储
- [ ] doQuickReturnCommand(String containerCode, Station station, List<String> taskIds, List<String> jobIds) - 执行快速返库命令
- [ ] requestNextLocationFromWES(String containerCode, Station station) - 向WES请求下个位置

**依赖服务**:
- ContainerService、ContainerSpecService、ContainerAssembler
- TaskService、StepService、JobService、CommandService
- StationService、MessageInfoService、MessageInfoApplicationService
- MapLocationService、MapMappingRelationService、MapService
- EquipmentRepository、EquipmentModelService
- ClientCreateFactory、LockUtil、WCSWebSocketMessagePublisher

**包路径**: com.t5.wcs.application.container.service

---

### 任务 4.12：StrategyConfigurationApplicationService（策略配置服务）（2h）

**目标**: 实现策略配置应用服务，从原wcs-app迁移完整的策略管理功能

> **[原wcs-app参考]** StrategyConfigurationApplicationService.java（280行，13方法）
> **[职责]** 策略配置CRUD、策略匹配查询

**StrategyConfigurationApplicationService方法列表（13个公开方法）**:

**基础CRUD方法（6个）**:
- [ ] create(StrategyConfigurationCmd) - 创建策略配置
- [ ] update(Long id, StrategyConfigurationCmd) - 更新策略配置
- [ ] get(Long id) - 获取策略配置
- [ ] delete(Long id) - 删除策略配置
- [ ] search(StrategyConfigurationQuery) - 搜索策略配置
- [ ] searchByPaging(StrategyConfigurationQuery) - 分页搜索

**策略获取方法（6个）**:
- [ ] getTaskCoordinationStrategyConfigByJobIds(List<String> jobIds) - 根据JobIds获取任务协调策略
- [ ] getTaskCoordinationStrategyConfig(ActionType, ActionMode) - 获取任务协调策略
- [ ] getTaskExecutionStrategyConfig(TaskType, TaskOperationMode) - 获取任务执行策略
- [ ] getChargingStrategyConfig(Equipment) - 获取充电策略
- [ ] getTaskAssignmentStrategyConfig(String mapCode) - 获取任务分配策略
- [ ] getWorkstationStrategy() - 获取工作站策略

**其他方法（1个）**:
- [ ] isAutoCaseToteInbound() - 是否自动整箱入库

**策略类型枚举 StrategyType**:
- TASK_COORDINATION_STRATEGY - 任务协调策略
- TASK_EXECUTION_STRATEGY - 任务执行策略
- CHARGING_STRATEGY - 充电策略
- TASK_ASSIGNMENT_STRATEGY - 任务分配策略
- WORKER_WORKSTATION_CONFIGURATION - 工作站配置

**策略匹配算法**:
- 使用字段优先级和权重计算
- 支持多字段组合匹配
- 支持默认策略回退

**依赖服务**:
- StrategyConfigurationService、StrategyConfigurationAssembler、JobService

**包路径**: com.t5.wcs.application.strategy.service

---

### 任务 4.13：ConfigurationLocalApplicationService（本地配置服务）（2h）

**目标**: 实现本地配置应用服务，从原wcs-app迁移完整的配置管理功能

> **[原wcs-app参考]** ConfigurationLocalApplicationService.java（100行，11方法）
> **[职责]** 本地配置CRUD、租户配置管理

**ConfigurationLocalApplicationService方法列表（11个公开方法）**:

**基础CRUD方法（5个）**:
- [ ] create(ConfigurationLocalCreateCmd) - 创建本地配置
- [ ] get(Long id) - 获取本地配置
- [ ] update(ConfigurationLocalUpdateCmd) - 更新本地配置
- [ ] delete(Long id) - 删除本地配置
- [ ] getAll() - 获取所有配置

**查询方法（2个）**:
- [ ] search(ConfigurationLocalQuery) - 搜索配置
- [ ] searchByPaging(ConfigurationLocalQuery) - 分页搜索

**租户配置方法（4个）**:
- [ ] onApplicationEvent() - 应用启动事件处理（加载租户配置）
- [ ] getTenantId() - 获取租户ID
- [ ] getFacilityId() - 获取设施ID
- [ ] refreshConfiguration() - 刷新配置

**配置属性组常量**:
- TENANT_PROPERTY_GROUP - 租户属性组
- TENANT_ID_KEY - 租户ID键
- FACILITY_ID_KEY - 设施ID键

**依赖服务**:
- ConfigurationLocalService、ConfigurationLocalAssembler

**包路径**: com.t5.wcs.application.configuration.service

---

### 任务 4.14：Command相关服务（原wcs-app完整迁移）（4h）

**目标**: 实现Command命令管理服务，从原wcs-app迁移完整的命令管理功能

> **[原wcs-app参考]** task目录下3个Command相关ApplicationService
> **[职责]** 命令CRUD、命令消息、命令状态变更记录

**CommandApplicationService - 命令应用服务（约300行，15个方法）**:

**基础CRUD方法（6个）**:
- [ ] create(CommandCmd) - 创建命令
- [ ] update(Long id, CommandCmd) - 更新命令
- [ ] get(Long id) - 获取命令
- [ ] delete(Long id) - 删除命令
- [ ] search(CommandQuery) - 搜索命令
- [ ] searchByPaging(CommandQuery) - 分页搜索

**业务方法（9个）**:
- [ ] close(String cmdId) - 关闭命令
- [ ] cancel(String cmdId) - 取消命令
- [ ] forceClose(String cmdId) - 强制关闭命令
- [ ] updateStepStatusWithCompletion(Command) - 更新Step状态
- [ ] searchInProgressCommandListByEquipmentCode(String) - 按设备查询进行中命令
- [ ] getCommandByTaskIdAndStatus(String, CmdStatus) - 按任务和状态查询
- [ ] createTransportCommand(Container, MapLocation, String) - 创建搬运命令
- [ ] createBusinessCommand(Task, Job, String) - 创建业务命令
- [ ] sendCommandToEquipment(Command) - 发送命令到设备

**CommandMessageApplicationService - 命令消息服务（约50行，6个方法）**:
- [ ] create(CommandMessageCmd) - 创建命令消息
- [ ] update(Long id, CommandMessageCmd) - 更新命令消息
- [ ] get(Long id) - 获取命令消息
- [ ] delete(Long id) - 删除命令消息
- [ ] search(CommandMessageQuery) - 搜索命令消息
- [ ] searchByPaging(CommandMessageQuery) - 分页搜索

**CommandStatusChangeApplicationService - 命令状态变更服务（约50行，6个方法）**:
- [ ] create(CommandStatusChangeCmd) - 创建状态变更记录
- [ ] update(Long id, CommandStatusChangeCmd) - 更新状态变更记录
- [ ] get(Long id) - 获取状态变更记录
- [ ] delete(Long id) - 删除状态变更记录
- [ ] search(CommandStatusChangeQuery) - 搜索状态变更记录
- [ ] searchByPaging(CommandStatusChangeQuery) - 分页搜索

**依赖服务**:
- CommandService、CommandAssembler
- StepService、TaskService、JobService
- EquipmentService、ContainerService
- MessageInfoApplicationService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.15：Step服务（原wcs-app完整迁移）（2h）

**目标**: 实现Step步骤管理服务，从原wcs-app迁移完整的步骤管理功能

> **[原wcs-app参考]** StepApplicationService.java（约130行，12个方法）
> **[职责]** Step CRUD、步骤状态管理、与Task/Job关联

**StepApplicationService方法列表（12个公开方法）**:

**基础CRUD方法（6个）**:
- [ ] create(StepCmd) - 创建Step
- [ ] update(Long id, StepCmd) - 更新Step
- [ ] get(Long id) - 获取Step
- [ ] delete(Long id) - 删除Step
- [ ] search(StepQuery) - 搜索Step
- [ ] searchByPaging(StepQuery) - 分页搜索

**业务方法（6个）**:
- [ ] findStepListByTaskId(String taskId) - 按任务ID查询Step列表
- [ ] forceClosedStep(String stepId) - 强制关闭Step
- [ ] cancelStepByTaskId(String taskId) - 按任务ID取消Step
- [ ] createStepFromTask(Task task) - 从Task创建Step
- [ ] synchronizeStepJobIdsWithTaskJobs(String taskId) - 同步Step的JobIds与Task的Jobs
- [ ] forceClosedStepByTaskIds(List<String> taskIds) - 批量强制关闭Step

**依赖服务**:
- StepService、StepAssembler、JobService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.16：Job历史服务（原wcs-app完整迁移）（3h）

**目标**: 实现Job历史记录服务，从原wcs-app迁移完整的历史追踪功能

> **[原wcs-app参考]** JobHistoryApplicationService.java（约500行，15+方法）
> **[职责]** Job历史记录CRUD、分配/提交/取消历史追踪

**JobHistoryApplicationService方法列表（15个公开方法）**:

**基础CRUD方法（6个）**:
- [ ] create(JobHistoryCmd) - 创建Job历史
- [ ] update(Long id, JobHistoryCmd) - 更新Job历史
- [ ] get(Long id) - 获取Job历史
- [ ] delete(Long id) - 删除Job历史
- [ ] search(JobHistoryQuery) - 搜索Job历史
- [ ] searchByPaging(JobHistoryQuery) - 分页搜索

**历史记录创建方法（9个）**:
- [ ] createAssignJobHistory(String jobId) - 创建分配历史
- [ ] createSubmitJobHistory(String jobId, Double completedQty) - 创建提交历史（单个）
- [ ] createSubmitJobHistory(String jobId, Double completedQty, String userId) - 创建提交历史（带用户）
- [ ] createSubmitJobHistory(Job job, Double completedQty) - 创建提交历史（Job对象）
- [ ] createCancelledJobHistory(String jobId) - 创建取消历史
- [ ] createBatchCancelledJobHistory(List<String> jobIds) - 批量创建取消历史
- [ ] createBatchAssignJobHistory(List<String> jobIds) - 批量创建分配历史
- [ ] creatConsolidateJobHistory(String jobId, Double qty) - 创建合箱历史
- [ ] createForceClosedJobHistory(String jobId) - 创建强制关闭历史

**依赖服务**:
- JobHistoryService、JobHistoryAssembler、JobService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.17：TaskAction相关服务（原wcs-app完整迁移）（6h）

**目标**: 实现TaskAction任务动作服务，从原wcs-app迁移WMS-WCS交互核心接口

> **[原wcs-app参考]** TaskActionApplicationService.java（约985行，20+方法）
> **[职责]** WMS-WCS交互核心接口、任务动作分配/提交/批量处理

**TaskActionApplicationService方法列表（20+个方法）**:

**查询方法（2个）**:
- [ ] search(TaskActionQuery) - 搜索TaskAction
- [ ] searchByPaging(TaskActionQuery) - 分页搜索

**核心业务方法（6个）**:
- [ ] assign(TaskActionAssignCmd) - 分配任务动作，返回TaskActionCommandResponse
- [ ] batchV2(TaskActionBatchCmd) - 批量处理（创建/更新/取消）
- [ ] submitV2(String cmdId, TaskActionSubmitCmd) - 提交任务动作结果
- [ ] processSubmitResponse(Command, Job, WmsTaskActionSubmitResponse, Boolean) - 处理提交响应（事务方法）
- [ ] checkAndUpdateTaskStatus(String cmdId) - 检查并更新任务状态
- [ ] checkAndUpdateTaskStatus(String cmdId, Boolean skipContainerReturn) - 检查并更新任务状态（支持跳过返库）

**内部处理方法（8个）**:
- [ ] handleCreateOperationV2(TaskActionOperation) - 处理创建操作
- [ ] handleUpdateOperationV2(TaskActionOperation, Set<String>) - 处理更新操作
- [ ] handleCancelOperationV2(TaskActionCancelOperation, Set<String>) - 处理取消操作
- [ ] checkAndAssignInterLeavingTasks(Job) - 检查并分配可穿插任务
- [ ] getCandidateJobsForInterleaving(Job) - 获取穿插候选任务
- [ ] checkAndCloseWcsTaskByWmsTaskId(String businessId) - 检查并关闭WCS任务
- [ ] mapActionTypeToCmdType(ActionType) - ActionType映射到CmdType
- [ ] handlePickingWallPickContainerDeparture(String, Job, Command) - 处理拣选墙容器离开

**TaskActionGroupApplicationService - 任务动作组服务（约50行，6个方法）**:
- [ ] create(TaskActionGroupCmd) - 创建TaskActionGroup
- [ ] update(Long id, TaskActionGroupCmd) - 更新TaskActionGroup
- [ ] get(Long id) - 获取TaskActionGroup
- [ ] delete(Long id) - 删除TaskActionGroup
- [ ] search(TaskActionGroupQuery) - 搜索TaskActionGroup
- [ ] searchByPaging(TaskActionGroupQuery) - 分页搜索

**依赖服务**:
- TaskActionGroupService、TaskActionAssembler、TaskActionGroupAssembler
- JobService、TaskService、CommandService、StepApplicationService
- JobHistoryApplicationService、MessageInfoApplicationService
- JobHistoryTrackerService、ContainerService、StationService
- ContainerApplicationService、MapLocationService
- PickingWallReplenishmentService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.18：任务执行决策服务（原wcs-app完整迁移）（12h）

**目标**: 实现任务执行决策服务，从原wcs-app迁移核心决策和事务处理逻辑

> **[原wcs-app参考]** 3个核心服务，总计约3494行代码
> **[职责]** 任务执行决策、事务处理、任务初始化

**[重要] 这是wcs-lite-app最核心的业务逻辑！**

**TaskExecutionDecisionMakerApplicationService - 任务执行决策服务（约719行，10+方法）**:

**核心决策方法**:
- [ ] handleDecisionOnTaskList(List<Task>) - 处理任务列表决策（基础版）
- [ ] handleDecisionOnTaskList(List<Task>, boolean) - 处理任务列表决策（带标志）
- [ ] handleDecisionOnTaskList(List<Task>, boolean, boolean) - 处理任务列表决策（完整版）
- [ ] processEquipmentOnlyTasks(List<Task>) - 处理纯设备任务
- [ ] processMixedHumanMachineTasks(List<Task>) - 处理混合人机任务
- [ ] processGoodsToPersonTasks(List<Task>) - 处理货到人任务
- [ ] generateTransportPointCodeMap(List<Task>) - 生成搬运点位映射

**TaskExecutionTransactionService - 任务执行事务服务（约2425行，30+方法）**:

**核心执行方法**:
- [ ] executionDecisionForMixedHumanMachineTasks(List<Task>) - 混合人机任务执行决策
- [ ] executionDecisionByTask(Task) - 按任务执行决策
- [ ] processTaskByType(Task) - 按类型处理任务
- [ ] handleMoveTask(Task) - 处理移动任务
- [ ] handleChargeTask(Task) - 处理充电任务
- [ ] processGoodsToPersonTasksByStationGroup(Map<String, List<Task>>) - 按工位组处理货到人任务

**设备调度方法**:
- [ ] assignEquipmentToTask(Task) - 分配设备到任务
- [ ] selectOptimalEquipment(Task, List<Equipment>) - 选择最优设备
- [ ] validateEquipmentAvailability(Equipment) - 验证设备可用性

**命令生成方法**:
- [ ] createTransportCommand(Task, Equipment) - 创建搬运命令
- [ ] createBusinessCommand(Task, Job) - 创建业务命令
- [ ] sendCommandToRcs(Command) - 发送命令到RCS

**状态更新方法**:
- [ ] updateTaskStatus(Task, TaskStatus) - 更新任务状态
- [ ] updateJobStatus(Job, ActionStatus) - 更新Job状态
- [ ] completeTask(Task) - 完成任务

**TaskManagerApplicationService - 任务管理初始化服务（约350行，8+方法）**:

**初始化方法**:
- [ ] initTask(Task) - 初始化任务（基础版）
- [ ] initTask(Task, List<Job>, StrategyConfiguration) - 初始化任务（完整版）
- [ ] initializeFromMapCode(Task) - 初始化起始地图编码
- [ ] initializeToMapCode(Task) - 初始化目标地图编码
- [ ] initializeOperationMode(Task) - 初始化操作模式
- [ ] setEquipmentModelAndStatus(Task) - 设置设备型号和状态

**依赖服务**:
- TaskService、JobService、StepService、CommandService
- EquipmentService、ContainerService、StationService
- MapLocationService、MapMappingRelationService
- StrategyConfigurationApplicationService
- MessageInfoApplicationService、WCSWebSocketMessagePublisher

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.19：任务生成服务（原wcs-app完整迁移）（6h）

**目标**: 实现从Job生成Task的服务，从原wcs-app迁移任务生成逻辑

> **[原wcs-app参考]** TaskGenerationFromJobApplicationService.java（约909行，20+方法）
> **[职责]** 从Job组创建Task、设置任务属性、验证容器位置

**TaskGenerationFromJobApplicationService方法列表（20+个方法）**:

**核心生成方法（5个）**:
- [ ] createTaskFromActionGroup(List<Job>, TaskOperationMode) - 从Job组创建Task
- [ ] taskGenerateFromAction(List<Job>, TaskOperationMode) - 从Job生成Task（事务方法）
- [ ] taskGenerateFromActionWithInit(List<Job>, TaskOperationMode) - 生成并初始化Task
- [ ] createAndExecuteStationTask(Equipment, Station, ActionType) - 创建并执行站点任务
- [ ] handleMixedHumanMachinePickAction(List<Job>, TaskOperationMode) - 处理混合人机拣选

**设置方法（7个）**:
- [ ] setTaskDestination(Task, Job) - 设置任务目的地
- [ ] setTaskStationCode(Task, Job) - 设置任务工作站
- [ ] setTaskContainerCodes(Task, List<Job>, Job) - 设置容器编码
- [ ] setTaskToContainerCodes(Task, List<Job>, Job) - 设置目标容器编码
- [ ] setTaskBasicAttributes(Task, Job) - 设置基本属性
- [ ] setTaskPriority(Task, List<Job>) - 设置优先级
- [ ] setTaskEquipmentCode(Task, Job) - 设置设备编码

**验证方法（5个）**:
- [ ] validateContainerLocation(String, Job) - 验证容器位置
- [ ] validateJobGroup(List<Job>) - 验证Job组
- [ ] validateSingleJob(Job) - 验证单个Job
- [ ] validateFromLocation(Job) - 验证起始位置
- [ ] validateContainerIfSpecified(Job) - 验证容器

**其他方法（6个）**:
- [ ] updateActionsWithTaskId(List<Job>, String) - 更新Job的TaskId
- [ ] determineTaskTypeByLocation(Job) - 根据位置确定任务类型
- [ ] appendJobsToExistingTask(Task, List<Job>) - 追加Job到现有Task
- [ ] findExistingTasksForAppend(List<Job>) - 查找可追加的现有Task
- [ ] selectOptimalPackStation(Job) - 选择最优打包站点
- [ ] applyPackStationLoadBalancing(List<Station>) - 打包站点负载均衡

**依赖服务**:
- JobService、TaskService、EquipmentService
- ContainerService、ContainerSpecService
- MapLocationService、MapMappingRelationService
- ZoneService、StationService
- StrategyConfigurationApplicationService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.20：设备调度服务（原wcs-app完整迁移）（6h）

**目标**: 实现设备调度服务，从原wcs-app迁移设备调度核心逻辑

> **[原wcs-app参考]** EquipmentDispatchService.java（约1130行，15+方法）
> **[职责]** 设备调度、任务分配、充电管理

**EquipmentDispatchService方法列表（15+个方法）**:

**核心调度方法（7个）**:
- [ ] processEquipmentDispatch() - 处理设备调度（主入口，定时调用）
- [ ] queryDispatchableEquipments() - 查询可调度设备
- [ ] processLowBatteryEquipments(List<Equipment>) - 处理低电量设备
- [ ] processUnassignedTasks(List<Equipment>) - 处理未分配任务
- [ ] processIdleEquipmentTasks(List<Equipment>) - 处理空闲设备任务
- [ ] processWorkingEquipmentTasks(List<Equipment>) - 处理工作中设备任务
- [ ] assignTasksToEquipment(Equipment, List<Task>) - 分配任务到设备

**设备选择方法（3个）**:
- [ ] selectBestEquipmentForTask(Task, List<Equipment>) - 为任务选择最佳设备
- [ ] calculateEquipmentScore(Equipment, Task) - 计算设备评分
- [ ] filterAvailableEquipments(List<Equipment>) - 过滤可用设备

**充电相关方法（3个）**:
- [ ] checkAndTriggerCharging(Equipment) - 检查并触发充电
- [ ] findNearestChargingStation(Equipment) - 查找最近充电站
- [ ] createChargingTask(Equipment, Station) - 创建充电任务

**依赖服务**:
- EquipmentService、TaskService、JobService
- StationService、MapLocationService
- StrategyConfigurationApplicationService
- TaskGenerationFromJobApplicationService

**包路径**: com.t5.wcs.application.task.service

---

### 任务 4.21：拣选墙补货服务（原wcs-app完整迁移）（8h）

**目标**: 实现拣选墙补货服务，从原wcs-app迁移拣选墙场景核心逻辑

> **[原wcs-app参考]** PickingWallReplenishmentService.java（约1329行，25+方法）
> **[职责]** 拣选墙补货决策、容器调度、缓存位管理

**[重要] 这是拣选墙场景的核心服务！**

**PickingWallReplenishmentService方法列表（25+个方法）**:

**核心补货方法（5个）**:
- [ ] executeReplenishmentDecision() - 执行补货决策（主入口，定时调用）
- [ ] preloadReplenishmentData() - 预加载补货数据
- [ ] findTasksNeedReplenishment() - 查找需要补货的任务
- [ ] processReplenishmentForStation(Station) - 处理工位补货
- [ ] processReplenishmentForZone(Zone) - 处理区域补货

**容器调度方法（4个）**:
- [ ] replenishContainerToBuffer(Container, Station, Set<String>, String) - 补货容器到缓存位
- [ ] replenishContainerToStation(Container, Station) - 补货容器到工位
- [ ] createTransportCommand(Container, MapLocation, String) - 创建搬运命令
- [ ] selectOptimalBufferLocation(Station, Container) - 选择最优缓存位置

**容器选择方法（3个）**:
- [ ] selectContainersForReplenishment(Station, int) - 选择补货容器
- [ ] prioritizeContainersByUrgency(List<Container>) - 按紧急程度排序容器
- [ ] filterAvailableContainers(List<Container>) - 过滤可用容器

**位置管理方法（3个）**:
- [ ] findAvailableBufferLocations(Station) - 查找可用缓存位置
- [ ] allocateBufferLocation(Container, Station) - 分配缓存位置
- [ ] releaseBufferLocation(String locationName) - 释放缓存位置

**任务生成方法（2个）**:
- [ ] createReplenishmentTask(Container, Station, MapLocation) - 创建补货任务
- [ ] createReplenishmentJob(Container, Station) - 创建补货Job

**状态检查方法（3个）**:
- [ ] checkStationCapacity(Station) - 检查工位容量
- [ ] checkContainerAvailability(Container) - 检查容器可用性
- [ ] isContainerInTransit(Container) - 检查容器是否在途

**依赖服务**:
- ContainerService、StationService、TaskService
- JobService、CommandService、MapLocationService
- MapMappingRelationService、ZoneService
- EquipmentService、StrategyConfigurationApplicationService
- MessageInfoApplicationService、WCSWebSocketMessagePublisher

**包路径**: com.t5.wcs.application.task.service

---

## 验收标准

1. Job API 能正常创建、查询、取消、重试 Job
2. Workflow API 能正常查询和干预流程
3. 运维 API 支持批量操作和统计查询
4. CLI 引擎能正确解析命令并路由到处理器
5. 所有 API 有 Swagger 文档
6. Command相关服务能正常管理命令生命周期
7. Step服务能正常管理步骤状态
8. Job历史服务能正常记录分配/提交/取消历史
9. TaskAction服务能正常处理WMS-WCS交互
10. 任务执行决策服务能正常处理各类任务决策
11. 任务生成服务能正常从Job生成Task
12. 设备调度服务能正常调度设备执行任务
13. 拣选墙补货服务能正常处理补货决策

---

## 工时汇总

原有任务（4.1-4.13）：约60h
新增任务（4.14-4.21）：约47h
- 任务4.14 Command相关服务：4h
- 任务4.15 Step服务：2h
- 任务4.16 Job历史服务：3h
- 任务4.17 TaskAction相关服务：6h
- 任务4.18 任务执行决策服务：12h
- 任务4.19 任务生成服务：6h
- 任务4.20 设备调度服务：6h
- 任务4.21 拣选墙补货服务：8h

总计：约107h（约13.4人天）

---

## 注意事项

- Controller 使用 @RequiredArgsConstructor 注入依赖
- 分页查询使用项目统一的 PageResult
- 批量操作需要返回详细的成功/失败信息
- CLI 命令解析需要支持引号包裹的参数

---

最后更新：2025-12-25
