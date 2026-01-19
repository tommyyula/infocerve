# 实施任务清单 - IAM 系统功能完善

## 任务概述

本任务清单用于实施 IAM 系统功能完善，包括：
- 删除 TenantUser 实体及相关代码
- 完善租户用户管理功能
- 完善角色管理功能
- 完善登录流程
- 实现网关需要的验证接口
- 删除验证码功能
- 实现租户配置管理
- 改造租户隔离拦截器

## 任务列表

### 阶段 1：代码清理和准备工作

- [ ] 1. 删除 TenantUser 相关代码






  - 删除 TenantUser 实体类
  - 删除 TenantUserRepository 接口和实现
  - 删除 TenantUserService 接口和实现
  - 删除 TenantUserApplicationService
  - 删除 TenantUserController
  - 删除 TenantUserMapper 和相关 XML 文件
  - 删除 IamConstants.TenantUser 常量类
  - 更新 UserMapper 将泛型从 TenantUser 改为 GlobalUser
  - _需求：1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_


- [ ] 2. 删除验证码相关代码

  - 删除验证码生成接口
  - 删除验证码验证逻辑
  - 从登录接口中移除验证码参数
  - _需求：2.1, 2.2, 2.3_
  - _修改：删除了 3 个验证码服务文件（CaptchaService, CaptchaServiceImpl, CaptchaDto）_
  - _修改：LoginCmd.java - 移除 captcha 和 captchaKey 字段_
  - _修改：UpdatePhoneCmd.java - 移除验证码字段_
  - _修改：UpdateEmailCmd.java - 移除验证码字段_
  - _修改：ResetPasswordCmd.java - 移除所有验证码字段_
  - _开始时间：2025-12-09 17:23:40_
  - _完成时间：2025-12-09 17:31:27_
  - _耗时：7分47秒_
  - _修改：CaptchaController.java - 删除验证码生成接口_
  - _修改：VerifyCodeService.java - 删除验证码服务接口_
  - _修改：VerifyCodeServiceImpl.java - 删除验证码服务实现_
  - _修改：VerifyCodePurpose.java - 删除验证码用途枚举_
  - _修改：SendVerifyCodeCmd.java - 删除发送验证码命令_
  - _修改：GlobalUserApplicationService.java - 移除验证码验证逻辑_
  - _开始时间：2025-12-09 17:07:01_
  - _完成时间：2025-12-09 17:22:05_
  - _耗时：15分4秒_
  - _需求：2.1, 2.2, 2.3_

- [ ] 3. 删除重复的用户信息接口



  - 删除 /auth/user-info 接口
  - 保留 /auth/userinfo 接口
  - _需求：3.1, 3.2_
  - _修改：AuthController.java - 删除 getUserInfo() 方法（/auth/user-info 接口）_
  - _保留：AuthController.java - 保留 getCurrentUser() 方法（/auth/userinfo 接口）_
  - _开始时间：2025-12-09 17:32:55_
  - _完成时间：2025-12-09 17:34:19_
  - _耗时：1分24秒_

### 阶段 2：完善 GlobalUser 实体和常量定义

- [x] 4. 完善 GlobalUser 实体

  - 添加 facilityIds 字段（JSON数组）
  - 添加 realName 字段
  - 添加 isSystemAdmin() 业务方法
  - 添加 hasAccessToFacility() 业务方法
  - 添加设施管理方法（addFacility、removeFacility）
  - _需求：4.1, 4.2, 5.3, 6.6_
  - _说明：移除了 isTenantAdmin() 方法，租户管理员角色由 Role.isTenantAdmin 字段管理_
  - _验证：GlobalUser.java - 已包含所有必需字段和业务方法_
  - _开始时间：2025-12-09 18:26:35_
  - _完成时间：2025-12-09 18:31:49_
  - _耗时：5分14秒_

