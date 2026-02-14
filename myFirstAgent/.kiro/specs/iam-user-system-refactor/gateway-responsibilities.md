# 网关层职责和调整方案

## 📋 网关层完整职责

### 1. 认证职责（AuthGatewayFilterFactory）

**核心功能：**
- ✅ **Token验证**：调用IAM服务验证Token有效性
- ✅ **用户信息提取**：从Token中提取 userId、username、tenantId、facilityId、isSystemAdmin
- ✅ **请求头注入**：将用户信息注入到请求头供下游服务使用
- ✅ **缓存优化**：缓存Token验证结果（30分钟），减少IAM服务调用
- ✅ **白名单管理**：公开接口（登录、健康检查等）跳过认证
- ✅ **网关标识**：添加 X-Gateway-Request: true 标识，标记请求来自网关

**注入的请求头：**
- `X-Gateway-Request: true` - 标识请求来自网关（用于本地调试拦截器）
- `X-User-Id` - 用户ID
- `X-Username` - 用户名
- `X-Tenant-ID` - 租户ID
- `X-Facility-ID` - 设施ID
- `X-Is-System-Admin` - 是否系统管理员（true/false）

**删除的请求头（已废弃）：**
- ~~`X-User-Roles`~~ - 不再注入
- ~~`X-User-Permissions`~~ - 不再注入

**透传的请求头：**
- `X-Token` - 原始Token
- `x-channel` - 渠道标识
- `X-System-Code` - 系统标识
- `Accept-Language` - 语言偏好
- `Item-Time-Zone` - 时区信息

---

### 2. 租户验证职责（TenantGatewayFilterFactory）

**核心功能：**
- ✅ **租户有效性验证**：验证租户是否存在且启用
- ✅ **SystemAdmin豁免**：系统管理员跳过租户验证
- ✅ **缓存优化**：缓存租户验证结果
- ✅ **白名单管理**：特定路径跳过租户验证

**验证逻辑：**
```
1. 检查是否启用租户验证（配置开关）
2. 检查路径是否在白名单中
3. 检查是否为 SystemAdmin（X-Is-System-Admin: true）
   - 是：直接放行
   - 否：继续验证
4. 从请求头获取 X-Tenant-ID
5. 调用 IAM 服务验证租户有效性
6. 缓存验证结果
7. 返回验证结果
```

---

### 3. 设施验证职责（FacilityGatewayFilterFactory）

**核心功能：**
- ✅ **设施有效性验证**：验证设施是否存在
- ✅ **用户权限验证**：验证用户是否有权访问该设施
- ✅ **SystemAdmin豁免**：系统管理员跳过设施验证
- ✅ **缓存优化**：缓存设施验证结果
- ✅ **白名单管理**：特定路径跳过设施验证
- ✅ **按需验证**：根据路径前缀决定是否需要设施验证

**验证逻辑：**
```
1. 检查是否启用设施验证（配置开关）
2. 检查路径是否在白名单中
3. 检查是否为 SystemAdmin（X-Is-System-Admin: true）
   - 是：直接放行
   - 否：继续验证
4. 检查路径是否需要设施验证（根据路径前缀）
5. 从请求头获取 X-Facility-ID 和 X-User-Id
6. 调用 IAM 服务验证设施权限
7. 缓存验证结果
8. 返回验证结果
```

---

### 4. API权限验证职责（PermissionGatewayFilterFactory）

**核心功能：**
- ✅ **API权限验证**：验证用户是否有权访问请求的API路径
- ✅ **基于菜单权限**：权限判断基于用户角色关联的菜单中的 apiPaths 字段
- ✅ **SystemAdmin豁免**：系统管理员跳过API权限验证
- ✅ **缓存优化**：缓存权限验证结果
- ✅ **白名单管理**：特定路径跳过权限验证
- ✅ **HTTP方法支持**：支持 GET、POST、PUT、DELETE 等方法的权限验证

**权限模型：**
```
用户 → 角色 → 菜单 → apiPaths（JSON数组）

示例：
Menu {
  menuId: 1,
  menuName: "用户管理",
  apiPaths: [
    "/api/iam/users",
    "/api/iam/users/*",
    "/api/iam/users/*/tenants"
  ]
}

用户有"用户管理"菜单权限 → 可以访问 apiPaths 中的所有API
```

