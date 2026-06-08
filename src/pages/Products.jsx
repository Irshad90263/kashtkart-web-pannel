// src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { getVarieties } from "../apis/varieties";
import { getCategories } from "../apis/categories";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../apis/products";
import { getVendorList } from "../apis/vendor";
import Pagination from "../components/Pagination";
import {
  FaBoxOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaImage,
  FaTable,
  FaThLarge,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaChevronDown,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : (n ?? "-");

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : (n ?? "-");

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

export default function Products() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [varieties, setVarieties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"
  const [statusFilter, setStatusFilter] = useState("active"); // 'active' or 'inactive'





  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ---------- fetchers ----------
  const fetchVarieties = async () => {
    try {
      const res = await getVarieties();
      const list = Array.isArray(res) ? res : res.categories || res.varieties || [];
      setVarieties(list);
    } catch (e) {
      console.error("Failed to load varieties", e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const list = Array.isArray(res) ? res : res.categories || [];
      setCategories(list);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await getVendorList();
      const list = res.vendors || [];
      setVendors(list);
    } catch (e) {
      console.error("Failed to load vendors", e);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const res = await listProducts(statusFilter, page, 10, search);
      setProducts(res.products || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVarieties();
    fetchCategories();
    fetchVendors();
  }, []);

  // Fetch products when status filter or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
  };

  // varietyId -> name map
  const varietyMap = useMemo(() => {
    const map = {};
    varieties.forEach((v) => {
      const id = v._id || v.id;
      if (id) map[id] = v.name;
    });
    return map;
  }, [varieties]);

  // categoryId -> name map
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const id = c._id || c.id;
      if (id) map[id] = c.name;
    });
    return map;
  }, [categories]);



  const getFinalPrice = (p) => {
    if (typeof p.finalPrice === "number") return p.finalPrice;
    if (typeof p.price === "number" && p.discountPercent) {
      const discount = (p.price * Number(p.discountPercent || 0)) / 100;
      return p.price - discount;
    }
    return p.price;
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
            <FaBoxOpen />
            Products
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage your e-commerce products, pricing, varieties and images.
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
              placeholder="Search products..."
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
            onClick={fetchProducts}
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

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden border text-sm"
            style={{ borderColor: themeColors.border }}
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 flex items-center gap-1 ${
                viewMode === "table" ? "" : "opacity-70"
              }`}
              style={{
                backgroundColor:
                  viewMode === "table" ? themeColors.surface : "transparent",
                color: themeColors.text,
              }}
            >
              <FaTable /> <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`px-3 py-2 flex items-center gap-1 border-l`}
              style={{
                borderColor: themeColors.border,
                backgroundColor:
                  viewMode === "card" ? themeColors.surface : "transparent",
                opacity: viewMode === "card" ? 1 : 0.7,
                color: themeColors.text,
              }}
            >
              <FaThLarge /> <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/products/add")}
            disabled={!isLoggedIn}
            className="px-2 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
            title={isLoggedIn ? "Add new product" : "Login as admin to add"}
          >
            <FaPlus />
            Add
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
              You are viewing products as public. Login as admin to add, edit,
              or delete products.
            </div>
          )}
        </div>
      )}

      {/* Products list: table / card */}
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
            <FaBoxOpen />
            {viewMode === "table" ? "Product List" : "Product Cards"}
          </span>
          <span className="text-xs opacity-70">
            {products.length} of {pagination.total} total
          </span>
        </h2>

        {viewMode === "table" ? (
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
                    "Variety",
                    "Price",
                    "Discount",
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
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const varietyName = p.variety?.name || "-";
                    const categoryName = p.category?.name || "-";
                    return (
                      <tr key={p._id || p.id || p.slug}>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {p.name}
                          {p.discountPercent ? (
                            <span className="ml-1 text-xs opacity-60">
                              ({p.discountPercent}% off)
                            </span>
                          ) : null}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {categoryName}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {varietyName}
                        </td>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(p.price)}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {p.discountPercent ? `${p.discountPercent}%` : "-"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: p.isActive
                                ? (themeColors.success || themeColors.primary) +
                                  "15"
                                : themeColors.border,
                              color: p.isActive
                                ? themeColors.success || themeColors.primary
                                : themeColors.text,
                            }}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {p.createdAt ? fmtDate(p.createdAt) : "-"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {/* Active/Inactive Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p)}
                              disabled={!isLoggedIn || saving}
                              className="p-2 rounded-lg border text-xs disabled:opacity-40 cursor-pointer"
                              style={{
                                borderColor: themeColors.border,
                                color: p.isActive
                                  ? themeColors.warning || "#f59e0b"
                                  : themeColors.success || themeColors.primary,
                              }}
                              title={
                                isLoggedIn
                                  ? p.isActive
                                    ? "Mark as Inactive"
                                    : "Mark as Active"
                                  : "Login as admin to change status"
                              }
                            >
                              {p.isActive ? <FaToggleOn /> : <FaToggleOff />}
                            </button>

                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => navigate(`/products/view/${p._id || p.id}`)}
                              className="p-2 rounded-lg border text-xs"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title="View full details"
                            >
                              <FaEye />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => navigate(`/products/edit/${p._id || p.id}`)}
                              disabled={!isLoggedIn}
                              className="p-2 rounded-lg border text-xs disabled:opacity-40 cursor-pointer"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title={
                                isLoggedIn ? "Edit" : "Login as admin to edit"
                              }
                            >
                              <FaEdit />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              disabled={!isLoggedIn || saving}
                              className="p-2 rounded-lg border text-xs disabled:opacity-40 cursor-pointer"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.danger,
                              }}
                              title={
                                isLoggedIn
                                  ? "Delete"
                                  : "Login as admin to delete"
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            {loading ? (
              <div
                className="py-12 text-center text-sm"
                style={{ color: themeColors.text }}
              >
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div
                className="py-12 text-center text-sm"
                style={{ color: themeColors.text }}
              >
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p) => {
                  const catName =
                    p.category?.name ||
                    p.categoryId?.name ||
                    categoryMap[p.categoryId] ||
                    "-";
                  const finalPrice = getFinalPrice(p);
                  return (
                    <div
                      key={p._id || p.id || p.slug}
                      className="rounded-xl border flex flex-col overflow-hidden"
                      style={{ borderColor: themeColors.border }}
                    >
                      {/* Image */}
                      <div className="relative">
                        <img
                          src={
                            p.mainImage?.url || p.galleryImages?.[0]?.url || ""
                          }
                          alt={p.name}
                          className="w-full h-40 object-cover"
                        />
                        {p.discountPercent ? (
                          <span
                            className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: themeColors.primary + "dd",
                              color: themeColors.onPrimary,
                            }}
                          >
                            {p.discountPercent}% OFF
                          </span>
                        ) : null}
                        {!p.isActive && (
                          <span
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: themeColors.danger + "dd",
                              color: themeColors.onPrimary,
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div
                        className="p-4 flex-1 flex flex-col gap-2"
                        style={{ backgroundColor: themeColors.surface }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className="font-semibold text-sm mb-1"
                              style={{ color: themeColors.text }}
                            >
                              {p.name}
                            </h3>
                            <p
                              className="text-xs opacity-75"
                              style={{ color: themeColors.text }}
                            >
                              {catName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm font-bold"
                              style={{ color: themeColors.primary }}
                            >
                              {fmtCurrency(finalPrice)}
                            </div>
                            {p.discountPercent ? (
                              <div className="text-[11px] opacity-70 line-through">
                                {fmtCurrency(p.price)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {p.description && (
                          <p
                            className="text-xs mt-1 line-clamp-2"
                            style={{ color: themeColors.text }}
                          >
                            {p.description}
                          </p>
                        )}
                        {p.about?.ingredients && (
                          <p
                            className="text-[11px] opacity-70"
                            style={{ color: themeColors.text }}
                          >
                            Ingredients: {p.about.ingredients}
                          </p>
                        )}

                        {/* Sizes / Colors */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.isArray(p.sizes) &&
                            p.sizes.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-full text-[11px]"
                                style={{
                                  backgroundColor:
                                    themeColors.background + "60",
                                  color: themeColors.text,
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          {Array.isArray(p.colors) &&
                            p.colors.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded-full text-[11px]"
                                style={{
                                  backgroundColor:
                                    themeColors.background + "60",
                                  color: themeColors.text,
                                }}
                              >
                                {c}
                              </span>
                            ))}
                        </div>

                        {/* Add-ons */}
                        {Array.isArray(p.addOns) && p.addOns.length > 0 && (
                          <div className="mt-1">
                            <p
                              className="text-[11px] font-semibold mb-1"
                              style={{ color: themeColors.text }}
                            >
                              Add-ons
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {p.addOns.map((a, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full text-[11px]"
                                  style={{
                                    backgroundColor: a.isDefault
                                      ? (themeColors.success ||
                                          themeColors.primary) + "20"
                                      : themeColors.background + "60",
                                    color: themeColors.text,
                                  }}
                                >
                                  {a.name}{" "}
                                  {a.price ? `(+${fmtCurrency(a.price)})` : ""}
                                  {a.isDefault ? " • Default" : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gallery thumbnails */}
                        {Array.isArray(p.galleryImages) &&
                          p.galleryImages.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 overflow-x-auto">
                                {p.galleryImages.map((g, i) => (
                                  <img
                                    key={i}
                                    src={g.url}
                                    alt={`${p.name} ${i + 1}`}
                                    className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Footer */}
                        <div className="mt-auto pt-2 flex items-center justify-between text-[11px]">
                          <span
                            style={{ color: themeColors.text }}
                            className="opacity-70"
                          >
                            Created: {p.createdAt ? fmtDate(p.createdAt) : "-"}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* View button in card */}
                            <button
                              type="button"
                              onClick={() => navigate(`/products/view/${p._id || p.id}`)}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title="View full details"
                            >
                              <FaEye /> View
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/products/edit/${p._id || p.id}`)}
                              disabled={!isLoggedIn}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title={
                                isLoggedIn ? "Edit" : "Login as admin to edit"
                              }
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              disabled={!isLoggedIn || saving}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.danger,
                              }}
                              title={
                                isLoggedIn
                                  ? "Delete"
                                  : "Login as admin to delete"
                              }
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
