@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Database Backup Script (v1.0)
::
:: Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)
:: Retention: Latest 30 verified backups (count-based)
:: Verification: File size + mysqldump header + table count
::
:: Exit codes:
::   0 = Backup created and verified successfully
::   1 = mysqldump failed
::   2 = Backup verification failed
:: ============================================================

:: ── Load configuration from .env (needed for scheduled tasks) ──
set "ENV_FILE=%~dp0..\.env"
setlocal enabledelayedexpansion
if exist "%ENV_FILE%" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        if not "%%a"=="" if not "%%b"=="" (
            if "!%%a!"=="" set "%%a=%%b"
        )
    )
)

:: ── Apply defaults for any unset values ─────────────────────
if "%DB_HOST%"=="" set "DB_HOST=localhost"
if "%DB_PORT%"=="" set "DB_PORT=3306"
if "%DB_USER%"=="" set "DB_USER=root"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=admin"
if "%DB_NAME%"=="" set "DB_NAME=nmitd_library"
if "%BACKUP_DIR%"=="" set "BACKUP_DIR=%~dp0..\backups"

:: ── Setup directories ───────────────────────────────────────
set "LOG_DIR=%~dp0..\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "LOG_FILE=%LOG_DIR%\backup.log"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: ── Build locale-independent timestamp for filename ─────────
for /f "usebackq tokens=*" %%d in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm'"`) do set "TIMESTAMP=%%d"
set "BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.sql"

