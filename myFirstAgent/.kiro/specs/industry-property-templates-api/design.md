# 行业属性模板 API - 技术设计

## 1. 文件清单

### 需要创建的文件

| 文件路径 | 说明 |
|---------|------|
| `interfaces/dto/itemmaster/CreatePropertyTemplateRequest.java` | 创建请求 DTO |
| `interfaces/dto/itemmaster/UpdatePropertyTemplateRequest.java` | 更新请求 DTO |
| `interfaces/dto/itemmaster/PropertyTemplateResponse.java` | 响应 DTO |
| `interfaces/assembler/itemmaster/IndustryPropertyTemplateAssembler.java` | DTO 转换器 |

### 需要修改的文件

| 文件路径 | 修改内容 |
|---------|---------|
| `interfaces/rest/itemmaster/IndustryController.java` | 添加 6 个属性模板端点 |
| `application/itemmaster/service/IndustryApplicationService.java` | 添加属性模板服务方法 |

---

## 2. DTO 设计

### CreatePropertyTemplateRequest.java

```java
package com.t5.mdm.interfaces.dto.itemmaster;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreatePropertyTemplateRequest {
    @NotBlank(message = "Property name is required")
    private String name;
    
    @NotNull(message = "Property type is required")
    private String type;  // TEXT, DATE, NUMBER, SELECT
    
    private Boolean isRequired = false;
    
    private List<String> options;  // Required when type is SELECT
    
    private String uom;  // Unit of measure for NUMBER type
}
```

### UpdatePropertyTemplateRequest.java

```java
package com.t5.mdm.interfaces.dto.itemmaster;

import lombok.Data;
import java.util.List;

@Data
public class UpdatePropertyTemplateRequest {
    private String name;
    private String type;
    private Boolean isRequired;
    private List<String> options;
    private String uom;
}
```

### PropertyTemplateResponse.java

```java
package com.t5.mdm.interfaces.dto.itemmaster;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PropertyTemplateResponse {
    private Long id;
    private Long industryId;
    private String name;
    private String type;
    private Boolean isRequired;
    private List<String> options;
    private String uom;
    private String createdBy;
    private LocalDateTime createdTime;
    private String updatedBy;
    private LocalDateTime updatedTime;
}
```

---

## 3. Assembler 设计

### IndustryPropertyTemplateAssembler.java

```java
package com.t5.mdm.interfaces.assembler.itemmaster;

import com.t5.mdm.domain.itemmaster.model.aggregates.IndustryPropertyTemplate;
import com.t5.mdm.interfaces.dto.itemmaster.PropertyTemplateResponse;
import org.springframework.stereotype.Component;

@Component
public class IndustryPropertyTemplateAssembler {

    public PropertyTemplateResponse toResponse(IndustryPropertyTemplate template) {
        if (template == null) {
            return null;
        }
        return PropertyTemplateResponse.builder()
                .id(template.getId() != null ? template.getId().value() : null)
                .industryId(template.getIndustryId() != null ? template.getIndustryId().value() : null)
                .name(template.getName() != null ? template.getName().value() : null)
                .type(template.getType() != null ? template.getType().name() : null)
                .isRequired(template.getIsRequired())
                .options(template.getOptions())
                .uom(template.getUom())
                .createdBy(template.getAuditInfo() != null ? template.getAuditInfo().createdBy() : null)
                .createdTime(template.getAuditInfo() != null ? template.getAuditInfo().createdTime() : null)
                .updatedBy(template.getAuditInfo() != null ? template.getAuditInfo().updatedBy() : null)
                .updatedTime(template.getAuditInfo() != null ? template.getAuditInfo().updatedTime() : null)
                .build();
    }
}
```

---

## 4. Controller 端点设计

### IndustryController 新增方法

