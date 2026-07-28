import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { hasRole } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Inicio', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/calendario-citas', icon: 'bi-calendar-week', label: 'Agenda', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/pacientes', icon: 'bi-people', label: 'Pacientes', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/tratamientos', icon: 'bi-heart-pulse', label: 'Tratamientos', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/pagos', icon: 'bi-cash-coin', label: 'Pagos', roles: ['ADMINISTRADOR','RECEPCIONISTA'] },
  ];

  const advancedItems = [
    { path: '/citas', icon: 'bi-calendar-check', label: 'Lista de citas', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/diagnosticos', icon: 'bi-clipboard2-pulse', label: 'Diagnosticos', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/planes-tratamiento', icon: 'bi-file-earmark-text', label: 'Planes', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/recetas', icon: 'bi-capsule', label: 'Recetas', roles: ['ADMINISTRADOR','ODONTOLOGA'] },
    { path: '/inventario', icon: 'bi-box-seam', label: 'Inventario', roles: ['ADMINISTRADOR'] },
    { path: '/proveedores', icon: 'bi-truck', label: 'Proveedores', roles: ['ADMINISTRADOR'] },
    { path: '/usuarios', icon: 'bi-person-badge', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
    { path: '/reportes', icon: 'bi-bar-chart', label: 'Reportes', roles: ['ADMINISTRADOR'] },
  ];

  const visibleMainItems = useMemo(() => mainItems.filter((item) => hasRole(item.roles)), [hasRole]);
  const visibleAdvancedItems = useMemo(() => advancedItems.filter((item) => hasRole(item.roles)), [hasRole]);

  const renderItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
    >
      <i className={`bi ${item.icon} sidebar-item-icon`}></i>
      {isOpen && <span className="sidebar-item-label">{item.label}</span>}
    </NavLink>
  );

  return (
    <aside className={`dental-sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <i className="bi bi-droplet-half sidebar-logo"></i>
        {isOpen && <span className="sidebar-title">DentalCare</span>}
      </div>
      <nav className="sidebar-nav">
        {visibleMainItems.map(renderItem)}

        {visibleAdvancedItems.length > 0 && (
          <div className="sidebar-more">
            <button
              type="button"
              className="sidebar-more-toggle"
              onClick={() => setShowMore((current) => !current)}
              aria-expanded={showMore}
            >
              <i className="bi bi-grid sidebar-item-icon"></i>
              {isOpen && <span className="sidebar-item-label">Mas opciones</span>}
              {isOpen && <i className={`bi bi-chevron-${showMore ? 'up' : 'down'} ms-auto`}></i>}
            </button>

            {showMore && (
              <div className="sidebar-more-list">
                {visibleAdvancedItems.map(renderItem)}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
