# 需求文档 - IAM 用户体系重构

## 简介

本需求文档描述了 IAM (Identity and Access Management) 用户体系重构项目的需求。该项目旨在简化现有的三层用户体系（GlobalUser、CentralUser、TenantUser），统一登录流程，支持跨租户场景，并适配内网环境。

重构的核心目标包括：
1. 合并 GlobalUser 和 CentralUser 为统一的用户模型
2. 实现基于 username + password + tenantCode 的统一登录流程
3. 支持一个用户属于多个租户的场景
4. 删除所有依赖外网的功能（邮件/短信验证码）
5. 优化用户体验，记录并自动填充上次登录的租户

## 术语表

- **系统（System）**: IAM 身份认证与访问管理系统
- **全局用户（GlobalUser）**: 全局用户实体，系统中的统一用户模型
- **租户用户（TenantUser）**: 租户用户关联实体，记录用户在特定租户内的状态
- **系统管理员（SystemAdmin）**: 系统管理员，拥有跨租户的全局管理权限
- **租户（Tenant）**: 租户，系统中的组织单位
- **租户编码（TenantCode）**: 租户编码，租户的唯一标识符
- **令牌（Token）**: 身份认证令牌，用于验证用户身份
- **预登录（PreLogin）**: 预登录，验证用户名密码并返回租户信息的过程
- **菜单（Menu）**: 菜单，系统功能的导航结构
- **角色（Role）**: 角色，权限的集合
- **权限（Permission）**: 权限，对系统资源的访问控制

## 需求

### 需求 1: 用户模型统一

**用户故事：** 作为系统架构师，我希望将 GlobalUser 和 CentralUser 合并为统一的用户模型，以便简化系统架构并降低维护成本。

#### 验收标准

1. WHEN 系统创建新用户 THEN 系统 SHALL 分配全局唯一的 userId（使用雪花算法生成，确保趋势递增，避免页分裂）
2. WHEN 系统存储用户数据 THEN 系统 SHALL 在 GlobalUser 实体中存储 username、password、tenantIds 数组、facilityIds 数组、lastLoginTenantId、lastLoginFacilityId、isSystemAdmin 标志、email、phone、nickname、avatar 和 status
3. WHEN 创建系统管理员用户 THEN 系统 SHALL 确保 username 在所有系统管理员用户中唯一（isSystemAdmin = true 的用户）
4. WHEN 创建非系统管理员用户 THEN 系统 SHALL 确保 username + tenantId 组合在系统中全局唯一
5. WHEN 系统查询用户数据 THEN 系统 SHALL 从统一的 GlobalUser 实体中检索所有用户信息
6. WHEN 系统存储用户设施关联 THEN 系统 SHALL 在 GlobalUser 实体中维护 facilityIds JSON 数组

### 需求 2: 统一登录流程

**用户故事：** 作为用户，我希望使用 username + password + tenantCode + facilityId 进行登录，以便以统一的方式访问系统并选择工作设施。

#### 验收标准

1. WHEN 用户提交用户名和密码 THEN 系统 SHALL 验证凭据并返回用户的租户列表和设施列表
2. WHEN 系统成功验证凭据 THEN 系统 SHALL 返回用户的 tenantIds、facilityIds、lastLoginTenantId、lastLoginFacilityId 和建议的租户及设施信息
3. IF 用户仅属于一个租户 THEN 系统 SHALL 自动选择该租户作为建议租户
4. IF 用户属于多个租户 AND lastLoginTenantId 存在 THEN 系统 SHALL 选择上次登录的租户作为建议租户
5. IF 用户在选定租户下仅有一个设施 THEN 系统 SHALL 自动选择该设施作为建议设施
6. IF 用户在选定租户下有多个设施 AND lastLoginFacilityId 存在 THEN 系统 SHALL 选择上次登录的设施作为建议设施
7. WHEN 用户提交 username、password、tenantCode 和 facilityId THEN 系统 SHALL 验证 tenantCode 和 facilityId 对应的租户和设施在用户的权限范围内
8. WHEN 登录成功 THEN 系统 SHALL 生成包含 userId、tenantId 和 facilityId 的令牌
9. WHEN 登录成功 THEN 系统 SHALL 更新用户的 lastLoginTenantId 和 lastLoginFacilityId
10. WHEN 系统管理员登录 THEN 系统 SHALL 允许访问而不强制要求 tenantCode 和 facilityId
11. WHEN 系统管理员选择租户和设施登录 THEN 系统 SHALL 验证该租户下是否存在该设施

