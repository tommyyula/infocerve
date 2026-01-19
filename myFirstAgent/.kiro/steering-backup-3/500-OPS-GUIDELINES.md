---
inclusion: manual
---

# 运维规范

## 核心原则

[重要] Bug 修复必须使用 task-manager 深度应用

Bug 排查完整流程：
```
1. research_mode - 进入研究模式，系统性收集信息
2. process_thought - 多轮深度思考（复杂问题 50+ 轮）
3. plan_task - 规划排查任务
4. split_tasks - 拆分为可执行的排查步骤
5. execute_task - 逐步执行排查
6. verify_task - 验证修复效果（评分 >= 80 才算通过）
```

---

## task-manager 深度应用

### 阶段 1：问题澄清（research_mode）

```
research_mode({
  topic: "问题描述",
  currentState: "当前收集到的信息",
  nextSteps: "下一步排查方向"
})
```

必须收集：
- 错误现象（日志、截图、错误码）
- 复现步骤
- 影响范围
- 最近变更

### 阶段 2：深度分析（process_thought）

```
process_thought({
  thought: "分析内容",
  thought_number: 1,
  total_thoughts: 50,  // 复杂问题至少 50 轮
  stage: "Analysis",
  next_thought_needed: true
})
```

分析要点：
- 梳理完整调用链
- 识别所有可能的异常点
- 逐个分析触发条件
- 使用反证法验证假设

### 阶段 3：任务拆分（split_tasks）

将排查步骤拆分为任务：
- 任务 1：验证假设 A
- 任务 2：验证假设 B
- 任务 3：修复代码
- 任务 4：编写回归测试
- 任务 5：验证修复效果

### 阶段 4：执行与验证

每个任务必须：
- execute_task 执行
- verify_task 验证（评分 >= 80 才算通过）

---

## 排查原则

[重要] 禁止猜测 - 不能根据文档示例推断实际配置
[重要] 先确认再改 - 任何代码修改前必须与用户确认
[重要] 查实际数据 - 用数据库查询、日志、API 响应验证假设
[重要] 不确定就问 - 无法验证时直接询问用户
[重要] 用 MCP 前先问 - 使用 mysql_query 前先问用户用哪个数据库

---

## 结论验证（反证法）

得出"配置错误"或"代码缺陷"结论前，必须：

1. 识别依赖关系：找出依赖同一配置/代码的其他功能
2. 检查功能状态：这些功能是否正常工作？
3. 逻辑验证：
   - 其他功能正常 -> 配置/代码本身没问题 -> 排除该假设
   - 其他功能也异常 -> 可能是配置/代码问题 -> 继续验证

---

## 数据库问题排查

发现不一致时，禁止假设任何一方是"正确的"：

1. 收集信息：DDL 脚本、DESCRIBE 实际结构、代码实体定义
2. 对比差异：列出所有不一致的地方
3. 列出可疑点：不做假设，把所有可能性都列出来
4. 询问用户：让用户确认设计意图

---

## 500 错误排查

步骤 1：尝试获取日志
步骤 2：无日志时使用 task-manager 深度分析
```
1. research_mode - 进入研究模式
2. process_thought - 50+ 轮深度思考
   - 梳理完整调用链
   - 识别所有可能的异常点
   - 逐个分析触发条件
3. split_tasks - 拆分排查任务
4. 与用户确认最可能的原因
5. execute_task - 执行修复
6. verify_task - 验证修复效果
```

---

## 常见问题速查

401 Unauthorized - Token 存储不一致，检查 Nacos 配置
404 Not Found - API 路径错误，检查前端部署版本
500 Internal Error - 后端异常，查看日志或代码分析
数据不更新 - 浏览器缓存，URL 加 ?nocache=1

---

## BUG 文档维护

修复后更新 .kiro/bugs/ 目录下的文档：

```
修复详情
- 修复时间：YYYY-MM-DD
- task-manager 任务ID：xxx
- 修改的文件：
  1. path/to/file.java - 修改说明
- 修复方案：简要描述
- 验证结果：verify_task 评分

状态: 已修复
```
