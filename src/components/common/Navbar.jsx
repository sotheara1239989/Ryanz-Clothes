import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut, 
  Package, 
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { listenToCategories } from '../../services/categoryService';

export const Navbar = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically load categories from Firestore for navbar menu
  useEffect(() => {
    const unsubscribe = listenToCategories((fetchedCategories) => {
      setCategories(fetchedCategories.filter(c => c.isActive !== false));
    });
    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      {/* Top Notification Bar */}
      <div className="bg-slate-950 text-white text-[11px] font-semibold py-2 px-4 text-center tracking-widest uppercase">
        Complimentary Express Worldwide Delivery &bull; Zero Shipping Fees
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Ryanz Clothes" 
                className="w-8 h-8 rounded-lg shadow-xs group-hover:scale-105 transition-transform object-cover" 
              />
              <span className="text-xl font-extrabold tracking-tighter text-slate-950 font-sans">
                RYANZ<span className="text-slate-500 font-light ml-1">CLOTHES</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'
                }`
              }
            >
              Shop All
            </NavLink>

            {/* Dynamic Categories Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setCategoryDropdownOpen(true)}
              onMouseLeave={() => setCategoryDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm font-semibold tracking-wide text-slate-600 hover:text-slate-950 py-2">
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in-50 duration-200">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                    Dynamic Collections
                  </div>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500">Loading categories...</div>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug || cat.name}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 rounded-xl transition-colors font-medium"
                      >
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        {cat.name}
                      </Link>
                    ))
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      to="/shop"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      Browse Entire Catalog →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/shop?filter=new"
              className="text-sm font-semibold tracking-wide text-slate-600 hover:text-slate-950 transition-colors"
            >
              New Arrivals
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'
                }`
              }
            >
              Services
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'
                }`
              }
            >
              About
            </NavLink>
          </div>

          {/* Right Action Icons & Search */}
          <div className="flex items-center gap-4">
            {/* Search Input Bar (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-48 xl:w-60 pl-9 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-xs text-slate-900 rounded-full border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            </form>

            {/* Admin Portal Shortcut Button (Admins only) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                title="Store Management"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Shopping Cart Icon with dynamic counter */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-800 hover:text-black hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-slate-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-scale">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Account / Dropdown */}
            <div className="relative">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold uppercase">
                      {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-slate-950 truncate">
                          {userProfile?.name || 'Account'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                            Admin Access
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/my-orders"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Admin Dashboard
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold px-3.5 py-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-4 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products in store..."
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-sm border-none focus:ring-1 focus:ring-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>

            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Shop All
              </Link>
              <Link
                to="/shop?filter=new"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                New Arrivals
              </Link>
              <Link
                to="/shop?filter=sale"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Sale Products
              </Link>

              {/* Dynamic Mobile Categories */}
              <div className="pt-2 border-t border-gray-100">
                <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Dynamic Collections
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug || cat.name}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-1.5 text-sm text-slate-600 hover:text-slate-950"
                  >
                    • {cat.name}
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                  >
                    Admin Panel
                  </Link>
                )}
                {currentUser ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
