import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { citaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const ESTADOS = ['', 'PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA', 'NO_ASISTIO'];

const ESTADO_COLORS = {
  PENDIENTE: { bg: '#FFF3E0', color: '#E65100' },
  CONFIRMADA: { bg: '#E3F2FD', color: '#1565C0' },
  ATENDIDA: { bg: '#E8F5E9', color: '#2E7D32' },
  CANCELADA: { bg: '#FFEBEE', color: '#C62828' },
  REPROGRAMADA: { bg: '#F3E5F5', color: '#6A1B9A' },
  NO_ASISTIO: { bg: '#FFF8E1', color: '#F57F17' },
};

const ACTIONS_BY_ESTADO = {
  PENDIENTE: ['ver', 'editar', 'confirmar', 'cancelar', 'reprogramar'],
  CONFIRMADA: ['ver', 'cancelar', 'reprogramar'],
  ATENDIDA: ['ver'],
  CANCELADA: ['ver', 'reprogramar'],
  REPROGRAMADA: ['ver', 'confirmar', 'cancelar'],
  NO_ASISTIO: ['ver', 'reprogramar'],
};

const Citas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    searchPaciente: '',
  });

  const [viewCita, setViewCita] = useState(null);
  const [cancelCita, setCancelCita] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reprogramCita, setReprogramCita] = useState(null);
  const [reprogramData, setReprogramData] = useState({ nuevaFecha: '', nuevaHoraInicio: '', nuevaHoraFin: '' });
  const [reprogramLoading, setReprogramLoading] = useState(false);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.searchPaciente.trim()) params.search = filtros.searchPaciente.trim();
      const response = await citaService.listar(params);
      const data = response.data;
      if (data.content) {
        setCitas(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setCitas(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setCitas([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar citas';
      toast.error(msg);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtros]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  useEffect(() => {
    setPage(0);
  }, [filtros]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFiltros({ fechaDesde: '', fechaHasta: '', estado: '', searchPaciente: '' });
  };

  const handleConfirmar = async (id) => {
    try {
      await citaService.confirmar(id);
      toast.success('Cita confirmada exitosamente');
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al confirmar cita');
    }
  };

  const openCancelModal = (cita) => {
    setCancelCita(cita);
    setCancelMotivo('');
  };

  const handleCancelar = async () => {
    if (!cancelMotivo.trim()) {
      toast.warning('Debe indicar un motivo de cancelación');
      return;
    }
    setCancelLoading(true);
    try {
      await citaService.cancelar(cancelCita.id, { motivo: cancelMotivo.trim() });
      toast.success('Cita cancelada exitosamente');
      setCancelCita(null);
      setCancelMotivo('');
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar cita');
    } finally {
      setCancelLoading(false);
    }
  };

  const openReprogramModal = (cita) => {
    setReprogramCita(cita);
    setReprogramData({
      nuevaFecha: cita.fecha || '',
      nuevaHoraInicio: cita.horaInicio || '',
      nuevaHoraFin: cita.horaFin || '',
    });
  };

  const handleReprogramar = async () => {
    if (!reprogramData.nuevaFecha || !reprogramData.nuevaHoraInicio || !reprogramData.nuevaHoraFin) {
      toast.warning('Complete todos los campos para reprogramar');
      return;
    }
    if (reprogramData.nuevaHoraInicio >= reprogramData.nuevaHoraFin) {
      toast.warning('La hora de inicio debe ser menor a la hora de fin');
      return;
    }
    setReprogramLoading(true);
    try {
      await citaService.reprogramar(reprogramCita.id, {
        nuevaFecha: reprogramData.nuevaFecha,
        nuevaHoraInicio: reprogramData.nuevaHoraInicio,
        nuevaHoraFin: reprogramData.nuevaHoraFin,
      });
      toast.success('Cita reprogramada exitosamente');
      setReprogramCita(null);
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al reprogramar cita');
    } finally {
      setReprogramLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatHour = (hour) => hour || '-';

  const renderEstadoBadge = (estado) => {
    const c = ESTADO_COLORS[estado] || ESTADO_COLORS.PENDIENTE;
    return (
      <span className="badge badge-status" style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}20` }}>
        {estado || 'PENDIENTE'}
      </span>
    );
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

  const renderActions = (cita) => {
    const actions = ACTIONS_BY_ESTADO[cita.estado] || ['ver'];
    return (
      <div className="d-flex gap-1 justify-content-center flex-nowrap">
        {actions.includes('ver') && (
          <button className="btn btn-sm btn-outline-info" title="Ver detalles" onClick={() => setViewCita(cita)}>
            <i className="bi bi-eye"></i>
          </button>
        )}
        {actions.includes('editar') && (
          <button className="btn btn-sm btn-outline-success" title="Editar" onClick={() => navigate(`/citas/${cita.id}/editar`)}>
            <i className="bi bi-pencil"></i>
          </button>
        )}
        {actions.includes('confirmar') && (
          <button className="btn btn-sm btn-outline-primary" title="Confirmar" onClick={() => handleConfirmar(cita.id)}>
            <i className="bi bi-check-lg"></i>
          </button>
        )}
        {actions.includes('cancelar') && (
          <button className="btn btn-sm btn-outline-danger" title="Cancelar" onClick={() => openCancelModal(cita)}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
        {actions.includes('reprogramar') && (
          <button className="btn btn-sm btn-outline-warning" title="Reprogramar" onClick={() => openReprogramModal(cita)}>
            <i className="bi bi-calendar-plus"></i>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-calendar-check-fill me-2 text-primary"></i>Citas
        </h2>
        <Link to="/citas/nueva" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nueva Cita
        </Link>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="fechaDesde"><i className="bi bi-calendar-range me-1"></i>Fecha Desde</label>
            <input
              id="fechaDesde"
              type="date"
              className="form-control"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fechaHasta"><i className="bi bi-calendar-range me-1"></i>Fecha Hasta</label>
            <input
              id="fechaHasta"
              type="date"
              className="form-control"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="estado"><i className="bi bi-funnel me-1"></i>Estado</label>
            <select
              id="estado"
              className="form-select"
              name="estado"
              value={filtros.estado}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              {ESTADOS.filter(Boolean).map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="searchPaciente"><i className="bi bi-search me-1"></i>Paciente</label>
            <input
              id="searchPaciente"
              type="text"
              className="form-control"
              name="searchPaciente"
              placeholder="Buscar paciente..."
              value={filtros.searchPaciente}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group d-flex align-items-end">
            <button className="btn btn-outline-secondary" onClick={clearFilters} title="Limpiar filtros">
              <i className="bi bi-eraser"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {totalElements > 0
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} citas`
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
        ) : citas.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {filtros.searchPaciente || filtros.estado || filtros.fechaDesde
                ? 'No se encontraron citas con esos criterios'
                : 'No hay citas registradas'}
            </p>
            {(filtros.searchPaciente || filtros.estado || filtros.fechaDesde) ? (
              <button className="btn btn-outline-primary" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : (
              <Link to="/citas/nueva" className="btn btn-dental-primary">
                Crear primera cita
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Odontólogo</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id}>
                    <td>
                      <span className="fw-semibold">
                        {cita.paciente ? `${cita.paciente.nombres || ''} ${cita.paciente.apellidos || ''}`.trim() : '-'}
                      </span>
                    </td>
                    <td>{formatDate(cita.fecha)}</td>
                    <td>{formatHour(cita.horaInicio)}</td>
                    <td>{formatHour(cita.horaFin)}</td>
                    <td>
                      {cita.odontologo
                        ? `${cita.odontologo.nombre || cita.odontologo.nombres || ''} ${cita.odontologo.apellidos || ''}`.trim() || '-'
                        : '-'}
                    </td>
                    <td>{renderEstadoBadge(cita.estado)}</td>
                    <td>{renderActions(cita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && renderPagination()}
      </div>

      {viewCita && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalles de la Cita
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewCita(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>{viewCita.paciente ? `${viewCita.paciente.nombres || ''} ${viewCita.paciente.apellidos || ''}`.trim() : '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Odontólogo</small>
                    <strong>{viewCita.odontologo ? `${viewCita.odontologo.nombre || viewCita.odontologo.nombres || ''} ${viewCita.odontologo.apellidos || ''}`.trim() : '-'}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Fecha</small>
                    <strong>{formatDate(viewCita.fecha)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Hora Inicio</small>
                    <strong>{formatHour(viewCita.horaInicio)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Hora Fin</small>
                    <strong>{formatHour(viewCita.horaFin)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Estado</small>
                    <div>{renderEstadoBadge(viewCita.estado)}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Tipo Atención</small>
                    <strong>{viewCita.tipoAtencion || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Consultorio</small>
                    <strong>{viewCita.consultorio || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Motivo</small>
                    <strong>{viewCita.motivo || '-'}</strong>
                  </div>
                  {viewCita.observaciones && (
                    <div className="col-12">
                      <small className="text-muted d-block">Observaciones</small>
                      <strong>{viewCita.observaciones}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewCita(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelCita && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-x-circle-fill text-danger me-2"></i>Cancelar Cita
                </h5>
                <button type="button" className="btn-close" onClick={() => !cancelLoading && setCancelCita(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">¿Estás seguro de cancelar esta cita?</p>
                <div className="mb-3 p-3 bg-light rounded">
                  <small className="text-muted d-block">
                    Paciente: {cancelCita.paciente ? `${cancelCita.paciente.nombres || ''} ${cancelCita.paciente.apellidos || ''}`.trim() : '-'}
                  </small>
                  <small className="text-muted d-block">
                    Fecha: {formatDate(cancelCita.fecha)} {cancelCita.horaInicio} - {cancelCita.horaFin}
                  </small>
                </div>
                <label className="form-label">Motivo de cancelación <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  placeholder="Indique el motivo de la cancelación..."
                  disabled={cancelLoading}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCancelCita(null)}
                  disabled={cancelLoading}
                >
                  Volver
                </button>
                <button
                  className="btn btn-dental-danger d-inline-flex align-items-center gap-2"
                  onClick={handleCancelar}
                  disabled={cancelLoading || !cancelMotivo.trim()}
                >
                  {cancelLoading && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {cancelLoading ? 'Cancelando...' : 'Sí, Cancelar Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reprogramCita && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-plus-fill text-warning me-2"></i>Reprogramar Cita
                </h5>
                <button type="button" className="btn-close" onClick={() => !reprogramLoading && setReprogramCita(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-3 bg-light rounded">
                  <small className="text-muted d-block">
                    Paciente: {reprogramCita.paciente ? `${reprogramCita.paciente.nombres || ''} ${reprogramCita.paciente.apellidos || ''}`.trim() : '-'}
                  </small>
                  <small className="text-muted d-block">
                    Odontólogo: {reprogramCita.odontologo ? `${reprogramCita.odontologo.nombre || reprogramCita.odontologo.nombres || ''} ${reprogramCita.odontologo.apellidos || ''}`.trim() : '-'}
                  </small>
                </div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Nueva Fecha <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={reprogramData.nuevaFecha}
                      onChange={(e) => setReprogramData((prev) => ({ ...prev, nuevaFecha: e.target.value }))}
                      disabled={reprogramLoading}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Nueva Hora Inicio <span className="text-danger">*</span></label>
                    <input
                      type="time"
                      className="form-control"
                      value={reprogramData.nuevaHoraInicio}
                      onChange={(e) => setReprogramData((prev) => ({ ...prev, nuevaHoraInicio: e.target.value }))}
                      disabled={reprogramLoading}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Nueva Hora Fin <span className="text-danger">*</span></label>
                    <input
                      type="time"
                      className="form-control"
                      value={reprogramData.nuevaHoraFin}
                      onChange={(e) => setReprogramData((prev) => ({ ...prev, nuevaHoraFin: e.target.value }))}
                      disabled={reprogramLoading}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setReprogramCita(null)}
                  disabled={reprogramLoading}
                >
                  Volver
                </button>
                <button
                  className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                  onClick={handleReprogramar}
                  disabled={reprogramLoading}
                >
                  {reprogramLoading && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {reprogramLoading ? 'Reprogramando...' : 'Reprogramar Cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;
