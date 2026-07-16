import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

import DashboardLayout from './components/layout/DashboardLayout';
import Login from './components/Login';

import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Inventario from './pages/Inventario';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Auditoria from './pages/Auditoria';
import Comisiones from './pages/Comisiones';
import Configuracion from './pages/Configuracion';
import Ordenes from './pages/Ordenes';


// IMPORTA EL NUEVO MÓDULO DE VENTAS
import Ventas from './pages/Ventas';

import { supabase } from './config/supabase';

const ROL_MAP = {
  Administrador: 'admin',
  Supervisor: 'supervisor',
  Vendedor: 'vendedor',
};

function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      if (session) {
        cargarPerfil(session.user.id);
      } else {
        setCargandoSesion(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        cargarPerfil(session.user.id);
      } else {
        setPerfil(null);
        setCargandoSesion(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function cargarPerfil(userId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          email,
          estado,
          roles (
            nombre_rol
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      const rolOriginal = data.roles?.nombre_rol || 'Vendedor';

      setPerfil({
        id: data.id,
        name: data.nombre,
        email: data.email,
        role: ROL_MAP[rolOriginal] || 'vendedor',
        roleLabel: rolOriginal,
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setCargandoSesion(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
  };

  if (cargandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando...
      </div>
    );
  }

  if (!session) {
    return (
      <ThemeProvider>
        <Login onLogin={() => {}} />
      </ThemeProvider>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando perfil...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <DashboardLayout
                user={perfil}
                onLogout={handleLogout}
              />
            }
          >
            <Route path="/" element={<Dashboard />} />

            {/* MÓDULO DE VENTAS */}
            <Route
              path="/ventas"
              element={<Ventas usuario={perfil} />}
            />

            <Route
              path="/clientes"
              element={<Clientes usuario={perfil} />}
            />

            <Route
              path="/inventario"
              element={<Inventario />}
            />

            <Route
              path="/reportes"
              element={<Reportes />}
            />

            <Route
              path="/comisiones"
              element={<Comisiones />}
            />

            <Route
              path="/usuarios"
              element={<Usuarios />}
            />

            <Route
              path="/auditoria"
              element={<Auditoria />}
            />

            <Route
              path="/configuracion"
              element={<Configuracion />}
            />

            <Route
              path="/ordenes"
              element={<Ordenes />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;