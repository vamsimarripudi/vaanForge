@echo off
cd /d "%~dp0..\frontend"
call ..\node_modules\.bin\vite.cmd --host 0.0.0.0 --port 5174 >> ..\tmp\frontend-3001.log 2>&1
