import { supabase } from './configuracio_centralizada.js';

/**
 * Registra una venta completa en la base de datos respetando el esquema relacional.
 * 
 * @param {string} usuarioId - UUID del usuario/vendedor autenticado (public.usuarios.id)
 * @param {number} clienteId - ID del cliente (public.clientes.id)
 * @param {Array} carrito - Array de productos [{ id, sabor, presentacion, cantidad, precio_unitario, descuento_aplicado }]
 * @param {string} metodoPago - 'Efectivo' | 'Tarjeta' | 'Transferencia'
 * @param {string} observaciones - Notas o comentarios del pedido
 */
export async function registrarVentaCompleta(usuarioId, clienteId, carrito, metodoPago, observaciones = '') {
  try {
    // ==========================================
    // PASO 1: Obtener regla de comisión del usuario
    // ==========================================
    const { data: reglaComision, error: errorComision } = await supabase
      .from('reglas_comisiones')
      .select('tipo_comision, valor')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (errorComision) throw new Error(`Error al consultar comisiones: ${errorComision.message}`);

    // ==========================================
    // PASO 2: Calcular totales (Subtotal, Descuento, ITBIS 18%, Total)
    // ==========================================
    let subtotal = 0;
    let totalDescuento = 0;

    const detallesCalculados = carrito.map(item => {
      const importeItem = item.precio_unitario * item.cantidad;
      const descuentoItem = (item.descuento_aplicado || 0) * item.cantidad;
      
      subtotal += importeItem;
      totalDescuento += descuentoItem;

      // Calcular comisión del producto para el detalle de venta
      let comisionGenerada = 0;
      if (reglaComision) {
        if (reglaComision.tipo_comision === 'Porcentaje') {
          // Porcentaje sobre el valor neto del producto vendido
          comisionGenerada = ((importeItem - descuentoItem) * (reglaComision.valor / 100));
        } else if (reglaComision.tipo_comision === 'Fija') {
          // Valor fijo por cada unidad física de jugo vendida
          comisionGenerada = reglaComision.valor * item.cantidad;
        }
      }

      return {
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento_aplicado: item.descuento_aplicado || 0.00,
        comision_generada: Number(comisionGenerada.toFixed(2))
      };
    });

    // En RD, el ITBIS (18%) se calcula sobre el valor neto tras aplicar descuentos
    const baseImponible = subtotal - totalDescuento;
    const impuestos = Number((baseImponible * 0.18).toFixed(2));
    const total = Number((baseImponible + impuestos).toFixed(2));

    // ==========================================
    // PASO 3: Registrar el maestro en public.ventas
    // ==========================================
    const { data: ventaData, error: errorVenta } = await supabase
      .from('ventas')
      .insert([
        {
          cliente_id: clienteId,
          usuario_id: usuarioId,
          subtotal: subtotal,
          descuento: totalDescuento,
          impuestos: impuestos,
          total: total,
          metodo_pago: metodoPago,
          estado_venta: 'Completada',
          observaciones: observaciones
        }
      ])
      .select()
      .single();

    if (errorVenta) throw errorVenta;
    const nuevaVentaId = ventaData.id;

    // ==========================================
    // PASO 4: Registrar los detalles en public.detalle_ventas
    // ==========================================
    const detallesInsertar = detallesCalculados.map(detalle => ({
      venta_id: nuevaVentaId,
      ...detalle
    }));

    const { error: errorDetalles } = await supabase
      .from('detalle_ventas')
      .insert(detallesInsertar);

    if (errorDetalles) throw errorDetalles;

    // ==========================================
    // PASO 5: Actualizar Inventario (Stock e Historial)
    // ==========================================
    for (const item of carrito) {
      // 5.1 Descontar stock del producto en stock_actual
      const { data: prodData, error: errFetchProd } = await supabase
        .from('productos')
        .select('stock_actual')
        .eq('id', item.id)
        .single();

      if (errFetchProd) throw errFetchProd;

      const nuevoStock = prodData.stock_actual - item.cantidad;

      const { error: errUpdateProd } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', item.id);

      if (errUpdateProd) throw errUpdateProd;

      // 5.2 Registrar movimiento de 'Salida' en historial_inventario
      const { error: errorHistorial } = await supabase
        .from('historial_inventario')
        .insert([
          {
            producto_id: item.id,
            tipo_movimiento: 'Salida',
            cantidad: item.cantidad,
            motivo: `Venta registrada con ID: ${nuevaVentaId}`,
            usuario_id: usuarioId
          }
        ]);

      if (errorHistorial) throw errorHistorial;
    }

    return { success: true, ventaId: nuevaVentaId, total: total };

  } catch (error) {
    console.error("Fallo crítico en el módulo de ventas:", error.message);
    return { success: false, error: error.message };
  }
}