---
inclusion: manual
---

# 🚨 Java 编码规则详情

> **使用方式**：在需要详细规则时，通过 `#CRITICAL-REMINDERS` 引用
> 
> **快速检查**：见 `03-JAVA-CHECKLIST.md`（自动加载）

---

## 📋 规则索引（快速定位）

| # | 规则 | 关键词 |
|---|------|--------|
| 1️⃣ | TimeZones.now() | `LocalDateTime.now()` |
| 2️⃣ | IamException | `throw new Exception` |
| 3️⃣ | @TableName autoResultMap | `@TableName` |
| 4️⃣ | GenericRepository | 数据查询 |
| 5️⃣ | 数据库命名 | `CREATE TABLE` |
| 6️⃣ | Controller @RequestMapping | `@RequestMapping` |
| 7️⃣ | @RefreshScope | `@ConfigurationProperties` |
| 8️⃣ | StringRedisTemplate | Redis 跨服务 |
| 9️⃣ | LocalDateTime 序列化 | Hutool + Jackson |
| 🔟 | **Repository 更新** | `repository.update()` |
| 1️⃣1️⃣ | 线程池上下文 | `ThreadPoolTaskExecutor` |
| 1️⃣2️⃣ | ThreadLocal 管理 | `ThreadLocal` |
| 1️⃣3️⃣ | 拦截器管理 | `HandlerInterceptor` |
| 1️⃣4️⃣ | @Async 线程池 | `@Async` |

---

## ⚠️ 十个必须遵守的全局规则

### 1️⃣ 时区问题：使用 TimeZones.now() 而不是 LocalDateTime.now()

**问题**：
```java
// ❌ 错误：使用 LocalDateTime.now()
public boolean isExpired() {
    return this.expireTime != null && LocalDateTime.now().isAfter(this.expireTime);
}
```

**正确做法**：
```java
// ✅ 正确：使用 TimeZones.now()
import com.t5.common.util.TimeZones;

public boolean isExpired() {
    return this.expireTime != null && TimeZones.now().isAfter(this.expireTime);
}
```

**原因**：
- 项目需要支持多时区
- `TimeZones.now()` 会根据请求上下文中的时区返回正确的时间
- `LocalDateTime.now()` 使用服务器本地时区，可能导致时区错误

**检查命令**：
```bash
# 搜索所有使用 LocalDateTime.now() 的地方
grepSearch: "LocalDateTime\\.now\\(\\)" includePattern="**/*.java"
# 应该返回 0 个结果（除了 TimeZones 工具类本身）
```

---

### 2️⃣ 国际化问题：使用 IamErrorCode + IamException 而不是硬编码错误消息

**问题**：
```java
// ❌ 错误：硬编码中文错误消息
throw new IllegalArgumentException("租户ID不能为空");

// ❌ 错误：硬编码英文错误消息
throw new RuntimeException("Tenant ID cannot be empty");
```

**正确做法**：
```java
// ✅ 正确：使用 IamErrorCode + IamException
import com.t5.iam.infrastructure.enums.IamErrorCode;
import com.t5.iam.infrastructure.exception.IamException;

throw new IamException(IamErrorCode.TENANT_ID_CANNOT_BE_EMPTY);

// 如果需要参数
throw new IamException(IamErrorCode.USER_NOT_FOUND, userId);
```

**步骤**：
1. 在 `IamErrorCode.java` 中添加错误码
2. 使用 `IamException` 抛出异常

**原因**：
- 支持国际化（i18n）
- 错误消息可以根据用户语言自动翻译
- 错误码统一管理，便于维护

**检查命令**：
```bash
# 搜索所有硬编码错误消息
grepSearch: "throw new.*Exception\\(\"[^\"]+\"\\)" includePattern="**/*.java"
# 应该返回 0 个结果
```

---

### 3️⃣ 实体类 @TableName 注解：必须包含 autoResultMap = true

**问题**：
```java
// ❌ 错误：缺少 autoResultMap
@TableName("iam_global_user")
public class GlobalUser extends BaseEntity { }

// ❌ 错误：只有 value
@TableName(value = "iam_global_user")
public class GlobalUser extends BaseEntity { }
```

