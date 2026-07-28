import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success('Te hemos enviado un enlace de recuperación');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al solicitar recuperación';
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
          <p className="login-subtitle">Recuperar Contraseña</p>
        </div>
        {sent ? (
          <div className="text-center">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">Revisa tu bandeja de entrada para restablecer tu contraseña.</p>
            <Link to="/login" className="btn btn-dental-primary">Volver al Login</Link>
          </div>
        ) : (
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
            <button
              type="submit"
              className="btn btn-dental-primary w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none" style={{ fontSize: '0.85rem' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
