import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [error, setError] = useState('');

  // Estado para el modal de cancelación
  const [ordenACancelar, setOrdenACancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    cargarOrdenesActivas();
  }, []);

  async function cargarOrdenesActivas() {
    setCargando(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('estado', 'Activa')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrdenes(data || []);
    } catch (err) {
      console.error("Error al cargar órdenes:", err.message);
      setError(`No se pudieron cargar las órdenes: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  async function procesarOrden(orden) {
    if (procesandoId) return;
    if (!window.confirm(`¿Confirmar el procesamiento de la orden #${orden.id.slice(-6)}?`)) return;

    setProcesandoId(orden.id);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: rpcError } = await supabase.rpc('procesar_orden', {
        p_orden_id: orden.id,
        p_usuario_id: user?.id,
      });

      if (rpcError) throw rpcError;

      setOrdenes(prev => prev.filter(o => o.id !== orden.id));
    } catch (err) {
      console.error("Error al procesar:", err.message);
      setError(`No se pudo finalizar la venta de la orden #${orden.id.slice(-6)}: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  }

  // ---------- Cancelar orden ----------
  const abrirModalCancelar = (orden) => {
    setOrdenACancelar(orden);
    setMotivoCancelacion('');
  };

  const cerrarModalCancelar = () => {
    setOrdenACancelar(null);
    setMotivoCancelacion('');
  };

  async function confirmarCancelacion() {
    if (!ordenACancelar) return;
    setCancelando(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('cancelar_orden', {
        p_orden_id: ordenACancelar.id,
        p_motivo: motivoCancelacion || null,
      });

      if (rpcError) throw rpcError;

      setOrdenes(prev => prev.filter(o => o.id !== ordenACancelar.id));
      cerrarModalCancelar();
    } catch (err) {
      console.error("Error al cancelar:", err.message);
      setError(`No se pudo cancelar la orden #${ordenACancelar.id.slice(-6)}: ${err.message}`);
    } finally {
      setCancelando(false);
    }
  }

  const toggleExpandir = (id) => {
    setExpandidoId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
        <h1 className="text-xl font-bold">Gestión de órdenes activas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Procesa o cancela las órdenes pendientes</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg border text-sm bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
              <th className="px-6 py-4 font-semibold text-sm text-slate-600 w-8"></th>
              <th className="px-6 py-4 font-semibold text-sm text-slate-600">ID Orden</th>
              <th className="px-6 py-4 font-semibold text-sm text-slate-600">Cliente</th>
              <th className="px-6 py-4 font-semibold text-sm text-slate-600">Detalle</th>
              <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Total</th>
              <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
            {cargando ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Cargando...
                </td>
              </tr>
            ) : ordenes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No hay órdenes pendientes.</td>
              </tr>
            ) : (
              ordenes.map((o) => (
                <React.Fragment key={o.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-ink-800/30">
                    <td className="px-6 py-4">
                      <button onClick={() => toggleExpandir(o.id)} className="text-slate-400 hover:text-slate-600">
                        {expandidoId === o.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {o.cliente_nombre}
                      {o.cliente_telefono && (
                        <div className="text-xs text-slate-400 font-normal">{o.cliente_telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {o.detalles?.length || 0} items
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-right font-mono">RD${Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => abrirModalCancelar(o)}
                          disabled={procesandoId === o.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                          onClick={() => procesarOrden(o)}
                          disabled={procesandoId === o.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                          {procesandoId === o.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {procesandoId === o.id ? 'Procesando...' : 'Procesar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandidoId === o.id && (
                    <tr className="bg-slate-50 dark:bg-ink-950/30">
                      <td></td>
                      <td colSpan="5" className="px-6 py-4">
                        <div className="text-xs text-slate-500 space-y-1">
                          {(o.detalles || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>Producto #{item.id_producto ?? item.id} — cantidad: {item.cantidad}</span>
                              <span className="font-mono">RD${Number(item.precio_unitario).toFixed(2)} c/u</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cancelación */}
      {ordenACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-ink-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-ink-200 dark:border-ink-800">
            <h3 className="text-lg font-bold mb-1">Cancelar orden #{ordenACancelar.id.slice(-6).toUpperCase()}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Esta acción no se puede deshacer. La orden no se registrará como venta.
            </p>

            <label className="block text-sm font-medium mb-1.5">Motivo (opcional)</label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={3}
              placeholder="Ej. Cliente cambió de opinión, error en la captura..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm resize-none"
            />

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-ink-100 dark:border-ink-800">
              <button
                type="button"
                onClick={cerrarModalCancelar}
                disabled={cancelando}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-800 rounded-lg transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelando}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-colors disabled:opacity-60"
              >
                {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}