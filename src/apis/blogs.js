// src/apis/blogs.js
import http from "./http";

// Admin: Get all blogs - GET /blogs/admin/all
export const getAllBlogs = async (page = 1, limit = 10, search = "", status = "all") => {
  const { data } = await http.get(`/blogs/admin/all?page=${page}&limit=${limit}&admin=true&search=${search}&status=${status}`);
  return data;
};

// Admin: Create blog - POST /blogs/admin
export const createBlog = async (blogData) => {
  const { data } = await http.post("/blogs/admin", blogData);
  return data;
};

// Admin: Get single blog detailed - GET /blogs/admin/:id
export const getBlogAdmin = async (id) => {
  const { data } = await http.get(`/blogs/admin/${id}`);
  return data;
};

// Admin: Update blog - PUT /blogs/admin/:idOrSlug
export const updateBlog = async (idOrSlug, blogData) => {
  try {
    const { data } = await http.put(`/blogs/admin/${idOrSlug}`, blogData);
    return data;
  } catch (error) {
    console.error('PUT failed, trying PATCH:', error.response?.status);
    
    // Try PATCH as fallback
    if (error.response?.status === 500 || error.response?.status === 405) {
      try {
        const { data } = await http.patch(`/blogs/admin/${idOrSlug}`, blogData);
        return data;
      } catch (patchError) {
        console.error('PATCH also failed:', patchError.response?.data);
        throw patchError;
      }
    }
    
    throw error;
  }
};

// Toggle Blog Status - PATCH /blogs/admin/status/:id
export const toggleBlogStatus = async (id) => {
  const { data } = await http.patch(`/blogs/admin/status/${id}`);
  return data;
};

// Admin: Delete blog - DELETE /blogs/admin/:idOrSlug
export const deleteBlog = async (idOrSlug) => {
  const { data } = await http.delete(`/blogs/admin/${idOrSlug}`);
  return data;
};

// Public: Get published blogs - GET /blogs
export const getPublishedBlogs = async (page = 1, limit = 10) => {
  const { data } = await http.get(`/blogs?page=${page}&limit=${limit}`);
  return data;
};

// Public: Get single blog - GET /blogs/:idOrSlug
export const getSingleBlog = async (idOrSlug) => {
  const { data } = await http.get(`/blogs/${idOrSlug}`);
  return data;
};

// Public: Get featured blogs - GET /blogs/featured
export const getFeaturedBlogs = async () => {
  const { data } = await http.get("/blogs/featured");
  return data;
};

// Public: Like blog - POST /blogs/:idOrSlug/like
export const likeBlog = async (idOrSlug) => {
  const { data } = await http.post(`/blogs/${idOrSlug}/like`);
  return data;
};