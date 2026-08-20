import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Zap, Layers, Headphones, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Services = () => {
  const servicesList = [
    {
      icon: Truck,
      title: "Free Express Worldwide Delivery",
      desc: "Every order placed with Ryanz Clothes includes 100% complimentary express courier shipping worldwide with end-to-end milestone tracking."
    },
    {
      icon: Zap,
      title: "Real-Time CJ Dropshipping Fulfillment",
      desc: "Automated direct-to-consumer fulfillment pipeline connected to CJ supply chains with instant tracking number synchronization and carrier updates."
    },
    {
      icon: RotateCcw,
      title: "30-Day Hassle-Free Returns",
      desc: "We stand behind our garments. Enjoy an effortless 30-day return or size exchange policy with zero restocking penalty fees."
    },
    {
      icon: ShieldCheck,
      title: "Authentic Quality & Custom Fabrics",
      desc: "Custom-milled 460GSM French terry and heavyweight organic jersey cottons engineered for structure, drape, and long-term durability."
    },
    {
      icon: Layers,
      title: "Real-Time Inventory & Order Syncing",
      desc: "Dual-stream Firebase database syncing real-time stock levels, live customer reviews, and unified guest + account order histories."
    },
    {
      icon: Headphones,
      title: "24/7 Customer Concierge & Support",
      desc: "Instant customer support via email, interactive contact tickets, automated status emails, and real-time package status tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>PLATFORM CAPABILITIES &amp; GUARANTEES</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Our Services &amp; Standards
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From design to international door-to-door fulfillment, discover how Ryanz Clothes provides a seamless luxury e-commerce experience.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-950">{srv.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Why Choose Us Card */}
        <div className="bg-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">The Ryanz Difference</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Built for Everyday Streetwear Enthusiasts</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Whether you're shopping our curated catalog, tracking your orders with real-time timeline steps, or enjoying automated delivery status updates to your inbox, every detail is engineered for perfection.
              </p>
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-950 text-xs font-extrabold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Zero hidden shipping costs at checkout</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Automated Email Receipts &amp; Tracking Links</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Verified 5-Star Customer Rating Reviews</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Guest Order Tracking without Forced Sign-In</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Services;
