import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getAllVendors, deleteVendor, toggleVendorStatus } from "../apis/vendor";
import Pagination from "../components/Pagination";
import {
    FaStore,
    FaSearch,
    FaSyncAlt,
    FaEye,
    FaEdit,
    FaTrash,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaToggleOn,
    FaToggleOff,
    FaChevronRight,
    FaPlus
} from "react-icons/fa";
import Swal from "sweetalert2";
import { toast } from "sonner";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }) : "-";

export default function Vendors() {
    const { themeColors } = useTheme();
    const { currentFont } = useFont();
    const navigate = useNavigate();

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchVendors = async (page = 1) => {
        try {
            setLoading(true);
            const res = await getAllVendors(page, 10, search);
            setVendors(res.vendors || []);
            if (res.pagination) {
                setPagination(res.pagination);
            }
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Failed to load vendors.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handlePageChange = (newPage) => {
        fetchVendors(newPage);
    };



    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteVendor(id);
                toast.success("Vendor deleted successfully");
                fetchVendors(pagination.page);
            } catch (e) {
                toast.error("Failed to delete vendor");
            }
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            await toggleVendorStatus(id, !currentStatus);
            toast.success(`Vendor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            fetchVendors(pagination.page);
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn" style={{ fontFamily: currentFont.family }}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: themeColors.text }}>
                        <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                            <FaStore />
                        </div>
                        Vendor Management
                    </h1>
                    {/* <p className="text-sm mt-2 opacity-70 max-w-xl" style={{ color: themeColors.text }}>
                        Manage your orchard partners and suppliers. Monitor their details, varieties, and operational status.
                    </p> */}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50 group-focus-within:opacity-100 transition-opacity" style={{ color: themeColors.text }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search vendors..."
                            className="pl-10 pr-4 py-2.5 rounded-xl border text-sm w-full md:w-80 outline-none transition-all focus:ring-2"
                            style={{
                                backgroundColor: themeColors.surface,
                                borderColor: themeColors.border,
                                color: themeColors.text,
                                '--tw-ring-color': themeColors.primary + '40'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => fetchVendors(pagination.page)}
                        className="p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                        }}
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} />
                    </button>
                    {/* Add Vendor Button */}
                    <button
                        onClick={() => navigate('/vendors/add')}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap min-w-fit"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                    >
                        <FaPlus className="text-sm" /> <span>Add Vendor</span>
                    </button>
                </div>
            </div>

            {/* Main Table Container */}
            <div
                className="rounded-md border overflow-hidden shadow-sm backdrop-blur-sm"
                style={{
                    backgroundColor: themeColors.surface + '80',
                    borderColor: themeColors.border
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ backgroundColor: themeColors.background + '40' }}>
                                {["Vendor", "Contact", "Orchard Location", "Varieties", "Status", "Actions"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-xs font-bold text uppercase tracking-wider" style={{ color: themeColors.text + '99' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }}></div>
                                            <p className="text-sm font-medium" style={{ color: themeColors.text }}>Fetching vendors...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <FaStore className="text-6xl" />
                                            <p className="text-lg font-medium">No vendors found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => (
                                    <tr key={vendor._id} className="group hover:bg-black/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {vendor.photo?.url ? (
                                                    <img src={vendor.photo.url} alt="" className="h-10 w-10 rounded-full object-cover shadow-inner" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}>
                                                        {vendor.name[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm capitalize" style={{ color: themeColors.text }}>{vendor.name}</p>
                                                    <p className="text-[10px] opacity-60 font-bold uppercase">{vendor.vendorDesignation || 'Grower'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
                                                    <FaPhone className="opacity-40" size={10} />
                                                    <span>{vendor.contactDetails?.phoneNumber}</span>
                                                </div>
                                                {vendor.contactDetails?.email && (
                                                    <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
                                                        <FaEnvelope className="opacity-40" size={10} />
                                                        <span className="truncate max-w-[150px]">{vendor.contactDetails.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
                                                <FaMapMarkerAlt className="opacity-40" />
                                                <span className="truncate max-w-[200px]">{vendor.orchardAddress?.address}, {vendor.orchardAddress?.pincode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {vendor.mangoVarietiesGrown?.slice(0, 2).map((v, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border-amber-600 border  font-bold">
                                                        {v}
                                                    </span>
                                                ))}
                                                {vendor.mangoVarietiesGrown?.length > 2 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-bold">
                                                        +{vendor.mangoVarietiesGrown.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span 
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: vendor.isActive ? '#10b98115' : '#ef444415',
                                                    color: vendor.isActive ? '#10b981' : '#ef4444',
                                                    border: vendor.isActive ? "1px solid #10b981" : "1px solid #ef4444"
                                                }}
                                            >
                                                {vendor.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                                                {vendor.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                         <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Toggle Status Button */}
                                                <button 
                                                    onClick={() => handleStatusToggle(vendor._id, vendor.isActive)}
                                                    className="p-2 rounded-lg border text-sm transition-all hover:scale-105"
                                                    style={{ 
                                                        borderColor: themeColors.border,
                                                        color: vendor.isActive ? (themeColors.warning || "#f59e0b") : (themeColors.success || themeColors.primary)
                                                    }}
                                                    title={vendor.isActive ? "Mark as Inactive" : "Mark as Active"}
                                                >
                                                    {vendor.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => navigate(`/vendors/view/${vendor._id}`)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-blue-500/10 text-blue-500"
                                                    title="View"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/vendors/edit/${vendor._id}`)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-amber-500/10 text-amber-500"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(vendor._id)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-rose-500/10 text-rose-500"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && pagination.totalPages > 1 && (
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}

            <style jsx>{`
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${themeColors.border}; border-radius: 10px; }
            `}</style>
        </div>
    );
}

function DetailItem({ label, value }) {
    const { themeColors } = useTheme();
    return (
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-40 tracking-wider font-mono">{label}</span>
            <span className="text-sm font-semibold truncate" style={{ color: themeColors.text }}>{value || 'N/A'}</span>
        </div>
    );
}
