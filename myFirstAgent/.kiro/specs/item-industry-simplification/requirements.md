# Requirements Document

## Introduction

本次改造旨在进一步简化 ItemMaster 模块的复杂度。当前设计中，Item 需要通过 Category 间接关联 Industry 来获取自定义属性，流程过于复杂。改造后，Item 将直接关联 Industry，在 Item 页面选择行业后直接加载并填写行业自定义属性字段，同时删除不再需要的 Category 和 Group 模块。

## Glossary

- **Item**: 商品主数据实体，包含商品的基本信息和属性配置
- **Industry**: 行业配置实体，定义行业及其属性模板
- **IndustryPropertyTemplate**: 行业属性模板，定义行业的自定义属性字段
- **ItemField**: 商品属性值实体，存储商品的自定义属性值
- **Category**: 分类实体（待删除）
- **Group**: 分组实体（待删除）
- **MDM_System**: 主数据管理系统

## Requirements

### Requirement 1: Item 直接关联 Industry

**User Story:** As a 商品管理员, I want to 在创建/编辑商品时直接选择行业, so that 我可以快速加载并填写行业自定义属性字段，无需先创建分类。

#### Acceptance Criteria

1. WHEN 用户创建商品时, THE MDM_System SHALL 显示行业选择下拉框
2. WHEN 用户选择行业后, THE MDM_System SHALL 自动加载该行业的属性模板列表
3. WHEN 行业属性模板加载完成后, THE MDM_System SHALL 根据属性类型渲染对应的输入控件
4. WHEN 用户填写属性值并保存商品时, THE MDM_System SHALL 将属性值存储到 ItemField 表中
5. WHEN 用户编辑商品时, THE MDM_System SHALL 加载已保存的属性值并预填充到表单中
6. IF 用户切换行业, THEN THE MDM_System SHALL 提示用户确认并清空已填写的属性值

### Requirement 2: Item 实体增加 industryId 字段

**User Story:** As a 系统开发者, I want to Item 实体直接包含 industryId 字段, so that 商品可以直接关联行业而无需通过分类间接关联。

#### Acceptance Criteria

1. THE Item 实体 SHALL 包含 industryId 字段，类型为 Long
2. WHEN 创建商品时, THE MDM_System SHALL 保存 industryId 到 Item 表
3. WHEN 查询商品时, THE MDM_System SHALL 返回 industryId 及对应的行业信息
4. THE ItemField 实体 SHALL 通过 industryPropertyTemplateId 关联到行业属性模板

### Requirement 3: ItemField 关联调整

**User Story:** As a 系统开发者, I want to ItemField 直接关联 IndustryPropertyTemplate, so that 属性值可以直接追溯到行业属性定义。

#### Acceptance Criteria

1. THE ItemField 实体 SHALL 将 categoryPropertyId 字段改为 industryPropertyTemplateId
2. WHEN 保存商品属性值时, THE MDM_System SHALL 使用 industryPropertyTemplateId 关联属性模板
3. WHEN 查询商品属性值时, THE MDM_System SHALL 通过 industryPropertyTemplateId 获取属性名称和类型

### Requirement 4: 删除 Category 模块

**User Story:** As a 系统架构师, I want to 删除不再需要的 Category 模块, so that 系统结构更加简洁，维护成本降低。

#### Acceptance Criteria

1. THE MDM_System SHALL 删除 ItemCategory 实体及相关代码
2. THE MDM_System SHALL 删除 ItemCategoryProperty 实体及相关代码
3. THE MDM_System SHALL 删除 ItemCategoryController 及相关 API
4. THE MDM_System SHALL 删除 ItemCategoryService 及相关服务
5. THE MDM_System SHALL 删除 def_item_category 数据库表
6. THE MDM_System SHALL 删除 def_item_category_property 数据库表
7. THE MDM_System SHALL 从 Item 实体中移除 categoryId 字段

### Requirement 5: 删除 Group 模块

**User Story:** As a 系统架构师, I want to 删除不再需要的 Group 模块, so that 系统结构更加简洁，维护成本降低。

#### Acceptance Criteria

1. THE MDM_System SHALL 删除 ItemGroup 实体及相关代码
2. THE MDM_System SHALL 删除 ItemGroupProperty 实体及相关代码
3. THE MDM_System SHALL 删除 ItemGroupController 及相关 API
4. THE MDM_System SHALL 删除 ItemGroupService 及相关服务
5. THE MDM_System SHALL 删除 def_item_group 数据库表
6. THE MDM_System SHALL 删除 def_item_group_property 数据库表
7. THE MDM_System SHALL 从 Item 实体中移除 groupIds 字段

### Requirement 6: 数据库表结构调整

**User Story:** As a 数据库管理员, I want to 调整数据库表结构以支持新的设计, so that 数据存储与新的业务模型一致。

#### Acceptance Criteria

1. THE def_item 表 SHALL 新增 industry_id 字段，类型为 BIGINT
2. THE def_item 表 SHALL 删除 category_id 字段
3. THE def_item 表 SHALL 删除 group_ids 字段
4. THE def_item_field 表 SHALL 将 category_property_id 字段改为 industry_property_template_id
5. THE MDM_System SHALL 提供数据迁移脚本，将现有数据迁移到新结构

### Requirement 7: 前端模块设计文档更新

**User Story:** As a 前端开发者, I want to 更新前端模块设计文档, so that 文档与新的后端设计保持一致。

#### Acceptance Criteria

1. THE 09-Item模块设计.md SHALL 更新为直接选择行业的设计
2. THE 02-ItemCategory模块设计.md SHALL 标记为废弃或删除
3. THE 03-ItemGroup模块设计.md SHALL 标记为废弃或删除
4. THE 01-Industry模块设计.md SHALL 更新以反映 Industry 与 Item 的直接关联
5. THE itemmaster-frontend-design/README.md SHALL 更新模块列表和依赖关系

### Requirement 8: API 接口调整

**User Story:** As a API 使用者, I want to Item API 支持直接传入 industryId 和属性值, so that 我可以通过 API 创建和管理商品。

#### Acceptance Criteria

1. THE ItemCreateCmd SHALL 包含 industryId 字段
2. THE ItemCreateCmd SHALL 包含 fields 字段用于传入属性值列表
3. THE ItemUpdateCmd SHALL 支持更新 industryId 和属性值
4. THE ItemDto SHALL 返回 industryId 和行业信息
5. THE ItemDto SHALL 返回 fields 属性值列表
6. WHEN 创建商品时传入 industryId, THE MDM_System SHALL 验证行业是否存在且为激活状态
