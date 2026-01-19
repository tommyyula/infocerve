# 需求文档 - WCS-1645 网关 AuthGatewayFilter 改造

## 1. 背景

当前网关的 `AuthGatewayFilter` 使用 `authClient.validateToken()` 调用 IAM 服务校验 Token，存在以下问题：

1. **性能瓶颈**：每次请求都需要 RPC 调用 IAM 服务
2. **服务依赖**：IAM 服务不可用时，所有请求都会失败
3. **IAM 内部性能问题**：`getTokenByValue()` 方法使用模式匹配遍历所有 Token，性能很差

## 2. 需求描述

将网关的 Token 校验逻辑从 RPC 调用改为 Redis 直接读取，实现非阻塞的响应式鉴权流程。

## 3. 技术方案

### 3.1 流程改造

| 步骤 | 说明 |
|------|------|
| 用户登录 | IAM 登录成功后生成 Token，将用户信息（UserId, TenantId, 权限等）序列化后存入 Redis，Key 为 `token:{token_value}` |
| 网关校验 | 网关收到请求，从 Header 提取 `X-Token` |
| 直接读库 | 网关使用非阻塞 Redis 客户端查询该 Key |
| Token 存在 | 解析用户信息，注入 Header，放行 |
| Token 不存在 | 直接返回 401 |

### 3.2 Redis Key 设计

**新增 Key**：
- Key: `gateway:token:{tokenValue}`
- Value: JSON 格式的用户信息（GatewayTokenInfo）
- TTL: 与 Token 过期时间一致

**数据结构**：
```json
{
  "userId": "xxx",
  "username": "xxx",
  "tenantId": "xxx",
  "facilityId": "xxx",
  "facilityIds": ["xxx"],
  "defaultFacilityId": "xxx",
  "isSystemAdmin": false,
  "isTenantAdmin": false,
  "expireTime": "2025-12-18T12:00:00"
}
```

### 3.3 代码实现（响应式版本）

- 将原来的 `authClient.validateToken` 替换为 Redis 操作
- 使用 `ReactiveRedisTemplate`（Spring Data Redis 响应式版）

## 4. 验收标准

1. 网关不再调用 IAM 服务校验 Token
2. 使用 ReactiveRedisTemplate 实现非阻塞读取
3. Token 不存在时返回 401 错误码
4. Token 存在时正确解析用户信息并注入 Header
5. IAM 登录/刷新 Token/续期时同步更新 Gateway Token 缓存
6. IAM 登出时删除 Gateway Token 缓存

## 5. 影响范围

- `gateway-app` - AuthGatewayFilter
- `iam-app` - 登录/登出/刷新Token/续期逻辑

## 6. 相关文件

### Gateway
- `AuthGatewayFilter.java` - 主要改造文件
- `ValidateTokenResponseDto.java` - 可能需要调整

### IAM
- `AuthApplicationService.java` - 登录/登出/刷新Token 逻辑
- `RedisTokenStorage.java` - Token 存储逻辑
