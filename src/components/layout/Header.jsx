import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="dental-header">
      <div className="header-left">
        <button className="btn btn-link text-white" onClick={toggleSidebar}>
          <i className="bi bi-list fs-4"></i>
        </button>
        <span className="header-brand ms-2">DentalCare System</span>
      </div>
      <div className="header-right">
        <Link to="/notificaciones" className="btn btn-link text-white position-relative me-3">
          <i className="bi bi-bell fs-5"></i>
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            0
          </span>
        </Link>
        <div className="dropdown">
          <button className="btn btn-link text-white dropdown-toggle" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle fs-5 me-1"></i>
            {user?.nombre || 'Usuario'}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><Link to="/perfil" className="dropdown-item"><i className="bi bi-person me-2"></i>Perfil</Link></li>
            <li><Link to="/configuracion" className="dropdown-item"><i className="bi bi-gear me-2"></i>Configuración</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</button></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