```java
// ========== Property Template Endpoints ==========

/**
 * Get all property templates for an industry.
 */
@GetMapping("/industry/{industryId}/property-templates")
public R<List<PropertyTemplateResponse>> getPropertyTemplates(@PathVariable Long industryId) {
    List<IndustryPropertyTemplate> templates = industryApplicationService.getPropertyTemplatesByIndustryId(industryId);
    List<PropertyTemplateResponse> responses = templates.stream()
            .map(propertyTemplateAssembler::toResponse)
            .collect(Collectors.toList());
    return R.ok(responses);
}

/**
 * Create a single property template.
 */
@PostMapping("/industry/{industryId}/property-template")
public R<PropertyTemplateResponse> createPropertyTemplate(
        @PathVariable Long industryId,
        @Valid @RequestBody CreatePropertyTemplateRequest request) {
    IndustryPropertyTemplate template = industryApplicationService.createPropertyTemplate(industryId, request);
    return R.ok(propertyTemplateAssembler.toResponse(template));
}

/**
 * Batch create property templates.
 */
@PostMapping("/industry/{industryId}/property-templates/batch")
public R<List<PropertyTemplateResponse>> batchCreatePropertyTemplates(
        @PathVariable Long industryId,
        @RequestBody List<CreatePropertyTemplateRequest> requests) {
    List<IndustryPropertyTemplate> templates = industryApplicationService.batchCreatePropertyTemplates(industryId, requests);
    List<PropertyTemplateResponse> responses = templates.stream()
            .map(propertyTemplateAssembler::toResponse)
            .collect(Collectors.toList());
    return R.ok(responses);
}

/**
 * Get property template by ID.
 */
@GetMapping("/industry/property-template/{id}")
public R<PropertyTemplateResponse> getPropertyTemplate(@PathVariable Long id) {
    IndustryPropertyTemplate template = industryApplicationService.getPropertyTemplate(id);
    return R.ok(propertyTemplateAssembler.toResponse(template));
}

/**
 * Update property template.
 */
@PutMapping("/industry/property-template/{id}")
public R<Void> updatePropertyTemplate(
        @PathVariable Long id,
        @RequestBody UpdatePropertyTemplateRequest request) {
    industryApplicationService.updatePropertyTemplate(id, request);
    return R.ok();
}

/**
 * Delete property template.
 */
@DeleteMapping("/industry/property-template/{id}")
public R<Void> deletePropertyTemplate(@PathVariable Long id) {
    industryApplicationService.deletePropertyTemplate(id);
    return R.ok();
}
```

---

## 5. ApplicationService 方法设计

### IndustryApplicationService 新增方法

