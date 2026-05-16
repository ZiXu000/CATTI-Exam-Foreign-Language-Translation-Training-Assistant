@echo off
chcp 65001 > nul
echo Starting CATTI Auto-Grader MVP...

cd /d "%~dp0"

if not exist "catti_grader\venv\Scripts\activate.bat" (
    echo Virtual environment not found. Setting it up now...
    cd catti_grader
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

:: Start Backend
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CATTI Backend" cmd /c "cd catti_grader && call venv\Scripts\activate.bat && set PYTHONPATH=%%cd%% && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Start Frontend
echo Starting React Frontend...
if not exist "catti_frontend\node_modules" (
    echo Node modules not found. Installing...
    start "CATTI Frontend Install & Start" cmd /c "cd catti_frontend && npm install && npm run dev"
) else (
    start "CATTI Frontend" cmd /c "cd catti_frontend && npm run dev"
)

echo Both services started. Check the new windows.
pause
