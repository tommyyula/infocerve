# WCS-1649 wcs-lite-app v1 版本后端开发——3-Flowable JavaDelegate 与回调机制

## 任务概述

- **Jira Issue**: WCS-1649
- **预估工时**: 5 人天（40 小时）
- **前置依赖**: WCS-1648（Flowable 引擎与适配层基础）
- **后续任务**: WCS-1650

> **[架构说明]** WCS-Lite V1 采用三应用架构：
> - JavaDelegate 通过 DeviceAppClient 调用 device-app
> - device-app 完成任务后通过 HTTP 回调通知 wcs-lite-app
> - 回调到达时使用 RuntimeService.trigger() 恢复 ReceiveTask
> - 回调可用性保障：重试机制 + 轮询补偿

## 参考文档

- 需求文档: [requirements.md](../requirements.md)
- 设计文档: [design.md](../design.md)
  - 第二章「模块结构设计」- 回调可用性保障
  - 第四章「Flowable 集成设计」- JavaDelegate 实现

---

## 任务清单

### 任务 3.1：AMR/ASRS JavaDelegate 实现（8h）

**目标**: 实现 RCS 相关的 Flowable JavaDelegate

**交付物**:
- [ ] 实现 AmrMoveDelegate（AMR 搬运）
  ```java
  @Component("amrMoveDelegate")
  public class AmrMoveDelegate extends BaseWcsDelegate {
      @Override
      protected void doExecute(DelegateExecution execution, Job job) {
          // 1. 获取流程变量（fromStation, toStation, containerId）
          // 2. 创建 Task
          // 3. 通过 DeviceAppClient 调用 device-app 创建任务
          // 4. 保存 taskId 和 executionId 到流程变量
          // 注意：后续 ReceiveTask 会等待回调
      }
  }
  ```
- [ ] 实现 AsrsPickDelegate（立库出库）
- [ ] 实现 AsrsPutDelegate（立库入库）
- [ ] 编写单元测试

**BPMN 流程片段**:
```xml
<serviceTask id="amrMove" flowable:delegateExpression="${amrMoveDelegate}"/>
<receiveTask id="waitAmrMove" name="等待AMR搬运完成"/>
<sequenceFlow sourceRef="amrMove" targetRef="waitAmrMove"/>
```

---

### 任务 3.2：其他业务 JavaDelegate 实现（8h）

**目标**: 实现其他业务场景的 JavaDelegate

**交付物**:
- [ ] 实现 HumanTaskDelegate（人工任务）
  ```java
  @Component("humanTaskDelegate")
  public class HumanTaskDelegate extends BaseWcsDelegate {
      @Override
      protected void doExecute(DelegateExecution execution, Job job) {
          // 1. 创建人工任务 Task
          // 2. 设置任务说明
          // 3. 保存 taskId 到流程变量
          // 注意：后续 ReceiveTask 等待人工确认
      }
  }
  ```
- [ ] 实现 PickWallPickDelegate（拣选墙拣选）
- [ ] 实现 ConveyorDelegate（输送线）
- [ ] 实现 PackDelegate（包装）
- [ ] 编写单元测试

---

### 任务 3.2.1：补货/移库/盘点 BPMN 流程定义（V1 预实现）（8h）

**目标**: 定义补货、移库、盘点 Job 的 BPMN 流程

> **[V1 预实现说明]** 实现 Workflow 流程框架、Job API、Task 分解，业务规则用默认值。
> **[设计说明]** 人工确认步骤统一使用 humanTaskDelegate，通过流程变量 taskName 区分类型。

**交付物**:
- [ ] 创建 replenishment.bpmn20.xml（补货流程）
- [ ] 创建 transfer.bpmn20.xml（移库流程）
- [ ] 创建 inventory.bpmn20.xml（盘点流程）
- [ ] 编写流程集成测试

