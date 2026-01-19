---
inclusion: manual
---

# 任务归档指南

任务归档功能帮助你将已完成的任务（spec）整理归档到 .task-manager 目录，便于历史追溯和项目管理。

---

## 何时使用任务归档

当你完成一个 spec 的所有任务后，可以使用任务归档功能：

- 所有任务已完成并测试通过
- 代码已合并到主分支
- 需要清理工作区，开始新任务
- 需要保留完整的任务历史记录

---

## 快速开始

### 触发归档

在对话中输入以下任何一个命令：

```
任务归档
归档任务
archive task
```

### 归档流程

1. AI 会询问你以下信息：
   ```
   请提供以下信息：
   1. 归档目录名称（建议格式：YYYY-MM-任务编号-简短描述）
      例如：2025-12-WCS-1495-iam-refactor
   2. 要归档的 spec 目录名称（如：iam-user-system-refactor）
   3. 是否需要生成任务总结？（是/否）
   ```

2. 你提供信息：
   ```
   归档目录名称：2025-12-WCS-1495-iam-refactor
   spec 目录：iam-user-system-refactor
   生成总结：是
   ```

3. AI 执行归档：
   - 创建归档目录
   - 复制 spec 文件（requirements.md, design.md）
   - 导出 task-manager 任务列表到归档目录
   - 移动相关 memory 文件
   - 生成任务总结（如果选择）
   - 更新归档索引

---

## 归档目录结构

归档后的目录结构如下：

```
.task-manager/
  {你的用户名}/
    memory/                    # 当前活跃任务的 memory 文件
    archive/                   # 归档目录
      2025-12-WCS-1495-iam-refactor/
        requirements.md        # 需求文档
        design.md              # 设计文档
        tasks-export.json      # task-manager 导出的任务列表
        summary.md             # 任务总结（自动生成）
        archive-info.json      # 归档元数据
        memory/                # 相关的 memory JSON 文件
      2025-11-WCS-1493-itemmaster/
        ...
    archive-index.md           # 归档索引（便于查找）
    tasks.json
```

---

## 归档目录命名规范

### 推荐格式

```
YYYY-MM-任务编号-简短描述
```

### 示例

- 2025-12-WCS-1495-iam-refactor
- 2025-11-WCS-1493-itemmaster-migration
- 2025-10-FEATURE-menu-tree-optimization

### 命名建议

- 日期：使用年-月格式（YYYY-MM），便于按时间排序
- 任务编号：使用项目管理系统的任务编号（如 WCS-1495, JIRA-123）
- 描述：简短但清晰的描述（3-5个单词，使用连字符分隔）
- 语言：建议使用英文，便于跨团队协作

---

## 查询归档任务

### 查看归档列表

```
查看归档任务列表
查看归档
list archives
```

### 查看归档详情

```
查看归档任务 WCS-1495
查看归档详情 2025-12-WCS-1495-iam-refactor
```

---

## 恢复归档任务

如果需要重新查看或继续某个归档任务：

```
恢复归档任务 WCS-1495
恢复归档 2025-12-WCS-1495-iam-refactor
```

AI 会将归档文件复制回 .kiro/specs/ 目录。

---

最后更新：2026-01-03
