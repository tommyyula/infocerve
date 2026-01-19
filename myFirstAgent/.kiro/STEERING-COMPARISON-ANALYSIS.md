# Steering 规范对比分析报告

本文档对比分析新旧两套 steering 规范在软件工程各流程的覆盖程度。

---

## 一、软件工程流程覆盖度对比

### 1.1 流程覆盖矩阵

```
流程阶段                    新版 steering              旧版 steering-backup
---                        ---                        ---
需求分析
  用户故事                  21-STORY-GUIDELINES        无专门文件
  领域分析                  22-DOMAIN-ANALYSIS         无专门文件
  需求规格                  23-REQUIREMENTS-GUIDELINES 01-SPEC-GUIDELINES（简略）

设计阶段
  领域建模                  24-DOMAIN-MODEL            ddd-rich-domain-model（部分）
  前端原型                  25-FRONTEND-DEMO           无专门文件
  技术设计                  26-DESIGN-GUIDELINES       02-DESIGN-RULES（部分）
  数据库设计                27-DATABASE-DESIGN         无专门文件

编码阶段
  Java 编码规范             10-JAVA-CHECKLIST          03-JAVA-CHECKLIST
  关键提醒                  11-CRITICAL-REMINDERS      CRITICAL-REMINDERS
  Repository 规范          10-JAVA-CHECKLIST（整合）   05-REPOSITORY-RULES
  树形结构规范              10-JAVA-CHECKLIST（整合）   tree-structure-best-practices
  OpenAPI 规范              10-JAVA-CHECKLIST（整合）   open-api.md

测试阶段
  测试用例设计              30-TEST-CASE-GUIDELINES    07-AUTOMATED-TESTING-GUIDE（部分）
  单元测试规范              31-UNIT-TEST-GUIDELINES    07-AUTOMATED-TESTING-GUIDE（部分）
  E2E 测试规范              32-PLAYWRIGHT-GUIDE        无专门文件

运维阶段
  问题排查                  33-TROUBLESHOOTING-GUIDE   06-TROUBLESHOOTING-GUIDE
  任务归档                  34-TASK-ARCHIVE-GUIDE      task-archive-guide

流程管控
  场景路由                  00-SCENARIO-ROUTER         00-COMMON-GUIDELINES（简略）
  TDD 工作流                20-TDD-WORKFLOW            无专门文件
  事后反思                  00-SCENARIO-ROUTER（整合）  04-COMMON-REFLECTION_RULES

输出规范
  输出格式                  01-OUTPUT-FORMAT           05-OUTPUT-FORMAT_RULES
  语言规范                  02-LANGUAGE-GUIDELINES     无专门文件

参考资料
  阿里巴巴规范              99-REFERENCE-ALIBABA       99-REFERENCE-ALIBABA
  Reactor 规范              99-REFERENCE-REACTOR       99-REFERENCE-REACTOR
```

### 1.2 覆盖度统计

```
流程类别          新版文件数    旧版文件数    新版覆盖率
---              ---          ---          ---
需求分析          3            1            完整覆盖
设计阶段          4            2            完整覆盖
编码阶段          2            5            整合覆盖
测试阶段          3            1            完整覆盖
运维阶段          2            2            完整覆盖
流程管控          2            2            完整覆盖
输出规范          2            1            完整覆盖
参考资料          2            2            完整覆盖
---              ---          ---          ---
总计              20           16           提升 25%
```

---

## 二、新需求文档产出对比

以「客户关系批量删除功能」为例，对比新旧 steering 下的文档产出。

### 2.1 新版 steering 产出文档

```
.kiro/specs/customer-relationship-batch-delete/
  story.md                    # 用户故事（INVEST 原则）
  domain-analysis.md          # 领域分析（统一语言、限界上下文）
  requirements.md             # 需求规格（EARS 模式验收标准）
  domain-model.md             # 领域建模（聚合、实体、值对象）
  demo/
    index.html                # PC端原型
  design.md                   # 技术设计（分层架构、API、错误码）
  database-design.md          # 数据库设计（表结构、索引）
  e2e-test-cases.md          # E2E 测试用例
  unit-test-cases.md         # 单元测试用例
  api-test-cases.md          # API 测试用例
  progress.md                 # 进度状态
```

