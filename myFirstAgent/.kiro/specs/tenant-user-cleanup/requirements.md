# 需求文档 - IAM 系统功能完善

## 简介

本文档描述 IAM 系统的功能完善需求，包括：删除 TenantUser 实体、完善租户用户管理、完善角色管理、完善登录流程、删除验证码功能等。

## 术语表

- **SystemAdmin**：系统管理员，拥有最高权限，可以管理所有租户和用户
- **TenantAdmin**：租户管理员，可以管理租户内的用户和角色
- **普通角色**：非 SystemAdmin 和 TenantAdmin 的角色
- **GlobalUser**：全局用户实体，存储跨租户的用户信息
- **租户隔离**：通过 tenantIds 字段实现用户与租户的多对多关系

## 需求

### 需求 1：删除 TenantUser 相关代码

**用户故事：** 作为开发人员，我希望删除所有 TenantUser 相关的代码，以便简化系统架构并避免混淆

#### 验收标准

1. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUser 实体类
2. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUserRepository 接口和实现
3. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUserService 接口和实现
4. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUserApplicationService
5. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUserController
6. WHEN 清理代码 THEN 系统 SHALL 删除 TenantUserMapper 和相关 XML 文件
7. WHEN 清理代码 THEN 系统 SHALL 删除 IamConstants.TenantUser 常量类
8. WHEN 清理代码 THEN 系统 SHALL 更新 UserMapper 将泛型从 TenantUser 改为 GlobalUser

### 需求 2：删除验证码功能

**用户故事：** 作为开发人员，我希望删除验证码相关的代码，以便简化登录流程

#### 验收标准

1. WHEN 清理代码 THEN 系统 SHALL 删除验证码生成接口
2. WHEN 清理代码 THEN 系统 SHALL 删除验证码验证逻辑
3. WHEN 清理代码 THEN 系统 SHALL 从登录接口中移除验证码参数

### 需求 3：删除 /auth/user-info 接口

**用户故事：** 作为开发人员，我希望删除重复的用户信息接口，以便统一使用 /auth/userinfo

#### 验收标准

1. WHEN 清理代码 THEN 系统 SHALL 删除 /auth/user-info 接口
2. WHEN 清理代码 THEN 系统 SHALL 保留 /auth/userinfo 接口

### 需求 4：完善租户用户管理功能

**用户故事：** 作为管理员，我希望能够新增和编辑租户用户，以便管理租户内的用户

#### 验收标准

1. WHEN 新增用户 THEN 系统 SHALL 要求必填字段：username、password、tenantIds、facilityIds、status（默认启用）
2. WHEN 新增用户 THEN 系统 SHALL 支持可选字段：roleIds、email、phone、realName
3. WHEN 编辑用户 THEN 系统 SHALL 允许更新字段：password、tenantIds、facilityIds、status、roleIds、email、phone、realName
4. WHEN 编辑用户 THEN 系统 SHALL 不允许更新 username
5. WHEN SystemAdmin 新增用户 THEN 系统 SHALL 创建非 SystemAdmin 的 GlobalUser
6. WHEN SystemAdmin 编辑用户 THEN 系统 SHALL 更新 GlobalUser 的所有可更新字段，包括用户加入租户、用户离开租户
7. WHEN SystemAdmin 查询用户 THEN 系统 SHALL 查询所有用户，不做租户隔离
8. WHEN 非 SystemAdmin 新增用户 THEN 系统 SHALL 创建租户下的用户
9. WHEN 非 SystemAdmin 编辑用户 THEN 系统 SHALL 只能更新租户下的用户，分配角色时只能分配租户下创建的角色，不能修改 tenantIds，只能修改当前租户关联的 facilityIds
10. WHEN 非 SystemAdmin 查询用户 THEN 系统 SHALL 只能查询租户下的用户
11. WHEN 编辑用户修改邮箱 THEN 系统 SHALL 验证邮箱格式并更新 email 字段
12. WHEN 编辑用户修改手机号 THEN 系统 SHALL 验证手机号格式并更新 phone 字段
13. WHEN 新增或编辑用户时设置 status THEN 系统 SHALL 支持启用（"0"）和禁用（"1"）状态
14. WHEN 新增或编辑用户时设置 roleIds THEN 系统 SHALL 更新 user_role 关联表

### 需求 5：完善角色管理功能

**用户故事：** 作为管理员，我希望能够创建和管理角色，以便控制用户权限

#### 验收标准

1. WHEN 新增角色 THEN 系统 SHALL 要求必填字段：roleName、roleCode
2. WHEN 新增角色 THEN 系统 SHALL 支持可选字段：description
3. WHEN SystemAdmin 创建角色 THEN 系统 SHALL 允许 tenantId 为空（租户范围是全部）
5. WHEN 非 SystemAdmin 创建角色 THEN 系统 SHALL 自动从用户上下文获取 tenantId
6. WHEN 非 SystemAdmin 创建角色 THEN 系统 SHALL 不允许选择 TenantAdmin 类型
7. WHEN 编辑角色 THEN 系统 SHALL 允许更新字段：roleName、description
8. WHEN 编辑角色 THEN 系统 SHALL 不允许更新字段：roleCode、tenantId
9. WHEN SystemAdmin 分配权限 THEN 系统 SHALL 允许分配所有菜单权限
11. WHEN SystemAdmin 查询角色 THEN 系统 SHALL 查询所有角色
12. WHEN TenantAdmin 创建角色 THEN 系统 SHALL 只能创建有 tenantId 的角色
13. WHEN TenantAdmin 分配权限 THEN 系统 SHALL 只能分配自身拥有的权限的子集
14. WHEN TenantAdmin 查询角色 THEN 系统 SHALL 只能查询当前租户下的角色列表
15. WHEN 非 SystemAdmin 和 TenantAdmin 创建角色 THEN 系统 SHALL 只能创建普通角色（非 TenantAdmin）
16. WHEN 非 SystemAdmin 和 TenantAdmin 分配权限 THEN 系统 SHALL 只能分配自身权限的子集
17. WHEN 非 SystemAdmin 和 TenantAdmin 查询角色 THEN 系统 SHALL 只能查询租户下的角色列表

