import http from "./http";

export const listOrchards = async (status = "", page = 1, limit = 8) => {
  const { data } = await http.get("/orchards", { 
    params: { status, page, limit } 
  });
  return data; // Return full object including pagination
};

export const createOrchard = async (formData) => {
  const { data } = await http.post("/orchards", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.orchard;
};

export const deleteOrchard = async (id) => {
  const { data } = await http.delete(`/orchards/${id}`);
  return data;
};

export const toggleOrchardStatus = async (id) => {
  const { data } = await http.patch(`/orchards/${id}/toggle-status`);
  return data.orchard;
};