**正确做法**：
```java
// ✅ 正确：必须包含 autoResultMap = true
@TableName(value = "iam_global_user", autoResultMap = true)
public class GlobalUser extends BaseEntity { }
```

**原因**：
- `autoResultMap = true` 确保 MyBatis-Plus 自动处理复杂类型映射
- 特别是 `@JsonTableField` 等自定义类型转换器需要此配置
- 避免 JSON 字段等复杂类型无法正确反序列化

**检查命令**：
```bash
# 检查是否有缺少 autoResultMap 的 @TableName
grepSearch: "@TableName\\(\"" includePattern="**/*.java"
# 应该返回 0 个结果（所有都应该用 value = 形式）
```

---

### 4️⃣ 数据查询问题：优先使用 GenericRepository 而不是自定义 XML Mapper

**问题**：
```java
// ❌ 错误：创建自定义 XML mapper 和 repository 方法
// GlobalUserMapper.xml
<select id="findByConditions" resultType="GlobalUser">
    SELECT * FROM iam_global_user WHERE ...
</select>

// GlobalUserRepository.java
List<GlobalUser> findByConditions(UserQuery query);
```

**正确做法**：
```java
// ✅ 正确：使用 GenericRepository
import com.t5.xms.persistence.query.GenericRepository;

@Service
@RequiredArgsConstructor
public class GlobalUserApplicationService {
    private final GenericRepository genericRepository;
    
    // 列表查询
    public List<UserDto> searchUsers(UserQuery query) {
        List<GlobalUser> users = new ArrayList<>(
            genericRepository.list(GlobalUser.class, query)
        );
        return userAssembler.toDtoList(users);
    }
    
    // 分页查询
    public PageResult<UserDto> searchUsersByPaging(UserQuery query) {
        PageResult<GlobalUser> pageResult = 
            genericRepository.page(GlobalUser.class, query);
        return userAssembler.toDtoPage(pageResult);
    }
}
```

**原因**：
- GenericRepository 已经封装了常用的查询逻辑
- 租户过滤由拦截器自动处理，无需手动设置 tenantId
- 避免维护大量重复的 XML mapper 文件
- 代码更简洁，易于维护

**何时使用 GenericRepository**：
- ✅ 简单的列表查询（list）
- ✅ 分页查询（page）
- ✅ 单条查询（get）
- ✅ 条件查询（通过 Query DTO）
- ❌ 复杂的多表关联查询（需要自定义 SQL）
- ❌ 需要特殊优化的查询（需要自定义 SQL）

**检查命令**：
```bash
# 检查是否有不必要的 XML mapper
# 如果发现简单查询使用了 XML，考虑改用 GenericRepository
```

---

### 5️⃣ 数据库命名规范：表名前缀 + 下划线，字段名驼峰

**问题**：
```sql
-- ❌ 错误：字段名使用下划线，表名无前缀
CREATE TABLE file (
    file_name VARCHAR(100),
    file_type VARCHAR(50),
    created_time DATETIME
);
```

