# WCS-Lite 扩展指南

> 本文档指导如何在现有架构基础上扩展新的 Job 类型和 Workflow 流程
> 
> 工作流引擎：Flowable 7.1.0（BPMN 2.0）

---

## 一、扩展概述

### 1.1 V1 已实现的流程

- OUTBOUND（出库流程）: outbound - 立库出库 - AMR搬运 - 拣选墙拣选 - 打包 - 输送出库
- EMPTY_CONTAINER_RETURN（空容器回收）: emptyContainerReturn - AMR搬运空容器到缓冲区/立库

### 1.2 待扩展的流程

- REPLENISHMENT（补货流程）: replenishment - 立库出库 - AMR搬运 - 拣选墙补货
- TRANSFER（移库流程）: transfer - 从A位置搬运到B位置
- INVENTORY（盘点流程）: inventory - 立库出库 - 盘点 - 立库入库

---

## 二、扩展步骤总览

扩展一个新的 Job 类型需要以下步骤：

```
1. 添加枚举值
   |
   v
2. 设计流程节点
   |
   v
3. 实现新节点（如需要）- 继承 BaseWcsDelegate
   |
   v
4. 创建流程定义文件（.bpmn20.xml）
   |
   v
5. 插入流程定义数据（processDefinitionKey）
   |
   v
6. 测试验证
```

---

## 三、详细扩展步骤

### 步骤 1：添加枚举值

#### 1.1 JobType 枚举

文件：`domain/job/entity/JobType.java`

```java
public enum JobType {
    OUTBOUND,                   // 出库（V1已实现）
    EMPTY_CONTAINER_RETURN,     // 空容器回收（V1已实现）
    REPLENISHMENT,              // 补货（待扩展）
    TRANSFER,                   // 移库（待扩展）
    INVENTORY                   // 盘点（待扩展）
}
```

#### 1.2 TaskType 枚举（如有新任务类型）

文件：`domain/job/entity/TaskType.java`

```java
public enum TaskType {
    RCS_MISSION,    // RCS 搬运任务
    ASRS_PICK,      // 立库出库
    ASRS_PUT,       // 立库入库
    HUMAN_TASK,     // 人工任务
    DEVICE_IO,      // 设备 IO 操作
    INVENTORY_COUNT // 盘点任务（新增）
}
```

---

### 步骤 2：设计流程节点

#### 2.1 分析业务流程

以补货流程为例：

```
补货流程（REPLENISHMENT）：

1. 立库出库（asrsPickDelegate）
   - 从立库取出补货容器
   |
   v
2. 等待立库回调（receiveTask: waitAsrsCallback）
   |
   v
3. AMR 搬运（amrMoveDelegate）
   - 从立库缓冲区搬运到拣选墙
   |
   v
4. 等待 AMR 回调（receiveTask: waitAmrCallback）
   |
   v
5. 拣选墙补货（pickWallReplenishDelegate）[新节点]
   - 点亮格口指示灯
   - 等待操作员确认补货完成
   |
   v
6. 等待人工确认（receiveTask: waitHumanConfirm）
   |
   v
7. 空容器处理（可选）
   - 如果容器空了，触发空容器回收
```

#### 2.2 识别可复用节点

- asrsPickDelegate: 可复用 - 立库出库逻辑相同
- amrMoveDelegate: 可复用 - AMR搬运逻辑相同，只是站点不同
- pickWallReplenishDelegate: 需新建 - 补货逻辑与拣选不同

---

### 步骤 3：实现新节点

#### 3.1 节点实现模板（Flowable JavaDelegate）

文件：`application/workflow/delegate/PickWallReplenishDelegate.java`

