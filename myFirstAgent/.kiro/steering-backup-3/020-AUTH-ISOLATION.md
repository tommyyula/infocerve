---
inclusion: always
---

# 认证与隔离机制

## 认证流程

### 1. Gateway 认证

客户端请求 -> Gateway:
- 请求头：X-Token（直接传递 token，无需 Bearer 前缀）
- Gateway 验证 Token 有效性
- 验证成功后注入用户信息到请求头

Gateway 注入的请求头：
- X-Gateway-Request: true（标识来自网关）
- X-User-Id: 用户 ID
- X-Username: 用户名
- X-Tenant-ID: 租户 ID
- X-Facility-ID: 设施 ID（可选）
- X-Is-System-Admin: 是否系统管理员
- X-Is-Tenant-Admin: 是否租户管理员

### 2. LocalAuthInterceptor 处理

来自网关的请求：
- 检查 X-Gateway-Request 请求头
- 直接提取网关注入的用户信息
- 设置到 TokenHolder（ThreadLocal）

本地调试请求（开发环境）：
- 检查 X-Token 请求头
- 调用 iam-app 验证 Token
- 设置到 TokenHolder（ThreadLocal）

生产环境：
- 配置 local.auth.enabled=false
- 强制所有请求必须来自网关
- 拒绝非网关请求

### 3. TokenHolder 使用

业务代码获取当前用户信息：
- TokenHolder.getCurrentUserId()
- TokenHolder.getCurrentUsername()
- TokenHolder.getCurrentTenantId()
- TokenHolder.getCurrentFacilityId()
- TokenHolder.isSystemAdmin()
- TokenHolder.isTenantAdmin()

[重要] 请求完成后自动清理 ThreadLocal（LocalAuthInterceptor.afterCompletion）

---

## 租户隔离机制

### 1. IsolationHolder

存储租户隔离信息（ThreadLocal）：
- tenantId: 租户 ID
- facilityId: 设施 ID
- applicationCode: 应用代码

设置方式：
- IsolationHolder.setTenantId(tenantId)
- IsolationHolder.setFacilityId(facilityId)
- IsolationHolder.setApplicationCode(applicationCode)

获取方式：
- IsolationHolder.getTenantId()
- IsolationHolder.getFacilityId()
- IsolationHolder.getApplicationCode()

### 2. MyBatis 拦截器自动注入

所有查询自动添加租户条件：
- WHERE tenant_id = #{tenantId}
- 通过 MyBatis 拦截器实现
- 防止跨租户数据访问

### 3. 实体基类

BaseTenantEntity / BaseCompanyEntity:
- 包含 tenantId 字段
- 包含 isolationId 字段（设施 ID）
- 自动填充审计字段（createdBy, updatedBy）

---

## 异步线程上下文传递

### ContextTaskDecorator

异步任务自动传递上下文：
- TokenHolder（用户认证信息）
- IsolationHolder（租户隔离信息）
- RequestContext（请求上下文）
- TimeZoneContext（时区信息）

配置方式：
```java
@Configuration
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new ContextTaskDecorator());
        return executor;
    }
}
```

---

## Feign 调用传递上下文

### AbstractFeignAuthInterceptor

Feign 调用自动传递请求头：
- X-Tenant-ID: IsolationHolder.getTenantId()
- X-Facility-ID: IsolationHolder.getFacilityId()
- X-User-Name: TokenHolder.getCurrentUsername()
- X-Time-Zone: TimeZoneContext.getTimeZone()

---

## 常量定义

AuthConstants（com.t5.infrastructure.constants.AuthConstants）:
- HEADER_TOKEN = "X-Token"
- HEADER_USER_ID = "X-User-Id"
- HEADER_USERNAME = "X-Username"
- HEADER_TENANT_ID = "X-Tenant-ID"
- HEADER_FACILITY_ID = "X-Facility-ID"
- HEADER_IS_SYSTEM_ADMIN = "X-Is-System-Admin"
- HEADER_IS_TENANT_ADMIN = "X-Is-Tenant-Admin"
- HEADER_GATEWAY_REQUEST = "X-Gateway-Request"

---

## 使用示例

### 获取当前用户信息

```java
String userId = TokenHolder.getCurrentUserId();
String username = TokenHolder.getCurrentUsername();
String tenantId = TokenHolder.getCurrentTenantId();
boolean isAdmin = TokenHolder.isSystemAdmin();
```

### 获取租户隔离信息

```java
String tenantId = IsolationHolder.getTenantId();
String facilityId = IsolationHolder.getFacilityId();
```

### 实体审计字段自动填充

```java
// 创建实体时自动填充
entity.setCreatedBy(TokenHolder.getCurrentUsername());
entity.setCreatedTime(LocalDateTime.now());

// 更新实体时自动填充
entity.setUpdatedBy(TokenHolder.getCurrentUsername());
entity.setUpdatedTime(LocalDateTime.now());
```

---

## 注意事项

1. TokenHolder 和 IsolationHolder 使用 ThreadLocal，必须在请求完成后清理
2. LocalAuthInterceptor 自动清理 TokenHolder 和 RequestContext
3. TenantInterceptor 负责清理 IsolationHolder（职责分离）
4. 异步任务使用 ContextTaskDecorator 传递上下文
5. Feign 调用使用 AbstractFeignAuthInterceptor 传递上下文
6. 生产环境必须禁用本地认证（local.auth.enabled=false）

---

文档版本: 1.0
最后更新: 2026-01-07
