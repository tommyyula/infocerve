# WCS-1648 wcs-lite-app v1 版本后端开发——2-Flowable 引擎与适配层基础

## 任务概述

- **Jira Issue**: WCS-1648
- **预估工时**: 3 人天（24 小时）
- **前置依赖**: WCS-1647（基础设施与领域模型）
- **后续任务**: WCS-1649

> **[架构说明]** WCS-Lite V1 采用三应用架构：
> - wcs-lite-app 通过 FacilityAppClient 调用 facility-app（资源数据）
> - wcs-lite-app 通过 DeviceAppClient 调用 device-app（RCS 任务）
> - Workflow 引擎使用 Flowable 7.1.0（BPMN 2.0 标准）

### 三应用职责划分

```
wcs-lite-app（业务编排层）
├── Job/Task/Workflow 业务逻辑
├── Flowable BPMN 流程编排
└── CLI 运维

facility-app（资源管理层）
├── Zone 区域管理
├── Station 站点管理
├── Device 设备管理
└── StationDevice 绑定管理

device-app（设备对接层）
├── RcsVendor 厂商配置
├── RcsMission 任务管理
├── RCS 适配器
└── 回调处理
```

## 参考文档

- 需求文档: [requirements.md](../requirements.md)
- 设计文档: [design.md](../design.md)
  - 第二章「模块结构设计」- 三应用架构、交互方式
  - 第四章「Flowable 集成设计」

---

## 任务清单

### 任务 2.1：FacilityAppClient 与 DeviceAppClient（8h）

**目标**: 实现调用 facility-app 和 device-app 的 HTTP 客户端

**交付物**:
- [ ] 创建 FacilityAppClient 接口
  ```java
  public interface FacilityAppClient {
      /** 查询区域信息 */
      ZoneInfo queryZone(String zoneCode);
      /** 查询站点信息 */
      StationInfo queryStation(String stationCode);
      /** 查询设备信息 */
      DeviceInfo queryDevice(String deviceCode);
      /** 查询站点设备列表 */
      List<StationDeviceInfo> queryStationDevices(String stationId);
  }
  ```
- [ ] 创建 DeviceAppClient 接口
  ```java
  public interface DeviceAppClient {
      /** 创建搬运任务 */
      CreateMissionResponse createMission(CreateMissionRequest request);
      /** 取消任务 */
      Result<Void> cancelMission(String missionId);
      /** 查询任务状态（missionId 是 device-app 内部任务ID） */
      MissionStatusResponse queryMissionStatus(String missionId);
  }
  ```
- [ ] 创建 FacilityAppClientImpl 和 DeviceAppClientImpl 实现
- [ ] 创建请求/响应 DTO
- [ ] 创建配置类
  - FacilityAppClientConfig（base-url: facility-app）
  - DeviceAppClientConfig（base-url: device-app）
- [ ] 编写单元测试（Mock HTTP）

**API 路径**:
- facility-app: `/facility/zones`, `/facility/stations`, `/facility/devices`
- device-app: `/device/rcs/missions`

---

### 任务 2.2：Flowable 配置与流程定义（8h）

**目标**: 配置 Flowable 7.1.0 流程引擎

**交付物**:
- [ ] 添加 Flowable 依赖（build.gradle）
  ```groovy
  implementation 'org.flowable:flowable-spring-boot-starter-process:7.1.0'
  ```
- [ ] 创建 FlowableConfig 配置类
  ```java
  @Configuration
  public class FlowableConfig {
      // Flowable 配置
      // 异步执行器配置
      // 历史级别配置
  }
  ```
- [ ] 创建 BPMN 2.0 流程定义文件
  - src/main/resources/processes/outbound.bpmn20.xml（出库流程）
  - src/main/resources/processes/empty-container-return.bpmn20.xml（空容器回收）
  - src/main/resources/processes/replenishment.bpmn20.xml（补货流程 - V1 预实现）
  - src/main/resources/processes/transfer.bpmn20.xml（移库流程 - V1 预实现）
  - src/main/resources/processes/inventory.bpmn20.xml（盘点流程 - V1 预实现）
- [ ] 验证 Flowable 配置能正常启动

