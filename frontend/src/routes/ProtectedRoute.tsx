import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";
import { ROLES, Role } from "../constants/roles";
import { ROUTES } from "../config/routes";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = ROUTES.LOGIN,
}) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with query param return path
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // If roles specified and user role not in allowedRoles, redirect to home
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

// Dedicated Administrator Route Guard
export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} redirectTo={ROUTES.LOGIN}>
      {children}
    </ProtectedRoute>
  );
};

// Dedicated Vendor Route Guard
export const VendorRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={[ROLES.VENDOR]} redirectTo={ROUTES.LOGIN}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