**正确做法**：
```sql
-- ✅ 正确：表名有前缀+下划线，字段名驼峰
CREATE TABLE doc_file_detail (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    fileName VARCHAR(100) NOT NULL COMMENT '原始文件名',
    fileType VARCHAR(50) COMMENT 'MIME类型',
    fileSize BIGINT COMMENT '文件大小(字节)',
    filePath VARCHAR(500) NOT NULL COMMENT '本地存储路径',
    createdBy VARCHAR(50) COMMENT '创建人',
    createdTime DATETIME COMMENT '创建时间',
    updatedBy VARCHAR(50) COMMENT '更新人',
    updatedTime DATETIME COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**表名前缀规范（只允许以下5种）**：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `def_` | 定义/配置类表 | `def_bucket`, `def_access_config`, `def_route`, `def_equipment` |
| `doc_` | 文档/业务数据类表 | `doc_file_detail`, `doc_thumbnail_image`, `doc_api_log` |
| `event_` | 事件类表 | `event_command`, `event_command_message` |
| `history_` | 历史记录类表 | `history_job`, `history_pick` |
| `db_` | 数据库相关表 | `db_change_log` |

**命名规则**：
- **表名**：`前缀_` + 下划线命名法（snake_case）- 如 `doc_file_detail`、`def_bucket`、`event_command`
- **字段名**：驼峰命名法（camelCase）- 如 `fileName`、`createdTime`、`updatedBy`

**Java 实体对应**：
```java
// 字段名与数据库字段名一致，无需 @TableField 映射
@TableName(value = "doc_file_detail", autoResultMap = true)
public class FileDetail extends BaseEntity {
    private String fileName;        // 对应数据库 fileName
    private String fileType;        // 对应数据库 fileType
    private Long fileSize;          // 对应数据库 fileSize
    private String filePath;        // 对应数据库 filePath
}
```

**原因**：
- 表名前缀便于按业务类型分类和管理
- 表名使用下划线是数据库命名惯例，便于区分单词
- 字段名使用驼峰与 Java 实体字段一致，无需额外映射
- MyBatis-Plus 默认不转换字段名，驼峰字段名可直接映射

**检查命令**：
```bash
# 检查 SQL 脚本中的表名前缀
# 表名必须以 def_、doc_、event_、history_、db_ 开头
# 字段名应为驼峰：fileName, createdTime
```

---

### 6️⃣ Controller 禁止类级别 @RequestMapping

**问题**：
```java
// ❌ 错误：类级别 @RequestMapping
@RestController
@RequestMapping("/files")
public class FileController {
    @GetMapping("/{id}")
    public R<FileDto> getFile(@PathVariable String id) { }
}
```

**正确做法**：
```java
// ✅ 正确：方法级别完整路径
@RestController
public class FileController {
    @GetMapping("/files/{id}")
    public R<FileDto> getFile(@PathVariable String id) { }
}
```

**原因**：
- 方法级别的完整路径更清晰，便于快速定位 API
- 避免类级别路由与方法级别路由混淆
- 便于 API 文档生成和维护

**检查命令**：
```bash
# 检查是否有类级别的 @RequestMapping
grepSearch: "@RequestMapping\\(" includePattern="**/interfaces/rest/**/*.java"
```

---

### 7️⃣ 配置类必须添加 @RefreshScope 注解

**问题**：
```java
// ❌ 错误：配置类缺少 @RefreshScope
@Data
@Component
@ConfigurationProperties(prefix = "file.storage")
public class FileStorageProperties {
    private Long maxFileSize;
    private Set<String> allowedTypes;
}
```

**正确做法**：
```java
// ✅ 正确：配置类必须添加 @RefreshScope 支持动态刷新
import org.springframework.cloud.context.config.annotation.RefreshScope;

@Data
@Component
@RefreshScope
@ConfigurationProperties(prefix = "file.storage")
public class FileStorageProperties {
    private Long maxFileSize;
    private Set<String> allowedTypes;
}
```

**原因**：
- 项目使用 Nacos 配置中心
- `@RefreshScope` 支持配置动态刷新，无需重启服务
- 配置变更后自动生效，提高运维效率

**例外情况**：
- 只有用户明确说明不需要动态刷新的配置才可以不加 `@RefreshScope`

**检查命令**：
```bash
# 检查配置类是否有 @RefreshScope
grepSearch: "@ConfigurationProperties" includePattern="**/*.java"
# 然后检查这些类是否都有 @RefreshScope
```

---

### 8️⃣ 跨服务 Redis 数据共享：禁止使用 Redisson，必须使用 StringRedisTemplate

**问题**：
```java
// ❌ 错误：使用 Redisson 写入跨服务共享数据（即使用 StringCodec 也不推荐）
redissonClient.getBucket(key, StringCodec.INSTANCE).set(jsonString, expireSeconds, TimeUnit.SECONDS);

// ❌ 错误：使用 RedisUtil 默认方法（底层使用 Redisson）
RedisUtil.set(key, jsonString, expireSeconds, TimeUnit.SECONDS);
```

**正确做法**：
```java
// ✅ 正确：使用 StringRedisTemplate 写入跨服务共享数据
import org.springframework.data.redis.core.StringRedisTemplate;

@Service
@RequiredArgsConstructor
public class TokenStorage {
    private final StringRedisTemplate stringRedisTemplate;
    
