# Kiro AI 配置说明

本目录包含 Kiro AI 开发助手的配置文件。

## 目录结构

```
.kiro/
├── hooks/                    # Agent Hooks
│   └── wecom-notify-hook.kiro.hook
├── scripts/                  # Hook 脚本
│   └── notify-wecom.ps1
├── settings/                 # MCP 配置
│   └── mcp.json
├── specs/                    # 功能规格文档
├── steering/                 # AI 行为指导规则
└── README.md                 # 本文件
```

## 企业微信通知配置

### 功能说明

当 Kiro Agent 执行完成时，自动发送企业微信通知，提醒开发者进行人工介入检查。

### 配置步骤

#### 1. 获取 Webhook URL

1. 打开企业微信，进入目标群聊
2. 点击右上角 `...` → `群机器人` → `添加机器人`
3. 创建机器人后，复制 Webhook URL

#### 2. 设置环境变量

**Windows PowerShell**:
```powershell
# Webhook URL（必填）
setx WECOM_WEBHOOK_URL "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY"

# @ 提醒的手机号（必填）
setx WECOM_MENTION_MOBILE "13800138000"
```

**Windows CMD**:
```cmd
setx WECOM_WEBHOOK_URL "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY"
setx WECOM_MENTION_MOBILE "13800138000"
```

> ⚠️ **注意**：两个环境变量必须同时设置，否则通知功能不会启用。

#### 3. 立即生效

脚本会自动从系统注册表读取最新的环境变量，无需重启 Kiro IDE。

### 验证配置

手动运行脚本测试：
```powershell
powershell -ExecutionPolicy Bypass -File .kiro/scripts/notify-wecom.ps1 -Summary "测试消息"
```

如果配置正确，你会在企业微信群收到通知。

### 常见问题

**Q: 提示 "警告: 企业微信通知未启用"**

A: 环境变量未设置完整。两个环境变量 `WECOM_WEBHOOK_URL` 和 `WECOM_MENTION_MOBILE` 必须同时设置。

**Q: 收到通知但中文乱码**

A: 脚本文件编码问题。请确保 `notify-wecom.ps1` 使用 UTF-8 编码保存。

## Steering 规则

`steering/` 目录包含 AI 行为指导规则，用于约束 Kiro AI 的代码生成行为，确保符合项目规范。

## MCP 配置

`settings/mcp.json` 包含 Model Context Protocol 服务器配置，用于连接数据库、API 文档等外部服务。
