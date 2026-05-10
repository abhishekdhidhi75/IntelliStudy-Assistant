import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Circle, RefreshCw, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { ProgressRing, StudyTimer } from './Common';

const SchedulePanel = ({ profile, schedule, setSchedule, subjects }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [activeSession, setActiveSession] = useState(null); // { subject, topics, planned }
  const [sessions, setSessions] = useState(JSON.parse(localStorage.getItem('studyai_sessions') || '[]'));
  const [reoptimizing, setReoptimizing] = useState(false);

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {
    try {
      const recentScores = JSON.parse(localStorage.getItem('studyai_quiz_scores') || '[]').slice(-5);
      const streak = JSON.parse(localStorage.getItem('studyai_streak') || '{"count": 0}').count;
      const todaySchedule = schedule[today] || [];
      const res = await api.getDailyRecommendation(profile, todaySchedule, recentScores, streak);
      setRecommendation(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopSession = (actualSeconds) => {
    const actualMinutes = Math.floor(actualSeconds / 60);
    const newSession = {
      subject: activeSession.subject,
      date: todayDate,
      planned_minutes: activeSession.hours * 60,
      actual_minutes: actualMinutes,
      timestamp: Date.now()
    };
    
    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem('studyai_sessions', JSON.stringify(updated));
    
    // Update Streak logic
    const streakData = JSON.parse(localStorage.getItem('studyai_streak') || '{"count": 0, "last_date": ""}');
    if (streakData.last_date !== todayDate) {
      streakData.count += 1;
      streakData.last_date = todayDate;
      localStorage.setItem('studyai_streak', JSON.stringify(streakData));
    }
    
    setActiveSession(null);
  };

  const handleReoptimize = async () => {
    setReoptimizing(true);
    try {
      const quizScores = JSON.parse(localStorage.getItem('studyai_quiz_scores') || '[]');
      const res = await api.reoptimizeSchedule(profile, schedule, quizScores, sessions);
      
      if (window.confirm("AI has optimized your schedule based on performance. Apply changes? \n\nInsight: " + res.insight)) {
        setSchedule(res.schedule);
        localStorage.setItem('studyai_schedule', JSON.stringify(res.schedule));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReoptimizing(false);
    }
  };

  const calculateTodayProgress = () => {
    const todaySessions = sessions.filter(s => s.date === todayDate);
    const actualTotal = todaySessions.reduce((acc, s) => acc + s.actual_minutes, 0) / 60;
    const plannedTotal = (schedule[today] || []).reduce((acc, s) => acc + s.hours, 0);
    return { actual: actualTotal, planned: plannedTotal || 1 };
  };

  const progress = calculateTodayProgress();
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', background: 'var(--bg1)', overflow: 'hidden' }}>
      {/* Left Column: Today's View */}
      <div style={{ 
        flex: '1.2', borderRight: '1px solid var(--border)', display: 'flex', 
        flexDirection: 'column', padding: '32px', overflowY: 'auto' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Good morning, {profile.name}!</h1>
            <p style={{ color: 'var(--muted)', marginTop: '4px' }}>
              Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exam Countdown</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent)' }}>
              {Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24))} Days
            </div>
          </div>
        </div>

        {/* Daily Recommendation */}
        {recommendation && (
          <div className="animate-fade-up" style={{ 
            background: 'var(--bg2)', padding: '20px', borderRadius: '16px', 
            border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '32px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--accent)'
              }}><Zap size={20} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>AI Recommendation</h3>
                  <span style={{ 
                    backgroundColor: 'var(--accent-d)', color: 'var(--accent)', 
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
                  }}>Focus: {recommendation.focus_subject}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>{recommendation.message}</p>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} /> {recommendation.tip}
                </div>
              </div>
              <button 
                onClick={fetchRecommendation}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Today's Schedule List */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Today's Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(schedule[today] || []).length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg2)', borderRadius: '12px' }}>
                  No sessions scheduled for today. Rest day!
                </div>
              ) : (
                (schedule[today] || []).map((item, idx) => (
                  <div key={idx} style={{ 
                    background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.subject}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.topics}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.hours}h</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Planned</div>
                      </div>
                      <button 
                        onClick={() => setActiveSession(item)}
                        style={{ 
                          padding: '6px 12px', borderRadius: '6px', background: 'var(--accent)', 
                          color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                        }}
                      >
                        Start Timer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Circle & Timer Container */}
          <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              background: 'var(--bg2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
            }}>
              <ProgressRing value={progress.actual} max={progress.planned} size={140} color="var(--success)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{progress.actual.toFixed(1)} / {progress.planned}h</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Completed Today</div>
              </div>
            </div>

            {activeSession && (
              <div className="animate-fade-up">
                <StudyTimer subject={activeSession.subject} onStop={handleStopSession} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Weekly Overview */}
      <div style={{ flex: '0.8', padding: '32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Weekly Overview</h3>
          <button 
            onClick={handleReoptimize}
            disabled={reoptimizing}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none',
              color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
            }}
          >
            {reoptimizing ? <RefreshCw className="animate-spin" size={14} /> : <TrendingUp size={14} />}
            Re-optimize Schedule
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {days.map(day => {
            const isToday = day === today;
            const items = schedule[day] || [];
            const dayTotal = items.reduce((acc, i) => acc + i.hours, 0);
            
            return (
              <div key={day} style={{ 
                background: isToday ? 'var(--bg3)' : 'var(--bg2)', padding: '16px', borderRadius: '16px',
                border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                transition: 'transform 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {day} {isToday && <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>• Today</span>}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{dayTotal}h total</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {items.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>No study sessions</span>
                  ) : (
                    items.map((item, i) => (
                      <div key={i} style={{ 
                        background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px',
                        fontSize: '11px', border: '1px solid var(--border)', display: 'flex', gap: '6px', alignItems: 'center'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors[i % colors.length] }} />
                        {item.subject} ({item.hours}h)
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SchedulePanel;
