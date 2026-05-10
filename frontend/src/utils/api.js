const BASE = '/api';

export const api = {
  async upload(file, subject) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async getDocs(subject) {
    const url = subject && subject !== 'All Subjects' 
      ? `${BASE}/documents?subject=${encodeURIComponent(subject)}` 
      : `${BASE}/documents`;
    const res = await fetch(url);
    return res.json();
  },

  async deleteDoc(id) {
    const res = await fetch(`${BASE}/documents/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getSubjects() {
    const res = await fetch(`${BASE}/subjects`);
    const data = await res.json();
    return data.subjects;
  },

  async getQuiz(subject, n) {
    const res = await fetch(`${BASE}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, num_questions: n }),
    });
    return res.json();
  },

  async getSummary(subject) {
    const res = await fetch(`${BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject }),
    });
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${BASE}/health`);
    return res.json();
  },

  // SSE Chat
  async streamChat(question, subject, history, onToken, onDone, onError) {
    try {
      const response = await fetch(`${BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, subject, history }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) onToken(data.token);
              if (data.done) onDone(data.sources);
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
            }
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  },

  // Scheduler & Analytics
  async generateSchedule(profile, subjects, documents) {
    const res = await fetch(`${BASE}/schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, subjects, documents }),
    });
    return res.json();
  },

  async reoptimizeSchedule(profile, current_schedule, quiz_scores, session_logs) {
    const res = await fetch(`${BASE}/schedule/reoptimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, current_schedule, quiz_scores, session_logs }),
    });
    return res.json();
  },

  async getDailyRecommendation(profile, today_schedule, recent_scores, streak) {
    const res = await fetch(`${BASE}/ai/daily-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, today_schedule, recent_scores, streak }),
    });
    return res.json();
  },

  async getGrowthInsight(session_logs, quiz_scores, schedule) {
    const res = await fetch(`${BASE}/ai/growth-insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_logs, quiz_scores, schedule }),
    });
    return res.json();
  }
};
