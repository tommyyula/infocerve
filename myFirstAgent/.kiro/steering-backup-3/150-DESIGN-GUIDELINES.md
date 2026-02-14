---
inclusion: manual
---

# 技术设计编写规范

## 文件位置

```
.kiro/specs/{feature-name}/06-design.md
```

---

## 核心原则

[重要] 关注点分离原则：

技术设计关注：
- 架构分层和模块依赖
- API 接口设计
- 流程图和时序图
- 错误处理和安全设计
- 性能考虑

技术设计不关注：
- 数据库字段类型（VARCHAR、INT 等）
- 字段长度限制
- 索引设计
- 迁移脚本

---

## 模板结构

```markdown
# {功能名称} - 技术设计

## 1. 概述
## 2. 架构设计
## 3. 流程图（PlantUML）
## 4. API 设计
## 5. 领域对象映射（概念层面）
## 6. 错误处理
## 7. 安全设计
## 8. 性能考虑
```

---

## 2. 架构设计

分层结构：
```
Interfaces 接口层（Controller / DTO / Assembler）
    |
Application 应用层（ApplicationService / Command / Query）
    |
Domain 领域层（Entity / ValueObject / Aggregate / DomainService）
    |
Infrastructure 基础设施层（RepositoryImpl / Gateway / Config）
```

模块依赖规则：
- interfaces -> application
- application -> domain
- domain -> 无依赖（核心）
- infrastructure -> domain

---

## 3. 流程图（PlantUML）

[重要] PlantUML 详细规范见 #151-PLANTUML-GUIDELINES

必须包含的流程图：
- 时序图 - 展示组件间交互顺序（API 调用流程、多系统协作）
- 活动图 - 展示业务流程步骤（业务流程、状态流转）
- 类图 - 展示领域模型结构（聚合、实体、值对象关系）
- 组件图 - 展示系统架构（分层架构、模块依赖）
- 状态图 - 展示状态机（单据状态流转）

文件组织：
```
.kiro/specs/{feature-name}/
├── 06-design.md                 # 设计文档（内嵌 PlantUML）
└── diagrams/                    # PlantUML 独立文件目录
    ├── 01-system-architecture.puml
    ├── 02-create-sequence.puml
    ├── 03-business-flow-activity.puml
    ├── 04-aggregate-class.puml
    ├── 05-state.puml
    └── ...
```

文件命名规范：
- 序号前缀：两位数字（01-, 02-）
- 图类型后缀：-sequence, -activity, -class, -state
- 小写连字符
- 扩展名：.puml

---

## 4. API 设计

[重要] API 设计必须遵循 #211-API-DESIGN 规范

关键要点：
- 响应格式：R<T>（来自 xms-core）
  - code: Long（0 表示成功）
  - msg: String（成功时为 "OK"）
  - success: Boolean
  - data: T
- IdResponse/IdsResponse：来自 common 模块
- 所有业务错误返回 HTTP 200
- 错误码类型：Long（如 10001, 10002）

BFF 层 API 格式：
- 方法 | 路径 | 说明 | 请求体 | 响应体

后端 API 格式：
- 路径前缀 /internal/v1

请求/响应示例必须包含完整 JSON（使用实际的 R<T> 格式）

---

## 5. 领域对象映射（概念层面）

[重要] 只描述映射关系，不涉及具体数据类型

Entity <-> PO 映射规则：
- 聚合根对应主表 PO
- 聚合内实体对应子表 PO
- 值对象展开为 PO 字段
- 枚举存储为字符串
- 集合存储为 JSON

DTO <-> Entity 映射：
- Assembler 负责转换

示例（概念层面）：
```
Facility Entity -> FacilityPO (fac_facility 表)
- facilityId -> facilityId
- facilityCode -> facilityCode
- facilityName -> facilityName
- address (值对象) -> country, province, city, district, street, postalCode, addressDetail
- facilitySetting (复杂对象) -> facilitySetting (JSON 存储)
- capabilities (集合) -> capabilities (JSON 存储)
```

不应该包含：
- 字段类型（VARCHAR、INT、BIGINT、JSON 等）
- 字段长度限制（VARCHAR(64)、VARCHAR(128) 等）
- 索引设计（PRIMARY KEY、INDEX、UNIQUE 等）
- 默认值（DEFAULT 'value'）

这些内容在阶段 7 Database Design 中定义

映射关系关注：
- 实体属性如何对应到数据库字段（概念层面）
- 值对象如何展开为多个字段
- 复杂对象如何存储（JSON、关联表等策略）
- 集合如何存储（JSON、关联表等策略）

映射关系不关注：
- 具体的数据库类型
- 字段长度和精度
- 索引和约束
- 物理存储细节

---

## 6. 错误处理

错误码设计格式：{模块缩写}_{序号}

示例：
- RCV_001 收货单不存在
- RCV_002 收货单状态不允许此操作
- TSK_001 任务不存在

---

## 检查清单

架构设计：
- [ ] 分层结构清晰
- [ ] 模块依赖正确

流程图：
- [ ] 包含核心业务流程时序图
- [ ] 包含业务流程活动图
- [ ] 包含领域模型类图
- [ ] PlantUML 语法正确

API 设计：
- [ ] RESTful 风格
- [ ] 请求/响应格式统一
- [ ] 包含必要的示例

映射关系：
- [ ] Entity <-> PO 映射清晰（概念层面）
- [ ] DTO <-> Entity 映射清晰
- [ ] 不包含具体数据库类型

错误处理：
- [ ] 错误码设计完整
- [ ] 异常类设计合理
