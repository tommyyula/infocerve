# IAM 用户体系重构 - 整体架构分析

## 1. 系统概述

### 1.1 重构目标

将现有的三层用户体系（GlobalUser、CentralUser、TenantUser）简化为统一的用户模型，实现：
- **统一用户模型**：GlobalUser 作为唯一的用户实体
- **多租户支持**：一个用户可以属于多个租户
- **统一登录流程**：username + password + tenantCode + facilityId
- **内网环境适配**：删除所有外网依赖（邮件/短信验证码）
- **清晰的权限体系**：SystemAdmin、TenantAdmin、普通用户

### 1.2 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                        IAM 系统                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ SystemAdmin  │      │ TenantAdmin  │                    │
│  │ (系统管理员)  │      │ (租户管理员)  │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌─────────────────────────────────────┐                   │
│  │         GlobalUser (全局用户)        │                   │
│  ├─────────────────────────────────────┤                   │
│  │ - userId (雪花算法)                  │                   │
│  │ - username (租户内唯一)              │                   │
│  │ - password (BCrypt)                 │                   │
│  │ - tenantIds (JSON数组)              │                   │
│  │ - facilityIds (JSON数组)            │                   │
│  │ - isSystemAdmin (布尔值)            │                   │
│  │ - lastLoginTenantId                 │                   │
│  │ - lastLoginFacilityId               │                   │
│  └─────────────────────────────────────┘                   │
│         │                                                   │
│         │ 属于                                              │
│         ▼                                                   │
│  ┌─────────────────────────────────────┐                   │
│  │         Tenant (租户)                │                   │
│  ├─────────────────────────────────────┤                   │
│  │ - tenantId                          │                   │
│  │ - tenantCode (全局唯一)             │                   │
│  │ - tenantName                        │                   │
│  │ - status                            │                   │
│  └─────────────────────────────────────┘                   │
│         │                                                   │
│         │ 拥有                                              │
│         ▼                                                   │
│  ┌─────────────────────────────────────┐                   │
│  │    Facility (设施 - MDM模块管理)    │                   │
│  ├─────────────────────────────────────┤                   │
│  │ IAM 模块只引用：                    │                   │
│  │ - facilityCode (设施编码)           │                   │
│  │ - facilityName (设施名称)           │                   │
│  │                                     │                   │
│  │ 注：设施详细信息由 MDM 模块管理     │                   │
│  └─────────────────────────────────────┘                   │
│         │                                                   │
│         │ 关联                                              │
│         ▼                                                   │
│  ┌─────────────────────────────────────┐                   │
│  │         Role (角色)                  │                   │
│  ├─────────────────────────────────────┤                   │
│  │ - roleId                            │                   │
│  │ - roleName                          │                   │
│  │ - tenantId (租户角色)               │                   │
│  │ - isTenantAdmin (租户超管标志)      │                   │
│  └─────────────────────────────────────┘                   │
│         │                                                   │
│         │ 关联                                              │
│         ▼                                                   │
│  ┌─────────────────────────────────────┐                   │
│  │         Menu (菜单)                  │                   │
│  ├─────────────────────────────────────┤                   │
│  │ - menuId                            │                   │
│  │ - menuName                          │                   │
│  │ - apiPaths (JSON数组)               │                   │
│  │ - 全局共享，不属于租户               │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 用户类型和权限体系

### 2.1 SystemAdmin (系统管理员)

**特征**：
- `isSystemAdmin = true`
- 不属于任何租户（tenantIds 为空或 null）
- 全局唯一的 username

**权限**：
- ✅ 可以管理所有租户
- ✅ 可以管理所有用户
- ✅ 可以创建/修改/删除菜单
- ✅ 可以创建租户超管角色
- ✅ 可以跨租户访问数据
- ✅ 登录时不需要选择租户和设施

**使用场景**：
```
用户：admin
登录：username=admin, password=xxx
结果：直接登录，无需选择租户和设施
```

### 2.2 TenantAdmin (租户管理员)

**特征**：
- `isSystemAdmin = false`
- 属于一个或多个租户
- 拥有 `isTenantAdmin = true` 的角色

