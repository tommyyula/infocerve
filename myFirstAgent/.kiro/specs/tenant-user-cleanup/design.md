# 设计文档 - TenantUser 实体清理

## 概述

本文档描述如何清理已废弃的 TenantUser 实体及相关代码，并将功能迁移到 GlobalUser。

## ⚠️ 重要说明

### DDD 充血模型原则

**本设计文档中的代码示例仅供参考，实际编码时必须遵循以下规范**：

1. **DDD 充血模型规范**（`.kiro/steering/ddd-rich-domain-model-guidelines.md`）
   - ✅ 业务逻辑必须在领域层（实体、值对象、领域服务）
   - ✅ Application Service 只协调领域对象，不包含业务逻辑
   - ✅ 状态转换通过实体的业务方法（如 `user.enable()`, `user.disable()`）
   - ❌ 禁止在 Application Service 中直接修改实体字段（如 `user.setStatus()`）

2. **阿里巴巴 Java 开发规范**（`alibaba-java-coding-guidelines.md`）
   - ✅ 避免魔法值，使用常量
   - ✅ 方法长度不超过 80 行
   - ✅ 完整的 JavaDoc 注释

3. **项目开发守则**（`shrimp-rules.md`）
   - ✅ 遵循项目特定的架构规范
   - ✅ 遵循项目特定的命名规范

### Token 机制说明

**当前项目使用 Redis + TokenInfo，不是 JWT**：

- **TokenInfo 存储内容**：userId, tenantId, facilityId（基本信息）
- **完整用户信息获取**：通过 `/auth/userinfo` 接口从数据库查询
- **Token 验证流程**：
  1. 从 Redis 获取 TokenInfo（通过 tokenValue）
  2. 从数据库查询 GlobalUser（通过 userId）
  3. 调用领域对象的业务方法验证状态（如 `user.isEnabled()`）
  4. 返回完整的用户信息

### 设计文档使用指南

**强制约束**：

1. **设计阶段（Design Phase）**
   - ✅ **允许**绕过 DDD 充血模型规范
   - ✅ **允许**绕过阿里巴巴 Java 开发规范
   - ✅ **允许**在 Application Service 中直接编写业务逻辑
   - ✅ **允许**直接修改实体字段（如 `user.setStatus()`）
   - 🎯 **目的**：快速体现编码思路和功能实现方案

2. **编码阶段（Implementation Phase）**
   - ❌ **禁止**在 Application Service 中包含业务逻辑
   - ❌ **禁止**直接修改实体的业务字段
   - ✅ **必须**将业务逻辑移到领域层
   - ✅ **必须**使用实体的业务方法（如 `user.enable()`, `user.disable()`）
   - ✅ **必须**遵循 DDD 充血模型规范
   - ✅ **必须**遵循阿里巴巴 Java 开发规范
   - ✅ **必须**遵循项目开发守则（shrimp-rules.md）

**设计文档定位**：
- 本文档展示功能的实现思路和业务流程
- 代码示例用于说明功能逻辑，不是最终实现
- 实际编码时，开发者需要根据规范重构代码结构
- 将设计文档中的业务逻辑提取到领域层

## 架构

### 当前架构（需要清理）

```
Controller 层
├── TenantUserController (废弃)
└── TenantController (部分使用 TenantUser)

Application 层
├── TenantUserApplicationService (废弃)
└── TenantApplicationService (部分使用 TenantUser)

Domain 层
├── TenantUser 实体 (废弃)
├── TenantUserService (废弃)
└── TenantUserRepository (废弃)

Infrastructure 层
├── TenantUserRepositoryImpl (废弃)
├── TenantUserMapper (废弃)
└── UserMapper (需要更新)
```

### 目标架构

```
Controller 层
└── TenantController (使用 GlobalUser)

Application 层
├── GlobalUserApplicationService (扩展功能)
└── TenantApplicationService (使用 GlobalUser)

Domain 层
├── GlobalUser 实体 (保留)
├── GlobalUserService (扩展功能)
└── GlobalUserRepository (保留)

Infrastructure 层
├── GlobalUserRepositoryImpl (保留)
├── GlobalUserMapper (保留)
└── UserMapper (更新为 GlobalUser)
```

## 组件和接口

### 新增功能：角色管理增强

#### CreateRoleCmd（更新）

```java
@Data
public class CreateRoleCmd {
    // 必填字段
    @NotBlank(message = "角色名称不能为空")
    private String roleName;
    
    @NotBlank(message = "角色代码不能为空")
    private String roleCode;
    
    // 可选字段
    private String tenantId;  // SystemAdmin 创建时可以为空，其他用户自动从上下文获取
    private String description;
}
```

#### UpdateRoleCmd（更新）

```java
@Data
public class UpdateRoleCmd {
    // 不可更新字段：roleCode、tenantId
    
    // 可更新字段
    @NotBlank(message = "角色名称不能为空")
    private String roleName;
    
    private String description;
}
```

#### RoleApplicationService（扩展）

```java
/**
 * 创建角色（带权限控制）
 */
@Transactional(rollbackFor = Exception.class)
public RoleDto createRole(CreateRoleCmd cmd) {
    log.info("开始创建角色，角色名称：{}", cmd.getRoleName());
    
    // 1. 获取当前用户角色
    boolean isSystemAdmin = TokenHolder.isSystemAdmin();
    boolean isTenantAdmin = TokenHolder.isTenantAdmin();
    
    // 2. 权限控制（角色权限由 Role 表的 isTenantAdmin 字段管理）
    
    // 3. 设置 tenantId
    String tenantId = cmd.getTenantId();
    if (!isSystemAdmin) {
        // 非 SystemAdmin 自动从上下文获取 tenantId
        tenantId = TokenHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IamException(IamErrorCode.TENANT_ID_REQUIRED);
        }
    }
    
    // 4. 创建角色
    Role role = new Role();
    role.setRoleName(cmd.getRoleName());
    role.setRoleCode(cmd.getRoleCode());
    role.setTenantId(tenantId);
    role.setDescription(cmd.getDescription());
    
    roleRepository.save(role);
    
    log.info("角色创建成功，角色ID：{}", role.getRoleId());
    return roleAssembler.toDto(role);
}

/**
 * 编辑角色（带权限控制）
 */
@Transactional(rollbackFor = Exception.class)
public RoleDto updateRole(Long roleId, UpdateRoleCmd cmd) {
    log.info("开始编辑角色，角色ID：{}", roleId);
    
    // 1. 查询角色
    Role role = roleRepository.findById(roleId)
        .orElseThrow(() -> new IamException(IamErrorCode.ROLE_NOT_FOUND, roleId));
    
    // 2. 权限控制（角色权限由 Role 表的 isTenantAdmin 字段管理）
    
    // 3. 更新角色
    role.setRoleName(cmd.getRoleName());
    if (cmd.getDescription() != null) {
        role.setDescription(cmd.getDescription());
    }
    
    roleRepository.update(role);
    
    log.info("角色编辑成功，角色ID：{}", roleId);
    return roleAssembler.toDto(role);
}

/**
 * 分配权限（带权限控制）
 */
@Transactional(rollbackFor = Exception.class)
public void assignPermissions(Long roleId, List<Long> menuIds) {
    log.info("开始分配权限，角色ID：{}，菜单ID列表：{}", roleId, menuIds);
    
    // 1. 获取当前用户角色
    boolean isSystemAdmin = TokenHolder.isSystemAdmin();
    
    // 2. 权限控制
    if (!isSystemAdmin) {
        // 非 SystemAdmin 只能分配自身权限的子集
        List<Long> userMenuIds = TokenHolder.getMenuIds();
        for (Long menuId : menuIds) {
            if (!userMenuIds.contains(menuId)) {
                throw new IamException(IamErrorCode.PERMISSION_DENIED, "不能分配超出自身权限范围的菜单");
            }
        }
    }
    
    // 3. 删除现有权限
    roleMenuRepository.deleteByRoleId(roleId);
    
    // 4. 添加新权限
    for (Long menuId : menuIds) {
        RoleMenu roleMenu = new RoleMenu();
        roleMenu.setRoleId(roleId);
        roleMenu.setMenuId(menuId);
        roleMenuRepository.save(roleMenu);
    }
    
    log.info("权限分配成功，角色ID：{}", roleId);
}

/**
 * 查询角色列表（带权限控制）
 */
@Transactional(readOnly = true)
public List<RoleDto> searchRoles(RoleQuery query) {
    log.info("开始查询角色列表");
    
    // 1. 获取当前用户角色
    boolean isSystemAdmin = TokenHolder.isSystemAdmin();
    
    // 2. 权限控制
    if (!isSystemAdmin) {
        // 非 SystemAdmin 只能查询租户下的角色
        String tenantId = TokenHolder.getTenantId();
        query.setTenantId(tenantId);
    }
    
    // 3. 查询角色（依赖租户隔离拦截器）
    List<Role> roles = roleRepository.search(query);
    
    return roleAssembler.toDtoList(roles);
}
```

