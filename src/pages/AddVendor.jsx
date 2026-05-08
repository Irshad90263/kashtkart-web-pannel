import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useFont } from '../context/FontContext';
import { 
    FaArrowLeft, 
    FaUser, 
    FaHome, 
    FaTree, 
    FaCheckCircle, 
    FaLeaf, 
    FaShareAlt, 
    FaPhoneAlt, 
    FaImage, 
    FaSignature,
    FaPlus,
    FaTrash
} from 'react-icons/fa';
import { toast } from 'sonner';

import { createVendor, getVendorById, updateVendor } from '../apis/vendor';

const FormSection = ({ title, icon: Icon, themeColors, children }) => (
    <div className="p-8 rounded-md border space-y-6 shadow-sm transition-all hover:shadow-md" 
         style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: themeColors.border }}>
            <div className="p-3 rounded-md" style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}>
                <Icon size={20} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: themeColors.text }}>{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

const InputField = ({ label, type = "text", placeholder, value, onChange, required, themeColors, className = "", error, maxLength, disabled }) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-wider" style={{ color: error ? '#ef4444' : themeColors.text }}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            disabled={disabled}
            className={`w-full px-5 py-3 rounded-md border outline-none transition-all focus:ring-2 ${error ? 'border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.1)]' : ''} ${disabled ? 'opacity-70 cursor-default' : ''}`}
            style={{ 
                backgroundColor: themeColors.background, 
                borderColor: error ? '#ef4444' : themeColors.border,
                color: themeColors.text,
                '--tw-ring-color': error ? '#ef444430' : themeColors.primary + '30'
            }}
        />
        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{error}</p>}
    </div>
);

