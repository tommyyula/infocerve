---
inclusion: manual
title: 技术架构规范
---

# 技术架构规范（Tech Stack）

## 概述

本文档定义了 WMS-Lite 项目的技术栈选型和配置规范。

### 相关规范

- **DDD 架构规范**：参见 `ddd-architecture.md`
- **TDD 工作流程**：参见 `20-TDD-WORKFLOW.md`

---

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐
│   Web 前端       │     │  Flutter 移动端  │
│   (React)       │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │    BFF 中间层          │
         │  (Node.js + NestJS)   │
         │  - API 聚合           │
         │  - 数据格式转换        │
         │  - 轻量缓存           │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │    Java 后端          │
         │  (Spring Boot + DDD)  │
         │  - 核心业务逻辑        │
         │  - 数据持久化          │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │   MySQL + Redis       │
         │   + RabbitMQ          │
         └───────────────────────┘
```

### 端口规划

| 服务 | 端口 | 说明 |
|-----|------|------|
| Frontend | 5173 | Vite 开发服务器 |
| BFF | 3000 | NestJS 服务 |
| Backend | 8080 | Spring Boot 服务 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| RabbitMQ | 5672 | 消息队列 |
| RabbitMQ Management | 15672 | 管理界面 |

---

## 前端技术栈

### 核心框架

| 技术 | 版本 | 说明 |
|-----|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| React Router | 6.x | 路由管理 |

### UI 组件库

| 技术 | 版本 | 说明 |
|-----|------|------|
| Ant Design | 5.x | 基础组件库 |
| @ant-design/pro-components | 2.x | 高级业务组件（ProTable、ProForm） |
| @ant-design/icons | 5.x | 图标库 |

### 状态管理

| 技术 | 版本 | 说明 |
|-----|------|------|
| Zustand | 4.x | 轻量状态管理 |
| React Query (TanStack Query) | 5.x | 服务端状态管理 |

### 工具库

| 技术 | 说明 |
|-----|------|
| Axios | HTTP 请求 |
| dayjs | 日期处理 |
| lodash-es | 工具函数 |

### 前端测试

| 技术 | 说明 |
|-----|------|
| Vitest | 单元测试框架 |
| @testing-library/react | React 组件测试 |
| Playwright | E2E 测试 |
| msw | API Mock |

---

## BFF 中间层技术栈（Node.js）

### 核心框架

| 技术 | 版本 | 说明 |
|-----|------|------|
| Node.js | 20.x LTS | 运行时 |
| NestJS | 10.x | Web 框架 |
| TypeScript | 5.x | 类型系统 |

### 核心功能

| 技术 | 说明 |
|-----|------|
| @nestjs/axios | HTTP 客户端（调用后端） |
| @nestjs/config | 配置管理 |
| cache-manager | 缓存管理 |
| class-validator | 参数校验 |
| class-transformer | 数据转换 |

### BFF 测试

| 技术 | 说明 |
|-----|------|
| Jest | 单元测试框架 |
| @nestjs/testing | NestJS 测试工具 |
| supertest | HTTP 测试 |

### BFF 职责边界

| 应该做 | 不应该做 |
|-------|---------|
| API 聚合（多接口合一） | 业务逻辑处理 |
| 数据格式转换 | 数据库操作 |
| 轻量缓存 | 复杂计算 |
| 认证代理 | 事务管理 |
| 错误格式化 | 领域规则校验 |

---

## 移动端技术栈（Flutter）

### 核心框架

| 技术 | 版本 | 说明 |
|-----|------|------|
| Flutter | 3.x | 跨平台框架 |
| Dart | 3.x | 编程语言 |

### 状态管理

| 技术 | 说明 |
|-----|------|
| Riverpod | 状态管理（推荐） |
| flutter_hooks | Hooks 支持 |

### 核心功能库

| 技术 | 说明 |
|-----|------|
| mobile_scanner | 条码/二维码扫描 |
| dio | HTTP 请求 |
| isar / hive | 本地数据库（离线支持） |
| flutter_blue_plus | 蓝牙（打印机连接） |
| permission_handler | 权限管理 |

### UI 组件

| 技术 | 说明 |
|-----|------|
| flutter_screenutil | 屏幕适配 |
| pull_to_refresh | 下拉刷新 |
| cached_network_image | 图片缓存 |

### 工具库

| 技术 | 说明 |
|-----|------|
| freezed | 不可变数据类 |
| json_serializable | JSON 序列化 |
| logger | 日志 |
| intl | 国际化 |

### 移动端测试

| 技术 | 说明 |
|-----|------|
| flutter_test | 单元测试 |
| integration_test | 集成测试 |
| mockito | Mock 框架 |

---

## 后端技术栈（Java）

### 核心框架

| 技术 | 版本 | 说明 |
|-----|------|------|
| Java | 17 / 21 LTS | 运行时 |
| Spring Boot | 3.x | Web 框架 |
| Spring Security | 6.x | 安全框架 |

### 数据访问

| 技术 | 版本 | 说明 |
|-----|------|------|
| MyBatis-Plus | 3.5.x | ORM 框架 |
| MySQL | 8.x | 主数据库 |
| Redis | 7.x | 缓存 |
| RabbitMQ | 3.13.x | 消息队列 |
| HikariCP | - | 连接池（Spring Boot 默认） |

### 工具库

| 技术 | 说明 |
|-----|------|
| Lombok | 简化代码 |
| MapStruct | 对象映射 |
| Hutool | 工具类库 |
| Validation | 参数校验（JSR-380） |
| Slf4j + Logback | 日志 |

### 消息队列

| 技术 | 说明 |
|-----|------|
| spring-boot-starter-amqp | RabbitMQ 集成 |
| Spring AMQP | 消息发送与接收 |

### 消息队列使用场景

| 场景 | Exchange 类型 | 说明 |
|-----|--------------|------|
| 领域事件发布 | Topic | 入库完成、出库完成等事件通知 |
| 库存变动通知 | Fanout | 广播库存变化给多个消费者 |
| 异步任务 | Direct | 报表生成、数据同步等耗时任务 |
| 延迟处理 | Dead Letter | 超时未处理订单自动取消 |

### 后端测试

| 技术 | 说明 |
|-----|------|
| JUnit 5 | 单元测试框架 |
| Mockito | Mock 框架 |
| Spring Boot Test | 集成测试 |
| Testcontainers | 数据库集成测试 |

---

## 项目结构（DDD 架构）

```
wms-lite/
├── frontend/                           # Web 前端（React）
│   ├── src/
│   │   ├── features/                   # 领域模块
│   │   │   ├── inventory/
│   │   │   ├── inbound/
│   │   │   ├── outbound/
│   │   │   └── master-data/
│   │   ├── shared/                     # 共享模块
│   │   └── App.tsx
│   └── package.json
│
├── bff/                                # BFF 中间层（NestJS）
│   ├── src/
│   │   ├── modules/                    # 业务模块
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.service.ts
│   │   │   │   └── inventory.module.ts
│   │   │   ├── inbound/
│   │   │   ├── outbound/
│   │   │   └── master-data/
│   │   ├── common/                     # 公共模块
│   │   │   ├── services/               # 后端调用服务
│   │   │   ├── types/                  # 类型定义
│   │   │   └── decorators/             # 装饰器
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   └── package.json
│
├── backend/                            # Java 后端（DDD 四层架构）
│   ├── src/main/java/com/wms/
│   │   ├── interfaces/                 # 接口层
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   └── assembler/
│   │   ├── application/                # 应用层
│   │   │   ├── service/
│   │   │   ├── command/
│   │   │   └── query/
│   │   ├── domain/                     # 领域层
│   │   │   ├── model/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── event/
│   │   │   └── exception/
│   │   ├── infrastructure/             # 基础设施层
│   │   │   ├── persistence/
│   │   │   ├── config/
│   │   │   ├── gateway/
│   │   │   ├── messaging/              # 消息队列
│   │   │   └── common/
│   │   └── WmsLiteApplication.java
│   └── pom.xml
│
├── mobile/                             # Flutter 移动端（DDD 架构）
│   ├── lib/
│   │   ├── features/
│   │   │   ├── inventory/
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── presentation/
│   │   │   ├── scan/
│   │   │   ├── inbound/
│   │   │   └── outbound/
│   │   ├── core/
│   │   └── shared/
│   └── pubspec.yaml
│
├── test/                               # 前端测试目录
└── docker-compose.yml
```

---

## 开发规范

### DDD 分层规范（后端）

| 层 | 职责 | 依赖 |
|---|------|------|
| Interfaces | 接收请求、DTO 转换、返回响应 | Application |
| Application | 编排领域对象、事务管理、不含业务逻辑 | Domain |
| Domain | 业务逻辑、领域模型、仓储接口 | 无依赖 |
| Infrastructure | 技术实现、持久化、外部服务 | Domain |

### BFF 规范

- 按领域模块组织代码（modules/）
- Service 负责调用后端、聚合数据
- Controller 负责接收请求、返回响应
- 不做业务逻辑，只做数据编排

### 命名规范

| 类型 | 命名规范 | 示例 |
|-----|---------|------|
| 聚合根 | 名词 | `Inventory`、`InboundOrder` |
| 实体 | 名词 | `InboundOrderLine` |
| 值对象 | 名词（record） | `Quantity`、`ItemCode` |
| 领域服务 | 名词 + DomainService | `InventoryDomainService` |
| 应用服务 | 名词 + ApplicationService | `InventoryApplicationService` |
| BFF Service | 名词 + Service | `InventoryService` |
| BFF Controller | 名词 + Controller | `InventoryController` |

### Java 规范

- 使用 Java 17+ 特性（record、sealed class、pattern matching）
- 值对象使用 record 定义
- 领域层不依赖 Spring、MyBatis 等框架
- 业务逻辑放在领域对象中，禁止贫血模型

### TypeScript 规范（BFF）

- 使用 NestJS 装饰器风格
- 使用 class-validator 做参数校验
- 使用 interface 定义类型
- 异步操作使用 async/await

### React 规范

- 使用函数组件 + Hooks
- 按领域模块组织代码（feature-first）
- 组件文件使用 `.tsx` 扩展名
- Props 使用 interface 定义

### Flutter 规范

- 使用 Riverpod 进行状态管理
- 按领域模块组织代码（feature-first）
- 使用 freezed 定义不可变数据模型
- Widget 和业务逻辑分离

---

## API 规范

### RESTful 设计

```
GET    /api/v1/items          # 列表查询
GET    /api/v1/items/{id}     # 详情查询
POST   /api/v1/items          # 新增
PUT    /api/v1/items/{id}     # 更新
DELETE /api/v1/items/{id}     # 删除
```

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 分页响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 脚本命令

### 前端

```bash
cd frontend
npm install
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # 构建生产版本
npm run test         # 运行测试
```

### BFF

```bash
cd bff
npm install
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建
npm run test         # 运行测试
```

### 后端

```bash
cd backend
./mvnw spring-boot:run    # 启动 (localhost:8080)
./mvnw clean package      # 打包
./mvnw test               # 运行测试
```

### 移动端

```bash
cd mobile
flutter pub get
flutter run               # 启动
flutter build apk         # 构建 APK
flutter test              # 运行测试
```

### 全部启动（开发环境）

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 启动后端 (新终端)
cd backend && ./mvnw spring-boot:run

# 3. 启动 BFF (新终端)
cd bff && npm run dev

# 4. 启动前端 (新终端)
cd frontend && npm run dev
```

