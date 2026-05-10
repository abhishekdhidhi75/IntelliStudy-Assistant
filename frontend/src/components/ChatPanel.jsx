import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Sparkles, FileText } from 'lucide-react';
import { api } from '../utils/api';

const ChatPanel = ({ subject }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Study Assistant powered by RAG. Upload your study materials and ask me anything — I'll answer directly from your notes! 📚" }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto resize
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(100, textareaRef.current.scrollHeight)}px`;
  };

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim() || streaming) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    setStreaming(true);
    setCurrentResponse('🔍 *Thinking...*');
    const responseRef = { current: '' }; // Use a local object to track the text
    
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    await api.streamChat(
      query,
      subject,
      history,
      (token) => {
        responseRef.current += token;
        setCurrentResponse(prev => {
          if (prev === '🔍 *Thinking...*') return token;
          return prev + token;
        });
      },
      (sources) => {
        const finalContent = responseRef.current || 'No response received based on the notes.';
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: finalContent, 
          sources: sources
        }]);
        setStreaming(false);
        setCurrentResponse('');
      },
      (err) => {
        console.error(err);
        setStreaming(false);
        setCurrentResponse('❌ Error connecting to backend.');
      }
    );
  };

  const suggestions = [
    "Explain the key concepts in my notes",
    "What are the most important topics?",
    "Give me a quick summary",
    "What should I focus on for exams?"
  ];

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
            backgroundColor: 'var(--accent-d)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Bot size={20} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>NLP Study Assistant</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {subject || "All subjects"} · RAG-powered answers
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          padding: '6px 12px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>RAG Active</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {messages.map((m, i) => (
          <div key={i} className="animate-fade-up" style={{ 
            marginBottom: '24px', display: 'flex', flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '85%', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: m.role === 'user' ? 'var(--success)' : 'linear-gradient(135deg, var(--accent), var(--accent-d))'
              }}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: m.role === 'user' ? 'var(--accent-d)' : 'var(--bg2)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div className="markdown-content">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
            
            {/* Source chips */}
            {m.sources && m.sources.length > 0 && (
              <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '8px', 
                marginTop: '12px', marginLeft: m.role === 'user' ? '0' : '44px' 
              }}>
                {m.sources.map((s, si) => (
                  <div key={si} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '12px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '11px', color: 'var(--accent)'
                  }}>
                    <FileText size={12} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.filename}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{s.relevance}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '85%' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-d))'
              }}><Bot size={16} /></div>
              <div style={{
                padding: '12px 16px', borderRadius: '16px', backgroundColor: 'var(--bg2)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px'
              }}>
                <div className="markdown-content">
                  <ReactMarkdown>{currentResponse}</ReactMarkdown>
                </div>
                <div style={{ 
                  width: '2px', height: '14px', backgroundColor: 'var(--accent)', 
                  display: 'inline-block', marginLeft: '4px', verticalAlign: 'middle',
                  animation: 'pulse 1s infinite'
                }} />
              </div>
            </div>
          </div>
        )}

        {messages.length <= 2 && !streaming && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                style={{
                  padding: '10px 16px', borderRadius: '20px', background: 'var(--bg2)',
                  border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '12px',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                <Sparkles size={14} color="var(--accent)" />
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg1)' }}>
        <div style={{ 
          position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '12px',
          background: 'var(--bg2)', padding: '8px', borderRadius: '12px', border: '1px solid var(--border)',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }} id="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your study materials..."
            style={{
              flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--text)',
              fontSize: '14px', padding: '10px', resize: 'none', outline: 'none',
              maxHeight: '100px', minHeight: '40px'
            }}
            onFocus={() => {
              const container = document.getElementById('input-container');
              container.style.borderColor = 'var(--accent)';
              container.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={() => {
              const container = document.getElementById('input-container');
              container.style.borderColor = 'var(--border)';
              container.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || streaming}
            style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: input.trim() && !streaming ? 'var(--accent)' : 'var(--bg3)',
              color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyCenter: 'center',
              transition: 'all 0.2s'
            }}
          >
            {streaming ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div style={{ 
          marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', 
          justifyContent: 'center', fontSize: '10px', color: 'var(--muted)' 
        }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          Retrieving from your documents via RAG · Powered by Gemini 1.5 Flash
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
