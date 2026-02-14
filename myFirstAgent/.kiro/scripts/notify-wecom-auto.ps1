# Kiro Hook - WeCom Auto Notification Script
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 等待 Kiro 写入会话文件
Start-Sleep -Seconds 2

$WECOM_WEBHOOK_URL = [System.Environment]::GetEnvironmentVariable("WECOM_WEBHOOK_URL", "User")
if (-not $WECOM_WEBHOOK_URL) {
    $WECOM_WEBHOOK_URL = [System.Environment]::GetEnvironmentVariable("WECOM_WEBHOOK_URL", "Machine")
}

$WECOM_MENTION_MOBILE = [System.Environment]::GetEnvironmentVariable("WECOM_MENTION_MOBILE", "User")
if (-not $WECOM_MENTION_MOBILE) {
    $WECOM_MENTION_MOBILE = [System.Environment]::GetEnvironmentVariable("WECOM_MENTION_MOBILE", "Machine")
}

if (-not $WECOM_WEBHOOK_URL -or -not $WECOM_MENTION_MOBILE) {
    Write-Host "警告: 企业微信通知未启用"
    if (-not $WECOM_WEBHOOK_URL) { Write-Host "  - 缺少环境变量 WECOM_WEBHOOK_URL" }
    if (-not $WECOM_MENTION_MOBILE) { Write-Host "  - 缺少环境变量 WECOM_MENTION_MOBILE" }
    exit 0
}

$currentDir = (Get-Location).Path
$currentDirName = Split-Path -Leaf $currentDir
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$currentUser = $env:USERNAME

function Get-ChatSummary {
    # 从 KiroLLMLogs.log 读取最近的对话
    $logsRoot = "$env:APPDATA\Kiro\logs"
    
    if (-not (Test-Path $logsRoot)) { return $null }
    
    # 获取所有日志文件，按更新时间排序
    $allLogs = Get-ChildItem $logsRoot -Recurse -Filter "KiroLLMLogs.log" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
    
    # 用脚本路径作为匹配特征（只有当前窗口会涉及这个脚本）
    $scriptMarker = "notify-wecom-auto.ps1"
    
    $logFile = $null
    foreach ($log in $allLogs) {
        $content = Get-Content $log.FullName -Tail 500 -Encoding UTF8 -ErrorAction SilentlyContinue
        $contentStr = $content -join "`n"
        
        if ($contentStr.Contains($scriptMarker)) {
            $logFile = $log
            break
        }
    }
    
    # 如果没找到匹配的，用最新的
    if (-not $logFile) {
        $logFile = $allLogs | Select-Object -First 1
        Write-Host "DEBUG: No matching log, using latest"
    }
    
    if (-not $logFile) {
        Write-Host "DEBUG: No log file found"
        return $null
    }
    
    Write-Host "DEBUG: Log file: $($logFile.FullName)"
    Write-Host "DEBUG: Last modified: $($logFile.LastWriteTime)"
    
    try {
        # 读取最后200行日志
        $lines = Get-Content $logFile.FullName -Tail 200 -Encoding UTF8
        
        # 解析对话消息
        $messages = @()
        $currentRole = $null
        $currentContent = ""
        
        foreach ($line in $lines) {
            if ($line -match '-------------- (Human|AI) Message\[(\d+)\] --------------') {
                # 保存上一条消息
                if ($currentRole -and $currentContent) {
                    $messages += @{ role = $currentRole; content = $currentContent.Trim() }
                }
                $currentRole = $matches[1]
                $currentContent = ""
            }
            elseif ($line -match '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ \[info\] (.+)$') {
                $content = $matches[1]
                # 尝试解析 JSON 格式的内容
                if ($content -match '^\[.*\]$') {
                    try {
                        $jsonContent = $content | ConvertFrom-Json
                        foreach ($part in $jsonContent) {
                            if ($part.type -eq "text" -and $part.text) {
                                $currentContent += $part.text + " "
                            }
                        }
                    } catch {
                        $currentContent += $content + " "
                    }
                }
            }
        }
        
        # 保存最后一条消息
        if ($currentRole -and $currentContent) {
            $messages += @{ role = $currentRole; content = $currentContent.Trim() }
        }
        
        Write-Host "DEBUG: Total messages parsed: $($messages.Count)"
        
        if ($messages.Count -eq 0) { return $null }
        
        # 取最后2条消息（1轮对话：用户 + AI）
        $recentMessages = $messages | Select-Object -Last 2
        
        $dialogParts = @()
        foreach ($msg in $recentMessages) {
            $content = $msg.content
            
            # 清理内容
            $content = $content -replace '\s+', ' '
            $content = $content -replace '#\[\[file:[^\]]+\]\]', '[file]'
            $content = $content -replace '<[^>]+>', ''
            $content = $content -replace '<steering-reminder>.*?</steering-reminder>', ''
            $content = $content -replace '<EnvironmentContext>.*?</EnvironmentContext>', ''
            $content = $content.Trim()
            
            if (-not $content) { continue }
            
            # 用户和AI都截取100字
            if ($content.Length -gt 100) { $content = $content.Substring(0, 100) + "..." }
            
            if ($msg.role -eq "Human") {
                $dialogParts += "U: $content"
            } elseif ($msg.role -eq "AI") {
                $dialogParts += "A: $content"
            }
        }
        
        if ($dialogParts.Count -gt 0) {
            $summary = $dialogParts -join "`n"
            if ($summary.Length -gt 300) {
                $summary = $summary.Substring(0, 300) + "..."
            }
            return $summary
        }
    } catch {
        Write-Host "DEBUG: Error parsing log: $_"
    }
    return $null
}

$summary = Get-ChatSummary

$mentionText = ""
if ($WECOM_MENTION_MOBILE) { $mentionText = "`n`n<@$WECOM_MENTION_MOBILE>" }

if ($summary) {
    $markdownContent = "**Kiro Agent Done**`n`n$summary`n`n> $timestamp | $currentUser | $currentDirName$mentionText"
} else {
    $markdownContent = "**Kiro Agent Done**`n`n> $timestamp | $currentUser | $currentDirName$mentionText"
}

$bodyObj = @{ msgtype = "markdown"; markdown = @{ content = $markdownContent } }
$bodyJson = $bodyObj | ConvertTo-Json -Depth 10
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $response = Invoke-RestMethod -Uri $WECOM_WEBHOOK_URL -Method Post -Body $bodyBytes -ContentType "application/json; charset=utf-8" -TimeoutSec 5
    if ($response.errcode -eq 0) { Write-Host "OK: WeCom notification sent" }
    else { Write-Host "FAIL: $($response.errmsg)" }
} catch { Write-Host "ERROR: $_" }