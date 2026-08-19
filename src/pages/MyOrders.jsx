import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ArrowRight, 
  ShoppingBag,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listenToUserOrders } from '../services/orderService';
import { normalizeImageUrl } from '../services/cjDropshippingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export const MyOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToUserOrders(
      currentUser.uid,
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
  }, [currentUser]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Order History</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time purchase snapshots synced directly from Firestore
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <LoadingSpinner message="Fetching your orders from Firestore..." />
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">Order #{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed on: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500">Total Charged:</span>
                    <div className="text-lg font-extrabold text-slate-950">
                      ${Number(order.totalAmount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Live Shipment Tracking Banner */}
                {order.trackingNumber && (
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>Carrier: {order.trackingCarrier || 'USPS / CJ Packet'}</span>
                          <span className="font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                            {order.trackingNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">Your package has been dispatched from warehouse.</p>
                      </div>
                    </div>

                    <a
                      href={order.trackingUrl || `https://www.17track.net/en/track?nums=${order.trackingNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span>Track Live Package</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Items Snapshot */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Purchased Items Snapshot
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-14 h-16 object-cover rounded-xl bg-gray-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                          <p className="text-[11px] text-slate-500">
                            Size: <strong className="text-slate-800">{item.selectedSize}</strong> • Color: <strong className="text-slate-800">{item.selectedColor}</strong>
                          </p>
                          <p className="text-[11px] font-semibold text-slate-900 mt-0.5">
                            {item.quantity} × ${Number(item.price).toFixed(2)} = ${(item.quantity * Number(item.price)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Payment Footer info */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
                  <div>
                    <span>Shipping To: </span>
                    <strong className="text-slate-800">
                      {order.customerName} ({order.shippingAddress?.street}, {order.shippingAddress?.city})
                    </strong>
                  </div>
                  <div>
                    <span>Payment Method: </span>
                    <strong className="text-slate-800">{order.paymentMethod}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center">
            <EmptyState
              icon={Package}
              title="No past orders found"
              description="When you purchase dynamic products, your orders will be recorded and displayed here with live tracking status."
              actionText="Shop Now"
              actionLink="/shop"
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrders;