**验证逻辑：**
```
1. 检查是否启用权限验证（配置开关）
2. 检查路径是否在白名单中
3. 检查是否为 SystemAdmin（X-Is-System-Admin: true）
   - 是：直接放行
   - 否：继续验证
4. 从请求头获取 X-User-Id
5. 获取请求路径和HTTP方法
6. 调用 IAM 服务验证权限（基于用户角色的菜单 apiPaths）
7. 缓存验证结果（cacheKey: permission:userId:path:method）
8. 返回验证结果
```

---

## 🔄 过滤器执行顺序

```
请求 → AuthGatewayFilter → TenantGatewayFilter → FacilityGatewayFilter → PermissionGatewayFilter → 下游服务
       ↓                    ↓                      ↓                        ↓
   1. Token验证          2. 租户验证            3. 设施验证              4. API权限验证
   2. 提取用户信息        3. SystemAdmin豁免     4. SystemAdmin豁免       5. SystemAdmin豁免
   3. 注入请求头          4. 缓存优化            5. 缓存优化              6. 缓存优化
   4. 添加网关标识
   5. 删除废弃请求头
```

---

## 🎯 SystemAdmin 特权总结

**SystemAdmin 在网关层享有以下特权：**
1. ✅ **跳过租户验证**：无需验证租户有效性
2. ✅ **跳过设施验证**：无需验证设施权限
3. ✅ **跳过API权限验证**：无需验证API访问权限
4. ✅ **访问所有租户**：可以访问任意租户的数据
5. ✅ **访问所有设施**：可以访问任意设施的数据
6. ✅ **访问所有API**：可以访问所有API接口
7. ✅ **标识传递**：`X-Is-System-Admin: true` 请求头传递给下游服务

---

## 📝 请求头流转示例

### 普通用户请求：

```
前端发送：
  X-Token: eyJhbGc...
  X-Tenant-ID: T001
  X-Facility-ID: F28
  x-channel: web
  X-System-Code: WMS
  Accept-Language: zh-CN
  Item-Time-Zone: Asia/Shanghai

网关处理后（注入）：
  X-Gateway-Request: true          ← 网关添加
  X-User-Id: U123                  ← 网关添加
  X-Username: zhangsan             ← 网关添加
  X-Tenant-ID: T001                ← 保留
  X-Facility-ID: F28               ← 保留
  X-Is-System-Admin: false         ← 网关添加
  X-Token: eyJhbGc...              ← 保留
  x-channel: web                   ← 透传
  X-System-Code: WMS               ← 透传
  Accept-Language: zh-CN           ← 透传
  Item-Time-Zone: Asia/Shanghai    ← 透传

网关验证流程：
  ✅ AuthGatewayFilter: Token验证通过
  ✅ TenantGatewayFilter: 租户T001验证通过
  ✅ FacilityGatewayFilter: 设施F28验证通过
  ✅ PermissionGatewayFilter: API权限验证通过
  → 请求转发到下游服务
```

### SystemAdmin 请求：

```
前端发送：
  X-Token: eyJhbGc...
  x-channel: web
  X-System-Code: WMS
  Accept-Language: zh-CN

网关处理后（注入）：
  X-Gateway-Request: true          ← 网关添加
  X-User-Id: U001                  ← 网关添加
  X-Username: admin                ← 网关添加
  X-Is-System-Admin: true          ← 网关添加（关键！）
  X-Token: eyJhbGc...              ← 保留
  x-channel: web                   ← 透传
  X-System-Code: WMS               ← 透传
  Accept-Language: zh-CN           ← 透传

网关验证流程：
  ✅ AuthGatewayFilter: Token验证通过
  ⏭️ TenantGatewayFilter: SystemAdmin，跳过租户验证
  ⏭️ FacilityGatewayFilter: SystemAdmin，跳过设施验证
  ⏭️ PermissionGatewayFilter: SystemAdmin，跳过API权限验证
  → 请求转发到下游服务
```

---

## 🔧 具体调整内容

### 调整 1：AuthGatewayFilterFactory

**文件位置：** `wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/AuthGatewayFilterFactory.java`

**修改点：**

1. **ValidateTokenResponseDto.UserInfoResponseDto 添加字段：**
```java
public static class UserInfoResponseDto {
    private String userId;
    private String username;
    private String tenantId;
    private String defaultFacilityId;
    private List<String> facilityIds;
    private Boolean isSystemAdmin;  // ← 新增字段
    
    // getter/setter...
}
```