```java
@Component("pickWallReplenishDelegate")
@Slf4j
public class PickWallReplenishDelegate extends BaseWcsDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        // 1. 获取流程变量
        String jobId = (String) execution.getVariable("jobId");
        String cellId = (String) execution.getVariable("cellId");
        String skuCode = (String) execution.getVariable("skuCode");
        Integer qty = (Integer) execution.getVariable("qty");
        
        log.info("拣选墙补货节点开始执行，jobId: {}, 格口: {}, SKU: {}, 数量: {}", 
            jobId, cellId, skuCode, qty);
        
        // 2. 加载 Job
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new WcsException(WcsErrorCode.JOB_NOT_FOUND));
        
        // 3. 创建人工任务
        Task task = createTask(job, TaskType.HUMAN_TASK);
        Map<String, Object> params = new HashMap<>();
        params.put("taskName", "拣选墙补货");
        params.put("cellId", cellId);
        params.put("skuCode", skuCode);
        params.put("qty", qty);
        params.put("instructions", String.format("请将 %d 个 %s 补货到格口 %s", qty, skuCode, cellId));
        task.setParams(params);
        taskRepository.update(task);
        
        // 4. 点亮格口指示灯（如果有设备）
        // pickWallDevice.lightCell(cellId, qty, LightColor.YELLOW);
        
        // 5. 设置流程变量，供后续 Receive Task 使用
        execution.setVariable("currentTaskId", task.getTaskId());
        
        log.info("补货任务已创建，等待操作员确认，taskId: {}", task.getTaskId());
        // 流程会在后续的 Receive Task 处暂停，等待回调触发
    }
}
```

#### 3.2 节点命名规范

```
{业务动作}{设备/区域}Delegate

示例：
- asrsPickDelegate        - 立库出库
- asrsPutDelegate         - 立库入库
- amrMoveDelegate         - AMR搬运
- pickWallPickDelegate    - 拣选墙拣选
- pickWallReplenishDelegate - 拣选墙补货
- conveyorMoveDelegate    - 输送线搬运
- inventoryCountDelegate  - 盘点计数
```

---

### 步骤 4：创建流程定义文件

#### 4.1 BPMN 2.0 流程定义

文件：`src/main/resources/processes/replenishment.bpmn20.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://wcs.example.com/replenishment">
    
    <process id="replenishment" name="补货流程" isExecutable="true">
        
        <!-- 开始事件 -->
        <startEvent id="start" name="开始"/>
        
        <!-- 立库出库 -->
        <serviceTask id="asrsPickDelegate" name="立库出库"
                     flowable:delegateExpression="${asrsPickDelegate}"/>
        
        <!-- 等待立库回调 -->
        <receiveTask id="waitAsrsCallback" name="等待立库回调"/>
        
        <!-- AMR 搬运 -->
        <serviceTask id="amrMoveDelegate" name="AMR搬运"
                     flowable:delegateExpression="${amrMoveDelegate}"/>
        
        <!-- 等待 AMR 回调 -->
        <receiveTask id="waitAmrCallback" name="等待AMR回调"/>
        
        <!-- 拣选墙补货 -->
        <serviceTask id="pickWallReplenishDelegate" name="拣选墙补货"
                     flowable:delegateExpression="${pickWallReplenishDelegate}"/>
        
        <!-- 等待人工确认 -->
        <receiveTask id="waitHumanConfirm" name="等待人工确认"/>
        
        <!-- 结束事件 -->
        <endEvent id="end" name="结束"/>
        
        <!-- 顺序流 -->
        <sequenceFlow id="flow1" sourceRef="start" targetRef="asrsPickDelegate"/>
        <sequenceFlow id="flow2" sourceRef="asrsPickDelegate" targetRef="waitAsrsCallback"/>
        <sequenceFlow id="flow3" sourceRef="waitAsrsCallback" targetRef="amrMoveDelegate"/>
        <sequenceFlow id="flow4" sourceRef="amrMoveDelegate" targetRef="waitAmrCallback"/>
        <sequenceFlow id="flow5" sourceRef="waitAmrCallback" targetRef="pickWallReplenishDelegate"/>
        <sequenceFlow id="flow6" sourceRef="pickWallReplenishDelegate" targetRef="waitHumanConfirm"/>
        <sequenceFlow id="flow7" sourceRef="waitHumanConfirm" targetRef="end"/>
        
    </process>
    
</definitions>
```

#### 4.2 流程定义文件命名规范

```
src/main/resources/processes/
  - outbound.bpmn20.xml              # 出库流程
  - empty-container-return.bpmn20.xml # 空容器回收
  - replenishment.bpmn20.xml         # 补货流程（新增）
  - transfer.bpmn20.xml              # 移库流程（新增）
  - inventory.bpmn20.xml             # 盘点流程（新增）
```

---

### 步骤 5：插入流程定义数据

#### 5.1 SQL 脚本

文件：`db-script/V1.1__add_replenishment_workflow.sql`