**BPMN 流程结构示例（出库）**:
```xml
<process id="outbound" name="出库流程">
  <startEvent id="start"/>
  <serviceTask id="asrsPick" flowable:delegateExpression="${asrsPickDelegate}"/>
  <receiveTask id="waitAsrsPick" name="等待立库出库完成"/>
  <serviceTask id="amrMove" flowable:delegateExpression="${amrMoveDelegate}"/>
  <receiveTask id="waitAmrMove" name="等待AMR搬运完成"/>
  <!-- ... -->
  <endEvent id="end"/>
</process>
```

**关键概念**:
- ServiceTask + JavaDelegate：执行业务逻辑
- ReceiveTask：等待外部回调（异步等待状态）
- RuntimeService.trigger()：回调到达时触发继续执行

---

### 任务 2.3：BaseWcsDelegate 基类实现（8h）

**目标**: 实现 Flowable JavaDelegate 基类，封装通用逻辑

**交付物**:
- [ ] 实现 BaseWcsDelegate 抽象类
  ```java
  public abstract class BaseWcsDelegate implements JavaDelegate {
      @Resource protected TaskRepository taskRepository;
      @Resource protected JobRepository jobRepository;
      @Resource protected RuntimeService runtimeService;
      @Resource protected FacilityAppClient facilityAppClient;
      @Resource protected DeviceAppClient deviceAppClient;
      
      @Override
      public void execute(DelegateExecution execution) {
          String jobId = (String) execution.getVariable("jobId");
          Job job = jobRepository.findById(jobId);
          
          // 调用子类实现
          doExecute(execution, job);
      }
      
      // 子类必须实现
      protected abstract void doExecute(DelegateExecution execution, Job job);
      
      // 辅助方法
      protected Task createTask(Job job, TaskType taskType, String fromStation, String toStation);
      protected void saveTaskId(DelegateExecution execution, String taskId);
      protected String buildCallbackUrl(String taskId);
  }
  ```
- [ ] 实现 createTask() - 创建并保存 Task
- [ ] 实现 saveTaskId() - 保存 taskId 到流程变量
- [ ] 实现 buildCallbackUrl() - 构建回调地址
- [ ] 编写 BaseWcsDelegate 单元测试

**回调恢复机制**:
```java
// 回调到达时，触发 ReceiveTask 继续执行
@Service
public class WorkflowResumeService {
    @Resource
    private RuntimeService runtimeService;
    
    public void resumeWorkflow(String executionId) {
        // 触发 ReceiveTask 继续执行
        runtimeService.trigger(executionId);
    }
}
```

---

### 任务 2.4：Decision 模块架构（原wcs-app完整迁移）（8h）

**目标**: 实现设备决策模块，从原wcs-app迁移完整的决策引擎

**Decision 模块核心架构**:

```
EquipmentDecisionScheduler（定时调度）
    |
    +-- EquipmentStateDecisionService（状态决策）
    |       |
    |       +-- StateHandler（6个实现）
    |
    +-- EquipmentBehaviorDecisionService（行为决策）
            |
            +-- BehaviorHandler（18个实现）
```

**交付物**:

**核心服务**:
- [ ] EquipmentBehaviorDecisionService - 设备行为决策服务
  - 方法: doDecision(Equipment) - 执行行为决策
  - 方法: selectHandler(Equipment) - 选择合适的Handler
- [ ] EquipmentStateDecisionService - 设备状态决策服务
  - 方法: checkState(Equipment) - 检查设备状态
  - 方法: handleState(Equipment, State) - 处理状态变更

**Handler 接口**:
- [ ] BehaviorHandler 接口
  ```java
  public interface BehaviorHandler {
      boolean support(Equipment equipment);
      void handle(Equipment equipment);
  }
  ```
- [ ] StateHandler 接口
  ```java
  public interface StateHandler {
      boolean support(Equipment equipment, EquipmentState state);
      void handle(Equipment equipment);
  }
  ```

