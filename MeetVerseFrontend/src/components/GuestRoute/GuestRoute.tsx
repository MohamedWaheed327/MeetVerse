import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0F16]">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
