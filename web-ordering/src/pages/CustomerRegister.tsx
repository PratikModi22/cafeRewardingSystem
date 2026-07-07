import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Cafe, Customer } from '../types';
import { Coffee, User, Phone, Mail, Award, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const CustomerRegister: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loadingCafe, setLoadingCafe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status screens
  const [status, setStatus] = useState<'form' | 'welcome_back' | 'registered'>('form');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (cafeId) {
      fetchCafeBranding();
    }
  }, [cafeId]);

  const fetchCafeBranding = async () => {
    setLoadingCafe(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', cafeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCafe(data);
      } else {
        setErrorMsg('Cafe not found. Please verify the QR Code or registration link.');
      }
    } catch (err) {
      console.error('Error fetching cafe branding:', err);
      setErrorMsg('Unable to load cafe branding details.');
    } finally {
      setLoadingCafe(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // digits only
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || phone.length !== 10) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Check if phone number already exists for this cafe
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('*')
        .eq('cafe_id', cafeId)
        .eq('phone', phone)
        .maybeSingle();

      if (findError) throw findError;

      if (existingCustomer) {
        // Welcome Back screen - do not create another account
        setMatchedCustomer(existingCustomer);
        setStatus('welcome_back');
      } else {
        // 2. Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            cafe_id: cafeId,
            name,
            phone,
            email: email || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setMatchedCustomer(newCustomer);
        setStatus('registered');
      }
    } catch (err: any) {
      console.error('Error submitting registration:', err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCafe) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    );
  }

  if (errorMsg && status === 'form') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-[#0f172a] border border-[#1e293b] p-8 rounded-3xl space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Oops!</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      {/* Background Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[10%] w-[25rem] h-[25rem] rounded-full bg-brand-500/5 blur-[8rem]" />
        <div className="absolute bottom-[30%] right-[10%] w-[25rem] h-[25rem] rounded-full bg-slate-900/50 blur-[8rem]" />
      </div>

      <div className="relative w-full max-w-md bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Cafe branding header */}
        <div className="flex flex-col items-center text-center">
          {cafe?.logo ? (
            <img src={cafe.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover mb-4 border border-[#1e293b] shadow-md" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mb-4 shadow-md">
              <Coffee className="w-8 h-8" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white tracking-tight m-0">{cafe?.name}</h2>
          <p className="text-xs text-slate-400 mt-1.5 uppercase font-bold tracking-wider">Loyalty & Rewards Program</p>
        </div>

        {/* --- Screen 1: Registration Form --- */}
        {status === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-[#1e293b]/30 border border-[#334155]/40 p-4 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
              <Award className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Join & Earn Rewards!</p>
                <p className="mt-1 leading-normal text-slate-400">
                  {cafe?.reward_description || `Earn check-ins with your orders. Collect ${cafe?.reward_threshold || 10} visits to unlock a "${cafe?.reward_name || 'Reward'}"!`}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Aarav Sharma"
                  className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@domain.com"
                  className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Register & Claim Rewards'
              )}
            </button>
          </form>
        )}

        {/* --- Screen 2: Welcome Back (Existing customer) --- */}
        {status === 'welcome_back' && matchedCustomer && (
          <div className="text-center py-4 space-y-6 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Welcome Back!</h3>
              <p className="text-slate-300 text-sm">Hi <span className="text-white font-bold">{matchedCustomer.name}</span>, you are already registered.</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                When ordering at the counter, tell the cashier your number <span className="text-white font-semibold">{matchedCustomer.phone}</span> to earn check-ins!
              </p>
            </div>

            {/* Current progress */}
            <div className="bg-[#1e293b]/30 border border-[#334155]/40 rounded-2xl p-4 max-w-xs mx-auto space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Progress:</span>
                <span>{matchedCustomer.current_progress} / {cafe?.reward_threshold} Visits</span>
              </div>
              <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full"
                  style={{ width: `${(matchedCustomer.current_progress / (cafe?.reward_threshold || 10)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- Screen 3: Registration Success (New customer) --- */}
        {status === 'registered' && matchedCustomer && (
          <div className="text-center py-4 space-y-6 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/5">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Registration Successful!</h3>
              <p className="text-slate-300 text-sm">Welcome aboard, <span className="text-white font-bold">{matchedCustomer.name}</span>!</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                Your loyalty card is active for <span className="text-white font-semibold">{cafe?.name}</span>. Give the cashier your mobile number <span className="text-white font-semibold">{matchedCustomer.phone}</span> with your next purchase.
              </p>
            </div>

            <div className="bg-[#1e293b]/30 border border-[#334155]/40 rounded-2xl p-4 max-w-xs mx-auto text-xs text-slate-400 text-left space-y-1.5">
              <p>📍 Cafe Name: <span className="text-white font-bold">{cafe?.name}</span></p>
              <p>🎁 Milestone Reward: <span className="text-brand-400 font-bold">{cafe?.reward_name}</span></p>
              <p>⭐ Condition: Collect <span className="text-white font-semibold">{cafe?.reward_threshold} visits</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CustomerRegister;