### 需求 3: 多租户支持

**用户故事：** 作为用户，我希望能够属于多个租户，以便在不同的组织环境中工作。

#### 验收标准

1. WHEN 系统存储用户租户关联 THEN 系统 SHALL 在 GlobalUser 实体中维护 tenantIds JSON 数组
2. WHEN 用户被添加到租户 THEN 系统 SHALL 将 tenantId 追加到用户的 tenantIds 数组
3. WHEN 用户被添加到租户 THEN 系统 SHALL 验证该租户中不存在具有相同 username 的用户
4. IF 检测到用户名冲突 THEN 系统 SHALL 拒绝操作并返回指示冲突的错误消息
5. WHEN 用户从租户中移除 THEN 系统 SHALL 从用户的 tenantIds 数组中删除 tenantId
6. WHEN 用户从其 lastLoginTenantId 中移除 THEN 系统 SHALL 清空 lastLoginTenantId 字段

### 需求 4: 用户名唯一性约束

**用户故事：** 作为系统管理员，我希望系统能够正确处理用户名唯一性约束，以便避免用户名冲突。

#### 验收标准

1. WHEN 系统创建系统管理员用户 THEN 系统 SHALL 确保 username 不存在于任何其他系统管理员用户（isSystemAdmin = true）
2. WHEN 系统将用户添加到租户 THEN 系统 SHALL 验证该租户中不存在具有相同 username 的其他用户
3. WHEN 系统在租户中检测到用户名冲突 THEN 系统 SHALL 返回错误代码 3001 以及租户名称和用户名
4. WHEN 系统验证用户名唯一性 THEN 系统 SHALL 从冲突检查中排除当前用户
5. WHEN 用户更改其用户名 THEN 系统 SHALL 验证新 username 在用户所属的所有租户中都不存在冲突

### 需求 5: 内网环境适配

**用户故事：** 作为系统部署人员，我希望系统能够在内网环境中运行，不依赖外网服务，以便满足安全和网络隔离要求。

#### 验收标准

1. WHEN 系统认证用户 THEN 系统 SHALL 仅使用用户名和密码，无需电子邮件或手机验证
2. WHEN 系统存储电子邮件和手机号 THEN 系统 SHALL 将它们视为仅显示字段，无需验证
3. WHEN 用户更新其个人资料 THEN 系统 SHALL 允许更新电子邮件和手机号，无需发送验证码
4. WHEN 系统提供密码重置功能 THEN 系统 SHALL 要求管理员干预，无需发送电子邮件或短信验证码

### 需求 6: 菜单管理权限

**用户故事：** 作为系统管理员，我希望只有系统管理员能够管理全局菜单，以便保持菜单结构的一致性和安全性。

#### 验收标准

1. WHEN 系统管理员查询菜单 THEN 系统 SHALL 返回所有菜单，无需基于角色过滤
2. WHEN 非系统管理员用户查询菜单 THEN 系统 SHALL 根据用户分配的角色过滤菜单
3. WHEN 系统管理员创建、更新或删除菜单 THEN 系统 SHALL 允许该操作
4. WHEN 非系统管理员用户尝试创建、更新或删除菜单 THEN 系统 SHALL 拒绝该操作
5. WHEN 系统存储菜单数据 THEN 系统 SHALL 不将菜单与特定租户关联

### 需求 7: 角色管理

**用户故事：** 作为系统管理员，我希望能够创建和管理租户超管角色，以便为租户提供管理权限。

#### 验收标准

