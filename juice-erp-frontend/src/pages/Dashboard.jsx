import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';

const hoyRangoISO = () => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventasHoyCount: 0,
    ingresosHoy: 0,
    productosBajoStock: 0,
    totalUsuariosActivos: 0,
    ordenesActivas: 0,
  });
  const [productosCriticos, setProductosCriticos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    setCargando(true);
    setError('');
    try {
      const { inicio, fin } = hoyRangoISO();

      const [ventasHoy, productos, usuarios, ordenes] = await Promise.all([
        supabase
          .from('ventas')
          .select('total', { count: 'exact' })
          .gte('fecha_hora', inicio)
          .lte('fecha_hora', fin)
          .neq('estado_venta', 'Cancelada'),
        supabase
          .from('productos')
          .select('id, stock_actual, stock_minimo, sabores ( nombre_sabor )'),
        supabase
          .from('usuarios')
          .select('id', { count: 'exact' })
          .eq('estado', true),
        supabase
          .from('ordenes')
          .select('id', { count: 'exact' })
          .eq('estado', 'Activa'),
      ]);

      if (ventasHoy.error) throw ventasHoy.error;
      if (productos.error) throw productos.error;
      if (usuarios.error) throw usuarios.error;
      if (ordenes.error) throw ordenes.error;

      // Comparación stock_actual vs stock_minimo por producto (no un umbral fijo)
      const criticos = (productos.data || [])
        .filter(p => p.stock_actual <= p.stock_minimo)
        .sort((a, b) => a.stock_actual - b.stock_actual);

      const ingresosHoy = (ventasHoy.data || []).reduce((acc, v) => acc + Number(v.total || 0), 0);

      setStats({
        ventasHoyCount: ventasHoy.count || 0,
        ingresosHoy,
        productosBajoStock: criticos.length,
        totalUsuariosActivos: usuarios.count || 0,
        ordenesActivas: ordenes.count || 0,
      });
      setProductosCriticos(criticos.slice(0, 5));
    } catch (err) {
      console.error("Error cargando dashboard:", err.message);
      setError(`No se pudo cargar el resumen: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  const saludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const accesosDirectos = [
    { titulo: 'Ventas', path: '/ventas', icono: '🛒' },
    { titulo: 'Ordenes', path: '/ordenes', icono: '📋', badge: stats.ordenesActivas },
    { titulo: 'Inventario', path: '/inventario', icono: '📦', badge: stats.productosBajoStock, badgeColor: 'bg-amber-500' },
    { titulo: 'Reportes', path: '/reportes', icono: '📊' },
    { titulo: 'Usuarios', path: '/usuarios', icono: '👥' },
  ];

  return (
    <div className="flex flex-col space-y-8 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">

      {/* Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{saludo()}</h1>
          <p className="text-slate-500 dark:text-slate-400">Resumen ejecutivo de las operaciones del día</p>
        </div>
        <button
          onClick={cargarResumen}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 hover:border-emerald-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-sm text-slate-500">Ingresos de hoy</p>
          <h2 className="text-3xl font-bold mt-1 font-mono text-emerald-600 dark:text-emerald-400">
            {cargando ? <Loader2 className="w-6 h-6 animate-spin" /> : `RD$${stats.ingresosHoy.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-sm text-slate-500">Transacciones de hoy</p>
          <h2 className="text-3xl font-bold mt-1 font-mono">
            {cargando ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.ventasHoyCount}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-sm text-slate-500">Órdenes pendientes</p>
          <h2 className="text-3xl font-bold mt-1 font-mono text-blue-600 dark:text-blue-400">
            {cargando ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.ordenesActivas}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-sm text-slate-500">Productos con stock bajo</p>
          <h2 className="text-3xl font-bold mt-1 font-mono text-amber-600 dark:text-amber-400">
            {cargando ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.productosBajoStock}
          </h2>
        </div>
      </div>

      {/* Alerta de stock crítico */}
      {!cargando && productosCriticos.length > 0 && (
        <div className="bg-white dark:bg-ink-900 border border-amber-200 dark:border-amber-900/50 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Productos que necesitan reabastecimiento</h3>
            <Link to="/inventario" className="text-xs font-medium text-emerald-600 hover:text-emerald-500">
              Ver inventario completo →
            </Link>
          </div>
          <div className="space-y-2">
            {productosCriticos.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-100 dark:border-ink-800 last:border-0">
                <span className="font-medium">{p.sabores?.nombre_sabor || 'Sin nombre'}</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  {p.stock_actual} und. (mínimo: {p.stock_minimo})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos Rápidos */}
      <div>
        <h3 className="text-lg font-bold mb-4">Acceso rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {accesosDirectos.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center p-6 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-md transition-all space-y-2"
            >
              {!!item.badge && (
                <span className={`absolute top-2 right-2 text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center ${item.badgeColor || 'bg-blue-500'}`}>
                  {item.badge}
                </span>
              )}
              <span className="text-3xl">{item.icono}</span>
              <span className="font-semibold text-sm">{item.titulo}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}