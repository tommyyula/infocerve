# IAM 用户体系重构 - 任务详细分析

## 说明

本文档对 IAM 用户体系重构项目的每个任务进行详细分析，包括：
- 需求功能说明
- 功能约束与关系
- 使用场景
- 示例说明

---

## 数据库重建任务组

### 任务 1：删除 Central 相关表

#### 需求功能说明
删除所有与 CentralUser 相关的数据库表，为新的用户体系做准备。

**需求来源**：需求 15.1

#### 功能约束与关系

**数据约束**：
- 需要删除的表：
  - `iam_central_user`
  - `iam_central_role`
  - `iam_central_menu`
  - `iam_central_user_role`
  - `iam_central_role_menu`

**依赖关系**：
- 无前置依赖
- 是所有后续数据库任务的前置条件

**其他约束**：
- 后续会重新建表，不需要备份数据
- 确保没有外键约束阻止删除

#### 使用场景
1. 数据库管理员执行删除脚本
2. 清理旧的 Central 相关表结构

#### 示例说明

**SQL 脚本**：
```sql
-- 删除关联表
DROP TABLE IF EXISTS iam_central_user_role;
DROP TABLE IF EXISTS iam_central_role_menu;

-- 删除主表
DROP TABLE IF EXISTS iam_central_user;
DROP TABLE IF EXISTS iam_central_role;
DROP TABLE IF EXISTS iam_central_menu;
```

---

### 任务 2：创建 global_user 表

#### 需求功能说明
创建统一的 global_user 表，支持多租户、多设施的用户模型。

**需求来源**：需求 1, 需求 15.2

#### 功能约束与关系

**数据约束**：
- `user_id`：BIGINT，主键，雪花算法生成
- `username`：VARCHAR(64)，非空，与 tenant_id 组合唯一
- `password`：VARCHAR(255)，非空，BCrypt 加密
- `tenant_ids`：JSON，用户所属租户列表
- `facility_ids`：JSON，用户可访问设施列表
- `is_system_admin`：TINYINT(1)，是否系统管理员，默认 0
- `last_login_tenant_id`：BIGINT，上次登录租户
- `last_login_facility_id`：VARCHAR(64)，上次登录设施编码
- `email`：VARCHAR(128)，邮箱（仅显示）
- `phone`：VARCHAR(32)，手机号（仅显示）
- `nickname`：VARCHAR(64)，昵称
- `avatar`：VARCHAR(255)，头像 URL
- `status`：TINYINT(1)，状态（0-启用，1-禁用）
- `del_flag`：TINYINT(1)，删除标志（0-未删除，1-已删除）

**状态约束**：
- 新建用户默认 status = 0（启用）
- 删除用户设置 del_flag = 1（逻辑删除）

**唯一性约束**：
- SystemAdmin（is_system_admin = 1）：username 全局唯一
- 普通用户：username + tenant_id 组合唯一

**依赖关系**：
- 依赖任务 1（删除 Central 相关表）

#### 使用场景
1. 系统管理员创建新用户
2. 用户登录时查询用户信息
3. 用户更新个人信息
4. 管理员将用户添加到租户

#### 示例说明

**表结构 DDL**：
```sql
CREATE TABLE global_user (
    user_id BIGINT PRIMARY KEY COMMENT '用户ID（雪花算法）',
    username VARCHAR(64) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    tenant_ids JSON COMMENT '用户所属租户ID列表',
    facility_ids JSON COMMENT '用户可访问设施ID列表',
    is_system_admin TINYINT(1) DEFAULT 0 COMMENT '是否系统管理员',
    last_login_tenant_id BIGINT COMMENT '上次登录租户ID',
    last_login_facility_id VARCHAR(64) COMMENT '上次登录设施编码',
    email VARCHAR(128) COMMENT '邮箱',
    phone VARCHAR(32) COMMENT '手机号',
    nickname VARCHAR(64) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    status TINYINT(1) DEFAULT 0 COMMENT '状态（0-启用，1-禁用）',
    del_flag TINYINT(1) DEFAULT 0 COMMENT '删除标志（0-未删除，1-已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_del_flag (del_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局用户表';
```

**数据示例**：
```json
// SystemAdmin 示例
{
  "userId": 1,
  "username": "admin",
  "password": "$2a$10$...",
  "tenantIds": null,
  "facilityIds": null,
  "isSystemAdmin": 1,
  "status": 0
}

// 普通用户示例
{
  "userId": 1234567890123456789,
  "username": "zhangsan",
  "password": "$2a$10$...",
  "tenantIds": ["T001", "T002"],
  "facilityIds": ["F001", "F002", "F003"],
  "isSystemAdmin": 0,
  "lastLoginTenantId": "T001",
  "lastLoginFacilityId": "WH001",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "nickname": "张三",
  "status": 0
}
```

---

### 任务 3：修改 iam_menu 表（删除 tenantId）

#### 需求功能说明
修改 iam_menu 表，删除 tenantId 字段，使菜单全局共享。

**需求来源**：需求 6, 需求 15.3

#### 功能约束与关系

**数据约束**：
- 删除 `tenant_id` 字段
- 保留其他字段不变
- 菜单全局共享，不属于任何租户

**依赖关系**：
- 依赖任务 1（删除 Central 相关表）

#### 使用场景
1. SystemAdmin 创建全局菜单
2. 用户根据角色查询可访问的菜单

#### 示例说明

**SQL 脚本**：
```sql
-- 删除 tenant_id 字段
ALTER TABLE iam_menu DROP COLUMN IF EXISTS tenant_id;
```

---

### 任务 4：修改 iam_role 表（添加 isTenantAdmin）

#### 需求功能说明
修改 iam_role 表，添加 isTenantAdmin 字段，支持租户超管角色。

**需求来源**：需求 7, 需求 15.4

#### 功能约束与关系

**数据约束**：
- 添加 `is_tenant_admin` 字段：TINYINT(1)，默认 0
- 租户超管角色：is_tenant_admin = 1, tenant_id = null
- 普通租户角色：is_tenant_admin = 0, tenant_id = 具体租户ID

**依赖关系**：
- 依赖任务 1（删除 Central 相关表）

#### 使用场景
1. SystemAdmin 创建租户超管角色
2. 租户管理员创建租户内的普通角色

#### 示例说明

**SQL 脚本**：
```sql
-- 添加 is_tenant_admin 字段
ALTER TABLE iam_role 
ADD COLUMN is_tenant_admin TINYINT(1) DEFAULT 0 COMMENT '是否租户管理员角色';
```

**数据示例**：
```json
// 租户超管角色
{
  "roleId": 1,
  "roleName": "租户管理员",
  "tenantId": null,
  "isTenantAdmin": 1
}

// 普通租户角色
{
  "roleId": 2,
  "roleName": "仓库管理员",
  "tenantId": "T001",
  "isTenantAdmin": 0
}
```

---

### 任务 5：创建初始化数据

#### 需求功能说明
创建系统初始化数据，包括超级管理员、默认角色、基础菜单。

**需求来源**：需求 15.6

#### 功能约束与关系

**数据约束**：
- 超级管理员：username = "admin", is_system_admin = 1
- 默认密码：使用 BCrypt 加密
- 基础菜单：系统管理、用户管理、角色管理、菜单管理

**依赖关系**：
- 依赖任务 2（创建 global_user 表）
- 依赖任务 3（修改 iam_menu 表）
- 依赖任务 4（修改 iam_role 表）

#### 使用场景
1. 系统首次部署时执行初始化脚本
2. 测试环境重置数据时执行

#### 示例说明

**SQL 脚本**：
```sql
-- 插入超级管理员（密码：admin123）
INSERT INTO global_user (user_id, username, password, is_system_admin, status, del_flag)
VALUES (1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 1, 0, 0);

-- 插入租户超管角色
INSERT INTO iam_role (role_id, role_name, role_code, tenant_id, is_tenant_admin, status)
VALUES (1, '租户管理员', 'TENANT_ADMIN', NULL, 1, 0);

-- 插入基础菜单
INSERT INTO iam_menu (menu_id, menu_name, parent_id, menu_type, path, order_num, status)
VALUES 
(1, '系统管理', 0, 'M', '/system', 1, 0),
(2, '用户管理', 1, 'C', '/system/user', 1, 0),
(3, '角色管理', 1, 'C', '/system/role', 2, 0),
(4, '菜单管理', 1, 'C', '/system/menu', 3, 0);
```

---

## 后端 Domain 层开发任务组

### 任务 6：实现 GlobalUser 实体（充血模型）

#### 需求功能说明
实现 GlobalUser 实体，包含所有用户信息和业务逻辑（充血模型）。

**需求来源**：需求 1, 需求 3, 需求 4, 需求 8

#### 功能约束与关系

**业务规则**：
- 用户名在租户内唯一（username + tenantId 组合唯一）
- SystemAdmin 的用户名全局唯一
- 密码使用 BCrypt 加密
- 支持多租户、多设施

**状态转换**：
- 启用用户：status = 0
- 禁用用户：status = 1
- 逻辑删除：del_flag = 1

**依赖关系**：
- 依赖任务 2（创建 global_user 表）

#### 使用场景
1. 创建新用户
2. 用户登录验证
3. 更新用户信息
4. 将用户添加到租户
5. 启用/禁用用户
6. 修改密码

