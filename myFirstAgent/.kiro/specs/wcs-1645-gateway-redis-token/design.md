# 设计文档 - WCS-1645 网关 AuthGatewayFilter 改造

## 1. 整体架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Gateway   │────▶│  Backend    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          │ ReactiveRedisTemplate
                          ▼
                   ┌─────────────┐
                   │    Redis    │
                   │             │
                   │ gateway:    │
                   │ token:xxx   │
                   └─────────────┘
                          ▲
                          │ Redisson
                          │
                   ┌─────────────┐
                   │    IAM      │
                   │  (登录时写入) │
                   └─────────────┘
```

## 2. 数据结构设计

### 2.1 GatewayTokenInfo（新增）

位置：`iam-app/src/main/java/com/t5/iam/infrastructure/token/GatewayTokenInfo.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayTokenInfo {
    private String userId;
    private String username;
    private String tenantId;
    private String facilityId;
    private List<String> facilityIds;
    private String defaultFacilityId;
    private Boolean isSystemAdmin;
    private Boolean isTenantAdmin;
    private LocalDateTime expireTime;
}
```

### 2.2 Redis Key 设计

| Key 格式 | 说明 | TTL |
|---------|------|-----|
| `gateway:token:{tokenValue}` | 网关直接读取的用户信息 | 与 Token 过期时间一致 |
| `iam:token:{tokenId}` | IAM 内部使用的完整 TokenInfo（保留） | 与 Token 过期时间一致 |

## 3. 模块设计

### 3.1 IAM 模块改造

#### 3.1.1 GatewayTokenStorage（新增）

位置：`iam-app/src/main/java/com/t5/iam/infrastructure/token/GatewayTokenStorage.java`

职责：管理 Gateway 使用的 Token 缓存

```java
public interface GatewayTokenStorage {
    void saveGatewayToken(String tokenValue, GatewayTokenInfo info, long expireSeconds);
    void removeGatewayToken(String tokenValue);
}
```

#### 3.1.2 AuthApplicationService 改造

在以下方法中添加 Gateway Token 缓存操作：

1. **登录成功后**：`generateLoginResponse()` - 保存 Gateway Token
2. **刷新 Token 后**：`refreshToken()` - 更新 Gateway Token
3. **Token 续期后**：`validateToken()` - 更新 Gateway Token 过期时间
4. **登出时**：`logout()` - 删除 Gateway Token

### 3.2 Gateway 模块改造

#### 3.2.1 ReactiveRedisConfig（新增）

位置：`gateway-app/src/main/java/com/t5/base/gateway/biz/common/config/ReactiveRedisConfig.java`

配置 ReactiveRedisTemplate Bean

#### 3.2.2 GatewayTokenService（新增）

位置：`gateway-app/src/main/java/com/t5/base/gateway/biz/common/service/GatewayTokenService.java`

职责：从 Redis 读取 Token 信息

```java
@Service
public class GatewayTokenService {
    private final ReactiveRedisTemplate<String, String> redisTemplate;
    
    public Mono<GatewayTokenInfo> getTokenInfo(String tokenValue) {
        String key = "gateway:token:" + tokenValue;
        return redisTemplate.opsForValue().get(key)
            .map(json -> parseJson(json));
    }
}
```

#### 3.2.3 AuthGatewayFilter 改造

移除 `authClient.validateToken()` 调用，改为使用 `GatewayTokenService`

## 4. 时序图

### 4.1 登录流程

```
Client          Gateway         IAM             Redis
  │                │              │                │
  │  POST /login   │              │                │
  │───────────────▶│              │                │
  │                │  POST /login │                │
  │                │─────────────▶│                │
  │                │              │  save TokenInfo│
  │                │              │───────────────▶│
  │                │              │  save GatewayToken
  │                │              │───────────────▶│
  │                │   LoginDto   │                │
  │                │◀─────────────│                │
  │   LoginDto     │              │                │
  │◀───────────────│              │                │
```

### 4.2 请求鉴权流程（改造后）

```
Client          Gateway                    Redis
  │                │                          │
  │  GET /api/xxx  │                          │
  │───────────────▶│                          │
  │                │  GET gateway:token:xxx   │
  │                │─────────────────────────▶│
  │                │     GatewayTokenInfo     │
  │                │◀─────────────────────────│
  │                │                          │
  │                │  (注入 Header)            │
  │                │                          │
  │   Response     │                          │
  │◀───────────────│                          │
```

## 5. 配置设计

### 5.1 Gateway Redis 配置

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 0
```

## 6. 错误处理

| 场景 | 处理方式 |
|------|---------|
| Token 为空 | 返回 401，错误码 AUTH_TOKEN_MISSING |
| Token 不存在 | 返回 401，错误码 AUTH_TOKEN_INVALID |
| Token 已过期 | 返回 401，错误码 AUTH_TOKEN_INVALID |
| Redis 连接失败 | 返回 503，错误码 AUTH_SERVICE_UNAVAILABLE |

## 7. 兼容性考虑

1. **渐进式迁移**：可以保留 `authClient.validateToken()` 作为降级方案
2. **配置开关**：通过配置控制使用 Redis 直接读取还是 RPC 调用
3. **双写保证**：IAM 同时维护两套 Token 存储，确保兼容性
