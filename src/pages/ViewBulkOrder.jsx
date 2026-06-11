import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getBulkOrderInquiryById, updateBulkOrderInquiry } from "../apis/bulkOrderInquiry";
import { FaArrowLeft, FaSave, FaBox } from "react-icons/fa";
import { toast } from "sonner";

export default function ViewBulkOrder() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const isReadOnly = location.pathname.includes("/view/");

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    mobileNumber: "",
    emailId: "",
    deliveryCityState: "",
    country: "",
    typeOfBuyer: "",
    requiredQuantity: "",
    packagingPreference: "",
    exactDeliveryAddress: "",
    expectedDeliveryDate: "",
    frequencyOfOrder: "",
    specialRequirements: "",
  });
  
  const [varieties, setVarieties] = useState([]); // Just for displaying names
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        setLoading(true);
        const res = await getBulkOrderInquiryById(id);
        if (res.success && res.data) {
          const data = res.data;
          setFormData({
            fullName: data.fullName || "",
            companyName: data.companyName || "",
            mobileNumber: data.mobileNumber || "",
            emailId: data.emailId || "",
            deliveryCityState: data.deliveryCityState || "",
            country: data.country || "",
            typeOfBuyer: data.typeOfBuyer || "",
            requiredQuantity: data.requiredQuantity || "",
            packagingPreference: data.packagingPreference || "",
            exactDeliveryAddress: data.exactDeliveryAddress || "",
            expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.substring(0, 10) : "",
            frequencyOfOrder: data.frequencyOfOrder || "",
            specialRequirements: data.specialRequirements || "",
          });
          
          if (data.preferredMangoVariety) {
            setVarieties(data.preferredMangoVariety.map(v => v.name || v.id || v));
          }
        }
      } catch (error) {
        toast.error("Failed to load bulk order details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchInquiry();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    try {
      setSaving(true);
      await updateBulkOrderInquiry(id, formData);
      toast.success("Bulk order updated successfully");
      navigate("/bulk-orders");
    } catch (error) {
      toast.error("Failed to update bulk order");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const inputClass = `w-full px-4 py-2 rounded-md border text-sm outline-none transition-all ${isReadOnly ? 'bg-gray-100 text-gray-600 cursor-default' : 'bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`;

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto" style={{ fontFamily: currentFont.family }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/bulk-orders")}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border transition-all"
            style={{ borderColor: themeColors.border, color: themeColors.text }}
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
              <FaBox className="text-orange-500" />
              {isReadOnly ? "View Bulk Order" : "Edit Bulk Order"}
            </h1>
          </div>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-all disabled:opacity-70"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaSave />
            )}
            Save Changes
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 md:p-8 space-y-8" style={{ borderColor: themeColors.border }}>
        
        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Company / Business Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number</label>
              <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
              <input type="email" name="emailId" value={formData.emailId} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Delivery City & State</label>
              <input type="text" name="deliveryCityState" value={formData.deliveryCityState} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Business & Order Details */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Business & Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Type of Buyer</label>
              <input type="text" name="typeOfBuyer" value={formData.typeOfBuyer} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Preferred Mango Variety</label>
              <div className="w-full px-4 py-2 rounded-md border text-sm bg-gray-50 text-gray-700">
                {varieties.length > 0 ? varieties.join(", ") : "None specified"}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Varieties are display-only.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Required Quantity</label>
              <input type="text" name="requiredQuantity" value={formData.requiredQuantity} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Packaging Preference</label>
              <input type="text" name="packagingPreference" value={formData.packagingPreference} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Expected Delivery Date</label>
              <input type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Frequency of Order</label>
              <input type="text" name="frequencyOfOrder" value={formData.frequencyOfOrder} onChange={handleInputChange} disabled={isReadOnly} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">Exact Delivery Address</label>
              <textarea name="exactDeliveryAddress" value={formData.exactDeliveryAddress} onChange={handleInputChange} disabled={isReadOnly} rows="2" className={inputClass}></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">Special Requirements</label>
              <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleInputChange} disabled={isReadOnly} rows="3" className={inputClass}></textarea>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
