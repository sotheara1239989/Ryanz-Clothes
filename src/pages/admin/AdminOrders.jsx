import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  User, 
  MapPin, 
  ChevronDown,
  Eye,
  X,
  CreditCard
} from 'lucide-react';
import { listenToAllOrders, updateOrderStatus } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllOrders(
      (allOrders) => {
        setOrders(allOrders);
        setLoading(false);
      },
      (err) => {
        console.error("Orders stream error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to "${newStatus}" in Firestore!`, "success");
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = o.id.toLowerCase().includes(term);
      const matchName = o.customerName?.toLowerCase().includes(term);
      const matchEmail = o.customerEmail?.toLowerCase().includes(term);
      if (!matchId && !matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Orders Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time immutable order snapshots recorded under <code className="text-emerald-400 font-mono">orders/</code>
          </p>
        </div>

        <div className="text-xs font-bold bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-slate-300">
          Total Orders: <span className="text-emerald-400">{orders.length}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Syncing live orders with Cloud Firestore..." />
      ) : filteredOrders.length > 0 ? (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Items Snapshot</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Live Status</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Order ID */}
                      <td className="py-4 px-6 font-mono text-emerald-400 font-bold">
                        #{order.id.slice(0, 8)}...
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-xs">{order.customerName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{order.customerEmail}</div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-400">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>

                      {/* Items Snapshot */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{order.items?.length || 0}</span>
                          <span className="text-slate-500">items</span>
                          <div className="flex -space-x-2 ml-1">
                            {order.items?.slice(0, 3).map((it, idx) => (
                              <img
                                key={idx}
                                src={it.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                                alt="item"
                                className="w-6 h-6 rounded-full border border-slate-900 object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 font-extrabold text-white">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Live Status Selector */}
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 focus:outline-none cursor-pointer ${
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
                      </td>

                      {/* View Details modal trigger */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800 text-center text-slate-400 text-xs">
          No orders found matching the filter.
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Firestore Order Document
                </span>
                <h3 className="text-lg font-bold text-white font-mono">
                  #{selectedOrderDetails.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Customer Info</span>
                </div>
                <p className="text-slate-300 font-semibold">{selectedOrderDetails.customerName}</p>
                <p className="text-slate-400">{selectedOrderDetails.customerEmail}</p>
                <p className="text-slate-400">{selectedOrderDetails.customerPhone || 'No phone provided'}</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-slate-300">{selectedOrderDetails.shippingAddress?.street}</p>
                <p className="text-slate-400">
                  {selectedOrderDetails.shippingAddress?.city}, {selectedOrderDetails.shippingAddress?.state} {selectedOrderDetails.shippingAddress?.zipCode}
                </p>
                <p className="text-slate-400">{selectedOrderDetails.shippingAddress?.country}</p>
              </div>
            </div>

            {/* Purchased Items Snapshot */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Purchased Snapshot Breakdown
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedOrderDetails.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'}
                      alt={item.productName}
                      className="w-12 h-14 object-cover rounded-lg bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white truncate">{item.productName}</h5>
                      <p className="text-[11px] text-slate-400">
                        Size: <strong className="text-slate-200">{item.selectedSize}</strong> • Color: <strong className="text-slate-200">{item.selectedColor}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">
                        {item.quantity} × ${Number(item.price).toFixed(2)}
                      </span>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        = ${(item.quantity * Number(item.price)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Status Updater */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400">Payment: </span>
                <strong className="text-slate-200">{selectedOrderDetails.paymentMethod}</strong>
              </div>
              <div className="text-base font-extrabold text-white">
                Total: <span className="text-emerald-400">${Number(selectedOrderDetails.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
