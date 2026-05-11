import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  listOrchards,
  createOrchard,
  deleteOrchard,
  toggleOrchardStatus,
} from "../apis/orchards";
import {
  FaPlus,
  FaTrash,
  FaSyncAlt,
  FaToggleOn,
  FaToggleOff,
  FaImages,
  FaTree,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : "-";


export default function Orchards() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [orchards, setOrchards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ---------- fetch ----------
  const fetchOrchards = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await listOrchards(statusFilter === "all" ? "" : statusFilter, page, 8);
      setOrchards(response.orchards);
      setTotalPages(response.pagination.pages);
      setTotalItems(response.pagination.total);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load orchards."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrchards();
  }, [statusFilter, page]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const resetForm = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const handleDelete = async (orchard) => {
    const id = orchard._id || orchard.id;
    const result = await Swal.fire({
      title: "Delete orchard image?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e02424",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      await deleteOrchard(id);
      await fetchOrchards();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Orchard image deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to delete orchard image.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (orchard) => {
    const id = orchard._id || orchard.id;
    try {
      setSaving(true);
      await toggleOrchardStatus(id);
      await fetchOrchards();
      Swal.fire({
        icon: "success",
        title: !orchard.isActive ? "Activated" : "Deactivated",
        text: `Status updated successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Failed to update status.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select an image.");
      return;
    }

    try {
      setSaving(true);
      const fd = buildFormData();
      await createOrchard(fd);
      Swal.fire({ icon: "success", title: "Created", timer: 1500, showConfirmButton: false });
      setIsModalOpen(false);
      resetForm();
      fetchOrchards();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save orchard image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaTree className="text-green-600" />
            Orchard Gallery
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Manage images for the Orchard section. 
            <span className="ml-2 font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
              Total: {totalItems}
            </span>
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${statusFilter === f ? "" : "opacity-60"}`}
                style={{
                  backgroundColor: statusFilter === f ? themeColors.primary : "transparent",
                  color: statusFilter === f ? themeColors.onPrimary : themeColors.text,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <button onClick={fetchOrchards} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}>
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button onClick={openAddModal} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
            <FaPlus />
            Add Image
          </button>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FaSyncAlt className="animate-spin text-3xl opacity-20" />
        </div>
      ) : orchards.length === 0 ? (
        <div className="text-center py-20 opacity-50">No images found.</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {orchards.map((o) => (
              <div key={o._id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img src={o.image?.url} alt="Orchard" className="w-full h-full object-cover" />
                  {!o.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Inactive</span>
                    </div>
                  )}
                </div>
                
                <div className="p-3 flex items-center justify-between bg-white border-t border-gray-100">
                  <span className="text-[10px] text-gray-500 font-medium">{fmtDateTime(o.createdAt)}</span>

                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleToggleStatus(o)} 
                      className={`p-1.5 rounded-lg transition-colors ${o.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                      title={o.isActive ? "Deactivate" : "Activate"}
                    >
                      {o.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(o)} 
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ color: themeColors.text }}
              >
                <FaChevronLeft size={14} />
              </button>
              
              <span className="text-sm font-bold" style={{ color: themeColors.text }}>
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ color: themeColors.text }}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Add Orchard Image</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

              <div className="space-y-4">
                <label className="w-full flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full max-h-40 object-contain rounded-lg" />
                  ) : (
                    <>
                      <FaImages className="text-3xl text-gray-300 mb-2" />
                      <span className="text-sm font-medium text-gray-600">Click to upload image</span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50">
                  {saving ? "Uploading..." : "Upload Image"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