1. WHEN 系统创建租户超管角色 THEN 系统 SHALL 将 isTenantAdmin 设置为 true 并将 tenantId 设置为 null
2. WHEN 系统管理员创建角色 THEN 系统 SHALL 允许创建租户特定角色和租户超管角色
3. WHEN 非系统管理员用户创建角色 THEN 系统 SHALL 将角色创建限制在其自己的租户内
4. WHEN 用户为另一个用户分配角色 THEN 系统 SHALL 仅允许分配分配者拥有的角色
5. WHEN 系统查询用户的角色 THEN 系统 SHALL 返回与用户当前租户上下文关联的角色

### 需求 8: 用户个人信息管理

**用户故事：** 作为用户，我希望能够查看和更新我的个人信息，以便保持信息的准确性。

#### 验收标准

1. WHEN 用户查询其个人资料 THEN 系统 SHALL 返回 userId、username、nickname、email、phone、avatar 和租户列表
2. WHEN 用户更新其个人资料 THEN 系统 SHALL 允许更新 nickname、email、phone 和 avatar
3. WHEN 用户更新其个人资料 THEN 系统 SHALL 不允许更新 username 或 userId
4. WHEN 用户更改其密码 THEN 系统 SHALL 要求当前密码进行验证
5. WHEN 用户更改其密码 THEN 系统 SHALL 使用 BCrypt 加密新密码

### 需求 9: 权限验证

**用户故事：** 作为系统，我需要正确验证用户权限，以便保护系统资源的安全。

#### 验收标准

1. WHEN 系统验证系统管理员的权限 THEN 系统 SHALL 授予所有权限而无需检查角色分配
2. WHEN 系统验证非系统管理员用户的权限 THEN 系统 SHALL 检查用户在当前租户中的角色分配
3. WHEN 系统验证 API 访问 THEN 系统 SHALL 验证用户对请求的操作具有所需权限
4. WHEN 系统验证菜单访问 THEN 系统 SHALL 根据用户的权限过滤菜单项
5. WHEN 系统验证按钮级权限 THEN 系统 SHALL 返回用于 UI 渲染的权限标志

### 需求 10: 审计日志

**用户故事：** 作为安全审计员，我希望系统记录所有关键操作，以便进行安全审计和问题追踪。

#### 验收标准

1. WHEN 用户成功登录 THEN 系统 SHALL 记录登录时间、tenantId 和 IP 地址
2. WHEN 用户的租户关联发生变化 THEN 系统 SHALL 记录操作、操作员和时间戳
3. WHEN 系统管理员执行管理操作 THEN 系统 SHALL 记录详细的操作日志
4. WHEN 用户的权限发生变化 THEN 系统 SHALL 记录权限变更和操作员
5. WHEN 系统检测到用户名冲突 THEN 系统 SHALL 记录冲突尝试以及用户和租户信息

### 需求 11: 错误处理

**用户故事：** 作为用户，我希望在操作失败时收到清晰的错误信息，以便了解问题并采取正确的行动。

#### 验收标准

1. WHEN 用户名或密码不正确 THEN 系统 SHALL 返回错误代码 3004 和消息"用户名或密码错误"
2. WHEN 检测到用户名冲突 THEN 系统 SHALL 返回错误代码 3001 以及租户名称和用户名
3. WHEN 用户尝试访问不存在的租户 THEN 系统 SHALL 返回错误代码 3003 和消息"租户不存在"
4. WHEN 用户尝试访问其不属于的租户 THEN 系统 SHALL 返回错误代码 3006 和消息"用户不属于该租户"
5. WHEN 系统遇到内部错误 THEN 系统 SHALL 返回通用错误消息而不暴露系统详细信息

### 需求 12: 性能要求

**用户故事：** 作为系统用户，我希望系统响应迅速，以便高效地完成工作。

#### 验收标准

1. WHEN 用户提交登录凭据 THEN 系统 SHALL 在正常负载下 2 秒内响应
2. WHEN 系统查询用户租户关联 THEN 系统 SHALL 在 tenantIds JSON 字段上使用索引查询
3. WHEN 系统验证用户名唯一性 THEN 系统 SHALL 在 500 毫秒内完成检查
4. WHEN 系统查询用户的菜单 THEN 系统 SHALL 在 1 秒内返回菜单树

