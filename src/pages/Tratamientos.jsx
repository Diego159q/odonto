import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const ESTADOS = ['', 'PLANIFICADO', 'EN_PROCESO', 'TERMINADO', 'CANCELADO', 'PENDIENTE_PAGO'];
const ESTADO_COLORS = {
  PLANIFICADO: { bg: '#E3F2FD', color: '#1565C0' },
  EN_PROCESO: { bg: '#FFF3E0', color: '#E65100' },
  TERMINADO: { bg: '#E8F5E9', color: '#2E7D32' },
  CANCELADO: { bg: '#FFEBEE', color: '#C62828' },
  PENDIENTE_PAGO: { bg: '#FFF8E1', color: '#F57F17' },
};

const Tratamientos = () => {
  const navigate = useNavigate();

  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [viewTratamiento, setViewTratamiento] = useState(null);
  const [changeEstadoId, setChangeEstadoId] = useState(null);
  const [changeEstadoValue, setChangeEstadoValue] = useState('');
  const [changeEstadoLoading, setChangeEstadoLoading] = useState(false);

  const fetchTratamientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (searchPaciente.trim()) params.search = searchPaciente.trim();
      if (filterEstado) params.estado = filterEstado;
      const response = await tratamientoService.listar(params);
      const data = response.data;
      if (data.content) {
        setTratamientos(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setTratamientos(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setTratamientos([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar tratamientos';
      toast.error(msg);
      setTratamientos([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchPaciente, filterEstado]);

  useEffect(() => {
    fetchTratamientos();
  }, [fetchTratamientos]);

  useEffect(() => {
    setPage(0);
  }, [searchPaciente, filterEstado]);

  const renderEstadoBadge = (estado) => {
    const c = ESTADO_COLORS[estado] || { bg: '#F5F5F5', color: '#616161' };
    return (
      <span className="badge badge-status" style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}20` }}>
        {estado || '-'}
      </span>
    );
  };

  const formatCurrency = (value) => {
    if (value == null) return '$0';
    return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const handleChangeEstado = async () => {
    if (!changeEstadoId || !changeEstadoValue) return;
    setChangeEstadoLoading(true);
    try {
      await tratamientoService.actualizarEstado(changeEstadoId, { estado: changeEstadoValue });
      toast.success('Estado actualizado exitosamente');
      setChangeEstadoId(null);
      setChangeEstadoValue('');
      fetchTratamientos();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al actualizar estado';
      toast.error(msg);
    } finally {
      setChangeEstadoLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-heart-pulse-fill me-2 text-primary"></i>Tratamientos
        </h2>
        <Link to="/tratamientos/nuevo" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nuevo Tratamiento
        </Link>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="searchPacienteTrat"><i className="bi bi-search me-1"></i>Paciente</label>
            <input
              id="searchPacienteTrat"
              type="text"
              className="form-control"
              placeholder="Buscar por paciente..."
              value={searchPaciente}
              onChange={(e) => setSearchPaciente(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filterEstadoTrat"><i className="bi bi-funnel me-1"></i>Estado</label>
            <select
              id="filterEstadoTrat"
              className="form-select"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos</option>
              {ESTADOS.filter(Boolean).map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
          <div className="filter-group d-flex align-items-end">
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setSearchPaciente(''); setFilterEstado(''); }}
              title="Limpiar filtros"
            >
              <i className="bi bi-eraser"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {totalElements > 0
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} tratamientos`
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
        ) : tratamientos.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-heart-pulse" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {searchPaciente || filterEstado
                ? 'No se encontraron tratamientos con esos criterios'
                : 'No hay tratamientos registrados'}
            </p>
            {(searchPaciente || filterEstado) ? (
              <button className="btn btn-outline-primary" onClick={() => { setSearchPaciente(''); setFilterEstado(''); }}>
                Limpiar filtros
              </button>
            ) : (
              <Link to="/tratamientos/nuevo" className="btn btn-dental-primary">
                Crear primer tratamiento
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Nombre Tratamiento</th>
                  <th>Pieza</th>
                  <th>Sesiones</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tratamientos.map((trat) => {
                  const pacienteName = trat.paciente
                    ? `${trat.paciente.nombres || ''} ${trat.paciente.apellidos || ''}`.trim()
                    : trat.pacienteNombre || '-';
                  const avance = trat.numeroSesiones > 0
                    ? Math.round(((trat.sesionesRealizadas || 0) / trat.numeroSesiones) * 100)
                    : 0;
                  return (
                    <tr key={trat.id}>
                      <td><span className="fw-semibold">{pacienteName}</span></td>
                      <td>{trat.nombre || '-'}</td>
                      <td>{trat.piezaDental || (trat.pieza ? `#${trat.pieza}` : '-')}</td>
                      <td>{trat.numeroSesiones || 0}</td>
                      <td className="fw-semibold">{formatCurrency(trat.precioFinal || trat.precio)}</td>
                      <td>{renderEstadoBadge(trat.estado)}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${avance}%`, backgroundColor: avance === 100 ? '#4CAF50' : '#0D6EFD' }}
                              aria-valuenow={avance}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <small className="text-muted fw-semibold">{avance}%</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="Ver detalle"
                            onClick={() => setViewTratamiento(trat)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Editar"
                            onClick={() => navigate(`/tratamientos/${trat.id}/editar`)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="Cambiar Estado"
                            onClick={() => {
                              setChangeEstadoId(trat.id);
                              setChangeEstadoValue(trat.estado || '');
                            }}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && renderPagination()}
      </div>

      {viewTratamiento && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalle del Tratamiento
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewTratamiento(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>
                      {viewTratamiento.paciente
                        ? `${viewTratamiento.paciente.nombres || ''} ${viewTratamiento.paciente.apellidos || ''}`.trim()
                        : '-'}
                    </strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Nombre</small>
                    <strong>{viewTratamiento.nombre || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Pieza Dental</small>
                    <strong>{viewTratamiento.piezaDental || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Odontólogo</small>
                    <strong>
                      {viewTratamiento.odontologo
                        ? `${viewTratamiento.odontologo.nombre || viewTratamiento.odontologo.nombres || ''} ${viewTratamiento.odontologo.apellidos || ''}`.trim()
                        : '-'}
                    </strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Sesiones</small>
                    <strong>{viewTratamiento.numeroSesiones || 0} ({viewTratamiento.sesionesRealizadas || 0} realizadas)</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Precio Final</small>
                    <strong className="text-success">{formatCurrency(viewTratamiento.precioFinal || viewTratamiento.precio)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Estado</small>
                    <div>{renderEstadoBadge(viewTratamiento.estado)}</div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">Descripción</small>
                    <strong>{viewTratamiento.descripcion || 'Sin descripción'}</strong>
                  </div>
                  {viewTratamiento.observaciones && (
                    <div className="col-12">
                      <small className="text-muted d-block">Observaciones</small>
                      <strong>{viewTratamiento.observaciones}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewTratamiento(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {changeEstadoId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-repeat text-warning me-2"></i>Cambiar Estado del Tratamiento
                </h5>
                <button type="button" className="btn-close" onClick={() => !changeEstadoLoading && setChangeEstadoId(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Nuevo Estado <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={changeEstadoValue}
                  onChange={(e) => setChangeEstadoValue(e.target.value)}
                  disabled={changeEstadoLoading}
                >
                  <option value="">Seleccionar...</option>
                  {ESTADOS.filter(Boolean).map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setChangeEstadoId(null)}
                  disabled={changeEstadoLoading}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                  onClick={handleChangeEstado}
                  disabled={changeEstadoLoading || !changeEstadoValue}
                >
                  {changeEstadoLoading && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {changeEstadoLoading ? 'Cambiando...' : 'Cambiar Estado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tratamientos;
