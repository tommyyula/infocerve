# 设计文档 - IAM 用户体系重构

## 概述

本设计文档描述了 IAM 用户体系重构项目的技术设计方案。该项目旨在简化现有的三层用户体系，统一登录流程，支持跨租户场景，并适配内网环境。

### 设计目标

1. **简化架构**：合并 GlobalUser 和 CentralUser 为统一的用户模型
2. **统一登录**：实现基于 username + password + tenantCode + facilityId 的登录流程
3. **多租户支持**：一个用户可以属于多个租户，通过 tenantIds 数组管理
4. **内网适配**：删除所有依赖外网的功能（邮件/短信验证码）
5. **优化体验**：记录上次登录的租户和设施，自动填充

### 技术栈

- **后端框架**：Spring Boot 2.x
- **数据库**：MySQL 8.0
- **ORM 框架**：MyBatis-Plus
- **认证方式**：JWT Token
- **前端框架**：Vue 3 + TypeScript
- **UI 组件库**：Element Plus

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 登录页面 │  │ 用户管理 │  │ 角色管理 │  │ 菜单管理 │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        网关层                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AuthGatewayFilter (Token验证)                       │   │
│  │  TenantGatewayFilter (租户验证)                      │   │
│  │  FacilityGatewayFilter (设施验证)                    │   │
│  │  PermissionGatewayFilter (API权限验证)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      IAM 应用服务层                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AuthApplicationService (认证服务)                   │   │
│  │  UserApplicationService (用户管理服务)               │   │
│  │  RoleApplicationService (角色管理服务)               │   │
│  │  MenuApplicationService (菜单管理服务)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        领域层                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GlobalUser (用户实体)                               │   │
│  │  Tenant (租户实体)                                   │   │
│  │  Role (角色实体)                                     │   │
│  │  Menu (菜单实体)                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GlobalUserMapper (用户数据访问)                     │   │
│  │  TenantMapper (租户数据访问)                         │   │
│  │  RoleMapper (角色数据访问)                           │   │
│  │  MenuMapper (菜单数据访问)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        数据库层                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  global_user (用户表)                                │   │
│  │  iam_tenant (租户表)                                 │   │
│  │  iam_role (角色表)                                   │   │
│  │  iam_menu (菜单表)                                   │   │
│  │  iam_tenant_user (租户用户关联表)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 模块划分

#### 1. 认证模块（Auth Module）
- **职责**：处理用户登录、Token 生成和验证
- **核心类**：
  - `AuthApplicationService`：认证应用服务
  - `AuthController`：认证控制器
  - `JwtTokenProvider`：JWT Token 提供者

#### 2. 用户管理模块（User Module）
- **职责**：管理用户信息、用户租户关联
- **核心类**：
  - `UserApplicationService`：用户应用服务
  - `UserController`：用户控制器
  - `GlobalUser`：用户实体

#### 3. 租户管理模块（Tenant Module）
- **职责**：管理租户信息
- **核心类**：
  - `TenantApplicationService`：租户应用服务
  - `TenantController`：租户控制器
  - `Tenant`：租户实体

#### 4. 角色管理模块（Role Module）
- **职责**：管理角色和权限
- **核心类**：
  - `RoleApplicationService`：角色应用服务
  - `RoleController`：角色控制器
  - `Role`：角色实体

#### 5. 菜单管理模块（Menu Module）
- **职责**：管理菜单和权限
- **核心类**：
  - `MenuApplicationService`：菜单应用服务
  - `MenuController`：菜单控制器
  - `Menu`：菜单实体

## 组件和接口

### 核心组件

#### 1. AuthApplicationService（认证服务）

```java
@Service
@RequiredArgsConstructor
public class AuthApplicationService {
    private final GlobalUserRepository globalUserRepository;
    private final TenantRepository tenantRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 预登录 - 验证用户名密码，返回租户和设施信息
     */
    public PreLoginDto preLogin(PreLoginCmd cmd);
    
    /**
     * 登录 - 验证租户和设施，生成 Token
     */
    public LoginDto login(LoginCmd cmd);
    
    /**
     * 登出
     */
    public void logout(String userId);
    
    /**
     * 刷新 Token
     */
    public RefreshTokenDto refreshToken(String refreshToken);
    
    /**
     * 获取当前用户信息
     */
    public UserInfoDto getCurrentUserInfo(String userId);
}
```

#### 2. UserApplicationService（用户管理服务）

```java
@Service
@RequiredArgsConstructor
public class UserApplicationService {
    private final GlobalUserRepository globalUserRepository;
    private final TenantUserRepository tenantUserRepository;
    private final TenantRepository tenantRepository;
    
    /**
     * 创建用户
     */
    public String createUser(CreateUserCmd cmd);
    
    /**
     * 更新用户
     */
    public void updateUser(UpdateUserCmd cmd);
    
    /**
     * 删除用户
     */
    public void deleteUser(String userId);
    
    /**
     * 用户加入租户（带冲突检测）
     */
    public void addUserToTenant(String userId, String tenantId);
    
    /**
     * 用户离开租户
     */
    public void removeUserFromTenant(String userId, String tenantId);
    
    /**
     * 检查用户名在租户中是否唯一
     */
    public boolean isUsernameUniqueInTenant(String username, String tenantId, String excludeUserId);
    
    /**
     * 分页查询用户
     */
    public Page<UserDto> searchUsers(UserQuery query, Pageable pageable);
}
```

#### 3. TenantApplicationService（租户管理服务）

```java
@Service
@RequiredArgsConstructor
public class TenantApplicationService {
    private final TenantRepository tenantRepository;
    private final GlobalUserRepository globalUserRepository;
    private final TenantUserRepository tenantUserRepository;
    
    /**
     * 创建租户
     */
    public String createTenant(CreateTenantCmd cmd);
    
    /**
     * 更新租户
     */
    public void updateTenant(UpdateTenantCmd cmd);
    
    /**
     * 删除租户
     */
    public void deleteTenant(String tenantId);
    
    /**
     * 查询租户详情
     */
    public TenantDto getTenantById(String tenantId);
    
    /**
     * 分页查询租户
     */
    public Page<TenantDto> searchTenants(TenantQuery query, Pageable pageable);
    
    /**
     * 查询租户下的用户列表
     */
    public Page<UserDto> getTenantUsers(String tenantId, Pageable pageable);
    
    /**
     * 更新租户状态
     */
    public void updateTenantStatus(String tenantId, String status);
    
    /**
     * 更新租户 Profile
     */
    public void updateTenantProfile(UpdateTenantProfileCmd cmd);
}
```

### 接口设计

#### 1. 认证接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 预登录 | POST | /api/iam/auth/pre-login | 验证用户名密码，返回租户和设施信息 |
| 登录 | POST | /api/iam/auth/login | 用户登录 |
| 登出 | POST | /api/iam/auth/logout | 用户登出 |
| 刷新Token | POST | /api/iam/auth/refresh | 刷新Token |
| 获取用户信息 | GET | /api/iam/auth/userinfo | 获取当前用户信息 |

#### 2. 用户管理接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 查询用户列表 | POST | /api/iam/users/search-by-paging | 分页查询用户列表 |
| 创建用户 | POST | /api/iam/users | 创建新用户 |
| 更新用户 | PUT | /api/iam/users/{userId} | 更新用户信息 |
| 删除用户 | DELETE | /api/iam/users/{userId} | 删除用户 |
| 用户加入租户 | POST | /api/iam/users/{userId}/tenants | 将用户添加到租户 |
| 用户离开租户 | DELETE | /api/iam/users/{userId}/tenants/{tenantId} | 将用户从租户移除 |

#### 3. 租户管理接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 查询租户列表 | POST | /api/iam/tenants/search-by-paging | 分页查询租户列表（仅 systemAdmin） |
| 创建租户 | POST | /api/iam/tenants | 创建新租户（仅 systemAdmin） |
| 更新租户 | PUT | /api/iam/tenants/{tenantId} | 更新租户信息（仅 systemAdmin） |
| 删除租户 | DELETE | /api/iam/tenants/{tenantId} | 删除租户（仅 systemAdmin） |
| 查询租户详情 | GET | /api/iam/tenants/{tenantId} | 查询租户详情 |
| 查询租户用户 | POST | /api/iam/tenants/{tenantId}/users | 查询租户下的用户列表 |
| 更新租户状态 | PUT | /api/iam/tenants/{tenantId}/status | 更新租户状态（启用/禁用） |
| 更新租户Profile | PUT | /api/iam/tenants/{tenantId}/profile | 更新租户详细信息 |

## 数据模型

### 核心实体

#### 1. GlobalUser（全局用户）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("global_user")
public class GlobalUser extends BaseEntity {
    @TableId(type = IdType.ASSIGN_ID)
    private String userId;                  // 用户ID（全局唯一）
    
    private String username;                // 用户名（用于登录）
    private String password;                // 密码（BCrypt加密）
    private String tenantIds;               // 租户ID列表（JSON数组）
    private String facilityIds;             // 设施ID列表（JSON数组）
    private String lastLoginTenantId;       // 上次登录的租户ID
    private String lastLoginFacilityId;     // 上次登录的设施ID
    private String defaultFacilityId;       // 默认设施ID
    private Boolean isSystemAdmin;          // 是否为系统管理员
    
    private String email;                   // 邮箱（仅展示）
    private String phone;                   // 手机号（仅展示）
    private String nickname;                // 昵称
    private String avatar;                  // 头像
    private String status;                  // 状态：0-正常，1-禁用
    private String delFlag;                 // 删除标志：0-正常，1-删除
    
    private String customerIds;             // 客户ID列表（JSON数组）
    
