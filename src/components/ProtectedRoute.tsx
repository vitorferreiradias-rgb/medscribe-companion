import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";

export function ProtectedRoute() {
  const data = useAppData();
  if (!data.settings.sessionSimulated.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