#### 示例说明

**实体类结构**：
```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("global_user")
public class GlobalUser extends BaseEntity {
    
    @TableId(type = IdType.ASSIGN_ID)
    private Long userId;
    
    private String username;
    private String password;
    
    @JsonTableField
    private List<String> tenantIds;
    
    @JsonTableField
    private List<String> facilityIds;
    
    private Boolean isSystemAdmin;
    private Long lastLoginTenantId;
    private Long lastLoginFacilityId;
    
    private String email;
    private String phone;
    private String nickname;
    private String avatar;
    private Integer status;
    
    // ============================================
    // 业务方法（充血模型的核心）
    // ============================================
    
    /**
     * 创建用户（工厂方法）
     * 验证：需求 1.1
     */
    public static GlobalUser create(String username, String password, Boolean isSystemAdmin) {
        // 业务逻辑：创建用户并初始化
    }
    
    /**
     * 启用用户
     * 验证：需求 8
     */
    public void enable() {
        // 业务逻辑：状态转换
    }
    
    /**
     * 禁用用户
     * 验证：需求 8
     */
    public void disable() {
        // 业务逻辑：状态转换
    }
    
    /**
     * 添加到租户
     * 验证：需求 3.2
     */
    public void addToTenant(String tenantId) {
        // 业务逻辑：添加租户关联
    }
    
    /**
     * 从租户移除
     * 验证：需求 3.5, 3.6
     */
    public void removeFromTenant(String tenantId) {
        // 业务逻辑：移除租户关联
    }
    
    /**
     * 更新最后登录信息
     * 验证：需求 2.9
     */
    public void updateLastLogin(Long tenantId, Long facilityId) {
        // 业务逻辑：更新登录信息
    }
    
    /**
     * 验证密码
     * 验证：需求 2.1
     */
    public boolean verifyPassword(String rawPassword) {
        // 业务逻辑：密码验证
    }
    
    /**
     * 修改密码
     * 验证：需求 8.4, 8.5
     */
    public void changePassword(String oldPassword, String newPassword) {
        // 业务逻辑：密码修改
    }
    
    /**
     * 判断是否属于租户
     * 验证：需求 3
     */
    public boolean belongsToTenant(String tenantId) {
        // 业务逻辑：租户关联判断
    }
    
    /**
     * 判断是否可以访问设施
     * 验证：需求 2.7
     */
    public boolean canAccessFacility(String facilityId) {
        // 业务逻辑：设施权限判断
    }
}
```

---

### 任务 7：实现 Role 实体（充血模型）

#### 需求功能说明
实现 Role 实体，包含角色信息和业务逻辑（充血模型）。

**需求来源**：需求 7

#### 功能约束与关系

**业务规则**：
- 租户超管角色：is_tenant_admin = 1, tenant_id = null
- 普通租户角色：is_tenant_admin = 0, tenant_id = 具体租户ID

**依赖关系**：
- 依赖任务 4（修改 iam_role 表）

#### 使用场景
1. 创建角色
2. 更新角色信息
3. 启用/禁用角色
4. 判断角色类型

#### 示例说明

**实体类结构**：
```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_role")
public class Role extends BaseEntity {
    
    @TableId(type = IdType.AUTO)
    private Long roleId;
    
    private String roleName;
    private String roleCode;
    private Long tenantId;
    private Boolean isTenantAdmin;
    private String remark;
    private Integer status;
    
    // ============================================
    // 业务方法（充血模型）
    // ============================================
    
    /**
     * 创建租户超管角色（工厂方法）
     * 验证：需求 7.1
     */
    public static Role createTenantAdminRole(String roleName, String roleCode) {
        // 业务逻辑
    }
    
    /**
     * 创建普通租户角色（工厂方法）
     * 验证：需求 7.2, 7.3
     */
    public static Role createTenantRole(String roleName, String roleCode, Long tenantId) {
        // 业务逻辑
    }
    
    /**
     * 判断是否为租户超管角色
     * 验证：需求 7.1
     */
    public boolean isTenantAdminRole() {
        // 业务逻辑
    }
}
```

---

### 任务 8：实现 Menu 实体（充血模型）

#### 需求功能说明
实现 Menu 实体，包含菜单信息和业务逻辑（充血模型）。

**需求来源**：需求 6

#### 功能约束与关系

**业务规则**：
- 菜单全局共享，不属于任何租户
- 菜单采用树形结构
- SystemAdmin 可以访问所有菜单
- 菜单包含 API 路径列表（用于权限验证）

**依赖关系**：
- 依赖任务 3（修改 iam_menu 表）

#### 使用场景
1. 创建菜单
2. 更新菜单信息
3. 管理 API 路径
4. 判断菜单类型

#### 示例说明

**实体类结构**：
```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_menu")
public class Menu extends BaseEntity {
    
    @TableId(type = IdType.AUTO)
    private Long menuId;
    
    private String menuName;
    private Long parentId;
    private String menuType;  // M-目录, C-菜单, F-按钮
    private String path;
    private String component;
    private String icon;
    
    @JsonTableField
    private List<String> apiPaths;
    
    private Integer orderNum;
    private Integer status;
    
    // ============================================
    // 业务方法（充血模型）
    // ============================================
    
    /**
     * 创建目录菜单（工厂方法）
     * 验证：需求 6.3
     */
    public static Menu createDirectory(String menuName, Long parentId, String path, Integer orderNum) {
        // 业务逻辑
    }
    
    /**
     * 创建菜单（工厂方法）
     * 验证：需求 6.3
     */
    public static Menu createMenu(String menuName, Long parentId, String path, 
                                   String component, List<String> apiPaths, Integer orderNum) {
        // 业务逻辑
    }
    
    /**
     * 添加 API 路径
     * 验证：需求 13.10
     */
    public void addApiPath(String apiPath) {
        // 业务逻辑
    }
    
    /**
     * 移除 API 路径
     * 验证：需求 13.10
     */
    public void removeApiPath(String apiPath) {
        // 业务逻辑
    }
}
```

---

### 任务 9：实现 Tenant 实体（充血模型）

#### 需求功能说明
实现 Tenant 实体，包含租户信息和业务逻辑（充血模型）。

**需求来源**：需求 19

#### 功能约束与关系

**业务规则**：
- tenantCode 全局唯一
- SystemAdmin 可以创建、更新、禁用、删除租户
- TenantAdmin 可以更新租户 profile

**依赖关系**：
- 需要创建 iam_tenant 表

#### 使用场景
1. 创建租户
2. 更新租户信息
3. 更新租户 profile
4. 启用/禁用租户

#### 示例说明

**实体类结构**：
```java
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("iam_tenant")
public class Tenant extends BaseEntity {
    
    @TableId(type = IdType.AUTO)
    private Long tenantId;
    
    private String tenantCode;
    private String tenantName;
    private String logo;
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private Integer status;
    
    // ============================================
    // 业务方法（充血模型）
    // ============================================
    
    /**
     * 创建租户（工厂方法）
     * 验证：需求 19.1, 19.2
     */
    public static Tenant create(String tenantCode, String tenantName) {
        Tenant tenant = new Tenant();
        tenant.setTenantCode(tenantCode);
        tenant.setTenantName(tenantName);
        tenant.setStatus(IamConstants.Status.ENABLED);
        return tenant;
    }
    
    /**
     * 更新 profile（TenantAdmin 可以调用）
     * 验证：需求 19.5
     */
    public void updateProfile(String tenantName, String logo, 
                             String contactPerson, String contactPhone, String contactEmail) {
        if (StringUtils.isNotBlank(tenantName)) {
            this.tenantName = tenantName;
        }
        if (StringUtils.isNotBlank(logo)) {
            this.logo = logo;
        }
        if (StringUtils.isNotBlank(contactPerson)) {
            this.contactPerson = contactPerson;
        }
        if (StringUtils.isNotBlank(contactPhone)) {
            this.contactPhone = contactPhone;
        }
        if (StringUtils.isNotBlank(contactEmail)) {
            this.contactEmail = contactEmail;
        }
    }
    
    /**
     * 启用租户
     * 验证：需求 19.7
     */
    public void enable() {
        if (IamConstants.Status.ENABLED.equals(this.status)) {
            throw new IamException(IamErrorCode.TENANT_ALREADY_ENABLED);
        }
        this.status = IamConstants.Status.ENABLED;
    }
    
    /**
     * 禁用租户
     * 验证：需求 19.7
     */
    public void disable() {
        if (IamConstants.Status.DISABLED.equals(this.status)) {
            throw new IamException(IamErrorCode.TENANT_ALREADY_DISABLED);
        }
        this.status = IamConstants.Status.DISABLED;
    }
}
```

---

## 总结

本文档详细分析了 IAM 用户体系重构项目的前 9 个任务，包括：
- 数据库重建任务（任务 1-5）
- 后端 Domain 层开发任务（任务 6-9）
  - GlobalUser 实体（任务 6）
  - Role 实体（任务 7）
  - Menu 实体（任务 8）
  - Tenant 实体（任务 9）

每个任务都包含了：
- 需求功能说明（明确任务目标）
- 功能约束与关系（数据约束、业务规则、依赖关系）
- 使用场景（实际应用场景）
- 示例说明（代码示例或 SQL 脚本）

