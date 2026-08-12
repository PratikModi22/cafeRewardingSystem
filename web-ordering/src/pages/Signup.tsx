import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Coffee, Mail, Lock, ArrowRight, AlertCircle, RefreshCw, Store } from 'lucide-react';

export const Signup: React.FC = () => {
  const [cafeName, setCafeName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user via Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;
      
      const user = data.user;
      if (!user) throw new Error('Signup succeeded, but no user was returned. Please verify your email.');

      // 2. Create the cafe record
      const { error: cafeError } = await supabase
        .from('cafes')
        .insert({
          name: cafeName,
          owner: user.id,
          email: email,
          reward_name: 'Free Coffee',
          reward_threshold: 10,
          reward_description: 'Get a free drink after 10 visits'
        });

      if (cafeError) throw cafeError;

      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-[#1e293b] rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px]">
        {/* Left Side: Doodle Brand Banner */}
        <div className="md:w-1/2 bg-[#273d2f] p-8 lg:p-12 flex flex-col justify-between text-left relative overflow-hidden border-r border-[#1e3325] min-h-[300px] md:min-h-auto">
          {/* Doodle Background Image */}
          <div className="absolute inset-0 opacity-35 pointer-events-none">
            <img src="/cafe_doodle.jpg" alt="Cafe Doodles" className="w-full h-full object-cover" />
          </div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-white">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white tracking-widest text-xs uppercase">Cafe Rewards</span>
          </div>

          <div className="relative z-10 space-y-4 my-8 md:my-0">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Aesthetic Loyalty & Outreach for Modern Cafes
            </h1>
            <p className="text-xs lg:text-sm text-[#a3c3aa] leading-relaxed max-w-md">
              Encourage customer check-ins, automate rewards milestones, and send targeted WhatsApp campaigns using custom templates.
            </p>
          </div>

          <div className="relative z-10 text-[10px] text-[#a3c3aa]/60 font-semibold tracking-wide">
            &copy; 2026 Merchant Portal. All rights reserved.
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#ffffff] relative">
          <div className="w-full max-w-sm mx-auto">
            {/* Form Header */}
            <div className="text-left mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="text-slate-400 text-xs mt-1">Set up your merchant details and launch your rewards program</p>
            </div>

            {error && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <p className="m-0">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Cafe store name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Store className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    placeholder="Blue Tokai Cafe"
                    className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourcafe.com"
                    className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
              >
                {loading ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    Register Cafe
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400 font-medium">
              Already have a merchant account?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-600 font-bold transition-colors duration-200">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Signup;
