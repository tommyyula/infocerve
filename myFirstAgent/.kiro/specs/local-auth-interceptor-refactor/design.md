# 设计文档 - LocalAuthInterceptor 重构到 Common 模块

## 概述

本设计文档描述如何将 `LocalAuthInterceptor` 从 `xms-pass` 模块重构到 `common` 模块，使其可以被所有模块复用。同时统一 `TokenHolder` 的实现，采用 `iam-app` 模块中更现代的设计。

## 架构设计

### 模块依赖关系

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  xms-pass   │     │   iam-app   │     │  其他模块   │
│             │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │    common     │
                   │               │
                   │ - TokenHolder │
                   │ - AuthConst.. │
                   │ - LocalAuth.. │
                   └───────────────┘
```

### 包结构设计

```
common/
└── src/main/java/com/t5/
    ├── common/
    │   ├── constants/
    │   │   └── AuthConstants.java          # 认证相关常量
    │   └── dto/
    │       └── UserContext.java            # 用户上下文（已存在）
    └── infrastructure/
        ├── interceptor/
        │   └── LocalAuthInterceptor.java   # 本地认证拦截器
        └── security/
            └── TokenHolder.java             # Token 上下文持有者
```

## 组件设计

### 1. AuthConstants（认证常量）

**位置**：`com.t5.common.constants.AuthConstants`

**职责**：
- 定义认证相关的常量
- 统一管理请求头名称
- 统一管理认证前缀

**设计**：
```java
/**
 * 认证相关常量
 * 
 * @author Kiro AI
 */
public class AuthConstants {
    
    // ============================================
    // 请求头名称
    // ============================================
    
    /**
     * Authorization 请求头
     * 格式：Bearer {token}
     */
    public static final String HEADER_AUTHORIZATION = "Authorization";
    
    /**
     * Token 请求头
     * 直接传递 token，不需要 Bearer 前缀
     */
    public static final String HEADER_TOKEN = "X-Token";
    
    /**
     * 用户ID 请求头
     * Gateway 注入
     */
    public static final String HEADER_USER_ID = "X-User-ID";
    
    /**
     * 用户名 请求头
     * Gateway 注入
     */
    public static final String HEADER_USERNAME = "X-Username";
    
    /**
     * 租户ID 请求头
     * Gateway 注入
     */
    public static final String HEADER_TENANT_ID = "X-Tenant-ID";
    
    /**
     * 设施ID 请求头
     * Gateway 注入
     */
    public static final String HEADER_FACILITY_ID = "X-Facility-ID";
    
    /**
     * 网关请求标识
     * Gateway 注入，标识请求来自网关
     */
    public static final String HEADER_GATEWAY_REQUEST = "X-Gateway-Request";
    
    // ============================================
    // 认证前缀
    // ============================================
    
    /**
     * Bearer 认证前缀
     */
    public static final String AUTHORIZATION_PREFIX = "Bearer ";
    
    // ============================================
    // 私有构造函数
    // ============================================
    
    private AuthConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}
```

### 2. TokenHolder（Token 上下文持有者）

**位置**：`com.t5.infrastructure.security.TokenHolder`

**职责**：
- 使用 ThreadLocal 存储当前请求的用户上下文
- 提供便捷方法获取用户信息
- 请求完成后清理 ThreadLocal

**设计**：采用 `iam-app` 的实现，使用 `UserContext` 对象

```java
/**
 * Token 上下文持有者
 * 使用 ThreadLocal 存储当前用户信息
 * 
 * <p>使用场景：</p>
 * <ul>
 *   <li>Gateway 将用户信息注入到请求头</li>
 *   <li>LocalAuthInterceptor 提取后设置到此 Holder</li>
 *   <li>业务代码通过此 Holder 获取当前用户信息</li>
 * </ul>
 * 
 * @author Kiro AI
 */
@Slf4j
public class TokenHolder {

    private static final ThreadLocal<UserContext> userContextThreadLocal = new ThreadLocal<>();

    /**
     * 设置用户上下文
     *
     * @param userContext 用户上下文
     */
    public static void setUserContext(UserContext userContext) {
        userContextThreadLocal.set(userContext);
    }

    /**
     * 获取当前用户上下文
     *
     * @return 用户上下文，如果不存在返回 null
     */
    public static UserContext getCurrentUser() {
        return userContextThreadLocal.get();
    }

    /**
     * 获取当前用户ID
     *
     * @return 用户ID，如果不存在返回 null
     */
    public static String getCurrentUserId() {
        UserContext context = userContextThreadLocal.get();
        return context != null ? context.getUserId() : null;
    }

