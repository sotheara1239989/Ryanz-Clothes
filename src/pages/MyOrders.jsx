import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ArrowRight, 
  ShoppingBag,
  Search,
  LogIn,
  MapPin,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listenToUserOrders, getOrderById } from '../services/orderService';
import { normalizeImageUrl } from '../services/cjDropshippingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export const MyOrders = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('id') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchOrderId, setSearchOrderId] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    if (initialOrderId) {
      handleTrackOrder(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      const unsubscribe = listenToUserOrders(
        currentUser.uid,
        currentUser.email,
        (userOrders) => {
          setOrders(userOrders);
          setLoading(false);
        },
        (err) => {
          console.error("Failed to load user orders:", err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // Guest: Load any recent order IDs placed on this browser session
      const loadRecentGuestOrders = async () => {
        try {
          const recentIds = JSON.parse(localStorage.getItem('ryanz_recent_orders') || '[]');
          if (recentIds.length > 0) {
            setLoading(true);
            const fetched = [];
            for (const id of recentIds.slice(0, 5)) {
              try {
                const ord = await getOrderById(id);
                if (ord) fetched.push(ord);
              } catch (e) {
                // skip
              }
            }
            setOrders(fetched);
          } else {
            setOrders([]);
          }
        } catch (e) {
          console.warn("Could not read recent orders:", e);
        } finally {
          setLoading(false);
        }
      };

      loadRecentGuestOrders();
    }
  }, [currentUser]);

  const handleTrackOrder = async (orderIdToSearch) => {
    const id = (orderIdToSearch || searchOrderId).trim();
    if (!id) {
      setTrackingError("Please enter a valid Order ID or Number.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackedOrder(null);

    try {
      const order = await getOrderById(id);
      if (order) {
        setTrackedOrder(order);
      } else {
        setTrackingError(`No order found with ID "${id}". Please check your order confirmation.`);
      }
    } catch (err) {
      console.error("Error looking up order:", err);
      setTrackingError("Could not retrieve order. Please verify the ID and try again.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const renderTimeline = (status) => {
    const steps = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const getStepIndex = (st) => {
      switch (st) {
        case 'pending': return 0;
        case 'processing': return 1;
        case 'shipped': return 2;
        case 'delivered': return 3;
        default: return 0;
      }
    };

    const currentIdx = getStepIndex(status);

    return (
      <div className="py-4 px-2 sm:px-4">
        <div className="relative">
          {/* Background Track Line - centered on 32px circles at top: 16px */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

          {/* Active Emerald Progress Line */}
          <div 
            className="absolute top-4 left-6 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-500 z-0" 
            style={{ 
              width: currentIdx === 0 
                ? '0%' 
                : `calc(${((currentIdx) / (steps.length - 1)) * 100}% - 24px)` 
            }}
          />

          {/* Steps */}
          <div className="relative flex justify-between z-10">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center min-w-[70px]">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50' 
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span 
                    className={`text-xs mt-2 font-medium ${
                      isCurrent 
                        ? 'text-emerald-700 font-bold' 
                        : isCompleted 
                          ? 'text-gray-900 font-semibold' 
                          : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSingleOrderCard = (order) => (
    <div key={order.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono font-bold">Order #{order.id}</span>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-500">Total Amount:</span>
          <div className="text-xl font-extrabold text-gray-900">
            ${Number(order.totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Visual Status Timeline */}
      {order.status !== 'cancelled' && renderTimeline(order.status)}

      {/* Live Carrier Tracking Banner */}
      {order.trackingNumber && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                <span>Carrier: {order.trackingCarrier || 'USPS / CJ Packet Express'}</span>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                  {order.trackingNumber}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">Package in transit with active live updates.</p>
            </div>
          </div>

          <a
            href={order.trackingUrl || `https://www.17track.net/en/track?nums=${order.trackingNumber}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Track Live Package</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Items Snapshot */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Purchased Items ({order.items?.length || 0})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <img
                src={normalizeImageUrl(item.image)}
                alt={item.productName}
                referrerPolicy="no-referrer"
                className="w-14 h-16 object-cover rounded-xl bg-gray-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-gray-900 truncate">{item.productName}</h5>
                <p className="text-[11px] text-gray-500">
                  Size: <strong className="text-gray-800">{item.selectedSize}</strong> • Color: <strong className="text-gray-800">{item.selectedColor}</strong>
                </p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {item.quantity} × ${Number(item.price).toFixed(2)} = ${(item.quantity * Number(item.price)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping & Payment Footer Info */}
      <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span>Shipping To: </span>
          <strong className="text-gray-800">
            {order.customerName} ({order.shippingAddress?.street}, {order.shippingAddress?.city})
          </strong>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
          <span>Payment: </span>
          <strong className="text-gray-800">{order.paymentMethod}</strong>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Order Tracking &amp; Status</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Enter your order number below to check live shipping status, or sign in to view your complete order history.
          </p>
        </div>

        {/* Quick Order Lookup Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleTrackOrder(); }} 
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order ID or Number (e.g. RC-xxx or order ID)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-6 py-3.5 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
            >
              {trackingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {trackingError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trackingError}</span>
            </div>
          )}
        </div>

        {/* Display Tracked Order Result (if searched) */}
        {trackedOrder && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Search Result</h3>
              <button 
                onClick={() => setTrackedOrder(null)} 
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                Clear Search
              </button>
            </div>
            {renderSingleOrderCard(trackedOrder)}
          </div>
        )}

        {/* Not Logged In Helper Card */}
        {!currentUser && !trackedOrder && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Have an account with us?</h3>
              <p className="text-xs text-gray-500">
                Sign in to view all your past orders, manage your profile, and receive automatic shipping tracking notifications.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login?redirect=/my-orders"
                className="px-6 py-3 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </Link>
              <Link
                to="/shop"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Store</span>
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated User Orders List */}
        {currentUser && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Your Past Orders</h2>
                <p className="text-xs text-gray-500">Orders associated with {currentUser.email}</p>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-black hover:underline flex items-center gap-1"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner message="Fetching your orders..." />
            ) : orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map(order => renderSingleOrderCard(order))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center">
                <EmptyState
                  icon={Package}
                  title="No orders yet"
                  description="You haven't placed any orders with this account yet. Discover our latest streetwear drops."
                  actionText="Shop Now"
                  actionLink="/shop"
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrders;