    // 业务方法
    public List<String> getTenantIdList() {
        return JSON.parseArray(this.tenantIds, String.class);
    }
    
    public void setTenantIdList(List<String> tenantIds) {
        this.tenantIds = JSON.toJSONString(tenantIds);
    }
    
    public List<String> getFacilityIdList() {
        return JSON.parseArray(this.facilityIds, String.class);
    }
    
    public void setFacilityIdList(List<String> facilityIds) {
        this.facilityIds = JSON.toJSONString(facilityIds);
    }
    
    public boolean belongsToTenant(String tenantId) {
        if (Boolean.TRUE.equals(this.isSystemAdmin)) {
            return true;
        }
        List<String> tenantIds = getTenantIdList();
        return tenantIds != null && tenantIds.contains(tenantId);
    }
    
    public boolean belongsToFacility(String facilityId) {
        if (Boolean.TRUE.equals(this.isSystemAdmin)) {
            return true;
        }
        List<String> facilityIds = getFacilityIdList();
        return facilityIds != null && facilityIds.contains(facilityId);
    }
}
```

#### 2. Tenant（租户）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_tenant")
public class Tenant extends BaseEntity {
    @TableId(type = IdType.ASSIGN_ID)
    private String tenantId;                // 租户ID
    private String isolationId;             // 隔离ID
    
    private String tenantName;              // 租户名称
    private String tenantCode;              // 租户编码（唯一）
    private String contactName;             // 联系人
    private String contactPhone;            // 联系电话
    private String contactEmail;            // 联系邮箱
    private String status;                  // 状态：0-正常，1-禁用
    private String expireTime;              // 过期时间
    private String remark;                  // 备注
    private String facilities;              // 设施列表（JSON格式）
}
```

#### 3. Role（角色）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_role")
public class Role extends BaseEntity {
    @TableId(type = IdType.AUTO)
    private Long roleId;                    // 角色ID
    private String tenantId;                // 租户ID
    private String isolationId;             // 隔离ID
    
    private String roleName;                // 角色名称
    private String roleKey;                 // 角色权限字符串
    private Integer roleSort;               // 显示顺序
    private String dataScope;               // 数据范围
    private Boolean isTenantAdmin;          // 是否为租户超管角色
    private String status;                  // 状态：0-正常，1-禁用
    private String remark;                  // 备注
    private String delFlag;                 // 删除标志
}
```

#### 4. Menu（菜单）

```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_menu")
public class Menu extends BaseEntity {
    @TableId(type = IdType.AUTO)
    private Long menuId;                    // 菜单ID
    
    private String menuName;                // 菜单名称
    private String systemCode;              // 系统标识
    private Long parentId;                  // 父菜单ID
    private Integer orderNum;               // 显示顺序
    private String path;                    // 路由地址
    private String component;               // 组件路径
    private String query;                   // 路由参数
    private Integer isFrame;                // 是否为外链
    private Integer isCache;                // 是否缓存
    private String menuType;                // 菜单类型：M-目录，C-菜单，F-按钮
    private String visible;                 // 显示状态
    private String status;                  // 状态
    private String perms;                   // 权限标识
    private String apiPaths;                // API路径列表（JSON数组）
    private String icon;                    // 菜单图标
    private String remark;                  // 备注
    
    private List<Menu> children;            // 子菜单
}
```

### 数据库表结构

#### 1. global_user 表

```sql
CREATE TABLE global_user (
    userId VARCHAR(64) PRIMARY KEY COMMENT '用户ID（全局唯一）',
    username VARCHAR(64) NOT NULL COMMENT '用户名（用于登录）',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    tenantIds JSON COMMENT '租户ID列表',
    facilityIds JSON COMMENT '设施ID列表',
    lastLoginTenantId VARCHAR(64) COMMENT '上次登录的租户ID',
    lastLoginFacilityId VARCHAR(64) COMMENT '上次登录的设施ID',
    defaultFacilityId VARCHAR(64) COMMENT '默认设施ID',
    isSystemAdmin BOOLEAN DEFAULT FALSE COMMENT '是否为系统管理员',
    email VARCHAR(128) COMMENT '邮箱（仅展示）',
    phone VARCHAR(32) COMMENT '手机号（仅展示）',
    nickname VARCHAR(64) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像',
    status CHAR(1) DEFAULT '0' COMMENT '状态：0-正常，1-禁用',
    delFlag CHAR(1) DEFAULT '0' COMMENT '删除标志',
    customerIds JSON COMMENT '客户ID列表',
    
    -- 审计字段
    createdTime TIMESTAMP NOT NULL COMMENT '创建时间',
    createdBy VARCHAR(64) COMMENT '创建人',
    updatedTime TIMESTAMP NOT NULL COMMENT '更新时间',
    updatedBy VARCHAR(64) COMMENT '更新人',
    
    INDEX idx_username (username),
    INDEX idx_status (status)
) COMMENT='全局用户表（统一用户体系）';
```

#### 2. iam_menu 表（删除 tenantId 字段）

```sql
CREATE TABLE iam_menu (
    menuId BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '菜单ID',
    menuName VARCHAR(64) NOT NULL COMMENT '菜单名称',
    systemCode VARCHAR(32) NOT NULL COMMENT '系统标识',
    parentId BIGINT DEFAULT 0 COMMENT '父菜单ID',
    orderNum INT DEFAULT 0 COMMENT '显示顺序',
    path VARCHAR(200) COMMENT '路由地址',
    component VARCHAR(255) COMMENT '组件路径',
    query VARCHAR(255) COMMENT '路由参数',
    isFrame INT DEFAULT 1 COMMENT '是否为外链',
    isCache INT DEFAULT 0 COMMENT '是否缓存',
    menuType CHAR(1) COMMENT '菜单类型：M-目录，C-菜单，F-按钮',
    visible CHAR(1) DEFAULT '0' COMMENT '显示状态',
    status CHAR(1) DEFAULT '0' COMMENT '状态',
    perms VARCHAR(100) COMMENT '权限标识',
    apiPaths JSON COMMENT 'API路径列表',
    icon VARCHAR(100) COMMENT '菜单图标',
    remark VARCHAR(500) COMMENT '备注',
    
    -- 审计字段
    createdTime TIMESTAMP NOT NULL COMMENT '创建时间',
    createdBy VARCHAR(64) COMMENT '创建人',
    updatedTime TIMESTAMP NOT NULL COMMENT '更新时间',
    updatedBy VARCHAR(64) COMMENT '更新人',
    
    INDEX idx_systemCode (systemCode),
    INDEX idx_parentId (parentId),
    INDEX idx_status (status)
) COMMENT='菜单权限表（全局共享）';
```

#### 3. iam_role 表（添加 isTenantAdmin 字段）

```sql
CREATE TABLE iam_role (
    roleId BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    tenantId VARCHAR(64) COMMENT '租户ID（租户超管角色为空）',
    isolationId VARCHAR(64),
    roleName VARCHAR(64) NOT NULL COMMENT '角色名称',
    roleKey VARCHAR(64) NOT NULL COMMENT '角色权限字符串',
    roleSort INT DEFAULT 0 COMMENT '显示顺序',
    dataScope CHAR(1) DEFAULT '1' COMMENT '数据范围',
    isTenantAdmin BOOLEAN DEFAULT FALSE COMMENT '是否为租户超管角色',
    status CHAR(1) DEFAULT '0' COMMENT '状态',
    remark VARCHAR(500) COMMENT '备注',
    delFlag CHAR(1) DEFAULT '0' COMMENT '删除标志',
    
    -- 审计字段
    createdTime TIMESTAMP NOT NULL COMMENT '创建时间',
    createdBy VARCHAR(64) COMMENT '创建人',
    updatedTime TIMESTAMP NOT NULL COMMENT '更新时间',
    updatedBy VARCHAR(64) COMMENT '更新人',
    
    INDEX idx_tenantId (tenantId),
    INDEX idx_status (status)
) COMMENT='角色表';
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性 1: 用户ID全局唯一性
*对于任何*用户创建操作，系统分配的 userId 应该在所有用户中全局唯一
**验证需求：1.1**

### 属性 2: 用户数据持久化完整性（往返属性）
*对于任何*用户数据，创建并保存后再查询，应该返回包含所有字段的相同用户数据
**验证需求：1.2**

### 属性 3: 系统管理员用户名全局唯一性
*对于任何*两个系统管理员用户，它们的 username 应该不同
**验证需求：1.3**

### 属性 4: 租户内用户名唯一性
*对于任何*租户，该租户内的所有用户的 username 应该唯一
**验证需求：1.4**

### 属性 5: 预登录返回租户和设施列表
*对于任何*有效的用户凭据，预登录应该返回用户的 tenantIds 和 facilityIds 列表
**验证需求：2.1**

### 属性 6: 登录租户和设施验证
*对于任何*登录请求，如果 tenantCode 或 facilityId 不在用户的权限范围内，登录应该失败
**验证需求：2.7**

### 属性 7: Token包含用户上下文
*对于任何*成功的登录，生成的 Token 应该包含 userId、tenantId 和 facilityId
**验证需求：2.8**

### 属性 8: 登录更新最后登录信息
*对于任何*成功的登录，用户的 lastLoginTenantId 和 lastLoginFacilityId 应该被更新为当前登录的租户和设施
**验证需求：2.9**

### 属性 9: 用户加入租户更新tenantIds
*对于任何*用户和租户，当用户加入租户时，用户的 tenantIds 数组应该包含该租户ID
**验证需求：3.2**

### 属性 10: 用户加入租户冲突检测
*对于任何*租户，如果租户中已存在相同 username 的用户，添加新用户应该失败
**验证需求：3.3, 3.4**

