"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Default context value for SSR safety
const defaultAuthContext = {
  user: null,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: () => {
    throw new Error("AuthProvider not mounted");
  },
  isAuthenticated: false,
  loading: true,
};

const AuthContext = createContext(defaultAuthContext);

export function useAuth() {
  const context = useContext(AuthContext);
  // During SSR, context might be undefined if component is rendered outside provider
  // Return default context to prevent destructuring errors
  if (context === undefined) {
    if (typeof window === "undefined") {
      // SSR: return default context
      return defaultAuthContext;
    }
    // Client-side: throw error if context is truly missing
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restore user from token on reload
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    // Immediately restore user from localStorage if available
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log("✅ User restored from localStorage:", userData);
        
        // Validate token in background, but don't block UI
        validateToken(token);
      } catch (error) {
        console.error("❌ Failed to parse saved user:", error);
        if (token) {
          validateToken(token);
        } else {
          setLoading(false);
        }
      }
    } else if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
    
    function validateToken(token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            // Token is invalid or expired - but don't redirect immediately
            console.log("ℹ️ Token validation failed, but staying on page");
            setLoading(false);
            return;
          }
          const data = await res.json();
          // Backend /me returns user directly, not wrapped in {user}
          const userData = data.user || data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          console.log("✅ User validated with server:", userData);
        })
        .catch((error) => {
          // Silently handle network errors - don't clear session on network errors
          console.log("ℹ️ Token validation failed (network issue), keeping session alive");
          // Keep user state from localStorage, don't clear it
        })
        .finally(() => setLoading(false));
    }
  }, []);

  // ✅ Login real Laravel JWT
  const login = async (email, password) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "Invalid credentials");
    }

    const data = await res.json();
    console.log("✅ Login response:", data);
    
    // Store token (Laravel returns 'access_token')
    const token = data.access_token || data.token;
    if (!token) {
      throw new Error("No token received from server");
    }
    
    localStorage.setItem("token", token);
    console.log("✅ Token stored in localStorage");

    // Use user data from login response if available, otherwise fetch
    let userData;
    if (data.user) {
      console.log("✅ User data from login response:", data.user);
      userData = data.user;
    } else {
      // Fetch user data
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!me.ok) throw new Error("Unable to fetch user");
      userData = await me.json();
      console.log("✅ User data from /me:", userData);
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentPage");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
