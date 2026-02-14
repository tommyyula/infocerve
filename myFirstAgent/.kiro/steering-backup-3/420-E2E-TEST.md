---
inclusion: manual
---

# E2E 测试与 MCP 自动化规范

---

## 核心原则

1. 全自动 - 测试通过 MCP 自动执行
2. 阻塞式 - 失败时停止并尝试修复
3. 智能重试 - 自动分析、修复、重试（最多 3 次）
4. 状态追踪 - 记录每个测试的执行状态

---

## 单元测试执行

### 执行命令

```bash
# 前端
cd frontend && npm run test -- --testPathPattern="{模块}" --run

# 后端
./gradlew test --tests "{测试类}"
```

### 执行流程

```
1. executePwsh 运行测试
2. 解析输出（PASS/FAIL）
3. 失败 -> 提取错误 -> 修复 -> 重试
4. 通过 -> 继续下一任务
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

---

## Playwright MCP 工具

### 导航

```typescript
mcp_playwright_browser_navigate({ url: 'http://localhost:5173' });
```

### 页面快照

```typescript
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

### 关闭

```typescript
mcp_playwright_browser_close();
```

---

## 错误处理

### 错误类型与处理

断言失败 - 检查逻辑或更新预期
元素未找到 - 更新选择器或等待
超时 - 增加等待或检查加载
类型错误 - 检查类型定义
网络错误 - 检查服务器状态

### 自动修复流程

```
1. 捕获错误 -> 识别类型
2. 定位问题 -> 读取代码、测试、状态
3. 分析原因 -> 对比预期/实际
4. 生成方案 -> 修复代码/测试/配置
5. 应用修复 -> strReplace/fsWrite
6. 验证 -> 重新运行
7. 仍失败 -> 重试（最多 3 次）或报告
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
```

### 停止

```typescript
await controlPwshProcess({
  action: 'stop',
  processId: 123
});
```

---

## 注意事项

1. 超时设置 - 为命令设置合理超时
2. 并行/串行 - 单元测试可并行，E2E 建议串行
3. 资源清理 - 测试后关闭浏览器、停止服务器
4. 日志保存 - 保存所有输出便于分析
5. 重试限制 - 最多 3 次，避免无限循环