    /**
     * 获取当前租户ID
     *
     * @return 租户ID，如果不存在返回 null
     */
    public static String getCurrentTenantId() {
        UserContext context = userContextThreadLocal.get();
        return context != null ? context.getTenantId() : null;
    }

    /**
     * 获取当前设施ID
     *
     * @return 设施ID，如果不存在返回 null
     */
    public static String getCurrentFacilityId() {
        UserContext context = userContextThreadLocal.get();
        return context != null ? context.getFacilityId() : null;
    }

    /**
     * 判断是否有设施上下文
     *
     * @return true 如果有设施上下文，false 否则
     */
    public static boolean hasFacilityContext() {
        UserContext context = userContextThreadLocal.get();
        return context != null && Boolean.TRUE.equals(context.getHasFacilityContext());
    }

    /**
     * 获取当前用户名
     *
     * @return 用户名，如果不存在返回 null
     */
    public static String getCurrentUsername() {
        UserContext context = userContextThreadLocal.get();
        return context != null ? context.getUsername() : null;
    }

    /**
     * 获取当前用户角色列表
     *
     * @return 用户角色列表，如果不存在返回空列表
     */
    public static List<String> getCurrentUserRoles() {
        UserContext context = userContextThreadLocal.get();
        return context != null && context.getRoles() != null ? context.getRoles() : Collections.emptyList();
    }

    /**
     * 获取当前用户权限列表
     *
     * @return 用户权限列表，如果不存在返回空列表
     */
    public static List<String> getCurrentUserPermissions() {
        UserContext context = userContextThreadLocal.get();
        return context != null && context.getPermissions() != null ? context.getPermissions() : Collections.emptyList();
    }

    /**
     * 判断当前用户是否为系统管理员
     *
     * @return true 如果是系统管理员，false 否则
     */
    public static boolean isSystemAdmin() {
        UserContext context = userContextThreadLocal.get();
        return context != null && Boolean.TRUE.equals(context.getIsSystemAdmin());
    }

    /**
     * 清理上下文
     * 必须在请求处理完成后调用，避免 ThreadLocal 内存泄漏
     */
    public static void clear() {
        userContextThreadLocal.remove();
    }
}
```

### 3. LocalAuthInterceptor（本地认证拦截器）

**位置**：`com.t5.infrastructure.interceptor.LocalAuthInterceptor`

**职责**：
- 检查请求是否来自网关
- 来自网关的请求直接放行，提取用户信息
- 非网关请求执行本地认证（验证 Token）
- 请求完成后清理 ThreadLocal

**修改点**：
1. 使用 `AuthConstants` 替代 `PassConstants`
2. 使用新的 `TokenHolder`（基于 `UserContext`）
3. 适配 `UserContext` 的数据结构

**关键方法**：

```java
/**
 * 从网关注入的请求头中提取用户上下文
 */
private void extractUserContextFromGateway(HttpServletRequest request) {
    // 创建 UserContext
    UserContext userContext = new UserContext();
    userContext.setUserId(request.getHeader(AuthConstants.HEADER_USER_ID));
    userContext.setUsername(request.getHeader(AuthConstants.HEADER_USERNAME));
    userContext.setTenantId(request.getHeader(AuthConstants.HEADER_TENANT_ID));
    userContext.setFacilityId(request.getHeader(AuthConstants.HEADER_FACILITY_ID));
    
    // 设置到 TokenHolder
    TokenHolder.setUserContext(userContext);
    
    // 设置 IsolationHolder（租户隔离）
    String tenantId = request.getHeader(AuthConstants.HEADER_TENANT_ID);
    if (StringUtils.isNotBlank(tenantId)) {
        IsolationHolder.setTenantId(tenantId);
    }
}

/**
 * 设置用户上下文
 */
