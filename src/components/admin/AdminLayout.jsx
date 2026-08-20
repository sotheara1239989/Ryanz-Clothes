import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, ArrowUpRight, Truck } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Admin</span>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-500 font-medium">Ryanz Clothes</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/cjdropshipping"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-gray-600" />
              <span>CJ Importer</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <span>View Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-gray-900 leading-tight">
                  {userProfile?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  {currentUser?.email || 'admin'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