**权限**：
- ✅ 可以管理自己租户内的用户
- ✅ 可以管理自己租户内的角色
- ❌ 不能创建/修改/删除菜单
- ❌ 不能跨租户访问数据
- ✅ 登录时需要选择租户和设施

**使用场景**：
```
用户：tenant_admin
登录：username=tenant_admin, password=xxx, tenantCode=TENANT_A, facilityId=F001
结果：登录到 TENANT_A 租户，可以管理该租户内的用户和角色
```

### 2.3 普通用户

**特征**：
- `isSystemAdmin = false`
- 属于一个或多个租户
- 拥有普通角色（`isTenantAdmin = false`）

**权限**：
- ✅ 可以访问自己有权限的菜单
- ✅ 可以访问自己有权限的 API
- ❌ 不能管理用户
- ❌ 不能管理角色
- ❌ 不能跨租户访问数据
- ✅ 登录时需要选择租户和设施

**使用场景**：
```
用户：zhangsan
登录：username=zhangsan, password=xxx, tenantCode=TENANT_A, facilityId=F001
结果：登录到 TENANT_A 租户，只能访问自己有权限的功能
```

---

## 3. 登录流程

### 3.1 两步登录流程

```
┌─────────────────────────────────────────────────────────────┐
│                      登录流程                                │
└─────────────────────────────────────────────────────────────┘

第一步：PreLogin (预登录)
┌──────────────────────────────────────────────────────────┐
│ 前端                                                      │
│  ↓                                                        │
│ POST /api/iam/auth/pre-login                             │
│ {                                                         │
│   "username": "zhangsan",                                │
│   "password": "password123"                              │
│ }                                                         │
│  ↓                                                        │
│ 后端验证用户名和密码                                       │
│  ↓                                                        │
│ 返回：                                                     │
│ {                                                         │
│   "username": "zhangsan",                                │
│   "tenantIds": ["T001", "T002"],                         │
│   "facilities": [                                         │
│     {"facilityId": "F001", "facilityName": "仓库1"},     │
│     {"facilityId": "F002", "facilityName": "仓库2"}      │
│   ],                                                      │
│   "suggestedTenant": {                                   │
│     "tenantId": "T001",                                  │
│     "tenantCode": "TENANT_A"                             │
│   },                                                      │
│   "suggestedFacility": {                                 │
│     "facilityId": "F001",                                │
│     "facilityName": "仓库1"                              │
│   }                                                       │
│ }                                                         │
└──────────────────────────────────────────────────────────┘

第二步：Login (正式登录)
┌──────────────────────────────────────────────────────────┐
│ 前端（用户选择租户和设施）                                 │
│  ↓                                                        │
│ POST /api/iam/auth/login                                 │
│ {                                                         │
│   "username": "zhangsan",                                │
│   "password": "password123",                             │
│   "tenantCode": "TENANT_A",                              │
│   "facilityId": "F001"                                   │
│ }                                                         │
│  ↓                                                        │
│ 后端验证租户和设施权限                                     │
│  ↓                                                        │
│ 生成 Token (包含 userId, tenantId, facilityId)           │
│  ↓                                                        │
│ 更新 lastLoginTenantId 和 lastLoginFacilityId            │
│  ↓                                                        │
│ 返回：                                                     │
│ {                                                         │
│   "token": "eyJhbGc...",                                 │
│   "refreshToken": "refresh_token...",                    │
│   "userInfo": {                                          │
│     "userId": "U123",                                    │
│     "username": "zhangsan",                              │
│     "tenantId": "T001",                                  │
│     "facilityId": "F001",                                │
│     "isSystemAdmin": false                               │
│   }                                                       │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
```

### 3.2 SystemAdmin 登录流程

