import http from "./http";

export const getAllVendors = async () => {
    const res = await http.get("/venders");
    return res.data;
};

export const getVendorById = async (id) => {
    const res = await http.get(`/venders/${id}`);
    return res.data;
};

export const createVendor = async (formData) => {
    const res = await http.post("/venders", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const updateVendor = async (id, formData) => {
    const res = await http.put(`/venders/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const deleteVendor = async (id) => {
    const res = await http.delete(`/venders/${id}`);
    return res.data;
};

export const toggleVendorStatus = async (id, status) => {
    // Since we don't have a specific toggle endpoint, we use update
    const res = await http.put(`/venders/${id}`, { isActive: status });
    return res.data;
};

export const getVendorList = async () => {
    const res = await http.get("/venders/vendorlist");
    return res.data;
};
