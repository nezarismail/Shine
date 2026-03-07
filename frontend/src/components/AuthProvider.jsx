import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "https://studious-robot-r4wpqgpjp572wj5-5000.app.github.dev";

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Fetch fresh data including follower lists
          const res = await axios.get(`${BACKEND_URL}/api/users/${parsedUser.username}`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          if (res.data) {
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.error("Session refresh failed:", err);
          // Optional: clear storage if token is invalid
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading ? children : (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          Loading session...
        </div>
      )}
    </AuthContext.Provider>
  );
};