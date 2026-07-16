import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function Comisiones() {
  const [reporte, setReporte] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosComisiones();
  }, []);

  async function cargarDatosComisiones() {
    setCargando(true);
    try {
      // Obtenemos las ventas agrupadas por usuario
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          total,
          usuarios ( nombre )
        `);

      if (error) throw error;

      // Procesar datos para agrupar por vendedor y calcular comisiones
      // Suponiendo una tasa de comisión del 5%
      const resumen = data.reduce((acc, v) => {
        const nombre = v.usuarios?.nombre || 'Sin asignar';
        if (!acc[nombre]) {
          acc[nombre] = { nombre, totalVendido: 0, comision: 0 };
        }
        acc[nombre].totalVendido += v.total;
        acc[nombre].comision = acc[nombre].totalVendido * 0.05;
        return acc;
      }, {});

      setReporte(Object.values(resumen));
    } catch (err) {
      console.error("Error al cargar comisiones:", err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">
      
      {/* Cabecera */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
        <h1 className="text-xl font-bold">Cálculo de comisiones</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumen de ventas y comisiones generadas por colaborador (tasa 5%)</p>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Colaborador</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Total vendido</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Comisión generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">Calculando comisiones...</td>
                </tr>
              ) : reporte.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">No hay datos de ventas disponibles.</td>
                </tr>
              ) : (
                reporte.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-ink-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-sm">{item.nombre}</td>
                    <td className="px-6 py-4 text-sm font-mono text-right">RD${item.totalVendido.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 text-right">
                      RD${item.comision.toFixed(2)}
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