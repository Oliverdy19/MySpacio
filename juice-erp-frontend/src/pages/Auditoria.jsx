import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';

const LIMITE_REGISTROS = 200;

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    cargarLogs();
  }, []);

  async function cargarLogs() {
    setCargando(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('auditoria_accesos')
        .select(`
          id,
          accion,
          ip_direccion,
          fecha_hora,
          usuarios ( nombre, email )
        `)
        .order('fecha_hora', { ascending: false })
        .limit(LIMITE_REGISTROS);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error al cargar auditoría:", err.message);
      setError(`No se pudo cargar la auditoría: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      const texto = busqueda.toLowerCase();
      const coincideTexto =
        !texto ||
        (log.accion || '').toLowerCase().includes(texto) ||
        (log.ip_direccion || '').toLowerCase().includes(texto) ||
        (log.usuarios?.nombre || '').toLowerCase().includes(texto) ||
        (log.usuarios?.email || '').toLowerCase().includes(texto);

      const fecha = new Date(log.fecha_hora);
      const cumpleDesde = !fechaDesde || fecha >= new Date(fechaDesde + 'T00:00:00');
      const cumpleHasta = !fechaHasta || fecha <= new Date(fechaHasta + 'T23:59:59');

      return coincideTexto && cumpleDesde && cumpleHasta;
    });
  }, [logs, busqueda, fechaDesde, fechaHasta]);

  const colorAccion = (accion = '') => {
    const a = accion.toLowerCase();
    if (a.includes('eliminar') || a.includes('delete') || a.includes('borrar')) {
      return 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400';
    }
    if (a.includes('crear') || a.includes('insert') || a.includes('nuevo') || a.includes('registro')) {
      return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
    }
    if (a.includes('editar') || a.includes('actualiz') || a.includes('update')) {
      return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
    }
    if (a.includes('login') || a.includes('sesión') || a.includes('sesion') || a.includes('acceso')) {
      return 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400';
    }
    return 'bg-slate-100 dark:bg-ink-800 text-slate-600 dark:text-slate-300';
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">

      {/* Cabecera */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Auditoría de sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registro de accesos y actividades realizadas en la plataforma</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Buscar por acción, usuario o IP..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-56 px-4 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {(busqueda || fechaDesde || fechaHasta) && (
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={cargarLogs}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="p-4 rounded-lg border text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Contador */}
      {!cargando && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mb-2">
          Mostrando {logsFiltrados.length} de {logs.length} registros {logs.length === LIMITE_REGISTROS ? `(límite de ${LIMITE_REGISTROS})` : ''}
        </p>
      )}

      {/* Tabla de Logs */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Fecha y hora</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Usuario</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Acción</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">Cargando registros...</td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">No se encontraron registros de auditoría.</td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-ink-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(log.fecha_hora).toLocaleString('es-DO')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{log.usuarios?.nombre || 'Sistema'}</div>
                      {log.usuarios?.email && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">{log.usuarios.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorAccion(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {log.ip_direccion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}