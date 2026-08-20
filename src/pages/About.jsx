import React from "react";
import { Link } from "react-router-dom";

export const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Elevating Modern Streetwear Aesthetics
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Founded with a vision to merge architectural tailoring with luxury
            streetwear essentials. Designed for effortless rotation, exceptional
            comfort, and timeless silhouette cuts.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-xs font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-slate-950">
              Custom-Milled Heavyweight Cottons
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We engineer our streetwear using custom-spun 460GSM French terry
              and organic heavyweight jersey cottons that hold their boxy shape
              wash after wash.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-xs font-mono">
              02
            </div>
            <h3 className="text-base font-bold text-slate-950">
              Global Dropshipping &amp; Logistics
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Integrated directly with automated cloud supply chains and CJ
              Dropshipping fulfillment pipelines to deliver across Cambodia,
              Asia, and worldwide with zero freight fees.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center font-bold text-xs font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-slate-950">
              Quality &amp; Satisfaction Guarantee
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every garment undergoes multi-point inspection before dispatch. If
              you're not completely satisfied, our 30-day return policy
              guarantees complete peace of mind.
            </p>
          </div>
        </div>

        {/* Academic Project Presentation Attribution */}
        <div className="bg-slate-950 rounded-2xl p-8 sm:p-10 text-white border border-slate-800 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-6">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Engineering Capstone Project
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Royal University of Phnom Penh (RUPP)
            </h2>
            <p className="text-xs text-slate-400">
              Department of Information Technology Engineering (ITE) &bull; Full-Stack Cloud E-Commerce Platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Developed By:</span>
              <div className="font-bold text-white text-sm">Morn Sotheara</div>
              <div className="text-slate-400">Full-Stack Lead Developer &amp; Architecture Design</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Project Advisor:</span>
              <div className="font-bold text-white text-sm">Chhim Bunchhun</div>
              <div className="text-slate-400">Faculty Supervisor &bull; ITE Department</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="/presentation.html"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <span>View RUPP Presentation Deck (12 Slides)</span>
              <span>&rarr;</span>
            </a>
            <Link
              to="/shop"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-800 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
