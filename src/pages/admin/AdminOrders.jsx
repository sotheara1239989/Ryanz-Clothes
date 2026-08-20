import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  X,
  Send,
  RefreshCw,
  Loader2,
  Mail,
  ArrowRight
} from "lucide-react";
import {
  listenToAllOrders,
  updateOrderStatus,
} from "../../services/orderService";
import { normalizeImageUrl } from "../../services/cjDropshippingService";
import {
  syncOrderToCjFulfillment,
  syncCjOrderTracking,
} from "../../services/cjSyncService";
import {
  getEmailJsConfig,
  saveEmailJsConfig,
  testSendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} from "../../services/emailService";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [trackingSyncId, setTrackingSyncId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

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
      },
    );

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to "${newStatus}".`, "success");
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  const handleFulfillWithCj = async (orderId) => {
    try {
      setFulfillingId(orderId);
      const res = await syncOrderToCjFulfillment(orderId);

      try {
        const targetOrder = selectedOrderDetails || orders.find((o) => o.id === orderId);
        if (targetOrder) {
          await sendOrderStatusUpdateEmail(
            { ...targetOrder, status: "processing", cjOrderId: res.cjOrderId },
            "processing"
          );
        }
      } catch (emailErr) {
        console.warn("Could not dispatch email on CJ fulfill:", emailErr);
      }

      showToast(res.message || "Order submitted to CJ & customer notified!", "success");
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => ({
          ...prev,
          cjOrderId: res.cjOrderId,
          cjFulfillmentStatus: "submitted_to_cj",
          status: "processing",
        }));
      }
    } catch (err) {
      console.error("CJ Fulfillment Error:", err);
      showToast(err.message || "Failed to submit order to CJ.", "error");
    } finally {
      setFulfillingId(null);
    }
  };

  const handleSyncTracking = async (orderId) => {
    try {
      setTrackingSyncId(orderId);
      const res = await syncCjOrderTracking(orderId);
      if (res.success && res.trackingNumber) {
        showToast(`Tracking updated: ${res.trackingNumber} (${res.carrier})`, "success");
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails((prev) => ({
            ...prev,
            trackingNumber: res.trackingNumber,
            trackingCarrier: res.carrier,
            status: res.status,
          }));
        }
      } else {
        showToast(res.message || "No tracking available from CJ yet.", "info");
      }
    } catch (err) {
      console.error("Tracking Sync Error:", err);
      showToast(err.message || "Failed to sync tracking.", "error");
    } finally {
      setTrackingSyncId(null);
    }
  };

  const handleResendOrderEmail = async (order) => {
    try {
      setResendingId(order.id);
      await sendOrderConfirmationEmail(order);
      showToast(`Confirmation email resent to ${order.customerEmail}!`, "success");
    } catch (err) {
      console.error("Error resending email:", err);
      showToast("Failed to resend confirmation email.", "error");
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-md">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-md">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-md">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = o.id?.toLowerCase().includes(term);
      const matchName = o.customerName?.toLowerCase().includes(term);
      const matchEmail = o.customerEmail?.toLowerCase().includes(term);
      if (!matchId && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalOrders = orders.length;
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage customer checkouts, shipping status, and CJ fulfillment
          </p>
        </div>

        <div className="text-xs font-semibold bg-white px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 shadow-xs">
          Total Orders: <span className="text-gray-900 font-bold">{orders.length}</span>
        </div>
      </div>

      {/* Orders Quick Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Gross Revenue</span>
          <span className="font-bold text-emerald-950">${totalSales.toFixed(2)}</span>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <span className="text-amber-800 font-medium">Needs Fulfillment</span>
          <span className="font-bold text-amber-950">{pendingCount} orders</span>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <span className="text-blue-800 font-medium">In Transit</span>
          <span className="font-bold text-blue-950">{shippedCount} shipped</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">Completed</span>
          <span className="font-bold text-gray-900">{deliveredCount} delivered</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID or customer name..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="all">All Statuses</option>
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
        <LoadingSpinner message="Streaming customer orders..." />
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Order ID &amp; Date</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Total</th>
                  <th className="py-3.5 px-5">CJ Sync</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-gray-900">
                        #{order.id.slice(0, 8)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleDateString()
                          : "Recent"}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {order.customerEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-bold text-gray-900">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {order.items?.length || 0} items
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      {order.cjOrderId ? (
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          CJ #{order.cjOrderId.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">
                          Direct Store
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                          order.status === "delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          order.status === "shipped" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          order.status === "processing" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          order.status === "cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-xs shadow-xs">
          No customer orders found.
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-gray-900 font-mono">
                    Order #{selectedOrderDetails.id}
                  </h3>
                  {getStatusBadge(selectedOrderDetails.status)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placed on:{" "}
                  {selectedOrderDetails.createdAt?.toDate
                    ? selectedOrderDetails.createdAt.toDate().toLocaleString()
                    : "Recent"}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Customer
                </span>
                <div className="font-bold text-gray-900">
                  {selectedOrderDetails.customerName}
                </div>
                <div className="text-gray-600">
                  {selectedOrderDetails.customerEmail}
                </div>
                <div className="text-gray-500">
                  {selectedOrderDetails.customerPhone || "No phone provided"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Shipping Address
                </span>
                <div className="text-gray-800">
                  {selectedOrderDetails.shippingAddress?.street}
                </div>
                <div className="text-gray-600">
                  {selectedOrderDetails.shippingAddress?.city},{" "}
                  {selectedOrderDetails.shippingAddress?.state}{" "}
                  {selectedOrderDetails.shippingAddress?.zipCode}
                </div>
                <div className="text-gray-500">
                  {selectedOrderDetails.shippingAddress?.country || "United States"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Purchased Items ({selectedOrderDetails.items?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrderDetails.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-lg bg-gray-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-gray-900">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Size: {item.selectedSize} &bull; Color: {item.selectedColor} &bull; Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      ${(item.quantity * Number(item.price)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleResendOrderEmail(selectedOrderDetails)}
                disabled={resendingId === selectedOrderDetails.id}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                {resendingId === selectedOrderDetails.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span>Resend Email</span>
              </button>

              {!selectedOrderDetails.cjOrderId ? (
                <button
                  type="button"
                  onClick={() => handleFulfillWithCj(selectedOrderDetails.id)}
                  disabled={fulfillingId === selectedOrderDetails.id}
                  className="px-3.5 py-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {fulfillingId === selectedOrderDetails.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to CJ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Fulfill with CJ Dropshipping</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSyncTracking(selectedOrderDetails.id)}
                  disabled={trackingSyncId === selectedOrderDetails.id}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {trackingSyncId === selectedOrderDetails.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Sync CJ Tracking</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
