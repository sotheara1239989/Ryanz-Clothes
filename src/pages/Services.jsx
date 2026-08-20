import React from 'react';
import { Link } from 'react-router-dom';

export const Services = () => {
  const servicesList = [
    {
      num: "01",
      title: "Free Express Worldwide Delivery",
      desc: "Every order placed with Ryanz Clothes includes 100% complimentary express courier shipping worldwide with end-to-end milestone tracking."
    },
    {
      num: "02",
      title: "Real-Time CJ Dropshipping Fulfillment",
      desc: "Automated direct-to-consumer fulfillment pipeline connected to CJ supply chains with instant tracking number synchronization and carrier updates."
    },
    {
      num: "03",
      title: "30-Day Hassle-Free Returns",
      desc: "We stand behind our garments. Enjoy an effortless 30-day return or size exchange policy with zero restocking penalty fees."
    },
    {
      num: "04",
      title: "Authentic Quality & Custom Fabrics",
      desc: "Custom-milled 460GSM French terry and heavyweight organic jersey cottons engineered for structure, drape, and long-term durability."
    },
    {
      num: "05",
      title: "Real-Time Inventory & Order Syncing",
      desc: "Dual-stream Firebase database syncing real-time stock levels, live customer reviews, and unified guest + account order histories."
    },
    {
      num: "06",
      title: "24/7 Customer Concierge & Support",
      desc: "Instant customer support via email, interactive contact tickets, automated status emails, and real-time package status tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Platform Capabilities &amp; Guarantees
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Our Services &amp; Standards
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From design to international door-to-door fulfillment, discover how Ryanz Clothes provides a seamless luxury e-commerce experience.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((srv, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-3 hover:border-gray-300 transition-colors">
              <span className="text-xs font-bold font-mono text-slate-400 block">{srv.num}</span>
              <h3 className="text-base font-bold text-slate-950">{srv.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{srv.desc}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us Card */}
        <div className="bg-slate-950 rounded-2xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">The Ryanz Difference</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Built for Everyday Streetwear Enthusiasts</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Whether you're shopping our curated catalog, tracking your orders with real-time timeline steps, or enjoying automated delivery status updates to your inbox, every detail is engineered for perfection.
              </p>
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-block px-6 py-3 bg-white text-slate-950 text-xs font-extrabold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Start Shopping &rarr;
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3 bg-slate-900/80 p-6 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">&bull;</span>
                <span>Zero hidden shipping costs at checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">&bull;</span>
                <span>Automated Email Receipts &amp; Tracking Links</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">&bull;</span>
                <span>Verified 5-Star Customer Rating Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">&bull;</span>
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
