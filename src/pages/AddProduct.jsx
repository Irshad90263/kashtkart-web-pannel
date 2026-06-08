// src/pages/AddProduct.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getVarieties } from "../apis/varieties";
import { getCategories } from "../apis/categories";
import { getVendorList } from "../apis/vendor";
import {
  getProduct,
  createProduct,
  updateProduct,
  listProducts,
} from "../apis/products";
import {
  FaArrowLeft,
  FaSave,
  FaChevronDown,
  FaImage,
  FaPlus,
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaHeading,
  FaUndo,
  FaRedo,
  FaLink,
  FaQuoteLeft,
  FaHighlighter,
  FaPalette,
} from "react-icons/fa";
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
import Swal from "sweetalert2";

const MenuBar = ({ editor }) => {
  const { themeColors } = useTheme();
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);

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

  const textColors = [
    { name: "Black", value: "#000000" },
    { name: "Dark Gray", value: "#374151" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Orange", value: "#f97316" },
    { name: "Purple", value: "#8b5cf6" },
  ];

  const highlightColors = [
    { name: "Yellow", value: "#fef08a" },
    { name: "Green", value: "#bbf7d0" },
    { name: "Blue", value: "#bfdbfe" },
    { name: "Pink", value: "#fbcfe8" },
    { name: "Orange", value: "#ffedd5" },
  ];

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
    {
      icon: <FaQuoteLeft />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: "blockquote",
      title: "Blockquote",
    },
    { type: "divider" },
    { icon: <FaLink />, action: setLink, active: "link", title: "Link" },
    { icon: <FaImage />, action: addImage, title: "Upload Image" },
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
      className="flex flex-wrap items-center gap-1.5 p-1.5 border-b bg-gray-50/50"
      style={{ borderColor: themeColors.border }}
    >
      {buttons.map((btn, i) =>
        btn.type === "divider" ? (
          <div key={i} className="w-px h-5 mx-0.5 bg-gray-300" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={btn.action}
            className={`p-1.5 rounded-md transition-all ${btn.active && editor.isActive(btn.active) ? "bg-primary text-white shadow-sm" : "hover:bg-gray-200 text-gray-600"}`}
            style={btn.active && editor.isActive(btn.active) ? { backgroundColor: themeColors.primary } : {}}
            title={btn.title}
          >
            <span className="flex items-center justify-center w-4 h-4 text-xs">
              {btn.icon}
            </span>
          </button>
        ),
      )}

      <div className="w-px h-5 mx-0.5 bg-gray-300" />

      {/* Text Color Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setTextColorOpen(!textColorOpen);
            setHighlightColorOpen(false);
          }}
          className={`p-1.5 rounded-md hover:bg-gray-200 transition-all flex items-center justify-center ${textColorOpen ? "bg-gray-200" : ""} text-gray-600`}
          title="Text Color"
        >
          <span className="flex items-center justify-center w-4 h-4 text-xs">
            <FaPalette />
          </span>
        </button>
        {textColorOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setTextColorOpen(false)}></div>
            <div className="absolute z-20 left-0 mt-1.5 p-2 bg-white border rounded-lg shadow-xl grid grid-cols-4 gap-1.5 min-w-[120px]" style={{ borderColor: themeColors.border }}>
              {textColors.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(col.value).run();
                    setTextColorOpen(false);
                  }}
                  className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setTextColorOpen(false);
                }}
                className="col-span-4 text-[10px] font-bold py-1 hover:bg-gray-100 rounded text-gray-600 border border-gray-100 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Highlight/Background Color Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setHighlightColorOpen(!highlightColorOpen);
            setTextColorOpen(false);
          }}
          className={`p-1.5 rounded-md hover:bg-gray-200 transition-all flex items-center justify-center ${highlightColorOpen ? "bg-gray-200" : ""} text-gray-600`}
          title="Highlight Color"
        >
          <span className="flex items-center justify-center w-4 h-4 text-xs">
            <FaHighlighter />
          </span>
        </button>
        {highlightColorOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setHighlightColorOpen(false)}></div>
            <div className="absolute z-20 left-0 mt-1.5 p-2 bg-white border rounded-lg shadow-xl grid grid-cols-3 gap-1.5 min-w-[100px]" style={{ borderColor: themeColors.border }}>
              {highlightColors.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: col.value }).run();
                    setHighlightColorOpen(false);
                  }}
                  className="w-5 h-5 rounded-md border border-gray-200 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightColorOpen(false);
                }}
                className="col-span-3 text-[10px] font-bold py-1 hover:bg-gray-100 rounded text-gray-600 border border-gray-100 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const emptyForm = {
  name: "",
  price: "",
  discountPercent: "",
  categoryId: "",
  varietyId: "",
  description: "",
  ingredients: "",
  shelfLife: "",
  netWeight: [],
  vendor_id: "",
  relatedProducts: [],
  aboutHtml: "",
};

function AddProduct() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isView = location.pathname.includes("/products/view");

  const [varieties, setVarieties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);

  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [netWeightDropdownOpen, setNetWeightDropdownOpen] = useState(false);
  const [relatedDropdownOpen, setRelatedDropdownOpen] = useState(false);
  const [customWeightInput, setCustomWeightInput] = useState("");
  const [relatedSearchQuery, setRelatedSearchQuery] = useState("");
  const [existingImages, setExistingImages] = useState({ mainImage: null, galleryImages: [] });

  const [editorInitialized, setEditorInitialized] = useState(false);

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
  });

  // Sync editor content once when product is fetched
  useEffect(() => {
    if (editor && form.aboutHtml && !editorInitialized) {
      editor.commands.setContent(form.aboutHtml);
      setEditorInitialized(true);
    }
  }, [editor, form.aboutHtml, editorInitialized]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isView);
    }
  }, [editor, isView]);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      const [varRes, catRes, venRes, prodRes] = await Promise.all([
        getVarieties(),
        getCategories(),
        getVendorList(),
        listProducts("active", 1, 1000)
      ]);

      const varList = Array.isArray(varRes) ? varRes : varRes.categories || varRes.varieties || [];
      setVarieties(varList);

      const catList = Array.isArray(catRes) ? catRes : catRes.categories || [];
      setCategories(catList);

      const venList = venRes.vendors || [];
      setVendors(venList);

      const prodList = prodRes.products || [];
      setAllProducts(prodList);

      if (id) {
        const prodData = await getProduct(id);
        const prod = prodData.product;
        if (prod) {
          setForm({
            name: prod.name || "",
            price: typeof prod.price === "number" ? String(prod.price) : prod.price || "",
            discountPercent: typeof prod.discountPercent === "number" ? String(prod.discountPercent) : prod.discountPercent || "",
            varietyId: prod.variety?._id || prod.variety?.id || prod.variety || "",
            categoryId: prod.category?._id || prod.category?.id || prod.category || "",
            description: prod.description || "",
            ingredients: prod.about?.ingredients || "",
            shelfLife: prod.about?.shelfLife || "",
            netWeight: Array.isArray(prod.about?.netWeight) ? prod.about.netWeight : (prod.about?.netWeight ? [String(prod.about.netWeight)] : []),
            vendor_id: prod.vendor_id?._id || prod.vendor_id || "",
            relatedProducts: Array.isArray(prod.relatedProducts)
              ? prod.relatedProducts.map((rp) => rp._id || rp.id || rp)
              : [],
            aboutHtml: prod.about?.aboutHtml || "",
          });
          setExistingImages({
            mainImage: prod.mainImage,
            galleryImages: prod.galleryImages || []
          });
        }
      }
    } catch (e) {
      console.error("Failed to load initial data", e);
      setError("Failed to load initial product data.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const filteredVarietiesForSelect = useMemo(() => {
    if (!form.categoryId) return varieties;
    return varieties.filter((v) => {
      const catId = v.category?._id || v.category || "";
      return catId === form.categoryId;
    });
  }, [varieties, form.categoryId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    setMainImageFile(file || null);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setGalleryImageFiles((prev) => [...prev, ...files]);
  };

  const removeGalleryImage = (index) => {
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("price", form.price.trim());

    if (form.discountPercent?.trim() !== "") {
      fd.append("discountPercent", form.discountPercent.trim());
    }

    if (form.categoryId) {
      fd.append("categoryId", form.categoryId);
    }

    if (form.varietyId) {
      fd.append("varietyId", form.varietyId);
    }

    if (form.vendor_id) {
      fd.append("vendor_id", form.vendor_id);
    }

    if (form.description.trim()) {
      fd.append("description", form.description.trim());
    }

    const aboutData = {
      ingredients: form.ingredients.trim(),
      shelfLife: form.shelfLife.trim(),
      netWeight: form.netWeight,
      aboutHtml: editor?.getHTML() || "",
    };
    fd.append("about", JSON.stringify(aboutData));
    fd.append("relatedProducts", JSON.stringify(form.relatedProducts || []));

    if (mainImageFile) {
      fd.append("mainImage", mainImageFile);
    }

    if (galleryImageFiles.length > 0) {
      galleryImageFiles.forEach((file) => {
        fd.append("galleryImages", file);
      });
    }

    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("You must be logged in as admin to manage products.");
      return;
    }

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!form.price.trim()) {
      setError("Price is required.");
      return;
    }
    if (!id && !mainImageFile) {
      setError("Main image is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const fd = buildFormData();

      if (id) {
        await updateProduct(id, fd);
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Product updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createProduct(fd);
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Product created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      navigate("/products");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save product.";
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

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 animate-fadeIn" style={{ fontFamily: currentFont.family }}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-semibold cursor-pointer"
          style={{ color: themeColors.text }}
        >
          <FaArrowLeft /> Back to Products
        </button>
        <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
          {isView ? "View Product Details" : id ? "Edit Product" : "Add New Product"}
        </h2>
      </div>

      <div
        className="bg-white rounded-xl border p-4 md:p-5 shadow-sm"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-lg text-sm border animate-fadeIn"
              style={{
                backgroundColor: themeColors.danger + "15",
                borderColor: themeColors.danger + "50",
                color: themeColors.danger,
              }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block mb-1 text-xs font-semibold"
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
                disabled={isView}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Product Name"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-1">
              <label
                htmlFor="categoryId"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                disabled={isView}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Variety */}
            <div className="md:col-span-1">
              <label
                htmlFor="varietyId"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Variety <span className="text-red-500">*</span>
              </label>
              <select
                id="varietyId"
                name="varietyId"
                value={form.varietyId}
                onChange={handleChange}
                required
                disabled={isView}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
              >
                <option value="">Select variety</option>
                {filteredVarietiesForSelect.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="md:col-span-1">
              <label
                htmlFor="price"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                disabled={isView}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Product base price"
              />
            </div>

            {/* Discount */}
            <div className="md:col-span-1">
              <label
                htmlFor="discountPercent"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Discount (%)
              </label>
              <input
                id="discountPercent"
                name="discountPercent"
                type="number"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={handleChange}
                disabled={isView}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Discount percent"
              />
            </div>

            {/* Net Weight */}
            <div className="relative md:col-span-1">
              <label
                htmlFor="netWeight"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Net Weight
              </label>
              <div className="relative">
                <div
                  onClick={() => setNetWeightDropdownOpen(!netWeightDropdownOpen)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm cursor-pointer flex flex-wrap gap-1 items-center min-h-[34px]"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  {form.netWeight.length > 0 ? (
                    form.netWeight.map((nw) => (
                      <span
                        key={nw}
                        className="px-2 py-0.5 rounded text-[11px] flex items-center gap-1 font-medium"
                        style={{
                          backgroundColor: themeColors.primary + "15",
                          color: themeColors.primary,
                        }}
                      >
                        {nw}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => ({
                              ...prev,
                              netWeight: prev.netWeight.filter((w) => w !== nw),
                            }));
                          }}
                          className="opacity-70 hover:opacity-100 font-bold text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="opacity-60 text-xs">Select Weights</span>
                  )}
                  <FaChevronDown
                    className={`w-3 h-3 ml-auto transition-transform duration-300 ${netWeightDropdownOpen ? "rotate-180" : ""}`}
                    style={{ color: themeColors.text }}
                  />
                </div>

                {netWeightDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[45]"
                      onClick={() => setNetWeightDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-[50] w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-xl custom-scrollbar"
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      }}
                    >
                      {["3kg", "6kg", "9kg"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-black/5 transition-colors border-b border-black/5"
                          style={{ color: themeColors.text }}
                        >
                          <input
                            type="checkbox"
                            checked={form.netWeight.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((prev) => ({
                                  ...prev,
                                  netWeight: [...prev.netWeight, option],
                                }));
                              } else {
                                setForm((prev) => ({
                                  ...prev,
                                  netWeight: prev.netWeight.filter(
                                    (w) => w !== option
                                  ),
                                }));
                              }
                            }}
                            className="rounded border-gray-300 focus:ring-2"
                            style={{ accentColor: themeColors.primary }}
                          />
                          <span className="text-sm font-medium">{option}</span>
                        </label>
                      ))}
                      
                      {/* Custom input placed directly inside the dropdown */}
                      <div className="p-3 border-t border-black/5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customWeightInput}
                            onChange={(e) => setCustomWeightInput(e.target.value)}
                            placeholder="Custom (e.g. 5kg)"
                            className="flex-1 px-3 py-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            style={{
                              backgroundColor: themeColors.background,
                              borderColor: themeColors.border,
                              color: themeColors.text,
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (customWeightInput.trim() && !form.netWeight.includes(customWeightInput.trim())) {
                                  setForm((prev) => ({
                                    ...prev,
                                    netWeight: [...prev.netWeight, customWeightInput.trim()]
                                  }));
                                }
                                setCustomWeightInput("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (customWeightInput.trim() && !form.netWeight.includes(customWeightInput.trim())) {
                                setForm((prev) => ({
                                  ...prev,
                                  netWeight: [...prev.netWeight, customWeightInput.trim()]
                                }));
                              }
                              setCustomWeightInput("");
                            }}
                            className="px-4 py-2 rounded text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
                            style={{
                              backgroundColor: themeColors.primary,
                              color: themeColors.onPrimary,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Vendor */}
            <div className="relative md:col-span-1">
              <label
                htmlFor="vendor_id"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Vendor
              </label>
              <div className="relative">
                <div
                  onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm cursor-pointer flex justify-between items-center min-h-[34px]"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  <span className="truncate">
                    {form.vendor_id
                      ? vendors.find((v) => v._id === form.vendor_id)?.name || "Select Vendor"
                      : "Select Vendor"}
                  </span>
                  <FaChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${vendorDropdownOpen ? "rotate-180" : ""}`}
                    style={{ color: themeColors.text }}
                  />
                </div>

                {vendorDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[45]"
                      onClick={() => setVendorDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-[50] w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-xl custom-scrollbar"
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      }}
                    >
                      <div
                        onClick={() => {
                          setForm((prev) => ({ ...prev, vendor_id: "" }));
                          setVendorDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-black/5 transition-colors"
                        style={{ color: themeColors.text }}
                      >
                        Select Vendor
                      </div>
                      {vendors.map((v) => (
                        <div
                          key={v._id}
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              vendor_id: v._id,
                            }));
                            setVendorDropdownOpen(false);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-black/5 transition-colors border-t border-black/5"
                          style={{
                            backgroundColor: form.vendor_id === v._id ? themeColors.primary + "10" : "transparent",
                          }}
                        >
                          <div
                            className="text-sm font-medium"
                            style={{ color: themeColors.text }}
                          >
                            {v.name}
                          </div>
                          {v.contactDetails?.phoneNumber && (
                            <div
                              className="text-[11px] opacity-60 mt-0.5"
                              style={{ color: themeColors.text }}
                            >
                              {v.contactDetails.phoneNumber}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shelf Life */}
            <div className="md:col-span-1">
              <label
                htmlFor="shelfLife"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Shelf Life
              </label>
              <input
                id="shelfLife"
                name="shelfLife"
                type="text"
                value={form.shelfLife}
                onChange={handleChange}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="e.g. 5 days, 1 month"
              />
            </div>

            {/* Ingredients */}
            <div className="md:col-span-1">
              <label
                htmlFor="ingredients"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Ingredients
              </label>
              <input
                id="ingredients"
                name="ingredients"
                type="text"
                value={form.ingredients}
                onChange={handleChange}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Desi ghee, Besan etc."
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                placeholder="Write about the product..."
              />
            </div>

            {/* Main Image */}
            <div className="md:col-span-1">
              <label
                htmlFor="mainImageInput"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Main Image {!id && <span className="text-red-500">*</span>}
              </label>
              <label
                htmlFor="mainImageInput"
                className="block border-2 border-dashed rounded-lg px-3 py-2 text-[11px] cursor-pointer flex items-center justify-between hover:bg-black/[0.02]"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                }}
              >
                <span className="flex items-center gap-1.5 truncate mr-2">
                  <FaImage size={14} className="shrink-0" />
                  <span className="truncate text-xs">
                    {mainImageFile ? mainImageFile.name : "Choose main image"}
                  </span>
                </span>
                <span
                  className="px-2 py-0.5 rounded-full border text-[9px] bg-white font-medium shrink-0"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                  Browse
                </span>
              </label>
              <input
                id="mainImageInput"
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="hidden"
              />
              
              {/* Main Image Preview if editing */}
              {id && !mainImageFile && existingImages.mainImage && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] opacity-70">Current:</span>
                  <img src={existingImages.mainImage.url} alt="main" className="w-8 h-8 object-cover rounded border" style={{ borderColor: themeColors.border }} />
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="md:col-span-2">
              <label
                htmlFor="galleryImagesInput"
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Gallery Images (Multiple)
              </label>
              <label
                htmlFor="galleryImagesInput"
                className="block border-2 border-dashed rounded-lg px-3 py-2 text-[11px] cursor-pointer flex items-center justify-between hover:bg-black/[0.02]"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <FaPlus size={12} />
                  <span className="text-xs">Add Gallery Images (Multiple)</span>
                </span>
                <span
                  className="px-2 py-0.5 rounded-full border text-[9px] bg-white font-medium"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                  Browse
                </span>
              </label>
              <input
                id="galleryImagesInput"
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImagesChange}
                className="hidden"
              />

              {/* Gallery Previews */}
              {galleryImageFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {galleryImageFiles.map((file, idx) => (
                    <div key={idx} className="relative group w-12 h-12">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover rounded-md border"
                        style={{ borderColor: themeColors.border }}
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow-md hover:bg-red-600 transition-colors cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Gallery Images */}
              {id && galleryImageFiles.length === 0 && existingImages.galleryImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-[9px] font-semibold opacity-50 mb-1 uppercase tracking-wider">
                    Current Gallery Images:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.galleryImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt="current gallery"
                        className="w-10 h-10 object-cover rounded border"
                        style={{ borderColor: themeColors.border }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Products */}
            <div className="relative md:col-span-3">
              <label
                className="block mb-1 text-xs font-semibold"
                style={{ color: themeColors.text }}
              >
                Related Products
              </label>
              <div className="relative">
                <div
                  onClick={() => setRelatedDropdownOpen(!relatedDropdownOpen)}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm cursor-pointer flex flex-wrap gap-1 items-center min-h-[34px]"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  {form.relatedProducts.length > 0 ? (
                    form.relatedProducts.map((prodId) => {
                      const p = allProducts.find((item) => item._id === prodId || item.id === prodId);
                      return (
                        <span
                          key={prodId}
                          className="px-2 py-0.5 rounded text-[11px] flex items-center gap-1 font-medium"
                          style={{
                            backgroundColor: themeColors.primary + "15",
                            color: themeColors.primary,
                          }}
                        >
                          {p ? p.name : prodId}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm((prev) => ({
                                ...prev,
                                relatedProducts: prev.relatedProducts.filter((id) => id !== prodId),
                              }));
                            }}
                            className="opacity-70 hover:opacity-100 font-bold text-xs"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="opacity-60 text-xs">Select Related Products</span>
                  )}
                  <FaChevronDown
                    className={`w-3 h-3 ml-auto transition-transform duration-300 ${relatedDropdownOpen ? "rotate-180" : ""}`}
                    style={{ color: themeColors.text }}
                  />
                </div>

                {relatedDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[45]"
                      onClick={() => setRelatedDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-[50] w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border shadow-xl custom-scrollbar"
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      }}
                    >
                      {/* Search Input inside Dropdown */}
                      <div className="p-2 border-b border-black/5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={relatedSearchQuery}
                          onChange={(e) => setRelatedSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          style={{
                            backgroundColor: themeColors.background,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                        />
                      </div>

                      {/* Products List */}
                      {allProducts
                        .filter((p) => {
                          if (id && (p._id === id || p.id === id)) return false;
                          if (!relatedSearchQuery.trim()) return true;
                          return p.name.toLowerCase().includes(relatedSearchQuery.toLowerCase());
                        })
                        .map((p) => {
                          const pId = p._id || p.id;
                          const isSelected = form.relatedProducts.includes(pId);
                          return (
                            <label
                              key={pId}
                              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-black/5 transition-colors border-b border-black/5 last:border-0"
                              style={{ color: themeColors.text }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setForm((prev) => ({
                                      ...prev,
                                      relatedProducts: prev.relatedProducts.filter((id) => id !== pId),
                                    }));
                                  } else {
                                    setForm((prev) => ({
                                      ...prev,
                                      relatedProducts: [...prev.relatedProducts, pId],
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 focus:ring-2"
                                style={{ accentColor: themeColors.primary }}
                              />
                              <span className="text-sm font-medium">{p.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* About This Product Editor */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: themeColors.border }}>
            <label className="block text-xs font-semibold" style={{ color: themeColors.text }}>
              About This Product Details (Rich Text)
            </label>
            <div
              className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-white"
              style={{ borderColor: themeColors.border }}
            >
              <MenuBar editor={editor} />
              {editor && (
                <BubbleMenuComponent editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => editor.isActive('image')}>
                  <div className="flex bg-white shadow-xl border rounded-lg p-1 gap-1 overflow-hidden" style={{ borderColor: themeColors.border }}>
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'text-primary' : 'text-gray-600'}`}
                      title="Align Left"
                    >
                      <FaAlignLeft size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'text-primary' : 'text-gray-600'}`}
                      title="Align Center"
                    >
                      <FaAlignCenter size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'text-primary' : 'text-gray-600'}`}
                      title="Align Right"
                    >
                      <FaAlignRight size={14} />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1 self-center" />
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}
                      className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                    >
                      S
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}
                      className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                    >
                      M
                    </button>
                    <button 
                      type="button"
                      onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}
                      className="px-2 py-1 text-[10px] font-bold hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                    >
                      L
                    </button>
                  </div>
                </BubbleMenuComponent>
              )}
              <EditorContent
                editor={editor}
                className="p-3 min-h-[220px] prose prose-sm max-w-none focus:outline-none custom-editor overflow-auto resize-y"
                style={{ minHeight: '220px' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 justify-end pt-3 border-t" style={{ borderColor: themeColors.border }}>
            <button
              type="button"
              onClick={() => navigate("/products")}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-black/5 transition-all cursor-pointer"
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
              className="px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-95 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
              }}
            >
              <FaSave />
              {saving ? "Saving..." : id ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
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
    cursor: pointer;
    position: relative;
  }
  .custom-editor img:hover {
    box-shadow: 0 0 0 3px #6366f150;
  }
  .custom-editor img.ProseMirror-selectednode {
    outline: 3px solid #6366f1;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
  }
  
  .custom-editor img[width="25%"] { width: 25%; }
  .custom-editor img[width="50%"] { width: 50%; }
  .custom-editor img[width="100%"] { width: 100%; }

  .custom-editor [style*="text-align: center"] {
    text-align: center;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .custom-editor [style*="text-align: right"] {
    text-align: right;
    display: block;
    margin-left: auto;
  }
  .custom-editor [style*="text-align: left"] {
    text-align: left;
  }

  /* Heading styles */
  .custom-editor h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  .custom-editor h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1.2rem; margin-bottom: 0.4rem; }

  /* Lists & Quote Styles */
  .custom-editor ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .custom-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .custom-editor li p { margin: 0 !important; display: inline !important; }
  .custom-editor p { margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .custom-editor blockquote {
    border-left: 3px solid #ccc;
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
    color: #4b5563;
  }

  /* Editor Resize Handle */
  .custom-editor.resize-y {
    resize: vertical;
    border-bottom: 2px solid #e5e7eb;
  }
`;

export default function AddProductWithStyles() {
  return (
    <>
      <style>{editorStyles}</style>
      <AddProduct />
    </>
  );
}
