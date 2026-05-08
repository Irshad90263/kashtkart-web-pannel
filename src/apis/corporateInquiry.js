import http from "./http";

export const getAllCorporateInquiries = async (page = 1, limit = 10, search = "", status = "all") => {
    const res = await http.get(`/corporate-inquiry?page=${page}&limit=${limit}&search=${search}&status=${status}`);
    return res.data;
};

export const updateCorporateInquiryStatus = async (id, status) => {
    const res = await http.put(`/corporate-inquiry/${id}`, { status });
    return res.data;
};

export const deleteCorporateInquiry = async (id) => {
    const res = await http.delete(`/corporate-inquiry/${id}`);
    return res.data;
};
