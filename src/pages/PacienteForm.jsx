import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/endpoints';
import { toast } from 'react-toastify';

const initialForm = {
  nombres: '',
  apellidos: '',
  dni: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  email: '',
  direccion: '',
  distrito: '',
  ciudad: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
  estadoCivil: '',
  ocupacion: '',
  tipoSangre: '',
  alergias: '',
  enfermedadesPrevias: '',
  medicamentosActuales: '',
  observaciones: '',
};

const requiredFields = [
  { key: 'nombres', label: 'Nombres' },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'dni', label: 'DNI' },
  { key: 'telefono', label: 'Teléfono' },
];

const sexoOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
];

const estadoCivilOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
  { value: 'CONVIVIENTE', label: 'Conviviente' },
];

const tipoSangreOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const PacienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    const fetchPaciente = async () => {
      setLoading(true);
      try {
        const response = await pacienteService.buscarPorId(id);
        const data = response.data;
        setForm({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          dni: data.dni || '',
          fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
          sexo: data.sexo || '',
          telefono: data.telefono || '',
          email: data.email || '',
          direccion: data.direccion || '',
          distrito: data.distrito || '',
          ciudad: data.ciudad || '',
          contactoEmergencia: data.contactoEmergencia || '',
          telefonoEmergencia: data.telefonoEmergencia || '',
          estadoCivil: data.estadoCivil || '',
          ocupacion: data.ocupacion || '',
          tipoSangre: data.tipoSangre || '',
          alergias: data.alergias || '',
          enfermedadesPrevias: data.enfermedadesPrevias || '',
          medicamentosActuales: data.medicamentosActuales || '',
          observaciones: data.observaciones || '',
        });
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar datos del paciente';
        toast.error(msg);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    fetchPaciente();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const calculateAge = () => {
    if (!form.fechaNacimiento) return null;
    const birth = new Date(form.fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validate = () => {
    const newErrors = {};
    for (const field of requiredFields) {
      if (!form[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} es obligatorio`;
      }
    }
    if (form.dni && !/^\d{8}$/.test(form.dni.trim())) {
      newErrors.dni = 'DNI debe tener 8 dígitos';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Email no válido';
    }
    if (form.telefono && !/^[\d\s\-+()]{7,15}$/.test(form.telefono.trim())) {
      newErrors.telefono = 'Teléfono no válido';
    }
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
        ...form,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
      };
      if (!payload.email) delete payload.email;

      if (isEdit) {
        await pacienteService.actualizar(id, payload);
        toast.success('Paciente actualizado exitosamente');
      } else {
        await pacienteService.crear(payload);
        toast.success('Paciente registrado exitosamente');
      }
      navigate('/pacientes');
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} paciente`;
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

  const age = calculateAge();

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-info-circle-fill me-2 text-primary"></i>
            Información Personal
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombres <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.nombres ? 'is-invalid' : ''}`}
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  placeholder="Ingresa los nombres"
                  disabled={saving}
                />
                {errors.nombres && <div className="invalid-feedback">{errors.nombres}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Apellidos <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.apellidos ? 'is-invalid' : ''}`}
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ingresa los apellidos"
                  disabled={saving}
                />
                {errors.apellidos && <div className="invalid-feedback">{errors.apellidos}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">DNI <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.dni ? 'is-invalid' : ''}`}
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="8 dígitos"
                  maxLength={8}
                  disabled={saving}
                />
                {errors.dni && <div className="invalid-feedback">{errors.dni}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Edad</label>
                <input
                  type="text"
                  className="form-control"
                  value={age !== null ? `${age} años` : ''}
                  disabled
                  placeholder="Se calcula automáticamente"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Sexo</label>
                <select
                  className="form-select"
                  name="sexo"
                  value={form.sexo}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {sexoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Estado Civil</label>
                <select
                  className="form-select"
                  name="estadoCivil"
                  value={form.estadoCivil}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {estadoCivilOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Tipo de Sangre</label>
                <select
                  className="form-select"
                  name="tipoSangre"
                  value={form.tipoSangre}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {tipoSangreOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-telephone-fill me-2 text-primary"></i>
            Contacto
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Teléfono <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Número de teléfono"
                  disabled={saving}
                />
                {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  disabled={saving}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Distrito</label>
                <input
                  type="text"
                  className="form-control"
                  name="distrito"
                  value={form.distrito}
                  onChange={handleChange}
                  placeholder="Distrito"
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Ciudad</label>
                <input
                  type="text"
                  className="form-control"
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  placeholder="Ciudad"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-shield-exclamation me-2 text-primary"></i>
            Contacto de Emergencia
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de Contacto</label>
                <input
                  type="text"
                  className="form-control"
                  name="contactoEmergencia"
                  value={form.contactoEmergencia}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  disabled={saving}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Teléfono de Emergencia</label>
                <input
                  type="text"
                  className="form-control"
                  name="telefonoEmergencia"
                  value={form.telefonoEmergencia}
                  onChange={handleChange}
                  placeholder="Número de contacto"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-file-medical-fill me-2 text-primary"></i>
            Información Médica
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Ocupación</label>
                <input
                  type="text"
                  className="form-control"
                  name="ocupacion"
                  value={form.ocupacion}
                  onChange={handleChange}
                  placeholder="Ocupación"
                  disabled={saving}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Alergias</label>
                <input
                  type="text"
                  className="form-control"
                  name="alergias"
                  value={form.alergias}
                  onChange={handleChange}
                  placeholder="Alergias conocidas"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Enfermedades Previas</label>
                <textarea
                  className="form-control"
                  name="enfermedadesPrevias"
                  value={form.enfermedadesPrevias}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enfermedades o condiciones preexistentes"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Medicamentos Actuales</label>
                <textarea
                  className="form-control"
                  name="medicamentosActuales"
                  value={form.medicamentosActuales}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Medicamentos que toma actualmente"
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
              onClick={() => navigate('/pacientes')}
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
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-person-plus'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Paciente' : 'Registrar Paciente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PacienteForm;
