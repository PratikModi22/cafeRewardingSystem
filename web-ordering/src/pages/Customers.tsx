import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Customer, Transaction, RewardRedemption } from '../types';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  Gift,
  Receipt,
  Loader2,
  X
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { cafe } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort state
  const [sortField, setSortField] = useState<keyof Customer>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected customer for detail modal
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [custTransactions, setCustTransactions] = useState<Transaction[]>([]);
  const [custRedemptions, setCustRedemptions] = useState<RewardRedemption[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (cafe) {
      fetchCustomers();
    }
  }, [cafe]);

  const fetchCustomers = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('cafe_id', cafe.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const loadCustomerDetails = async (cust: Customer) => {
    setSelectedCust(cust);
    setLoadingDetails(true);
    try {
      // Fetch transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: false });
      setCustTransactions(txs || []);

      // Fetch redemptions
      const { data: reds } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('customer_id', cust.id)
        .order('redeemed_at', { ascending: false });
      setCustRedemptions(reds || []);
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter and sort customer list
  const filteredCustomers = customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA === null) return sortAsc ? 1 : -1;
      if (valB === null) return sortAsc ? -1 : 1;

      // Handle string type numbers or floats
      if (sortField === 'lifetime_spending') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const rewardThreshold = cafe?.reward_threshold || 10;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight m-0">Customers Directory</h2>
          <p className="text-xs text-slate-400 mt-1">View, search, and audit your registered customer profiles.</p>
        </div>
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
            placeholder="Search by name, phone, or email..."
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
        ) : filteredCustomers.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-slate-400 font-medium">No customers found.</p>
            <p className="text-xs text-slate-500 mt-1">Search query or directory is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#1e293b]/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Customer Name
                      {sortField === 'name' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('phone')}>
                    <div className="flex items-center gap-1">
                      Phone Number
                      {sortField === 'phone' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('current_progress')}>
                    <div className="flex items-center gap-1">
                      Milestone Progress
                      {sortField === 'current_progress' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('total_visits')}>
                    <div className="flex items-center gap-1">
                      Visits
                      {sortField === 'total_visits' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('lifetime_spending')}>
                    <div className="flex items-center gap-1">
                      Spend
                      {sortField === 'lifetime_spending' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none text-right" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center justify-end gap-1">
                      Registered
                      {sortField === 'created_at' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm font-medium">
                {filteredCustomers.map((cust) => {
                  const isEligible = cust.current_progress >= rewardThreshold;
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => loadCustomerDetails(cust)}
                      className="hover:bg-[#1e293b]/20 cursor-pointer transition-colors duration-150"
                    >
                      <td className="py-4 px-6 text-white">{cust.name}</td>
                      <td className="py-4 px-6 text-slate-400">{cust.phone}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-[#1e293b] h-2 rounded-full overflow-hidden border border-[#334155]/50">
                            <div
                              className={`h-full transition-all duration-300 ${isEligible ? 'bg-emerald-500' : 'bg-brand-500'}`}
                              style={{ width: `${Math.min((cust.current_progress / rewardThreshold) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs ${isEligible ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                            {cust.current_progress}/{rewardThreshold}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{cust.total_visits}</td>
                      <td className="py-4 px-6 text-slate-300">₹{Number(cust.lifetime_spending).toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-slate-400 text-right text-xs">
                        {new Date(cust.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Audit Drawer/Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setSelectedCust(null)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg bg-[#0f172a] h-full shadow-2xl border-l border-[#1e293b] flex flex-col animate-slideLeft text-left">
            {/* Header */}
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white m-0">{selectedCust.name}</h3>
                <span className="text-xs text-slate-400 mt-1 block">Customer Loyalty Profile</span>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="w-9 h-9 rounded-xl hover:bg-[#1e293b] border border-transparent hover:border-[#334155] flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Contacts */}
              <div className="bg-[#1e293b]/20 border border-[#1e293b] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{selectedCust.phone}</span>
                </div>
                {selectedCust.email && (
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{selectedCust.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Joined on {new Date(selectedCust.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-300">Milestone Progress</span>
                  <span className="font-bold text-white">
                    {selectedCust.current_progress} / {rewardThreshold} Visits
                  </span>
                </div>

                <div className="w-full bg-[#1e293b] h-3 rounded-full overflow-hidden border border-[#334155]/50">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedCust.current_progress >= rewardThreshold ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min((selectedCust.current_progress / rewardThreshold) * 100, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="bg-[#1e293b]/40 rounded-xl p-3">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Visits</span>
                    <span className="text-base font-bold text-white mt-1 block">{selectedCust.total_visits}</span>
                  </div>
                  <div className="bg-[#1e293b]/40 rounded-xl p-3">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Claims</span>
                    <span className="text-base font-bold text-white mt-1 block">{selectedCust.reward_count}</span>
                  </div>
                  <div className="bg-[#1e293b]/40 rounded-xl p-3">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Spend</span>
                    <span className="text-base font-bold text-white mt-1 block">₹{Number(selectedCust.lifetime_spending).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="space-y-4">
                <div className="border-b border-[#1e293b] flex gap-6 text-sm font-semibold">
                  <span className="border-b-2 border-brand-500 pb-2 text-white flex items-center gap-1.5 cursor-default">
                    <Receipt className="w-4 h-4" />
                    Visit Log ({custTransactions.length})
                  </span>
                </div>

                {loadingDetails ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Visits List */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {custTransactions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No visits logged yet.</p>
                      ) : (
                        custTransactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1e293b]/20 border border-[#1e293b]/80 text-xs">
                            <div>
                              <p className="font-semibold text-slate-200 m-0">Visit #{tx.visit_number}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(tx.created_at).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <span className="font-semibold text-white">₹{Number(tx.bill_amount).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Redemptions List */}
                    <div className="pt-2">
                      <div className="border-b border-[#1e293b] pb-2 text-sm font-semibold text-slate-300 flex items-center gap-1.5 mb-3">
                        <Gift className="w-4 h-4 text-emerald-400" />
                        Rewards Redeemed ({custRedemptions.length})
                      </div>
                      <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                        {custRedemptions.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">No reward redemptions logged.</p>
                        ) : (
                          custRedemptions.map((red) => (
                            <div key={red.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs">
                              <div>
                                <p className="font-semibold text-emerald-400 m-0">{red.reward_name}</p>
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  {new Date(red.redeemed_at).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                Redeemed
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
