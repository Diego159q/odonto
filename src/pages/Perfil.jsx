import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/endpoints';
import { toast } from 'react-toastify';

const Perfil = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Contraseña actualizada exitosamente');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user?.nombre) return 'U';
    return user.nombre.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (rol) => {
    const labels = {
      ADMINISTRADOR: 'Administrador',
      ODONTOLOGA: 'Odontóloga',
      RECEPCIONISTA: 'Recepcionista',
    };
    return labels[rol] || rol || 'Usuario';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">Mi Perfil</h2>
      </div>

      <div className="profile-header d-flex align-items-center gap-4">
        <div className="profile-avatar">
          {getInitials()}
        </div>
        <div>
          <h3 className="mb-1" style={{ color: 'white' }}>{user?.nombre || 'Usuario'}</h3>
          <p className="mb-0" style={{ opacity: 0.9 }}>{user?.email || ''}</p>
          <span className="badge bg-white text-primary mt-2">{getRoleLabel(user?.rol)}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4">
          <h5 className="mb-4">
            <i className="bi bi-shield-lock-fill me-2 text-primary"></i>
            Cambiar Contraseña
          </h5>
          <form onSubmit={handleChangePassword} style={{ maxWidth: 500 }}>
            <div className="mb-3">
              <label className="form-label">Contraseña Actual</label>
              <input
                type="password"
                className="form-control"
                placeholder="Ingresa tu contraseña actual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Nueva Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="Ingresa la nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
              disabled={loading}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              )}
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
