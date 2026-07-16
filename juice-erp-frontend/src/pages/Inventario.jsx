import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados para el modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState({ precio_unitario: '', stock_actual: '' });

  // Estados para el modal de "Nuevo producto"
  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({
    sabor_id: '',
    sabor_nuevo: '',
    presentacion_id: '',
    presentacion_nueva_nombre: '',
    presentacion_nueva_ml: '',
    precio_unitario: '',
    stock_actual: '',
    stock_minimo: '10',
  });

  useEffect(() => {
    cargarInventario();
    cargarCatalogos();
  }, []);

  async function cargarInventario() {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`id, precio_unitario, stock_actual, sabores ( nombre_sabor ), presentaciones ( nombre_presentacion, mililitros )`)
        .order('id', { ascending: true });

      if (error) throw error;

      const formateado = (data || []).map(p => ({
        id: p.id,
        nombre: p.sabores?.nombre_sabor || 'Sin nombre',
        presentacion: p.presentaciones?.nombre_presentacion || (p.presentaciones?.mililitros ? `${p.presentaciones.mililitros}ml` : '—'),
        precio: p.precio_unitario,
        stock: p.stock_actual,
      }));

      setProductos(formateado);
    } catch (err) {
      console.error("Error al cargar inventario:", err.message);
      setMensaje({ tipo: 'error', texto: `Error: ${err.message}` });
    } finally {
      setCargando(false);
    }
  }

  async function cargarCatalogos() {
    try {
      const [{ data: sab, error: errSab }, { data: pres, error: errPres }] = await Promise.all([
        supabase.from('sabores').select('id, nombre_sabor').order('nombre_sabor'),
        supabase.from('presentaciones').select('id, nombre_presentacion, mililitros').order('mililitros'),
      ]);
      if (errSab) throw errSab;
      if (errPres) throw errPres;
      setSabores(sab || []);
      setPresentaciones(pres || []);
    } catch (err) {
      console.error("Error al cargar catálogos:", err.message);
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ---------- Editar producto existente ----------
  const abrirModal = (prod) => {
    setProductoEditando(prod);
    setForm({
      precio_unitario: prod.precio,
      stock_actual: prod.stock
    });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProductoEditando(null);
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('productos')
        .update({
          precio_unitario: Number(form.precio_unitario),
          stock_actual: Number(form.stock_actual)
        })
        .eq('id', productoEditando.id);

      if (error) throw error;

      setMensaje({ tipo: 'success', texto: 'Inventario actualizado correctamente.' });
      cerrarModal();
      cargarInventario();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al actualizar: ${err.message}` });
    }
  };

  // ---------- Agregar producto nuevo ----------
  const abrirModalNuevo = () => {
    setNuevoForm({
      sabor_id: '',
      sabor_nuevo: '',
      presentacion_id: '',
      presentacion_nueva_nombre: '',
      presentacion_nueva_ml: '',
      precio_unitario: '',
      stock_actual: '',
      stock_minimo: '10',
    });
    setModalNuevoVisible(true);
  };

  const cerrarModalNuevo = () => {
    setModalNuevoVisible(false);
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setGuardandoNuevo(true);

    try {
      // 1) Resolver sabor_id (crear sabor nuevo si aplica)
      let saborId = nuevoForm.sabor_id;
      if (saborId === 'nuevo') {
        const nombreSabor = nuevoForm.sabor_nuevo.trim();
        if (!nombreSabor) throw new Error('Escribe el nombre del sabor nuevo.');
        const { data: saborCreado, error: errSabor } = await supabase
          .from('sabores')
          .insert({ nombre_sabor: nombreSabor })
          .select('id')
          .single();
        if (errSabor) throw errSabor;
        saborId = saborCreado.id;
      }
      if (!saborId) throw new Error('Selecciona o crea un sabor.');

      // 2) Resolver presentacion_id (crear presentación nueva si aplica)
      let presentacionId = nuevoForm.presentacion_id;
      if (presentacionId === 'nueva') {
        const nombrePres = nuevoForm.presentacion_nueva_nombre.trim();
        const ml = Number(nuevoForm.presentacion_nueva_ml);
        if (!nombrePres) throw new Error('Escribe el nombre de la presentación nueva.');
        if (!ml || ml <= 0) throw new Error('Indica los mililitros de la presentación nueva.');
        const { data: presCreada, error: errPres } = await supabase
          .from('presentaciones')
          .insert({ nombre_presentacion: nombrePres, mililitros: ml })
          .select('id')
          .single();
        if (errPres) throw errPres;
        presentacionId = presCreada.id;
      }
      if (!presentacionId) throw new Error('Selecciona o crea una presentación.');

      // 3) Crear el producto
      const { error: errProd } = await supabase
        .from('productos')
        .insert({
          sabor_id: saborId,
          presentacion_id: presentacionId,
          precio_unitario: Number(nuevoForm.precio_unitario),
          stock_actual: Number(nuevoForm.stock_actual) || 0,
          stock_minimo: Number(nuevoForm.stock_minimo) || 10,
        });
      if (errProd) throw errProd;

      setMensaje({ tipo: 'success', texto: 'Producto agregado correctamente.' });
      cerrarModalNuevo();
      cargarInventario();
      cargarCatalogos(); // por si se creó sabor/presentación nueva
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al agregar producto: ${err.message}` });
    } finally {
      setGuardandoNuevo(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 text-ink-900 dark:text-ink-100 min-h-[calc(100vh-120px)]">

      {/* Cabecera y Búsqueda */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Gestión de inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control de stock y precios de productos</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-64 pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={abrirModalNuevo}
            className="whitespace-nowrap px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-md transition-colors"
          >
            + Nuevo producto
          </button>
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

      {/* Tabla de Productos */}
      <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-ink-950/50 border-b border-ink-200 dark:border-ink-800">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Producto</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Presentación</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Precio unitario</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Stock actual</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Estado</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Cargando inventario...</td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No se encontraron productos.</td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const agotado = prod.stock <= 0;
                  const bajoStock = prod.stock > 0 && prod.stock <= 10;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-ink-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">{prod.nombre}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{prod.presentacion}</td>
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600 dark:text-emerald-400">
                        RD${Number(prod.precio).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{prod.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                          agotado
                            ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : bajoStock
                            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {agotado ? 'Agotado' : bajoStock ? 'Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => abrirModal(prod)}
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
            <h3 className="text-lg font-bold mb-4">Editar {productoEditando?.nombre}</h3>

            <form onSubmit={guardarCambios} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Precio de venta (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.precio_unitario}
                  onChange={(e) => setForm({...form, precio_unitario: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Unidades en stock</label>
                <input
                  type="number"
                  required
                  value={form.stock_actual}
                  onChange={(e) => setForm({...form, stock_actual: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
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

      {/* Modal de Nuevo Producto */}
      {modalNuevoVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-ink-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-ink-200 dark:border-ink-800">
            <h3 className="text-lg font-bold mb-4">Agregar nuevo producto</h3>

            <form onSubmit={agregarProducto} className="space-y-4">
              {/* Sabor */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Sabor</label>
                <select
                  required
                  value={nuevoForm.sabor_id}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, sabor_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Selecciona un sabor...</option>
                  {sabores.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre_sabor}</option>
                  ))}
                  <option value="nuevo">+ Sabor nuevo...</option>
                </select>
                {nuevoForm.sabor_id === 'nuevo' && (
                  <input
                    type="text"
                    placeholder="Nombre del sabor nuevo"
                    required
                    value={nuevoForm.sabor_nuevo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, sabor_nuevo: e.target.value })}
                    className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                  />
                )}
              </div>

              {/* Presentación */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Presentación</label>
                <select
                  required
                  value={nuevoForm.presentacion_id}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, presentacion_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Selecciona una presentación...</option>
                  {presentaciones.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre_presentacion} ({p.mililitros}ml)</option>
                  ))}
                  <option value="nueva">+ Presentación nueva...</option>
                </select>
                {nuevoForm.presentacion_id === 'nueva' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nombre (ej. Botella 355ml)"
                      required
                      value={nuevoForm.presentacion_nueva_nombre}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, presentacion_nueva_nombre: e.target.value })}
                      className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Mililitros"
                      required
                      value={nuevoForm.presentacion_nueva_ml}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, presentacion_nueva_ml: e.target.value })}
                      className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Precio de venta (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={nuevoForm.precio_unitario}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, precio_unitario: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              {/* Stock inicial y mínimo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock inicial</label>
                  <input
                    type="number"
                    required
                    value={nuevoForm.stock_actual}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, stock_actual: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock mínimo</label>
                  <input
                    type="number"
                    value={nuevoForm.stock_minimo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, stock_minimo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-ink-100 dark:border-ink-800">
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoNuevo}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors disabled:opacity-60"
                >
                  {guardandoNuevo ? 'Guardando...' : 'Agregar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}