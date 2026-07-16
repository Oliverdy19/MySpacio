import React, { useState } from 'react';
import { registrarVentaJugos } from './Módulo_Ventas.js';

export default function RegistrarVenta() {
  const [formData, setFormData] = useState({
    nombre_jugo: '',
    cantidad: '',
    precio: '',
    vendedor: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultado = await registrarVentaJugos(formData);
    
    if (resultado.success) {
      alert('✅ ¡Venta registrada con éxito!');
      setFormData({ nombre_jugo: '', cantidad: '', precio: '', vendedor: '' });
    } else {
      alert('❌ Error al registrar: ' + resultado.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
      <h3>Registrar Venta</h3>
      <input name="nombre_jugo" placeholder="Nombre del Jugo" onChange={handleChange} value={formData.nombre_jugo} required />
      <input name="cantidad" type="number" placeholder="Cantidad" onChange={handleChange} value={formData.cantidad} required />
      <input name="precio" type="number" placeholder="Precio" onChange={handleChange} value={formData.precio} required />
      <input name="vendedor" placeholder="Vendedor" onChange={handleChange} value={formData.vendedor} required />
      <button type="submit">Guardar Venta</button>
    </form>
  );
}