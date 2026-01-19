---
inclusion: fileMatch
fileMatchPattern: "**/*.java,**/*.sql"
---

# 🎯 Java 编码检查清单

---

## 🔴 写代码时必须检查

| 当你写... | 🛑 检查 |
|-----------|---------|
| `repository.update()` | 见下方 ⬇️ |
| `throw new Exception` | 用项目异常类 + 错误码枚举 |
| `LocalDateTime.now()` | 改用 `TimeZones.now()` |
| `@TableName` | 必须 `autoResultMap = true` |
| `@Async` | 必须 `@Async("taskExecutor")` |
| `@ConfigurationProperties` | 必须加 `@RefreshScope` |
| `CREATE TABLE` | 表名 `前缀_下划线`，字段名 `驼峰` |
| Redis 跨服务数据 | 用 `StringRedisTemplate` |

---

## 🔴🔴🔴 Repository 更新（最常犯错！）

```
写 repository.update() 时必须回答 3 个问题：
□ 1. 是否【新建】了实体对象？
□ 2. 是否【只 set】了当前场景需要的字段？
□ 3. 不同场景是否有【不同的更新方法】？
```

**❌ 错误**：通用更新方法，把所有字段都 set
**✅ 正确**：场景专用方法，只 set 该场景需要的字段

---

## 🔵 任务完成前检查

```bash
# 时区
grepSearch: "LocalDateTime\\.now\\(\\)" includePattern="**/*.java"

# @TableName
grepSearch: "@TableName\\(\"" includePattern="**/*.java"

# @Async
grepSearch: "@Async\\s*$|@Async\\(\\s*\\)" includePattern="**/*.java"

# 编译
getDiagnostics(paths=["修改的文件"])

# 数据验证（使用 MCP 数据库工具）
# 识别特征：*mysql_query、*db*
# 用途：查表结构、验证数据变更
```

---

## 📌 3 条强制规范

1. **编写代码前必须搜索**：`grepSearch: "方法名\\("`
2. **禁止全类名，必须 import**
3. **错误消息必须国际化**

---

## 🔴 必须引用 #CRITICAL-REMINDERS 的场景

遇到以下场景时，**Kiro 必须主动引用** `#CRITICAL-REMINDERS` 查看详细规则：

- 写 `repository.update()` 或修改 Repository 层代码
- 写 `@Async` 异步方法
- 写 `ThreadLocal` 或线程池相关代码
- 写 Redis 操作（特别是跨服务数据）
- 写 `CREATE TABLE` SQL
- 写拦截器 `HandlerInterceptor`
- 写配置类 `@ConfigurationProperties`

---

*最后更新：2025-12-23*
