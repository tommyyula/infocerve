# Implementation Plan: Item-Industry Simplification

## Overview

本实现计划将 ItemMaster 模块从 Category/Group 间接关联模式改造为 Item 直接关联 Industry 的简化模式。改造分为后端代码变更、数据库迁移、前端文档更新三个阶段。

## Tasks

- [ ] 1. 后端实体和 DTO 变更
  - [ ] 1.1 修改 Item 实体，新增 industryId 字段，删除 categoryId 和 groupIds 字段
    - 修改 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/entity/Item.java`
    - 新增 `private Long industryId;`
    - 删除 `private Long categoryId;` 和 `private List<Long> groupIds;`
    - _Requirements: 2.1, 4.7, 5.7_
  - [ ] 1.2 修改 ItemField 值对象，将 categoryPropertyId 改为 industryPropertyTemplateId
    - 修改 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/model/valueobjects/ItemField.java`
    - 修改 `mdm-app/src/main/java/com/t5/mdm/infrastructure/persistence/itemmaster/item/ItemFieldEntity.java`
    - _Requirements: 3.1_
  - [ ] 1.3 修改 ItemCreateCmd，新增 industryId 字段，删除 categoryId 和 groupIds 字段
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/ItemCreateCmd.java`
    - _Requirements: 8.1, 8.2_
  - [ ] 1.4 修改 ItemUpdateCmd，新增 industryId 字段，删除 categoryId 和 groupIds 字段
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/ItemUpdateCmd.java`
    - _Requirements: 8.3_
  - [ ] 1.5 修改 ItemDto，新增 industryId 和 industry 字段，删除 categoryId、category 和 groupIds 字段
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/ItemDto.java`
    - _Requirements: 8.4, 8.5_
  - [ ] 1.6 修改 ItemFieldCmd，将 categoryPropertyId 改为 industryPropertyTemplateId
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/field/ItemFieldCmd.java`
    - _Requirements: 3.1_
  - [ ] 1.7 修改 ItemFieldDto，将 categoryPropertyId 改为 industryPropertyTemplateId
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/field/ItemFieldDto.java`
    - _Requirements: 3.3_
  - [ ] 1.8 修改 ItemQuery，删除 categoryId 和 groupIds 查询条件，新增 industryId 查询条件
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/dto/ItemQuery.java`
    - _Requirements: 2.3_

