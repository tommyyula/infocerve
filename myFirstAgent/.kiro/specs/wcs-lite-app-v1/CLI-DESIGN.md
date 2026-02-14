# WCS 运维 CLI 设计文档

## 一、概述

### 1.1 设计目标

提供一个运维命令行接口，让运维人员可以通过 Web 终端界面执行运维操作，包括：
- 查询 Job/Task/Workflow 状态
- 人工干预 Workflow（暂停、恢复、重试、跳过）
- 查看系统配置和设备状态

### 1.2 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端 Web 终端界面                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  WCS CLI v1.0                                             │  │
│  │  Type 'help' for available commands.                      │  │
│  │                                                           │  │
│  │  wcs> job list --status IN_PROGRESS                       │  │
│  │  ┌────────────┬──────────┬─────────────┬────────────────┐ │  │
│  │  │ Job ID     │ Type     │ Status      │ Created        │ │  │
│  │  ├────────────┼──────────┼─────────────┼────────────────┤ │  │
│  │  │ JOB_001    │ OUTBOUND │ IN_PROGRESS │ 12-18 10:00:00 │ │  │
│  │  │ JOB_002    │ OUTBOUND │ IN_PROGRESS │ 12-18 10:05:00 │ │  │
│  │  └────────────┴──────────┴─────────────┴────────────────┘ │  │
│  │                                                           │  │
│  │  wcs> workflow retry JOB_001                              │  │
│  │  [OK] Workflow JOB_001 retry triggered.                   │  │
│  │                                                           │  │
│  │  wcs> _                                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 CLI 引擎                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  CliController                                            │  │
│  │  POST /wcs/cli/execute                                │  │
│  │  { "command": "job list --status IN_PROGRESS" }           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  CliEngine                                                │  │
│  │  - 解析命令                                               │  │
│  │  - 路由到对应的 CommandHandler                            │  │
│  │  - 格式化输出                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ JobCommand  │     │ Workflow    │     │ System      │       │
│  │ Handler     │     │ Command     │     │ Command     │       │
│  │             │     │ Handler     │     │ Handler     │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```


---

## 二、后端 CLI 引擎设计

### 2.1 API 接口

```java
/**
 * CLI 控制器
 * 提供命令行执行接口
 */
@RestController
@RequiredArgsConstructor
public class CliController {

    private final CliEngine cliEngine;

    /**
     * 执行 CLI 命令
     * POST /wcs/cli/execute
     */
    @PostMapping("/wcs/cli/execute")
    public R<CliResponse> execute(@RequestBody CliRequest request) {
        return R.ok(cliEngine.execute(request.getCommand()));
    }

    /**
     * 获取命令帮助
     * GET /wcs/cli/help
     */
    @GetMapping("/wcs/cli/help")
    public R<String> help(@RequestParam(required = false) String command) {
        return R.ok(cliEngine.getHelp(command));
    }

    /**
     * 获取命令自动补全建议
     * GET /wcs/cli/suggest
     */
    @GetMapping("/wcs/cli/suggest")
    public R<List<String>> suggest(@RequestParam String input) {
        return R.ok(cliEngine.suggest(input));
    }
}
```

### 2.2 请求/响应模型

```java
/**
 * CLI 请求
 */
@Data
public class CliRequest {
    /** 命令字符串 */
    private String command;
}

/**
 * CLI 响应
 */
@Data
public class CliResponse {
    /** 是否成功 */
    private boolean success;
    /** 输出类型：TEXT / TABLE / JSON */
    private String outputType;
    /** 输出内容 */
    private String output;
    /** 错误信息（如果失败） */
    private String error;
    /** 执行耗时（毫秒） */
    private long duration;
}
```

### 2.3 CLI 引擎核心类

```java
/**
 * CLI 引擎
 * 负责解析命令、路由到处理器、格式化输出
 */
@Component
@RequiredArgsConstructor
public class CliEngine {

    private final Map<String, CommandHandler> handlers;