**BehaviorHandler 实现（18个）**:
- [ ] DispatchAdjustHeadHandler - 调整车头方向
- [ ] DispatchContainerReplenishmentHandler - 容器补货
- [ ] DispatchDropHandler - 放货
- [ ] DispatchEndChargeHandler - 结束充电
- [ ] DispatchPickupHandler - 取货
- [ ] DispatchSwitchFaceHandler - 切换面
- [ ] DispatchToChargeHandler - 去充电
- [ ] DispatchToContainerReplenishmentStationHandler - 去容器补货站
- [ ] DispatchToFacePointHandler - 去面点
- [ ] DispatchToPickupPointHandler - 去取货点
- [ ] DispatchToTargetPositionHandler - 去目标位置
- [ ] FinishedHandler - 完成处理
- [ ] GeneratePreCommandHandler - 生成预命令
- [ ] StepSelectionHandler - 步骤选择
- [ ] StepUnbindingHandler - 步骤解绑
- [ ] SwitchFacePointSelectionHandler - 切换面点选择
- [ ] TargetSelectionHandler - 目标选择
- [ ] TaskStepDecisionHandler - 任务步骤决策

**StateHandler 实现（6个）**:
- [ ] BlockedStateHandler - 阻塞状态处理
- [ ] FaultStateHandler - 故障状态处理
- [ ] OfflineStateHandler - 离线状态处理
- [ ] RegistrationHandler - 注册处理
- [ ] SyncMapHandler - 同步地图处理
- [ ] TimeoutStateHandler - 超时状态处理

**StepCommandCreationService - Step到Command创建服务（1308行，核心服务）**:
- [ ] StepCommandCreationService - Step到Command创建
  - 依赖：CommandService、TaskService、JobService、LockUtil、MapMappingRelationService、EquipmentModelService、StationService、StepService、ContainerService、MapLocationService
  - processManufacturerStepCommandCreation(Step) - 处理厂商调度Step创建Command（主入口）
  - flushBatchCommands(List batchNos) - 刷新批次命令（批量发送）
  - generateGroupId(batchNo) - 生成组ID（格式：batchNo-timestamp）
  - createCommandForStep(Step, Equipment, List<Task>, List<Job>) - 根据Step类型创建Command
  - buildBaseCommand(Step, CmdType, Equipment, List<Task>, List<Job>) - 构建基础Command
  - buildLocationContentJson(Step, List<Task>, List<Job>, List<String>, String) - 构建位置内容JSON
  - applySequenceDeduplication(List<Command>) - 应用序列去重规则

**支持的StepType到Command映射（23种）**:
- [ ] MOVEMENT -> CmdType.MOVE（移动命令）
- [ ] CHARGE -> CmdType.START_CHARGING（充电命令）
- [ ] TRANSPORT -> CmdType.TRANSPORT（运输命令）
- [ ] PICK_TO_AGV -> CmdType.PICK（货到人拣选）
- [ ] WALL_PICK_TO_AGV -> CmdType.PICK（拣选墙到AGV）
- [ ] PICK_BY_STATION -> CmdType.PICK（工位拣选）
- [ ] EMPTY_TOTE_OUTBOUND -> CmdType.EMPTY_TOTE_OUTBOUND（空箱出库）
- [ ] CASE_OUTBOUND -> CmdType.CASE_OUTBOUND（整箱出库）
- [ ] CONTAINER_REPLENISHMENT -> 容器补货命令
- [ ] EMPTY_TOTE_INBOUND -> CmdType.EMPTY_TOTE_INBOUND（空箱入库）
- [ ] RETURN_TO_STORAGE -> CmdType.RETURN_TO_STORAGE（返库）
- [ ] CASE_INBOUND -> CmdType.CASE_INBOUND（整箱入库）
- [ ] PACK -> CmdType.PACK（打包）
- [ ] COUNT -> CmdType.COUNT（盘点）
- [ ] PIECE_RECEIVING -> CmdType.PIECE_RECEIVING（散件收货）
- [ ] RECOUNT -> CmdType.RECOUNT（复盘）
- [ ] REQUEST_IDLE_ROBOT -> CmdType.REQUEST_IDLE_ROBOT（请求空闲机器人）
- [ ] TOTE_CONSOLIDATE -> CmdType.TOTE_CONSOLIDATE（料箱合并）
- [ ] INVENTORY_CHECK -> CmdType.INVENTORY_CHECK（库存检查）
- [ ] OUTBOUND_STAGING_CONFIRMATION -> CmdType.OUTBOUND_STAGING_CONFIRMATION（出库暂存确认）
- [ ] TOTE_SPLIT -> CmdType.TOTE_SPLIT（料箱拆分）
- [ ] STAGE -> 暂存命令
- [ ] REST -> 休息命令

