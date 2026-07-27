import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Pacientes from '../pages/Pacientes';
import PacienteForm from '../pages/PacienteForm';
import PacientePerfil from '../pages/PacientePerfil';
import Citas from '../pages/Citas';
import CitaForm from '../pages/CitaForm';
import CalendarioCitas from '../pages/CalendarioCitas';
import HistoriasClinicas from '../pages/HistoriasClinicas';
import HistoriaClinicaForm from '../pages/HistoriaClinicaForm';
import OdontogramaPage from '../pages/OdontogramaPage';
import Diagnosticos from '../pages/Diagnosticos';
import Tratamientos from '../pages/Tratamientos';
import TratamientoForm from '../pages/TratamientoForm';
import PlanesTratamiento from '../pages/PlanesTratamiento';
import Pagos from '../pages/Pagos';
import Recetas from '../pages/Recetas';
import RecetaForm from '../pages/RecetaForm';
import Inventario from '../pages/Inventario';
import ProductoForm from '../pages/ProductoForm';
import Proveedores from '../pages/Proveedores';
import Usuarios from '../pages/Usuarios';
import UsuarioForm from '../pages/UsuarioForm';
import Reportes from '../pages/Reportes';
import Configuracion from '../pages/Configuracion';
import NotificacionesPage from '../pages/NotificacionesPage';
import Perfil from '../pages/Perfil';
import NotFound from '../pages/NotFound';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (roles && !hasRole(roles)) return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="pacientes" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><Pacientes /></PrivateRoute>} />
        <Route path="pacientes/nuevo" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><PacienteForm /></PrivateRoute>} />
        <Route path="pacientes/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><PacienteForm /></PrivateRoute>} />
        <Route path="pacientes/:id" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><PacientePerfil /></PrivateRoute>} />

        <Route path="citas" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><Citas /></PrivateRoute>} />
        <Route path="citas/nueva" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><CitaForm /></PrivateRoute>} />
        <Route path="citas/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><CitaForm /></PrivateRoute>} />
        <Route path="calendario-citas" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA']}><CalendarioCitas /></PrivateRoute>} />

        <Route path="historias-clinicas/paciente/:pacienteId" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><HistoriasClinicas /></PrivateRoute>} />
        <Route path="historias-clinicas/nueva/:pacienteId" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><HistoriaClinicaForm /></PrivateRoute>} />
        <Route path="historias-clinicas/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><HistoriaClinicaForm /></PrivateRoute>} />

        <Route path="odontograma/paciente/:pacienteId" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><OdontogramaPage /></PrivateRoute>} />

        <Route path="diagnosticos" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><Diagnosticos /></PrivateRoute>} />

        <Route path="tratamientos" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><Tratamientos /></PrivateRoute>} />
        <Route path="tratamientos/nuevo" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><TratamientoForm /></PrivateRoute>} />
        <Route path="tratamientos/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><TratamientoForm /></PrivateRoute>} />

        <Route path="planes-tratamiento" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><PlanesTratamiento /></PrivateRoute>} />

        <Route path="pagos" element={<PrivateRoute roles={['ADMINISTRADOR','RECEPCIONISTA']}><Pagos /></PrivateRoute>} />

        <Route path="recetas" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><Recetas /></PrivateRoute>} />
        <Route path="recetas/nueva" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><RecetaForm /></PrivateRoute>} />
        <Route path="recetas/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR','ODONTOLOGA']}><RecetaForm /></PrivateRoute>} />

        <Route path="inventario" element={<PrivateRoute roles={['ADMINISTRADOR']}><Inventario /></PrivateRoute>} />
        <Route path="inventario/nuevo" element={<PrivateRoute roles={['ADMINISTRADOR']}><ProductoForm /></PrivateRoute>} />
        <Route path="inventario/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR']}><ProductoForm /></PrivateRoute>} />

        <Route path="proveedores" element={<PrivateRoute roles={['ADMINISTRADOR']}><Proveedores /></PrivateRoute>} />

        <Route path="usuarios" element={<PrivateRoute roles={['ADMINISTRADOR']}><Usuarios /></PrivateRoute>} />
        <Route path="usuarios/nuevo" element={<PrivateRoute roles={['ADMINISTRADOR']}><UsuarioForm /></PrivateRoute>} />
        <Route path="usuarios/:id/editar" element={<PrivateRoute roles={['ADMINISTRADOR']}><UsuarioForm /></PrivateRoute>} />

        <Route path="reportes" element={<PrivateRoute roles={['ADMINISTRADOR']}><Reportes /></PrivateRoute>} />

        <Route path="configuracion" element={<PrivateRoute roles={['ADMINISTRADOR']}><Configuracion /></PrivateRoute>} />
        <Route path="notificaciones" element={<PrivateRoute><NotificacionesPage /></PrivateRoute>} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
