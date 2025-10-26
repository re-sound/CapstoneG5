import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const [user_id, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user_id || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const success = await login(user_id, password);
    
    if (!success) {
      setError('Credenciales inválidas. Usa admin:admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sistema de Monitoreo de Temperaturas
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-slate-300">
                Usuario
              </label>
              <input
                id="user_id"
                name="user_id"
                type="text"
                required
                value={user_id}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Credenciales de prueba: <span className="font-mono">admin:admin</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
