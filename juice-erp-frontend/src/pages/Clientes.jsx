import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Search, Plus, X, Phone, Mail, MapPin, Building2, Trash2, Pencil } from 'lucide-react';

const TIPOS_CLIENTE = ['Consumidor Final', 'Empresa'];

export default function Clientes({ usuario }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '', telefono: '', correo: '', direccion: '', empresa: '', tipo_cliente: 'Consumidor Final',
  });

  const [detalleCliente, setDetalleCliente] = useState(null);
  const [historialCompras, setHistorialCompras] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const esAdmin = usuario?.role === 'admin';

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    setCargando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error cargando clientes: ${error.message}` });
    } else {
      setClientes(data || []);
    }
    setCargando(false);
  }

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.empresa?.toLowerCase().includes(q)
    );
  });

  function abrirNuevo() {
    setClienteEditando(null);
    setForm({ nombre: '', telefono: '', correo: '', direccion: '', empresa: '', tipo_cliente: 'Consumidor Final' });
    setModalAbierto(true);
  }

  function abrirEditar(cliente) {
    setClienteEditando(cliente);
    setForm({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      empresa: cliente.empresa || '',
      tipo_cliente: cliente.tipo_cliente || 'Consumidor Final',
    });
    setModalAbierto(true);
  }

  async function guardarCliente(e) {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!form.nombre.trim() || !form.telefono.trim()) {
      setMensaje({ tipo: 'error', texto: 'Nombre y teléfono son obligatorios.' });
      return;
    }

    try {
      if (clienteEditando) {
        const { error } = await supabase
          .from('clientes')
          .update(form)
          .eq('id', clienteEditando.id);
        if (error) throw error;
        setMensaje({ tipo: 'success', texto: 'Cliente actualizado correctamente.' });
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([form]);
        if (error) throw error;
        setMensaje({ tipo: 'success', texto: 'Cliente creado correctamente.' });
      }
      setModalAbierto(false);
      cargarClientes();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error: ${err.message}` });
    }
  }

  async function eliminarCliente(cliente) {
    if (!confirm(`¿Seguro que quieres eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
    if (error) {
      setMensaje({ tipo: 'error', texto: `Error al eliminar: ${error.message}` });
    } else {
      setMensaje({ tipo: 'success', texto: 'Cliente eliminado.' });
      cargarClientes();
    }
  }

  async function verHistorial(cliente) {
    setDetalleCliente(cliente);
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from('ventas')
      .select('id, fecha_hora, total, metodo_pago, estado_venta')
      .eq('cliente_id', cliente.id)
      .order('fecha_hora', { ascending: false });

    if (!error) setHistorialCompras(data || []);
    setCargandoHistorial(false);
  }

  const totalComprado = historialCompras.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ultimaCompra = historialCompras[0]?.fecha_hora;

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">Clientes</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div className={`p-3 rounded-lg border text-sm ${
          mensaje.tipo === 'error'
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
            : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-ink-400">Cargando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-ink-400">No se encontraron clientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-400">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Empresa</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="border-b border-ink-100 dark:border-ink-800/60 hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors cursor-pointer"
                    onClick={() => verHistorial(cliente)}
                  >
                    <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{cliente.nombre}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{cliente.telefono}</td>
                    <td className="px-4 py-3 text-ink-600 dark:text-ink-300 hidden md:table-cell">{cliente.empresa || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cliente.tipo_cliente === 'Empresa'
                          ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {cliente.tipo_cliente}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {esAdmin && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(cliente)}
                            className="p-1.5 text-ink-400 hover:text-emerald-500 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => eliminarCliente(cliente)}
                            className="p-1.5 text-ink-400 hover:text-red-500 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo/Editar Cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-ink-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
              <h2 className="font-bold text-lg text-ink-900 dark:text-white">
                {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-ink-400 hover:text-ink-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCliente} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Teléfono *</label>
                <input
                  type="text"
                  required
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Tipo</label>
                  <select
                    value={form.tipo_cliente}
                    onChange={(e) => setForm({ ...form, tipo_cliente: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                {clienteEditando ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle / Historial de Compras */}
      {detalleCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-ink-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
              <div>
                <h2 className="font-bold text-lg text-ink-900 dark:text-white">{detalleCliente.nombre}</h2>
                <p className="text-xs text-ink-400">Historial de compras</p>
              </div>
              <button onClick={() => setDetalleCliente(null)} className="text-ink-400 hover:text-ink-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2 border-b border-ink-100 dark:border-ink-800 text-sm">
              <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                <Phone size={14} /> {detalleCliente.telefono}
              </div>
              {detalleCliente.correo && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <Mail size={14} /> {detalleCliente.correo}
                </div>
              )}
              {detalleCliente.direccion && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <MapPin size={14} /> {detalleCliente.direccion}
                </div>
              )}
              {detalleCliente.empresa && (
                <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                  <Building2 size={14} /> {detalleCliente.empresa}
                </div>
              )}
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 border-b border-ink-100 dark:border-ink-800">
              <div className="bg-slate-50 dark:bg-ink-950/50 rounded-lg p-3">
                <p className="text-xs text-ink-400">Total comprado</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">RD${totalComprado.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-ink-950/50 rounded-lg p-3">
                <p className="text-xs text-ink-400">Última compra</p>
                <p className="font-bold text-ink-900 dark:text-white text-sm">
                  {ultimaCompra ? new Date(ultimaCompra).toLocaleDateString() : 'Sin compras'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cargandoHistorial ? (
                <p className="text-center text-ink-400 text-sm py-6">Cargando historial...</p>
              ) : historialCompras.length === 0 ? (
                <p className="text-center text-ink-400 text-sm py-6">Este cliente aún no tiene compras registradas.</p>
              ) : (
                historialCompras.map((venta) => (
                  <div key={venta.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-ink-950/40 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-ink-900 dark:text-white">
                        {new Date(venta.fecha_hora).toLocaleDateString()} - {venta.metodo_pago}
                      </p>
                      <p className="text-xs text-ink-400">{venta.estado_venta}</p>
                    </div>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      RD${Number(venta.total).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
