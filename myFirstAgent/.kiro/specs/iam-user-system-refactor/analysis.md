# IAM 用户体系重构 - 需求分析报告

## 1. 需求描述

### 1.1 简要概述
本项目旨在重构 IAM（Identity and Access Management）用户体系，解决当前系统中存在的用户模型混乱、登录流程复杂、权限体系不清晰等问题。核心目标是：
- 统一用户模型（合并 GlobalUser 和 CentralUser）
- 简化登录流程（username + password + tenantCode + facilityId）
- 支持多租户场景（一个用户可属于多个租户）
- 适配内网环境（删除外网依赖）
- 优化用户体验（记录上次登录信息）

### 1.2 主要目标
1. **架构简化**：从三层用户体系简化为统一的 GlobalUser 模型
2. **登录统一**：实现基于 username + password + tenantCode + facilityId 的统一登录
3. **多租户支持**：一个用户可以属于多个租户，灵活切换
4. **内网适配**：删除所有依赖外网的功能（邮件/短信验证码）
5. **权限清晰**：明确 SystemAdmin、TenantAdmin、普通用户的权限边界

## 2. 系统架构理解

### 2.1 当前架构问题

**三层用户体系混乱**：
- GlobalUser：全局用户
- CentralUser：中央用户（功能与 GlobalUser 重叠）
- TenantUser：租户用户（记录用户在租户内的状态）

**登录流程复杂**：
- 多种登录方式（用户名密码、手机号、邮箱、验证码）
- 租户选择逻辑不清晰
- 设施选择流程繁琐

**权限体系模糊**：
- SystemAdmin、TenantAdmin、普通用户的权限边界不清晰
- 菜单管理权限混乱
- 跨租户访问控制不明确

### 2.2 目标架构

**统一用户模型**：
```
GlobalUser (全局用户表)
├── userId (主键，雪花算法)
├── username (用户名，租户内唯一)
├── password (密码，BCrypt加密)
├── tenantIds (JSON数组，用户所属租户)
├── facilityIds (JSON数组，用户可访问设施)
├── isSystemAdmin (是否系统管理员)
├── lastLoginTenantId (上次登录租户)
├── lastLoginFacilityId (上次登录设施)
├── defaultFacilityId (默认设施)
└── 其他基本信息...
```

**统一登录流程**：
```
1. PreLogin (预登录)
   - 输入：username + password
   - 输出：用户的租户列表、设施列表、建议的租户和设施

2. Login (正式登录)
   - 输入：username + password + tenantCode + facilityId
   - 输出：Token（包含 userId、tenantId、facilityId）
```

**清晰的权限体系**：
- **SystemAdmin**：全局管理员，不属于任何租户，拥有所有权限
- **TenantAdmin**：租户管理员，通过角色标识（Role.isTenantAdmin = true）
- **普通用户**：属于一个或多个租户，权限由角色决定

### 2.3 服务组成

**IAM 服务（iam-app）**：
- 用户管理（GlobalUser CRUD）
- 认证服务（PreLogin、Login、Token 验证）
- 角色管理（Role CRUD）
- 菜单管理（Menu CRUD）
- 权限验证（Permission Check）

**网关服务（wms-lite-gateway）**：
- Token 验证
- 用户信息注入（请求头）
- API 权限验证
- 租户隔离

**Common 模块（common）**：
- 本地调试认证拦截器
- TokenHolder（用户上下文管理）
- IsolationHolder（租户/设施隔离上下文）

## 3. 核心业务对象关系

### 3.1 用户与租户关系

```
GlobalUser (1) ----< (N) Tenant
- 一个用户可以属于多个租户
- 通过 tenantIds JSON 数组维护关系
- username 在租户内唯一（不是全局唯一）
```

### 3.2 用户与设施关系

```
GlobalUser (1) ----< (N) Facility
- 一个用户可以访问多个设施
- 通过 facilityIds JSON 数组维护关系
- 设施属于租户，用户访问设施需要先属于该租户
```

### 3.3 用户与角色关系

```
GlobalUser (N) ----< (N) Role
- 一个用户可以有多个角色
- 角色属于租户（tenantId）
- 租户超管角色（isTenantAdmin = true, tenantId = null）
```

### 3.4 角色与菜单关系

```
Role (N) ----< (N) Menu
- 一个角色可以有多个菜单
- 菜单全局共享（不属于任何租户）
- SystemAdmin 可以访问所有菜单
```

### 3.5 菜单与权限关系

```
Menu (1) ----< (N) API Path
- 一个菜单可以包含多个 API 路径
- 通过 apiPaths 字段维护关系
- 网关根据 apiPaths 进行 API 权限验证
```

## 4. 任务拆分

基于需求分析，将整个重构项目拆分为以下独立任务：

### 4.1 数据库重建任务
- **任务 1**：删除 Central 相关表
- **任务 2**：创建新的 global_user 表
- **任务 3**：修改 iam_menu 表（删除 tenantId）
- **任务 4**：修改 iam_role 表（添加 isTenantAdmin）
- **任务 5**：创建初始化数据（超级管理员、默认角色、基础菜单）

### 4.2 后端 Domain 层开发任务
- **任务 6**：实现 GlobalUser 实体（充血模型）
- **任务 7**：实现 Role 实体（充血模型）
- **任务 8**：实现 Menu 实体（充血模型）

### 4.3 后端 Repository 层开发任务
- **任务 9**：实现 GlobalUserRepository
- **任务 10**：实现 RoleRepository
- **任务 11**：实现 MenuRepository

### 4.4 后端 Application Service 层开发任务
- **任务 12**：实现 AuthApplicationService（PreLogin、Login）
- **任务 13**：实现 UserApplicationService（用户管理）
- **任务 14**：实现 RoleApplicationService（角色管理）
- **任务 15**：实现 MenuApplicationService（菜单管理）

### 4.5 后端 API 层开发任务
- **任务 16**：实现 AuthController（认证接口）
- **任务 17**：实现 UserController（用户管理接口）
- **任务 18**：实现 RoleController（角色管理接口）
- **任务 19**：实现 MenuController（菜单管理接口）

### 4.6 Common 模块开发任务
- **任务 20**：实现 TokenHolder（用户上下文管理）
- **任务 21**：实现 IsolationHolder（租户/设施隔离上下文）
- **任务 22**：实现本地调试认证拦截器

### 4.7 网关服务开发任务
- **任务 23**：实现 Token 验证逻辑
- **任务 24**：实现用户信息注入（请求头）
- **任务 25**：实现 API 权限验证
- **任务 26**：实现租户隔离逻辑

### 4.8 前端开发任务
- **任务 27**：实现 PreLogin 页面
- **任务 28**：实现 Login 页面（租户和设施选择）
- **任务 29**：实现用户管理页面
- **任务 30**：实现角色管理页面
- **任务 31**：实现菜单管理页面

### 4.9 测试任务
- **任务 32**：编写单元测试
- **任务 33**：编写集成测试
- **任务 34**：编写端到端测试

### 4.10 部署任务
- **任务 35**：更新部署脚本
- **任务 36**：更新配置文件
- **任务 37**：数据迁移脚本

---

## 5. 任务详细分析

接下来，我将对每个任务进行详细分析，包括功能说明、约束条件、使用场景和示例。
