import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const Pacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const response = await pacienteService.listar(params);
      const data = response.data;
      if (data.content) {
        setPacientes(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setPacientes(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setPacientes([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar pacientes';
      toast.error(msg);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await pacienteService.eliminar(deleteId);
      toast.success('Paciente eliminado exitosamente');
      setDeleteId(null);
      if (pacientes.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchPacientes();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al eliminar paciente';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchPacientes();
    }
  };

  const renderEstadoBadge = (estado) => {
    const map = {
      ACTIVO: 'badge-activo',
      INACTIVO: 'badge-inactivo',
    };
    const cls = map[estado] || 'badge-activo';
    return <span className={`badge badge-status ${cls}`}>{estado || 'ACTIVO'}</span>;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
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
          <i className="bi bi-people-fill me-2 text-primary"></i>Pacientes
        </h2>
        <Link to="/pacientes/nuevo" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nuevo Paciente
        </Link>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="searchPaciente">
              <i className="bi bi-search me-1"></i>Buscar paciente
            </label>
            <div className="input-group">
              <input
                id="searchPaciente"
                type="text"
                className="form-control"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              <button
                className="btn btn-dental-primary"
                onClick={() => fetchPacientes()}
              >
                <i className="bi bi-search"></i>
              </button>
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm('')}
                >
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
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} pacientes`
              : 'Sin resultados'}
          </span>
          {totalElements > 0 && (
            <span className="badge bg-primary">{totalElements} registros</span>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {searchTerm ? 'No se encontraron pacientes con ese criterio de búsqueda' : 'No hay pacientes registrados'}
            </p>
            {searchTerm ? (
              <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>
                Limpiar búsqueda
              </button>
            ) : (
              <Link to="/pacientes/nuevo" className="btn btn-dental-primary">
                Registrar primer paciente
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>
                      <span className="fw-semibold">#{paciente.id}</span>
                    </td>
                    <td>{paciente.nombres || '-'}</td>
                    <td>{paciente.apellidos || '-'}</td>
                    <td>{paciente.dni || '-'}</td>
                    <td>{paciente.telefono || '-'}</td>
                    <td>{paciente.email || '-'}</td>
                    <td>{renderEstadoBadge(paciente.estado)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          title="Abrir expediente"
                          onClick={() => navigate(`/pacientes/${paciente.id}`)}
                        >
                          <i className="bi bi-folder2-open"></i>
                          <span>Expediente</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Editar"
                          onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Eliminar"
                          onClick={() => setDeleteId(paciente.id)}
                        >
                          <i className="bi bi-trash"></i>
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

      {deleteId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>Confirmar Eliminación
                </h5>
                <button type="button" className="btn-close" onClick={() => !deleting && setDeleteId(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">¿Estás seguro de eliminar este paciente? Esta acción desactivará su registro.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-dental-danger d-inline-flex align-items-center gap-2"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacientes;
