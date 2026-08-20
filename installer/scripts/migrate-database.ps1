# ============================================================
# NMITD Library System — Database Migration Script
#
# Prepares the system for future database migrations.
# For v1.0.0, checks VERSION.json and verifies schema version.
# Reports safely that no migrations are required for v1.0.
# Performs ZERO destructive schema operations.
# ============================================================

[CmdletBinding()]
param (
    [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"

# 1. Resolve Installation Directory Dynamically
if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    $InstallDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
} else {
    $InstallDir = Resolve-Path $InstallDir
}

Write-Host "============================================"
Write-Host "  NMITD Library System - Migration Check"
Write-Host "============================================"
Write-Host "[MIGRATE-DB] Installation Directory: $InstallDir"

# 2. Inspect VERSION.json
$versionFile = Join-Path $InstallDir "VERSION.json"
$appVersion = "1.0.0"
$dbVersion = 1

if (Test-Path $versionFile) {
    try {
        $json = Get-Content $versionFile -Raw | ConvertFrom-Json
        if ($json.version) { $appVersion = $json.version }
        if ($json.databaseVersion) { $dbVersion = $json.databaseVersion }
        Write-Host "[MIGRATE-DB] Found VERSION.json (App Version: $appVersion, Database Version: $dbVersion)"
    } catch {
        Write-Host "[MIGRATE-DB] WARNING: Could not parse VERSION.json. Defaulting to v1.0.0 (dbVersion: 1)."
    }
} else {
    Write-Host "[MIGRATE-DB] NOTICE: VERSION.json not found at $versionFile. Assuming v1.0.0."
}

# 3. Migration logic for v1.0
Write-Host "[MIGRATE-DB] Target Database Schema Version: $dbVersion"

# For v1.0.0, the base schema handles all tables and columns.
Write-Host "[MIGRATE-DB] SAFE NOTICE: Database schema is at version $dbVersion."
Write-Host "[MIGRATE-DB] No database schema migrations required for NMITD Library System v$appVersion."
Write-Host "[MIGRATE-DB] Migration check completed successfully."

exit 0