**Drools规则文件**:
- [ ] equipment-behavior.drl - 设备行为决策规则
  - 位置：src/main/resources/rules/equipment-behavior.drl
  - 用途：定义设备行为决策的Drools规则
- [ ] equipment-state.drl - 设备状态决策规则
  - 位置：src/main/resources/rules/equipment-state.drl
  - 用途：定义设备状态决策的Drools规则

**配置类**:
- [ ] DroolsConfig - Drools引擎配置
  - 配置KieContainer、KieSession
  - 加载规则文件
- [ ] BehaviorHandlerConfig - 行为Handler注册配置
  - 注册所有BehaviorHandler实现到Spring容器
- [ ] StateHandlerConfig - 状态Handler注册配置
  - 注册所有StateHandler实现到Spring容器

**包路径**: com.t5.wcs.domain.decision

**参考**: design.md 第68节 Decision模块分析

---

### 任务 2.8：DDD分层架构重构注意事项（必读）

**目标**: 确保重构后的代码符合DDD分层架构原则

> **[重要] 原wcs-app的DDD分层问题**
> 
> 原wcs-app的Domain Service（如StepCommandCreationService）使用了LockUtil（分布式锁），
> 这违反了DDD分层原则。技术锁是基础设施关注点，不应出现在领域层。

**业务锁 vs 技术锁**:

业务锁（领域概念）- 属于领域层：
- 设备占用/锁定：这台AGV正在执行任务，不能再分配
- 库位锁定：这个货位正在入库，暂时不能出库
- 资源预留：库存已被某订单预留
- 用实体状态建模（如 Equipment.status = LOCKED）

技术锁（基础设施）- 属于应用层/基础设施层：
- 分布式锁：Redis/Zookeeper实现的并发控制
- 数据库行锁：SELECT FOR UPDATE
- 乐观锁：版本号控制
- 防止并发问题，不是业务规则

**重构建议**:
```java
// [错误] 原wcs-app写法 - Domain Service使用分布式锁
@Service
public class StepCommandCreationService {
    private final LockUtil lockUtil;
    
    public void processManufacturerStepCommandCreation(Step step) {
        String lockKey = "step_command_creation:" + step.getId();
        if (!lockUtil.tryLock(lockKey, 0, -1, TimeUnit.SECONDS)) {
            return;
        }
        try {
            // 业务逻辑
        } finally {
            lockUtil.unlock(lockKey);
        }
    }
}

// [正确] 重构后写法 - 应用层处理技术锁
@Service
public class StepCommandCreationApplicationService {
    private final LockUtil lockUtil;
    private final StepCommandCreationDomainService domainService;
    
    public void processManufacturerStepCommandCreation(Step step) {
        String lockKey = "step_command_creation:" + step.getId();
        if (!lockUtil.tryLock(lockKey, 0, -1, TimeUnit.SECONDS)) {
            return;
        }
        try {
            // 调用领域服务处理纯业务逻辑
            domainService.createCommandForStep(step);
        } finally {
            lockUtil.unlock(lockKey);
        }
    }
}

// [正确] 领域服务 - 只有业务逻辑
@Service
public class StepCommandCreationDomainService {
    public Command createCommandForStep(Step step) {
        // 纯业务规则，不关心锁
    }
}
```

**实施要点**:
- [ ] 识别原wcs-app中Domain Service使用的技术锁
- [ ] 将技术锁逻辑移到Application Service
- [ ] Domain Service保持纯业务逻辑
- [ ] 业务锁用实体状态建模

---

### 任务 2.5：核心业务 Service（原 wcs-app 迁移参考）（16h）

**目标**: 实现核心业务逻辑层 Service，从原 wcs-app 迁移完整的业务服务

> **[重要备注] Domain Service 命名规范**
> 
> 原 wcs-app 的 Service 命名太泛（如 JobService、TaskService），违反 DDD 单一职责原则。
> **实际执行时不能照抄，需要按业务场景重新设计**：
> - 按生命周期拆分：XxxLifecycleService、XxxQueryService
> - 按业务场景拆分：OutboundXxxService、InboundXxxService
> - 按职责拆分：XxxAssignmentService、XxxCancellationService
> 
> 以下清单仅作功能参考，不照抄命名。

**交付物**:

**Job 相关 Service（原 JobService 50+ 方法，需拆分）**:
- [ ] Job 生命周期管理
  - create(Job) - 创建 Job
  - update(Job) - 更新 Job
  - batchUpdate(List) - 批量更新
  - get(String) - 获取单个
  - delete(String) - 删除
  - batchCreate(List) - 批量创建
- [ ] Job 查询服务
  - search(JobQuery) - 通用查询
  - searchByPaging(JobQuery) - 分页查询
  - findByTaskId(String) - 按 TaskId 查询
  - findByIds(List) - 按 ID 列表查询
  - findByBusinessId(String) - 按业务 ID 查询
  - findByBusinessActionIds(Set, Boolean) - 按业务动作 ID 查询
  - searchJobListByIds(List) - 按 ID 列表搜索
  - searchJobListByTaskIds(List) - 按 TaskId 列表搜索
- [ ] Job 状态管理
  - cancelJob(String/Job) - 取消 Job
  - batchCancel(List) - 批量取消
  - cancelJobWithStatusValidation(Job) - 带状态验证取消
  - batchCancelWithStatusValidation(List) - 批量带状态验证取消
  - updateStatusByIds(List, ActionStatus) - 批量更新状态
  - updateExecutionStatusByIds(ExecutionStatus, List) - 更新执行状态
- [ ] Job 分配服务
  - assignToUserAtomically(String, String, ActionStatus) - 原子分配
  - assignJobAndInterLeavingAtomically(String, String, String) - 原子分配穿插任务
  - updateJobsWithSecondaryStatusAtomically(List, List, String, String) - 原子更新主次任务
  - validateJobAssignmentConsistency(Job, String) - 验证分配一致性
- [ ] Job 分组与统计
  - groupJobListByStrategy(List, StrategyConfiguration) - 按策略分组
  - groupJobsByLocation(List, List) - 按位置分组
  - groupJobsByLocationWithTrafficCapAwareness(List, List) - 带流量感知分组
  - getJobStatistics() - 获取统计信息
- [ ] Job 业务方法
  - pickSubmit(Job, PickResultRequestCmd) - 拣选提交
  - adjustPriority(String, Integer) - 调整优先级
  - updateCompletedQty(Job) - 更新完成数量
  - appendWorkTaskPoolWithLock(List, String, String) - 追加工作池

**Task 相关 Service（原 TaskService 40+ 方法，需拆分）**:
- [ ] Task 生命周期管理
  - create(Task) - 创建 Task（含资源锁定）
  - update(Task) - 更新 Task
  - get(String) - 获取单个
  - delete(String) - 删除
  - finishTask(String, TaskStatus) - 完成任务
  - forceClosedTask(String) - 强制关闭
  - forceCancelledTask(String) - 强制取消
- [ ] Task 查询服务
  - search(TaskQuery) - 通用查询
  - searchByPaging(TaskQuery) - 分页查询
  - searchInitTaskList() - 查询初始化任务
  - searchDecisionOnTaskList() - 查询决策中任务
  - searchByTaskTypeAndStatus(TaskType, TaskStatus) - 按类型状态查询
  - searchTaskListByTaskIds(List) - 按 ID 列表查询
  - searchTaskListByEquipmentAndStatuses(String, List) - 按设备状态查询
  - searchByBusinessId(String) - 按业务 ID 查询
  - searchUnFinishTasksByContainerCode(String) - 按容器查询未完成任务
- [ ] Task 状态管理
  - updateTaskManager(Task) - 更新任务管理器
  - updateStatusAndException(Task) - 更新状态和异常
  - updateStatusByIds(List, TaskStatus) - 批量更新状态
  - updateTaskStatusAndExceptionByIds(TaskStatus, String, List) - 批量更新状态异常
  - resetTasksForReassignment(List) - 重置任务待重新分配
  - resetTaskExecutorAndContainer(Task) - 重置执行者和容器
- [ ] Task 设备/容器管理
  - updateEquipmentCodeByIds(String, List) - 批量更新设备编码
  - updateEquipmentCodeIfNeed(String, Task) - 按需更新设备编码
  - updateContainerCodeByIds(String, List) - 批量更新容器编码
- [ ] Task 统计服务
  - getDailyTaskStatistics() - 获取每日统计
  - getTaskBacklogStatistics() - 获取积压统计
  - getHourlyTaskStatistics() - 获取小时统计
  - countActiveTasksByContainerCode(String) - 统计活跃任务
  - countInProgressTasksByStationCode(String) - 统计进行中任务