    /**
     * 执行命令
     * @param commandLine 命令行字符串，如 "job list --status IN_PROGRESS"
     */
    public CliResponse execute(String commandLine) {
        long startTime = System.currentTimeMillis();
        try {
            // 1. 解析命令
            ParsedCommand parsed = parseCommand(commandLine);
            
            // 2. 查找处理器
            CommandHandler handler = handlers.get(parsed.getCommand());
            if (handler == null) {
                return CliResponse.error("Unknown command: " + parsed.getCommand());
            }
            
            // 3. 执行命令
            CommandResult result = handler.execute(parsed.getSubCommand(), parsed.getArgs());
            
            // 4. 格式化输出
            return CliResponse.success(result);
            
        } catch (Exception e) {
            return CliResponse.error(e.getMessage());
        } finally {
            // 记录执行耗时
        }
    }

    /**
     * 解析命令行
     * "job list --status IN_PROGRESS" 
     * -> { command: "job", subCommand: "list", args: {status: "IN_PROGRESS"} }
     */
    private ParsedCommand parseCommand(String commandLine) {
        // 解析逻辑
    }
}
```

### 2.4 命令处理器接口

```java
/**
 * 命令处理器接口
 */
public interface CommandHandler {
    
    /** 命令名称，如 "job", "workflow", "system" */
    String getCommand();
    
    /** 执行子命令 */
    CommandResult execute(String subCommand, Map<String, String> args);
    
    /** 获取帮助信息 */
    String getHelp();
    
    /** 获取自动补全建议 */
    List<String> suggest(String subCommand, String partialArg);
}
```

---

## 三、命令定义

### 3.1 Job 命令

```
job list [--status <status>] [--type <type>] [--limit <n>]
    列出 Job 列表
    --status: PENDING | IN_PROGRESS | COMPLETED | FAILED | CANCELLED
    --type: OUTBOUND | EMPTY_CONTAINER_RETURN
    --limit: 返回数量，默认 20

job show <jobId>
    显示 Job 详情，包括 Task 列表

job cancel <jobId> [--reason <reason>]
    取消 Job

示例：
    wcs> job list --status IN_PROGRESS
    wcs> job show JOB_001
    wcs> job cancel JOB_001 --reason "客户取消订单"
```

### 3.2 Workflow 命令

```
workflow show <jobId>
    显示 Workflow 执行状态，包括各节点状态

workflow pause <jobId>
    暂停 Workflow 执行

workflow resume <jobId>
    恢复 Workflow 执行

workflow retry <jobId>
    重试当前失败的节点

workflow skip <jobId>
    跳过当前节点，继续执行下一个

workflow goto <jobId> <nodeId>
    跳转到指定节点执行

示例：
    wcs> workflow show JOB_001
    wcs> workflow pause JOB_001
    wcs> workflow retry JOB_001
    wcs> workflow skip JOB_001
```

### 3.3 Task 命令

```
task list <jobId>
    列出 Job 下的所有 Task

task show <taskId>
    显示 Task 详情

task complete <taskId>
    手动完成 Task（用于人工任务）

task fail <taskId> --reason <reason>
    手动标记 Task 失败

示例：
    wcs> task list JOB_001
    wcs> task show TASK_001
    wcs> task complete TASK_001
```

### 3.4 System 命令

```
system status
    显示系统状态（Job 统计、设备状态等）

system config
    显示系统配置

device list
    列出所有设备

device show <deviceId>
    显示设备详情

station list
    列出所有站点

示例：
    wcs> system status
    wcs> device list
```

### 3.5 帮助命令

```
help
    显示所有可用命令

help <command>
    显示指定命令的帮助

示例：
    wcs> help
    wcs> help job
    wcs> help workflow
```


---

## 四、命令处理器实现示例

### 4.1 Job 命令处理器

```java
@Component
@RequiredArgsConstructor
public class JobCommandHandler implements CommandHandler {

    private final JobApplicationService jobService;

    @Override
    public String getCommand() {
        return "job";
    }

