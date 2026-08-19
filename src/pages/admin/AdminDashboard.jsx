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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Store Performance & Metrics
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Real-time aggregate data and store inventory analytics
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/categories"
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        
        {/* Total Revenue */}
        <div className="bg-[#0c121e] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-500/20 shadow-lg shadow-emerald-950/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/15 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Revenue</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 relative z-10">
            <div className="text-lg sm:text-3xl font-black text-white tracking-tight truncate">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-[9px] sm:text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1 truncate">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="truncate">Live orders</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#0c121e] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-500/20 shadow-lg shadow-sky-950/20 relative overflow-hidden group hover:border-sky-500/40 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/15 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Orders</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 relative z-10">
            <div className="text-lg sm:text-3xl font-black text-white tracking-tight">{orders.length}</div>
            <div className="text-[9px] sm:text-[11px] text-amber-400 font-bold mt-1 flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">{pendingOrders.length} pending</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-[#0c121e] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-500/20 shadow-lg shadow-purple-950/20 relative overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/15 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Catalog</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 relative z-10">
            <div className="text-lg sm:text-3xl font-black text-white tracking-tight">{products.length}</div>
            <div className="text-[9px] sm:text-[11px] text-purple-300 font-bold mt-1 flex items-center gap-1 truncate">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-purple-400" />
              <span className="truncate">{products.filter(p => p.isActive !== false).length} active</span>
            </div>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-[#0c121e] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-500/20 shadow-lg shadow-amber-950/20 relative overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Customers</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4 relative z-10">
            <div className="text-lg sm:text-3xl font-black text-white tracking-tight">{users.length}</div>
            <div className="text-[9px] sm:text-[11px] text-amber-300 font-bold mt-1 flex items-center gap-1 truncate">
              <Users className="w-3 h-3 shrink-0 text-amber-400" />
              <span className="truncate">Accounts</span>
            </div>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Section */}
        <div className="lg:col-span-8 bg-[#0c121e] rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-extrabold text-white">Recent Orders Stream</h3>
              <p className="text-xs text-slate-400">Live order activity across customer storefront</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No customer orders received yet. Live orders will populate automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900/60 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-200 font-bold">• {order.customerName || 'Customer'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {order.items?.length || 0} item(s) • Total: <strong className="text-emerald-400 font-black">${Number(order.totalAmount || 0).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${
                        order.status === 'delivered' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                        order.status === 'shipped' ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' :
                        order.status === 'cancelled' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <option value="pending" className="bg-slate-900 text-white">Pending</option>
                      <option value="processing" className="bg-slate-900 text-white">Processing</option>
                      <option value="shipped" className="bg-slate-900 text-white">Shipped</option>
                      <option value="delivered" className="bg-slate-900 text-white">Delivered</option>
                      <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-[#0c121e] rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-white">Inventory Alerts</h3>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-lg">
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
                  className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={normalizeImageUrl((prod.images && prod.images[0]))}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-12 object-cover rounded-xl bg-slate-800 shrink-0 border border-slate-700/60 shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" fill="%231e293b"><rect width="40" height="48"/><text x="50%" y="50%" fill="%2364748b" font-size="8" text-anchor="middle" dominant-baseline="middle">N/A</text></svg>');
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">${Number(prod.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl shrink-0 ${
                    prod.stock <= 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {prod.stock <= 0 ? 'Out of Stock' : `${prod.stock} left`}
                  </span>
                </div>
              ))}

              <Link
                to="/admin/products"
                className="block text-center text-xs font-bold text-slate-400 hover:text-emerald-400 pt-2 transition-colors"
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
