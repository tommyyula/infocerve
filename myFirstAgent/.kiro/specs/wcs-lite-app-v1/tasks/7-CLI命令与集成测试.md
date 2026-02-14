# WCS-1651 wcs-lite-app v1 版本后端开发——7-CLI 命令与集成测试

## 任务概述

- **Jira Issue**: WCS-1651
- **预估工时**: 4 人天（32 小时）
- **前置依赖**: WCS-1650（接入层 API 与运维功能）、WCS-1670（facility-app 资源管理 API）、WCS-1680（device-app RCS 任务 API）
- **后续任务**: 无（V1 版本完成）

## 参考文档

- 需求文档: [requirements.md](../requirements.md)
  - 第 7 节「运维需求」- CLI 部分
  - 第 8 节「测试需求」
- 设计文档: [design.md](../design.md)
  - 第九章「运维接口设计」- CLI 命令定义、命令处理器实现

---

## 任务清单

### 任务 7.1：Job/Workflow CLI 命令（8h）

**目标**: 实现 Job 和 Workflow 相关的 CLI 命令处理器

**交付物**:
- [ ] 实现 BatchOperationTokenService（[重要] 两阶段确认凭证服务）
  ```java
  @Service
  public class BatchOperationTokenService {
      // Redis key: wcs:cli:batch:{token}
      // 过期时间: 5 分钟
      // 一次性使用
      
      public String generateToken(String operation, Map<String, String> conditions, 
                                  List<String> affectedJobIds);
      public BatchOperationToken validateAndConsume(String token, String operation, 
                                                     Map<String, String> conditions);
  }
  ```
- [ ] 实现 JobCommandHandler（[重要] 批量操作使用两阶段确认）
  ```java
  @Component
  public class JobCommandHandler implements CommandHandler {
      @Override
      public String getCommand() { return "job"; }
      
      // 单个操作
      // job list [--status <status>] [--limit <n>]
      // job show <jobId>
      // job cancel <jobId>
      // job retry <jobId>
      
      // 批量操作（两阶段确认）
      // 第一阶段：job cancel --status PENDING --before 2025-12-17
      //   返回：预览 + 凭证
      // 第二阶段：job cancel --status PENDING --before 2025-12-17 --confirm --token=xxx
      //   返回：执行结果
  }
  ```
  - `job list` - 列出 Job（支持 --status、--limit、--type 过滤）
  - `job show <jobId>` - 查看 Job 详情
  - `job cancel <jobId>` - 取消单个 Job
  - `job cancel --status <status> [--before <datetime>]` - 批量取消（两阶段）
  - `job retry <jobId>` - 重试单个 Job
  - `job retry --status FAILED [--type <type>]` - 批量重试（两阶段）
- [ ] 实现 WorkflowCommandHandler
  ```java
  @Component
  public class WorkflowCommandHandler implements CommandHandler {
      @Override
      public String getCommand() { return "workflow"; }
      
      // workflow show <jobId>
      // workflow pause <jobId>
      // workflow resume <jobId>
      // workflow retry <jobId>
      // workflow skip <jobId>
      // workflow goto <jobId> <nodeId>
  }
  ```
  - `workflow show <jobId>` - 查看流程状态
  - `workflow pause <jobId>` - 暂停流程
  - `workflow resume <jobId>` - 恢复流程
  - `workflow retry <jobId>` - 重试当前节点
  - `workflow skip <jobId>` - 跳过当前节点
  - `workflow goto <jobId> <nodeId>` - 跳转到指定节点执行
- [ ] 实现 TaskCommandHandler
  - `task list --job <jobId>` - 列出 Job 的所有 Task
  - `task show <taskId>` - 查看 Task 详情
  - `task complete <taskId>` - 手动完成 Task（用于人工任务）
  - `task fail <taskId> --reason <reason>` - 手动标记 Task 失败
- [ ] 编写命令处理器单元测试（包含两阶段确认测试）

**参考**: design.md 第 9.5 节「CLI 命令定义」、第 9.5.0 节「批量操作两阶段确认机制」、第 9.6.2 节「Job 命令处理器（含两阶段确认）」

---

### 任务 7.2：CLI WebSocket 终端（8h）

**目标**: 实现 CLI WebSocket 端点和终端交互

**交付物**:
- [ ] 创建 CliWebSocketEndpoint（WebSocket 端点，扩展任务 4.4 的 REST 端点）
  ```java
  @Component
  @ServerEndpoint("/ws/cli")
  public class CliWebSocketEndpoint {
      @OnOpen
      public void onOpen(Session session);
      
      @OnMessage
      public void onMessage(String message, Session session);
      
      @OnClose
      public void onClose(Session session);
  }
  ```
- [ ] 实现命令解析器 CommandParser
  ```java
  public class CommandParser {
      public static CliRequest parse(String commandLine);
      // 支持：
      // - 空格分隔参数
      // - 引号包裹的参数（含空格）
      // - --option=value 格式
      // - --option value 格式
      // - -o value 短选项格式
  }
  ```
- [ ] 实现输出格式化器 OutputFormatter
  ```java
  public class OutputFormatter {
      public static String formatTable(List<Map<String, Object>> data, List<String> columns);
      public static String formatJson(Object data);
      public static String formatTree(Object data);
  }
  ```
- [ ] 实现会话管理 CliSessionManager
- [ ] 编写 CLI WebSocket 单元测试

**参考**: design.md 第 9.7 节「前端终端实现指南」

---

### 任务 7.3：端到端集成测试（8h）

**目标**: 编写完整的端到端测试用例