2. **buildRequestWithUserInfo() 方法中添加：**
```java
// 注入 SystemAdmin 标识
if (userInfo.getIsSystemAdmin() != null) {
    requestBuilder.header("X-Is-System-Admin", userInfo.getIsSystemAdmin().toString());
}

// 添加网关标识
requestBuilder.header("X-Gateway-Request", "true");
```

3. **buildRequestWithUserInfo() 方法中删除：**
```java
// 删除以下代码块：
// 注入角色（JSON格式）
if (validateResult.getRoles() != null && !validateResult.getRoles().isEmpty()) {
    try {
        String rolesJson = objectMapper.writeValueAsString(validateResult.getRoles());
        requestBuilder.header(USER_ROLES_HEADER, rolesJson);
    } catch (JsonProcessingException e) {
        log.warn("Failed to serialize roles to JSON", e);
    }
}

// 注入权限（JSON格式）
if (validateResult.getPermissions() != null && !validateResult.getPermissions().isEmpty()) {
    try {
        String permissionsJson = objectMapper.writeValueAsString(validateResult.getPermissions());
        requestBuilder.header(USER_PERMISSIONS_HEADER, permissionsJson);
    } catch (JsonProcessingException e) {
        log.warn("Failed to serialize permissions to JSON", e);
    }
}
```

---

### 调整 2：TenantGatewayFilterFactory

**文件位置：** `wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/TenantGatewayFilterFactory.java`

**修改点：**

在 `apply()` 方法中，白名单检查之后添加：

```java
// 检查是否为系统管理员
String isSystemAdmin = exchange.getRequest().getHeaders().getFirst("X-Is-System-Admin");
if ("true".equalsIgnoreCase(isSystemAdmin)) {
    log.debug("User is system admin, skipping tenant validation");
    return chain.filter(exchange);
}
```

---

### 调整 3：FacilityGatewayFilterFactory

**文件位置：** `wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/FacilityGatewayFilterFactory.java`

**修改点：**

在 `apply()` 方法中，白名单检查之后添加：

```java
// 检查是否为系统管理员
String isSystemAdmin = exchange.getRequest().getHeaders().getFirst("X-Is-System-Admin");
if ("true".equalsIgnoreCase(isSystemAdmin)) {
    log.debug("User is system admin, skipping facility validation");
    return injectFacilityIdAndContinue(exchange, chain);
}
```

---

### 调整 4：PermissionGatewayFilterFactory

**文件位置：** `wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/PermissionGatewayFilterFactory.java`

**修改点：**

在 `apply()` 方法中，白名单检查之后添加：

```java
// 检查是否为系统管理员
String isSystemAdmin = exchange.getRequest().getHeaders().getFirst("X-Is-System-Admin");
if ("true".equalsIgnoreCase(isSystemAdmin)) {
    log.debug("User is system admin, skipping permission check");
    return chain.filter(exchange);
}
```

---

## ✅ 调整后的优势

1. **完整的权限体系**：Token验证 → 租户验证 → 设施验证 → API权限验证
2. **一致性**：四个过滤器都支持 SystemAdmin 豁免
3. **安全性**：通过 X-Gateway-Request 标识，防止绕过网关
4. **简洁性**：删除废弃的 X-User-Roles 和 X-User-Permissions
5. **可维护性**：逻辑清晰，易于理解
6. **性能优化**：SystemAdmin 跳过不必要的验证，缓存机制减少IAM调用
7. **为本地调试做准备**：X-Gateway-Request 标识供本地拦截器使用
8. **基于菜单的权限控制**：API权限验证基于菜单的 apiPaths 字段

---

## 🎓 权限验证示例

### 示例 1：普通用户访问用户管理API

```
用户：zhangsan
角色：用户管理员
菜单权限：
  - 用户管理菜单（apiPaths: ["/api/iam/users", "/api/iam/users/*"]）

请求：GET /api/iam/users

验证流程：
1. AuthGatewayFilter: Token验证通过 ✅
2. TenantGatewayFilter: 租户验证通过 ✅
3. FacilityGatewayFilter: 设施验证通过 ✅
4. PermissionGatewayFilter: 
   - 检查用户角色的菜单 apiPaths
   - 发现 "/api/iam/users" 在 apiPaths 中
   - 权限验证通过 ✅
5. 请求转发到下游服务 ✅
```

### 示例 2：普通用户访问无权限的API