### 2.2 旧版 steering 产出文档

```
.kiro/specs/customer-relationship-batch-delete/
  requirements.md             # 需求（简略，无 EARS 模式）
  design.md                   # 设计（无标准模板）
  tasks.md                    # 任务列表（手动管理）
```

### 2.3 新版比旧版增加的内容

需求分析阶段：
- story.md - 用户故事，包含背景、角色、验收标准
- domain-analysis.md - 统一语言、领域分类、限界上下文、业务规则

设计阶段：
- domain-model.md - 聚合根、实体、值对象、领域事件、仓储接口
- demo/index.html - 可交互的前端原型
- database-design.md - 表结构、索引设计、Entity-PO 映射

测试阶段：
- e2e-test-cases.md - 端到端测试用例
- unit-test-cases.md - 单元测试用例（按领域层、应用层分类）
- api-test-cases.md - API 测试用例

流程管控：
- progress.md - 11 阶段门禁状态追踪

---

## 三、关键改进点

### 3.1 流程标准化

旧版问题：
- 无明确的阶段划分
- 无门禁机制，容易跳过关键步骤
- 任务管理分散

新版改进：
- 11 阶段门禁机制，每阶段必须人工确认
- 统一使用 task-manager MCP 管理任务
- 场景路由自动判断处理方式

### 3.2 DDD 方法论落地

旧版问题：
- DDD 概念零散，无系统指导
- 领域建模无标准模板
- 聚合边界不清晰

新版改进：
- 完整的 DDD 战略设计（领域分析、限界上下文）
- 完整的 DDD 战术设计（聚合、实体、值对象、领域事件）
- 标准化的领域模型文档模板

### 3.3 测试驱动开发

旧版问题：
- 测试用例设计无规范
- 无 E2E 测试指导
- 测试覆盖率无要求

新版改进：
- 测试用例先于实现（阶段 8-10 在阶段 11 之前）
- 完整的 Playwright E2E 测试指南
- 明确的测试覆盖率要求（领域层 >= 90%）

### 3.4 文档整合优化

旧版问题：
- 文件分散，编码规范分布在多个文件
- 重复内容多
- 加载时机不明确

新版改进：
- 编码规范整合到 10-JAVA-CHECKLIST.md
- 明确的加载时机（always / fileMatch / manual）
- 按编号分类，便于引用

---

## 四、使用示例

### 4.1 场景：开发「客户关系批量删除」功能

用户输入：
```
我需要开发一个客户关系批量删除功能，允许用户选择多个客户关系记录进行批量删除。
```

AI 判断：
```
这是一个新功能需求，涉及：
- 新增 API 接口
- 可能涉及多个文件改动
- 需要与业务方确认需求

判断结果：场景 A - Spec 流程
```

### 4.2 执行流程

阶段 1：用户故事
```
AI 角色：业务分析师
产出：story.md

内容示例：
---
背景：
客户关系数据量大，逐条删除效率低，用户需要批量删除功能。

用户故事 1：批量删除客户关系
作为 客户管理员
我想要 选择多个客户关系记录并一次性删除
以便于 快速清理无效的客户关系数据

验收标准：
AC1: 用户可以通过复选框选择多条记录
AC2: 点击批量删除按钮后显示确认对话框
AC3: 确认后系统删除所有选中记录
AC4: 删除成功后刷新列表并显示成功提示
AC5: 如果部分删除失败，显示失败记录列表
---

AI 输出：阶段 1 完成，请确认是否通过？
用户确认：通过
```

