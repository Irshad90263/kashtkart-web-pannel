import http from "./http";

// getall 
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
  const { data } = await http.get(`/users/getAll?page=${page}&limit=${limit}&search=${search}`);
  return data;
};
