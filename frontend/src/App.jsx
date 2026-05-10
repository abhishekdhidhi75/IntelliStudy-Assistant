import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocPanel from './components/DocPanel';
import ChatPanel from './components/ChatPanel';
import QuizPanel from './components/QuizPanel';
import SummaryPanel from './components/SummaryPanel';
import SchedulePanel from './components/SchedulePanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import ProfileSetup from './components/ProfileSetup';
import { api } from './utils/api';
import './global.css';

const App = () => {
  const [tab, setTab] = useState('chat');
  const [subject, setSubject] = useState(null);
  const [docs, setDocs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [health, setHealth] = useState(null);
  
  // Account Management
  const [currentAccount, setCurrentAccount] = useState(localStorage.getItem('studyai_current_account') || 'Student');
  
  // Profile & Performance State
  const safeParse = (key, fallback) => {
    try {
      const accountKey = `${key}_${currentAccount}`;
      const item = localStorage.getItem(accountKey);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  };

  const [profile, setProfile] = useState(safeParse('studyai_profile', null));
  const [schedule, setSchedule] = useState(safeParse('studyai_schedule', null));
  const [sessions, setSessions] = useState(safeParse('studyai_sessions', []));
  const [quizScores, setQuizScores] = useState(safeParse('studyai_quiz_scores', []));

  const refreshData = async () => {
    try {
      const [d, s, h] = await Promise.all([
        api.getDocs(subject),
        api.getSubjects(),
        api.getHealth()
      ]);
      setDocs(d);
      setSubjects(s);
      setHealth(h);
      
      // Refresh real-time data from localStorage
      setProfile(safeParse('studyai_profile', null));
      setSchedule(safeParse('studyai_schedule', null));
      setSessions(safeParse('studyai_sessions', []));
      setQuizScores(safeParse('studyai_quiz_scores', []));
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [subject, currentAccount]);

  // Real-time sync across tabs/components
  useEffect(() => {
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleProfileComplete = (newProfile, newSchedule) => {
    const pKey = `studyai_profile_${currentAccount}`;
    const sKey = `studyai_schedule_${currentAccount}`;
    localStorage.setItem(pKey, JSON.stringify(newProfile));
    localStorage.setItem(sKey, JSON.stringify(newSchedule));
    setProfile(newProfile);
    setSchedule(newSchedule);
    setTab('schedule');
  };

  const handleLogout = () => {
    setProfile(null);
    setSchedule(null);
    setTab('chat');
  };

  const handleSwitchAccount = (newAccount) => {
    localStorage.setItem('studyai_current_account', newAccount);
    setCurrentAccount(newAccount);
    setTab('chat');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg1)', color: 'var(--text)' }}>
      
      {/* Sidebar */}
      <Sidebar 
        activeTab={tab} 
        setActiveTab={setTab} 
        subjects={subjects} 
        activeSubject={subject} 
        setActiveSubject={setSubject}
        health={health}
        profile={profile}
        currentAccount={currentAccount}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Document Panel */}
      <DocPanel 
        docs={docs} 
        subjects={subjects} 
        onRefresh={refreshData} 
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
        {tab === 'chat' && <ChatPanel subject={subject} />}
        {tab === 'quiz' && <QuizPanel subject={subject} onComplete={refreshData} currentAccount={currentAccount} />}
        {tab === 'summary' && <SummaryPanel subject={subject} />}
        {tab === 'schedule' && profile && schedule && (
          <SchedulePanel 
            profile={profile} 
            schedule={schedule} 
            setSchedule={setSchedule}
            subjects={subjects}
          />
        )}
        {tab === 'analytics' && profile && (
          <AnalyticsPanel 
            profile={profile} 
            schedule={schedule || {}} 
            sessions={sessions} 
            quizScores={quizScores} 
          />
        )}

        {/* Fallback for Schedule/Analytics if no profile */}
        {(tab === 'schedule' || tab === 'analytics') && !profile && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div style={{ fontSize: '48px' }}>👋</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Welcome to Aetheris</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '400px', textAlign: 'center' }}>
              Upload your study materials first, then complete your profile to unlock personalized scheduling and analytics.
            </p>
            <button 
              onClick={() => setTab('chat')}
              style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Go to Chat & Upload
            </button>
          </div>
        )}
      </main>

      {/* Profile Setup Modal Overlay */}
      {!profile && docs.length > 0 && (
        <ProfileSetup subjects={subjects} onComplete={handleProfileComplete} />
      )}

    </div>
  );
};

export default App;
