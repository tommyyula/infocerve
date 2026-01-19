---
inclusion: manual
---

# API 设计规范

本规范定义 REST API 设计的统一标准，确保 API 设计符合项目实际技术栈。

---

## 响应格式

[重要] 所有 API 必须使用 xms-core 提供的 R<T> 类作为响应包装

响应类定义：
- 位置：com.t5.xms.web.model.R
- 字段：
  - code: Long - 响应码（0 表示成功）
  - msg: String - 响应消息
  - success: Boolean - 是否成功
  - data: T - 响应数据（泛型）

---

## 成功响应

返回数据：
```java
R.ok(data)
```

示例：
```java
// 返回 ID
R<IdResponse> response = R.ok(IdResponse.from(id));

// 返回 ID 列表
R<IdsResponse> response = R.ok(IdsResponse.from(ids));

// 返回 DTO
R<FacilityDto> response = R.ok(facilityDto);

// 返回列表
R<List<FacilityDto>> response = R.ok(facilityList);

// 返回分页
R<PageResult<FacilityDto>> response = R.ok(pageResult);

// 无返回数据
R<Void> response = R.ok();
```

响应体示例：
```json
{
  "code": 0,
  "msg": "OK",
  "success": true,
  "data": {
    "id": "uuid-string"
  }
}
```

---

## 错误响应

使用错误码枚举：
```java
R.error(ErrorCode.FACILITY_CODE_DUPLICATE)
```

带参数的错误消息：
```java
R.error(ErrorCode.FACILITY_NOT_FOUND, facilityCode)
```

自定义错误：
```java
R.error(10001L, "Custom error message")
```

响应体示例：
```json
{
  "code": 10001,
  "msg": "设施编码已存在",
  "success": false,
  "data": null
}
```

---

## 标准响应 DTO

IdResponse - 返回单个 ID：
- 位置：com.t5.common.dto.IdResponse
- 字段：id (String)
- 用法：IdResponse.from(id)

IdsResponse - 返回 ID 列表：
- 位置：com.t5.common.dto.IdsResponse
- 字段：ids (List<String>)
- 用法：IdsResponse.from(ids)

---

## HTTP 状态码

[重要] 业务错误不使用 HTTP 4xx/5xx 状态码

所有响应统一返回 HTTP 200，通过 R.success 和 R.code 区分成功/失败

例外情况：
- 参数校验失败：HTTP 400（由框架自动处理）
- 认证失败：HTTP 401（由网关处理）
- 权限不足：HTTP 403（由网关处理）
- 系统异常：HTTP 500（由全局异常处理器处理）

---

## 错误码设计

错误码格式：模块前缀 + 三位数字

示例：
- FAC_001：设施编码已存在
- FAC_002：设施编码不可修改
- FAC_003：设施有关联资源，无法删除
- ZONE_001：区域编码已存在
- LOC_001：位置编码已存在

错误码定义：
- 创建枚举类实现 ResponseCode 接口
- 位置：{module}/domain/enums/{Aggregate}ErrorCode.java
- 示例：facility-app/domain/enums/FacilityErrorCode.java

---

## API 路径设计

RESTful 风格：
- 资源名称用复数：/facilities, /zones, /locations
- 使用名词，不使用动词
- 层级不超过 3 层

示例：
```
POST   /api/v1/facility/facilities
GET    /api/v1/facility/facilities/{id}
PUT    /api/v1/facility/facilities/{id}
DELETE /api/v1/facility/facilities/{id}
GET    /api/v1/facility/facilities
POST   /api/v1/facility/facilities/{id}/enable
POST   /api/v1/facility/facilities/{id}/disable
```

---

## 请求参数

路径参数：
- 用于资源标识：{id}, {code}
- 类型：String（UUID 或业务编码）

查询参数：
- 用于过滤、排序、分页
- 示例：pageNum, pageSize, facilityType, status

请求体：
- 用于创建、更新操作
- 使用 Command 对象：CreateFacilityCmd, UpdateFacilityCmd
- 必须添加参数校验注解：@Valid, @NotNull, @NotBlank

