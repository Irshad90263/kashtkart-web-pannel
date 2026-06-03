import http from "./http";

export const getAllBookings = async (page = 1, limit = 10, search = "", status = "all", paymentStatus = "all") => {
    const res = await http.get(`/bookings/admin/all?page=${page}&limit=${limit}&search=${search}&status=${status}&paymentStatus=${paymentStatus}`);
    return res.data;
};

export const updateBookingStatus = async (id, statusData) => {
    const res = await http.put(`/bookings/${id}/status`, statusData);
    return res.data;
};

export const deleteBooking = async (id) => {
    const res = await http.delete(`/bookings/${id}`);
    return res.data;
};
