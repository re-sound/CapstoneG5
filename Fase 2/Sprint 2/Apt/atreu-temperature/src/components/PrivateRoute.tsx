import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

export default function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"admin" | "operador" | "observador">;
}) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(session.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}