**流程对应关系（与 design.md BPMN 一致）**:
- 补货流程：asrsPickDelegate -> amrMoveDelegate -> humanTaskDelegate（taskName=补货确认）
- 移库流程：humanTaskDelegate（taskName=取货确认）-> amrMoveDelegate -> humanTaskDelegate（taskName=放货确认）
- 盘点流程：asrsPickDelegate -> amrMoveDelegate -> humanTaskDelegate（taskName=盘点确认）-> amrMoveDelegate -> asrsPutDelegate

---

### 任务 3.3：回调机制与轮询补偿实现（8h）

**目标**: 实现回调处理和轮询补偿机制

**交付物**:
- [ ] 创建 TaskCallbackController（接收 device-app 回调）
  ```java
  @RestController
  @RequestMapping("/wcs/tasks")
  public class TaskCallbackController {
      @PostMapping("/{taskId}/callback")
      public Result<Void> handleTaskCallback(
          @PathVariable String taskId,
          @RequestBody TaskCallbackRequest request);
  }
  ```
- [ ] 创建 TaskCallbackHandler（包含并发控制）
  ```java
  @Service
  public class TaskCallbackHandler {
      @Resource
      private RuntimeService runtimeService;
      
      public void handleTaskCallback(String taskId, boolean success, String errorMessage) {
          // 1. 获取分布式锁
          // 2. 幂等性检查
          // 3. 更新 Task 状态
          // 4. 获取 executionId
          // 5. 触发 ReceiveTask 继续执行
          runtimeService.trigger(executionId);
      }
  }
  ```
- [ ] 创建 TaskPollingService（轮询补偿）
  ```java
  @Service
  public class TaskPollingService {
      // 轮询间隔：30 秒
      // 超时阈值：Task 下发超过 5 分钟未完成则触发轮询
      @Scheduled(fixedDelay = 30000)
      public void pollTimeoutTasks() {
          // 1. 查询超时的 DISPATCHED 状态 Task
          // 2. 通过 DeviceAppClient 查询任务状态
          // 3. 根据状态触发回调处理
      }
  }
  ```
- [ ] 编写回调集成测试

**回调恢复流程**:
```
device-app 回调 -> TaskCallbackController -> TaskCallbackHandler
    -> 更新 Task 状态
    -> RuntimeService.trigger(executionId)
    -> ReceiveTask 继续执行
    -> 下一个 ServiceTask
```

---

### 任务 3.4：WMS 回调服务实现（4h）

**目标**: 实现 Job 完成后回调 WMS 的服务

**交付物**:
- [ ] 创建 WmsCallbackService（参考 design.md 8.8 节完整设计）
  ```java
  @Service
  @Slf4j
  @RequiredArgsConstructor
  public class WmsCallbackService {
      
      private final RestTemplate restTemplate;
      
      /**
       * 回调 Job 完成
       * @param job 已完成的 Job
       */
      public void callbackJobCompleted(Job job) {
          if (StringUtils.isBlank(job.getCallbackUrl())) {
              log.info("Job 没有配置回调地址，跳过回调，jobId: {}", job.getJobId());
              return;
          }
          
          WmsCallbackRequest request = WmsCallbackRequest.builder()
              .jobId(job.getJobId())
              .jobNo(job.getJobNo())
              .status("COMPLETED")
              .completedTime(job.getEndTime())
              .build();
          
          doCallback(job.getCallbackUrl(), request, 0);
      }
      
      /**
       * 回调 Job 失败
       */
      public void callbackJobFailed(Job job, String errorMessage) {
          // 参考 design.md 8.8 节实现
      }
      
      // 详细实现参考 design.md 8.8 节（含重试机制）
  }
  ```
- [ ] 创建 WmsCallbackRequest DTO（参考 design.md 8.8 节）
  ```java
  @Data
  @Builder
  public class WmsCallbackRequest {
      private String jobId;
      private String jobNo;
      private String status;      // COMPLETED, FAILED, CANCELLED
      private String errorMessage;
      private LocalDateTime completedTime;
  }
  ```
- [ ] 在 Job 状态变更时调用 WmsCallbackService
- [ ] 编写 WMS 回调单元测试

**调用时机**:
- Job.complete() 后调用
- Job.fail() 后调用
- Job.cancel() 后调用

