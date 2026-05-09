import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getBlogAdmin } from "../apis/blogs";
import { FaArrowLeft, FaEdit, FaCalendarAlt, FaLink, FaImage, FaClock, FaUser, FaPhoneAlt, FaCommentDots } from "react-icons/fa";

export default function ViewBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const openImageInNewTab = (base64String) => {
    const image = new Image();
    image.src = base64String;
    const w = window.open("");
    w.document.write(image.outerHTML);
    w.document.title = "Featured Image";
    w.document.close();
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await getBlogAdmin(id);
        setBlog(res.blog);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderBottomColor: themeColors.primary }}></div>
    </div>
  );

  if (!blog) return (
    <div className="text-center py-20 bg-white rounded-md border" style={{ borderColor: themeColors.border }}>
      <h2 className="text-lg font-bold text-gray-800">Blog not found</h2>
      <button onClick={() => navigate("/blogs")} className="mt-2 text-sm text-primary font-bold hover:underline">Return to list</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20" style={{ fontFamily: currentFont.family }}>
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-md border shadow-sm" style={{ borderColor: themeColors.border }}>
        <button
          onClick={() => navigate(-1)}
          className="flex p-2 border bg-gray-100 rounded-md cursor-pointer items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-all uppercase tracking-wider"
        >
          <FaArrowLeft /> Back to Blogs
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
            className="px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 hover:scale-105 transition-all font-bold"
            style={{ backgroundColor: themeColors.primary }}
          >
            <FaEdit size={12} /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-md border shadow-sm" style={{ borderColor: themeColors.border }}>
            {/* Title Section */}
            <div className="mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-6 h-[1px] bg-gray-200"></span> Blog Title
              </h3>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
                {blog.title}
              </h1>
            </div>
            
            {/* Content Section */}
            <div className="pt-0 border-t border-gray-50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <span className="w-6 h-[1px] bg-gray-200"></span> Blog Content
              </h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed admin-blog-content"
                dangerouslySetInnerHTML={{ __html: blog.description }}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Metadata & Featured Image */}
        <div className="space-y-6">
          {/* Compact Featured Image */}
          <div className="bg-white p-4 rounded-md border shadow-sm space-y-3" style={{ borderColor: themeColors.border }}>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <FaImage className="text-primary" /> Featured Image
            </h3>
            <div 
              onClick={() => blog.image && openImageInNewTab(blog.image)}
              className="aspect-[4/3] rounded-md overflow-hidden bg-gray-50 border relative group cursor-zoom-in" 
              style={{ borderColor: themeColors.border }}
              title="Click to view full image"
            >
              <img 
                src={blog.image} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <span className="bg-white/90 text-[10px] font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Expand
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white p-6 rounded-md border shadow-sm space-y-4" style={{ borderColor: themeColors.border }}>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Post Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                  <FaCalendarAlt size={10} /> Published
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {new Date(blog.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                  <FaLink size={10} /> Related
                </span>
                <span className="text-[10px] font-bold text-primary truncate max-w-[120px] bg-primary/5 px-2 py-1 rounded">
                  {blog.slug || 'n/a'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                  <FaClock size={10} /> Status
                </span>
                <span className="text-[10px] font-black uppercase text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                  Published
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Comments Section */}
      <div className="bg-white p-8 rounded-md border shadow-sm" style={{ borderColor: themeColors.border }}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
          <span className="w-6 h-[1px] bg-gray-200"></span> User Comments ({blog.comments?.length || 0})
        </h3>
        
        <div className="space-y-4">
          {blog.comments && blog.comments.length > 0 ? (
            blog.comments.map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold" style={{ color: themeColors.primary, backgroundColor: `${themeColors.primary}15` }}>
                      {item.user?.firstName?.charAt(0) || <FaUser size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.user ? `${item.user.firstName} ${item.user.lastName}` : "Unknown User"}
                      </p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <FaClock size={8} /> {new Date(item.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                      <FaPhoneAlt size={10} className="text-green-500" />
                      <span className="text-xs font-bold text-gray-700">{item.user?.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FaCommentDots className="text-gray-300 mt-1 flex-shrink-0" size={14} />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.comment}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <FaCommentDots size={30} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No comments yet on this post.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-blog-content h2 { font-size: 1.1rem; font-weight: 800; color: #111827; margin: 1.5rem 0 0.75rem 0; }
        .admin-blog-content h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-top: 1.25rem; }
        .admin-blog-content p { font-size: 0.875rem; margin-bottom: 1rem; color: #4b5563; }
        .admin-blog-content img { border-radius: 12px; margin: 1.5rem 0; max-width: 100%; height: auto; border: 1px solid #f3f4f6; }
        .admin-blog-content ul, .admin-blog-content ol { font-size: 0.875rem; padding-left: 1.25rem; margin-bottom: 1rem; }
        .admin-blog-content blockquote { border-left: 3px solid ${themeColors.primary}; padding-left: 1rem; font-style: italic; color: #6b7280; margin: 1.5rem 0; }
      `}} />
    </div>
  );
}
