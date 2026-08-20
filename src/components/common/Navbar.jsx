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
  ChevronDown
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all">
      {/* Top Notification Bar */}
      <div className="bg-black text-white text-[10px] font-semibold py-1.5 px-4 text-center tracking-widest uppercase">
        Complimentary Express Worldwide Delivery &bull; Zero Shipping Fees
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16 gap-4">
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo & Name */}
          <div className="flex-shrink-0 flex items-center mr-2 lg:mr-8">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Ryanz Clothes" 
                className="w-7 h-7 rounded-md object-contain group-hover:scale-105 transition-transform" 
              />
              <span className="text-base font-extrabold tracking-tight text-gray-900 font-sans uppercase">
                RYANZ<span className="text-gray-400 font-normal ml-1">CLOTHES</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-7 flex-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
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
              <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-black py-2">
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 w-60 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in-50 duration-150">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                    Collections
                  </div>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500">Loading categories...</div>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug || cat.name}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg transition-colors font-medium"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <span>{cat.name}</span>
                      </Link>
                    ))
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      to="/shop"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="block px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      All Products &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/shop?filter=new"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
            >
              New Arrivals
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                }`
              }
            >
              Services
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                }`
              }
            >
              About
            </NavLink>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Search Input Bar (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles..."
                className="w-32 lg:w-44 xl:w-52 pl-8 pr-3 py-1.5 bg-gray-100 hover:bg-gray-150 focus:bg-white text-xs text-gray-900 rounded-lg border border-gray-200 focus:border-black focus:outline-none transition-all placeholder:text-gray-400"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Admin Portal Link (Subtle, sleek) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-[11px]">Admin</span>
              </Link>
            )}

            {/* Shopping Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
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
                    className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold uppercase">
                      {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in-50 duration-150"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3.5 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {userProfile?.name || 'Account'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-[9px] uppercase font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Admin Access
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/my-orders"
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span>My Orders</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-gray-700" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold px-3 py-1.5 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>

            <div className="flex flex-col space-y-1 text-xs font-semibold uppercase tracking-wider">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                Home
              </NavLink>

              <NavLink
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                Shop All
              </NavLink>

              <NavLink
                to="/shop?filter=new"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                New Arrivals
              </NavLink>

              <NavLink
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                Services
              </NavLink>

              <NavLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                About
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-gray-900 bg-gray-100 rounded-lg font-bold"
                >
                  Admin Panel
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
