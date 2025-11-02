import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Topbar from "./components/Topbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import Alertas from "./pages/Alertas";
import Reportes from "./pages/Reportes";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Topbar />
                <main className="w-full px-6 py-6"><Dashboard /></main>
                {/* Dashboard incluye su propio Footer */}
              </PrivateRoute>
            }
          />
          <Route
            path="/historico"
            element={
              <PrivateRoute>
                <Topbar />
                <main className="w-full px-6 py-6"><Historico /></main>
                <Footer />
              </PrivateRoute>
            }
          />
          <Route
            path="/alertas"
            element={
              <PrivateRoute roles={["admin","operador"]}>
                <Topbar />
                <main className="w-full px-6 py-6"><Alertas /></main>
                <Footer />
              </PrivateRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <PrivateRoute roles={["admin","observador"]}>
                <Topbar />
                <main className="w-full px-6 py-6"><Reportes /></main>
                <Footer />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <Topbar />
                <main className="w-full px-6 py-6"><Admin /></main>
                <Footer />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
