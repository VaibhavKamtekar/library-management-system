@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Pre-Update Backup Wrapper
::
:: Calls the existing Stage 1 backup script (scripts\backup.bat)
:: to ensure a full, verified backup exists before any app update.
:: Propagates the exit code from backup.bat:
::   0 = Backup created and verified successfully -> Update allowed
::   Non-zero = Backup failed -> Update ABORTED
:: ============================================================

echo(
echo ============================================================
echo   NMITD Library System - Pre-Update Backup Check
echo ============================================================
echo(

:: Dynamically resolve script location and backup script path
set "SCRIPT_DIR=%~dp0"
set "BACKUP_SCRIPT="

:: Check relative location 1: {app}\installer\scripts -> {app}\scripts\backup.bat
if exist "%SCRIPT_DIR%..\..\scripts\backup.bat" (
    set "BACKUP_SCRIPT=%SCRIPT_DIR%..\..\scripts\backup.bat"
) else if exist "%SCRIPT_DIR%..\scripts\backup.bat" (
    :: Relative location 2: {app}\scripts\backup.bat
    set "BACKUP_SCRIPT=%SCRIPT_DIR%..\scripts\backup.bat"
) else if exist "%~dp0scripts\backup.bat" (
    set "BACKUP_SCRIPT=%~dp0scripts\backup.bat"
)

if "%BACKUP_SCRIPT%"=="" (
    echo [PRE-UPDATE-BACKUP] ERROR: Backup script scripts\backup.bat could not be found!
    echo [PRE-UPDATE-BACKUP] ABORTING UPDATE to protect existing library data.
    endlocal & exit /b 1
)

echo [PRE-UPDATE-BACKUP] Executing verified backup script: "%BACKUP_SCRIPT%"
echo(

call "%BACKUP_SCRIPT%"
set "BACKUP_RESULT=%ERRORLEVEL%"

echo(
if "%BACKUP_RESULT%"=="0" (
    echo ============================================================
    echo   PRE-UPDATE BACKUP SUCCESSFUL
    echo   Verified database backup has been saved to backups\
    echo   Update may proceed safely.
    echo ============================================================
    endlocal & exit /b 0
) else (
    echo ============================================================
    echo   PRE-UPDATE BACKUP FAILED (Exit Code: %BACKUP_RESULT%)
    echo   ERROR: Pre-update database backup failed or failed verification.
    echo   UPDATE HAS BEEN ABORTED to protect existing library data.
    echo   Check logs\backup.log for diagnostic details.
    echo ============================================================
    endlocal & exit /b %BACKUP_RESULT%
)
