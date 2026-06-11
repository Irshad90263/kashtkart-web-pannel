import http from "./http";

export const getAllBulkOrderInquiries = async (page = 1, limit = 10, search = "") => {
    const res = await http.get(`/bulk-order?page=${page}&limit=${limit}&search=${search}`);
    return res.data;
};

export const getBulkOrderInquiryById = async (id) => {
    const res = await http.get(`/bulk-order/${id}`);
    return res.data;
};

export const updateBulkOrderInquiry = async (id, data) => {
    const res = await http.put(`/bulk-order/${id}`, data);
    return res.data;
};

export const deleteBulkOrderInquiry = async (id) => {
    const res = await http.delete(`/bulk-order/${id}`);
    return res.data;
};
