import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Brain, LogOut, Plus, Calendar, Star,
  CheckCircle2, TrendingUp, ChevronRight,
  BarChart3, Award, X, Trash2, Loader2,
  MessageSquare, FileText, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';

// ── Session Detail Slide-over ─────────────────────────────────────────────
const SessionDetail = ({ session, onClose, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullSession, setFullSession] = useState(null);
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => {
    const fetchFull = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/session/${session.session_id}`);
        setFullSession(data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchFull();
  }, [session.session_id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/session/${session.session_id}`);
      onDelete(session.session_id);
    } catch (_) { alert('Failed to delete session'); }
    finally { setDeleting(false); }
  };

  const report = fullSession?.report || session.report || {};
  const turns  = fullSession?.turns || [];
  const scoreNum = parseFloat(report.score);
  const scoreColor = scoreNum >= 7 ? '#34d399' : scoreNum >= 5 ? '#fbbf24' : '#f87171';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-[#0e0e1a] border-l border-white/08 flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/05">
          <div>
            <h2 className="text-white font-black text-lg">Interview Detail</h2>
            <p className="text-slate-600 text-xs mt-0.5">
              {new Date(session.started_at).toLocaleDateString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Delete button */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs font-semibold">Delete?</span>
                <button onClick={handleDelete} disabled={deleting} className="text-red-400 hover:text-red-300 font-bold text-xs ml-1">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:text-white font-bold text-xs">
                  No
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-xl btn-ghost">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {[
            { id: 'report', label: 'Report', icon: FileText },
            { id: 'transcript', label: 'Transcript', icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-600/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : activeTab === 'report' ? (
            <>
              {/* Score strip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 text-center stat-card">
                  <div className="text-4xl font-black mb-1" style={{ color: scoreColor }}>
                    {report.score || '—'}
                  </div>
                  <div className="text-slate-600 text-xs uppercase font-bold">Final Score</div>
                </div>
                <div className="rounded-2xl p-5 text-center stat-card">
                  <div className={`text-base font-black mb-1 ${report.recommendation?.includes('YES') ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {report.recommendation || '—'}
                  </div>
                  <div className="text-slate-600 text-xs uppercase font-bold">Decision</div>
                </div>
              </div>

              {/* Strengths */}
              <div className="p-5 rounded-2xl space-y-2" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">✦ Strengths</div>
                <p className="text-slate-300 text-sm leading-relaxed">{report.strengths || 'Not available'}</p>
              </div>

              {/* Improvements */}
              <div className="p-5 rounded-2xl space-y-2" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}>
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest">⚑ Areas for Improvement</div>
                <p className="text-slate-300 text-sm leading-relaxed">{report.improvements || report.areas_for_improvement || 'Not available'}</p>
              </div>

              {/* Feedback */}
              {report.detailed_feedback && (
                <div className="p-5 rounded-2xl space-y-2" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}>
                  <div className="text-violet-400 text-xs font-bold uppercase tracking-widest">💡 Detailed Feedback</div>
                  <p className="text-slate-300 text-sm leading-relaxed">{report.detailed_feedback}</p>
                </div>
              )}
            </>
          ) : (
            /* Transcript tab */
            <div className="space-y-4">
              {turns.length === 0 ? (
                <div className="text-center py-12 text-slate-600 italic text-sm">No transcript available</div>
              ) : (
                turns.map((turn, i) => (
                  <div key={i} className={`flex ${turn.speaker === 'recruiter' ? 'justify-start' : 'justify-end'}`}>
                    {turn.speaker === 'recruiter' && (
                      <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Brain className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      turn.speaker === 'recruiter' ? 'bubble-ai' : 'bubble-user'
                    }`}>
                      {turn.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────
const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();
  const email = localStorage.getItem('email');
  const name = email?.split('@')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [h, a] = await Promise.all([
          axios.get(`/api/history/${email}`),
          axios.get(`/api/analytics/${email}`),
        ]);
        setHistory(h.data.history || []);
        setAnalytics(a.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [email]);

  const handleDelete = (sessionId) => {
    setHistory(prev => prev.filter(s => s.session_id !== sessionId));
    setSelectedSession(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mesh-bg" />

      {/* Session Detail Panel */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Nav */}
      <nav className="relative z-10 px-8 py-5 flex justify-between items-center border-b border-white/05">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">ALEX AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass text-slate-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {email}
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/auth'); }}
            className="p-2.5 rounded-xl btn-ghost flex items-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-8 py-12 space-y-12">
        {/* Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-slide-up">
          <div>
            <p className="text-violet-400 font-semibold text-sm mb-2 uppercase tracking-widest">Your Dashboard</p>
            <h1 className="text-4xl font-black text-white mb-2">Hey, {name}! 👋</h1>
            <p className="text-slate-500">
              {analytics?.total_interviews
                ? `You've completed ${analytics.total_interviews} interview${analytics.total_interviews > 1 ? 's' : ''}. Keep it up!`
                : 'Ready for your first mock interview?'}
            </p>
          </div>
          <button
            onClick={() => navigate('/interview')}
            className="btn-primary px-8 py-4 flex items-center gap-3 text-base shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Start Interview
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="stat-card animate-slide-up">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Star className="w-4 h-4" /> Avg Score
            </div>
            <div className="text-5xl font-black text-white mb-1">
              {analytics?.average_score?.toFixed(1) ?? '—'}
            </div>
            <div className="text-slate-600 text-xs">out of 10.0</div>
          </div>

          <div className="stat-card animate-slide-up">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-4 h-4" /> Hire Rate
            </div>
            <div className="text-5xl font-black text-white mb-1">
              {analytics?.recommendation_rate ?? 0}<span className="text-2xl">%</span>
            </div>
            <div className="text-slate-600 text-xs">hiring recommendation</div>
          </div>

          <div className="stat-card animate-slide-up">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
              <TrendingUp className="w-4 h-4" /> Score Trend
            </div>
            <div className="h-16 flex items-end gap-1.5 mt-2">
              {analytics?.trend?.slice(-8).map((t, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((t.score / 10) * 100, 8)}%`,
                    background: 'linear-gradient(to top, #7c3aed, #60a5fa)',
                  }}
                  title={`Score: ${t.score}`}
                />
              ))}
              {(!analytics?.trend || analytics.trend.length === 0) && (
                <div className="w-full text-center text-slate-700 text-xs italic self-center">No data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <h2 className="text-2xl font-black text-white">Interview History</h2>
            </div>
            <span className="text-slate-600 text-sm">{history.length} session{history.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl">
              <Award className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">No interviews yet</p>
              <p className="text-slate-700 text-sm mt-1">Start your first session to see your results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const score = item.report?.score ?? 'N/A';
                const scoreNum = parseFloat(score);
                const color = scoreNum >= 7 ? 'text-emerald-400' : scoreNum >= 5 ? 'text-amber-400' : 'text-red-400';
                const rec = item.report?.recommendation || '';

                return (
                  <div
                    key={item.session_id}
                    className="history-item group"
                    onClick={() => setSelectedSession(item)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-600/10 flex items-center justify-center text-violet-400 flex-shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Mock Technical Interview</div>
                        <div className="text-slate-600 text-xs mt-0.5">
                          {new Date(item.started_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        {rec && (
                          <div className={`text-xs font-semibold mt-1 ${rec.includes('YES') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {rec}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className={`${color} font-black text-xl`}>{score}</div>
                        <div className="text-slate-700 text-xs">score</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
