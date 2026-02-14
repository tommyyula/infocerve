# 网关过滤器全局生效解决方案

## 📋 问题描述

**当前状态**：
- 已实现 4 个网关过滤器（GatewayFilterFactory）：
  1. `AuthGatewayFilterFactory` (Order=1)
  2. `TenantGatewayFilterFactory` (Order=2)
  3. `FacilityGatewayFilterFactory` (Order=3)
  4. `PermissionGatewayFilterFactory` (Order=4)

**问题**：
- 过滤器没有全局生效
- 需要在每个路由配置中显式添加过滤器才能生效

**期望**：
- 过滤器应该全局自动应用到所有路由
- 按照 Order 顺序执行：Auth → Tenant → Facility → Permission

---

## 🔍 根本原因分析

### GatewayFilterFactory vs GlobalFilter

**当前实现**：
```java
@Component
public class AuthGatewayFilterFactory extends AbstractGatewayFilterFactory<Config> implements Ordered {
    // ...
}
```

**问题**：
- `GatewayFilterFactory` 需要在路由配置中显式指定才能生效
- 即使实现了 `Ordered` 接口，也不会自动应用到所有路由

**解决方案**：
- 改为实现 `GlobalFilter` 接口
- `GlobalFilter` 会自动应用到所有路由
- `Ordered` 接口控制执行顺序

---

## ✅ 推荐方案：改为 GlobalFilter

### 优点
- ✅ 自动应用到所有路由
- ✅ 通过 `Ordered` 控制执行顺序
- ✅ 不需要修改路由配置
- ✅ 符合全局过滤器的设计意图

### 缺点
- ❌ 无法在路由级别配置白名单（需要通过全局配置）

---

## 🎯 实施方案

### 步骤 1：创建 GlobalFilter 实现

#### 1.1 AuthGlobalFilter

**文件位置**：`wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/AuthGlobalFilter.java`

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
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
 * 
 * @author system
 * @date 2025-12-11
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    public static final String TOKEN_HEADER = "X-Token";
    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String TENANT_ID_HEADER = "X-Tenant-ID";
    public static final String USERNAME_HEADER = "X-Username";
    public static final String FACILITY_ID_HEADER = "X-Facility-ID";
    public static final String IS_SYSTEM_ADMIN_HEADER = "X-Is-System-Admin";
    public static final String IS_TENANT_ADMIN_HEADER = "X-Is-Tenant-Admin";
    public static final String GATEWAY_REQUEST_HEADER = "X-Gateway-Request";
    private static final String CACHE_KEY_PREFIX = "token:";

    private final ObjectMapper objectMapper;
    private final CacheStorage cacheStorage;
    private final AuthConfig authConfig;
    private final AuthClient authClient;

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
                cacheStorage.put(cacheKey, gatewayDto, authConfig.getCacheTtlSeconds());
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
        
        // 优先从请求头获取
        String facilityIdFromHeader = exchange.getRequest().getHeaders().getFirst(FACILITY_ID_HEADER);
        if (StringUtils.isNotEmpty(facilityIdFromHeader)) {
            if (userInfo.getFacilityIds() != null && userInfo.getFacilityIds().contains(facilityIdFromHeader)) {
                return facilityIdFromHeader;
            }
        }
        
        // 使用默认设施ID
        if (StringUtils.isNotEmpty(userInfo.getDefaultFacilityId())) {
            return userInfo.getDefaultFacilityId();
        }
        
        // 如果用户有设施列表，使用第一个
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
        
        // 将通配符模式转换为正则表达式
        String regex = pattern
                .replace(".", "\\.")
                .replace("*", ".*")
                .replace("?", ".");
        
        return Pattern.matches(regex, path);
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

#### 1.2 TenantGlobalFilter

**文件位置**：`wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/TenantGlobalFilter.java`

**实现要点**：
- 复制 `TenantGatewayFilterFactory` 的逻辑
- 改为实现 `GlobalFilter` 接口
- 从 `TenantConfig` 读取全局配置
- `getOrder()` 返回 2

#### 1.3 FacilityGlobalFilter

**文件位置**：`wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/FacilityGlobalFilter.java`

**实现要点**：
- 复制 `FacilityGatewayFilterFactory` 的逻辑
- 改为实现 `GlobalFilter` 接口
- 从 `FacilityConfig` 读取全局配置
- `getOrder()` 返回 3

#### 1.4 PermissionGlobalFilter

**文件位置**：`wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/filter/PermissionGlobalFilter.java`

**实现要点**：
- 复制 `PermissionGatewayFilterFactory` 的逻辑
- 改为实现 `GlobalFilter` 接口
- 从 `PermissionConfig` 读取全局配置
- `getOrder()` 返回 4

---

### 步骤 2：创建全局配置类

#### 2.1 AuthConfig

**文件位置**：`wms-lite-gateway/src/main/java/com/item/base/gateway/biz/common/config/AuthConfig.java`

```java
package com.t5.base.gateway.biz.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * 认证全局配置
 * 
 * @author system
 * @date 2025-12-11
 */
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
    private long cacheTtlSeconds = 1800; // 默认30分钟
}
```

#### 2.2 检查其他配置类

确保以下配置类存在且完整：
- `TenantConfig`
- `FacilityConfig`
- `PermissionConfig`

