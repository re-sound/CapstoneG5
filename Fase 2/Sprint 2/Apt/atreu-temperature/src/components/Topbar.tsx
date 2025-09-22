import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { session, logout } = useAuth();
  return (
    <header className="bg-slate-900 text-slate-100 px-4 py-3 shadow sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="font-bold tracking-wide">Atreu Temperature</Link>
        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/dashboard" className={({isActive})=>isActive?"text-sky-400":"hover:text-sky-300"}>Dashboard</NavLink>
          <NavLink to="/historico" className={({isActive})=>isActive?"text-sky-400":"hover:text-sky-300"}>Histórico</NavLink>
          <NavLink to="/alertas" className={({isActive})=>isActive?"text-sky-400":"hover:text-sky-300"}>Alertas</NavLink>
          <NavLink to="/reportes" className={({isActive})=>isActive?"text-sky-400":"hover:text-sky-300"}>Reportes</NavLink>
          {session?.role === "admin" && (
            <NavLink to="/admin" className={({isActive})=>isActive?"text-sky-400":"hover:text-sky-300"}>Admin</NavLink>
          )}
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">{session?.name} — {session?.role}</span>
          <button onClick={logout} className="ml-2 rounded px-2 py-1 bg-slate-800 hover:bg-slate-700">Salir</button>
        </nav>
      </div>
    </header>
  );
}
