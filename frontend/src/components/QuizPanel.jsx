import React, { useState } from 'react';
import { Brain, Zap, CheckCircle2, XCircle, Lightbulb, Trophy, ChevronDown, RotateCcw } from 'lucide-react';
import { api } from '../utils/api';

const QuizPanel = ({ subject, onComplete, currentAccount = 'Student' }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [answers, setAnswers] = useState({}); // { index: selectedOption }
  const [revealed, setRevealed] = useState({}); // { index: bool }
  const [showScore, setShowScore] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setAnswers({});
    setRevealed({});
    setShowScore(false);
    try {
      const res = await api.getQuiz(subject, numQuestions);
      if (res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIdx, opt) => {
    if (revealed[qIdx]) return;
    setAnswers(prev => ({ ...prev, [qIdx]: opt })); // Store just 'A', 'B', etc.
  };

  const handleReveal = (qIdx) => {
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    return correct;
  };

  const saveScore = () => {
    const score = calculateScore();
    const result = {
      subject: subject || "General",
      score: score,
      total: questions.length,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    
    const scoresKey = `studyai_quiz_scores_${currentAccount}`;
    const existing = JSON.parse(localStorage.getItem(scoresKey) || '[]');
    localStorage.setItem(scoresKey, JSON.stringify([...existing, result]));
    
    // Update streak
    const streakKey = `studyai_streak_${currentAccount}`;
    const streakData = JSON.parse(localStorage.getItem(streakKey) || '{"count": 0, "last_date": ""}');
    const today = new Date().toISOString().split('T')[0];
    if (streakData.last_date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      
      if (streakData.last_date === yestStr) {
        streakData.count += 1;
      } else {
        streakData.count = 1;
      }
      streakData.last_date = today;
      localStorage.setItem(streakKey, JSON.stringify(streakData));
    }
    
    setShowScore(true);
    if (onComplete) onComplete();
  };

  if (showScore) {
    const score = calculateScore();
    const percent = (score / questions.length) * 100;
    let color = 'var(--error)';
    let msg = "Keep studying! You can do better.";
    if (percent >= 80) { color = 'var(--success)'; msg = "Excellent! You've mastered this topic."; }
    else if (percent >= 50) { color = '#f59e0b'; msg = "Good effort! A bit more review and you'll be there."; }

    return (
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg1)' }}>
        <div className="animate-fade-up" style={{ 
          background: 'var(--bg2)', padding: '48px', borderRadius: '24px', border: `2px solid ${color}`,
          textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: `0 0 40px ${color}1a`
        }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: `${color}1a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            border: `1px solid ${color}`
          }}>
            <Trophy size={40} color={color} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>{score} / {questions.length}</h2>
          <p style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '16px' }}>{msg}</p>
          <div style={{ height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ height: '100%', background: color, width: `${percent}%`, transition: 'width 1s ease-out' }} />
          </div>
          <button 
            onClick={() => setShowScore(false)}
            style={{
              padding: '12px 32px', borderRadius: '12px', background: 'var(--accent)',
              color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto'
            }}
          >
            <RotateCcw size={18} /> Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg1)' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 24px', borderBottom: '1px solid var(--border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10, 10, 12, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <Brain size={20} color="#8b5cf6" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Quiz Generator</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Test your knowledge on {subject || "all subjects"}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <select 
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              style={{
                padding: '8px 12px', paddingRight: '32px', backgroundColor: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)',
                fontSize: '13px', appearance: 'none', cursor: 'pointer'
              }}
            >
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} Questions</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '11px', pointerEvents: 'none', color: 'var(--muted)' }} />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)',
              color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            {loading ? <RotateCcw className="animate-spin" size={16} /> : <Zap size={16} />}
            {loading ? 'Generating...' : '⚡ Generate Quiz'}
          </button>
        </div>
      </div>

      {/* Questions Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {questions.length === 0 ? (
          <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', color: 'var(--muted)', gap: '16px' 
          }}>
            <div style={{ opacity: 0.2 }}><Brain size={64} /></div>
            <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>
              Select a subject and click generate to create a custom quiz from your notes.
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {questions.map((q, i) => (
              <div key={i} className="animate-fade-up" style={{ 
                background: 'var(--bg2)', border: '1px solid var(--border)', 
                borderRadius: '16px', padding: '24px', marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ 
                    backgroundColor: 'var(--accent-d)', color: 'var(--accent)', 
                    padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' 
                  }}>Q{i + 1}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', lineHeight: '1.5' }}>{q.question}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {q.options.map((opt, oi) => {
                    const optKey = opt[0]; // 'A', 'B', etc.
                    const isSelected = answers[i] === optKey;
                    const isCorrect = revealed[i] && optKey === q.answer;
                    const isWrong = revealed[i] && isSelected && optKey !== q.answer;
                    
                    let bg = 'var(--bg3)';
                    let border = '1px solid var(--border)';
                    if (isSelected) { bg = 'var(--accent-d)'; border = '1px solid var(--accent)'; }
                    if (isCorrect) { bg = 'rgba(16, 185, 129, 0.2)'; border = '1px solid var(--success)'; }
                    if (isWrong) { bg = 'rgba(239, 68, 68, 0.2)'; border = '1px solid var(--error)'; }

                    return (
                      <button
                        key={oi}
                        onClick={() => handleSelect(i, optKey)}
                        style={{
                          padding: '14px 16px', borderRadius: '10px', background: bg, border: border,
                          color: 'var(--text)', textAlign: 'left', fontSize: '14px', cursor: 'pointer',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 size={16} color="var(--success)" />}
                        {isWrong && <XCircle size={16} color="var(--error)" />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  {answers[i] && !revealed[i] && (
                    <button 
                      onClick={() => handleReveal(i)}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', background: 'var(--bg3)',
                        color: 'var(--accent)', border: '1px solid var(--accent)', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Reveal Answer
                    </button>
                  )}
                  {revealed[i] && (
                    <div className="animate-fade-up" style={{ 
                      flex: 1, backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                      padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent)',
                      display: 'flex', gap: '10px'
                    }}>
                      <Lightbulb size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {Object.keys(revealed).length === questions.length && (
              <button 
                onClick={saveScore}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--success)',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '40px'
                }}
              >
                <BarChart3 size={20} /> See My Score
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;