```sql
-- 补货流程定义
INSERT INTO wcs_workflow_definition (
    definitionId, workflowCode, workflowName, description, 
    jobType, isActive, version, processDefinitionKey, nodeConfigs,
    createdBy, createdTime
) VALUES (
    'DEF_REPLENISHMENT_V1',
    'replenishment',
    '补货流程V1',
    '立库出库 - AMR搬运 - 拣选墙补货',
    'REPLENISHMENT',
    1,
    1,
    'replenishment',
    '[
        {"nodeId": "asrsPickDelegate", "nodeType": "ASRS_PICK", "nodeName": "立库出库"},
        {"nodeId": "amrMoveDelegate", "nodeType": "RCS_MISSION", "nodeName": "AMR搬运"},
        {"nodeId": "pickWallReplenishDelegate", "nodeType": "HUMAN_TASK", "nodeName": "拣选墙补货"}
    ]',
    'system',
    NOW()
);
```

#### 5.2 节点配置说明

nodeConfigs 字段支持以下配置：

```json
{
    "nodeId": "amrMoveDelegate",       // 节点ID，对应 @Component 名称
    "nodeType": "RCS_MISSION",         // 节点类型，用于分类
    "nodeName": "AMR搬运",             // 节点显示名称
    "params": {                        // 节点参数（可选）
        "fromStation": "${job.fromStation}",  // 支持变量替换
        "toStation": "PICK_WALL_01",          // 固定值
        "priority": 5                          // 数值
    }
}
```

---

### 步骤 6：测试验证

#### 6.1 单元测试

```java
@SpringBootTest
class ReplenishmentWorkflowTest {
    
    @Autowired
    private JobApplicationService jobService;
    
    @Test
    void testReplenishmentJob() {
        // 1. 创建补货 Job
        CreateJobCmd cmd = new CreateJobCmd();
        cmd.setJobType(JobType.REPLENISHMENT);
        cmd.setJobNo("REP20251218001");
        cmd.setFromStation("ASRS_BUFFER_A");
        cmd.setToStation("PICK_WALL_01");
        cmd.setContainerId("TOTE001");
        cmd.setPayload(Map.of(
            "skuCode", "SKU001",
            "qty", 100,
            "cellId", "PW01-A-01"
        ));
        
        JobDto job = jobService.createJob(cmd);
        
        // 2. 验证 Job 创建成功
        assertNotNull(job.getJobId());
        assertEquals(JobStatus.PENDING, job.getStatus());
        
        // 3. 等待流程执行（Mock 环境会自动完成）
        // ...
    }
}
```

#### 6.2 集成测试检查清单

- [ ] Job 创建成功，状态为 PENDING
- [ ] 流程实例创建成功
- [ ] 各节点按顺序执行
- [ ] Receive Task 正确暂停流程
- [ ] 回调正确触发 runtimeService.trigger()
- [ ] Task 状态正确更新
- [ ] Job 完成后状态为 COMPLETED
- [ ] WMS 回调正确发送

---

## 四、具体流程扩展示例

### 4.1 补货流程（REPLENISHMENT）

#### 业务场景

拣选墙某个格口库存不足，需要从立库补货。

#### 流程设计

```
触发条件：WMS 检测到格口库存低于阈值
    |
    v
1. asrsPickDelegate - 立库出库
   - 从立库取出指定 SKU 的容器
   - 参数：containerId, skuCode
    |
    v
2. receiveTask: waitAsrsCallback - 等待立库回调
    |
    v
3. amrMoveDelegate - AMR 搬运
   - 从立库缓冲区搬运到拣选墙
   - 参数：fromStation=ASRS_BUFFER, toStation=PICK_WALL_01
    |
    v
4. receiveTask: waitAmrCallback - 等待 AMR 回调
    |
    v
5. pickWallReplenishDelegate - 拣选墙补货
   - 点亮目标格口
   - 等待操作员确认补货完成
   - 参数：cellId, skuCode, qty
    |
    v
6. receiveTask: waitHumanConfirm - 等待人工确认
    |
    v
7. (可选) 空容器处理
   - 如果容器空了，触发空容器回收子流程
```

#### API 调用示例

