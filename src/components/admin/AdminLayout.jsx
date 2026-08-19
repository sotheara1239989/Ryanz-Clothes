import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, ShieldCheck, User, Database, ArrowUpRight, Truck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Admin Header Topbar */}
        <header className="h-16 sm:h-20 bg-[#0c121e]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 px-3.5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="uppercase tracking-wider font-bold">Store Console Live</span>
              </div>
              <h2 className="text-xs sm:text-sm font-extrabold text-white hidden xs:block tracking-tight">
                Ryanz Clothes Executive Suite
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin/cjdropshipping"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-sm"
            >
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>CJ Importer</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-950/40 hover:scale-[1.02]"
            >
              <span>View Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800/80">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-emerald-400 flex items-center justify-center text-xs font-black border border-slate-700/80 shadow-inner">
                {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 bg-[#090D16] min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