### 新增功能：AuthController TODO 功能实现

#### RefreshTokenCmd（新增）

```java
@Data
public class RefreshTokenCmd {
    @NotBlank(message = "刷新Token不能为空")
    private String refreshToken;
}
```

#### RefreshTokenDto（新增）

```java
@Data
public class RefreshTokenDto {
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
}
```

#### RouteDto（新增）

```java
@Data
public class RouteDto {
    private String path;
    private String name;
    private String component;
    private RouteMetaDto meta;
    private List<RouteDto> children;
}

@Data
public class RouteMetaDto {
    private String title;
    private String icon;
    private Boolean hidden;
    private List<String> roles;
}
```

#### TenantListDto（更新）

```java
@Data
public class TenantListDto {
    private String tenantId;
    private String tenantName;
    private String tenantCode;
}
```

#### ValidateTokenDto（更新）

```java
@Data
public class ValidateTokenDto {
    private Boolean valid;
    private String userId;
    private String username;
    private String tenantId;
    private String facilityId;
    private Boolean isSystemAdmin;  // 新增：是否系统管理员
    private Long expiresIn;
}
```

#### ApiPathMatcher（新增工具类）

```java
/**
 * API路径匹配工具类
 * 支持通配符匹配
 */
public class ApiPathMatcher {
    
    /**
     * 检查路径和方法是否匹配权限列表
     * 
     * @param apiPaths 权限列表（格式：/api/path:METHOD 或 /api/path/** 或 /api/path/**:*）
     * @param path 请求路径
     * @param method 请求方法
     * @return 是否匹配
     */
    public static boolean matches(List<String> apiPaths, String path, String method) {
        if (apiPaths == null || apiPaths.isEmpty()) {
            return false;
        }
        
        for (String apiPath : apiPaths) {
            if (matchSingle(apiPath, path, method)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 单个路径匹配
     * 
     * 匹配规则：
     * - 精确匹配：/api/iam/users:GET 匹配 /api/iam/users:GET
     * - 方法通配符：/api/iam/users:* 匹配 /api/iam/users:GET、/api/iam/users:POST 等
     * - 路径通配符：/api/iam/users/** 匹配 /api/iam/users/123、/api/iam/users/123/details 等
     * - 路径+方法通配符：/api/iam/users/**:* 匹配所有子路径的所有方法
     */
    private static boolean matchSingle(String apiPath, String path, String method) {
        // 1. 分离路径和方法
        String[] parts = apiPath.split(":");
        String pathPattern = parts[0];
        String methodPattern = parts.length > 1 ? parts[1] : "*";
        
        // 2. 方法匹配
        if (!"*".equals(methodPattern) && !methodPattern.equalsIgnoreCase(method)) {
            return false;
        }
        
        // 3. 路径匹配
        if (pathPattern.endsWith("/**")) {
            // 路径通配符匹配
            String prefix = pathPattern.substring(0, pathPattern.length() - 3);
            return path.startsWith(prefix);
        } else {
            // 精确匹配
            return pathPattern.equals(path);
        }
    }
}
```

#### AuthApplicationService（扩展）

**重要说明**：
- 当前项目使用 **Redis + TokenInfo** 存储 token，不是 JWT
- TokenInfo 只包含基本信息：userId, tenantId, facilityId
- 完整用户信息需要通过 `/auth/userinfo` 接口从数据库查询
- 设计文档中的示例代码仅供参考，实际实现需遵循 DDD 充血模型原则

**DDD 充血模型要求**：
- Application Service 只协调领域对象，不包含业务逻辑
- 业务逻辑应该在领域实体（GlobalUser, Tenant 等）中实现
- 状态转换、验证规则等应该通过实体的业务方法完成

