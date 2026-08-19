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
    { label: 'Firebase Setup', to: '/admin/firebase-setup', icon: ShieldCheck },
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
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950 text-white z-50 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 text-slate-950 font-extrabold rounded-lg flex items-center justify-center text-sm shadow">
                R
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  RYANZ ADMIN
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                  Firestore Console
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 py-2">
              Store Management
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Storefront Link Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <Link
              to="/"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors"
            >
              <span>Back to Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <div className="px-2 text-[10px] text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time onSnapshot Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