- [ ] 5. 完善 IamConstants 常量定义

  - 添加 Status 常量（ENABLED = "0", DISABLED = "1"）
  - 添加 RedisKeyPrefix 常量（API_PATHS_TENANT_PREFIX, USER_FACILITIES_PREFIX）
  - 添加 TimeMinutes 常量（API_PATHS_CACHE_TTL_MINUTES, FACILITY_CACHE_TTL_MINUTES）
  - _需求：4.13, 5.3, 5.6_
  - _修改：IamConstants.java - 添加 USER_FACILITIES_PREFIX 常量_
  - _验证：Status、RedisKeyPrefix、TimeMinutes 常量已完整_
  - _开始时间：2025-12-09 18:42:33_
  - _完成时间：2025-12-09 18:45:09_


  - _耗时：2分36秒_

### 阶段 3：实现网关验证接口

- [x] 6. 实现 validateToken 接口



  - 实现 AuthApplicationService.validateToken() 方法
  - 从 Token 中获取用户信息
  - 查询 GlobalUser 获取 isSystemAdmin
  - 返回 ValidateTokenDto（包含 isSystemAdmin 字段）
  - 在 AuthController 中添加 POST /auth/validate-token 接口
  - _需求：10.5_
  - _修改：ValidateTokenDto.java - 更新字段定义（valid, userId, username, tenantId, facilityId, isSystemAdmin, expiresIn）_
  - _修改：AuthApplicationService.java - 实现 validateToken() 方法_
  - _修改：AuthController.java - 更新 /auth/validate-token 接口，调用 validateToken() 方法_
  - _验证：编译通过，无错误_
  - _开始时间：2025-12-09 18:55:50_
  - _完成时间：2025-12-09 19:00:48_
  - _耗时：4分58秒_

- [x] 7. 实现 validatePermission 接口
  - 实现 AuthApplicationService.validatePermission() 方法
  - 实现 isApiPathInAnyMenu() 方法（检查接口是否需要权限管控）
  - 实现 getUserApiPaths() 方法（带Redis缓存，TTL 5分钟）
  - 实现 queryUserApiPathsFromDatabase() 方法
  - 实现 clearUserApiPathsCache() 方法
  - 实现 clearUserApiPathsCacheBatch() 方法
  - ApiPathMatcher 工具类已存在（支持通配符匹配）
  - 在 AuthController 中更新 POST /auth/validate-permission 接口
  - _需求：10.2_
  - _修改：AuthApplicationService.java - 添加 MenuRepository、UserRoleMapper、RoleMenuMapper 依赖_
  - _修改：AuthApplicationService.java - 实现 validatePermission() 及 5 个辅助方法_
  - _修改：AuthController.java - 更新 /auth/validate-permission 接口实现_
  - _修复：MenuRepository.java - 添加 findByMenuIds() 方法_
  - _修复：MenuRepositoryImpl.java - 实现 findByMenuIds() 方法_
  - _修复：AuthApplicationService.java - 修复 queryUserApiPathsFromDatabase() 中的编译错误_
  - _验证：编译通过，无错误_
  - _开始时间：2025-12-09 20:05:49_
  - _完成时间：2025-12-10 09:36:32_
  - _耗时：13小时30分43秒_

- [x] 8. 实现 validateTenant 接口


  - 实现 AuthApplicationService.validateTenant() 方法
  - 验证租户是否存在且启用
  - 验证用户是否属于该租户（可选）
  - 在 AuthController 中更新 POST /auth/validate-tenant 接口
  - _需求：10.2_
  - _修改：AuthApplicationService.java - 实现 validateTenant(tenantId, userId) 方法_
  - _修改：AuthController.java - 更新 /auth/validate-tenant 接口实现_
  - _验证：编译通过，无错误_
  - _开始时间：2025-12-10 10:31:29_
  - _完成时间：2025-12-10 10:41:48_
  - _耗时：10分19秒_

