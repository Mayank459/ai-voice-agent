import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInterview from '../hooks/useInterview';
import {
  FileText, Briefcase, Play, Loader2, Trophy,
  Mic, MicOff, Send, BarChart3, PhoneOff, Brain,
  Sparkles, ArrowRight, ChevronRight
} from 'lucide-react';

const Interview = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem('email');
  const {
    status, transcript, report, isAiSpeaking,
    isRecording, startRecording, stopAndSend,
    startInterview, endInterview
  } = useInterview();

  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState('');
  const [step, setStep] = useState(0); // 0=resume, 1=jd

  const handleStart = () => startInterview(email, resume, jd);

  // ── Report screen ──────────────────────────────────────────────────────
  if (status === 'finished' && report) {
    const scoreNum = parseFloat(report.score);
    const color = scoreNum >= 7 ? '#34d399' : scoreNum >= 5 ? '#fbbf24' : '#f87171';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="mesh-bg" />
        <div className="relative z-10 w-full max-w-2xl glass-strong p-10 rounded-3xl space-y-8 animate-slide-up" style={{ border: '1px solid rgba(124,58,237,0.25)' }}>
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Trophy className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white">Interview Complete!</h2>
              <p className="text-slate-500 mt-2">Here's your AI-powered evaluation report.</p>
            </div>
          </div>

          {/* Score strip */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className="text-5xl font-black mb-1" style={{ color }}>{report.score}</div>
              <div className="text-slate-500 text-xs uppercase font-bold tracking-wider">Final Score</div>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className={`text-xl font-black mb-1 ${report.recommendation?.includes('YES') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {report.recommendation}
              </div>
              <div className="text-slate-500 text-xs uppercase font-bold tracking-wider">Decision</div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Strengths
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{report.strengths}</p>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <div className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
                ⚑ Areas for Improvement
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{report.improvements || report.areas_for_improvement}</p>
            </div>
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Back to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Analyzing screen ───────────────────────────────────────────────────
  if (status === 'analyzing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
        <div className="mesh-bg" />
        <div className="relative z-10 text-center space-y-6 animate-slide-up">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
            <div className="absolute inset-4 rounded-full bg-violet-600/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-violet-400" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">Analyzing your performance…</h2>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">Alex is reviewing your transcript and preparing your report.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup screen ───────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="mesh-bg" />
        <div className="relative z-10 w-full max-w-lg animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">ALEX AI</span>
          </div>

          <div className="glass-strong rounded-3xl p-8 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {[0, 1].map(i => (
                  <div key={i} className="h-1 rounded-full flex-1 transition-all duration-500" style={{ background: step >= i ? 'linear-gradient(90deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
              <h2 className="text-2xl font-black text-white mt-5">
                {step === 0 ? '📎 Upload your resume' : '💼 Add job context'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {step === 0 ? 'Alex will tailor questions to your background.' : 'Describe the role or paste a JD — or leave blank.'}
              </p>
            </div>

            {step === 0 ? (
              <div
                className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300"
                style={{ borderColor: resume ? '#7c3aed' : 'rgba(255,255,255,0.08)', background: resume ? 'rgba(124,58,237,0.07)' : 'transparent' }}
                onClick={() => document.getElementById('resume-file').click()}
              >
                <FileText className={`w-10 h-10 mx-auto mb-3 ${resume ? 'text-violet-400' : 'text-slate-700'}`} />
                <div className="text-white font-semibold text-sm">{resume ? resume.name : 'Click to upload PDF or Docx'}</div>
                <p className="text-slate-600 text-xs mt-1">Max 5 MB</p>
                <input id="resume-file" type="file" className="hidden" accept=".pdf,.docx" onChange={e => setResume(e.target.files[0])} />
              </div>
            ) : (
              <div className="relative">
                <Briefcase className="absolute left-4 top-4 w-4 h-4 text-slate-600" />
                <textarea
                  placeholder="e.g. 'Software Engineer at Google — 3+ years Python, system design...'"
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  className="w-full bg-black/20 border border-white/08 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-700 min-h-[140px] focus:border-violet-500 outline-none transition-all resize-none text-sm"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            )}

            <div className="flex gap-3">
              {step === 1 && (
                <button onClick={() => setStep(0)} className="btn-ghost px-6 py-3 flex-shrink-0 hover:text-white transition-colors">
                  Back
                </button>
              )}
              {step === 0 ? (
                <button onClick={() => setStep(1)} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  {resume ? 'Continue' : 'Skip, continue'} <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleStart} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  <Play className="w-4 h-4 fill-current" /> Start Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Live interview ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <div className="mesh-bg" />

      {/* Nav */}
      <nav className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">ALEX AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            LIVE SESSION
          </div>
          <button
            onClick={endInterview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-sm font-bold transition-all hover:text-white"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <PhoneOff className="w-4 h-4" /> End
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* LEFT: Alex + Mic Controls */}
        <div className="w-full md:w-72 flex flex-col gap-4">
          {/* Alex card */}
          <div className="glass-strong rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.1), transparent 70%)' }} />

            {/* Avatar with speaking ring */}
            <div className="relative mt-2">
              <div
                className="w-24 h-24 rounded-full relative z-10 flex items-center justify-center overflow-hidden transition-all duration-500"
                style={{
                  border: isAiSpeaking ? '3px solid #7c3aed' : '3px solid rgba(255,255,255,0.06)',
                  boxShadow: isAiSpeaking ? '0 0 0 8px rgba(124,58,237,0.15), 0 0 30px rgba(124,58,237,0.3)' : 'none',
                  transform: isAiSpeaking ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4"
                  className="w-full h-full"
                  alt="Alex"
                />
              </div>
              {isAiSpeaking && (
                <div className="absolute inset-0 rounded-full animate-pulse-ring" />
              )}
            </div>

            <div className="text-center z-10">
              <div className="text-white font-bold text-base">Alex Recruiter</div>
              <div className="text-xs font-semibold mt-1 tracking-widest uppercase" style={{ color: isAiSpeaking ? '#a78bfa' : 'rgba(100,116,139,0.6)' }}>
                {isAiSpeaking ? '● Speaking…' : status === 'connecting' ? 'Connecting…' : '○ Listening'}
              </div>
            </div>

            {/* Wave bars (decorative, animate when AI is speaking) */}
            <div className="flex items-end gap-1 h-8">
              {[40, 70, 55, 90, 60, 75, 45].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-300"
                  style={{
                    height: isAiSpeaking ? `${h}%` : '15%',
                    background: isAiSpeaking ? 'linear-gradient(to top, #7c3aed, #60a5fa)' : 'rgba(255,255,255,0.08)',
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mic controls */}
          <div className="glass-strong rounded-3xl p-6 flex flex-col items-center gap-5">
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest text-center">
              {isAiSpeaking ? "Alex is speaking…" : isRecording ? "Recording — press Send when done" : "Press mic to speak"}
            </p>

            {/* Big mic button */}
            <button
              onClick={isRecording ? null : startRecording}
              disabled={isAiSpeaking || isRecording}
              className={`mic-btn flex items-center justify-center transition-all duration-300 ${isRecording ? 'recording animate-recording' : isAiSpeaking ? 'opacity-30 cursor-not-allowed' : 'idle'}`}
            >
              {isRecording
                ? <Mic className="w-9 h-9 text-red-400" />
                : <MicOff className="w-9 h-9 text-slate-500" />}
            </button>

            {/* Send button */}
            {isRecording && (
              <button
                onClick={stopAndSend}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm animate-fade-in hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <Send className="w-4 h-4" /> Send Answer
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Transcript */}
        <div className="flex-1 glass-strong rounded-3xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-white/05">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-white font-bold text-sm">Live Transcript</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-40">
                <Brain className="w-10 h-10 text-violet-600" />
                <p className="text-slate-500 text-sm">Alex is preparing the first question…<br />Press 🎤 when you're ready to answer.</p>
              </div>
            ) : (
              transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Brain className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant' ? 'bubble-ai' : 'bubble-user'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
