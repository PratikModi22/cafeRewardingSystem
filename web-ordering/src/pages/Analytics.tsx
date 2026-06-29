import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Customer, Transaction, RewardRedemption } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { cafe } = useAuth();
  const [loading, setLoading] = useState(true);

  // Raw data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);

  useEffect(() => {
    if (cafe) {
      fetchAnalyticsData();
    }
  }, [cafe]);

  const fetchAnalyticsData = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      // 1. Fetch all customers
      const { data: custs } = await supabase
        .from('customers')
        .select('*')
        .eq('cafe_id', cafe.id);
      setCustomers(custs || []);

      // 2. Fetch all transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: true });
      setTransactions(txs || []);

      // 3. Fetch all redemptions
      const { data: reds } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('cafe_id', cafe.id);
      setRedemptions(reds || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Computations for Charts ---

  // 1. Daily Visits & Revenue (Last 7 Days)
  const getDailyStats = () => {
    const stats: Record<string, { date: string; visits: number; revenue: number }> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const key = d.toISOString().split('T')[0];
      stats[key] = { date: label, visits: 0, revenue: 0 };
    }

    transactions.forEach((tx) => {
      const key = tx.created_at.split('T')[0];
      if (stats[key]) {
        stats[key].visits += 1;
        stats[key].revenue += Number(tx.bill_amount);
      }
    });

    return Object.values(stats);
  };

  // 2. Monthly Visits & Revenue
  const getMonthlyStats = () => {
    const stats: Record<string, { month: string; visits: number; revenue: number }> = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      
      if (!stats[key]) {
        stats[key] = { month: label, visits: 0, revenue: 0 };
      }
      stats[key].visits += 1;
      stats[key].revenue += Number(tx.bill_amount);
    });

    // Sort by key
    return Object.keys(stats)
      .sort()
      .map((k) => stats[k]);
  };

  // 3. Repeat Customer Rate
  const getRepeatRateData = () => {
    let oneTime = 0;
    let repeat = 0;

    customers.forEach((c) => {
      if (c.total_visits > 1) {
        repeat += 1;
      } else if (c.total_visits === 1) {
        oneTime += 1;
      }
    });

    return [
      { name: 'Repeat Customer', value: repeat, color: '#d49331' }, // brand-500
      { name: 'One-Time Visitor', value: oneTime, color: '#1e293b' }
    ];
  };



  // 5. New Registrations Trend (Last 7 Days)
  const getRegistrationsDailyStats = () => {
    const stats: Record<string, { date: string; registrations: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const key = d.toISOString().split('T')[0];
      stats[key] = { date: label, registrations: 0 };
    }

    customers.forEach((cust) => {
      const key = cust.created_at.split('T')[0];
      if (stats[key]) {
        stats[key].registrations += 1;
      }
    });

    return Object.values(stats);
  };

  // Stats summaries
  const totalRevenue = transactions.reduce((acc, curr) => acc + Number(curr.bill_amount), 0);
  const averageSpend = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  const activeRepeatCount = customers.filter((c) => c.total_visits > 1).length;
  const repeatRatePercent = customers.length > 0 ? (activeRepeatCount / customers.length) * 100 : 0;

  // Top Customers (limit 5)
  const topCustomers = [...customers]
    .sort((a, b) => Number(b.lifetime_spending) - Number(a.lifetime_spending))
    .slice(0, 5);

  const dailyData = getDailyStats();
  const monthlyData = getMonthlyStats();
  const repeatData = getRepeatRateData();
  const dailyRegData = getRegistrationsDailyStats();

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight m-0">Performance Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">Deep dive insights on visits, reward engagement, and revenue trends.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#0f172a] border border-[#1e293b] p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Spend</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">₹{averageSpend.toFixed(2)}</h3>
            <span className="text-[10px] text-slate-500 font-semibold">per ticket</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repeat Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{repeatRatePercent.toFixed(1)}%</h3>
            <span className="text-[10px] text-slate-500 font-semibold">{activeRepeatCount} loyal users</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Visits Logged</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{transactions.length}</h3>
            <span className="text-[10px] text-slate-500 font-semibold">check-ins</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Claim Conversion Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {transactions.length > 0 ? ((redemptions.length / transactions.length) * 100).toFixed(1) : '0'}%
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">{redemptions.length} claims</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Daily Revenue Trend */}
        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">Revenue Trend (Last 7 Days)</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Daily billing value recorded in store.</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d49331" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d49331" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d49331" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Visits Count */}
        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">Daily Visits (Last 7 Days)</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Volume of customer chits scanned/entered.</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any) => [value, 'Visits']}
                />
                <Bar dataKey="visits" fill="#d49331" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Revenue & Growth */}
        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">Monthly Revenue Summary</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Month-on-month revenue progression.</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#b57422" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: New Registrations Trend */}
        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">New Onboardings (Last 7 Days)</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Count of new customers registered via QR code or staff.</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRegData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8f541a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8f541a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any) => [value, 'Signups']}
                />
                <Area type="monotone" dataKey="registrations" stroke="#8f541a" strokeWidth={2} fillOpacity={1} fill="url(#colorReg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Customers & Repeat Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Customers Leaderboard (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">Top Customers (by Spend)</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Your highest spending brand advocates.</span>
          </div>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-[#1e293b] pb-2 text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Mobile</th>
                  <th className="py-2.5">Total Visits</th>
                  <th className="py-2.5 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm text-slate-300">
                {topCustomers.map((cust, idx) => (
                  <tr key={cust.id} className="hover:bg-[#1e293b]/10">
                    <td className="py-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[10px] text-brand-400 font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{cust.name}</span>
                    </td>
                    <td className="py-3 text-slate-400">{cust.phone}</td>
                    <td className="py-3">{cust.total_visits} visits</td>
                    <td className="py-3 text-right font-bold text-white">₹{Number(cust.lifetime_spending).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repeat vs One-time visitors (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight m-0">Customer Retention Mix</h4>
            <span className="text-[10px] text-slate-400 mt-1 block">Ratio of repeat visitors vs single visit guests.</span>
          </div>

          <div className="h-44 my-4 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={repeatData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                  {repeatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