### 属性 11: 用户离开租户更新tenantIds
*对于任何*用户和租户，当用户离开租户时，用户的 tenantIds 数组应该不再包含该租户ID
**验证需求：3.5**


### 属性 12: 内网认证仅使用用户名密码
*对于任何*认证请求，系统应该仅验证 username 和 password，不需要 email 或 phone 验证
**验证需求：5.1**

### 属性 13: Email和Phone无验证存储
*对于任何*用户，系统应该接受任意格式的 email 和 phone 值（包括无效值）
**验证需求：5.2**

### 属性 14: 系统管理员查询所有菜单
*对于任何*系统管理员用户，查询菜单应该返回所有菜单，不进行角色过滤
**验证需求：6.1**

### 属性 15: 普通用户菜单基于角色过滤
*对于任何*非系统管理员用户，查询菜单应该只返回用户角色有权限的菜单
**验证需求：6.2**

### 属性 16: 租户超管角色字段正确性
*对于任何*租户超管角色，isTenantAdmin 应该为 true 且 tenantId 应该为 null
**验证需求：7.1**

### 属性 17: 个人资料可更新字段
*对于任何*用户，更新个人资料应该允许修改 nickname、email、phone 和 avatar
**验证需求：8.2**

### 属性 18: 个人资料不可更新字段
*对于任何*用户，更新个人资料不应该修改 username 或 userId
**验证需求：8.3**

### 属性 19: 系统管理员拥有所有权限
*对于任何*系统管理员用户，所有权限检查应该返回 true
**验证需求：9.1**

### 属性 20: 普通用户权限基于角色
*对于任何*非系统管理员用户，权限检查应该基于用户在当前租户中的角色分配
**验证需求：9.2**

### 属性 21: 登录审计日志记录
*对于任何*成功的登录，系统应该记录登录时间、tenantId、facilityId 和 IP 地址
**验证需求：10.1**

### 属性 22: Token解析包含完整上下文
*对于任何*有效的 Token，解析后应该包含 userId、username、tenantId、facilityId 和 isSystemAdmin
**验证需求：13.1**

### 属性 23: 请求头租户上下文获取
*对于任何*带有 X-Tenant-ID 请求头的请求，后端应该正确获取租户上下文
**验证需求：14.2**

### 属性 24: 废弃请求头被忽略
*对于任何*带有 X-User-Roles 或 X-User-Permissions 请求头的请求，后端应该忽略这些请求头
**验证需求：14.7**


## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 场景 |
|-------|---------|------|
| 3001 | 租户 {tenantName} 中已存在用户名 {username} 的用户，无法添加 | 用户名在租户中冲突 |
| 3002 | 用户不存在 | 用户ID不存在 |
| 3003 | 租户不存在 | 租户ID不存在 |
| 3004 | 用户名或密码错误 | 登录失败 |
| 3005 | 租户code不存在 | 租户code无效 |
| 3006 | 用户不属于该租户 | 用户无权访问该租户 |
| 3007 | 设施不存在 | 设施ID不存在 |
| 3008 | 用户不属于该设施 | 用户无权访问该设施 |

### 异常处理策略

#### 1. 业务异常（IamException）

```java
public class IamException extends RuntimeException {
    private final String errorCode;
    private final Object[] args;
    
    public IamException(String errorCode, Object... args) {
        super(String.format(getErrorMessage(errorCode), args));
        this.errorCode = errorCode;
        this.args = args;
    }
}
```

#### 2. 全局异常处理器

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(IamException.class)
    public R<Void> handleIamException(IamException e) {
        return R.fail(e.getErrorCode(), e.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    public R<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return R.fail("系统错误，请联系管理员");
    }
}
```

## 测试策略

### 单元测试

#### 1. 测试范围
- 业务逻辑层（ApplicationService）
- 领域层（Entity、Repository）
- 工具类（JwtTokenProvider、PasswordEncoder）

#### 2. 测试框架
- JUnit 5
- Mockito
- AssertJ

#### 3. 测试示例

```java
@ExtendWith(MockitoExtension.class)
class AuthApplicationServiceTest {
    
    @Mock
    private GlobalUserRepository globalUserRepository;
    
    @Mock
    private TenantRepository tenantRepository;
    
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    
    @InjectMocks
    private AuthApplicationService authApplicationService;
    
    @Test
    void preLogin_shouldReturnTenantList_whenCredentialsValid() {
        // Given
        String username = "testuser";
        String password = "password";
        GlobalUser user = createTestUser(username);
        when(globalUserRepository.findByUsername(username)).thenReturn(user);
        
        // When
        PreLoginDto result = authApplicationService.preLogin(
            new PreLoginCmd(username, password));
        
        // Then
        assertThat(result.getTenantIds()).isNotEmpty();
        assertThat(result.getFacilityIds()).isNotEmpty();
    }
}
```

### 属性基础测试（Property-Based Testing）

#### 1. 测试框架
- jqwik（Java的属性基础测试库）

#### 2. 测试配置
- 每个属性测试运行至少 100 次迭代
- 使用随机生成的测试数据

#### 3. 测试示例

```java
class UserPropertyTest {
    
    /**
     * 特性：iam-user-system-refactor，属性 1：用户ID全局唯一性
     * 验证需求：1.1
     */
    @Property(tries = 100)
    void userIds_shouldBeGloballyUnique(
        @ForAll @Size(min = 10, max = 100) List<@AlphaChars @StringLength(min = 5, max = 20) String> usernames) {
        
        // Given: 创建多个用户
        List<GlobalUser> users = usernames.stream()
            .map(username -> createUser(username))
            .collect(Collectors.toList());
        
        // When: 获取所有userId
        List<String> userIds = users.stream()
            .map(GlobalUser::getUserId)
            .collect(Collectors.toList());
        
        // Then: 验证所有userId唯一
        assertThat(userIds).doesNotHaveDuplicates();
    }
    
    /**
     * 特性：iam-user-system-refactor，属性 2：用户数据持久化完整性
     * 验证需求：1.2
     */
    @Property(tries = 100)
    void userDataPersistence_shouldPreserveAllFields(
        @ForAll @AlphaChars @StringLength(min = 5, max = 20) String username,
        @ForAll @AlphaChars @StringLength(min = 6, max = 20) String password) {
        
        // Given: 创建用户
        GlobalUser originalUser = createUser(username, password);
        
        // When: 保存并查询
        userRepository.save(originalUser);
        GlobalUser retrievedUser = userRepository.findById(originalUser.getUserId());
        
        // Then: 验证所有字段相同
        assertThat(retrievedUser).isEqualTo(originalUser);
        assertThat(retrievedUser.getUsername()).isEqualTo(username);
        assertThat(retrievedUser.getTenantIds()).isEqualTo(originalUser.getTenantIds());
    }
    
    /**
     * 特性：iam-user-system-refactor，属性 10：用户加入租户冲突检测
     * 验证需求：3.3, 3.4
     */
    @Property(tries = 100)
    void addUserToTenant_shouldFailWhenUsernameConflicts(
        @ForAll @AlphaChars @StringLength(min = 5, max = 20) String username,
        @ForAll @AlphaChars @StringLength(min = 5, max = 10) String tenantCode) {
        
        // Given: 租户中已有相同username的用户
        Tenant tenant = createTenant(tenantCode);
        GlobalUser existingUser = createUser(username);
        userService.addUserToTenant(existingUser.getUserId(), tenant.getTenantId());
        
        // When: 尝试添加另一个相同username的用户
        GlobalUser newUser = createUser(username);
        
        // Then: 应该抛出冲突异常
        assertThatThrownBy(() -> 
            userService.addUserToTenant(newUser.getUserId(), tenant.getTenantId()))
            .isInstanceOf(IamException.class)
            .hasMessageContaining("3001");
    }
}
```

### 集成测试

#### 1. 测试范围
- API 接口测试
- 数据库集成测试
- 网关集成测试

#### 2. 测试框架
- Spring Boot Test
- TestContainers（MySQL容器）
- MockMvc

#### 3. 测试示例

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthControllerIntegrationTest {
    
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void login_shouldReturnToken_whenCredentialsValid() throws Exception {
        // Given
        String username = "testuser";
        String password = "password";
        String tenantCode = "TENANT_A";
        String facilityId = "F28";
        
        // When & Then
        mockMvc.perform(post("/api/iam/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "username": "%s",
                        "password": "%s",
                        "tenantCode": "%s",
                        "facilityId": "%s"
                    }
                    """.formatted(username, password, tenantCode, facilityId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.token").exists())
            .andExpect(jsonPath("$.data.userInfo.userId").exists());
    }
}
```


## 前端实现指导

### 前端架构设计

#### 1. 目录结构

```
src/
├── api/                    # API 接口层
│   ├── auth.ts            # 认证相关 API
│   ├── user.ts            # 用户管理 API
│   ├── role.ts            # 角色管理 API
│   ├── menu.ts            # 菜单管理 API
│   └── tenant.ts          # 租户管理 API
├── stores/                 # 状态管理
│   ├── auth.ts            # 认证状态
│   ├── user.ts            # 用户状态
│   └── app.ts             # 应用状态
├── views/                  # 页面组件
│   ├── login/             # 登录页面
│   │   ├── index.vue      # 登录主页面
│   │   ├── PreLogin.vue   # 第一步：用户名密码
│   │   └── TenantSelect.vue # 第二步：租户和设施选择
│   ├── user/              # 用户管理
│   │   ├── index.vue      # 用户列表
│   │   ├── UserForm.vue   # 用户表单
│   │   └── TenantManage.vue # 用户租户管理
│   ├── role/              # 角色管理
│   ├── menu/              # 菜单管理
│   └── tenant/            # 租户管理
├── router/                 # 路由配置
│   ├── index.ts           # 路由主文件
│   └── guards.ts          # 路由守卫
├── directives/             # 自定义指令
│   └── permission.ts      # 权限指令
└── utils/                  # 工具函数
    ├── request.ts         # HTTP 请求封装
    ├── auth.ts            # 认证工具
    └── storage.ts         # 本地存储工具
```

