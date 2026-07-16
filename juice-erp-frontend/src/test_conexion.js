import { supabase } from './configuracio_centralizada.js';

async function testConnection() {
  try {
    const { count, error } = await supabase.from('ventas').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ Error de Supabase:", error.message);
    } else {
      console.log("✅ ¡Conectado correctamente! Base de datos lista.");
    }
  } catch (err) {
    console.error("❌ Error inesperado:", err);
  }
}

testConnection();