import { Navigate, Outlet } from "react-router";
import { useAuth } from "../hook/useAuth";

import { Loading } from "./Loading";

export function ProtectedRoute() {
    const { user, apiKey, isLoading } = useAuth();

    console.log("ProtectedRoute: user =", user, "isLoading =", isLoading);

    if (isLoading) {
        console.log("ProtectedRoute: still loading...");
        return <Loading message="Loading..." size="full" />;
    }
    if (!user || !apiKey) {
        console.log("ProtectedRoute: no user, redirecting to login");
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}