import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Gift,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Coffee,
  Utensils,
  MessageSquare
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { cafe, signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Menu', path: '/menu', icon: Utensils },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Rewards', path: '/rewards', icon: Gift },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Marketing', path: '/marketing', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-[#1e293b] flex flex-col h-screen text-slate-300 shrink-0">
      {/* Branding */}
      <div className="p-6 border-b border-[#1e293b] flex items-center gap-3">
        {cafe?.logo ? (
          <img src={cafe.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-brand-500/20 border border-brand-500/50 flex items-center justify-center text-brand-400">
            <Coffee className="w-6 h-6" />
          </div>
        )}
        <div className="overflow-hidden">
          <h2 className="font-bold text-lg text-white truncate">{cafe?.name || 'Cafe Rewards'}</h2>
          <span className="text-xs text-slate-500 font-medium">Merchant Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'hover:bg-[#1e293b] hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-[#1e293b]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 transition-all duration-200 text-sm font-medium border border-transparent hover:border-rose-900/30"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
