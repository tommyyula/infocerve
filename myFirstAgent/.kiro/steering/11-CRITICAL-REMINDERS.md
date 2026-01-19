---
inclusion: fileMatch
fileMatchPattern: "**/*.java"
---

# Java 编码关键提醒

> 使用方式：编辑 Java 文件时自动加载
> 详细规则：通过 #11-CRITICAL-REMINDERS 引用完整版本

---

## 快速检查清单

编写 Java 代码时，检查以下关键点：

1. 时间获取 - 使用 TimeZones.now() 而非 LocalDateTime.now()
2. 异常处理 - 使用 IamException + IamErrorCode，禁止硬编码消息
3. 实体注解 - @TableName 必须包含 autoResultMap = true
4. 数据查询 - 优先使用 GenericRepository
5. 数据库命名 - 表名前缀 + 下划线，字段名驼峰
6. Controller - 禁止类级别 @RequestMapping
7. 配置类 - 必须添加 @RefreshScope
8. Redis 跨服务 - 使用 StringRedisTemplate
9. LocalDateTime 序列化 - 注意 Hutool/Jackson 差异
10. Repository 更新 - 新建实体对象，只 set 需要更新的字段
11. 线程池 - 必须传递 TokenHolder、IsolationHolder、RequestContext
12. ThreadLocal - 新增时更新 THREADLOCAL-REGISTRY.md
13. 拦截器 - 新增时更新 INTERCEPTOR-INVENTORY.md
14. @Async - 必须指定线程池名称

---

## 关键规则详情

### 1. 时区问题

```java
// 错误
LocalDateTime.now()

// 正确
import com.t5.common.util.TimeZones;
TimeZones.now()
```

### 2. 国际化异常

```java
// 错误
throw new IllegalArgumentException("租户ID不能为空");

// 正确
throw new IamException(IamErrorCode.TENANT_ID_CANNOT_BE_EMPTY);
```

### 3. 实体注解

```java
// 错误
@TableName("iam_global_user")

// 正确
@TableName(value = "iam_global_user", autoResultMap = true)
```

### 10. Repository 更新规范

```java
// 错误：用查出来的实体直接更新
FileDetail fileDetail = fileDetailRepository.findById(id).get();
fileDetail.setStatus(FileStatus.DELETED);
fileDetailRepository.update(fileDetail);  // 会更新所有非 null 字段

// 正确：新建实体对象，只 set 需要更新的字段
FileDetail updateEntity = new FileDetail();
updateEntity.setId(id);
updateEntity.setStatus(FileStatus.DELETED);
fileDetailRepository.update(updateEntity);  // 只更新 status 字段
```

### 14. @Async 规范

```java
// 错误：使用默认线程池
@Async
public void sendNotification() { }

// 正确：指定线程池
@Async("taskExecutor")
public void sendNotification() { }
```

---

## DDD 充血模型检查

### 核心原则

Domain 层：
- 应该做：业务逻辑、状态转换、规则验证
- 禁止做：依赖基础设施、框架注解

Application 层：
- 应该做：协调领域对象、管理事务、转换DTO
- 禁止做：包含业务逻辑

### 实体设计检查

写 Domain 实体时必须检查：
1. 是否包含业务行为方法？（不只是 getter/setter）
2. 状态转换是否通过业务方法？（不直接 setStatus）
3. 是否有工厂方法创建实体？
4. 内部集合是否返回只读视图？

```java
// 错误：贫血模型
public class Order {
    private OrderStatus status;
    public void setStatus(OrderStatus status) { this.status = status; }
}
order.setStatus(OrderStatus.CONFIRMED);  // 直接修改状态

// 正确：充血模型
public class Order {
    private OrderStatus status;
    
    public void confirm() {
        if (this.status != OrderStatus.CREATED) {
            throw new IllegalStateException("Invalid state");
        }
        this.status = OrderStatus.CONFIRMED;
    }
}
order.confirm();  // 调用业务方法
```

### Application Service 检查

写 Application Service 时必须检查：
1. 是否只协调领域对象？（不包含业务逻辑）
2. 是否调用领域对象的方法？（不直接修改状态）
3. 业务规则验证是否在领域层？

### 聚合设计要点

- 一个聚合只有一个聚合根
- 聚合之间通过 ID 引用，不直接持有对象
- 聚合根控制对内部对象的访问
- 内部集合返回 Collections.unmodifiableList()

---

## 参考文档

- THREADLOCAL-REGISTRY.md - ThreadLocal 变量清单
- INTERCEPTOR-INVENTORY.md - 拦截器清单

---

最后更新：2026-01-03