```java
/**
 * 刷新 Token
 * 
 * 注意：实际实现时需要根据项目的 token 机制调整
 * 当前项目使用 Redis + TokenInfo，不是 JWT
 */
@Transactional(rollbackFor = Exception.class)
public RefreshTokenDto refreshToken(RefreshTokenCmd cmd) {
    log.info("开始刷新Token");
    
    // 1. 从 Redis 获取 refresh token 对应的 TokenInfo
    TokenInfo tokenInfo = tokenStorage.getTokenByRefreshToken(cmd.getRefreshToken());
    if (tokenInfo == null) {
        throw new IamException(IamErrorCode.REFRESH_TOKEN_INVALID);
    }
    
    // 2. 验证 refresh token 是否过期
    if (tokenInfo.getRefreshExpireTime().isBefore(LocalDateTime.now())) {
        throw new IamException(IamErrorCode.REFRESH_TOKEN_EXPIRED);
    }
    
    // 3. 查询用户（验证用户是否仍然有效）
    GlobalUser user = globalUserRepository.findById(tokenInfo.getUserId())
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, tokenInfo.getUserId()));
    
    // 4. 验证用户状态（调用领域对象的业务方法）
    if (!user.isEnabled()) {
        throw new IamException(IamErrorCode.USER_DISABLED);
    }
    
    // 5. 生成新的 token
    String newTokenValue = generateTokenValue();
    String newRefreshToken = generateTokenValue();
    
    // 6. 更新 TokenInfo
    tokenInfo.setTokenValue(newTokenValue);
    tokenInfo.setRefreshToken(newRefreshToken);
    tokenInfo.setExpireTime(LocalDateTime.now().plusSeconds(TOKEN_EXPIRE_SECONDS));
    tokenInfo.setRefreshExpireTime(LocalDateTime.now().plusSeconds(REFRESH_TOKEN_EXPIRE_SECONDS));
    
    // 7. 保存到 Redis
    tokenStorage.saveToken(tokenInfo);
    
    // 8. 返回结果
    RefreshTokenDto dto = new RefreshTokenDto();
    dto.setAccessToken(newTokenValue);
    dto.setRefreshToken(newRefreshToken);
    dto.setExpiresIn(TOKEN_EXPIRE_SECONDS);
    
    log.info("Token刷新成功，用户ID：{}", user.getUserId());
    return dto;
}

/**
 * 获取路由（从 menu 表）
 */
@Transactional(readOnly = true)
public List<RouteDto> getRoutes(String userId) {
    log.info("开始获取路由，用户ID：{}", userId);
    
    // 1. 获取用户的菜单权限
    List<Menu> menus = menuService.getMenusByUserId(userId);
    
    // 2. 构建路由树
    List<RouteDto> routes = buildRouteTree(menus);
    
    log.info("获取路由成功，用户ID：{}，路由数量：{}", userId, routes.size());
    return routes;
}

/**
 * 获取租户列表（只有 SystemAdmin 可调用）
 */
@Transactional(readOnly = true)
public List<TenantListDto> getTenants(String userId) {
    log.info("开始获取租户列表，用户ID：{}", userId);
    
    // 1. 验证用户是否为 SystemAdmin
    GlobalUser user = globalUserRepository.findById(userId)
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, userId));
    
    if (!user.isSystemAdmin()) {
        throw new IamException(IamErrorCode.PERMISSION_DENIED, "只有系统管理员可以查询所有租户");
    }
    
    // 2. 查询所有租户
    List<Tenant> tenants = tenantRepository.findAll();
    
    // 3. 转换为 DTO
    List<TenantListDto> dtos = tenants.stream()
        .map(tenant -> {
            TenantListDto dto = new TenantListDto();
            dto.setTenantId(tenant.getTenantId());
            dto.setTenantName(tenant.getTenantName());
            dto.setTenantCode(tenant.getTenantCode());
            return dto;
        })
        .collect(Collectors.toList());
    
    log.info("获取租户列表成功，租户数量：{}", dtos.size());
    return dtos;
}

/**
 * 验证 Token（给网关使用）
 * 
 * 重要：Token 只包含基本信息（userId, tenantId, facilityId）
 * 完整用户信息需要从数据库查询
 */
@Transactional(readOnly = true)
public ValidateTokenDto validateToken(String tokenValue) {
    log.info("开始验证Token");
    
    ValidateTokenDto dto = new ValidateTokenDto();
    
    // 1. 从 Redis 获取 TokenInfo
    if (tokenValue == null || tokenValue.isEmpty()) {
        dto.setValid(false);
        return dto;
    }
    
    TokenInfo tokenInfo = tokenStorage.getTokenByValue(tokenValue);
    if (tokenInfo == null) {
        log.warn("Token不存在或已过期");
        dto.setValid(false);
        return dto;
    }
    
    // 2. 验证 token 是否过期
    if (tokenInfo.getExpireTime().isBefore(LocalDateTime.now())) {
        log.warn("Token已过期，tokenId：{}", tokenInfo.getTokenId());
        dto.setValid(false);
        return dto;
    }
    
    // 3. 从数据库查询用户信息（获取完整用户信息）
    GlobalUser user = globalUserRepository.findById(tokenInfo.getUserId())
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, tokenInfo.getUserId()));
    
    // 4. 验证用户状态（调用领域对象的业务方法）
    if (!user.isEnabled()) {
        log.warn("用户已被禁用，userId：{}", user.getUserId());
        dto.setValid(false);
        return dto;
    }
    
    // 5. 构建返回结果
    dto.setValid(true);
    dto.setUserId(user.getUserId());
    dto.setUsername(user.getUsername());  // 从数据库获取
    dto.setTenantId(tokenInfo.getTenantId());  // 从 TokenInfo 获取
    dto.setFacilityId(tokenInfo.getFacilityId());  // 从 TokenInfo 获取
    dto.setIsSystemAdmin(user.isSystemAdmin());  // 调用领域对象的业务方法
    dto.setExpiresIn(Duration.between(LocalDateTime.now(), tokenInfo.getExpireTime()).getSeconds());
    
    log.info("Token验证成功，用户ID：{}，isSystemAdmin：{}", user.getUserId(), user.isSystemAdmin());
    return dto;
}

/**
 * 验证 API 权限（给网关使用）
 * 基于用户角色关联的菜单中的 apiPaths 字段进行权限验证
 * 
 * 权限验证策略：
 * 1. SystemAdmin 直接放行
 * 2. 如果接口不在任何Menu的apiPaths中，直接放行（不需要权限管控）
 * 3. 如果接口在Menu中，验证用户是否有权限
 * 
 * @param userId 用户ID
 * @param path API路径（如：/api/iam/users）
 * @param method HTTP方法（如：GET、POST、PUT、DELETE）
 * @return 是否有权限
 */
@Transactional(readOnly = true)
public Boolean validatePermission(String userId, String path, String method) {
    log.info("开始验证API权限，用户ID：{}，路径：{}，方法：{}", userId, path, method);
    
    // 1. 查询用户
    GlobalUser user = globalUserRepository.findById(userId)
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, userId));
    
    // 2. 如果是 SystemAdmin，直接放行
    if (user.isSystemAdmin()) {
        log.info("用户是系统管理员，跳过权限验证");
        return true;
    }
    
    // 3. 获取租户ID（从用户的第一个租户）
    String tenantId = null;
    if (user.getTenantIds() != null && !user.getTenantIds().isEmpty()) {
        tenantId = user.getTenantIds().get(0);
    }
    
    if (tenantId == null) {
        log.warn("用户没有关联租户，用户ID：{}", userId);
        return false;
    }
    
    // 4. 检查接口是否在任何Menu的apiPaths中
    // 如果不在任何Menu中，则认为该接口不需要权限管控，直接放行
    if (!isApiPathInAnyMenu(tenantId, path, method)) {
        log.debug("接口不在任何Menu中，直接放行，路径：{}，方法：{}", path, method);
        return true;
    }
    
    // 5. 如果接口在Menu中，获取用户有权限的接口地址列表（带缓存）
    List<String> apiPaths = getUserApiPaths(tenantId, userId);
    
    // 6. 使用通配符匹配检查权限
    boolean hasPermission = ApiPathMatcher.matches(apiPaths, path, method);
    
    log.info("API权限验证结果：{}，用户ID：{}，路径：{}，方法：{}", 
        hasPermission, userId, path, method);
    
    return hasPermission;
}

/**
 * 检查接口是否在任何Menu的apiPaths中
 * 用于判断接口是否需要权限管控
 * 
 * @param tenantId 租户ID
 * @param path 请求路径
 * @param method 请求方法
 * @return 是否在任何Menu中
 */
private boolean isApiPathInAnyMenu(String tenantId, String path, String method) {
    // 1. 查询租户下所有有apiPaths的Menu
    List<Menu> menus = menuRepository.findByTenantIdAndApiPathsNotNull(tenantId);
    
    if (menus.isEmpty()) {
        return false;
    }
    
    // 2. 收集所有Menu的apiPaths
    List<String> allApiPaths = menus.stream()
        .filter(menu -> menu.getApiPaths() != null && !menu.getApiPaths().isEmpty())
        .flatMap(menu -> menu.getApiPaths().stream())
        .collect(Collectors.toList());
    
    if (allApiPaths.isEmpty()) {
        return false;
    }
    
    // 3. 检查请求的接口是否匹配任何Menu的apiPaths
    return ApiPathMatcher.matches(allApiPaths, path, method);
}

/**
 * 获取用户有权限的接口地址列表（带缓存）
 * 
 * 缓存策略：
 * - 缓存Key：iam:api_paths:tenant:{tenantId}:{userId}
 * - 缓存TTL：5分钟
 * - 缓存失效：用户角色变更、角色菜单变更、菜单apiPaths变更时
 * 
 * @param tenantId 租户ID
 * @param userId 用户ID
 * @return 接口地址列表
 */
private List<String> getUserApiPaths(String tenantId, String userId) {
    if (tenantId == null || userId == null) {
        return Collections.emptyList();
    }
    
    // 1. 检查缓存
    String cacheKey = String.format(IamConstants.RedisKeyPrefix.API_PATHS_TENANT_PREFIX + "%s:%s", 
        tenantId, userId);
    
    try {
        String cachedJson = redisUtil.get(cacheKey);
        if (cachedJson != null && !cachedJson.isEmpty()) {
            List<String> cachedApiPaths = JSONUtil.toList(cachedJson, String.class);
            log.debug("从缓存获取用户接口地址列表，租户ID：{}，用户ID：{}", tenantId, userId);
            return cachedApiPaths;
        }
    } catch (Exception e) {
        log.warn("从缓存获取接口地址列表失败，租户ID：{}，用户ID：{}", tenantId, userId, e);
        // 缓存异常，继续查询数据库
    }
    
    // 2. 缓存未命中，查询数据库
    List<String> apiPaths = queryUserApiPathsFromDatabase(tenantId, userId);
    
    // 3. 写入缓存（TTL 5分钟）
    try {
        String apiPathsJson = JSONUtil.toJsonStr(apiPaths);
        redisUtil.set(cacheKey, apiPathsJson, 
            IamConstants.TimeMinutes.API_PATHS_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        log.debug("缓存用户接口地址列表，租户ID：{}，用户ID：{}，接口数量：{}", 
            tenantId, userId, apiPaths.size());
    } catch (Exception e) {
        log.warn("缓存接口地址列表失败，租户ID：{}，用户ID：{}", tenantId, userId, e);
        // 缓存失败不影响业务逻辑
    }
    
    return apiPaths;
}

/**
 * 从数据库查询用户有权限的接口地址列表
 * 
 * @param tenantId 租户ID
 * @param userId 用户ID
 * @return 接口地址列表
 */
private List<String> queryUserApiPathsFromDatabase(String tenantId, String userId) {
    // 1. 查询用户角色
    List<Long> roleIds = userRoleRepository.findRoleIdsByUserIdAndTenantId(userId, tenantId);
    if (roleIds.isEmpty()) {
        log.warn("用户没有分配角色，租户ID：{}，用户ID：{}", tenantId, userId);
        return Collections.emptyList();
    }
    
    // 2. 查询角色菜单
    List<Long> menuIds = roleMenuRepository.findMenuIdsByRoleIdsAndTenantId(roleIds, tenantId);
    if (menuIds.isEmpty()) {
        log.warn("用户角色没有分配菜单，租户ID：{}，用户ID：{}", tenantId, userId);
        return Collections.emptyList();
    }
    
    // 3. 查询菜单，提取 apiPaths
    List<Menu> menus = menuRepository.findByMenuIdsAndTenantId(menuIds, tenantId);
    
    // 4. 合并所有apiPaths到Set（去重）
    Set<String> apiPathsSet = menus.stream()
        .filter(menu -> menu.getApiPaths() != null && !menu.getApiPaths().isEmpty())
        .flatMap(menu -> menu.getApiPaths().stream())
        .collect(Collectors.toSet());
    
    log.info("查询用户接口地址列表成功，租户ID：{}，用户ID：{}，接口数量：{}", 
        tenantId, userId, apiPathsSet.size());
    
    return new ArrayList<>(apiPathsSet);
}

/**
 * 清除用户接口地址缓存
 * 在用户角色分配变更时调用
 * 
 * @param tenantId 租户ID
 * @param userId 用户ID
 */
public void clearUserApiPathsCache(String tenantId, String userId) {
    if (tenantId == null || userId == null) {
        return;
    }
    
    String cacheKey = String.format(IamConstants.RedisKeyPrefix.API_PATHS_TENANT_PREFIX + "%s:%s", 
        tenantId, userId);
    
    try {
        redisUtil.delete(cacheKey);
        log.info("清除用户接口地址缓存，租户ID：{}，用户ID：{}", tenantId, userId);
    } catch (Exception e) {
        log.warn("清除用户接口地址缓存失败，租户ID：{}，用户ID：{}", tenantId, userId, e);
        // 缓存清除失败不影响业务逻辑
    }
}

/**
 * 批量清除用户接口地址缓存
 * 在角色菜单变更时调用
 * 
 * @param tenantId 租户ID
 * @param userIds 用户ID列表
 */
public void clearUserApiPathsCacheBatch(String tenantId, List<String> userIds) {
    if (tenantId == null || userIds == null || userIds.isEmpty()) {
        return;
    }
    
    for (String userId : userIds) {
        clearUserApiPathsCache(tenantId, userId);
    }
}

/**
 * 验证租户（给网关使用）
 * 
 * 验证策略：
 * 1. 验证租户本身是否存在且启用
 * 2. 验证用户是否属于该租户（GlobalUser.tenantIds包含该租户）
 * 
 * @param tenantId 租户ID
 * @param userId 用户ID（可选，如果提供则验证用户租户关联）
 * @return 租户是否有效
 */
@Transactional(readOnly = true)
public Boolean validateTenant(String tenantId, String userId) {
    log.info("开始验证租户，租户ID：{}，用户ID：{}", tenantId, userId);
    
    // 1. 查询租户
    Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
    if (tenant == null) {
        log.warn("租户不存在，租户ID：{}", tenantId);
        return false;
    }
    
    // 2. 检查租户状态
    if (!IamConstants.Status.ENABLED.equals(tenant.getStatus())) {
        log.warn("租户未启用，租户ID：{}", tenantId);
        return false;
    }
    
    // 3. 如果提供了userId，验证用户是否属于该租户
    if (userId != null && !userId.isEmpty()) {
        GlobalUser user = globalUserRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("用户不存在，用户ID：{}", userId);
            return false;
        }
        
        if (!user.belongsToTenant(tenantId)) {
            log.warn("用户不属于该租户，用户ID：{}，租户ID：{}", userId, tenantId);
            return false;
        }
    }
    
    log.info("租户验证通过，租户ID：{}", tenantId);
    return true;
}

/**
 * 验证设施权限（给网关使用）
 * 
 * 验证策略：
 * 1. SystemAdmin 直接放行
 * 2. 检查用户的 facilityIds 是否包含该设施
 * 3. 使用缓存优化性能
 * 
 * @param userId 用户ID
 * @param facilityId 设施ID
 * @return 用户是否有权访问该设施
 */
@Transactional(readOnly = true)
public Boolean validateFacility(String userId, String facilityId) {
    log.info("开始验证设施权限，用户ID：{}，设施ID：{}", userId, facilityId);
    
    // 1. 查询用户
    GlobalUser user = globalUserRepository.findById(userId)
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, userId));
    
    // 2. 如果是 SystemAdmin，直接放行
    if (user.isSystemAdmin()) {
        log.info("用户是系统管理员，跳过设施验证");
        return true;
    }
    
    // 3. 获取用户可访问的设施列表（带缓存）
    List<String> userFacilities = getUserFacilities(userId);
    
    // 4. 检查设施是否在用户可访问的设施列表中
    boolean hasAccess = userFacilities.contains(facilityId);
    
    log.info("设施权限验证结果：{}，用户ID：{}，设施ID：{}", hasAccess, userId, facilityId);
    return hasAccess;
}

/**
 * 获取用户可访问的设施列表（带缓存）
 * 
 * 缓存策略：
 * - 缓存Key：iam:user:facilities:{userId}
 * - 缓存TTL：30分钟
 * - 缓存失效：用户设施权限变更时
 * 
 * @param userId 用户ID
 * @return 设施ID列表
 */
private List<String> getUserFacilities(String userId) {
    if (userId == null || userId.isEmpty()) {
        return Collections.emptyList();
    }
    
    // 1. 检查缓存
    String cacheKey = IamConstants.RedisKeyPrefix.USER_FACILITIES_PREFIX + userId;
    
    try {
        String cachedJson = redisUtil.get(cacheKey);
        if (cachedJson != null && !cachedJson.isEmpty()) {
            List<String> cachedFacilities = JSONUtil.toList(cachedJson, String.class);
            log.debug("从缓存获取用户设施列表，用户ID：{}", userId);
            return cachedFacilities;
        }
    } catch (Exception e) {
        log.warn("从缓存获取设施列表失败，用户ID：{}", userId, e);
        // 缓存异常，继续查询数据库
    }
    
    // 2. 缓存未命中，查询数据库
    GlobalUser user = globalUserRepository.findById(userId).orElse(null);
    if (user == null) {
        return Collections.emptyList();
    }
    
    List<String> facilities = user.getFacilityIds() != null ? 
        user.getFacilityIds() : Collections.emptyList();
    
    // 3. 写入缓存（TTL 30分钟）
    try {
        String facilitiesJson = JSONUtil.toJsonStr(facilities);
        redisUtil.set(cacheKey, facilitiesJson, 
            IamConstants.TimeMinutes.FACILITY_CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        log.debug("缓存用户设施列表，用户ID：{}，设施数量：{}", userId, facilities.size());
    } catch (Exception e) {
        log.warn("缓存设施列表失败，用户ID：{}", userId, e);
        // 缓存失败不影响业务逻辑
    }
    
    return facilities;
}

/**
 * 清除用户设施权限缓存
 * 在用户设施权限变更时调用
 * 
 * @param userId 用户ID
 */
public void clearUserFacilitiesCache(String userId) {
    if (userId == null || userId.isEmpty()) {
        return;
    }
    
    String cacheKey = IamConstants.RedisKeyPrefix.USER_FACILITIES_PREFIX + userId;
    
    try {
        redisUtil.delete(cacheKey);
        log.info("清除用户设施权限缓存，用户ID：{}", userId);
    } catch (Exception e) {
        log.warn("清除用户设施权限缓存失败，用户ID：{}", userId, e);
        // 缓存清除失败不影响业务逻辑
    }
}

/**
 * 构建路由树
 */
private List<RouteDto> buildRouteTree(List<Menu> menus) {
    // 实现路由树构建逻辑
    // ...
}
```

