# Design Document: Item-Industry Simplification

## Overview

本设计文档描述了 ItemMaster 模块的简化改造方案。核心变更是让 Item 直接关联 Industry，在商品页面选择行业后直接加载并填写行业自定义属性字段，同时删除不再需要的 Category 和 Group 模块。

### 改造前后对比

**改造前**:
```
Industry (行业)
    ↓ industryId
ItemCategory (分类，包含属性定义)
    ↓ categoryId
Item (商品)
    ↓ categoryPropertyId
ItemField (属性值)
```

**改造后**:
```
Industry (行业)
    ↓ industryId
Item (商品)
    ↓ industryPropertyTemplateId
ItemField (属性值)
```

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Interfaces Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ItemController  │  │IndustryController│                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
┌───────────┼─────────────────────┼───────────────────────────┐
│           │   Application Layer │                            │
│  ┌────────▼────────┐  ┌────────▼────────┐                   │
│  │  ItemService    │  │ IndustryService │                   │
│  │  - create()     │  │ - getTemplates()│                   │
│  │  - update()     │  └─────────────────┘                   │
│  │  - get()        │                                         │
│  │  - search()     │                                         │
│  └────────┬────────┘                                         │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────────┐
│           │      Domain Layer                                │
│  ┌────────▼────────┐  ┌─────────────────┐                   │
│  │      Item       │  │    Industry     │                   │
│  │  - industryId   │  │ - templates[]   │                   │
│  │  - fields[]     │  └─────────────────┘                   │
│  └────────┬────────┘                                         │
│           │                                                  │
│  ┌────────▼────────┐  ┌─────────────────┐                   │
│  │   ItemField     │──│IndustryProperty │                   │
│  │  - templateId   │  │    Template     │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Item 实体变更

**变更内容**:
- 新增 `industryId` 字段
- 删除 `categoryId` 字段
- 删除 `groupIds` 字段

```java
@Data
@TableName("def_item")
@TenantIsolation
public class Item extends BaseCompanyEntity {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String sku;
    
    // 新增字段
    private Long industryId;
    
    // 删除字段: categoryId, groupIds
    // private Long categoryId;        // 删除
    // private List<Long> groupIds;    // 删除
    
    // ... 其他字段保持不变
}
```

### 2. ItemField 实体变更

**变更内容**:
- 将 `categoryPropertyId` 改为 `industryPropertyTemplateId`

```java
@Data
@TableName("def_item_field")
@TenantIsolation
public class ItemField {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String itemId;
    
    // 变更字段
    private Long industryPropertyTemplateId;  // 原 categoryPropertyId
    
    private String value;
    // ... 其他字段
}
```

### 3. ItemCreateCmd DTO 变更

```java
@Data
public class ItemCreateCmd {
    private String sku;
    private String description;
    private String customerId;
    
    // 新增字段
    private Long industryId;
    
    // 删除字段
    // private Long categoryId;        // 删除
    // private List<Long> groupIds;    // 删除
    
    // 属性值列表
    private List<ItemFieldCmd> fields;
    
    // ... 其他字段
}
```

### 4. ItemFieldCmd DTO 变更

```java
@Data
public class ItemFieldCmd {
    // 变更字段
    private Long industryPropertyTemplateId;  // 原 categoryPropertyId
    private String value;
}
```

### 5. ItemDto 变更

```java
@Data
public class ItemDto {
    private String id;
    private String sku;
    
    // 新增字段
    private Long industryId;
    private IndustryDto industry;  // 行业信息
    
    // 删除字段
    // private Long categoryId;
    // private ItemCategoryDto category;
    // private List<Long> groupIds;
    
    // 属性值列表
    private List<ItemFieldDto> fields;
    
    // ... 其他字段
}
```

### 6. ItemService 变更

```java
@Service
public class ItemService {
    
    private final ItemRepository itemRepository;
    private final IndustryRepository industryRepository;
    private final ItemFieldRepository itemFieldRepository;
    
    public ItemDto create(ItemCreateCmd cmd) {
        // 1. 验证行业存在且激活
        Industry industry = industryRepository.findById(cmd.getIndustryId())
            .orElseThrow(() -> new BusinessException("行业不存在"));
        if (industry.getStatus() != IndustryStatus.ACTIVE) {
            throw new BusinessException("行业未激活");
        }
        
        // 2. 创建商品
        Item item = new Item();
        item.setIndustryId(cmd.getIndustryId());
        // ... 设置其他字段
        itemRepository.save(item);
        
        // 3. 保存属性值
        if (cmd.getFields() != null) {
            for (ItemFieldCmd fieldCmd : cmd.getFields()) {
                ItemField field = new ItemField();
                field.setItemId(item.getId());
                field.setIndustryPropertyTemplateId(fieldCmd.getIndustryPropertyTemplateId());
                field.setValue(fieldCmd.getValue());
                itemFieldRepository.save(field);
            }
        }
        
        return toDto(item);
    }
    
    public ItemDto get(String id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new BusinessException("商品不存在"));
        
        ItemDto dto = toDto(item);
        
        // 加载行业信息
        if (item.getIndustryId() != null) {
            Industry industry = industryRepository.findById(item.getIndustryId()).orElse(null);
            dto.setIndustry(toIndustryDto(industry));
        }
        
        // 加载属性值
        List<ItemField> fields = itemFieldRepository.findByItemId(id);
        dto.setFields(fields.stream().map(this::toFieldDto).collect(Collectors.toList()));
        
        return dto;
    }
}
```

## Data Models

### 数据库表结构变更

#### 1. def_item 表变更

