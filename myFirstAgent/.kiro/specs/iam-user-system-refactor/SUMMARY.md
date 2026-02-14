# IAM 用户体系重构 - 需求和架构总结

## 📋 已完成的文档

### 1. 需求文档（requirements.md）
- ✅ 20 个详细需求
- ✅ 每个需求包含用户故事和验收标准
- ✅ 符合 EARS 规范
- ✅ 包含租户管理和设施管理需求

### 2. 架构概览（architecture-overview.md）
- ✅ 系统概述和重构目标
- ✅ 用户类型和权限体系
- ✅ 登录流程详解
- ✅ 完整的数据模型（包含租户和设施）
- ✅ 请求流程说明
- ✅ 权限验证层级
- ✅ 关键设计决策
- ✅ 部署架构

### 3. 租户隔离策略（tenant-isolation-strategy.md）
- ✅ 用户角色定义
- ✅ 登录验证规则
- ✅ 数据访问范围（用户管理、角色管理、菜单管理、业务数据）
- ✅ 租户隔离拦截器策略
- ✅ 实现建议和配置示例

### 4. 任务分析（task-analysis.md）
- ✅ 数据库重建任务（任务 1-5）
- ✅ 后端 Domain 层开发任务（任务 6-8）
- ✅ 每个任务包含需求来源、功能约束、使用场景和示例

### 5. 需求分析（analysis.md）
- ✅ 需求描述和目标
- ✅ 系统架构理解
- ✅ 核心业务对象关系
- ✅ 任务拆分

---

## 🎯 核心需求概览

### 需求 1-5：基础功能
1. **用户模型统一**：GlobalUser 作为唯一用户实体
2. **统一登录流程**：PreLogin + Login 两步登录
3. **多租户支持**：一个用户可属于多个租户
4. **用户名唯一性约束**：username + tenantId 组合唯一
5. **内网环境适配**：删除外网依赖

### 需求 6-10：权限和管理
6. **菜单管理权限**：只有 SystemAdmin 可以管理菜单
7. **角色管理**：支持租户超管角色
8. **用户个人信息管理**：用户可以更新个人信息
9. **权限验证**：多层权限验证
10. **审计日志**：记录关键操作

### 需求 11-15：系统功能
11. **错误处理**：清晰的错误信息
12. **性能要求**：响应时间要求
13. **网关集成和请求头规范**：统一的请求头规范
14. **请求头处理逻辑**：后端处理请求头
15. **数据库重建**：重新设计数据库表结构

### 需求 16-20：高级功能
16. **本地调试认证拦截器**：不启动网关也能调试
17. **用户上下文管理**：TokenHolder 和 IsolationHolder
18. **租户隔离策略**：灵活的租户隔离策略
19. **租户管理**：SystemAdmin 管理租户
20. **设施引用**：IAM 模块引用 MDM 模块的设施信息

---

## 📊 核心数据模型

### 1. GlobalUser（全局用户表）
```
- user_id (雪花算法)
- username (租户内唯一)
- password (BCrypt)
- tenant_ids (JSON数组，存储租户ID)
- facility_ids (JSON数组，存储设施编码 facilityCode)
- is_system_admin
- last_login_tenant_id (租户ID)
- last_login_facility_id (设施编码 facilityCode)
- email, phone, nickname, avatar
- status, del_flag
```

### 2. Tenant（租户表）
```
- tenant_id
- tenant_code (全局唯一)
- tenant_name
- contact_person, contact_phone, contact_email
- status, del_flag

注：租户创建/编辑时，管理员手动输入设施的 facilityCode 和 facilityName
```

### 3. Facility（设施 - MDM 模块管理）
```
IAM 模块不创建设施表，只引用：
- facility_code (设施编码)
- facility_name (设施名称)

注：设施的详细信息由 MDM 模块管理
```

### 4. Role（角色表）
```
- role_id
- role_name, role_code
- tenant_id (租户角色) / null (租户超管角色)
- is_tenant_admin
- status
```

### 5. Menu（菜单表）
```
- menu_id
- menu_name
- parent_id
- menu_type (M-目录, C-菜单, F-按钮)
- path, component, icon
- api_paths (JSON数组)
- order_num, status
```

---

## 🔑 关键设计决策

