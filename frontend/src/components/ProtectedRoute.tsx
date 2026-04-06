
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "student" | "parent" | "tutor" | "consultant" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // If still loading auth state, show nothing or a loading spinner
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // If role is required and user doesn't have it, redirect to appropriate dashboard
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === "tutor") {
      return <Navigate to="/tutor-dashboard" replace />;
    } else if (user?.role === "consultant") {
      return <Navigate to="/consultant-dashboard" replace />;
    } else if (user?.role === "parent") {
      return <Navigate to="/parent-dashboard" replace />;
    } else {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  // If authenticated and has required role (or no role required), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