- [ ] Task 业务方法
  - adjustPriority(String, Integer) - 调整优先级
  - pickSubmit(String, String, String) - 拣选提交
  - updateTaskDestinationAndNotify(Task, String, String) - 更新目的地并通知
  - sendTaskStatusChangeNotification(Task) - 发送状态变更通知
  - getTasksFromSteps(List) - 从 Step 获取 Task
  - sortTasks(List) - 任务排序

**Step 相关 Service（原 StepService 35+ 方法，需拆分）**:
- [ ] Step 生命周期管理
  - create(Step) - 创建 Step
  - update(Step) - 更新 Step
  - get(String) - 获取单个
  - delete(String) - 删除
  - batchCreate(List) - 批量创建
  - batchUpdate(List) - 批量更新
  - cancel(Step) - 取消单个
  - batchCancel(List) - 批量取消
  - batchCancelByIds(List) - 按 ID 批量取消
- [ ] Step 查询服务
  - search(StepQuery) - 通用查询
  - searchByPaging(StepQuery) - 分页查询
  - findStepListByTaskId(String) - 按 TaskId 查询
  - findStepListByTaskIds(List) - 按 TaskId 列表查询
  - searchByIds(List) - 按 ID 列表查询
  - searchByJobIds(List) - 按 JobId 列表查询
  - getStepByJobId(String) - 按 JobId 获取单个
  - searchInProgressStepByTaskId(String) - 查询进行中 Step
  - searchInProgressStepListByEquipmentCode(String) - 按设备查询进行中
  - searchInProgressAndCancellingStepListByEquipmentCode(String) - 按设备查询进行中和取消中
  - searchInProgressStepList() - 查询所有进行中
  - searchInProgressStepsByToLocationNames(List) - 按目标位置查询
- [ ] Step 状态管理
  - updateStatusAndException(Step) - 更新状态和异常
  - updateStatusByIds(StepStatus, List) - 批量更新状态
  - updateToPointCodeByIds(String, List) - 批量更新目标点
  - updateEquipmentCodeByIds(String, List) - 批量更新设备编码
  - updateStepJobIds(String, List) - 更新 JobIds
- [ ] Step 统计与检查
  - countInProgressStepsByEquipmentCode(String) - 统计设备进行中 Step
  - countInProgressStepsByTaskId(String) - 统计任务进行中 Step
  - isAllStepsFinished(String) - 检查是否全部完成
- [ ] Step 业务方法
  - checkStepCompletion(Step, StrategyConfiguration, List, List) - 检查 Step 完成状态
  - isEquipmentAtTargetPosition(Step) - 检查设备是否到达目标
  - isContainerOnEquipment(List, String) - 检查容器是否在设备上
  - equipmentCurrentTargetPointCode(String) - 获取设备当前目标点
  - getExecutionStatus(Step) - 获取执行状态
  - createStepFromTask(Task, List) - 从 Task 创建 Step
  - determineStepType(TaskType) - 确定 Step 类型

**Command 相关 Service（原 CommandService 50+ 方法，需拆分）**:
- [ ] Command 生命周期管理
  - create(Command) - 创建 Command
  - update(Command) - 更新 Command
  - get(String) - 获取单个
  - delete(String) - 删除
  - cancel(Command) - 取消命令
  - cancelWithoutSend(Command) - 取消但不发送
  - resend(String) - 重发命令
- [ ] Command 查询服务
  - search(CommandQuery) - 通用查询
  - searchByPaging(CommandQuery) - 分页查询
  - searchInProgressCommandListByEquipmentCode(String) - 按设备查询进行中
  - searchCommandsByEquipmentCodeAndInProgress(String) - 按设备查询进行中
  - searchInProgressCommandList() - 查询所有进行中
  - searchInProgressCommandList(List) - 按 StepId 列表查询进行中
  - searchPendingCommandList() - 查询待处理
  - searchCommandListByStatus(CmdStatus) - 按状态查询
  - searchByJobIds(List) - 按 JobId 列表查询
  - searchByJobIdsAndCmdType(List, CmdType) - 按 JobId 和类型查询
  - searchUnFinishCommandListByContainerCode(String) - 按容器查询未完成
  - searchInProgressCommandListByContainerCodeAndCmdType(String, CmdType) - 按容器和类型查询
  - searchCompletedCommandListByStepIdsAndCmdType(List, CmdType) - 按 StepId 和类型查询已完成
  - getCommandByEquipmentCodeAndCmdType(String, CmdType) - 按设备和类型获取
