import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import {
  getBookingById,
  updateBookingStatus,
  trackShiprocketOrderApi
} from "../apis/booking";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCreditCard,
  FaInfoCircle,
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
  "order placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUS_OPTIONS = ["pending", "advance paid", "paid", "failed"];

export default function ViewBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [error, setError] = useState("");

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getBookingById(id);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError("Failed to load booking data.");
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load booking details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === booking.status) return;

    try {
      setStatusUpdating(`status-${newStatus}`);
      await updateBookingStatus(booking._id, { status: newStatus });
      setBooking((prev) => ({ ...prev, status: newStatus }));
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

  const handlePaymentStatusChange = async (newPaymentStatus) => {
    if (newPaymentStatus === booking.paymentStatus) return;

    try {
      setStatusUpdating(`pay-${newPaymentStatus}`);
      await updateBookingStatus(booking._id, {
        paymentStatus: newPaymentStatus,
      });
      setBooking((prev) => ({ ...prev, paymentStatus: newPaymentStatus }));
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

  const handleLiveTrack = async (awbCode) => {
    try {
      Swal.fire({
        title: 'Fetching tracking details...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const data = await trackShiprocketOrderApi(awbCode);
      Swal.fire({
        title: 'Live Tracking Status',
        html: `
          <div style="text-align: left; font-size: 0.9rem; line-height: 1.5; margin-top: 10px;">
            <p><strong>Status:</strong> <span style="color: #16a34a;">${data.status}</span></p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Last Update:</strong> ${data.lastUpdate}</p>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#1e293b'
      });
    } catch (e) {
      Swal.fire('Error', 'Failed to fetch tracking details. Please try again.', 'error');
    }
  };

  const Spinner = ({ size = "w-4 h-4", color = "border-blue-500" }) => (
    <div
      className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin`}
    ></div>
  );

  const statusBadgeStyle = (status) => {
    const base = {
      padding: "6px 14px",
      borderRadius: "9px",
      fontSize: "0.75rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      textTransform: "uppercase",
    };

    switch (status) {
      case "order placed":
        return {
          ...base,
          backgroundColor: "#e0e7ff",
          color: "#3730a3",
          border: "1px solid #3730a3",
        };
      case "confirmed":
        return {
          ...base,
          backgroundColor: "#dcfce7",
          color: "#166534",
          border: "1px solid #166534",
        };
      case "shipped":
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
      padding: "6px 14px",
      borderRadius: "9px",
      fontSize: "0.75rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      textTransform: "uppercase",
    };

    switch (status) {
      case "paid":
        return { ...base, backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #166534" };
      case "advance paid":
        return { ...base, backgroundColor: "#ffedd5", color: "#c2410c", border: "1px solid #c2410c" };
      case "failed":
        return { ...base, backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #991b1b" };
      default: // pending
        return { ...base, backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #374151" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="w-8 h-8" color="border-green-600" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Loading Booking Details...
        </span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-red-500 font-semibold text-lg">{error || "Booking not found"}</div>
        <button
          onClick={() => navigate("/bookings")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-bold shadow hover:bg-gray-700 transition"
        >
          <FaArrowLeft /> Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" style={{ fontFamily: currentFont.family }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5" style={{ borderColor: themeColors.border }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/bookings")}
            className="p-2.5 rounded-full border hover:bg-gray-50 transition-colors shadow-sm"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
            title="Back to Bookings"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: themeColors.text }}
            >
              <FaCalendarCheck className="text-green-600" />
              Booking Details
            </h1>
            <p className="text-sm opacity-70" style={{ color: themeColors.text }}>
              Manage and view single booking information, shipping status, and payments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span style={statusBadgeStyle(booking.status)}>
            Booking: {booking.status}
          </span>
          <span style={paymentStatusBadgeStyle(booking.paymentStatus)}>
            Payment: {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Customer & Delivery Details */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaUser /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">FULL NAME</span>
                <span className="font-bold text-gray-800 text-sm">{booking.fullName}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">MOBILE NUMBER</span>
                <span className="font-semibold text-gray-800 text-sm">{booking.mobileNumber}</span>
              </div>
              {booking.alternateMobileNumber && (
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">ALTERNATE MOBILE</span>
                  <span className="font-semibold text-gray-800 text-sm">{booking.alternateMobileNumber}</span>
                </div>
              )}
              {booking.emailId && (
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">EMAIL ID</span>
                  <span className="font-semibold text-gray-800 text-sm truncate block">{booking.emailId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaMapMarkerAlt /> Shipping & Delivery Address
            </h3>
            <div className="space-y-3 text-xs text-gray-700">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">COMPLETE ADDRESS</span>
                <span className="font-semibold text-gray-800 leading-relaxed text-sm block">{booking.completeAddress}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">CITY</span>
                  <span className="font-bold text-gray-800">{booking.city}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">STATE</span>
                  <span className="font-bold text-gray-800">{booking.state}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">PINCODE</span>
                  <span className="font-bold text-gray-800">{booking.pincode}</span>
                </div>
              </div>
              {booking.landmark && (
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">LANDMARK</span>
                  <span className="font-semibold text-gray-800">{booking.landmark}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping & Tracking Info Card */}
          {booking.awbCode && (
            <div
              className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
              style={{ borderColor: themeColors.border }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
                <FaMapMarkerAlt /> Shiprocket Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">AWB CODE</span>
                  <span className="font-bold text-blue-600 text-sm tracking-wider">{booking.awbCode}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">COURIER PARTNER</span>
                  <span className="font-bold text-gray-800 text-sm">{booking.courierName || "Shiprocket"}</span>
                </div>
                {booking.shiprocketOrderId && (
                  <div>
                    <span className="font-bold text-gray-400 block mb-0.5">SHIPROCKET ORDER ID</span>
                    <span className="font-semibold text-gray-800">{booking.shiprocketOrderId}</span>
                  </div>
                )}
                <div className="md:col-span-2 pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleLiveTrack(booking.awbCode)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition"
                  >
                    Live Track Order
                  </button>
                  <a
                    href={`https://shiprocket.co/tracking/${booking.awbCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Track on Shiprocket Website
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions & Extra Info */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaInfoCircle /> Special Instructions & Metadata
            </h3>
            <div className="space-y-3 text-xs text-gray-700">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">BOOKING PLACED AT</span>
                <span className="font-semibold text-gray-800">{fmtDateTime(booking.createdAt)}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">SPECIAL INSTRUCTIONS</span>
                <div className="p-3 bg-gray-50 border rounded-lg italic text-gray-600">
                  {booking.specialInstructions ? `"${booking.specialInstructions}"` : "No special instructions provided by customer."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details, Payments, & Actions */}
        <div className="space-y-6">
          {/* Order Details Card */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaShoppingBag /> Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">PRODUCT NAME</span>
                <span className="font-bold text-gray-800 text-sm">{booking.mangoName?.name || booking.mangoName || "-"}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">CATEGORY</span>
                <span className="font-semibold text-gray-800 text-sm">{booking.mangoCategory?.name || booking.mangoCategory || "-"}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">VARIETY</span>
                <span className="font-semibold text-gray-800 text-sm">{booking.mangoVariety?.name || booking.mangoVariety || "Special"}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">QUANTITY</span>
                <span className="font-bold text-gray-800 text-sm">{booking.numberOfBoxes} Box(es) ({booking.boxSize})</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">PREFERRED DELIVERY WEEK</span>
                <span className="font-semibold text-gray-800 text-sm">{booking.preferredDeliveryWeek}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">PRODUCT PRICE (PER BOX)</span>
                <span className="font-semibold text-gray-800 text-sm">₹{booking.productPrice || "0"}</span>
              </div>
            </div>

            {booking.mangoName?.vendor_id && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs space-y-1.5">
                <span className="font-bold text-gray-400 block">GROWER / VENDOR</span>
                <p className="font-bold text-gray-800">{booking.mangoName.vendor_id.name}</p>
                {booking.mangoName.vendor_id.contactDetails?.phoneNumber && (
                  <p className="text-gray-500 font-medium">Phone: {booking.mangoName.vendor_id.contactDetails.phoneNumber}</p>
                )}
              </div>
            )}
          </div>

          {/* Payment & Transaction Card */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaCreditCard /> Payment & Transaction Summary
            </h3>
            <div className="space-y-3 text-xs text-gray-700">
              <div className="flex justify-between border-b pb-2">
                <span>Product Value:</span>
                <span className="font-bold text-gray-800">
                  ₹{(booking.productPrice || 0) * (booking.numberOfBoxes || 1)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 text-orange-600">
                <span>Advance Paid Booking Amount:</span>
                <span className="font-bold">
                  ₹{booking.bookingAmountPaid || "0"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 font-bold text-slate-800">
                <span>Total Amount (Invoice):</span>
                <span className="text-green-700 text-sm">
                  ₹{booking.totalAmount || "0"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 text-slate-500 font-bold">
                <span>Balance to be paid on delivery:</span>
                <span className="text-orange-700 text-sm">
                  ₹{Math.max(0, ((booking.productPrice || 0) * (booking.numberOfBoxes || 1)) - (Number(booking.bookingAmountPaid) || 0))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="font-bold text-gray-400 block mb-0.5">PAYMENT MODE</span>
                  <span className="font-bold text-gray-800 text-sm">{booking.paymentMode}</span>
                </div>
                {booking.transactionId && (
                  <div>
                    <span className="font-bold text-gray-400 block mb-0.5">TRANSACTION ID</span>
                    <span className="font-semibold text-gray-800 text-sm truncate block">{booking.transactionId}</span>
                  </div>
                )}
              </div>
              {booking.referralSource && (
                <div className="text-[10px] text-gray-400 italic pt-1">
                  Referral Source: Heard about us from {booking.referralSource}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div
            className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 flex items-center gap-2 border-b pb-3" style={{ borderColor: themeColors.border }}>
              <FaInfoCircle /> Booking Status Management
            </h3>
            
            <div className="space-y-4">
              {/* Booking Status Actions */}
              <div className="space-y-2">
                <span className="font-bold text-gray-400 text-xs block">UPDATE BOOKING STATUS</span>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStatusChange(opt)}
                      disabled={!!statusUpdating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                        booking.status === opt
                          ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      {statusUpdating === `status-${opt}` && (
                        <Spinner size="w-3 h-3" color={booking.status === opt ? "border-white" : "border-green-600"} />
                      )}
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status (Read-Only) */}
              <div className="space-y-2">
                <span className="font-bold text-gray-400 text-xs block">PAYMENT STATUS</span>
                <div className="flex flex-wrap gap-2">
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border bg-gray-100 text-gray-600 border-gray-200 "
                      title="Payment status is automated and cannot be changed manually"
                    >
                      {booking.paymentStatus?.toUpperCase()}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
