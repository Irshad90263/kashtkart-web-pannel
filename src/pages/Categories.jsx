// src/pages/Categories.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  getVarieties as getCategories,
  createVariety as createCategory,
  updateVariety as updateCategory,
  deleteVariety as deleteCategory,
} from "../apis/varieties";
import { getCategories as getProductCategories } from "../apis/categories";
import {
  FaBox,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : (n ?? "-");

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : (n ?? "-");

const emptyForm = {
  name: "",
  slug: "",
  category: [],
  description: "",
  image: null,
  imagePreview: "",
  imageUrl: "",
  imageRemoved: false,
};

export default function Categories() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // category being edited
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active"); // 'active' or 'inactive'
  const [productCategories, setProductCategories] = useState([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProductCategoriesList = async () => {
    try {
      const res = await getProductCategories();
      const list = Array.isArray(res) ? res : res.categories || [];
      setProductCategories(list);
    } catch (e) {
      console.error("Failed to load product categories:", e);
    }
  };

  useEffect(() => {
    fetchProductCategoriesList();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCategories(statusFilter);
      // res could be array or { categories: [] }
      const list = Array.isArray(res) ? res : res.categories || [];
      setCategories(list);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load varieties.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  // Image change handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image (JPEG, PNG, WebP)");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }

      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
        imageUrl: "", // Clear existing URL if new image selected
      }));
      setError("");
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      image: null,
      imagePreview: "",
      imageUrl: "",
      imageRemoved: true,
    }));
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (form.imagePreview) {
        URL.revokeObjectURL(form.imagePreview);
      }
    };
  }, [form.imagePreview]);

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      category: Array.isArray(cat.category) 
        ? cat.category.map(c => c._id || c.id || c) 
        : (cat.category ? [cat.category._id || cat.category.id || cat.category] : []),
      description: cat.description || "",
      image: null,
      imagePreview: cat.image?.url || "", // assuming API returns { image: { url } }
      imageUrl: cat.image?.url || "",
    });
    setSuccess("");
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete varieties.");
      return;
    }

    const idOrSlug = cat.slug || cat._id || cat.id;
    if (!idOrSlug) {
      setError("Cannot delete this variety (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete variety "${cat.name}"?`,
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
      setError("");
      setSuccess("");
      await deleteCategory(idOrSlug);
      setSuccess("Variety deleted successfully.");
      await fetchCategories();
      if (editing && editing._id === cat._id) {
        resetForm();
      }
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Variety deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to delete variety.";
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

  const handleToggleStatus = async (cat) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to change status.");
      return;
    }

    const idOrSlug = cat.slug || cat._id || cat.id;
    if (!idOrSlug) {
      setError("Cannot update this variety (missing identifier).");
      return;
    }

    const newStatus = !cat.isActive;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateCategory(idOrSlug, { isActive: newStatus });

      // Remove from current view if status doesn't match filter
      if (
        (statusFilter === "active" && !newStatus) ||
        (statusFilter === "inactive" && newStatus)
      ) {
        setCategories((prev) =>
          prev.filter(
            (c) =>
              (c._id || c.id || c.slug) !== (cat._id || cat.id || cat.slug),
          ),
        );
      } else {
        // Update status in current view
        setCategories((prev) =>
          prev.map((c) =>
            (c._id || c.id || c.slug) === (cat._id || cat.id || cat.slug)
              ? { ...c, isActive: newStatus }
              : c,
          ),
        );
      }

      setSuccess(
        `Variety ${newStatus ? "activated" : "deactivated"} successfully.`,
      );

      Swal.fire({
        icon: "success",
        title: newStatus ? "Activated" : "Deactivated",
        text: `Variety ${newStatus ? "activated" : "deactivated"} successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update variety status.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("You must be logged in as admin to manage varieties.");
      return;
    }

    if (!form.name.trim()) {
      setError("Variety name is required.");
      return;
    }

    if (!form.category || form.category.length === 0) {
      setError("At least one category is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let payload; // 🔥 Dynamic payload - FormData ya JSON

      // 🔥 Check if we have a new image file
      if (form.image) {
        // Use FormData for file upload
        payload = new FormData();
        payload.append("name", form.name.trim());
        if (form.slug.trim()) payload.append("slug", form.slug.trim());
        form.category.forEach(c => payload.append("category", c));
        if (form.description.trim())
          payload.append("description", form.description.trim());
        payload.append("image", form.image);

        // If editing and we want to remove existing image
        if (editing && !form.imageUrl && !form.imagePreview) {
          payload.append("removeImage", "true");
        }
      } else {
        // Use JSON for normal data (no image file)
        payload = {
          name: form.name.trim(),
          ...(form.slug.trim() && { slug: form.slug.trim() }),
          category: form.category,
          description: form.description.trim(),
        };

        // If editing and we want to keep existing image
        if (editing && form.imageUrl) {
          payload.imageUrl = form.imageUrl;
        }

        // If editing and we want to remove image
        if (
          editing &&
          !form.imageUrl &&
          !form.imagePreview &&
          form.imageRemoved
        ) {
          payload.removeImage = true;
        }
      }

      // 🔥 Use smart API functions (jo auto-detect karte hain)
      if (editing) {
        const idOrSlug = editing.slug || editing._id || editing.id;
        if (!idOrSlug)
          throw new Error("Missing variety identifier for update.");

        // ✅ Same updateCategory function - yeh khud detect karega ki payload FormData hai ya JSON
        await updateCategory(idOrSlug, payload);
        setSuccess("Variety updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Variety updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // ✅ Same createCategory function - yeh khud detect karega ki payload FormData hai ya JSON
        await createCategory(payload);
        setSuccess("Variety created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Variety created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchCategories();
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save variety.";
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

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      return name.includes(q) || slug.includes(q) || desc.includes(q);
    });
  }, [categories, search]);

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaBox />
            Varieties
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage product varieties for your e-commerce store.
          </p>
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search varieties..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          {/* Status Filter Toggle */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg border"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === "active" ? "" : "opacity-60"
              }`}
              style={{
                backgroundColor:
                  statusFilter === "active"
                    ? themeColors.primary
                    : "transparent",
                color:
                  statusFilter === "active"
                    ? themeColors.onPrimary
                    : themeColors.text,
              }}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === "inactive" ? "" : "opacity-60"
              }`}
              style={{
                backgroundColor:
                  statusFilter === "inactive"
                    ? themeColors.primary
                    : "transparent",
                color:
                  statusFilter === "inactive"
                    ? themeColors.onPrimary
                    : themeColors.text,
              }}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={fetchCategories}
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

          <button
            onClick={openAddModal}
            disabled={!isLoggedIn}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
            title={isLoggedIn ? "Add new variety" : "Login as admin to add"}
          >
            <FaPlus />
            Add Variety
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(error || success || !isLoggedIn) && (
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
          {!isLoggedIn && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor:
                  (themeColors.warning || themeColors.primary) + "15",
                borderColor:
                  (themeColors.warning || themeColors.primary) + "50",
                color: themeColors.warning || themeColors.primary,
              }}
            >
              You are viewing public varieties. Login as admin to add, edit, or
              delete varieties.
            </div>
          )}
        </div>
      )}

      {/* Table only (form ab modal me) */}
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
            <FaBox />
            Variety List
          </span>
          <span className="text-xs opacity-70">
            {filteredCategories.length} of {categories.length} shown
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
                  "Name",
                  "Category",
                  "Slug",
                  "Description",
                  "Status",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    {h}
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
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading varieties...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No varieties found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id || cat.id || cat.slug}>
                    <td
                      className="px-4 py-2"
                      style={{ color: themeColors.text }}
                    >
                      {cat.name}
                    </td>
                    <td
                      className="px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      style={{ color: themeColors.textPrimary }}
                    >
                      {Array.isArray(cat.category) && cat.category.length > 0
                        ? cat.category.map(c => c.name || c).join(", ")
                        : (cat.category?.name || cat.category || "-")}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {cat.slug || "-"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {cat.description || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: cat.isActive
                            ? (themeColors.success || themeColors.primary) +
                              "15"
                            : themeColors.border,
                          color: cat.isActive
                            ? themeColors.success || themeColors.primary
                            : themeColors.text,
                        }}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {cat.createdAt ? fmtDate(cat.createdAt) : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {/* Active/Inactive Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          disabled={!isLoggedIn || saving}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: cat.isActive
                              ? themeColors.warning || "#f59e0b"
                              : themeColors.success || themeColors.primary,
                          }}
                          title={
                            isLoggedIn
                              ? cat.isActive
                                ? "Mark as Inactive"
                                : "Mark as Active"
                              : "Login as admin to change status"
                          }
                        >
                          {cat.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          disabled={!isLoggedIn}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                          title={isLoggedIn ? "Edit" : "Login as admin to edit"}
                        >
                          <FaEdit />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          disabled={!isLoggedIn || saving}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.danger,
                          }}
                          title={
                            isLoggedIn ? "Delete" : "Login as admin to delete"
                          }
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 bg-black/40">
          <div
            className="w-full max-w-lg mx-4 rounded-2xl shadow-lg border flex flex-col max-h-[85vh]"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <h2
                className="text-lg font-semibold flex items-center gap-2"
                style={{ color: themeColors.text }}
              >
                <FaPlus />
                {editing ? "Edit Variety" : "Add New Variety"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-xl leading-none px-2"
                style={{ color: themeColors.text }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">

              {/* (Optional) show error inside modal */}
              {error && (
                <div
                  className="p-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: themeColors.danger + "15",
                    borderColor: themeColors.danger + "50",
                    color: themeColors.danger,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Variety Name"
                />
              </div>

              {/* Category Dropdown with Checkboxes */}
              <div ref={dropdownRef} className="relative">
                <label
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Categories <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer flex justify-between items-center bg-white"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  <span className="truncate">
                    {form.category.length > 0
                      ? productCategories
                          .filter((c) => form.category.includes(c._id || c.id))
                          .map((c) => c.name)
                          .join(", ")
                      : "Select Categories"}
                  </span>
                  <span className="text-xs opacity-60">▼</span>
                </div>
                {isCategoryDropdownOpen && (
                  <div
                    className="absolute z-10 w-full mt-1 flex flex-col gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg shadow-lg"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  >
                    {productCategories.map((c) => {
                      const cId = c._id || c.id;
                      const isChecked = form.category.includes(cId);
                      return (
                        <label key={cId} className="flex items-center gap-2 cursor-pointer hover:bg-black/5 p-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((prev) => ({ ...prev, category: [...prev.category, cId] }));
                              } else {
                                setForm((prev) => ({
                                  ...prev,
                                  category: prev.category.filter((id) => id !== cId),
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                          />
                          <span style={{ color: themeColors.text }} className="text-sm">
                            {c.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Slug (optional)
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={form.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="e.g. electronics"
                />
                <p
                  className="text-xs mt-1 opacity-70"
                  style={{ color: themeColors.text }}
                >
                  Leave blank to let the system generate a slug.
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Short description for this variety..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Variety Image <span className="text-xs opacity-70">(optional)</span>
                </label>

                {/* Image Preview */}
                {(form.imagePreview || form.imageUrl) && (
                  <div className="relative mb-3">
                    <img
                      src={form.imagePreview || form.imageUrl}
                      alt="Variety preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                      style={{ borderColor: themeColors.border }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* File Input */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:text-sm file:font-medium"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />
                <p
                  className="text-xs mt-1 opacity-70"
                  style={{ color: themeColors.text }}
                >
                  Supported formats: JPEG, PNG, WebP. Max size: 2MB
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isLoggedIn}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.onPrimary,
                  }}
                >
                  {saving
                    ? editing
                      ? "Saving..."
                      : "Creating..."
                    : editing
                      ? "Save Changes"
                      : "Create Variety"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