**交付物**:
- [ ] 编写出库流程端到端测试
  ```java
  @SpringBootTest
  public class OutboundFlowE2ETest {
      @Test
      void testOutboundFlow_Success() {
          // 1. 创建 Job
          // 2. 验证 Workflow 启动
          // 3. 模拟 RCS 回调
          // 4. 验证 Task 状态变更
          // 5. 验证 Job 完成
      }
      
      @Test
      void testOutboundFlow_TaskFailed_Retry() {
          // 测试任务失败后重试
      }
  }
  ```
- [ ] 编写空容器回收流程端到端测试
  ```java
  @SpringBootTest
  public class EmptyContainerReturnE2ETest {
      @Test
      void testEmptyContainerReturn_Success();
      
      @Test
      void testEmptyContainerReturn_WithAsrs();
  }
  ```
- [ ] 编写补货/移库/盘点流程端到端测试（V1 预实现）
  ```java
  @SpringBootTest
  public class ReplenishmentFlowE2ETest {
      @Test
      void testReplenishment_Standard() {
          // 标准补货流程：ASRS出库 -> AMR搬运 -> 上架确认
      }
      
      @Test
      void testReplenishment_Simple() {
          // 简化补货流程：AMR搬运 -> 上架确认
      }
  }
  
  @SpringBootTest
  public class TransferFlowE2ETest {
      @Test
      void testTransfer_Standard() {
          // 标准移库流程：取货确认 -> AMR搬运 -> 放货确认
      }
      
      @Test
      void testTransfer_AsrsToAsrs() {
          // 立库间移库：ASRS出库 -> AMR搬运 -> ASRS入库
      }
  }
  
  @SpringBootTest
  public class InventoryFlowE2ETest {
      @Test
      void testInventory_Standard() {
          // 标准盘点流程：ASRS出库 -> AMR搬运到盘点站 -> 盘点确认 -> AMR搬运回库 -> ASRS入库
      }
      
      @Test
      void testInventory_InPlace() {
          // 原地盘点流程：盘点确认
      }
  }
  ```
- [ ] 编写回调机制集成测试
  ```java
  @SpringBootTest
  public class CallbackIntegrationTest {
      @Test
      void testRcsCallback_TaskCompleted();
      
      @Test
      void testRcsCallback_TaskFailed();
      
      @Test
      void testRcsCallback_WorkflowResume();
  }
  ```
- [ ] 编写异常场景测试
  - Job 创建失败（参数校验）
  - Workflow 执行失败（节点异常）
  - 回调超时处理
  - 并发回调处理

**参考**: requirements.md 第 8 节「测试需求」

---

### 任务 7.4：文档与收尾（8h）

**目标**: 整理文档，完成 V1 版本收尾工作

**交付物**:
- [ ] 整理 API 文档
  - 确保所有 Controller 有 Swagger 注解
  - 生成 OpenAPI 文档
  - 编写 API 使用示例
- [ ] 整理 CLI 命令手册
  ```markdown
  # WCS-Lite CLI 命令手册
  
  ## Job 命令
  - job list [--status <status>] [--limit <n>]
  - job show <jobId>
  - job cancel <jobId>
  - job retry <jobId>
  
  ## Workflow 命令
  - workflow show <jobId>
  - workflow pause <jobId>
  - workflow resume <jobId>
  - workflow retry <jobId>
  - workflow skip <jobId>
  - workflow goto <jobId> <nodeId>
  
  ## Task 命令
  - task list --job <jobId>
  - task show <taskId>
  - task complete <taskId>
  - task fail <taskId> --reason <reason>
  
  ## System 命令
  - system status
  - system config
  
  ## Device 命令
  - device list
  - device show <deviceId>
  
  ## Station 命令
  - station list
  
  ## Help 命令
  - help
  - help <command>
  ```
- [ ] 整理部署文档
  - 环境要求
  - 配置说明
  - 启动步骤
  - 健康检查
- [ ] 代码审查与优化
  - 检查代码规范
  - 优化性能瓶颈
  - 清理无用代码
- [ ] 更新 design.md 和 requirements.md（如有变更）

---

## 验收标准

1. 所有 CLI 命令能正常执行
2. WebSocket 终端能正常交互
3. 端到端测试全部通过
4. API 文档完整可用
5. CLI 命令手册完整
6. 代码符合项目规范

---

## V1 版本完成检查清单

### 功能完成度
- [ ] Job 创建、查询、取消、重试
- [ ] Workflow 执行、暂停、恢复、重试、跳过
- [ ] Task 状态管理
- [ ] RCS 回调处理
- [ ] 消息总线集成
- [ ] 运维 REST API
- [ ] CLI 命令行工具

### Job 类型支持（V1 预实现）
- [ ] OUTBOUND（出库）- 完整实现
- [ ] EMPTY_CONTAINER_RETURN（空容器回收）- 完整实现
- [ ] REPLENISHMENT（补货）- 框架 + 默认规则
- [ ] TRANSFER（移库）- 框架 + 默认规则
- [ ] INVENTORY（盘点）- 框架 + 默认规则

### 质量检查
- [ ] 单元测试覆盖率 > 70%
- [ ] 集成测试通过
- [ ] 端到端测试通过
- [ ] 无编译警告
- [ ] 代码规范检查通过

### 文档完成度
- [ ] API 文档
- [ ] CLI 命令手册
- [ ] 部署文档
- [ ] 设计文档更新

---

## 注意事项

- CLI 命令解析需要处理各种边界情况（空参数、特殊字符等）
- WebSocket 需要处理连接断开和重连
- 端到端测试需要使用 @Transactional 保证测试隔离
- 文档要保持与代码同步更新
