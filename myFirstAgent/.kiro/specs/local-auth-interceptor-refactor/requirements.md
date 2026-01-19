# 需求文档 - LocalAuthInterceptor 重构到 Common 模块

## 简介

将 `LocalAuthInterceptor` 从 `xms-pass` 模块移动到 `common` 模块，使其可以被其他模块复用。同时需要处理相关依赖（`PassConstants`、`TokenHolder`）的重构。

## 术语表

- **LocalAuthInterceptor**: 本地调试认证拦截器，用于在本地开发时验证请求
- **PassConstants**: 常量类，定义了请求头名称等常量
- **TokenHolder**: ThreadLocal 上下文持有者，存储当前请求的用户信息
- **IsolationHolder**: 租户隔离上下文持有者（已在 common 模块）
- **ExternalIamClientAuthService**: IAM 认证服务的 Feign 客户端

## 需求

### 需求 1：移动 LocalAuthInterceptor 到 common 模块

**用户故事：** 作为开发人员，我希望将 `LocalAuthInterceptor` 移动到 `common` 模块，以便其他模块可以复用这个认证拦截器。

#### 验收标准

1. WHEN 移动 `LocalAuthInterceptor` 到 `common` 模块 THEN 系统 SHALL 将类放在 `com.t5.infrastructure.interceptor` 包下
2. WHEN 其他模块需要使用认证拦截器 THEN 系统 SHALL 能够通过依赖 `common` 模块直接使用
3. WHEN 移动完成后 THEN 系统 SHALL 删除 `xms-pass` 模块中的原文件

### 需求 2：重构常量类

**用户故事：** 作为开发人员，我希望将认证相关的常量提取到 `common` 模块，以便统一管理。

#### 验收标准

1. WHEN 提取认证常量 THEN 系统 SHALL 在 `common` 模块创建 `AuthConstants` 类
2. WHEN 定义常量 THEN 系统 SHALL 包含以下常量：
   - `HEADER_AUTHORIZATION`: "Authorization"
   - `HEADER_TOKEN`: "X-Token"
   - `HEADER_USER_ID`: "X-User-ID"
   - `HEADER_USERNAME`: "X-Username"
   - `HEADER_TENANT_ID`: "X-Tenant-ID"
   - `HEADER_FACILITY_ID`: "X-Facility-ID"
   - `HEADER_GATEWAY_REQUEST`: "X-Gateway-Request"
   - `AUTHORIZATION_PREFIX`: "Bearer "
3. WHEN 其他模块需要使用这些常量 THEN 系统 SHALL 能够通过 `AuthConstants` 访问

### 需求 3：统一 TokenHolder 实现

**用户故事：** 作为开发人员，我希望统一 `TokenHolder` 的实现，避免多个模块有不同的实现。

#### 验收标准

1. WHEN 统一 `TokenHolder` THEN 系统 SHALL 在 `common` 模块创建统一的 `TokenHolder` 类
2. WHEN 存储用户上下文 THEN 系统 SHALL 包含以下信息：
   - `UserInfoDto`: 用户信息
   - `authorization`: 完整的 Authorization 头（Bearer + token）
   - `token`: 纯 token 字符串
   - `tenantId`: 租户ID
   - `facilityId`: 设施ID（可选）
3. WHEN 请求处理完成 THEN 系统 SHALL 清理 ThreadLocal，避免内存泄漏
4. WHEN 其他模块需要获取用户上下文 THEN 系统 SHALL 提供静态方法获取

### 需求 4：更新 xms-pass 模块

**用户故事：** 作为开发人员，我希望更新 `xms-pass` 模块，使用 `common` 模块中的新实现。

#### 验收标准

1. WHEN 更新 `xms-pass` 模块 THEN 系统 SHALL 删除原有的 `LocalAuthInterceptor`
2. WHEN 更新 `xms-pass` 模块 THEN 系统 SHALL 删除原有的 `TokenHolder`
3. WHEN 更新 `xms-pass` 模块 THEN 系统 SHALL 更新 `PassConstants`，移除已迁移到 `AuthConstants` 的常量
4. WHEN 更新引用 THEN 系统 SHALL 将所有对 `PassConstants` 的引用改为 `AuthConstants`
5. WHEN 更新引用 THEN 系统 SHALL 将所有对 `xms-pass` 的 `TokenHolder` 的引用改为 `common` 的 `TokenHolder`

### 需求 5：更新 iam-app 模块

**用户故事：** 作为开发人员，我希望更新 `iam-app` 模块，使用统一的 `TokenHolder` 实现。

#### 验收标准

1. WHEN 更新 `iam-app` 模块 THEN 系统 SHALL 评估是否可以删除原有的 `TokenHolder`
2. WHEN 两个 `TokenHolder` 实现不同 THEN 系统 SHALL 保留 `iam-app` 的实现，或者合并功能
3. WHEN 更新引用 THEN 系统 SHALL 确保 `iam-app` 模块的代码正常工作

### 需求 6：配置和注册

**用户故事：** 作为开发人员，我希望在使用 `LocalAuthInterceptor` 的模块中正确配置和注册拦截器。

#### 验收标准

1. WHEN 模块需要使用认证拦截器 THEN 系统 SHALL 在配置类中注册 `LocalAuthInterceptor`
2. WHEN 注册拦截器 THEN 系统 SHALL 配置拦截路径和排除路径
3. WHEN 配置拦截器 THEN 系统 SHALL 提供配置项 `local.auth.enabled` 控制是否启用

### 需求 7：测试和验证

**用户故事：** 作为开发人员，我希望验证重构后的代码能够正常工作。

#### 验收标准

1. WHEN 重构完成 THEN 系统 SHALL 能够编译通过
2. WHEN 启动应用 THEN 系统 SHALL 能够正常启动
3. WHEN 发送请求 THEN 系统 SHALL 能够正确验证 Token
4. WHEN 请求来自网关 THEN 系统 SHALL 能够正确提取用户上下文
5. WHEN 请求完成 THEN 系统 SHALL 能够正确清理 ThreadLocal

## 约束条件

1. **向后兼容**：重构不应该破坏现有功能
2. **最小化影响**：尽量减少对其他模块的影响
3. **代码质量**：遵循项目的代码规范和 DDD 架构原则
4. **测试覆盖**：确保重构后的代码有足够的测试覆盖

## 非功能性需求

1. **性能**：重构不应该影响性能
2. **可维护性**：代码应该易于理解和维护
3. **可扩展性**：设计应该便于未来扩展

## 风险和假设

### 风险

1. **依赖冲突**：`TokenHolder` 在多个模块中有不同实现，可能存在不兼容
2. **配置遗漏**：移动后可能遗漏某些配置
3. **测试不足**：可能没有覆盖所有使用场景

### 假设

1. `LocalAuthInterceptor` 的功能在所有模块中是通用的
2. `TokenHolder` 的实现可以统一
3. 所有模块都依赖 `common` 模块

## 参考资料

- `xms-pass/src/main/java/com/t5/xms/pass/infrastructure/interceptor/LocalAuthInterceptor.java`
- `xms-pass/src/main/java/com/t5/xms/pass/infrastructure/constants/PassConstants.java`
- `xms-pass/src/main/java/com/t5/xms/pass/infrastructure/holder/TokenHolder.java`
- `iam-app/src/main/java/com/t5/iam/infrastructure/security/TokenHolder.java`
