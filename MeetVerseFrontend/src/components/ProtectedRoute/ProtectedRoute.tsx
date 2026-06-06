import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  // use the JWT token key saved by login/signup
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