```
用户：zhangsan
角色：用户管理员
菜单权限：
  - 用户管理菜单（apiPaths: ["/api/iam/users", "/api/iam/users/*"]）

请求：GET /api/iam/tenants

验证流程：
1. AuthGatewayFilter: Token验证通过 ✅
2. TenantGatewayFilter: 租户验证通过 ✅
3. FacilityGatewayFilter: 设施验证通过 ✅
4. PermissionGatewayFilter: 
   - 检查用户角色的菜单 apiPaths
   - 未发现 "/api/iam/tenants" 在 apiPaths 中
   - 权限验证失败 ❌
5. 返回 403 Forbidden ❌
```

### 示例 3：SystemAdmin 访问任意API

```
用户：admin
isSystemAdmin: true

请求：GET /api/iam/tenants

验证流程：
1. AuthGatewayFilter: Token验证通过 ✅
2. TenantGatewayFilter: SystemAdmin，跳过 ⏭️
3. FacilityGatewayFilter: SystemAdmin，跳过 ⏭️
4. PermissionGatewayFilter: SystemAdmin，跳过 ⏭️
5. 请求转发到下游服务 ✅
```

---

## 📊 缓存策略

### Token验证缓存
- **Key**: `token:{token}`
- **TTL**: 30分钟
- **Value**: ValidateTokenResponseDto

### 租户验证缓存
- **Key**: `tenant:{tenantId}`
- **TTL**: 可配置（默认30分钟）
- **Value**: Boolean

### 设施验证缓存
- **Key**: `facility:{facilityId}:{userId}`
- **TTL**: 可配置（默认30分钟）
- **Value**: Boolean

### 权限验证缓存
- **Key**: `permission:{userId}:{path}:{method}`
- **TTL**: 可配置（默认30分钟）
- **Value**: Boolean

---

## 🔍 错误处理

### HTTP 状态码

| 状态码 | 场景 | 过滤器 |
|--------|------|--------|
| 401 Unauthorized | Token无效或缺失 | AuthGatewayFilter |
| 400 Bad Request | 租户ID缺失或无效 | TenantGatewayFilter |
| 400 Bad Request | 设施ID缺失或无效 | FacilityGatewayFilter |
| 403 Forbidden | 用户无权访问设施 | FacilityGatewayFilter |
| 403 Forbidden | 用户无权访问API | PermissionGatewayFilter |
| 503 Service Unavailable | IAM服务不可用 | 所有过滤器 |

---

## 📌 注意事项

1. **过滤器顺序很重要**：必须按照 Auth → Tenant → Facility → Permission 的顺序执行
2. **SystemAdmin 标识必须在 AuthGatewayFilter 中注入**：后续过滤器依赖此标识
3. **X-Gateway-Request 标识必须添加**：用于本地调试拦截器识别请求来源
4. **废弃的请求头必须删除**：X-User-Roles 和 X-User-Permissions 不再使用
5. **缓存机制必须启用**：减少IAM服务调用，提升性能
6. **白名单配置必须正确**：公开接口（登录、健康检查等）必须在白名单中
7. **API权限基于菜单 apiPaths**：确保菜单的 apiPaths 字段正确配置

---

## 🚨 问题：过滤器没有全局生效

### 问题描述

**当前状态**：
- 已实现 4 个网关过滤器（AuthGatewayFilterFactory、TenantGatewayFilterFactory、FacilityGatewayFilterFactory、PermissionGatewayFilterFactory）
- 过滤器都实现了 `Ordered` 接口，定义了执行顺序
- **但是过滤器没有自动应用到所有路由**

**根本原因**：
- `GatewayFilterFactory` 不是全局过滤器
- 需要在路由配置中显式指定才能生效
- 即使实现了 `Ordered` 接口，也不会自动应用

---

## ✅ 解决方案：改为 GlobalFilter

### 方案对比

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **方案1：改为 GlobalFilter** | ✅ 自动应用到所有路由<br>✅ 不需要修改路由配置<br>✅ 通过 Ordered 控制顺序 | ❌ 无法在路由级别配置白名单 | ⭐ **推荐** |
| **方案2：配置 default-filters** | ✅ 保持当前代码结构<br>✅ 可以在路由级别配置 | ❌ 需要在配置文件中显式添加<br>❌ 容易遗漏 | 不推荐 |

---

### 实施步骤：改为 GlobalFilter

#### 步骤 1：创建 GlobalFilter 实现

