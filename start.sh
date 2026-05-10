#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
  python -m venv venv
fi
source venv/Scripts/activate || source venv/bin/activate
pip install -r requirements.txt -q
python main.py &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo "------------------------------------------------"
echo "StudyAI is launching!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "------------------------------------------------"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
