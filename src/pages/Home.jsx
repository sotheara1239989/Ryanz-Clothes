import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    const unsubProducts = listenToProducts(
      (allProducts) => {
        setProducts(allProducts.filter((p) => p.isActive !== false));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore products error:", err);
        setError("Could not connect to Firestore. Please check Firebase configuration.");
        setLoading(false);
      }
    );

    const unsubCategories = listenToCategories(
      (allCategories) => {
        setCategories(allCategories.filter((c) => c.isActive !== false));
      },
      (err) => {
        console.error("Firestore categories error:", err);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

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
        Number(p.discountPrice) < Number(p.price)
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section className="bg-slate-950 text-white py-10 sm:py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
              Spring / Summer Collection
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
              Urban Essentials
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
              Heavyweight French terry, boxy tailored tees, and tactical streetwear cuts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/shop"
              className="px-6 py-3 bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all"
            >
              Shop All &rarr;
            </Link>
            <Link
              to="/shop?filter=sale"
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 transition-colors"
            >
              Sale
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 flex-1">
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                Hand-Picked Drops
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Featured Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              Browse Shop &rarr;
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

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                Fresh Additions
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/shop?filter=new"
              className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              See All New &rarr;
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

        {saleProducts.length > 0 && (
          <section className="space-y-6 p-8 rounded-3xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-0.5">
                  Limited Offers
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Special Sale &amp; Discounts
                </h2>
              </div>
              <Link
                to="/shop?filter=sale"
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
              >
                View Full Sale &rarr;
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
