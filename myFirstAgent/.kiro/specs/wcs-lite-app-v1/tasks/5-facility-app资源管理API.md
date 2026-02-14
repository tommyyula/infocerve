# WCS-1670 facility-app 资源管理 API

## 任务概述

- **Jira Issue**: WCS-1670
- **预估工时**: 3 人天（24 小时）
- **前置依赖**: WCS-1647（基础设施与领域模型）
- **后续任务**: WCS-1651（CLI命令与集成测试）、前端 WCS 模块开发

> **[说明]** 本任务实现 facility-app 的资源管理 API：
> - Zone 区域管理
> - Station 站点管理
> - Device 设备管理
> - StationDevice 站点设备绑定
> 
> **[架构说明]** facility-app 是独立部署的应用，类似 iam-app 结构。
> API 路径前缀：`/facility/`

## 参考文档

- 需求文档: [requirements.md](../requirements.md) - 第 4.3 节「L3 资源拓扑层」
- 设计文档: [design.md](../design.md) - 第 2.2 节「facility-app 项目结构」

---

## 任务清单

### 任务 5.1：Zone 区域管理 API（4h）

**目标**: 实现 Zone 区域的 CRUD API

**交付物**:
- [ ] ZoneController（REST API）
  - GET /facility/zones - 分页查询
  - GET /facility/zones/{zoneId} - 详情
  - POST /facility/zones - 创建
  - PUT /facility/zones/{zoneId} - 更新
  - DELETE /facility/zones/{zoneId} - 删除
  - PUT /facility/zones/{zoneId}/status - 状态切换
- [ ] ZoneApplicationService
- [ ] Zone 实体、Repository、Mapper

**表名**: def_zone

---

### 任务 5.2：Station 站点管理 API（4h）

**目标**: 实现 Station 站点的 CRUD API

**交付物**:
- [ ] StationController（REST API）
  - GET /facility/stations - 分页查询（支持按 zoneId 筛选）
  - GET /facility/stations/{stationId} - 详情
  - POST /facility/stations - 创建
  - PUT /facility/stations/{stationId} - 更新
  - DELETE /facility/stations/{stationId} - 删除
  - PUT /facility/stations/{stationId}/status - 状态切换
- [ ] StationApplicationService
- [ ] Station 实体、Repository、Mapper

**表名**: def_station

---

### 任务 5.3：Device 设备管理 API（6h）

**目标**: 实现 Device 设备的 CRUD API

**交付物**:
- [ ] DeviceController（REST API）
  - GET /facility/devices - 分页查询（支持按 deviceType、stationId 筛选）
  - GET /facility/devices/{deviceId} - 详情
  - POST /facility/devices - 创建
  - PUT /facility/devices/{deviceId} - 更新
  - DELETE /facility/devices/{deviceId} - 删除
  - PUT /facility/devices/{deviceId}/status - 状态切换
  - POST /facility/devices/{deviceId}/test-connection - 测试设备连接
- [ ] DeviceApplicationService
- [ ] Device 实体、Repository、Mapper

**表名**: def_device

---

### 任务 5.4：Station-Device 绑定 API（4h）

**目标**: 实现站点与设备的绑定关系管理

**交付物**:
- [ ] StationDeviceController（REST API）
  - GET /facility/stations/{stationId}/devices - 查询站点设备列表
  - POST /facility/stations/{stationId}/devices - 添加绑定
  - DELETE /facility/stations/{stationId}/devices/{deviceId} - 解除绑定
  - PUT /facility/stations/{stationId}/devices/{deviceId} - 更新绑定类型
- [ ] StationDeviceApplicationService
- [ ] StationDevice 实体、Repository、Mapper

**表名**: def_station_device

---

### 任务 5.5：Point 点位管理 API（2h）

**目标**: 实现 Point 点位的 CRUD API

**交付物**:
- [ ] PointController（REST API）
  - GET /facility/points - 分页查询（支持按 mapCode 筛选）
  - GET /facility/points/{pointId} - 详情
  - POST /facility/points - 创建
  - PUT /facility/points/{pointId} - 更新
  - DELETE /facility/points/{pointId} - 删除
  - PUT /facility/points/{pointId}/status - 状态切换
- [ ] PointApplicationService
- [ ] Point 实体、Repository、Mapper

**表名**: def_map_point

---

### 任务 5.6：Map 地图管理 API（2h）

**目标**: 实现 Map 地图的 CRUD API

