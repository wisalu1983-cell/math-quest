[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^v\d+\.\d+$')]
  [string]$Version,

  [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
} else {
  $RepoRoot = (Resolve-Path $RepoRoot).Path
}

$planDir = Join-Path $RepoRoot "ProjectManager\Plan\$Version"
$missing = New-Object System.Collections.Generic.List[string]

function Add-Missing([string]$Path) {
  $missing.Add($Path) | Out-Null
}

function Test-RequiredFile([string]$RelativePath) {
  $path = Join-Path $planDir $RelativePath
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    Add-Missing "ProjectManager/Plan/$Version/$RelativePath"
  }
}

if (-not (Test-Path -LiteralPath $planDir -PathType Container)) {
  Add-Missing "ProjectManager/Plan/$Version/"
} else {
  Test-RequiredFile 'README.md'
  Test-RequiredFile '00-overview.md'
  Test-RequiredFile '02-classification.md'
  Test-RequiredFile '03-phase-plan.md'
  Test-RequiredFile '04-execution-discipline.md'

  $sourceDocs = @(Get-ChildItem -LiteralPath $planDir -Filter '01-*.md' -File -ErrorAction SilentlyContinue)
  if ($sourceDocs.Count -eq 0) {
    Add-Missing "ProjectManager/Plan/$Version/01-*.md"
  }

  $phasesDir = Join-Path $planDir 'phases'
  if (-not (Test-Path -LiteralPath $phasesDir -PathType Container)) {
    Add-Missing "ProjectManager/Plan/$Version/phases/"
  } else {
    $phaseDocs = @(
      Get-ChildItem -LiteralPath $phasesDir -Filter 'phase-*.md' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^phase-\d+\.md$' }
    )
    if ($phaseDocs.Count -eq 0) {
      Add-Missing "ProjectManager/Plan/$Version/phases/phase-N.md"
    }
  }
}

if ($missing.Count -eq 0) {
  Write-Host "OK: $Version version package is complete."
  exit 0
}

Write-Host "MISSING: $Version version package is incomplete."
foreach ($item in $missing) {
  Write-Host " - $item"
}
exit 1
