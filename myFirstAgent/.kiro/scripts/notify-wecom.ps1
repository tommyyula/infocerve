# Kiro Hook - WeCom Notification Script
param(
    [string]$Summary = ""
)

# 从系统环境变量刷新
$WECOM_WEBHOOK_URL = [System.Environment]::GetEnvironmentVariable("WECOM_WEBHOOK_URL", "User")
if (-not $WECOM_WEBHOOK_URL) {
    $WECOM_WEBHOOK_URL = [System.Environment]::GetEnvironmentVariable("WECOM_WEBHOOK_URL", "Machine")
}

$WECOM_MENTION_MOBILE = [System.Environment]::GetEnvironmentVariable("WECOM_MENTION_MOBILE", "User")
if (-not $WECOM_MENTION_MOBILE) {
    $WECOM_MENTION_MOBILE = [System.Environment]::GetEnvironmentVariable("WECOM_MENTION_MOBILE", "Machine")
}

if (-not $WECOM_WEBHOOK_URL) {
    Write-Host "========================================"
    Write-Host "WARN: WeCom notification not enabled"
    Write-Host "Please set env var: WECOM_WEBHOOK_URL"
    Write-Host "========================================"
    exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$currentUser = $env:USERNAME
$currentDir = Split-Path -Leaf (Get-Location).Path

# 构建 @ 提醒
$mentionText = ""
if ($WECOM_MENTION_MOBILE) {
    $mentionText = "`n`n<@$WECOM_MENTION_MOBILE>"
}

# 构建消息内容
if ($Summary) {
    $markdownContent = "**Kiro Agent 执行完成**`n`n**本次工作摘要**`n$Summary`n`n> $timestamp | $currentUser | $currentDir$mentionText"
} else {
    $markdownContent = "**Kiro Agent 执行完成**`n`n> 请检查执行结果`n`n> $timestamp | $currentUser | $currentDir$mentionText"
}

$body = @{
    msgtype = "markdown"
    markdown = @{
        content = $markdownContent
    }
} | ConvertTo-Json -Depth 10 -Compress

try {
    $response = Invoke-RestMethod -Uri $WECOM_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 5
    if ($response.errcode -eq 0) {
        Write-Host "OK: WeCom notification sent"
    } else {
        Write-Host "FAIL: $($response.errmsg)"
    }
} catch {
    Write-Host "ERROR: $_"
}
