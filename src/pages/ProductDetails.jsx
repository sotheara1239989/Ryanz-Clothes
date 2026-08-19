import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  ArrowLeft, 
  MessageSquare, 
  Send,
  Sparkles,
  Layers
} from 'lucide-react';
import { listenToProduct } from '../services/productService';
import { listenToProductReviews, addReview } from '../services/reviewService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User selections
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Real-time listener for this product from Firestore
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubProduct = listenToProduct(
      id,
      (docData) => {
        if (docData) {
          setProduct(docData);
          if (docData.sizes && docData.sizes.length > 0 && !selectedSize) {
            setSelectedSize(docData.sizes[0]);
          }
          if (docData.colors && docData.colors.length > 0 && !selectedColor) {
            setSelectedColor(docData.colors[0]);
          }
        } else {
          setError("Product was not found in Firestore.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to product:", err);
        setError("Failed to load product details from Firestore.");
        setLoading(false);
      }
    );

    // Real-time listener for product reviews from Firestore
    const unsubReviews = listenToProductReviews(
      id,
      (fetchedReviews) => {
        setReviews(fetchedReviews);
      },
      (err) => {
        console.error("Error listening to reviews:", err);
      }
    );

    return () => {
      unsubProduct();
      unsubReviews();
    };
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage message="Fetching live product from Firestore..." />;
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorMessage
          title="Product Not Found"
          message={error || "The requested item is not currently active in our Firestore catalog."}
          onRetry={() => navigate('/shop')}
        />
        <div className="text-center mt-4">
          <Link to="/shop" className="text-sm font-semibold text-slate-900 hover:underline">
            ← Back to Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price = 0,
    discountPrice,
    category,
    sizes = ['S', 'M', 'L', 'XL'],
    colors = ['Black'],
    stock = 0,
    images = [],
    featured,
    isNewArrival,
    rating = 5,
    numReviews = 0
  } = product;

  const hasDiscount = discountPrice && Number(discountPrice) > 0 && Number(discountPrice) < Number(price);
  const activePrice = hasDiscount ? Number(discountPrice) : Number(price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(price) - Number(discountPrice)) / Number(price)) * 100)
    : 0;

  const productImages = images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'];

  const currentImage = productImages[selectedImageIndex] || productImages[0];
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize || sizes[0], selectedColor || colors[0], quantity);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast("Please provide a review comment.", "error");
      return;
    }

    try {
      setSubmittingReview(true);
      await addReview({
        productId: id,
        productName: name,
        userId: currentUser ? currentUser.uid : 'guest',
        userName: reviewerName || userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Verified Customer',
        userEmail: currentUser?.email || '',
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      showToast("Review submitted successfully! Firestore updated.", "success");
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast("Failed to submit review. Try again.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-slate-900 transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${category}`} className="hover:text-slate-900 transition-colors capitalize">
            {category || 'Streetwear'}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Image Gallery Column */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Large Image */}
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={currentImage}
                alt={name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
                }}
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="px-3 py-1 text-xs font-extrabold bg-rose-600 text-white rounded-full shadow-md">
                    -{discountPercent}% OFF
                  </span>
                )}
                {featured && (
                  <span className="px-3 py-1 text-xs font-bold bg-amber-500 text-white rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured
                  </span>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-4 py-2 bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg">
                    Currently Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-slate-950 shadow-md scale-95'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${name} preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              
              {/* Category & Rating */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-800 rounded-full">
                  {category || 'Streetwear'}
                </span>

                <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{rating || 5.0}</span>
                  <span className="text-slate-400 font-normal text-xs">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {name}
              </h1>

              {/* Pricing Section */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-950">
                  ${activePrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-slate-400 line-through font-normal">
                    ${Number(price).toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Save ${(Number(price) - Number(discountPrice)).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed pt-2">
                {description || "Crafted from custom heavyweight cotton tailored to a signature relaxed drop-shoulder silhouette."}
              </p>

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Select Size: <span className="text-slate-600 font-normal">{selectedSize}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-[48px] h-11 px-4 rounded-xl text-xs font-bold transition-all border ${
                          selectedSize === s
                            ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {colors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Color: <span className="text-slate-600 font-normal">{selectedColor}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((col) => {
                      const matchedVariant = Array.isArray(product.variants) 
                        ? product.variants.find(v => v.color?.toLowerCase() === col?.toLowerCase() && v.image)
                        : null;

                      return (
                        <button
                          key={col}
                          onClick={() => {
                            setSelectedColor(col);
                            if (matchedVariant?.image) {
                              const imgIdx = productImages.indexOf(matchedVariant.image);
                              if (imgIdx !== -1) setSelectedImageIndex(imgIdx);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            selectedColor === col
                              ? 'bg-slate-950 border-slate-950 text-white font-semibold shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {matchedVariant?.image && (
                            <img src={matchedVariant.image} alt={col} className="w-3.5 h-3.5 rounded-full object-cover" />
                          )}
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="pt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-semibold text-slate-700">
                  {stock > 0 ? `In Stock (${stock} available in Firestore)` : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity and Add to Cart Section */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                {/* Quantity modifier */}
                <div className="flex items-center border border-slate-200 rounded-2xl p-1 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="p-2 text-slate-600 hover:text-slate-950 disabled:opacity-30 rounded-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={isOutOfStock || quantity >= stock}
                    className="p-2 text-slate-600 hover:text-slate-950 disabled:opacity-30 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 w-full py-4 bg-slate-950 hover:bg-black disabled:bg-slate-300 text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
                </button>
              </div>

            </div>

            {/* Value Guarantees list */}
            <div className="border-t border-gray-100 pt-6 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-800">Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-800">30-Day Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-slate-700" />
                <span className="text-[11px] font-semibold text-slate-800">100% Cotton</span>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Reviews Section (From Firestore collection 'reviews') */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Customer Reviews</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic customer feedback from Firestore ({reviews.length} total)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-extrabold text-slate-900">{rating || 5.0} out of 5</span>
            </div>
          </div>

          {/* Write a Review Form */}
          <form onSubmit={handleReviewSubmit} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Write a Dynamic Review</h4>
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setReviewRating(s)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            {!currentUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review</label>
              <textarea
                rows="3"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts on the fit, fabric quality, and style..."
                required
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReview ? 'Submitting to Firestore...' : 'Submit Review'}</span>
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No reviews yet for this product. Be the first to leave one!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                        {rev.userName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{rev.userName}</span>
                    </div>

                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className={`w-3.5 h-3.5 ${
                            st <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-9">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
