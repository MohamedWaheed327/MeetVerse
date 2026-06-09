import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  firstName: string | null;
  userId: string | null;
  logout: () => void;
  login: (token: string, username: string, userid: string, rememberMe?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat malformed tokens as expired
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return token ? !isTokenExpired(token) : false;
  });
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
    const storedUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid");
    
    if (token) {
      if (isTokenExpired(token)) {
        // Clear if expired
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userid");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("userid");
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(true);
        setUsername(storedUsername);
        setUserId(storedUserId);
      }
    }
  }, []);

  const login = (token: string, newUsername: string, newUserId: string, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear both first to avoid stale data
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userid");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userid");

    storage.setItem("token", token);
    storage.setItem("username", newUsername);
    storage.setItem("userid", newUserId);
    
    setIsLoggedIn(true);
    setUsername(newUsername);
    setUserId(newUserId);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userid");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userid");
    
    setIsLoggedIn(false);
    setUsername(null);
    setUserId(null);
    window.location.href = "/";
  };

  const firstName = username ? username.split(" ")[0] : null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, firstName, userId, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
