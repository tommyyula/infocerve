# 库存领域流程图

本目录包含库存领域的 PlantUML 流程图文件。

## 文件列表

| 文件名 | 描述 |
|--------|------|
| 01-inventory-inbound-flow.puml | 库存入库流程（收货 -> 上架） |
| 02-inventory-outbound-flow.puml | 库存出库流程（锁定 -> 拣货 -> 打包 -> 发货） |
| 03-adjustment-flow.puml | 库存调整流程（创建 -> 审批 -> 执行） |
| 04-inventory-import-flow.puml | 库存导入流程（上传 -> 验证 -> 导入） |
| 05-inventory-status-state.puml | 库存状态流转图 |
| 06-lp-status-state.puml | LP状态流转图 |
| 07-adjustment-status-state.puml | 调整单状态流转图 |
| 08-context-map.puml | 限界上下文映射图 |
| 09-inventory-lock-flow.puml | 库存锁定流程 |
| 10-inventory-move-sequence.puml | 库存移动时序图 |

## 查看方式

### 方式一：PlantUML 在线服务

访问 [PlantUML Server](http://www.plantuml.com/plantuml/uml/) 并粘贴 `.puml` 文件内容。

### 方式二：VS Code 插件

安装 [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) 插件，然后：
- 打开 `.puml` 文件
- 按 `Alt + D` 预览图表

### 方式三：命令行生成

```bash
# 安装 PlantUML
brew install plantuml  # macOS
apt install plantuml   # Ubuntu

# 生成 PNG 图片
plantuml *.puml

# 生成 SVG 图片
plantuml -tsvg *.puml
```

## 图表说明

### 活动图（Activity Diagram）
- 01-04, 09: 展示业务流程的步骤和分支

### 状态图（State Diagram）
- 05-07: 展示实体状态之间的转换关系

### 组件图（Component Diagram）
- 08: 展示限界上下文之间的关系

### 时序图（Sequence Diagram）
- 10: 展示对象之间的交互顺序
