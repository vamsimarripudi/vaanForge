@echo off
cd /d "%~dp0..\backend"
call ..\node_modules\.bin\tsx.cmd src\main.ts >> ..\tmp\backend-local.log 2>&1
