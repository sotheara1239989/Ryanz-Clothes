import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  PlusCircle, 
  Layers, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { listenToProducts } from '../../services/productService';
import { listenToAllOrders, updateOrderStatus } from '../../services/orderService';
import { listenToUsers } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { isFirebaseConfigured } from '../../firebase/config';
import { normalizeImageUrl } from '../../services/cjDropshippingService';

export const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);

    const unsubProducts = listenToProducts((prods) => setProducts(prods));
    const unsubOrders = listenToAllOrders((ords) => {
      setOrders(ords);
      setLoading(false);
    });
    const unsubUsers = listenToUsers((usrs) => setUsers(usrs));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  // Compute live metrics
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockProducts = products.filter(p => Number(p.stock) <= 5);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to "${newStatus}" in Firestore.`, 'success');
    } catch (err) {
      console.error("Status change error:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Connecting to Firestore live streams..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Connect Your Firebase Project</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste your Firebase credentials to enable live Cloud Firestore database & storage synchronization.
              </p>
            </div>
          </div>
          <Link
            to="/admin/firebase-setup"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shrink-0 text-center"
          >
            Setup Firebase Connection →
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate data sourced directly from Cloud Firestore collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Manage Categories</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Revenue */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Gross Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Calculated from live orders</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">{orders.length}</div>
            <div className="text-[11px] text-amber-400 font-medium mt-1">
              {pendingOrders.length} pending fulfillment
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Live Products</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">{products.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {products.filter(p => p.isActive !== false).length} active in storefront
            </div>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Registered Users</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">{users.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Firestore users collection
            </div>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Section */}
        <div className="lg:col-span-8 bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Recent Orders Stream</h3>
              <p className="text-xs text-slate-400">Updates live as customers checkout</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View All Orders
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No customer orders received yet. Place a test order in the storefront!
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">#{order.id.slice(0, 8)}...</span>
                      <span className="text-xs text-slate-300 font-semibold">• {order.customerName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {order.items?.length || 0} item(s) • Total: <strong className="text-emerald-400">${Number(order.totalAmount || 0).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 focus:outline-none cursor-pointer ${
                        order.status === 'delivered' ? 'text-emerald-400' :
                        order.status === 'shipped' ? 'text-blue-400' :
                        order.status === 'cancelled' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Low Stock Alerts</h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
              {lowStockProducts.length}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              All inventory levels are healthy!
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={normalizeImageUrl((prod.images && prod.images[0]))}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-12 object-cover rounded-lg bg-slate-800 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" fill="%231e293b"><rect width="40" height="48"/><text x="50%" y="50%" fill="%2364748b" font-size="8" text-anchor="middle" dominant-baseline="middle">N/A</text></svg>');
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400">${Number(prod.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                    prod.stock <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {prod.stock <= 0 ? 'Out of Stock' : `${prod.stock} left`}
                  </span>
                </div>
              ))}

              <Link
                to="/admin/products"
                className="block text-center text-xs font-semibold text-slate-400 hover:text-white pt-2 transition-colors"
              >
                Manage Inventory in Products →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
