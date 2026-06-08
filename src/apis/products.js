// src/apis/products.js
import http from "./http";

// Public: list products – GET /products
export const listProducts = async (status = 'active', page = 1, limit = 10, search = '') => {
  const params = { status, page, limit, search };
  const { data } = await http.get("/products", { params });
  return data;
};

// Admin: get single product – GET /products/:idOrSlug
export const getProduct = async (idOrSlug) => {
  const { data } = await http.get(`/products/${idOrSlug}`);
  return data;
};

// Admin: create product – POST /products (multipart/form-data)
export const createProduct = async (formData) => {
  const { data } = await http.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { message, product } ya product
};

// Admin: update product – PUT /products/:idOrSlug (multipart/form-data)
export const updateProduct = async (idOrSlug, formData) => {
  const { data } = await http.put(`/products/${idOrSlug}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// Admin: delete product – DELETE /products/:idOrSlug
export const deleteProduct = async (idOrSlug) => {
  const { data } = await http.delete(`/products/${idOrSlug}`);
  return data;
};

// Admin: toggle product status – PATCH /products/:idOrSlug/toggle-status
export const toggleProductStatus = async (idOrSlug) => {
  const { data } = await http.patch(`/products/${idOrSlug}/toggle-status`);
  return data;
};

