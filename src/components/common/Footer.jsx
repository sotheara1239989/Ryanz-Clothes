import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  X,
  Package
} from 'lucide-react';
import { listenToCategories } from '../../services/categoryService';

export const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    const unsubscribe = listenToCategories((cats) => {
      setCategories(cats.slice(0, 5));
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-white text-gray-600 pt-12 pb-10 border-t border-gray-200">
      {/* Guarantees Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-xs">Free Worldwide Delivery</h4>
              <p className="text-[11px] text-gray-500">Zero freight shipping fees</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-xs">30-Day Free Returns</h4>
              <p className="text-[11px] text-gray-500">Hassle-free size exchange</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-xs">460GSM Custom Terry</h4>
              <p className="text-[11px] text-gray-500">Architectural heavyweight cotton</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-800 flex items-center justify-center shrink-0 shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-xs">Direct CJ Fulfillment</h4>
              <p className="text-[11px] text-gray-500">Live tracked parcel updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Ryanz Clothes" 
              className="w-7 h-7 rounded-md object-contain" 
            />
            <span className="text-base font-extrabold tracking-tight text-gray-900 font-sans uppercase">
              RYANZ<span className="text-gray-400 font-normal ml-1">CLOTHES</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
            Engineered for modern streetwear enthusiasts. Premium cuts, heavy custom-milled fabrics, and architectural silhouettes designed for everyday rotation.
          </p>
          <p className="text-[11px] text-gray-400 pt-1">
            Department of Information Technology Engineering (ITE) &bull; Royal University of Phnom Penh (RUPP)
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Navigation</h4>
          <ul className="space-y-1.5 text-xs">
            <li><Link to="/" className="hover:text-black transition-colors">Home</Link></li>
            <li><Link to="/shop" className="hover:text-black transition-colors">Shop All</Link></li>
            <li><Link to="/about" className="hover:text-black transition-colors">About Us</Link></li>
            <li><Link to="/services" className="hover:text-black transition-colors">Services</Link></li>
            <li><Link to="/contact" className="hover:text-black transition-colors">Contact</Link></li>
            <li><Link to="/my-orders" className="hover:text-black transition-colors font-medium">Track Orders</Link></li>
          </ul>
        </div>

        {/* Dynamic Categories */}
        <div className="md:col-span-2 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Collections</h4>
          <ul className="space-y-1.5 text-xs">
            {categories.length === 0 ? (
              <li className="text-gray-400">Loading...</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/shop?category=${cat.slug || cat.name}`}
                    className="hover:text-black transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Academic Project Presentation Deck link */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Academic Capstone</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Developer: <strong className="text-gray-900">Morn Sotheara</strong><br />
            Advisor: <strong className="text-gray-900">Chhim Bunchhun</strong>
          </p>
          <a
            href="/presentation.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
          >
            <span>View Presentation Deck (12 Slides)</span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          &copy; {new Date().getFullYear()} Ryanz Clothes &bull; All Rights Reserved.
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button 
            onClick={() => setModalContent('privacy')}
            className="hover:text-black transition-colors"
          >
            Privacy Policy
          </button>
          <span>&bull;</span>
          <button 
            onClick={() => setModalContent('terms')}
            className="hover:text-black transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Privacy Policy / Terms Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button 
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-3 max-h-80 overflow-y-auto pr-1">
              {modalContent === 'privacy' ? (
                <>
                  <p>
                    <strong>1. Information Collection:</strong> Ryanz Clothes collects order delivery details (name, email, shipping address, and phone number) strictly for processing and dispatching orders via cloud dropshipping fulfillment.
                  </p>
                  <p>
                    <strong>2. Data Protection:</strong> User authentication and customer profile data are secured via Google Firebase Authentication and Cloud Firestore security rules.
                  </p>
                  <p>
                    <strong>3. Third-Party Fulfillment:</strong> Order items and shipping addresses are synchronized with CJ Dropshipping Open API to generate international tracking numbers.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Orders &amp; Pricing:</strong> All prices are displayed in USD ($). Orders placed on Ryanz Clothes are processed immediately for international dispatch.
                  </p>
                  <p>
                    <strong>2. Complimentary Shipping:</strong> We provide 100% free worldwide shipping with end-to-end milestone tracking.
                  </p>
                  <p>
                    <strong>3. Returns &amp; Exchanges:</strong> Customers may request size exchanges or returns within 30 days of receiving their parcel.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
