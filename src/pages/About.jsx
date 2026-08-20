import React from "react";
import {
  ShieldCheck,
  Award,
  Sparkles,
  Truck,
  Heart,
  Users,
  GraduationCap,
} from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-emerald-400" />
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

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
              <Truck className="w-6 h-6 text-blue-400" />
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

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-slate-950">
              100% Quality &amp; Satisfaction Guarantee
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every garment undergoes multi-point inspection before dispatch. If
              you're not completely satisfied, our 30-day return policy
              guarantees complete peace of mind.
            </p>
          </div>
        </div>

        {/* Academic Project Presentation Attribution */}
        <div className="bg-slate-950 rounded-3xl p-8 sm:p-10 text-white border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Academic Project
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Royal University of Phnom Penh (RUPP)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 font-medium">
                Developer &amp; Presenter:
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                Morn Sotheara
              </div>
              <div className="text-slate-400 mt-0.5">
                Computer Science / Software Engineering
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">
                Lecturer / Advisor:
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                Chim Bunchun
              </div>
              <div className="text-slate-400 mt-0.5">
                Faculty of Science, RUPP
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center space-y-4 pt-6">
          <h2 className="text-2xl font-extrabold text-slate-950">
            Ready to Upgrade Your Rotation?
          </h2>
          <div>
            <Link
              to="/shop"
              className="inline-block px-8 py-3.5 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-2xl shadow-xl transition-all"
            >
              Explore Full Collection &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