### 核心功能实现

#### 1. 登录流程实现

##### 1.1 登录状态管理

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    refreshToken: '',
    userInfo: null as UserInfo | null,
    tenantId: '',
    facilityId: '',
  }),
  
  actions: {
    setToken(token: string, refreshToken: string) {
      this.token = token;
      this.refreshToken = refreshToken;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
    },
    
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo;
      this.tenantId = userInfo.tenantId;
      this.facilityId = userInfo.facilityId;
      localStorage.setItem('tenantId', userInfo.tenantId);
      localStorage.setItem('facilityId', userInfo.facilityId);
    },
    
    logout() {
      this.token = '';
      this.refreshToken = '';
      this.userInfo = null;
      this.tenantId = '';
      this.facilityId = '';
      localStorage.clear();
    },
  },
  
  getters: {
    isSystemAdmin: (state) => state.userInfo?.isSystemAdmin || false,
    isLoggedIn: (state) => !!state.token,
  },
});
```

##### 1.2 登录页面实现

```vue
<!-- views/login/index.vue -->
<template>
  <div class="login-container">
    <PreLogin 
      v-if="step === 1" 
      @success="handlePreLoginSuccess" 
    />
    <TenantSelect 
      v-else 
      :pre-login-data="preLoginData"
      @back="step = 1"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import PreLogin from './PreLogin.vue';
import TenantSelect from './TenantSelect.vue';

const router = useRouter();
const authStore = useAuthStore();
const step = ref(1);
const preLoginData = ref<PreLoginResponse | null>(null);

const handlePreLoginSuccess = (data: PreLoginResponse) => {
  preLoginData.value = data;
  step.value = 2;
};

const handleLoginSuccess = (data: LoginResponse) => {
  authStore.setToken(data.token, data.refreshToken);
  authStore.setUserInfo(data.userInfo);
  router.push('/');
};
</script>
```

##### 1.3 预登录组件

```vue
<!-- views/login/PreLogin.vue -->
<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item prop="username">
      <el-input 
        v-model="form.username" 
        placeholder="请输入用户名"
        prefix-icon="User"
      />
    </el-form-item>
    
    <el-form-item prop="password">
      <el-input 
        v-model="form.password" 
        type="password"
        placeholder="请输入密码"
        prefix-icon="Lock"
        show-password
      />
    </el-form-item>
    
    <el-button 
      type="primary" 
      :loading="loading"
      @click="handleSubmit"
      style="width: 100%"
    >
      下一步
    </el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { preLogin } from '@/api/auth';

const emit = defineEmits<{
  success: [data: PreLoginResponse]
}>();

const formRef = ref();
const loading = ref(false);
const form = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
};

const handleSubmit = async () => {
  await formRef.value.validate();
  
  try {
    loading.value = true;
    const response = await preLogin(form);
    emit('success', response.data);
  } catch (error: any) {
    ElMessage.error(error.message || '用户名或密码错误');
  } finally {
    loading.value = false;
  }
};
</script>
```

##### 1.4 租户和设施选择组件

```vue
<!-- views/login/TenantSelect.vue -->
<template>
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="用户名">
      <el-input v-model="preLoginData.username" disabled />
    </el-form-item>
    
    <el-form-item prop="tenantCode" label="租户">
      <el-input 
        v-model="form.tenantCode" 
        placeholder="请输入租户编码"
        :disabled="tenantCodeDisabled"
      />
    </el-form-item>
    
    <el-form-item prop="facilityId" label="设施">
      <el-select 
        v-model="form.facilityId" 
        placeholder="请选择设施"
        :disabled="facilityDisabled"
        style="width: 100%"
      >
        <el-option
          v-for="facility in facilities"
          :key="facility.facilityId"
          :label="facility.facilityName"
          :value="facility.facilityId"
        />
      </el-select>
    </el-form-item>
    
    <div style="display: flex; gap: 10px;">
      <el-button @click="emit('back')">返回</el-button>
      <el-button 
        type="primary" 
        :loading="loading"
        @click="handleSubmit"
        style="flex: 1"
      >
        登录
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { login } from '@/api/auth';

const props = defineProps<{
  preLoginData: PreLoginResponse
}>();

const emit = defineEmits<{
  back: []
  success: [data: LoginResponse]
}>();

const formRef = ref();
const loading = ref(false);

// 自动填充租户和设施
const form = reactive({
  tenantCode: props.preLoginData.suggestedTenant?.tenantCode || '',
  facilityId: props.preLoginData.suggestedFacility?.facilityId || '',
});

// 单租户时禁用输入
const tenantCodeDisabled = computed(() => 
  props.preLoginData.tenantIds.length === 1
);

// 单设施时禁用选择
const facilityDisabled = computed(() => 
  props.preLoginData.facilities.length === 1
);

const facilities = computed(() => props.preLoginData.facilities);

const rules = {
  tenantCode: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
  ],
  facilityId: [
    { required: true, message: '请选择设施', trigger: 'change' },
  ],
};

const handleSubmit = async () => {
  await formRef.value.validate();
  
  try {
    loading.value = true;
    const response = await login({
      username: props.preLoginData.username,
      password: '', // 密码已在预登录验证
      tenantCode: form.tenantCode,
      facilityId: form.facilityId,
    });
    emit('success', response.data);
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};
</script>
```

#### 2. 请求拦截器配置

```typescript
// utils/request.ts
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    
    // 设置请求头
    if (authStore.token) {
      config.headers['X-Token'] = authStore.token;
    }
    
    config.headers['x-channel'] = 'web';
    
    if (authStore.tenantId) {
      config.headers['X-Tenant-ID'] = authStore.tenantId;
    }
    
    if (authStore.facilityId) {
      config.headers['X-Facility-ID'] = authStore.facilityId;
    }
    
    // 根据当前路由获取系统编码
    const systemCode = getSystemCodeFromRoute();
    config.headers['X-System-Code'] = systemCode || 'wms-lite';
    
    // 语言和时区
    config.headers['Accept-Language'] = localStorage.getItem('language') || 'zh-CN';
    config.headers['Item-Time-Zone'] = localStorage.getItem('timezone') || 'Asia/Shanghai';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败');
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
    
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = '/login';
    } else {
      ElMessage.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

function getSystemCodeFromRoute(): string {
  const path = window.location.pathname;
  if (path.startsWith('/iam')) return 'iam';
  if (path.startsWith('/wms')) return 'wms-lite';
  return 'wms-lite';
}

export default request;
```


#### 3. 权限控制实现

##### 3.1 权限指令

```typescript
// directives/permission.ts
import { Directive } from 'vue';
import { useAuthStore } from '@/stores/auth';

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const authStore = useAuthStore();
    
    // systemAdmin 拥有所有权限
    if (authStore.isSystemAdmin) {
      return;
    }
    
    // 检查权限
    const permissions = authStore.userInfo?.permissions || [];
    const hasPermission = Array.isArray(value)
      ? value.some(p => permissions.includes(p))
      : permissions.includes(value);
    
    if (!hasPermission) {
      el.style.display = 'none';
    }
  },
};
```

##### 3.2 路由守卫

```typescript
// router/guards.ts
import { Router } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    
    // 白名单路由
    const whiteList = ['/login', '/404', '/403'];
    if (whiteList.includes(to.path)) {
      next();
      return;
    }
    
    // 检查登录状态
    if (!authStore.isLoggedIn) {
      next('/login');
      return;
    }
    
    // 检查 systemAdmin 权限
    if (to.meta?.requireSystemAdmin && !authStore.isSystemAdmin) {
      ElMessage.error('只有系统管理员可以访问此页面');
      next('/403');
      return;
    }
    
    // 检查权限
    const permissions = to.meta?.permissions as string[];
    if (permissions && permissions.length > 0) {
      const userPermissions = authStore.userInfo?.permissions || [];
      const hasPermission = permissions.some(p => userPermissions.includes(p));
      
      if (!hasPermission && !authStore.isSystemAdmin) {
        ElMessage.error('您没有权限访问此页面');
        next('/403');
        return;
      }
    }
    
    next();
  });
}
```

##### 3.3 路由配置示例

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { setupRouterGuards } from './guards';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/user/index.vue'),
    meta: {
      title: '用户管理',
      permissions: ['iam:user:list'],
    },
  },
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('@/views/menu/index.vue'),
    meta: {
      title: '菜单管理',
      requireSystemAdmin: true, // 仅 systemAdmin 可访问
    },
  },
  {
    path: '/tenant',
    name: 'Tenant',
    component: () => import('@/views/tenant/index.vue'),
    meta: {
      title: '租户管理',
      requireSystemAdmin: true, // 仅 systemAdmin 可访问
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

setupRouterGuards(router);

export default router;
```

#### 4. 用户管理实现

##### 4.1 用户租户管理组件