- [x] 9. 实现 validateFacility 接口

  - 实现 AuthApplicationService.validateFacility() 方法
  - 实现 getUserFacilities() 方法（带Redis缓存，TTL 20分钟）
  - 实现 clearUserFacilitiesCache() 方法
  - 在 AuthController 中已有 POST /auth/validate-facility 接口
  - _需求：10.2_
  - _验证：所有方法已实现，编译通过，无错误_
  - _说明：validateFacility、getUserFacilities、clearUserFacilitiesCache 方法已在之前实现_
  - _开始时间：2025-12-10 10:50:29_
  - _完成时间：2025-12-10 10:54:40_
  - _耗时：4分11秒_
  - _修改：AuthApplicationService.java - 添加 validateFacility()、getUserFacilities()、clearUserFacilitiesCache() 方法_
  - _修改：AuthController.java - 更新 /auth/validate-facility 接口实现_
  - _验证：编译通过，无错误_
  - _开始时间：2025-12-10 10:49:55_
  - _完成时间：2025-12-10 10:51:27_
  - _耗时：1分32秒_

### 阶段 4：完善登录流程

- [ ] 10. 实现 preLogin 功能

  - 实现 AuthApplicationService.preLogin() 方法
  - 根据 username 查询 GlobalUser
  - 返回用户所属的租户列表
  - 返回租户下的设施列表（设施挂在租户下）
  - 返回建议的租户和设施（上次登录的）
  - SystemAdmin 返回所有租户和所有设施列表
  - _需求：6.1, 6.2, 6.3, 6.7_
  - _验证：功能已完整实现，包含所有辅助方法_
  - _验证：编译通过，无错误_
  - _说明：此功能在之前的开发中已完成_
  - _完成时间：2025-12-10 10:54:43_

- [x] 11. 实现 login 功能

  - 实现 AuthApplicationService.login() 方法
  - 使用 username + password 验证
  - 验证租户和设施权限
  - 生成 Token 并保存
  - 记住用户选择的租户和设施
  - SystemAdmin 允许不选择租户和设施
  - _需求：6.4, 6.5, 6.6, 6.7, 6.8_
  - _验证：功能已完整实现，包含所有验证和Token生成逻辑_
  - _验证：编译通过，无错误_
  - _说明：此功能在之前的开发中已完成_
  - _完成时间：2025-12-10 10:59:42_

- [x] 12. 实现 refreshToken 功能

  - 实现 AuthApplicationService.refreshToken() 方法
  - 验证 refresh token 有效性
  - 生成新的 access token 和 refresh token
  - 在 AuthController 中实现 POST /auth/refresh 接口
  - _需求：10.1_
  - _开始时间：2025-12-10 11:02:26_
  - _完成时间：2025-12-10 11:07:01_
  - _耗时：5分钟_
  - _修改文件：AuthApplicationService.java, AuthController.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

### 阶段 5：实现租户用户管理功能

- [x] 13. 实现新增租户用户功能



  - 创建 CreateTenantUserCmd（包含必填和可选字段）
  - 实现 GlobalUserApplicationService.createTenantUser() 方法
  - 验证用户名在租户中的唯一性（username + tenantId 唯一）
  - 创建 GlobalUser 并保存
  - 分配角色（如果有 roleIds）
  - SystemAdmin 可以创建任意租户的用户
  - 非 SystemAdmin 只能创建当前租户的用户
  - 在 TenantUserController 中添加 POST /tenant-users 接口
  - _需求：4.1, 4.2, 4.5, 4.8, 4.14_
  - _开始时间：2025-12-10 11:10:12_
  - _完成时间：2025-12-10 11:16:28_
  - _耗时：6分16秒_
  - _创建文件：CreateTenantUserCmd.java, TenantUserController.java_
  - _修改文件：GlobalUserApplicationService.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

