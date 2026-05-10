import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipboardList, Sparkles, BookOpen, Target, Loader2, Bot } from 'lucide-react';
import { api } from '../utils/api';

const SummaryPanel = ({ subject }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.getSummary(subject);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <ClipboardList size={20} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Smart Summarizer</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Get a concise overview of {subject || "all subjects"}
            </p>
          </div>
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
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Summarizing...' : '✨ Generate Summary'}
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {!data && !loading ? (
          <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', color: 'var(--muted)', gap: '16px' 
          }}>
            <div style={{ opacity: 0.2 }}><BookOpen size={64} /></div>
            <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>
              Click generate to analyze your documents and create a structured summary.
            </p>
          </div>
        ) : loading ? (
          <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', color: 'var(--accent)', gap: '20px' 
          }}>
            <div style={{ position: 'relative' }}>
              <div className="animate-spin" style={{ 
                width: '60px', height: '60px', border: '4px solid var(--bg3)', 
                borderTopColor: 'var(--accent)', borderRadius: '50%' 
              }} />
              <Bot size={24} style={{ position: 'absolute', top: '18px', left: '18px' }} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: '500' }}>Gemini is analyzing your notes...</p>
          </div>
        ) : (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Overview Card */}
            <div className="animate-fade-up" style={{ 
              background: 'var(--bg2)', border: '1px solid var(--border)', 
              borderRadius: '20px', padding: '32px', marginBottom: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  backgroundColor: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyCenter: 'center'
                }}>
                  <BookOpen size={18} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>📝 Overview</h3>
                <span style={{ 
                  marginLeft: 'auto', backgroundColor: 'var(--accent-d)', color: 'var(--accent)',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600'
                }}>
                  {subject || "All Subjects"}
                </span>
              </div>
              
              <div className="markdown-content" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                <ReactMarkdown>{data.summary}</ReactMarkdown>
              </div>
            </div>

            {/* Key Points Card */}
            <div className="animate-fade-up" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingLeft: '8px' }}>
                <Target size={20} color="#10b981" />
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>🎯 Key Points</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {data.key_points.map((point, i) => (
                  <div key={i} style={{ 
                    background: 'var(--bg2)', border: '1px solid var(--border)', 
                    borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px',
                    transition: 'transform 0.2s', cursor: 'default'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--success)', display: 'flex', alignItems: 'center', justifyCenter: 'center',
                      fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              padding: '20px', borderTop: '1px solid var(--border)', textAlign: 'center',
              color: 'var(--muted)', fontSize: '11px'
            }}>
              🤖 Generated by Gemini 1.5 Flash using RAG · Based on {subject || "entire collection"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