```vue
<!-- views/user/TenantManage.vue -->
<template>
  <el-dialog v-model="visible" title="管理用户租户" width="600px">
    <el-form>
      <el-form-item label="当前租户">
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <el-tag
            v-for="tenantId in user.tenantIds"
            :key="tenantId"
            closable
            @close="handleRemoveTenant(tenantId)"
          >
            {{ getTenantName(tenantId) }}
          </el-tag>
        </div>
      </el-form-item>
      
      <el-form-item label="添加租户">
        <el-select
          v-model="selectedTenantId"
          placeholder="请选择租户"
          style="width: 100%"
        >
          <el-option
            v-for="tenant in availableTenants"
            :key="tenant.tenantId"
            :label="tenant.tenantName"
            :value="tenant.tenantId"
          />
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleAddTenant">添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addUserToTenant, removeUserFromTenant } from '@/api/user';
import { getTenantList } from '@/api/tenant';

const props = defineProps<{
  user: User
}>();

const emit = defineEmits<{
  success: []
}>();

const visible = ref(false);
const selectedTenantId = ref('');
const allTenants = ref<Tenant[]>([]);

// 可添加的租户（排除已有的）
const availableTenants = computed(() => 
  allTenants.value.filter(t => !props.user.tenantIds.includes(t.tenantId))
);

const getTenantName = (tenantId: string) => {
  const tenant = allTenants.value.find(t => t.tenantId === tenantId);
  return tenant?.tenantName || tenantId;
};

const open = async () => {
  visible.value = true;
  const response = await getTenantList();
  allTenants.value = response.data;
};

const handleAddTenant = async () => {
  if (!selectedTenantId.value) {
    ElMessage.warning('请选择租户');
    return;
  }
  
  try {
    await addUserToTenant(props.user.userId, selectedTenantId.value);
    ElMessage.success('添加成功');
    selectedTenantId.value = '';
    emit('success');
  } catch (error: any) {
    if (error.code === '3001') {
      ElMessage.error(`租户中已存在用户名 ${props.user.username} 的用户，无法添加`);
    } else {
      ElMessage.error(error.message || '添加失败');
    }
  }
};

const handleRemoveTenant = async (tenantId: string) => {
  try {
    await ElMessageBox.confirm('确定要将用户从该租户移除吗？', '提示', {
      type: 'warning',
    });
    
    await removeUserFromTenant(props.user.userId, tenantId);
    ElMessage.success('移除成功');
    emit('success');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '移除失败');
    }
  }
};

defineExpose({ open });
</script>
```

### 删除功能清单

#### 1. 需要删除的文件

```
src/
├── views/
│   ├── central/           # 删除整个 Central 目录
│   │   ├── login/
│   │   ├── user/
│   │   ├── role/
│   │   └── menu/
│   └── password-reset/    # 删除密码重置页面
├── api/
│   ├── centralAuth.ts     # 删除 Central 认证 API
│   ├── centralUser.ts     # 删除 Central 用户 API
│   └── verification.ts    # 删除验证码 API
├── stores/
│   └── centralUser.ts     # 删除 Central 用户状态
└── components/
    ├── TenantSwitch.vue   # 删除租户切换组件
    ├── PhoneVerification.vue  # 删除手机验证组件
    └── EmailVerification.vue  # 删除邮箱验证组件
```

#### 2. 需要删除的路由

```typescript
// 删除以下路由配置
{
  path: '/central/login',
  name: 'CentralLogin',
  component: () => import('@/views/central/login/index.vue'),
},
{
  path: '/central/user',
  name: 'CentralUser',
  component: () => import('@/views/central/user/index.vue'),
},
{
  path: '/password/reset',
  name: 'PasswordReset',
  component: () => import('@/views/password-reset/index.vue'),
},
```

#### 3. 需要删除的 API 方法

```typescript
// api/auth.ts - 删除以下方法
export function sendSmsCode(phone: string) { ... }
export function sendEmailCode(email: string) { ... }
export function loginByCode(data: LoginByCodeRequest) { ... }
export function switchTenant(tenantId: string) { ... }

// api/user.ts - 删除以下方法
export function inviteUser(data: InviteUserRequest) { ... }
export function resetPassword(data: ResetPasswordRequest) { ... }
```

### 实施检查清单

#### 阶段一：基础准备
- [ ] 更新 User 数据模型，添加 facilityIds、lastLoginFacilityId
- [ ] 删除 CentralUser 模型
- [ ] 更新 authApi，添加 preLogin 方法
- [ ] 更新 userApi，添加 addUserToTenant、removeUserFromTenant
- [ ] 删除 centralAuthApi、centralUserApi

#### 阶段二：登录流程
- [ ] 创建 PreLogin 组件
- [ ] 创建 TenantSelect 组件（含设施选择）
- [ ] 更新登录页面主组件
- [ ] 更新 authStore，添加 facilityId
- [ ] 更新请求拦截器，添加 X-Facility-ID 请求头
- [ ] 删除手机号/邮箱/验证码登录相关代码

#### 阶段三：用户管理
- [ ] 更新用户列表，显示 isSystemAdmin 标识
- [ ] 更新用户表单，添加 tenantIds 和 facilityIds 字段
- [ ] 创建 TenantManage 组件
- [ ] 实现租户冲突检测提示
- [ ] 合并 Central 用户管理到统一用户管理

#### 阶段四：权限控制
- [ ] 更新 permission 指令，支持 systemAdmin 判断
- [ ] 更新路由守卫，支持 requireSystemAdmin
- [ ] 隐藏菜单管理入口（非 systemAdmin）
- [ ] 隐藏租户管理入口（非 systemAdmin）

#### 阶段五：删除功能
- [ ] 删除 Central 相关所有页面和组件
- [ ] 删除验证码相关组件和 API
- [ ] 删除租户切换组件和 API
- [ ] 删除用户邀请功能
- [ ] 删除自助密码重置功能
- [ ] 清理无用的路由配置
- [ ] 清理无用的状态管理

#### 阶段六：测试验证
- [ ] 测试 systemAdmin 登录流程
- [ ] 测试普通用户登录流程（单租户/多租户）
- [ ] 测试设施选择功能
- [ ] 测试用户租户管理功能
- [ ] 测试租户冲突检测
- [ ] 测试权限控制（systemAdmin vs 普通用户）
- [ ] 测试菜单管理权限
- [ ] 测试请求头正确性


## 数据库迁移方案

### 迁移策略

由于需求明确要求重新建表，我们将采用**全新建表**策略，不进行数据迁移。

### 数据库脚本重写

#### 1. 需要重写的脚本

```
iam-app/db-script/ddl/init/
├── 1-init-iam_tables.sql          # 重写：创建新的表结构
├── 2-init_menu_api_paths.sql      # 重写：初始化菜单数据
└── 3-init_system_admin.sql        # 重写：初始化系统管理员
```

#### 2. 表结构变更清单

| 表名 | 操作 | 说明 |
|------|------|------|
| global_user | 重建 | 添加 username、tenantIds、facilityIds、lastLoginTenantId、lastLoginFacilityId、isSystemAdmin 等字段 |
| iam_central_user | 删除 | 功能合并到 global_user |
| iam_central_role | 删除 | 功能合并到 iam_role |
| iam_central_menu | 删除 | 功能合并到 iam_menu |
| iam_central_user_role | 删除 | 功能合并到 iam_user_role |
| iam_central_role_menu | 删除 | 功能合并到 iam_role_menu |
| iam_menu | 修改 | 删除 tenantId 字段 |
| iam_role | 修改 | 添加 isTenantAdmin 字段 |
| iam_tenant_user | 保留 | 无变更 |
| iam_tenant | 保留 | 无变更 |

#### 3. 初始化数据

##### 3.1 系统管理员初始化

```sql
-- 3-init_system_admin.sql
-- 创建系统管理员用户
INSERT INTO global_user (
    userId,
    username,
    password,
    tenantIds,
    facilityIds,
    isSystemAdmin,
    email,
    nickname,
    status,
    delFlag,
    createdTime,
    updatedTime
) VALUES (
    'SYSTEM_ADMIN_001',
    'admin',
    '$2a$12$OEs5d2FfSsXJWuYWho/Qbe5UrZD3CPa21kJBxRTRdUjGPDa2OJJdy', -- 密码：admin
    JSON_ARRAY(),  -- 系统管理员不需要租户
    JSON_ARRAY(),  -- 系统管理员不需要设施
    TRUE,
    'admin@example.com',
    '系统管理员',
    '0',
    '0',
    NOW(),
    NOW()
);

-- 创建系统管理员角色
INSERT INTO iam_role (
    roleName,
    roleKey,
    roleSort,
    isTenantAdmin,
    status,
    delFlag,
    createdTime,
    updatedTime
) VALUES (
    '系统管理员',
    'system_admin',
    1,
    FALSE,
    '0',
    '0',
    NOW(),
    NOW()
);

-- 分配所有菜单权限给系统管理员角色
INSERT INTO iam_role_menu (roleId, menuId)
SELECT 
    (SELECT roleId FROM iam_role WHERE roleKey = 'system_admin'),
    menuId
FROM iam_menu
WHERE status = '0';

-- 分配角色给系统管理员用户
INSERT INTO iam_user_role (userId, roleId, tenantId)
VALUES (
    'SYSTEM_ADMIN_001',
    (SELECT roleId FROM iam_role WHERE roleKey = 'system_admin'),
    NULL
);
```

##### 3.2 基础菜单初始化

