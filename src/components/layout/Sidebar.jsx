import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { hasRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
    { path: '/calendario-citas', icon: 'bi-calendar-week', label: 'Citas', roles: ['ADMINISTRADOR','ODONTOLOGA','RECEPCIONISTA'] },
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
      <i className={`bi ${item.icon}`}></i>
      {isOpen && <span className="sidebar-item-label">{item.label}</span>}
    </NavLink>
  );

  return (
    <aside className={`dental-sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="bi bi-droplet-half"></i>
        </div>
        {isOpen && (
          <div className="sidebar-brand">
            <span className="sidebar-title">DentalPro</span>
            <span className="sidebar-subtitle">Gestion Clinica</span>
          </div>
        )}
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
              <i className="bi bi-grid"></i>
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

      <div className="sidebar-bottom">
        <button className="sidebar-btn-primary" onClick={() => navigate('/calendario-citas')}>
          <i className="bi bi-plus-lg"></i>
          {isOpen && <span>Nueva Cita</span>}
        </button>
        <NavLink to="/configuracion" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
          <i className="bi bi-question-circle"></i>
          {isOpen && <span className="sidebar-item-label">Soporte</span>}
        </NavLink>
        <button className="sidebar-item" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right" style={{ color: 'var(--error)' }}></i>
          {isOpen && <span className="sidebar-item-label" style={{ color: 'var(--error)' }}>Cerrar Sesion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
