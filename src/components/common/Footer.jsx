import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  ArrowRight,
  Database
} from 'lucide-react';
import { listenToCategories } from '../../services/categoryService';

export const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const unsubscribe = listenToCategories((cats) => {
      setCategories(cats.slice(0, 5));
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Guarantees Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-100 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Express Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">Complimentary for orders above $100</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-100 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">30-Day Free Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free exchanges and returns</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-100 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">100% Authentic Quality</h4>
              <p className="text-xs text-slate-400 mt-0.5">Heavyweight organic fabrics & design</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-100 shrink-0">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Real-Time Firestore</h4>
              <p className="text-xs text-slate-400 mt-0.5">Live store catalog synchronization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-slate-950 rounded-lg flex items-center justify-center font-extrabold text-sm">
              R
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-white">
              RYANZ<span className="text-slate-400 font-light ml-1">CLOTHES</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Engineered for modern streetwear enthusiasts. Premium cuts, heavy custom-milled fabrics, and architectural silhouettes managed dynamically via Cloud Firestore.
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore Architecture Active</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Store Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
            <li><Link to="/shop?filter=new" className="hover:text-white transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop?filter=sale" className="hover:text-white transition-colors text-rose-400">Sale Collection</Link></li>
            <li><Link to="/admin" className="hover:text-emerald-400 transition-colors font-semibold">Admin Panel</Link></li>
          </ul>
        </div>

        {/* Dynamic Categories */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categories</h4>
          <ul className="space-y-2 text-xs">
            {categories.length > 0 ? (
              categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/shop?category=${cat.slug || cat.name}`} 
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-slate-500">Loading categories...</li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Stay In The Loop</h4>
          <p className="text-xs text-slate-400">
            Subscribe for secret drops, seasonal lookbooks, and private discount codes.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing to Ryanz Clothes newsletter!"); }} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-slate-600 flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Ryanz Clothes. Dynamic Firestore Architecture. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/shop" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link to="/shop" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <Link to="/admin" className="hover:text-emerald-400 transition-colors">Admin Dashboard</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
