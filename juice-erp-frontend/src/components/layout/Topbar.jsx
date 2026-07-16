import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Sun, Moon, ChevronDown, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';

const ROLE_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  vendedor: 'Vendedor',
};

export default function Topbar({ onOpenMobileMenu, user = { name: 'Usuario', role: 'admin' }, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // ---------- Notificaciones ----------
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState({ stockBajo: 0, ordenesActivas: 0 });
  const notifRef = useRef(null);

  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    function handleClickFuera(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  async function cargarNotificaciones() {
    try {
      const [productos, ordenes] = await Promise.all([
        supabase.from('productos').select('id, stock_actual, stock_minimo'),
        supabase.from('ordenes').select('id', { count: 'exact' }).eq('estado', 'Activa'),
      ]);

      const stockBajo = (productos.data || []).filter(p => p.stock_actual <= p.stock_minimo).length;

      setNotificaciones({
        stockBajo,
        ordenesActivas: ordenes.count || 0,
      });
    } catch (err) {
      console.error('Error cargando notificaciones:', err.message);
    }
  }

  const totalNotificaciones = notificaciones.stockBajo + notificaciones.ordenesActivas;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 h-16 px-4 lg:px-6 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-200 dark:border-ink-800">
      <button
        onClick={onOpenMobileMenu}
        className="lg:hidden p-2 -ml-2 rounded-lg text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {totalNotificaciones > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-mango-500 text-white text-[9px] font-bold flex items-center justify-center">
                {totalNotificaciones}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg shadow-soft py-2 text-sm">
              <p className="px-4 py-1 text-[11px] font-bold uppercase text-ink-700/40 dark:text-ink-100/30">Notificaciones</p>

              {totalNotificaciones === 0 ? (
                <p className="px-4 py-3 text-ink-700/50 dark:text-ink-100/40">No hay alertas pendientes.</p>
              ) : (
                <>
                  {notificaciones.stockBajo > 0 && (
                    <button
                      onClick={() => { navigate('/inventario'); setNotifOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-100 dark:hover:bg-ink-700 text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                        <Package size={15} className="text-amber-600 dark:text-amber-400" />
                      </span>
                      <span>
                        <span className="font-medium">{notificaciones.stockBajo} producto(s) con stock bajo</span>
                        <span className="block text-xs text-ink-700/50 dark:text-ink-100/40">Revisar inventario</span>
                      </span>
                    </button>
                  )}
                  {notificaciones.ordenesActivas > 0 && (
                    <button
                      onClick={() => { navigate('/ordenes'); setNotifOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-100 dark:hover:bg-ink-700 text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <ShoppingCart size={15} className="text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <span className="font-medium">{notificaciones.ordenesActivas} orden(es) pendiente(s)</span>
                        <span className="block text-xs text-ink-700/50 dark:text-ink-100/40">Esperando procesar</span>
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Menú de usuario */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-mango-400 to-lime-500 text-white text-xs font-semibold">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
            <span className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-ink-700/60 dark:text-ink-100/50">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown size={14} className="hidden md:block text-ink-700/50 dark:text-ink-100/40" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-lg shadow-soft py-1 text-sm">
              <a href="#" className="block px-4 py-2 hover:bg-ink-100 dark:hover:bg-ink-700">Mi perfil</a>
              <a href="#" className="block px-4 py-2 hover:bg-ink-100 dark:hover:bg-ink-700">Cambiar contraseña</a>
              <div className="my-1 border-t border-ink-200 dark:border-ink-700" />
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}