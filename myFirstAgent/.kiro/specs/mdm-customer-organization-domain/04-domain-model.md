# 客户与组织 - 领域模型

## 1. 聚合与实体

### 组织聚合 Organization
- 聚合根: Organization
- 核心属性
  - id, code, name, fullName
  - status, isValid
  - tags, contacts, activatedFacilityIds
  - customerType, category, accountId, source
- 关键行为
  - 创建组织
  - 更新组织
  - 变更状态
- 约束
  - code 在租户内唯一
  - HOST_ACCOUNT 标签在租户内唯一

### 客户聚合 Customer
- 聚合根: Customer
- 核心属性
  - id, orgId, customerCode, name, fullName
  - status, isValid, industry
  - contacts
- 关键行为
  - 创建客户
  - 更新客户
  - 删除客户
- 约束
  - customerCode 唯一
  - 创建后需要回写 orgId

### 组织关系聚合 OrganizationRelationship
- 聚合根: OrganizationRelationship
- 核心属性
  - orgId, partnerOrgId, partnerTag
- 关键行为
  - 创建关系
  - 删除关系
- 约束
  - orgId 与 partnerOrgId 必须存在

### 客户关系聚合
- CustomerRetailRelationship
- CustomerBrandRelationship
- CustomerSupplierRelationship
- CustomerDepartmentRelationship
- CustomerTitleRelationship
- 核心属性
  - customerId, orgId
- 关键行为
  - 创建、批量创建
  - 查询与删除

## 2. 值对象与枚举
- OrganizationTag: CUSTOMER, RETAILER, BRAND, SUPPLIER, TITLE, DEPARTMENT, HOST_ACCOUNT 等
- OrganizationStatus: ACTIVE, INACTIVE
- CustomerStatus: ACTIVE, INACTIVE
- CustomerType, Category
- Contact: 组织或客户联系人信息

## 3. 领域服务
- OrganizationService
  - 校验 HOST_ACCOUNT 唯一
  - 校验组织编码唯一
  - 创建与更新组织
- CustomerService
  - 校验客户编码唯一
  - 创建与更新客户
  - 维护组织关系
- CustomerRetailRelationshipService 等
  - 创建、批量创建、删除关系

## 4. 领域事件
- CustomerCreatedEvent
  - 触发条件: 创建客户成功
  - 事件处理: 异步创建组织并回写客户 orgId

## 5. 关键领域规则映射
- HOST_ACCOUNT 唯一性校验 -> OrganizationService.validateHostAccount
- 组织编码唯一性校验 -> OrganizationService.validateCodeUniqueness
- 客户编码唯一性校验 -> CustomerService.createBasicData
- CUSTOMER 标签联动 -> OrganizationApplicationService.syncCreateByTag / syncUpdateByTag / syncStatusByTag
- 客户创建联动组织 -> CustomerApplicationService + CustomerEventListener
