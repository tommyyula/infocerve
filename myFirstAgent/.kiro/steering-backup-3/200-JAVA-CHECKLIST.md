---
inclusion: fileMatch
fileMatchPattern: "**/*.java,**/*.sql"
---

# Java 编码检查清单

## 必须检查项

repository.update() - 见下方 Repository 更新规则
throw new Exception - 用项目异常类 + 错误码枚举
LocalDateTime.now() - 改用 TimeZones.now()
@TableName - 必须 autoResultMap = true
@Async - 必须 @Async("taskExecutor")
@ConfigurationProperties - 必须加 @RefreshScope
CREATE TABLE - 表名：前缀_下划线，字段名：驼峰
Redis 跨服务数据 - 用 StringRedisTemplate
线程池 - 必须传递 TokenHolder、IsolationHolder、RequestContext
ThreadLocal - 新增时更新 THREADLOCAL-REGISTRY.md
拦截器 - 新增时更新 INTERCEPTOR-INVENTORY.md

---

## Repository 更新规则 [重要]

写 repository.update() 时必须回答 3 个问题：
1. 是否新建了实体对象？
2. 是否只 set 了当前场景需要的字段？
3. 不同场景是否有不同的更新方法？

```java
// 错误：用查出来的实体直接更新
FileDetail fileDetail = fileDetailRepository.findById(id).get();
fileDetail.setStatus(FileStatus.DELETED);
fileDetailRepository.update(fileDetail);  // 会更新所有非 null 字段

// 正确：新建实体对象，只 set 需要更新的字段
FileDetail updateEntity = new FileDetail();
updateEntity.setId(id);
updateEntity.setStatus(FileStatus.DELETED);
fileDetailRepository.update(updateEntity);
```

---

## 任务完成前检查

```bash
grepSearch: "LocalDateTime\\.now\\(\\)" includePattern="**/*.java"
grepSearch: "@TableName\\(\"" includePattern="**/*.java"
grepSearch: "@Async\\s*$|@Async\\(\\s*\\)" includePattern="**/*.java"
getDiagnostics(paths=["修改的文件"])
```

---

## GenericRepository 优先

简单查询优先使用 GenericRepository：list、page、get
复杂多表关联时才用自定义 SQL

---

## 将字段更新为 null

```java
LambdaUpdateWrapper<FileDetail> wrapper = new LambdaUpdateWrapper<>();
wrapper.eq(FileDetail::getId, id)
       .set(FileDetail::getObjectId, null)
       .set(FileDetail::getObjectType, null);
fileDetailMapper.update(null, wrapper);
```

---

## 树形结构：路径枚举模型

```sql
tree_path VARCHAR(500) NOT NULL,  -- 路径：/1/2/5/
depth INT DEFAULT 0,
INDEX idx_tree_path (tree_path(100))
```

查询子树：wrapper.likeRight(Menu::getTreePath, path);  // 可利用索引

---

## 强制规范

1. 编写代码前必须搜索：grepSearch: "方法名\\("
2. 禁止全类名，必须 import
3. 错误消息必须国际化

---

## DDD 充血模型

Domain 层：业务逻辑、状态转换、规则验证（禁止依赖基础设施）
Application 层：协调领域对象、管理事务、转换DTO（禁止业务逻辑）

```java
// 错误：贫血模型
order.setStatus(OrderStatus.CONFIRMED);

// 正确：充血模型
order.confirm();  // 调用业务方法
```

聚合设计要点：
- 一个聚合只有一个聚合根
- 聚合之间通过 ID 引用，不直接持有对象
- 聚合根控制对内部对象的访问
- 内部集合返回 Collections.unmodifiableList()

---

## OpenAPI Javadoc

类级别第一行：`[一级分类]/[业务名称]/Level 1`
一级分类：Master Data、Inventory Management、Inbound Management、Outbound Management、Task、Report、Configuration、Document、Facility Management

@module 标签：wms / mdm / wes / wcs
