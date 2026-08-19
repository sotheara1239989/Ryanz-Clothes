import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../services/orderService';
import { normalizeImageUrl } from '../services/cjDropshippingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const Checkout = () => {
  const { cartItems, clearCart, syncWithFirestore } = useCart();
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: userProfile?.name || currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: userProfile?.phone || '',
    street: userProfile?.shippingAddress?.street || '',
    city: userProfile?.shippingAddress?.city || '',
    state: userProfile?.shippingAddress?.state || '',
    zipCode: userProfile?.shippingAddress?.zipCode || '',
    country: userProfile?.shippingAddress?.country || 'United States',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery (COD)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Sync and verify cart items with Firestore upon opening Checkout
  useEffect(() => {
    const verify = async () => {
      setIsVerifying(true);
      await syncWithFirestore();
      setIsVerifying(false);
    };
    verify();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      showToast("Your cart is empty.", "error");
      navigate('/shop');
      return;
    }

    if (!formData.name || !formData.email || !formData.street || !formData.city) {
      showToast("Please fill in all required shipping fields.", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create verified order in Firestore
      const createdOrder = await createOrder({
        items: cartItems,
        customerInfo: formData,
        paymentMethod: paymentMethod,
        userId: currentUser ? currentUser.uid : 'guest'
      });

      // Clear local cart
      clearCart();
      setOrderComplete(createdOrder);
      showToast("Order placed successfully in Firestore!", "success");
    } catch (error) {
      console.error("Order placement failed:", error);
      showToast(error.message || "Failed to place order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return <LoadingSpinner fullPage message="Verifying store catalog and live Firestore prices..." />;
  }

  // Order Success Screen
  if (orderComplete) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-gray-50 py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Order Confirmed & Stored
            </span>
            <h1 className="text-3xl font-extrabold text-slate-950 mt-1">Thank You For Your Order!</h1>
            <p className="text-xs text-slate-500 mt-2">
              Order ID: <span className="font-mono font-bold text-slate-800">{orderComplete.id}</span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-2 border border-slate-100">
            <div className="flex justify-between font-semibold text-slate-900 border-b border-slate-200 pb-2">
              <span>Items Snapshot:</span>
              <span>{orderComplete.items?.length} items</span>
            </div>
            {orderComplete.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span>{it.quantity}x {it.productName} ({it.selectedSize})</span>
                <span className="font-semibold text-slate-900">${it.itemTotal?.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-950">
              <span>Total Charged:</span>
              <span>${orderComplete.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              to="/my-orders"
              className="flex-1 py-3.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Track in My Orders</span>
            </Link>

            <Link
              to="/shop"
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.activePrice * item.quantity), 0);
  const shippingFee = subtotal > 100 ? 0 : 10;
  const totalAmount = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="p-2 bg-white rounded-xl border border-gray-200 text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">Secure Checkout</h1>
            <p className="text-xs text-slate-500">
              All prices and products verified with Firestore database
            </p>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Shipping & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customer Information */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-slate-700" />
                <span>Shipping Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ryan Miller"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ryan@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    placeholder="123 Streetwear Ave, Apt 4B"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Los Angeles"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="CA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal / Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="90001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Cash On Delivery (COD)' ? 'border-slate-950 bg-slate-50 shadow-sm' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Cash On Delivery (COD)'}
                      onChange={() => setPaymentMethod('Cash On Delivery (COD)')}
                      className="accent-slate-950"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Cash On Delivery (COD)</div>
                      <div className="text-[11px] text-slate-500">Pay cash upon arrival of your parcel</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border">
                    Popular
                  </span>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Credit Card' ? 'border-slate-950 bg-slate-50 shadow-sm' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Credit Card'}
                      onChange={() => setPaymentMethod('Credit Card')}
                      className="accent-slate-950"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Credit / Debit Card</div>
                      <div className="text-[11px] text-slate-500">Instant test card payment simulator</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-slate-400" />
                </label>
              </div>
            </div>

          </div>

          {/* Live Order Snapshot & Verification Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-base font-bold text-slate-950 pb-4 border-b border-gray-100">
                Order Items Snapshot ({cartItems.length})
              </h3>

              {/* Items List Snapshot Preview */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-1">
                    <img
                      src={normalizeImageUrl(item.image)}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-14 object-cover rounded-lg bg-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {item.selectedSize} / {item.selectedColor} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-950 shrink-0">
                      ${(item.activePrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-extrabold text-slate-950">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-950 hover:bg-black disabled:bg-slate-400 text-white text-sm font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Order in Firestore...' : `Complete Order ($${totalAmount.toFixed(2)})`}</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                By completing your order, an immutable snapshot document is saved to Firestore under <code className="text-slate-600 font-mono">orders/&#123;orderId&#125;</code>.
              </p>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Checkout;
