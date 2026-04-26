<#
.SYNOPSIS
    Synchronize QA Leader adapter files from QA/qa-leader-canonical.md.

.DESCRIPTION
    The canonical QA process lives in QA/qa-leader-canonical.md. This script
    rewrites the Cursor, Claude Code, and Codex adapter files with their
    environment-specific frontmatter plus the canonical body.

.EXAMPLE
    .\QA\scripts\sync-qa-leader-adapters.ps1
    .\QA\scripts\sync-qa-leader-adapters.ps1 -DryRun
#>
param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$qaDir = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $qaDir -Parent
$canonicalPath = Join-Path $qaDir "qa-leader-canonical.md"

if (-not (Test-Path $canonicalPath)) {
    throw "Canonical QA file not found: $canonicalPath"
}

$canonical = Get-Content -Raw -Encoding UTF8 $canonicalPath

$description = "MathQuest QA Leader: preflight by task type and project phase, reuse QA/capability-registry.md, then run L0-L3 risk-based QA across code review, automation, simulated human, visual, security, accessibility, defect triage, and PM writeback. Triggers: QA, testing, visual QA, experience testing, full regression."

$adapters = @(
    @{
        Name = "Codex";
        Path = (Join-Path $repoRoot ".agents/skills/qa-leader/SKILL.md");
        Header = (@(
            "---",
            "name: qa-leader",
            "description: |",
            "  MathQuest QA Leader: preflight by task type and project phase,",
            "  reuse QA/capability-registry.md, then run L0-L3 risk-based QA",
            "  across code review, automation, simulated human, visual, security, accessibility,",
            "  defect triage, and PM writeback. Triggers: QA, testing, visual QA, experience testing.",
            "---",
            "",
            "<!-- QA Leader adapter - Codex -->",
            "<!-- Canonical source: math-quest/QA/qa-leader-canonical.md -->",
            "<!-- Edit the canonical source first; this file is generated. -->",
            ""
        ) -join "`n") + "`n";
    },
    @{
        Name = "Claude Code";
        Path = (Join-Path $repoRoot ".claude/skills/qa-leader/SKILL.md");
        Header = (@(
            "---",
            "name: qa-leader",
            "description: |",
            "  MathQuest QA Leader: preflight by task type and project phase,",
            "  reuse QA/capability-registry.md, then run L0-L3 risk-based QA",
            "  across code review, automation, simulated human, visual, security, accessibility,",
            "  defect triage, and PM writeback. Triggers: QA, testing, visual QA, experience testing.",
            "---",
            "",
            "<!-- QA Leader adapter - Claude Code -->",
            "<!-- Canonical source: math-quest/QA/qa-leader-canonical.md -->",
            "<!-- Edit the canonical source first; this file is generated. -->",
            ""
        ) -join "`n") + "`n";
    },
    @{
        Name = "Cursor";
        Path = (Join-Path $repoRoot ".cursor/rules/qa-leader.mdc");
        Header = (@(
            "---",
            "description: `"$description`"",
            "alwaysApply: false",
            "---",
            "",
            "<!-- QA Leader adapter - Cursor -->",
            "<!-- Canonical source: math-quest/QA/qa-leader-canonical.md -->",
            "<!-- Edit the canonical source first; this file is generated. -->",
            "",
            "<!-- Full canonical content follows. -->",
            ""
        ) -join "`n") + "`n";
    }
)

$changed = 0
$unchanged = 0

foreach ($adapter in $adapters) {
    $target = $adapter.Path
    $content = $adapter.Header + $canonical
    $exists = Test-Path $target
    $current = if ($exists) { Get-Content -Raw -Encoding UTF8 $target } else { "" }

    if ($current -eq $content) {
        Write-Host "[$($adapter.Name)] already synced: $target" -ForegroundColor Green
        $unchanged++
        continue
    }

    Write-Host "[$($adapter.Name)] syncing: $target" -ForegroundColor Cyan
    if (-not $DryRun) {
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Set-Content -Path $target -Value $content -Encoding UTF8 -NoNewline
    }
    $changed++
}

if ($DryRun) {
    Write-Host "DryRun: no files written" -ForegroundColor Yellow
}

Write-Host "changed: $changed / unchanged: $unchanged / total: $($adapters.Count)"
