import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';

// --- Progress Ring ---
export const ProgressRing = ({ value, max, size = 120, strokeWidth = 8, color = 'var(--accent)' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        stroke="var(--bg3)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

// --- Bar Chart (Planned vs Actual) ---
export const BarChart = ({ data, colors }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.planned)), 1);
  const height = 200;
  
  return (
    <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 10px' }}>
      {data.map((d, i) => {
        const actualH = (d.value / maxVal) * (height - 40);
        const plannedH = (d.planned / maxVal) * (height - 40);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '100%', height: `${height - 40}px`, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              {/* Planned (Outline) */}
              <div style={{ 
                position: 'absolute', bottom: 0, width: '24px', height: `${plannedH}px`, 
                border: `1px dashed ${colors[i % colors.length]}80`, borderRadius: '4px 4px 0 0'
              }} />
              {/* Actual (Filled) */}
              <div style={{ 
                width: '16px', height: `${actualH}px`, backgroundColor: colors[i % colors.length], 
                borderRadius: '4px 4px 0 0', zIndex: 1, transition: 'height 0.5s ease-out'
              }} />
              {/* Value Label */}
              <div style={{ position: 'absolute', bottom: `${Math.max(actualH, plannedH) + 4}px`, fontSize: '10px', color: 'var(--muted)' }}>
                {d.value}h
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Line Chart (Quiz Trends) ---
export const LineChart = ({ data }) => {
  if (data.length < 2) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'var(--muted)', fontSize: '12px' }}>Take more quizzes to see your trend</div>;

  const width = 400;
  const height = 200;
  const padding = 30;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = (height - padding) - (d.score / 100) * (height - padding * 2);
    return { x, y };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="var(--border)" />
      <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="var(--border)" />
      
      {/* Path */}
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--accent)" stroke="var(--bg2)" strokeWidth="2" />
      ))}
      
      {/* Labels */}
      {data.map((d, i) => (
        <text key={i} x={points[i].x} y={height - 10} textAnchor="middle" fill="var(--muted)" fontSize="10">{d.date.slice(5)}</text>
      ))}
    </svg>
  );
};

// --- Study Timer ---
export const StudyTimer = ({ subject, onStop }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - seconds * 1000;
      intervalRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => v < 10 ? '0' + v : v).join(':');
  };

  const handleStop = () => {
    setIsActive(false);
    onStop(seconds);
    setSeconds(0);
  };

  return (
    <div style={{ 
      background: 'var(--bg2)', padding: '20px', borderRadius: '16px', border: '1px solid var(--accent)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
        <Clock size={16} />
        <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Focus Session: {subject}</span>
      </div>
      
      <div style={{ fontSize: '40px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }}>
        {formatTime(seconds)}
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setIsActive(!isActive)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', background: isActive ? '#f59e0b' : 'var(--success)',
            border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center'
          }}
        >
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button 
          onClick={handleStop}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'var(--error)',
            border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center'
          }}
        >
          <Square size={20} />
        </button>
      </div>
    </div>
  );
};
