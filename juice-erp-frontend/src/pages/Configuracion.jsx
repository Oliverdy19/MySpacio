import React, { useState } from 'react';
import { Building2, Globe2, Bell, Moon, CheckCircle2, Loader2, Save } from 'lucide-react';

function Toggle({ checked, onChange, label, description, icon: Icon }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3.5 cursor-pointer group">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-ink-400">
            <Icon size={16} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-slate-500 dark:text-ink-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-ink-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function Configuracion() {
  const [ajustes, setAjustes] = useState({
    nombreEmpresa: 'Fruta Viva RD',
    moneda: 'DOP',
    notificaciones: true,
    modoOscuro: true
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const actualizar = (campo, valor) => {
    setAjustes(prev => ({ ...prev, [campo]: valor }));
    setGuardado(false);
  };

  const guardarAjustes = async (e) => {
    e.preventDefault();
    setGuardando(true);
    // Aquí iría la lógica para persistir en Supabase o LocalStorage
    await new Promise(res => setTimeout(res, 500));
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">

      {/* Cabecera */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm">
        <h1 className="text-xl font-bold">Configuración del sistema</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona los parámetros globales y preferencias de tu entorno</p>
      </div>

      <form onSubmit={guardarAjustes} className="space-y-6 max-w-2xl">

        {/* Sección: Empresa */}
        <div className="bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-ink-100 dark:border-ink-800 flex items-center gap-2.5">
            <Building2 size={17} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-ink-400">Información de la empresa</h2>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre de la empresa</label>
              <input
                type="text"
                value={ajustes.nombreEmpresa}
                onChange={(e) => actualizar('nombreEmpresa', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-sm transition-all"
              />
              <p className="text-xs text-slate-400 dark:text-ink-500 mt-1.5">Aparece en recibos, reportes y encabezados del sistema.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Globe2 size={14} className="text-slate-400" /> Moneda base
              </label>
              <select
                value={ajustes.moneda}
                onChange={(e) => actualizar('moneda', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-sm transition-all"
              >
                <option value="DOP">Peso Dominicano (DOP)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección: Preferencias */}
        <div className="bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-ink-100 dark:border-ink-800 flex items-center gap-2.5">
            <Bell size={17} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-ink-400">Notificaciones y apariencia</h2>
          </div>

          <div className="px-6 divide-y divide-ink-100 dark:divide-ink-800">
            <Toggle
              icon={Bell}
              label="Notificaciones del sistema"
              description="Alertas de stock bajo, órdenes nuevas y actividad relevante."
              checked={ajustes.notificaciones}
              onChange={(v) => actualizar('notificaciones', v)}
            />
            <Toggle
              icon={Moon}
              label="Forzar modo oscuro"
              description="Ignora la preferencia del sistema operativo y usa siempre tema oscuro."
              checked={ajustes.modoOscuro}
              onChange={(v) => actualizar('modoOscuro', v)}
            />
          </div>
        </div>

        {/* Guardar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-lg shadow-sm transition-colors text-sm"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar cambios
          </button>

          {guardado && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Configuración guardada
            </span>
          )}
        </div>
      </form>
    </div>
  );
}