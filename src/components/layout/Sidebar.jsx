import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { hasRole } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/pacientes', icon: 'bi-people', label: 'Pacientes', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/citas', icon: 'bi-calendar-check', label: 'Citas', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/calendario-citas', icon: 'bi-calendar-week', label: 'Calendario', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/diagnosticos', icon: 'bi-clipboard2-pulse', label: 'Diagnósticos', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/tratamientos', icon: 'bi-heart-pulse', label: 'Tratamientos', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/planes-tratamiento', icon: 'bi-file-earmark-text', label: 'Planes', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/pagos', icon: 'bi-cash-coin', label: 'Pagos', roles: ['ADMINISTRADOR','RECEPCIONISTA'] },
    { path: '/recetas', icon: 'bi-capsule', label: 'Recetas', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/inventario', icon: 'bi-box-seam', label: 'Inventario', roles: ['ADMINISTRADOR'] },
    { path: '/proveedores', icon: 'bi-truck', label: 'Proveedores', roles: ['ADMINISTRADOR'] },
    { path: '/usuarios', icon: 'bi-person-badge', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
    { path: '/reportes', icon: 'bi-bar-chart', label: 'Reportes', roles: ['ADMINISTRADOR'] },
  ];

  return (
    <aside className={`dental-sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <i className="bi bi-droplet-half sidebar-logo"></i>
        {isOpen && <span className="sidebar-title">DentalCare</span>}
      </div>
      <nav className="sidebar-nav">
        {menuItems
          .filter(item => hasRole(item.roles))
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon} sidebar-item-icon`}></i>
              {isOpen && <span className="sidebar-item-label">{item.label}</span>}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
