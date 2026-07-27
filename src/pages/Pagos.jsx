import React, { useState, useEffect, useCallback } from 'react';
import { pagoService, pacienteService, tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;

const METODOS_PAGO = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];

const initialForm = {
  pacienteId: '',
  tratamientoId: '',
  montoTotal: '',
  montoPagado: '',
  metodoPago: 'EFECTIVO',
  numeroOperacion: '',
  observaciones: '',
};

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filtros, setFiltros] = useState({
    paciente: '',
    fechaDesde: '',
    fechaHasta: '',
    metodoPago: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');

  const [showTratamientoDropdown, setShowTratamientoDropdown] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);

  const [viewPago, setViewPago] = useState(null);

  const [summary, setSummary] = useState({
    totalIngresos: 0,
    ingresosDia: 0,
    ingresosMes: 0,
    deudasPendientes: 0,
  });
  const [deudas, setDeudas] = useState([]);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filtros.paciente.trim()) params.paciente = filtros.paciente.trim();
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.metodoPago) params.metodoPago = filtros.metodoPago;
      const response = await pagoService.listar(params);
      const data = response.data;
      if (data.content) {
        setPagos(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setPagos(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setPagos([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar pagos';
      toast.error(msg);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtros]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  useEffect(() => {
    setPage(0);
  }, [filtros]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [ingresosDiaRes, deudasRes] = await Promise.allSettled([
          pagoService.ingresosDia(),
          pagoService.deudasPendientes(),
        ]);
        if (ingresosDiaRes.status === 'fulfilled') {
          const d = ingresosDiaRes.value.data;
          setSummary((prev) => ({
            ...prev,
            ingresosDia: d.ingresosDia || d.total || 0,
            ingresosMes: d.ingresosMes || 0,
            totalIngresos: d.totalIngresos || 0,
          }));
        }
        if (deudasRes.status === 'fulfilled') {
          const d = deudasRes.value.data;
          const list = Array.isArray(d) ? d : (d.content || []);
          setDeudas(list);
          const totalDeudas = list.reduce((acc, item) => acc + (item.saldo || item.deuda || 0), 0);
          setSummary((prev) => ({ ...prev, deudasPendientes: totalDeudas }));
        }
      } catch {
      }
    };
    loadSummary();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setPacientes([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await pacienteService.buscar(searchTerm.trim());
        const data = response.data;
        setPacientes(Array.isArray(data) ? data : (data.content || []));
        setShowPacienteDropdown(true);
      } catch {
        setPacientes([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!showModal || !form.pacienteId) {
      setTratamientos([]);
      return;
    }
    const loadTratamientos = async () => {
      try {
        const response = await tratamientoService.listar({ pacienteId: form.pacienteId });
        const data = response.data;
        setTratamientos(Array.isArray(data) ? data : (data.content || []));
      } catch {
        setTratamientos([]);
      }
    };
    loadTratamientos();
  }, [showModal, form.pacienteId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFiltros({ paciente: '', fechaDesde: '', fechaHasta: '', metodoPago: '' });
  };

  const selectPaciente = (paciente) => {
    setForm((prev) => ({ ...prev, pacienteId: paciente.id }));
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setSearchTerm('');
    setShowPacienteDropdown(false);
    if (errors.pacienteId) setErrors((prev) => ({ ...prev, pacienteId: '' }));
  };

  const handleSelectTratamiento = (trat) => {
    setForm((prev) => ({
      ...prev,
      tratamientoId: trat.id,
      montoTotal: trat.costoTotal || trat.monto || 0,
    }));
    setSelectedTratamiento(`${trat.codigo || trat.nombre || ''} - S/${(trat.costoTotal || trat.monto || 0).toFixed(2)}`);
    setShowTratamientoDropdown(false);
    if (errors.tratamientoId) setErrors((prev) => ({ ...prev, tratamientoId: '' }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const saldoCalculado = () => {
    const total = parseFloat(form.montoTotal) || 0;
    const pagado = parseFloat(form.montoPagado) || 0;
    return Math.max(0, total - pagado);
  };

  const openModal = () => {
    setForm(initialForm);
    setErrors({});
    setSearchTerm('');
    setSelectedPacienteName('');
    setSelectedTratamiento(null);
    setShowModal(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pacienteId) newErrors.pacienteId = 'Debe seleccionar un paciente';
    if (!form.tratamientoId) newErrors.tratamientoId = 'Debe seleccionar un tratamiento';
    if (!form.montoTotal || parseFloat(form.montoTotal) <= 0) newErrors.montoTotal = 'Monto total inválido';
    if (form.montoPagado === '' || parseFloat(form.montoPagado) < 0) newErrors.montoPagado = 'Monto pagado inválido';
    if (parseFloat(form.montoPagado) > parseFloat(form.montoTotal)) newErrors.montoPagado = 'No puede pagar más que el total';
    if (!form.metodoPago) newErrors.metodoPago = 'Debe seleccionar un método de pago';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrige los errores del formulario');
      return;
    }
    setSaving(true);
    try {
      await pagoService.crear({
        pacienteId: form.pacienteId,
        tratamientoId: form.tratamientoId,
        montoTotal: parseFloat(form.montoTotal),
        montoPagado: parseFloat(form.montoPagado),
        metodoPago: form.metodoPago,
        numeroOperacion: form.numeroOperacion.trim() || undefined,
        observaciones: form.observaciones.trim() || undefined,
      });
      toast.success('Pago registrado exitosamente');
      setShowModal(false);
      fetchPagos();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrar pago';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'S/ 0.00';
    return `S/ ${Number(val).toFixed(2)}`;
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
          <i className="bi bi-credit-card-2-front-fill me-2 text-primary"></i>Pagos
        </h2>
        <button className="btn btn-dental-primary d-inline-flex align-items-center gap-2" onClick={openModal}>
          <i className="bi bi-plus-lg"></i> Nuevo Pago
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold">Total Ingresos</small>
                  <h4 className="mb-0 text-success">{formatCurrency(summary.totalIngresos)}</h4>
                </div>
                <i className="bi bi-wallet2 fs-1 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold">Ingresos del Día</small>
                  <h4 className="mb-0 text-primary">{formatCurrency(summary.ingresosDia)}</h4>
                </div>
                <i className="bi bi-calendar-day fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold">Ingresos del Mes</small>
                  <h4 className="mb-0 text-info">{formatCurrency(summary.ingresosMes)}</h4>
                </div>
                <i className="bi bi-calendar-month fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted text-uppercase fw-semibold">Deudas Pendientes</small>
                  <h4 className="mb-0 text-danger">{formatCurrency(summary.deudasPendientes)}</h4>
                </div>
                <i className="bi bi-exclamation-triangle fs-1 text-danger opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deudas.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle-fill text-danger"></i>
            <strong>Deudas Pendientes</strong>
            <span className="badge bg-danger ms-auto">{deudas.length} paciente(s)</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-modern mb-0">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Tratamiento</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {deudas.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="fw-semibold">
                        {item.paciente
                          ? `${item.paciente.nombres || ''} ${item.paciente.apellidos || ''}`.trim()
                          : item.pacienteNombre || '-'}
                      </td>
                      <td>{item.tratamiento?.nombre || item.tratamientoNombre || '-'}</td>
                      <td>{formatCurrency(item.montoTotal || item.total)}</td>
                      <td>{formatCurrency(item.montoPagado || item.pagado)}</td>
                      <td className="text-danger fw-bold">{formatCurrency(item.saldo || item.deuda || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="paciente"><i className="bi bi-search me-1"></i>Paciente</label>
            <input
              id="paciente"
              type="text"
              className="form-control"
              name="paciente"
              placeholder="Buscar paciente..."
              value={filtros.paciente}
              onChange={handleFilterChange}
            />
          </div>
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
            <label htmlFor="metodoPago"><i className="bi bi-funnel me-1"></i>Método de Pago</label>
            <select
              id="metodoPago"
              className="form-select"
              name="metodoPago"
              value={filtros.metodoPago}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
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
              ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements} pagos`
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
        ) : pagos.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-credit-card-2-front" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {filtros.paciente || filtros.fechaDesde || filtros.metodoPago
                ? 'No se encontraron pagos con esos criterios'
                : 'No hay pagos registrados'}
            </p>
            {(filtros.paciente || filtros.fechaDesde || filtros.metodoPago) ? (
              <button className="btn btn-outline-primary" onClick={clearFilters}>Limpiar filtros</button>
            ) : (
              <button className="btn btn-dental-primary" onClick={openModal}>Registrar primer pago</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>N° Pago</th>
                  <th>Paciente</th>
                  <th>Tratamiento</th>
                  <th>Monto Total</th>
                  <th>Monto Pagado</th>
                  <th>Saldo</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td><span className="fw-semibold">{pago.numeroPago || pago.id || '-'}</span></td>
                    <td>
                      {pago.paciente
                        ? `${pago.paciente.nombres || ''} ${pago.paciente.apellidos || ''}`.trim()
                        : pago.pacienteNombre || '-'}
                    </td>
                    <td>{pago.tratamiento?.nombre || pago.tratamientoNombre || '-'}</td>
                    <td>{formatCurrency(pago.montoTotal)}</td>
                    <td>{formatCurrency(pago.montoPagado)}</td>
                    <td className={pago.saldo > 0 ? 'text-danger fw-bold' : 'text-success'}>
                      {formatCurrency(pago.saldo)}
                    </td>
                    <td>{formatDate(pago.fecha)}</td>
                    <td>
                      <span className="badge badge-status" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
                        {pago.metodoPago || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-nowrap">
                        <button className="btn btn-sm btn-outline-info" title="Ver detalle" onClick={() => setViewPago(pago)}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          title="Descargar comprobante"
                          onClick={async () => {
                            try {
                              const res = await pagoService.buscarPorId(pago.id);
                              const blob = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `comprobante-${pago.numeroPago || pago.id}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                              toast.success('Comprobante descargado');
                            } catch {
                              toast.error('Error al descargar comprobante');
                            }
                          }}
                        >
                          <i className="bi bi-download"></i>
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

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle-fill text-primary me-2"></i>Nuevo Pago
                </h5>
                <button type="button" className="btn-close" onClick={() => !saving && setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Paciente <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.pacienteId ? 'is-invalid' : ''}`}
                          placeholder="Buscar paciente..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (form.pacienteId) {
                              setForm((prev) => ({ ...prev, pacienteId: '', tratamientoId: '' }));
                              setSelectedPacienteName('');
                              setSelectedTratamiento(null);
                            }
                          }}
                          onFocus={() => { if (pacientes.length > 0) setShowPacienteDropdown(true); }}
                          onBlur={() => setTimeout(() => setShowPacienteDropdown(false), 200)}
                          disabled={saving}
                        />
                        {selectedPacienteName && !searchTerm && (
                          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', zIndex: 1 }}>
                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                            {selectedPacienteName}
                          </div>
                        )}
                        {errors.pacienteId && <div className="invalid-feedback">{errors.pacienteId}</div>}
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
                      <label className="form-label">Tratamiento <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.tratamientoId ? 'is-invalid' : ''}`}
                          placeholder={form.pacienteId ? 'Seleccionar tratamiento...' : 'Primero seleccione un paciente'}
                          value={selectedTratamiento || ''}
                          onFocus={() => {
                            if (tratamientos.length > 0) setShowTratamientoDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => setShowTratamientoDropdown(false), 200)}
                          disabled={saving || !form.pacienteId}
                          readOnly
                        />
                        {errors.tratamientoId && <div className="invalid-feedback">{errors.tratamientoId}</div>}
                        {showTratamientoDropdown && tratamientos.length > 0 && (
                          <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                            {tratamientos.map((t) => (
                              <li
                                key={t.id}
                                className="list-group-item list-group-item-action cursor-pointer"
                                onMouseDown={() => handleSelectTratamiento(t)}
                              >
                                <strong>{t.nombre || t.codigo}</strong>
                                <small className="text-muted ms-2">S/ {(t.costoTotal || t.monto || 0).toFixed(2)}</small>
                              </li>
                            ))}
                          </ul>
                        )}
                        {form.pacienteId && tratamientos.length === 0 && (
                          <small className="text-muted">No hay tratamientos para este paciente</small>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Monto Total <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`form-control ${errors.montoTotal ? 'is-invalid' : ''}`}
                          name="montoTotal"
                          value={form.montoTotal}
                          onChange={handleFormChange}
                          disabled={saving}
                        />
                        {errors.montoTotal && <div className="invalid-feedback">{errors.montoTotal}</div>}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Monto Pagado <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">S/</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`form-control ${errors.montoPagado ? 'is-invalid' : ''}`}
                          name="montoPagado"
                          value={form.montoPagado}
                          onChange={handleFormChange}
                          disabled={saving}
                        />
                        {errors.montoPagado && <div className="invalid-feedback">{errors.montoPagado}</div>}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Saldo</label>
                      <div className="input-group">
                        <span className="input-group-text">S/</span>
                        <input
                          type="text"
                          className="form-control"
                          value={saldoCalculado().toFixed(2)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Método de Pago <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.metodoPago ? 'is-invalid' : ''}`}
                        name="metodoPago"
                        value={form.metodoPago}
                        onChange={handleFormChange}
                        disabled={saving}
                      >
                        {METODOS_PAGO.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {errors.metodoPago && <div className="invalid-feedback">{errors.metodoPago}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">N° Operación</label>
                      <input
                        type="text"
                        className="form-control"
                        name="numeroOperacion"
                        value={form.numeroOperacion}
                        onChange={handleFormChange}
                        placeholder="Número de operación (opcional)"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Observaciones</label>
                      <textarea
                        className="form-control"
                        name="observaciones"
                        value={form.observaciones}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Observaciones (opcional)"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-dental-primary d-inline-flex align-items-center gap-2" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    {saving ? 'Guardando...' : 'Registrar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewPago && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalle del Pago
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewPago(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">N° Pago</small>
                    <strong>{viewPago.numeroPago || viewPago.id || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Fecha</small>
                    <strong>{formatDate(viewPago.fecha)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>
                      {viewPago.paciente
                        ? `${viewPago.paciente.nombres || ''} ${viewPago.paciente.apellidos || ''}`.trim()
                        : viewPago.pacienteNombre || '-'}
                    </strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Tratamiento</small>
                    <strong>{viewPago.tratamiento?.nombre || viewPago.tratamientoNombre || '-'}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Monto Total</small>
                    <strong>{formatCurrency(viewPago.montoTotal)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Monto Pagado</small>
                    <strong className="text-success">{formatCurrency(viewPago.montoPagado)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Saldo</small>
                    <strong className={viewPago.saldo > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(viewPago.saldo)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Método de Pago</small>
                    <strong>{viewPago.metodoPago || '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">N° Operación</small>
                    <strong>{viewPago.numeroOperacion || '-'}</strong>
                  </div>
                  {viewPago.observaciones && (
                    <div className="col-12">
                      <small className="text-muted d-block">Observaciones</small>
                      <strong>{viewPago.observaciones}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewPago(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
