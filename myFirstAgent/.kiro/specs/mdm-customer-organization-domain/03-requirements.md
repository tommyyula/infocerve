# 客户与组织 - 需求规格

## 功能性需求

REQ-ORG-001
WHEN 用户提交创建组织请求
THEN 系统 SHALL 保存组织基础信息并返回组织数据

REQ-ORG-002
WHEN 用户提交更新组织请求
THEN 系统 SHALL 更新组织基础信息并返回成功结果

REQ-ORG-003
WHEN 用户提交组织查询请求
THEN 系统 SHALL 按条件返回组织列表

REQ-ORG-004
WHEN 用户提交组织分页查询请求
THEN 系统 SHALL 返回分页结果与总数

REQ-ORG-005
WHEN 用户提交组织状态变更请求
THEN 系统 SHALL 更新组织状态

REQ-ORG-006
WHEN 用户删除组织
THEN 系统 SHALL 删除指定组织记录

REQ-ORG-007
IF 组织标签包含 CUSTOMER
WHEN 创建或更新组织
THEN 系统 SHALL 同步创建或更新客户基础信息

REQ-ORG-008
IF 组织标签包含 CUSTOMER
WHEN 组织状态变更
THEN 系统 SHALL 同步更新客户有效性

REQ-ORG-009
IF 组织标签包含 HOST_ACCOUNT
WHEN 创建或更新组织
THEN 系统 SHALL 校验租户内 HOST_ACCOUNT 唯一性

REQ-ORG-010
WHEN 创建或更新组织
THEN 系统 SHALL 校验组织编码在租户内唯一

REQ-CUST-001
WHEN 用户提交创建客户请求
THEN 系统 SHALL 保存客户基础信息并返回客户ID

REQ-CUST-002
WHEN 创建客户成功
THEN 系统 SHALL 发布客户创建事件用于异步创建组织

REQ-CUST-003
WHEN 客户创建事件被处理
THEN 系统 SHALL 创建组织并回写客户的组织ID

REQ-CUST-004
WHEN 用户提交更新客户请求
THEN 系统 SHALL 更新客户基础信息

REQ-CUST-005
WHEN 用户提交客户查询请求
THEN 系统 SHALL 按条件返回客户列表

REQ-CUST-006
WHEN 用户提交客户分页查询请求
THEN 系统 SHALL 返回分页结果与总数

REQ-CUST-007
WHEN 用户按ID查询客户
THEN 系统 SHALL 返回客户详情

REQ-CUST-008
WHEN 用户删除客户
THEN 系统 SHALL 删除客户记录

REQ-REL-001
WHEN 用户创建组织关系
THEN 系统 SHALL 保存组织关系记录并返回关系ID

REQ-REL-002
WHEN 用户批量创建组织关系
THEN 系统 SHALL 批量保存并返回关系ID列表

REQ-REL-003
WHEN 用户按组织ID与标签查询关系
THEN 系统 SHALL 返回匹配的关系列表

REQ-REL-004
WHEN 用户删除关系记录
THEN 系统 SHALL 删除关系记录

REQ-REL-005
WHEN 用户按组织ID删除关系
THEN 系统 SHALL 删除该组织下的所有关系记录

REQ-REL-006
WHEN 用户维护客户与零售商关系
THEN 系统 SHALL 支持创建、批量创建、查询与删除

REQ-REL-007
WHEN 用户维护客户与品牌、供应商、部门、头衔关系
THEN 系统 SHALL 支持创建、批量创建、查询与删除

## 非功能性需求

NFR-001
WHEN 任意接口返回结果
THEN 系统 SHALL 使用统一的 R<T> 响应结构

NFR-002
WHEN 查询返回分页结果
THEN 系统 SHALL 返回 totalCount, pageSize, currentPage 等分页信息
