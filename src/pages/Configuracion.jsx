import React, { useState, useEffect } from 'react';
import { configuracionService } from '../services/endpoints';
import { toast } from 'react-toastify';

const initialForm = {
  nombreCentro: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
  horarioAtencion: '',
  duracionCitaMinutos: 30,
  moneda: 'SOLES',
  odontologaNombre: '',
  odontologaNumeroColegiatura: '',
  mensajeRecordatorioCita: '',
  mensajeRecordatorioPago: '',
};

const Configuracion = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await configuracionService.get();
        const data = response.data;
        setForm({
          nombreCentro: data.nombreCentro || '',
          ruc: data.ruc || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          email: data.email || '',
          horarioAtencion: data.horarioAtencion
            ? typeof data.horarioAtencion === 'string'
              ? data.horarioAtencion
              : JSON.stringify(data.horarioAtencion, null, 2)
            : '',
          duracionCitaMinutos: data.duracionCitaMinutos ?? 30,
          moneda: data.moneda || 'SOLES',
          odontologaNombre: data.odontologaNombre || '',
          odontologaNumeroColegiatura: data.odontologaNumeroColegiatura || '',
          mensajeRecordatorioCita: data.mensajeRecordatorioCita || '',
          mensajeRecordatorioPago: data.mensajeRecordatorioPago || '',
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        duracionCitaMinutos: Number(form.duracionCitaMinutos),
        horarioAtencion: form.horarioAtencion,
      };
      await configuracionService.actualizar(payload);
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar configuración');
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
          <i className="bi bi-gear-fill me-2 text-primary"></i>Configuración del Centro
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-building-fill me-2 text-primary"></i>Información del Centro
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre del Centro</label>
                <input type="text" className="form-control" name="nombreCentro" value={form.nombreCentro} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">RUC</label>
                <input type="text" className="form-control" name="ruc" value={form.ruc} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Dirección</label>
                <input type="text" className="form-control" name="direccion" value={form.direccion} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Teléfono</label>
                <input type="text" className="form-control" name="telefono" value={form.telefono} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Moneda</label>
                <select className="form-select" name="moneda" value={form.moneda} onChange={handleChange} disabled={saving}>
                  <option value="SOLES">Soles (S/)</option>
                  <option value="DOLARES">Dólares ($)</option>
                </select>
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-clock-fill me-2 text-primary"></i>Horarios y Duración
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Horario de Atención (JSON)</label>
                <textarea
                  className="form-control"
                  name="horarioAtencion"
                  value={form.horarioAtencion}
                  onChange={handleChange}
                  rows={4}
                  placeholder='{"lunes": "09:00-18:00", "martes": "09:00-18:00", ...}'
                  disabled={saving}
                />
                <small className="text-muted">Formato JSON con los horarios por día</small>
              </div>
              <div className="col-md-6">
                <label className="form-label">Duración de Cita (minutos)</label>
                <input
                  type="number"
                  className="form-control"
                  name="duracionCitaMinutos"
                  value={form.duracionCitaMinutos}
                  onChange={handleChange}
                  min={15}
                  max={120}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-person-fill me-2 text-primary"></i>Información de la Odontóloga
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de la Odontóloga</label>
                <input type="text" className="form-control" name="odontologaNombre" value={form.odontologaNombre} onChange={handleChange} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Número de Colegiatura</label>
                <input type="text" className="form-control" name="odontologaNumeroColegiatura" value={form.odontologaNumeroColegiatura} onChange={handleChange} disabled={saving} />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-chat-dots-fill me-2 text-primary"></i>Mensajes de Recordatorio
          </h5>
          <div className="form-section">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Mensaje Recordatorio de Cita</label>
                <textarea
                  className="form-control"
                  name="mensajeRecordatorioCita"
                  value={form.mensajeRecordatorioCita}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Mensaje que se enviará como recordatorio de citas"
                  disabled={saving}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Mensaje Recordatorio de Pago</label>
                <textarea
                  className="form-control"
                  name="mensajeRecordatorioPago"
                  value={form.mensajeRecordatorioPago}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Mensaje que se enviará como recordatorio de pagos"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button type="submit" className="btn btn-dental-primary d-inline-flex align-items-center gap-2" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
              <i className={`bi ${saving ? '' : 'bi-check-lg'}`}></i>
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Configuracion;
