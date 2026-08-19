import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, ShieldCheck, User, Database, ArrowUpRight, Truck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Admin Header Topbar */}
        <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Firestore Live Mode</span>
              </div>
              <h2 className="text-sm font-bold text-white hidden sm:block">
                Ryanz Clothes Admin Console
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/cjdropshipping"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>CJ Importer</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <span>View Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-extrabold border border-slate-700">
                {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="p-4 sm:p-8 flex-1 bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
