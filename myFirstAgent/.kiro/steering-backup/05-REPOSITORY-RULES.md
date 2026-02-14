---
inclusion: fileMatch
fileMatchPattern: "**/repository/**/*.java,**/application/**/*.java,**/domain/**/*.java"
---

# 🔴 Repository 使用规范

> **触发条件**：编辑 repository/application/domain 层代码时自动加载

---

## 🔴🔴🔴 Repository 更新规范（最常犯错！）

### ❌ 错误做法
```java
// 用查出来的实体对象直接更新（会更新所有字段！）
FileDetail fileDetail = fileDetailRepository.findById(id).get();
fileDetail.setStatus(FileStatus.DELETED);
fileDetailRepository.update(fileDetail);  // 会更新所有非 null 字段！
```

### ✅ 正确做法
```java
// 新建实体对象，只 set 需要更新的字段
FileDetail updateEntity = new FileDetail();
updateEntity.setId(id);                      // 设置 ID（必须）
updateEntity.setStatus(FileStatus.DELETED);  // 只 set 需要更新的字段
fileDetailRepository.update(updateEntity);   // 只更新 status 字段
```

### 自检清单
```
写 repository.update() 时必须回答：
□ 1. 是否【新建】了实体对象？（不是用查出来的对象）
□ 2. 是否【只 set】了当前场景需要的字段？
□ 3. 不同场景是否有【不同的更新方法】？
```

---

## 🔵 数据查询：优先使用 GenericRepository

### ❌ 不推荐
```java
// 创建自定义 XML mapper
// GlobalUserMapper.xml + GlobalUserRepository.java
```

### ✅ 推荐
```java
// 使用 GenericRepository
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

### 何时使用 GenericRepository
- ✅ 简单列表查询（list）
- ✅ 分页查询（page）
- ✅ 单条查询（get）
- ❌ 复杂多表关联 → 自定义 SQL

---

## 🔵 将字段更新为 null

```java
// Repository 接口
void clearObjectBinding(Long id);

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

## 🛠️ MCP 数据库工具

编写 Repository 代码前，可用数据库 MCP 工具（`*mysql_query`、`*db*`）查表结构和验证数据。

---

*最后更新：2025-12-23*