---

## 分页响应

使用 PageResult<T>：
```java
R<PageResult<FacilityDto>> response = R.ok(pageResult);
```

响应体示例：
```json
{
  "code": 0,
  "msg": "OK",
  "success": true,
  "data": {
    "total": 100,
    "pageNum": 1,
    "pageSize": 10,
    "records": [...]
  }
}
```

---

## Controller 规范

命名：{Aggregate}Controller
位置：{module}/interfaces/rest/{aggregate}/{Aggregate}Controller.java

示例：
```java
@RestController
@RequestMapping("/api/v1/facility")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityApplicationService facilityApplicationService;

    @PostMapping("/facilities")
    public R<IdResponse> create(@Valid @RequestBody CreateFacilityCmd cmd) {
        String id = facilityApplicationService.create(cmd);
        return R.ok(IdResponse.from(id));
    }

    @GetMapping("/facilities/{id}")
    public R<FacilityDto> getById(@PathVariable String id) {
        FacilityDto dto = facilityApplicationService.getById(id);
        return R.ok(dto);
    }

    @PutMapping("/facilities/{id}")
    public R<Void> update(@PathVariable String id, @Valid @RequestBody UpdateFacilityCmd cmd) {
        facilityApplicationService.update(id, cmd);
        return R.ok();
    }

    @DeleteMapping("/facilities/{id}")
    public R<Void> delete(@PathVariable String id) {
        facilityApplicationService.delete(id);
        return R.ok();
    }
}
```

---

## 参数校验

使用 JSR-303 注解：
- @NotNull：不能为 null
- @NotBlank：不能为空字符串
- @NotEmpty：集合不能为空
- @Size：字符串/集合长度
- @Min/@Max：数值范围
- @Pattern：正则表达式

示例：
```java
@Data
public class CreateFacilityCmd {
    
    @NotBlank(message = "设施编码不能为空")
    @Size(max = 50, message = "设施编码长度不能超过50")
    private String facilityCode;
    
    @NotBlank(message = "设施名称不能为空")
    @Size(max = 100, message = "设施名称长度不能超过100")
    private String facilityName;
    
    @NotNull(message = "设施类型不能为空")
    private FacilityType facilityType;
}
```

---

## API 文档

使用 Swagger/OpenAPI 注解：
- @Tag：Controller 描述
- @Operation：方法描述
- @Parameter：参数描述
- @Schema：DTO 字段描述

示例：
```java
@Tag(name = "设施管理", description = "设施 CRUD API")
@RestController
@RequestMapping("/api/v1/facility")
public class FacilityController {

    @Operation(summary = "创建设施", description = "创建新的设施记录")
    @PostMapping("/facilities")
    public R<IdResponse> create(
        @Parameter(description = "创建设施命令") 
        @Valid @RequestBody CreateFacilityCmd cmd
    ) {
        // ...
    }
}
```

---

## 测试用例设计

API 测试用例必须包含：

正常场景：
- 请求示例（完整 JSON）
- 预期响应（完整 JSON，使用实际的 R<T> 格式）
- 验证点（响应码、数据库状态）

异常场景：
- 前置条件
- 请求示例
- 预期响应（错误码、错误消息）
- 验证点（数据未被修改）

边界场景：
- 边界值测试
- 空值测试
- 长度限制测试

---

## 注意事项

[重要] API 设计必须参考项目实际技术栈：
1. 响应格式使用 R<T>，不是自定义的 {code, message, data}
2. 错误码类型是 Long，不是 String
3. 成功码是 0L，不是 "0" 或 200
4. IdResponse/IdsResponse 来自 common 模块
5. 所有业务错误返回 HTTP 200

[重要] 设计 API 前必须：
1. 查看 xms-core 的 R 类定义
2. 查看 common 模块的响应 DTO
3. 参考其他模块的 Controller 实现
4. 确认错误码枚举的定义位置

禁止：
- 猜测响应格式
- 使用不存在的响应类
- 自创响应结构
- 混用不同的响应格式
