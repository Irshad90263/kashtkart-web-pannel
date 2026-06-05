// src/apis/categories.js
import http from "./http";

// Get all categories – GET {{baseUrl}}/product-categories
export const getCategories = async () => {
  const { data } = await http.get("/product-categories");
  return data;
};

// Create category – POST {{baseUrl}}/product-categories
export const createCategory = async (payload) => {
  const hasFile = payload instanceof FormData || 
                  (payload && (payload.get?.('image') instanceof File));
  
  let config = {};
  if (hasFile || payload instanceof FormData) {
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  
  const { data } = await http.post("/product-categories", payload, config);
  return data;
};

// Update category – PUT {{baseUrl}}/product-categories/:id
export const updateCategory = async (id, payload) => {
  const hasFile = payload instanceof FormData || 
                  (payload && (payload.get?.('image') instanceof File));
  
  let config = {};
  if (hasFile || payload instanceof FormData) {
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  
  const { data } = await http.put(`/product-categories/${id}`, payload, config);
  return data;
};

// Delete category – DELETE {{baseUrl}}/product-categories/:id
export const deleteCategory = async (id) => {
  const { data } = await http.delete(`/product-categories/${id}`);
  return data;
};
