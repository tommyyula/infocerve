# 实施任务清单 - IAM 用户体系重构（前端部分）

## 任务概述

本任务清单包含前端开发任务，后端任务已在后端项目中完成。

**后端归档位置**：
- 项目路径：`当前项目`
- 归档路径：`.task-manager/neil-chen/archive/2025-12-WCS-1495-iam-refactor-backend/`
- 完成时间：2025-12-11

**后端提供的 API**：
- 认证 API：`/api/iam/auth/*`
- 用户管理 API：`/api/iam/tenant-users/*`
- 租户管理 API：`/api/iam/tenants/*`
- 菜单管理 API：`/api/iam/menus/*`
- 角色管理 API：`/api/iam/roles/*`

## 任务列表

### 第八阶段：前端开发（任务 28-35）

- [ ] 28. 前端基础准备
  - 更新数据模型接口（User, Role, Menu, Tenant）
  - 更新 API 调用方法（auth, user, role, menu, tenant）
  - 配置路由和权限
  - 搭建基础框架
  - _需求：1, 2_
  - _参考：task-analysis.md 任务 28_

- [ ] 29. 前端登录流程重构
  - 实现预登录页面（PreLogin.vue）
  - 实现正式登录页面（TenantSelect.vue，含设施选择）
  - 实现租户/设施选择逻辑
  - 实现 Token 管理
  - 实现用户上下文存储（Pinia Store）
  - 实现动态路由生成
  - 测试登录流程
  - _需求：2_
  - _参考：task-analysis.md 任务 29, design.md 登录流程实现_

- [ ] 30. 前端用户管理页面（简化版）
  - 实现用户列表页面
  - 实现用户创建表单（CreateUserDialog.vue）
  - 实现用户编辑表单（EditUserDialog.vue）- 统一入口，包含以下功能：
    - 编辑基本信息（username, email, phone, nickname, avatar）
    - 启用/禁用按钮
    - 分配角色按钮（打开角色选择对话框）
    - 编辑租户列表按钮（打开租户管理对话框）
    - 编辑设施列表按钮（打开设施选择对话框）
    - 重置密码按钮
  - 实现权限控制
  - 实现分页和搜索
  - 测试用户管理功能
  - _需求：1, 3, 8_
  - _参考：task-analysis.md 任务 30, design.md 用户管理实现_
  - _说明：所有修改功能都在编辑表单中，通过不同的按钮/对话框触发，最终调用同一个编辑接口_

- [ ] 31. 前端角色管理页面（简化版）
  - 实现角色列表页面
  - 实现角色创建/编辑表单（基本信息）
  - 实现分配菜单功能
  - 实现启用/禁用功能
  - 实现权限控制
  - 测试角色管理功能
  - _需求：7_
  - _参考：task-analysis.md 任务 31_

- [ ] 32. 前端菜单管理页面
  - 实现菜单树展示
  - 实现菜单创建/编辑（仅 SystemAdmin）
  - 实现权限控制
  - 测试菜单管理功能
  - _需求：6_
  - _参考：task-analysis.md 任务 32_

- [ ] 33. 前端租户管理页面（仅 SystemAdmin）
  - 实现租户列表页面（仅 SystemAdmin）
  - 实现租户创建/编辑表单
  - 实现权限控制
  - 测试租户管理功能
  - _需求：19_
  - _参考：task-analysis.md 任务 33_

- [ ] 34. 前端租户 Profile 页面（TenantAdmin）
  - 实现租户 Profile 页面（仅 TenantAdmin）
  - 实现 Profile 更新表单（tenantName, logo, contactPerson, contactPhone, contactEmail）
  - 实现权限控制
  - 测试 Profile 功能
  - _需求：19.5, 19.6_
  - _参考：task-analysis.md 任务 34_

- [ ] 35. 前端权限控制
  - 实现权限控制组件（v-permission 指令）
  - 实现路由权限守卫
  - 实现按钮级权限控制
  - 实现动态侧边栏菜单
  - 测试权限控制功能
  - _需求：6, 9, 18_
  - _参考：task-analysis.md 任务 35, design.md 权限控制实现_

## 注意事项

1. **前端项目路径**：
   - 前端项目应该在另一个 workspace 中
   - 需要复制 `.kiro/steering/` 规则到前端项目
   - 需要复制 `requirements.md` 和 `design.md` 到前端项目

2. **后端 API 依赖**：
   - 所有后端 API 已完成并测试通过
   - 前端开发时可以直接调用后端 API
   - 如果发现后端 API 问题，需要在后端项目中修复

3. **用户上下文**：
   - 登录时后端返回完整的用户上下文（isSystemAdmin、isTenantAdmin、roles、permissions、menus）
   - 前端存储到 Pinia Store 和 localStorage
   - 通过 authStore 的 getters 访问用户上下文

4. **动态菜单**：
   - 登录时后端根据用户角色过滤菜单并构建菜单树
   - 前端接收菜单数据后动态生成路由和侧边栏
   - 一次性加载，无需额外请求

5. **权限控制**：
   - SystemAdmin 拥有所有权限
   - TenantAdmin 可以管理租户内的用户和角色，可以更新租户 Profile
   - 普通用户根据角色权限访问功能

## 参考文档

- **requirements.md**：需求文档（已复制到前端项目）
- **design.md**：技术设计文档（已复制到前端项目）
- **task-analysis.md**：详细的任务分析文档（在后端项目中）
- **后端归档**：`.task-manager/neil-chen/archive/2025-12-WCS-1495-iam-refactor-backend/`

## 总结

前端任务包含 8 个任务（28-35），预计 2 周完成。

**核心功能**：
1. 两步登录流程（预登录 + 正式登录）
2. 用户管理（简化版）
3. 角色管理（简化版）
4. 菜单管理（仅 SystemAdmin）
5. 租户管理（SystemAdmin）
6. 租户 Profile（TenantAdmin）
7. 权限控制（动态菜单、路由守卫、按钮权限）

通过前端开发，IAM 系统将提供完整的用户界面，支持用户登录、管理和权限控制。
