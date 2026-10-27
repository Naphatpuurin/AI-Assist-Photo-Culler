@echo off
title Push to GitHub - MicMose Photo Culler Pro
cd /d "%~dp0"
echo ========================================================
echo   MicMose Photo Culler Pro - GitHub Push Helper
echo   Target: https://github.com/Naphatpuurin/AI-Assist-Photo-Culler
echo ========================================================
echo.
echo Running: git push -u origin main
echo (If prompted by Git Credential Manager, select "Sign in with your browser")
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Repository pushed to GitHub successfully!
) else (
    echo [ERROR] Push did not complete. Please check the error message above.
)
echo.
pause
