import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";
import { ROLES } from "../constants/roles";
import { ROUTES } from "../config/routes";

interface PublicRouteProps {
  children?: React.ReactNode;
  restricted?: boolean; // If restricted, logged-in users cannot access (e.g. /login, /register)
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
}) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  // If route is restricted (like Login / Register) and user is already authenticated:
  if (restricted && isAuthenticated && user) {
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get("redirect");

    if (redirectUrl) {
      return <Navigate to={redirectUrl} replace />;
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      return <Navigate to={ROUTES.ADMIN.ROOT} replace />;
    }

    if (user.role === ROLES.VENDOR) {
      return <Navigate to={ROUTES.VENDOR.ROOT} replace />;
    }

    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