private void setUserContext(ValidateTokenDto result, String token, HttpServletRequest request) {
    UserInfoDto userInfo = result.getUserInfo();
    
    // 创建 UserContext
    UserContext userContext = new UserContext();
    userContext.setUserId(userInfo.getUserId());
    userContext.setUsername(userInfo.getUsername());
    userContext.setTenantId(userInfo.getTenantId());
    
    // 如果请求头中有租户ID，优先使用请求头中的
    String headerTenantId = request.getHeader(AuthConstants.HEADER_TENANT_ID);
    if (StringUtils.isNotBlank(headerTenantId)) {
        userContext.setTenantId(headerTenantId);
    }
    
    // 如果请求头中有设施ID，设置到 UserContext
    String facilityId = request.getHeader(AuthConstants.HEADER_FACILITY_ID);
    if (StringUtils.isNotBlank(facilityId)) {
        userContext.setFacilityId(facilityId);
    }
    
    // 设置到 TokenHolder
    TokenHolder.setUserContext(userContext);
    
    // 设置 IsolationHolder（租户隔离）
    if (StringUtils.isNotBlank(userContext.getTenantId())) {
        IsolationHolder.setTenantId(userContext.getTenantId());
    }
    if (StringUtils.isNotBlank(facilityId)) {
        IsolationHolder.setFacilityId(facilityId);
    }
}
```

## 数据模型

### UserContext（用户上下文）

**位置**：`com.t5.xms.pass.infrastructure.security.UserContext`（已存在）

**字段**：
- `userId`: 用户ID
- `username`: 用户名
- `tenantId`: 租户ID
- `facilityId`: 设施ID
- `hasFacilityContext`: 是否有设施上下文
- `roles`: 用户角色列表
- `permissions`: 用户权限列表
- `isSystemAdmin`: 是否为系统管理员

## 错误处理

### 错误场景

1. **Token 缺失**：返回 401 Unauthorized
2. **Token 无效**：返回 401 Unauthorized
3. **Token 验证失败**：返回 401 Unauthorized
4. **本地认证未启用**：返回 401 Unauthorized

### 错误响应格式

```json
{
  "code": 401,
  "message": "Token required"
}
```

## 测试策略

### 单元测试

1. **AuthConstants 测试**
   - 验证常量值正确

2. **TokenHolder 测试**
   - 测试设置和获取用户上下文
   - 测试清理 ThreadLocal
   - 测试便捷方法（如 `isSystemAdmin()`）

3. **LocalAuthInterceptor 测试**
   - 测试网关请求识别
   - 测试公开接口识别
   - 测试本地认证流程
   - 测试 ThreadLocal 清理

### 集成测试

1. **端到端测试**
   - 测试来自网关的请求
   - 测试本地调试请求
   - 测试公开接口访问
   - 测试 Token 验证

## 迁移策略

### 阶段 1：在 common 模块创建新实现

1. 创建 `AuthConstants`
2. 创建 `TokenHolder`（基于 `UserContext`）
3. 创建 `LocalAuthInterceptor`（适配新的 `TokenHolder`）

### 阶段 2：更新 xms-pass 模块

1. 删除 `LocalAuthInterceptor`
2. 删除 `TokenHolder`
3. 更新 `PassConstants`，移除已迁移的常量
4. 更新所有引用

### 阶段 3：更新 iam-app 模块

1. 删除 `TokenHolder`（使用 common 的实现）
2. 更新所有引用

### 阶段 4：测试和验证

1. 编译所有模块
2. 运行单元测试
3. 运行集成测试
4. 手动测试

## 兼容性考虑

### xms-pass 模块的兼容性

**问题**：xms-pass 的 `TokenHolder` 有一些特殊字段（如 `accountId`, `companyId`），新的实现没有这些字段。

**解决方案**：
1. 检查这些字段是否还在使用
2. 如果使用，考虑添加到 `UserContext`
3. 如果不使用，直接删除

### iam-app 模块的兼容性

**问题**：iam-app 已经使用了基于 `UserContext` 的 `TokenHolder`，迁移应该无缝。

**解决方案**：
1. 直接替换为 common 的实现
2. 更新 import 语句
3. 验证功能正常

## 配置说明

### 启用本地认证

在 `application.yml` 中配置：

```yaml
local:
  auth:
    enabled: true  # 开发环境：true，生产环境：false
```

### 注册拦截器

在配置类中注册：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Autowired
    private LocalAuthInterceptor localAuthInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localAuthInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                    "/api/iam/auth/**",
                    "/actuator/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/error"
                );
    }
}
```

## 性能考虑

1. **ThreadLocal 性能**：ThreadLocal 的性能开销很小，可以忽略
2. **Token 验证性能**：Token 验证需要调用 IAM 服务，可以考虑添加缓存
3. **拦截器顺序**：`LocalAuthInterceptor` 应该有最高优先级（`Ordered.HIGHEST_PRECEDENCE`）

## 安全考虑

1. **生产环境禁用本地认证**：通过配置 `local.auth.enabled=false` 强制使用网关
2. **Token 验证**：确保 Token 验证逻辑正确
3. **ThreadLocal 清理**：确保请求完成后清理 ThreadLocal，避免信息泄漏

## 总结

本设计采用以下策略：

1. **统一 TokenHolder 实现**：采用 iam-app 的设计，使用 `UserContext` 对象
2. **创建 AuthConstants**：统一管理认证相关常量
3. **移动 LocalAuthInterceptor**：放到 common 模块，供所有模块使用
4. **保持向后兼容**：尽量减少对现有代码的影响
5. **分阶段迁移**：先创建新实现，再逐步迁移各模块

这个设计可以：
- ✅ 提高代码复用性
- ✅ 统一认证逻辑
- ✅ 简化维护工作
- ✅ 保持向后兼容