```sql
-- 2-init_menu_api_paths.sql
-- 用户管理菜单
INSERT INTO iam_menu (
    menuName,
    systemCode,
    parentId,
    orderNum,
    path,
    component,
    menuType,
    visible,
    status,
    perms,
    apiPaths,
    icon,
    createdTime,
    updatedTime
) VALUES (
    '用户管理',
    'iam',
    0,
    1,
    '/iam/user',
    'views/iam/user/index',
    'C',
    '0',
    '0',
    'iam:user:list',
    JSON_ARRAY(
        '/api/iam/users/search-by-paging:POST',
        '/api/iam/users/search:POST'
    ),
    'user',
    NOW(),
    NOW()
);

-- 菜单管理菜单（仅 systemAdmin 可见）
INSERT INTO iam_menu (
    menuName,
    systemCode,
    parentId,
    orderNum,
    path,
    component,
    menuType,
    visible,
    status,
    perms,
    apiPaths,
    icon,
    createdTime,
    updatedTime
) VALUES (
    '菜单管理',
    'iam',
    0,
    2,
    '/iam/menu',
    'views/iam/menu/index',
    'C',
    '0',
    '0',
    'iam:menu:list',
    JSON_ARRAY(
        '/api/iam/menus/tree:GET',
        '/api/iam/menus/search-by-paging:POST'
    ),
    'tree-table',
    NOW(),
    NOW()
);

-- 租户管理菜单（仅 systemAdmin 可见）
INSERT INTO iam_menu (
    menuName,
    systemCode,
    parentId,
    orderNum,
    path,
    component,
    menuType,
    visible,
    status,
    perms,
    apiPaths,
    icon,
    createdTime,
    updatedTime
) VALUES (
    '租户管理',
    'iam',
    0,
    3,
    '/iam/tenant',
    'views/iam/tenant/index',
    'C',
    '0',
    '0',
    'iam:tenant:list',
    JSON_ARRAY(
        '/api/iam/tenants/search-by-paging:POST'
    ),
    'tree',
    NOW(),
    NOW()
);
```

## 实施计划

### 时间估算

| 阶段 | 任务 | 工期 | 负责人 |
|------|------|------|--------|
| 1 | 数据库设计和脚本编写 | 1天 | 后端开发 |
| 2 | 后端 Domain 层开发 | 1天 | 后端开发 |
| 3 | 后端 Application 层开发 | 2天 | 后端开发 |
| 4 | 后端 Interfaces 层开发 | 1天 | 后端开发 |
| 5 | 网关层调整 | 0.5天 | 后端开发 |
| 6 | 后端单元测试 | 1天 | 后端开发 |
| 7 | 后端属性测试 | 1天 | 后端开发 |
| 8 | 前端数据模型和 API | 0.5天 | 前端开发 |
| 9 | 前端登录流程重构 | 1天 | 前端开发 |
| 10 | 前端用户管理功能 | 1.5天 | 前端开发 |
| 11 | 前端权限控制调整 | 0.5天 | 前端开发 |
| 12 | 前端删除功能 | 1天 | 前端开发 |
| 13 | 前端其他页面调整 | 1天 | 前端开发 |
| 14 | 联调测试 | 2天 | 全员 |
| 15 | 部署上线 | 0.5天 | 运维 |

**总工期**：约 16 个工作日

### 风险控制

#### 1. 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 用户名唯一性并发冲突 | 高 | 中 | 使用分布式锁，添加数据库唯一索引 |
| JSON 字段查询性能 | 中 | 中 | 添加索引，使用 Redis 缓存 |
| Token 解析性能 | 低 | 低 | 使用缓存，优化解析逻辑 |

#### 2. 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 用户适应新登录流程 | 中 | 高 | 提供操作指南，增加提示信息 |
| 权限管理变更影响 | 中 | 中 | 提前通知，提供培训 |

### 验收标准

#### 1. 功能验收

- [ ] 用户可以使用 username + password + tenantCode + facilityId 登录
- [ ] 系统管理员可以管理所有用户和租户
- [ ] 普通用户只能看到有权限的菜单
- [ ] 用户可以属于多个租户
- [ ] 用户加入租户时正确检测冲突
- [ ] 所有 Central 相关功能已删除
- [ ] 所有验证码相关功能已删除

#### 2. 性能验收

- [ ] 登录响应时间 < 2秒
- [ ] 用户名唯一性检查 < 500ms
- [ ] 菜单查询响应时间 < 1秒

#### 3. 安全验收

- [ ] 密码使用 BCrypt 加密
- [ ] Token 包含完整的用户上下文
- [ ] 权限验证正确（systemAdmin vs 普通用户）
- [ ] 租户隔离正确

## 总结

本设计文档详细描述了 IAM 用户体系重构的技术方案，包括：

1. **架构设计**：采用分层架构，清晰的模块划分
2. **数据模型**：统一的 GlobalUser 模型，支持多租户和多设施
3. **登录流程**：两步登录，支持租户和设施选择
4. **权限控制**：systemAdmin 特权，普通用户基于角色
5. **正确性属性**：24 个可测试的属性，确保系统正确性
6. **测试策略**：单元测试 + 属性测试 + 集成测试
7. **前端实现**：详细的实现指导和代码示例
8. **数据库迁移**：全新建表，重写初始化脚本

通过本次重构，IAM 系统将更加简洁、易用、灵活，能够更好地支持仓库管理系统的业务需求。


## 本地调试认证拦截器设计

### 概述

为了支持本地调试时不启动网关也能进行认证和权限验证，我们在 `xms-pass` 模块中实现一个智能拦截器。该拦截器能够识别请求来源，对来自网关的请求直接放行，对非网关请求执行本地认证逻辑。

### 设计目标

1. **开发便利性**：本地调试时无需启动网关，提高开发效率
2. **行为一致性**：本地认证逻辑与网关认证逻辑保持一致
3. **生产安全性**：生产环境可通过配置禁用本地认证，强制使用网关
4. **零侵入性**：对现有代码无侵入，通过拦截器统一处理

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        请求来源判断                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  检查请求头：X-Gateway-Request = true                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
            来自网关 │               │ 非网关请求
                    ↓               ↓
        ┌───────────────┐   ┌───────────────┐
        │  直接放行      │   │  本地认证      │
        │  使用网关注入  │   │  验证Token     │
        │  的用户信息    │   │  提取用户信息  │
        └───────────────┘   └───────────────┘
                    │               │
                    └───────┬───────┘
                            ↓
        ┌─────────────────────────────────────┐
        │  设置 TokenHolder 和 IsolationHolder │
        │  继续处理业务请求                    │
        └─────────────────────────────────────┘
```

### 核心组件

#### 1. LocalAuthInterceptor（本地认证拦截器）

```java
@Component
@Order(1)
public class LocalAuthInterceptor implements HandlerInterceptor {
    
    private final AuthApplicationService authApplicationService;
    private final boolean enableLocalAuth; // 从配置读取
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) {
        
        // 1. 检查是否来自网关
        if (isFromGateway(request)) {
            // 来自网关，直接放行，使用网关注入的用户信息
            extractUserContextFromGateway(request);
            return true;
        }
        
        // 2. 检查是否启用本地认证
        if (!enableLocalAuth) {
            // 未启用本地认证，返回 401
            sendUnauthorizedResponse(response, "Gateway required");
            return false;
        }
        
        // 3. 检查是否是公开接口
        if (isPublicEndpoint(request)) {
            return true;
        }
        
        // 4. 执行本地认证
        return performLocalAuth(request, response);
    }
    
    private boolean isFromGateway(HttpServletRequest request) {
        // 检查网关标识请求头
        String gatewayFlag = request.getHeader("X-Gateway-Request");
        return "true".equalsIgnoreCase(gatewayFlag);
    }
    
    private boolean performLocalAuth(HttpServletRequest request, 
                                     HttpServletResponse response) {
        // 1. 提取 Token
        String token = extractToken(request);
        if (token == null) {
            sendUnauthorizedResponse(response, "Token required");
            return false;
        }
        
        // 2. 验证 Token
        ValidateTokenDto result = authApplicationService.validateToken(token);
        if (!result.isValid()) {
            sendUnauthorizedResponse(response, "Invalid token");
            return false;
        }
        
        // 3. 设置用户上下文
        setUserContext(result.getUserInfo());
        
        // 4. 模拟网关行为，注入用户信息到请求属性
        injectUserInfoToRequest(request, result.getUserInfo());
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) {
        // 清理 ThreadLocal
        TokenHolder.clear();
        IsolationHolder.clear();
    }
}
```

#### 2. 配置类

```java
@Configuration
public class LocalAuthConfig implements WebMvcConfigurer {
    
    @Value("${local.auth.enabled:true}")
    private boolean enableLocalAuth;
    
    @Bean
    public LocalAuthInterceptor localAuthInterceptor(
            AuthApplicationService authApplicationService) {
        return new LocalAuthInterceptor(authApplicationService, enableLocalAuth);
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localAuthInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns(
                    "/auth/pre-login",
                    "/auth/login",
                    "/auth/refresh",
                    "/actuator/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/error"
                )
                .order(1);
    }
}
```

### 请求头规范

#### 网关标识请求头

| 请求头 | 值 | 说明 |
|-------|---|------|
| X-Gateway-Request | true | 标识请求来自网关 |

#### 用户信息请求头（网关注入）

| 请求头 | 说明 |
|-------|------|
| X-User-Id | 用户ID |
| X-Username | 用户名 |
| X-Tenant-ID | 租户ID |
| X-Facility-ID | 设施ID |
| X-Is-System-Admin | 是否系统管理员 |

#### 本地认证请求头

| 请求头 | 说明 |
|-------|------|
| X-Token | JWT Token（本地调试时使用） |

### 配置说明

#### application.yml

```yaml
# 本地调试配置
local:
  auth:
    enabled: true  # 开发环境启用本地认证
    
# 生产环境配置
---
spring:
  config:
    activate:
      on-profile: prod
      
local:
  auth:
    enabled: false  # 生产环境禁用本地认证，强制使用网关
