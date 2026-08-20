@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Windows Service Installation Helper
::
:: Installs the Node.js backend as a background Windows Service
:: using NSSM (Non-Sucking Service Manager).
:: ============================================================

echo(
echo ============================================================
echo   NMITD Library System - Service Installation
echo ============================================================
echo(

:: 1. Resolve Application Directory (%APP_DIR%)
set "APP_DIR=%~1"
if "!APP_DIR!"=="" (
    for %%I in ("%~dp0..\..") do set "APP_DIR=%%~fI"
)
if "!APP_DIR:~-1!"=="\" set "APP_DIR=!APP_DIR:~0,-1!"

echo [INSTALL-SERVICE] Target App Directory: "!APP_DIR!"

:: Verify Backend directory exists
if exist "!APP_DIR!\Backend\server.js" goto :backend_found
echo [INSTALL-SERVICE] ERROR: Backend\server.js not found in "!APP_DIR!".
endlocal & exit /b 1

:backend_found

:: 2. Locate Node.js Executable
set "NODE_EXE="
if exist "!APP_DIR!\node\node.exe" set "NODE_EXE=!APP_DIR!\node\node.exe"

if "!NODE_EXE!"=="" (
    for /f "delims=" %%N in ('where.exe node.exe 2^>nul') do (
        if "!NODE_EXE!"=="" set "NODE_EXE=%%N"
    )
)

if "!NODE_EXE!"=="" (
    set "NODE_EXE=!APP_DIR!\node\node.exe"
    echo [INSTALL-SERVICE] WARNING: node.exe not found. Defaulting target path to: "!NODE_EXE!"
) else (
    echo [INSTALL-SERVICE] Found Node runtime: "!NODE_EXE!"
)

:: 3. Locate NSSM Executable
set "NSSM_EXE="
if exist "!APP_DIR!\resources\nssm.exe" set "NSSM_EXE=!APP_DIR!\resources\nssm.exe"
if "!NSSM_EXE!"=="" if exist "%~dp0..\resources\nssm.exe" set "NSSM_EXE=%~dp0..\resources\nssm.exe"
if "!NSSM_EXE!"=="" if exist "!APP_DIR!\installer\resources\nssm.exe" set "NSSM_EXE=!APP_DIR!\installer\resources\nssm.exe"

set "NSSM_FOUND=0"
if not "!NSSM_EXE!"=="" (
    if exist "!NSSM_EXE!" set "NSSM_FOUND=1"
)

if "!NSSM_FOUND!"=="1" goto :nssm_found

echo [INSTALL-SERVICE] NOTICE: NSSM executable (nssm.exe) not found at default resource paths.
echo [INSTALL-SERVICE] Inno Setup installer will deploy nssm.exe to resources\nssm.exe during setup.
set "NSSM_EXE=!APP_DIR!\resources\nssm.exe"
goto :check_finish

:nssm_found
echo [INSTALL-SERVICE] Found NSSM executable: "!NSSM_EXE!"

:check_finish
set "SERVICE_NAME=NMITDLibraryService"

:: 4. Install Service if NSSM is physically present
if "!NSSM_FOUND!"=="1" goto :do_install

echo [INSTALL-SERVICE] Helper path validation completed successfully.
echo [INSTALL-SERVICE] Target Node Executable: "!NODE_EXE!"
echo [INSTALL-SERVICE] Target App Directory:   "!APP_DIR!\Backend"
endlocal & exit /b 0

:do_install
echo [INSTALL-SERVICE] Registering service "!SERVICE_NAME!"...

"!NSSM_EXE!" status "!SERVICE_NAME!" >nul 2>&1
if "!ERRORLEVEL!"=="0" goto :service_exists

"!NSSM_EXE!" install "!SERVICE_NAME!" "!NODE_EXE!" "server.js"
goto :configure_service

:service_exists
echo [INSTALL-SERVICE] Service "!SERVICE_NAME!" already exists. Updating configuration...
"!NSSM_EXE!" stop "!SERVICE_NAME!" >nul 2>&1

:configure_service
"!NSSM_EXE!" set "!SERVICE_NAME!" Application "!NODE_EXE!"
"!NSSM_EXE!" set "!SERVICE_NAME!" AppParameters "server.js"
"!NSSM_EXE!" set "!SERVICE_NAME!" AppDirectory "!APP_DIR!\Backend"
"!NSSM_EXE!" set "!SERVICE_NAME!" DisplayName "NMITD Library Management System"
"!NSSM_EXE!" set "!SERVICE_NAME!" Description "Runs Node.js backend HTTP API for NMITD Library System at localhost:5000"
"!NSSM_EXE!" set "!SERVICE_NAME!" Start SERVICE_AUTO_START
"!NSSM_EXE!" set "!SERVICE_NAME!" AppExit Default Restart

echo [INSTALL-SERVICE] Starting service "!SERVICE_NAME!"...
"!NSSM_EXE!" start "!SERVICE_NAME!"

:: Wait brief moment for Node.js process to initialize
powershell -Command "Start-Sleep -Seconds 3" >nul 2>&1

set "SVC_STATUS="
for /f "delims=" %%S in ('"!NSSM_EXE!" status "!SERVICE_NAME!" 2^>nul') do (
    set "SVC_STATUS=%%S"
)

if /i "!SVC_STATUS!"=="SERVICE_RUNNING" (
    echo [INSTALL-SERVICE] SUCCESS: Service "!SERVICE_NAME!" installed and verified RUNNING.
    endlocal & exit /b 0
) else (
    echo [INSTALL-SERVICE] ERROR: Service "!SERVICE_NAME!" registered but is not RUNNING. Status: "!SVC_STATUS!"
    echo [INSTALL-SERVICE] Please check database connectivity or node logs in "!APP_DIR!\logs".
    endlocal & exit /b 1
)

