import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ArrowRight,
  X
} from 'lucide-react';
import { listenToCategories } from '../../services/categoryService';

export const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [modalContent, setModalContent] = useState(null); // 'privacy' | 'terms' | null

  useEffect(() => {
    const unsubscribe = listenToCategories((cats) => {
      setCategories(cats.slice(0, 5));
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-white text-gray-600 pt-16 pb-12 border-t border-gray-200">
      {/* Guarantees Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">Free Worldwide Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Always free shipping to everywhere</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">30-Day Free Returns</h4>
              <p className="text-xs text-gray-500 mt-0.5">Hassle-free exchanges and returns</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">100% Authentic Quality</h4>
              <p className="text-xs text-gray-500 mt-0.5">Heavyweight organic fabrics &amp; design</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-black text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">Real-Time Inventory</h4>
              <p className="text-xs text-gray-500 mt-0.5">Live stock &amp; fast order fulfillment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Ryanz Clothes" 
              className="w-9 h-9 rounded-xl object-cover shadow-sm" 
            />
            <span className="text-xl font-extrabold tracking-tighter text-gray-900">
              RYANZ<span className="text-gray-400 font-light ml-1">CLOTHES</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
            Engineered for modern streetwear enthusiasts. Premium cuts, heavy custom-milled fabrics, and architectural silhouettes designed for everyday rotation.
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Store Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="hover:text-black transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-black transition-colors">Shop All</Link></li>
            <li><Link to="/shop?filter=new" className="hover:text-black transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop?filter=sale" className="hover:text-black transition-colors text-rose-600 font-semibold">Sale Collection</Link></li>
            <li><Link to="/my-orders" className="hover:text-black transition-colors font-medium">Track Orders</Link></li>
          </ul>
        </div>

        {/* Dynamic Categories */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Categories</h4>
          <ul className="space-y-2 text-xs">
            {categories.length > 0 ? (
              categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/shop?category=${cat.slug || cat.name}`} 
                    className="hover:text-black transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-400">Loading categories...</li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Stay In The Loop</h4>
          <p className="text-xs text-gray-500">
            Subscribe for secret drops, seasonal lookbooks, and private discount codes.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing to Ryanz Clothes newsletter!"); }} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="bg-gray-50 text-gray-900 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-black flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white hover:bg-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Copyright & Policy Modals */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Ryanz Clothes. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setModalContent('privacy')}
            className="hover:text-gray-800 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button 
            type="button"
            onClick={() => setModalContent('terms')}
            className="hover:text-gray-800 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Policy Modal Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button 
                onClick={() => setModalContent(null)}
                className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 max-h-96 overflow-y-auto pr-1 leading-relaxed">
              {modalContent === 'privacy' ? (
                <>
                  <p>
                    At <strong>Ryanz Clothes</strong>, we take your personal data privacy seriously. This policy describes how your information is collected, protected, and processed.
                  </p>
                  <h4 className="font-bold text-gray-900">1. Information We Collect</h4>
                  <p>
                    When you purchase items or register an account, we collect necessary contact information (name, email, shipping address) to fulfill your orders and calculate zero-shipping freight delivery.
                  </p>
                  <h4 className="font-bold text-gray-900">2. Security &amp; Cloud Storage</h4>
                  <p>
                    Your data is securely authenticated and stored using Google Cloud Firebase security rules with end-to-end SSL encryption. We never sell your personal information.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Welcome to <strong>Ryanz Clothes</strong>. By accessing our platform and placing orders, you agree to the following terms and conditions.
                  </p>
                  <h4 className="font-bold text-gray-900">1. Free Delivery Guarantee</h4>
                  <p>
                    Every order placed on Ryanz Clothes includes 100% free worldwide delivery with zero hidden delivery charges at checkout.
                  </p>
                  <h4 className="font-bold text-gray-900">2. 30-Day Returns</h4>
                  <p>
                    Items in original condition with tags attached are eligible for exchange or return within 30 days of package receipt.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setModalContent(null)}
                className="w-full py-3 bg-black text-white text-xs font-bold rounded-2xl hover:bg-gray-800 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
