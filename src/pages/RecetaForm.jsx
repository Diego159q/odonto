import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recetaService, pacienteService } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const medicamentoService = {
  listarFrecuentes: () => api.get('/medicamentos/frecuentes'),
};

const initialMedicamento = {
  medicamentoId: '',
  nombreMedicamento: '',
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: '',
};

const initialForm = {
  pacienteId: '',
  odontologoId: '',
  diagnostico: '',
  indicaciones: '',
  medicamentos: [],
};

const RecetaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');

  const [medicamentosFrecuentes, setMedicamentosFrecuentes] = useState([]);

  useEffect(() => {
    const loadMedicamentos = async () => {
      try {
        const response = await medicamentoService.listarFrecuentes();
        const data = response.data;
        setMedicamentosFrecuentes(Array.isArray(data) ? data : (data.content || []));
      } catch {
        setMedicamentosFrecuentes([]);
      }
    };
    loadMedicamentos();
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, odontologoId: user.id }));
    }
  }, [user]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchReceta = async () => {
      setLoading(true);
      try {
        const response = await recetaService.buscarPorId(id);
        const data = response.data;
        setForm({
          pacienteId: data.paciente?.id || '',
          odontologoId: data.odontologo?.id || user?.id || '',
          diagnostico: data.diagnostico || '',
          indicaciones: data.indicaciones || '',
          medicamentos: data.medicamentos && data.medicamentos.length > 0
            ? data.medicamentos.map((m) => ({
                medicamentoId: m.medicamento?.id || m.medicamentoId || '',
                nombreMedicamento: m.medicamento?.nombre || m.nombreMedicamento || '',
                dosis: m.dosis || '',
                frecuencia: m.frecuencia || '',
                duracion: m.duracion || '',
                indicaciones: m.indicaciones || '',
              }))
            : [],
        });
        if (data.paciente) {
          setSelectedPacienteName(`${data.paciente.nombres || ''} ${data.paciente.apellidos || ''}`.trim());
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar receta';
        toast.error(msg);
        navigate('/recetas');
      } finally {
        setLoading(false);
      }
    };
    fetchReceta();
  }, [id, isEdit, navigate, user]);

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

  const selectPaciente = (paciente) => {
    setForm((prev) => ({ ...prev, pacienteId: paciente.id }));
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setSearchTerm('');
    setShowPacienteDropdown(false);
    if (errors.pacienteId) setErrors((prev) => ({ ...prev, pacienteId: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const addMedicamento = () => {
    setForm((prev) => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { ...initialMedicamento }],
    }));
  };

  const removeMedicamento = (index) => {
    setForm((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index),
    }));
  };

  const handleMedicamentoChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.medicamentos];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'medicamentoId') {
        const selected = medicamentosFrecuentes.find((m) => m.id === Number(value));
        if (selected) {
          updated[index].nombreMedicamento = selected.nombre || '';
        }
      }

      return { ...prev, medicamentos: updated };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pacienteId) newErrors.pacienteId = 'Debe seleccionar un paciente';
    if (!form.diagnostico.trim()) newErrors.diagnostico = 'El diagnóstico es obligatorio';
    if (!form.indicaciones.trim()) newErrors.indicaciones = 'Las indicaciones son obligatorias';

    if (form.medicamentos.length === 0) {
      newErrors.medicamentos = 'Debe agregar al menos un medicamento';
    } else {
      const medErrors = form.medicamentos.some(
        (m) => !m.medicamentoId || !m.dosis.trim() || !m.frecuencia.trim()
      );
      if (medErrors) {
        newErrors.medicamentos = 'Complete medicamento, dosis y frecuencia en todos los items';
      }
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
        pacienteId: form.pacienteId,
        odontologoId: form.odontologoId,
        diagnostico: form.diagnostico.trim(),
        indicaciones: form.indicaciones.trim(),
        medicamentos: form.medicamentos.map((m) => ({
          medicamentoId: Number(m.medicamentoId),
          dosis: m.dosis.trim(),
          frecuencia: m.frecuencia.trim(),
          duracion: m.duracion.trim() || undefined,
          indicaciones: m.indicaciones.trim() || undefined,
        })),
      };

      if (isEdit) {
        await recetaService.actualizar(id, payload);
        toast.success('Receta actualizada exitosamente');
      } else {
        await recetaService.crear(payload);
        toast.success('Receta creada exitosamente');
      }
      navigate('/recetas');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar receta';
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
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-prescription2'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Receta' : 'Nueva Receta'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-person-fill me-2 text-primary"></i>
            Paciente
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
                <label className="form-label">Odontólogo</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.nombre || ''}
                  disabled
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-clipboard-pulse me-2 text-primary"></i>
            Diagnóstico e Indicaciones
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Diagnóstico <span className="text-danger">*</span></label>
                <textarea
                  className={`form-control ${errors.diagnostico ? 'is-invalid' : ''}`}
                  name="diagnostico"
                  value={form.diagnostico}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Diagnóstico del paciente"
                  disabled={saving}
                />
                {errors.diagnostico && <div className="invalid-feedback">{errors.diagnostico}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Indicaciones <span className="text-danger">*</span></label>
                <textarea
                  className={`form-control ${errors.indicaciones ? 'is-invalid' : ''}`}
                  name="indicaciones"
                  value={form.indicaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Indicaciones generales para el paciente"
                  disabled={saving}
                />
                {errors.indicaciones && <div className="invalid-feedback">{errors.indicaciones}</div>}
              </div>
            </div>
          </div>

          <h5 className="form-title d-flex align-items-center">
            <i className="bi bi-capsule me-2 text-primary"></i>
            Medicamentos
            <button
              type="button"
              className="btn btn-sm btn-outline-primary ms-3"
              onClick={addMedicamento}
              disabled={saving}
            >
              <i className="bi bi-plus-lg me-1"></i>Agregar Medicamento
            </button>
          </h5>

          <div className="form-section">
            {errors.medicamentos && (
              <div className="alert alert-danger py-2 small mb-3">{errors.medicamentos}</div>
            )}

            {form.medicamentos.length === 0 && (
              <p className="text-muted small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                No hay medicamentos agregados. Presione "Agregar Medicamento" para añadir uno.
              </p>
            )}

            {form.medicamentos.map((med, index) => (
              <div key={index} className="card border mb-3">
                <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-2">
                  <small className="fw-semibold">Medicamento #{index + 1}</small>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeMedicamento(index)}
                    disabled={saving}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
                <div className="card-body pb-2">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small">Medicamento <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-sm"
                        value={med.medicamentoId}
                        onChange={(e) => handleMedicamentoChange(index, 'medicamentoId', e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Seleccionar...</option>
                        {medicamentosFrecuentes.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Dosis <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={med.dosis}
                        onChange={(e) => handleMedicamentoChange(index, 'dosis', e.target.value)}
                        placeholder="Ej: 500mg"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Frecuencia <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={med.frecuencia}
                        onChange={(e) => handleMedicamentoChange(index, 'frecuencia', e.target.value)}
                        placeholder="Ej: Cada 8h"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Duración</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={med.duracion}
                        onChange={(e) => handleMedicamentoChange(index, 'duracion', e.target.value)}
                        placeholder="Ej: 7 días"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Indicaciones</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={med.indicaciones}
                        onChange={(e) => handleMedicamentoChange(index, 'indicaciones', e.target.value)}
                        placeholder="Opcional"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/recetas')}
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
              <i className={`bi ${saving ? '' : 'bi-check-lg'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Receta' : 'Crear Receta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecetaForm;