### 需求 6：完善登录流程

**用户故事：** 作为用户，我希望能够使用 username + password 登录，并选择租户和设施

#### 验收标准

1. WHEN 用户调用 preLogin THEN 系统 SHALL 根据 username 返回用户所属的租户列表
2. WHEN 用户上次登录过 THEN 系统 SHALL 在 preLogin 中返回 suggest（上次登录的租户和设施）
3. WHEN 用户输入租户ID THEN 系统 SHALL 返回该租户下的设施列表
4. WHEN 用户登录 THEN 系统 SHALL 使用 username + password 验证
5. WHEN 用户登录成功 THEN 系统 SHALL 记住这次选择的租户和设施
6. WHEN SystemAdmin 登录 THEN 系统 SHALL 在 preLogin 中返回所有租户和所有设施列表
7. WHEN SystemAdmin 登录 THEN 系统 SHALL 允许选择任意租户和设施，或不选择租户和设施直接登录
8. WHEN 非 SystemAdmin 登录 THEN 系统 SHALL 只能选择自己所属的租户和设施

### 需求 7：实现租户配置管理功能

**用户故事：** 作为租户管理员，我希望能够查看和编辑租户配置信息，以便管理租户的基本信息

#### 验收标准

1. WHEN 查询租户配置 THEN 系统 SHALL 返回当前租户的详细信息（tenantId、tenantName、logo、status、contactPerson、contactPhone、contactEmail、address、description 等）
2. WHEN 编辑租户配置 THEN 系统 SHALL 允许更新字段：tenantName、logo、status、contactPerson、contactPhone、contactEmail、address、description
3. WHEN 编辑租户配置 THEN 系统 SHALL 不允许更新字段：tenantId、tenantCode、createdAt、updatedAt、createdBy、updatedBy
4. WHEN 编辑租户 logo THEN 系统 SHALL 接受 base64 编码的图片数据
5. WHEN 查询租户配置 THEN 系统 SHALL 返回 base64 编码的 logo 数据
6. WHEN 前端展示租户信息 THEN 系统 SHALL 显示租户最新的 logo
7. WHEN 非租户管理员访问租户配置 THEN 系统 SHALL 拒绝访问并返回权限错误
8. WHEN 租户管理员访问租户配置 THEN 系统 SHALL 允许查看和编辑
9. WHEN 编辑租户配置中的 status THEN 系统 SHALL 支持启用（"0"）和禁用（"1"）状态

### 需求 8：添加日志管理菜单数据

**用户故事：** 作为开发人员，我希望在数据库中添加日志管理的菜单数据，以便前端可以显示日志管理功能

#### 验收标准

1. WHEN 初始化数据库 THEN 系统 SHALL 在 2-init_menu_api_paths.sql 中添加日志管理的菜单数据
2. WHEN 初始化数据库 THEN 系统 SHALL 为日志管理菜单配置正确的 API 路径

### 需求 9：改造租户隔离拦截器

**用户故事：** 作为开发人员，我希望改造租户隔离拦截器，以便根据用户角色动态决定是否应用租户隔离

#### 验收标准

1. WHEN SystemAdmin 访问接口 THEN 系统 SHALL 不应用租户隔离（可以查询所有数据）
2. WHEN 非 SystemAdmin 访问接口 THEN 系统 SHALL 应用租户隔离（只能查询租户下的数据）
3. WHEN 拦截器处理请求 THEN 系统 SHALL 从 TokenHolder 获取当前用户的角色信息
4. WHEN 拦截器处理请求 THEN 系统 SHALL 根据用户角色设置 IsolationHolder 的租户隔离标志
5. WHEN MyBatis Plus 拦截器执行 THEN 系统 SHALL 根据租户隔离标志决定是否添加 tenant_id 条件

### 需求 10：实现 AuthController 中的 TODO 功能

**用户故事：** 作为开发人员，我希望实现 AuthController 中的 TODO 功能，以便系统功能完整

#### 验收标准

1. WHEN 实现刷新 Token 功能 THEN 系统 SHALL 使用 refresh token 机制
2. WHEN 删除不需要的接口 THEN 系统 SHALL 删除 /auth/permissions、/auth/validate-permission、/auth/validate-tenant、/auth/validate-facility、/auth/validate-cross-facility 接口
3. WHEN 实现获取路由功能 THEN 系统 SHALL 从 menu 表获取数据并返回前端路由配置
4. WHEN 实现获取租户列表功能 THEN 系统 SHALL 返回全部租户列表，且只有 SystemAdmin 能调用
5. WHEN 实现验证 Token 功能 THEN 系统 SHALL 提供给网关使用的 Token 验证接口
6. WHEN 删除 IP 地址解析功能 THEN 系统 SHALL 删除 getLoginLocation 方法中的 TODO 注释

### 需求 11：更新文档和注释

**用户故事：** 作为开发人员，我希望更新相关文档和注释，以便反映新的架构

#### 验收标准

1. WHEN 更新文档 THEN 系统 SHALL 删除所有 TenantUser 相关的注释
2. WHEN 更新文档 THEN 系统 SHALL 更新 API 文档说明
3. WHEN 更新文档 THEN 系统 SHALL 更新数据库设计文档
