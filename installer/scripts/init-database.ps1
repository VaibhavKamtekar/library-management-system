# ============================================================
# NMITD Library System — Database Initialization Script
#
# Safe initializer for fresh installations.
# Checks if database exists before importing initial schema.
# NEVER overwrites or drops an existing nmitd_library database.
# Performs dynamic path resolution relative to installation root.
# ============================================================

[CmdletBinding()]
param (
    [string]$InstallDir = "",
    [string]$DbHost = "",
    [int]$DbPort = 0,
    [string]$DbUser = "",
    [string]$DbPassword = "",
    [string]$DbName = ""
)

$ErrorActionPreference = "Stop"

# 1. Resolve Installation Directory Dynamically
if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    # Default to 2 levels up from script location (installer/scripts/ -> Root)
    $InstallDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
} else {
    $InstallDir = Resolve-Path $InstallDir
}

Write-Host "============================================"
Write-Host "  NMITD Library System - Database Init"
Write-Host "============================================"
Write-Host "[INIT-DB] Target Installation Directory: $InstallDir"

# 2. Load Configuration from .env if present
$envFile = Join-Path $InstallDir ".env"
if (Test-Path $envFile) {
    Write-Host "[INIT-DB] Reading environment configuration from: $envFile"
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            if (-not [string]::IsNullOrWhiteSpace($key)) {
                switch ($key) {
                    "DB_HOST"     { if ([string]::IsNullOrWhiteSpace($DbHost))     { $script:DbHost = $val } }
                    "DB_PORT"     { if ($DbPort -eq 0)                            { $script:DbPort = [int]$val } }
                    "DB_USER"     { if ([string]::IsNullOrWhiteSpace($DbUser))     { $script:DbUser = $val } }
                    "DB_PASSWORD" { if ([string]::IsNullOrWhiteSpace($DbPassword)) { $script:DbPassword = $val } }
                    "DB_NAME"     { if ([string]::IsNullOrWhiteSpace($DbName))     { $script:DbName = $val } }
                }
            }
        }
    }
}

# Apply Defaults if not configured
if ([string]::IsNullOrWhiteSpace($DbHost))     { $DbHost = "localhost" }
if ($DbPort -eq 0)                            { $DbPort = 3306 }
if ([string]::IsNullOrWhiteSpace($DbUser))     { $DbUser = "root" }
if ([string]::IsNullOrWhiteSpace($DbPassword)) { $DbPassword = "admin" }
if ([string]::IsNullOrWhiteSpace($DbName))     { $DbName = "nmitd_library" }

