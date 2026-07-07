import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { supabase } from './services/supabase';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Rewards from './pages/Rewards';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerRegister from './pages/CustomerRegister';
import Menu from './pages/Menu';

import { Coffee, Store, Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, cafe, setCafe } = useAuth();
  const [setupName, setSetupName] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Edge case: User is authenticated but has no cafe row
  if (!cafe) {
    const handleCreateCafe = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!setupName.trim()) return;
      setSetupLoading(true);
      try {
        const { data, error } = await supabase
          .from('cafes')
          .insert({
            name: setupName,
            owner: user.id,
            email: user.email,
            reward_name: 'Free Coffee',
            reward_threshold: 10,
            reward_description: 'Get a free drink after 10 visits'
          })
          .select()
          .single();

        if (error) throw error;
        setCafe(data);
      } catch (err) {
        console.error('Error setting up cafe:', err);
        alert('Failed to initialize cafe. Please try again.');
      } finally {
        setSetupLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mx-auto shadow-md">
            <Coffee className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Set Up Your Cafe</h2>
            <p className="text-xs text-slate-400 mt-2">Initialize your rewards system by entering your store name.</p>
          </div>
          <form onSubmit={handleCreateCafe} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Cafe Store Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="Blue Tokai Cafe"
                  className="w-full bg-[#1e293b] text-white pl-11 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={setupLoading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              {setupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Cafe Rewards'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public customer registration route */}
          <Route path="/register/:cafeId" element={<CustomerRegister />} />

          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Merchant workspace routing */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <Layout>
                  <Menu />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Transactions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <Layout>
                  <Rewards />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
