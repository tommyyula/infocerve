---
inclusion: fileMatch
fileMatchPattern: "**/*.java"
---

# 阿里巴巴 Java 开发规范（编码后必查）

---

## 命名规范

类名：UpperCamelCase
方法/变量：lowerCamelCase
常量：UPPER_SNAKE_CASE
包名：全小写

---

## 代码质量

禁止魔法值 - 用常量定义
方法不超过 80 行
参数不超过 5 个

---

## 注释规范

所有类必须有 JavaDoc
所有 public 方法必须有 JavaDoc
JavaDoc 必须包含：描述、@param、@return、@throws

---

## 异常处理

使用项目统一的异常类 + 错误码枚举
禁止硬编码错误消息

---

详细内容见项目根目录 `alibaba-java-coding-guidelines.md`