后续任务（任务 10 及以后）将在下一部分继续分析。

---

## 后端 Repository 层开发任务组

### 任务 9：实现 GlobalUserRepository

#### 需求功能说明
实现 GlobalUserRepository，提供用户数据访问接口。

**需求来源**：需求 1, 需求 3, 需求 4

#### 功能约束与关系

**数据约束**：
- 查询时需要过滤 del_flag = 0 的记录
- 用户名查询需要考虑租户隔离

**业务规则**：
- username + tenantId 组合唯一
- SystemAdmin 的 username 全局唯一

**依赖关系**：
- 依赖任务 6（实现 GlobalUser 实体）

#### 使用场景
1. 根据用户名查询用户
2. 根据用户ID查询用户
3. 查询租户内的所有用户
4. 验证用户名在租户内是否唯一

#### 示例说明

**Repository 接口**：
```java
public interface GlobalUserRepository {
    
    /**
     * 根据用户ID查询用户
     * 验证：需求 1.5
     */
    Optional<GlobalUser> findById(Long userId);
    
    /**
     * 根据用户名查询用户（不考虑租户）
     * 验证：需求 2.1
     */
    Optional<GlobalUser> findByUsername(String username);
    
    /**
     * 查询租户内的所有用户
     * 验证：需求 3.1
     */
    List<GlobalUser> findByTenantId(String tenantId);
    
    /**
     * 验证用户名在租户内是否唯一
     * 验证：需求 4.2
     */
    boolean isUsernameUniqueInTenant(String username, String tenantId, Long excludeUserId);
    
    /**
     * 保存用户
     * 验证：需求 1.1
     */
    void save(GlobalUser user);
    
    /**
     * 更新用户
     * 验证：需求 1.2
     */
    void update(GlobalUser user);
    
    /**
     * 删除用户（逻辑删除）
     */
    void delete(Long userId);
}
```

---

### 任务 10：实现 RoleRepository

#### 需求功能说明
实现 RoleRepository，提供角色数据访问接口。

**需求来源**：需求 7

#### 功能约束与关系

**数据约束**：
- 查询时需要过滤 del_flag = 0 的记录
- 角色查询需要考虑租户隔离

**依赖关系**：
- 依赖任务 7（实现 Role 实体）

#### 使用场景
1. 根据角色ID查询角色
2. 查询租户内的所有角色
3. 查询租户超管角色
4. 查询用户的角色列表

#### 示例说明

**Repository 接口**：
```java
public interface RoleRepository {
    
    /**
     * 根据角色ID查询角色
     * 验证：需求 7.5
     */
    Optional<Role> findById(Long roleId);
    
    /**
     * 查询租户内的所有角色
     * 验证：需求 7.3
     */
    List<Role> findByTenantId(Long tenantId);
    
    /**
     * 查询租户超管角色
     * 验证：需求 7.1
     */
    List<Role> findTenantAdminRoles();
    
    /**
     * 查询用户的角色列表
     * 验证：需求 7.5
     */
    List<Role> findByUserId(Long userId);
    
    /**
     * 保存角色
     * 验证：需求 7.2
     */
    void save(Role role);
    
    /**
     * 更新角色
     */
    void update(Role role);
    
    /**
     * 删除角色（逻辑删除）
     */
    void delete(Long roleId);
}
```

---

### 任务 11：实现 MenuRepository

#### 需求功能说明
实现 MenuRepository，提供菜单数据访问接口。

**需求来源**：需求 6

#### 功能约束与关系

**数据约束**：
- 查询时需要过滤 del_flag = 0 的记录
- 菜单采用树形结构

**业务规则**：
- 菜单全局共享，不属于任何租户
- SystemAdmin 可以访问所有菜单

**依赖关系**：
- 依赖任务 8（实现 Menu 实体）

#### 使用场景
1. 根据菜单ID查询菜单
2. 查询所有菜单
3. 查询用户可访问的菜单
4. 查询菜单树

#### 示例说明

**Repository 接口**：
```java
public interface MenuRepository {
    
    /**
     * 根据菜单ID查询菜单
     * 验证：需求 6.3
     */
    Optional<Menu> findById(Long menuId);
    
    /**
     * 查询所有菜单
     * 验证：需求 6.1
     */
    List<Menu> findAll();
    
    /**
     * 根据父菜单ID查询子菜单
     */
    List<Menu> findByParentId(Long parentId);
    
    /**
     * 查询用户可访问的菜单
     * 验证：需求 6.2
     */
    List<Menu> findByUserId(Long userId);
    
    /**
     * 保存菜单
     * 验证：需求 6.3
     */
    void save(Menu menu);
    
    /**
     * 更新菜单
     * 验证：需求 6.3
     */
    void update(Menu menu);
    
    /**
     * 删除菜单（逻辑删除）
     * 验证：需求 6.4
     */
    void delete(Long menuId);
}
```

---

### 任务 12：实现 TenantRepository

#### 需求功能说明
实现 TenantRepository，提供租户数据访问接口。

**需求来源**：需求 19

#### 功能约束与关系

**数据约束**：
- 查询时需要过滤 del_flag = 0 的记录
- tenantCode 全局唯一

**依赖关系**：
- 依赖任务 2（创建 global_user 表，需要租户表支持）

#### 使用场景
1. 根据租户ID查询租户
2. 根据租户编码查询租户
3. 查询所有租户
4. 验证租户编码是否唯一

#### 示例说明

**Repository 接口**：
```java
public interface TenantRepository {
    
    /**
     * 根据租户ID查询租户
     * 验证：需求 19.12
     */
    Optional<Tenant> findById(Long tenantId);
    
    /**
     * 根据租户编码查询租户
     * 验证：需求 19.11
     */
    Optional<Tenant> findByCode(String tenantCode);
    
    /**
     * 查询所有租户
     * 验证：需求 19.9
     */
    List<Tenant> findAll();
    
    /**
     * 根据租户ID列表查询租户
     * 验证：需求 2.2
     */
    List<Tenant> findByIds(List<String> tenantIds);
    
    /**
     * 验证租户编码是否唯一
     * 验证：需求 19.11
     */
    boolean isTenantCodeUnique(String tenantCode, Long excludeTenantId);
    
    /**
     * 保存租户
     * 验证：需求 19.1
     */
    void save(Tenant tenant);
    
    /**
     * 更新租户
     * 验证：需求 19.3
     */
    void update(Tenant tenant);
    
    /**
     * 删除租户（逻辑删除）
     * 验证：需求 19.8
     */
    void delete(Long tenantId);
}
```

---

## 后端 Application Service 层开发任务组

### 任务 13：实现 AuthApplicationService（PreLogin、Login）

#### 需求功能说明
实现认证应用服务，包括预登录和正式登录功能。

**需求来源**：需求 2

#### 功能约束与关系

**业务规则**：
- 用户名和密码验证
- 租户和设施权限验证
- SystemAdmin 可以不选择租户和设施
- 更新最后登录信息

**依赖关系**：
- 依赖任务 9（实现 GlobalUserRepository）
- 依赖任务 12（实现 TenantRepository）

#### 使用场景
1. 用户预登录，选择租户和设施
2. 用户正式登录，获取 Token
3. SystemAdmin 登录

#### 示例说明

**Service 接口**：
```java
public interface AuthApplicationService {
    
    /**
     * 预登录
     * 验证：需求 2.1, 2.2
     */
    PreLoginDto preLogin(PreLoginCmd cmd);
    
    /**
     * 正式登录
     * 验证：需求 2.7, 2.8, 2.9
     */
    LoginDto login(LoginCmd cmd);
    
    /**
     * 刷新 Token
     */
    LoginDto refreshToken(String refreshToken);
    
    /**
     * 登出
     */
    void logout(String token);
}
```

**PreLogin 实现要点**：
```java
@Override
public PreLoginDto preLogin(PreLoginCmd cmd) {
    // 1. 查询用户并验证密码
    // 2. 检查用户状态
    // 3. 查询用户的租户列表
    // 4. 查询用户的设施列表（从 facilityIds 获取）
    // 5. 确定建议的租户（需求 2.3, 2.4）
    // 6. 确定建议的设施（需求 2.5, 2.6）
    // 7. 返回结果
}
```

**Login 实现要点**：
```java
@Override
public LoginDto login(LoginCmd cmd) {
    // 1. 查询用户并验证密码
    // 2. 检查用户状态
    // 3. 如果不是 SystemAdmin，验证租户和设施权限（需求 2.7）
    // 4. 查询租户信息
    // 5. 更新最后登录信息（需求 2.9）
    // 6. 生成 Token（需求 2.8）
    // 7. 返回结果
}
```

---

### 任务 14：实现 UserApplicationService（用户管理）

#### 需求功能说明
实现用户管理应用服务，包括用户的 CRUD 操作。

**需求来源**：需求 1, 需求 3, 需求 8

#### 功能约束与关系

**业务规则**：
- 创建用户时验证用户名在租户内唯一
- 更新用户时不允许修改 username 和 userId
- 添加用户到租户时验证用户名唯一性
- 删除用户时使用逻辑删除

**依赖关系**：
- 依赖任务 9（实现 GlobalUserRepository）

#### 使用场景
1. 创建新用户
2. 更新用户信息
3. 删除用户
4. 查询用户列表
5. 将用户添加到租户
6. 从租户移除用户

