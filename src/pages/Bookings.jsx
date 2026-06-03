import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} from "../apis/booking";
import Pagination from "../components/Pagination";
import {
  FaCalendarCheck,
  FaSyncAlt,
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCreditCard,
  FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "dispatched",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed"];

export default function Bookings() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null); // Track which ID & type is updating
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchBookingsList = async (
    page = 1,
    currentSearch = search,
    currentStatus = statusFilter,
    currentPaymentStatus = paymentStatusFilter,
  ) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllBookings(
        page,
        10,
        currentSearch,
        currentStatus,
        currentPaymentStatus,
      );
      setBookings(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load bookings.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and status filter effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBookingsList(1, search, statusFilter, paymentStatusFilter);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [search, statusFilter, paymentStatusFilter]);

  const handlePageChange = (newPage) => {
    fetchBookingsList(newPage, search, statusFilter, paymentStatusFilter);
  };

  const handleStatusChange = async (booking, newStatus) => {
    if (newStatus === booking.status) return;

    try {
      setStatusUpdating(`${booking._id}-status-${newStatus}`);
      await updateBookingStatus(booking._id, { status: newStatus });

      setBookings((prev) =>
        prev.map((item) =>
          item._id === booking._id ? { ...item, status: newStatus } : item,
        ),
      );

      if (selected && selected._id === booking._id) {
        setSelected((prev) => ({ ...prev, status: newStatus }));
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Booking status updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to update booking status",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const handlePaymentStatusChange = async (booking, newPaymentStatus) => {
    if (newPaymentStatus === booking.paymentStatus) return;

    try {
      setStatusUpdating(`${booking._id}-pay-${newPaymentStatus}`);
      await updateBookingStatus(booking._id, {
        paymentStatus: newPaymentStatus,
      });

      setBookings((prev) =>
        prev.map((item) =>
          item._id === booking._id
            ? { ...item, paymentStatus: newPaymentStatus }
            : item,
        ),
      );

      if (selected && selected._id === booking._id) {
        setSelected((prev) => ({ ...prev, paymentStatus: newPaymentStatus }));
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Payment status updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to update payment status",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteBooking(id);
        setBookings((prev) => prev.filter((item) => item._id !== id));
        if (selected && selected._id === id) setSelected(null);
        Swal.fire("Deleted!", "Booking has been deleted.", "success");
      } catch (e) {
        Swal.fire("Error", "Failed to delete booking", "error");
      }
    }
  };

  const Spinner = ({ size = "w-4 h-4", color = "border-blue-500" }) => (
    <div
      className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin`}
    ></div>
  );

  const statusBadgeStyle = (status) => {
    const base = {
      padding: "4px 10px",
      borderRadius: "9px",
      fontSize: "0.7rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      textTransform: "uppercase",
    };

    switch (status) {
      case "confirmed":
        return {
          ...base,
          backgroundColor: "#dcfce7",
          color: "#166534",
          border: "1px solid #166534",
        };
      case "dispatched":
        return {
          ...base,
          backgroundColor: "#fef9c3",
          color: "#854d0e",
          border: "1px solid #854d0e",
        };
      case "delivered":
        return {
          ...base,
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          border: "1px solid #1e40af",
        };
      case "cancelled":
        return {
          ...base,
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          border: "1px solid #991b1b",
        };
      default: // pending
        return {
          ...base,
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: "1px solid #374151",
        };
    }
  };

  const paymentStatusBadgeStyle = (status) => {
    const base = {
      padding: "2px 8px",
      borderRadius: "6px",
      fontSize: "0.65rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      textTransform: "uppercase",
    };

    switch (status) {
      case "paid":
        return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
      case "failed":
        return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
      default: // pending
        return { ...base, backgroundColor: "#f3f4f6", color: "#374151" };
    }
  };

  return (
    <div className="space-y-6 p-4" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaCalendarCheck className="text-green-600" />
            Advance Mango Bookings
          </h1>
          <p className="text-sm opacity-70" style={{ color: themeColors.text }}>
            Manage customer advance bookings, payments, and dispatch queues.
          </p>
        </div>
      </div>

      <div className="flex flex-col  md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 md:mx-2">
          <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="pl-10 pr-4 py-2 rounded-md border text-sm shadow-sm outline-none w-full"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border text-sm shadow-sm outline-none"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
        >
          <option value="all">All Booking Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border text-sm shadow-sm outline-none"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
        >
          <option value="all">All Payment Status</option>
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        

        <button
          onClick={() => fetchBookingsList(1)}
          className="p-2.5 rounded-md border hover:bg-gray-50 transition-colors shadow-sm"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div
          className="lg:col-span-2 bg-white rounded-md shadow-sm border overflow-hidden"
          style={{ borderColor: themeColors.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead
                className="bg-gray-50 border-b"
                style={{ borderColor: themeColors.border }}
              >
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                    Booking ID & Customer
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                    Mango Selection
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: themeColors.border }}
              >
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Spinner size="w-6 h-6" color="border-green-600" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          Loading Bookings...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-12 text-center text-gray-400 font-medium"
                    >
                      No bookings found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(item)}
                      className={`cursor-pointer transition-all hover:bg-gray-50 ${selected?._id === item._id ? "bg-green-50/30" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-green-700 text-sm">
                          {item.bookingNo}
                        </div>
                        <div className="font-bold text-gray-800">
                          {item.fullName}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item.mobileNumber}
                        </div>
                        <div className="text-[9px] text-gray-400">
                          {fmtDateTime(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-gray-800 text-xs">
                          {item.mangoName?.name || item.mangoName || "-"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item.mangoVariety?.name ||
                            item.mangoVariety ||
                            "Special"}{" "}
                          Category
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.numberOfBoxes} Box(es) ({item.boxSize})
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-gray-800 text-xs">
                          {item.mangoName?.vendor_id?.name || "-"}
                        </div>
                        {item.mangoName?.vendor_id?.contactDetails?.phoneNumber && (
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                            {item.mangoName.vendor_id.contactDetails.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={statusBadgeStyle(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="space-y-1">
                          <div>
                            <span
                              style={paymentStatusBadgeStyle(
                                item.paymentStatus,
                              )}
                            >
                              {item.paymentStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 font-semibold">
                            ₹{item.bookingAmountPaid || "0"} ({item.paymentMode}
                            )
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(item);
                            }}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-all"
                            title="View Booking"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item._id);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="Delete Booking"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && pagination.totalPages > 1 && (
            <div
              className="p-4 border-t"
              style={{ borderColor: themeColors.border }}
            >
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Detail Sidebar */}
        <div className="space-y-4">
          <div
            className="bg-white rounded-md shadow-sm border p-4 sticky top-24"
            style={{ borderColor: themeColors.border }}
          >
            <h2
              className="text-base font-bold mb-4 flex items-center gap-2 border-b pb-2"
              style={{ color: themeColors.text }}
            >
              Booking Details
            </h2>

            {!selected ? (
              <div className="text-center py-12">
                <FaCalendarCheck className="mx-auto text-4xl text-gray-100 mb-3" />
                <p className="text-xs text-gray-400">
                  Select a booking to view complete details
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-green-700 leading-tight">
                      {selected.bookingNo}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Placed: {fmtDateTime(selected.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span style={statusBadgeStyle(selected.status)}>
                      {selected.status}
                    </span>
                    <span
                      style={paymentStatusBadgeStyle(selected.paymentStatus)}
                    >
                      {selected.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100 space-y-1.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1">
                    <FaUser className="text-gray-400" /> Customer Information
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {selected.fullName}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    Mobile: {selected.mobileNumber}
                  </p>
                  {selected.alternateMobileNumber && (
                    <p className="text-xs text-gray-500">
                      Alternate: {selected.alternateMobileNumber}
                    </p>
                  )}
                  {selected.emailId && (
                    <p className="text-xs text-gray-500 truncate">
                      Email: {selected.emailId}
                    </p>
                  )}
                </div>

                {/* Order Details */}
                <div className="p-3 bg-green-50/30 rounded-md border border-green-100 space-y-1.5">
                  <p className="text-[9px] uppercase font-bold text-green-600 flex items-center gap-1">
                    <FaShoppingBag className="text-green-500" /> Order Details
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {selected.mangoName?.name || selected.mangoName || "-"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Category:{" "}
                    {selected.mangoVariety?.name ||
                      selected.mangoVariety ||
                      "Special"}
                  </p>
                  {selected.mangoName?.vendor_id && (
                    <div className="text-[11px] text-gray-600 mt-1 border-t border-dashed border-gray-200/60 pt-1">
                      <span className="font-semibold block text-[9px] uppercase text-gray-400">Grower / Vendor</span>
                      <div className="font-bold text-slate-700">
                        {selected.mangoName.vendor_id.name || "-"}
                      </div>
                      {selected.mangoName.vendor_id.contactDetails?.phoneNumber && (
                        <div className="text-gray-500 font-medium">
                          Phone: {selected.mangoName.vendor_id.contactDetails.phoneNumber}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-600">
                    Product Price (per box):{" "}
                    <span className="font-semibold">
                      ₹{selected.productPrice || "0"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Quantity:{" "}
                    <span className="font-bold">{selected.numberOfBoxes}</span>{" "}
                    Box(es) ({selected.boxSize})
                  </p>
                  <p className="text-xs text-gray-600">
                    Preferred Delivery:{" "}
                    <span className="font-semibold">
                      {selected.preferredDeliveryWeek}
                    </span>
                  </p>
                  {selected.specialInstructions && (
                    <div className="text-[11px] text-gray-500 border-t pt-1 italic">
                      Instructions: "{selected.specialInstructions}"
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100 space-y-1.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-gray-400" /> Delivery
                    Address
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {selected.completeAddress}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selected.city}, {selected.state} - {selected.pincode}
                  </p>
                  {selected.landmark && (
                    <p className="text-xs text-gray-500">
                      Landmark: {selected.landmark}
                    </p>
                  )}
                </div>

                {/* Payment info */}
                <div className="p-3 bg-amber-50/50 rounded-md border border-amber-200/50 space-y-1.5">
                  <p className="text-[9px] uppercase font-bold text-amber-600 flex items-center gap-1">
                    <FaCreditCard className="text-amber-500" /> Payment &
                    Transaction
                  </p>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Product Price Total:</span>
                    <span className="font-medium text-gray-800">
                      ₹
                      {(selected.productPrice || 0) *
                        (selected.numberOfBoxes || 1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Booking Fee Paid (Advance):</span>
                    <span className="font-semibold text-green-700">
                      ₹{selected.bookingAmountPaid || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-700 border-t pt-1 font-bold">
                    <span>Total Amount (Booking):</span>
                    <span className="text-green-700">
                      ₹{selected.totalAmount || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Payment Mode:</span>
                    <span className="font-semibold">
                      {selected.paymentMode}
                    </span>
                  </div>
                  {selected.transactionId && (
                    <div className="text-xs text-gray-600 border-t pt-1 truncate">
                      <span>Txn ID: {selected.transactionId}</span>
                    </div>
                  )}
                  {selected.referralSource && (
                    <div className="text-[10px] text-gray-400 italic">
                      Source: Heard from {selected.referralSource}
                    </div>
                  )}
                </div>

                {/* Update Status Actions */}
                <div className="pt-2 border-t space-y-3">
                  {/* Booking Status Update */}
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5">
                      Update Booking Status
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleStatusChange(selected, opt)}
                          disabled={!!statusUpdating}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
                            selected.status === opt
                              ? "bg-gray-800 text-white shadow-sm"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
                          }`}
                        >
                          {statusUpdating ===
                            `${selected._id}-status-${opt}` && (
                            <Spinner size="w-2.5 h-2.5" color="border-white" />
                          )}
                          {opt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status Update */}
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5">
                      Update Payment Status
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            handlePaymentStatusChange(selected, opt)
                          }
                          disabled={!!statusUpdating}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
                            selected.paymentStatus === opt
                              ? "bg-green-700 text-white shadow-sm"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
                          }`}
                        >
                          {statusUpdating === `${selected._id}-pay-${opt}` && (
                            <Spinner size="w-2.5 h-2.5" color="border-white" />
                          )}
                          {opt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
