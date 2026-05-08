// src/pages/AddBlog.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useNavigate, useParams } from "react-router-dom";
import { createBlog, updateBlog, getAllBlogs } from "../apis/blogs";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu as BubbleMenuComponent } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaLink,
  FaImage,
  FaArrowLeft,
  FaSave,
  FaEye,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaHighlighter,
  FaPalette,
  FaHeading,
  FaImages,
  FaPlus,
} from "react-icons/fa";
import http from "../apis/http"; // Assuming http instance for uploads
import Swal from "sweetalert2";

const MenuBar = ({ editor }) => {
  const { themeColors } = useTheme();
  if (!editor) return null;

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          editor.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const setLink = () => {
    const url = window.prompt("Enter URL");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttons = [
    {
      icon: <FaBold />,
      action: () => editor.chain().focus().toggleBold().run(),
      active: "bold",
      title: "Bold",
    },
    {
      icon: <FaItalic />,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: "italic",
      title: "Italic",
    },
    {
      icon: <FaUnderline />,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: "underline",
      title: "Underline",
    },
    { type: "divider" },
    {
      icon: <FaHeading />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: { heading: { level: 2 } },
      title: "H2",
    },
    {
      icon: <span className="text-xs font-bold">H3</span>,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: { heading: { level: 3 } },
      title: "H3",
    },
    { type: "divider" },
    {
      icon: <FaAlignLeft />,
      action: () => editor.chain().focus().setTextAlign("left").run(),
      active: { textAlign: "left" },
      title: "Align Left",
    },
    {
      icon: <FaAlignCenter />,
      action: () => editor.chain().focus().setTextAlign("center").run(),
      active: { textAlign: "center" },
      title: "Align Center",
    },
    {
      icon: <FaAlignRight />,
      action: () => editor.chain().focus().setTextAlign("right").run(),
      active: { textAlign: "right" },
      title: "Align Right",
    },
    { type: "divider" },
    {
      icon: <FaListUl />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: "bulletList",
      title: "Bullet List",
    },
    {
      icon: <FaListOl />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: "orderedList",
      title: "Ordered List",
    },
    { type: "divider" },
    { icon: <FaLink />, action: setLink, active: "link", title: "Link" },
    { icon: <FaImage />, action: addImage, title: "Upload Image" },
    {
      icon: <FaHighlighter />,
      action: () => editor.chain().focus().toggleHighlight().run(),
      active: "highlight",
      title: "Highlight",
    },
    { type: "divider" },
    {
      icon: <FaUndo />,
      action: () => editor.chain().focus().undo().run(),
      title: "Undo",
    },
    {
      icon: <FaRedo />,
      action: () => editor.chain().focus().redo().run(),
      title: "Redo",
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50/50"
      style={{ borderColor: themeColors.border }}
    >
      {buttons.map((btn, i) =>
        btn.type === "divider" ? (
          <div key={i} className="w-px h-6 mx-1 bg-gray-300" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            className={`p-2 rounded-md transition-all ${btn.active && editor.isActive(btn.active) ? "bg-primary text-white shadow-sm" : "hover:bg-gray-200 text-gray-600"}`}
            title={btn.title}
          >
            <span className="flex items-center justify-center w-5 h-5">
              {btn.icon}
            </span>
          </button>
        ),
      )}
    </div>
  );
};

function AddBlog() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [selectedRelated, setSelectedRelated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      BubbleMenu,
    ],
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const node = schema.nodes.image.create({ src: e.target.result });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    content: "",
    onUpdate: ({ editor }) => {
      // Logic for content update if needed
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetching(true);
        // Fetch all blogs for "Related Blogs" selection
        const allBlogsRes = await getAllBlogs(1, 100);
        setRelatedBlogs(allBlogsRes.blogs || []);

        // If editing, fetch blog details
        if (id) {
          const res = await getAllBlogs(1, 1000); // Temporary way to find the blog
          const blogToEdit = res.blogs.find((b) => b._id === id);
          if (blogToEdit) {
            setTitle(blogToEdit.title);
            setImage(blogToEdit.image);
            editor?.commands.setContent(blogToEdit.description);
            setSelectedRelated(
              blogToEdit.relatedBlog?.map((b) =>
                typeof b === "object" ? b._id : b,
              ) || [],
            );
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchInitialData();
  }, [id, editor]);

  const handleSave = async (e) => {
    e.preventDefault();
    const content = editor?.getHTML();

    if (!title.trim() || !content || content === "<p></p>" || !image.trim()) {
      Swal.fire("Error", "Please fill all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      const blogData = {
        title,
        image,
        description: content,
        relatedBlog: selectedRelated,
      };

      if (id) {
        await updateBlog(id, blogData);
        Swal.fire("Success", "Blog updated successfully", "success");
      } else {
        await createBlog(blogData);
        Swal.fire("Success", "Blog created successfully", "success");
      }
      navigate("/blogs");
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to save blog",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleRelated = (blogId) => {
    setSelectedRelated((prev) =>
      prev.includes(blogId)
        ? prev.filter((i) => i !== blogId)
        : [...prev, blogId],
    );
  };

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto space-y-6 pb-12"
      style={{ fontFamily: currentFont.family }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/blogs")}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"
        >
          <FaArrowLeft /> Back to Blogs
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 rounded-md border flex items-center gap-2 hover:bg-gray-50 transition-all font-semibold"
            style={{ borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaEye /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-md text-white flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all font-bold disabled:opacity-50"
            style={{ backgroundColor: themeColors.primary }}
          >
            <FaSave />{" "}
            {loading ? "Saving..." : id ? "Update Blog" : "Publish Blog"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Section */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="bg-white p-8 rounded-md border shadow-sm space-y-6"
            style={{ borderColor: themeColors.border }}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title here..."
              className="w-full text-xl font-bold border-none outline-none placeholder:text-gray-200 text-gray-800"
            />

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Article Content
              </label>
              <div
                className="border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                style={{ borderColor: themeColors.border }}
              >
                <MenuBar editor={editor} />
                {editor && (
                  <BubbleMenuComponent editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => editor.isActive('image')}>
                    <div className="flex bg-white shadow-xl border rounded-lg p-1 gap-1 overflow-hidden" style={{ borderColor: themeColors.border }}>
                      <button 
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'text-primary' : 'text-gray-600'}`}
                        title="Align Left"
                      >
                        <FaAlignLeft size={14} />
                      </button>
                      <button 
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'text-primary' : 'text-gray-600'}`}
                        title="Align Center"
                      >
                        <FaAlignCenter size={14} />
                      </button>
                      <button 
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'text-primary' : 'text-gray-600'}`}
                        title="Align Right"
                      >
                        <FaAlignRight size={14} />
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1 self-center" />
                      <button 
                        onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}
                        className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600"
                      >
                        S
                      </button>
                      <button 
                        onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}
                        className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600"
                      >
                        M
                      </button>
                      <button 
                        onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}
                        className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600"
                      >
                        L
                      </button>
                    </div>
                  </BubbleMenuComponent>
                )}
                <EditorContent
                  editor={editor}
                  className="p-6 min-h-[400px] prose prose-sm max-w-none focus:outline-none custom-editor overflow-auto resize-y"
                  style={{ minHeight: '400px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div
            className="bg-white p-6 rounded-md border shadow-sm space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FaImages className="text-primary" /> Featured Image
            </h3>
            <div className="space-y-3">
              <div 
                onClick={() => document.getElementById('featured-image-input').click()}
                className="w-full aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group"
                style={{ borderColor: themeColors.border }}
              >
                {image ? (
                  <>
                    <img src={image} alt="Featured" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <FaPlus className="text-gray-300 text-2xl mb-2" />
                    <span className="text-xs font-bold text-gray-400">Click to Upload Image</span>
                  </>
                )}
              </div>
              <input 
                id="featured-image-input"
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (f) => setImage(f.target.result);
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
              <p className="text-[10px] text-gray-400 italic text-center">
                Recommended size: 1200x630px
              </p>
            </div>
          </div>

          {/* Related Blogs Selection */}
          <div
            className="bg-white p-6 rounded-md border shadow-sm space-y-4"
            style={{ borderColor: themeColors.border }}
          >
            <h3 className="font-bold text-gray-800">Related Blogs</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {relatedBlogs
                .filter((b) => b._id !== id)
                .map((blog) => (
                  <div
                    key={blog._id}
                    onClick={() => toggleRelated(blog._id)}
                    className={`p-3 rounded-md border cursor-pointer transition-all flex items-center gap-3 ${selectedRelated.includes(blog._id) ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-gray-50 border-gray-100"}`}
                  >
                    <div className="w-10 h-8 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={blog.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span
                      className={`text-xs font-medium truncate ${selectedRelated.includes(blog._id) ? "text-primary" : "text-gray-600"}`}
                    >
                      {blog.title}
                    </span>
                  </div>
                ))}
              {relatedBlogs.length <= 1 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  No other blogs to link.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none !important;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #ccc;
          padding-left: 1rem;
          font-style: italic;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
      `}</style>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPreview(false)}></div>
          <div className="relative bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-4 border-b flex items-center justify-between bg-gray-50" style={{ borderColor: themeColors.border }}>
              <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Live Preview</span>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <FaArrowLeft className="rotate-45" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-white">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  {title || "Untitled Blog Post"}
                </h1>

                {/* Featured Image */}
                {image && (
                  <div className="aspect-[16/9] rounded-[24px] overflow-hidden shadow-xl">
                    <img src={image} alt="Featured" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div 
                  className="prose prose-lg max-w-none custom-editor text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-center" style={{ borderColor: themeColors.border }}>
              <button 
                onClick={() => setShowPreview(false)}
                className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const editorStyles = `
  .custom-editor .ProseMirror {
    outline: none !important;
  }
  .custom-editor img {
    display: inline-block;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
    transition: box-shadow 0.2s;
    cursor: nwse-resize;
    position: relative;
  }
  .custom-editor img:hover {
    box-shadow: 0 0 0 3px #6366f150;
  }
  .custom-editor img.ProseMirror-selectednode {
    outline: 3px solid #6366f1;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
  }
  /* Custom Resize Logic */
  .custom-editor .image-resizer {
    display: inline-block;
    position: relative;
    line-height: 0;
  }
  .custom-editor .image-resizer img {
    margin: 0;
  }
  
  .custom-editor [style*="text-align: center"] {
    text-align: center;
  }
  .custom-editor [style*="text-align: right"] {
    text-align: right;
  }
  
  /* Heading styles */
  .custom-editor h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; }
  .custom-editor h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1.2rem; }

  /* Editor Resize Handle */
  .custom-editor.resize-y {
    resize: vertical;
    border-bottom: 2px solid #e5e7eb;
  }
`;

export default function AddBlogWithStyles() {
  return (
    <>
      <style>{editorStyles}</style>
      <AddBlog />
    </>
  );
}
