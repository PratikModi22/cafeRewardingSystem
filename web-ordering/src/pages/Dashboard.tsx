import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Customer, Transaction, RewardRedemption, MenuCategory, MenuItem } from '../types';
import {
  Users,
  Coffee,
  Gift,
  TrendingUp,
  IndianRupee,
  Search,
  Plus,
  CheckCircle,
  History,
  UserPlus,
  Loader2,
  ShoppingCart,
  Minus
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { cafe } = useAuth();

  // Metrics
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todaysVisits, setTodaysVisits] = useState(0);
  const [rewardsRedeemed, setRewardsRedeemed] = useState(0);
  const [repeatCustomers, setRepeatCustomers] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [lifetimeRevenue, setLifetimeRevenue] = useState(0);

  // Search & Profile state
  const [searchPhone, setSearchPhone] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNotFound, setCustomerNotFound] = useState(false);

  // Quick Register inline form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Popups
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [submittingVisit, setSubmittingVisit] = useState(false);

  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  // Recent feeds
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RewardRedemption[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Menu Checkout states
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [activeCheckoutCatId, setActiveCheckoutCatId] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cafe) {
      fetchMetrics();
      fetchFeeds();
      fetchMenuData();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [cafe]);

  const fetchMenuData = async () => {
    if (!cafe) return;
    try {
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('name');
      setMenuCategories(cats || []);
      if (cats && cats.length > 0) {
        setActiveCheckoutCatId(cats[0].id);
      }

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('name');
      setMenuItems(items || []);
    } catch (err) {
      console.error('Error loading menu:', err);
    }
  };

  useEffect(() => {
    const sum = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (sum > 0) {
      setBillAmount(sum.toString());
    } else {
      setBillAmount('');
    }
  }, [checkoutItems]);

  const handleAddItemToCheckout = (item: MenuItem) => {
    setCheckoutItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const handleRemoveItemFromCheckout = (itemId: string) => {
    setCheckoutItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  // Handle phone changes to trigger auto search on 10 digits
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // digit only
    if (val.length <= 10) {
      setSearchPhone(val);
    }

    if (val.length === 10) {
      await searchCustomer(val);
    } else {
      setSelectedCustomer(null);
      setCustomerNotFound(false);
    }
  };

  const searchCustomer = async (phone: string) => {
    if (!cafe) return;
    setLoadingSearch(true);
    setCustomerNotFound(false);
    setSelectedCustomer(null);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('cafe_id', cafe.id)
        .eq('phone', phone)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSelectedCustomer(data);
      } else {
        setCustomerNotFound(true);
        setRegisterName('');
        setRegisterEmail('');
      }
    } catch (err) {
      console.error('Error searching customer:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const fetchMetrics = async () => {
    if (!cafe) return;

    try {
      // 1. Total Customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('cafe_id', cafe.id);
      setTotalCustomers(customersCount || 0);

      // 2. Today's Visits
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: visitsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('cafe_id', cafe.id)
        .gte('created_at', todayStart.toISOString());
      setTodaysVisits(visitsCount || 0);

      // 3. Rewards Redeemed
      const { count: rewardsCount } = await supabase
        .from('reward_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('cafe_id', cafe.id);
      setRewardsRedeemed(rewardsCount || 0);

      // 4. Repeat Customers (> 1 visits)
      const { count: repeatCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('cafe_id', cafe.id)
        .gt('total_visits', 1);
      setRepeatCustomers(repeatCount || 0);

      // 5. Monthly Revenue
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: monthTx } = await supabase
        .from('transactions')
        .select('bill_amount')
        .eq('cafe_id', cafe.id)
        .gte('created_at', monthStart.toISOString());
      const monthSum = (monthTx || []).reduce((acc, curr) => acc + Number(curr.bill_amount), 0);
      setMonthlyRevenue(monthSum);

      // 6. Lifetime Revenue
      const { data: lifeTx } = await supabase
        .from('transactions')
        .select('bill_amount')
        .eq('cafe_id', cafe.id);
      const lifeSum = (lifeTx || []).reduce((acc, curr) => acc + Number(curr.bill_amount), 0);
      setLifetimeRevenue(lifeSum);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    }
  };

  const fetchFeeds = async () => {
    if (!cafe) return;
    setLoadingFeeds(true);

    try {
      // Recent transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*, customer:customers(name, phone)')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (txError) throw txError;
      setRecentTransactions((txs as any) || []);

      // Recent redemptions
      const { data: redemptions, error: redError } = await supabase
        .from('reward_redemptions')
        .select('*, customer:customers(name, phone)')
        .eq('cafe_id', cafe.id)
        .order('redeemed_at', { ascending: false })
        .limit(5);

      if (redError) throw redError;
      setRecentRedemptions((redemptions as any) || []);
    } catch (err) {
      console.error('Error fetching activity feeds:', err);
    } finally {
      setLoadingFeeds(false);
    }
  };

  // Inline Quick Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe || !searchPhone) return;
    setRegisterLoading(true);

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          cafe_id: cafe.id,
          name: registerName,
          phone: searchPhone,
          email: registerEmail || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSelectedCustomer(data);
        setCustomerNotFound(false);
        fetchMetrics();
      }
    } catch (err: any) {
      console.error('Error registering customer:', err);
      alert(err.message || 'Failed to register customer');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Add Visit
  const handleAddVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe || !selectedCustomer) return;
    setSubmittingVisit(true);

    const amount = parseFloat(billAmount) || 0;
    const newTotalVisits = selectedCustomer.total_visits + 1;
    const newProgress = selectedCustomer.current_progress + 1;
    const newSpending = Number(selectedCustomer.lifetime_spending) + amount;

    try {
      // 1. Insert Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          customer_id: selectedCustomer.id,
          cafe_id: cafe.id,
          bill_amount: amount,
          visit_number: newTotalVisits,
          items: checkoutItems
        });

      if (txError) throw txError;

      // 2. Update Customer progress
      const { data: updatedCust, error: custError } = await supabase
        .from('customers')
        .update({
          total_visits: newTotalVisits,
          current_progress: newProgress,
          lifetime_spending: newSpending
        })
        .eq('id', selectedCustomer.id)
        .select()
        .single();

      if (custError) throw custError;

      setSelectedCustomer(updatedCust);
      setShowAddVisit(false);
      setCheckoutItems([]);
      setBillAmount('');
      fetchMetrics();
      fetchFeeds();
    } catch (err: any) {
      console.error('Error recording visit:', err);
      alert(err.message || 'Failed to record visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  // Redeem Reward
  const handleRedeemSubmit = async () => {
    if (!cafe || !selectedCustomer) return;
    setSubmittingRedeem(true);

    const newRewardCount = selectedCustomer.reward_count + 1;

    try {
      // 1. Insert reward_redemption
      const { error: redError } = await supabase
        .from('reward_redemptions')
        .insert({
          customer_id: selectedCustomer.id,
          cafe_id: cafe.id,
          reward_name: cafe.reward_name,
          reward_value: 0.00
        });

      if (redError) throw redError;

      // 2. Update customer (reset progress)
      const { data: updatedCust, error: custError } = await supabase
        .from('customers')
        .update({
          current_progress: 0,
          reward_count: newRewardCount
        })
        .eq('id', selectedCustomer.id)
        .select()
        .single();

      if (custError) throw custError;

      setSelectedCustomer(updatedCust);
      setShowRedeemConfirm(false);
      fetchMetrics();
      fetchFeeds();
    } catch (err: any) {
      console.error('Error redeeming reward:', err);
      alert(err.message || 'Failed to redeem reward');
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const rewardThreshold = cafe?.reward_threshold || 10;
  const isRewardAvailable = selectedCustomer && selectedCustomer.current_progress >= rewardThreshold;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        {[
          { label: 'Total Customers', val: totalCustomers, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: "Today's Visits", val: todaysVisits, icon: Coffee, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Rewards Redeemed', val: rewardsRedeemed, icon: Gift, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Repeat Customers', val: repeatCustomers, icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          { label: 'Monthly Revenue', val: `₹${monthlyRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
          { label: 'Lifetime Revenue', val: `₹${lifetimeRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-[#0f172a] border border-[#1e293b] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{c.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c.color.split(' ')[1]} ${c.color.split(' ')[2]}`}>
                  <Icon className={`w-4 h-4 ${c.color.split(' ')[0]}`} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{c.val}</h3>
            </div>
          );
        })}
      </div>

      {/* Main Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Operations / Search (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight m-0">Quick Find Customer</h2>
              <p className="text-xs text-slate-400 mt-1">Ask the customer for their mobile number to log their visit or claim rewards.</p>
            </div>

            {/* Search Box */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400">
                {loadingSearch ? (
                  <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchPhone}
                onChange={handlePhoneChange}
                placeholder="Type 10-digit mobile number..."
                className="w-full bg-[#1e293b]/60 hover:bg-[#1e293b]/80 focus:bg-[#1e293b] text-white pl-14 pr-6 py-4 rounded-2xl border border-[#334155] focus:border-brand-500/70 focus:outline-none transition-all duration-200 text-lg font-semibold placeholder:text-slate-500 tracking-wider"
              />
            </div>

            {/* Search Result View */}
            {selectedCustomer && (
              <div className="bg-[#1e293b]/30 border border-[#334155]/60 p-6 rounded-2xl space-y-6 animate-fadeIn">
                {/* Profile Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white m-0">{selectedCustomer.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400 font-medium">
                      <span>{selectedCustomer.phone}</span>
                      {selectedCustomer.email && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>{selectedCustomer.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isRewardAvailable ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-emerald-500/5">
                      <Gift className="w-4 h-4" />
                      Reward Unlocked
                    </div>
                  ) : (
                    <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      {rewardThreshold - selectedCustomer.current_progress} Visits Left
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Reward Progress</span>
                    <span>{selectedCustomer.current_progress} / {rewardThreshold} Visits</span>
                  </div>
                  {/* Visual blocks */}
                  <div className="flex gap-1.5 h-3.5">
                    {Array.from({ length: rewardThreshold }).map((_, idx) => {
                      const isActive = idx < selectedCustomer.current_progress;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 rounded-sm transition-all duration-300 ${
                            isActive
                              ? 'bg-brand-500 shadow-sm shadow-brand-500/30'
                              : 'bg-[#1e293b] border border-[#334155]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#334155]/40 text-center">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lifetime Visits</span>
                    <span className="text-base font-bold text-white mt-1 block">{selectedCustomer.total_visits}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Spend</span>
                    <span className="text-base font-bold text-white mt-1 block">₹{Number(selectedCustomer.lifetime_spending).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rewards Claimed</span>
                    <span className="text-base font-bold text-white mt-1 block">{selectedCustomer.reward_count}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowAddVisit(true)}
                    className="flex-1 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] hover:border-brand-500/30 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-sm"
                  >
                    <Plus className="w-5 h-5 text-brand-400" />
                    Record Visit
                  </button>
                  <button
                    disabled={!isRewardAvailable}
                    onClick={() => setShowRedeemConfirm(true)}
                    className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer ${
                      isRewardAvailable
                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Redeem Reward
                  </button>
                </div>
              </div>
            )}

            {/* Customer Not Registered form */}
            {customerNotFound && (
              <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl space-y-6 animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white m-0">Customer Not Registered</h3>
                    <p className="text-xs text-slate-400 mt-1">Mobile number <span className="text-white font-semibold">{searchPhone}</span> is not registered in Cafe Rewards. Register them below.</p>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="w-full bg-[#1e293b]/60 text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
                    >
                      {registerLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Register & Start Loyalty
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Activity Feeds (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight m-0">Recent Activity</h2>
              <div className="w-8 h-8 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-400">
                <History className="w-4 h-4" />
              </div>
            </div>

            {loadingFeeds ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              </div>
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px]">
                {/* Recent Visits section */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Visits</h4>
                  {recentTransactions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No recent visits recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1e293b]/20 border border-[#1e293b] text-xs">
                          <div>
                            <p className="font-semibold text-white m-0">{tx.customer?.name}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">{tx.customer?.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-300 block">₹{Number(tx.bill_amount).toFixed(2)}</span>
                            <span className="text-[10px] text-brand-400 mt-1 block font-medium">Visit #{tx.visit_number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Redemptions section */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Redemptions</h4>
                  {recentRedemptions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No recent reward claims.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentRedemptions.map((red) => (
                        <div key={red.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs">
                          <div>
                            <p className="font-semibold text-white m-0">{red.customer?.name}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">{red.customer?.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-emerald-400 block">{red.reward_name}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(red.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Visit */}
      {showAddVisit && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => { setShowAddVisit(false); setCheckoutItems([]); }} />
          {/* Dialog Container */}
          <div className="relative w-full max-w-4xl bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-2xl animate-scaleUp flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-hidden text-left">
            
            {/* Left Pane: Menu Select (width 3/5) */}
            <div className="flex-1 md:w-3/5 flex flex-col overflow-hidden min-h-[350px]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight m-0">Cafe Menu Selection</h3>
                <p className="text-xs text-slate-400 mt-1">Select items below to auto-calculate the ticket total.</p>
              </div>

              {/* Menu Search */}
              <div className="relative mt-3 shrink-0">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Search item..."
                  className="w-full bg-[#1e293b] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-xs font-medium placeholder:text-slate-500"
                />
              </div>

              {/* Category selector */}
              {menuCategories.length > 0 && !menuSearchQuery && (
                <div className="flex gap-2 overflow-x-auto py-2.5 mt-2 shrink-0 border-b border-[#1e293b] scrollbar-none">
                  {menuCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCheckoutCatId(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all duration-200 cursor-pointer ${
                        activeCheckoutCatId === cat.id
                          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/15'
                          : 'bg-[#1e293b]/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2">
                {menuItems.filter((i) => {
                  const matchesSearch = i.name.toLowerCase().includes(menuSearchQuery.toLowerCase());
                  if (menuSearchQuery) return matchesSearch;
                  return i.category_id === activeCheckoutCatId;
                }).length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs italic">
                    No menu items found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {menuItems.filter((i) => {
                      const matchesSearch = i.name.toLowerCase().includes(menuSearchQuery.toLowerCase());
                      if (menuSearchQuery) return matchesSearch;
                      return i.category_id === activeCheckoutCatId;
                    }).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItemToCheckout(item)}
                        className="bg-[#1e293b]/40 hover:bg-[#1e293b]/80 border border-[#334155]/60 hover:border-brand-500/30 p-3 rounded-xl flex items-center justify-between text-left transition-all duration-150 cursor-pointer group"
                      >
                        <div className="overflow-hidden mr-2">
                          <span className="font-bold text-xs text-white block truncate group-hover:text-brand-400">{item.name}</span>
                          {item.description && <span className="text-[10px] text-slate-500 block truncate mt-0.5">{item.description}</span>}
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-300">₹{Number(item.price).toFixed(0)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Checkout Invoice Summary (width 2/5) */}
            <div className="md:w-2/5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#1e293b] pt-4 md:pt-0 md:pl-6 min-h-[300px] overflow-hidden">
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="flex items-center justify-between shrink-0">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-brand-400" />
                    Checkout Chits
                  </h4>
                  {checkoutItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCheckoutItems([])}
                      className="text-[10px] text-slate-500 hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Selected checkout items list */}
                <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 min-h-[120px]">
                  {checkoutItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic py-12">
                      <span>Empty check-in chit.</span>
                      <span className="text-[10px] mt-1 text-slate-600">Select items on the left or type manual price.</span>
                    </div>
                  ) : (
                    checkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#1e293b]/20 border border-[#1e293b] p-2.5 rounded-xl text-xs">
                        <div className="overflow-hidden mr-2">
                          <span className="font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-500">₹{item.price.toFixed(2)} × {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromCheckout(item.id)}
                            className="w-6 h-6 rounded-lg bg-[#1e293b] hover:bg-slate-800 border border-[#334155] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-white text-xs w-5 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const found = menuItems.find((m) => m.id === item.id);
                              if (found) handleAddItemToCheckout(found);
                            }}
                            className="w-6 h-6 rounded-lg bg-[#1e293b] hover:bg-slate-800 border border-[#334155] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Subtotal & Final Edit price */}
              <form onSubmit={handleAddVisitSubmit} className="mt-4 border-t border-[#1e293b] pt-4 space-y-4 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Menu Sum Total:</span>
                    <span className="font-mono text-slate-200">₹{checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Final Billing Price (Editable)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#1e293b] text-white pl-8 pr-4 py-2 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-xs placeholder:text-slate-600 font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddVisit(false); setCheckoutItems([]); }}
                    className="flex-1 bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold py-2 rounded-xl text-[10px] transition-colors duration-200 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingVisit}
                    className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-2 rounded-xl text-[10px] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    {submittingVisit ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Save Visit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Redeem Confirm */}
      {showRedeemConfirm && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowRedeemConfirm(false)} />
          {/* Dialog Container */}
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-2xl animate-scaleUp text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/5">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight m-0">Redeem Reward?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Claim <span className="text-white font-semibold">"{cafe?.reward_name}"</span> for{' '}
                <span className="text-white font-semibold">{selectedCustomer.name}</span>.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">This will reset their current visit count back to 0.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRedeemConfirm(false)}
                className="flex-1 bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors duration-200 cursor-pointer"
              >
                No, Go Back
              </button>
              <button
                type="button"
                disabled={submittingRedeem}
                onClick={handleRedeemSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {submittingRedeem ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Yes, Redeem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
