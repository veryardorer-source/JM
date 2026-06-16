# Removes hard-coded Notion token strings from local Notion work files.
# Run this from PowerShell after confirming the target folder.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\tools\notion_sanitize_tokens.ps1 -TargetDir "C:\Users\Administrator\Desktop\JM_클로드\JM_노션"
#
# This script replaces token-like strings with an environment-variable placeholder.

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

if (!(Test-Path -LiteralPath $TargetDir)) {
    throw "TargetDir not found: $TargetDir"
}

$files = Get-ChildItem -LiteralPath $TargetDir -Recurse -File -Include *.py,*.md
$pattern = "ntn_[A-Za-z0-9]+"

foreach ($file in $files) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    if ($text -match $pattern) {
        $updated = $text -replace $pattern, "<NOTION_TOKEN_FROM_ENV>"
        Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
        Write-Host "Sanitized:" $file.FullName
    }
}

Write-Host "Done. Update Python scripts to read NOTION_TOKEN from environment before running them."