:: ── Resolve MySQL binaries dynamically ──────────────────────
set "MYSQLDUMP_CMD=mysqldump"
set "MYSQL_CMD=mysql"
if defined MYSQL_BIN_DIR (
    if exist "%MYSQL_BIN_DIR%\mysqldump.exe" set "MYSQLDUMP_CMD=%MYSQL_BIN_DIR%\mysqldump.exe"
    if exist "%MYSQL_BIN_DIR%\mysql.exe" set "MYSQL_CMD=%MYSQL_BIN_DIR%\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" (
    set "MYSQLDUMP_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" (
    set "MYSQLDUMP_CMD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe"
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe" (
    set "MYSQLDUMP_CMD=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe"
    set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
)

:: ════════════════════════════════════════════════════════════
:: Step 1: Run mysqldump
:: ════════════════════════════════════════════════════════════
call :log "STARTED - Backup to backup_%TIMESTAMP%.sql"

"%MYSQLDUMP_CMD%" -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% --routines --triggers %DB_NAME% > "%BACKUP_FILE%" 2>nul

if !ERRORLEVEL! NEQ 0 (
    call :log "DUMP FAILED - mysqldump returned error code !ERRORLEVEL!"
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
    call :log "FAILURE (exit code 1)"
    endlocal & exit /b 1
)

:: ════════════════════════════════════════════════════════════
:: Step 2: Verify backup
:: ════════════════════════════════════════════════════════════

:: 2a. File must exist
if not exist "%BACKUP_FILE%" (
    call :log "VERIFY FAILED - Backup file was not created"
    call :log "FAILURE (exit code 2)"
    endlocal & exit /b 2
)

:: 2b. File must be non-empty
for %%F in ("%BACKUP_FILE%") do set "FILE_SIZE=%%~zF"
if "!FILE_SIZE!"=="0" (
    call :log "VERIFY FAILED - Backup file is empty (0 bytes)"
    move /y "%BACKUP_FILE%" "%BACKUP_DIR%\backup_%TIMESTAMP%.FAILED.sql" >nul 2>&1
    call :log "RENAMED - backup_%TIMESTAMP%.FAILED.sql"
    call :log "FAILURE (exit code 2)"
    endlocal & exit /b 2
)

:: 2c. Must contain valid mysqldump header
findstr /m /c:"MySQL dump" "%BACKUP_FILE%" >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    call :log "VERIFY FAILED - File does not contain valid mysqldump header"
    move /y "%BACKUP_FILE%" "%BACKUP_DIR%\backup_%TIMESTAMP%.FAILED.sql" >nul 2>&1
    call :log "RENAMED - backup_%TIMESTAMP%.FAILED.sql"
    call :log "FAILURE (exit code 2)"
    endlocal & exit /b 2
)

:: 2d. Count CREATE TABLE statements in the dump
set "TABLE_COUNT=0"
for /f "tokens=*" %%a in ('findstr /c:"CREATE TABLE" "%BACKUP_FILE%" 2^>nul') do (
    set /a "TABLE_COUNT+=1"
)

:: 2e. Get expected table count from live database (if mysql client available)
set "EXPECTED_TABLES=0"
set "TABLE_VERIFY_AVAILABLE=0"
"%MYSQL_CMD%" -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%'" > "%TEMP%\nmitd_tblcount.tmp" 2>nul
if !ERRORLEVEL! EQU 0 (
    for /f "tokens=*" %%n in (%TEMP%\nmitd_tblcount.tmp) do (
        set "EXPECTED_TABLES=%%n"
        set "TABLE_VERIFY_AVAILABLE=1"
    )
)
del "%TEMP%\nmitd_tblcount.tmp" 2>nul

:: 2f. Compare table counts
if "!TABLE_VERIFY_AVAILABLE!"=="1" (
    if !TABLE_COUNT! LSS !EXPECTED_TABLES! (
        call :log "VERIFY FAILED - !TABLE_COUNT! tables in dump, expected !EXPECTED_TABLES!"
        move /y "%BACKUP_FILE%" "%BACKUP_DIR%\backup_%TIMESTAMP%.FAILED.sql" >nul 2>&1
        call :log "RENAMED - backup_%TIMESTAMP%.FAILED.sql"
        call :log "FAILURE (exit code 2)"
        endlocal & exit /b 2
    )
) else (
    :: MySQL client unavailable - just verify at least 1 table exists
    if !TABLE_COUNT! LSS 1 (
        call :log "VERIFY FAILED - No CREATE TABLE statements found in dump"
        move /y "%BACKUP_FILE%" "%BACKUP_DIR%\backup_%TIMESTAMP%.FAILED.sql" >nul 2>&1
        call :log "RENAMED - backup_%TIMESTAMP%.FAILED.sql"
        call :log "FAILURE (exit code 2)"
        endlocal & exit /b 2
    )
)

:: ── Verification passed ─────────────────────────────────────
set /a "FILE_SIZE_KB=!FILE_SIZE! / 1024"
if !FILE_SIZE_KB! EQU 0 set "FILE_SIZE_KB=1"
call :log "DUMP OK - backup_%TIMESTAMP%.sql (!FILE_SIZE_KB! KB)"
if "!TABLE_VERIFY_AVAILABLE!"=="1" (
    call :log "VERIFIED - !TABLE_COUNT! tables found, expected !EXPECTED_TABLES!"
) else (
    call :log "VERIFIED - !TABLE_COUNT! tables found (live count unavailable)"
)

:: ════════════════════════════════════════════════════════════
:: Step 3: Retention - keep latest 30 verified backups
:: ════════════════════════════════════════════════════════════
set "BACKUP_COUNT=0"
set "DELETED_COUNT=0"
for /f "tokens=*" %%f in ('dir /b /o-n "%BACKUP_DIR%\backup_*.sql" 2^>nul ^| findstr /v /i "FAILED"') do (
    set /a "BACKUP_COUNT+=1"
    if !BACKUP_COUNT! GTR 30 (
        del "%BACKUP_DIR%\%%f" 2>nul
        set /a "DELETED_COUNT+=1"
    )
)

set /a "RETAINED=!BACKUP_COUNT! - !DELETED_COUNT!"
call :log "CLEANUP - !RETAINED! backups retained, !DELETED_COUNT! deleted"
call :log "SUCCESS"
echo(

endlocal & exit /b 0

:: ════════════════════════════════════════════════════════════
:: Logging subroutine - writes to console AND log file
:: ════════════════════════════════════════════════════════════
:log
for /f "usebackq tokens=*" %%t in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"`) do set "LOG_TS=%%t"
echo [!LOG_TS!] %~1
echo [!LOG_TS!] %~1 >> "%LOG_FILE%"
goto :eof
