import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Save, Copy, Check, Download, QrCode, Store, Gift, Coffee, Loader2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { cafe, setCafe, refreshCafe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [rewardName, setRewardName] = useState('Free Coffee');
  const [rewardThreshold, setRewardThreshold] = useState(10);
  const [rewardDescription, setRewardDescription] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState('');

  useEffect(() => {
    if (cafe) {
      setName(cafe.name);
      setLogo(cafe.logo || '');
      setRewardName(cafe.reward_name);
      setRewardThreshold(cafe.reward_threshold);
      setRewardDescription(cafe.reward_description || '');
      setWhatsappAccessToken(cafe.whatsapp_access_token || '');
      setWhatsappPhoneNumberId(cafe.whatsapp_phone_number_id || '');
      setWhatsappBusinessAccountId(cafe.whatsapp_business_account_id || '');
    }
  }, [cafe]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe) return;
    setLoading(true);
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from('cafes')
        .update({
          name,
          logo: logo || null,
          reward_name: rewardName,
          reward_threshold: Number(rewardThreshold),
          reward_description: rewardDescription || null,
          whatsapp_access_token: whatsappAccessToken || null,
          whatsapp_phone_number_id: whatsappPhoneNumberId || null,
          whatsapp_business_account_id: whatsappBusinessAccountId || null,
        })
        .eq('id', cafe.id)
        .select()
        .single();

      if (error) throw error;
      setCafe(data);
      await refreshCafe();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const registrationUrl = cafe ? `${window.location.origin}/register/${cafe.id}` : '';
  const qrCodeUrl = cafe
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0b0f19&bgcolor=ffffff&data=${encodeURIComponent(
        registrationUrl
      )}`
    : '';

  const copyToClipboard = () => {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_')}_onboarding_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      alert('Failed to download QR code');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* Settings Form (7 cols) */}
      <div className="lg:col-span-7 bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight m-0">Cafe & Loyalty Setup</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your cafe branding and define customer reward rules.</p>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-semibold">
            Settings updated successfully! Your changes are now live.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Cafe Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Cafe Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Store className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Coffee House"
                className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Logo Image URL (Optional)
            </label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
            />
          </div>

          {/* Reward Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Reward Item Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Gift className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  placeholder="e.g. Free Hot Latte"
                  className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Reward Threshold */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Visits for Reward
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Coffee className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={rewardThreshold}
                  onChange={(e) => setRewardThreshold(Number(e.target.value))}
                  placeholder="10"
                  className="w-full bg-[#1e293b]/60 text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Reward Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Reward Promo Description
            </label>
            <textarea
              rows={3}
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Receive a free hot beverage of your choice after collecting 10 check-ins."
              className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
            />
          </div>

          {/* WhatsApp API Configuration */}
          <div className="border-t border-[#1e293b] pt-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight m-0">WhatsApp Business API Settings</h3>
              <p className="text-[11px] text-slate-400 mt-1">Configure Meta Cloud API credentials to run marketing campaigns.</p>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Meta Access Token
              </label>
              <input
                type="password"
                value={whatsappAccessToken}
                onChange={(e) => setWhatsappAccessToken(e.target.value)}
                placeholder="EAAQD..."
                className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Number ID */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={whatsappPhoneNumberId}
                  onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                  placeholder="104927..."
                  className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-mono"
                />
              </div>

              {/* Business Account ID */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  WhatsApp Business Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={whatsappBusinessAccountId}
                  onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                  placeholder="109287..."
                  className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Printed Card Assets & QR Code (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-6 shadow-sm text-center">
          <div className="text-left">
            <h2 className="text-lg font-bold text-white tracking-tight m-0">Printed Loyalty Cards</h2>
            <p className="text-xs text-slate-400 mt-1">Print this QR code on the back of your cafe business cards. Clients scan this to sign up.</p>
          </div>

          {/* QR Display */}
          <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border border-[#1e293b] shadow-md">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Card Registration QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-12 h-12 text-slate-300" />
            )}
          </div>

          {/* Action Link Box */}
          <div className="space-y-4 pt-2">
            <div className="bg-[#1e293b]/50 border border-[#334155]/60 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-4">
              <span className="text-slate-400 font-mono truncate text-left select-all">{registrationUrl}</span>
              <button
                onClick={copyToClipboard}
                className="w-8 h-8 shrink-0 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#334155] flex items-center justify-center text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer"
                title="Copy Registration Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={downloadQrCode}
              className="w-full bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-sm"
            >
              <Download className="w-4 h-4 text-brand-400" />
              Download Card QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;
