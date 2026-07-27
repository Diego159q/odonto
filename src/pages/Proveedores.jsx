import React, { useState, useEffect, useCallback } from 'react';
import { proveedorService } from '../services/endpoints';
import { toast } from 'react-toastify';

const initialForm = {
  razonSocial: '',
  ruc: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  productosSuministrados: '',
  activo: true,
};

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await proveedorService.listar();
      const data = response.data;
      if (Array.isArray(data)) {
        setProveedores(data);
      } else if (data?.content) {
        setProveedores(data.content);
      } else {
        setProveedores([]);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar proveedores';
      toast.error(msg);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = async (proveedor) => {
    setEditId(proveedor.id);
    setErrors({});
    try {
      const response = await proveedorService.buscarPorId(proveedor.id);
      const data = response.data;
      setForm({
        razonSocial: data.razonSocial || '',
        ruc: data.ruc || '',
        contacto: data.contacto || '',
        telefono: data.telefono || '',
        email: data.email || '',
        direccion: data.direccion || '',
        productosSuministrados: data.productosSuministrados || '',
        activo: data.activo != null ? data.activo : true,
      });
      setShowModal(true);
    } catch {
      toast.error('Error al cargar datos del proveedor');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.razonSocial.trim()) newErrors.razonSocial = 'Razón Social es obligatorio';
    if (!form.ruc.trim()) newErrors.ruc = 'RUC es obligatorio';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Email no válido';
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
        razonSocial: form.razonSocial.trim(),
        ruc: form.ruc.trim(),
        contacto: form.contacto.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        productosSuministrados: form.productosSuministrados.trim() || undefined,
      };

      if (editId) {
        await proveedorService.actualizar(editId, payload);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await proveedorService.crear(payload);
        toast.success('Proveedor registrado exitosamente');
      }
      setShowModal(false);
      fetchProveedores();
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${editId ? 'actualizar' : 'crear'} proveedor`;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderEstadoBadge = (activo) => {
    return (
      <span className={`badge badge-status ${activo ? 'badge-activo' : 'badge-inactivo'}`}>
        {activo ? 'ACTIVO' : 'INACTIVO'}
      </span>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-truck-fill me-2 text-primary"></i>Proveedores
        </h2>
        <button className="btn btn-dental-primary d-inline-flex align-items-center gap-2" onClick={openCreate}>
          <i className="bi bi-plus-lg"></i> Nuevo Proveedor
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {proveedores.length > 0
              ? `${proveedores.length} proveedor(es) registrado(s)`
              : 'Sin resultados'}
          </span>
          {proveedores.length > 0 && (
            <span className="badge bg-primary">{proveedores.length} registros</span>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : proveedores.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-truck" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No hay proveedores registrados</p>
            <button className="btn btn-dental-primary" onClick={openCreate}>
              Registrar primer proveedor
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Razón Social</th>
                  <th>RUC</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov) => (
                  <tr key={prov.id}>
                    <td><span className="fw-semibold">{prov.razonSocial || prov.nombre || '-'}</span></td>
                    <td>{prov.ruc || '-'}</td>
                    <td>{prov.contacto || '-'}</td>
                    <td>{prov.telefono || '-'}</td>
                    <td>{prov.email || '-'}</td>
                    <td>{renderEstadoBadge(prov.activo != null ? prov.activo : true)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Editar"
                          onClick={() => openEdit(prov)}
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2 text-primary`}></i>
                  {editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h5>
                <button type="button" className="btn-close" onClick={() => !saving && setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Razón Social <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.razonSocial ? 'is-invalid' : ''}`}
                        name="razonSocial"
                        value={form.razonSocial}
                        onChange={handleChange}
                        placeholder="Razón social o nombre"
                        disabled={saving}
                      />
                      {errors.razonSocial && <div className="invalid-feedback">{errors.razonSocial}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">RUC <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${errors.ruc ? 'is-invalid' : ''}`}
                        name="ruc"
                        value={form.ruc}
                        onChange={handleChange}
                        placeholder="Número de RUC"
                        disabled={saving}
                      />
                      {errors.ruc && <div className="invalid-feedback">{errors.ruc}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contacto</label>
                      <input
                        type="text"
                        className="form-control"
                        name="contacto"
                        value={form.contacto}
                        onChange={handleChange}
                        placeholder="Nombre del contacto"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="Número de teléfono"
                        disabled={saving}
                      />
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
                    <div className="col-md-6">
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
                    <div className="col-12">
                      <label className="form-label">Productos Suministrados</label>
                      <textarea
                        className="form-control"
                        name="productosSuministrados"
                        rows={2}
                        value={form.productosSuministrados}
                        onChange={handleChange}
                        placeholder="Ej: Guantes, mascarillas, anestésicos..."
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="activo"
                          id="provActivo"
                          checked={form.activo}
                          onChange={handleChange}
                          disabled={saving}
                        />
                        <label className="form-check-label" htmlFor="provActivo">Proveedor Activo</label>
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
                    type="submit"
                    className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    {saving && (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    )}
                    {saving ? 'Guardando...' : editId ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
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

export default Proveedores;
