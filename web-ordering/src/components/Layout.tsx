import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, cafe } = useAuth();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 text-left">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#1e293b] bg-[#0f172a] px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none my-0">
              {cafe?.name || 'Cafe Rewards'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200 leading-none m-0">
                {user?.email?.split('@')[0] || 'Owner'}
              </p>
              <span className="text-xs text-slate-500 font-medium">Cafe Owner</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-300">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Dynamic viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f19] p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
export default Layout;
