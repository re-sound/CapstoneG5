import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Topbar() {
  const { session, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="topbar px-4 sm:px-6 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between pr-20 md:pr-0">
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="font-bold text-lg sm:text-xl tracking-wide text-white hover:text-green-100 transition-colors flex items-center gap-2"
          onClick={closeMobileMenu}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">AT</span>
          </div>
          <span className="hidden sm:inline">Atreu Temperature</span>
          <span className="sm:hidden">AT</span>
        </Link>

        {/* Botón hamburguesa para móvil */}
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
        </button>

        {/* Navegación desktop */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Usuario y logout desktop */}
        <div className="hidden md:flex items-center gap-4">
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

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 py-4 border-t border-slate-700/50">
          <div className="flex flex-col space-y-2">
            {/* Navegación móvil */}
            <nav className="flex flex-col space-y-1">
              <NavLink 
                to="/dashboard" 
                onClick={closeMobileMenu}
                className={({isActive}) => 
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                onClick={closeMobileMenu}
                className={({isActive}) => 
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                onClick={closeMobileMenu}
                className={({isActive}) => 
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                onClick={closeMobileMenu}
                className={({isActive}) => 
                  `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  onClick={closeMobileMenu}
                  className={({isActive}) => 
                    `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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

            {/* Usuario y logout móvil */}
            <div className="pt-4 border-t border-slate-700/50">
              <div className="px-4 py-2 text-sm text-green-200 mb-3">
                <div className="font-medium text-white">{session?.name}</div>
                <div className="text-xs capitalize text-green-300">{session?.role}</div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="w-full px-4 py-3 text-sm font-medium text-green-100 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
