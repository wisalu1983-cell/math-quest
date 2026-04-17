<#
.SYNOPSIS
    双向同步 QA 相关全局 skill（Cursor <-> Claude Code）

.DESCRIPTION
    将 agent-as-user-qa 和 visual-screenshot-qa 两个全局 skill 在
    ~/.cursor/skills/local/ 和 ~/.claude/skills/ 之间双向同步。
    以修改时间较新的一侧为准覆盖另一侧。

.EXAMPLE
    .\sync-qa-skills.ps1           # 双向同步
    .\sync-qa-skills.ps1 -DryRun   # 只检查不执行
#>
param(
    [switch]$DryRun
)

$skills = @(
    @{
        Name = "agent-as-user-qa"
        CursorPath = "$env:USERPROFILE\.cursor\skills\local\agent-as-user-qa\SKILL.md"
        ClaudePath = "$env:USERPROFILE\.claude\skills\agent-as-user-qa\SKILL.md"
    },
    @{
        Name = "visual-screenshot-qa"
        CursorPath = "$env:USERPROFILE\.cursor\skills\local\visual-screenshot-qa\SKILL.md"
        ClaudePath = "$env:USERPROFILE\.claude\skills\visual-screenshot-qa\SKILL.md"
    }
)

$synced = 0
$skipped = 0

foreach ($skill in $skills) {
    $name = $skill.Name
    $cursorFile = $skill.CursorPath
    $claudeFile = $skill.ClaudePath

    $cursorExists = Test-Path $cursorFile
    $claudeExists = Test-Path $claudeFile

    if (-not $cursorExists -and -not $claudeExists) {
        Write-Host "[$name] 两侧都不存在，跳过" -ForegroundColor Yellow
        $skipped++
        continue
    }

    if ($cursorExists -and -not $claudeExists) {
        Write-Host "[$name] Cursor -> Claude Code (Claude Code 侧不存在)" -ForegroundColor Cyan
        if (-not $DryRun) {
            $dir = Split-Path $claudeFile -Parent
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Copy-Item $cursorFile $claudeFile -Force
        }
        $synced++
        continue
    }

    if (-not $cursorExists -and $claudeExists) {
        Write-Host "[$name] Claude Code -> Cursor (Cursor 侧不存在)" -ForegroundColor Cyan
        if (-not $DryRun) {
            $dir = Split-Path $cursorFile -Parent
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Copy-Item $claudeFile $cursorFile -Force
        }
        $synced++
        continue
    }

    $cursorTime = (Get-Item $cursorFile).LastWriteTime
    $claudeTime = (Get-Item $claudeFile).LastWriteTime

    if ($cursorTime -eq $claudeTime) {
        Write-Host "[$name] 已同步 (两侧修改时间相同)" -ForegroundColor Green
        $skipped++
        continue
    }

    if ($cursorTime -gt $claudeTime) {
        Write-Host "[$name] Cursor -> Claude Code (Cursor 较新: $cursorTime > $claudeTime)" -ForegroundColor Cyan
        if (-not $DryRun) {
            Copy-Item $cursorFile $claudeFile -Force
        }
        $synced++
    } else {
        Write-Host "[$name] Claude Code -> Cursor (Claude Code 较新: $claudeTime > $cursorTime)" -ForegroundColor Cyan
        if (-not $DryRun) {
            Copy-Item $claudeFile $cursorFile -Force
        }
        $synced++
    }
}

Write-Host ""
if ($DryRun) {
    Write-Host "=== DryRun 模式：以上为预览，未实际执行 ===" -ForegroundColor Yellow
}
Write-Host "同步: $synced / 跳过: $skipped / 总计: $($skills.Count)" -ForegroundColor White
