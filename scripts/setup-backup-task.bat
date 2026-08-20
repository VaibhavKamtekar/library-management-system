@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: NMITD Library System — Register 6-Hourly Backup Tasks
::
:: Creates 4 Windows Task Scheduler tasks that run backup.bat
:: at 00:00, 06:00, 12:00, and 18:00 daily.
::
:: Run this ONCE as Administrator.
:: The installer runs this automatically during setup.
:: ============================================================

set "SCRIPT_PATH=%~dp0backup.bat"
set "TASK_PREFIX=NMITD Library Backup"

echo(
echo ============================================
echo   NMITD Library System - Backup Scheduler
echo ============================================
echo(
echo Script: %SCRIPT_PATH%
echo Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)
echo(

:: ── Remove legacy daily task from previous version ──────────
schtasks /delete /tn "NMITD Library Daily Backup" /f >nul 2>&1

:: ── Remove existing 6-hourly tasks (idempotent re-register) ─
for %%H in (1 2 3 4) do (
    schtasks /delete /tn "%TASK_PREFIX% %%H" /f >nul 2>&1
)

:: ── Register four daily tasks at 6-hour intervals ───────────
set "FAIL_COUNT=0"

schtasks /create /tn "%TASK_PREFIX% 1" /tr "'%SCRIPT_PATH%'" /sc daily /st 00:00 /ru SYSTEM /f >nul 2>&1
if !ERRORLEVEL! NEQ 0 set /a "FAIL_COUNT+=1"

schtasks /create /tn "%TASK_PREFIX% 2" /tr "'%SCRIPT_PATH%'" /sc daily /st 06:00 /ru SYSTEM /f >nul 2>&1
if !ERRORLEVEL! NEQ 0 set /a "FAIL_COUNT+=1"

schtasks /create /tn "%TASK_PREFIX% 3" /tr "'%SCRIPT_PATH%'" /sc daily /st 12:00 /ru SYSTEM /f >nul 2>&1
if !ERRORLEVEL! NEQ 0 set /a "FAIL_COUNT+=1"

schtasks /create /tn "%TASK_PREFIX% 4" /tr "'%SCRIPT_PATH%'" /sc daily /st 18:00 /ru SYSTEM /f >nul 2>&1
if !ERRORLEVEL! NEQ 0 set /a "FAIL_COUNT+=1"

:: ── Report results ──────────────────────────────────────────
echo(
if "!FAIL_COUNT!"=="0" (
    echo SUCCESS: 4 backup tasks registered.
    echo(
    echo   Task 1: Daily at 00:00 ^(midnight^)
    echo   Task 2: Daily at 06:00
    echo   Task 3: Daily at 12:00
    echo   Task 4: Daily at 18:00
    echo(
    echo Verify in: Task Scheduler ^> Task Scheduler Library
) else (
    echo WARNING: !FAIL_COUNT! task^(s^) failed to register.
    echo Make sure you run this script as Administrator.
)

echo(
pause
