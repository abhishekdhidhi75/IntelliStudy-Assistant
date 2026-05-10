import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, Flame, Lightbulb, RefreshCw, BarChart2, Calendar } from 'lucide-react';
import { api } from '../utils/api';
import { BarChart, LineChart } from './Common';

const AnalyticsPanel = ({ profile, schedule, sessions, quizScores }) => {
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    fetchGrowthInsight();
  }, []);

  const fetchGrowthInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await api.getGrowthInsight(sessions, quizScores, schedule);
      setInsight(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsight(false);
    }
  };

  // Process data for charts
  const getSubjectStats = () => {
    const subjects = {};
    // Get planned from schedule (all days)
    Object.values(schedule).forEach(dayItems => {
      dayItems.forEach(item => {
        if (!subjects[item.subject]) subjects[item.subject] = { planned: 0, actual: 0 };
        subjects[item.subject].planned += item.hours;
      });
    });

    // Get actual from sessions
    sessions.forEach(s => {
      if (!subjects[s.subject]) subjects[s.subject] = { planned: 0, actual: 0 };
      subjects[s.subject].actual += s.actual_minutes / 60;
    });

    return Object.keys(subjects).map(name => ({
      label: name,
      value: parseFloat(subjects[name].actual.toFixed(1)),
      planned: subjects[name].planned
    }));
  };

  const getQuizTrends = () => {
    return quizScores.slice(-7).map(q => ({
      date: q.date,
      score: (q.score / q.total) * 100
    }));
  };

  const calculateStreak = () => {
    const streak = JSON.parse(localStorage.getItem('studyai_streak') || '{"count": 0}');
    return streak.count;
  };

  const subjectStats = getSubjectStats();
  const quizTrends = getQuizTrends();
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const stats = [
    { label: 'Total Study Hours', value: (sessions.reduce((acc, s) => acc + s.actual_minutes, 0) / 60).toFixed(1) + 'h', icon: <Clock />, color: 'var(--accent)' },
    { label: 'Avg Quiz Score', value: quizScores.length ? Math.round(quizScores.reduce((acc, q) => acc + (q.score/q.total)*100, 0) / quizScores.length) + '%' : '0%', icon: <Target />, color: 'var(--success)' },
    { label: 'Current Streak', value: calculateStreak() + ' Days', icon: <Flame />, color: '#f59e0b' },
    { label: 'Days until Exam', value: Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24)), icon: <Calendar />, color: '#ec4899' },
  ];

  return (
    <div style={{ flex: 1, padding: '32px', background: 'var(--bg1)', overflowY: 'auto', height: '100%' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' }}>Learning Analytics</h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ 
            background: 'var(--bg2)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}1a`, 
              color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Hours Chart */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Study Hours per Subject</h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} /> Actual
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', border: '1px dashed var(--muted)', borderRadius: '2px' }} /> Planned
              </div>
            </div>
          </div>
          <BarChart data={subjectStats} colors={colors} />
        </div>

        {/* Quiz Trends */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px' }}>Quiz Score Trends</h3>
          <LineChart data={quizTrends} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Subject Breakdown Table */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Subject Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 0', fontSize: '12px', color: 'var(--muted)' }}>SUBJECT</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: 'var(--muted)' }}>ACTUAL/PLANNED</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: 'var(--muted)' }}>QUIZZES</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: 'var(--muted)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((s, i) => {
                const ratio = s.value / (s.planned || 1);
                let status = { label: 'On Track', color: 'var(--success)' };
                if (ratio < 0.5) status = { label: 'Critical', color: 'var(--error)' };
                else if (ratio < 0.8) status = { label: 'Behind', color: '#f59e0b' };

                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '500' }}>{s.label}</td>
                    <td style={{ padding: '16px 0', fontSize: '14px' }}>{s.value}h / {s.planned}h</td>
                    <td style={{ padding: '16px 0', fontSize: '14px' }}>
                      {quizScores.filter(q => q.subject === s.label).length}
                    </td>
                    <td style={{ padding: '16px 0' }}>
                      <span style={{ 
                        backgroundColor: `${status.color}1a`, color: status.color, 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' 
                      }}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Insight Card */}
        <div style={{ 
          background: 'var(--bg2)', padding: '24px', borderRadius: '24px', 
          border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: '20px',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--accent-d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
              }}><TrendingUp size={20} /></div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>AI Growth Insight</h3>
            </div>
            <button 
              onClick={fetchGrowthInsight}
              disabled={loadingInsight}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loadingInsight ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingInsight ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw className="animate-spin" size={32} color="var(--accent)" />
            </div>
          ) : (
            <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }}>
                {insight?.insight || "Studying consistently and reviewing weak areas will significantly improve your retention. Keep track of your progress!"}
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'var(--bg3)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>STRENGTHS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(insight?.strong_areas || ['Consistent focus']).map(a => (
                      <span key={a} style={{ fontSize: '11px', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{a}</span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg3)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>AREAS TO IMPROVE</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(insight?.weak_areas || ['Active recall']).map(a => (
                      <span key={a} style={{ fontSize: '11px', color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{a}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '12px', 
                borderLeft: '4px solid var(--accent)', display: 'flex', gap: '12px' 
              }}>
                <Lightbulb size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--muted)' }}>
                  {insight?.suggestion || "Try using the practice quiz feature more often to test your knowledge."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* GitHub style streak calendar */}
      <div style={{ marginTop: '32px', background: 'var(--bg2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Study Activity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 1fr)', gap: '4px' }}>
          {Array.from({ length: 53 * 7 }).map((_, i) => {
            const opacity = Math.random() > 0.8 ? 1 : Math.random() > 0.6 ? 0.4 : 0.05;
            return (
              <div key={i} style={{ 
                width: '10px', height: '10px', borderRadius: '2px', 
                backgroundColor: 'var(--success)', opacity: opacity 
              }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px', fontSize: '10px', color: 'var(--muted)' }}>
          Less <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)', opacity: 0.05 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)', opacity: 0.4 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)', opacity: 0.7 }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)', opacity: 1 }} /> More
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