阶段 2-3：领域分析 + 需求规格
```
AI 角色：领域专家 -> 需求工程师
产出：domain-analysis.md, requirements.md

关键内容：
- 统一语言：客户关系（CustomerRelationship）、批量删除（BatchDelete）
- 业务规则：BR-001 删除前必须确认、BR-002 记录删除日志
- 验收标准（EARS 模式）：
  WHEN 用户选择多条记录并点击批量删除
  THE SYSTEM SHALL 显示确认对话框
  AND 确认后删除所有选中记录
```

阶段 4-7：设计阶段
```
AI 角色：DDD 战术设计师 -> UX 设计师 -> 解决方案架构师 -> 数据库架构师
产出：domain-model.md, demo/index.html, design.md, database-design.md

关键内容：
- 聚合根：CustomerRelationship
- 领域服务：CustomerRelationshipDomainService.batchDelete()
- API：DELETE /api/customer-relationships/batch
- 错误码：CUSTOMER_RELATIONSHIP_NOT_FOUND, BATCH_DELETE_PARTIAL_FAILURE
```

阶段 8-10：测试用例设计
```
AI 角色：质量保证工程师
产出：e2e-test-cases.md, unit-test-cases.md, api-test-cases.md

关键内容：
- E2E：测试完整的批量删除流程
- 单元测试：测试 CustomerRelationship.delete() 方法
- API 测试：测试 DELETE /api/customer-relationships/batch 接口
```

阶段 11：实现任务
```
AI 角色：技术负责人
工具：task-manager MCP

任务拆分：
任务组 1：领域层实现
  - 任务 1.1：实现 CustomerRelationship 聚合根的 delete 方法
  - 任务 1.2：实现 CustomerRelationshipDomainService.batchDelete()

任务组 2：应用层实现
  - 任务 2.1：实现 CustomerRelationshipApplicationService.batchDelete()

任务组 3：基础设施层实现
  - 任务 3.1：实现 CustomerRelationshipRepository.batchDelete()

任务组 4：接口层实现
  - 任务 4.1：实现 CustomerRelationshipController.batchDelete()
  - 任务 4.2：实现 BatchDeleteCommand DTO

任务组 5：测试验证
  - 任务 5.1：运行单元测试
  - 任务 5.2：运行 API 测试
  - 任务 5.3：运行 E2E 测试
```

### 4.3 快速修改场景

用户输入：
```
帮我把客户关系删除接口的错误提示改成中文
```

AI 判断：
```
这是一个小改动：
- 改动范围明确（1-2 个文件）
- 不涉及新表、新接口
- 逻辑简单

判断结果：场景 B - 快速修改
```

执行流程：
```
1. 使用 task-manager 创建任务
2. 修改错误提示文案
3. 添加单元测试验证
4. 执行验证
```

---

## 五、总结

新版 steering 相比旧版的主要提升：

1. 流程完整性 - 从需求到测试的 11 阶段全覆盖
2. 方法论落地 - DDD + TDD 方法论有具体指导
3. 质量保障 - 门禁机制 + 测试覆盖率要求
4. 文档标准化 - 每个阶段有标准模板
5. 工具整合 - task-manager + Playwright MCP 统一管理
6. 自检机制 - 每个阶段结束时强制自检，确保文档完整性

建议：
- 新功能开发严格按 Spec 流程执行
- 小改动使用快速修改流程
- 定期归档已完成任务，保持工作区整洁
- 每个阶段结束时对照 #20-TDD-WORKFLOW 中的自检清单进行检查

---

## 六、自检清单引用

详细的文档产出自检清单已整合到 #20-TDD-WORKFLOW 规范中。

每个阶段结束时，AI 必须：
1. 对照自检清单逐项检查
2. 输出自检结果（勾选已完成项）
3. 列出产出文件
4. 请求用户确认

示例输出格式：
```
阶段 X 自检结果：
- [x] 检查项 1
- [x] 检查项 2
- [ ] 检查项 3（未完成，原因：...）

产出文件：xxx.md
请确认是否通过？
```

---

最后更新：2026-01-03