### 1. 删除 default_facility_id
- ❌ 不需要 default_facility_id 字段
- ✅ 使用 last_login_facility_id 作为建议设施

### 2. SystemAdmin 登录验证
- ✅ 可以不选择租户和设施
- ✅ 如果选择了租户和设施，也要验证租户下是否存在该设施

### 3. 租户隔离策略
- **IAM 模块**：Service 层手动隔离（不同角色看到的数据范围不同）
  - 用户管理：SystemAdmin 看所有用户，TenantAdmin 看当前租户用户
  - 角色管理：SystemAdmin 看所有角色，TenantAdmin 看当前租户角色 + 租户超管角色
  - 菜单管理：SystemAdmin 看所有菜单，普通用户看有权限的菜单
- **业务模块**：拦截器自动隔离（严格按租户隔离）

### 4. 用户名唯一性
- **SystemAdmin**：username 全局唯一
- **普通用户**：username + tenantId 组合唯一

### 5. 租户和设施管理
- **租户管理**：只有 SystemAdmin 可以管理
- **设施引用**：IAM 模块只引用设施编码和名称，设施详细信息由 MDM 模块管理

---

## 🚀 登录流程

### 普通用户登录
```
1. PreLogin
   输入：username + password
   输出：租户列表、设施列表、建议的租户和设施

2. Login
   输入：username + password + tenantCode + facilityId
   验证：
     - 用户名和密码
     - 用户是否属于该租户
     - 用户是否可以访问该设施
     - 租户下是否存在该设施 ⭐
   输出：Token（包含 userId, tenantId, facilityId）
```

### SystemAdmin 登录
```
场景 1：不选择租户和设施
   输入：username + password
   输出：Token（tenantId 和 facilityId 为 null）

场景 2：选择租户和设施
   输入：username + password + tenantCode + facilityId
   验证：
     - 用户名和密码
     - 租户是否存在
     - 租户下是否存在该设施 ⭐
   输出：Token（包含 tenantId, facilityId）
```

---

## 📈 数据访问范围

### 用户管理
- **SystemAdmin**：所有用户
- **TenantAdmin**：当前租户的用户
- **普通用户**：当前租户的用户

### 角色管理
- **SystemAdmin**：所有角色
- **TenantAdmin**：当前租户的角色 + 租户超管角色
- **普通用户**：当前租户的角色

### 菜单管理
- **SystemAdmin**：所有菜单
- **非 SystemAdmin**：有权限的菜单

### 租户管理
- **SystemAdmin**：所有租户
- **非 SystemAdmin**：用户所属的租户（只读）

### 设施引用
- **IAM 模块**：只引用设施编码（facilityCode）和设施名称（facilityName）
- **MDM 模块**：管理设施的详细信息（未实现）
- **当前实现**：管理员手动输入 facilityCode 和 facilityName

### 业务数据
- **SystemAdmin（未选择租户）**：所有数据
- **SystemAdmin（选择了租户）**：选择的租户的数据
- **非 SystemAdmin**：当前租户的数据（自动隔离）

---

## ✅ 下一步工作

### 1. 完成任务分析
- [ ] 继续完成任务 9-37 的详细分析
- [ ] 每个任务包含需求来源、功能约束、使用场景和示例

### 2. 创建设计文档（design.md）
- [ ] 架构设计
- [ ] API 设计
- [ ] 安全设计
- [ ] 性能设计

### 3. 创建任务列表（tasks.md）
- [ ] 数据库任务
- [ ] 后端开发任务
- [ ] 前端开发任务
- [ ] 测试任务
- [ ] 部署任务

### 4. 开始实现
- [ ] 按照任务列表逐步实现

---

## 📌 重要提醒

1. **username 不是全局唯一的**：username + tenantId 才是全局唯一的
2. **不需要 default_facility_id**：使用 last_login_facility_id 即可
3. **SystemAdmin 也要验证设施**：如果选择了租户和设施，要验证用户是否可以访问该设施
4. **租户隔离不是全自动的**：IAM 模块需要手动隔离，业务模块才是自动隔离
5. **设施不建表**：IAM 模块只引用设施编码和名称，设施详细信息由 MDM 模块管理
6. **当前实现方式**：管理员手动输入 facilityCode 和 facilityName，未来从 MDM 模块查询

---

*最后更新：2025-12-10*