    @Override
    public CommandResult execute(String subCommand, Map<String, String> args) {
        switch (subCommand) {
            case "list":
                return listJobs(args);
            case "show":
                return showJob(args);
            case "cancel":
                return cancelJob(args);
            default:
                return CommandResult.error("Unknown sub-command: " + subCommand);
        }
    }

    private CommandResult listJobs(Map<String, String> args) {
        String status = args.get("status");
        String type = args.get("type");
        int limit = Integer.parseInt(args.getOrDefault("limit", "20"));

        List<JobDto> jobs = jobService.listJobs(status, type, limit);

        // 构建表格输出
        TableBuilder table = new TableBuilder()
            .addColumn("Job ID", 15)
            .addColumn("Type", 12)
            .addColumn("Status", 12)
            .addColumn("Created", 20);

        for (JobDto job : jobs) {
            table.addRow(
                job.getJobId(),
                job.getJobType(),
                job.getStatus(),
                formatTime(job.getCreatedTime())
            );
        }

        return CommandResult.table(table.build());
    }

    private CommandResult showJob(Map<String, String> args) {
        String jobId = args.get("_arg0"); // 位置参数
        if (jobId == null) {
            return CommandResult.error("Usage: job show <jobId>");
        }

        JobDetailDto job = jobService.getJobDetail(jobId);
        if (job == null) {
            return CommandResult.error("Job not found: " + jobId);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Job ID:      ").append(job.getJobId()).append("\n");
        sb.append("Type:        ").append(job.getJobType()).append("\n");
        sb.append("Status:      ").append(job.getStatus()).append("\n");
        sb.append("Created:     ").append(formatTime(job.getCreatedTime())).append("\n");
        sb.append("Updated:     ").append(formatTime(job.getUpdatedTime())).append("\n");
        sb.append("\n");
        sb.append("Tasks:\n");

        for (TaskDto task : job.getTasks()) {
            sb.append("  - ").append(task.getTaskId())
              .append(" [").append(task.getTaskType()).append("]")
              .append(" ").append(task.getStatus())
              .append("\n");
        }

        return CommandResult.text(sb.toString());
    }

    private CommandResult cancelJob(Map<String, String> args) {
        String jobId = args.get("_arg0");
        String reason = args.getOrDefault("reason", "Manual cancellation");

        if (jobId == null) {
            return CommandResult.error("Usage: job cancel <jobId> [--reason <reason>]");
        }

        try {
            jobService.cancelJob(jobId, reason);
            return CommandResult.success("Job " + jobId + " cancelled.");
        } catch (Exception e) {
            return CommandResult.error("Failed to cancel job: " + e.getMessage());
        }
    }

    @Override
    public String getHelp() {
        return """
            Job Commands:
            
              job list [--status <status>] [--type <type>] [--limit <n>]
                  List jobs
                  
              job show <jobId>
                  Show job details
                  
              job cancel <jobId> [--reason <reason>]
                  Cancel a job
            """;
    }
}
```

### 4.2 Workflow 命令处理器

```java
@Component
@RequiredArgsConstructor
public class WorkflowCommandHandler implements CommandHandler {

    private final WorkflowApplicationService workflowService;

    @Override
    public String getCommand() {
        return "workflow";
    }

    @Override
    public CommandResult execute(String subCommand, Map<String, String> args) {
        String jobId = args.get("_arg0");
        
        if (jobId == null && !subCommand.equals("help")) {
            return CommandResult.error("Usage: workflow <subcommand> <jobId>");
        }

        switch (subCommand) {
            case "show":
                return showWorkflow(jobId);
            case "pause":
                return pauseWorkflow(jobId);
            case "resume":
                return resumeWorkflow(jobId);
            case "retry":
                return retryWorkflow(jobId);
            case "skip":
                return skipWorkflow(jobId);
            case "goto":
                String nodeId = args.get("_arg1");
                return gotoNode(jobId, nodeId);
            default:
                return CommandResult.error("Unknown sub-command: " + subCommand);
        }
    }

