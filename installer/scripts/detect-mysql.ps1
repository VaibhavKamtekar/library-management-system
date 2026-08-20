# ============================================================
# NMITD Library System — MySQL Detection Script
#
# Detects availability of MySQL service and binaries on Windows.
# Returns exit code 0 if MySQL is available, 1 if not detected.
# Performs ZERO modifications to MySQL or databases.
# ============================================================

[CmdletBinding()]
param (
    [string]$DbHost = "localhost",
    [int]$DbPort = 3306
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "============================================"
Write-Host "  NMITD Library System - MySQL Detection"
Write-Host "============================================"

$mysqlFound = $false
$serviceFound = $false
$mysqlExePath = ""
$mysqldumpExePath = ""
$serviceName = ""
$serviceStatus = ""

# 1. Check for MySQL / MariaDB Windows Services
$services = Get-Service -Name "MySQL*", "MariaDB*" -ErrorAction SilentlyContinue
if ($services) {
    foreach ($svc in $services) {
        $serviceFound = $true
        $serviceName = $svc.Name
        $serviceStatus = $svc.Status
        Write-Host "[DETECT-MYSQL] Found Windows Service: $($svc.Name) (Status: $($svc.Status))"
        if ($svc.Status -eq "Running") {
            break
        }
    }
} else {
    Write-Host "[DETECT-MYSQL] No standard MySQL/MariaDB Windows Service found."
}

# 2. Check for mysql.exe and mysqldump.exe in PATH and standard locations
$searchPaths = @(
    $env:MYSQL_BIN_DIR,
    "C:\Program Files\MySQL\MySQL Server 8.4\bin",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin",
    "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin",
    "C:\Program Files\MariaDB*\bin"
)

# First check system PATH
$pathMysql = Get-Command "mysql.exe" -ErrorAction SilentlyContinue
$pathDump = Get-Command "mysqldump.exe" -ErrorAction SilentlyContinue

if ($pathMysql -and $pathDump) {
    $mysqlExePath = $pathMysql.Source
    $mysqldumpExePath = $pathDump.Source
    $mysqlFound = $true
    Write-Host "[DETECT-MYSQL] Found MySQL binaries in PATH:"
    Write-Host "  mysql:     $mysqlExePath"
    Write-Host "  mysqldump: $mysqldumpExePath"
} else {
    # Check standard installation directories
    foreach ($dir in $searchPaths) {
        if (-not [string]::IsNullOrWhiteSpace($dir) -and (Test-Path $dir)) {
            $m = Join-Path $dir "mysql.exe"
            $d = Join-Path $dir "mysqldump.exe"
            if ((Test-Path $m) -and (Test-Path $d)) {
                $mysqlExePath = $m
                $mysqldumpExePath = $d
                $mysqlFound = $true
                Write-Host "[DETECT-MYSQL] Found MySQL binaries in directory: $dir"
                Write-Host "  mysql:     $mysqlExePath"
                Write-Host "  mysqldump: $mysqldumpExePath"
                break
            }
        }
    }
}

# 3. Check TCP Port 3306 Connectivity
$portOpen = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connection = $tcp.BeginConnect($DbHost, $DbPort, $null, $null)
    $success = $connection.AsyncWaitHandle.WaitOne(1000, $false)
    if ($success) {
        $tcp.EndConnect($connection)
        $portOpen = $true
        Write-Host "[DETECT-MYSQL] TCP Port $DbPort on $DbHost is OPEN and accepting connections."
    } else {
        Write-Host "[DETECT-MYSQL] TCP Port $DbPort on $DbHost is NOT responding."
    }
    $tcp.Close()
} catch {
    Write-Host "[DETECT-MYSQL] TCP Port check failed: $_"
}

# Summary
Write-Host "--------------------------------------------"
if ($mysqlFound -or $serviceFound -or $portOpen) {
    Write-Host "[DETECT-MYSQL] RESULT: MySQL is AVAILABLE on target system."
    Write-Host "  Service:  $(if ($serviceFound) { "$serviceName ($serviceStatus)" } else { "None detected" })"
    Write-Host "  Binaries: $(if ($mysqlFound) { "Found" } else { "Not in standard PATH/dir" })"
    Write-Host "  Port ${DbHost}:${DbPort}: $(if ($portOpen) { "Open" } else { "Closed/Unreachable" })"
    exit 0
} else {
    Write-Host "[DETECT-MYSQL] RESULT: MySQL was NOT DETECTED on target system."
    exit 1
}