#### 示例说明

**Service 接口**：
```java
public interface UserApplicationService {
    
    /**
     * 创建用户
     * 验证：需求 1.1, 1.2, 1.3, 1.4
     */
    UserDto createUser(CreateUserCmd cmd);
    
    /**
     * 更新用户
     * 验证：需求 8.2, 8.3
     */
    UserDto updateUser(Long userId, UpdateUserCmd cmd);
    
    /**
     * 删除用户
     */
    void deleteUser(Long userId);
    
    /**
     * 查询用户详情
     * 验证：需求 8.1
     */
    UserDto getUser(Long userId);
    
    /**
     * 查询用户列表（根据角色返回不同范围）
     * 验证：需求 18.1, 18.2, 18.3
     */
    PageDto<UserDto> listUsers(ListUsersQuery query);
    
    /**
     * 将用户添加到租户
     * 验证：需求 3.2, 3.3, 3.4
     */
    void addUserToTenant(Long userId, String tenantId);
    
    /**
     * 从租户移除用户
     * 验证：需求 3.5, 3.6
     */
    void removeUserFromTenant(Long userId, String tenantId);
    
    /**
     * 修改密码
     * 验证：需求 8.4, 8.5
     */
    void changePassword(Long userId, ChangePasswordCmd cmd);
}
```

**listUsers 实现要点**（租户隔离策略）：
```java
@Override
public PageDto<UserDto> listUsers(ListUsersQuery query) {
    if (TokenHolder.isSystemAdmin()) {
        // SystemAdmin：返回所有用户（需求 18.1）
        return userRepository.findAll(query);
    } else {
        // 非 SystemAdmin：返回当前租户的用户（需求 18.2, 18.3）
        Long tenantId = TokenHolder.getTenantId();
        return userRepository.findByTenantId(tenantId, query);
    }
}
```

---

### 任务 15：实现 RoleApplicationService（角色管理）

#### 需求功能说明
实现角色管理应用服务，包括角色的 CRUD 操作。

**需求来源**：需求 7

#### 功能约束与关系

**业务规则**：
- SystemAdmin 可以创建租户超管角色和租户角色
- 非 SystemAdmin 只能创建自己租户内的角色
- 删除角色时检查是否有用户关联

**依赖关系**：
- 依赖任务 10（实现 RoleRepository）

#### 使用场景
1. 创建角色
2. 更新角色信息
3. 删除角色
4. 查询角色列表
5. 为用户分配角色

#### 示例说明

**Service 接口**：
```java
public interface RoleApplicationService {
    
    /**
     * 创建角色
     * 验证：需求 7.1, 7.2, 7.3
     */
    RoleDto createRole(CreateRoleCmd cmd);
    
    /**
     * 更新角色
     */
    RoleDto updateRole(Long roleId, UpdateRoleCmd cmd);
    
    /**
     * 删除角色
     */
    void deleteRole(Long roleId);
    
    /**
     * 查询角色详情
     */
    RoleDto getRole(Long roleId);
    
    /**
     * 查询角色列表（根据角色返回不同范围）
     * 验证：需求 18.4, 18.5, 18.6
     */
    List<RoleDto> listRoles(ListRolesQuery query);
    
    /**
     * 为用户分配角色
     * 验证：需求 7.4
     */
    void assignRoleToUser(Long userId, Long roleId);
    
    /**
     * 移除用户的角色
     */
    void removeRoleFromUser(Long userId, Long roleId);
}
```

**listRoles 实现要点**（租户隔离策略）：
```java
@Override
public List<RoleDto> listRoles(ListRolesQuery query) {
    if (TokenHolder.isSystemAdmin()) {
        // SystemAdmin：返回所有角色（需求 18.4）
        return roleRepository.findAll();
    } else if (isTenantAdmin()) {
        // TenantAdmin：返回当前租户的角色 + 租户超管角色（需求 18.5）
        Long tenantId = TokenHolder.getTenantId();
        return roleRepository.findByTenantIdOrTenantAdmin(tenantId);
    } else {
        // 普通用户：返回当前租户的角色（需求 18.6）
        Long tenantId = TokenHolder.getTenantId();
        return roleRepository.findByTenantId(tenantId);
    }
}
```

---

### 任务 16：实现 MenuApplicationService（菜单管理）

#### 需求功能说明
实现菜单管理应用服务，包括菜单的 CRUD 操作和菜单树查询。

**需求来源**：需求 6

#### 功能约束与关系

**业务规则**：
- 只有 SystemAdmin 可以创建、更新、删除菜单
- 非 SystemAdmin 根据角色过滤菜单
- 菜单采用树形结构

**依赖关系**：
- 依赖任务 11（实现 MenuRepository）

#### 使用场景
1. 创建菜单
2. 更新菜单信息
3. 删除菜单
4. 查询菜单树
5. 查询用户可访问的菜单

#### 示例说明

**Service 接口**：
```java
public interface MenuApplicationService {
    
    /**
     * 创建菜单
     * 验证：需求 6.3
     */
    MenuDto createMenu(CreateMenuCmd cmd, boolean isSystemAdmin);
    
    /**
     * 更新菜单
     * 验证：需求 6.3
     */
    MenuDto updateMenu(Long menuId, UpdateMenuCmd cmd, boolean isSystemAdmin);
    
    /**
     * 删除菜单
     * 验证：需求 6.4
     */
    void deleteMenu(Long menuId, boolean isSystemAdmin);
    
    /**
     * 查询菜单详情
     */
    MenuDto getMenu(Long menuId);
    
    /**
     * 查询菜单树
     * 验证：需求 6.1, 6.2
     */
    List<MenuTreeDto> getMenuTree();
    
    /**
     * 查询用户可访问的菜单树
     * 验证：需求 6.2
     */
    List<MenuTreeDto> getUserMenuTree(Long userId);
}
```

**权限验证要点**：
```java
@Override
public MenuDto createMenu(CreateMenuCmd cmd, boolean isSystemAdmin) {
    // 验证权限（需求 6.3）
    if (!isSystemAdmin) {
        throw new IamException(IamErrorCode.PERMISSION_DENIED, "只有系统管理员可以创建菜单");
    }
    
    // 创建菜单
    Menu menu = Menu.createMenu(...);
    menuRepository.save(menu);
    
    return menuAssembler.toDto(menu);
}
```

---

### 任务 17：实现 TenantApplicationService（租户管理）

#### 需求功能说明
实现租户管理应用服务，包括租户的 CRUD 操作。

**需求来源**：需求 19

#### 功能约束与关系

**业务规则**：
- 只有 SystemAdmin 可以创建、禁用、删除租户
- TenantAdmin 可以更新租户 profile（名称、logo、联系人等）
- TenantAdmin 不能更新租户状态

**依赖关系**：
- 依赖任务 12（实现 TenantRepository）

#### 使用场景
1. SystemAdmin 创建租户
2. SystemAdmin 更新租户信息（包括状态）
3. TenantAdmin 更新租户 profile
4. SystemAdmin 禁用/删除租户
5. 查询租户列表

#### 示例说明

**Service 接口**：
```java
public interface TenantApplicationService {
    
    /**
     * 创建租户
     * 验证：需求 19.1, 19.2
     */
    TenantDto createTenant(CreateTenantCmd cmd, boolean isSystemAdmin);
    
    /**
     * 更新租户信息（SystemAdmin）
     * 验证：需求 19.3, 19.4
     */
    TenantDto updateTenant(Long tenantId, UpdateTenantCmd cmd, boolean isSystemAdmin);
    
    /**
     * 更新租户 profile（TenantAdmin）
     * 验证：需求 19.5, 19.6
     */
    TenantDto updateTenantProfile(Long tenantId, UpdateTenantProfileCmd cmd, boolean isTenantAdmin);
    
    /**
     * 禁用租户
     * 验证：需求 19.7
     */
    void disableTenant(Long tenantId, boolean isSystemAdmin);
    
    /**
     * 删除租户
     * 验证：需求 19.8
     */
    void deleteTenant(Long tenantId, boolean isSystemAdmin);
    
    /**
     * 查询租户详情
     */
    TenantDto getTenant(Long tenantId);
    
    /**
     * 查询租户列表
     * 验证：需求 19.9, 19.10
     */
    List<TenantDto> listTenants();
}
```

**权限验证要点**：
```java
@Override
public TenantDto updateTenantProfile(Long tenantId, UpdateTenantProfileCmd cmd, boolean isTenantAdmin) {
    // 验证权限（需求 19.5）
    if (!isTenantAdmin) {
        throw new IamException(IamErrorCode.PERMISSION_DENIED, "只有租户管理员可以更新租户 profile");
    }
    
    // 验证租户ID
    Long currentTenantId = TokenHolder.getTenantId();
    if (!tenantId.equals(currentTenantId)) {
        throw new IamException(IamErrorCode.PERMISSION_DENIED, "只能更新自己租户的 profile");
    }
    
    // 更新租户 profile（不包括 status）
    Tenant tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new IamException(IamErrorCode.TENANT_NOT_FOUND));
    
    tenant.updateProfile(cmd.getTenantName(), cmd.getLogo(), 
                        cmd.getContactPerson(), cmd.getContactPhone(), cmd.getContactEmail());
    
    tenantRepository.update(tenant);
    
    return tenantAssembler.toDto(tenant);
}
```

