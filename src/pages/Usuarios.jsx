import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usuarioService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const ROL_COLORS = {
  ADMINISTRADOR: { bg: '#E8EAF6', color: '#283593' },
  ODONTOLOGA: { bg: '#E0F7FA', color: '#00695C' },
  RECEPCIONISTA: { bg: '#FFF3E0', color: '#E65100' },
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await usuarioService.listar(params);
      const data = response.data;
      if (data.content) {
        setUsuarios(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setUsuarios(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setUsuarios([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar usuarios';
      toast.error(msg);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleToggleEstado = async (id) => {
    setTogglingId(id);
    try {
      await usuarioService.cambiarEstado(id);
      toast.success('Estado actualizado exitosamente');
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchUsuarios();
  };

  const renderRolBadge = (rol) => {
    const c = ROL_COLORS[rol?.nombre] || { bg: '#F5F5F5', color: '#616161' };
    return (
      <span className="badge" style={{ backgroundColor: c.bg, color: c.color, fontWeight: 500, padding: '4px 10px' }}>
        {rol?.nombre || '-'}
      </span>
    );
  };

  const renderEstadoBadge = (activo) => {
    if (activo) return <span className="badge badge-status badge-activo">ACTIVO</span>;
    return <span className="badge badge-status badge-inactivo">INACTIVO</span>;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) pages.push(i);
    return (
      <nav>
        <ul className="pagination pagination-sm justify-content-center mb-0 py-3">
          <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 0}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {start > 0 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => setPage(0)}>1</button>
              </li>
              {start > 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setPage(p)}>{p + 1}</button>
            </li>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button className="page-link" onClick={() => setPage(totalPages - 1)}>{totalPages}</button>
              </li>
            </>
          )}
          <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages - 1}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-person-badge-fill me-2 text-primary"></i>Usuarios
        </h2>
        <Link to="/usuarios/nuevo" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nuevo Usuario
        </Link>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="searchUsuario"><i className="bi bi-search me-1"></i>Buscar</label>
            <div className="input-group">
              <input
                id="searchUsuario"
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-dental-primary" onClick={() => fetchUsuarios()}>
                <i className="bi bi-search"></i>
              </button>
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {totalElements > 0
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} usuarios`
              : 'Sin resultados'}
          </span>
          {totalElements > 0 && <span className="badge bg-primary">{totalElements} registros</span>}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-badge" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
            </p>
            {searchTerm ? (
              <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>Limpiar búsqueda</button>
            ) : (
              <Link to="/usuarios/nuevo" className="btn btn-dental-primary">Crear primer usuario</Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td><span className="fw-semibold">{u.nombre || '-'}</span></td>
                    <td>{u.apellido || '-'}</td>
                    <td>{u.email || '-'}</td>
                    <td>{u.username || '-'}</td>
                    <td>{renderRolBadge(u.rol)}</td>
                    <td>{renderEstadoBadge(u.activo)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <Link
                          to={`/usuarios/${u.id}/editar`}
                          className="btn btn-sm btn-outline-success"
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          className={`btn btn-sm ${u.activo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => handleToggleEstado(u.id)}
                          disabled={togglingId === u.id}
                        >
                          {togglingId === u.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className={`bi ${u.activo ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && renderPagination()}
      </div>
    </div>
  );
};

export default Usuarios;
