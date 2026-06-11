export const getAdminToken = () => {
  if (typeof window === "undefined") return null;
  
  const token = sessionStorage.getItem("admin-token");
  return token || null;
};

export const getAdminData = () => {
  try {
    const data = JSON.parse(sessionStorage.getItem("admin-data") || "{}");
    return data;
  } catch {
    return null;
  }
};