- [ ] 14. 实现编辑租户用户功能

  - 创建 UpdateTenantUserCmd（包含可更新字段）
  - 实现 GlobalUserApplicationService.updateTenantUser() 方法
  - 验证用户名不可更新
  - 更新用户基本信息（password、tenantIds、facilityIds、status、email、phone、realName）
  - 更新用户角色（roleIds）
  - SystemAdmin 可以更新任意用户
  - 非 SystemAdmin 只能更新租户下的用户
  - 在 TenantUserController 中添加 PUT /tenant-users/{userId} 接口
  - _需求：4.3, 4.4, 4.6, 4.9, 4.11, 4.12, 4.13, 4.14_
  - _开始时间：2025-12-10 11:19:20_
  - _完成时间：2025-12-10 11:21:38_

  - _耗时：2分18秒_
  - _创建文件：UpdateTenantUserCmd.java_
  - _修改文件：GlobalUserApplicationService.java, TenantUserController.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

- [x] 15. 实现查询租户用户功能

  - 实现 GlobalUserApplicationService.searchTenantUsers() 方法
  - 实现 GlobalUserApplicationService.searchTenantUsersByPaging() 方法
  - 实现 GlobalUserApplicationService.getTenantUserById() 方法
  - SystemAdmin 查询所有用户
  - 非 SystemAdmin 只查询租户下的用户
  - 在 TenantUserController 中添加查询接口
  - _需求：4.7, 4.10_
  - _开始时间：2025-12-10 11:27:23_
  - _完成时间：2025-12-10 11:36:42_
  - _耗时：9分19秒_
  - _修改文件：GlobalUserApplicationService.java, TenantUserController.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

### 阶段 6：完善角色管理功能

- [x] 16. 实现创建角色功能（带权限控制）

  - 实现 RoleApplicationService.createRole() 方法
  - SystemAdmin 可以创建任意类型的角色（包括 TenantAdmin）
  - SystemAdmin 创建角色时 tenantId 可以为空
  - 非 SystemAdmin 自动从上下文获取 tenantId
  - 非 SystemAdmin 不能创建 TenantAdmin 类型
  - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.12, 5.15_
  - _开始时间：2025-12-10 11:38:34_
  - _完成时间：2025-12-10 11:44:36_
  - _耗时：6分钟_
  - _修改文件：RoleApplicationService.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

- [x] 17. 实现编辑角色功能（带权限控制）

  - 更新 UpdateRoleCmd
  - 实现 RoleApplicationService.updateRole() 方法
  - 允许更新 roleName、description
  - 不允许更新 roleCode、tenantId
  - _需求：5.7, 5.8_
  - _开始时间：2025-12-10 11:49:41_
  - _完成时间：2025-12-10 11:57:13_
  - _耗时：7分32秒_
  - _修改文件：UpdateRoleCmd.java, RoleApplicationService.java, RoleAssembler.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

- [x] 18. 实现分配权限功能（带权限控制）


  - 实现 RoleApplicationService.assignPermissions() 方法
  - SystemAdmin 可以分配所有菜单权限
  - TenantAdmin 只能分配自身权限的子集
  - 非 SystemAdmin 和 TenantAdmin 只能分配自身权限的子集
  - _需求：5.10, 5.13, 5.16_
  - _开始时间：2025-12-10 17:23:40_
  - _完成时间：2025-12-10 17:45:15_
  - _耗时：21分35秒_
  - _修改文件：RoleApplicationService.java, RoleController.java_
  - _遵循规范：3条强制规范 + 5项核心检查_

- [ ] 19. 实现查询角色功能（带权限控制）
  - 实现 RoleApplicationService.searchRoles() 方法
  - SystemAdmin 查询所有角色
  - TenantAdmin 只查询当前租户下的角色
  - 非 SystemAdmin 和 TenantAdmin 只查询租户下的角色
  - _需求：5.11, 5.14, 5.17_

### 阶段 7：实现租户配置管理功能

- [ ] 20. 实现租户配置管理
  - 创建 TenantProfileDto（包含租户详细信息）
  - 创建 UpdateTenantProfileCmd（包含可更新字段）
  - 实现 TenantApplicationService.getTenantProfile() 方法
  - 实现 TenantApplicationService.updateTenantProfile() 方法
  - 支持 logo 的 base64 编码存储和读取
  - 创建 TenantProfileController
  - 添加 GET /tenant-profile 接口（仅租户管理员可访问）
  - 添加 PUT /tenant-profile 接口（仅租户管理员可访问）
  - _需求：7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

