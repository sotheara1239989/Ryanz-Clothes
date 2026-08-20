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
    // Real-time listener for products from Firestore
    const unsubProducts = listenToProducts(
      (allProducts) => {
        setProducts(allProducts.filter((p) => p.isActive !== false));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore products error:", err);
        setError(
          "Could not connect to Firestore. Please check Firebase configuration."
        );
        setLoading(false);
      }
    );

    // Real-time listener for categories from Firestore
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
        Number(p.discountPrice) < Number(p.price)
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">
                New Season Streetwear Collection
              </span>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                STREETWEAR <br />
                <span className="text-slate-300">
                  REDEFINED FOR TODAY.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                Elevate your everyday rotation with heavyweight organic cottons,
                tailored dropped shoulders, and architectural streetwear
                silhouettes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/shop"
                  className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 text-sm font-bold rounded-2xl shadow-md transition-all"
                >
                  Explore Collection &rarr;
                </Link>

                <Link
                  to="/shop?filter=sale"
                  className="px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-sm font-semibold rounded-2xl transition-all"
                >
                  Special Offers
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
                  src="https://img.freepik.com/premium-photo/summer-collection-men-clothes-set-with-checkered-shirt-jeans-shoes-belt-isolated-white-background_142957-1103.jpg"
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
                    className="px-3.5 py-1.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Shop &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 flex-1">
        {/* Featured Products Section */}
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

        {/* New Arrivals Section */}
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

        {/* Sale / Discount Section */}
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
