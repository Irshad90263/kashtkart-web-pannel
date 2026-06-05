// src/apis/varieties.js
import http from "./http";

// Public Get – GET {{baseUrl}}/varieties
export const getVarieties = async (status = 'active') => {
  const params = status ? { status } : {};
  const { data } = await http.get("/varieties", { params });
  return data;
};

export const getCategories = getVarieties; // Alias for safety

// Smart create
export const createVariety = async (payload) => {
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
  
  const { data } = await http.post("/varieties", payload, config);
  return data;
};

export const createCategory = createVariety; // Alias for safety

// Smart update
export const updateVariety = async (idOrSlug, payload) => {
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
  
  const { data } = await http.put(`/varieties/${idOrSlug}`, payload, config);
  return data;
};

export const updateCategory = updateVariety; // Alias for safety

// Admin Delete
export const deleteVariety = async (idOrSlug) => {
  const { data } = await http.delete(`/varieties/${idOrSlug}`);
  return data;
};

export const deleteCategory = deleteVariety; // Alias for safety
