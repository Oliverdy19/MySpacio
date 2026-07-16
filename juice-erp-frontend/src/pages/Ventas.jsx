import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, Package,
  Loader2, X, User, UserPlus, PhoneCall, ChevronRight
} from 'lucide-react';
import { supabase } from '../config/supabase';

const TIPOS_CLIENTE = ['Consumidor Final', 'Empresa'];

export default function ModuloVentas() {
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, msg: '', type: '' });
  const [cartOpenMobile, setCartOpenMobile] = useState(false);

  // --- Cliente ---
  const [clienteQuery, setClienteQuery] = useState('');
  const [clienteResultados, setClienteResultados] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Consumidor Final');
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select(`*, sabores (nombre_sabor), presentaciones (nombre_presentacion)`);
      if (error) console.error("Error:", error);
      else setProductos(data || []);
      setLoading(false);
    };
    fetchProductos();
  }, []);

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const nombre = `${p.sabores?.nombre_sabor || ''} ${p.presentaciones?.nombre_presentacion || ''}`.toLowerCase();
      return nombre.includes(searchTerm.toLowerCase());
    });
  }, [productos, searchTerm]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!clienteQuery.trim()) {
      setClienteResultados([]);
      setBuscandoCliente(false);
      return;
    }
    setBuscandoCliente(true);
    debounceRef.current = setTimeout(async () => {
      const q = clienteQuery.trim();
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono')
        .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
        .limit(6);
      if (!error) setClienteResultados(data || []);
      setBuscandoCliente(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [clienteQuery]);

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setClienteQuery('');
    setClienteResultados([]);
    setMostrarFormNuevo(false);
  };

  const quitarCliente = () => setClienteSeleccionado(null);

  const formularioNuevoValido = nuevoNombre.trim() && nuevoTelefono.trim();

  const cerrarFormNuevo = () => {
    setMostrarFormNuevo(false);
    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevoCorreo('');
    setNuevaDireccion('');
    setNuevaEmpresa('');
    setNuevoTipo('Consumidor Final');
  };

  const crearCliente = async () => {
    if (!formularioNuevoValido) return;
    setGuardandoCliente(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoNombre.trim(),
          telefono: nuevoTelefono.trim(),
          correo: nuevoCorreo.trim() || null,
          direccion: nuevaDireccion.trim() || null,
          empresa: nuevaEmpresa.trim() || null,
          tipo_cliente: nuevoTipo
        }])
        .select()
        .single();

      if (error) throw error;
      seleccionarCliente(data);
      cerrarFormNuevo();
    } catch (err) {
      console.error('Error al crear cliente:', err);
      setNotification({ show: true, msg: `No se pudo registrar el cliente: ${err.message}`, type: 'error' });
      setTimeout(() => setNotification({ show: false }), 4000);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Límite de stock al agregar/incrementar, para no vender de más
  const addToCart = (prod) => {
    if (prod.stock_actual <= 0) return;
    setCart(prev => {
      const existente = prev.find(i => i.id_producto === prod.id);
      if (existente) {
        if (existente.cantidad >= prod.stock_actual) return prev;
        return prev.map(i => i.id_producto === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...prod, id_producto: prod.id, id_carrito: crypto.randomUUID(), cantidad: 1 }];
    });
  };

  const incrementar = (id_carrito) => {
    setCart(prev => prev.map(i => {
      if (i.id_carrito !== id_carrito) return i;
      if (i.cantidad >= i.stock_actual) return i;
      return { ...i, cantidad: i.cantidad + 1 };
    }));
  };

  const decrementar = (id_carrito) => {
    setCart(prev => prev
      .map(i => i.id_carrito === id_carrito ? { ...i, cantidad: i.cantidad - 1 } : i)
      .filter(i => i.cantidad > 0)
    );
  };

  const removeFromCart = (id_carrito) => {
    setCart(prev => prev.filter(i => i.id_carrito !== id_carrito));
  };

  const totalUnidades = useMemo(() => cart.reduce((acc, i) => acc + i.cantidad, 0), [cart]);
  const total = useMemo(() => cart.reduce((acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0), [cart]);

  const handleConfirmarOrden = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('ordenes').insert([{
        cliente_nombre: clienteSeleccionado?.nombre || 'Venta de Mostrador',
        cliente_id: clienteSeleccionado?.id || null,
        cliente_telefono: clienteSeleccionado?.telefono || null,
        total: total,
        estado: 'Activa',
        detalles: cart
      }]);

      if (error) throw error;

      setCart([]);
      setClienteSeleccionado(null);
      setCartOpenMobile(false);
      setNotification({ show: true, msg: '¡Orden creada exitosamente!', type: 'success' });
      setTimeout(() => setNotification({ show: false }), 3000);
    } catch (err) {
      console.error('Error al procesar la orden:', err);
      setNotification({ show: true, msg: `Error al procesar la orden: ${err.message}`, type: 'error' });
      setTimeout(() => setNotification({ show: false }), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const ClienteSection = () => (
    <div className="p-4 sm:p-5 border-b border-ink-200 dark:border-ink-800 shrink-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-2.5">Cliente</p>

      {clienteSeleccionado ? (
        <div className="flex items-center justify-between bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-green/15 text-brand-green flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900 dark:text-white truncate">{clienteSeleccionado.nombre}</p>
              {clienteSeleccionado.telefono && (
                <p className="text-xs text-ink-500 truncate">{clienteSeleccionado.telefono}</p>
              )}
            </div>
          </div>
          <button onClick={quitarCliente} className="text-ink-400 hover:text-red-500 shrink-0 p-1 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            placeholder="Buscar por nombre o celular..."
            value={clienteQuery}
            onChange={(e) => setClienteQuery(e.target.value)}
            className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-ink-600"
          />

          {clienteQuery.trim() && (
            <div className="mt-2 border border-ink-200 dark:border-ink-800 rounded-lg overflow-hidden divide-y divide-ink-200 dark:divide-ink-800">
              {buscandoCliente ? (
                <div className="flex items-center justify-center gap-2 py-3 text-ink-400 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Buscando...
                </div>
              ) : clienteResultados.length > 0 ? (
                clienteResultados.map(c => (
                  <button
                    key={c.id}
                    onClick={() => seleccionarCliente(c)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-ink-950 hover:bg-ink-50 dark:hover:bg-ink-900 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{c.nombre}</p>
                      {c.telefono && (
                        <p className="text-xs text-ink-500 flex items-center gap-1">
                          <PhoneCall size={10} /> {c.telefono}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-ink-400 shrink-0" />
                  </button>
                ))
              ) : (
                <button
                  onClick={() => {
                    setNuevoNombre(clienteQuery);
                    setMostrarFormNuevo(true);
                    setClienteQuery('');
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-3 bg-white dark:bg-ink-950 hover:bg-ink-50 dark:hover:bg-ink-900 text-left text-sm font-semibold text-brand-green transition-colors"
                >
                  <UserPlus size={15} /> Registrar "{clienteQuery}" como cliente nuevo
                </button>
              )}
            </div>
          )}

          {!clienteQuery.trim() && (
            <button
              onClick={() => setMostrarFormNuevo(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-ink-500 hover:text-brand-green transition-colors"
            >
              <UserPlus size={13} /> Registrar cliente nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );

  const NuevoClienteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={cerrarFormNuevo} />
      <div className="relative bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white dark:bg-ink-900">
          <h3 className="text-lg font-bold text-ink-900 dark:text-white">Nuevo cliente</h3>
          <button onClick={cerrarFormNuevo} className="text-ink-400 hover:text-ink-900 dark:hover:text-white p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Nombre *</label>
            <input
              autoFocus
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Teléfono *</label>
            <input
              value={nuevoTelefono}
              onChange={(e) => setNuevoTelefono(e.target.value)}
              className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Correo</label>
            <input
              type="email"
              value={nuevoCorreo}
              onChange={(e) => setNuevoCorreo(e.target.value)}
              className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1.5">Dirección</label>
            <input
              value={nuevaDireccion}
              onChange={(e) => setNuevaDireccion(e.target.value)}
              className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1.5">Empresa</label>
              <input
                value={nuevaEmpresa}
                onChange={(e) => setNuevaEmpresa(e.target.value)}
                className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1.5">Tipo</label>
              <select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                className="w-full bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-700 rounded-lg py-2.5 px-3.5 text-sm outline-none focus:border-brand-green text-ink-900 dark:text-white appearance-none"
              >
                {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={crearCliente}
            disabled={!formularioNuevoValido || guardandoCliente}
            className="w-full py-3.5 rounded-xl text-base font-bold bg-brand-green hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 flex items-center justify-center gap-2 transition-all"
          >
            {guardandoCliente ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Crear cliente
          </button>
        </div>
      </div>
    </div>
  );

  const CartPanel = ({ isMobile = false }) => (
    <>
      <div className="p-4 sm:p-5 border-b border-ink-200 dark:border-ink-800 flex items-center justify-between shrink-0">
        <h2 className="text-base sm:text-lg font-display font-bold text-ink-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingCart className="text-brand-green" size={20} /> Orden actual
          {totalUnidades > 0 && (
            <span className="text-[11px] font-bold bg-brand-green/15 text-brand-green rounded-full px-2 py-0.5 tabular-nums">
              {totalUnidades}
            </span>
          )}
        </h2>
        {isMobile && (
          <button onClick={() => setCartOpenMobile(false)} className="text-ink-400 hover:text-ink-900 dark:hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <ClienteSection />

      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-300 dark:text-ink-700 min-h-[160px] py-6">
            <Package size={40} className="mb-2 opacity-50" />
            <p className="text-sm text-ink-400 dark:text-ink-600">Todavía no hay productos</p>
            <p className="text-xs text-ink-300 dark:text-ink-700 mt-0.5">Toca un producto para agregarlo</p>
          </div>
        ) : (
          cart.map((item) => {
            const enLimite = item.cantidad >= item.stock_actual;
            return (
              <div key={item.id_carrito} className="flex items-center gap-3 bg-ink-50 dark:bg-ink-950 p-3 rounded-xl border border-ink-200 dark:border-ink-800">
                <div className="text-sm min-w-0 flex-1">
                  <p className="font-bold text-ink-900 dark:text-white truncate">{item.sabores?.nombre_sabor}</p>
                  <p className="text-xs text-ink-500 truncate">{item.presentaciones?.nombre_presentacion}</p>
                  <p className="text-xs text-brand-green font-semibold mt-0.5 tabular-nums">
                    RD${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg px-1 py-1 shrink-0">
                  <button
                    onClick={() => decrementar(item.id_carrito)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-ink-900 dark:text-white tabular-nums">{item.cantidad}</span>
                  <button
                    onClick={() => incrementar(item.id_carrito)}
                    disabled={enLimite}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <button onClick={() => removeFromCart(item.id_carrito)} className="text-ink-300 dark:text-ink-600 hover:text-red-500 shrink-0 p-1 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 sm:p-5 bg-ink-50/60 dark:bg-ink-950/60 border-t border-ink-200 dark:border-ink-800 shrink-0">
        <div className="flex justify-between items-baseline text-sm text-ink-500 mb-1.5">
          <span>{totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'}</span>
          <span>Subtotal</span>
        </div>
        <div className="flex justify-between text-xl sm:text-2xl font-bold mb-4 sm:mb-5 tabular-nums">
          <span className="text-ink-900 dark:text-white">Total</span>
          <span className="text-brand-green">RD${total.toFixed(2)}</span>
        </div>
        <button
          disabled={cart.length === 0 || submitting}
          onClick={handleConfirmarOrden}
          className="w-full py-3.5 sm:py-4 bg-brand-green hover:brightness-95 active:brightness-90 text-ink-950 rounded-xl font-bold text-base sm:text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          Confirmar orden
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden bg-ink-50 dark:bg-ink-950">

      {/* Columna Izquierda: Catálogo */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-w-0">
        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={19} />
          <input
            placeholder="Buscar jugos (ej. Piña Botella)..."
            className="w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15 transition-all text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-ink-600 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-ink-100 dark:bg-ink-900 rounded-2xl" />)}
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-300 dark:text-ink-700">
            <Package size={44} className="mb-2 opacity-50" />
            <p className="text-sm text-ink-400 dark:text-ink-600">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1 pb-24 lg:pb-2 content-start">
            {filteredProductos.map(p => {
              const enCarrito = cart.find(i => i.id_producto === p.id)?.cantidad || 0;
              const agotado = p.stock_actual === 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={agotado}
                  className={`relative text-left premium-card p-4 sm:p-5 cursor-pointer group flex flex-col justify-between active:scale-[0.98] ${
                    agotado
                      ? 'opacity-50 grayscale cursor-not-allowed'
                      : enCarrito > 0
                        ? 'border-brand-green/60 shadow-lg shadow-brand-green/10'
                        : 'hover:-translate-y-0.5'
                  }`}
                >
                  {agotado && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-ink-100 dark:bg-ink-800 text-ink-500 rounded-full px-2 py-0.5">
                      Agotado
                    </span>
                  )}
                  {enCarrito > 0 && !agotado && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-brand-green text-ink-950 text-xs font-bold shadow-md">
                      {enCarrito}
                    </span>
                  )}
                  <div>
                    <h3 className="text-ink-900 dark:text-white font-bold text-base sm:text-lg leading-tight">{p.sabores?.nombre_sabor}</h3>
                    <p className="text-brand-green text-xs sm:text-sm font-medium mt-0.5">{p.presentaciones?.nombre_presentacion}</p>
                    <p className="text-xs text-ink-500 mt-2">{p.stock_actual} en stock</p>
                  </div>
                  <div className="flex justify-between items-center mt-3 sm:mt-4">
                    <span className="font-bold text-lg sm:text-xl tabular-nums text-ink-900 dark:text-white">RD${Number(p.precio_unitario).toFixed(2)}</span>
                    <div className={`p-2 rounded-lg transition-colors ${enCarrito > 0 ? 'bg-brand-green text-ink-950' : 'bg-ink-100 dark:bg-ink-800 group-hover:bg-brand-green group-hover:text-ink-950 text-ink-600 dark:text-ink-300'}`}>
                      <Plus size={18} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de carrito: fijo en desktop, drawer en móvil */}
      <aside className="hidden lg:flex w-96 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-2xl flex-col shadow-2xl overflow-hidden">
        <CartPanel />
      </aside>

      {/* Botón flotante para abrir carrito en móvil */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpenMobile(true)}
          className="lg:hidden fixed bottom-5 right-5 z-30 bg-brand-green hover:brightness-95 text-ink-950 rounded-full shadow-2xl px-5 py-4 flex items-center gap-2 font-bold"
        >
          <ShoppingCart size={20} />
          RD${total.toFixed(2)}
          <span className="bg-ink-950/15 rounded-full text-xs px-2 py-0.5 tabular-nums">{totalUnidades}</span>
        </button>
      )}

      {/* Drawer del carrito en móvil */}
      {cartOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setCartOpenMobile(false)} />
          <div className="relative bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <CartPanel isMobile />
          </div>
        </div>
      )}

      {mostrarFormNuevo && <NuevoClienteModal />}

      {notification.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-6 lg:translate-x-0 px-6 py-3 rounded-lg shadow-xl text-white z-50 max-w-[90vw] ${notification.type === 'success' ? 'bg-brand-green text-ink-950' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}