```json
POST /wcs/jobs

{
    "jobType": "REPLENISHMENT",
    "jobNo": "REP20251218001",
    "fromStation": "ASRS_BUFFER_A",
    "toStation": "PICK_WALL_01",
    "containerId": "TOTE001",
    "payload": {
        "skuCode": "SKU001",
        "qty": 100,
        "cellId": "PW01-A-01"
    },
    "callbackUrl": "http://wms/api/callback/replenishment"
}
```


---

### 4.2 移库流程（TRANSFER）

#### 业务场景

将货物从一个位置移动到另一个位置（如从A库区移到B库区）。

#### 流程设计

```
触发条件：WMS 发起移库指令
    |
    v
1. sourcePickDelegate - 源位置取货
   - 根据源位置类型选择：立库出库 / 货架取货
   - 参数：sourceType, sourceLocation
    |
    v
2. receiveTask: waitSourceCallback - 等待取货回调
    |
    v
3. amrMoveDelegate - AMR 搬运
   - 从源位置搬运到目标位置
   - 参数：fromStation, toStation
    |
    v
4. receiveTask: waitAmrCallback - 等待 AMR 回调
    |
    v
5. targetPutDelegate - 目标位置放货
   - 根据目标位置类型选择：立库入库 / 货架放货
   - 参数：targetType, targetLocation
    |
    v
6. receiveTask: waitTargetCallback - 等待放货回调
```

#### BPMN 流程定义（带条件分支）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://wcs.example.com/transfer">
    
    <process id="transfer" name="移库流程" isExecutable="true">
        
        <startEvent id="start"/>
        
        <!-- 源位置类型判断 -->
        <exclusiveGateway id="sourceTypeGateway" name="源位置类型"/>
        
        <!-- 立库出库分支 -->
        <serviceTask id="asrsPickDelegate" name="立库出库"
                     flowable:delegateExpression="${asrsPickDelegate}"/>
        <receiveTask id="waitAsrsPickCallback" name="等待立库出库回调"/>
        
        <!-- 货架取货分支 -->
        <serviceTask id="shelfPickDelegate" name="货架取货"
                     flowable:delegateExpression="${shelfPickDelegate}"/>
        <receiveTask id="waitShelfPickCallback" name="等待货架取货回调"/>
        
        <!-- 汇合网关 -->
        <exclusiveGateway id="pickJoinGateway" name="取货汇合"/>
        
        <!-- AMR 搬运 -->
        <serviceTask id="amrMoveDelegate" name="AMR搬运"
                     flowable:delegateExpression="${amrMoveDelegate}"/>
        <receiveTask id="waitAmrCallback" name="等待AMR回调"/>
        
        <!-- 目标位置类型判断 -->
        <exclusiveGateway id="targetTypeGateway" name="目标位置类型"/>
        
        <!-- 立库入库分支 -->
        <serviceTask id="asrsPutDelegate" name="立库入库"
                     flowable:delegateExpression="${asrsPutDelegate}"/>
        <receiveTask id="waitAsrsPutCallback" name="等待立库入库回调"/>
        
        <!-- 货架放货分支 -->
        <serviceTask id="shelfPutDelegate" name="货架放货"
                     flowable:delegateExpression="${shelfPutDelegate}"/>
        <receiveTask id="waitShelfPutCallback" name="等待货架放货回调"/>
        
        <!-- 汇合网关 -->
        <exclusiveGateway id="putJoinGateway" name="放货汇合"/>
        
        <endEvent id="end"/>
        
        <!-- 顺序流定义 -->
        <sequenceFlow sourceRef="start" targetRef="sourceTypeGateway"/>
        
        <!-- 源位置分支 -->
        <sequenceFlow sourceRef="sourceTypeGateway" targetRef="asrsPickDelegate">
            <conditionExpression xsi:type="tFormalExpression">${sourceType == 'ASRS'}</conditionExpression>
        </sequenceFlow>
        <sequenceFlow sourceRef="sourceTypeGateway" targetRef="shelfPickDelegate">
            <conditionExpression xsi:type="tFormalExpression">${sourceType == 'SHELF'}</conditionExpression>
        </sequenceFlow>
        
        <sequenceFlow sourceRef="asrsPickDelegate" targetRef="waitAsrsPickCallback"/>
        <sequenceFlow sourceRef="waitAsrsPickCallback" targetRef="pickJoinGateway"/>
        <sequenceFlow sourceRef="shelfPickDelegate" targetRef="waitShelfPickCallback"/>
        <sequenceFlow sourceRef="waitShelfPickCallback" targetRef="pickJoinGateway"/>
        
        <sequenceFlow sourceRef="pickJoinGateway" targetRef="amrMoveDelegate"/>
        <sequenceFlow sourceRef="amrMoveDelegate" targetRef="waitAmrCallback"/>
        <sequenceFlow sourceRef="waitAmrCallback" targetRef="targetTypeGateway"/>
        
        <!-- 目标位置分支 -->
        <sequenceFlow sourceRef="targetTypeGateway" targetRef="asrsPutDelegate">
            <conditionExpression xsi:type="tFormalExpression">${targetType == 'ASRS'}</conditionExpression>
        </sequenceFlow>
        <sequenceFlow sourceRef="targetTypeGateway" targetRef="shelfPutDelegate">
            <conditionExpression xsi:type="tFormalExpression">${targetType == 'SHELF'}</conditionExpression>
        </sequenceFlow>
        
        <sequenceFlow sourceRef="asrsPutDelegate" targetRef="waitAsrsPutCallback"/>
        <sequenceFlow sourceRef="waitAsrsPutCallback" targetRef="putJoinGateway"/>
        <sequenceFlow sourceRef="shelfPutDelegate" targetRef="waitShelfPutCallback"/>
        <sequenceFlow sourceRef="waitShelfPutCallback" targetRef="putJoinGateway"/>
        
        <sequenceFlow sourceRef="putJoinGateway" targetRef="end"/>
        
    </process>
    