---

### 任务 3.5：消息总线集成（8h）

**目标**: 实现消息总线抽象和 RabbitMQ 集成

**交付物**:
- [ ] 创建 MessageBus 抽象接口
- [ ] 创建 MessageHandler 接口
- [ ] 创建 RabbitMqMessageBus 实现
- [ ] 创建 MessageBusFactory 工厂类
- [ ] 配置 RabbitMQ
  - 交换机：wcs.exchange
  - 队列：wcs.job.status、wcs.task.status
  - 路由键：job.created、job.completed、task.completed 等
- [ ] 实现 Job 状态变更消息发布
- [ ] 编写消息总线单元测试

---

### 任务 3.6：消息处理 Service（原 wcs-app 迁移参考）（12h）

**目标**: 实现消息处理服务，从原 wcs-app 迁移完整的消息处理机制

**消息处理架构**:
```
MessageInfoService（消息调度）
    |
    +-- AbstractMessageFunctionService（抽象基类）
            |
            +-- AbstractInboundMessageFunctionService（入库消息抽象基类）
            |
            +-- 具体 MessageFunctionService 实现（约 30 个）
```

**交付物**:

**基础类**:
- [ ] AbstractMessageFunctionService - 消息处理抽象基类
  - getCallbackUrl(MessageInfo, MessageConfig) - 获取回调 URL
  - process(MessageInfo) - 处理消息
- [ ] AbstractInboundMessageFunctionService - 入库消息抽象基类
  - getActionType() - 获取动作类型

**Job 生命周期消息（7 个）**:
- [ ] MessageJobStartedFunctionService - Job 开始消息处理
- [ ] MessageJobCompletedFunctionService - Job 完成消息处理
- [ ] MessageJobClosedFunctionService - Job 关闭消息处理
- [ ] MessageJobSubmitFunctionService - Job 提交消息处理
- [ ] MessageBatchJobSubmitFunctionService - 批量 Job 提交消息处理
- [ ] MessageJobReportIssueFunctionService - Job 问题报告消息处理
- [ ] MessageCommandCompletedFunctionService - Command 完成消息处理

**入库消息（5 个）**:
- [ ] MessageCaseToteInboundFunctionService - 箱托入库消息处理
- [ ] MessageEmptyToteInboundFunctionService - 空托入库消息处理
- [ ] MessageConsolidationCompleteFunctionService - 合并完成消息处理
- [ ] MessageContainerReplenishmentFunctionService - 容器补货消息处理
- [ ] MessageDepartStationFunctionService - 离开站点消息处理

**出库消息（3 个）**:
- [ ] MessageEmptyToteOutboundFunctionService - 空托出库消息处理
- [ ] MessagePickOutboundFunctionService - 拣选出库消息处理
- [ ] MessageDispatchToPackFunctionService - 派发到打包消息处理

**位置变更消息（4 个）**:
- [ ] MessageChangeLocationFunctionService - 位置变更消息处理
- [ ] MessageBatchChangeLocationFunctionService - 批量位置变更消息处理
- [ ] MessageDropedFunctionService - 放下消息处理
- [ ] MessageExceptionContainerLocationChangeFunctionService - 异常容器位置变更消息处理

**搜索查询消息（4 个）**:
- [ ] MessageEmptyToteSearchFunctionService - 空托搜索消息处理
- [ ] MessageItemSearchFunctionService - 物品搜索消息处理
- [ ] MessageInventorySearchFunctionService - 库存搜索消息处理
- [ ] MessagePickingCheckFunctionService - 拣选检查消息处理

**拣选相关消息（3 个）**:
- [ ] MessagePickingFunctionService - 拣选消息处理
- [ ] MessagePickSubmitFunctionService - 拣选提交消息处理
- [ ] MessageInventoryCheckSubmitFunctionService - 盘点提交消息处理

