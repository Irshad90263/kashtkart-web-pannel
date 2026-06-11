import http from "./http";

export const getAllReviewsApi = async () => {
  const { data } = await http.get("/reviews/admin");
  return data;
};

export const updateReviewApi = async (id, payload) => {
  const { data } = await http.put(`/reviews/${id}`, payload);
  return data;
};

export const deleteReviewApi = async (id) => {
  const { data } = await http.delete(`/reviews/${id}`);
  return data;
};
