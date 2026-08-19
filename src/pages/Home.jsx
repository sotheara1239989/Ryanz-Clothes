import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Flame,
  Tag,
  Layers,
  PlusCircle,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { listenToProducts } from "../services/productService";
import { listenToCategories } from "../services/categoryService";
import ProductCard from "../components/common/ProductCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Real-time listener for products from Firestore
    const unsubProducts = listenToProducts(
      (allProducts) => {
        setProducts(allProducts.filter((p) => p.isActive !== false));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore products error:", err);
        setError(
          "Could not connect to Firestore. Please check Firebase configuration.",
        );
        setLoading(false);
      },
    );

    // Real-time listener for categories from Firestore
    const unsubCategories = listenToCategories(
      (allCategories) => {
        setCategories(allCategories.filter((c) => c.isActive !== false));
      },
      (err) => {
        console.error("Firestore categories error:", err);
      },
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // Filter dynamic collections from Firestore data
  const featuredProducts = products
    .filter((p) => p.featured === true)
    .slice(0, 4);
  const newArrivals = products
    .filter((p) => p.isNewArrival === true || p.createdAt)
    .slice(0, 4);
  const saleProducts = products
    .filter(
      (p) =>
        p.discountPrice &&
        Number(p.discountPrice) > 0 &&
        Number(p.discountPrice) < Number(p.price),
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 lg:py-32">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NEW SEASON STREETWEAR COLLECTION</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                STREETWEAR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-300 to-slate-500">
                  REDEFINED FOR TODAY.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                Elevate your everyday rotation with heavyweight organic cottons,
                tailored dropped shoulders, and architectural streetwear silhouettes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/shop"
                  className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/shop?filter=sale"
                  className="px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-sm font-semibold rounded-2xl transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>View Special Offers</span>
                </Link>
              </div>

              {/* Quick dynamic metrics */}
              <div className="pt-8 border-t border-slate-900 grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {products.length > 0 ? `${products.length}+` : "100+"}
                  </div>
                  <div className="text-xs text-slate-500">Styles Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {categories.length > 0 ? categories.length : "8"}
                  </div>
                  <div className="text-xs text-slate-500">Collections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">
                    100%
                  </div>
                  <div className="text-xs text-slate-500">Authentic Cotton</div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
                  alt="Ryanz Clothes Hero"
                  className="w-full h-[450px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      New Season Drop
                    </p>
                    <h3 className="text-sm font-bold text-white">
                      Ryanz Heavy Oversized Series
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    className="p-2 bg-white text-black rounded-xl hover:scale-105 transition-transform"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 flex-1">

        {/* Featured Products Section (Firestore Query: featured == true) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Hand-Picked Drops
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Featured Products
                </h2>
              </div>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              Browse Shop
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading featured collection..." />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="New drops coming soon"
              description="Check back soon for hand-picked drops and limited edition streetwear essentials."
              actionText="Explore Shop"
              actionLink="/shop"
            />
          )}
        </section>

        {/* New Arrivals Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Fresh Additions
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  New Arrivals
                </h2>
              </div>
            </div>
            <Link
              to="/shop?filter=new"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              See All New
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading fresh additions..." />
          ) : newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Fresh arrivals dropping soon"
              description="Stay tuned for our latest seasonal releases and new streetwear cuts."
              actionText="Browse Catalog"
              actionLink="/shop"
            />
          )}
        </section>

        {/* Sale / Discount Section (Firestore Query: discountPrice > 0) */}
        {saleProducts.length > 0 && (
          <section className="space-y-6 p-8 rounded-3xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Limited Offers
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Special Sale & Discounts
                  </h2>
                </div>
              </div>
              <Link
                to="/shop?filter=sale"
                className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 transition-colors"
              >
                View Full Sale
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
