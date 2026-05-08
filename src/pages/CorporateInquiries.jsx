import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { getAllCorporateInquiries, updateCorporateInquiryStatus, deleteCorporateInquiry } from "../apis/corporateInquiry";
import Pagination from "../components/Pagination";
import {
  FaBuilding,
  FaSyncAlt,
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaClock,
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

const STATUS_OPTIONS = ["new", "contacted", "in-negotiation", "closed", "cancelled"];

export default function CorporateInquiries() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null); // Track which ID is updating
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchInquiries = async (page = 1, currentSearch = search, currentStatus = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllCorporateInquiries(page, 10, currentSearch, currentStatus);
      setInquiries(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load corporate inquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and status filter effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInquiries(1, search, statusFilter);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [search, statusFilter]);

  const handlePageChange = (newPage) => {
    fetchInquiries(newPage, search, statusFilter);
  };

  const handleStatusChange = async (inquiry, newStatus) => {
    if (newStatus === inquiry.status) return;
    
    try {
      setStatusUpdating(`${inquiry._id}-${newStatus}`);
      await updateCorporateInquiryStatus(inquiry._id, newStatus);
      
      setInquiries((prev) =>
        prev.map((item) =>
          item._id === inquiry._id ? { ...item, status: newStatus } : item
        )
      );

      if (selected && selected._id === inquiry._id) {
        setSelected((prev) => ({ ...prev, status: newStatus }));
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Status updated successfully",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status"
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
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await deleteCorporateInquiry(id);
        setInquiries(prev => prev.filter(item => item._id !== id));
        if (selected && selected._id === id) setSelected(null);
        Swal.fire("Deleted!", "Inquiry has been deleted.", "success");
      } catch (e) {
        Swal.fire("Error", "Failed to delete inquiry", "error");
      }
    }
  };

  // Tiny elegant spinner
  const Spinner = ({ size = "w-4 h-4", color = "border-blue-500" }) => (
    <div className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin`}></div>
  );

  const statusBadgeStyle = (status) => {
    const base = {
      padding: "4px 10px",
      borderRadius: "9px",
      fontSize: "0.7rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      textTransform: "uppercase"
    };

    switch (status) {
      case "contacted":
        return { ...base, backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #166534" };
      case "in-negotiation":
        return { ...base, backgroundColor: "#fef9c3", color: "#854d0e", border: "1px solid #854d0e" };
      case "closed":
        return { ...base, backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #1e40af" };
      case "cancelled":
        return { ...base, backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #991b1b" };
      default: // new
        return { ...base, backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #374151" };
    }
  };

  return (
    <div className="space-y-6 p-4" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaBuilding className="text-blue-500" />
            Corporate Inquiries
          </h1>
          <p className="text-sm opacity-70" style={{ color: themeColors.text }}>
            Manage bulk quote requests and B2B leads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-md border text-sm shadow-sm outline-none"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inquiries..."
              className="pl-10 pr-4 py-2 rounded-md border text-sm shadow-sm outline-none w-64"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>

          <button
            onClick={() => fetchInquiries(1)}
            className="p-2.5 rounded-md border hover:bg-gray-50 transition-colors shadow-sm"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-2 bg-white rounded-md shadow-sm border overflow-hidden" style={{ borderColor: themeColors.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 border-b" style={{ borderColor: themeColors.border }}>
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Company & Client</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Spinner size="w-6 h-6" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Loading Inquiries...</span>
                      </div>
                    </td>
                  </tr>
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-12 text-center text-gray-400 font-medium">No inquiries found matching your criteria.</td></tr>
                ) : (
                  inquiries.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(item)}
                      className={`cursor-pointer transition-all hover:bg-gray-50 ${selected?._id === item._id ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-gray-800 text-sm">{item.companyName}</div>
                        <div className="text-[10px] text-gray-500">{item.contactPerson}</div>
                        <div className="text-[9px] text-gray-400">{fmtDateTime(item.createdAt)}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                           <span className="font-bold text-blue-600 text-sm">{item.quantity}</span>
                           <span className="text-[10px] text-gray-400">qty</span>
                        </div>
                        {item.occasion && <div className="text-[10px] text-gray-400 line-clamp-1 italic">"{item.occasion}"</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && pagination.totalPages > 1 && (
            <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </div>

        {/* Detail Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-sm border p-4 sticky top-24" style={{ borderColor: themeColors.border }}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
              Inquiry Details
            </h2>

            {!selected ? (
              <div className="text-center py-8">
                <FaBuilding className="mx-auto text-3xl text-gray-100 mb-3" />
                <p className="text-xs text-gray-400">Select an inquiry</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 leading-tight">{selected.companyName}</h3>
                    <p className="text-xs text-gray-500">{selected.contactPerson}</p>
                  </div>
                  <span style={statusBadgeStyle(selected.status)}>{selected.status}</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Contact Details</p>
                    <p className="text-xs font-medium truncate">{selected.email}</p>
                    <p className="text-xs font-medium">{selected.phone}</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] uppercase font-bold text-blue-400">Requirement</p>
                    {selected.customBranding && (
                      <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">BRANDING</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-blue-700">{selected.quantity}</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Units</span>
                  </div>
                </div>

                {selected.occasion && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Occasion</p>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100 italic">"{selected.occasion}"</p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-[9px] uppercase font-bold text-gray-400 mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleStatusChange(selected, opt)}
                        disabled={!!statusUpdating}
                        className={`text-center py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                          selected.status === opt 
                            ? "bg-gray-800 text-white shadow-sm" 
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
                        }`}
                      >
                        {statusUpdating === `${selected._id}-${opt}` && (
                          <Spinner size="w-2.5 h-2.5" color="border-white" />
                        )}
                        {opt.toUpperCase().replace("-", " ")}
                      </button>
                    ))}
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