- [ ] Command 状态管理
  - updateStatusByIds(CmdStatus, List) - 批量更新状态
  - updateStatusById(CmdStatus, String) - 更新单个状态
  - updateMasterCmdIdByIds(Map) - 批量更新主命令 ID
  - updateExceptionMessageById(String, String) - 更新异常信息
  - updateExceptionMessageByIds(String, List) - 批量更新异常信息
  - updateEquipmentCodeById(String, String) - 更新设备编码
  - updateContainerCodeById(String, String) - 更新容器编码
  - updateContainerCodeByIdIfEmpty(String, String) - 按需更新容器编码
- [ ] Command 发送服务
  - commandSend(Equipment, Command) - 发送命令
  - commandSend(Equipment, List) - 批量发送命令
  - commandSendByEquipment(Equipment) - 按设备发送命令
  - sendCancelCommand(Command) - 发送取消命令
  - sendCancelCommandToEquipment(Command) - 发送取消命令到设备
  - sendCancelCommandToEquipment(Command, JSONObject) - 发送取消命令到设备（带参数）
- [ ] Command 辅助方法
  - isEquipmentBasedCommand(Command) - 判断是否设备命令
  - isEquipmentModelBasedCommand(Command) - 判断是否设备型号命令
  - isEquipmentWebSocketCommand(Command) - 判断是否设备 WebSocket 命令
  - isStationWebSocketCommand(Command) - 判断是否站点 WebSocket 命令
  - isSkipCommand(Command) - 判断是否跳过命令
  - shouldSkipCommandSend(Command) - 判断是否应跳过发送
  - getLastClosedCommandChangeTime(String) - 获取最后关闭命令时间
  - handlePackDecision(Command) - 处理打包决策

**其他辅助 Service**:
- [ ] StrategyConfigurationService - 策略配置服务
- [ ] ActionModeMatchingService - 动作模式匹配服务
- [ ] JobHistoryService - Job 历史记录服务
- [ ] JobHistoryTrackerService - Job 历史追踪服务
- [ ] TaskActionGroupService - Task 动作组管理服务
- [ ] CommandMessageService - Command 消息处理服务
- [ ] CommandStatusChangeService - Command 状态变更服务
- [ ] TaskValidator - 任务验证器
- [ ] ResourceLockService - 资源锁服务

**包路径**: com.t5.wcs.domain.task.service（需按业务场景重新组织）

---

### 任务 2.6：CommandResponseHandler 命令响应处理模块（8h）

**目标**: 实现设备命令响应处理模块，从原 wcs-app 迁移完整的响应处理机制

> **[架构说明]** CommandResponseHandler 归属 wcs-lite-app 而非 device-app
> 
> 原因：CommandResponseHandler 大量依赖 wcs-lite-app 的业务服务（JobService、TaskService、StepService、CommandService、EquipmentBehaviorDecisionService），
> 其核心职责是"处理命令响应后的业务逻辑"，而非设备通信。
> 
> 分层设计：
> - device-app：负责设备通信（Client 发送命令，返回 BaseCommandResponse）
> - wcs-lite-app：负责响应处理（CommandResponseHandler 处理响应，执行业务逻辑）

**交付物**:

**接口与基类**:
- [ ] CommandResponseHandler 接口
  ```java
  public interface CommandResponseHandler {
      CommandDecisionResult handleResponseWithResult(Command command, BaseCommandResponse response);
      CommandDecisionResult handleCancelResponseWithResult(Command command, BaseCommandResponse response);
      void handleFetchResponse(Command command, BaseCommandResponse response);
      boolean supports(BaseCommandResponse response);
  }
  ```
- [ ] AbstractCommandResponseHandler 抽象基类
  - 依赖：CommandRepository、WCSWebSocketMessagePublisher
  - 模板方法：handleResponseWithResult() = preHandle + doHandleWithResult + postHandle
  - preHandle() - 更新命令状态为 IN_PROGRESS
  - postHandle() - 处理条码读取成功、发送 WebSocket 消息
  - handleBarcodeReadingSuccess() - 条码读取成功处理
  - extractBarcodeFromResponse() - 从响应提取条码
  - sendBarcodeResultToStation() - 发送条码结果到工位
  - 抽象方法：doHandleWithResult()、doFetchHandle()

