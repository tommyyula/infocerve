---
inclusion: manual
---

# MCP 自动化测试执行规范

本规范定义了如何通过 MCP 实现测试的自动化执行，无需人工干预。

## 核心原则

1. **全自动** - 测试通过 MCP 自动执行
2. **阻塞式** - 失败时停止并尝试修复
3. **智能重试** - 自动分析、修复、重试（最多 3 次）
4. **状态追踪** - 记录每个测试的执行状态

---

## 单元测试执行

### 执行命令

```bash
# 前端
cd frontend && npm run test -- --testPathPattern="{模块}" --run

# 后端
cd backend && npm run test -- --testPathPattern="{模块}" --run
```

### 执行流程

```
1. executePwsh 运行测试
2. 解析输出（PASS/FAIL）
3. 失败 → 提取错误 → 修复 → 重试
4. 通过 → 继续下一任务
```

### 结果解析

```typescript
// 检查测试结果
if (output.includes('FAIL')) {
  // 提取失败信息
  const error = output.match(/● (.+)\n\n(.+)/);
  // 分析并修复
}
```

---

## E2E 测试执行

### 前置条件

```typescript
// 1. 启动开发服务器
controlPwshProcess({
  action: 'start',
  command: 'npm run dev',
  path: 'frontend'
});

// 2. 等待服务就绪
mcp_playwright_browser_navigate({ url: 'http://localhost:5173' });
mcp_playwright_browser_wait_for({ text: '页面标题' });
```

### 执行命令

```bash
npx playwright test test/e2e/{story}/ --reporter=json
```

### 执行流程

```
1. 确保服务启动（listProcesses + controlPwshProcess）
2. 等待服务就绪（navigate + wait_for）
3. 运行 Playwright 测试
4. 解析 JSON 报告
5. 失败 → 获取快照 → 分析 → 修复 → 重试
6. 通过 → 继续
```

---

## Playwright MCP 工具

### 导航

```typescript
mcp_playwright_browser_navigate({ url: 'http://localhost:5173' });
```

### 页面快照

```typescript
// 获取可访问性快照，验证页面状态
mcp_playwright_browser_snapshot();
```

### 点击

```typescript
mcp_playwright_browser_click({
  element: '按钮描述',
  ref: 'button[data-testid="btn"]'
});
```

### 输入

```typescript
mcp_playwright_browser_type({
  element: '输入框描述',
  ref: 'input[name="field"]',
  text: '输入内容'
});
```

### 键盘

```typescript
mcp_playwright_browser_press_key({ key: 'ArrowUp' });
mcp_playwright_browser_press_key({ key: 'Enter' });
```

### 等待

```typescript
// 等待文本出现
mcp_playwright_browser_wait_for({ text: '加载完成' });

// 等待文本消失
mcp_playwright_browser_wait_for({ textGone: '加载中' });

// 等待时间
mcp_playwright_browser_wait_for({ time: 2 });
```

### 截图

```typescript
mcp_playwright_browser_take_screenshot({
  filename: 'test-result.png'
});
```

### 控制台日志

```typescript
mcp_playwright_browser_console_messages({ level: 'error' });
```

### 关闭

```typescript
mcp_playwright_browser_close();
```

---

## 功能测试流程

### 完整示例

```typescript
// 1. 导航
await mcp_playwright_browser_navigate({ url: 'http://localhost:5173' });

// 2. 验证初始状态
const snapshot1 = await mcp_playwright_browser_snapshot();

// 3. 执行操作
await mcp_playwright_browser_click({
  element: '开始按钮',
  ref: 'button.start'
});

// 4. 等待响应
await mcp_playwright_browser_wait_for({ text: '游戏开始' });

// 5. 验证结果
const snapshot2 = await mcp_playwright_browser_snapshot();

// 6. 截图保存
await mcp_playwright_browser_take_screenshot({
  filename: 'game-started.png'
});

// 7. 清理
await mcp_playwright_browser_close();
```

---

## 错误处理

### 错误类型

| 类型 | 识别 | 处理 |
|-----|-----|-----|
| 断言失败 | `expect(...).toBe(...)` | 检查逻辑或更新预期 |
| 元素未找到 | `Element not found` | 更新选择器或等待 |
| 超时 | `Timeout` | 增加等待或检查加载 |
| 类型错误 | `TypeError` | 检查类型定义 |
| 网络错误 | `Network error` | 检查服务器状态 |

### 自动修复流程

```
1. 捕获错误 → 识别类型
2. 定位问题 → 读取代码、测试、状态
3. 分析原因 → 对比预期/实际
4. 生成方案 → 修复代码/测试/配置
5. 应用修复 → strReplace/fsWrite
6. 验证 → 重新运行
7. 仍失败 → 重试（最多 3 次）或报告
```

### 调试信息获取

```typescript
// 失败时获取调试信息
const snapshot = await mcp_playwright_browser_snapshot();
const console = await mcp_playwright_browser_console_messages({ level: 'error' });
await mcp_playwright_browser_take_screenshot({ filename: 'error.png' });
```

---

## 服务器管理

### 启动

```typescript
await controlPwshProcess({
  action: 'start',
  command: 'npm run dev',
  path: 'frontend'
});
```

### 检查状态

```typescript
const processes = await listProcesses();
// 检查是否有运行中的开发服务器
```

### 停止

```typescript
await controlPwshProcess({
  action: 'stop',
  processId: 123
});
```

---

## 测试验证规则

### 单元测试验证

每个功能完成后：

```markdown
- [ ] 1.1 实现功能
- [ ] 1.2 **运行单元测试**
  - 命令：`npm run test -- --testPathPattern="Module" --run`
  - 通过条件：所有测试 PASS
  - 失败处理：分析 → 修复 → 重试（≤3次）
```

### E2E 测试验证

每个 Story 完成后：

```markdown
- [ ] N.1 **运行 E2E 测试**
  - 前置：启动开发服务器
  - 命令：`npx playwright test test/e2e/story/`
  - 通过条件：所有测试通过
  - 失败处理：获取快照 → 分析 → 修复 → 重试
```

### 功能测试验证

页面开发完成后：

```markdown
- [ ] N.2 **Playwright 功能测试**
  - 使用 MCP 执行交互测试
  - 验证页面功能正常
  - 截图保存测试证据
```

---

## tasks.md 格式

### 带自动化验证的任务

```markdown
- [ ] 1.1 实现游戏引擎
  - 需求：1.1, 1.2
  - 测试：UT-001, UT-002
  - **自动验证**：
    - `executePwsh({ command: 'npm run test -- --testPathPattern="GameEngine" --run', path: 'frontend' })`
    - 通过：所有测试 PASS
    - 失败：分析 → 修复 → 重试

- [ ] 2.1 Story 完成验证
  - **自动验证**：
    - 启动：`controlPwshProcess({ action: 'start', command: 'npm run dev' })`
    - E2E：`executePwsh({ command: 'npx playwright test test/e2e/story1/' })`
    - 功能：Playwright MCP 交互测试
```

---

## 注意事项

1. **超时设置** - 为命令设置合理超时
2. **并行/串行** - 单元测试可并行，E2E 建议串行
3. **资源清理** - 测试后关闭浏览器、停止服务器
4. **日志保存** - 保存所有输出便于分析
5. **重试限制** - 最多 3 次，避免无限循环
