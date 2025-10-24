// src/services/userService.js

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const setToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const clearToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    return data.user || data;
  } catch (err) {
    console.error("❌ fetchCurrentUser failed:", err);
    clearToken();
    return null;
  }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

    setToken(data.token);
    return data;
  } catch (error) {
    throw error;
  }
}

export function logoutUser() {
  clearToken();
  window.location.href = "/login";
}
