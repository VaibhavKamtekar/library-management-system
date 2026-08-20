@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Post-Installation Verification Script
::
:: Performs non-destructive checks on installation components:
:: 1. Installation Directories & Files
:: 2. Node.js Runtime
:: 3. Backend & Frontend Production Build
:: 4. .env Configuration File
:: 5. MySQL Availability
:: 6. Windows Service Status
::
:: Returns exit code 0 if all critical components are valid.
:: ============================================================

echo(
echo ============================================================
echo   NMITD Library System - Post-Installation Check
echo ============================================================
echo(

:: 1. Resolve Application Directory (%APP_DIR%)
set "APP_DIR=%~1"
if "!APP_DIR!"=="" (
    for %%I in ("%~dp0..\..") do set "APP_DIR=%%~fI"
)
if "!APP_DIR:~-1!"=="\" set "APP_DIR=!APP_DIR:~0,-1!"

echo [POST-INSTALL] Checking installation directory: "!APP_DIR!"
set "ERRORS=0"

:: 2. Verify Key Files & Directories
if exist "!APP_DIR!\Backend\server.js" (
    echo [POST-INSTALL] [OK] Backend Server Entry Point
) else (
    echo [POST-INSTALL] [FAIL] Backend Server Entry Point missing at: !APP_DIR!\Backend\server.js
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\Backend\package.json" (
    echo [POST-INSTALL] [OK] Backend Package Spec
) else (
    echo [POST-INSTALL] [FAIL] Backend Package Spec missing at: !APP_DIR!\Backend\package.json
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\frontend\build\index.html" (
    echo [POST-INSTALL] [OK] Frontend Production Build
) else (
    echo [POST-INSTALL] [FAIL] Frontend Production Build missing at: !APP_DIR!\frontend\build\index.html
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\.env" (
    echo [POST-INSTALL] [OK] Environment Configuration File
) else (
    echo [POST-INSTALL] [FAIL] Environment Configuration File missing at: !APP_DIR!\.env
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\scripts\backup.bat" (
    echo [POST-INSTALL] [OK] Stage 1 Backup System Script
) else (
    echo [POST-INSTALL] [FAIL] Stage 1 Backup System Script missing at: !APP_DIR!\scripts\backup.bat
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\backups" (
    echo [POST-INSTALL] [OK] Backups Directory
) else (
    echo [POST-INSTALL] [FAIL] Backups Directory missing at: !APP_DIR!\backups
    set /a "ERRORS+=1"
)

if exist "!APP_DIR!\logs" (
    echo [POST-INSTALL] [OK] Logs Directory
) else (
    echo [POST-INSTALL] [FAIL] Logs Directory missing at: !APP_DIR!\logs
    set /a "ERRORS+=1"
)

:: 3. Verify Node Runtime
if exist "!APP_DIR!\node\node.exe" goto :node_ok

where.exe node.exe >nul 2>&1
if "%ERRORLEVEL%"=="0" goto :node_ok

echo [POST-INSTALL] [FAIL] Node runtime missing (neither bundled nor in PATH)
set /a "ERRORS+=1"
goto :node_check_done

:node_ok
echo [POST-INSTALL] [OK] Node runtime found

:node_check_done

:: 4. Verify MySQL Availability via detect-mysql.ps1 if present
set "DETECT_PS1="
if exist "!APP_DIR!\installer\scripts\detect-mysql.ps1" set "DETECT_PS1=!APP_DIR!\installer\scripts\detect-mysql.ps1"
if "!DETECT_PS1!"=="" if exist "%~dp0detect-mysql.ps1" set "DETECT_PS1=%~dp0detect-mysql.ps1"

if not "!DETECT_PS1!"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "!DETECT_PS1!" >nul 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo [POST-INSTALL] [OK] MySQL is available on target system
    ) else (
        echo [POST-INSTALL] [WARNING] MySQL standard detection returned warning
    )
) else (
    echo [POST-INSTALL] [INFO] detect-mysql.ps1 script not found
)

:: 5. Check Service Status if installed
sc query "NMITDLibraryService" >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [POST-INSTALL] [OK] Service NMITDLibraryService is installed
) else (
    echo [POST-INSTALL] [INFO] Service NMITDLibraryService is not registered - standalone mode
)

echo(
echo ------------------------------------------------------------
if "!ERRORS!"=="0" goto :all_ok

echo [POST-INSTALL] RESULT: Post-installation verification FAILED - !ERRORS! missing components
endlocal & exit /b 1

:all_ok
echo [POST-INSTALL] RESULT: All critical installation components VERIFIED SUCCESSFULLY
endlocal & exit /b 0
