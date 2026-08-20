import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Package, 
  Users, 
  MessageSquare, 
  ExternalLink,
  Truck,
  X
} from 'lucide-react';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Products', to: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', to: '/admin/categories', icon: Layers },
    { label: 'Orders', to: '/admin/orders', icon: Package },
    { label: 'Customers', to: '/admin/users', icon: Users },
    { label: 'Reviews', to: '/admin/reviews', icon: MessageSquare },
    { label: 'CJ Dropshipping', to: '/admin/cjdropshipping', icon: Truck },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white text-slate-900 z-50 flex flex-col justify-between border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="Ryanz Clothes" 
                className="w-8 h-8 rounded-lg object-cover shadow-xs" 
              />
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-gray-900 block">
                  RYANZ CLOTHES
                </span>
                <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase block">
                  Admin Panel
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">
              Menu
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
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Storefront Link */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <span>Back to Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
