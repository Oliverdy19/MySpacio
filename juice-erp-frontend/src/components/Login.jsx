import React, { useState } from 'react';
import { supabase } from '../config/supabase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      setCargando(false);
      return;
    }

    onLogin(data.user);
    setCargando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-ink-950">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-ink-900 p-8 rounded-xl shadow-md border border-ink-200 dark:border-ink-800 w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-1">🍹 Juice ERP</h1>
        <p className="text-sm text-slate-400 mb-6">Inicia sesión para continuar</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mb-4 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
        />

        <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 mb-6 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
        />

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 transition-colors font-bold text-sm rounded-lg text-white"
        >
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}