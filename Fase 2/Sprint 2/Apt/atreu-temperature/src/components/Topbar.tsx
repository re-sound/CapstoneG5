import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

export default function Topbar() {
  const { session, logout } = useAuth();

  return (
    <header className="topbar px-4 sm:px-6 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="font-bold text-lg sm:text-xl tracking-wide text-white hover:text-green-100 transition-colors flex items-center gap-2"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">AT</span>
          </div>
          <span className="hidden sm:inline">Atreu Temperature</span>
          <span className="sm:hidden">AT</span>
        </Link>

        {/* Navegación - siempre visible pero compacta en móviles */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <NavLink 
            to="/dashboard" 
            className={({isActive}) => 
              `px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </NavLink>
          <NavLink 
            to="/historico" 
            className={({isActive}) => 
              `px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden">Hist</span>
          </NavLink>
          <NavLink 
            to="/alertas" 
            className={({isActive}) => 
              `px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            <span className="hidden sm:inline">Alertas</span>
            <span className="sm:hidden">Alert</span>
          </NavLink>
          <NavLink 
            to="/reportes" 
            className={({isActive}) => 
              `px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            <span className="hidden sm:inline">Reportes</span>
            <span className="sm:hidden">Rep</span>
          </NavLink>
          {session?.role === "admin" && (
            <NavLink 
              to="/admin" 
              className={({isActive}) => 
                `px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-white bg-green-600/20 border border-green-500/30" 
                    : "text-green-100 hover:text-white hover:bg-green-600/10"
                }`
              }
            >
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">Adm</span>
            </NavLink>
          )}
        </nav>

        {/* Usuario y logout */}
        <LogoutButton />
      </div>
    </header>
  );
}
