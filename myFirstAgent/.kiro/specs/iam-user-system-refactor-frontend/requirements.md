# 需求文档 - IAM 用户体系重构（前端部分）

## 简介

本需求文档描述了 IAM 用户体系重构项目的前端需求。前端需要适配新的后端 API，实现统一的登录流程、用户管理、角色管理、菜单管理和租户管理功能。

**后端项目状态**：
- 后端任务已完成（任务 1-27）
- 后端归档位置：`.task-manager/neil-chen/archive/2025-12-WCS-1495-iam-refactor-backend/`
- 完成时间：2025-12-11

**后端提供的 API**：
- 认证 API：`/api/iam/auth/*`
- 用户管理 API：`/api/iam/tenant-users/*`
- 租户管理 API：`/api/iam/tenants/*`
- 菜单管理 API：`/api/iam/menus/*`
- 角色管理 API：`/api/iam/roles/*`

## 术语表

- **系统（System）**: IAM 身份认证与访问管理系统前端应用
- **全局用户（GlobalUser）**: 全局用户实体，系统中的统一用户模型
- **系统管理员（SystemAdmin）**: 系统管理员，拥有跨租户的全局管理权限
- **租户管理员（TenantAdmin）**: 租户管理员，拥有租户内的管理权限
- **租户（Tenant）**: 租户，系统中的组织单位
- **租户编码（TenantCode）**: 租户编码，租户的唯一标识符
- **设施（Facility）**: 设施，用户工作的物理位置
- **令牌（Token）**: 身份认证令牌，用于验证用户身份
- **预登录（PreLogin）**: 预登录，验证用户名密码并返回租户信息的过程
- **菜单（Menu）**: 菜单，系统功能的导航结构
- **角色（Role）**: 角色，权限的集合
- **权限（Permission）**: 权限，对系统资源的访问控制

## 需求

### 需求 1: 前端数据模型更新

**用户故事：** 作为前端开发人员，我希望更新前端数据模型以匹配新的后端 API，以便正确处理用户、租户、角色和菜单数据。

#### 验收标准

1. WHEN 前端定义 User 接口 THEN 前端 SHALL 包含 userId、username、nickname、email、phone、avatar、status、tenantIds、facilityIds、lastLoginTenantId、lastLoginFacilityId、isSystemAdmin 字段
2. WHEN 前端定义 Tenant 接口 THEN 前端 SHALL 包含 tenantId、tenantCode、tenantName、logo、contactPerson、contactPhone、contactEmail、status 字段
3. WHEN 前端定义 Role 接口 THEN 前端 SHALL 包含 roleId、roleName、roleKey、tenantId、isTenantAdmin、status 字段
4. WHEN 前端定义 Menu 接口 THEN 前端 SHALL 包含 menuId、menuName、parentId、menuType、path、component、icon、apiPaths 字段
5. WHEN 前端定义 UserInfo 接口 THEN 前端 SHALL 包含 userId、username、tenantId、facilityId、isSystemAdmin、isTenantAdmin、roles、permissions、menus 字段

### 需求 2: 前端登录流程

**用户故事：** 作为用户，我希望通过两步登录流程访问系统，以便选择合适的租户和设施。

#### 验收标准

1. WHEN 用户访问登录页面 THEN 前端 SHALL 显示用户名和密码输入框
2. WHEN 用户提交用户名和密码 THEN 前端 SHALL 调用预登录 API 并显示租户和设施选择界面
3. WHEN 预登录成功 THEN 前端 SHALL 显示用户的租户列表和设施列表
4. WHEN 用户只有一个租户 THEN 前端 SHALL 自动选择该租户
5. WHEN 用户有多个租户 AND 存在上次登录租户 THEN 前端 SHALL 默认选择上次登录的租户
6. WHEN 用户选择租户后 THEN 前端 SHALL 显示该租户下的设施列表
7. WHEN 用户只有一个设施 THEN 前端 SHALL 自动选择该设施
8. WHEN 用户有多个设施 AND 存在上次登录设施 THEN 前端 SHALL 默认选择上次登录的设施
9. WHEN 用户提交租户和设施选择 THEN 前端 SHALL 调用登录 API 并存储 Token
10. WHEN 登录成功 THEN 前端 SHALL 存储用户信息到 Pinia Store 和 localStorage
11. WHEN 登录成功 THEN 前端 SHALL 根据用户菜单动态生成路由
12. WHEN 登录成功 THEN 前端 SHALL 跳转到首页

