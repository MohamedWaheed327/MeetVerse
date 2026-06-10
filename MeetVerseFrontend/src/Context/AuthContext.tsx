import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  clearAuthStorage,
  getAuthToken,
  getStoredRememberMe,
  isTokenExpired,
  persistAuth,
  setStoredRememberMe,
} from "../utils/authStorage";

interface AuthContextType {
  isLoggedIn: boolean;
  isInitializing: boolean;
  username: string | null;
  firstName: string | null;
  userId: string | null;
  logout: () => void;
  login: (token: string, username: string, userid: string, rememberMe?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    const storedUsername =
      localStorage.getItem("username") || sessionStorage.getItem("username");
    const storedUserId =
      localStorage.getItem("userid") || sessionStorage.getItem("userid");

    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setUserId(storedUserId);
    } else if (token) {
      clearAuthStorage();
      setIsLoggedIn(false);
      setUsername(null);
      setUserId(null);
    }

    setIsInitializing(false);
  }, []);

  const login = (
    token: string,
    newUsername: string,
    newUserId: string,
    rememberMe: boolean = getStoredRememberMe()
  ) => {
    persistAuth(token, newUsername, newUserId, rememberMe);
    setIsLoggedIn(true);
    setUsername(newUsername);
    setUserId(newUserId);
  };

  const logout = () => {
    clearAuthStorage();
    setStoredRememberMe(false);
    setIsLoggedIn(false);
    setUsername(null);
    setUserId(null);
    window.location.href = "/";
  };

  const firstName = username ? username.split(" ")[0] : null;

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isInitializing, username, firstName, userId, logout, login }}
    >
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
