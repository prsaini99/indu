import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
}

/**
 * Wraps public pages (landing, login, signup).
 * If the user is already logged in, redirects to their role-appropriate dashboard.
 */
const RedirectIfAuthenticated = ({ children }: Props) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "tutor":
        return <Navigate to="/tutor-dashboard" replace />;
      case "consultant":
        return <Navigate to="/consultant-dashboard" replace />;
      case "parent":
        return <Navigate to="/parent-dashboard" replace />;
      default:
        return <Navigate to="/student-dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default RedirectIfAuthenticated;
