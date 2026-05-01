import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Brain, Zap } from 'lucide-react';

const features = [
  { icon: Brain, label: 'AI Interviewer', desc: 'Alex adapts to your resume and role' },
  { icon: Zap, label: 'Instant Feedback', desc: 'Score & report after every session' },
  { icon: Sparkles, label: 'Smart Analytics', desc: 'Track your progress over time' },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const { data } = await axios.post(endpoint, { email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('email', data.email);
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mesh */}
      <div className="mesh-bg" />

      {/* LEFT: Feature pitch */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">ALEX AI</span>
          </div>

          <h1 className="text-6xl font-black text-white leading-tight mb-6">
            Ace Your Next<br />
            <span className="gradient-text">Interview</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Practice with an AI recruiter who knows your resume, adapts in real-time, and gives you an honest score.
          </p>
        </div>

        <div className="space-y-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 glass p-4 rounded-2xl animate-slide-up">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{label}</div>
                <div className="text-slate-500 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative avatar */}
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-violet-600/5 border border-violet-600/10 animate-float flex items-center justify-center">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4"
            className="w-56 h-56 rounded-full"
            alt="Alex"
          />
        </div>
      </div>

      {/* RIGHT: Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">ALEX AI</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">
            {isLogin ? 'Welcome back 👋' : 'Create account'}
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
            >
              {isLogin ? 'Sign up free' : 'Login'}
            </button>
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-slate-700 text-xs text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
