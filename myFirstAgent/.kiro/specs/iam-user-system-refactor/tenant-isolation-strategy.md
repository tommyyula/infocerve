# 租户隔离策略详解

## 概述

本文档详细说明 IAM 用户体系重构中的租户隔离策略，包括不同用户角色的数据访问范围和隔离机制。

---

## 用户角色定义

### 1. SystemAdmin（系统管理员）
- **定义**：`is_system_admin = 1`
- **特点**：
  - 不属于任何租户（tenant_ids 可以为空）
  - 拥有全局管理权限
  - 可以跨租户访问数据
  - 可以选择租户和设施登录，也可以不选择

### 2. TenantAdmin（租户管理员）
- **定义**：拥有 `is_tenant_admin = 1` 的角色
- **特点**：
  - 属于特定租户
  - 可以管理租户内的用户和角色
  - 只能访问自己租户的数据

### 3. 普通用户
- **定义**：普通的业务用户
- **特点**：
  - 属于一个或多个租户
  - 权限由角色决定
  - 只能访问有权限的租户数据

---

## 登录验证规则

### SystemAdmin 登录

**场景 1：不选择租户和设施**
```
输入：username + password
验证：
  1. 验证用户名和密码
  2. 检查 is_system_admin = 1
  3. 不验证租户和设施
结果：
  - Token 中 tenantId 和 facilityId 为 null
  - 可以访问所有租户的数据
```

**场景 2：选择租户和设施**
```
输入：username + password + tenantCode + facilityId
验证：
  1. 验证用户名和密码
  2. 检查 is_system_admin = 1
  3. 验证租户是否存在
  4. 验证该租户下是否存在该设施 ⭐ 重要
结果：
  - Token 中包含 tenantId 和 facilityId
  - 访问业务数据时按选择的租户隔离
```

### 非 SystemAdmin 登录

**必须选择租户和设施**
```
输入：username + password + tenantCode + facilityId
验证：
  1. 验证用户名和密码
  2. 验证用户是否属于该租户（tenant_ids 包含该租户）
  3. 验证用户是否可以访问该设施（facility_ids 包含该设施）
  4. 验证该租户下是否存在该设施 ⭐ 重要
结果：
  - Token 中包含 tenantId 和 facilityId
  - 只能访问该租户的数据
```

---

## 数据访问范围

### 用户管理（IAM 模块）

#### SystemAdmin 查询用户列表
```sql
-- 返回所有租户的所有用户
SELECT * FROM global_user WHERE del_flag = 0;
```

**数据范围**：
- ✅ 所有租户的用户
- ✅ 包括其他 SystemAdmin
- ✅ 不受租户隔离限制

#### TenantAdmin 查询用户列表
```sql
-- 返回当前租户的用户
SELECT * FROM global_user 
WHERE del_flag = 0 
AND JSON_CONTAINS(tenant_ids, '"T001"');  -- 当前租户ID
```

**数据范围**：
- ✅ 当前租户的用户
- ❌ 其他租户的用户
- ❌ SystemAdmin（不属于任何租户）

#### 普通用户查询用户列表
```sql
-- 返回当前租户的用户
SELECT * FROM global_user 
WHERE del_flag = 0 
AND JSON_CONTAINS(tenant_ids, '"T001"');  -- 当前租户ID
```

**数据范围**：
- ✅ 当前租户的用户
- ❌ 其他租户的用户

---

### 角色管理（IAM 模块）

#### SystemAdmin 查询角色列表
```sql
-- 返回所有租户的角色 + 租户超管角色
SELECT * FROM iam_role WHERE del_flag = 0;
```

**数据范围**：
- ✅ 所有租户的角色
- ✅ 租户超管角色（tenant_id = null, is_tenant_admin = 1）
- ✅ 不受租户隔离限制

#### TenantAdmin 查询角色列表
```sql
-- 返回当前租户的角色 + 租户超管角色
SELECT * FROM iam_role 
WHERE del_flag = 0 
AND (tenant_id = 'T001' OR (tenant_id IS NULL AND is_tenant_admin = 1));
```

**数据范围**：
- ✅ 当前租户的角色
- ✅ 租户超管角色（可以分配给其他用户）
- ❌ 其他租户的角色

#### 普通用户查询角色列表
```sql
-- 返回当前租户的角色
SELECT * FROM iam_role 
WHERE del_flag = 0 
AND tenant_id = 'T001';
```

**数据范围**：
- ✅ 当前租户的角色
- ❌ 租户超管角色（普通用户不能分配）
- ❌ 其他租户的角色

---

### 菜单管理（IAM 模块）

#### SystemAdmin 查询菜单
```sql
-- 返回所有菜单
SELECT * FROM iam_menu WHERE del_flag = 0;
```

**数据范围**：
- ✅ 所有菜单
- ✅ 不受角色限制

#### 非 SystemAdmin 查询菜单
```sql
-- 返回用户有权限的菜单
SELECT DISTINCT m.* 
FROM iam_menu m
JOIN iam_role_menu rm ON m.menu_id = rm.menu_id
JOIN iam_user_role ur ON rm.role_id = ur.role_id
WHERE ur.user_id = ? AND m.del_flag = 0;
```

**数据范围**：
- ✅ 用户角色关联的菜单
- ❌ 未授权的菜单

---

### 业务数据（WMS、MDM 等模块）

#### SystemAdmin 访问业务数据

**场景 1：未选择租户登录**
```sql
-- 可以访问所有租户的数据
SELECT * FROM wms_order WHERE del_flag = 0;
```

**场景 2：选择租户登录**
```sql
-- 按选择的租户隔离
SELECT * FROM wms_order 
WHERE del_flag = 0 
AND tenant_id = 'T001';  -- 登录时选择的租户
```