</definitions>
```

#### API 调用示例

```json
POST /wcs/jobs

{
    "jobType": "TRANSFER",
    "jobNo": "TRF20251218001",
    "fromStation": "ASRS_BUFFER_A",
    "toStation": "ASRS_BUFFER_B",
    "containerId": "TOTE001",
    "payload": {
        "sourceType": "ASRS",
        "targetType": "ASRS",
        "reason": "库区调整"
    },
    "callbackUrl": "http://wms/api/callback/transfer"
}
```


---

### 4.3 盘点流程（INVENTORY）

#### 业务场景

对立库中的货物进行盘点，核实库存数量。

#### 流程设计

```
触发条件：WMS 发起盘点指令
    |
    v
1. asrsPickDelegate - 立库出库
   - 取出待盘点容器
   - 参数：containerId
    |
    v
2. receiveTask: waitAsrsPickCallback
    |
    v
3. amrMoveDelegate - AMR 搬运
   - 搬运到盘点工作站
   - 参数：fromStation=ASRS_BUFFER, toStation=INVENTORY_STATION
    |
    v
4. receiveTask: waitAmrToInventoryCallback
    |
    v
5. inventoryCountDelegate - 盘点计数（新节点）
   - 显示预期库存
   - 等待操作员输入实际数量
   - 记录差异
   - 参数：expectedQty, skuCode
    |
    v
6. receiveTask: waitInventoryCallback
    |
    v
7. amrMoveDelegate - AMR 搬运
   - 搬运回立库
   - 参数：fromStation=INVENTORY_STATION, toStation=ASRS_BUFFER
    |
    v
8. receiveTask: waitAmrToAsrsCallback
    |
    v
9. asrsPutDelegate - 立库入库
   - 放回立库
    |
    v
10. receiveTask: waitAsrsPutCallback
```

#### 新节点：inventoryCountDelegate

```java
@Component("inventoryCountDelegate")
@Slf4j
public class InventoryCountDelegate extends BaseWcsDelegate {
    
    @Override
    public void execute(DelegateExecution execution) {
        String jobId = (String) execution.getVariable("jobId");
        String skuCode = (String) execution.getVariable("skuCode");
        Integer expectedQty = (Integer) execution.getVariable("expectedQty");
        
        log.info("盘点节点开始执行，jobId: {}, SKU: {}, 预期数量: {}", 
            jobId, skuCode, expectedQty);
        
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new WcsException(WcsErrorCode.JOB_NOT_FOUND));
        
        // 创建盘点任务
        Task task = createTask(job, TaskType.INVENTORY_COUNT);
        Map<String, Object> params = new HashMap<>();
        params.put("taskName", "库存盘点");
        params.put("skuCode", skuCode);
        params.put("expectedQty", expectedQty);
        params.put("instructions", String.format("请盘点 SKU %s，预期数量 %d", skuCode, expectedQty));
        task.setParams(params);
        taskRepository.update(task);
        
