import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { user, logout, loading } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm text-slate-300">
          Bienvenido, <span className="font-medium text-white">{user.full_name}</span>
        </p>
        <p className="text-xs text-slate-400">
          {user.user_id} • {user.email}
        </p>
      </div>
      
      <button
        onClick={logout}
        disabled={loading}
        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Cerrando...' : 'Cerrar Sesión'}
      </button>
    </div>
  );
}
