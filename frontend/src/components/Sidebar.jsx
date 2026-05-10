import React from 'react';
import { MessageSquare, Brain, ClipboardList, Calendar, BarChart3, GraduationCap } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, subjects, activeSubject, setActiveSubject, health, profile, currentAccount, onLogout, onSwitchAccount }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  
  const tabs = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { id: 'quiz', label: 'Quiz Me', icon: <Brain size={20} /> },
    { id: 'summary', label: 'Summarize', icon: <ClipboardList size={20} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const accounts = ['Student', 'Researcher', 'Professor'];

  return (
    <div style={{
      width: '215px',
      backgroundColor: 'var(--bg1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        }}>A</div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '18px', lineHeight: '1', letterSpacing: '-0.02em', color: 'var(--text)' }}>Aetheris</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Study Engine</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '0 12px', marginTop: '12px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
              borderRadius: '0 8px 8px 0',
              color: activeTab === tab.id ? '#818cf8' : 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '4px',
              textAlign: 'left'
            }}
          >
            {React.cloneElement(tab.icon, { size: 18, strokeWidth: activeTab === tab.id ? 2.5 : 2 })}
            <span style={{ fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '14px' }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ margin: '16px 20px', height: '1px', backgroundColor: 'var(--border)' }} />

      {/* Subjects */}
      <div style={{ padding: '0 20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '16px' }}>SUBJECTS</div>
        
        <button
          onClick={() => setActiveSubject(null)}
          style={{
            width: '100%',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: activeSubject === null ? 'var(--bg3)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: activeSubject === null ? 'var(--text)' : 'var(--muted)',
            cursor: 'pointer',
            fontSize: '13px',
            textAlign: 'left',
            marginBottom: '4px'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid white' }} />
          All Notes
        </button>

        {subjects.map((sub, i) => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            style={{
              width: '100%',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: activeSubject === sub ? 'var(--bg3)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeSubject === sub ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
              marginBottom: '2px'
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: colors[i % colors.length] }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
          </button>
        ))}
      </div>

      {/* Footer Profile Section */}
      <div style={{ position: 'relative', padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg1)' }}>
        
        {/* Account Menu Popup */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '16px',
            right: '16px',
            backgroundColor: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', padding: '4px 8px', marginBottom: '4px' }}>SWITCH ACCOUNT</div>
            {accounts.map(acc => (
              <button
                key={acc}
                onClick={() => { onSwitchAccount(acc); setShowMenu(false); }}
                style={{
                  width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: currentAccount === acc ? 'var(--bg3)' : 'transparent',
                  color: 'var(--text)', textAlign: 'left', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: currentAccount === acc ? 'var(--accent)' : 'transparent' }} />
                {acc}
              </button>
            ))}
            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
            <button
              onClick={() => { onLogout(); setShowMenu(false); }}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: 'transparent',
                color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}
            >
              Logout Account
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>{health?.chunks || 0} CHUNKS ACTIVE</div>
        </div>
        
        <div 
          onClick={() => setShowMenu(!showMenu)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '10px', 
            cursor: 'pointer', transition: 'background 0.2s', border: showMenu ? '1px solid var(--accent)' : '1px solid transparent',
            background: showMenu ? 'var(--bg2)' : 'transparent'
          }}
          className="profile-hover"
        >
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'linear-gradient(to bottom right, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white'
          }}>{currentAccount[0]}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentAccount}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{profile ? `${profile.studyStyle} Mode` : 'No Profile'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