        execution.setVariable("currentTaskId", task.getTaskId());
        
        log.info("盘点任务已创建，等待操作员输入实际数量，taskId: {}", task.getTaskId());
    }
}
```

#### 盘点任务完成 API

```json
POST /wcs/tasks/{taskId}/complete

{
    "result": "SUCCESS",
    "data": {
        "actualQty": 98,
        "difference": -2,
        "remark": "发现2个破损"
    }
}
```

---

## 五、高级扩展

### 5.1 条件分支流程（Exclusive Gateway）

使用 BPMN 的 Exclusive Gateway 实现条件分支：

```xml
<!-- 根据订单类型选择不同流程 -->
<exclusiveGateway id="orderTypeGateway" name="订单类型判断"/>

<sequenceFlow sourceRef="orderTypeGateway" targetRef="storePackDelegate">
    <conditionExpression xsi:type="tFormalExpression">${orderType == 'STORE'}</conditionExpression>
</sequenceFlow>

<sequenceFlow sourceRef="orderTypeGateway" targetRef="onlinePackDelegate">
    <conditionExpression xsi:type="tFormalExpression">${orderType == 'ONLINE'}</conditionExpression>
</sequenceFlow>
```

### 5.2 并行执行（Parallel Gateway）

使用 BPMN 的 Parallel Gateway 实现并行执行：

```xml
<!-- 并行分支 -->
<parallelGateway id="fork" name="并行开始"/>

<serviceTask id="task1Delegate" flowable:delegateExpression="${task1Delegate}"/>
<serviceTask id="task2Delegate" flowable:delegateExpression="${task2Delegate}"/>
<serviceTask id="task3Delegate" flowable:delegateExpression="${task3Delegate}"/>

<!-- 并行汇合 -->
<parallelGateway id="join" name="并行结束"/>

<sequenceFlow sourceRef="fork" targetRef="task1Delegate"/>
<sequenceFlow sourceRef="fork" targetRef="task2Delegate"/>
<sequenceFlow sourceRef="fork" targetRef="task3Delegate"/>

<sequenceFlow sourceRef="task1Delegate" targetRef="join"/>
<sequenceFlow sourceRef="task2Delegate" targetRef="join"/>
<sequenceFlow sourceRef="task3Delegate" targetRef="join"/>
```

### 5.3 子流程调用（Call Activity）

使用 BPMN 的 Call Activity 调用子流程：

```xml
<!-- 主流程 -->
<process id="mainProcess" name="主流程">
    <startEvent id="start"/>
    
    <serviceTask id="step1Delegate" flowable:delegateExpression="${step1Delegate}"/>
    
    <!-- 调用子流程 -->
    <callActivity id="callSubProcess" name="调用子流程"
                  calledElement="subProcess">
        <extensionElements>
            <flowable:in source="jobId" target="jobId"/>
            <flowable:out source="result" target="subProcessResult"/>
        </extensionElements>
    </callActivity>
    
    <serviceTask id="step3Delegate" flowable:delegateExpression="${step3Delegate}"/>
    
    <endEvent id="end"/>
    
    <sequenceFlow sourceRef="start" targetRef="step1Delegate"/>
    <sequenceFlow sourceRef="step1Delegate" targetRef="callSubProcess"/>
    <sequenceFlow sourceRef="callSubProcess" targetRef="step3Delegate"/>
    <sequenceFlow sourceRef="step3Delegate" targetRef="end"/>
</process>

<!-- 子流程 -->
<process id="subProcess" name="子流程">
    <startEvent id="subStart"/>
    <serviceTask id="subStep1Delegate" flowable:delegateExpression="${subStep1Delegate}"/>
    <serviceTask id="subStep2Delegate" flowable:delegateExpression="${subStep2Delegate}"/>
    <endEvent id="subEnd"/>
    
    <sequenceFlow sourceRef="subStart" targetRef="subStep1Delegate"/>
    <sequenceFlow sourceRef="subStep1Delegate" targetRef="subStep2Delegate"/>
    <sequenceFlow sourceRef="subStep2Delegate" targetRef="subEnd"/>