#### AuthController（新增网关接口）

```java
@RestController
@RequestMapping("/api/iam/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthApplicationService authApplicationService;
    
    /**
     * 验证 Token（给网关使用）
     */
    @PostMapping("/validate-token")
    public R<ValidateTokenDto> validateToken(@RequestHeader("X-Token") String token) {
        return R.ok(authApplicationService.validateToken(token));
    }
    
    /**
     * 验证 API 权限（给网关使用）
     */
    @GetMapping("/validate-permission")
    public R<Boolean> validatePermission(
            @RequestParam String userId,
            @RequestParam String path,
            @RequestParam String method) {
        return R.ok(authApplicationService.validatePermission(userId, path, method));
    }
    
    /**
     * 验证租户（给网关使用）
     */
    @GetMapping("/validate-tenant")
    public R<Boolean> validateTenant(@RequestParam String tenantId) {
        return R.ok(authApplicationService.validateTenant(tenantId));
    }
    
    /**
     * 验证设施权限（给网关使用）
     */
    @GetMapping("/validate-facility")
    public R<Boolean> validateFacility(
            @RequestParam String userId,
            @RequestParam String facilityId) {
        return R.ok(authApplicationService.validateFacility(userId, facilityId));
    }
    
    /**
     * 刷新 Token
     */
    @PostMapping("/refresh-token")
    public R<RefreshTokenDto> refreshToken(@Valid @RequestBody RefreshTokenCmd cmd) {
        return R.ok(authApplicationService.refreshToken(cmd));
    }
    
    /**
     * 获取路由（从 menu 表）
     */
    @GetMapping("/routes")
    public R<List<RouteDto>> getRoutes(@RequestParam String userId) {
        return R.ok(authApplicationService.getRoutes(userId));
    }
    
    /**
     * 获取租户列表（只有 SystemAdmin 可调用）
     */
    @GetMapping("/tenants")
    public R<List<TenantListDto>> getTenants(@RequestParam String userId) {
        return R.ok(authApplicationService.getTenants(userId));
    }
}
```

### 新增功能：租户配置管理

#### TenantProfileDto（新增）

```java
@Data
public class TenantProfileDto {
    private String tenantId;
    private String tenantName;
    private String tenantCode;
    private String logo;  // base64 编码的图片数据
    private String status;  // IamConstants.Status.ENABLED 启用, IamConstants.Status.DISABLED 禁用
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private String address;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### UpdateTenantProfileCmd（新增）

```java
@Data
public class UpdateTenantProfileCmd {
    // 不可更新字段：tenantId、tenantCode、createdAt、updatedAt、createdBy、updatedBy
    
    // 可更新字段
    @NotBlank(message = "租户名称不能为空")
    private String tenantName;
    
    private String logo;  // base64 编码的图片数据（选填）
    
    @NotBlank(message = "状态不能为空")
    private String status;  // IamConstants.Status.ENABLED 启用, IamConstants.Status.DISABLED 禁用
    
    private String contactPerson;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "联系电话格式不正确")
    private String contactPhone;
    
    @Email(message = "联系邮箱格式不正确")
    private String contactEmail;
    
    private String address;
    private String description;
}
```

#### TenantProfileController（新增）

```java
@RestController
@RequiredArgsConstructor
@Slf4j
public class TenantProfileController {
    
