# 🌌 Aetheris Study Engine
**The AI-Powered RAG Engine for Student Success**

Aetheris is a next-generation study platform that uses **Retrieval Augmented Generation (RAG)** to transform your static PDF notes into an interactive, intelligent study ecosystem.

## 🚀 Core Features
- **Smart RAG Chat**: Chat with your documents using Gemini-3-Flash.
- **AI Quiz Generator**: Instant multiple-choice quizzes based on your specific notes.
- **Dynamic Study Scheduler**: Personalized 7-day plans that adapt to your strengths and weaknesses.
- **Multi-Account Profiles**: Switch between Student, Researcher, and Professor modes.
- **Real-time Analytics**: Track your study hours, quiz accuracy, and growth insights live.

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite, Lucide Icons, Glassmorphic UI.
- **Backend**: FastAPI (Python), Uvicorn.
- **AI/ML**: Google Gemini (generative-ai), SentenceTransformers (Embeddings).
- **Vector Database**: ChromaDB (High-performance vector storage).

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/Aetheris-Study-Engine.git
cd Aetheris-Study-Engine
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```
Create a `.env` file in the `/backend` folder:
```env
GEMINI_API_KEY=your_key_here
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎓 Presentation Notes
This project was developed to showcase the power of **Context-Aware AI** in education. By indexing local documents into a vector database, we eliminate AI "hallucinations" and provide students with grounded, factual study assistance.

---
**Developed for [Your Class Name/Presentation Date]**
