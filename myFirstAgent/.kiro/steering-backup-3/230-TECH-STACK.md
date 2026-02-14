---
inclusion: manual
---

# 技术栈规范

## 系统架构

```
Web 前端（React）  +  Flutter 移动端
           |
    BFF 中间层（Node.js + NestJS）
           |
    Java 后端（Spring Boot + DDD）
           |
    MySQL + Redis + RabbitMQ
```

---

## 端口规划

Frontend：5173（Vite 开发服务器）
BFF：3000（NestJS 服务）
Backend：8080（Spring Boot 服务）
MySQL：3306
Redis：6379
RabbitMQ：5672 / 15672（管理界面）

---

## 前端技术栈

核心框架：
- React 18.x
- TypeScript 5.x
- Vite 5.x
- React Router 6.x

UI 组件库：
- Ant Design 5.x
- @ant-design/pro-components 2.x
- @ant-design/icons 5.x

状态管理：
- Zustand 4.x
- React Query (TanStack Query) 5.x

工具库：
- Axios（HTTP 请求）
- dayjs（日期处理）
- lodash-es（工具函数）

测试：
- Vitest（单元测试）
- @testing-library/react（组件测试）
- Playwright（E2E 测试）

---

## BFF 技术栈

核心框架：
- Node.js 20.x LTS
- NestJS 10.x
- TypeScript 5.x

核心功能：
- @nestjs/axios（HTTP 客户端）
- @nestjs/config（配置管理）
- cache-manager（缓存管理）
- class-validator（参数校验）

BFF 职责边界：
- 应该做：API 聚合、数据格式转换、轻量缓存、认证代理
- 不应该做：业务逻辑处理、数据库操作、复杂计算

---

## 后端技术栈

核心框架：
- Java 17 / 21 LTS
- Spring Boot 3.x
- Spring Security 6.x

数据访问：
- MyBatis-Plus 3.5.x
- MySQL 8.x
- Redis 7.x
- RabbitMQ 3.13.x

工具库：
- Lombok
- MapStruct
- Hutool
- Validation（JSR-380）

---

## 移动端技术栈

核心框架：
- Flutter 3.x
- Dart 3.x

状态管理：
- Riverpod

核心功能库：
- mobile_scanner（条码扫描）
- dio（HTTP 请求）
- isar / hive（本地数据库）

---

## API 规范

RESTful 设计：
```
GET    /api/v1/items          # 列表查询
GET    /api/v1/items/{id}     # 详情查询
POST   /api/v1/items          # 新增
PUT    /api/v1/items/{id}     # 更新
DELETE /api/v1/items/{id}     # 删除
```

统一响应格式：
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应格式：
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

## RabbitMQ 使用规范

Exchange 命名：wms.{domain}.topic / fanout / direct
Queue 命名：wms.{domain}.{action}
Routing Key：{domain}.{event}

使用原则：
1. 领域事件异步化 - 跨聚合通信通过消息队列解耦
2. 幂等消费 - 消费者必须实现幂等处理
3. 死信队列 - 配置 DLQ 处理消费失败的消息
4. 消息持久化 - 生产环境消息必须持久化

---

## 环境要求

开发环境：
- JDK >= 17
- Node.js >= 20.0.0
- Flutter >= 3.16.0
- MySQL >= 8.0
- Redis >= 7.0
- RabbitMQ >= 3.13