### 需求 3: 前端用户管理

**用户故事：** 作为管理员，我希望通过前端界面管理用户，以便创建、编辑和删除用户。

#### 验收标准

1. WHEN 管理员访问用户管理页面 THEN 前端 SHALL 显示用户列表
2. WHEN 系统管理员查看用户列表 THEN 前端 SHALL 显示所有租户的用户
3. WHEN 租户管理员查看用户列表 THEN 前端 SHALL 只显示当前租户的用户
4. WHEN 管理员点击创建用户按钮 THEN 前端 SHALL 显示用户创建表单
5. WHEN 管理员提交用户创建表单 THEN 前端 SHALL 调用创建用户 API 并刷新列表
6. WHEN 管理员点击编辑用户按钮 THEN 前端 SHALL 显示用户编辑表单
7. WHEN 用户编辑表单显示 THEN 前端 SHALL 包含编辑基本信息、启用/禁用、分配角色、编辑租户列表、编辑设施列表、重置密码等功能按钮
8. WHEN 管理员修改用户信息 THEN 前端 SHALL 调用更新用户 API 并刷新列表
9. WHEN 管理员点击删除用户按钮 THEN 前端 SHALL 显示确认对话框并调用删除 API
10. WHEN 前端显示用户操作按钮 THEN 前端 SHALL 根据当前用户权限显示或隐藏按钮

### 需求 4: 前端角色管理

**用户故事：** 作为管理员，我希望通过前端界面管理角色，以便创建、编辑和删除角色。

#### 验收标准

1. WHEN 管理员访问角色管理页面 THEN 前端 SHALL 显示角色列表
2. WHEN 系统管理员查看角色列表 THEN 前端 SHALL 显示所有租户的角色和租户超管角色
3. WHEN 租户管理员查看角色列表 THEN 前端 SHALL 显示当前租户的角色和租户超管角色
4. WHEN 管理员点击创建角色按钮 THEN 前端 SHALL 显示角色创建表单
5. WHEN 管理员提交角色创建表单 THEN 前端 SHALL 调用创建角色 API 并刷新列表
6. WHEN 管理员点击编辑角色按钮 THEN 前端 SHALL 显示角色编辑表单
7. WHEN 角色编辑表单显示 THEN 前端 SHALL 包含编辑基本信息、启用/禁用、分配菜单等功能
8. WHEN 管理员修改角色信息 THEN 前端 SHALL 调用更新角色 API 并刷新列表
9. WHEN 管理员点击删除角色按钮 THEN 前端 SHALL 显示确认对话框并调用删除 API
10. WHEN 前端显示角色操作按钮 THEN 前端 SHALL 根据当前用户权限显示或隐藏按钮

### 需求 5: 前端菜单管理

**用户故事：** 作为系统管理员，我希望通过前端界面管理菜单，以便创建、编辑和删除菜单。

#### 验收标准

1. WHEN 系统管理员访问菜单管理页面 THEN 前端 SHALL 显示完整的菜单树
2. WHEN 租户管理员访问菜单管理页面 THEN 前端 SHALL 显示完整的菜单树（只读，用于分配给角色）
3. WHEN 普通用户访问菜单管理页面 THEN 前端 SHALL 拒绝访问
4. WHEN 系统管理员点击创建菜单按钮 THEN 前端 SHALL 显示菜单创建表单
5. WHEN 系统管理员提交菜单创建表单 THEN 前端 SHALL 调用创建菜单 API 并刷新菜单树
6. WHEN 系统管理员点击编辑菜单按钮 THEN 前端 SHALL 显示菜单编辑表单
7. WHEN 系统管理员修改菜单信息 THEN 前端 SHALL 调用更新菜单 API 并刷新菜单树
8. WHEN 系统管理员点击删除菜单按钮 THEN 前端 SHALL 显示确认对话框并调用删除 API
9. WHEN 前端显示菜单操作按钮 THEN 前端 SHALL 只对系统管理员显示创建、编辑、删除按钮

