import { supabase } from './config/supabase.js';

export async function cargarVentasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .gte('fecha_hora', `${hoy}T00:00:00`);

  if (error) {
    console.error('Error cargando ventas:', error.message);
    return [];
  }
  return data;
}