# 3. Locate mysql.exe
$mysqlCmd = ""
$pathMysql = Get-Command "mysql.exe" -ErrorAction SilentlyContinue
if ($pathMysql) {
    $mysqlCmd = $pathMysql.Source
} else {
    $searchPaths = @(
        $env:MYSQL_BIN_DIR,
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
    foreach ($p in $searchPaths) {
        if (-not [string]::IsNullOrWhiteSpace($p) -and (Test-Path $p)) {
            $mysqlCmd = $p
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($mysqlCmd)) {
    Write-Host "[INIT-DB] ERROR: mysql.exe client binary not found in PATH or standard installation directories."
    exit 1
}

Write-Host "[INIT-DB] Using MySQL client binary: $mysqlCmd"

# Helper function to execute MySQL client queries robustly
function Invoke-MySqlExec {
    param(
        [string]$SqlStatement = "",
        [string]$TargetDatabase = "",
        [string]$InputFile = ""
    )
    $argsList = @("-h", $DbHost, "-P", $DbPort, "-u", $DbUser)
    if (-not [string]::IsNullOrEmpty($DbPassword)) {
        $argsList += "-p$DbPassword"
    }
    if ($TargetDatabase) {
        $argsList += $TargetDatabase
    }
    if ($SqlStatement) {
        $argsList += @("-e", $SqlStatement)
    }

    $previousEAP = $Global:ErrorActionPreference
    $Global:ErrorActionPreference = "Continue"

    if ($InputFile) {
        # Dynamically ensure USE statement targets current $DbName without altering SQL file on disk
        $content = Get-Content $InputFile | ForEach-Object {
            $_ -replace '(?i)^\s*USE\s+[^;]+;', "USE ``$DbName``;"
        }
        $output = $content | & "$mysqlCmd" @argsList 2>&1
    } else {
        $output = & "$mysqlCmd" @argsList 2>&1
    }
    $exitCode = $LASTEXITCODE

    $Global:ErrorActionPreference = $previousEAP

    return [PSCustomObject]@{
        ExitCode = $exitCode
        Output   = ($output -join "`n")
    }
}

# 4. Check if Target Database Already Exists
Write-Host "[INIT-DB] Checking if database '$DbName' exists..."
$checkDbQuery = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DbName';"
$checkRes = Invoke-MySqlExec -SqlStatement $checkDbQuery

if ($checkRes.ExitCode -ne 0) {
    Write-Host "[INIT-DB] ERROR: Could not connect to MySQL server at ${DbHost}:${DbPort}."
    Write-Host "  Error details: $($checkRes.Output)"
    exit 1
}

$dbExists = ($checkRes.Output -match "\b$DbName\b")

if ($dbExists) {
    Write-Host "[INIT-DB] SAFE NOTICE: Database '$DbName' ALREADY EXISTS."
    Write-Host "[INIT-DB] Initial SQL import SKIPPED to preserve existing library data."
    Write-Host "[INIT-DB] Initialization completed successfully."
    exit 0
}

# 5. Database does not exist — Create DB and Import Schema
Write-Host "[INIT-DB] Database '$DbName' does not exist. Creating database..."
# Use double backticks `` around variable $DbName to produce literal backticks in MySQL SQL statement while allowing PowerShell variable expansion
$createDbQuery = "CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$createRes = Invoke-MySqlExec -SqlStatement $createDbQuery

if ($createRes.ExitCode -ne 0) {
    Write-Host "[INIT-DB] ERROR: Failed to create database '$DbName'."
    Write-Host "  Error details: $($createRes.Output)"
    exit 1
}

# 6. Verify Database Creation
Write-Host "[INIT-DB] Verifying database '$DbName' creation..."
$verifyDbRes = Invoke-MySqlExec -SqlStatement $checkDbQuery
if ($verifyDbRes.ExitCode -ne 0 -or $verifyDbRes.Output -notmatch "\b$DbName\b") {
    Write-Host "[INIT-DB] ERROR: Database '$DbName' verification failed after creation."
    exit 1
}
Write-Host "[INIT-DB] Database '$DbName' verified successfully."

# 7. Import Initial SQL Schema
$sqlFile = Join-Path $InstallDir "database\nmitdlibrarysqlcode.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "[INIT-DB] ERROR: Initial SQL file not found at: $sqlFile"
    exit 1
}

Write-Host "[INIT-DB] Importing initial schema from: $sqlFile"
$importRes = Invoke-MySqlExec -TargetDatabase $DbName -InputFile $sqlFile
if ($importRes.ExitCode -ne 0) {
    Write-Host "[INIT-DB] ERROR: Failed to import SQL schema into '$DbName'."
    Write-Host "  Error details: $($importRes.Output)"
    exit 1
}

# 8. Verify Expected Tables After Import
Write-Host "[INIT-DB] Verifying tables in '$DbName'..."
$checkTablesQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '$DbName';"
$tablesRes = Invoke-MySqlExec -SqlStatement $checkTablesQuery

if ($tablesRes.ExitCode -ne 0) {
    Write-Host "[INIT-DB] ERROR: Failed to query tables in '$DbName'."
    exit 1
}

$expectedTables = @("students", "library_logs", "admin", "staff", "student_lifecycle_meta")
$missingTables = @()
foreach ($tbl in $expectedTables) {
    if ($tablesRes.Output -notmatch "\b$tbl\b") {
        $missingTables += $tbl
    }
}

if ($missingTables.Count -gt 0) {
    Write-Host "[INIT-DB] ERROR: Schema verification failed. Missing tables in '$DbName': $($missingTables -join ', ')"
    exit 1
}

Write-Host "[INIT-DB] Verified expected tables: $($expectedTables -join ', ')"
Write-Host "[INIT-DB] SUCCESS: Database '$DbName' created, initial schema imported, and tables verified successfully."
exit 0