### 需求 6: 前端租户管理

**用户故事：** 作为系统管理员，我希望通过前端界面管理租户，以便创建、编辑和删除租户。

#### 验收标准

1. WHEN 系统管理员访问租户管理页面 THEN 前端 SHALL 显示所有租户列表
2. WHEN 租户管理员访问租户管理页面 THEN 前端 SHALL 拒绝访问
3. WHEN 系统管理员点击创建租户按钮 THEN 前端 SHALL 显示租户创建表单
4. WHEN 系统管理员提交租户创建表单 THEN 前端 SHALL 调用创建租户 API 并刷新列表
5. WHEN 系统管理员点击编辑租户按钮 THEN 前端 SHALL 显示租户编辑表单
6. WHEN 系统管理员修改租户信息 THEN 前端 SHALL 调用更新租户 API 并刷新列表
7. WHEN 系统管理员点击删除租户按钮 THEN 前端 SHALL 显示确认对话框并调用删除 API
8. WHEN 前端显示租户操作按钮 THEN 前端 SHALL 只对系统管理员显示创建、编辑、删除按钮

### 需求 7: 前端租户 Profile 管理

**用户故事：** 作为租户管理员，我希望通过前端界面更新租户 Profile，以便维护租户信息。

#### 验收标准

1. WHEN 租户管理员访问租户 Profile 页面 THEN 前端 SHALL 显示当前租户的 Profile 信息
2. WHEN 租户管理员点击编辑按钮 THEN 前端 SHALL 显示 Profile 编辑表单
3. WHEN 租户管理员修改 Profile 信息 THEN 前端 SHALL 调用更新租户 Profile API
4. WHEN 租户管理员尝试修改租户状态 THEN 前端 SHALL 不显示状态修改选项
5. WHEN 系统管理员访问租户 Profile 页面 THEN 前端 SHALL 重定向到租户管理页面

### 需求 8: 前端权限控制

**用户故事：** 作为系统，我希望前端能够根据用户权限控制界面元素的显示和功能的访问，以便保护系统资源。

#### 验收标准

1. WHEN 前端加载用户信息 THEN 前端 SHALL 从后端获取完整的用户上下文（isSystemAdmin、isTenantAdmin、roles、permissions、menus）
2. WHEN 前端存储用户信息 THEN 前端 SHALL 将用户上下文存储到 Pinia Store 和 localStorage
3. WHEN 前端渲染菜单 THEN 前端 SHALL 根据用户菜单动态生成侧边栏
4. WHEN 前端渲染路由 THEN 前端 SHALL 根据用户菜单动态生成路由
5. WHEN 前端渲染按钮 THEN 前端 SHALL 根据用户权限显示或隐藏按钮
6. WHEN 用户访问无权限的路由 THEN 前端 SHALL 重定向到 403 页面
7. WHEN 用户点击无权限的按钮 THEN 前端 SHALL 显示权限不足提示

### 需求 9: 前端请求头规范

**用户故事：** 作为前端开发人员，我希望前端能够正确设置请求头，以便后端能够正确识别用户身份和租户上下文。

#### 验收标准

1. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 X-Token
2. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 X-Tenant-ID
3. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 X-Facility-ID
4. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 X-System-Code
5. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 Accept-Language
6. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 Item-Time-Zone
7. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 x-channel

### 需求 10: 前端用户体验优化

**用户故事：** 作为用户，我希望前端界面友好易用，以便高效地完成工作。

#### 验收标准

1. WHEN 用户登录时 THEN 前端 SHALL 自动填充上次登录的租户和设施
2. WHEN 用户操作失败 THEN 前端 SHALL 显示清晰的错误提示
3. WHEN 用户执行长时间操作 THEN 前端 SHALL 显示加载动画
4. WHEN 用户提交表单 THEN 前端 SHALL 进行客户端验证
5. WHEN 用户切换租户或设施 THEN 前端 SHALL 刷新用户上下文和菜单
