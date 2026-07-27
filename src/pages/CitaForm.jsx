import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { citaService, pacienteService, usuarioService } from '../services/endpoints';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';

const TIPO_ATENCION_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'CONSULTA', label: 'Consulta General' },
  { value: 'LIMPIEEZA', label: 'Limpieza Dental' },
  { value: 'ENDODONCIA', label: 'Endodoncia' },
  { value: 'CIRUGIA', label: 'Cirugía Oral' },
  { value: 'ORTODONCIA', label: 'Ortodoncia' },
  { value: 'PERIODONCIA', label: 'Periodoncia' },
  { value: 'PROTESIS', label: 'Prótesis Dental' },
  { value: 'BLANQUEAMIENTO', label: 'Blanqueamiento' },
  { value: 'URGENCIA', label: 'Urgencia' },
  { value: 'OTRO', label: 'Otro' },
];

const initialForm = {
  pacienteId: '',
  odontologoId: '',
  fecha: null,
  horaInicio: '',
  horaFin: '',
  motivo: '',
  tipoAtencion: '',
  consultorio: '',
  observaciones: '',
};

const CitaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');

  const [odontologos, setOdontologos] = useState([]);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    const loadOdontologos = async () => {
      try {
        const response = await usuarioService.listar({ rol: 'ODONTOLOGA' });
        const data = response.data;
        const list = data.content || (Array.isArray(data) ? data : []);
        setOdontologos(list);
      } catch {
        toast.error('Error al cargar odontólogos');
      }
    };
    loadOdontologos();
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
    const fetchCita = async () => {
      setLoading(true);
      try {
        const response = await citaService.buscarPorId(id);
        const data = response.data;
        setForm({
          pacienteId: data.paciente?.id || '',
          odontologoId: data.odontologo?.id || '',
          fecha: data.fecha ? new Date(data.fecha + 'T00:00:00') : null,
          horaInicio: data.horaInicio || '',
          horaFin: data.horaFin || '',
          motivo: data.motivo || '',
          tipoAtencion: data.tipoAtencion || '',
          consultorio: data.consultorio || '',
          observaciones: data.observaciones || '',
        });
        if (data.paciente) {
          setSelectedPacienteName(`${data.paciente.nombres || ''} ${data.paciente.apellidos || ''}`.trim());
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar datos de la cita';
        toast.error(msg);
        navigate('/citas');
      } finally {
        setLoading(false);
      }
    };
    fetchCita();
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
    if (form.pacienteId && form.odontologoId && form.fecha) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [form.pacienteId, form.odontologoId, form.fecha]);

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const fechaStr = form.fecha.toISOString().split('T')[0];
      const response = await citaService.horariosDisponibles({
        pacienteId: form.pacienteId,
        odontologoId: form.odontologoId,
        fecha: fechaStr,
      });
      const data = response.data;
      setAvailableSlots(Array.isArray(data) ? data : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const selectPaciente = (paciente) => {
    setForm((prev) => ({ ...prev, pacienteId: paciente.id }));
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setSearchTerm('');
    setShowPacienteDropdown(false);
    if (errors.pacienteId) {
      setErrors((prev) => ({ ...prev, pacienteId: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSlotClick = (slot) => {
    setForm((prev) => ({
      ...prev,
      horaInicio: slot.horaInicio || slot.hora_inicio || '',
      horaFin: slot.horaFin || slot.hora_fin || '',
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pacienteId) newErrors.pacienteId = 'Debe seleccionar un paciente';
    if (!form.odontologoId) newErrors.odontologoId = 'Debe seleccionar un odontólogo';
    if (!form.fecha) {
      newErrors.fecha = 'Debe seleccionar una fecha';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (form.fecha < today) {
        newErrors.fecha = 'No se puede agendar citas en fechas pasadas';
      }
    }
    if (!form.horaInicio) {
      newErrors.horaInicio = 'Debe indicar la hora de inicio';
    }
    if (!form.horaFin) {
      newErrors.horaFin = 'Debe indicar la hora de fin';
    }
    if (form.horaInicio && form.horaFin && form.horaInicio >= form.horaFin) {
      newErrors.horaFin = 'La hora de fin debe ser mayor a la hora de inicio';
    }
    if (!form.motivo.trim()) newErrors.motivo = 'El motivo es obligatorio';
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
      const payload = {
        pacienteId: form.pacienteId,
        odontologoId: form.odontologoId,
        fecha: form.fecha.toISOString().split('T')[0],
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        motivo: form.motivo.trim(),
        tipoAtencion: form.tipoAtencion || undefined,
        consultorio: form.consultorio.trim() || undefined,
        observaciones: form.observaciones.trim() || undefined,
      };

      if (isEdit) {
        await citaService.actualizar(id, payload);
        toast.success('Cita actualizada exitosamente');
      } else {
        await citaService.crear(payload);
        toast.success('Cita creada exitosamente');
      }
      navigate('/citas');
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} cita`;
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
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-calendar-plus-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Cita' : 'Nueva Cita'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-person-fill me-2 text-primary"></i>
            Paciente y Odontólogo
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Paciente <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <input
                    type="text"
                    className={`form-control ${errors.pacienteId ? 'is-invalid' : ''}`}
                    placeholder="Buscar paciente por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (form.pacienteId) {
                        setForm((prev) => ({ ...prev, pacienteId: '' }));
                        setSelectedPacienteName('');
                      }
                    }}
                    onFocus={() => {
                      if (pacientes.length > 0) setShowPacienteDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowPacienteDropdown(false), 200);
                    }}
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
                <label className="form-label">Odontólogo <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.odontologoId ? 'is-invalid' : ''}`}
                  name="odontologoId"
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
                {errors.odontologoId && <div className="invalid-feedback">{errors.odontologoId}</div>}
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-clock-fill me-2 text-primary"></i>
            Fecha y Hora
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Fecha <span className="text-danger">*</span></label>
                <DatePicker
                  selected={form.fecha}
                  onChange={(date) => handleSelectChange('fecha', date)}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
                  placeholderText="Seleccionar fecha..."
                  disabled={saving}
                  autoComplete="off"
                />
                {errors.fecha && <div className="invalid-feedback">{errors.fecha}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Hora Inicio <span className="text-danger">*</span></label>
                <input
                  type="time"
                  className={`form-control ${errors.horaInicio ? 'is-invalid' : ''}`}
                  name="horaInicio"
                  value={form.horaInicio}
                  onChange={handleChange}
                  disabled={saving}
                />
                {errors.horaInicio && <div className="invalid-feedback">{errors.horaInicio}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Hora Fin <span className="text-danger">*</span></label>
                <input
                  type="time"
                  className={`form-control ${errors.horaFin ? 'is-invalid' : ''}`}
                  name="horaFin"
                  value={form.horaFin}
                  onChange={handleChange}
                  disabled={saving}
                />
                {errors.horaFin && <div className="invalid-feedback">{errors.horaFin}</div>}
              </div>
            </div>

            {form.pacienteId && form.odontologoId && form.fecha && (
              <div className="mt-3">
                <label className="form-label text-muted">
                  <i className="bi bi-clock-history me-1"></i>Horarios Disponibles
                  {slotsLoading && (
                    <span className="spinner-border spinner-border-sm ms-2" role="status"></span>
                  )}
                </label>
                {!slotsLoading && availableSlots.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {availableSlots.map((slot, idx) => {
                      const inicio = slot.horaInicio || slot.hora_inicio;
                      const fin = slot.horaFin || slot.hora_fin;
                      const isSelected = form.horaInicio === inicio && form.horaFin === fin;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`btn btn-sm ${isSelected ? 'btn-dental-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleSlotClick(slot)}
                        >
                          {inicio} - {fin}
                        </button>
                      );
                    })}
                  </div>
                ) : !slotsLoading ? (
                  <p className="text-muted small mb-0">No hay horarios disponibles para esta fecha</p>
                ) : null}
              </div>
            )}
          </div>

          <h5 className="form-title">
            <i className="bi bi-clipboard-pulse me-2 text-primary"></i>
            Detalles de la Cita
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Motivo <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.motivo ? 'is-invalid' : ''}`}
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Motivo de la consulta"
                  disabled={saving}
                />
                {errors.motivo && <div className="invalid-feedback">{errors.motivo}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Tipo de Atención</label>
                <select
                  className="form-select"
                  name="tipoAtencion"
                  value={form.tipoAtencion}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {TIPO_ATENCION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Consultorio</label>
                <input
                  type="text"
                  className="form-control"
                  name="consultorio"
                  value={form.consultorio}
                  onChange={handleChange}
                  placeholder="Número o nombre del consultorio"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notas u observaciones adicionales"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/citas')}
              disabled={saving}
            >
              <i className="bi bi-x-circle me-1"></i> Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
              disabled={saving}
            >
              {saving && (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              )}
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-calendar-plus'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Cita' : 'Crear Cita'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CitaForm;
