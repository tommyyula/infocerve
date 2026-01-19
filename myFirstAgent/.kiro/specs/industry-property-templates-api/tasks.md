# 实现计划: 行业属性模板 API

## 概述

为 IndustryController 添加行业属性模板的 CRUD API 端点，使前端能够管理行业的自定义属性模板。

## 任务列表

- [x] 1. 创建 DTO 文件
  - [x] 1.1 创建 CreatePropertyTemplateRequest.java
    - 路径: `interfaces/dto/itemmaster/CreatePropertyTemplateRequest.java`
    - 字段: name (必填), type (必填), isRequired, options, uom
    - 添加 Jakarta Validation 注解
    - _需求: 2.1, 2.2, 2.3_

  - [x] 1.2 创建 UpdatePropertyTemplateRequest.java
    - 路径: `interfaces/dto/itemmaster/UpdatePropertyTemplateRequest.java`
    - 字段: name, type, isRequired, options, uom (全部可选)
    - _需求: 4.1_

  - [x] 1.3 创建 PropertyTemplateResponse.java
    - 路径: `interfaces/dto/itemmaster/PropertyTemplateResponse.java`
    - 字段: id, industryId, name, type, isRequired, options, uom, createdBy, createdTime, updatedBy, updatedTime
    - 使用 @Builder 注解
    - _需求: 1.3_

- [x] 2. 创建 Assembler
  - [x] 2.1 创建 IndustryPropertyTemplateAssembler.java
    - 路径: `interfaces/assembler/itemmaster/IndustryPropertyTemplateAssembler.java`
    - 实现 toResponse(IndustryPropertyTemplate) 方法
    - 使用 @Component 注解注册为 Spring Bean
    - _需求: 1.1, 2.1_

- [x] 3. 修改 IndustryApplicationService
  - [ ] 3.1 添加 IndustryPropertyTemplateRepository 依赖注入
    - 在构造函数中添加 propertyTemplateRepository 参数
    - _需求: 1.1, 2.1_

  - [ ] 3.2 实现 getPropertyTemplatesByIndustryId 方法
    - 根据行业 ID 查询所有属性模板
    - 返回 List<IndustryPropertyTemplate>
    - _需求: 1.1, 1.2_

  - [ ] 3.3 实现 createPropertyTemplate 方法
    - 验证行业存在
    - 检查名称唯一性
    - 创建并保存属性模板
    - 返回创建的模板
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.4 实现 batchCreatePropertyTemplates 方法
    - 循环调用 createPropertyTemplate
    - 使用 @Transactional 保证事务
    - _需求: 3.1, 3.2, 3.3_

  - [ ] 3.5 实现 getPropertyTemplate 方法
    - 根据 ID 查询单个属性模板
    - 不存在时抛出异常
    - _需求: 6.1, 6.2_

  - [ ] 3.6 实现 updatePropertyTemplate 方法
    - 查询现有模板
    - 调用 aggregate.update() 方法
    - 保存更新
    - _需求: 4.1, 4.2, 4.3_

  - [ ] 3.7 实现 deletePropertyTemplate 方法
    - 查询现有模板
    - 调用 repository.delete()
    - _需求: 5.1, 5.2_

- [ ] 4. 修改 IndustryController
  - [ ] 4.1 添加 IndustryPropertyTemplateAssembler 依赖注入
    - 在构造函数中添加 propertyTemplateAssembler 参数
    - _需求: 1.1_

  - [ ] 4.2 添加 GET /industry/{industryId}/property-templates 端点
    - 调用 applicationService.getPropertyTemplatesByIndustryId()
    - 转换为 Response 列表返回
    - _需求: 1.1, 1.2, 1.3_

  - [ ] 4.3 添加 POST /industry/{industryId}/property-template 端点
    - 使用 @Valid 校验请求
    - 调用 applicationService.createPropertyTemplate()
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.4 添加 POST /industry/{industryId}/property-templates/batch 端点
    - 接收 List<CreatePropertyTemplateRequest>
    - 调用 applicationService.batchCreatePropertyTemplates()
    - _需求: 3.1, 3.2, 3.3_

  - [ ] 4.5 添加 GET /industry/property-template/{id} 端点
    - 调用 applicationService.getPropertyTemplate()
    - _需求: 6.1, 6.2_

  - [ ] 4.6 添加 PUT /industry/property-template/{id} 端点
    - 调用 applicationService.updatePropertyTemplate()
    - _需求: 4.1, 4.2, 4.3_

  - [ ] 4.7 添加 DELETE /industry/property-template/{id} 端点
    - 调用 applicationService.deletePropertyTemplate()
    - _需求: 5.1, 5.2_

- [ ] 5. 检查点 - 编译验证
  - 确保代码编译通过
  - 检查所有导入是否正确

- [ ] 6. 重启后端并测试
  - [ ] 6.1 重启 mdm-app 服务
  - [ ] 6.2 测试查询属性模板列表 API
  - [ ] 6.3 测试创建属性模板 API
  - [ ] 6.4 测试批量创建属性模板 API
  - [ ] 6.5 测试更新属性模板 API
  - [ ] 6.6 测试删除属性模板 API

- [ ] 7. 前端集成测试
  - [ ] 7.1 在商品详情页测试行业属性 Tab
  - [ ] 7.2 验证属性模板加载和保存功能

## 备注

- 领域层基础设施已存在，无需创建
- 所有端点使用 `/industry` 前缀（与现有 IndustryController 一致）
- 使用 @Transactional 保证数据一致性
