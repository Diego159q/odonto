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
      toast.success('Inicio de sesion exitoso');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Credenciales invalidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-blur">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <div className="login-container">
        <section className="login-brand">
          <div className="login-brand-header">
            <i className="bi bi-droplet-half brand-icon"></i>
            <span className="brand-name">DentalPro</span>
          </div>

          <div className="login-illustration">
            <i className="bi bi-droplet" style={{ fontSize: '200px', color: 'var(--primary)', opacity: 0.3, display: 'block', textAlign: 'center' }}></i>
          </div>

          <div className="login-brand-text">
            <h1>Cuidamos tu sonrisa</h1>
            <p>Gestion clinica avanzada disenada para la precision y el cuidado del paciente moderno.</p>
          </div>

          <div className="login-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </section>

        <section className="login-form-section">
          <div className="mobile-logo">
            <i className="bi bi-droplet-half"></i>
            <h1>DentalPro</h1>
          </div>

          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Bienvenido de nuevo</h2>
              <p>Inicie sesion para acceder a su panel de gestion clinica.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo electronico</label>
                <div className="login-input-group">
                  <i className="bi bi-envelope input-icon"></i>
                  <input
                    id="email"
                    type="email"
                    placeholder="doctor@dentalpro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password">Contrasena</label>
                  <Link to="/forgot-password" className="login-forgot" style={{ marginBottom: 0 }}>
                    Olvido su contrasena?
                  </Link>
                </div>
                <div className="login-input-group">
                  <i className="bi bi-lock input-icon"></i>
                  <input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <i className="bi bi-arrow-right arrow"></i>
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>No tiene una cuenta? <Link to="/register">Contacte con soporte</Link></p>
              <div className="login-footer-links">
                <Link to="#">Privacidad</Link>
                <Link to="#">Terminos</Link>
                <Link to="#">Ayuda</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