    public void saveToken(String key, String json, long expireSeconds) {
        stringRedisTemplate.opsForValue().set(key, json, expireSeconds, TimeUnit.SECONDS);
    }
    
    public void deleteToken(String key) {
        stringRedisTemplate.delete(key);
    }
}
```

**原因**：
- Redisson 默认使用 Kryo/FST/JDK 序列化，会在数据前添加序列化头信息（如 `�` 乱码）
- 即使使用 `StringCodec.INSTANCE`，也可能存在兼容性问题
- Gateway 使用 `ReactiveStringRedisTemplate` 读取，期望纯 String 格式
- `StringRedisTemplate` 是 Spring 官方提供的，与 `ReactiveStringRedisTemplate` 完全兼容
- 使用统一的 Redis 客户端，避免序列化不一致问题

**适用场景**：
- ✅ 需要被其他服务读取的 Redis 数据（如 Token、Session）→ **必须用 StringRedisTemplate**
- ✅ 需要在 Redis CLI 中直接查看的数据 → **必须用 StringRedisTemplate**
- ✅ 跨语言/跨框架共享的数据 → **必须用 StringRedisTemplate**
- ❌ 仅在同一服务内部使用的缓存数据 → 可以使用 Redisson

**实际案例**：
```java
// IAM 写入 Token 到 Redis（供 Gateway 读取）
@Service
@RequiredArgsConstructor
public class RedisTokenStorage {
    private final StringRedisTemplate stringRedisTemplate;
    
    public void saveTokenValueIndex(String tokenValue, TokenInfo tokenInfo) {
        String indexKey = TOKEN_VALUE_INDEX_PREFIX + tokenValue;
        String json = JSONUtil.toJsonStr(tokenInfo);
        long expireSeconds = calculateExpireSeconds(tokenInfo.getExpireTime());
        
        // 使用 StringRedisTemplate 确保 Gateway 能正确读取
        stringRedisTemplate.opsForValue().set(indexKey, json, expireSeconds, TimeUnit.SECONDS);
    }
    
    public void removeTokenValueIndex(String tokenValue) {
        String indexKey = TOKEN_VALUE_INDEX_PREFIX + tokenValue;
        stringRedisTemplate.delete(indexKey);
    }
}
```

**检查命令**：
```bash
# 检查是否有跨服务共享的 Redis 数据使用了 Redisson
# 重点检查 Token、Session 等需要被其他服务读取的数据
grepSearch: "getBucket\\(" includePattern="**/*.java"
# 如果是跨服务共享数据，必须改用 StringRedisTemplate
```

---

### 9️⃣ 跨服务 LocalDateTime 序列化：Hutool 输出时间戳，Jackson 期望字符串

**问题**：
```java
// 服务 A（如 IAM）使用 Hutool 序列化
String json = JSONUtil.toJsonStr(tokenInfo);
// 输出: {"expireTime":1766086158121, ...}  // LocalDateTime 被序列化为时间戳（毫秒）

