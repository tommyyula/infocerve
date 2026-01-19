---
inclusion: manual
---

# 错误码规范

## 错误码定义规范

### 枚举类结构

每个应用模块定义独立的错误码枚举类，实现 I18nErrorCode 接口。

```java
package com.t5.{module}.infrastructure.enums;

import com.t5.common.i18n.I18nErrorCode;
import lombok.RequiredArgsConstructor;

/**
 * {Module} 模块错误码枚举
 * 错误码范围：{startCode}L - {endCode}L
 * 
 * @author Generated
 * @version 1.0
 */
@RequiredArgsConstructor
public enum {Module}ErrorCode implements I18nErrorCode {
    
    // ========== 分类名称 (起始码-结束码) ==========
    /**
     * 错误码 {code}: {中文描述}
     * 场景：{触发场景}
     * 消息模板：{英文消息模板}
     */
    ERROR_NAME({code}L, "{English message template}"),
    
    private final Long code;
    private final String message;
    
    @Override
    public Long getCode() {
        return code;
    }
    
    @Override
    public String getDefaultMessage() {
        return message;
    }
}
```

### 错误码分配规则

模块错误码范围：
- iam-app: 3001L - 3999L
- facility-app: 4001L - 4999L
- wcs-app: 5001L - 5999L
- device-app: 6001L - 6999L
- mdm-app: 7001L - 7999L

模块内分类（每类预留100个编号）：
- 核心错误：{module}001 - {module}099
- 认证授权：{module}100 - {module}199
- 资源管理：{module}200 - {module}299
- 业务逻辑：{module}300 - {module}399
- 数据校验：{module}400 - {module}499

### 错误码命名规范

命名格式：{资源}_{错误类型}

常见错误类型：
- NOT_FOUND - 资源不存在
- ALREADY_EXISTS - 资源已存在
- CANNOT_BE_EMPTY - 字段不能为空
- INVALID_FORMAT - 格式错误
- PERMISSION_DENIED - 权限不足
- OPERATION_FAILED - 操作失败
- CONFLICT - 冲突
- DISABLED - 已禁用

示例：
- FACILITY_NOT_FOUND
- FACILITY_CODE_ALREADY_EXISTS
- FACILITY_NAME_CANNOT_BE_EMPTY
- FACILITY_HAS_RESOURCES

### 消息模板规范

英文消息模板使用占位符 {}：

无参数：
```java
FACILITY_NOT_FOUND(4001L, "Facility not found")
```

单参数：
```java
FACILITY_NOT_FOUND(4001L, "Facility not found: {}")
```

多参数：
```java
LOCATION_CONFLICT(4002L, "Location '{}' already exists in facility '{}'")
```

### JavaDoc 注释规范

每个错误码必须包含完整的 JavaDoc 注释：

```java
/**
 * 错误码 4001: 设施不存在
 * 场景：查询、更新、删除设施时，设施ID不存在
 * 消息模板：设施不存在: {}
 */
FACILITY_NOT_FOUND(4001L, "Facility not found: {}"),
```

必填字段：
- 错误码编号
- 中文描述
- 触发场景
- 消息模板

### 错误码分类示例

```java
@RequiredArgsConstructor
public enum FacilityErrorCode implements I18nErrorCode {
    
    // ========== 核心错误 (4001-4099) ==========
    /**
     * 错误码 4001: 设施不存在
     * 场景：查询、更新、删除设施时，设施ID不存在
     * 消息模板：设施不存在: {}
     */
    FACILITY_NOT_FOUND(4001L, "Facility not found: {}"),
    
    /**
     * 错误码 4002: 设施编码已存在
     * 场景：创建设施时，设施编码重复
     * 消息模板：设施编码已存在: {}
     */
    FACILITY_CODE_ALREADY_EXISTS(4002L, "Facility code already exists: {}"),
    
    /**
     * 错误码 4003: 设施有关联资源
     * 场景：删除设施时，设施下有位置、设备等资源
     * 消息模板：设施有关联资源，无法删除: {}
     */
    FACILITY_HAS_RESOURCES(4003L, "Facility has resources, cannot be deleted: {}"),
    
    // ========== 位置管理 (4101-4199) ==========
    /**
     * 错误码 4101: 位置不存在
     * 场景：查询、更新、删除位置时，位置编码不存在
     * 消息模板：位置不存在: {}
     */
    LOCATION_NOT_FOUND(4101L, "Location not found: {}"),
    
    /**
     * 错误码 4102: 位置编码已存在
     * 场景：创建位置时，位置编码重复
     * 消息模板：位置编码已存在: {}
     */
    LOCATION_CODE_ALREADY_EXISTS(4102L, "Location code already exists: {}"),
    
    // ========== 区域管理 (4201-4299) ==========
    // ...
    
    private final Long code;
    private final String message;
    
    @Override
    public Long getCode() {
        return code;
    }
    
    @Override
    public String getDefaultMessage() {
        return message;
    }
}
```

## 使用规范

### 抛出异常

```java
// 无参数
throw new FacilityException(FacilityErrorCode.FACILITY_NOT_FOUND);

// 单参数
throw new FacilityException(FacilityErrorCode.FACILITY_NOT_FOUND, facilityCode);

// 多参数
throw new FacilityException(FacilityErrorCode.LOCATION_CONFLICT, locationCode, facilityCode);
```

### 国际化支持

错误码枚举实现 I18nErrorCode 接口，支持国际化：
- getCode() - 返回错误码
- getDefaultMessage() - 返回英文默认消息
- 系统根据用户语言自动加载对应的翻译文件

---

最后更新：2026-01-13

