import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoutButton from "./LogoutButton";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="topbar px-4 sm:px-6 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="font-bold text-lg sm:text-xl tracking-wide text-white hover:text-green-100 transition-colors flex items-center gap-2"
        >
          <div className="w-7 h-7 sm:w-15 sm:h-10  rounded-lg flex items-center justify-center">
            <img src="src\logo-la-hornilla.png" alt="src/logo-la-hornilla.png" />
          </div>

        </Link>

           {/* comentado por futura integracion*/}
          {/* Botón hamburguesa para móvil
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-green-100 hover:text-white hover:bg-green-600/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button> */}

        {/* Usuario y logout desktop */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-sm text-green-200">
            <span className="font-medium text-white">{user?.full_name || user?.user_id}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">
              {user?.role_id === 1 ? "admin" : user?.role_id === 2 ? "operador" : "observador"}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