**AuthGlobalFilter.java**：
```java
package com.t5.base.gateway.biz.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.t5.base.gateway.biz.common.cache.CacheStorage;
import com.t5.base.gateway.biz.common.config.AuthConfig;
import com.t5.base.gateway.biz.common.dto.RespData;
import com.t5.base.gateway.biz.common.dto.ValidateTokenResponseDto;
import com.t5.base.gateway.biz.common.dto.iam.ValidateTokenDto;
import com.t5.base.gateway.biz.common.exp.ErrorCodeConstants;
import com.t5.base.gateway.biz.common.feign.AuthClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * 认证全局过滤器
 * 自动应用到所有路由，验证Token并注入用户信息
 */
@Component
@Slf4j
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    public static final String TOKEN_HEADER = "X-Token";
    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String TENANT_ID_HEADER = "X-Tenant-ID";
    private static final String USERNAME_HEADER = "X-Username";
    public static final String FACILITY_ID_HEADER = "X-Facility-ID";
    private static final String IS_SYSTEM_ADMIN_HEADER = "X-Is-System-Admin";
    private static final String IS_TENANT_ADMIN_HEADER = "X-Is-Tenant-Admin";
    private static final String GATEWAY_REQUEST_HEADER = "X-Gateway-Request";
    private static final String CACHE_KEY_PREFIX = "token:";
    private static final long DEFAULT_CACHE_TTL_SECONDS = 30 * 60;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired(required = false)
    private CacheStorage cacheStorage;

    @Autowired
    private AuthConfig authConfig;

    @Autowired
    private AuthClient authClient;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 检查是否启用认证
        if (!authConfig.isEnabled()) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().value();

        // 检查白名单
        if (isWhiteListed(path)) {
            log.debug("Path {} is in whitelist, skipping authentication", path);
            return chain.filter(exchange);
        }

        // 从请求头提取Token
        String token = exchange.getRequest().getHeaders().getFirst(TOKEN_HEADER);
        if (StringUtils.isEmpty(token)) {
            return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED, 
                    ErrorCodeConstants.AUTH_TOKEN_MISSING, "Token is missing");
        }

        // 尝试从缓存获取验证结果
        ValidateTokenResponseDto cachedResult = null;
        if (cacheStorage != null) {
            String cacheKey = CACHE_KEY_PREFIX + token;
            cachedResult = cacheStorage.get(cacheKey, ValidateTokenResponseDto.class);
        }

        // 如果缓存中有结果，直接使用
        if (cachedResult != null) {
            if (Boolean.TRUE.equals(cachedResult.getValid())) {
                return buildRequestWithUserInfo(exchange, cachedResult, chain);
            } else {
                return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED,
                        ErrorCodeConstants.AUTH_TOKEN_INVALID, "Token is invalid");
            }
        }

        // 调用IAM服务验证Token
        return Mono.fromCallable(() -> {
            try {
                return authClient.validateToken(token);
            } catch (Exception e) {
                log.error("Error calling IAM service to validate token", e);
                throw new RuntimeException("IAM service unavailable", e);
            }
        })
        .flatMap(response -> {
            // 检查响应
            if (response == null) {
                return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED,
                        ErrorCodeConstants.AUTH_TOKEN_INVALID, "Token validation failed");
            }
            
            // 检查响应是否成功
            if (!Boolean.TRUE.equals(response.getSuccess())) {
                String msg = response.getMsg() != null ? response.getMsg() : "Token validation failed";
                return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED,
                        ErrorCodeConstants.AUTH_TOKEN_INVALID, msg);
            }
            
            // 检查code
            if (response.getCode() != null && response.getCode() != 0) {
                String msg = response.getMsg() != null ? response.getMsg() : "Token validation failed";
                return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED,
                        ErrorCodeConstants.AUTH_TOKEN_INVALID, msg);
            }

            // 获取验证结果
            ValidateTokenDto validateResult = response.getData();
            if (validateResult == null) {
                return handleError(exchange.getResponse(), HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCodeConstants.INTERNAL_SERVER_ERROR, "Response data is null");
            }

            // 检查Token是否有效
            if (!Boolean.TRUE.equals(validateResult.getValid())) {
                return handleError(exchange.getResponse(), HttpStatus.UNAUTHORIZED,
                        ErrorCodeConstants.AUTH_TOKEN_INVALID, "Token is invalid or expired");
            }

            // 转换为 ValidateTokenResponseDto
            ValidateTokenResponseDto gatewayDto = convertToGatewayDto(validateResult);

            // 缓存验证结果
            if (cacheStorage != null) {
                String cacheKey = CACHE_KEY_PREFIX + token;
                cacheStorage.put(cacheKey, gatewayDto, DEFAULT_CACHE_TTL_SECONDS);
            }

            // 构建请求并注入用户信息
            return buildRequestWithUserInfo(exchange, gatewayDto, chain);
        })
        .onErrorResume(e -> {
            log.error("Error during token validation", e);
            if (e instanceof RuntimeException && e.getMessage().contains("unavailable")) {
                return handleError(exchange.getResponse(), HttpStatus.SERVICE_UNAVAILABLE,
                        ErrorCodeConstants.AUTH_SERVICE_UNAVAILABLE, "Authentication service is unavailable");
            }
            return handleError(exchange.getResponse(), HttpStatus.INTERNAL_SERVER_ERROR,
                    ErrorCodeConstants.INTERNAL_SERVER_ERROR, "Internal server error");
        });
    }

    /**
     * 检查路径是否在白名单中
     */
    private boolean isWhiteListed(String path) {
        for (String whitePath : authConfig.getWhiteList()) {
            if (matchesPath(path, whitePath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查路径是否匹配模式（支持通配符）
     */
    private boolean matchesPath(String path, String pattern) {
        if (path.equals(pattern)) {
            return true;
        }
        
        String regex = pattern
                .replace(".", "\\.")
                .replace("*", ".*")
                .replace("?", ".");
        
        return Pattern.matches(regex, path);
    }

    /**
     * 构建包含用户信息的请求
     */
    private Mono<Void> buildRequestWithUserInfo(
            ServerWebExchange exchange,
            ValidateTokenResponseDto validateResult,
            GatewayFilterChain chain) {
        
        ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate();
        
        // 注入用户基本信息
        if (validateResult.getUserId() != null) {
            requestBuilder.header(USER_ID_HEADER, validateResult.getUserId());
        }
        
        ValidateTokenResponseDto.UserInfoResponseDto userInfo = validateResult.getUserInfo();
        if (userInfo != null) {
            if (userInfo.getTenantId() != null) {
                requestBuilder.header(TENANT_ID_HEADER, userInfo.getTenantId());
            }
            if (userInfo.getUsername() != null) {
                requestBuilder.header(USERNAME_HEADER, userInfo.getUsername());
            }
            
            // 注入系统管理员标识
            if (userInfo.getIsSystemAdmin() != null) {
                requestBuilder.header(IS_SYSTEM_ADMIN_HEADER, userInfo.getIsSystemAdmin().toString());
            } else {
                requestBuilder.header(IS_SYSTEM_ADMIN_HEADER, "false");
            }
            
            // 注入租户管理员标识
            if (userInfo.getIsTenantAdmin() != null) {
                requestBuilder.header(IS_TENANT_ADMIN_HEADER, userInfo.getIsTenantAdmin().toString());
            } else {
                requestBuilder.header(IS_TENANT_ADMIN_HEADER, "false");
            }
            
            // 统一注入设施ID
            String facilityId = determineFacilityId(exchange, userInfo);
            if (facilityId != null) {
                requestBuilder.header(FACILITY_ID_HEADER, facilityId);
            }
        }
        
        // 添加网关请求标识
        requestBuilder.header(GATEWAY_REQUEST_HEADER, "true");
        
        ServerHttpRequest newRequest = requestBuilder.build();
        return chain.filter(exchange.mutate().request(newRequest).build());
    }

    /**
     * 确定设施ID
     */
    private String determineFacilityId(
            ServerWebExchange exchange,
            ValidateTokenResponseDto.UserInfoResponseDto userInfo) {
        
        String facilityIdFromHeader = exchange.getRequest().getHeaders().getFirst(FACILITY_ID_HEADER);
        if (StringUtils.isNotEmpty(facilityIdFromHeader)) {
            if (userInfo.getFacilityIds() != null && userInfo.getFacilityIds().contains(facilityIdFromHeader)) {
                return facilityIdFromHeader;
            }
        }
        
        if (StringUtils.isNotEmpty(userInfo.getDefaultFacilityId())) {
            return userInfo.getDefaultFacilityId();
        }
        
        if (userInfo.getFacilityIds() != null && !userInfo.getFacilityIds().isEmpty()) {
            return userInfo.getFacilityIds().get(0);
        }
        
        return null;
    }

    /**
     * 转换 IAM 的 ValidateTokenDto 为网关内部使用的 ValidateTokenResponseDto
     */
    private ValidateTokenResponseDto convertToGatewayDto(ValidateTokenDto iamDto) {
        ValidateTokenResponseDto gatewayDto = new ValidateTokenResponseDto();
        gatewayDto.setValid(iamDto.getValid());
        gatewayDto.setUserId(iamDto.getUserId());
        
        ValidateTokenResponseDto.UserInfoResponseDto userInfo = new ValidateTokenResponseDto.UserInfoResponseDto();
        userInfo.setUsername(iamDto.getUsername());
        userInfo.setTenantId(iamDto.getTenantId());
        userInfo.setIsSystemAdmin(iamDto.getIsSystemAdmin());
        userInfo.setIsTenantAdmin(iamDto.getIsTenantAdmin());
        userInfo.setFacilityIds(iamDto.getFacilityIds());
        userInfo.setDefaultFacilityId(iamDto.getDefaultFacilityId());
        
        gatewayDto.setUserInfo(userInfo);
        return gatewayDto;
    }

    /**
     * 处理错误响应
     */
    private Mono<Void> handleError(ServerHttpResponse response, HttpStatus status, 
                                   com.t5.base.gateway.biz.common.exp.ErrorCode errorCode, 
                                   String message) {
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        
        RespData<String> respData = RespData.error(errorCode);
        if (message != null) {
            respData.setMsg(message);
        }
        
        try {
            String json = objectMapper.writeValueAsString(respData);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (Exception e) {
            log.error("Error writing error response", e);
            return Mono.error(e);
        }
    }

    @Override
    public int getOrder() {
        return 1; // 最高优先级
    }
}
```

