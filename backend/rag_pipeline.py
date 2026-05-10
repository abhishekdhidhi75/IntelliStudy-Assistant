import os
import re
import json
import uuid
import pdfplumber
import docx
from datetime import datetime
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class RAGPipeline:
    def __init__(self):
        print("Initializing RAG Pipeline...")
        # 1. Load Embedder
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        
        # 2. Setup ChromaDB
        self.db_path = "./chroma_db"
        if not os.path.exists(self.db_path):
            os.makedirs(self.db_path)
            
        self.chroma_client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection with cosine similarity
        self.collection = self.chroma_client.get_or_create_collection(
            name="study_docs",
            metadata={"hnsw:space": "cosine"}
        )
        
        # 3. Setup Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-flash-lite-latest')
        
        # 4. Metadata handling
        self.meta_path = os.path.join(self.db_path, "meta.json")
        self.metadata = self._load_meta()
        
        self.last_sources = []
        print("RAG Pipeline Initialized.")

    def _load_meta(self) -> Dict:
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_meta(self):
        with open(self.meta_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)

    def _warmup(self):
        print("Warming up models...")
        try:
            self.embedder.encode(["warmup"])
            count = self.collection.count()
            if count > 0:
                self.collection.query(
                    query_embeddings=self.embedder.encode(["warmup"]).tolist(),
                    n_results=1
                )
            print("Warmup complete")
        except Exception as e:
            print(f"Warmup failed: {e}")

    def _extract(self, path: str) -> str:
        ext = os.path.splitext(path)[1].lower()
        text = ""
        try:
            if ext == ".pdf":
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        content = page.extract_text()
                        if content:
                            text += content + "\n"
            elif ext == ".docx":
                doc = docx.Document(path)
                text = "\n".join([para.text for para in doc.paragraphs])
            elif ext in [".txt", ".md"]:
                with open(path, 'r', encoding='utf-8') as f:
                    text = f.read()
        except Exception as e:
            print(f"Extraction error ({ext}): {e}")
        return text

    def _chunk(self, text: str, size: int = 400, overlap: int = 80) -> List[str]:
        if not text: return []
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            words = sentence.split()
            if not words: continue
            
            current_chunk.extend(words)
            current_length += len(words)
            
            if current_length >= size:
                chunk_text = " ".join(current_chunk)
                if len(current_chunk) >= 20: # Slightly smaller threshold
                    chunks.append(chunk_text)
                current_chunk = current_chunk[-overlap:] if overlap < len(current_chunk) else current_chunk
                current_length = len(current_chunk)
        
        if current_chunk and len(current_chunk) >= 20:
            chunks.append(" ".join(current_chunk))
        return chunks

    def ingest(self, path: str, filename: str, subject: str, file_id: str) -> Dict:
        print(f"Ingesting: {filename} ({subject})")
        text = self._extract(path)
        if not text.strip():
            print("No text extracted from file.")
            return {"chunks": 0, "error": "No text extracted"}
            
        chunks = self._chunk(text)
        print(f"Generated {len(chunks)} chunks.")
        if not chunks: return {"chunks": 0}
            
        try:
            embeddings = self.embedder.encode(chunks).tolist()
            ids = [f"{file_id}_{i}" for i in range(len(chunks))]
            metadatas = [{
                "file_id": file_id,
                "filename": filename,
                "subject": subject,
                "chunk_index": i
            } for i in range(len(chunks))]
            
            self.collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
            
            self.metadata[file_id] = {
                "filename": filename,
                "subject": subject,
                "chunk_count": len(chunks),
                "timestamp": datetime.now().isoformat()
            }
            self._save_meta()
            print(f"Successfully ingested {filename}")
            return {"chunks": len(chunks)}
        except Exception as e:
            print(f"Ingestion error for {filename}: {e}")
            return {"chunks": 0, "error": str(e)}

    def _retrieve(self, query: str, subject: Optional[str] = None, k: int = 5) -> List[Dict]:
        query_embedding = self.embedder.encode([query]).tolist()
        where = {"subject": subject} if subject and subject != "All Subjects" else None
        results = self.collection.query(query_embeddings=query_embedding, n_results=k, where=where)
        
        formatted = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                doc = results['documents'][0][i]
                meta = results['metadatas'][0][i]
                dist = results['distances'][0][i]
                relevance = max(0, min(100, round((1 - dist) * 100)))
                formatted.append({
                    "text": doc,
                    "filename": meta['filename'],
                    "chunk_index": meta['chunk_index'],
                    "relevance": relevance
                })
        return formatted

    def generate_with_retry(self, prompt: str, stream: bool = False, history: List[Dict] = [], max_retries: int = 3):
        import time
        chat_history = []
        for h in history:
            role = "user" if h['role'] == 'user' else "model"
            chat_history.append({"role": role, "parts": [h['content']]})

        for attempt in range(max_retries):
            try:
                if history or stream:
                    chat = self.model.start_chat(history=chat_history)
                    response = chat.send_message(prompt, stream=stream)
                else:
                    response = self.model.generate_content(prompt)
                return response
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"Quota hit. Retrying in 2s... (Attempt {attempt+1})")
                    time.sleep(2)
                    continue
                raise e

    def query_stream(self, question: str, subject: Optional[str] = None, history: List[Dict] = []):
        import time
        start_time = time.time()
        print(f"\n--- Chat Request: {question} ---")
        
        # Initial retrieval
        t1 = time.time()
        chunks = self._retrieve(question, subject, k=3) # Reduced to 3 for speed
        retrieval_time = time.time() - t1
        print(f"Retrieval took: {retrieval_time:.2f}s (Found {len(chunks)} chunks)")

        if not chunks:
            self.last_sources = []
            yield "data: " + json.dumps({"token": "I couldn't find any relevant information in your uploaded documents."}) + "\n\n"
            yield "data: " + json.dumps({"done": True, "sources": []}) + "\n\n"
            return

        self.last_sources = chunks
        context_block = "\n\n".join([
            f"[Source: {c['filename']} | Chunk {c['chunk_index']} | Relevance {c['relevance']}%]\n{c['text']}"
            for c in chunks
        ])
        
        system_prompt = f"""You are a helpful AI Study Assistant. Answer questions strictly based on the provided context.
        
CONTEXT FROM STUDENT NOTES:
{context_block}

RULES:
1. Answer ONLY using the context above.
2. If the answer isn't in the context, say you don't know based on the notes.
3. Cite the filename when referring to specific information.
"""
        
        chat_history = []
        for h in history[-6:]:
            role = "user" if h['role'] == 'user' else "model"
            chat_history.append({"role": role, "parts": [h['content']]})
            
        try:
            response = self.generate_with_retry(f"{system_prompt}\n\nQUESTION: {question}", stream=True, history=history[-6:])
            first = True
            for chunk in response:
                if chunk.text:
                    if first:
                        print(f"First token from Gemini received.")
                        first = False
                    yield "data: " + json.dumps({"token": chunk.text}) + "\n\n"
            
            yield "data: " + json.dumps({"done": True, "sources": chunks}) + "\n\n"
        except Exception as e:
            print(f"Error in query_stream: {str(e)}")
            yield "data: " + json.dumps({"token": f"AI is very busy right now. Please wait a moment and try again. (Error: {str(e)})"}) + "\n\n"
            yield "data: " + json.dumps({"done": True, "sources": []}) + "\n\n"

    def generate_quiz(self, subject: Optional[str] = None, num_q: int = 5):
        where = {"subject": subject} if subject and subject != "All Subjects" else None
        results = self.collection.get(where=where, limit=20)
        if not results['documents']: return {"questions": [], "error": "No documents found."}
            
        docs = results['documents'][:12]
        context = "\n---\n".join(docs)[:3500]
        
        prompt = f"""Based on these study notes, generate a {num_q}-question multiple choice quiz.
        
NOTES:
{context}

Return ONLY a JSON array of objects with this structure:
[{{ "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "..." }}]
"""
        try:
            response = self.generate_with_retry(prompt)
            raw_text = response.text
            json_str = re.search(r'\[.*\]', raw_text, re.DOTALL).group()
            return {"questions": json.loads(json_str), "subject": subject}
        except Exception as e:
            print(f"Quiz Gen Error: {e}")
            return {"questions": [], "error": "Failed to generate quiz"}

    def summarize(self, subject: Optional[str] = None):
        where = {"subject": subject} if subject and subject != "All Subjects" else None
        results = self.collection.get(where=where, limit=15)
        if not results['documents']: return {"summary": "No documents found.", "key_points": []}
            
        docs = results['documents'][:10]
        context = "\n---\n".join(docs)[:3500]
        
        prompt = f"""Summarize these study notes.
        
NOTES:
{context}

Return ONLY JSON: {{ "summary": "Markdown summary here", "key_points": ["Point 1", "Point 2", ...] }}
"""
        try:
            response = self.generate_with_retry(prompt)
            raw_text = response.text
            json_str = re.search(r'\{.*\}', raw_text, re.DOTALL).group()
            return json.loads(json_str)
        except Exception as e:
            print(f"Summary Gen Error: {e}")
            return {"summary": "Failed to generate summary.", "key_points": []}

    def list_documents(self, subject: Optional[str] = None) -> List[Dict]:
        docs = []
        for fid, meta in self.metadata.items():
            if not subject or subject == "All Subjects" or meta['subject'] == subject:
                docs.append({
                    "file_id": fid, "filename": meta['filename'], "subject": meta['subject'],
                    "chunk_count": meta['chunk_count'], "timestamp": meta['timestamp']
                })
        return docs

    def list_subjects(self) -> List[str]:
        return sorted(list(set(meta['subject'] for meta in self.metadata.values())))

    def delete_document(self, file_id: str):
        if file_id in self.metadata:
            self.collection.delete(where={"file_id": file_id})
            del self.metadata[file_id]
            self._save_meta()
            return True
        return False

    def count(self) -> int:
        return self.collection.count()
