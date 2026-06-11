import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllBulkOrderInquiries, deleteBulkOrderInquiry } from "../apis/bulkOrderInquiry";
import Pagination from "../components/Pagination";
import {
  FaBox,
  FaSyncAlt,
  FaSearch,
  FaTrash,
  FaEye,
  FaEdit,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDateOnly = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";
const fmtTimeOnly = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { timeStyle: "short" }) : "-";

export default function BulkOrders() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchInquiries = async (page = 1, currentSearch = search) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllBulkOrderInquiries(page, pagination.limit, currentSearch);
      setInquiries(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load bulk order inquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInquiries(1, search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const handlePageChange = (newPage) => {
    fetchInquiries(newPage, search);
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
        await deleteBulkOrderInquiry(id);
        setInquiries(prev => prev.filter(item => item._id !== id));
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

  // Using server-side searching, so we map inquiries directly
  const filteredInquiries = inquiries;

  return (
    <div className="space-y-6 p-4" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaBox className="text-orange-500" />
            Bulk Orders
          </h1>
          <p className="text-sm opacity-70" style={{ color: themeColors.text }}>
            Manage bulk mango order inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, or mobile..."
              className="pl-10 pr-4 py-2 rounded-md border text-sm shadow-sm outline-none w-64 md:w-80"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>

          <button
            onClick={fetchInquiries}
            className="p-2.5 rounded-md border hover:bg-gray-50 transition-colors shadow-sm"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border overflow-hidden" style={{ borderColor: themeColors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b" style={{ borderColor: themeColors.border }}>
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Sr. No.</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Client Info</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Buyer Type</th>
                <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="w-6 h-6" />
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading Bulk Orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-400 font-medium">No bulk orders found matching your criteria.</td></tr>
              ) : (
                filteredInquiries.map((item, index) => (
                  <tr
                    key={item._id}
                    className="transition-all hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-500 font-medium text-xs">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="font-medium text-xs">{fmtDateOnly(item.createdAt)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fmtTimeOnly(item.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{item.fullName}</div>
                      {item.companyName && <div className="text-xs text-gray-500">{item.companyName}</div>}
                      <a href={`tel:${item.mobileNumber}`} className="text-xs text-blue-500 hover:underline mt-0.5 block">{item.mobileNumber}</a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-orange-600">{item.requiredQuantity}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold capitalize">
                        {item.typeOfBuyer}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/bulk-orders/view/${item._id}`}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="View"
                        >
                          <FaEye size={14} />
                        </Link>
                        <Link
                          to={`/bulk-orders/edit/${item._id}`}
                          className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          title="Delete"
                        >
                          <FaTrash size={14} />
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
          <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  );
}
