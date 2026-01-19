# 客户与组织 - 领域分析

## 1. 统一语言
- 组织 | 企业或合作方主体 | Organization
- 客户 | 组织中具备客户属性的主体 | Customer
- 组织标签 | 组织的分类标签，如 CUSTOMER、RETAILER | OrganizationTag
- 组织状态 | 组织是否有效 | OrganizationStatus
- 客户状态 | 客户业务状态 | CustomerStatus
- 组织关系 | 组织与组织之间的关联记录 | OrganizationRelationship
- 客户关系 | 客户与零售商、品牌、供应商等关系 | CustomerRelationship
- 组织编码 | 组织唯一编码 | OrganizationCode
- 客户编码 | 客户唯一编码 | CustomerCode
- 是否有效 | 主体是否有效 | isValid

## 2. 领域识别
- 核心域: 客户与组织基础主数据管理
- 支撑域: 组织关系管理
- 通用域: 查询与分页能力

## 3. 限界上下文
- 组织上下文
  - 职责: 组织创建、更新、查询、状态变更
  - 核心概念: Organization, OrganizationTag, OrganizationStatus
- 客户上下文
  - 职责: 客户创建、更新、查询、删除
  - 核心概念: Customer, CustomerStatus
- 关系上下文
  - 职责: 客户与组织关系维护
  - 核心概念: OrganizationRelationship, CustomerRetailRelationship 等

上下文关系
- 组织上下文与客户上下文为合作关系
  - CUSTOMER 标签触发客户同步
  - 客户创建触发组织创建

## 4. 业务流程
- 创建组织
  - 创建组织 -> 生成组织ID -> 校验标签 -> 同步客户数据(含 CUSTOMER 标签)
- 创建客户
  - 创建客户 -> 事件发布 -> 异步创建组织 -> 回写组织ID
- 关系维护
  - 选择客户 -> 选择目标组织 -> 按标签创建关系记录

## 5. 业务规则
- BR-ORG-001 组织编码在租户内必须唯一
- BR-ORG-002 HOST_ACCOUNT 标签在租户内只能存在一个组织
- BR-ORG-003 组织状态变更时，若含 CUSTOMER 标签需同步客户有效性
- BR-CUST-001 客户编码必须唯一
- BR-CUST-002 客户创建后必须回写组织ID
- BR-REL-001 关系记录必须包含组织ID与目标组织ID
