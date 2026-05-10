#!/bin/bash
cd "$(dirname "$0")"
if [ -f .env ]; then
  export $(cat .env | xargs)
fi
pip install -r requirements.txt -q
uvicorn main:app --reload --host 0.0.0.0 --port 8000