    private CommandResult showWorkflow(String jobId) {
        WorkflowStatusDto status = workflowService.getWorkflowStatus(jobId);
        
        StringBuilder sb = new StringBuilder();
        sb.append("Workflow Status for Job: ").append(jobId).append("\n");
        sb.append("Status: ").append(status.getStatus()).append("\n");
        sb.append("Current Node: ").append(status.getCurrentNodeId()).append("\n");
        sb.append("\n");
        sb.append("Nodes:\n");

        for (NodeStatusDto node : status.getNodes()) {
            String icon = getStatusIcon(node.getStatus());
            sb.append("  ").append(icon).append(" ")
              .append(node.getNodeId()).append(": ")
              .append(node.getNodeName())
              .append(" [").append(node.getStatus()).append("]");
            
            if (node.getCompletedTime() != null) {
                sb.append(" (").append(formatTime(node.getCompletedTime())).append(")");
            }
            if (node.getErrorMessage() != null) {
                sb.append("\n      Error: ").append(node.getErrorMessage());
            }
            sb.append("\n");
        }

        return CommandResult.text(sb.toString());
    }

    private String getStatusIcon(String status) {
        return switch (status) {
            case "COMPLETED" -> "[✓]";
            case "RUNNING" -> "[►]";
            case "FAILED" -> "[✗]";
            case "SKIPPED" -> "[○]";
            default -> "[ ]";
        };
    }

    private CommandResult pauseWorkflow(String jobId) {
        try {
            workflowService.pauseWorkflow(jobId);
            return CommandResult.success("Workflow " + jobId + " paused.");
        } catch (Exception e) {
            return CommandResult.error("Failed to pause: " + e.getMessage());
        }
    }

    private CommandResult resumeWorkflow(String jobId) {
        try {
            workflowService.resumeWorkflow(jobId);
            return CommandResult.success("Workflow " + jobId + " resumed.");
        } catch (Exception e) {
            return CommandResult.error("Failed to resume: " + e.getMessage());
        }
    }

    private CommandResult retryWorkflow(String jobId) {
        try {
            workflowService.retryCurrentNode(jobId);
            return CommandResult.success("Workflow " + jobId + " retry triggered.");
        } catch (Exception e) {
            return CommandResult.error("Failed to retry: " + e.getMessage());
        }
    }

    private CommandResult skipWorkflow(String jobId) {
        try {
            workflowService.skipCurrentNode(jobId);
            return CommandResult.success("Current node skipped for " + jobId + ".");
        } catch (Exception e) {
            return CommandResult.error("Failed to skip: " + e.getMessage());
        }
    }

    private CommandResult gotoNode(String jobId, String nodeId) {
        if (nodeId == null) {
            return CommandResult.error("Usage: workflow goto <jobId> <nodeId>");
        }
        try {
            workflowService.gotoNode(jobId, nodeId);
            return CommandResult.success("Jumped to node " + nodeId + ".");
        } catch (Exception e) {
            return CommandResult.error("Failed to goto: " + e.getMessage());
        }
    }