**其他消息（4 个）**:
- [ ] MessageCreateStepFunctionService - 创建 Step 消息处理
- [ ] MessageDispatchToStageFunctionService - 派发到暂存消息处理
- [ ] MessageLocationStatusBatchUpdateFunctionService - 位置状态批量更新消息处理
- [ ] WebHookMessageFunctionService - WebHook 消息处理

**包路径**: com.t5.wcs.domain.message.service

---

### 任务 3.6.1：MessageInfoApplicationService（应用服务）（4h）

**目标**: 实现消息信息应用服务，提供消息创建和处理的统一入口

> **[原wcs-app参考]** MessageInfoApplicationService.java（1055行，54+方法）
> **[职责]** 统一消息创建入口，调用MessageInfoService处理消息，返回处理结果

**MessageInfoApplicationService方法列表（54+方法）**:

**基础CRUD方法（7个）**:
- [ ] create(MessageInfoCmd) - 创建消息
- [ ] update(Long id, MessageInfoCmd) - 更新消息
- [ ] get(Long id) - 获取消息
- [ ] delete(Long id) - 删除消息
- [ ] search(MessageInfoQuery) - 搜索消息
- [ ] searchByPaging(MessageInfoQuery) - 分页搜索
- [ ] resend(Long id) - 重发消息

**拣货相关消息（4个）**:
- [ ] createPickingMessage(cmdId, taskId, mapCode) - 创建拣货消息
- [ ] createPickedMessage(jobId, containerCode, mapCode, isEntireLpPick, jobSubmitHistoryId) - 创建已拣货消息
- [ ] createChangeLocationMessage(changeLocationId, jobList, mapCode, equipmentCode) - 创建位置变更消息
- [ ] createDropMessage(cmdId, containerCode, mapCode) - 创建放下消息

**容器相关消息（8个）**:
- [ ] createContainerRelationshipMessage(equipment, slotNo, containerCode) - 容器关系消息
- [ ] messagePutAwayContainerCreate(container, locationName, mapCode, taskId, stepId) - 容器到达位置消息
- [ ] messageRetrievalContainerCreate(container, resetType, destination, mapCode, taskId, stepId) - 容器位置变更消息
- [ ] createEmptyToteOutboundMessage(messageContent, mapCode) - 空箱出库消息
- [ ] createEmptyToteInboundMessage(messageContent, mapCode, containerCode) - 空箱入库消息
- [ ] createCaseToteInboundMessage(messageContent, mapCode, containerCode) - 整箱入库消息
- [ ] createRequestToteTaskRetry(messageContent, mapCode, containerCode) - 请求料箱任务重试
- [ ] createToteFillrateRecordMessage(equipmentCode, containerCode, fillRate, overFlow, mapCode, slotCode) - 容器容积率记录消息

**Job相关消息（8个）**:
- [ ] createJobSubmitMessage(cmdId, jobId, messageContent, responseType) - Job提交消息（泛型返回）
- [ ] createBatchJobSubmitMessage(cmdId, jobId, messageContent, responseType) - 批量Job提交消息（泛型返回）
- [ ] createJobCompletedMessage(messageContent, jobId, containerCode, mapCode) - Job完成消息
- [ ] createJobReportIssueMessage(jobId, messageContent) - Job问题报告消息
- [ ] createJobClosedNotification(job, cmdId) - Job关闭通知
- [ ] createJobStartedNotification(job, task) - Job开始通知
- [ ] createJobTriggerCreateMessage(messageContent, jobId, taskId, containerCode, mapCode, cmdId) - Job触发创建消息
- [ ] createInventoryCheckNotification(job, issueJobIds) - 库存检查通知

**搜索查询消息（6个）**:
- [ ] createReceiptSearchMessage(messageContent, containerCode) - 收货搜索消息
- [ ] createOrderSearchMessage(messageContent) - 订单搜索消息
- [ ] createGISMessage(messageContent, responseType) - GIS消息（泛型返回）
- [ ] createItemSearchMessage(messageContent) - 物料搜索消息
- [ ] createEmptyToteSearchMessage() - 空箱搜索消息
- [ ] createInventorySearchMessage(messageContent) - 库存搜索消息（返回List<InventoryResponseDto>）

