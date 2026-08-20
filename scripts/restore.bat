@echo off
:: ============================================================
:: NMITD Library System — Database Restore Script
:: Usage: restore.bat backups\backup_2026-05-06.sql
:: ============================================================

:: Load configuration from .env if available
set "ENV_FILE=%~dp0..\.env"
setlocal enabledelayedexpansion
if exist "%ENV_FILE%" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        if not "%%a"=="" if not "%%b"=="" (
            if "!%%a!"=="" set "%%a=%%b"
        )
    )
)

if "%DB_HOST%"=="" set "DB_HOST=localhost"
if "%DB_PORT%"=="" set "DB_PORT=3306"
if "%DB_USER%"=="" set "DB_USER=root"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=admin"
if "%DB_NAME%"=="" set "DB_NAME=nmitd_library"

if "%~1"=="" (
    echo(
    echo ERROR: No backup file specified.
    echo Usage: restore.bat backups\backup_2026-05-06.sql
    echo(
    pause
    exit /b 1
)

if not exist "%~1" (
    echo(
    echo ERROR: File not found: %~1
    echo(
    pause
    exit /b 1
)

echo(
echo ==================================================
echo  WARNING: This will OVERWRITE the current database
echo  Restoring from: %~1
echo ==================================================
echo(
set /p CONFIRM=Type YES to continue: 

if /i not "%CONFIRM%"=="YES" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo [%date% %time%] Starting restore from %~1 ...

:: Dynamic mysql command resolution
set "MYSQL_CMD=mysql"
if defined MYSQL_BIN_DIR (
    if exist "%MYSQL_BIN_DIR%\mysql.exe" set "MYSQL_CMD=%MYSQL_BIN_DIR%\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" (
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
)

"%MYSQL_CMD%" -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%~1"

if %ERRORLEVEL% == 0 (
    echo [%date% %time%] Restore completed successfully.
) else (
    echo [%date% %time%] ERROR: Restore FAILED.
    exit /b 1
)

pause