### 阶段 8：实现其他功能

- [ ] 21. 实现获取路由功能
  - 实现 AuthApplicationService.getRoutes() 方法
  - 从 menu 表获取用户有权限的菜单
  - 构建路由树（RouteDto）
  - 在 AuthController 中实现 GET /auth/routes 接口
  - _需求：10.3_

- [ ] 22. 实现获取租户列表功能
  - 实现 AuthApplicationService.getTenants() 方法
  - 验证用户是否为 SystemAdmin
  - 查询所有租户并返回
  - 在 AuthController 中实现 GET /auth/tenants 接口
  - _需求：10.4_

- [ ] 23. 改造租户隔离拦截器
  - 更新租户隔离拦截器逻辑
  - 从 TokenHolder 获取用户角色信息
  - SystemAdmin 不应用租户隔离
  - 非 SystemAdmin 应用租户隔离
  - 根据用户角色设置 IsolationHolder 的租户隔离标志
  - _需求：9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 24. 添加日志管理菜单数据
  - 在 2-init_menu_api_paths.sql 中添加日志管理菜单数据
  - 配置日志管理菜单的 API 路径
  - _需求：8.1, 8.2_

- [ ] 25. 删除 IP 地址解析 TODO
  - 删除 getLoginLocation 方法中的 TODO 注释
  - 确认 IP 地址解析功能正常工作
  - _需求：10.6_

### 阶段 9：Repository 接口实现

- [ ] 26. 实现 Repository 接口
  - 实现 UserRoleRepository.findRoleIdsByUserIdAndTenantId()
  - 实现 RoleMenuRepository.findMenuIdsByRoleIdsAndTenantId()
  - 实现 RoleMenuRepository.deleteByRoleId()
  - 实现 MenuRepository.findByMenuIdsAndTenantId()
  - 实现 MenuRepository.findByTenantIdAndApiPathsNotNull()
  - 实现 GlobalUserRepository.existsByUsernameAndTenantId()
  - 实现 GlobalUserRepository.getUsersByTenantId()
  - _需求：4.1, 5.10, 7.1_

### 阶段 10：测试和验证

- [ ] 27. 端到端测试
  - 测试登录流程（preLogin + login）
  - 测试租户用户管理（新增、编辑、查询）
  - 测试角色管理（创建、编辑、分配权限、查询）
  - 测试租户配置管理（查询、编辑）
  - 测试网关验证接口（validateToken、validatePermission、validateTenant、validateFacility）
  - 测试租户隔离（SystemAdmin vs 非 SystemAdmin）
  - 测试权限控制（SystemAdmin vs TenantAdmin vs 普通用户）
  - _需求：所有需求_

- [ ] 28. 更新文档和注释
  - 删除所有 TenantUser 相关的注释
  - 更新 API 文档说明
  - 更新数据库设计文档
  - _需求：11.1, 11.2, 11.3_

### 阶段 11：最终检查

- [ ] 29. 最终检查点
  - 确保所有测试通过
  - 确保所有 TODO 已删除或实现
  - 确保代码符合规范
  - 确保文档已更新
  - 向用户确认是否有遗漏的功能

---

## 任务执行说明

1. **按顺序执行**：任务按阶段组织，建议按顺序执行
2. **增量开发**：每个任务完成后立即测试，确保功能正常
3. **代码规范**：遵循项目代码规范，避免魔法值，使用常量
4. **充血模型**：业务逻辑放在实体中，Application Service 只协调
5. **缓存策略**：合理使用 Redis 缓存，设置合适的 TTL
6. **权限控制**：严格区分 SystemAdmin、TenantAdmin 和普通用户的权限
7. **租户隔离**：确保非 SystemAdmin 只能访问自己租户的数据
8. **遇到问题立即提问**：如果遇到不确定的问题，立即停下来向用户提问

---

*创建时间：2025-12-09*
*版本：1.0*
