---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/*.ts,**/*.jsx,**/*.js"
---

# React/TypeScript 编码检查清单

技术栈：React 18 + TypeScript + Ant Design + Vite

---

## 组件规范

1. 函数组件优先，使用 React.FC 或直接函数声明
2. Props 必须定义 TypeScript 接口
3. 状态管理：简单用 useState，复杂用 useReducer 或状态管理库
4. 副作用必须在 useEffect 中处理，注意依赖数组

---

## 命名规范

组件文件：PascalCase（UserProfile.tsx）
工具函数：camelCase（formatDate.ts）
常量：UPPER_SNAKE_CASE
类型/接口：PascalCase，接口加 I 前缀或不加

---

## 必须检查项

useEffect 依赖数组 - 确保包含所有依赖
事件处理函数 - 使用 useCallback 包裹（如需传递给子组件）
列表渲染 - 必须有唯一 key
表单受控组件 - value 和 onChange 配对
异步操作 - 处理 loading 和 error 状态

---

## 性能优化

React.memo - 纯展示组件
useMemo - 计算开销大的值
useCallback - 传递给子组件的回调函数
懒加载 - React.lazy + Suspense

---

## 类型安全

禁止 any - 使用具体类型或 unknown
API 响应 - 定义完整的响应类型
事件类型 - React.ChangeEvent<HTMLInputElement> 等

---

## Ant Design 使用规范

优先使用 Ant Design 组件
表单使用 Form + Form.Item
表格使用 Table + columns 配置
布局使用 Layout、Row、Col
弹窗使用 Modal
消息提示使用 message、notification

---

## 国际化

文本内容使用 i18n 函数包裹
日期/数字格式化使用 locale 相关函数

