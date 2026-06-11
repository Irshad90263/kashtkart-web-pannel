// src/apis/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token for every request
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("admin-token");
  const tokenExpiry = sessionStorage.getItem("admin-token-expiry");

  // If token is expired before request
  if (token && tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
    // Token expired, clear sessionStorage
    sessionStorage.removeItem("admin-data");
    sessionStorage.removeItem("admin-token");
    sessionStorage.removeItem("admin-token-expiry");
    window.location.href = "/login";
    return Promise.reject(new Error("Token expired"));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid/expired, clear sessionStorage
      sessionStorage.removeItem("admin-data");
      sessionStorage.removeItem("admin-token");
      sessionStorage.removeItem("admin-token-expiry");
      
      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default http;