```
SystemAdmin 登录（简化流程）
┌──────────────────────────────────────────────────────────┐
│ POST /api/iam/auth/login                                 │
│ {                                                         │
│   "username": "admin",                                   │
│   "password": "admin123"                                 │
│   // 不需要 tenantCode 和 facilityId                     │
│ }                                                         │
│  ↓                                                        │
│ 后端识别 isSystemAdmin = true                            │
│  ↓                                                        │
│ 跳过租户和设施验证                                         │
│  ↓                                                        │
│ 生成 Token (tenantId 和 facilityId 为 null)              │
│  ↓                                                        │
│ 返回 Token                                               │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 数据模型

### 4.1 GlobalUser (全局用户表)

```sql
CREATE TABLE global_user (
    -- 基本信息
    user_id BIGINT PRIMARY KEY COMMENT '用户ID（雪花算法）',
    username VARCHAR(64) NOT NULL COMMENT '用户名（租户内唯一）',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    
    -- 多租户支持
    tenant_ids JSON COMMENT '用户所属租户ID列表 ["T001", "T002"]',
    facility_ids JSON COMMENT '用户可访问设施编码列表 ["WH001", "WH002"]',
    
    -- 权限标识
    is_system_admin TINYINT(1) DEFAULT 0 COMMENT '是否系统管理员',
    
    -- 登录记忆
    last_login_tenant_id BIGINT COMMENT '上次登录租户ID',
    last_login_facility_id VARCHAR(64) COMMENT '上次登录设施编码',
    
    -- 个人信息
    email VARCHAR(128) COMMENT '邮箱（仅显示）',
    phone VARCHAR(32) COMMENT '手机号（仅显示）',
    nickname VARCHAR(64) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    
    -- 状态
    status TINYINT(1) DEFAULT 0 COMMENT '状态（0-启用，1-禁用）',
    del_flag TINYINT(1) DEFAULT 0 COMMENT '删除标志（0-未删除，1-已删除）',
    
    -- 审计
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_del_flag (del_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局用户表';
```

**唯一性约束**：
- SystemAdmin：username 全局唯一
- 普通用户：username + tenantId 组合唯一

**示例数据**：
```json
// SystemAdmin
{
  "userId": 1,
  "username": "admin",
  "isSystemAdmin": true,
  "tenantIds": null,
  "facilityIds": null
}

// 普通用户（属于多个租户）
{
  "userId": 1001,
  "username": "zhangsan",
  "isSystemAdmin": false,
  "tenantIds": ["T001", "T002"],
  "facilityIds": ["WH001", "WH002", "STORE001"],  // 设施编码
  "lastLoginTenantId": "T001",
  "lastLoginFacilityId": "WH001"  // 设施编码
}
```

### 4.2 Role (角色表)

```sql
CREATE TABLE iam_role (
    role_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(64) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(64) NOT NULL COMMENT '角色编码',
    
    -- 租户关联
    tenant_id BIGINT COMMENT '所属租户ID（租户超管角色为 NULL）',
    
    -- 租户超管标识
    is_tenant_admin TINYINT(1) DEFAULT 0 COMMENT '是否租户管理员角色',
    
    remark VARCHAR(255) COMMENT '备注',
    status TINYINT(1) DEFAULT 0 COMMENT '状态（0-启用，1-禁用）',
    
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_tenant_admin (is_tenant_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

**角色类型**：
```json
// 租户超管角色（跨租户）
{
  "roleId": 1,
  "roleName": "租户管理员",
  "roleCode": "TENANT_ADMIN",
  "tenantId": null,
  "isTenantAdmin": true
}

// 普通租户角色
{
  "roleId": 2,
  "roleName": "仓库管理员",
  "roleCode": "WAREHOUSE_ADMIN",
  "tenantId": "T001",
  "isTenantAdmin": false
}
```

### 4.3 Tenant (租户表)

```sql
CREATE TABLE iam_tenant (
    tenant_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '租户ID',
    tenant_code VARCHAR(64) NOT NULL UNIQUE COMMENT '租户编码（全局唯一）',
    tenant_name VARCHAR(128) NOT NULL COMMENT '租户名称',
    
    -- 联系信息
    contact_person VARCHAR(64) COMMENT '联系人',
    contact_phone VARCHAR(32) COMMENT '联系电话',
    contact_email VARCHAR(128) COMMENT '联系邮箱',
    
    -- 状态
    status TINYINT(1) DEFAULT 0 COMMENT '状态（0-启用，1-禁用）',
    del_flag TINYINT(1) DEFAULT 0 COMMENT '删除标志（0-未删除，1-已删除）',
    
    -- 审计
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_status (status),
    INDEX idx_del_flag (del_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户表';
```

**特点**：
- tenantCode 全局唯一，用于登录时选择租户
- 只有 SystemAdmin 可以创建/修改/删除租户
- 租户禁用后，该租户的用户无法登录

**示例数据**：
```json
{
  "tenantId": 1001,
  "tenantCode": "TENANT_A",
  "tenantName": "A公司",
  "contactPerson": "张三",
  "contactPhone": "13800138000",
  "status": 0
}
```

### 4.4 设施引用说明

**重要说明**：
- ❌ IAM 模块不创建设施表
- ✅ 设施数据由 MDM 模块管理
- ✅ IAM 模块只引用设施编码（facilityCode）和设施名称（facilityName）

**在 GlobalUser 中的存储**：
```json
{
  "userId": 1001,
  "username": "zhangsan",
  "facilityIds": ["WH001", "WH002", "STORE001"],  // 存储设施编码
  "lastLoginFacilityId": "WH001"  // 存储设施编码（不是数字ID）
}
```

**PreLogin 返回的设施信息**：
```json
{
  "facilities": [
    {
      "facilityCode": "WH001",
      "facilityName": "北京仓库"
    },
    {
      "facilityCode": "WH002",
      "facilityName": "上海仓库"
    }
  ]
}
```

**当前实现方式**（MDM 未实现）：
- 管理员为用户分配设施时，手动输入 facilityCode 和 facilityName
- 系统只验证 facilityCode 是否在用户的 facilityIds 数组中
- 不验证设施是否真实存在（因为 MDM 未实现）

**未来实现方式**（MDM 实现后）：
- 从 MDM 模块查询设施的详细信息
- 验证设施是否存在、是否启用、是否属于租户
- 提供设施的完整信息（类型、地址等）

### 4.5 Menu (菜单表)

```sql
CREATE TABLE iam_menu (
    menu_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    menu_name VARCHAR(64) NOT NULL COMMENT '菜单名称',
    parent_id BIGINT DEFAULT 0 COMMENT '父菜单ID',
    
    -- 菜单类型
    menu_type CHAR(1) COMMENT '菜单类型（M-目录，C-菜单，F-按钮）',
    
    -- 路由信息
    path VARCHAR(255) COMMENT '路由地址',
    component VARCHAR(255) COMMENT '组件路径',
    icon VARCHAR(64) COMMENT '图标',
    
    -- API 权限
    api_paths JSON COMMENT 'API路径列表（用于权限验证）',
    
    order_num INT DEFAULT 0 COMMENT '排序',
    status TINYINT(1) DEFAULT 0 COMMENT '状态（0-启用，1-禁用）',
    
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';
```

**特点**：
- 菜单全局共享，不属于任何租户（没有 tenant_id 字段）
- SystemAdmin 可以访问所有菜单
- 普通用户根据角色过滤菜单
- 菜单包含 API 路径列表，用于网关权限验证

**示例数据**：
```json
{
  "menuId": 1,
  "menuName": "用户管理",
  "menuType": "C",
  "path": "/system/user",
  "component": "system/user/index",
  "apiPaths": [
    "/api/iam/users",
    "/api/iam/users/*",
    "/api/iam/users/*/tenants"
  ]
}
```

---

## 5. 请求流程

### 5.1 完整的请求流程

```
┌─────────────────────────────────────────────────────────────┐
│                      请求流程                                │
└─────────────────────────────────────────────────────────────┘

前端
  ↓
  发送请求（携带 Token）
  Headers:
    X-Token: eyJhbGc...
    X-Tenant-ID: T001
    X-Facility-ID: F001
  ↓
网关 (wms-lite-gateway)
  ↓
  1. 验证 Token
  2. 提取用户信息（userId, username, tenantId, facilityId, isSystemAdmin）
  3. 验证 API 权限（基于菜单的 apiPaths）
  4. 注入用户信息到请求头
  ↓
  Headers（网关注入）:
    X-User-Id: 1001
    X-Username: zhangsan
    X-Tenant-ID: T001
    X-Facility-ID: F001
    X-Is-System-Admin: false
    X-Gateway-Request: true
  ↓
后端服务 (iam-app / wms-app / ...)
  ↓
  1. 从请求头读取用户信息
  2. 设置 TokenHolder（用户上下文）
  3. 设置 IsolationHolder（租户/设施隔离上下文）
  4. 执行业务逻辑
  5. 使用租户ID和设施ID进行数据过滤
  ↓
  返回结果
  ↓
网关
  ↓
前端
```

### 5.2 本地调试流程（不启动网关）

```
┌─────────────────────────────────────────────────────────────┐
│                  本地调试流程                                │
└─────────────────────────────────────────────────────────────┘

前端
  ↓
  发送请求（携带 Token）
  Headers:
    X-Token: eyJhbGc...
    X-Tenant-ID: T001
    X-Facility-ID: F001
  ↓
后端服务 (iam-app)
  ↓
  本地调试认证拦截器（xms-pass 模块）
  ↓
  1. 检查是否有 X-Gateway-Request 请求头
  2. 如果没有，执行本地认证逻辑：
     - 从 X-Token 提取 Token
     - 验证 Token
     - 提取用户信息
     - 模拟网关行为，注入用户信息到请求头
  3. 设置 TokenHolder 和 IsolationHolder
  ↓
  执行业务逻辑
  ↓
  返回结果
  ↓
前端
```

---

## 6. 权限验证

### 6.1 权限验证层级

```
┌─────────────────────────────────────────────────────────────┐
│                    权限验证层级                              │
└─────────────────────────────────────────────────────────────┘

第一层：网关层（API 权限验证）
  ↓
  - 验证用户是否有权访问该 API
  - 基于用户角色关联的菜单中的 apiPaths 字段
  - SystemAdmin 跳过验证
  ↓
第二层：后端服务层（业务权限验证）
  ↓
  - 验证用户是否有权执行该操作
  - 例如：只能修改自己租户内的数据
  - SystemAdmin 可以跨租户操作
  ↓
第三层：数据层（租户隔离）
  ↓
  - 使用 X-Tenant-ID 和 X-Facility-ID 过滤数据
  - 确保用户只能访问自己租户和设施的数据
  - SystemAdmin 可以访问所有数据
```

### 6.2 SystemAdmin 特殊处理

```java
// 伪代码示例
public void updateUser(Long userId, UpdateUserCmd cmd) {
    // 获取当前登录用户
    boolean isSystemAdmin = TokenHolder.isSystemAdmin();
    
    if (isSystemAdmin) {
        // SystemAdmin 可以修改任何用户
        userRepository.update(userId, cmd);
    } else {
        // 普通用户只能修改自己租户内的用户
        Long currentTenantId = TokenHolder.getTenantId();
        User user = userRepository.findById(userId);
        
        if (!user.belongsToTenant(currentTenantId)) {
            throw new IamException("无权修改其他租户的用户");
        }
        
        userRepository.update(userId, cmd);
    }
}
```

---

## 7. 关键设计决策

### 7.1 为什么使用 JSON 数组存储租户和设施？

**优点**：
- ✅ 简化数据模型，不需要额外的关联表
- ✅ 查询方便，一次查询获取所有关联
- ✅ 更新方便，直接更新 JSON 字段

**缺点**：
- ❌ 不能使用外键约束
- ❌ 查询性能可能不如关联表（但可以通过索引优化）

**权衡**：
- 对于用户-租户关联，一个用户通常不会属于太多租户（一般 1-5 个）
- JSON 数组的性能足够好
- 简化的数据模型更易于维护

### 7.2 为什么菜单全局共享？

**原因**：
- ✅ 简化菜单管理，避免每个租户都要维护一套菜单
- ✅ 保持菜单结构的一致性
- ✅ 通过角色控制用户可以访问哪些菜单

**实现**：
- 菜单表没有 tenant_id 字段
- SystemAdmin 可以管理所有菜单
- 普通用户根据角色过滤菜单

### 7.3 为什么需要两步登录？

**原因**：
- ✅ 用户体验更好：先验证用户名密码，再选择租户和设施
- ✅ 支持多租户：用户可以选择登录到哪个租户
- ✅ 记忆功能：自动填充上次登录的租户和设施

**流程**：
1. PreLogin：验证用户名密码，返回租户和设施列表
2. Login：用户选择租户和设施，生成 Token

### 7.4 租户和设施的关系

**层级关系**：
```
Tenant (租户 - IAM 模块管理)
  └── Facility (设施 - MDM 模块管理)
      └── User (用户 - IAM 模块管理)
```

**特点**：
- 一个租户可以有多个设施
- 一个设施只能属于一个租户（由 MDM 模块管理）
- 一个用户可以访问多个租户的多个设施
- 用户登录时必须选择租户和设施（SystemAdmin 除外）

**IAM 模块的职责**：
- ✅ 管理租户信息
- ✅ 引用设施编码和名称（facilityCode, facilityName）
- ✅ 验证用户是否可以访问设施（检查 facilityIds 数组）
- ❌ 不管理设施的详细信息（由 MDM 模块负责）

**当前实现**（MDM 未实现）：
- 管理员手动输入 facilityCode 和 facilityName
- 系统只验证 facilityCode 是否在用户的 facilityIds 数组中
- 不验证设施是否真实存在

**未来实现**（MDM 实现后）：
- 从 MDM 模块查询设施信息
- 验证设施是否存在、是否启用、是否属于租户

### 7.5 谁可以管理租户？

**租户管理**：
- ✅ SystemAdmin：可以创建/修改/删除所有租户
- ❌ TenantAdmin：不能管理租户
- ❌ 普通用户：不能管理租户

**设施管理**：
- ⚠️ 设施由 MDM 模块管理，不在 IAM 模块范围内
- IAM 模块只负责引用设施编码和名称

---

## 8. 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      部署架构                                │
└─────────────────────────────────────────────────────────────┘

前端 (Vue.js)
  ↓
  HTTP/HTTPS
  ↓
网关 (wms-lite-gateway)
  ├─ Token 验证
  ├─ API 权限验证
  ├─ 用户信息注入
  └─ 路由转发
  ↓
后端服务
  ├─ iam-app (IAM 服务)
  │   ├─ 用户管理
  │   ├─ 认证服务
  │   ├─ 角色管理
  │   └─ 菜单管理
  │
  ├─ wms-app (WMS 服务)
  │   ├─ 仓库管理
  │   ├─ 库存管理
  │   └─ ...
  │
  └─ 其他服务...
  ↓
数据库 (MySQL)
  ├─ global_user
  ├─ iam_role
  ├─ iam_menu
  └─ ...
```

---

## 9. 总结

### 9.1 核心特点

1. **统一用户模型**：GlobalUser 作为唯一的用户实体
2. **多租户支持**：一个用户可以属于多个租户
3. **清晰的权限体系**：SystemAdmin、TenantAdmin、普通用户
4. **两步登录流程**：PreLogin + Login
5. **菜单全局共享**：简化菜单管理
6. **网关集成**：统一的认证和权限验证
7. **本地调试支持**：不启动网关也能调试

### 9.2 关键数据结构

- **GlobalUser**：用户实体，包含 tenantIds 和 facilityIds
- **Tenant**：租户实体，包含 tenantCode（全局唯一）
- **Facility**：设施实体，属于租户，facilityCode 在租户内唯一
- **Role**：角色实体，包含 isTenantAdmin 标识
- **Menu**：菜单实体，包含 apiPaths 用于权限验证

### 9.3 关键流程

- **登录流程**：PreLogin → 选择租户和设施 → Login → 生成 Token
- **请求流程**：前端 → 网关（验证 + 注入） → 后端（业务处理） → 返回
- **权限验证**：网关层（API 权限） → 服务层（业务权限） → 数据层（租户隔离）

### 9.4 设计原则

- **简化优先**：能用 JSON 数组就不用关联表
- **安全第一**：多层权限验证，确保数据安全
- **用户体验**：记忆上次登录信息，自动填充
- **可维护性**：清晰的架构，易于理解和维护
