---
inclusion: manual
---

# API 接口规范

## URL 规范

### Controller 类级别

禁止在 Controller 类上使用 @RequestMapping 注解。

错误示例：
```java
@RestController
@RequestMapping("/facilities")  // 禁止
public class FacilityController {
}
```

正确示例：
```java
@RestController
public class FacilityController {
}
```

### 方法级别 URL 规范

URL 格式：`/{资源复数名称}/{操作}`

基本规则：
- 资源名称使用复数形式（facilities、locations、zones、workstations）
- 直接使用资源名称，不添加app前缀或模块前缀
- 使用 RESTful 风格
- 禁止在 URL 中包含动词（除了特殊操作）

### RESTful 操作映射

查询列表：
- POST /{resources}/search-by-paging
- 示例：POST /facilities/search-by-paging

创建资源：
- POST /{resources}
- 示例：POST /facilities

查询详情：
- GET /{resources}/{id}
- 示例：GET /facilities/FAC001

更新资源：
- PUT /{resources}/{id}
- 示例：PUT /facilities/FAC001

删除资源：
- DELETE /{resources}/{id}
- 示例：DELETE /facilities/FAC001

特殊操作：
- POST /{resources}/{id}/{action}
- 示例：POST /facilities/FAC001/enable
- 示例：POST /facilities/FAC001/disable

批量操作：
- POST /{resources}/batch
- 示例：POST /locations/batch

### 完整示例

```java
@RestController
public class FacilityController {
    
    // 分页查询
    @PostMapping("/facilities/search-by-paging")
    public R<IPage<Facility>> searchFacilities(...) { }
    
    // 创建
    @PostMapping("/facilities")
    public R<String> createFacility(...) { }
    
    // 查询详情
    @GetMapping("/facilities/{facilityCode}")
    public R<Facility> getFacility(...) { }
    
    // 更新
    @PutMapping("/facilities/{facilityCode}")
    public R<Facility> updateFacility(...) { }
    
    // 删除
    @DeleteMapping("/facilities/{facilityCode}")
    public R<Void> deleteFacility(...) { }
    
    // 启用
    @PostMapping("/facilities/{facilityCode}/enable")
    public R<Facility> enableFacility(...) { }
    
    // 禁用
    @PostMapping("/facilities/{facilityCode}/disable")
    public R<Facility> disableFacility(...) { }
}
```

---

最后更新：2026-01-13

