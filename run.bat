@echo off
setlocal

echo Starting StudyAI...

:: Start Backend
echo Starting Backend in a new window...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing backend dependencies...
pip install -r requirements.txt -q
start "StudyAI Backend" python main.py

:: Start Frontend
echo Starting Frontend in a new window...
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo Starting frontend dev server...
start "StudyAI Frontend" npm run dev

echo ------------------------------------------------
echo StudyAI is launching!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ------------------------------------------------
echo Press Ctrl+C in this window to stop both services (or close it).
echo ------------------------------------------------

:: Wait for user to close
pause