    @Override
    public String getHelp() {
        return """
            Workflow Commands:
            
              workflow show <jobId>
                  Show workflow execution status
                  
              workflow pause <jobId>
                  Pause workflow execution
                  
              workflow resume <jobId>
                  Resume workflow execution
                  
              workflow retry <jobId>
                  Retry current failed node
                  
              workflow skip <jobId>
                  Skip current node
                  
              workflow goto <jobId> <nodeId>
                  Jump to specified node
            """;
    }
}
```


---

## 五、前端 Web 终端实现指南

### 5.1 技术选型

| 方案 | 说明 | 推荐度 |
|------|------|--------|
| **xterm.js** | 功能完整的终端模拟器，支持 ANSI 颜色 | ⭐⭐⭐⭐⭐ |
| **react-terminal** | React 组件，简单易用 | ⭐⭐⭐⭐ |
| **vue-terminal** | Vue 组件 | ⭐⭐⭐⭐ |
| **自己实现** | 简单的输入输出框 | ⭐⭐⭐ |

**推荐：xterm.js** - 功能完整，支持颜色、光标、历史记录等

### 5.2 前端架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      WCS 运维控制台                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tab: [终端] [Job列表] [设备状态] [系统配置]             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  WCS CLI v1.0                                           │    │
│  │  Type 'help' for available commands.                    │    │
│  │                                                         │    │
│  │  wcs> _                                                 │    │
│  │                                                         │    │
│  │                                                         │    │
│  │                                                         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  状态栏: 连接状态 | 当前用户 | 系统时间                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 核心组件实现

#### 5.3.1 终端组件（React + xterm.js）

```tsx
// WcsTerminal.tsx
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface WcsTerminalProps {
  onCommand: (command: string) => Promise<string>;
}

const WcsTerminal: React.FC<WcsTerminalProps> = ({ onCommand }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const commandBuffer = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 初始化终端
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        green: '#4ec9b0',
        yellow: '#dcdcaa',
        red: '#f14c4c',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    // 显示欢迎信息
    term.writeln('\x1b[32mWCS CLI v1.0\x1b[0m');
    term.writeln("Type 'help' for available commands.");
    term.writeln('');
    writePrompt(term);

    // 处理输入
    term.onKey(({ key, domEvent }) => {
      const char = key;
      
      if (domEvent.keyCode === 13) {
        // Enter - 执行命令
        term.writeln('');
        handleCommand(term, commandBuffer.current);
        commandBuffer.current = '';
      } else if (domEvent.keyCode === 8) {
        // Backspace
        if (commandBuffer.current.length > 0) {
          commandBuffer.current = commandBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.keyCode === 38) {
        // Up arrow - 历史记录
        if (historyIndex.current < historyRef.current.length - 1) {
          historyIndex.current++;
          setCommandFromHistory(term);
        }
      } else if (domEvent.keyCode === 40) {
        // Down arrow - 历史记录
        if (historyIndex.current > 0) {
          historyIndex.current--;
          setCommandFromHistory(term);
        }
      } else if (domEvent.keyCode === 9) {
        // Tab - 自动补全
        domEvent.preventDefault();
        handleAutoComplete(term);
      } else if (char.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
        // 普通字符
        commandBuffer.current += char;
        term.write(char);
      }
    });

    // 窗口大小变化时重新适配
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const writePrompt = (term: Terminal) => {
    term.write('\x1b[33mwcs>\x1b[0m ');
  };

  const handleCommand = async (term: Terminal, command: string) => {
    if (command.trim() === '') {
      writePrompt(term);
      return;
    }

    // 保存到历史记录
    historyRef.current.unshift(command);
    historyIndex.current = -1;

    try {
      // 调用后端 API
      const result = await onCommand(command);
      term.writeln(result);
    } catch (error) {
      term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
    }

    writePrompt(term);
  };

  const setCommandFromHistory = (term: Terminal) => {
    // 清除当前行
    term.write('\r\x1b[K');
    writePrompt(term);
    
    const historyCommand = historyRef.current[historyIndex.current] || '';
    commandBuffer.current = historyCommand;
    term.write(historyCommand);
  };

  const handleAutoComplete = async (term: Terminal) => {
    // 调用后端自动补全 API
    // 实现略
  };

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '500px',
        padding: '10px',
        backgroundColor: '#1e1e1e',
        borderRadius: '4px',
      }} 
    />
  );
};

export default WcsTerminal;
```

#### 5.3.2 API 调用服务

```tsx
// cliService.ts
import axios from 'axios';

const API_BASE = '/wcs/cli';

export interface CliResponse {
  success: boolean;
  outputType: 'TEXT' | 'TABLE' | 'JSON';
  output: string;
  error?: string;
  duration: number;
}

export const executeCommand = async (command: string): Promise<string> => {
  const response = await axios.post<{ data: CliResponse }>(`${API_BASE}/execute`, {
    command,
  });

  const result = response.data.data;
  
  if (!result.success) {
    throw new Error(result.error || 'Command failed');
  }

  return result.output;
};

