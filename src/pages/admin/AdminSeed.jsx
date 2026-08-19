import React, { useState } from 'react';
import { 
  Database, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  ShoppingBag, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { seedFirestoreDatabase, clearFirestoreDatabase, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../../services/seedService';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export const AdminSeed = () => {
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [seedSummary, setSeedSummary] = useState(null);
  const [cleanSummary, setCleanSummary] = useState(null);
  const { showToast } = useToast();

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedSummary(null);
      setCleanSummary(null);
      const results = await seedFirestoreDatabase();
      setSeedSummary(results);
      showToast("Firestore successfully seeded with dynamic catalog!", "success");
    } catch (err) {
      console.error("Seeding error:", err);
      showToast("Failed to seed database. Check Firebase Firestore connection.", "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleClean = async () => {
    if (!window.confirm("⚠️ ARE YOU SURE? This will permanently delete ALL products, categories, orders, and reviews from Firestore!")) {
      return;
    }

    try {
      setCleaning(true);
      setSeedSummary(null);
      setCleanSummary(null);
      const results = await clearFirestoreDatabase();
      setCleanSummary(results);
      showToast("All store collections deleted from Firestore!", "info");
    } catch (err) {
      console.error("Clean error:", err);
      showToast("Failed to clean database.", "error");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Firestore Population Tool</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          1-Click Firestore Database Seeder
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
          Per the <strong className="text-white">Firestore-First Architecture</strong>, the frontend contains <strong>ZERO hardcoded products or categories</strong>. 
          Use this tool to inject authentic streetwear apparel items, categories, and initial reviews directly into your Firestore database.
        </p>
      </div>

      {/* Action Card */}
      <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Ryanz Clothes Default Apparel Dataset</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes {INITIAL_CATEGORIES.length} Categories, {INITIAL_PRODUCTS.length} Detailed Apparel Products, and Initial Reviews
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleClean}
              disabled={cleaning || seeding}
              className="px-5 py-3.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {cleaning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting All Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe All Store Data</span>
                </>
              )}
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding || cleaning}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Writing to Firestore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Seed Firestore Catalog Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clean Summary Banner */}
        {cleanSummary && (
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl space-y-1 text-xs text-rose-300">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
              <Trash2 className="w-4 h-4" />
              <span>All Store Data Deleted!</span>
            </div>
            <p className="text-slate-300">
              Deleted {cleanSummary.productsDeleted} products, {cleanSummary.categoriesDeleted} categories, {cleanSummary.ordersDeleted} orders, and {cleanSummary.reviewsDeleted} reviews from Firestore.
            </p>
          </div>
        )}

        {/* Results Banner */}
        {seedSummary && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Firestore Successfully Populated!</span>
            </div>
            <p className="text-slate-300">
              Added <strong>{seedSummary.categoriesAdded} categories</strong>, <strong>{seedSummary.productsAdded} products</strong>, and <strong>{seedSummary.reviewsAdded} reviews</strong> into Cloud Firestore.
            </p>
            <div className="pt-2 flex gap-3">
              <Link
                to="/shop"
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 inline-flex items-center gap-1.5"
              >
                <span>View Live Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/admin/products"
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800"
              >
                Manage in Products Table
              </Link>
            </div>
          </div>
        )}

        {/* Dataset Preview */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Catalog Items Preview to be Inserted
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INITIAL_PRODUCTS.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center gap-3">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-12 h-14 object-cover rounded-lg bg-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                  <p className="text-[11px] text-slate-400">
                    Category: <span className="text-emerald-400">{p.category}</span> • ${p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSeed;
