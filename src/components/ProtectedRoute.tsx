import { Navigate, Outlet } from "react-router-dom";
import { getData } from "@/lib/store";
import { useState, useEffect } from "react";
import { subscribe } from "@/lib/store";

export function ProtectedRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const data = getData();
    return data?.settings?.sessionSimulated?.isLoggedIn ?? false;
  });

  useEffect(() => {
    return subscribe(() => {
      const data = getData();
      setIsLoggedIn(data?.settings?.sessionSimulated?.isLoggedIn ?? false);
    });
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
