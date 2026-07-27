import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usuarioService } from '../services/endpoints';
import api from '../services/api';
import { toast } from 'react-toastify';

const initialForm = {
  nombre: '',
  apellido: '',
  email: '',
  username: '',
  password: '',
  telefono: '',
  rolId: '',
  activo: true,
};

const UsuarioForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        const data = res.data;
        if (data.content) setRoles(data.content);
        else if (Array.isArray(data)) setRoles(data);
        else setRoles([]);
      } catch {
        toast.error('Error al cargar roles');
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchUsuario = async () => {
      setLoading(true);
      try {
        const response = await usuarioService.buscarPorId(id);
        const data = response.data;
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          email: data.email || '',
          username: data.username || '',
          password: '',
          telefono: data.telefono || '',
          rolId: data.rol?.id || data.rolId || '',
          activo: data.activo !== undefined ? data.activo : true,
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar datos del usuario');
        navigate('/usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? e.target.checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'Nombre es obligatorio';
    if (!form.apellido.trim()) newErrors.apellido = 'Apellido es obligatorio';
    if (!form.email.trim()) newErrors.email = 'Email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = 'Email no válido';
    if (!form.username.trim()) newErrors.username = 'Usuario es obligatorio';
    if (!isEdit && !form.password) newErrors.password = 'Contraseña es obligatoria';
    if (!form.rolId) newErrors.rolId = 'Rol es obligatorio';
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
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        telefono: form.telefono.trim() || undefined,
        rolId: form.rolId,
        activo: form.activo,
      };
      if (!payload.telefono) delete payload.telefono;

      if (isEdit) {
        if (form.password) payload.password = form.password;
        await usuarioService.actualizar(id, payload);
        toast.success('Usuario actualizado exitosamente');
      } else {
        payload.password = form.password;
        await usuarioService.crear(payload);
        toast.success('Usuario creado exitosamente');
      }
      navigate('/usuarios');
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} usuario`;
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
          <i className={`bi ${isEdit ? 'bi-person-gear' : 'bi-person-plus-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-info-circle-fill me-2 text-primary"></i>Información del Usuario
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombres"
                  disabled={saving}
                />
                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Apellido <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Apellidos"
                  disabled={saving}
                />
                {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email <span className="text-danger">*</span></label>
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
                <label className="form-label">Usuario <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Nombre de usuario"
                  disabled={saving}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Contraseña {!isEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isEdit ? 'Dejar en blanco para mantener' : 'Contraseña'}
                  disabled={saving}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                {isEdit && (
                  <small className="text-muted">Dejar en blanco para mantener la contraseña actual</small>
                )}
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
                <label className="form-label">Rol <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.rolId ? 'is-invalid' : ''}`}
                  name="rolId"
                  value={form.rolId}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
                {errors.rolId && <div className="invalid-feedback">{errors.rolId}</div>}
              </div>
              <div className="col-md-6 d-flex align-items-center">
                <div className="form-check form-switch mt-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="activo"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="activo">Usuario activo</label>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/usuarios')}
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
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-person-plus'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UsuarioForm;
