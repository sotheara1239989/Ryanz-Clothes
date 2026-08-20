import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  ArrowRight, 
  Plus, 
  Layers, 
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Truck
} from 'lucide-react';
import { listenToProducts } from '../../services/productService';
import { listenToAllOrders, updateOrderStatus } from '../../services/orderService';
import { listenToUsers } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';


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

  // Computed Business Metrics
  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'cancelled'), [orders]);
  
  const totalRevenue = useMemo(() => {
    return activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [activeOrders]);

  const averageOrderValue = useMemo(() => {
    if (activeOrders.length === 0) return 0;
    return totalRevenue / activeOrders.length;
  }, [activeOrders, totalRevenue]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const processingOrders = useMemo(() => orders.filter(o => o.status === 'processing'), [orders]);
  const shippedOrders = useMemo(() => orders.filter(o => o.status === 'shipped'), [orders]);
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'delivered'), [orders]);

  const lowStockProducts = useMemo(() => products.filter(p => Number(p.stock) <= 5), [products]);
  const activeProducts = useMemo(() => products.filter(p => p.isActive !== false), [products]);

  // Category Distribution Calculation
  const categoryStats = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const cat = (p.category || 'streetwear').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = products.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [products]);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to "${newStatus}".`, 'success');
    } catch (err) {
      console.error("Status change error:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Connecting to Firestore..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Store performance overview, inventory analytics, and recent sales
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/categories"
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span>Avg. Order:</span>
              <strong className="text-gray-900 font-semibold">${averageOrderValue.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Order Volume */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">
              {orders.length}
            </div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              {pendingOrders.length + processingOrders.length} in fulfillment pipeline
            </div>
          </div>
        </div>

        {/* Active Catalog */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Catalog Size</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">
              {products.length}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {activeProducts.length} published &bull; {products.length - activeProducts.length} draft
            </div>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Customer Base</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900">
              {users.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              Registered shopper accounts
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics & Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Order Fulfillment Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Fulfillment Distribution
              </h3>
              <p className="text-xs text-gray-900 font-semibold mt-0.5">
                {deliveredOrders.length} Completed of {orders.length || 0} Total Orders
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              {orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}% Delivered
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${orders.length ? (deliveredOrders.length / orders.length) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all" 
              title={`Delivered: ${deliveredOrders.length}`}
            />
            <div 
              style={{ width: `${orders.length ? (shippedOrders.length / orders.length) * 100 : 0}%` }}
              className="bg-blue-500 h-full transition-all" 
              title={`Shipped: ${shippedOrders.length}`}
            />
            <div 
              style={{ width: `${orders.length ? (processingOrders.length / orders.length) * 100 : 0}%` }}
              className="bg-amber-400 h-full transition-all" 
              title={`Processing: ${processingOrders.length}`}
            />
            <div 
              style={{ width: `${orders.length ? (pendingOrders.length / orders.length) * 100 : 0}%` }}
              className="bg-zinc-300 h-full transition-all" 
              title={`Pending: ${pendingOrders.length}`}
            />
          </div>

          {/* Status Breakdown Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-gray-600">Delivered ({deliveredOrders.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-gray-600">Shipped ({shippedOrders.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-gray-600">Processing ({processingOrders.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 shrink-0" />
              <span className="text-gray-600">Pending ({pendingOrders.length})</span>
            </div>
          </div>
        </div>

        {/* Catalog Categories Share */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Catalog Share by Category
              </h3>
              <p className="text-xs text-gray-900 font-semibold mt-0.5">
                Top apparel drops in live catalog
              </p>
            </div>
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
            >
              All Categories &rarr;
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {categoryStats.length === 0 ? (
              <p className="text-gray-400 py-4 text-center">No categories active yet.</p>
            ) : (
              categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-800">{cat.name}</span>
                    <span className="text-gray-500">{cat.count} items ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders Section */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Customer Purchases</h3>
              <p className="text-xs text-gray-500">Live order stream across storefront</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-gray-900 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No customer orders received yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-700 font-medium">&bull; {order.customerName || 'Customer'}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {order.items?.length || 0} item(s) &bull; Total: <strong className="text-gray-900 font-semibold">${Number(order.totalAmount || 0).toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        order.status === 'processing' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        order.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <Link
                      to="/admin/orders"
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-gray-900">Inventory Alerts</h3>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
              {lowStockProducts.length} low stock
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              All apparel items are sufficiently stocked.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">{prod.name}</div>
                    <div className="text-[11px] text-gray-500">${Number(prod.price).toFixed(2)}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                    {prod.stock} left
                  </span>
                </div>
              ))}

              <Link
                to="/admin/products"
                className="block text-center text-xs font-semibold text-gray-600 hover:text-gray-900 pt-2 transition-colors"
              >
                Manage Inventory &rarr;
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
