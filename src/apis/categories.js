// src/apis/categories.js
import http from "./http";

// Public Get – GET {{baseUrl}}/categories
export const getCategories = async (status = 'active') => {
  const params = status ? { status } : {};
  const { data } = await http.get("/categories", { params });
  return data;
};

// Smart create - detects if payload contains file
export const createCategory = async (payload) => {
  // Check if payload has a File object
  const hasFile = payload instanceof FormData || 
                  (payload && (payload.get?.('image') instanceof File));
  
  let config = {};
  
  if (hasFile || payload instanceof FormData) {
    // If it's FormData, use multipart
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  
  const { data } = await http.post("/categories", payload, config);
  return data;
};

// Smart update - detects if payload contains file
export const updateCategory = async (idOrSlug, payload) => {
  // Check if payload has a File object
  const hasFile = payload instanceof FormData || 
                  (payload && (payload.get?.('image') instanceof File));
  
  let config = {};
  
  if (hasFile || payload instanceof FormData) {
    // If it's FormData, use multipart
    config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  
  const { data } = await http.put(`/categories/${idOrSlug}`, payload, config);
  return data;
};

// Admin Delete – DELETE {{baseUrl}}/categories/:idOrSlug (Token)
export const deleteCategory = async (idOrSlug) => {
  const { data } = await http.delete(`/categories/${idOrSlug}`);
  return data;
};