import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  return (
    <header className="dental-header">
      <div className="header-left">
        <button className="header-btn" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <div className="header-search">
          <i className="bi bi-search search-icon"></i>
          <input type="text" placeholder="Buscar pacientes, citas..." />
        </div>
      </div>
      <div className="header-right">
        <Link to="/notificaciones" className="header-btn">
          <i className="bi bi-bell"></i>
          <span className="badge-dot"></span>
        </Link>
        <button className="header-btn" onClick={() => navigate('/configuracion')}>
          <i className="bi bi-gear"></i>
        </button>
        <div className="header-divider"></div>
        <div className="dropdown" style={{ position: 'relative' }}>
          <div
            className="header-user"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            data-bs-toggle="dropdown"
            aria-expanded={dropdownOpen}
          >
            <div className="header-avatar">{initials}</div>
            <div className="text-right" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="header-user-name">{user?.nombre || 'Usuario'}</span>
              <span className="header-user-role">{user?.rol || 'Cirujano Dentista'}</span>
            </div>
          </div>
          <ul className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`} style={{ position: 'absolute', top: '100%', right: 0 }}>
            <li><Link to="/perfil" className="dropdown-item"><i className="bi bi-person me-2"></i>Perfil</Link></li>
            <li><Link to="/configuracion" className="dropdown-item"><i className="bi bi-gear me-2"></i>Configuracion</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesion</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
