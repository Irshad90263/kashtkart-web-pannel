// src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  listOrders,
  updateOrderStatus,
  createShippingOrderApi,
  trackOrder,
} from "../apis/orders";
import Pagination from "../components/Pagination";
import { getShiprocketTracking } from "../apis/shiprocket";
import {
  FaShoppingCart,
  FaSyncAlt,
  FaSearch,
  FaTruck,
  FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileInvoice, FaTimes, FaDownload } from "react-icons/fa";
import logo from "../assets/logo.png";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : (n ?? "-");

// Possible order statuses
const STATUS_OPTIONS = [
  "order placed",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function Orders() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const res = await listOrders(page, 10);
      setOrders(res.orders || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

  const handleCreateShippingOrder = async (order) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin.");
      return;
    }

    const provider = order.selectedCourier || "shiprocket";
    const shippingCreated =
      order.shippingDetails?.created || order.shiprocketCreated;

    if (shippingCreated) {
      setError(
        `Shipping order already created for this order via ${provider}.`,
      );
      return;
    }

    const result = await Swal.fire({
      title: `Create ${provider.charAt(0).toUpperCase() + provider.slice(1)} Order?`,
      text: `Generate shipping label for Order #${order._id.slice(-6)}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: provider === "delhivery" ? "#e11d48" : "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, create",
    });

    if (!result.isConfirmed) return;

    try {
      setShiprocketLoading(true);
      setError("");
      setSuccess("");

      const response = await createShippingOrderApi(order._id || order.id);
      const shipping = response.shipping || {};

      // Update local state with Normalized Shipping Data
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === (order._id || order.id)
            ? {
                ...o,
                shippingDetails: shipping,
                shiprocketCreated: shipping.provider === "shiprocket",
                shiprocketOrderId: shipping.providerOrderId,
                shipmentId: shipping.shipmentId,
                awbCode: shipping.awbCode || "",
                courierName: shipping.courierName || "",
                status: "confirmed",
              }
            : o,
        ),
      );

      setSuccess(`${shipping.provider} order created successfully.`);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `${shipping.provider} order created and confirmed.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to create shipping order.";
      setError(msg);
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setShiprocketLoading(false);
    }
  };

  const handleTrackOrder = async (order) => {
    const awb = order.shippingDetails?.awbCode || order.awbCode;
    const courier =
      order.shippingDetails?.courierName ||
      order.courierName ||
      order.selectedCourier ||
      "N/A";

    if (!awb) {
      setError("No AWB code available for tracking.");
      return;
    }

    try {
      setShiprocketLoading(true);
      const trackingData = await trackOrder(awb);

      Swal.fire({
        title: "Order Tracking",
        html: `
          <div class="text-left">
            <p><strong>AWB Code:</strong> ${awb}</p>
            <p><strong>Courier:</strong> ${courier}</p>
            <p><strong>Status:</strong> ${trackingData.status || "N/A"}</p>
            <p><strong>Location:</strong> ${trackingData.location || "N/A"}</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "Close",
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to get tracking info.";
      setError(msg);
      Swal.fire({ icon: "error", title: "Tracking Error", text: msg });
    } finally {
      setShiprocketLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to update status.");
      return;
    }

    if (!newStatus || newStatus === order.status) return;

    let confirmTitle = "Change order status?";
    let confirmText = `Order ${order._id} status will be changed from "${order.status}" to "${newStatus}".`;

    if (newStatus === "cancelled") {
      confirmTitle = "Cancel this Order?";
      confirmText = `This will cancel the order in the database and also cancel any active shipping (Shiprocket/Delhivery). This action cannot be undone!`;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: newStatus === "cancelled" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: newStatus === "cancelled" ? "#ef4444" : "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText:
        newStatus === "cancelled" ? "Yes, cancel it" : "Yes, update",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateOrderStatus(order._id || order.id, newStatus);

      // Update local state first
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === (order._id || order.id)
            ? { ...o, status: newStatus }
            : o,
        ),
      );

      // Auto-create Shiprocket when status = "confirmed" for all orders
      if (newStatus === "confirmed" && !order.shiprocketCreated) {
        try {
          setShiprocketLoading(true);
          const response = await createShiprocketOrder(order._id || order.id);

          // Update with Shiprocket data
          setOrders((prev) =>
            prev.map((o) =>
              (o._id || o.id) === (order._id || order.id)
                ? {
                    ...o,
                    shiprocketCreated: true,
                    shiprocketOrderId: response.shiprocketOrderId,
                    shipmentId: response.shipmentId,
                    awbCode: response.awbCode || "",
                    courierName: response.courierName || "",
                  }
                : o,
            ),
          );

          setSuccess(
            "Order confirmed and Shiprocket order created successfully!",
          );
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Order confirmed and Shiprocket order created successfully!",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (shiprocketError) {
          console.error("Shiprocket creation failed:", shiprocketError);
          const shiprocketMsg =
            shiprocketError?.response?.data?.error ||
            shiprocketError?.response?.data?.message ||
            shiprocketError?.message ||
            "Shiprocket creation failed. You can try creating it manually.";
          setError(shiprocketMsg);
          Swal.fire({
            icon: "error",
            title: "Shiprocket Error",
            text: shiprocketMsg,
          });
        } finally {
          setShiprocketLoading(false);
        }
      } else {
        setSuccess("Order status updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Order status updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update order status.";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();

    return list.filter((o) => {
      const id = (o._id || o.id || "").toLowerCase();
      const userId = (o.userId || "").toLowerCase();
      const offerCode = (o.offerCode || "").toLowerCase();
      const name = (o.shippingAddress?.name || "").toLowerCase();
      const phone = (o.shippingAddress?.phone || "").toLowerCase();
      return (
        id.includes(q) ||
        userId.includes(q) ||
        offerCode.includes(q) ||
        name.includes(q) ||
        phone.includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const handleDownloadInvoice = async (order) => {
    const doc = new jsPDF();
    const id = (order._id || order.id || "-").slice(-6).toUpperCase();
    const date = fmtDateTime(order.createdAt).split(",")[0];

    // Attempt to add logo using fetch (more reliable for dataURL conversion)
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      const logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Draw circular background
      // doc.setFillColor(255, 255, 255);
      // doc.circle(27.5, 22.5, 12.5, 'F');

      // Add image (will be clipped by white circle visually)
      doc.addImage(logoBase64, "JPEG", 15, 10, 25, 25);

      // Draw circular border
      // doc.setDrawColor(218, 165, 32);
      // doc.setLineWidth(0.5);
      // doc.circle(27.5, 22.5, 12.5, 'S');
    } catch (err) {
      doc.setFontSize(22);
      doc.setTextColor(218, 165, 32);
      doc.text("KaashtKart", 15, 25);
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${date}`, 150, 20);
    doc.text(`Invoice: #${id}`, 150, 26);

    doc.setDrawColor(200);
    doc.line(15, 40, 195, 40);

    // Bill From and To
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("BILL FROM:", 15, 50);
    doc.text("BILL TO:", 140, 50);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    doc.text("KaashtKart", 15, 57);
    doc.text("Lucknow, UP", 15, 62);
    doc.text("Ph: 9336969289", 15, 67);

    const shipping = order.shippingAddress || {};

    // Bill To section with proper text wrapping
    let billToY = 57;
    const maxWidth = 50; // Maximum width for text wrapping
    const lineHeight = 5;

    // Name
    doc.text(shipping.name || "-", 140, billToY);
    billToY += lineHeight;

    // Phone
    doc.text(shipping.phone || "-", 140, billToY);
    billToY += lineHeight;

    // Address Line 1 with wrapping
    if (shipping.addressLine1) {
      const addr1Lines = doc.splitTextToSize(shipping.addressLine1, maxWidth);
      doc.text(addr1Lines, 140, billToY);
      billToY += addr1Lines.length * lineHeight;
    }

    // Address Line 2 with wrapping (if exists)
    if (shipping.addressLine2) {
      const addr2Lines = doc.splitTextToSize(shipping.addressLine2, maxWidth);
      doc.text(addr2Lines, 140, billToY);
      billToY += addr2Lines.length * lineHeight;
    }

    // City, State, Pincode
    const cityStatePin = `${shipping.city || ""}, ${shipping.state || ""} - ${shipping.pincode || ""}`;
    const cityLines = doc.splitTextToSize(cityStatePin, maxWidth);
    doc.text(cityLines, 140, billToY);

    // PDF specific currency formatter (avoiding ₹ symbol)
    const fmtPDF = (n) =>
      typeof n === "number"
        ? `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
        : (n ?? "-");

    // Items table
    const tableRows = (order.items || []).map((item) => [
      item.productName || item.product?.name || "Item",
      item.quantity,
      fmtPDF(item.productPrice || 0),
      fmtPDF((item.productPrice || 0) * (item.quantity || 1)),
    ]);

    autoTable(doc, {
      startY: billToY + 5, // Dynamic start with 5px gap
      head: [["PRODUCT", "QTY", "RATE", "PRICE"]],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.1,
      },
      styles: { fontSize: 9, halign: "left", cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 },
      },
      margin: { left: 15, right: 15 },
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");

    const summaryX = 140;
    const valueX = 195;

    const drawLine = (label, value, y) => {
      doc.text(label, summaryX, y);
      doc.text(value, valueX, y, { align: "right" });
    };

    drawLine("Subtotal:", fmtPDF(order.subtotal || 0), finalY);
    finalY += 5;

    if (order.discount > 0) {
      drawLine("Discount:", `-${fmtPDF(order.discount)}`, finalY);
      finalY += 5;
    }

    drawLine("Shipping Charges:", fmtPDF(order.shippingCharges || 0), finalY);
    finalY += 5;

    drawLine("Handling Fee:", fmtPDF(order.handlingFee || 0), finalY);
    finalY += 8;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    drawLine("Total Amount:", fmtPDF(order.total), finalY);

    doc.save(`Invoice_${id}.pdf`);
  };

  const statusBadgeStyle = (status) => {
    const base = {
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    };

    switch (status) {
      case "order placed":
        return {
          ...base,
          backgroundColor: "#f59e0b20",
          color: "#d97706",
        };
      case "confirmed":
        return {
          ...base,
          backgroundColor: (themeColors.success || themeColors.primary) + "20",
          color: themeColors.success || themeColors.primary,
        };
      case "shipped":
        return {
          ...base,
          backgroundColor: "#0ea5e920",
          color: "#0ea5e9",
        };
      case "delivered":
        return {
          ...base,
          backgroundColor: "#22c55e20",
          color: "#22c55e",
        };
      case "cancelled":
        return {
          ...base,
          backgroundColor: themeColors.danger + "20",
          color: themeColors.danger,
        };
      default: // pending
        return {
          ...base,
          backgroundColor: themeColors.background + "80",
          color: themeColors.text,
        };
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaShoppingCart />
            Orders
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            View and manage all customer orders.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order, user, phone, offer..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={fetchOrders}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
            title="Refresh"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor: themeColors.danger + "15",
                borderColor: themeColors.danger + "50",
                color: themeColors.danger,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor:
                  (themeColors.success || themeColors.primary) + "15",
                borderColor:
                  (themeColors.success || themeColors.primary) + "50",
                color: themeColors.success || themeColors.primary,
              }}
            >
              {success}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <h2
          className="text-lg font-semibold mb-4 flex items-center justify-between"
          style={{ color: themeColors.text }}
        >
          <span className="flex items-center gap-2">
            <FaShoppingCart />
            Order List
          </span>
          <span className="text-xs opacity-70">
            {filteredOrders.length} of {orders.length} shown
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: themeColors.background + "30",
                }}
              >
                {[
                  { label: "Order ID", width: "100px" },
                  { label: "Customer", width: "220px" },
                  { label: "Items", width: "250px" },
                  { label: "Amount", width: "120px" },
                  { label: "Status", width: "140px" },
                  { label: "Logistics", width: "180px" },
                  { label: "Payment", width: "130px" },
                  { label: "Created", width: "130px" },
                  { label: "Invoice", width: "100px" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider sticky top-0"
                    style={{
                      color: themeColors.text,
                      backgroundColor: themeColors.background,
                      minWidth: h.width,
                      zIndex: 10,
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: themeColors.border }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const id = o._id || o.id || "-";
                  const shipping = o.shippingAddress || {};
                  const itemsText = (o.items || [])
                    .map(
                      (it) =>
                        `${it.productName || it.product?.name || "Item"} x${
                          it.quantity || 1
                        } (${it.size || "-"}, ${it.color || "-"})`,
                    )
                    .join(", ");

                  return (
                    <tr key={id}>
                      {/* Order ID */}
                      <td
                        className="px-4 py-2 font-mono text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {id.slice(-6)}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div
                          className="font-bold text-sm"
                          style={{ color: themeColors.text }}
                        >
                          {shipping.name || "-"}
                        </div>
                        <div
                          className="flex flex-col gap-0.5 text-[11px] opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          <span>{shipping.phone || "-"}</span>
                          <span>
                            {shipping.city}, {shipping.state}
                          </span>
                          <span className="text-[10px] font-mono mt-0.5 border-t border-black/5 pt-0.5">
                            UID: {o.userId || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <div
                          className="text-[11px] line-clamp-3 leading-snug"
                          style={{ color: themeColors.text }}
                        >
                          {itemsText}
                        </div>
                        {o.notes && (
                          <div
                            className="mt-1.5 p-1 rounded bg-black/5 text-[10px] italic"
                            style={{ color: themeColors.text }}
                          >
                            <span className="font-bold uppercase opacity-50 block text-[8px]">
                              Note:
                            </span>
                            {o.notes}
                          </div>
                        )}
                      </td>

                      {/* Amounts */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] opacity-50">
                            Sub: {fmtCurrency(o.subtotal)}
                          </span>
                          <span
                            className="text-sm font-black"
                            style={{ color: themeColors.primary }}
                          >
                            {fmtCurrency(o.total)}
                          </span>
                        </div>
                      </td>

                      {/* Status + change control */}
                      <td className="px-4 py-2 text-xs">
                        <div style={statusBadgeStyle(o.status || "pending")}>
                          {o.status || "pending"}
                        </div>
                        <div className="mt-2">
                          <select
                            value={o.status || "pending"}
                            disabled={!isLoggedIn || saving}
                            onChange={(e) =>
                              handleStatusChange(o, e.target.value)
                            }
                            className="mt-1 px-2 py-1 rounded-lg border text-xs"
                            style={{
                              backgroundColor: themeColors.surface,
                              borderColor: themeColors.border,
                              color: themeColors.text,
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Logistics / Shipping */}
                      <td className="px-4 py-3">
                        {o.shippingDetails?.created || o.shiprocketCreated ? (
                          <div className="flex flex-col gap-1">
                            <div
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                              style={{
                                backgroundColor:
                                  o.shippingDetails?.shippingStatus ===
                                    "Cancelled" ||
                                  o.shippingStatus === "Cancelled"
                                    ? "#6b728020"
                                    : (o.selectedCourier === "delhivery"
                                        ? "#e11d48"
                                        : themeColors.success ||
                                          themeColors.primary) + "15",
                                color:
                                  o.shippingDetails?.shippingStatus ===
                                    "Cancelled" ||
                                  o.shippingStatus === "Cancelled"
                                    ? "#6b7280"
                                    : o.selectedCourier === "delhivery"
                                      ? "#e11d48"
                                      : themeColors.success ||
                                        themeColors.primary,
                                border: `1px solid ${
                                  o.shippingDetails?.shippingStatus ===
                                    "Cancelled" ||
                                  o.shippingStatus === "Cancelled"
                                    ? "#6b7280"
                                    : o.selectedCourier === "delhivery"
                                      ? "#e11d48"
                                      : themeColors.success ||
                                        themeColors.primary
                                }30`,
                                textDecoration:
                                  o.shippingDetails?.shippingStatus ===
                                    "Cancelled" ||
                                  o.shippingStatus === "Cancelled"
                                    ? "line-through"
                                    : "none",
                              }}
                            >
                              {o.shippingDetails?.shippingStatus ===
                                "Cancelled" || o.shippingStatus === "Cancelled"
                                ? "✕"
                                : "✓"}{" "}
                              {o.selectedCourier || "Shipping"}{" "}
                              {o.shippingDetails?.shippingStatus ===
                                "Cancelled" || o.shippingStatus === "Cancelled"
                                ? "(CANCELLED)"
                                : ""}
                            </div>
                            <div className="text-[10px] space-y-0.5 opacity-60 leading-tight">
                              {(o.shippingDetails?.providerOrderId ||
                                o.shiprocketOrderId) && (
                                <div className="font-mono">
                                  ID:{" "}
                                  {o.shippingDetails?.providerOrderId ||
                                    o.shiprocketOrderId}
                                </div>
                              )}
                              {(o.shippingDetails?.awbCode || o.awbCode) && (
                                <div className="font-bold">
                                  AWB: {o.shippingDetails?.awbCode || o.awbCode}
                                </div>
                              )}
                              {(o.shippingDetails?.courierName ||
                                o.courierName) && (
                                <div className="italic">
                                  {o.shippingDetails?.courierName ||
                                    o.courierName}
                                </div>
                              )}
                            </div>
                            {(o.shippingDetails?.awbCode || o.awbCode) && (
                              <button
                                onClick={() => handleTrackOrder(o)}
                                disabled={shiprocketLoading}
                                className="mt-1 px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 text-[10px] font-bold flex items-center justify-center gap-1"
                                style={{ color: themeColors.text }}
                              >
                                <FaEye size={8} /> TRACK
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold opacity-40 uppercase">
                                Method
                              </span>
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: themeColors.text }}
                              >
                                {o.selectedCourier?.toUpperCase() ||
                                  "NOT SELECTED"}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCreateShippingOrder(o)}
                              disabled={!isLoggedIn || shiprocketLoading}
                              className="px-2 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-all hover:scale-105"
                              style={{
                                backgroundColor:
                                  o.selectedCourier === "delhivery"
                                    ? "#e11d4815"
                                    : "rgba(59, 130, 246, 0.1)",
                                color:
                                  o.selectedCourier === "delhivery"
                                    ? "#e11d48"
                                    : "#3b82f6",
                                borderColor:
                                  o.selectedCourier === "delhivery"
                                    ? "#e11d4830"
                                    : "rgba(59, 130, 246, 0.2)",
                              }}
                            >
                              <FaTruck size={10} /> CREATE{" "}
                              {o.selectedCourier?.toUpperCase()}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                            Method: {o.paymentMethod || "-"}
                          </div>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase"
                            style={{
                              backgroundColor:
                                o.paymentStatus === "paid"
                                  ? (themeColors.success ||
                                      themeColors.primary) + "15"
                                  : themeColors.background + "80",
                              color:
                                o.paymentStatus === "paid"
                                  ? themeColors.success || themeColors.primary
                                  : themeColors.text,
                              border:
                                o.paymentStatus === "paid"
                                  ? `1px solid ${themeColors.success || themeColors.primary}30`
                                  : "none",
                            }}
                          >
                            {o.paymentStatus || "pending"}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {fmtDateTime(o.createdAt)}
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-2 text-xs">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setShowInvoiceModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
                          style={{
                            backgroundColor: themeColors.primary + "15",
                            color: themeColors.primary,
                            border: `1px solid ${themeColors.primary}30`,
                          }}
                        >
                          <FaFileInvoice />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl transform transition-all"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <h3
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: themeColors.text }}
              >
                <FaFileInvoice className="text-yellow-500" />
                Order Invoice
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: themeColors.text }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
              {/* Invoice Top */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-12  object-cover mb-1"
                  />
                  <p className="text-[9px] font-bold opacity-30 tracking-widest uppercase">
                    Official Invoice
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[11px] opacity-60"
                    style={{ color: themeColors.text }}
                  >
                    Date: {fmtDateTime(selectedOrder.createdAt).split(",")[0]}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: themeColors.text }}
                  >
                    Invoice:{" "}
                    <span className="text-yellow-600">
                      #{selectedOrder._id.slice(-6).toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
                  <h4
                    className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-0.5"
                    style={{ color: themeColors.text }}
                  >
                    BILL FROM:
                  </h4>
                  <p
                    className="font-bold text-sm"
                    style={{ color: themeColors.text }}
                  >
                    KaashKart Mango
                  </p>
                  <p
                    className="text-[11px] opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    KaashtKart Marketplace, Lucknow, UP
                  </p>
                </div>
                <div className="text-right p-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
                  <h4
                    className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-0.5"
                    style={{ color: themeColors.text }}
                  >
                    BILL TO:
                  </h4>
                  <p
                    className="font-bold text-sm"
                    style={{ color: themeColors.text }}
                  >
                    {selectedOrder.shippingAddress?.name || "-"}
                  </p>
                  <p
                    className="text-[11px] opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    {selectedOrder.shippingAddress?.phone || "-"}
                  </p>
                  <p
                    className="text-[10px] opacity-70 leading-tight"
                    style={{ color: themeColors.text }}
                  >
                    {selectedOrder.shippingAddress?.addressLine1}
                    <br />
                    {selectedOrder.shippingAddress?.city}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-2 overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr
                      className="bg-gray-50"
                      style={{ borderColor: themeColors.border }}
                    >
                      <th className="text-left py-2 px-3 opacity-70 font-bold">
                        PRODUCT
                      </th>
                      <th className="text-center py-2 px-2 opacity-70 font-bold">
                        QTY
                      </th>
                      <th className="text-right py-2 px-2 opacity-70 font-bold">
                        RATE
                      </th>
                      <th className="text-right py-2 px-3 opacity-70 font-bold">
                        PRICE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td
                          className="py-2 px-3"
                          style={{ color: themeColors.text }}
                        >
                          <div className="font-semibold">{item.productName || item.product?.name || "Item"}</div>
                          {item.size && item.size !== "Standard" && (
                            <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                              Weight: {item.size}
                            </div>
                          )}
                        </td>
                        <td
                          className="py-2 px-2 text-center"
                          style={{ color: themeColors.text }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          className="py-2 px-2 text-right"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(item.productPrice || 0)}
                        </td>
                        <td
                          className="py-2 px-3 text-right font-bold"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(
                            (item.productPrice || 0) * (item.quantity || 1),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer - Fixed Summary & Actions */}
            <div
              className="p-4 border-t bg-gray-50/50"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-0.5">
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Subtotal:</span>
                    <span>{fmtCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between w-36 text-[10px] text-green-600 font-medium">
                      <span>Discount:</span>
                      <span>-{fmtCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Shipping:</span>
                    <span>
                      {fmtCurrency(selectedOrder.shippingCharges || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Handling:</span>
                    <span>{fmtCurrency(selectedOrder.handlingFee || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold opacity-40 uppercase">
                    Total:
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    {fmtCurrency(selectedOrder.total)}
                  </h3>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="bg-slate-900 text-white px-8 py-1 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaDownload />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