const AddVendor = () => {
    const { themeColors } = useTheme();
    const { currentFont } = useFont();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isEdit = Boolean(id) && !location.pathname.includes('/view/');
    const isView = Boolean(id) && location.pathname.includes('/view/');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        residentialAddress: { address: '', pincode: '' },
        orchardAddress: { address: '', pincode: '' },
        farmingExperience: { years: 0 },
        totalAreaOfCultivation: 0,
        expectedQuantity: 0,
        mangoVarietiesGrown: ['', '', ''],
        farmingPractices: {
            type: 'chemical',
            organicDetails: { methodsUsed: '', certification: '' },
            chemicalDetails: { pesticidesFertilizersUsed: '' }
        },
        harvestingPractices: '',
        socialMedia: { facebook: '', instagram: '', website: '' },
        contactDetails: { phoneNumber: '', email: '' },
        vendorDesignation: '',
        signedDate: new Date().toISOString().split('T')[0]
    });

    const [files, setFiles] = useState({
        photo: null,
        growerSignature: null,
        orchardImages: []
    });

    const [existingFiles, setExistingFiles] = useState({
        photo: null,
        growerSignature: null,
        orchardImages: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEdit || isView) {
            fetchVendorDetails();
        }
    }, [id]);

    const fetchVendorDetails = async () => {
        try {
            setLoading(true);
            const res = await getVendorById(id);
            if (res.success) {
                const v = res.vendor;
                setFormData({
                    name: v.name || '',
                    residentialAddress: v.residentialAddress || { address: '', pincode: '' },
                    orchardAddress: v.orchardAddress || { address: '', pincode: '' },
                    farmingExperience: v.farmingExperience || { years: 0 },
                    totalAreaOfCultivation: v.totalAreaOfCultivation || 0,
                    expectedQuantity: v.expectedQuantity || 0,
                    mangoVarietiesGrown: v.mangoVarietiesGrown?.length ? v.mangoVarietiesGrown : ['', '', ''],
                    farmingPractices: v.farmingPractices || { type: 'chemical', organicDetails: { methodsUsed: '', certification: '' }, chemicalDetails: { pesticidesFertilizersUsed: '' } },
                    harvestingPractices: v.harvestingPractices || '',
                    socialMedia: v.socialMedia || { facebook: '', instagram: '', website: '' },
                    contactDetails: v.contactDetails || { phoneNumber: '', email: '' },
                    vendorDesignation: v.vendorDesignation || '',
                    signedDate: v.signedDate ? v.signedDate.split('T')[0] : new Date().toISOString().split('T')[0]
                });
                
                setExistingFiles({
                    photo: v.photo?.url,
                    growerSignature: v.growerSignature?.url,
                    orchardImages: v.orchardImages || []
                });
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load vendor details");
        } finally {
            setLoading(false);
        }
    };

    const validateField = (path, value) => {
        let error = '';
        
        // Required checks
        if (path === 'name' && !value) {
            error = 'Name is required';
        } else if (path === 'contactDetails.phoneNumber' && !value) {
            error = 'Phone number is required';
        }

        // Format checks
        if (path.includes('pincode')) {
            if (value && !/^\d{6}$/.test(value)) error = 'Pincode must be exactly 6 digits';
        } else if (path === 'contactDetails.phoneNumber') {
            if (value && !/^[6-9]\d{9}$/.test(value)) error = 'Invalid Phone (Starts with 6-9)';
        } else if (path === 'contactDetails.email') {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address';
        }

        setErrors(prev => ({ ...prev, [path]: error }));
        return error;
    };

    const handleInputChange = (path, value) => {
        // Enforce numeric only and length for Pincode and Phone
        if (path.includes('pincode') || path === 'contactDetails.phoneNumber') {
            const numericValue = value.replace(/\D/g, '');
            if (path.includes('pincode') && numericValue.length > 6) return;
            if (path === 'contactDetails.phoneNumber' && numericValue.length > 10) return;
            value = numericValue;
        }

        const keys = path.split('.');
        setFormData(prev => {
            const newData = { ...prev };
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
        validateField(path, value);
    };

    const handleVarietyChange = (index, value) => {
        const newVarieties = [...formData.mangoVarietiesGrown];
        newVarieties[index] = value;
        setFormData({ ...formData, mangoVarietiesGrown: newVarieties });
    };

    const addVarietyField = () => {
        setFormData({ ...formData, mangoVarietiesGrown: [...formData.mangoVarietiesGrown, ''] });
    };

    const removeVarietyField = (index) => {
        const newVarieties = formData.mangoVarietiesGrown.filter((_, i) => i !== index);
        setFormData({ ...formData, mangoVarietiesGrown: newVarieties });
    };

    const handleFileChange = (e, key) => {
        if (key === 'orchardImages') {
            setFiles({ ...files, orchardImages: [...files.orchardImages, ...Array.from(e.target.files)] });
        } else {
            setFiles({ ...files, [key]: e.target.files[0] });
        }
    };

    const removeOrchardImage = (index) => {
        const newImages = files.orchardImages.filter((_, i) => i !== index);
        setFiles({ ...files, orchardImages: newImages });
    };

    const removeExistingOrchardImage = (index) => {
        const newImages = existingFiles.orchardImages.filter((_, i) => i !== index);
        setExistingFiles({ ...existingFiles, orchardImages: newImages });
    };

    const removeExistingPhoto = () => {
        setExistingFiles({ ...existingFiles, photo: null });
    };

    const removeExistingSignature = () => {
        setExistingFiles({ ...existingFiles, growerSignature: null });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        // 1. Final Validation Check
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!/^[6-9]\d{9}$/.test(formData.contactDetails.phoneNumber)) {
            newErrors['contactDetails.phoneNumber'] = 'Valid 10-digit phone required';
        }
        if (formData.contactDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactDetails.email)) {
            newErrors['contactDetails.email'] = 'Invalid email';
        }
        if (formData.residentialAddress.pincode && !/^\d{6}$/.test(formData.residentialAddress.pincode)) {
            newErrors['residentialAddress.pincode'] = '6-digit pincode required';
        }
        if (formData.orchardAddress.pincode && !/^\d{6}$/.test(formData.orchardAddress.pincode)) {
            newErrors['orchardAddress.pincode'] = '6-digit pincode required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please correct the errors in the form");
            return;
        }

        // 2. File Validation (Only required for new creation)
        if (!isEdit) {
            if (!files.photo) {
                toast.error("Please upload grower photo");
                return;
            }

            if (!files.growerSignature) {
                toast.error("Please upload grower signature");
                return;
            }
        }

        try {
            setLoading(true);
            const data = new FormData();

            // Append basic fields
            data.append('name', formData.name);
            if (isEdit) {
                data.append('orchardImages', JSON.stringify(existingFiles.orchardImages));
            }
            data.append('vendorDesignation', formData.vendorDesignation);
            data.append('totalAreaOfCultivation', formData.totalAreaOfCultivation);
            data.append('expectedQuantity', formData.expectedQuantity);
            data.append('harvestingPractices', formData.harvestingPractices);
            data.append('signedDate', formData.signedDate);

            // Append nested objects as JSON strings
            data.append('residentialAddress', JSON.stringify(formData.residentialAddress));
            data.append('orchardAddress', JSON.stringify(formData.orchardAddress));
            data.append('farmingExperience', JSON.stringify(formData.farmingExperience));
            data.append('mangoVarietiesGrown', JSON.stringify(formData.mangoVarietiesGrown.filter(v => v.trim() !== '')));
            data.append('farmingPractices', JSON.stringify(formData.farmingPractices));
            data.append('socialMedia', JSON.stringify(formData.socialMedia));
            data.append('contactDetails', JSON.stringify(formData.contactDetails));

            // Append files
            if (files.photo) data.append('photo', files.photo);
            if (files.growerSignature) data.append('growerSignature', files.growerSignature);
            
            if (files.orchardImages.length > 0) {
                files.orchardImages.forEach(file => {
                    data.append('orchardImages', file);
                });
            }

            let res;
            if (isEdit) {
                res = await updateVendor(id, data);
            } else {
                res = await createVendor(data);
            }
            
            if (res.success) {
                toast.success(isEdit ? "Vendor profile updated successfully!" : "Vendor profile created successfully!");
                navigate('/vendors');
            }
        } catch (error) {
            console.error("Create Vendor Error:", error);
            toast.error(error?.response?.data?.message || "Failed to create vendor profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20" style={{ fontFamily: currentFont.family }}>
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-md shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/vendors')}
                        className="p-3 rounded-md border transition-all hover:bg-gray-50 active:scale-95"
                        style={{ borderColor: themeColors.border }}
                    >
                        <FaArrowLeft style={{ color: themeColors.text }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: themeColors.text }}>
                            {isView ? "View Mango Grower Details" : isEdit ? "Update Mango Grower" : "Add New Mango Grower"}
                        </h1>
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest">
                            {isView ? "Full Vendor Information" : isEdit ? "Update Profile Information" : "Farm Profile Creation"}
                        </p>
                    </div>
                </div>
                {/* {!isView && (
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-10 py-4 rounded-md font-bold shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                    >
                        {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Profile' : 'Create Vendor Profile')}
                    </button>
                )} */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Basic Information */}
                <FormSection title="1. Basic Information" icon={FaUser} themeColors={themeColors}>
                    <InputField 
                        label="Grower / Producer Name" 
                        placeholder="Enter full name" 
                        value={formData.name} 
                        onChange={(val) => handleInputChange('name', val)}
                        required
                        themeColors={themeColors}
                        error={errors.name}
                        disabled={isView}
                    />
                    <InputField 
                        label="Vendor Designation" 
                        placeholder="e.g. Proprietor, Manager" 
                        value={formData.vendorDesignation} 
                        onChange={(val) => handleInputChange('vendorDesignation', val)}
                        themeColors={themeColors}
                        disabled={isView}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase opacity-60 ml-1 tracking-wider">Grower Photo</label>
                        {existingFiles.photo && (
                            <div className="mb-2 h-32 w-32 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm transition-transform hover:scale-105 group">
                                <a href={existingFiles.photo} target="_blank" rel="noopener noreferrer">
                                    <img src={existingFiles.photo} className="w-full h-full object-cover" alt="Grower" />
                                </a>
                                {isEdit && (
                                    <button 
                                        type="button"
                                        onClick={removeExistingPhoto}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <FaTrash size={10} />
                                    </button>
                                )}
                            </div>
                        )}
                        {!isView && (
                            <input type="file" onChange={(e) => handleFileChange(e, 'photo')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                        )}
                    </div>
                </FormSection>

                {/* 2 & 3. Address Info */}
                <FormSection title="2 & 3. Addresses" icon={FaHome} themeColors={themeColors}>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase opacity-40">Residential Address</h3>
                            <InputField label="Full Address" placeholder="House no, Street, Village" value={formData.residentialAddress.address} onChange={(val) => handleInputChange('residentialAddress.address', val)} themeColors={themeColors} disabled={isView} />
                            <InputField label="Pincode" type="text" maxLength={6} placeholder="6-digit pincode" value={formData.residentialAddress.pincode} onChange={(val) => handleInputChange('residentialAddress.pincode', val)} themeColors={themeColors} error={errors['residentialAddress.pincode']} disabled={isView} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase opacity-40">Orchard / Farm Address</h3>
                            <InputField label="Full Address" placeholder="Farm location, Survey No" value={formData.orchardAddress.address} onChange={(val) => handleInputChange('orchardAddress.address', val)} themeColors={themeColors} disabled={isView} />
                            <InputField label="Pincode" type="text" maxLength={6} placeholder="6-digit pincode" value={formData.orchardAddress.pincode} onChange={(val) => handleInputChange('orchardAddress.pincode', val)} themeColors={themeColors} error={errors['orchardAddress.pincode']} disabled={isView} />
                        </div>
                    </div>
                </FormSection>

                {/* 4-7. Farming Stats */}
                <FormSection title="4-7. Farm Statistics" icon={FaTree} themeColors={themeColors}>
                    <InputField label="Farming Experience (Years)" type="number" value={formData.farmingExperience.years} onChange={(val) => handleInputChange('farmingExperience.years', parseInt(val))} themeColors={themeColors} disabled={isView} />
                    <InputField label="Total Cultivation Area (Acres)" type="number" value={formData.totalAreaOfCultivation} onChange={(val) => handleInputChange('totalAreaOfCultivation', parseFloat(val))} themeColors={themeColors} disabled={isView} />
                    <InputField label="Expected Quantity (Tons)" type="number" value={formData.expectedQuantity} onChange={(val) => handleInputChange('expectedQuantity', parseFloat(val))} themeColors={themeColors} disabled={isView} />
                </FormSection>

                {/* 8. Varieties */}
                <FormSection title="8. Mango Varieties" icon={FaCheckCircle} themeColors={themeColors}>
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {formData.mangoVarietiesGrown.map((variety, idx) => (
                                <div key={idx} className="relative group">
                                    <input
                                        type="text"
                                        placeholder={`Variety ${idx + 1}`}
                                        value={variety}
                                        onChange={(e) => handleVarietyChange(idx, e.target.value)}
                                        disabled={isView}
                                        className="w-full px-5 py-3 rounded-md border outline-none transition-all focus:ring-2"
                                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                                    />
                                    {formData.mangoVarietiesGrown.length > 1 && !isView && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeVarietyField(idx)}
                                            className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!isView && (
                            <button 
                                type="button"
                                onClick={addVarietyField}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                                <FaPlus /> Add More Variety
                            </button>
                        )}
                    </div>
                </FormSection>

                {/* 9 & 10. Practices */}
                <FormSection title="9 & 10. Farming & Harvesting" icon={FaLeaf} themeColors={themeColors}>
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase opacity-60 ml-1">Farming Practice Type</label>
                            <div className="flex gap-4">
                                {['organic', 'chemical', 'both'].map(type => (
                                    <label key={type} className="flex items-center gap-3 px-6 py-3 rounded-md border cursor-pointer transition-all" 
                                           style={{ 
                                               borderColor: formData.farmingPractices.type === type ? themeColors.primary : themeColors.border,
                                               backgroundColor: formData.farmingPractices.type === type ? themeColors.primary + '05' : 'transparent'
                                           }}>
                                        <input 
                                            type="radio" 
                                            name="practiceType" 
                                            checked={formData.farmingPractices.type === type}
                                            onChange={() => handleInputChange('farmingPractices.type', type)}
                                            disabled={isView}
                                            className="accent-amber-500"
                                        />
                                        <span className="text-sm font-bold capitalize" style={{ color: themeColors.text }}>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {formData.farmingPractices.type !== 'chemical' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-md bg-emerald-50/30 border border-emerald-100">
                                <InputField label="Organic Methods Used" placeholder="e.g. Vermicompost, Bio-pesticides" value={formData.farmingPractices.organicDetails.methodsUsed} onChange={(val) => handleInputChange('farmingPractices.organicDetails.methodsUsed', val)} themeColors={themeColors} disabled={isView} />
                                <InputField label="Certification Details" placeholder="e.g. APEDA, NPOP" value={formData.farmingPractices.organicDetails.certification} onChange={(val) => handleInputChange('farmingPractices.organicDetails.certification', val)} themeColors={themeColors} disabled={isView} />
                            </div>
                        )}

                        {(formData.farmingPractices.type === 'chemical' || formData.farmingPractices.type === 'both') && (
                            <div className="p-6 rounded-md bg-amber-50/30 border border-amber-100">
                                <InputField label="Chemicals/Fertilizers Used" placeholder="Pesticides, fertilizers with schedule" value={formData.farmingPractices.chemicalDetails.pesticidesFertilizersUsed} onChange={(val) => handleInputChange('farmingPractices.chemicalDetails.pesticidesFertilizersUsed', val)} themeColors={themeColors} disabled={isView} />
                            </div>
                        )}

                        <InputField label="Harvesting & Post-Harvest Practices (Optional)" placeholder="Briefly describe your process" value={formData.harvestingPractices} onChange={(val) => handleInputChange('harvestingPractices', val)} className="md:col-span-2" themeColors={themeColors} disabled={isView} />
                    </div>
                </FormSection>

                {/* 11 & 12. Contact & Social */}
                <FormSection title="11 & 12. Digital & Contact" icon={FaPhoneAlt} themeColors={themeColors}>
                    <InputField label="Phone Number" type="text" maxLength={10} placeholder="10-digit mobile number" value={formData.contactDetails.phoneNumber} onChange={(val) => handleInputChange('contactDetails.phoneNumber', val)} required themeColors={themeColors} error={errors['contactDetails.phoneNumber']} disabled={isView} />
                    <InputField label="Email ID" type="email" placeholder="email@example.com" value={formData.contactDetails.email} onChange={(val) => handleInputChange('contactDetails.email', val)} themeColors={themeColors} error={errors['contactDetails.email']} disabled={isView} />
                    <InputField label="Facebook" placeholder="Facebook profile link" value={formData.socialMedia.facebook} onChange={(val) => handleInputChange('socialMedia.facebook', val)} themeColors={themeColors} disabled={isView} />
                    <InputField label="Instagram" placeholder="Instagram username" value={formData.socialMedia.instagram} onChange={(val) => handleInputChange('socialMedia.instagram', val)} themeColors={themeColors} disabled={isView} />
                    <InputField label="Website" placeholder="https://..." value={formData.socialMedia.website} onChange={(val) => handleInputChange('socialMedia.website', val)} themeColors={themeColors} disabled={isView} />
                </FormSection>

                {/* 14. Orchard Images & Signature */}
                <FormSection title="14. Assets & Verification" icon={FaSignature} themeColors={themeColors}>
                    <div className="md:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase opacity-40">Orchard Images (Multiple)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {existingFiles.orchardImages.map((img, idx) => (
                                    <div key={`existing-${idx}`} className="aspect-video relative rounded-md overflow-hidden border shadow-sm group transition-transform hover:scale-105">
                                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </a>
                                        {isEdit && (
                                            <button 
                                                type="button"
                                                onClick={() => removeExistingOrchardImage(idx)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {files.orchardImages.map((file, idx) => (
                                    <div key={idx} className="aspect-video relative rounded-md overflow-hidden group border shadow-sm">
                                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                        {!isView && (
                                            <button 
                                                type="button"
                                                onClick={() => removeOrchardImage(idx)}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FaTrash className="text-white" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!isView && (
                                    <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-all" style={{ borderColor: themeColors.border }}>
                                        <FaPlus className="text-gray-300 mb-2" />
                                        <span className="text-[10px] font-bold uppercase opacity-40">Upload Image</span>
                                        <input type="file" multiple onChange={(e) => handleFileChange(e, 'orchardImages')} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: themeColors.border }}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase opacity-60">Grower Signature</label>
                                {existingFiles.growerSignature && (
                                    <div className="mb-2 h-20 w-40 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white p-2 transition-transform hover:scale-105 group">
                                        <a href={existingFiles.growerSignature} target="_blank" rel="noopener noreferrer">
                                            <img src={existingFiles.growerSignature} className="w-full h-full object-contain" alt="Signature" />
                                        </a>
                                        {isEdit && (
                                            <button 
                                                type="button"
                                                onClick={removeExistingSignature}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        )}
                                    </div>
                                )}
                                {!isView && (
                                    <input type="file" onChange={(e) => handleFileChange(e, 'growerSignature')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                                )}
                            </div>
                            <InputField label="Signed Date" type="date" value={formData.signedDate} onChange={(val) => handleInputChange('signedDate', val)} themeColors={themeColors} disabled={isView} />
                        </div>
                    </div>
                </FormSection>

                {/* Submit Action */}
                {!isView && (
                    <div className="flex justify-end pt-0 pb-5">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 cursor-pointer rounded-sm text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                            >
                                {loading ? (isEdit ? 'Updating Profile...' : 'Saving Profile...') : (isEdit ? 'Update Vendor Profile' : <>Save Vendor Profile <FaArrowLeft className="rotate-180" /></>)}
                            </button>
                    </div>
                )}
            </form>

            <style jsx>{`
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AddVendor;
