// src/pages/Blogs.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
} from "../apis/blogs";
import {
  FaBlog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaEye,
  FaImage,
  FaLink,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import Swal from "sweetalert2";

const emptyForm = {
  title: "",
  description: "",
  image: "",
  relatedBlog: [],
};

export default function Blogs() {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBlog, setViewBlog] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debouncing Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllBlogs(page, 10, debouncedSearch, statusFilter);
      setBlogs(res.blogs || []);
      setCurrentPage(res.pagination?.page || 1);
      setTotalPages(res.pagination?.pages || 1);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load blogs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [debouncedSearch, statusFilter, currentPage]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleEdit = (blog) => {
    navigate(`/blogs/edit/${blog._id || blog.id}`);
  };

  const openAddPage = () => {
    navigate("/blogs/add");
  };

  const handleDelete = async (blog) => {
    const blogId = blog._id || blog.id;
    if (!blogId) return;

    const result = await Swal.fire({
      title: `Delete blog "${blog.title}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: themeColors.danger || "#e02424",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      await deleteBlog(blogId);
      Swal.fire("Deleted!", "Blog has been deleted.", "success");
      await fetchBlogs(currentPage);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "Failed to delete blog.", "error");
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleStatus = async (blog) => {
    try {
      setSaving(true);
      await toggleBlogStatus(blog._id || blog.id);
      await fetchBlogs(currentPage);
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Blog is now ${!blog.isActive ? 'Active' : 'Inactive'}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "Failed to update status.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.image.trim()) {
      setError("Title, description and image are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      const blogData = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
      };

      if (editing) {
        await updateBlog(editing._id || editing.id, blogData);
        setSuccess("Blog updated successfully.");
      } else {
        await createBlog(blogData);
        setSuccess("Blog created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
      await fetchBlogs(currentPage);
      
      Swal.fire({
        icon: "success",
        title: editing ? "Updated!" : "Created!",
        text: editing ? "Blog updated successfully." : "Blog created successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save blog.");
    } finally {
      setSaving(false);
    }
  };

  const filteredBlogs = blogs; // Now fully server-side

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaBlog className="text-primary" />
            Blog Management
          </h1>
          {/* <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Manage your website's blog posts, descriptions, and related articles.
          </p> */}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title/desc..."
              className="pl-9 pr-4 py-2 rounded-md border text-sm focus:ring-2 transition-all w-48 lg:w-64"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-md border text-sm focus:ring-2 transition-all outline-none"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <button
            onClick={() => fetchBlogs(currentPage)}
            className="p-2.5 rounded-md border hover:bg-gray-50 transition-colors"
            style={{ borderColor: themeColors.border, color: themeColors.text }}
            title="Refresh"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={openAddPage}
            className="px-4 py-2.5 rounded-md text-white font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            style={{ backgroundColor: themeColors.primary }}
          >
            <FaPlus />
            Create Blog
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-md border overflow-hidden shadow-sm" style={{ borderColor: themeColors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Image</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Related</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FaSyncAlt className="animate-spin text-2xl text-primary" />
                      <span>Loading blogs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No blogs found. Start by creating one!
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-12 rounded-md overflow-hidden border bg-gray-100 flex-shrink-0">
                        {blog.image ? (
                          <img src={blog.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaImage />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-gray-900 line-clamp-1">{blog.title}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-xs text-gray-500">
                        {blog.description 
                          ? blog.description.replace(/<[^>]*>/g, '').split(' ').slice(0, 4).join(' ') + '...'
                          : 'No description'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                          {blog.relatedBlog?.length || 0} Links
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(blog)}
                          className={`p-2 rounded-md transition-colors ${
                            blog.isActive ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                          title={blog.isActive ? "Deactivate Blog" : "Activate Blog"}
                        >
                          {blog.isActive ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                        </button>
                        <button
                          onClick={() => navigate(`/blogs/view/${blog._id}`)}
                          className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Blog"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(blog)}
                          className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog)}
                          className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchBlogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border text-xs font-semibold disabled:opacity-30 hover:bg-gray-50 transition-colors"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Prev
              </button>
              <button
                onClick={() => fetchBlogs(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border text-xs font-semibold disabled:opacity-30 hover:bg-gray-50 transition-colors"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Preview Modal */}
      {viewBlog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewBlog(null)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-md shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
              <h3 className="font-bold text-gray-800">Blog Preview</h3>
              <button onClick={() => setViewBlog(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FaPlus className="rotate-45" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {viewBlog.image && (
                <div className="aspect-video rounded-md overflow-hidden border">
                  <img src={viewBlog.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{viewBlog.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    Slug: {viewBlog.slug || 'N/A'}
                  </span>
                </div>
              </div>
              <div 
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: viewBlog.description }}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end" style={{ borderColor: themeColors.border }}>
              <button 
                onClick={() => setViewBlog(null)}
                className="px-6 py-2 rounded-md bg-gray-900 text-white font-bold hover:bg-black transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
}