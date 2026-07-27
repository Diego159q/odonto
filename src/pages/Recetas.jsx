import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recetaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const ESTADOS = ['BORRADOR', 'APROBADA', 'ENTREGADA', 'ANULADA'];

const ESTADO_COLORS = {
  BORRADOR: { bg: '#FFF3E0', color: '#E65100' },
  APROBADA: { bg: '#E8F5E9', color: '#2E7D32' },
  ENTREGADA: { bg: '#E3F2FD', color: '#1565C0' },
  ANULADA: { bg: '#FFEBEE', color: '#C62828' },
};

const Recetas = () => {
  const navigate = useNavigate();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filtroPaciente, setFiltroPaciente] = useState('');

  const [viewReceta, setViewReceta] = useState(null);

  const fetchRecetas = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filtroPaciente.trim()) params.search = filtroPaciente.trim();
      const response = await recetaService.listar(params);
      const data = response.data;
      if (data.content) {
        setRecetas(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setRecetas(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setRecetas([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar recetas';
      toast.error(msg);
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtroPaciente]);

  useEffect(() => {
    fetchRecetas();
  }, [fetchRecetas]);

  useEffect(() => {
    setPage(0);
  }, [filtroPaciente]);

  const renderEstadoBadge = (estado) => {
    const c = ESTADO_COLORS[estado] || ESTADO_COLORS.BORRADOR;
    return (
      <span className="badge badge-status" style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}20` }}>
        {estado || 'BORRADOR'}
      </span>
    );
  };

  const handleAprobar = async (id) => {
    try {
      await recetaService.aprobar(id);
      toast.success('Receta aprobada exitosamente');
      fetchRecetas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al aprobar receta');
    }
  };

  const handleDescargarPDF = async (id) => {
    try {
      const response = await recetaService.descargarPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receta-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al descargar PDF');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
              <li className="page-item"><button className="page-link" onClick={() => setPage(0)}>1</button></li>
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
              <li className="page-item"><button className="page-link" onClick={() => setPage(totalPages - 1)}>{totalPages}</button></li>
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
          <i className="bi bi-prescription2 me-2 text-primary"></i>Recetas
        </h2>
        <Link to="/recetas/nueva" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nueva Receta
        </Link>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="filtroPaciente"><i className="bi bi-search me-1"></i>Paciente</label>
            <input
              id="filtroPaciente"
              type="text"
              className="form-control"
              placeholder="Buscar paciente..."
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
            />
          </div>
          <div className="filter-group d-flex align-items-end">
            <button className="btn btn-outline-secondary" onClick={() => setFiltroPaciente('')} title="Limpiar filtros">
              <i className="bi bi-eraser"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {totalElements > 0
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} recetas`
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
        ) : recetas.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-prescription2" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {filtroPaciente ? 'No se encontraron recetas con ese criterio' : 'No hay recetas registradas'}
            </p>
            {filtroPaciente ? (
              <button className="btn btn-outline-primary" onClick={() => setFiltroPaciente('')}>Limpiar filtros</button>
            ) : (
              <Link to="/recetas/nueva" className="btn btn-dental-primary">Crear primera receta</Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>N° Receta</th>
                  <th>Paciente</th>
                  <th>Odontólogo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recetas.map((receta) => (
                  <tr key={receta.id}>
                    <td><span className="fw-semibold">{receta.numeroReceta || receta.id || '-'}</span></td>
                    <td>
                      {receta.paciente
                        ? `${receta.paciente.nombres || ''} ${receta.paciente.apellidos || ''}`.trim()
                        : receta.pacienteNombre || '-'}
                    </td>
                    <td>
                      {receta.odontologo
                        ? `${receta.odontologo.nombre || receta.odontologo.nombres || ''} ${receta.odontologo.apellidos || ''}`.trim()
                        : receta.odontologoNombre || '-'}
                    </td>
                    <td>{formatDate(receta.fecha)}</td>
                    <td>{renderEstadoBadge(receta.estado)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-nowrap">
                        <button className="btn btn-sm btn-outline-info" title="Ver detalles" onClick={() => setViewReceta(receta)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-success" title="Editar" onClick={() => navigate(`/recetas/${receta.id}/editar`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        {receta.estado === 'BORRADOR' && (
                          <button className="btn btn-sm btn-outline-primary" title="Aprobar" onClick={() => handleAprobar(receta.id)}>
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline-secondary" title="Descargar PDF" onClick={() => handleDescargarPDF(receta.id)}>
                          <i className="bi bi-filetype-pdf"></i>
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

      {viewReceta && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalles de la Receta
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewReceta(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">N° Receta</small>
                    <strong>{viewReceta.numeroReceta || viewReceta.id || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Fecha</small>
                    <strong>{formatDate(viewReceta.fecha)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>
                      {viewReceta.paciente
                        ? `${viewReceta.paciente.nombres || ''} ${viewReceta.paciente.apellidos || ''}`.trim()
                        : viewReceta.pacienteNombre || '-'}
                    </strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Odontólogo</small>
                    <strong>
                      {viewReceta.odontologo
                        ? `${viewReceta.odontologo.nombre || viewReceta.odontologo.nombres || ''} ${viewReceta.odontologo.apellidos || ''}`.trim()
                        : viewReceta.odontologoNombre || '-'}
                    </strong>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">Estado</small>
                    <div>{renderEstadoBadge(viewReceta.estado)}</div>
                  </div>
                  {viewReceta.diagnostico && (
                    <div className="col-12">
                      <small className="text-muted d-block">Diagnóstico</small>
                      <strong>{viewReceta.diagnostico}</strong>
                    </div>
                  )}
                  {viewReceta.indicaciones && (
                    <div className="col-12">
                      <small className="text-muted d-block">Indicaciones</small>
                      <strong>{viewReceta.indicaciones}</strong>
                    </div>
                  )}
                  {viewReceta.medicamentos && viewReceta.medicamentos.length > 0 && (
                    <div className="col-12">
                      <small className="text-muted d-block">Medicamentos Recetados</small>
                      <div className="table-responsive mt-1">
                        <table className="table table-sm table-bordered mb-0">
                          <thead>
                            <tr>
                              <th>Medicamento</th>
                              <th>Dosis</th>
                              <th>Frecuencia</th>
                              <th>Duración</th>
                              <th>Indicaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewReceta.medicamentos.map((med, idx) => (
                              <tr key={idx}>
                                <td>{med.medicamento?.nombre || med.nombreMedicamento || '-'}</td>
                                <td>{med.dosis || '-'}</td>
                                <td>{med.frecuencia || '-'}</td>
                                <td>{med.duracion || '-'}</td>
                                <td>{med.indicaciones || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewReceta(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recetas;