---

## 总结

本文档已完成前 17 个任务的详细分析，包括：
- 数据库重建任务（任务 1-5）
- 后端 Domain 层开发任务（任务 6-9）
  - GlobalUser 实体（任务 6）
  - Role 实体（任务 7）
  - Menu 实体（任务 8）
  - Tenant 实体（任务 9）
- 后端 Repository 层开发任务（任务 10-13）
- 后端 Application Service 层开发任务（任务 14-18）

每个任务都包含了：
- 需求功能说明（明确任务目标）
- 功能约束与关系（数据约束、业务规则、依赖关系）
- 使用场景（实际应用场景）
- 示例说明（代码示例或 SQL 脚本）

后续任务（任务 18 及以后）将在下一部分继续分析。

---

## 后端 API 层开发任务组

### 任务 18：实现 AuthController（认证接口）

#### 需求功能说明
实现认证 REST API，包括预登录、登录、刷新 Token、登出接口。

**需求来源**：需求 2

#### 功能约束与关系

**API 设计**：
- POST /api/iam/auth/pre-login - 预登录
- POST /api/iam/auth/login - 正式登录
- POST /api/iam/auth/refresh-token - 刷新 Token
- POST /api/iam/auth/logout - 登出

**依赖关系**：
- 依赖任务 13（实现 AuthApplicationService）

#### 使用场景
1. 前端调用预登录接口
2. 前端调用登录接口
3. 前端刷新 Token
4. 前端登出

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthApplicationService authApplicationService;
    
    /**
     * 预登录
     * 验证：需求 2.1, 2.2
     */
    @PostMapping("/pre-login")
    public Result<PreLoginDto> preLogin(@RequestBody @Valid PreLoginCmd cmd) {
        PreLoginDto dto = authApplicationService.preLogin(cmd);
        return Result.success(dto);
    }
    
    /**
     * 正式登录
     * 验证：需求 2.7, 2.8, 2.9
     */
    @PostMapping("/login")
    public Result<LoginDto> login(@RequestBody @Valid LoginCmd cmd) {
        LoginDto dto = authApplicationService.login(cmd);
        return Result.success(dto);
    }
}
```

---

### 任务 19：实现 UserController（用户管理接口）

#### 需求功能说明
实现用户管理 REST API，包括用户的 CRUD 接口。

**需求来源**：需求 1, 需求 3, 需求 8

#### 功能约束与关系

**API 设计**：
- POST /api/iam/users - 创建用户
- PUT /api/iam/users/{userId} - 更新用户
- DELETE /api/iam/users/{userId} - 删除用户
- GET /api/iam/users/{userId} - 查询用户详情
- GET /api/iam/users - 查询用户列表
- POST /api/iam/users/{userId}/tenants - 添加用户到租户
- DELETE /api/iam/users/{userId}/tenants/{tenantId} - 从租户移除用户

**依赖关系**：
- 依赖任务 14（实现 UserApplicationService）

#### 使用场景
1. 管理员创建用户
2. 管理员更新用户信息
3. 管理员删除用户
4. 查询用户列表

---

### 任务 20：实现 RoleController（角色管理接口）

#### 需求功能说明
实现角色管理 REST API，包括角色的 CRUD 接口。

**需求来源**：需求 7

#### 功能约束与关系

**API 设计**：
- POST /api/iam/roles - 创建角色
- PUT /api/iam/roles/{roleId} - 更新角色
- DELETE /api/iam/roles/{roleId} - 删除角色
- GET /api/iam/roles/{roleId} - 查询角色详情
- GET /api/iam/roles - 查询角色列表

**依赖关系**：
- 依赖任务 15（实现 RoleApplicationService）

---

### 任务 21：实现 MenuController（菜单管理接口）

#### 需求功能说明
实现菜单管理 REST API，包括菜单的 CRUD 接口和菜单树查询。

**需求来源**：需求 6

#### 功能约束与关系

**API 设计**：
- POST /api/iam/menus - 创建菜单（只有 SystemAdmin）
- PUT /api/iam/menus/{menuId} - 更新菜单（只有 SystemAdmin）
- DELETE /api/iam/menus/{menuId} - 删除菜单（只有 SystemAdmin）
- GET /api/iam/menus/{menuId} - 查询菜单详情
- GET /api/iam/menus/tree - 查询菜单树
- GET /api/iam/menus/user-tree - 查询用户可访问的菜单树

**依赖关系**：
- 依赖任务 16（实现 MenuApplicationService）

---

### 任务 22：实现 TenantController（租户管理接口）

#### 需求功能说明
实现租户管理 REST API，包括租户的 CRUD 接口。

**需求来源**：需求 19

#### 功能约束与关系

**API 设计**：
- POST /api/iam/tenants - 创建租户（只有 SystemAdmin）
- PUT /api/iam/tenants/{tenantId} - 更新租户（SystemAdmin）
- PUT /api/iam/tenants/{tenantId}/profile - 更新租户 profile（TenantAdmin）
- DELETE /api/iam/tenants/{tenantId} - 删除租户（只有 SystemAdmin）
- GET /api/iam/tenants/{tenantId} - 查询租户详情
- GET /api/iam/tenants - 查询租户列表

**依赖关系**：
- 依赖任务 17（实现 TenantApplicationService）

---

## Common 模块开发任务组

### 任务 23：实现 TokenHolder（用户上下文管理）

#### 需求功能说明
实现 TokenHolder，用于在 ThreadLocal 中存储和获取当前登录用户信息。

**需求来源**：需求 17

#### 功能约束与关系

**数据约束**：
- 使用 ThreadLocal 存储用户信息
- 请求处理完成后必须清理 ThreadLocal

**依赖关系**：
- 是任务 25（实现本地调试认证拦截器）的前置条件

#### 使用场景
1. 拦截器设置用户上下文
2. Service 层获取当前登录用户信息
3. 请求处理完成后清理上下文

#### 示例说明

**TokenHolder 实现**：
```java
public class TokenHolder {
    
    private static final ThreadLocal<UserContext> USER_CONTEXT = new ThreadLocal<>();
    
    /**
     * 设置用户上下文
     * 验证：需求 17.1
     */
    public static void setUserContext(UserContext context) {
        USER_CONTEXT.set(context);
    }
    
    /**
     * 获取用户上下文
     * 验证：需求 17.2
     */
    public static UserContext getUserContext() {
        return USER_CONTEXT.get();
    }
    
    /**
     * 获取用户ID
     */
    public static Long getUserId() {
        UserContext context = USER_CONTEXT.get();
        return context != null ? context.getUserId() : null;
    }
    
    /**
     * 是否为系统管理员
     */
    public static Boolean isSystemAdmin() {
        UserContext context = USER_CONTEXT.get();
        return context != null && Boolean.TRUE.equals(context.getIsSystemAdmin());
    }
    
    /**
     * 清理用户上下文
     * 验证：需求 17.3
     */
    public static void clear() {
        USER_CONTEXT.remove();
    }
}
```

---

### 任务 24：实现 IsolationHolder（租户/设施隔离上下文）

#### 需求功能说明
实现 IsolationHolder，用于在 ThreadLocal 中存储租户和设施隔离信息。

**需求来源**：需求 14

#### 功能约束与关系

**数据约束**：
- 使用 ThreadLocal 存储隔离信息
- 请求处理完成后必须清理 ThreadLocal

**依赖关系**：
- 是任务 25（实现本地调试认证拦截器）的前置条件

#### 使用场景
1. 拦截器设置隔离上下文
2. Repository 层使用隔离信息过滤数据
3. 请求处理完成后清理上下文

#### 示例说明

**IsolationHolder 实现**：
```java
public class IsolationHolder {
    
    private static final ThreadLocal<IsolationContext> ISOLATION_CONTEXT = new ThreadLocal<>();
    
    /**
     * 设置隔离上下文
     * 验证：需求 14.2, 14.3
     */
    public static void setIsolationContext(IsolationContext context) {
        ISOLATION_CONTEXT.set(context);
    }
    
    /**
     * 获取租户ID
     * 验证：需求 14.5
     */
    public static Long getTenantId() {
        IsolationContext context = ISOLATION_CONTEXT.get();
        return context != null ? context.getTenantId() : null;
    }
    
    /**
     * 获取设施ID
     * 验证：需求 14.6
     */
    public static String getFacilityId() {
        IsolationContext context = ISOLATION_CONTEXT.get();
        return context != null ? context.getFacilityId() : null;
    }
    
