@echo off
chcp 65001 > nul
echo Starting CATTI Auto-Grader MVP...

cd /d "%~dp0"

if not exist "catti_grader\venv\Scripts\activate.bat" (
    echo Virtual environment not found. Please run pip install first.
    pause
    exit /b 1
)

:: Start Backend
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CATTI Backend" cmd /c "cd catti_grader && call venv\Scripts\activate.bat && set PYTHONPATH=%%cd%% && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Start Frontend
echo Starting React Frontend...
start "CATTI Frontend" cmd /c "cd catti_frontend && npm run dev"

echo Both services started. Check the new windows.
pause