```

### 公开接口列表

以下接口无需认证，直接放行：

1. `/auth/pre-login` - 预登录接口
2. `/auth/login` - 登录接口
3. `/auth/refresh` - 刷新Token接口
4. `/actuator/**` - 健康检查接口
5. `/swagger-ui/**` - API文档接口
6. `/v3/api-docs/**` - OpenAPI文档
7. `/error` - 错误处理接口

### 使用场景

#### 场景 1：本地调试（不启动网关）

```bash
# 1. 预登录
curl -X POST http://localhost:8080/auth/pre-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 2. 登录获取 Token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password","tenantCode":"T001","facilityId":"F001"}'

# 3. 使用 Token 访问受保护接口
curl -X GET http://localhost:8080/users \
  -H "X-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 场景 2：通过网关访问

```bash
# 网关会自动注入 X-Gateway-Request 和用户信息请求头
curl -X GET http://gateway:8080/iam/users \
  -H "X-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  
# 拦截器检测到 X-Gateway-Request=true，直接放行
```

#### 场景 3：生产环境（强制网关）

```yaml
# application-prod.yml
local:
  auth:
    enabled: false
```

所有非网关请求将被拒绝，返回 401 错误。

### 安全考虑

1. **生产环境禁用**：生产环境必须禁用本地认证，强制使用网关
2. **Token 验证**：本地认证时严格验证 Token 的有效性和过期时间
3. **请求头验证**：验证网关标识请求头，防止伪造
4. **日志记录**：记录所有认证失败的请求，便于安全审计
5. **配置保护**：通过环境变量或配置中心管理敏感配置

### 性能优化

1. **快速路径**：网关请求直接放行，无额外开销
2. **缓存 Token**：对已验证的 Token 进行短时间缓存
3. **异步日志**：使用异步方式记录审计日志
4. **连接池**：复用数据库连接，减少连接开销

### 错误处理

| 错误场景 | HTTP 状态码 | 错误消息 |
|---------|-----------|---------|
| Token 缺失 | 401 | Token required |
| Token 无效 | 401 | Invalid token |
| Token 过期 | 401 | Token expired |
| 未启用本地认证 | 401 | Gateway required |
| 权限不足 | 403 | Forbidden |

### 测试策略

#### 单元测试

```java
@Test
void testFromGateway_ShouldPassThrough() {
    // Given: 请求来自网关
    request.addHeader("X-Gateway-Request", "true");
    request.addHeader("X-User-Id", "user123");
    
    // When: 执行拦截器
    boolean result = interceptor.preHandle(request, response, handler);
    
    // Then: 应该放行
    assertTrue(result);
    assertEquals("user123", TokenHolder.getCurrentUserId());
}

@Test
void testLocalAuth_WithValidToken_ShouldPass() {
    // Given: 有效的 Token
    request.addHeader("X-Token", validToken);
    
    // When: 执行拦截器
    boolean result = interceptor.preHandle(request, response, handler);
    
    // Then: 应该通过认证
    assertTrue(result);
    assertNotNull(TokenHolder.getCurrentUser());
}

@Test
void testLocalAuth_WithoutToken_ShouldReject() {
    // Given: 没有 Token
    
    // When: 执行拦截器
    boolean result = interceptor.preHandle(request, response, handler);
    
    // Then: 应该拒绝
    assertFalse(result);
    assertEquals(401, response.getStatus());
}
```

#### 集成测试

```java
@SpringBootTest
@AutoConfigureMockMvc
class LocalAuthInterceptorIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testAccessProtectedEndpoint_WithValidToken() throws Exception {
        mockMvc.perform(get("/users")
                .header("X-Token", validToken))
            .andExpect(status().isOk());
    }
    
    @Test
    void testAccessProtectedEndpoint_WithoutToken() throws Exception {
        mockMvc.perform(get("/users"))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    void testAccessPublicEndpoint_WithoutToken() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"password\"}"))
            .andExpect(status().isOk());
    }
}
```


## 用户上下文和动态菜单获取方案

### 问题 1：前端如何获取用户上下文

#### 方案设计

用户登录成功后，后端在 `LoginDto` 中返回完整的用户上下文信息，前端将其存储到 Pinia Store 中。

#### 后端实现

```java
@Data
public class LoginDto {
    private String token;
    private String refreshToken;
    private UserInfoDto userInfo;
}

@Data
public class UserInfoDto {
    private String userId;
    private String username;
    private String nickname;
    private String avatar;
    private String email;
    private String phone;
    
    // 租户和设施信息
    private String tenantId;
    private String tenantCode;
    private String tenantName;
    private String facilityId;
    private String facilityCode;
    private String facilityName;
    
    // 角色信息
    private Boolean isSystemAdmin;      // 是否系统管理员
    private Boolean isTenantAdmin;      // 是否租户管理员
    private List<RoleDto> roles;        // 用户角色列表
    
    // 权限信息
    private List<String> permissions;   // 权限标识列表（如：iam:user:add）
    private List<MenuDto> menus;        // 用户可访问的菜单列表
}
```

#### AuthApplicationService 实现

```java
@Service
@RequiredArgsConstructor
public class AuthApplicationService {
    
    private final GlobalUserRepository globalUserRepository;
    private final RoleRepository roleRepository;
    private final MenuRepository menuRepository;
    private final JwtTokenProvider jwtTokenProvider;
    
    @Transactional(readOnly = true)
    public LoginDto login(LoginCmd cmd) {
        // 1. 验证用户名密码
        GlobalUser user = globalUserRepository.findByUsername(cmd.getUsername())
            .orElseThrow(() -> new IamException(IamErrorCode.USER_NOT_FOUND));
        
        if (!passwordEncoder.matches(cmd.getPassword(), user.getPassword())) {
            throw new IamException(IamErrorCode.INVALID_CREDENTIALS);
        }
        
        // 2. 验证租户和设施权限
        if (!user.getIsSystemAdmin()) {
            if (!user.belongsToTenant(cmd.getTenantId())) {
                throw new IamException(IamErrorCode.TENANT_ACCESS_DENIED);
            }
            if (!user.belongsToFacility(cmd.getFacilityId())) {
                throw new IamException(IamErrorCode.FACILITY_ACCESS_DENIED);
            }
        }
        
        // 3. 查询用户角色
        List<Role> roles = roleRepository.findByUserIdAndTenantId(
            user.getUserId(), 
            cmd.getTenantId()
        );
        
        // 4. 判断是否租户管理员
        boolean isTenantAdmin = roles.stream()
            .anyMatch(role -> Boolean.TRUE.equals(role.getIsTenantAdmin()));
        
        // 5. 查询用户菜单
        List<Menu> menus = getMenusForUser(user, roles);
        
        // 6. 提取权限标识
        List<String> permissions = extractPermissions(menus);
        
        // 7. 更新最后登录信息
        user.setLastLoginTenantId(cmd.getTenantId());
        user.setLastLoginFacilityId(cmd.getFacilityId());
        globalUserRepository.update(user);
        
        // 8. 生成 Token
        String token = jwtTokenProvider.generateToken(user, cmd.getTenantId(), cmd.getFacilityId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());
        
        // 9. 构建返回数据
        UserInfoDto userInfo = UserInfoDto.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .nickname(user.getNickname())
            .avatar(user.getAvatar())
            .email(user.getEmail())
            .phone(user.getPhone())
            .tenantId(cmd.getTenantId())
            .tenantCode(cmd.getTenantCode())
            .facilityId(cmd.getFacilityId())
            .isSystemAdmin(user.getIsSystemAdmin())
            .isTenantAdmin(isTenantAdmin)
            .roles(roleAssembler.toDtoList(roles))
            .permissions(permissions)
            .menus(menuAssembler.toDtoList(menus))
            .build();
        
        return LoginDto.builder()
            .token(token)
            .refreshToken(refreshToken)
            .userInfo(userInfo)
            .build();
    }
    
    /**
     * 获取用户菜单
     */
    private List<Menu> getMenusForUser(GlobalUser user, List<Role> roles) {
        if (Boolean.TRUE.equals(user.getIsSystemAdmin())) {
            // 系统管理员：返回所有菜单
            return menuRepository.findAll();
        } else {
            // 普通用户：根据角色过滤菜单
            Set<Long> menuIds = roles.stream()
                .flatMap(role -> role.getMenuIds().stream())
                .collect(Collectors.toSet());
            return menuRepository.findByMenuIdIn(menuIds);
        }
    }
    
    /**
     * 提取权限标识
     */
    private List<String> extractPermissions(List<Menu> menus) {
        return menus.stream()
            .map(Menu::getPerms)
            .filter(StringUtils::isNotBlank)
            .collect(Collectors.toList());
    }
}
```

#### 前端实现

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { login, preLogin } from '@/api/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null,
  }),
  
  actions: {
    async login(loginData: LoginRequest) {
      const response = await login(loginData);
      const { token, refreshToken, userInfo } = response.data;
      
      // 保存到 state
      this.token = token;
      this.refreshToken = refreshToken;
      this.userInfo = userInfo;
      
      // 保存到 localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      return userInfo;
    },
    
    logout() {
      this.token = '';
      this.refreshToken = '';
      this.userInfo = null;
      localStorage.clear();
    },
  },
  
  getters: {
    // 是否系统管理员
    isSystemAdmin: (state) => state.userInfo?.isSystemAdmin || false,
    
    // 是否租户管理员
    isTenantAdmin: (state) => state.userInfo?.isTenantAdmin || false,
    
    // 是否登录
    isLoggedIn: (state) => !!state.token,
    
    // 获取权限列表
    permissions: (state) => state.userInfo?.permissions || [],
    
    // 获取菜单列表
    menus: (state) => state.userInfo?.menus || [],
    
    // 检查是否有某个权限
    hasPermission: (state) => (permission: string) => {
      if (state.userInfo?.isSystemAdmin) {
        return true; // 系统管理员拥有所有权限
      }
      return state.userInfo?.permissions?.includes(permission) || false;
    },
    
    // 检查是否有某些权限中的任意一个
    hasAnyPermission: (state) => (permissions: string[]) => {
      if (state.userInfo?.isSystemAdmin) {
        return true;
      }
      return permissions.some(p => state.userInfo?.permissions?.includes(p));
    },
  },
});
```

