import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Package, 
  Users, 
  MessageSquare, 
  Database, 
  ExternalLink,
  ShieldCheck,
  Truck,
  X
} from 'lucide-react';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Products', to: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', to: '/admin/categories', icon: Layers },
    { label: 'Orders', to: '/admin/orders', icon: Package },
    { label: 'Customers', to: '/admin/users', icon: Users },
    { label: 'Reviews', to: '/admin/reviews', icon: MessageSquare },
    { label: 'CJ Dropshipping', to: '/admin/cjdropshipping', icon: Truck },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0B0F19] text-white z-50 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
            <Link to="/admin" className="flex items-center gap-3 group">
              <img 
                src="/favicon.png" 
                alt="Ryanz Clothes" 
                className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform object-cover" 
              />
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  RYANZ ADMIN
                </span>
                <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">
                  Executive Suite
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1 flex-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 py-2">
              Management
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/50 translate-x-1'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Storefront Link Footer */}
          <div className="p-4 border-t border-slate-800/80 space-y-3">
            <Link
              to="/"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all hover:scale-[1.01]"
            >
              <span>Back to Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <div className="px-2 text-[10px] text-slate-400 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
