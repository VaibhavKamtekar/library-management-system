@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Production Installer Build Script
::
:: Dynamically locates Inno Setup Compiler (ISCC.exe) across standard
:: installation directories and system PATH, then compiles
:: installer/NMITD-Library-Setup.iss into releases/NMITD-Library-Setup.exe.
:: ============================================================

echo ============================================================
echo   NMITD Library System - Building Production Installer
echo ============================================================
echo.

set "ISCC_EXE="

:: 1. Search system PATH
for /f "delims=" %%I in ('where.exe ISCC.exe 2^>nul') do (
    if "!ISCC_EXE!"=="" set "ISCC_EXE=%%~fI"
)

:: 2. Search LOCALAPPDATA
if "!ISCC_EXE!"=="" if defined LOCALAPPDATA (
    if exist "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" (
        set "ISCC_EXE=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
    )
)

:: 3. Search Program Files
if "!ISCC_EXE!"=="" if defined ProgramFiles (
    if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" (
        set "ISCC_EXE=%ProgramFiles%\Inno Setup 6\ISCC.exe"
    )
)

:: 4. Search Program Files (x86)
if "!ISCC_EXE!"=="" if defined ProgramFiles(x86) (
    if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
        set "ISCC_EXE=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
    )
)

if not "!ISCC_EXE!"=="" goto :iscc_found

echo [BUILD-ERROR] Inno Setup Compiler ISCC.exe could not be found!
echo [BUILD-ERROR] Please ensure Inno Setup 6 is installed or add ISCC.exe to system PATH.
endlocal & exit /b 1

:iscc_found
echo [BUILD] Dynamically located Inno Setup Compiler: "!ISCC_EXE!"

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"

set "ISS_FILE=!SCRIPT_DIR!NMITD-Library-Setup.iss"
set "OUT_DIR=!PROJECT_ROOT!\releases"

if not exist "!OUT_DIR!" (
    mkdir "!OUT_DIR!"
    echo [BUILD] Created releases directory: "!OUT_DIR!"
)

echo [BUILD] Compiling "!ISS_FILE!"...
echo.

"!ISCC_EXE!" "!ISS_FILE!"
set "BUILD_RESULT=!ERRORLEVEL!"

echo.
if "!BUILD_RESULT!"=="0" goto :build_success

echo ============================================================
echo [BUILD-ERROR] Compilation failed with exit code: !BUILD_RESULT!
echo ============================================================
endlocal & exit /b !BUILD_RESULT!

:build_success
echo ============================================================
echo   BUILD SUCCESSFUL!
echo ============================================================
set "SETUP_EXE=!OUT_DIR!\NMITD-Library-Setup.exe"
if exist "!SETUP_EXE!" (
    for %%F in ("!SETUP_EXE!") do (
        echo Installer Path: %%~fF
        echo File Size:      %%~zF bytes
    )
)
endlocal & exit /b 0
