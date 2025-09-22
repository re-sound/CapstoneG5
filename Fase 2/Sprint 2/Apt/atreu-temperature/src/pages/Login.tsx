import {type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("admin");
  const [pwd, setPwd] = useState("1234");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // demo: rol según nombre
    const role = name === "admin" ? "admin" : name === "operador" ? "operador" : "observador";
    login(name, role as any);
    nav("/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 grid place-items-center px-4">
      <form onSubmit={onSubmit} className="bg-white text-slate-900 rounded-xl shadow p-6 w-full max-w-sm">
        <h1 className="text-3xl font-extrabold leading-tight mb-4">Iniciar sesión</h1>
        <div className="space-y-3">
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-2 border rounded" placeholder="usuario (admin/operador/observador)" />
          <input value={pwd} onChange={(e)=>setPwd(e.target.value)} type="password" className="w-full p-2 border rounded" placeholder="contraseña (demo)" />
          <button className="w-full py-2 bg-slate-900 text-white rounded hover:bg-slate-800">Entrar</button>
        </div>
      </form>
    </div>
  );
}