---

### 步骤 3：配置 application.yml

**文件位置**：`wms-lite-gateway/src/main/resources/application.yml`

```yaml
gateway:
  # 认证配置
  auth:
    enabled: true
    white-list:
      - /api/iam/auth/login
      - /api/iam/auth/logout
      - /api/iam/auth/register
      - /actuator/**
      - /api/actuator/**
    cache-ttl-seconds: 1800
  
  # 租户验证配置
  tenant:
    enabled: true
    white-list:
      - /api/iam/**
    cache-ttl-seconds: 1800
  
  # 设施验证配置
  facility:
    enabled: true
    whitelist:
      - /api/iam/**
    required-prefixes:
      - /api/wms/**
      - /api/mdm/**
    cache-ttl-seconds: 1800
  
  # 权限验证配置
  permission:
    enabled: true
    white-list:
      - /api/iam/auth/**
    cache-ttl-seconds: 1800
```

---

## 📝 实施任务清单

### 任务 1：创建 GlobalFilter 实现

- [ ] 1.1 创建 `AuthGlobalFilter.java`
  - 复制 `AuthGatewayFilterFactory` 的逻辑
  - 改为实现 `GlobalFilter` 接口
  - 从 `AuthConfig` 读取配置
  - `getOrder()` 返回 1

- [ ] 1.2 创建 `TenantGlobalFilter.java`
  - 复制 `TenantGatewayFilterFactory` 的逻辑
  - 改为实现 `GlobalFilter` 接口
  - 从 `TenantConfig` 读取配置
  - `getOrder()` 返回 2

- [ ] 1.3 创建 `FacilityGlobalFilter.java`
  - 复制 `FacilityGatewayFilterFactory` 的逻辑
  - 改为实现 `GlobalFilter` 接口
  - 从 `FacilityConfig` 读取配置
  - `getOrder()` 返回 3

- [ ] 1.4 创建 `PermissionGlobalFilter.java`
  - 复制 `PermissionGatewayFilterFactory` 的逻辑
  - 改为实现 `GlobalFilter` 接口
  - 从 `PermissionConfig` 读取配置
  - `getOrder()` 返回 4

### 任务 2：创建全局配置类

- [ ] 2.1 创建 `AuthConfig.java`
  - 使用 `@ConfigurationProperties(prefix = "gateway.auth")`
  - 包含 `enabled`、`whiteList`、`cacheTtlSeconds` 字段

- [ ] 2.2 检查 `TenantConfig.java`
  - 确保存在且完整

- [ ] 2.3 检查 `FacilityConfig.java`
  - 确保存在且完整

- [ ] 2.4 检查 `PermissionConfig.java`
  - 确保存在且完整

### 任务 3：配置 application.yml

- [ ] 3.1 添加 `gateway.auth` 配置
- [ ] 3.2 添加 `gateway.tenant` 配置
- [ ] 3.3 添加 `gateway.facility` 配置
- [ ] 3.4 添加 `gateway.permission` 配置

### 任务 4：测试验证

- [ ] 4.1 测试过滤器执行顺序
  - 验证 Auth → Tenant → Facility → Permission 顺序
  - 添加日志输出验证

- [ ] 4.2 测试白名单
  - 验证白名单路径不执行验证
  - 验证非白名单路径执行验证

- [ ] 4.3 测试 SystemAdmin 豁免
  - 验证 SystemAdmin 跳过租户验证
  - 验证 SystemAdmin 跳过设施验证
  - 验证 SystemAdmin 跳过权限验证

- [ ] 4.4 测试缓存
  - 验证缓存生效
  - 验证缓存过期

### 任务 5：清理旧代码（可选）

- [ ] 5.1 删除或标记为废弃 `AuthGatewayFilterFactory`
- [ ] 5.2 删除或标记为废弃 `TenantGatewayFilterFactory`
- [ ] 5.3 删除或标记为废弃 `FacilityGatewayFilterFactory`
- [ ] 5.4 删除或标记为废弃 `PermissionGatewayFilterFactory`

---

## ⚠️ 注意事项

### 1. 配置优先级

**GlobalFilter**：
- 只有全局配置
- 无法在路由级别覆盖

**建议**：
- 保留 GatewayFilterFactory 作为备用
- 大部分路由使用 GlobalFilter
- 特殊路由使用 GatewayFilterFactory 覆盖

### 2. 白名单配置

**问题**：
- GlobalFilter 无法在路由级别配置白名单

**解决**：
- 在 application.yml 中配置全局白名单
- 使用通配符支持灵活配置

### 3. 性能考虑

**GlobalFilter**：
- 每个请求都会执行
- 需要优化白名单匹配性能

**建议**：
- 使用缓存减少重复验证
- 优化白名单匹配算法

---

## 📌 总结

**推荐方案**：改为 GlobalFilter

**原因**：
1. 符合全局过滤器的设计意图
2. 自动应用到所有路由
3. 不需要修改路由配置
4. 通过 Ordered 控制执行顺序

**下一步**：
1. 创建 4 个 GlobalFilter 实现
2. 创建全局配置类
3. 配置 application.yml
4. 测试验证

---

*创建时间：2025-12-11*
*最后更新：2025-12-11*
