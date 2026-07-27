import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historiaClinicaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const initialForm = {
  fechaAtencion: '',
  motivoConsulta: '',
  enfermedadActual: '',
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  alergias: '',
  enfermedadesSistemicas: '',
  presionArterial: '',
  peso: '',
  talla: '',
  temperatura: '',
  diagnosticoGeneral: '',
  observaciones: '',
  recomendaciones: '',
};

const HistoriaClinicaForm = () => {
  const { id, pacienteId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setForm((prev) => ({ ...prev, fechaAtencion: new Date().toISOString().split('T')[0] }));
      return;
    }
    const fetchHistoria = async () => {
      setLoading(true);
      try {
        const response = await historiaClinicaService.buscarPorId(id);
        const data = response.data;
        setForm({
          fechaAtencion: data.fechaAtencion ? (data.fechaAtencion.includes('T') ? data.fechaAtencion.split('T')[0] : data.fechaAtencion) : '',
          motivoConsulta: data.motivoConsulta || '',
          enfermedadActual: data.enfermedadActual || '',
          antecedentesPersonales: data.antecedentesPersonales || '',
          antecedentesFamiliares: data.antecedentesFamiliares || '',
          alergias: data.alergias || '',
          enfermedadesSistemicas: data.enfermedadesSistemicas || '',
          presionArterial: data.presionArterial || '',
          peso: data.peso || '',
          talla: data.talla || '',
          temperatura: data.temperatura || '',
          diagnosticoGeneral: data.diagnosticoGeneral || '',
          observaciones: data.observaciones || '',
          recomendaciones: data.recomendaciones || '',
        });
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar historia clínica';
        toast.error(msg);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoria();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        pacienteId: Number(pacienteId),
        fechaAtencion: form.fechaAtencion,
        motivoConsulta: form.motivoConsulta.trim(),
        enfermedadActual: form.enfermedadActual.trim() || undefined,
        antecedentesPersonales: form.antecedentesPersonales.trim() || undefined,
        antecedentesFamiliares: form.antecedentesFamiliares.trim() || undefined,
        alergias: form.alergias.trim() || undefined,
        enfermedadesSistemicas: form.enfermedadesSistemicas.trim() || undefined,
        presionArterial: form.presionArterial.trim() || undefined,
        peso: form.peso ? Number(form.peso) : undefined,
        talla: form.talla ? Number(form.talla) : undefined,
        temperatura: form.temperatura ? Number(form.temperatura) : undefined,
        diagnosticoGeneral: form.diagnosticoGeneral.trim(),
        observaciones: form.observaciones.trim() || undefined,
        recomendaciones: form.recomendaciones.trim() || undefined,
      };

      if (isEdit) {
        await historiaClinicaService.actualizar(id, payload);
        toast.success('Historia clínica actualizada exitosamente');
      } else {
        await historiaClinicaService.crear(payload);
        toast.success('Historia clínica creada exitosamente');
      }
      navigate(`/historias-clinicas/paciente/${pacienteId}`);
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} historia clínica`;
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
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-file-earmark-plus-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Historia Clínica' : 'Nueva Historia Clínica'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Datos de la Consulta
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Fecha de Atención <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaAtencion"
                  value={form.fechaAtencion}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Motivo de Consulta <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  name="motivoConsulta"
                  value={form.motivoConsulta}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Motivo principal de la consulta"
                  disabled={saving}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Enfermedad Actual</label>
                <textarea
                  className="form-control"
                  name="enfermedadActual"
                  value={form.enfermedadActual}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción de la enfermedad actual"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-person-badge me-2 text-primary"></i>
            Antecedentes
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Antecedentes Personales</label>
                <textarea
                  className="form-control"
                  name="antecedentesPersonales"
                  value={form.antecedentesPersonales}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Antecedentes personales del paciente"
                  disabled={saving}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Antecedentes Familiares</label>
                <textarea
                  className="form-control"
                  name="antecedentesFamiliares"
                  value={form.antecedentesFamiliares}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Antecedentes familiares relevantes"
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
              <div className="col-md-6">
                <label className="form-label">Enfermedades Sistémicas</label>
                <input
                  type="text"
                  className="form-control"
                  name="enfermedadesSistemicas"
                  value={form.enfermedadesSistemicas}
                  onChange={handleChange}
                  placeholder="Enfermedades sistémicas"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-activity me-2 text-primary"></i>
            Signos Vitales
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Presión Arterial</label>
                <input
                  type="text"
                  className="form-control"
                  name="presionArterial"
                  value={form.presionArterial}
                  onChange={handleChange}
                  placeholder="Ej: 120/80"
                  disabled={saving}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  name="peso"
                  value={form.peso}
                  onChange={handleChange}
                  placeholder="Peso en kilogramos"
                  disabled={saving}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Talla (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  name="talla"
                  value={form.talla}
                  onChange={handleChange}
                  placeholder="Talla en centímetros"
                  disabled={saving}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  name="temperatura"
                  value={form.temperatura}
                  onChange={handleChange}
                  placeholder="Temperatura corporal"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-clipboard2-pulse me-2 text-primary"></i>
            Diagnóstico y Conclusiones
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Diagnóstico General <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  name="diagnosticoGeneral"
                  value={form.diagnosticoGeneral}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Diagnóstico general de la consulta"
                  disabled={saving}
                  required
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
                  placeholder="Observaciones adicionales"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Recomendaciones</label>
                <textarea
                  className="form-control"
                  name="recomendaciones"
                  value={form.recomendaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Recomendaciones para el paciente"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/historias-clinicas/paciente/${pacienteId}`)}
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
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-file-earmark-plus'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Historia Clínica' : 'Crear Historia Clínica'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HistoriaClinicaForm;