**说明**：
- 改为实现 `GlobalFilter` 接口（而不是 `AbstractGatewayFilterFactory`）
- 从 `AuthConfig` 读取全局配置（白名单、缓存TTL等）
- 自动应用到所有路由

---

#### 步骤 2：创建全局配置类

**AuthConfig.java**：
```java
package com.t5.base.gateway.biz.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "gateway.auth")
@Data
public class AuthConfig {
    /**
     * 是否启用认证
     */
    private boolean enabled = true;
    
    /**
     * 白名单路径列表
     */
    private List<String> whiteList = new ArrayList<>();
    
    /**
     * 缓存TTL（秒）
     */
    private long cacheTtlSeconds = 1800; // 30分钟
}
```

---

#### 步骤 3：配置 application.yml

```yaml
gateway:
  auth:
    enabled: true
    white-list:
      - /api/iam/auth/login
      - /api/iam/auth/logout
      - /api/iam/auth/register
      - /actuator/**
    cache-ttl-seconds: 1800
  
  tenant:
    enabled: true
    white-list:
      - /api/iam/**
    cache-ttl-seconds: 1800
  
  facility:
    enabled: true
    whitelist:
      - /api/iam/**
    required-prefixes:
      - /api/wms/**
      - /api/mdm/**
    cache-ttl-seconds: 1800
  
  permission:
    enabled: true
    white-list:
      - /api/iam/auth/**
    cache-ttl-seconds: 1800
```

---

#### 步骤 4：同样改造其他 3 个过滤器

**TenantGlobalFilter.java**、**FacilityGlobalFilter.java**、**PermissionGlobalFilter.java**：
- 改为实现 `GlobalFilter` 接口
- 从对应的 Config 类读取全局配置
- 保持 `getOrder()` 返回值：2、3、4

---

### 改造后的效果

**改造前**：
```
❌ 需要在路由配置中显式添加过滤器
❌ 容易遗漏某些路由
❌ 配置复杂
```

**改造后**：
```
✅ 自动应用到所有路由
✅ 不需要修改路由配置
✅ 通过 Ordered 控制执行顺序
✅ 通过全局配置管理白名单
```

---

### 注意事项

1. **保留原有的 GatewayFilterFactory**（可选）
   - 如果需要在特定路由覆盖全局配置，可以保留
   - 大部分场景使用 GlobalFilter 即可

2. **白名单配置**
   - GlobalFilter 只能通过全局配置管理白名单
   - 无法在路由级别配置

3. **执行顺序**
   - Auth: Order=1
   - Tenant: Order=2
   - Facility: Order=3
   - Permission: Order=4

---

*最后更新：2025-12-11*
*版本：1.1（添加 GlobalFilter 解决方案）*