    /**
     * 清理隔离上下文
     */
    public static void clear() {
        ISOLATION_CONTEXT.remove();
    }
}
```

---

### 任务 25：实现本地调试认证拦截器

#### 需求功能说明
实现本地调试认证拦截器，在不启动网关的情况下进行认证和权限验证。

**需求来源**：需求 16

#### 功能约束与关系

**业务规则**：
- 检查请求是否来自网关（X-Gateway-Request 请求头）
- 如果来自网关，直接放行
- 如果不来自网关，执行本地认证逻辑
- 验证 Token 并提取用户信息
- 模拟网关行为，注入用户信息到请求头
- 设置 TokenHolder 和 IsolationHolder

**依赖关系**：
- 依赖任务 23（实现 TokenHolder）
- 依赖任务 24（实现 IsolationHolder）
- 部署在 common 模块

#### 使用场景
1. 本地调试时不启动网关
2. 开发环境快速调试
3. 单元测试和集成测试

#### 示例说明

**拦截器实现**：
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class LocalAuthInterceptor implements HandlerInterceptor {
    
    private final TokenService tokenService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 1. 检查是否来自网关（需求 16.1, 16.2）
        String gatewayRequest = request.getHeader("X-Gateway-Request");
        if ("true".equals(gatewayRequest)) {
            // 来自网关，直接放行，使用网关注入的用户信息
            setContextFromGateway(request);
            return true;
        }
        
        // 2. 执行本地认证逻辑（需求 16.3）
        String token = request.getHeader("X-Token");
        if (StringUtils.isBlank(token)) {
            // Token 不存在（需求 16.6）
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
        
        // 3. 验证 Token（需求 16.5）
        try {
            UserContext userContext = tokenService.parseToken(token);
            
            // 4. 模拟网关行为，注入用户信息到请求头（需求 16.7）
            request.setAttribute("X-User-Id", userContext.getUserId());
            request.setAttribute("X-Username", userContext.getUsername());
            request.setAttribute("X-Tenant-ID", userContext.getTenantId());
            request.setAttribute("X-Facility-ID", userContext.getFacilityId());
            request.setAttribute("X-Is-System-Admin", userContext.getIsSystemAdmin());
            
            // 5. 设置 TokenHolder 和 IsolationHolder（需求 16.8）
            TokenHolder.setUserContext(userContext);
            IsolationHolder.setIsolationContext(new IsolationContext(
                userContext.getTenantId(), 
                userContext.getFacilityId()
            ));
            
            return true;
        } catch (Exception e) {
            // Token 无效（需求 16.6）
            log.error("Token 验证失败", e);
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                Object handler, Exception ex) {
        // 清理 ThreadLocal（需求 16.9）
        TokenHolder.clear();
        IsolationHolder.clear();
    }
}
```

**拦截器配置**：
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Autowired
    private LocalAuthInterceptor localAuthInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localAuthInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/iam/auth/pre-login",  // 排除公开接口（需求 16.10）
                    "/api/iam/auth/login",
                    "/api/health",
                    "/api/actuator/**"
                );
    }
}
```

---

## 后端 API 层开发任务组

### 任务 18：实现 AuthController（认证接口）

#### 需求功能说明
实现认证 REST API，包括预登录、登录、刷新 Token、登出接口。

**需求来源**：需求 2

#### 功能约束与关系

**API 设计**：
- POST /api/iam/auth/pre-login - 预登录
- POST /api/iam/auth/login - 正式登录
- POST /api/iam/auth/refresh-token - 刷新 Token
- POST /api/iam/auth/logout - 登出

**依赖关系**：
- 依赖任务 13（实现 AuthApplicationService）

#### 使用场景
1. 前端调用预登录接口
2. 前端调用登录接口
3. 前端刷新 Token
4. 前端登出

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthApplicationService authApplicationService;
    
    /**
     * 预登录
     * 验证：需求 2.1, 2.2
     */
    @PostMapping("/pre-login")
    public Result<PreLoginDto> preLogin(@RequestBody @Valid PreLoginCmd cmd) {
        log.info("预登录请求，用户名：{}", cmd.getUsername());
        PreLoginDto dto = authApplicationService.preLogin(cmd);
        return Result.success(dto);
    }
    
    /**
     * 正式登录
     * 验证：需求 2.7, 2.8, 2.9
     */
    @PostMapping("/login")
    public Result<LoginDto> login(@RequestBody @Valid LoginCmd cmd) {
        log.info("登录请求，用户名：{}，租户：{}", cmd.getUsername(), cmd.getTenantCode());
        LoginDto dto = authApplicationService.login(cmd);
        return Result.success(dto);
    }
    
    /**
     * 刷新 Token
     */
    @PostMapping("/refresh-token")
    public Result<LoginDto> refreshToken(@RequestBody @Valid RefreshTokenCmd cmd) {
        log.info("刷新 Token 请求");
        LoginDto dto = authApplicationService.refreshToken(cmd.getRefreshToken());
        return Result.success(dto);
    }
    
    /**
     * 登出
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("X-Token") String token) {
        log.info("登出请求");
        authApplicationService.logout(token);
        return Result.success();
    }
}
```

---

### 任务 19：实现 UserController（用户管理接口）

#### 需求功能说明
实现用户管理 REST API，包括用户的 CRUD 接口。

**需求来源**：需求 1, 需求 3, 需求 8

#### 功能约束与关系

**API 设计**：
- POST /api/iam/users - 创建用户
- PUT /api/iam/users/{userId} - 更新用户
- DELETE /api/iam/users/{userId} - 删除用户
- GET /api/iam/users/{userId} - 查询用户详情
- GET /api/iam/users - 查询用户列表
- POST /api/iam/users/{userId}/tenants - 添加用户到租户
- DELETE /api/iam/users/{userId}/tenants/{tenantId} - 从租户移除用户
- PUT /api/iam/users/{userId}/password - 修改密码

**依赖关系**：
- 依赖任务 14（实现 UserApplicationService）

#### 使用场景
1. 管理员创建用户
2. 管理员更新用户信息
3. 管理员删除用户
4. 查询用户列表（根据角色返回不同范围）

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserApplicationService userApplicationService;
    
    /**
     * 创建用户
     * 验证：需求 1.1, 1.2
     */
    @PostMapping
    public Result<UserDto> createUser(@RequestBody @Valid CreateUserCmd cmd) {
        log.info("创建用户请求，用户名：{}", cmd.getUsername());
        UserDto dto = userApplicationService.createUser(cmd);
        return Result.success(dto);
    }
    
    /**
     * 查询用户列表
     * 验证：需求 18.1, 18.2, 18.3
     */
    @GetMapping
    public Result<PageDto<UserDto>> listUsers(ListUsersQuery query) {
        log.info("查询用户列表请求");
        PageDto<UserDto> page = userApplicationService.listUsers(query);
        return Result.success(page);
    }
    
    /**
     * 添加用户到租户
     * 验证：需求 3.2, 3.3
     */
    @PostMapping("/{userId}/tenants")
    public Result<Void> addUserToTenant(@PathVariable Long userId, 
                                        @RequestBody @Valid AddUserToTenantCmd cmd) {
        log.info("添加用户到租户，用户ID：{}，租户ID：{}", userId, cmd.getTenantId());
        userApplicationService.addUserToTenant(userId, cmd.getTenantId());
        return Result.success();
    }
}
```

---

### 任务 20：实现 RoleController（角色管理接口）

#### 需求功能说明
实现角色管理 REST API，包括角色的 CRUD 接口。

**需求来源**：需求 7

#### 功能约束与关系

**API 设计**：
- POST /api/iam/roles - 创建角色
- PUT /api/iam/roles/{roleId} - 更新角色
- DELETE /api/iam/roles/{roleId} - 删除角色
- GET /api/iam/roles/{roleId} - 查询角色详情
- GET /api/iam/roles - 查询角色列表
- POST /api/iam/roles/{roleId}/users - 为用户分配角色
- DELETE /api/iam/roles/{roleId}/users/{userId} - 移除用户的角色

**依赖关系**：
- 依赖任务 15（实现 RoleApplicationService）

#### 使用场景
1. 创建角色
2. 更新角色信息
3. 删除角色
4. 查询角色列表（根据角色返回不同范围）
5. 为用户分配角色

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {
    
    private final RoleApplicationService roleApplicationService;
    
    /**
     * 创建角色
     * 验证：需求 7.1, 7.2, 7.3
     */
    @PostMapping
    public Result<RoleDto> createRole(@RequestBody @Valid CreateRoleCmd cmd) {
        log.info("创建角色请求，角色名称：{}", cmd.getRoleName());
        RoleDto dto = roleApplicationService.createRole(cmd);
        return Result.success(dto);
    }
    
    /**
     * 查询角色列表
     * 验证：需求 18.4, 18.5, 18.6
     */
    @GetMapping
    public Result<List<RoleDto>> listRoles(ListRolesQuery query) {
        log.info("查询角色列表请求");
        List<RoleDto> roles = roleApplicationService.listRoles(query);
        return Result.success(roles);
    }
    
    /**
     * 为用户分配角色
     * 验证：需求 7.4
     */
    @PostMapping("/{roleId}/users")
    public Result<Void> assignRoleToUser(@PathVariable Long roleId,
                                         @RequestBody @Valid AssignRoleCmd cmd) {
        log.info("为用户分配角色，角色ID：{}，用户ID：{}", roleId, cmd.getUserId());
        roleApplicationService.assignRoleToUser(cmd.getUserId(), roleId);
        return Result.success();
    }
}
```

---

### 任务 21：实现 MenuController（菜单管理接口）

#### 需求功能说明
实现菜单管理 REST API，包括菜单的 CRUD 接口和菜单树查询。

**需求来源**：需求 6

#### 功能约束与关系

