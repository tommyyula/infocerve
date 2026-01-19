# 客户与组织 - API 测试用例

## 说明
- 使用 R<T> 统一返回格式
- 所有成功返回 code=0, success=true

## 组织 API

API-ORG-001 创建组织
- 请求: POST /organization
- 请求体: 包含 code, name, fullName, status, tags, isValid, note, contacts
- 预期:
  - 返回组织数据
  - 数据库新增组织

API-ORG-002 获取组织详情
- 请求: GET /organization/{orgId}
- 预期:
  - 返回组织数据

API-ORG-003 搜索组织
- 请求: POST /organization/search
- 请求体: 关键字或 tag
- 预期:
  - 返回匹配列表

API-ORG-004 组织分页查询
- 请求: POST /organization/search-by-paging
- 请求体: currentPage, pageSize, tag
- 预期:
  - 返回分页信息

API-ORG-005 更新组织
- 请求: PUT /organization/update
- 请求体: id + 可更新字段
- 预期:
  - 返回成功

API-ORG-006 更新组织状态
- 请求: POST /organization/change-status/{orgId}
- 请求体: status
- 预期:
  - 状态更新

API-ORG-007 删除组织
- 请求: DELETE /organization/{orgId}
- 预期:
  - 删除成功

## 客户 API

API-CUST-001 创建客户
- 请求: POST /customer/create
- 请求体: customerCode, name, fullName, status, isValid, industry, contacts
- 预期:
  - 返回客户ID
  - 客户记录创建

API-CUST-002 更新客户
- 请求: PUT /customer/update
- 请求体: id + 可更新字段
- 预期:
  - 更新成功

API-CUST-003 获取客户详情
- 请求: GET /customer/{id}
- 预期:
  - 返回客户信息

API-CUST-004 客户查询
- 请求: POST /customer/search
- 请求体: keyword 或 customerCode
- 预期:
  - 返回匹配列表

API-CUST-005 客户分页查询
- 请求: POST /customer/search-by-paging
- 请求体: currentPage, pageSize, keyword
- 预期:
  - 返回分页信息

API-CUST-006 删除客户
- 请求: DELETE /customer/{id}
- 预期:
  - 删除成功

## 客户关系 API

API-REL-001 批量创建关系
- 请求: POST /customer/relationship/batch-create
- 请求体: 关系列表 orgId, partnerId, tag
- 预期:
  - 返回关系ID列表

API-REL-002 查询关系(按组织与标签)
- 请求: GET /customer/{orgId}/relationships?tag=RETAILER
- 预期:
  - 返回关系列表

API-REL-003 删除关系
- 请求: DELETE /customer/relationship/{id}
- 预期:
  - 删除成功

API-REL-004 删除组织全部关系
- 请求: DELETE /customer/{orgId}/relationships
- 预期:
  - 删除成功

## 客户零售关系 API

API-REL-RETAIL-001 创建客户-零售商关系
- 请求: POST /customer/retail-relationship
- 请求体: customerId, orgId
- 预期:
  - 返回关系数据

API-REL-RETAIL-002 批量创建客户-零售商关系
- 请求: POST /customer/retail-relationship/batch
- 请求体: 关系列表
- 预期:
  - 返回关系列表

API-REL-RETAIL-003 查询客户-零售商关系
- 请求: POST /customer/retail-relationship/search
- 请求体: customerId
- 预期:
  - 返回关系列表

API-REL-RETAIL-004 删除客户-零售商关系
- 请求: DELETE /customer/retail-relationship/{id}
- 预期:
  - 删除成功

API-REL-RETAIL-005 按客户删除零售关系
- 请求: DELETE /customer/retail-relationship/by-customer/{customerId}
- 预期:
  - 删除成功
