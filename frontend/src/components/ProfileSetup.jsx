import React, { useState } from 'react';
import { User, Calendar, Clock, BookOpen, Brain, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../utils/api';

const ProfileSetup = ({ subjects, onComplete }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    exam_date: '',
    hours_per_day: 4,
    subject_levels: {}, // { subjectName: 'Strong' | 'Neutral' | 'Weak' }
    study_style: 'Reading & Notes'
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Prepare profile
      const weak = Object.keys(form.subject_levels).filter(s => form.subject_levels[s] === 'Weak');
      const strong = Object.keys(form.subject_levels).filter(s => form.subject_levels[s] === 'Strong');
      
      const profile = {
        ...form,
        weak_subjects: weak.join(', '),
        strong_subjects: strong.join(', ')
      };

      // 2. Generate Schedule
      const res = await api.generateSchedule(profile, subjects, []);
      
      if (!res || res.error || !res.schedule) {
        const errorMsg = res?.error || res?.detail || "Failed to generate schedule. Please check the backend connection.";
        throw new Error(errorMsg);
      }

      // 3. Save
      localStorage.setItem('studyai_profile', JSON.stringify(profile));
      localStorage.setItem('studyai_schedule', JSON.stringify(res.schedule));
      localStorage.setItem('studyai_schedule_reasoning', res.reasoning || '');
      
      onComplete(profile, res.schedule);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while generating your schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10, 10, 12, 0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="animate-fade-up" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px',
        width: '100%', maxWidth: '600px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Progress Header */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ 
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: step >= i ? 'var(--accent)' : 'var(--bg3)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Let's set up your profile</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>We'll customize your study plan based on your needs.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>Your Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Enter your name"
                    style={{ 
                      width: '100%', padding: '12px 12px 12px 40px', backgroundColor: 'var(--bg3)', 
                      border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>Exam Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                  <input 
                    type="date" 
                    value={form.exam_date} 
                    onChange={e => setForm({...form, exam_date: e.target.value})}
                    style={{ 
                      width: '100%', padding: '12px 12px 12px 40px', backgroundColor: 'var(--bg3)', 
                      border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', colorScheme: 'dark'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--muted)' }}>Available hours per day</label>
                  <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 'bold' }}>{form.hours_per_day} hours</span>
                </div>
                <input 
                  type="range" min="1" max="12" 
                  value={form.hours_per_day} 
                  onChange={e => setForm({...form, hours_per_day: Number(e.target.value)})}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Your Subjects</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>How confident do you feel in each subject?</p>
            
            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg3)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Upload documents first to see your subjects</p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                {subjects.map(sub => (
                  <div key={sub} style={{ 
                    padding: '16px', borderBottom: '1px solid var(--border)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{sub}</span>
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg3)', padding: '4px', borderRadius: '8px' }}>
                      {['Weak', 'Neutral', 'Strong'].map(level => (
                        <button
                          key={level}
                          onClick={() => setForm({
                            ...form, 
                            subject_levels: { ...form.subject_levels, [sub]: level }
                          })}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', border: 'none', cursor: 'pointer',
                            backgroundColor: form.subject_levels[sub] === level ? 'var(--accent)' : 'transparent',
                            color: form.subject_levels[sub] === level ? 'white' : 'var(--muted)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Study Style</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Pick the method that works best for you.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'Reading & Notes', icon: <BookOpen />, desc: "I prefer reading and making notes" },
                { id: 'Practice & Quizzes', icon: <Brain />, desc: "I learn best by testing myself" },
                { id: 'Visual & Diagrams', icon: <Sparkles />, desc: "I prefer diagrams and visual summaries" }
              ].map(style => (
                <button
                  key={style.id}
                  onClick={() => setForm({...form, study_style: style.id})}
                  style={{
                    padding: '20px', borderRadius: '16px', background: form.study_style === style.id ? 'var(--accent-d)' : 'var(--bg3)',
                    border: `1px solid ${form.study_style === style.id ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                  }}>{style.icon}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text)' }}>{style.id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-up">
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Confirmation</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Ready to generate your personalized plan?</p>
            
            <div style={{ background: 'var(--bg3)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>NAME</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{form.name || 'Student'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>EXAM DATE</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{form.exam_date || 'Not set'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>DAILY HOURS</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{form.hours_per_day} hours</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>STYLE</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{form.study_style}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
          {step > 1 ? (
            <button 
              onClick={handleBack}
              style={{
                padding: '12px 24px', borderRadius: '12px', background: 'transparent',
                color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <ChevronLeft size={18} /> Back
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && !form.name}
              style={{
                padding: '12px 32px', borderRadius: '12px', background: 'var(--accent)',
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '8px', opacity: (step === 1 && !form.name) ? 0.5 : 1
              }}
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 32px', borderRadius: '12px', background: 'var(--success)',
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {loading ? <Clock className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? 'Generating Schedule...' : 'Generate My Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