#### 非 SystemAdmin 访问业务数据
```sql
-- 自动应用租户隔离
SELECT * FROM wms_order 
WHERE del_flag = 0 
AND tenant_id = 'T001';  -- Token 中的租户ID
```

**隔离机制**：
- ✅ 自动租户隔离拦截器
- ✅ 在 SQL 查询中自动添加 tenant_id 过滤条件
- ✅ 无需手动编写租户隔离逻辑

---

## 租户隔离拦截器策略

### 不应用自动隔离的场景

#### 1. IAM 模块的用户管理
- **原因**：不同角色看到的用户范围不同
- **实现**：在 Service 层手动实现隔离逻辑

```java
@Service
public class UserApplicationService {
    
    public List<UserDto> listUsers() {
        if (TokenHolder.isSystemAdmin()) {
            // SystemAdmin：返回所有用户
            return userRepository.findAll();
        } else {
            // 非 SystemAdmin：返回当前租户的用户
            Long tenantId = TokenHolder.getTenantId();
            return userRepository.findByTenantId(tenantId);
        }
    }
}
```

#### 2. IAM 模块的角色管理
- **原因**：不同角色看到的角色范围不同
- **实现**：在 Service 层手动实现隔离逻辑

```java
@Service
public class RoleApplicationService {
    
    public List<RoleDto> listRoles() {
        if (TokenHolder.isSystemAdmin()) {
            // SystemAdmin：返回所有角色
            return roleRepository.findAll();
        } else if (isTenantAdmin()) {
            // TenantAdmin：返回当前租户的角色 + 租户超管角色
            Long tenantId = TokenHolder.getTenantId();
            return roleRepository.findByTenantIdOrTenantAdmin(tenantId);
        } else {
            // 普通用户：返回当前租户的角色
            Long tenantId = TokenHolder.getTenantId();
            return roleRepository.findByTenantId(tenantId);
        }
    }
}
```

#### 3. IAM 模块的菜单管理
- **原因**：SystemAdmin 和普通用户看到的菜单不同
- **实现**：在 Service 层手动实现隔离逻辑

```java
@Service
public class MenuApplicationService {
    
    public List<MenuTreeDto> getMenuTree() {
        if (TokenHolder.isSystemAdmin()) {
            // SystemAdmin：返回所有菜单
            return menuRepository.findAll();
        } else {
            // 非 SystemAdmin：返回用户有权限的菜单
            Long userId = TokenHolder.getUserId();
            return menuRepository.findByUserId(userId);
        }
    }
}
```

### 应用自动隔离的场景

#### 1. 业务模块（WMS、MDM 等）
- **原因**：业务数据严格按租户隔离
- **实现**：使用自动租户隔离拦截器

```java
// 拦截器自动添加租户隔离条件
@Component
public class TenantIsolationInterceptor implements Interceptor {
    
    @Override
    public void beforeQuery(Invocation invocation) {
        // 如果是 SystemAdmin 且未选择租户，不添加隔离条件
        if (TokenHolder.isSystemAdmin() && TokenHolder.getTenantId() == null) {
            return;
        }
        
        // 其他情况，自动添加 tenant_id 过滤条件
        Long tenantId = TokenHolder.getTenantId();
        // 在 SQL 中添加 WHERE tenant_id = ?
    }
}
```

---

## 实现建议

### 1. Service 层手动隔离（IAM 模块）

**优点**：
- ✅ 灵活控制数据范围
- ✅ 不同角色可以有不同的数据范围
- ✅ 逻辑清晰，易于理解

**缺点**：
- ❌ 需要手动编写隔离逻辑
- ❌ 容易遗漏

**适用场景**：
- IAM 模块的用户管理
- IAM 模块的角色管理
- IAM 模块的菜单管理

### 2. 拦截器自动隔离（业务模块）

**优点**：
- ✅ 自动应用，无需手动编写
- ✅ 统一管理，不易遗漏
- ✅ 减少代码重复

**缺点**：
- ❌ 灵活性较低
- ❌ 需要配置排除规则

**适用场景**：
- WMS 模块的业务数据
- MDM 模块的业务数据
- 其他业务模块

---

## 配置示例

### 拦截器配置

```java
@Configuration
public class TenantIsolationConfig {
    
    /**
     * 配置需要排除的表
     * IAM 模块的表不应用自动隔离
     */
    private static final Set<String> EXCLUDED_TABLES = Set.of(
        "global_user",
        "iam_role",
        "iam_menu",
        "iam_user_role",
        "iam_role_menu"
    );
    
    /**
     * 配置需要排除的 Service
     * IAM 模块的 Service 不应用自动隔离
     */
    private static final Set<String> EXCLUDED_SERVICES = Set.of(
        "UserApplicationService",
        "RoleApplicationService",
        "MenuApplicationService",
        "AuthApplicationService"
    );
}
```

---

## 总结

### 关键点

1. **SystemAdmin 登录验证**：
   - 可以不选择租户和设施
   - 如果选择了租户和设施，也要验证租户下是否存在该设施

2. **数据访问范围**：
   - SystemAdmin：可以访问所有数据
   - TenantAdmin：只能访问当前租户的数据
   - 普通用户：只能访问当前租户的数据

3. **租户隔离策略**：
   - IAM 模块：Service 层手动隔离（不同角色看到的数据范围不同）
   - 业务模块：拦截器自动隔离（严格按租户隔离）

4. **不需要 default_facility_id**：
   - 使用 last_login_facility_id 作为建议设施即可
   - 减少字段冗余

---

*最后更新：2025-12-10*
