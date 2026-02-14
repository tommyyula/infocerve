---
inclusion: manual
---

# 前端开发规范

技术栈：React 18 + TypeScript + Ant Design + Vite

---

## 项目结构

```
src/
  components/     # 通用组件
  pages/          # 页面组件
  hooks/          # 自定义 Hooks
  services/       # API 服务
  stores/         # 状态管理
  utils/          # 工具函数
  types/          # 类型定义
  styles/         # 全局样式
```

---

## 组件开发规范

### 文件组织

每个组件一个目录：
```
ComponentName/
  index.tsx       # 组件主文件
  types.ts        # 类型定义
  hooks.ts        # 组件专用 Hooks
  styles.module.css  # 样式文件
```

### Props 定义

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // ...
};
```

---

## 状态管理

简单状态 - useState
复杂状态 - useReducer
跨组件状态 - Context 或状态管理库
服务端状态 - React Query 或 SWR

---

## API 调用规范

### 服务层封装

```typescript
// services/user.ts
export const userService = {
  getList: (params: UserListParams) => 
    request.get<UserListResponse>('/api/users', { params }),
  
  getById: (id: string) => 
    request.get<User>(`/api/users/${id}`),
  
  create: (data: CreateUserDto) => 
    request.post<User>('/api/users', data),
};
```

### 错误处理

统一在 request 拦截器处理
业务错误使用 message.error 提示
网络错误使用 notification.error 提示

---

## 表单开发

使用 Ant Design Form 组件
表单验证使用 rules 配置
复杂表单拆分为多个 Form.Item 组
提交时显示 loading 状态

---

## 表格开发

使用 Ant Design Table 组件
columns 配置抽离为常量
分页使用 pagination 配置
排序/筛选使用 onChange 处理

---

## 路由规范

使用 React Router v6
路由配置集中管理
懒加载页面组件
路由守卫处理权限

---

## 样式规范

优先使用 Ant Design 组件样式
自定义样式使用 CSS Modules
主题定制使用 ConfigProvider
响应式使用 Row/Col 栅格系统

---

## 性能优化

代码分割 - React.lazy + Suspense
图片懒加载 - loading="lazy"
虚拟列表 - 大数据量使用 virtual scroll
缓存 - useMemo、useCallback、React.memo

---

## 检查清单

组件开发：
- [ ] Props 类型定义完整
- [ ] 处理 loading/error 状态
- [ ] 无内存泄漏（useEffect 清理）

表单开发：
- [ ] 表单验证规则完整
- [ ] 提交按钮 loading 状态
- [ ] 错误提示友好

表格开发：
- [ ] 分页配置正确
- [ ] 空数据提示
- [ ] 操作按钮权限控制

