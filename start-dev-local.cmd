@echo off
set PORT=%1
if "%PORT%"=="" set PORT=5174
cd /d "%~dp0"
cd /d "%~dp0frontend"
call "%~dp0node_modules\.bin\vite.cmd" --host 0.0.0.0 --port %PORT%
