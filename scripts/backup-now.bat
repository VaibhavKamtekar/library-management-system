@echo off
:: ============================================================
:: NMITD Library System — Manual Backup (Backup Now)
::
:: User-friendly wrapper around backup.bat.
:: Shows result in a console window and pauses for the user.
:: ============================================================

echo(
echo ============================================
echo   NMITD Library System - Manual Backup
echo ============================================
echo(

call "%~dp0backup.bat"
set "BACKUP_RESULT=%ERRORLEVEL%"

echo(
if "%BACKUP_RESULT%"=="0" (
    echo   ================================================
    echo     SUCCESS: Database backup created and verified.
    echo   ================================================
) else if "%BACKUP_RESULT%"=="1" (
    echo   ================================================
    echo     ERROR: Database dump failed.
    echo     Check that MySQL is running and credentials
    echo     in .env are correct.
    echo   ================================================
) else if "%BACKUP_RESULT%"=="2" (
    echo   ================================================
    echo     ERROR: Backup verification failed.
    echo     The dump was created but failed integrity
    echo     checks. Check logs\backup.log for details.
    echo   ================================================
) else (
    echo   ================================================
    echo     ERROR: Unexpected error (code %BACKUP_RESULT%).
    echo     Check logs\backup.log for details.
    echo   ================================================
)

echo(
pause