**合箱/拆箱消息（3个）**:
- [ ] createConsolidateSubmitMessage(messageContent, mapCode, job, task, responseType) - 合箱提交消息（泛型返回）
- [ ] createToteSplitSubmitMessage(messageContent, mapCode, job, task, responseType) - 拆箱提交消息（泛型返回）
- [ ] createConsolidationCompleteMessage(messageContent, mapCode, containerCode, responseType) - 合箱完成消息（泛型返回）

**工作站相关消息（4个）**:
- [ ] createPickOutboundMessage(messageContent, mapCode) - 拣货出库消息
- [ ] createDepartStationMessage(messageContent, jobId, taskId, containerCode, mapCode) - 离站消息
- [ ] createDispatchToPackMessage(messageContent, jobId, taskId, containerCode, mapCode) - 派发到打包消息
- [ ] createDispatchToStageMessage(messageContent, jobId, taskId, containerCode, mapCode) - 派发到暂存消息

**其他消息（14个）**:
- [ ] createAssignCallbackMessage(messageContent) - 任务分配回调消息
- [ ] createCommandCompletedMessage(job, containerCode, mapCode, commandId) - 指令完成消息
- [ ] createExceptionContainerLocationChangeMessage(messageContent, containerCode, cmdId) - 异常容器位置变更消息
- [ ] createTaskCancelledMessage(messageContent, taskId, jobId) - 任务取消消息
- [ ] createMarkContainerFullMessage(messageContent) - 标记容器满消息
- [ ] createPickingCheckMessage(messageContent, jobId) - 拣货检查消息
- [ ] createContainerNextLocationMessage(messageContent, commandId, containerCode, taskId, jobId) - 容器下个位置消息
- [ ] createContainerNextLocationMessage(messageContent, commandId, containerCode, taskId, jobId, useProcessAndExecuteAll) - 容器下个位置消息（重载）
- [ ] createLocationBatchUpdate(messageContent) - 位置批量更新
- [ ] createLocationStatusUpdate(messageContent) - 位置状态更新
- [ ] createBatchChangeLocation(messageContent, mapCode, taskId, stepId) - 批量变更位置
- [ ] createRequestTotes(messageContent) - 请求料箱

**核心处理方法（2个）**:
- [ ] processAndExecuteAllMessages(messageType, messageContent, jobId, taskId, stepId, containerCode, mapCode, cmdId) - 处理并执行所有消息（立即执行所有订阅者）
- [ ] processReceivedMessage(messageInfo, responseType) - 处理接收到的消息（解析响应）

**私有辅助方法**:
- processStandardMessage - 标准消息处理（创建消息并根据配置处理）
- buildArriveContainerMessageInfo - 构建容器到达消息内容
- buildLeaveContainerMessageInfo - 构建容器离开消息内容
- getLocationMapByNames - 获取位置名称到ID的映射
- buildJobClosedMessage - 构建Job关闭消息内容
- buildJobStartedMessage - 构建Job开始消息内容
- buildInventoryCheckMessage - 构建库存检查消息内容

**依赖**:
- MessageInfoService（领域服务）
- MessageInfoAssembler（DTO转换）
- MapLocationService（位置查询）

**包路径**: com.t5.wcs.application.message.service

---

### 任务 3.6.2：MessageConfigApplicationService（消息配置服务）（1h）

**目标**: 实现消息配置应用服务，管理消息类型与订阅者的配置

> **[原wcs-app参考]** MessageConfigApplicationService.java（55行，6方法）
> **[职责]** 消息配置CRUD，定义消息类型、订阅者URL、同步/异步模式

**MessageConfigApplicationService方法列表（6个）**:
- [ ] create(MessageConfigCreateCmd) - 创建消息配置
- [ ] update(Long id, MessageConfigUpdateCmd) - 更新消息配置
- [ ] get(Long id) - 获取消息配置
- [ ] delete(Long id) - 删除消息配置
- [ ] search(MessageConfigQuery) - 搜索消息配置
- [ ] searchByPaging(MessageConfigQuery) - 分页搜索

