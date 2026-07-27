import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Credenciales inválidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <i className="bi bi-droplet-half"></i>
          <h1 className="login-title">DentalCare</h1>
          <p className="login-subtitle">Sistema de Gestión Dental</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="d-flex justify-content-end mb-3">
            <Link to="/forgot-password" className="text-decoration-none" style={{ fontSize: '0.85rem' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button
            type="submit"
            className="btn btn-dental-primary w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            )}
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="text-center mt-4 mb-0" style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
          &copy; {new Date().getFullYear()} DentalCare. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
