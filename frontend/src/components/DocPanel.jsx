import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, FolderOpen, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

const DocPanel = ({ docs, subjects, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('General');
  const fileInputRef = useRef(null);

  const predefinedSubjects = [
    'General', 'NLP & AI', 'Data Structures', 'DBMS', 
    'Computer Networks', 'OS Concepts', 'Mathematics', 'Other'
  ];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await api.upload(file, selectedSubject);
      onRefresh();
    } catch (err) {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}" and all its chunks?`)) {
      await api.deleteDoc(id);
      onRefresh();
    }
  };

  const getExtBadge = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const colors = {
      pdf: 'var(--pdf)',
      docx: 'var(--docx)',
      txt: 'var(--txt)',
      md: 'var(--md)'
    };
    return (
      <span style={{
        fontSize: '10px',
        backgroundColor: colors[ext] || 'var(--bg3)',
        padding: '2px 4px',
        borderRadius: '4px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>{ext}</span>
    );
  };

  const totalChunks = docs.reduce((acc, d) => acc + d.chunk_count, 0);

  return (
    <div style={{
      width: '230px',
      backgroundColor: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Study Materials</h3>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
          {docs.length} files · {totalChunks} chunks
        </p>
        
        {/* Progress bar */}
        <div style={{ 
          height: '4px', background: 'var(--bg3)', borderRadius: '2px', 
          marginTop: '12px', overflow: 'hidden' 
        }}>
          <div style={{ 
            height: '100%', background: 'var(--accent)', 
            width: `${Math.min(100, (totalChunks / 1000) * 100)}%`,
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              appearance: 'none',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {predefinedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '13px', pointerEvents: 'none', color: 'var(--muted)' }} />
        </div>

        <div 
          onClick={() => fileInputRef.current.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: '10px',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: uploading ? 'var(--bg3)' : 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="animate-spin"><Upload size={24} color="var(--accent)" /></div>
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Indexing chunks...</span>
            </div>
          ) : (
            <>
              <Upload size={24} color="var(--muted)" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: '500' }}>Drop file or click</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>PDF, DOCX, TXT, MD</div>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            hidden 
            accept=".pdf,.docx,.txt,.md" 
          />
        </div>

        {error && <div style={{ color: 'var(--error)', fontSize: '11px', textAlign: 'center' }}>{error}</div>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px 8px' }}>
        {docs.length === 0 ? (
          <div style={{ 
            marginTop: '40px', textAlign: 'center', color: 'var(--muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <FolderOpen size={32} opacity={0.3} />
            <span style={{ fontSize: '13px' }}>No documents yet</span>
          </div>
        ) : (
          docs.map(doc => (
            <div 
              key={doc.file_id}
              className="doc-item"
              style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '4px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'background 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg3)';
                e.currentTarget.querySelector('.delete-btn').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.querySelector('.delete-btn').style.opacity = '0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getExtBadge(doc.filename)}
                <span style={{ 
                  fontSize: '13px', fontWeight: '500', 
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {doc.filename}
                </span>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(doc.file_id, doc.filename)}
                  style={{
                    border: 'none', background: 'transparent', color: 'var(--muted)',
                    cursor: 'pointer', padding: '4px', opacity: 0, transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{doc.subject}</span>
                <span>{doc.chunk_count} chunks</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocPanel;