### 需求 13: 网关集成和请求头规范

**用户故事：** 作为系统架构师，我希望网关层能够正确处理新的用户模型并规范请求头，以便实现统一的认证和授权。

#### 验收标准

1. WHEN 网关验证令牌 THEN 网关 SHALL 从令牌中提取 userId、username、tenantId、facilityId 和 isSystemAdmin
2. WHEN 网关处理来自系统管理员的请求 THEN 网关 SHALL 跳过租户、设施和权限验证
3. WHEN 网关处理来自非系统管理员用户的请求 THEN 网关 SHALL 验证令牌中的 tenantId 和 facilityId 与请求上下文匹配
4. WHEN 网关注入用户信息 THEN 网关 SHALL 在请求头中包含 X-User-Id、X-Username、X-Tenant-ID、X-Facility-ID、X-Is-System-Admin 和 X-Gateway-Request
5. WHEN 网关遇到无效令牌 THEN 网关 SHALL 返回 HTTP 401 未授权
6. WHEN 前端发送请求 THEN 前端 SHALL 在请求头中包含 X-Token、x-channel、X-Tenant-ID、X-Facility-ID、X-System-Code、Accept-Language 和 Item-Time-Zone
7. WHEN 网关处理请求 THEN 网关 SHALL 删除 X-User-Roles 和 X-User-Permissions 请求头（已废弃）
8. WHEN 系统处理请求 THEN 系统 SHALL 从请求头中读取 X-Tenant-ID 和 X-Facility-ID 进行租户和设施隔离
9. WHEN 网关验证API权限 THEN 网关 SHALL 检查用户是否有权访问请求的API路径
10. WHEN 网关验证API权限 THEN 网关 SHALL 基于用户角色关联的菜单中的 apiPaths 字段进行权限判断
11. WHEN 系统管理员访问API THEN 网关 SHALL 跳过API权限验证
12. WHEN 网关标识请求来源 THEN 网关 SHALL 在请求头中添加 X-Gateway-Request 标识

### 需求 14: 请求头处理逻辑

**用户故事：** 作为后端开发人员，我希望系统能够正确处理和验证请求头信息，以便实现租户隔离和用户身份识别。

#### 验收标准

1. WHEN 后端接收请求 THEN 后端 SHALL 从 X-Token 请求头中解析用户身份信息
2. WHEN 后端接收请求 THEN 后端 SHALL 从 X-Tenant-ID 请求头中获取租户上下文
3. WHEN 后端接收请求 THEN 后端 SHALL 从 X-Facility-ID 请求头中获取设施上下文
4. WHEN 后端接收请求 THEN 后端 SHALL 从 X-User-Id 和 X-Username 请求头中获取用户信息（网关注入）
5. WHEN 后端处理租户隔离 THEN 后端 SHALL 使用 X-Tenant-ID 进行数据过滤
6. WHEN 后端处理设施隔离 THEN 后端 SHALL 使用 X-Facility-ID 进行数据过滤
7. WHEN 后端接收到 X-User-Roles 或 X-User-Permissions 请求头 THEN 后端 SHALL 忽略这些请求头（已废弃）
8. WHEN 后端需要用户权限信息 THEN 后端 SHALL 从 Token 或数据库中查询，而不是从请求头中获取
9. WHEN 后端处理国际化 THEN 后端 SHALL 从 Accept-Language 请求头中获取语言偏好
10. WHEN 后端处理时区 THEN 后端 SHALL 从 Item-Time-Zone 请求头中获取时区信息

### 需求 15: 数据库重建

**用户故事：** 作为数据库管理员，我希望重新设计并创建全新的数据库表结构，以便支持新的用户体系架构。

#### 验收标准

