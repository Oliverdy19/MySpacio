import { useEffect, useState } from 'react';
import { supabase } from './configuracio_centralizada.js';

export default function ListaVentas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error al cargar ventas:', error);
    else setVentas(data);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Últimas Ventas</h3>
      <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Jugo</th>
            <th>Cantidad</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr key={venta.id}>
              <td>{venta.nombre_jugo}</td>
              <td>{venta.cantidad}</td>
              <td>RD$ {venta.precio}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={fetchVentas}>Actualizar Lista</button>
    </div>
  );
}