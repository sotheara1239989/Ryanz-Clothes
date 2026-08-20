import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  ArrowLeft 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { normalizeImageUrl } from '../services/cjDropshippingService';
import EmptyState from '../components/common/EmptyState';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, totalItems, syncWithFirestore } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    syncWithFirestore();
  }, []);

  const shippingFee = 0;
  const totalAmount = subtotal;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <EmptyState
            icon={ShoppingBag}
            title="Your Shopping Bag is Empty"
            description="Explore our latest collection of oversized streetwear tees, hoodies, and jackets."
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

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">100% Free Worldwide Express Delivery</h4>
              <p className="text-[11px] text-emerald-700">Complimentary delivery automatically applied to every destination.</p>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase bg-emerald-200/70 text-emerald-800 px-3 py-1 rounded-lg shrink-0 hidden sm:inline-block">
            FREE $0.00
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => {
              const itemTotal = item.activePrice * item.quantity;

              return (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm flex gap-4 sm:gap-6 items-center"
                >
                  <Link
                    to={`/product/${item.productId}`}
                    className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0 block"
                  >
                    <img
                      src={normalizeImageUrl(item.image)}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <Link
                        to={`/product/${item.productId}`}
                        className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors line-clamp-1 block"
                      >
                        {item.name}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {item.selectedSize && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-900 pt-1">
                        ${Number(item.activePrice).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
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

                      <div className="text-sm font-bold text-slate-900 min-w-[70px] text-right">
                        ${itemTotal.toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedColor)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-950 border-b border-gray-100 pb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Estimated Shipping</span>
                  <span className="font-bold">FREE ($0.00)</span>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-base font-extrabold text-slate-950">
                  <span>Total Amount</span>
                  <span className="text-xl">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 bg-slate-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  Taxes &amp; zero-cost delivery calculated automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