---

## 环境要求

### 开发环境

- JDK >= 17
- Node.js >= 20.0.0
- Flutter >= 3.16.0
- Dart >= 3.2.0
- MySQL >= 8.0
- Redis >= 7.0
- RabbitMQ >= 3.13
- Maven >= 3.9
- Android Studio / Xcode（移动端开发）
- 推荐 IDE：IntelliJ IDEA / VS Code / Kiro

### Docker 本地开发

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wms_lite
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
```

---

## RabbitMQ 使用规范

### Exchange 命名规范

| 类型 | 命名格式 | 示例 |
|-----|---------|------|
| Topic | wms.{domain}.topic | wms.inventory.topic |
| Fanout | wms.{domain}.fanout | wms.notification.fanout |
| Direct | wms.{domain}.direct | wms.task.direct |

### Queue 命名规范

| 格式 | 示例 |
|-----|------|
| wms.{domain}.{action} | wms.inventory.update |
| wms.{domain}.{consumer} | wms.inventory.notification-service |

### Routing Key 规范

| 格式 | 示例 |
|-----|------|
| {domain}.{event} | inventory.changed |
| {domain}.{aggregate}.{event} | inbound.order.completed |

### 消息结构

```json
{
  "messageId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "eventType": "InventoryChangedEvent",
  "aggregateId": "inventory-123",
  "payload": {}
}
```

### 使用原则

1. **领域事件异步化**：跨聚合通信通过消息队列解耦
2. **幂等消费**：消费者必须实现幂等处理
3. **死信队列**：配置 DLQ 处理消费失败的消息
4. **消息持久化**：生产环境消息必须持久化