// 服务 B（如 Gateway）使用 Jackson 反序列化
TokenInfo tokenInfo = objectMapper.readValue(json, TokenInfo.class);
// ❌ 报错: MismatchedInputException: raw timestamp (1766086158121) not allowed for `java.time.LocalDateTime`
```

**原因**：
- Hutool `JSONUtil.toJsonStr()` 将 `LocalDateTime` 序列化为时间戳（毫秒）
- Jackson 默认的 `LocalDateTimeDeserializer` 期望字符串格式（如 `yyyy-MM-dd HH:mm:ss`）
- 跨服务使用不同的 JSON 库，导致序列化格式不一致

**解决方案**：在读取端（如 Gateway）添加灵活的反序列化器，同时支持时间戳和字符串格式

```java
// Gateway 的 JacksonConfig.java
@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // 添加灵活的 LocalDateTime 反序列化器，支持时间戳和字符串格式
        javaTimeModule.addDeserializer(LocalDateTime.class, new FlexibleLocalDateTimeDeserializer());
        
        mapper.registerModule(javaTimeModule);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
    
    /**
     * 灵活的 LocalDateTime 反序列化器
     * 支持时间戳（毫秒）和字符串格式
     */
    public static class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {
        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.hasToken(JsonToken.VALUE_NUMBER_INT)) {
                // 时间戳格式（毫秒）
                long timestamp = p.getLongValue();
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
            } else if (p.hasToken(JsonToken.VALUE_STRING)) {
                // 字符串格式
                String dateStr = p.getText().trim();
                if (dateStr.isEmpty()) {
                    return null;
                }
                return LocalDateTime.parse(dateStr, FORMATTER);
            }
            return null;
        }
    }
}
```

**最佳实践**：
- ✅ 跨服务数据交换时，读取端应支持多种格式
- ✅ 在 Gateway 等网关服务中添加灵活的反序列化器
- ✅ 记录序列化格式约定，避免团队成员踩坑
- ❌ 不要假设所有服务使用相同的 JSON 库

**检查命令**：
```bash
# 检查是否有跨服务数据使用 Hutool 序列化
grepSearch: "JSONUtil\\.toJsonStr" includePattern="**/*.java"
# 如果数据需要被其他服务读取，确保读取端支持时间戳格式
```

---

### 🔟 Repository 更新规范：新建实体对象，只 set 需要更新的字段

**问题**：
```java
// ❌ 错误：用查出来的实体对象直接更新（会更新所有字段）
FileDetail fileDetail = fileDetailRepository.findById(id).get();
fileDetail.setStatus(FileStatus.DELETED);
fileDetailRepository.update(fileDetail);  // 会更新所有非 null 字段！
```

**正确做法**：
```java
// ✅ 正确：在 Application Service 或 Domain Service 层新建实体对象
FileDetail updateEntity = new FileDetail();
updateEntity.setId(id);                      // 设置 ID（必须）
updateEntity.setStatus(FileStatus.DELETED);  // 只 set 需要更新的字段
fileDetailRepository.update(updateEntity);   // 只更新 status 字段
```

**原因**：
- MyBatis-Plus 的 `updateById` 默认使用 `FieldStrategy.NOT_NULL`，只更新非 null 字段
- 用查出来的实体对象更新，所有字段都有值，会导致全量更新
- 新建实体对象只 set 需要更新的字段，其他字段为 null，不会被更新

**规则**：
- ✅ 在 Application Service 或 Domain Service 层新建实体对象
- ✅ 设置 ID + 只 set 需要更新的字段
- ✅ Repository 使用 `updateById` 更新
- ❌ **禁止用查出来的实体对象直接 updateById**

**例外情况**：
- ✅ 乐观锁场景需要手动写 SQL
- ✅ `UPDATE table SET value = value + delta WHERE id = ?` 这种原子操作需要手动写 SQL
- ✅ **需要将字段更新为 null 或空字符串时**，使用 `LambdaUpdateWrapper`，但必须在 Repository 层定义专门的更新方法

**将字段更新为 null 的正确做法**：
```java
// Repository 接口 - 定义专门的更新方法
public interface FileDetailRepository {
    void clearObjectBinding(Long id);  // 清空关联对象
}

// Repository 实现 - 使用 LambdaUpdateWrapper
@Override
public void clearObjectBinding(Long id) {
    LambdaUpdateWrapper<FileDetail> wrapper = new LambdaUpdateWrapper<>();
    wrapper.eq(FileDetail::getId, id)
           .set(FileDetail::getObjectId, null)      // 更新为 null
           .set(FileDetail::getObjectType, null);   // 更新为 null
    fileDetailMapper.update(null, wrapper);
}
```

**检查命令**：
```bash
# 1. 检查是否有"通用"更新方法（设置了过多字段）
# 搜索 Application Service 中的 update 方法，检查是否只 set 了必要字段
grepSearch: "Repository\\.update\\(" includePattern="**/application/**/*.java"

# 2. 检查是否有查询后直接更新的模式
grepSearch: "findById.*\\.get\\(\\)" includePattern="**/application/**/*.java"
# 如果 findById 后有 update，需要检查是否新建了实体对象

