# 客户与组织 - 任务拆分

## 总体规划
1) 组织模块前端对齐
2) 客户模块多页签与关系维护
3) 组织查询与关系 API 对齐
4) 组织/客户字段映射完善
5) 测试执行与回归
6) 文档同步

## 任务拆分

任务 1: 组织前端表单与联系人 Tab
- 目标: 组织新建/编辑/查看字段与 demo 一致，新增联系人 Tab
- 相关文件:
  - wms-lite-web/src/app/views/org-client/OrganizationDetail/*
- 依赖: 无
- 验收:
  - 字段、标签、Tab、回显一致
  - 保存流程无阻

任务 2: 客户前端多页签与关系弹窗
- 目标: 客户详情页含基础信息与关系页签；关系新增弹窗仅“组织下拉”，按 tag 过滤
- 相关文件:
  - 客户模块前端目录（按实际路径）
- 依赖: 任务 3
- 验收:
  - 不同 Tab 下拉仅展示匹配 tag 组织
  - 新增/删除关系可用

任务 3: 组织查询与关系 API 对齐
- 目标: 组织搜索支持 tags 过滤；关系接口参数与前端一致
- 相关文件:
  - wms-lite-backend/mdm-app/src/main/java/com/t5/mdm/interfaces/rest/organization/OrganizationController.java
  - wms-lite-backend/mdm-app/src/main/java/com/t5/mdm/application/organization/dto/OrganizationSearch.java
- 依赖: 无
- 验收:
  - tags 查询可用
  - 关系接口可被前端正常调用

任务 4: 组织/客户 DTO 字段映射完善
- 目标: 联系人、标签、状态等字段双向一致
- 相关文件:
  - wms-lite-backend/mdm-app/src/main/java/com/t5/mdm/application/organization/dto/*
  - wms-lite-backend/mdm-app/src/main/java/com/t5/mdm/application/customer/dto/*
- 依赖: 任务 1, 2
- 验收:
  - 新建/编辑/详情字段可回显
  - 无缺失字段

任务 5: 测试执行与回归
- 目标: 执行 E2E/API/单测用例并记录结果
- 相关文件:
  - wms-lite-backend/.kiro/specs/mdm-customer-organization-domain/08-e2e-test-cases.md
  - wms-lite-backend/.kiro/specs/mdm-customer-organization-domain/09-unit-test-cases.md
  - wms-lite-backend/.kiro/specs/mdm-customer-organization-domain/10-api-test-cases.md
- 依赖: 任务 1-4
- 验收:
  - 核心流程通过
  - 问题清单可追踪

任务 6: 文档同步
- 目标: demo 与设计说明一致，更新状态
- 相关文件:
  - wms-lite-backend/.kiro/specs/mdm-customer-organization-domain/05-frontend-demo.md
  - wms-lite-backend/.kiro/specs/mdm-customer-organization-domain/progress.md
- 依赖: 任务 1-5
- 验收:
  - 版本、范围、字段描述一致
