import React, { useState, useEffect } from "react";
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
  CreditCard,
  Send,
  RefreshCw,
  ExternalLink,
  Loader2,
  Mail,
  Settings,
  Check,
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

  // Email Config & Test Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState(getEmailJsConfig());
  const [testEmailAddress, setTestEmailAddress] = useState(
    "ryanzkoztaora@gmail.com",
  );
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
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
      showToast(
        `Order status updated to "${newStatus}" and email dispatched!`,
        "success",
      );
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

      // Automatically send "Processing" status update email to customer
      try {
        const targetOrder =
          selectedOrderDetails || orders.find((o) => o.id === orderId);
        if (targetOrder) {
          await sendOrderStatusUpdateEmail(
            { ...targetOrder, status: "processing", cjOrderId: res.cjOrderId },
            "processing",
          );
        }
      } catch (emailErr) {
        console.warn("Could not dispatch email on CJ fulfill:", emailErr);
      }

      showToast(
        res.message ||
          "Order submitted to CJ & processing email sent to customer!",
        "success",
      );
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
        showToast(
          `Tracking updated: ${res.trackingNumber} (${res.carrier})`,
          "success",
        );
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

  const handleSaveEmailConfig = (e) => {
    e.preventDefault();
    saveEmailJsConfig(emailConfig);
    showToast("EmailJS credentials saved successfully!", "success");
  };

  const handleRunTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      showToast("Please enter an email address for testing.", "error");
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      // Save current input config first
      saveEmailJsConfig(emailConfig);
      const result = await testSendEmail(testEmailAddress.trim());
      setTestResult(result);
      if (result.success) {
        showToast(result.message, "success");
      } else {
        showToast(result.message, "error");
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      showToast("Test email failed: " + err.message, "error");
    } finally {
      setTestLoading(false);
    }
  };

  const handleResendOrderEmail = async (order) => {
    try {
      setResendingId(order.id);
      await sendOrderConfirmationEmail(order);
      showToast(
        `Confirmation email resent to ${order.customerEmail}!`,
        "success",
      );
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time orders stream, live fulfillment pipeline, and automated
            email notifications
          </p>
        </div>

        {/* <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEmailConfig(getEmailJsConfig());
              setIsEmailModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700/80 shadow-sm transition-all flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Email Settings &amp; Test</span>
          </button>

          <div className="text-xs font-black bg-[#0c121e] px-4 py-2 rounded-xl border border-slate-800/80 text-slate-300 shadow-sm">
            Total Orders: <span className="text-emerald-400">{orders.length}</span>
          </div>
        </div> */}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0c121e] p-4 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">
            Filter Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses ({orders.length})</option>
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
        <div className="bg-[#0c121e] rounded-2xl sm:rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="py-4 px-6">Order ID &amp; Date</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Items &amp; Total</th>
                  <th className="py-4 px-6">Fulfillment / CJ</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-white text-xs">
                        #{order.id.slice(0, 8)}...
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {order.createdAt?.toDate
                          ? order.createdAt
                              .toDate()
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                          : "Recent"}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-xs">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.customerEmail}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                        {order.shippingAddress?.city},{" "}
                        {order.shippingAddress?.country}
                      </div>
                    </td>

                    {/* Items & Total */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-xs">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) > 1 ? "s" : ""} (
                        {order.paymentMethod})
                      </div>
                    </td>

                    {/* Fulfillment status */}
                    <td className="py-4 px-6">
                      {order.trackingNumber ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">
                            Shipped
                          </span>
                          <div className="text-[10px] font-mono text-slate-300 truncate max-w-[120px]">
                            {order.trackingNumber}
                          </div>
                        </div>
                      ) : order.cjOrderId ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Clock className="w-3 h-3" /> CJ Processing
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Unfulfilled
                        </span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-6">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        className="bg-slate-900 text-xs font-bold text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0c121e] rounded-3xl p-12 border border-slate-800/80 text-center text-slate-400 text-xs">
          No orders found matching your search.
        </div>
      )}

      {/* Email Configuration & Live Test Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0c121e] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-slate-800 shadow-2xl text-slate-200 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Email Automation &amp; Diagnostics
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure EmailJS credentials and run real-time delivery
                    tests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* EmailJS Credentials Form */}
            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  EmailJS Service Keys
                </h4>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                    Service ID
                  </label>
                  <input
                    type="text"
                    value={emailConfig.serviceId}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        serviceId: e.target.value,
                      }))
                    }
                    placeholder="e.g. service_xxxxxxx"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={emailConfig.templateId}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        templateId: e.target.value,
                      }))
                    }
                    placeholder="e.g. template_xxxxxxx"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                    Public Key (User ID)
                  </label>
                  <input
                    type="text"
                    value={emailConfig.publicKey}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        publicKey: e.target.value,
                      }))
                    }
                    placeholder="e.g. _xxxxxxxxx"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
                >
                  Save Credentials
                </button>
              </div>
            </form>

            {/* Live Test Dispatch */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Run Live Test Dispatch
              </h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter test recipient email..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleRunTestEmail}
                  disabled={testLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {testResult.success ? "✓ " : "❌ "} {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0c121e] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-800 shadow-2xl text-slate-300 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-white font-mono">
                    Order #{selectedOrderDetails.id}
                  </h3>
                  {getStatusBadge(selectedOrderDetails.status)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Placed on:{" "}
                  {selectedOrderDetails.createdAt?.toDate
                    ? selectedOrderDetails.createdAt.toDate().toLocaleString()
                    : "Recent"}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Customer Info
                </span>
                <div className="font-bold text-white">
                  {selectedOrderDetails.customerName}
                </div>
                <div className="text-slate-300">
                  {selectedOrderDetails.customerEmail}
                </div>
                <div className="text-slate-400">
                  {selectedOrderDetails.customerPhone || "No phone provided"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Shipping Destination
                </span>
                <div className="text-slate-200">
                  {selectedOrderDetails.shippingAddress?.street}
                </div>
                <div className="text-slate-300">
                  {selectedOrderDetails.shippingAddress?.city},{" "}
                  {selectedOrderDetails.shippingAddress?.state}{" "}
                  {selectedOrderDetails.shippingAddress?.zipCode}
                </div>
                <div className="text-slate-400">
                  {selectedOrderDetails.shippingAddress?.country ||
                    "United States"}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Purchased Items ({selectedOrderDetails.items?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrderDetails.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-lg bg-slate-800 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white">
                          {item.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Size:{" "}
                          <strong className="text-slate-200">
                            {item.selectedSize}
                          </strong>{" "}
                          | Color:{" "}
                          <strong className="text-slate-200">
                            {item.selectedColor}
                          </strong>{" "}
                          | Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-white">
                      ${(item.quantity * Number(item.price)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Actions & CJ Fulfillment Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleResendOrderEmail(selectedOrderDetails)}
                  disabled={resendingId === selectedOrderDetails.id}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                >
                  {resendingId === selectedOrderDetails.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Resend Confirmation Email</span>
                </button>

                {!selectedOrderDetails.cjOrderId ? (
                  <button
                    type="button"
                    onClick={() => handleFulfillWithCj(selectedOrderDetails.id)}
                    disabled={fulfillingId === selectedOrderDetails.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                  >
                    {fulfillingId === selectedOrderDetails.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting to CJ...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Fulfill Order with CJ Dropshipping</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSyncTracking(selectedOrderDetails.id)}
                    disabled={trackingSyncId === selectedOrderDetails.id}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                  >
                    {trackingSyncId === selectedOrderDetails.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Sync Tracking from CJ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Calculations and Status Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400">Payment Method: </span>
                <strong className="text-slate-200">
                  {selectedOrderDetails.paymentMethod}
                </strong>
              </div>
              <div className="text-base font-extrabold text-white">
                Total:{" "}
                <span className="text-emerald-400">
                  ${Number(selectedOrderDetails.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
