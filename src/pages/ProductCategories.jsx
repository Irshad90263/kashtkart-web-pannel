// src/pages/ProductCategories.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../apis/categories";
import {
  FaTags,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const emptyForm = {
  name: "",
  description: "",
  image: null,
  imagePreview: "",
  imageUrl: "",
  imageRemoved: false,
};

export default function ProductCategories() {
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCategories();
      const list = Array.isArray(res) ? res : res.categories || [];
      setCategories(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image (JPEG, PNG, WebP)");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      setForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
        imageUrl: ""
      }));
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({
      ...prev,
      image: null,
      imagePreview: "",
      imageUrl: "",
      imageRemoved: true
    }));
  };

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
      description: cat.description || "",
      image: null,
      imagePreview: cat.image?.url || "",
      imageUrl: cat.image?.url || "",
      imageRemoved: false
    });
    setSuccess("");
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete categories.");
      return;
    }

    const id = cat._id || cat.id;
    if (!id) {
      setError("Cannot delete this category (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete category "${cat.name}"?`,
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
      await deleteCategory(id);
      setSuccess("Category deleted successfully.");

      if (editing && editing._id === cat._id) {
        resetForm();
      }

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Category deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      await fetchCategories();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete category.";
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
      setError("You must be logged in as admin to manage categories.");
      return;
    }

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let payload;
      if (form.image) {
        payload = new FormData();
        payload.append('name', form.name.trim());
        payload.append('description', form.description.trim());
        payload.append('image', form.image);
        if (editing && !form.imageUrl && !form.imagePreview) {
          payload.append('removeImage', 'true');
        }
      } else {
        payload = {
          name: form.name.trim(),
          description: form.description.trim(),
        };
        if (editing && form.imageUrl) {
          payload.imageUrl = form.imageUrl;
        }
        if (editing && !form.imageUrl && !form.imagePreview && form.imageRemoved) {
          payload.removeImage = true;
        }
      }

      if (editing) {
        const id = editing._id || editing.id;
        if (!id) throw new Error("Missing category identifier for update.");

        await updateCategory(id, payload);
        setSuccess("Category updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Category updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createCategory(payload);
        setSuccess("Category created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Category created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchCategories();
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to save category.";
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
      const desc = (c.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
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
            <FaTags />
            Categories
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage main categories for your e-commerce store.
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
              placeholder="Search categories..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
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
            title={isLoggedIn ? "Add new category" : "Login as admin to add"}
          >
            <FaPlus />
            Add Category
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
              You are viewing categories. Login as admin to add, edit, or delete
              categories.
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
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
            <FaTags />
            Category List
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
                {["Image", "Name", "Description", "Created At", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: themeColors.border }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id || cat.id}>
                    <td className="px-4 py-3">
                      {cat.image?.url ? (
                        <img
                          src={cat.image.url}
                          alt={cat.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                          style={{ borderColor: themeColors.border }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-lg border flex items-center justify-center text-[10px] opacity-50"
                          style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}
                        >
                          No image
                        </div>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: themeColors.text }}
                    >
                      {cat.name}
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs truncate"
                      style={{ color: themeColors.text }}
                      title={cat.description}
                    >
                      {cat.description || "-"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {cat.createdAt ? fmtDate(cat.createdAt) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          disabled={!isLoggedIn}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                          className="p-2 rounded-lg border text-xs disabled:opacity-40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
                <FaTags />
                {editing ? "Edit Category" : "Add New Category"}
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
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Category Name"
                />
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
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                  placeholder="Describe this category..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
                  Category Image <span className="text-red-500">*</span>
                </label>
                
                {/* Image Preview */}
                {(form.imagePreview || form.imageUrl) && (
                  <div className="relative mb-3">
                    <img
                      src={form.imagePreview || form.imageUrl}
                      alt="Category preview"
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
                <p className="text-xs mt-1 opacity-70" style={{ color: themeColors.text }}>
                  Supported formats: JPEG, PNG, WebP. Max size: 2MB
                </p>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center justify-end gap-2 pt-2 border-t"
                style={{ borderColor: themeColors.border }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border"
                  style={{
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{
                    backgroundColor: themeColors.primary,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