export const getHelp = async (command?: string): Promise<string> => {
  const response = await axios.get<{ data: string }>(`${API_BASE}/help`, {
    params: { command },
  });
  return response.data.data;
};

export const getSuggestions = async (input: string): Promise<string[]> => {
  const response = await axios.get<{ data: string[] }>(`${API_BASE}/suggest`, {
    params: { input },
  });
  return response.data.data;
};
```

#### 5.3.3 使用示例

```tsx
// WcsConsolePage.tsx
import React from 'react';
import WcsTerminal from './WcsTerminal';
import { executeCommand } from './cliService';

const WcsConsolePage: React.FC = () => {
  const handleCommand = async (command: string): Promise<string> => {
    return await executeCommand(command);
  };

  return (
    <div className="wcs-console-page">
      <h2>WCS 运维控制台</h2>
      <WcsTerminal onCommand={handleCommand} />
    </div>
  );
};

export default WcsConsolePage;
```

### 5.4 输出格式化

后端返回的输出需要支持 ANSI 颜色码，前端 xterm.js 会自动渲染：

```java
// 后端输出格式化工具
public class CliOutputFormatter {
    
    // ANSI 颜色码
    public static final String RESET = "\u001B[0m";
    public static final String RED = "\u001B[31m";
    public static final String GREEN = "\u001B[32m";
    public static final String YELLOW = "\u001B[33m";
    public static final String BLUE = "\u001B[34m";
    public static final String CYAN = "\u001B[36m";

    public static String success(String message) {
        return GREEN + "[OK] " + RESET + message;
    }

    public static String error(String message) {
        return RED + "[ERROR] " + RESET + message;
    }

    public static String warning(String message) {
        return YELLOW + "[WARN] " + RESET + message;
    }

    public static String highlight(String text) {
        return CYAN + text + RESET;
    }
}
```

### 5.5 功能清单

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 基础命令执行 | P0 | 输入命令，显示结果 |
| 命令历史 | P0 | 上下箭头浏览历史 |
| 颜色输出 | P1 | 成功/失败/警告不同颜色 |
| 自动补全 | P1 | Tab 键补全命令 |
| 表格输出 | P1 | 列表数据表格化显示 |
| 复制粘贴 | P2 | 支持复制输出内容 |
| 多终端 | P2 | 支持多个终端标签页 |

---

## 六、工作量估算

| 模块 | 工作量 | 说明 |
|------|--------|------|
| 后端 CLI 引擎 | 2 人天 | 命令解析、路由、格式化 |
| Job 命令处理器 | 1 人天 | list/show/cancel |
| Workflow 命令处理器 | 1.5 人天 | show/pause/resume/retry/skip/goto |
| Task 命令处理器 | 0.5 人天 | list/show/complete |
| System 命令处理器 | 0.5 人天 | status/config |
| 前端终端组件 | 1.5 人天 | xterm.js 集成 |
| 前端页面集成 | 0.5 人天 | 页面布局、路由 |

**总计：约 7.5 人天**

---

## 七、后续扩展

### 7.1 WebSocket 实时输出

对于长时间运行的命令，可以使用 WebSocket 实时推送输出：

```java
// 后端 WebSocket 端点
@ServerEndpoint("/ws/cli")
public class CliWebSocket {
    // 实时推送命令执行输出
}
```

### 7.2 权限控制

```java
// 命令权限注解
@RequirePermission("wcs:workflow:operate")
public CommandResult retryWorkflow(String jobId) {
    // ...
}
```

### 7.3 审计日志

```java
// 记录所有 CLI 操作
@Aspect
public class CliAuditAspect {
    @Around("execution(* *.execute(..))")
    public Object audit(ProceedingJoinPoint pjp) {
        // 记录操作人、命令、时间、结果
    }
}
```

---

*文档版本：V1.0*
*创建时间：2025-12-18*
*作者：Kiro AI*
