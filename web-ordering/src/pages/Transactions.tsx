import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Transaction } from '../types';
import { Search, Receipt, Loader2 } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { cafe } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  useEffect(() => {
    if (cafe) {
      fetchTransactions();
    }
  }, [cafe, dateFilter]);

  const fetchTransactions = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*, customer:customers(name, phone)')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });

      if (dateFilter === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
      } else if (dateFilter === 'month') {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTxs = transactions.filter(
    (tx) =>
      tx.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer?.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight m-0">Transactions Log</h2>
        <p className="text-xs text-slate-400 mt-1">Audit trail of all visits logged and purchase amounts recorded.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl">
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

        {/* Date Filter Tabs */}
        <div className="flex bg-[#1e293b]/50 p-1 rounded-xl border border-[#334155]/60 self-stretch sm:self-auto">
          {[
            { label: 'All History', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: 'This Month', value: 'month' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setDateFilter(tab.value as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                dateFilter === tab.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="py-24 text-center">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No transactions found.</p>
            <p className="text-xs text-slate-500 mt-1">Visit log or selected date range is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#1e293b]/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Transaction ID</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Visit Number</th>
                  <th className="py-4 px-6">Bill Value</th>
                  <th className="py-4 px-6 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm font-medium">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1e293b]/10 transition-colors duration-150">
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono select-all">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-6 text-white">{tx.customer?.name}</td>
                    <td className="py-4 px-6 text-slate-400">{tx.customer?.phone}</td>
                    <td className="py-4 px-6">
                      <span className="bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Visit #{tx.visit_number}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      ₹{Number(tx.bill_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-right text-xs">
                      {new Date(tx.created_at).toLocaleString('en-IN', {
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
export default Transactions;
