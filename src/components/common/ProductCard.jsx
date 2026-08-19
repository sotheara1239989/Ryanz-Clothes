import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  if (!product) return null;

  const {
    id,
    name,
    price,
    discountPrice,
    images = [],
    category,
    sizes = [],
    colors = [],
    stock = 0,
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

  const primaryImage = (images && images.length > 0 && images[0]) 
    ? images[0] 
    : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';

  const isOutOfStock = stock <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, sizes[0] || 'M', colors[0] || 'Default', 1);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container */}
      <Link to={`/product/${id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 block">
        <img
          src={primaryImage}
          alt={name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {featured && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500 text-white rounded-full shadow-sm">
              Featured
            </span>
          )}
          {isNewArrival && !hasDiscount && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded-full shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick View / Add to Cart Floating Action */}
        {!isOutOfStock && (
          <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleQuickAdd}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-950/90 hover:bg-black text-white text-xs font-semibold rounded-xl backdrop-blur shadow-md transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Quick Add
            </button>
          </div>
        )}
      </Link>

      {/* Details Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[10px] text-slate-500">
              {category || 'Streetwear'}
            </span>
            {numReviews > 0 && (
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-gray-400 text-[10px]">({numReviews})</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <Link
            to={`/product/${id}`}
            className="block font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2"
          >
            {name}
          </Link>
        </div>

        {/* Price & Stock info */}
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900">
              ${activePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through font-normal">
                ${Number(price).toFixed(2)}
              </span>
            )}
          </div>

          {stock > 0 && stock <= 5 && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {stock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
