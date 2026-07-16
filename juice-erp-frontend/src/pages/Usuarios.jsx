import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados para el modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', rol_id: '', estado: 'Activo' });

  useEffect(() => {
    inicializarModulo();
  }, []);

  async function inicializarModulo() {
    setCargando(true);
    await Promise.all([
      cargarUsuarios(),
      cargarRoles()
    ]);
    setCargando(false);
  }

  async function cargarUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`id, nombre, email, estado, rol_id, roles ( id, nombre_rol )`)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err.message);
      setMensaje({ tipo: 'error', texto: `Error: ${err.message}` });
    }
  }

  async function cargarRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre_rol');

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error("Error al cargar roles:", err.message);
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (user) => {
    setUsuarioEditando(user);
    setForm({
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id || '',
      estado: user.estado || 'Activo'
    });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setUsuarioEditando(null);
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: form.nombre,
          email: form.email,
          rol_id: form.rol_id ? Number(form.rol_id) : null,
          estado: form.estado
        })
        .eq('id', usuarioEditando.id);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: 'Usuario actualizado correctamente.' });
      cerrarModal();
      cargarUsuarios(); // Recargar datos
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al actualizar: ${err.message}` });
    }
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">
      
      {/* Cabecera y Búsqueda */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Gestión de usuarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administra las cuentas de accesos, roles y estado del personal</p>
        </div>
        
        <div className="w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Alertas */}
      {mensaje.texto && (
        <div className={`p-4 rounded-lg border text-sm transition-all ${
          mensaje.tipo === 'error'
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
            : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nombre</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Correo electrónico</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Rol asignado</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Estado</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Cargando personal...</td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No se encontraron usuarios coincidentes.</td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => {
                  const inactivo = user.estado === 'Inactivo';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-ink-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">{user.nombre}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {user.roles?.nombre_rol || 'Sin rol'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                          inactivo
                            ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {user.estado || 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => abrirModal(user)}
                          className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-sm font-medium rounded transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-ink-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-ink-200 dark:border-ink-800">
            <h3 className="text-lg font-bold mb-4">Editar {usuarioEditando?.nombre}</h3>
            
            <form onSubmit={guardarCambios} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Rol de sistema</label>
                <select
                  required
                  value={form.rol_id}
                  onChange={(e) => setForm({...form, rol_id: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Selecciona un rol...</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Estado de acceso</label>
                <select
                  required
                  value={form.estado}
                  onChange={(e) => setForm({...form, estado: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="Activo">🟢 Activo</option>
                  <option value="Inactivo">🔴 Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-ink-100 dark:border-ink-800">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}