**MessageConfig实体字段**:
- messageType - 消息类型（MessageType枚举）
- subscriberCode - 订阅者编码
- subscriberUrl - 订阅者URL
- isAsync - 是否异步处理
- isEnabled - 是否启用
- retryCount - 重试次数
- retryInterval - 重试间隔（秒）

**包路径**: com.t5.wcs.application.message.service

---

### 任务 3.6.3：MessageType枚举（消息类型定义）（1h）

**目标**: 定义完整的消息类型枚举

> **[原wcs-app参考]** 约50种消息类型

**MessageType枚举值**:

**拣货相关**:
- PICKING - 拣货
- PICKED - 已拣货
- CHANGE_LOCATION - 位置变更
- DROPPED - 放下

**容器相关**:
- CONTAINER_ARRIVED_LOCATION - 容器到达位置
- CONTAINER_MOVED_FROM_LOCATION - 容器从位置移出
- CONTAINER_REPLENISHMENT - 容器补货
- EMPTY_TOTE_OUTBOUND - 空箱出库
- EMPTY_TOTE_INBOUND - 空箱入库
- CASE_TOTE_INBOUND - 整箱入库
- REQUEST_TOTE_TASK_RETRY - 请求料箱任务重试
- TOTE_FILLRATE - 容器容积率

**Job相关**:
- JOB_SUBMIT - Job提交
- BATCH_JOB_SUBMIT - 批量Job提交
- JOB_COMPLETED - Job完成
- JOB_STARTED - Job开始
- JOB_CLOSED - Job关闭
- JOB_TRIGGER_CREATE - Job触发创建
- REPORT_ISSUE - 问题报告
- INVENTORY_CHECK - 库存检查

**搜索查询**:
- RECEIPT_SEARCH - 收货搜索
- ORDER_SEARCH - 订单搜索
- GIS - GIS查询
- ITEM_SEARCH - 物料搜索
- EMPTY_TOTE_SEARCH - 空箱搜索
- INVENTORY_SEARCH - 库存搜索

**合箱/拆箱**:
- CONSOLIDATE_SUBMIT - 合箱提交
- TOTE_SPLIT_SUBMIT - 拆箱提交
- CONSOLIDATION_COMPLETE - 合箱完成

**工作站相关**:
- PICK_OUTBOUND - 拣货出库
- DEPART_STATION - 离站
- DISPATCH_TO_PACK - 派发到打包
- DISPATCH_TO_STAGE - 派发到暂存

**其他**:
- ASSIGN_CALLBACK - 任务分配回调
- COMMAND_COMPLETED - 指令完成
- EXCEPTION_CONTAINER_LOCATION_CHANGE - 异常容器位置变更
- TASK_CANCELLED - 任务取消
- MARK_CONTAINER_FULL - 标记容器满
- PICKING_CHECK - 拣货检查
- NEXT_CONTAINER_LOCATION - 容器下个位置
- LOCATION_BATCH_UPDATE - 位置批量更新
- LOCATION_STATUS_BATCH_UPDATE - 位置状态批量更新
- BATCH_CHANGE_LOCATION - 批量变更位置
- REQUEST_TOTES - 请求料箱

**包路径**: com.t5.wcs.domain.common.enums

---

## 验收标准

1. 所有 JavaDelegate 能正常执行
2. ReceiveTask 能正确等待回调
3. 回调到达后 RuntimeService.trigger() 能正确恢复流程
4. 轮询补偿能发现超时任务并触发回调处理
5. 消息总线能正常发布和订阅消息
6. 端到端流程能跑通（Job 创建 -> Workflow 执行 -> 回调 -> 完成）

---

## 注意事项

- JavaDelegate 使用 @Component("delegateName") 注解
- 使用 ReceiveTask 实现异步等待
- 回调处理需要保存 executionId 以便恢复
- 轮询补偿是回调失败的兜底机制，超时阈值 5 分钟
- 消息总线使用条件注解，支持切换实现

---

最后更新：2025-12-24
