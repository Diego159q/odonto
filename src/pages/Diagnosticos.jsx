import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const initialForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  frecuente: false,
};

const Diagnosticos = () => {
  const navigate = useNavigate();

  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchDiagnosticos = async () => {
    setLoading(true);
    try {
      const response = await diagnosticoService.listar();
      const data = response.data;
      setDiagnosticos(Array.isArray(data) ? data : (data.content || []));
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar diagnósticos';
      toast.error(msg);
      setDiagnosticos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnosticos();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (diag) => {
    setEditId(diag.id);
    setForm({
      codigo: diag.codigo || '',
      nombre: diag.nombre || '',
      descripcion: diag.descripcion || '',
      frecuente: diag.frecuente || false,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.warning('El nombre del diagnóstico es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        codigo: form.codigo.trim() || undefined,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        frecuente: form.frecuente,
      };

      if (editId) {
        await diagnosticoService.actualizar(editId, payload);
        toast.success('Diagnóstico actualizado exitosamente');
      } else {
        await diagnosticoService.crear(payload);
        toast.success('Diagnóstico creado exitosamente');
      }
      setShowModal(false);
      fetchDiagnosticos();
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${editId ? 'actualizar' : 'crear'} diagnóstico`;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-clipboard2-pulse-fill me-2 text-primary"></i>Diagnósticos
        </h2>
        <button
          className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-lg"></i> Nuevo Diagnóstico
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {diagnosticos.length > 0 ? `${diagnosticos.length} registro(s)` : 'Sin resultados'}
          </span>
          {diagnosticos.length > 0 && (
            <span className="badge bg-primary">{diagnosticos.length} registros</span>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : diagnosticos.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-clipboard2-pulse" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No hay diagnósticos registrados</p>
            <button className="btn btn-dental-primary" onClick={openCreateModal}>
              Crear primer diagnóstico
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Frecuente</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticos.map((diag) => (
                  <tr key={diag.id}>
                    <td><span className="fw-semibold">{diag.codigo || '-'}</span></td>
                    <td>{diag.nombre || '-'}</td>
                    <td>{diag.descripcion || '-'}</td>
                    <td>
                      {diag.frecuente ? (
                        <span className="badge badge-activo badge-status">Sí</span>
                      ) : (
                        <span className="badge badge-borrador badge-status">No</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Editar"
                          onClick={() => openEditModal(diag)}
                        >
                          <i className="bi bi-pencil"></i>
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
                  {editId ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
                </h5>
                <button type="button" className="btn-close" onClick={() => !saving && setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Código</label>
                      <input
                        type="text"
                        className="form-control"
                        name="codigo"
                        value={form.codigo}
                        onChange={handleChange}
                        placeholder="Código del diagnóstico"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Frecuente</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="frecuente"
                          id="frecuente"
                          checked={form.frecuente}
                          onChange={handleChange}
                          disabled={saving}
                        />
                        <label className="form-check-label" htmlFor="frecuente">
                          Marcar como frecuente
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Nombre <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Nombre del diagnóstico"
                        disabled={saving}
                        required
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
                        placeholder="Descripción del diagnóstico"
                        disabled={saving}
                      />
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
                    type="submit"
                    className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnosticos;
