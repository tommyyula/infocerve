---
inclusion: fileMatch
fileMatchPattern: "**/*Tree*.java,**/*Menu*.java,**/*Category*.java,**/*Org*.java"
---

# 🎯 树形结构实现规范

> **推荐方案**：路径枚举模型（Path Enumeration）

---

## 🔴 数据库设计

```sql
CREATE TABLE xxx_menu (
    menu_id BIGINT PRIMARY KEY,
    parent_id BIGINT DEFAULT 0,
    menu_name VARCHAR(64),
    tree_path VARCHAR(500) NOT NULL,  -- 路径：/1/2/5/
    depth INT DEFAULT 0,              -- 深度：根节点为0
    order_num INT DEFAULT 0,
    
    INDEX idx_tree_path (tree_path(100)),  -- 前缀索引
    INDEX idx_parent_id (parent_id)
);
```

**路径格式**：`/祖先ID/.../父ID/当前ID/`
**示例**：`/1/2/5/` 表示节点5的父节点是2，祖先是1

---

## 🔴 实体设计

```java
@TableName("xxx_menu")
public class Menu extends BaseEntity {
    private Long menuId;
    private Long parentId;
    private String treePath;  // 树形路径
    private Integer depth;    // 深度
    
    // 构建路径
    public static String buildPath(String parentPath, Long menuId) {
        if (StringUtils.isBlank(parentPath)) {
            return "/" + menuId + "/";
        }
        return parentPath + menuId + "/";
    }
    
    // 计算深度
    public static Integer calculateDepth(String path) {
        return path.split("/").length - 2;
    }
    
    public boolean isRoot() {
        return this.parentId == null || this.parentId == 0L;
    }
}
```

---

## 🔴 查询规范

### ✅ 查询子树（一次查询）
```java
// 使用 likeRight，可利用索引
wrapper.likeRight(Menu::getTreePath, path);  // path LIKE '/1/2/%'
```

### ❌ 禁止
```java
// 不能使用 like，无法利用索引
wrapper.like(Menu::getTreePath, path);  // path LIKE '%/1/2/%'
```

---

## 🔴 创建/移动节点

### 创建节点
```java
// 1. 先保存获取ID
menuRepository.save(menu);

// 2. 计算并更新路径
if (menu.isRoot()) {
    menu.setTreePath(Menu.buildPath(null, menu.getMenuId()));
    menu.setDepth(0);
} else {
    Menu parent = menuRepository.findById(parentId);
    menu.setTreePath(Menu.buildPath(parent.getTreePath(), menu.getMenuId()));
    menu.setDepth(Menu.calculateDepth(menu.getTreePath()));
}
menuRepository.update(menu);
```

### 移动节点
```java
// 1. 验证：不能移动到自己的子节点下
if (newParent.getTreePath().startsWith(menu.getTreePath())) {
    throw new IllegalArgumentException("不能移动到子节点下");
}

// 2. 更新当前节点和所有子节点的路径
String oldPath = menu.getTreePath();
String newPath = Menu.buildPath(newParentPath, menu.getMenuId());

// 3. 批量更新子节点：替换路径前缀
children.forEach(child -> {
    child.setTreePath(child.getTreePath().replace(oldPath, newPath));
    child.setDepth(Menu.calculateDepth(child.getTreePath()));
});
```

---

## 🔵 性能要点

- 前缀索引：`INDEX idx_tree_path (tree_path(100))`
- 查询子树：一次 `LIKE 'path%'` 查询
- 路径长度限制：VARCHAR(500)，约支持50层深度

---

*最后更新：2025-12-22*
