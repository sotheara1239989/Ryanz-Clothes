import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  ArrowLeft 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/common/EmptyState';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, totalItems, syncWithFirestore } = useCart();
  const navigate = useNavigate();

  // Re-sync with Firestore when visiting Cart page
  useEffect(() => {
    syncWithFirestore();
  }, []);

  const shippingFee = subtotal > 100 ? 0 : 10;
  const freeShippingThreshold = 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const totalAmount = subtotal + (cartItems.length > 0 ? shippingFee : 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <EmptyState
            icon={ShoppingBag}
            title="Your Shopping Bag is Empty"
            description="Explore our latest dynamic collection of oversized streetwear tees, hoodies, and jackets."
            actionText="Start Shopping"
            actionLink="/shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Shopping Bag</h1>
            <p className="text-xs text-slate-500 mt-1">
              Review your items ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>
                {remainingForFreeShipping === 0
                  ? 'You unlocked FREE Express Shipping!'
                  : `Add $${remainingForFreeShipping.toFixed(2)} more for FREE Shipping`}
              </span>
            </div>
            <span className="text-slate-400">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => {
              const itemTotal = item.activePrice * item.quantity;

              return (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm flex gap-4 sm:gap-6 items-center"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.productId}`}
                    className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0 block"
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Size: <strong className="text-slate-800">{item.selectedSize}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="text-slate-800">{item.selectedColor}</strong></span>
                    </div>

                    <div className="pt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        ${item.activePrice.toFixed(2)}
                      </span>
                      {item.discountPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-6 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-extrabold text-slate-950">
                        ${itemTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedColor)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-950 pb-4 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Taxes</span>
                  <span className="text-slate-400 font-medium">Calculated at checkout</span>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between text-base font-extrabold text-slate-950">
                  <span>Estimated Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-slate-950 hover:bg-black text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Live Firestore Price Verification Guaranteed</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Cart;
