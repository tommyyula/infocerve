# 行业属性模板 API - 需求规格

## 概述

为 IndustryController 添加缺失的行业属性模板 API 端点，使前端能够管理行业的自定义属性模板。

## 背景

- 前端 `industryApi.ts` 已定义了属性模板相关的 API 调用
- 后端领域层已实现：`IndustryPropertyTemplate` 聚合、`IndustryPropertyTemplateRepository` 仓储
- 后端缺失：Controller 端点和 ApplicationService 方法
- 设计规格 `06-design.md` 3.7 节已定义 API 设计

## 术语表

- **Industry（行业）**: 商品所属的行业分类，如食品、电子、服装等
- **PropertyTemplate（属性模板）**: 行业级别的自定义属性定义，用于规范该行业商品需要填写的属性
- **PropertyType（属性类型）**: TEXT（文本）、DATE（日期）、NUMBER（数字）、SELECT（下拉选择）

## 需求

### 需求 1: 查询行业属性模板列表

**用户故事:** 作为商品管理员，我想要查看某个行业的所有属性模板，以便于了解该行业商品需要填写哪些自定义属性。

#### 验收标准

1. WHEN 用户请求查询行业属性模板列表 THEN 系统 SHALL 返回该行业的所有属性模板
2. WHEN 行业不存在属性模板 THEN 系统 SHALL 返回空数组
3. THE 响应 SHALL 包含 id、industryId、name、type、isRequired、options、uom 字段

### 需求 2: 创建单个属性模板

**用户故事:** 作为商品管理员，我想要为行业添加一个属性模板，以便于定义该行业商品的自定义属性。

#### 验收标准

1. WHEN 用户提交有效的属性模板数据 THEN 系统 SHALL 创建属性模板并返回创建结果
2. WHEN name 或 type 字段为空 THEN 系统 SHALL 返回参数校验错误
3. WHEN type 为 SELECT 且 options 为空 THEN 系统 SHALL 返回参数校验错误
4. WHEN 同一行业下已存在相同 name 的模板 THEN 系统 SHALL 返回名称重复错误
5. WHEN 行业不存在 THEN 系统 SHALL 返回行业不存在错误

### 需求 3: 批量创建属性模板

**用户故事:** 作为商品管理员，我想要一次性为行业添加多个属性模板，以便于快速配置行业属性。

#### 验收标准

1. WHEN 用户提交属性模板数组 THEN 系统 SHALL 批量创建所有模板
2. WHEN 批次内存在重复的 name THEN 系统 SHALL 返回名称重复错误
3. WHEN 任一模板创建失败 THEN 系统 SHALL 回滚整个批次

### 需求 4: 更新属性模板

**用户故事:** 作为商品管理员，我想要修改已有的属性模板，以便于调整属性定义。

#### 验收标准

1. WHEN 用户提交更新数据 THEN 系统 SHALL 更新属性模板
2. WHEN 属性模板不存在 THEN 系统 SHALL 返回模板不存在错误
3. WHEN 更新后的 name 与其他模板重复 THEN 系统 SHALL 返回名称重复错误

### 需求 5: 删除属性模板

**用户故事:** 作为商品管理员，我想要删除不需要的属性模板，以便于清理无用配置。

#### 验收标准

1. WHEN 用户请求删除属性模板 THEN 系统 SHALL 删除该模板
2. WHEN 属性模板不存在 THEN 系统 SHALL 返回模板不存在错误

### 需求 6: 获取属性模板详情

**用户故事:** 作为商品管理员，我想要查看单个属性模板的详细信息，以便于了解属性配置。

#### 验收标准

1. WHEN 用户请求属性模板详情 THEN 系统 SHALL 返回完整的模板信息
2. WHEN 属性模板不存在 THEN 系统 SHALL 返回模板不存在错误

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/industry/{industryId}/property-templates` | 查询行业属性模板列表 |
| POST | `/industry/{industryId}/property-template` | 创建单个属性模板 |
| POST | `/industry/{industryId}/property-templates/batch` | 批量创建属性模板 |
| GET | `/industry/property-template/{id}` | 获取属性模板详情 |
| PUT | `/industry/property-template/{id}` | 更新属性模板 |
| DELETE | `/industry/property-template/{id}` | 删除属性模板 |

## 已存在的基础设施

- `IndustryPropertyTemplate` - 领域聚合 ✅
- `IndustryPropertyTemplateRepository` - 仓储接口 ✅
- `IndustryPropertyTemplateRepositoryImpl` - 仓储实现 ✅
- `IndustryPropertyTemplateConverter` - Entity/Aggregate 转换 ✅
- `IndustryPropertyTemplateEntity` - 持久化实体 ✅
