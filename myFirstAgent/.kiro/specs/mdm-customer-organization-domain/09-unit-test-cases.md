# 客户与组织 - 单元测试用例

## 说明
- 覆盖领域服务、应用服务与关键规则

## 组织领域

UT-ORG-001 OrganizationService.create 组织编码唯一校验
- 输入: 组织编码已存在
- 预期: 抛出 ORGANIZATION_CODE_DUPLICATE

UT-ORG-002 OrganizationService.create HOST_ACCOUNT 唯一校验
- 输入: 已存在 HOST_ACCOUNT 组织
- 预期: 抛出 ORGANIZATION_HOST_ACCOUNT_ALREADY_EXISTS

UT-ORG-003 OrganizationService.update 保持状态逻辑
- 输入: 更新命令未包含状态
- 预期: 状态保持原值

UT-ORG-004 OrganizationService.changeOrganizationStatus
- 输入: 组织ID + 新状态
- 预期: 状态更新成功

## 客户领域

UT-CUST-001 CustomerService.createBasicData 客户编码唯一校验
- 输入: customerCode 已存在
- 预期: 抛出 CUSTOMER_ALREADY_EXIST

UT-CUST-002 CustomerService.update 更新成功
- 输入: 合法客户
- 预期: 更新成功

UT-CUST-003 CustomerService.getById 不存在
- 输入: 不存在的客户ID
- 预期: 抛出 CUSTOMER_NOT_FOUND

UT-CUST-004 CustomerService.deleteCustomer 删除失败
- 输入: 删除失败
- 预期: 抛出 CUSTOMER_DELETE_FAILED

## 组织与客户联动

UT-SYNC-001 OrganizationApplicationService.createOrganization 标签 CUSTOMER 同步
- 输入: tags 包含 CUSTOMER
- 预期: 调用 customerApplicationService.createCustomerBasicData

UT-SYNC-002 OrganizationApplicationService.updateOrganization 标签 CUSTOMER 同步更新
- 输入: tags 包含 CUSTOMER
- 预期: 调用 customerApplicationService.updateCustomerBasicDataByOrgId

UT-SYNC-003 OrganizationApplicationService.changeOrganizationStatus 标签 CUSTOMER 同步有效性
- 输入: tags 包含 CUSTOMER, status 变更
- 预期: 调用 customerApplicationService.updateCustomerBasicDataByOrgId 并传递 isValid

UT-SYNC-004 CustomerEventListener.handleCustomerCreated 创建组织并回写 orgId
- 输入: CustomerCreatedEvent
- 预期: 创建组织并更新 customer.orgId

## 关系领域

UT-REL-001 CustomerRetailRelationshipService.create 成功
- 输入: 合法关系
- 预期: 创建成功

UT-REL-002 CustomerRetailRelationshipService.delete 不存在
- 输入: 不存在ID
- 预期: 抛出错误

UT-REL-003 CustomerRelationshipRepository.batchInsert 失败
- 输入: 关系列表
- 预期: 抛出 ORGANIZATION_RELATIONSHIP_CREATE_FAILED