# 3. 写 update 方法时的自检清单：
# - [ ] 是否新建了实体对象？（不是用查出来的对象）
# - [ ] 是否只 set 了当前场景需要更新的字段？
# - [ ] 如果有多个调用场景，是否为每个场景创建了专门的更新方法？
```

**⚠️ 关键提醒**：
- 写 `repository.update()` 时，必须停下来思考：**这个场景实际需要更新哪些字段？**
- 不要图省事写"通用"更新方法，把所有可能变化的字段都 set 进去
- 不同场景应该有不同的更新方法，每个方法只更新该场景需要的字段

---

### 1️⃣1️⃣ 线程池上下文传递：必须传递 TokenHolder、IsolationHolder、RequestContext

**问题**：
```java
// ❌ 错误：没有 TaskDecorator，子线程无法获取上下文
@Bean
public ThreadPoolTaskExecutor myExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.initialize();
    return executor;
}

// ❌ 错误：TaskDecorator 没有传递 TokenHolder
TaskDecorator decorator = task -> {
    String tenantId = IsolationHolder.getTenantId();
    return () -> {
        IsolationHolder.setTenantId(tenantId);
        task.run();
    };
};
```

**正确做法**：
```java
// ✅ 正确：使用完整的 TaskDecorator
@Bean
public ThreadPoolTaskExecutor myExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setTaskDecorator(AfterCompletionExecutorThreadPoolConfiguration.createDefaultTaskDecorator());
    executor.initialize();
    return executor;
}
```

**必须传递的上下文**：

| 上下文 | 用途 | 丢失后果 |
|--------|------|----------|
| `TokenHolder` | 用户认证信息（userId, username, tenantId, isSystemAdmin 等） | 无法获取当前用户，审计日志缺失 |
| `IsolationHolder` | 租户隔离（tenantId, facilityId） | 数据隔离失效，可能跨租户访问 |
| `RequestContext` | 请求上下文（traceId, userName, requestPath 等） | 日志追踪断裂，审计信息丢失 |
| `TimeZoneContext` | 时区上下文 | 时间计算错误 |
| `MDC` | 日志上下文 | 日志无法关联请求 |

**参考实现**：`com.t5.common.persistence.AfterCompletionExecutorThreadPoolConfiguration.createDefaultTaskDecorator()`

**规则**：
- ✅ 优先复用现有线程池：使用 `afterCompletionTaskExecutor` Bean
- ✅ 如需自定义：使用 `AfterCompletionExecutorThreadPoolConfiguration.createDefaultTaskDecorator()`
- ❌ **禁止创建不传递上下文的线程池**

**检查命令**：
```bash
# 检查是否有自定义线程池
grepSearch: "ThreadPoolTaskExecutor" includePattern="**/*.java"
# 检查这些线程池是否设置了 TaskDecorator
```

---

### 1️⃣2️⃣ ThreadLocal 变量管理：新增时必须更新 THREADLOCAL-REGISTRY.md

**问题**：
```java
// ❌ 错误：新增 ThreadLocal 但没有更新文档
public class MyContext {
    private static final ThreadLocal<String> MY_VALUE = new ThreadLocal<>();
    // 没有记录到 THREADLOCAL-REGISTRY.md
    // 没有考虑是否需要跨线程传递
}
```

**正确做法**：
1. 新增 ThreadLocal 前，先检查 `THREADLOCAL-REGISTRY.md` 是否已有类似功能
2. 确定是否需要跨线程传递
3. 如需传递，更新 `ContextTaskDecorator`
4. 更新 `THREADLOCAL-REGISTRY.md` 文档

**文档位置**：`THREADLOCAL-REGISTRY.md`

**文档内容**：
- 所有 ThreadLocal 变量清单
- 每个变量的用途
- 是否需要跨线程传递
- 已删除的 ThreadLocal 记录

**维护时机**：
- 新增 ThreadLocal 变量时
- 修改 ThreadLocal 传递逻辑时
- 删除或废弃 ThreadLocal 时

**检查命令**：
```bash
# 检查是否有新增的 ThreadLocal
grepSearch: "ThreadLocal<" includePattern="**/*.java"
# 确保所有 ThreadLocal 都记录在 THREADLOCAL-REGISTRY.md 中
```

---

### 1️⃣3️⃣ 拦截器管理：新增或修改时必须更新 INTERCEPTOR-INVENTORY.md

**问题**：
```java
// ❌ 错误：新增拦截器但没有更新文档
@Component
public class MyInterceptor implements HandlerInterceptor {
    // 没有记录到 INTERCEPTOR-INVENTORY.md
    // 没有考虑执行顺序和职责分离
}
```

**正确做法**：
1. 新增拦截器前，先查阅 `INTERCEPTOR-INVENTORY.md` 了解现有拦截器
2. 确定新拦截器的职责和执行顺序
3. 遵循职责分离原则（每个拦截器只负责一个上下文）
4. 更新 `INTERCEPTOR-INVENTORY.md` 文档

**文档位置**：`INTERCEPTOR-INVENTORY.md`

**核心原则**：
- ✅ ThreadLocal 清理统一在 `afterCompletion` 中执行
- ✅ 职责分离：每个拦截器只负责一个上下文持有者
- ✅ 异步任务必须使用 `ContextTaskDecorator` 传递上下文

**维护时机**：
- 新增拦截器时
- 修改拦截器职责或执行顺序时
- 新增或修改 ThreadLocal 上下文持有者时
- 修改异常处理器优先级时
- 修改异步上下文传递逻辑时

**检查命令**：
```bash
# 检查是否有新增的拦截器
grepSearch: "implements HandlerInterceptor" includePattern="**/*.java"
# 确保所有拦截器都记录在 INTERCEPTOR-INVENTORY.md 中
```

---

### 1️⃣4️⃣ @Async 异步方法规范：必须指定线程池并确保上下文传递

**问题**：
```java
// ❌ 错误：使用默认线程池，上下文丢失
@Async
public void sendNotification(String userId, String message) {
    // TokenHolder.getUserId() 返回 null！
    // IsolationHolder.getTenantId() 返回 null！
    String currentUser = TokenHolder.getUserId();  // null
}