    private final TenantApplicationService tenantApplicationService;
    
    /**
     * 查询当前租户配置
     * 仅租户管理员可访问
     */
    @GetMapping("/tenant-profile")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public R<TenantProfileDto> getTenantProfile() {
        // 从 TokenHolder 获取当前租户ID
        String tenantId = TokenHolder.getTenantId();
        return R.ok(tenantApplicationService.getTenantProfile(tenantId));
    }
    
    /**
     * 编辑当前租户配置
     * 仅租户管理员可访问
     */
    @PutMapping("/tenant-profile")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public R<TenantProfileDto> updateTenantProfile(@Valid @RequestBody UpdateTenantProfileCmd cmd) {
        // 从 TokenHolder 获取当前租户ID
        String tenantId = TokenHolder.getTenantId();
        return R.ok(tenantApplicationService.updateTenantProfile(tenantId, cmd));
    }
}
```

#### TenantApplicationService（扩展）

```java
/**
 * 查询租户配置
 * 
 * @param tenantId 租户ID
 * @return 租户配置DTO
 */
@Transactional(readOnly = true)
public TenantProfileDto getTenantProfile(String tenantId) {
    log.info("开始查询租户配置，租户ID：{}", tenantId);
    
    Tenant tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new IamException(IamErrorCode.TENANT_NOT_FOUND, tenantId));
    
    return tenantAssembler.toProfileDto(tenant);
}

/**
 * 编辑租户配置
 * 
 * @param tenantId 租户ID
 * @param cmd 更新命令
 * @return 租户配置DTO
 */
@Transactional(rollbackFor = Exception.class)
public TenantProfileDto updateTenantProfile(String tenantId, UpdateTenantProfileCmd cmd) {
    log.info("开始编辑租户配置，租户ID：{}", tenantId);
    
    // 1. 查询租户
    Tenant tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new IamException(IamErrorCode.TENANT_NOT_FOUND, tenantId));
    
    // 2. 验证租户代码唯一性（如果修改了）
    if (!cmd.getTenantCode().equals(tenant.getTenantCode())) {
        if (tenantRepository.existsByTenantCode(cmd.getTenantCode())) {
            throw new IamException(IamErrorCode.TENANT_CODE_ALREADY_EXISTS, cmd.getTenantCode());
        }
    }
    
    // 3. 更新租户信息
    tenant.setTenantName(cmd.getTenantName());
    if (cmd.getLogo() != null) {
        tenant.setLogo(cmd.getLogo());  // 更新 logo（base64 编码）
    }
    tenant.setStatus(cmd.getStatus());
    tenant.setContactPerson(cmd.getContactPerson());
    tenant.setContactPhone(cmd.getContactPhone());
    tenant.setContactEmail(cmd.getContactEmail());
    tenant.setAddress(cmd.getAddress());
    tenant.setDescription(cmd.getDescription());
    
    // 4. 保存租户
    tenantRepository.update(tenant);
    
    log.info("租户配置编辑成功，租户ID：{}", tenantId);
    return tenantAssembler.toProfileDto(tenant);
}
```

### 新增功能：租户用户管理

#### CreateTenantUserCmd（新增）

```java
@Data
public class CreateTenantUserCmd {
    // 必填字段
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotEmpty(message = "租户ID列表不能为空")
    private List<String> tenantIds;
    
    @NotEmpty(message = "设施ID列表不能为空")
    private List<String> facilityIds;
    
    @NotBlank(message = "状态不能为空")
    private String status;  // IamConstants.Status.ENABLED 启用（默认）, IamConstants.Status.DISABLED 禁用
    
    // 可选字段
    private List<Long> roleIds;  // 角色ID列表
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    private String avatar;
    private String realName;
}
```

#### UpdateTenantUserCmd（新增）

```java
@Data
public class UpdateTenantUserCmd {
    // 不可更新字段：username
    
    // 可更新字段
    private String password;
    private List<String> tenantIds;  // 用户加入租户、用户离开租户
    private List<String> facilityIds;
    private String status;  // IamConstants.Status.ENABLED 启用, IamConstants.Status.DISABLED 禁用
    private List<Long> roleIds;  // 角色ID列表
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    private String avatar;
    private String realName;
}
```

#### TenantUserController（新增）

```java
@RestController
@RequiredArgsConstructor
@Slf4j
public class TenantUserController {
    
    private final GlobalUserApplicationService globalUserApplicationService;
    
    /**
     * 新增租户用户
     */
    @PostMapping("/tenant-users")
    public R<UserDto> createTenantUser(@Valid @RequestBody CreateTenantUserCmd cmd) {
        return R.ok(globalUserApplicationService.createTenantUser(cmd));
    }
    
    /**
     * 编辑租户用户
     */
    @PutMapping("/tenant-users/{userId}")
    public R<UserDto> updateTenantUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateTenantUserCmd cmd) {
        return R.ok(globalUserApplicationService.updateTenantUser(userId, cmd));
    }
    
    /**
     * 查询租户用户列表
     */
    @PostMapping("/tenant-users/search")
    public R<List<UserDto>> searchTenantUsers(@Valid @RequestBody UserQuery query) {
        return R.ok(globalUserApplicationService.searchTenantUsers(query));
    }
    
    /**
     * 分页查询租户用户列表
     */
    @PostMapping("/tenant-users/search-by-paging")
    public R<PageResult<UserDto>> searchTenantUsersByPaging(@Valid @RequestBody UserQuery query) {
        return R.ok(globalUserApplicationService.searchTenantUsersByPaging(query));
    }
    
    /**
     * 根据ID查询租户用户
     */
    @GetMapping("/tenant-users/{userId}")
    public R<UserDto> getTenantUserById(@PathVariable String userId) {
        return R.ok(globalUserApplicationService.getTenantUserById(userId));
    }
}
```

#### GlobalUserApplicationService（扩展）

**重要：以下代码示例展示功能实现思路，实际编码时必须遵循 DDD 充血模型原则**

```java
/**
 * 新增租户用户
 * 
 * Application Service 职责：
 * - 协调领域对象
 * - 管理事务
 * - 转换 DTO
 * 
 * 不应该包含：
 * - 业务逻辑（应该在领域层）
 * - 直接修改实体字段（应该调用业务方法）
 */
@Transactional(rollbackFor = Exception.class)
public UserDto createTenantUser(CreateTenantUserCmd cmd) {
    log.info("开始新增租户用户，用户名：{}", cmd.getUsername());
    
    // 1. 验证用户名在租户中的唯一性（username + tenantId 唯一）
    // 注意：这是应用层的验证，不是业务逻辑
    for (String tenantId : cmd.getTenantIds()) {
        if (globalUserRepository.existsByUsernameAndTenantId(cmd.getUsername(), tenantId)) {
            throw new IamException(IamErrorCode.USERNAME_ALREADY_EXISTS_IN_TENANT, 
                cmd.getUsername(), tenantId);
        }
    }
    
    // 2. 使用工厂方法创建 GlobalUser（推荐）
    // 或者使用 Builder 模式
    GlobalUser user = GlobalUser.builder()
        .username(cmd.getUsername())
        .password(passwordEncoder.encode(cmd.getPassword()))
        .tenantIds(cmd.getTenantIds())
        .facilityIds(cmd.getFacilityIds())
        .email(cmd.getEmail())
        .phone(cmd.getPhone())
        .avatar(cmd.getAvatar())
        .realName(cmd.getRealName())
        .build();
    
    // 3. 设置初始状态（调用业务方法，不是直接设置字段）
    if (IamConstants.Status.ENABLED.equals(cmd.getStatus())) {
        user.enable();  // ✅ 调用业务方法
    } else {
        user.disable();  // ✅ 调用业务方法
    }
    
    // 4. 保存用户
    globalUserRepository.save(user);
    
    // 5. 分配角色（如果有）
    if (cmd.getRoleIds() != null && !cmd.getRoleIds().isEmpty()) {
        assignRolesToUser(user.getUserId(), cmd.getRoleIds());
    }
    
    log.info("租户用户新增成功，用户ID：{}", user.getUserId());
    return userAssembler.toDto(user);
}

/**
 * 编辑租户用户（带权限控制）
 */
