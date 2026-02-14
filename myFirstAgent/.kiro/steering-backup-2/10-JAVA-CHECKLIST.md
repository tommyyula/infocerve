---
inclusion: fileMatch
fileMatchPattern: "**/*.java,**/*.sql"
---

# Java 编码检查清单

本规范在编辑 Java 或 SQL 文件时自动加载。

---

## 写代码时必须检查

repository.update()
  - 见下方 Repository 更新规则

throw new Exception
  - 用项目异常类 + 错误码枚举

LocalDateTime.now()
  - 改用 TimeZones.now()

@TableName
  - 必须 autoResultMap = true

@Async
  - 必须 @Async("taskExecutor")

@ConfigurationProperties
  - 必须加 @RefreshScope

CREATE TABLE
  - 表名：前缀_下划线
  - 字段名：驼峰

Redis 跨服务数据
  - 用 StringRedisTemplate

---

## Repository 更新规则 [重要]

写 repository.update() 时必须回答 3 个问题：

1. 是否【新建】了实体对象？
2. 是否【只 set】了当前场景需要的字段？
3. 不同场景是否有【不同的更新方法】？

[错误] 通用更新方法，把所有字段都 set
[正确] 场景专用方法，只 set 该场景需要的字段

---

## 任务完成前检查

```bash
# 时区检查
grepSearch: "LocalDateTime\\.now\\(\\)" includePattern="**/*.java"

# @TableName 检查
grepSearch: "@TableName\\(\"" includePattern="**/*.java"

# @Async 检查
grepSearch: "@Async\\s*$|@Async\\(\\s*\\)" includePattern="**/*.java"

# 编译检查
getDiagnostics(paths=["修改的文件"])

# 数据验证（使用 MCP 数据库工具）
# 识别特征：*mysql_query、*db*
```

---

## GenericRepository 优先

简单查询优先使用 GenericRepository：
- 简单列表查询（list）
- 分页查询（page）
- 单条查询（get）
- 复杂多表关联时才用自定义 SQL

```java
@Service
@RequiredArgsConstructor
public class UserApplicationService {
    private final GenericRepository genericRepository;
    
    public List<UserDto> searchUsers(UserQuery query) {
        List<User> users = new ArrayList<>(
            genericRepository.list(User.class, query)
        );
        return userAssembler.toDtoList(users);
    }
}
```

---

## 将字段更新为 null

```java
// Repository 实现 - 使用 LambdaUpdateWrapper
@Override
public void clearObjectBinding(Long id) {
    LambdaUpdateWrapper<FileDetail> wrapper = new LambdaUpdateWrapper<>();
    wrapper.eq(FileDetail::getId, id)
           .set(FileDetail::getObjectId, null)
           .set(FileDetail::getObjectType, null);
    fileDetailMapper.update(null, wrapper);
}
```

---

## 树形结构实现规范

推荐方案：路径枚举模型（Path Enumeration）

数据库设计：
```sql
CREATE TABLE xxx_menu (
    menu_id BIGINT PRIMARY KEY,
    parent_id BIGINT DEFAULT 0,
    menu_name VARCHAR(64),
    tree_path VARCHAR(500) NOT NULL,  -- 路径：/1/2/5/
    depth INT DEFAULT 0,              -- 深度：根节点为0
    order_num INT DEFAULT 0,
    
    INDEX idx_tree_path (tree_path(100)),  -- 前缀索引
    INDEX idx_parent_id (parent_id)
);
```

路径格式：/祖先ID/.../父ID/当前ID/
示例：/1/2/5/ 表示节点5的父节点是2，祖先是1

查询子树：
```java
// 正确：使用 likeRight，可利用索引
wrapper.likeRight(Menu::getTreePath, path);  // path LIKE '/1/2/%'

// 错误：不能使用 like，无法利用索引
wrapper.like(Menu::getTreePath, path);  // path LIKE '%/1/2/%'
```

---

## 强制规范

1. 编写代码前必须搜索：grepSearch: "方法名\\("
2. 禁止全类名，必须 import
3. 错误消息必须国际化

---

## 必须引用 #11-CRITICAL-REMINDERS 的场景

遇到以下场景时，必须主动引用 #11-CRITICAL-REMINDERS：

- 写 repository.update() 或修改 Repository 层代码
- 写 @Async 异步方法
- 写 ThreadLocal 或线程池相关代码
- 写 Redis 操作（特别是跨服务数据）
- 写 CREATE TABLE SQL
- 写拦截器 HandlerInterceptor
- 写配置类 @ConfigurationProperties

---

## OpenAPI Javadoc 规范

适用于 REST Controller 类的 Javadoc 注释，用于生成 OpenAPI 文档。

### 类级别 Javadoc

第一行（业务名称和级别）：
- 格式：`[一级分类]/[业务名称]/Level 1`
- 示例：`Master Data/Customer Management/Level 1`
- 不要包含 "Controller" 字样

一级分类标准：
- Master Data - 主数据相关
- Inventory Management - 库存和 LP 相关
- Inbound Management - 收货和入库相关
- Outbound Management - 订单、出库、装载相关
- Task - 任务相关
- Report - 报表相关
- Configuration - 配置相关
- Document - 文档相关
- Facility Management - 设施和仓库相关

第二行（描述）：
- 简要描述 Controller 的职责

@module 标签：
- @module wms - wms-app 目录
- @module mdm - mdm-app 目录
- @module wes - wes-app 目录
- @module wcs - wcs-app 目录

@ignore 标签：
- 用于排除不需要生成文档的 Controller
- wms-bam 路径下的 Controller 应添加 @ignore

### 方法级别 Javadoc

第一行（摘要）：
- 格式：动词 + 名词/概念
- 示例：Create User Profile, Search Product Catalog

第二行（描述）：
- 解释方法的目的或操作

@param 标签：
- 为每个参数提供清晰描述

@return 标签：
- 描述返回值或响应对象

### 示例

```java
/**
 * Master Data/Customer Management/Level 1
 * Manages customer master data operations.
 * @module mdm
 */
@RestController
@RequestMapping("/mdm/customers")
public class CustomerController {

    /**
     * Search Customers
     * Retrieves a list of customers matching the search criteria.
     * @param query Object containing filtering and sorting options.
     * @return R containing the list of CustomerDto.
     */
    @GetMapping
    public R<List<CustomerDto>> search(CustomerQuery query) {
        // ...
    }
}
```

---

最后更新：2026-01-03