// ❌ 错误：使用不传递上下文的线程池
@Async("simpleExecutor")
public void processData(String data) {
    // 上下文同样丢失
}
```

**正确做法**：
```java
// ✅ 正确：使用配置了 ContextTaskDecorator 的线程池
@Async("taskExecutor")  // 必须指定线程池名称
public void sendNotification(String userId, String message) {
    // 上下文正确传递
    String currentUser = TokenHolder.getUserId();  // 正确获取
    String tenantId = IsolationHolder.getTenantId();  // 正确获取
}
```

**线程池配置要求**：
```java
// AsyncConfig.java - 必须配置 ContextTaskDecorator
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean("taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        
        // 🔴 关键：必须设置 ContextTaskDecorator 传递上下文
        executor.setTaskDecorator(new ContextTaskDecorator());
        
        executor.initialize();
        return executor;
    }
}
```

**ContextTaskDecorator 必须传递的上下文**：

| 上下文 | 用途 | 丢失后果 |
|--------|------|----------|
| `TokenHolder` | 用户认证信息 | 无法获取当前用户 |
| `IsolationHolder` | 租户隔离 | 数据隔离失效 |
| `RequestContext` | 请求上下文 | 日志追踪断裂 |
| `TimeZoneContext` | 时区上下文 | 时间计算错误 |
| `MDC` | 日志上下文 | 日志无法关联请求 |

**规则**：
- ✅ `@Async` 必须指定线程池名称：`@Async("taskExecutor")`
- ✅ 线程池必须配置 `ContextTaskDecorator`
- ✅ 优先使用项目已配置的 `taskExecutor`
- ❌ **禁止使用 `@Async` 不指定线程池**（会使用默认线程池，上下文丢失）
- ❌ **禁止创建不传递上下文的线程池**

**检查命令**：
```bash
# 检查是否有 @Async 没有指定线程池
grepSearch: "@Async\\s*$|@Async\\(\\s*\\)" includePattern="**/*.java"
# 应该返回 0 个结果（所有 @Async 都应该指定线程池名称）

# 检查是否有 @Async 指定了正确的线程池
grepSearch: "@Async\\(" includePattern="**/*.java"
# 确保都是 @Async("taskExecutor") 或其他配置了 ContextTaskDecorator 的线程池
```

**参考文档**：
- `INTERCEPTOR-INVENTORY.md` - 异步上下文传递流程图
- `common/src/main/java/com/t5/common/config/AsyncConfig.java` - 线程池配置

---

*最后更新：2025-12-22*