#### 使用示例

```vue
<template>
  <div>
    <!-- 显示用户信息 -->
    <div class="user-info">
      <el-avatar :src="authStore.userInfo?.avatar" />
      <span>{{ authStore.userInfo?.nickname }}</span>
      <el-tag v-if="authStore.isSystemAdmin" type="danger">系统管理员</el-tag>
      <el-tag v-else-if="authStore.isTenantAdmin" type="warning">租户管理员</el-tag>
    </div>
    
    <!-- 根据权限显示按钮 -->
    <el-button 
      v-if="authStore.hasPermission('iam:user:add')"
      type="primary"
      @click="handleAdd"
    >
      添加用户
    </el-button>
    
    <!-- 使用权限指令 -->
    <el-button v-permission="'iam:user:delete'" type="danger">
      删除用户
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const handleAdd = () => {
  // 添加用户逻辑
};
</script>
```

### 问题 2：如何获取动态菜单列表

#### 方案设计

动态菜单列表在用户登录时一次性返回，前端根据菜单数据动态生成路由和侧边栏菜单。

#### 菜单数据结构

```typescript
interface MenuDto {
  menuId: number;
  menuName: string;
  parentId: number;
  menuType: 'M' | 'C' | 'F';  // M-目录, C-菜单, F-按钮
  path: string;
  component: string;
  icon: string;
  orderNum: number;
  visible: '0' | '1';
  status: '0' | '1';
  perms: string;
  children?: MenuDto[];
}
```

#### 后端菜单树构建

```java
@Service
@RequiredArgsConstructor
public class MenuApplicationService {
    
    private final MenuRepository menuRepository;
    
    /**
     * 构建菜单树
     */
    public List<MenuTreeDto> buildMenuTree(List<Menu> menus) {
        // 1. 按 parentId 分组
        Map<Long, List<Menu>> menuMap = menus.stream()
            .collect(Collectors.groupingBy(Menu::getParentId));
        
        // 2. 构建树形结构
        List<MenuTreeDto> tree = new ArrayList<>();
        List<Menu> rootMenus = menuMap.getOrDefault(0L, Collections.emptyList());
        
        for (Menu menu : rootMenus) {
            MenuTreeDto node = menuAssembler.toTreeDto(menu);
            buildChildren(node, menuMap);
            tree.add(node);
        }
        
        // 3. 按 orderNum 排序
        sortMenuTree(tree);
        
        return tree;
    }
    
    private void buildChildren(MenuTreeDto parent, Map<Long, List<Menu>> menuMap) {
        List<Menu> children = menuMap.getOrDefault(parent.getMenuId(), Collections.emptyList());
        if (children.isEmpty()) {
            return;
        }
        
        List<MenuTreeDto> childNodes = new ArrayList<>();
        for (Menu child : children) {
            MenuTreeDto node = menuAssembler.toTreeDto(child);
            buildChildren(node, menuMap);
            childNodes.add(node);
        }
        
        parent.setChildren(childNodes);
    }
    
    private void sortMenuTree(List<MenuTreeDto> tree) {
        tree.sort(Comparator.comparing(MenuTreeDto::getOrderNum));
        tree.forEach(node -> {
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                sortMenuTree(node.getChildren());
            }
        });
    }
}
```

#### 前端动态路由生成

```typescript
// router/dynamicRoutes.ts
import { RouteRecordRaw } from 'vue-router';
import { MenuDto } from '@/types/menu';

/**
 * 根据菜单生成动态路由
 */
export function generateRoutes(menus: MenuDto[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];
  
  for (const menu of menus) {
    // 只处理目录和菜单类型
    if (menu.menuType === 'M' || menu.menuType === 'C') {
      const route = generateRoute(menu);
      if (route) {
        routes.push(route);
      }
    }
  }
  
  return routes;
}

function generateRoute(menu: MenuDto): RouteRecordRaw | null {
  if (!menu.path) {
    return null;
  }
  
  const route: RouteRecordRaw = {
    path: menu.path,
    name: menu.menuName,
    meta: {
      title: menu.menuName,
      icon: menu.icon,
      hidden: menu.visible === '1',
      permissions: menu.perms ? [menu.perms] : [],
    },
  };
  
  // 目录类型
  if (menu.menuType === 'M') {
    route.component = () => import('@/layout/index.vue');
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children
        .map(child => generateRoute(child))
        .filter(r => r !== null) as RouteRecordRaw[];
    }
  }
  // 菜单类型
  else if (menu.menuType === 'C') {
    if (menu.component) {
      route.component = loadComponent(menu.component);
    }
  }
  
  return route;
}

function loadComponent(componentPath: string) {
  // 动态加载组件
  return () => import(`@/${componentPath}.vue`);
}
```

#### 前端侧边栏菜单生成

```vue
<!-- components/Sidebar/index.vue -->
<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="isCollapse"
    :unique-opened="true"
    mode="vertical"
  >
    <sidebar-item
      v-for="menu in visibleMenus"
      :key="menu.menuId"
      :menu="menu"
    />
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import SidebarItem from './SidebarItem.vue';

const route = useRoute();
const authStore = useAuthStore();

// 过滤可见菜单
const visibleMenus = computed(() => {
  return authStore.menus.filter(menu => 
    menu.visible === '0' && 
    (menu.menuType === 'M' || menu.menuType === 'C')
  );
});

// 当前激活的菜单
const activeMenu = computed(() => route.path);

// 是否折叠
const isCollapse = computed(() => authStore.sidebarCollapsed);
</script>
```

```vue
<!-- components/Sidebar/SidebarItem.vue -->
<template>
  <!-- 有子菜单 -->
  <el-sub-menu v-if="hasChildren" :index="menu.path">
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="menu.icon" />
      </el-icon>
      <span>{{ menu.menuName }}</span>
    </template>
    
    <sidebar-item
      v-for="child in menu.children"
      :key="child.menuId"
      :menu="child"
    />
  </el-sub-menu>
  
  <!-- 无子菜单 -->
  <el-menu-item v-else :index="menu.path" @click="handleClick">
    <el-icon v-if="menu.icon">
      <component :is="menu.icon" />
    </el-icon>
    <template #title>
      <span>{{ menu.menuName }}</span>
    </template>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { MenuDto } from '@/types/menu';

const props = defineProps<{
  menu: MenuDto
}>();

const router = useRouter();

const hasChildren = computed(() => 
  props.menu.children && 
  props.menu.children.length > 0 &&
  props.menu.children.some(child => child.visible === '0')
);

const handleClick = () => {
  if (props.menu.path) {
    router.push(props.menu.path);
  }
};
</script>
```

#### 登录后初始化流程

```typescript
// App.vue 或 router/index.ts
import { useAuthStore } from '@/stores/auth';
import { generateRoutes } from '@/router/dynamicRoutes';

async function initApp() {
  const authStore = useAuthStore();
  
  // 如果已登录，生成动态路由
  if (authStore.isLoggedIn && authStore.userInfo) {
    const dynamicRoutes = generateRoutes(authStore.userInfo.menus);
    
    // 添加动态路由到路由器
    dynamicRoutes.forEach(route => {
      router.addRoute(route);
    });
  }
}

// 在应用启动时初始化
initApp();
```

### 完整登录流程示例

```typescript
// views/login/index.vue
async function handleLogin() {
  try {
    // 1. 预登录
    const preLoginResult = await preLogin({
      username: form.username,
      password: form.password,
    });
    
    // 2. 选择租户和设施（如果需要）
    const { tenantCode, facilityId } = await selectTenantAndFacility(preLoginResult);
    
    // 3. 正式登录
    const loginResult = await authStore.login({
      username: form.username,
      password: form.password,
      tenantCode,
      facilityId,
    });
    
    // 4. 生成动态路由
    const dynamicRoutes = generateRoutes(loginResult.menus);
    dynamicRoutes.forEach(route => router.addRoute(route));
    
    // 5. 跳转到首页
    router.push('/');
    
    ElMessage.success('登录成功');
  } catch (error) {
    ElMessage.error(error.message || '登录失败');
  }
}
```

### 总结

#### 用户上下文获取方案

1. **后端**：登录时返回完整的用户上下文（isSystemAdmin、isTenantAdmin、roles、permissions、menus）
2. **前端**：将用户上下文存储到 Pinia Store 和 localStorage
3. **使用**：通过 authStore 的 getters 方便地访问用户上下文

#### 动态菜单获取方案

1. **后端**：根据用户角色过滤菜单，构建菜单树
2. **前端**：登录时接收菜单数据，动态生成路由和侧边栏
3. **优势**：
   - 一次性加载，无需额外请求
   - 前端根据菜单数据动态生成路由
   - 支持权限控制和菜单隐藏

#### 简化的用户和角色管理

**用户管理**：
- 创建/编辑用户（基本信息）
- 启用/禁用用户
- 分配角色
- 编辑租户列表
- 编辑设施列表

**角色管理**：
- 创建/编辑角色（基本信息）
- 分配菜单
- 启用/禁用角色

这种设计确保了：
- 用户登录后立即获得完整的上下文信息
- 前端可以根据权限动态显示/隐藏功能
- 菜单和路由根据用户权限动态生成
- 简化的管理界面，只保留核心功能
