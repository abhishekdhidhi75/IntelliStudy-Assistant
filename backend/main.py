import os
import uuid
import shutil
from typing import List, Dict, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import json
import re

from rag_pipeline import RAGPipeline

# Initialize RAG Pipeline at module level
rag = RAGPipeline()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Warmup
    rag._warmup()
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    question: str
    subject: Optional[str] = None
    history: List[Dict] = []

class QuizRequest(BaseModel):
    subject: Optional[str] = None
    num_questions: int = 5

class SummaryRequest(BaseModel):
    subject: Optional[str] = None

class ScheduleGenerateRequest(BaseModel):
    profile: Dict
    subjects: List[str]
    documents: List[Dict]

class ScheduleReoptimizeRequest(BaseModel):
    profile: Dict
    current_schedule: Dict
    quiz_scores: List[Dict]
    session_logs: List[Dict]

class DailyRecommendationRequest(BaseModel):
    profile: Dict
    today_schedule: List[Dict]
    recent_scores: List[Dict]
    streak: int

class GrowthInsightRequest(BaseModel):
    session_logs: List[Dict]
    quiz_scores: List[Dict]
    schedule: Dict

# Endpoints
@app.get("/")
async def root():
    return {"status": "StudyAI API is running"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "chunks": rag.count(),
        "subjects": rag.list_subjects()
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), subject: str = Form("General")):
    file_id = str(uuid.uuid4())
    temp_dir = "./temp_uploads"
    if not os.path.exists(temp_dir): os.makedirs(temp_dir)
    
    file_path = os.path.join(temp_dir, f"{file_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        stats = rag.ingest(file_path, file.filename, subject, file_id)
        os.remove(file_path)
        if stats.get("error"):
            return {"status": "error", "message": stats["error"], "chunks": 0}
        return {
            "file_id": file_id, "filename": file.filename, "subject": subject,
            "chunks": stats["chunks"], "status": "success"
        }
    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        print(f"UPLOAD ENDPOINT ERROR: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        rag.query_stream(request.question, request.subject, request.history),
        media_type="text/event-stream"
    )

@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    return rag.generate_quiz(request.subject, request.num_questions)

@app.post("/summarize")
async def summarize(request: SummaryRequest):
    return rag.summarize(request.subject)

@app.get("/documents")
async def get_documents(subject: Optional[str] = None):
    return rag.list_documents(subject)

@app.delete("/documents/{file_id}")
async def delete_document(file_id: str):
    if rag.delete_document(file_id): return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Document not found")

@app.get("/subjects")
async def get_subjects():
    return {"subjects": rag.list_subjects()}

# --- SCHEDULER & ANALYTICS (Gemini) ---

@app.post("/schedule/generate")
async def generate_schedule(request: ScheduleGenerateRequest):
    p = request.profile
    prompt = f"""You are a personalized study coach. Generate a 7-day study schedule.

STUDENT PROFILE:
- Name: {p.get('name')}
- Exam date: {p.get('exam_date')}
- Available hours per day: {p.get('hours_per_day')}
- Weak subjects: {p.get('weak_subjects')}
- Strong subjects: {p.get('strong_subjects')}
- Study style: {p.get('study_style')}
- Subjects to cover: {request.subjects}

RULES:
1. Allocate 40% more time to weak subjects vs strong subjects
2. Never schedule more than 3 hours of same subject consecutively
3. Include one review/revision day per week
4. Leave Sunday lighter (max 2 hours)
5. Distribute subjects so each appears at least twice per week

Return ONLY valid JSON:
{{
  "schedule": {{
    "monday": [{{ "subject": "NLP", "hours": 2, "topics": "...", "priority": "high" }}],
    "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []
  }},
  "total_hours": 20,
  "reasoning": "..."
}}
"""
    try:
        response = rag.generate_with_retry(prompt)
        raw_text = response.text
        # More robust JSON extraction (handles code blocks and extra text)
        json_match = re.search(r'(\{.*\})', raw_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                # Try cleaning common issues like trailing commas
                cleaned = re.sub(r',\s*([\]\}])', r'\1', json_match.group(1))
                return json.loads(cleaned)
        
        print(f"FAILED TO PARSE JSON. RAW TEXT: {raw_text}")
        return {"error": "Failed to parse schedule JSON. Gemini was too verbose.", "raw": raw_text[:200]}
    except Exception as e:
        print(f"SCHEDULE ERROR: {str(e)}")
        return {"error": str(e)}

@app.post("/schedule/reoptimize")
async def reoptimize_schedule(request: ScheduleReoptimizeRequest):
    prompt = f"""As a study coach, analyze this student's performance and re-optimize their schedule.
    PROFILE: {request.profile}
    CURRENT SCHEDULE: {request.current_schedule}
    QUIZ SCORES: {request.quiz_scores}
    SESSION LOGS: {request.session_logs}

    Return ONLY valid JSON:
    {{
      "schedule": {{ ... }},
      "changes": ["..."],
      "insight": "..."
    }}
    """
    try:
        response = rag.generate_with_retry(prompt)
        raw_text = response.text
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match: return json.loads(json_match.group())
        return {"error": "Failed to parse optimization JSON"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/daily-recommendation")
async def daily_recommendation(request: DailyRecommendationRequest):
    prompt = f"""Provide a short daily study recommendation.
    PROFILE: {request.profile} | SCHEDULE: {request.today_schedule} | SCORES: {request.recent_scores} | STREAK: {request.streak}
    Return ONLY JSON: {{ "message": "...", "focus_subject": "...", "suggested_hours": 3, "tip": "..." }}
    """
    try:
        response = rag.generate_with_retry(prompt)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match: return json.loads(json_match.group())
        return {"message": "Focus on your goals today!"}
    except:
        return {"message": "Keep up the great work!"}

@app.post("/ai/growth-insight")
async def growth_insight(request: GrowthInsightRequest):
    prompt = f"""Analyze study patterns and provide growth insights.
    SESSIONS: {request.session_logs} | SCORES: {request.quiz_scores}
    Return ONLY JSON: {{ "insight": "...", "weak_areas": [], "strong_areas": [], "suggestion": "..." }}
    """
    try:
        response = rag.generate_with_retry(prompt)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match: return json.loads(json_match.group())
        return {"insight": "You are making steady progress."}
    except:
        return {"insight": "Keep studying consistently."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
