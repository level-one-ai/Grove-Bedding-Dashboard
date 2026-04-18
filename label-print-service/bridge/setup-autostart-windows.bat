@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM  Grove Bedding Label Bridge — Windows Auto-Start Installer
REM  Run this script ONCE as Administrator to register the bridge agent
REM  as a Windows Task that starts automatically at boot.
REM ─────────────────────────────────────────────────────────────────────────

SET TASK_NAME=GroveLabelBridge
SET NODE_PATH=%ProgramFiles%\nodejs\node.exe
SET SCRIPT_PATH=%~dp0bridge-agent.js
SET WORKING_DIR=%~dp0

echo Installing Grove Label Bridge as a startup task...

REM Delete existing task if present
SCHTASKS /DELETE /TN "%TASK_NAME%" /F 2>nul

REM Create task: runs at system startup, continues if user is not logged in
SCHTASKS /CREATE ^
  /TN "%TASK_NAME%" ^
  /TR "\"%NODE_PATH%\" \"%SCRIPT_PATH%\"" ^
  /SC ONSTART ^
  /DELAY 0000:30 ^
  /RU SYSTEM ^
  /RL HIGHEST ^
  /SD %DATE% ^
  /F

IF %ERRORLEVEL% EQU 0 (
  echo.
  echo [OK] Task "%TASK_NAME%" registered successfully.
  echo      The bridge agent will start automatically at every boot.
  echo.
  echo Starting it now for this session...
  START "" "%NODE_PATH%" "%SCRIPT_PATH%"
  echo [OK] Bridge agent started.
) ELSE (
  echo.
  echo [ERROR] Failed to register task. Make sure you are running as Administrator.
)

pause