**API 设计**：
- POST /api/iam/menus - 创建菜单（仅 SystemAdmin）
- PUT /api/iam/menus/{menuId} - 更新菜单（仅 SystemAdmin）
- DELETE /api/iam/menus/{menuId} - 删除菜单（仅 SystemAdmin）
- GET /api/iam/menus/{menuId} - 查询菜单详情
- GET /api/iam/menus/tree - 查询菜单树
- GET /api/iam/menus/user-tree - 查询用户可访问的菜单树

**依赖关系**：
- 依赖任务 16（实现 MenuApplicationService）

#### 使用场景
1. SystemAdmin 创建菜单
2. SystemAdmin 更新菜单信息
3. SystemAdmin 删除菜单
4. 用户查询可访问的菜单树

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/menus")
@RequiredArgsConstructor
@Slf4j
public class MenuController {
    
    private final MenuApplicationService menuApplicationService;
    
    /**
     * 创建菜单（仅 SystemAdmin）
     * 验证：需求 6.3
     */
    @PostMapping
    public Result<MenuDto> createMenu(@RequestBody @Valid CreateMenuCmd cmd) {
        log.info("创建菜单请求，菜单名称：{}", cmd.getMenuName());
        boolean isSystemAdmin = TokenHolder.isSystemAdmin();
        MenuDto dto = menuApplicationService.createMenu(cmd, isSystemAdmin);
        return Result.success(dto);
    }
    
    /**
     * 查询菜单树
     * 验证：需求 6.1, 6.2
     */
    @GetMapping("/tree")
    public Result<List<MenuTreeDto>> getMenuTree() {
        log.info("查询菜单树请求");
        List<MenuTreeDto> tree = menuApplicationService.getMenuTree();
        return Result.success(tree);
    }
    
    /**
     * 查询用户可访问的菜单树
     * 验证：需求 6.2
     */
    @GetMapping("/user-tree")
    public Result<List<MenuTreeDto>> getUserMenuTree() {
        log.info("查询用户菜单树请求");
        Long userId = TokenHolder.getUserId();
        List<MenuTreeDto> tree = menuApplicationService.getUserMenuTree(userId);
        return Result.success(tree);
    }
}
```

---

### 任务 22：实现 TenantController（租户管理接口）

#### 需求功能说明
实现租户管理 REST API，包括租户的 CRUD 接口。

**需求来源**：需求 19

#### 功能约束与关系

**API 设计**：
- POST /api/iam/tenants - 创建租户（仅 SystemAdmin）
- PUT /api/iam/tenants/{tenantId} - 更新租户（SystemAdmin 全部字段，TenantAdmin 仅 profile）
- PUT /api/iam/tenants/{tenantId}/profile - 更新租户 profile（TenantAdmin）
- DELETE /api/iam/tenants/{tenantId} - 删除租户（仅 SystemAdmin）
- GET /api/iam/tenants/{tenantId} - 查询租户详情
- GET /api/iam/tenants - 查询租户列表

**依赖关系**：
- 依赖任务 17（实现 TenantApplicationService）

#### 使用场景
1. SystemAdmin 创建租户
2. SystemAdmin 更新租户信息（包括状态）
3. TenantAdmin 更新租户 profile
4. 查询租户列表

#### 示例说明

**Controller 实现**：
```java
@RestController
@RequestMapping("/api/iam/tenants")
@RequiredArgsConstructor
@Slf4j
public class TenantController {
    
    private final TenantApplicationService tenantApplicationService;
    
    /**
     * 创建租户（仅 SystemAdmin）
     * 验证：需求 19.1, 19.2
     */
    @PostMapping
    public Result<TenantDto> createTenant(@RequestBody @Valid CreateTenantCmd cmd) {
        log.info("创建租户请求，租户编码：{}", cmd.getTenantCode());
        boolean isSystemAdmin = TokenHolder.isSystemAdmin();
        TenantDto dto = tenantApplicationService.createTenant(cmd, isSystemAdmin);
        return Result.success(dto);
    }
    
    /**
     * 更新租户信息（SystemAdmin）
     * 验证：需求 19.3, 19.4
     */
    @PutMapping("/{tenantId}")
    public Result<TenantDto> updateTenant(@PathVariable Long tenantId,
                                          @RequestBody @Valid UpdateTenantCmd cmd) {
        log.info("更新租户请求，租户ID：{}", tenantId);
        boolean isSystemAdmin = TokenHolder.isSystemAdmin();
        TenantDto dto = tenantApplicationService.updateTenant(tenantId, cmd, isSystemAdmin);
        return Result.success(dto);
    }
    
    /**
     * 更新租户 profile（TenantAdmin）
     * 验证：需求 19.5, 19.6
     */
    @PutMapping("/{tenantId}/profile")
    public Result<TenantDto> updateTenantProfile(@PathVariable Long tenantId,
                                                 @RequestBody @Valid UpdateTenantProfileCmd cmd) {
        log.info("更新租户 profile 请求，租户ID：{}", tenantId);
        boolean isTenantAdmin = checkIsTenantAdmin();
        TenantDto dto = tenantApplicationService.updateTenantProfile(tenantId, cmd, isTenantAdmin);
        return Result.success(dto);
    }
    
    /**
     * 查询租户列表
     * 验证：需求 19.9, 19.10
     */
    @GetMapping
    public Result<List<TenantDto>> listTenants() {
        log.info("查询租户列表请求");
        List<TenantDto> tenants = tenantApplicationService.listTenants();
        return Result.success(tenants);
    }
}
```

---


## 网关服务开发任务组

### 任务 27：实现网关认证过滤器

#### 需求功能说明
在网关层实现认证过滤器，验证 Token 并注入用户信息到请求头。

**需求来源**：需求 16

#### 功能约束与关系

**业务规则**：
- 验证 Token 的有效性
- 提取用户信息（userId, username, tenantId, facilityId, isSystemAdmin）
- 注入用户信息到请求头（X-User-Id, X-Username, X-Tenant-ID, X-Facility-ID, X-Is-System-Admin）
- 添加网关标识请求头（X-Gateway-Request: true）
- 排除公开接口（/api/iam/auth/pre-login, /api/iam/auth/login）

**依赖关系**：
- 依赖任务 13（实现 AuthApplicationService，提供 Token 验证）

#### 使用场景
1. 用户请求经过网关
2. 网关验证 Token
3. 网关注入用户信息到请求头
4. 下游服务从请求头获取用户信息

#### 示例说明

**网关过滤器实现**：
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthGatewayFilter implements GlobalFilter, Ordered {
    
    private final TokenService tokenService;
    
    // 公开接口列表（需求 16.10）
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/api/iam/auth/pre-login",
        "/api/iam/auth/login",
        "/api/health",
        "/api/actuator"
    );
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();
        
        // 1. 检查是否为公开接口（需求 16.10）
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }
        
        // 2. 获取 Token（需求 16.4）
        String token = request.getHeaders().getFirst("X-Token");
        if (StringUtils.isBlank(token)) {
            // Token 不存在（需求 16.6）
            return unauthorized(exchange);
        }
        
        // 3. 验证 Token（需求 16.5）
        try {
            UserContext userContext = tokenService.parseToken(token);
            
            // 4. 注入用户信息到请求头（需求 16.7）
            ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", String.valueOf(userContext.getUserId()))
                .header("X-Username", userContext.getUsername())
                .header("X-Tenant-ID", String.valueOf(userContext.getTenantId()))
                .header("X-Facility-ID", userContext.getFacilityId())
                .header("X-Is-System-Admin", String.valueOf(userContext.getIsSystemAdmin()))
                .header("X-Gateway-Request", "true")  // 网关标识（需求 16.1）
                .build();
            
            ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();
            
            return chain.filter(mutatedE
xchange);
            
        } catch (Exception e) {
            // Token 无效（需求 16.6）
            log.error("Token 验证失败", e);
            return unauthorized(exchange);
        }
    }
    
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
    
    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return response.setComplete();
    }
    
    @Override
    public int getOrder() {
        return -100;  // 高优先级
    }
}
```

---

## 前端开发任务组

### 任务 28：前端基础准备

#### 需求功能说明
准备前端开发环境，更新数据模型和 API 层。

**需求来源**：需求 1, 需求 2

#### 功能约束与关系

**数据模型更新**：
- 更新 User 接口（添加 tenantIds, facilityIds, isSystemAdmin 等字段）
- 更新 Role 接口（添加 isTenantAdmin 字段）
- 更新 Menu 接口（删除 tenantId 字段）
- 创建 Tenant 接口

**API 层更新**：
- 更新认证 API（preLogin, login）
- 更新用户管理 API
- 更新角色管理 API
- 更新菜单管理 API
- 创建租户管理 API

#### 使用场景
1. 前端开发人员更新数据模型
2. 前端开发人员更新 API 调用

---

### 任务 29：前端登录流程重构

#### 需求功能说明
重构前端登录流程，支持预登录和正式登录。

**需求来源**：需求 2

#### 功能约束与关系

**业务流程**：
1. 用户输入用户名和密码
2. 调用预登录接口
3. 显示租户和设施选择界面
4. 用户选择租户和设施
5. 调用正式登录接口
6. 保存 Token 和用户信息
7. 跳转到首页

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 18（实现 AuthController）

#### 使用场景
1. 用户登录系统
2. SystemAdmin 登录（不需要选择租户和设施）
3. 普通用户登录（需要选择租户和设施）

---

### 任务 30：前端用户管理页面

