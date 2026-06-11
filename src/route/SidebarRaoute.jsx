import { lazy } from "react";
import {
  FaCoins,
  FaUsers,
  FaBox,
  FaTachometerAlt,
  FaShoppingCart,
  FaEnvelopeOpenText,
  FaImages,
  FaKey,
  FaBlog,
  FaVideo,
  FaMoneyBillWave,
  FaStore,
  FaPlus,
  FaBriefcase,
  FaTree,
  FaCalendarCheck,
  FaTags,
  FaStar,
} from "react-icons/fa";

// pages
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Categories = lazy(() => import("../pages/Categories"));
const ProductCategories = lazy(() => import("../pages/ProductCategories"));
const Products = lazy(() => import("../pages/Products"));
const AddProduct = lazy(() => import("../pages/AddProduct"));
const Offers = lazy(() => import("../pages/Offers"));
const Orders = lazy(() => import("../pages/Orders"));
const Enquiries = lazy(() => import("../pages/Enquiries"));
const Sliders = lazy(() => import("../pages/Sliders"));
const ReviewVideos = lazy(() => import("../pages/ReviewVideos"));
const Blogs = lazy(() => import("../pages/Blogs"));
const AddBlog = lazy(() => import("../pages/AddBlog"));
const ViewBlog = lazy(() => import("../pages/ViewBlog"));
const ChangePassword = lazy(() => import("../pages/ChangePassword"));
const Reviews = lazy(() => import("../pages/Reviews"));
const Users = lazy(() => import("../pages/Users"));
const PayMethods = lazy(() => import("../pages/PayMethods"));
const Vendors = lazy(() => import("../pages/Vendors"));
const AddVendor = lazy(() => import("../pages/AddVendor"));
const CorporateInquiries = lazy(() => import("../pages/CorporateInquiries"));
const Orchards = lazy(() => import("../pages/Orchards"));
const Bookings = lazy(() => import("../pages/Bookings"));
const ViewBooking = lazy(() => import("../pages/ViewBooking"));
const BulkOrders = lazy(() => import("../pages/BulkOrders"));
const ViewBulkOrder = lazy(() => import("../pages/ViewBulkOrder"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/categories", component: ProductCategories, name: "Categories", icon: FaTags },
  { path: "/varieties", component: Categories, name: "Varieties", icon: FaBox },
  { path: "/products", component: Products, name: "Products", icon: FaBox },
  { path: "/orders", component: Orders, name: "Orders", icon: FaShoppingCart },
  { path: "/bulk-orders", component: BulkOrders, name: "Bulk Orders", icon: FaBox },
  { path: "/corporate-inquiries", component: CorporateInquiries, name: "Corporate Gifting", icon: FaBriefcase },
  { path: "/bulk-orders/view/:id", component: ViewBulkOrder, name: "View Bulk Order", icon: FaBox, hide: true },
  { path: "/bulk-orders/edit/:id", component: ViewBulkOrder, name: "Edit Bulk Order", icon: FaBox, hide: true },
  { path: "/users", component: Users, name: "Users", icon: FaUsers },
  { path: "/vendors", component: Vendors, name: "Vendors", icon: FaStore },
  { path: "/vendors/add", component: AddVendor, name: "Add Vendor", icon: FaPlus, hide: true },
  { path: "/vendors/edit/:id", component: AddVendor, name: "Edit Vendor", icon: FaPlus, hide: true },
  { path: "/vendors/view/:id", component: AddVendor, name: "View Vendor", icon: FaPlus, hide: true },
  { path: "/products/add", component: AddProduct, name: "Add Product", icon: FaPlus, hide: true },
  { path: "/products/edit/:id", component: AddProduct, name: "Edit Product", icon: FaPlus, hide: true },
  { path: "/products/view/:id", component: AddProduct, name: "View Product", icon: FaPlus, hide: true },
  // { path: "/offers", component: Offers, name: "Offers", icon: FaCoins },
  { path: "/bookings", component: Bookings, name: "Bookings", icon: FaCalendarCheck },
  { path: "/bookings/view/:id", component: ViewBooking, name: "View Booking", icon: FaCalendarCheck, hide: true },
  { path: "/enquiries", component: Enquiries, name: "Enquiries", icon: FaEnvelopeOpenText },
  { path: "/sliders", component: Sliders, name: "Sliders", icon: FaImages },
  { path: "/review-videos", component: ReviewVideos, name: "Review Videos", icon: FaVideo },
  { path: "/pay-methods", component: PayMethods, name: "Pay Methods", icon: FaMoneyBillWave },
  { path: "/blogs", component: Blogs, name: "Blogs", icon: FaBlog },
  { path: "/blogs/add", component: AddBlog, name: "Add Blog", icon: FaPlus, hide: true },
  { path: "/blogs/edit/:id", component: AddBlog, name: "Edit Blog", icon: FaPlus, hide: true },
  { path: "/blogs/view/:id", component: ViewBlog, name: "View Blog", icon: FaPlus, hide: true },
  { path: "/orchards", component: Orchards, name: "Orchards", icon: FaTree },
  { path: "/reviews", component: Reviews, name: "Reviews", icon: FaStar },
  { path: "/change-password", component: ChangePassword, name: "Change Password", icon: FaKey },
];

export default routes;
