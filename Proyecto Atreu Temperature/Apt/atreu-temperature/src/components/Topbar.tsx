import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="topbar px-4 sm:px-6 py-4 sticky top-0 z-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo mejorado */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
        >
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-colors">
            <span className="text-white font-bold text-lg">AT</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-xl text-white leading-tight">Atreu Temperature</h1>
            <p className="text-xs text-green-100 -mt-1">Sistema La Hornilla</p>
          </div>
        </Link>



        {/* Usuario y logout mejorado */}
        <div className="flex items-center gap-3">
          
          {/* Badge de usuario */}
          <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {(user?.full_name || user?.user_id || 'U')?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">{user?.full_name || user?.user_id}</div>
              <div className="text-xs text-green-100 capitalize">
                {user?.role_id === 1 ? "Administrador" : user?.role_id === 2 ? "Operador" : "Observador"}
              </div>
            </div>
          </div>

          {/* Botón logout mejorado */}
          <LogoutButton />
        </div>
      </div>

      {/* Barra de progreso/status sutil */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"></div>
    </header>
  );
}
