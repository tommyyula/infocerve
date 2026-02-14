---
inclusion: always
---

# 核心规则

## Steering 文件命名规范

文件格式：{前缀编号}-{大写名称}.md

前缀编号分配：
- 000~099：核心规则（always include，控制在 200 行以内）
- 1xx：通用流程规范（TDD 工作流、Spec 各阶段规范）- manual
- 2xx：后端代码规范 - fileMatch/manual
- 3xx：前端代码规范 - fileMatch/manual
- 4xx：测试规范 - manual
- 5xx：运维规范 - manual
- 6xx：参考文档 - manual
- 7xx~9xx：预留扩展

新增 steering 文件时：
1. 根据类别选择对应前缀段
2. 同段内递增编号（如 211, 212...）
3. 名称用大写英文，单词间用连字符
4. 示例：211-API-DESIGN.md, 411-UNIT-TEST.md

---

## 基本原则

1. 不确定就问 - 禁止猜测
2. 确认后再做 - 得到用户确认才开发
3. 设计阶段不改代码 - 只更新设计文档
4. 所有任务用 task-manager - 思考(research_mode)、拆分(split)、执行(execute)、验证(verify)
5. 写代码看规范 - 编辑 Java 文件时自动加载 #200-JAVA-CHECKLIST

[重要] 禁止使用 Kiro spec 的 tasks.md，任务管理统一使用 task-manager

---

## MCP 工具

数据库：*mysql_query、*db* - 查表结构、验证数据
API 文档：*api*fox*、*oas* - 查接口规范
Playwright：mcp_playwright_* - E2E 自动化测试

---

## 场景路由

[重要] 只有两种场景，都必须使用 task-manager

场景 A - Spec 流程（新功能/重构/修改）：
- 触发词："新功能"、"新需求"、"设计"、"分析"、"重构"、"修改"、"调整"
- 执行：引用 #100-TDD-WORKFLOW，按 11 阶段门禁执行

场景 B - Bug 修复：
- 触发词："bug"、"问题"、"报错"、"异常"、"不工作"
- 执行：引用 #500-OPS-GUIDELINES，task-manager 深度应用

---

## 规范引用触发

编辑 Java/SQL 文件时：自动加载 #200-JAVA-CHECKLIST
编辑 React/TS 文件时：自动加载 #300-REACT-CHECKLIST

Spec 流程各阶段：
- 阶段 1（用户故事）：#110-STORY-GUIDELINES
- 阶段 2（领域分析）：#120-DOMAIN-ANALYSIS
- 阶段 3（需求规格）：#130-REQUIREMENTS
- 阶段 4（领域建模）：#140-DOMAIN-MODEL + #210-DDD-GUIDELINES
- 阶段 5（前端原型）：#310-FRONTEND-GUIDELINES + #320-DEMO-GUIDELINES
- 阶段 6-7（技术设计）：#150-DESIGN-GUIDELINES + #220-DATABASE-DESIGN
- 阶段 8-10（测试用例）：#400-TEST-CASE-DESIGN + #211-API-DESIGN
- 阶段 11（实现）：#200-JAVA-CHECKLIST

Bug 修复/线上问题：#500-OPS-GUIDELINES + #510-TROUBLESHOOTING

---

## 输出格式

禁止使用：
- Markdown 表格（纯文本环境乱码）
- 特殊 Unicode 符号（箭头、勾选、星号）
- Emoji

推荐使用：
- 列表格式（- 或数字）
- 文字标记：[重要]、[注意]
- 分隔线：---

---

## 语言规范

AI 回答：中文
代码/注释/commit：英文
文档内容：中文（字段名英文）
术语首次出现：中文（English）格式

---

## 事后反思

代码写完后执行：
1. getDiagnostics 检查所有修改文件
2. 分析问题原因
3. 修复并举一反三（grepSearch 搜索相同问题）
4. 需要追加任务 -> split_tasks(updateMode="append")
