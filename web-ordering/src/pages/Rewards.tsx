import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { RewardRedemption } from '../types';
import { Search, Gift, Loader2 } from 'lucide-react';

export const Rewards: React.FC = () => {
  const { cafe } = useAuth();
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (cafe) {
      fetchRedemptions();
    }
  }, [cafe]);

  const fetchRedemptions = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*, customer:customers(name, phone)')
        .eq('cafe_id', cafe.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      setRedemptions((data as any) || []);
    } catch (err) {
      console.error('Error fetching redemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReds = redemptions.filter(
    (red) =>
      red.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      red.customer?.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight m-0">Rewards Redemptions Log</h2>
        <p className="text-xs text-slate-400 mt-1">Audit log of all gifts, coffees, and rewards claimed by customers.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full bg-[#1e293b]/60 hover:bg-[#1e293b]/80 focus:bg-[#1e293b] text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm font-medium placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : filteredReds.length === 0 ? (
          <div className="py-24 text-center">
            <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No reward redemptions recorded.</p>
            <p className="text-xs text-slate-500 mt-1">Customers have not redeemed any rewards yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#1e293b]/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Redemption ID</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Reward Item</th>
                  <th className="py-4 px-6">Value</th>
                  <th className="py-4 px-6 text-right">Redeemed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm font-medium">
                {filteredReds.map((red) => (
                  <tr key={red.id} className="hover:bg-[#1e293b]/10 transition-colors duration-150">
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono select-all">
                      {red.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-6 text-white">{red.customer?.name}</td>
                    <td className="py-4 px-6 text-slate-400">{red.customer?.phone}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">{red.reward_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {Number(red.reward_value) === 0 ? 'FREE' : `₹${Number(red.reward_value).toFixed(2)}`}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-right text-xs">
                      {new Date(red.redeemed_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default Rewards;