1. WHEN 系统重建数据库 THEN 系统 SHALL 删除所有 Central 相关表（iam_central_user、iam_central_role、iam_central_menu、iam_central_user_role、iam_central_role_menu）
2. WHEN 系统创建 global_user 表 THEN 系统 SHALL 包含 username、password、tenantIds、facilityIds、lastLoginTenantId、lastLoginFacilityId、isSystemAdmin、email、phone、nickname、avatar、status 和 delFlag 字段
3. WHEN 系统创建 iam_menu 表 THEN 系统 SHALL 删除 tenantId 字段，使菜单全局共享
4. WHEN 系统创建 iam_role 表 THEN 系统 SHALL 添加 isTenantAdmin 字段以支持租户超管角色
5. WHEN 系统初始化数据库 THEN 系统 SHALL 重写 iam-app/db-script/ddl/init 目录下的所有 SQL 脚本
6. WHEN 系统初始化数据库 THEN 系统 SHALL 参考原有功能创建初始化数据（超级管理员、默认角色、基础菜单）
7. WHEN 系统创建索引 THEN 系统 SHALL 在 global_user 表的 username 字段上创建索引以优化查询性能


### 需求 16: 本地调试认证拦截器

**用户故事：** 作为开发人员，我希望在本地调试时不启动网关也能进行认证和权限验证，以便提高开发效率和调试便利性。

#### 验收标准

1. WHEN 系统接收到请求 THEN 系统 SHALL 检查请求是否来自网关（通过特定请求头标识）
2. WHEN 请求来自网关 THEN 系统 SHALL 直接放行，使用网关注入的用户信息
3. WHEN 请求不来自网关 THEN 系统 SHALL 执行本地认证逻辑
4. WHEN 执行本地认证 THEN 系统 SHALL 从 X-Token 请求头中提取 Token
5. WHEN Token 存在且有效 THEN 系统 SHALL 验证 Token 并提取用户信息
6. WHEN Token 不存在或无效 THEN 系统 SHALL 返回 HTTP 401 未授权错误
7. WHEN 本地认证成功 THEN 系统 SHALL 将用户信息注入到请求头中（模拟网关行为）
8. WHEN 本地认证成功 THEN 系统 SHALL 设置 TokenHolder 和 IsolationHolder 上下文
9. WHEN 请求处理完成 THEN 系统 SHALL 清理 ThreadLocal 上下文，避免内存泄漏
10. WHEN 拦截器配置 THEN 系统 SHALL 排除公开接口（如登录、预登录、健康检查等）
11. WHEN 拦截器部署 THEN 系统 SHALL 在 common 模块中实现，供所有应用使用
12. WHEN 生产环境部署 THEN 系统 SHALL 通过配置开关控制拦截器是否启用（生产环境禁用本地认证）


### 需求 17: 用户上下文管理

**用户故事：** 作为系统，我希望能够从请求上下文中获取当前登录用户的信息，以便进行权限验证和业务处理。

#### 验收标准

1. WHEN 用户登录成功 THEN 系统 SHALL 将用户信息（userId、username、tenantId、facilityId、isSystemAdmin）存储到 TokenHolder 或 SecurityContext
2. WHEN 处理请求 THEN 系统 SHALL 能够从上下文中获取 userId、username、tenantId、facilityId、isSystemAdmin
3. WHEN 请求处理完成 THEN 系统 SHALL 清理 ThreadLocal 上下文，避免内存泄漏
4. WHEN 网关注入用户信息 THEN 系统 SHALL 从请求头（X-User-Id、X-Username、X-Tenant-ID、X-Facility-ID、X-Is-System-Admin）中读取用户信息
5. WHEN 本地调试模式 THEN 系统 SHALL 从 Token 中解析用户信息并存储到上下文

### 需求 18: 租户隔离策略

**用户故事：** 作为系统架构师，我希望系统能够根据不同的用户角色和业务场景灵活应用租户隔离策略，以便实现精细化的数据访问控制。

#### 验收标准

