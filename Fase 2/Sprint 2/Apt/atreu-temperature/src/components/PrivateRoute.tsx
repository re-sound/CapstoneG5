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
  const { user, session } = useAuth();

  if (!session || !user) return <Navigate to="/login" replace />;

  // Mapear role_id a string para verificación
  const userRole = user.role_id === 1 ? "admin" : user.role_id === 2 ? "operador" : "observador";

  if (roles && !roles.includes(userRole as "admin" | "operador" | "observador")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}