#### 需求功能说明
实现前端用户管理页面，包括用户列表、创建、编辑、删除功能。

**需求来源**：需求 1, 需求 3, 需求 8

#### 功能约束与关系

**页面功能**：
- 用户列表（根据角色显示不同范围）
- 创建用户
- 编辑用户
- 删除用户
- 将用户添加到租户
- 从租户移除用户
- 修改密码

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 19（实现 UserController）

---

### 任务 31：前端角色管理页面

#### 需求功能说明
实现前端角色管理页面，包括角色列表、创建、编辑、删除功能。

**需求来源**：需求 7

#### 功能约束与关系

**页面功能**：
- 角色列表（根据角色显示不同范围）
- 创建角色
- 编辑角色
- 删除角色
- 为用户分配角色

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 20（实现 RoleController）

---

### 任务 32：前端菜单管理页面

#### 需求功能说明
实现前端菜单管理页面，包括菜单树、创建、编辑、删除功能。

**需求来源**：需求 6

#### 功能约束与关系

**页面功能**：
- 菜单树展示
- 创建菜单（仅 SystemAdmin）
- 编辑菜单（仅 SystemAdmin）
- 删除菜单（仅 SystemAdmin）
- 管理 API 路径

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 21（实现 MenuController）

---

### 任务 33：前端租户管理页面（仅 SystemAdmin）

#### 需求功能说明
实现前端租户管理页面，包括租户列表、创建、编辑、删除功能。**仅 SystemAdmin 可访问此页面。**

**需求来源**：需求 19

#### 功能约束与关系

**页面功能**：
- 租户列表（仅 SystemAdmin）
- 创建租户（仅 SystemAdmin）
- 编辑租户（仅 SystemAdmin，全部字段）
- 删除租户（仅 SystemAdmin）
- 启用/禁用租户（仅 SystemAdmin）

**权限说明**：
- **SystemAdmin**：可以访问租户管理页面，管理所有租户
- **TenantAdmin**：不能访问租户管理页面，只能通过租户 profile 页面更新自己租户的 profile
- **普通用户**：不能访问租户管理页面和租户 profile 页面

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 22（实现 TenantController）

---

### 任务 33.1：前端租户 Profile 页面（TenantAdmin）

#### 需求功能说明
实现前端租户 Profile 页面，**仅 TenantAdmin 可访问**，用于更新自己租户的 profile 信息。

**需求来源**：需求 19.5, 19.6

#### 功能约束与关系

**页面功能**：
- 显示当前租户的 profile 信息
- 更新租户名称
- 更新租户 logo
- 更新联系人信息（姓名、电话、邮箱）

**权限说明**：
- **SystemAdmin**：不需要访问此页面（可以通过租户管理页面管理）
- **TenantAdmin**：可以访问此页面，只能更新自己租户的 profile
- **普通用户**：不能访问此页面

**不能更新的字段**：
- 租户编码（tenantCode）
- 租户状态（status）
- 租户ID（tenantId）

**依赖关系**：
- 依赖任务 28（前端基础准备）
- 依赖任务 22（实现 TenantController）

---

### 任务 34：前端权限控制

#### 需求功能说明
实现前端权限控制，根据用户角色显示/隐藏功能。

**需求来源**：需求 6, 需求 18

#### 功能约束与关系

**权限控制规则**：
- SystemAdmin：显示所有功能（包括租户管理）
- TenantAdmin：显示租户 profile 更新功能（不显示租户管理功能）
- 普通用户：根据角色权限显示功能（不显示租户管理和 profile 功能）

**依赖关系**：
- 依赖任务 29（前端登录流程重构）

---

## 测试和部署任务组

### 任务 35：编写单元测试

#### 需求功能说明
为后端核心业务逻辑编写单元测试。

**需求来源**：所有需求

#### 功能约束与关系

**测试范围**：
- Domain 层实体业务方法
- Application Service 层业务逻辑
- Repository 层数据访问

**测试框架**：
- JUnit 5
- Mockito
- AssertJ

---

### 任务 36：编写集成测试

#### 需求功能说明
编写集成测试，验证端到端流程。

**需求来源**：所有需求

#### 功能约束与关系

**测试场景**：
- 用户登录流程
- 用户管理流程
- 角色管理流程
- 菜单管理流程
- 租户管理流程

---

### 任务 37：部署准备

#### 需求功能说明
准备部署环境，包括数据库迁移、配置文件、部署脚本。

**需求来源**：所有需求

#### 功能约束与关系

**部署内容**：
- 数据库迁移脚本
- 配置文件（application.yml）
- Docker 镜像
- Kubernetes 部署文件

---

## 最终总结

本文档完成了 IAM 用户体系重构项目的所有任务（任务 1-37）的详细分析，包括：

### 后端开发任务（任务 1-27）
1. **数据库重建任务**（任务 1-5）
   - 删除 Central 相关表
   - 创建 global_user 表
   - 修改 iam_menu 表
   - 修改 iam_role 表
   - 创建初始化数据

2. **Domain 层开发任务**（任务 6-9）
   - 实现 GlobalUser 实体（充血模型）
   - 实现 Role 实体（充血模型）
   - 实现 Menu 实体（充血模型）
   - 实现 Tenant 实体（充血模型）

3. **Repository 层开发任务**（任务 10-13）
   - 实现 GlobalUserRepository
   - 实现 RoleRepository
   - 实现 MenuRepository
   - 实现 TenantRepository

4. **Application Service 层开发任务**（任务 14-18）
   - 实现 AuthApplicationService（PreLogin、Login）
   - 实现 UserApplicationService（用户管理）
   - 实现 RoleApplicationService（角色管理）
   - 实现 MenuApplicationService（菜单管理）
   - 实现 TenantApplicationService（租户管理）

5. **API 层开发任务**（任务 19-23）
   - 实现 AuthController（认证接口）
   - 实现 UserController（用户管理接口）
   - 实现 RoleController（角色管理接口）
   - 实现 MenuController（菜单管理接口）
   - 实现 TenantController（租户管理接口）

6. **Common 模块开发任务**（任务 24-26）
   - 实现 TokenHolder（用户上下文管理）
   - 实现 IsolationHolder（租户/设施隔离上下文）
   - 实现本地调试认证拦截器

7. **网关服务开发任务**（任务 28）
   - 实现网关认证过滤器

### 前端开发任务（任务 29-35）
- 前端基础准备
- 前端登录流程重构
- 前端用户管理页面
- 前端角色管理页面
- 前端菜单管理页面
- 前端租户管理页面（仅 SystemAdmin）
- 前端租户 Profile 页面（仅 TenantAdmin）
- 前端权限控制

### 测试和部署任务（任务 36-38）
- 编写单元测试
- 编写集成测试
- 部署准备

---

## 关键设计决策

### 1. 租户隔离策略
- **SystemAdmin**：可以访问所有租户的数据
- **TenantAdmin**：可以访问自己租户的数据 + 租户超管角色
- **普通用户**：只能访问自己租户的数据

### 2. 菜单管理策略
- 菜单全局共享，不属于任何租户
- 只有 SystemAdmin 可以创建、更新、删除菜单
- 非 SystemAdmin 根据角色过滤菜单

### 3. 租户管理策略
- **SystemAdmin**：
  - 可以访问租户管理页面
  - 可以创建、编辑（全部字段）、删除租户
  - 可以启用/禁用租户
- **TenantAdmin**：
  - 不能访问租户管理页面
  - 只能通过租户 Profile 页面更新自己租户的 profile（名称、logo、联系人等）
  - 不能更新租户编码、状态等字段
- **普通用户**：
  - 不能访问租户管理页面
  - 不能访问租户 Profile 页面

### 4. 本地调试策略
- 本地调试认证拦截器部署在 common 模块
- 检查请求是否来自网关（X-Gateway-Request 请求头）
- 如果来自网关，直接放行
- 如果不来自网关，执行本地认证逻辑

### 5. 设施管理策略
- 设施由 MDM 模块管理，不在 IAM 模块创建表
- global_user 表的 facility_ids 字段存储设施编码（而不是数字ID）
- 从 MDM 模块查询设施信息

---

## 实施建议

### 开发顺序
1. **第一阶段**：数据库重建（任务 1-5）
2. **第二阶段**：后端 Domain 层（任务 6-9）
3. **第三阶段**：后端 Repository 层（任务 10-13）
4. **第四阶段**：后端 Application Service 层（任务 14-18）
5. **第五阶段**：后端 API 层（任务 19-23）
6. **第六阶段**：Common 模块（任务 24-26）
7. **第七阶段**：网关服务（任务 28）
8. **第八阶段**：前端开发（任务 29-35，包括租户管理页面和租户 Profile 页面）
9. **第九阶段**：测试和部署（任务 36-38）

### 里程碑
- **里程碑 1**：完成数据库重建和 Domain 层（任务 1-9）
- **里程碑 2**：完成后端核心功能（任务 10-18）
- **里程碑 3**：完成后端 API 和 Common 模块（任务 19-26）
- **里程碑 4**：完成网关服务（任务 28）
- **里程碑 5**：完成前端开发（任务 29-35）
- **里程碑 6**：完成测试和部署（任务 36-38）

---

**文档完成日期**：2025-12-10
**文档版本**：1.0
**作者**：Kiro AI
