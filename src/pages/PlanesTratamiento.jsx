import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { planTratamientoService, pacienteService, diagnosticoService, tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADOS = ['BORRADOR', 'PENDIENTE_APROBACION', 'ACEPTADO', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];
const ESTADO_COLORS = {
  BORRADOR: { bg: '#F5F5F5', color: '#616161' },
  PENDIENTE_APROBACION: { bg: '#FFF3E0', color: '#E65100' },
  ACEPTADO: { bg: '#E8F5E9', color: '#2E7D32' },
  EN_PROGRESO: { bg: '#E3F2FD', color: '#1565C0' },
  COMPLETADO: { bg: '#E8F5E9', color: '#2E7D32' },
  CANCELADO: { bg: '#FFEBEE', color: '#C62828' },
};

const initialTratamientoItem = {
  tratamientoId: '',
  nombre: '',
  precio: '',
};

const PlanesTratamiento = () => {
  const navigate = useNavigate();

  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPaciente, setSearchPaciente] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pacientes, setPacientes] = useState([]);
  const [searchTermPaciente, setSearchTermPaciente] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');

  const [diagnosticos, setDiagnosticos] = useState([]);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState('');

  const [tratamientosDisponibles, setTratamientosDisponibles] = useState([]);
  const [selectedTratamientos, setSelectedTratamientos] = useState([]);
  const [searchTratamiento, setSearchTratamiento] = useState('');
  const [showTratamientoDropdown, setShowTratamientoDropdown] = useState(false);

  const [descuentoPlan, setDescuentoPlan] = useState('0');
  const [adelantoPlan, setAdelantoPlan] = useState('0');

  const [viewPlan, setViewPlan] = useState(null);
  const [aceptarPlanId, setAceptarPlanId] = useState(null);
  const [aceptarLoading, setAceptarLoading] = useState(false);

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchPaciente.trim()) params.search = searchPaciente.trim();
      const response = await planTratamientoService.listar(params);
      const data = response.data;
      setPlanes(Array.isArray(data) ? data : (data.content || []));
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar planes de tratamiento';
      toast.error(msg);
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }, [searchPaciente]);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  useEffect(() => {
    const loadDiagnosticos = async () => {
      try {
        const response = await diagnosticoService.listar();
        const data = response.data;
        setDiagnosticos(Array.isArray(data) ? data : (data.content || []));
      } catch {
        // ignore
      }
    };
    loadDiagnosticos();
  }, []);

  useEffect(() => {
    if (!searchTermPaciente.trim()) {
      setPacientes([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await pacienteService.buscar(searchTermPaciente.trim());
        const data = response.data;
        setPacientes(Array.isArray(data) ? data : (data.content || []));
        setShowPacienteDropdown(true);
      } catch {
        setPacientes([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTermPaciente]);

  useEffect(() => {
    if (!searchTratamiento.trim()) {
      setTratamientosDisponibles([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await tratamientoService.listar({ search: searchTratamiento.trim(), page: 0, size: 20 });
        const data = response.data;
        const list = data.content || (Array.isArray(data) ? data : []);
        setTratamientosDisponibles(list);
        setShowTratamientoDropdown(true);
      } catch {
        setTratamientosDisponibles([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTratamiento]);

  const selectPaciente = (paciente) => {
    setSearchTermPaciente('');
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setShowPacienteDropdown(false);
    setFormPacienteId(paciente.id);
  };

  const [formPacienteId, setFormPacienteId] = useState('');

  const totalTratamientos = selectedTratamientos.reduce((sum, t) => sum + (parseFloat(t.precio) || 0), 0);
  const descuentoNum = parseFloat(descuentoPlan) || 0;
  const adelantoNum = parseFloat(adelantoPlan) || 0;
  const saldo = Math.max(0, totalTratamientos - descuentoNum - adelantoNum);

  const addTratamiento = (trat) => {
    if (selectedTratamientos.find((t) => t.tratamientoId === trat.id)) {
      toast.warning('Este tratamiento ya está agregado');
      return;
    }
    setSelectedTratamientos((prev) => [
      ...prev,
      { tratamientoId: trat.id, nombre: trat.nombre, precio: trat.precioFinal || trat.precio || '0' },
    ]);
    setSearchTratamiento('');
    setShowTratamientoDropdown(false);
  };

  const removeTratamiento = (index) => {
    setSelectedTratamientos((prev) => prev.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setFormPacienteId('');
    setSelectedPacienteName('');
    setSearchTermPaciente('');
    setSelectedDiagnostico('');
    setSelectedTratamientos([]);
    setDescuentoPlan('0');
    setAdelantoPlan('0');
    setShowModal(true);
  };

  const handleCreatePlan = async () => {
    if (!formPacienteId) {
      toast.warning('Debe seleccionar un paciente');
      return;
    }
    if (selectedTratamientos.length === 0) {
      toast.warning('Debe agregar al menos un tratamiento');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        pacienteId: formPacienteId,
        diagnosticoId: selectedDiagnostico ? Number(selectedDiagnostico) : undefined,
        tratamientos: selectedTratamientos.map((t) => ({
          tratamientoId: t.tratamientoId,
          precioAplicado: parseFloat(t.precio) || 0,
        })),
        descuento: descuentoNum,
        adelanto: adelantoNum,
        total: totalTratamientos,
        saldo,
      };
      await planTratamientoService.crear(payload);
      toast.success('Plan de tratamiento creado exitosamente');
      setShowModal(false);
      fetchPlanes();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al crear plan de tratamiento';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAceptarPlan = async () => {
    if (!aceptarPlanId) return;
    setAceptarLoading(true);
    try {
      await planTratamientoService.aceptar(aceptarPlanId);
      toast.success('Plan aceptado por el paciente');
      setAceptarPlanId(null);
      fetchPlanes();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al aceptar plan';
      toast.error(msg);
    } finally {
      setAceptarLoading(false);
    }
  };

  const renderEstadoBadge = (estado) => {
    const c = ESTADO_COLORS[estado] || ESTADO_COLORS.BORRADOR;
    return (
      <span className="badge badge-status" style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}20` }}>
        {estado || 'BORRADOR'}
      </span>
    );
  };

  const formatCurrency = (value) => {
    if (value == null) return '$0';
    return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-clipboard2-pulse-fill me-2 text-primary"></i>Planes de Tratamiento
        </h2>
        <button
          className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-lg"></i> Nuevo Plan
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="searchPacientePlan"><i className="bi bi-search me-1"></i>Buscar por paciente</label>
            <input
              id="searchPacientePlan"
              type="text"
              className="form-control"
              placeholder="Nombre del paciente..."
              value={searchPaciente}
              onChange={(e) => setSearchPaciente(e.target.value)}
            />
          </div>
          <div className="filter-group d-flex align-items-end">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSearchPaciente('')}
              title="Limpiar búsqueda"
            >
              <i className="bi bi-eraser"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {planes.length > 0 ? `${planes.length} registro(s)` : 'Sin resultados'}
          </span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : planes.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-clipboard2-pulse" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {searchPaciente ? 'No se encontraron planes con ese paciente' : 'No hay planes de tratamiento registrados'}
            </p>
            {searchPaciente ? (
              <button className="btn btn-outline-primary" onClick={() => setSearchPaciente('')}>
                Limpiar búsqueda
              </button>
            ) : (
              <button className="btn btn-dental-primary" onClick={openCreateModal}>
                Crear primer plan
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Diagnóstico</th>
                  <th>Total</th>
                  <th>Descuento</th>
                  <th>Adelanto</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <span className="fw-semibold">
                        {plan.paciente ? `${plan.paciente.nombres || ''} ${plan.paciente.apellidos || ''}`.trim() : plan.pacienteNombre || '-'}
                      </span>
                    </td>
                    <td>{plan.diagnostico?.nombre || plan.diagnosticoNombre || '-'}</td>
                    <td className="fw-semibold">{formatCurrency(plan.total)}</td>
                    <td className="text-danger">{formatCurrency(plan.descuento || 0)}</td>
                    <td className="text-primary">{formatCurrency(plan.adelanto || 0)}</td>
                    <td className="fw-bold">{formatCurrency(plan.saldo)}</td>
                    <td>{renderEstadoBadge(plan.estado)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-info"
                          title="Ver detalle"
                          onClick={() => setViewPlan(plan)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {plan.estado !== 'ACEPTADO' && plan.estado !== 'COMPLETADO' && plan.estado !== 'CANCELADO' && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Aceptar Plan"
                            onClick={() => setAceptarPlanId(plan.id)}
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          title="Imprimir / PDF"
                          onClick={() => toast.info('Generación de PDF próximamente')}
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle-fill text-primary me-2"></i>Nuevo Plan de Tratamiento
                </h5>
                <button type="button" className="btn-close" onClick={() => !saving && setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Paciente <span className="text-danger">*</span></label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar paciente..."
                        value={searchTermPaciente}
                        onChange={(e) => {
                          setSearchTermPaciente(e.target.value);
                          if (formPacienteId) {
                            setFormPacienteId('');
                            setSelectedPacienteName('');
                          }
                        }}
                        onFocus={() => { if (pacientes.length > 0) setShowPacienteDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowPacienteDropdown(false), 200)}
                        disabled={saving}
                      />
                      {selectedPacienteName && !searchTermPaciente && (
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', zIndex: 1 }}>
                          <i className="bi bi-check-circle-fill text-success me-1"></i>
                          {selectedPacienteName}
                        </div>
                      )}
                      {showPacienteDropdown && pacientes.length > 0 && (
                        <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                          {pacientes.map((p) => (
                            <li
                              key={p.id}
                              className="list-group-item list-group-item-action cursor-pointer"
                              onMouseDown={() => selectPaciente(p)}
                            >
                              <strong>{p.nombres} {p.apellidos}</strong>
                              <small className="text-muted ms-2">DNI: {p.dni || '-'}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Diagnóstico</label>
                    <select
                      className="form-select"
                      value={selectedDiagnostico}
                      onChange={(e) => setSelectedDiagnostico(e.target.value ? Number(e.target.value) : '')}
                      disabled={saving}
                    >
                      <option value="">Seleccionar...</option>
                      {diagnosticos.map((diag) => (
                        <option key={diag.id} value={diag.id}>{diag.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Tratamientos <span className="text-danger">*</span></label>
                    <div className="position-relative mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar y agregar tratamientos..."
                        value={searchTratamiento}
                        onChange={(e) => {
                          setSearchTratamiento(e.target.value);
                        }}
                        onFocus={() => { if (tratamientosDisponibles.length > 0) setShowTratamientoDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowTratamientoDropdown(false), 200)}
                        disabled={saving}
                      />
                      {showTratamientoDropdown && tratamientosDisponibles.length > 0 && (
                        <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                          {tratamientosDisponibles.map((trat) => (
                            <li
                              key={trat.id}
                              className="list-group-item list-group-item-action cursor-pointer d-flex justify-content-between align-items-center"
                              onMouseDown={() => addTratamiento(trat)}
                            >
                              <span>{trat.nombre || `#${trat.id}`}</span>
                              <small className="text-muted">{formatCurrency(trat.precioFinal || trat.precio)}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedTratamientos.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Tratamiento</th>
                              <th className="text-end">Precio</th>
                              <th className="text-center" style={{ width: 50 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTratamientos.map((t, idx) => (
                              <tr key={idx}>
                                <td>{t.nombre || `#${t.tratamientoId}`}</td>
                                <td className="text-end">{formatCurrency(t.precio)}</td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger py-0 px-1"
                                    onClick={() => removeTratamiento(idx)}
                                    disabled={saving}
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="fw-bold">
                              <td>Total</td>
                              <td className="text-end">{formatCurrency(totalTratamientos)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Descuento</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={descuentoPlan}
                        onChange={(e) => setDescuentoPlan(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Adelanto</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={adelantoPlan}
                        onChange={(e) => setAdelantoPlan(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Saldo</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="text"
                        className="form-control"
                        value={formatCurrency(saldo)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', fontWeight: 700, color: saldo > 0 ? '#E65100' : '#2E7D32' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                  onClick={handleCreatePlan}
                  disabled={saving}
                >
                  {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {saving ? 'Creando...' : 'Crear Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewPlan && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalle del Plan
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewPlan(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>
                      {viewPlan.paciente ? `${viewPlan.paciente.nombres || ''} ${viewPlan.paciente.apellidos || ''}`.trim() : '-'}
                    </strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Estado</small>
                    <div>{renderEstadoBadge(viewPlan.estado)}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Total</small>
                    <strong>{formatCurrency(viewPlan.total)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Descuento</small>
                    <strong className="text-danger">{formatCurrency(viewPlan.descuento || 0)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Adelanto</small>
                    <strong className="text-primary">{formatCurrency(viewPlan.adelanto || 0)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Saldo</small>
                    <strong>{formatCurrency(viewPlan.saldo)}</strong>
                  </div>
                  {viewPlan.tratamientos && viewPlan.tratamientos.length > 0 && (
                    <div className="col-12">
                      <small className="text-muted d-block">Tratamientos incluidos</small>
                      <ul className="list-group list-group-flush mt-1">
                        {viewPlan.tratamientos.map((t, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-1 px-2">
                            <span>{t.nombre || t.tratamientoNombre || `#${t.tratamientoId}`}</span>
                            <span className="fw-semibold">{formatCurrency(t.precioAplicado)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewPlan(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aceptarPlanId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>Aceptar Plan de Tratamiento
                </h5>
                <button type="button" className="btn-close" onClick={() => !aceptarLoading && setAceptarPlanId(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">¿Estás seguro de aceptar este plan de tratamiento? El paciente ha dado su conformidad.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setAceptarPlanId(null)}
                  disabled={aceptarLoading}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-dental-success d-inline-flex align-items-center gap-2"
                  onClick={handleAceptarPlan}
                  disabled={aceptarLoading}
                >
                  {aceptarLoading && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {aceptarLoading ? 'Aceptando...' : 'Sí, Aceptar Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanesTratamiento;
