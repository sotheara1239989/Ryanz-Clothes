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
  AlertCircle,
  Mail
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

      const createdOrder = await createOrder({
        items: cartItems,
        customerInfo: formData,
        paymentMethod: paymentMethod,
        userId: currentUser ? currentUser.uid : 'guest'
      });

      clearCart();
      setOrderComplete(createdOrder);

      try {
        const recent = JSON.parse(localStorage.getItem('ryanz_recent_orders') || '[]');
        if (!recent.includes(createdOrder.id)) {
          recent.unshift(createdOrder.id);
          localStorage.setItem('ryanz_recent_orders', JSON.stringify(recent.slice(0, 25)));
        }
      } catch (storageErr) {
        console.warn("Could not save recent order to localStorage:", storageErr);
      }

      showToast("Order placed successfully! Thank you for your purchase.", "success");
    } catch (error) {
      console.error("Error submitting order:", error);
      showToast("Failed to place order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return <LoadingSpinner fullPage message="Verifying stock and calculating landed totals..." />;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Order Confirmed
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Thank You For Your Order!</h1>
            <p className="text-xs text-gray-500 mt-1.5">
              Order ID: <span className="font-mono font-bold text-gray-900">{orderComplete.id}</span>
            </p>
          </div>

          {/* Email Confirmation Notice */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-left flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-gray-900">Confirmation Email Dispatched</div>
              <p className="text-gray-600">
                A digital receipt and live tracking link have been sent to{' '}
                <strong className="text-gray-900">{orderComplete.customerEmail || formData.email}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs text-gray-600 space-y-2 border border-gray-200">
            <div className="flex justify-between font-semibold text-gray-900 border-b border-gray-200 pb-2">
              <span>Items Snapshot:</span>
              <span>{orderComplete.items?.length} items</span>
            </div>
            {orderComplete.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span>{it.quantity}x {it.productName} ({it.selectedSize})</span>
                <span className="font-semibold text-gray-900">${it.itemTotal?.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
              <span>Total Charged:</span>
              <span>${orderComplete.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/my-orders?id=${orderComplete.id}`}
              className="flex-1 py-3 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Track in My Orders</span>
            </Link>

            <Link
              to="/shop"
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.activePrice * item.quantity), 0);
  const shippingFee = 0;
  const totalAmount = subtotal;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Secure Checkout</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Guaranteed 256-bit encrypted checkout &amp; fast order processing
            </p>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Shipping & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customer Information */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-600" />
                <span>Shipping Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ryan Miller"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ryan@example.com"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    placeholder="123 Streetwear Ave, Apt 4B"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Los Angeles"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="CA"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Postal / Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="90001"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'Cash On Delivery (COD)' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Cash On Delivery (COD)'}
                      onChange={() => setPaymentMethod('Cash On Delivery (COD)')}
                      className="accent-black w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Cash On Delivery (COD)</div>
                      <div className="text-[11px] text-gray-500">Pay cash upon arrival of your parcel</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 bg-white px-2.5 py-0.5 rounded border border-gray-200">
                    Popular
                  </span>
                </label>

                <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'Credit Card' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Credit Card'}
                      onChange={() => setPaymentMethod('Credit Card')}
                      className="accent-black w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Credit / Debit Card</div>
                      <div className="text-[11px] text-gray-500">Instant test card payment simulator</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-gray-400" />
                </label>
              </div>
            </div>

          </div>

          {/* Live Order Snapshot & Verification Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6 sticky top-24">
              <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">
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
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-gray-500">
                        {item.selectedSize} / {item.selectedColor} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 shrink-0">
                      ${(item.activePrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Worldwide Shipping</span>
                  <strong className="text-emerald-700 font-bold">FREE ($0.00)</strong>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Processing Order...' : `Complete Order ($${totalAmount.toFixed(2)})`}</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                By placing your order, you agree to Ryanz Clothes terms of service. You will receive an instant order confirmation and tracking ID.
              </p>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Checkout;
