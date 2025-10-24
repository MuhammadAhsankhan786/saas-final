// src/services/userService.js
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const getUsers = async (token) => {
  const res = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateUserRoles = async (userId, roleIds, token) => {
  const res = await axios.put(
    `${API_BASE}/users/${userId}`,
    { role_ids: roleIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
