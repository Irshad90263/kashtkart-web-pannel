import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  exportBookingsExcel,
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
  const navigate = useNavigate();
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
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const blob = await exportBookingsExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bookings_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      Swal.fire({
        icon: "success",
        title: "Export Completed",
        text: "Bookings excel exported successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Failed to export bookings:", e);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: e?.message || "Failed to download booking Excel.",
      });
    } finally {
      setExporting(false);
    }
  };
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
        <div className="flex items-center gap-2 flex-1 md:mx-2">
          <div className="relative flex-1">
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
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-xs font-bold shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-75 disabled:cursor-not-allowed min-w-[110px]"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
          >
            {exporting ? (
              <Spinner size="w-3.5 h-3.5" color="border-green-600" />
            ) : (
              "Export Excel"
            )}
          </button>
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

      <div className="w-full">
        {/* Table List */}
        <div
          className="bg-white rounded-md shadow-sm border overflow-hidden"
          style={{ borderColor: themeColors.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead
                className="bg-gray-50 border-b"
                style={{ borderColor: themeColors.border }}
              >
                <tr>
                  <th className="px-3 py-3 text-center font-bold text-gray-500 uppercase tracking-wider w-12">
                    Sr.
                  </th>
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
                    <td colSpan="7" className="px-4 py-12 text-center">
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
                      colSpan="7"
                      className="px-4 py-12 text-center text-gray-400 font-medium"
                    >
                      No bookings found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((item, index) => (
                    <tr
                      key={item._id}
                      onClick={() => navigate(`/bookings/view/${item._id}`)}
                      className="cursor-pointer transition-all hover:bg-gray-50"
                    >
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-gray-500 text-xs">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                      </td>
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
                          Category: {item.mangoCategory?.name || item.mangoCategory || "-"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Variety: {item.mangoVariety?.name ||
                            item.mangoVariety ||
                            "Special"}
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
                              navigate(`/bookings/view/${item._id}`);
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
      </div>
    </div>
  );
}
