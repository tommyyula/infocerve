# 客户与组织 - E2E 测试报告（2026-01-08）

## 基本信息
- 测试范围: 组织管理、客户管理、客户关系维护
- 前端地址: http://localhost:5173/
- 后端地址: http://localhost:8084/
- 执行方式: 手工 E2E（Playwright 操作）
- 语言/主题: 已验证语言切换与主题切换

## 测试数据
- 组织: ORG_E2E_CUST_001（CUSTOMER）、ORG_E2E_BRAND_001（BRAND）、ORG_E2E_RETAIL_001（RETAILER）、ORG_E2E_SUPPLIER_001（SUPPLIER）、ORG_E2E_DEPT_001（DEPARTMENT）、ORG_E2E_TITLE_001（TITLE）
- 客户: CUST_E2E_001、CUST_E2E_002

## 用例结果

### 组织管理
- E2E-ORG-001 创建组织: 通过
- E2E-ORG-002 创建组织-编码重复: 通过（返回 400 并提示编码重复）
- E2E-ORG-003 编辑组织: 通过（备注更新成功）
- E2E-ORG-004 组织状态变更: 通过（状态变更为禁用）
- E2E-ORG-005 标签 CUSTOMER 同步客户: 通过（客户列表出现 ORG_E2E_CUST_001）
- E2E-ORG-006 组织联系人维护: 通过（联系人信息可回显）

### 客户管理
- E2E-CUST-001 创建客户: 通过
- E2E-CUST-002 创建客户触发组织创建: 通过（组织列表出现 CUST_E2E_002，客户详情 orgId 回写）
- E2E-CUST-003 编辑客户: 通过（行业字段更新为“零售”）
- E2E-CUST-004 客户查询与分页: 通过（客户编码筛选仅返回匹配记录）

### 客户关系维护
- E2E-REL-001 新增客户-品牌商关系: 通过
- E2E-REL-002 新增客户-零售商关系: 通过
- E2E-REL-003 新增客户-供应商关系: 通过
- E2E-REL-004 删除客户关系: 通过（品牌商关系删除成功）
- E2E-REL-005 关系新增下拉过滤: 通过（各页签仅显示对应标签组织）

## 国际化与主题
- 语言切换: English ↔ 简体中文 正常
- 主题切换: 浅色 ↔ 深色 正常

## 已知问题与建议
- 暂无阻塞问题，后续补齐 API/单元测试验证

## 说明
- API 与单元测试未执行，需补充验证（参考 09-unit-test-cases.md / 10-api-test-cases.md）
- 控制台存在若干框架告警（antd message 静态提示、Modal destroyOnClose 弃用、findDOMNode 弃用），未阻塞主流程