@Transactional(rollbackFor = Exception.class)
public UserDto updateTenantUser(String userId, UpdateTenantUserCmd cmd) {
    log.info("开始编辑租户用户，用户ID：{}", userId);
    
    // 1. 获取当前用户角色
    boolean isSystemAdmin = TokenHolder.isSystemAdmin();
    String currentTenantId = TokenHolder.getTenantId();
    
    // 2. 查询用户
    GlobalUser user = globalUserRepository.findById(userId)
        .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND, userId));
    
    // 3. 权限控制：非 SystemAdmin 只能更新租户下的用户
    if (!isSystemAdmin) {
        if (!user.belongsToTenant(currentTenantId)) {
            throw new IamException(IamErrorCode.PERMISSION_DENIED, "只能更新当前租户下的用户");
        }
    }
    
    // 4. username 不可更新（根据需求 4.4）
    // 不需要验证用户名唯一性
    
    // 5. 更新密码（如果提供）
    if (cmd.getPassword() != null) {
        // 密码加密是技术细节，可以在 Application Service 处理
        user.setPassword(passwordEncoder.encode(cmd.getPassword()));
    }
    
    // 6. 更新租户列表（用户加入租户、用户离开租户）
    // 权限控制：只有 SystemAdmin 可以修改 tenantIds（需求 4.9）
    if (cmd.getTenantIds() != null) {
        if (!isSystemAdmin) {
            throw new IamException(IamErrorCode.PERMISSION_DENIED, "只有系统管理员可以修改用户的租户列表");
        }
        
        // 验证新增的租户中是否已存在相同 username
        List<String> newTenantIds = new ArrayList<>(cmd.getTenantIds());
        newTenantIds.removeAll(user.getTenantIds());  // 只检查新增的租户
        
        for (String tenantId : newTenantIds) {
            if (globalUserRepository.existsByUsernameAndTenantId(user.getUsername(), tenantId)) {
                throw new IamException(IamErrorCode.USERNAME_ALREADY_EXISTS_IN_TENANT, 
                    user.getUsername(), tenantId);
            }
        }
        
        // 调用业务方法更新租户列表
        // 实际编码时，应该在 GlobalUser 中添加 updateTenants() 方法
        user.setTenantIds(cmd.getTenantIds());
    }
    
    // 7. 更新设施列表
    // 权限控制：非 SystemAdmin 只能修改当前租户关联的 facilities（需求 4.9）
    if (cmd.getFacilityIds() != null) {
        if (!isSystemAdmin) {
            // 验证 facilityIds 是否都属于当前租户
            List<String> tenantFacilityIds = facilityRepository.findIdsByTenantId(currentTenantId);
            for (String facilityId : cmd.getFacilityIds()) {
                if (!tenantFacilityIds.contains(facilityId)) {
                    throw new IamException(IamErrorCode.PERMISSION_DENIED, 
                        "只能分配当前租户关联的设施，设施ID：" + facilityId);
                }
            }
        }
        
        // 调用业务方法更新设施列表
        // 实际编码时，应该在 GlobalUser 中添加 updateFacilities() 方法
        user.setFacilityIds(cmd.getFacilityIds());
    }
    
    // 8. 更新状态（调用业务方法，不是直接设置字段）
    if (cmd.getStatus() != null) {
        if (IamConstants.Status.ENABLED.equals(cmd.getStatus())) {
            user.enable();  // ✅ 调用业务方法
        } else {
            user.disable();  // ✅ 调用业务方法
        }
    }
    
    // 9. 更新联系方式（基本字段可以直接设置）
    // 注意：@Email 和 @Pattern 注解已在 Cmd 中验证格式
    if (cmd.getEmail() != null) {
        user.setEmail(cmd.getEmail());
    }
    if (cmd.getPhone() != null) {
        user.setPhone(cmd.getPhone());
    }
    
    // 10. 更新其他基本信息
    if (cmd.getAvatar() != null) {
        user.setAvatar(cmd.getAvatar());
    }
    if (cmd.getRealName() != null) {
        user.setRealName(cmd.getRealName());
    }
    
    // 11. 保存用户
    globalUserRepository.update(user);
    
    // 12. 更新角色（如果有）
    // 权限控制：非 SystemAdmin 只能分配租户下创建的角色（需求 4.9）
    if (cmd.getRoleIds() != null) {
        if (!isSystemAdmin) {
            // 验证 roleIds 是否都属于当前租户
            List<Long> tenantRoleIds = roleRepository.findIdsByTenantId(currentTenantId);
            for (Long roleId : cmd.getRoleIds()) {
                if (!tenantRoleIds.contains(roleId)) {
                    throw new IamException(IamErrorCode.PERMISSION_DENIED, 
                        "只能分配当前租户下创建的角色，角色ID：" + roleId);
                }
            }
        }
        assignRolesToUser(userId, cmd.getRoleIds());
    }
    
    log.info("租户用户编辑成功，用户ID：{}，操作者：{}", userId, 
        isSystemAdmin ? "SystemAdmin" : "TenantUser");
    return userAssembler.toDto(user);
}

/**
 * 为用户分配角色
 */
private void assignRolesToUser(String userId, List<Long> roleIds) {
    // 1. 删除现有角色
    LambdaQueryWrapper<UserRole> deleteWrapper = new LambdaQueryWrapper<>();
    deleteWrapper.eq(UserRole::getUserId, userId);
    userRoleMapper.delete(deleteWrapper);
    
    // 2. 添加新角色
    if (!roleIds.isEmpty()) {
        for (Long roleId : roleIds) {
            UserRole userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRoleId(roleId);
            userRoleMapper.insert(userRole);
        }
    }
}
```

### 需要删除的文件

1. **Domain 层**
   - `com.t5.iam.domain.tenantuser.entity.TenantUser`
   - `com.t5.iam.domain.tenantuser.service.TenantUserService`
   - `com.t5.iam.domain.tenantuser.repository.TenantUserRepository`

2. **Application 层**
   - `com.t5.iam.application.tenantuser.service.TenantUserApplicationService`

3. **Infrastructure 层**
   - `com.t5.iam.infrastructure.persistence.tenantuser.repository.TenantUserRepositoryImpl`
   - `com.t5.iam.infrastructure.persistence.tenantuser.mapper.TenantUserMapper`
   - `com.t5.iam.infrastructure.persistence.tenantuser.mapper.TenantUserMapper.xml`（如果存在）

4. **Interface 层**
   - `com.t5.iam.interfaces.rest.tenantuser.TenantUserController`

5. **Constants**
   - `com.t5.iam.infrastructure.constants.IamConstants.TenantUser`

### 需要更新的文件

1. **UserMapper**
   ```java
   // 修改前
   public interface UserMapper extends BaseMapper<TenantUser> {
   }
   
   // 修改后
   public interface UserMapper extends BaseMapper<GlobalUser> {
   }
   ```

2. **TenantController**
   ```java
   // 修改前
   @PostMapping("/{tenantId}/users")
   public R<List<GlobalUser>> getTenantUsers(@PathVariable String tenantId) {
       List<GlobalUser> users = tenantApplicationService.getTenantUsers(tenantId);
       return R.ok(users);
   }
   
   // 修改后
   @PostMapping("/{tenantId}/users")
   public R<List<GlobalUser>> getTenantUsers(@PathVariable String tenantId) {
       List<GlobalUser> users = globalUserApplicationService.getUsersByTenantId(tenantId);
       return R.ok(users);
   }
   ```

3. **TenantApplicationService**
   - 删除 `getTenantUsers()` 方法
   - 或者重构为调用 `GlobalUserApplicationService`

4. **GlobalUserApplicationService**
   - 确保 `getUsersByTenantId()` 方法存在并正确实现

## 数据模型

### 常量定义

```java
/**
 * IAM 常量定义
 */
public class IamConstants {
    
    /**
     * 状态常量
     */
    public static class Status {
        /** 启用 */
        public static final String ENABLED = "0";
        /** 禁用 */
        public static final String DISABLED = "1";
    }
    
    /**
     * 可见性常量
     */
    public static class Visibility {
        /** 可见 */
        public static final String VISIBLE = "0";
        /** 隐藏 */
        public static final String HIDDEN = "1";
    }
    
    /**
     * Redis缓存Key前缀
     */
    public static class RedisKeyPrefix {
        /** 用户接口地址缓存前缀（租户内） */
        public static final String API_PATHS_TENANT_PREFIX = "iam:api_paths:tenant:";
        /** 用户设施权限缓存前缀 */
        public static final String USER_FACILITIES_PREFIX = "iam:user:facilities:";
    }
    
