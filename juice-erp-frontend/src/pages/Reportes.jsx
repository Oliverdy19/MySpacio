import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const haceUnMesISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

export default function Reportes() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [fechaDesde, setFechaDesde] = useState(haceUnMesISO());
  const [fechaHasta, setFechaHasta] = useState(hoyISO());
  const [metodoPago, setMetodoPago] = useState('todos');
  const [incluirCanceladas, setIncluirCanceladas] = useState(false);

  useEffect(() => {
    cargarReportes();
  }, [fechaDesde, fechaHasta]);

  async function cargarReportes() {
    setCargando(true);
    setError('');
    try {
      let query = supabase
        .from('ventas')
        .select(`
          id,
          total,
          subtotal,
          descuento,
          impuestos,
          metodo_pago,
          estado_venta,
          fecha_hora,
          cliente_nombre,
          usuarios ( nombre ),
          clientes ( nombre )
        `)
        .order('fecha_hora', { ascending: false });

      if (fechaDesde) query = query.gte('fecha_hora', `${fechaDesde}T00:00:00`);
      if (fechaHasta) query = query.lte('fecha_hora', `${fechaHasta}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      setVentas(data || []);
    } catch (err) {
      console.error("Error al cargar reportes:", err.message);
      setError(`No se pudieron cargar los reportes: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  // Filtrado en memoria por método de pago y estado (sin re-consultar la BD)
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      const cumpleEstado = incluirCanceladas || v.estado_venta !== 'Cancelada';
      const cumpleMetodo = metodoPago === 'todos' || v.metodo_pago === metodoPago;
      return cumpleEstado && cumpleMetodo;
    });
  }, [ventas, metodoPago, incluirCanceladas]);

  // Resumen calculado a partir de lo ya filtrado (no vuelve a pedir nada a Supabase)
  const resumen = useMemo(() => {
    const total = ventasFiltradas.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const subtotal = ventasFiltradas.reduce((acc, v) => acc + Number(v.subtotal || 0), 0);
    const descuentos = ventasFiltradas.reduce((acc, v) => acc + Number(v.descuento || 0), 0);
    const impuestos = ventasFiltradas.reduce((acc, v) => acc + Number(v.impuestos || 0), 0);
    const canceladas = ventas.filter(v => v.estado_venta === 'Cancelada').length;
    const ticketPromedio = ventasFiltradas.length ? total / ventasFiltradas.length : 0;

    return {
      total,
      subtotal,
      descuentos,
      impuestos,
      transacciones: ventasFiltradas.length,
      canceladas,
      ticketPromedio,
    };
  }, [ventasFiltradas, ventas]);

  const badgeEstado = (estado) => {
    if (estado === 'Cancelada') return 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400';
    if (estado === 'Pendiente') return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
    return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
  };

  const exportarCSV = () => {
    const filas = [
      ['Fecha', 'Cliente', 'Atendido por', 'Método de pago', 'Estado', 'Subtotal', 'Descuento', 'Impuestos', 'Total'],
      ...ventasFiltradas.map(v => [
        v.fecha_hora ? new Date(v.fecha_hora).toLocaleString('es-DO') : '',
        v.clientes?.nombre || v.cliente_nombre || '',
        v.usuarios?.nombre || '',
        v.metodo_pago || '',
        v.estado_venta || '',
        Number(v.subtotal || 0).toFixed(2),
        Number(v.descuento || 0).toFixed(2),
        Number(v.impuestos || 0).toFixed(2),
        Number(v.total || 0).toFixed(2),
      ])
    ];
    const csv = filas.map(f => f.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ventas_${fechaDesde}_a_${fechaHasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">

      {/* Cabecera */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
        <h1 className="text-xl font-bold">Reportes de ventas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumen histórico de transacciones realizadas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-ink-900 p-4 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="todos">Todos los métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
          <input
            type="checkbox"
            checked={incluirCanceladas}
            onChange={(e) => setIncluirCanceladas(e.target.checked)}
            className="rounded border-ink-300"
          />
          Incluir canceladas
        </label>

        <div className="flex-1" />

        <button
          onClick={exportarCSV}
          disabled={ventasFiltradas.length === 0}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Exportar CSV
        </button>
        <button
          onClick={cargarReportes}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-ink-900 p-5 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-xs text-slate-500">Ingresos totales</p>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            RD${resumen.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-5 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-xs text-slate-500">Transacciones</p>
          <h2 className="text-2xl font-bold mt-1 font-mono">{resumen.transacciones}</h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-5 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-xs text-slate-500">Ticket promedio</p>
          <h2 className="text-2xl font-bold mt-1 font-mono">
            RD${resumen.ticketPromedio.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-5 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-xs text-slate-500">Descuentos otorgados</p>
          <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            RD${resumen.descuentos.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="bg-white dark:bg-ink-900 p-5 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
          <p className="text-xs text-slate-500">Ventas canceladas</p>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">{resumen.canceladas}</h2>
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Fecha</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Cliente</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Atendido por</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Método de pago</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Estado</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Monto total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Cargando datos...</td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No hay ventas para el período o filtros seleccionados.</td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-ink-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {v.fecha_hora ? new Date(v.fecha_hora).toLocaleString('es-DO') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">{v.clientes?.nombre || v.cliente_nombre || 'Consumidor final'}</td>
                    <td className="px-6 py-4 text-sm">{v.usuarios?.nombre || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{v.metodo_pago || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${badgeEstado(v.estado_venta)}`}>
                        {v.estado_venta || 'Completada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      RD${Number(v.total || 0).toFixed(2)}
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