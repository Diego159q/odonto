import React, { useState, useEffect } from 'react';
import { notificacionService } from '../services/endpoints';
import { toast } from 'react-toastify';

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await notificacionService.listarPorUsuario();
      const data = response.data;
      if (data.content) setNotificaciones(data.content);
      else if (Array.isArray(data)) setNotificaciones(data);
      else setNotificaciones([]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar notificaciones';
      toast.error(msg);
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificacionService.marcarComoLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      toast.success('Notificación marcada como leída');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al marcar como leída');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-bell-fill me-2 text-primary"></i>Notificaciones
          {unreadCount > 0 && (
            <span className="badge bg-danger ms-2">{unreadCount} sin leer</span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <p className="mt-3 text-muted">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="list-group">
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-3 ${!n.leida ? 'list-group-item-primary' : ''}`}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  {!n.leida && (
                    <span className="badge bg-primary rounded-pill" style={{ width: 8, height: 8, padding: 0 }}>&nbsp;</span>
                  )}
                  <strong className={n.leida ? '' : 'text-primary'}>{n.titulo || n.asunto || 'Notificación'}</strong>
                </div>
                <p className="mb-1 text-muted">{n.mensaje || n.cuerpo || n.descripcion || ''}</p>
                <small className="text-muted">{formatDate(n.fechaCreacion || n.fecha || n.createdAt)}</small>
              </div>
              {!n.leida && (
                <button
                  className="btn btn-sm btn-outline-primary flex-shrink-0"
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Marcar como leída"
                >
                  <i className="bi bi-check2-circle"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPage;