1. WHEN 系统管理员查询用户列表 THEN 系统 SHALL 返回所有租户的所有用户
2. WHEN 租户管理员查询用户列表 THEN 系统 SHALL 仅返回当前租户的用户
3. WHEN 普通用户查询用户列表 THEN 系统 SHALL 仅返回当前租户的用户
4. WHEN 系统管理员查询角色列表 THEN 系统 SHALL 返回所有租户的角色和租户超管角色
5. WHEN 租户管理员查询角色列表 THEN 系统 SHALL 返回当前租户的角色和租户超管角色
6. WHEN 普通用户查询角色列表 THEN 系统 SHALL 返回当前租户的角色
7. WHEN 系统处理 IAM 模块的用户管理和角色管理请求 THEN 系统 SHALL 不应用自动租户隔离拦截器
8. WHEN 系统处理业务模块（WMS、MDM等）的请求 THEN 系统 SHALL 应用自动租户隔离拦截器
9. WHEN 自动租户隔离拦截器应用 THEN 系统 SHALL 在 SQL 查询中自动添加 tenant_id 过滤条件
10. WHEN 系统管理员访问业务数据 THEN 系统 SHALL 根据登录时选择的租户进行隔离（如果选择了租户）

### 需求 19: 租户管理

**用户故事：** 作为系统管理员，我希望能够管理租户信息，以便为不同的组织提供服务。

#### 验收标准

1. WHEN 系统管理员创建租户 THEN 系统 SHALL 分配全局唯一的 tenantId 和 tenantCode
2. WHEN 系统管理员创建租户 THEN 系统 SHALL 存储租户名称、租户编码、logo、联系人、联系电话、联系邮箱、状态和其他基本信息
3. WHEN 系统管理员更新租户信息 THEN 系统 SHALL 允许更新租户名称、logo、联系人、联系电话、联系邮箱、状态等字段
4. WHEN 系统管理员更新租户信息 THEN 系统 SHALL 不允许更新 tenantId 和 tenantCode
5. WHEN 租户管理员更新租户 profile THEN 系统 SHALL 允许更新租户名称、logo、联系人、联系电话、联系邮箱
6. WHEN 租户管理员更新租户 profile THEN 系统 SHALL 不允许更新 tenantId、tenantCode 和 status
7. WHEN 系统管理员禁用租户 THEN 系统 SHALL 阻止该租户的用户登录
8. WHEN 系统管理员删除租户 THEN 系统 SHALL 使用逻辑删除（设置 del_flag = 1）
9. WHEN 系统管理员查询租户列表 THEN 系统 SHALL 返回所有租户（包括已禁用的）
10. WHEN 非系统管理员查询租户列表 THEN 系统 SHALL 仅返回用户所属的租户
11. WHEN 系统验证租户编码 THEN 系统 SHALL 确保 tenantCode 全局唯一
12. WHEN 用户登录时选择租户 THEN 系统 SHALL 验证租户是否存在且启用

### 需求 20: 设施引用

**用户故事：** 作为系统，我希望能够引用 MDM 模块中的设施信息，以便用户可以选择设施登录。

#### 验收标准

1. WHEN 用户登录时选择设施 THEN 系统 SHALL 使用设施编码（facilityCode）和设施名称（facilityName）
2. WHEN 系统存储用户的设施关联 THEN 系统 SHALL 在 facilityIds JSON 数组中存储设施编码（facilityCode）
3. WHEN 系统存储用户的最后登录设施 THEN 系统 SHALL 在 lastLoginFacilityId 字段中存储设施编码（facilityCode）
4. WHEN PreLogin 返回设施列表 THEN 系统 SHALL 返回设施编码和设施名称（从 MDM 模块查询或从用户输入获取）
5. WHEN 用户登录时选择设施 THEN 系统 SHALL 验证用户的 facilityIds 数组中是否包含该设施编码
6. WHEN 系统管理员或租户管理员为用户分配设施 THEN 系统 SHALL 手动输入设施编码和设施名称
7. WHEN 系统验证设施权限 THEN 系统 SHALL 仅验证设施编码是否在用户的 facilityIds 数组中
8. WHEN 未来 MDM 模块实现后 THEN 系统 SHALL 可以从 MDM 模块查询设施的详细信息
9. WHEN 系统生成 Token THEN 系统 SHALL 在 Token 中包含设施编码（facilityCode）
10. WHEN 网关注入用户信息 THEN 网关 SHALL 在 X-Facility-ID 请求头中传递设施编码（facilityCode）