```java
private final IndustryPropertyTemplateRepository propertyTemplateRepository;

/**
 * Get all property templates for an industry.
 */
public List<IndustryPropertyTemplate> getPropertyTemplatesByIndustryId(Long industryId) {
    IndustryId id = new IndustryId(industryId);
    return propertyTemplateRepository.findByIndustryId(id);
}

/**
 * Create a single property template.
 */
@Transactional
public IndustryPropertyTemplate createPropertyTemplate(Long industryId, CreatePropertyTemplateRequest request) {
    // Validate industry exists
    IndustryId indId = new IndustryId(industryId);
    industryRepository.findById(indId)
        .orElseThrow(() -> new BadRequestException(ErrorCode.COMMON_RESOURCE_NOT_FOUND, "Industry not found: " + industryId));
    
    // Get tenant info
    String currentTenantId = TokenHolder.getCurrentTenantId();
    TenantId tenantId = new TenantId(currentTenantId);
    IsolationId isolationId = new IsolationId(currentTenantId);
    String operator = TokenHolder.getCurrentUserId();
    
    // Check name uniqueness
    PropertyName name = new PropertyName(request.getName());
    if (propertyTemplateRepository.existsByIndustryIdAndName(indId, name)) {
        throw new BadRequestException(ErrorCode.INVALID_PARAMETER, "Property template name already exists: " + request.getName());
    }
    
    // Create template
    PropertyType type = PropertyType.valueOf(request.getType());
    IndustryPropertyTemplate template = IndustryPropertyTemplate.create(
        tenantId, isolationId, indId, name, type,
        request.getIsRequired(), request.getOptions(), request.getUom(), operator
    );
    
    propertyTemplateRepository.save(template);
    return template;
}

/**
 * Batch create property templates.
 */
@Transactional
public List<IndustryPropertyTemplate> batchCreatePropertyTemplates(Long industryId, List<CreatePropertyTemplateRequest> requests) {
    List<IndustryPropertyTemplate> templates = new ArrayList<>();
    for (CreatePropertyTemplateRequest request : requests) {
        templates.add(createPropertyTemplate(industryId, request));
    }
    return templates;
}

/**
 * Get property template by ID.
 */
public IndustryPropertyTemplate getPropertyTemplate(Long id) {
    IndustryPropertyTemplateId templateId = IndustryPropertyTemplateId.of(id);
    return propertyTemplateRepository.findById(templateId)
        .orElseThrow(() -> new BadRequestException(ErrorCode.COMMON_RESOURCE_NOT_FOUND, "Property template not found: " + id));
}

/**
 * Update property template.
 */
@Transactional
public void updatePropertyTemplate(Long id, UpdatePropertyTemplateRequest request) {
    IndustryPropertyTemplateId templateId = IndustryPropertyTemplateId.of(id);
    IndustryPropertyTemplate template = propertyTemplateRepository.findById(templateId)
        .orElseThrow(() -> new BadRequestException(ErrorCode.COMMON_RESOURCE_NOT_FOUND, "Property template not found: " + id));
    
    String operator = TokenHolder.getCurrentUserId();
    PropertyName name = request.getName() != null ? new PropertyName(request.getName()) : null;
    PropertyType type = request.getType() != null ? PropertyType.valueOf(request.getType()) : null;
    
    template.update(name, type, request.getIsRequired(), request.getOptions(), request.getUom(), operator);
    propertyTemplateRepository.save(template);
}

/**
 * Delete property template.
 */
@Transactional
public void deletePropertyTemplate(Long id) {
    IndustryPropertyTemplateId templateId = IndustryPropertyTemplateId.of(id);
    IndustryPropertyTemplate template = propertyTemplateRepository.findById(templateId)
        .orElseThrow(() -> new BadRequestException(ErrorCode.COMMON_RESOURCE_NOT_FOUND, "Property template not found: " + id));
    
    propertyTemplateRepository.delete(template);
}
```

---

## 6. 实现顺序

1. 创建 `CreatePropertyTemplateRequest.java`
2. 创建 `UpdatePropertyTemplateRequest.java`
3. 创建 `PropertyTemplateResponse.java`
4. 创建 `IndustryPropertyTemplateAssembler.java`
5. 修改 `IndustryApplicationService.java` - 添加服务方法
6. 修改 `IndustryController.java` - 添加端点

---

## 7. 测试验证

### API 测试

```bash
# 1. 查询属性模板列表
curl -X GET "http://localhost:8084/api/mdm/industry/1/property-templates" \
  -H "X-TENANT-ID: xxx" -H "X-FACILITY-ID: FT_1"

# 2. 创建单个属性模板
curl -X POST "http://localhost:8084/api/mdm/industry/1/property-template" \
  -H "Content-Type: application/json" \
  -H "X-TENANT-ID: xxx" -H "X-FACILITY-ID: FT_1" \
  -d '{"name":"产地","type":"TEXT","isRequired":true}'

# 3. 批量创建属性模板
curl -X POST "http://localhost:8084/api/mdm/industry/1/property-templates/batch" \
  -H "Content-Type: application/json" \
  -H "X-TENANT-ID: xxx" -H "X-FACILITY-ID: FT_1" \
  -d '[{"name":"颜色","type":"SELECT","options":["红","绿","蓝"]}]'

# 4. 更新属性模板
curl -X PUT "http://localhost:8084/api/mdm/industry/property-template/1" \
  -H "Content-Type: application/json" \
  -H "X-TENANT-ID: xxx" -H "X-FACILITY-ID: FT_1" \
  -d '{"name":"产地更新","isRequired":false}'

# 5. 删除属性模板
curl -X DELETE "http://localhost:8084/api/mdm/industry/property-template/1" \
  -H "X-TENANT-ID: xxx" -H "X-FACILITY-ID: FT_1"
```