</process>
```

### 5.4 异常处理（Error Boundary Event）

使用 BPMN 的 Error Boundary Event 处理异常：

```xml
<serviceTask id="riskyDelegate" name="可能失败的任务"
             flowable:delegateExpression="${riskyDelegate}"/>

<!-- 错误边界事件 -->
<boundaryEvent id="errorBoundary" attachedToRef="riskyDelegate">
    <errorEventDefinition errorRef="businessError"/>
</boundaryEvent>

<!-- 错误处理任务 -->
<serviceTask id="errorHandlerDelegate" name="错误处理"
             flowable:delegateExpression="${errorHandlerDelegate}"/>

<sequenceFlow sourceRef="errorBoundary" targetRef="errorHandlerDelegate"/>
```

---

## 六、扩展检查清单

### 新增 Job 类型检查清单

- [ ] JobType 枚举已添加
- [ ] TaskType 枚举已添加（如有新类型）
- [ ] 流程节点已设计
- [ ] 新节点已实现（继承 BaseWcsDelegate，实现 JavaDelegate）
- [ ] 流程定义文件已创建（.bpmn20.xml）
- [ ] 数据库流程定义已插入（processDefinitionKey）
- [ ] 单元测试已编写
- [ ] 集成测试已通过
- [ ] API 文档已更新

### 新增节点检查清单

- [ ] 节点类已创建，继承 BaseWcsDelegate
- [ ] @Component 注解已添加，名称正确（xxxDelegate）
- [ ] execute(DelegateExecution) 方法已实现
- [ ] 流程变量正确获取和设置
- [ ] Task 创建正确
- [ ] 日志记录完整
- [ ] 异常处理正确

---

## 七、常见问题

### Q1: 如何复用现有节点但使用不同参数？

通过流程变量传递不同参数：

```java
// 启动流程时设置变量
Map<String, Object> variables = new HashMap<>();
variables.put("toStation", "PICK_WALL_01");  // 出库流程
// 或
variables.put("toStation", "PICK_WALL_02");  // 补货流程

runtimeService.startProcessInstanceByKey("processKey", variables);
```

节点中通过 `execution.getVariable()` 获取参数。

### Q2: 如何实现动态流程选择？

方案1：创建多个流程定义，根据条件选择

```java
String processKey = switch (job.getOrderType()) {
    case "STORE" -> "outbound_store";
    case "ONLINE" -> "outbound_online";
    default -> "outbound";
};
runtimeService.startProcessInstanceByKey(processKey, variables);
```

方案2：使用 Exclusive Gateway 在流程内部分支

```xml
<exclusiveGateway id="decision"/>
<sequenceFlow sourceRef="decision" targetRef="storeBranch">
    <conditionExpression>${orderType == 'STORE'}</conditionExpression>
</sequenceFlow>
```

### Q3: 如何处理流程中的异常？

1. 节点内部捕获异常，更新 Task 状态为 FAILED
2. 抛出 BpmnError，触发 Error Boundary Event
3. 流程实例状态会自动更新
4. WMS 回调会发送失败通知

### Q4: 如何支持流程重试？

```java
// Job 重试
jobService.retryJob(jobId);

// 内部实现
public void retryJob(String jobId) {
    Job job = jobRepository.findById(jobId);
    job.retry();  // FAILED -> IN_PROGRESS
    jobRepository.update(job);
    
    // 重新启动流程
    workflowApplicationService.startWorkflow(job);
}
```

### Q5: Receive Task 如何被触发？

回调到达后，通过 `runtimeService.trigger()` 触发：

```java
// 查找等待中的 Execution
Execution execution = runtimeService.createExecutionQuery()
    .processInstanceId(processInstanceId)
    .activityId("waitAmrCallback")  // Receive Task 的 ID
    .singleResult();

// 触发继续执行
runtimeService.trigger(execution.getId());
```

---

## 八、版本规划

- V1.0: 出库、空容器回收 - 已完成
- V1.1: 补货 - 2-3 人天
- V1.2: 移库 - 2-3 人天
- V1.3: 盘点 - 3-4 人天

---

*文档版本：V1.0*
*创建时间：2025-12-18*
*更新时间：2025-12-24*
*适用版本：WCS-Lite V1.0+*
*工作流引擎：Flowable 7.1.0*
