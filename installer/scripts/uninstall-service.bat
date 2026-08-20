@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Windows Service Uninstallation Helper
::
:: Safely stops and removes the NMITDLibraryService.
:: Safe to run even if the service is not currently installed.
::
:: CRITICAL SAFETY GUARANTEE:
:: - Does NOT delete database or MySQL data.
:: - Does NOT delete application data, backups, logs, or .env.
:: ============================================================

echo(
echo ============================================================
echo   NMITD Library System - Service Uninstallation
echo ============================================================
echo(

set "SERVICE_NAME=NMITDLibraryService"

:: 1. Resolve Application Directory and NSSM Executable
set "APP_DIR=%~1"
if "%APP_DIR%"=="" (
    for %%I in ("%~dp0..\..") do set "APP_DIR=%%~fI"
)
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

set "NSSM_EXE="
if exist "%APP_DIR%\resources\nssm.exe" (
    set "NSSM_EXE=%APP_DIR%\resources\nssm.exe"
) else if exist "%~dp0..\resources\nssm.exe" (
    set "NSSM_EXE=%~dp0..\resources\nssm.exe"
) else (
    for /f "tokens=*" %%S in ('where nssm 2^>nul') do (
        if not defined NSSM_EXE set "NSSM_EXE=%%S"
    )
)

:: 2. Check if Service Exists
echo [UNINSTALL-SERVICE] Checking status of service "!SERVICE_NAME!"...

sc query "!SERVICE_NAME!" >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [UNINSTALL-SERVICE] NOTICE: Service "!SERVICE_NAME!" is not installed. Nothing to remove.
    echo [UNINSTALL-SERVICE] Data, database, .env, and backups remain intact.
    endlocal & exit /b 0
)

:: 3. Stop and Remove Service
echo [UNINSTALL-SERVICE] Stopping service "!SERVICE_NAME!"...
if defined NSSM_EXE if exist "!NSSM_EXE!" (
    "!NSSM_EXE!" stop "!SERVICE_NAME!" >nul 2>&1
    echo [UNINSTALL-SERVICE] Removing service "!SERVICE_NAME!" via NSSM...
    "!NSSM_EXE!" remove "!SERVICE_NAME!" confirm >nul 2>&1
) else (
    net stop "!SERVICE_NAME!" >nul 2>&1
    sc delete "!SERVICE_NAME!" >nul 2>&1
)

:: Verify Removal
sc query "!SERVICE_NAME!" >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [UNINSTALL-SERVICE] SUCCESS: Service "!SERVICE_NAME!" removed successfully.
) else (
    echo [UNINSTALL-SERVICE] WARNING: Service removal command sent, service will stop upon restart.
)

echo [UNINSTALL-SERVICE] Database, student records, .env, and backups have been preserved intact.
endlocal & exit /b 0
