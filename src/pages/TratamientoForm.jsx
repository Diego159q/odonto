import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { tratamientoService, pacienteService, diagnosticoService, usuarioService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADOS = ['PLANIFICADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'PENDIENTE_PAGO'];

const initialForm = {
  pacienteId: '',
  diagnosticoId: '',
  odontologoId: '',
  nombre: '',
  piezaDental: '',
  descripcion: '',
  numeroSesiones: '',
  precio: '',
  descuento: '0',
  precioFinal: '0',
  fechaInicio: '',
  fechaFinEstimada: '',
  estado: 'PLANIFICADO',
  observaciones: '',
};

const TratamientoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [odontologos, setOdontologos] = useState([]);

  useEffect(() => {
    const loadSelects = async () => {
      try {
        const [diagRes, odoRes] = await Promise.all([
          diagnosticoService.listar(),
          usuarioService.listar({ rol: 'ODONTOLOGA' }),
        ]);
        const diagData = diagRes.data;
        setDiagnosticos(Array.isArray(diagData) ? diagData : diagData.content || []);
        const odoData = odoRes.data;
        setOdontologos(Array.isArray(odoData) ? odoData : odoData.content || []);
      } catch {
        toast.error('Error al cargar datos del formulario');
      }
    };
    loadSelects();
  }, []);

  useEffect(() => {
    const pacienteIdParam = searchParams.get('pacienteId');
    if (pacienteIdParam) {
      setForm((prev) => ({ ...prev, pacienteId: Number(pacienteIdParam) }));
      pacienteService.buscarPorId(pacienteIdParam).then((res) => {
        const p = res.data;
        setSelectedPacienteName(`${p.nombres || ''} ${p.apellidos || ''}`.trim());
      }).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchTratamiento = async () => {
      setLoading(true);
      try {
        const response = await tratamientoService.buscarPorId(id);
        const data = response.data;
        setForm({
          pacienteId: data.paciente?.id || '',
          diagnosticoId: data.diagnostico?.id || '',
          odontologoId: data.odontologo?.id || '',
          nombre: data.nombre || '',
          piezaDental: data.piezaDental || '',
          descripcion: data.descripcion || '',
          numeroSesiones: data.numeroSesiones || '',
          precio: data.precio || '',
          descuento: data.descuento || '0',
          precioFinal: data.precioFinal || data.precio || '0',
          fechaInicio: data.fechaInicio ? (data.fechaInicio.includes('T') ? data.fechaInicio.split('T')[0] : data.fechaInicio) : '',
          fechaFinEstimada: data.fechaFinEstimada ? (data.fechaFinEstimada.includes('T') ? data.fechaFinEstimada.split('T')[0] : data.fechaFinEstimada) : '',
          estado: data.estado || 'PLANIFICADO',
          observaciones: data.observaciones || '',
        });
        if (data.paciente) {
          setSelectedPacienteName(`${data.paciente.nombres || ''} ${data.paciente.apellidos || ''}`.trim());
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar tratamiento';
        toast.error(msg);
        navigate('/tratamientos');
      } finally {
        setLoading(false);
      }
    };
    fetchTratamiento();
  }, [id, isEdit, navigate]);

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
    const precio = parseFloat(form.precio) || 0;
    const descuento = parseFloat(form.descuento) || 0;
    const precioFinal = Math.max(0, precio - descuento);
    setForm((prev) => ({ ...prev, precioFinal: precioFinal.toString() }));
  }, [form.precio, form.descuento]);

  const selectPaciente = (paciente) => {
    setForm((prev) => ({ ...prev, pacienteId: paciente.id }));
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setSearchTerm('');
    setShowPacienteDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pacienteId) {
      toast.warning('Debe seleccionar un paciente');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        pacienteId: form.pacienteId,
        diagnosticoId: form.diagnosticoId ? Number(form.diagnosticoId) : undefined,
        odontologoId: form.odontologoId ? Number(form.odontologoId) : undefined,
        nombre: form.nombre.trim(),
        piezaDental: form.piezaDental.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        numeroSesiones: form.numeroSesiones ? Number(form.numeroSesiones) : undefined,
        precio: form.precio ? Number(form.precio) : undefined,
        descuento: form.descuento ? Number(form.descuento) : 0,
        precioFinal: Number(form.precioFinal),
        fechaInicio: form.fechaInicio || undefined,
        fechaFinEstimada: form.fechaFinEstimada || undefined,
        estado: form.estado,
        observaciones: form.observaciones.trim() || undefined,
      };

      if (isEdit) {
        await tratamientoService.actualizar(id, payload);
        toast.success('Tratamiento actualizado exitosamente');
      } else {
        await tratamientoService.crear(payload);
        toast.success('Tratamiento creado exitosamente');
      }
      navigate('/tratamientos');
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} tratamiento`;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="loading-container">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-person-fill me-2 text-primary"></i>
            Paciente y Diagnóstico
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Paciente <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar paciente por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (form.pacienteId) {
                        setForm((prev) => ({ ...prev, pacienteId: '' }));
                        setSelectedPacienteName('');
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
                  value={form.diagnosticoId}
                  onChange={(e) => handleSelectChange('diagnosticoId', e.target.value ? Number(e.target.value) : '')}
                  disabled={saving}
                >
                  <option value="">Seleccionar diagnóstico...</option>
                  {diagnosticos.map((diag) => (
                    <option key={diag.id} value={diag.id}>{diag.nombre || `#${diag.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Odontólogo</label>
                <select
                  className="form-select"
                  value={form.odontologoId}
                  onChange={(e) => handleSelectChange('odontologoId', e.target.value ? Number(e.target.value) : '')}
                  disabled={saving}
                >
                  <option value="">Seleccionar odontólogo...</option>
                  {odontologos.map((odo) => (
                    <option key={odo.id} value={odo.id}>
                      {odo.nombre || odo.nombres || ''} {odo.apellidos || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-heart-pulse me-2 text-primary"></i>
            Datos del Tratamiento
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre del Tratamiento <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Limpieza dental, Endodoncia..."
                  disabled={saving}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Pieza Dental</label>
                <input
                  type="text"
                  className="form-control"
                  name="piezaDental"
                  value={form.piezaDental}
                  onChange={handleChange}
                  placeholder="Ej: 1.6, 2.4..."
                  disabled={saving}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">N° Sesiones</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  name="numeroSesiones"
                  value={form.numeroSesiones}
                  onChange={handleChange}
                  placeholder="Número de sesiones"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción del tratamiento"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-currency-dollar me-2 text-primary"></i>
            Información de Costos
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Precio Base <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="precio"
                    value={form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={saving}
                    required
                  />
                </div>
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
                    name="descuento"
                    value={form.descuento}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Precio Final</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="precioFinal"
                    value={form.precioFinal}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', fontWeight: 700, color: '#2E7D32' }}
                  />
                </div>
                <small className="text-muted">Calculado automáticamente (Precio - Descuento)</small>
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Fechas y Estado
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Fecha de Inicio</label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaInicio"
                  value={form.fechaInicio}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Fecha Fin Estimada</label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaFinEstimada"
                  value={form.fechaFinEstimada}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {ESTADOS.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observaciones adicionales"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tratamientos')}
              disabled={saving}
            >
              <i className="bi bi-x-circle me-1"></i> Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
              disabled={saving}
            >
              {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Tratamiento' : 'Crear Tratamiento'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TratamientoForm;