    /**
     * 缓存TTL（分钟）
     */
    public static class TimeMinutes {
        /** 接口地址缓存TTL */
        public static final int API_PATHS_CACHE_TTL_MINUTES = 5;
        /** 设施权限缓存TTL */
        public static final int FACILITY_CACHE_TTL_MINUTES = 30;
    }
}
```

### GlobalUser 实体（保留）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_global_user")
public class GlobalUser extends BaseEntity {
    
    @TableId(type = IdType.ASSIGN_ID)
    private String userId;
    
    private String username;
    private String password;
    private String email;
    private String phone;
    private String avatar;
    private String realName;
    private String status;  // 使用 IamConstants.Status
    
    @JsonTableField
    private List<String> tenantIds;  // 用户所属的租户列表
    
    @JsonTableField
    private List<String> facilityIds;  // 用户可访问的设施列表
    
    /**
     * 是否为系统管理员
     * 系统管理员拥有所有权限，不受租户限制
     */
    private Boolean isSystemAdmin;
    
    // ============================================
    // 业务方法
    // ============================================
    
    /**
     * 判断是否为系统管理员
     */
    public boolean isSystemAdmin() {
        return Boolean.TRUE.equals(this.isSystemAdmin);
    }
    
    /**
     * 判断用户是否属于某个租户
     */
    public boolean belongsToTenant(String tenantId) {
        return tenantIds != null && tenantIds.contains(tenantId);
    }
    
    /**
     * 添加租户
     */
    public void addTenant(String tenantId) {
        if (tenantIds == null) {
            tenantIds = new ArrayList<>();
        }
        if (!tenantIds.contains(tenantId)) {
            tenantIds.add(tenantId);
        }
    }
    
    /**
     * 移除租户
     */
    public void removeTenant(String tenantId) {
        if (tenantIds != null) {
            tenantIds.remove(tenantId);
        }
    }
    
    /**
     * 判断用户是否有权访问某个设施
     */
    public boolean hasAccessToFacility(String facilityId) {
        return facilityIds != null && facilityIds.contains(facilityId);
    }
    
    /**
     * 添加设施
     */
    public void addFacility(String facilityId) {
        if (facilityIds == null) {
            facilityIds = new ArrayList<>();
        }
        if (!facilityIds.contains(facilityId)) {
            facilityIds.add(facilityId);
        }
    }
    
    /**
     * 移除设施
     */
    public void removeFacility(String facilityId) {
        if (facilityIds != null) {
            facilityIds.remove(facilityId);
        }
    }
    
    /**
     * 启用用户
     */
    public void enable() {
        this.status = IamConstants.Status.ENABLED;
    }
    
    /**
     * 禁用用户
     */
    public void disable() {
        this.status = IamConstants.Status.DISABLED;
    }
    
    /**
     * 判断用户是否启用
     */
    public boolean isEnabled() {
        return IamConstants.Status.ENABLED.equals(this.status);
    }
    
    /**
     * 判断用户状态是否正常（用于登录验证）
     */
    public boolean isNormal() {
        return isEnabled();
    }
    
    /**
     * 更新最后登录信息
     * 业务方法：封装状态更新逻辑
     */
    public void updateLastLogin(String tenantId, String facilityId) {
        this.lastLoginTenantId = tenantId;
        this.lastLoginFacilityId = facilityId;
        this.lastLoginTime = LocalDateTime.now();
    }
    
    /**
     * 判断用户是否属于某个设施
     */
    public boolean belongsToFacility(String facilityId) {
        return facilityIds != null && facilityIds.contains(facilityId);
    }
    
    /**
     * 验证用户可以访问指定租户和设施
     * 业务规则验证方法
     */
    public void validateAccess(String tenantId, String facilityId) {
        if (!belongsToTenant(tenantId)) {
            throw new IllegalStateException(
                String.format("用户不属于租户，userId=%s, tenantId=%s", this.userId, tenantId));
        }
        
        if (!belongsToFacility(facilityId)) {
            throw new IllegalStateException(
                String.format("用户不属于设施，userId=%s, facilityId=%s", this.userId, facilityId));
        }
    }
}
```

### Menu 实体（扩展）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_menu")
public class Menu extends BaseEntity {
    
    @TableId(type = IdType.AUTO)
    private Long menuId;
    
    private String menuName;
    private String menuCode;
    private Long parentId;
    private String path;
    private String component;
    private String icon;
    private Integer orderNum;
    private String status;  // 使用 IamConstants.Status
    private String visible;  // 使用 IamConstants.Visibility
    
    /**
     * API路径列表（JSON数组）
     * 格式：["/api/iam/users:GET", "/api/iam/users/**:*"]
     * 用于网关层的API权限验证
     */
    @JsonTableField
    private List<String> apiPaths;
    
    // 其他字段...
}
```

### GlobalUserRepository 接口（扩展）

```java
public interface GlobalUserRepository {
    
    /**
     * 查询租户下的所有用户
     */
    List<GlobalUser> getUsersByTenantId(String tenantId);
    
    /**
     * 检查用户名在租户中是否已存在
     * username + tenantId 唯一性验证
     */
    boolean existsByUsernameAndTenantId(String username, String tenantId);
}
```

### UserRoleRepository 接口（新增）

```java
public interface UserRoleRepository {
    
    /**
     * 查询用户在指定租户下的角色ID列表
     */
    List<Long> findRoleIdsByUserIdAndTenantId(String userId, String tenantId);
}
```

### RoleMenuRepository 接口（新增）

```java
public interface RoleMenuRepository {
    
    /**
     * 查询角色在指定租户下的菜单ID列表
     */
    List<Long> findMenuIdsByRoleIdsAndTenantId(List<Long> roleIds, String tenantId);
    
    /**
     * 根据角色ID删除关联
     */
    void deleteByRoleId(Long roleId);
}
```

### MenuRepository 接口（新增）

```java
public interface MenuRepository {
    
    /**
     * 根据菜单ID列表和租户ID查询菜单
     */
    List<Menu> findByMenuIdsAndTenantId(List<Long> menuIds, String tenantId);
    
    /**
     * 查询租户下所有有apiPaths的Menu
     */
    List<Menu> findByTenantIdAndApiPathsNotNull(String tenantId);
}
```

### 租户用户查询逻辑

```java
// 查询租户下的所有用户
public List<GlobalUser> getUsersByTenantId(String tenantId) {
    LambdaQueryWrapper<GlobalUser> wrapper = new LambdaQueryWrapper<>();
    wrapper.apply("JSON_CONTAINS(tenant_ids, JSON_QUOTE({0}))", tenantId);
    return globalUserMapper.selectList(wrapper);
}

// 检查用户名在租户中是否已存在
public boolean existsByUsernameAndTenantId(String username, String tenantId) {
    LambdaQueryWrapper<GlobalUser> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(GlobalUser::getUsername, username)
           .apply("JSON_CONTAINS(tenant_ids, JSON_QUOTE({0}))", tenantId);
    return globalUserMapper.selectCount(wrapper) > 0;
}
```

## DDD 充血模型实践要点

### 领域实体的职责

**GlobalUser 实体应该包含的业务方法**：

```java
// ✅ 状态转换方法
public void enable() { this.status = IamConstants.Status.ENABLED; }
public void disable() { this.status = IamConstants.Status.DISABLED; }

// ✅ 业务规则验证方法
public boolean isEnabled() { return IamConstants.Status.ENABLED.equals(this.status); }
public boolean isSystemAdmin() { return Boolean.TRUE.equals(this.isSystemAdmin); }
public boolean belongsToTenant(String tenantId) { return tenantIds != null && tenantIds.contains(tenantId); }

// ✅ 业务行为方法
public void updateLastLogin(String tenantId, String facilityId) { /* 更新登录信息 */ }
public void validateAccess(String tenantId, String facilityId) { /* 验证访问权限 */ }

// ✅ 租户和设施管理方法
public void addTenant(String tenantId) { /* 添加租户 */ }
public void removeTenant(String tenantId) { /* 移除租户 */ }
public void addFacility(String facilityId) { /* 添加设施 */ }
public void removeFacility(String facilityId) { /* 移除设施 */ }
```

### Application Service 的职责

**Application Service 应该做的**：
- ✅ 协调领域对象完成业务用例
- ✅ 管理事务边界
- ✅ 转换 DTO 和领域对象
- ✅ 调用领域对象的业务方法
- ✅ 处理技术细节（如密码加密）

**Application Service 不应该做的**：
- ❌ 包含业务逻辑（应该在领域层）
- ❌ 直接修改实体的业务字段（如 `user.setStatus()`）
- ❌ 绕过实体的业务方法
- ❌ 实现业务规则验证（应该在实体中）

### 正确示例 vs 错误示例

**❌ 错误示例（贫血模型）**：
```java
@Service
public class UserApplicationService {
    public void updateUser(String userId, UpdateUserCmd cmd) {
        User user = userRepository.findById(userId);
        
        // ❌ 错误：在 Service 中包含业务逻辑
        if (user.getStatus() == "0") {
            throw new IllegalStateException("用户已启用");
        }
        
        // ❌ 错误：直接修改状态字段
        user.setStatus(cmd.getStatus());
        
        userRepository.update(user);
    }
}
```

**✅ 正确示例（充血模型）**：
```java
// 领域实体
public class User {
    private String status;
    
    // ✅ 业务方法
    public void enable() {
        if (IamConstants.Status.ENABLED.equals(this.status)) {
            throw new IllegalStateException("用户已启用");
        }
        this.status = IamConstants.Status.ENABLED;
    }
    
    public void disable() {
        this.status = IamConstants.Status.DISABLED;
    }
}

