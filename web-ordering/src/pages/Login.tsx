import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Coffee, Mail, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[30rem] h-[30rem] rounded-full bg-brand-500/10 blur-[8rem]" />
        <div className="absolute bottom-[20%] right-[20%] w-[30rem] h-[30rem] rounded-full bg-[#1e293b]/20 blur-[8rem]" />
      </div>

      <div className="relative w-full max-w-md bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] p-8 rounded-3xl shadow-2xl">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/25 border border-brand-500/50 flex items-center justify-center text-brand-400 mb-4 shadow-lg shadow-brand-500/20">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1 text-center">Sign in to manage your cafe loyalty rewards</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourcafe.com"
                className="w-full bg-[#1e293b]/50 hover:bg-[#1e293b]/80 focus:bg-[#1e293b] text-white pl-12 pr-4 py-3 rounded-2xl border border-[#334155] focus:border-brand-500/70 focus:outline-none transition-all duration-200 text-sm font-medium placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1e293b]/50 hover:bg-[#1e293b]/80 focus:bg-[#1e293b] text-white pl-12 pr-4 py-3 rounded-2xl border border-[#334155] focus:border-brand-500/70 focus:outline-none transition-all duration-200 text-sm font-medium placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 group cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have a merchant account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors duration-200">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
