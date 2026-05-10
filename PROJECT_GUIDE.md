# StudyAI Platform: Complete Guide

Your AI Study Assistant is now fully operational! This guide provides an overview of what we built and how to manage it.

## 🚀 How to Start the System
Always use the custom `run.bat` file I created in the root directory:
1. Open a terminal in `a:\PROJECT\AIASSISTANT`.
2. Run `.\run.bat`.
3. Two windows will open (Backend and Frontend). Wait until the Backend window says `Uvicorn running on http://0.0.0.0:8000`.

## 🛠 Features Overview

### 1. RAG-Powered Chat
- **What it does**: Searches your specific PDF/DOCX notes to answer questions.
- **Why it's fast**: Uses a local `SentenceTransformer` for instant retrieval and "Thinking..." UI feedback.
- **Model**: Powered by `gemini-flash-latest`.

### 2. Personalized Study Scheduler
- **What it does**: Generates a 7-day plan based on your exam date, weak/strong subjects, and study style.
- **How to use**: Upload documents first, then fill out your profile in the "Schedule" tab.

### 3. AI Quizzes & Summaries
- **Quizzes**: Generates multiple-choice questions based *only* on your uploaded notes.
- **Summaries**: Creates high-level markdown summaries and key points for any subject.

### 4. Performance Analytics
- Tracks your quiz scores and study sessions over time to provide "Growth Insights."

## 🔧 Troubleshooting Tips

### "Upload Failed" or "Connection Error"
This usually means the Backend is not running or is blocked.
- **Fix**: Run `taskkill /f /im python.exe` in a terminal and then restart `run.bat`.

### "Quota Exceeded"
If you hit Gemini's free tier limits:
- **Fix**: Wait a few minutes. The project is already using the `Flash` model, which has the highest available limits for free users.

### Slow Responses
- **First Question**: The very first question after a restart is always slow (~20s) because the computer is loading the AI models.
- **Subsequent Questions**: Should take 5-8 seconds.

## 📂 File Structure
- `/backend`: FastAPI server, RAG logic, and `.env` configuration.
- `/frontend`: React application (Vite).
- `/chroma_db`: Where your notes are stored (don't delete this if you want to keep your data!).
- `run.bat`: The easiest way to start the app.

---
**Enjoy your new AI Study Assistant!**
