---
inclusion: manual
---

# 需求规格编写规范

## 文件位置

```
.kiro/specs/{feature-name}/requirements.md
```

---

## 模板结构

```markdown
# {功能名称} - 需求规格

## 术语表
引用 domain-analysis.md 中的统一语言

## 需求列表

### 需求 1：{需求标题}
**用户故事**：Story X
**限界上下文**：{上下文名称}
**业务规则**：BR-XXX-001, BR-XXX-002

#### 验收标准
1. WHEN {触发条件} THEN THE {系统} SHALL {响应}
2. IF {异常条件} THEN THE {系统} SHALL {处理}
```

---

## EARS 模式

无条件：THE {系统} SHALL {响应}
事件驱动：WHEN {事件} THE {系统} SHALL {响应}
状态驱动：WHILE {状态} THE {系统} SHALL {响应}
条件驱动：IF {条件} THEN THE {系统} SHALL {响应}
可选功能：WHERE {功能启用} THE {系统} SHALL {响应}

复合模式：
- WHEN {事件} IF {条件} THEN THE {系统} SHALL {响应}
- WHILE {状态} WHEN {事件} THE {系统} SHALL {响应}

---

## 系统命名

使用统一语言中定义的系统名称，格式为 {系统名}_System

正确：Receipt_System、Inventory_System、Task_System
错误：系统、the system、it

---

## 动词使用

SHALL - 必须（强制要求）
SHOULD - 应该（推荐）
MAY - 可以（可选）

---

## 可测试性

每条验收标准必须可测试：

可测试：WHEN 收货数量超过计划数量110% THEN THE System SHALL 拒绝并提示"超出计划数量"
不可测试：THE System SHALL 快速响应（"快速"不可量化）

---

## 需求分类

功能需求 - 描述系统应该做什么
数据需求 - 描述数据的校验和处理规则
界面需求 - 描述用户界面的行为
接口需求 - 描述系统间的交互
配置需求 - 描述可配置的功能

---

## 接口需求编写规范

[重要] 接口需求只描述接口的业务职责，不涉及具体 API 设计

推荐格式：
- THE {System} SHALL 提供{功能}的接口，接受{输入}，返回{输出}

示例：
- 正确：Facility_System SHALL 提供创建设施的接口，接受设施基本信息，返回创建结果
- 正确：Facility_System SHALL 提供查询设施列表的接口，支持按设施类型和启用状态过滤，返回分页结果
- 错误：POST /api/v1/facility/facilities，请求体 CreateFacilityRequest，响应体 R<FacilityDTO>
- 错误：GET /api/v1/facility/facilities?type=WAREHOUSE&enabled=true

具体的 API 路径、HTTP 方法、请求响应格式在阶段 6 Design 中定义

接口需求关注：
- 接口的业务职责（做什么）
- 输入输出的业务含义（不涉及技术格式）
- 业务规则和约束

接口需求不关注：
- API 路径和 HTTP 方法
- 请求响应的技术格式（DTO、JSON 结构）
- 状态码和错误码

---

## 检查清单

格式检查：
- [ ] 每个需求有唯一编号和标题
- [ ] 关联了用户故事
- [ ] 关联了限界上下文
- [ ] 关联了业务规则（如有）

内容检查：
- [ ] 使用 EARS 模式编写验收标准
- [ ] 系统名称使用统一语言
- [ ] 每条验收标准可测试
- [ ] 覆盖正常流程和异常流程