**交付物**:
- [ ] MapController（REST API）
  - GET /facility/maps - 分页查询（支持按 equipmentType 筛选）
  - GET /facility/maps/{mapId} - 详情
  - POST /facility/maps - 创建
  - PUT /facility/maps/{mapId} - 更新
  - DELETE /facility/maps/{mapId} - 删除
- [ ] MapApplicationService
- [ ] Map 实体、Repository、Mapper

**表名**: def_map_info

---

### 任务 5.7：MapLocation 位置管理 API（3h）

**目标**: 实现 MapLocation 位置的 CRUD API

**交付物**:
- [ ] MapLocationController（REST API）
  - GET /facility/locations - 分页查询（支持按 type、status 筛选）
  - GET /facility/locations/{locationId} - 详情
  - POST /facility/locations - 创建
  - PUT /facility/locations/{locationId} - 更新
  - DELETE /facility/locations/{locationId} - 删除
  - PUT /facility/locations/{locationId}/status - 状态切换
  - PUT /facility/locations/{locationId}/device-status - 设备状态更新
- [ ] MapLocationApplicationService
- [ ] MapLocation 实体、Repository、Mapper

**表名**: def_map_location

---

### 任务 5.8：MapVersion 地图版本 API（2h）

**目标**: 实现 MapVersion 地图版本的 CRUD API

**交付物**:
- [ ] MapVersionController（REST API）
  - GET /facility/maps/{mapCode}/versions - 查询版本列表
  - GET /facility/maps/{mapCode}/versions/{version} - 版本详情
  - POST /facility/maps/{mapCode}/versions - 创建版本
  - DELETE /facility/maps/{mapCode}/versions/{version} - 删除版本
  - GET /facility/maps/{mapCode}/versions/{version}/download - 下载版本文件
- [ ] MapVersionApplicationService
- [ ] MapVersion 实体、Repository、Mapper

**表名**: def_map_version

---

### 任务 5.9：MapPath 地图路径 API（2h）

**目标**: 实现 MapPath 地图路径的 CRUD API

**交付物**:
- [ ] MapPathController（REST API）
  - GET /facility/paths - 分页查询（支持按 mapCode、pathType 筛选）
  - GET /facility/paths/{pathId} - 详情
  - POST /facility/paths - 创建
  - PUT /facility/paths/{pathId} - 更新
  - DELETE /facility/paths/{pathId} - 删除
  - PUT /facility/paths/{pathId}/status - 状态切换
- [ ] MapPathApplicationService
- [ ] MapPath 实体、Repository、Mapper

**表名**: def_map_path

---

### 任务 5.10：MapMappingRelation 映射关系 API（1h）

**目标**: 实现 MapMappingRelation 映射关系的 CRUD API

**交付物**:
- [ ] MapMappingRelationController（REST API）
  - GET /facility/mapping-relations - 分页查询（支持按 relationType 筛选）
  - GET /facility/mapping-relations/{relationId} - 详情
  - POST /facility/mapping-relations - 创建
  - PUT /facility/mapping-relations/{relationId} - 更新
  - DELETE /facility/mapping-relations/{relationId} - 删除
- [ ] MapMappingRelationApplicationService
- [ ] MapMappingRelation 实体、Repository、Mapper

**表名**: def_map_mapping_relation

---

### 任务 5.11：ContainerSpec 容器规格 API（1h）

**目标**: 实现 ContainerSpec 容器规格的 CRUD API

**交付物**:
- [ ] ContainerSpecController（REST API）
  - GET /facility/container-specs - 分页查询（支持按 containerType 筛选）
  - GET /facility/container-specs/{containerSpecId} - 详情
  - POST /facility/container-specs - 创建
  - PUT /facility/container-specs/{containerSpecId} - 更新
  - DELETE /facility/container-specs/{containerSpecId} - 删除
- [ ] ContainerSpecApplicationService
- [ ] ContainerSpec 实体、Repository、Mapper（已在任务1.6.7定义）

**表名**: def_container_spec

---

## 验收标准

1. 资源管理 API 能正常调用，返回格式符合规范
2. 分页查询支持筛选条件
3. 创建/更新有参数校验
4. 删除有关联检查（如 Zone 下有 Station 则不能删除）

---

## 注意事项

- API 路径统一前缀 `/facility/`
- 返回格式使用项目统一的 Result 包装
- 分页使用项目统一的 PageResult
- 遵循 DDD 分层，Controller -> ApplicationService -> Repository

---

最后更新：2025-12-24
