import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="text-center fade-in">
        <div className="mb-4">
          <i className="bi bi-emoji-frown" style={{ fontSize: '5rem', color: 'var(--primary)' }}></i>
        </div>
        <h1 className="display-1 fw-bold" style={{ color: 'var(--primary)' }}>404</h1>
        <p className="fs-5 text-muted mb-4">Página no encontrada</p>
        <Link to="/dashboard" className="btn btn-dental-primary btn-lg d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-left"></i>
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