```sql
-- 新增字段
ALTER TABLE def_item ADD COLUMN industry_id BIGINT COMMENT '行业ID';
ALTER TABLE def_item ADD INDEX idx_industry_id (industry_id);

-- 删除字段
ALTER TABLE def_item DROP COLUMN category_id;
ALTER TABLE def_item DROP COLUMN group_ids;
```

#### 2. def_item_field 表变更

```sql
-- 重命名字段
ALTER TABLE def_item_field CHANGE COLUMN category_property_id industry_property_template_id BIGINT COMMENT '行业属性模板ID';

-- 更新索引
ALTER TABLE def_item_field DROP INDEX idx_category_property_id;
ALTER TABLE def_item_field ADD INDEX idx_industry_property_template_id (industry_property_template_id);
```

#### 3. 删除表

```sql
-- 删除分类相关表
DROP TABLE IF EXISTS def_item_category_property;
DROP TABLE IF EXISTS def_item_category;

-- 删除分组相关表
DROP TABLE IF EXISTS def_item_group_property;
DROP TABLE IF EXISTS def_item_group;
```

### 数据迁移脚本

```sql
-- 数据迁移脚本
-- 1. 备份数据
CREATE TABLE def_item_backup AS SELECT * FROM def_item;
CREATE TABLE def_item_field_backup AS SELECT * FROM def_item_field;

-- 2. 迁移 Item 的 industryId
-- 从 category 获取 industryId 并更新到 item
UPDATE def_item i
SET i.industry_id = (
    SELECT c.industry_id 
    FROM def_item_category c 
    WHERE c.id = i.category_id
)
WHERE i.category_id IS NOT NULL;

-- 3. 迁移 ItemField 的关联
-- 从 categoryPropertyId 映射到 industryPropertyTemplateId
-- 注意：需要根据实际的属性名称进行映射
UPDATE def_item_field f
SET f.industry_property_template_id = (
    SELECT t.id
    FROM def_industry_property_template t
    JOIN def_item_category_property cp ON cp.name = t.name
    WHERE cp.id = f.category_property_id
    AND t.industry_id = (
        SELECT i.industry_id FROM def_item i WHERE i.id = f.item_id
    )
)
WHERE f.category_property_id IS NOT NULL;

-- 4. 验证迁移结果
SELECT COUNT(*) AS total_items FROM def_item;
SELECT COUNT(*) AS items_with_industry FROM def_item WHERE industry_id IS NOT NULL;
SELECT COUNT(*) AS total_fields FROM def_item_field;
SELECT COUNT(*) AS fields_with_template FROM def_item_field WHERE industry_property_template_id IS NOT NULL;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Item-Industry 关联一致性

*For any* Item 实体，如果设置了 industryId，则该 industryId 必须对应一个存在且激活的 Industry 实体。

**Validates: Requirements 2.2, 8.6**

### Property 2: 商品属性值 Round-Trip 一致性

*For any* 商品和其属性值列表，保存商品后查询返回的属性值应与保存时传入的属性值完全一致（包括 industryPropertyTemplateId 和 value）。

**Validates: Requirements 1.4, 1.5, 2.2, 2.3**

### Property 3: ItemField-IndustryPropertyTemplate 关联正确性

*For any* ItemField 实体，其 industryPropertyTemplateId 必须对应一个存在的 IndustryPropertyTemplate，且该模板属于 Item 关联的 Industry。

**Validates: Requirements 3.2, 3.3**

### Property 4: 行业属性模板加载正确性

*For any* 行业 ID，调用获取属性模板 API 返回的所有模板都必须属于该行业。

**Validates: Requirements 1.2**

## Error Handling

### 1. 行业验证错误

- **行业不存在**: 当传入的 industryId 不存在时，抛出 `BusinessException("行业不存在")`
- **行业未激活**: 当传入的 industryId 对应的行业状态为 INACTIVE 时，抛出 `BusinessException("行业未激活")`

### 2. 属性模板验证错误

- **属性模板不存在**: 当传入的 industryPropertyTemplateId 不存在时，抛出 `BusinessException("属性模板不存在")`
- **属性模板不属于当前行业**: 当属性模板的 industryId 与商品的 industryId 不匹配时，抛出 `BusinessException("属性模板不属于当前行业")`

### 3. 数据迁移错误

- **迁移失败回滚**: 数据迁移脚本应在事务中执行，失败时自动回滚
- **备份数据保留**: 迁移前创建备份表，迁移成功后可选择删除

## Testing Strategy

### 单元测试

1. **ItemService 测试**
   - 测试创建商品时 industryId 验证逻辑
   - 测试属性值保存和加载逻辑
   - 测试行业切换时的处理逻辑

2. **ItemValidator 测试**
   - 测试行业存在性验证
   - 测试行业激活状态验证
   - 测试属性模板归属验证

### Property-Based Testing

使用 JUnit 5 + jqwik 进行属性测试：

1. **Property 1 测试**: 生成随机 Item 数据，验证 industryId 关联正确性
2. **Property 2 测试**: 生成随机商品和属性值，验证 round-trip 一致性
3. **Property 3 测试**: 生成随机 ItemField，验证模板关联正确性
4. **Property 4 测试**: 生成随机行业 ID，验证模板加载正确性

### 集成测试

1. **API 集成测试**
   - 测试创建商品 API 完整流程
   - 测试更新商品 API 完整流程
   - 测试查询商品 API 返回数据完整性

2. **数据迁移测试**
   - 在测试环境执行迁移脚本
   - 验证迁移后数据完整性
   - 验证迁移后 API 功能正常