- [ ] 2. 后端 Service 层变更
  - [ ] 2.1 修改 ItemService，更新创建商品逻辑
    - 修改 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/item/service/ItemService.java`
    - 新增行业验证逻辑（验证行业存在且激活）
    - 更新属性值保存逻辑（使用 industryPropertyTemplateId）
    - _Requirements: 1.4, 2.2, 8.6_
  - [ ] 2.2 修改 ItemService，更新查询商品逻辑
    - 加载行业信息
    - 加载属性值列表
    - _Requirements: 1.5, 2.3, 3.3_
  - [ ] 2.3 修改 ItemService，更新更新商品逻辑
    - 支持更新 industryId
    - 支持更新属性值
    - _Requirements: 8.3_
  - [ ] 2.4 修改 ItemValidator，新增行业验证方法
    - 验证行业存在性
    - 验证行业激活状态
    - 验证属性模板归属
    - _Requirements: 8.6_
  - [ ] 2.5 修改 ItemAssembler，更新 DTO 转换逻辑
    - 更新 toDto 方法
    - 更新 toEntity 方法
    - _Requirements: 8.4, 8.5_

- [ ] 3. Checkpoint - 确保后端编译通过
  - 运行 `./gradlew :mdm-app:compileJava` 确保编译通过
  - 如有问题，请询问用户

- [ ] 4. 删除 Category 模块
  - [ ] 4.1 删除 ItemCategory 相关实体和 DTO
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/model/entities/ItemCategory.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/model/entities/ItemCategoryProperty.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/category/` 目录
    - _Requirements: 4.1, 4.2_
  - [ ] 4.2 删除 ItemCategory 相关 Repository
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/repository/ItemCategoryRepository.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/repository/ItemCategoryPropertyRepository.java`
    - _Requirements: 4.4_
  - [ ] 4.3 删除 ItemCategory 相关 Controller
    - 删除 `mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/ItemCategoryController.java`
    - _Requirements: 4.3_
  - [ ] 4.4 删除 ItemCategory 相关 Infrastructure 层代码
    - 删除 `mdm-app/src/main/java/com/t5/mdm/infrastructure/persistence/itemmaster/category/` 目录
    - _Requirements: 4.1, 4.2_

- [ ] 5. 删除 Group 模块
  - [ ] 5.1 删除 ItemGroup 相关实体和 DTO
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/model/entities/ItemGroup.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/model/entities/ItemGroupProperty.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/application/itemmaster/group/` 目录
    - _Requirements: 5.1, 5.2_
  - [ ] 5.2 删除 ItemGroup 相关 Repository
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/repository/ItemGroupRepository.java`
    - 删除 `mdm-app/src/main/java/com/t5/mdm/domain/itemmaster/repository/ItemGroupPropertyRepository.java`
    - _Requirements: 5.4_
  - [ ] 5.3 删除 ItemGroup 相关 Controller
    - 删除 `mdm-app/src/main/java/com/t5/mdm/interfaces/rest/itemmaster/ItemGroupController.java`
    - _Requirements: 5.3_
  - [ ] 5.4 删除 ItemGroup 相关 Infrastructure 层代码
    - 删除 `mdm-app/src/main/java/com/t5/mdm/infrastructure/persistence/itemmaster/group/` 目录
    - _Requirements: 5.1, 5.2_

- [ ] 6. Checkpoint - 确保删除后编译通过
  - 运行 `./gradlew :mdm-app:compileJava` 确保编译通过
  - 检查是否有遗漏的引用需要清理
  - 如有问题，请询问用户

- [x] 7. 更新数据库建表语句 [完成]
  - [x] 7.1 更新 def_item 建表语句
    - 修改 `mdm-app/src/main/resources/db/migration/def_item.sql`
    - 新增 industry_id 字段
    - 删除 category_id 字段
    - 删除 group_ids 字段
    - 删除 def_item_category、def_item_category_property、def_item_group、def_item_group_property 表
    - 更新相关触发器
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 更新 def_item_field 建表语句
    - def_item_field 表在 def_item.sql 中
    - 将 category_property_id 改为 industry_property_template_id
    - 更新相关索引和触发器
    - _Requirements: 6.4_
  - [x] 7.3 删除 Category 相关建表语句
    - Category 相关表在 def_item.sql 中，已删除
    - _Requirements: 4.5, 4.6_
  - [x] 7.4 删除 Group 相关建表语句
    - Group 相关表在 def_item.sql 中，已删除
    - _Requirements: 5.5, 5.6_

- [x] 8. 更新前端模块设计文档 [完成]
  - [x] 8.1 更新 09-Item模块设计.md
    - 更新为直接选择行业的设计
    - 删除 categoryId 和 groupIds 相关内容
    - 新增 industryId 相关内容
    - 更新 API 接口文档
    - _Requirements: 7.1_
  - [x] 8.5 更新 itemmaster-frontend-design/README.md
    - 更新模块列表
    - 标记废弃的模块（Category、Group）
    - 更新依赖关系
    - _Requirements: 7.5_
  - [跳过] 8.2-8.4 废弃文档标记（保留原文件，在 README 中标记即可）

- [x] 9. Final Checkpoint - 确保所有变更完成 [完成]
  - 编译通过：BUILD SUCCESSFUL
  - 所有后端代码变更完成
  - 数据库建表语句已更新
  - 前端设计文档已更新
  - 运行 `./gradlew :mdm-app:compileJava` 确保编译通过
  - 检查所有文档更新是否完成
  - 如有问题，请询问用户

## Notes

- 任务按顺序执行，每个 Checkpoint 需要确保前面的任务都已完成
- 数据库迁移脚本需要在测试环境验证后再应用到生产环境
- 删除模块时需要检查是否有其他模块依赖，如有需要先清理依赖
- 前端文档更新后，需要通知前端团队同步修改代码