// Application Service
@Service
public class UserApplicationService {
    public void updateUser(String userId, UpdateUserCmd cmd) {
        User user = userRepository.findById(userId);
        
        // ✅ 正确：调用业务方法
        if (IamConstants.Status.ENABLED.equals(cmd.getStatus())) {
            user.enable();
        } else {
            user.disable();
        }
        
        userRepository.update(user);
    }
}
```

### 实际编码时的注意事项

**重要提醒：设计文档中的代码可以绕过规范，但实际编码必须遵循规范！**

1. **状态转换必须通过业务方法**
   - ❌ 设计文档中：`user.setStatus("0")` （允许）
   - ✅ 实际编码时：`user.enable()` （必须）

2. **业务规则验证在实体中**
   - ❌ 设计文档中：`if (user.getStatus() == "0") { ... }` （允许）
   - ✅ 实际编码时：`if (user.isEnabled()) { ... }` （必须）

3. **基本字段可以直接设置**
   - ✅ `user.setEmail(cmd.getEmail())` （基本信息，设计和编码都允许）
   - ✅ `user.setPhone(cmd.getPhone())` （基本信息，设计和编码都允许）
   - ❌ 设计文档中：`user.setStatus(cmd.getStatus())` （允许）
   - ✅ 实际编码时：`user.enable()` 或 `user.disable()` （必须）

4. **复杂业务逻辑使用领域服务**
   - 当业务逻辑涉及多个聚合时，使用 Domain Service
   - Domain Service 也不应该直接修改实体字段

5. **从设计到编码的转换**
   - 设计阶段：快速表达业务逻辑，可以在 Service 中直接写
   - 编码阶段：将业务逻辑提取到实体的业务方法中
   - 编码阶段：Application Service 只调用实体的业务方法

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：TenantUser 代码完全删除

*对于任何* 代码搜索，系统中不应该存在任何 TenantUser 相关的类、接口或引用（除了迁移脚本和文档）

**验证：需求 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

### 属性 2：租户用户查询功能保持

*对于任何* 租户ID，查询租户用户的功能应该返回该租户下的所有用户，结果与之前使用 TenantUser 时一致

**验证：需求 2.1, 2.4**

### 属性 2.1：用户名在租户中唯一

*对于任何* username 和 tenantId，在同一个租户中不应该存在两个相同 username 的用户

**验证：需求 4.1, 4.8**

### 属性 3：用户启用/禁用功能保持

*对于任何* 用户ID和租户ID，启用/禁用用户的功能应该正确更新 GlobalUser 的状态

**验证：需求 2.2**

### 属性 4：角色分配功能保持

*对于任何* 用户ID和角色ID列表，分配角色的功能应该正确更新 user_role 表

**验证：需求 2.3**

### 属性 5：Mapper 映射正确

*对于任何* UserMapper 操作，应该正确映射到 iam_global_user 表

**验证：需求 3.1, 3.2**

### 属性 6：租户配置权限控制

*对于任何* 非租户管理员用户，访问租户配置接口应该被拒绝并返回权限错误

**验证：需求 6.3**

### 属性 7：租户配置更新正确性

*对于任何* 租户管理员，编辑租户配置应该正确更新租户信息，并验证租户代码的唯一性

**验证：需求 6.2, 6.5**

## 错误处理

### 错误场景

1. **租户用户不存在**
   - 错误码：`USER_NOT_FOUND`
   - 处理：抛出 `IamException`

2. **租户ID缺失**
   - 错误码：`TENANT_ID_REQUIRED`
   - 处理：抛出 `IamException`

3. **用户不属于租户**
   - 错误码：`USER_NOT_IN_TENANT`
   - 处理：抛出 `IamException`

## 测试策略

### 单元测试

1. **GlobalUserApplicationService 测试**
   - 测试 `getUsersByTenantId()` 方法
   - 测试租户过滤逻辑
   - 测试用户启用/禁用

2. **TenantController 测试**
   - 测试 `getTenantUsers()` 接口
   - 测试返回数据格式

### 集成测试

1. **端到端测试**
   - 测试查询租户用户流程
   - 测试用户管理流程
   - 测试角色分配流程

### 回归测试

1. **功能回归**
   - 确保所有原有功能正常工作
   - 确保性能没有明显下降

## 迁移步骤

### 阶段 1：代码准备

1. 确保 GlobalUser 实体包含所有必要字段
2. 确保 GlobalUserApplicationService 包含所有必要方法
3. 更新 UserMapper 映射

### 阶段 2：功能迁移

1. 更新 TenantController
2. 删除 TenantUserController
3. 删除 TenantUserApplicationService

### 阶段 3：清理代码

1. 删除 TenantUser 实体
2. 删除 TenantUserService
3. 删除 TenantUserRepository
4. 删除 TenantUserMapper
5. 删除常量类

### 阶段 4：数据库清理

1. 确认数据已迁移
2. 删除 iam_tenant_user 表

### 阶段 5：测试验证

1. 运行单元测试
2. 运行集成测试
3. 运行回归测试

## 风险和注意事项

### 风险

1. **数据丢失风险**
   - 缓解：在删除表前确保数据已完全迁移
   - 缓解：保留数据库备份

2. **功能缺失风险**
   - 缓解：详细的测试覆盖
   - 缓解：逐步迁移，每步验证

3. **性能下降风险**
   - 缓解：优化 JSON_CONTAINS 查询
   - 缓解：添加必要的索引

### 注意事项

1. **租户隔离**
   - 确保 tenantIds 字段正确维护
   - 确保查询时正确过滤租户

2. **向后兼容**
   - 如果有外部系统依赖 TenantUser API，需要提供兼容层
   - 或者通知外部系统更新

3. **缓存清理**
   - 清理所有与 TenantUser 相关的缓存
   - 更新缓存键的生成逻辑

## 性能优化

### 索引优化

```sql
-- 为 tenantIds 字段添加虚拟列索引（MySQL 5.7+）
ALTER TABLE iam_global_user 
ADD COLUMN tenant_ids_virtual JSON 
GENERATED ALWAYS AS (tenant_ids) VIRTUAL;

CREATE INDEX idx_tenant_ids ON iam_global_user((CAST(tenant_ids_virtual AS CHAR(255) ARRAY)));
```

### 查询优化

```java
// 使用更高效的查询方式
public List<GlobalUser> getUsersByTenantId(String tenantId) {
    // 方案 1：使用 JSON_CONTAINS（推荐）
    LambdaQueryWrapper<GlobalUser> wrapper = new LambdaQueryWrapper<>();
    wrapper.apply("JSON_CONTAINS(tenant_ids, JSON_QUOTE({0}))", tenantId);
    return globalUserMapper.selectList(wrapper);
    
    // 方案 2：使用 JSON_SEARCH（备选）
    // wrapper.apply("JSON_SEARCH(tenant_ids, 'one', {0}) IS NOT NULL", tenantId);
}
```

## 总结

### 架构改进

本次清理将简化系统架构，消除 TenantUser 和 GlobalUser 的混淆，统一使用 GlobalUser 管理用户。通过 tenantIds 字段实现租户隔离，保持系统的多租户能力。

### 关键要点

1. **Token 机制**
   - 使用 Redis + TokenInfo 存储 token
   - TokenInfo 只包含基本信息（userId, tenantId, facilityId）
   - 完整用户信息通过 `/auth/userinfo` 接口从数据库查询

2. **DDD 充血模型**
   - 业务逻辑在领域层（实体、值对象、领域服务）
   - Application Service 只协调领域对象
   - 状态转换通过业务方法（如 `user.enable()`, `user.disable()`）
   - 禁止在 Application Service 中直接修改业务字段

3. **代码规范**
   - 遵循 DDD 充血模型规范（`ddd-rich-domain-model-guidelines.md`）
   - 遵循阿里巴巴 Java 开发规范（`alibaba-java-coding-guidelines.md`）
   - 遵循项目开发守则（`shrimp-rules.md`）

### 实际编码检查清单

**在实际编码时（Implementation Phase），必须检查**：

- [ ] 业务逻辑是否在领域层？
- [ ] Application Service 是否只协调领域对象？
- [ ] 是否使用实体的业务方法而不是直接修改字段？
- [ ] 是否避免了魔法值？
- [ ] 是否有完整的 JavaDoc 注释？
- [ ] 方法长度是否不超过 80 行？
- [ ] 是否遵循了项目特定的规范？

### 设计文档说明

**强制约束总结**：

| 阶段 | DDD 规范 | 阿里规范 | 业务逻辑位置 | 字段修改方式 |
|------|---------|---------|------------|------------|
| **设计阶段** | 可以绕过 | 可以绕过 | 可以在 Service | 可以直接 set |
| **编码阶段** | 必须遵循 | 必须遵循 | 必须在领域层 | 必须用业务方法 |

**设计文档的作用**：
- ✅ 快速表达功能实现思路
- ✅ 展示业务流程和逻辑
- ✅ 作为编码的参考蓝图
- ❌ 不是可以直接照抄的代码
- ❌ 不代表最终的代码结构

**编码时的转换**：
1. 阅读设计文档，理解业务逻辑
2. 识别哪些是业务逻辑（需要移到领域层）
3. 在实体中添加业务方法
4. Application Service 调用业务方法
5. 遵循所有代码规范