**决策结果模型**:
- [ ] CommandDecisionResult
  - 字段：shouldContinue（Boolean）、status（CommandProcessingStatus）、nextCommandType（CmdType）、decisionContext（Object）、errorMessage（String）
  - 状态枚举 CommandProcessingStatus：SUCCESS_CONTINUE、SUCCESS_COMPLETE、FAILED、PENDING_CONFIRMATION、SKIPPED
  - 静态工厂方法：continueDecision()、completeDecision()、failed(errorMessage)
  - 判断方法：isFailed()、isSuccess()

**厂商 Handler 实现（9个）**:
- [ ] HermesCommandResponseHandler - Hermes AGV 响应处理
  - 依赖：StepService、EquipmentService、MapService、PointService、JobService、CommandService、EquipmentBehaviorDecisionService
  - 处理 SYNC_MAP 命令、更新设备位置、创建停止充电命令、触发设备行为决策
- [ ] LibiaoAirRobCommandResponseHandler - 立标料箱机器人响应处理
  - 依赖：StepService、EquipmentService
  - 处理 AirRob 任务特定逻辑
- [ ] LibiaoOPSCommandResponseHandler - 立标 OPS 响应处理
- [ ] LibiaoOverflowCommandResponseHandler - 立标溢出处理响应
- [ ] LanxinAGVCommandResponseHandler - 蓝芯 AGV 响应处理
- [ ] KeyenceBarcodeReaderCommandResponseHandler - 基恩士扫码枪响应处理
- [ ] OptmvBarcodeReaderCommandResponseHandler - 奥普特扫码枪响应处理
- [ ] YoungSunLabelerCommandResponseHandler - 永顺贴标机响应处理
- [ ] YoungSunPrinterSocketCommandResponseHandler - 永顺打印机响应处理

**包路径**: com.t5.wcs.domain.task.handler

**参考**: 原 wcs-app 的 domain/task/handler 目录

---

### 任务 2.7：辅助 Service 详细定义（4h）

**目标**: 补充任务 2.5 中辅助 Service 的详细方法定义

**TaskValidator 任务验证器**:
- [ ] validate(Task) - 主验证方法
  - validateContainer() - 验证容器（获取容器规格）
  - validateTaskType() - 验证任务类型
    - CHARGE/MOVEMENT：需要设备编码
    - TRANSPORT：需要容器编码
  - validateDestination() - 验证目的地
    - POINT_CODE：验证点位存在
    - STATION_CODE：验证工位存在
    - STATION_TYPE：验证工位类型存在
    - LOCATION：验证位置关系存在
  - validatePriority() - 验证优先级（1-100范围）
- [ ] validateBusinessTask(Task) - 业务任务验证
  - validateBusinessIdIdUniqueness() - 业务 ID 唯一性

**ResourceLockService 资源锁服务**:
- [ ] isResourceAvailable(mapCode, stationCode) - 检查资源是否可用
- [ ] lockResource(mapCode, stationCode) - 锁定资源（Redis 分布式锁，24小时防死锁）
- [ ] unlockResource(mapCode, stationCode) - 释放资源锁
  - 休息站资源：设置60秒过期
  - 非休息站资源：直接删除锁
- [ ] unlockResourceByTask(Task) - 按任务释放资源
- [ ] lockResourceByTask(Task) - 按任务锁定资源

**包路径**: 
- TaskValidator: com.t5.wcs.domain.task.service
- ResourceLockService: com.t5.wcs.domain.common.service

---

## 验收标准

1. FacilityAppClient 和 DeviceAppClient 能正常调用（Mock 测试）
2. Flowable 配置正确，能加载 BPMN 流程定义
3. BaseWcsDelegate 能正确执行并创建 Task
4. ReceiveTask 能正确等待回调
5. 所有代码有单元测试覆盖

---

## 注意事项

- Flowable 7.1.0 是唯一支持 Spring Boot 3.x 的版本
- 使用 ReceiveTask 实现异步等待
- 回调到达时使用 RuntimeService.trigger() 恢复流程
- facility-app 和 device-app 是独立部署的应用

---

最后更新：2025-12-24
