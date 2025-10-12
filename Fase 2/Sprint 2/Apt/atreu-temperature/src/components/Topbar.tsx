import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { session, logout } = useAuth();
  return (
    <header className="topbar px-6 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="font-bold text-xl tracking-wide text-white hover:text-green-100 transition-colors flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AT</span>
          </div>
          Atreu Temperature
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-1">
          <NavLink 
            to="/dashboard" 
            className={({isActive}) => 
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/historico" 
            className={({isActive}) => 
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            Histórico
          </NavLink>
          <NavLink 
            to="/alertas" 
            className={({isActive}) => 
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            Alertas
          </NavLink>
          <NavLink 
            to="/reportes" 
            className={({isActive}) => 
              `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "text-white bg-green-600/20 border border-green-500/30" 
                  : "text-green-100 hover:text-white hover:bg-green-600/10"
              }`
            }
          >
            Reportes
          </NavLink>
          {session?.role === "admin" && (
            <NavLink 
              to="/admin" 
              className={({isActive}) => 
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-white bg-green-600/20 border border-green-500/30" 
                    : "text-green-100 hover:text-white hover:bg-green-600/10"
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Usuario y logout */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-green-200">
            <span className="font-medium text-white">{session?.name}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{session?.role}</span>
          </div>
          <button 
            onClick={logout} 
            className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
