import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productoService, proveedorService } from '../services/endpoints';
import { toast } from 'react-toastify';
import api from '../services/api';

const initialForm = {
  codigo: '',
  nombre: '',
  categoriaId: '',
  descripcion: '',
  unidadMedida: '',
  stockActual: '',
  stockMinimo: '',
  precioCompra: '',
  precioVenta: '',
  fechaVencimiento: '',
  proveedorId: '',
  lote: '',
  activo: true,
};

const requiredFields = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoriaId', label: 'Categoría' },
  { key: 'precioVenta', label: 'Precio Venta' },
];

const unidadMedidaOptions = [
  { value: '', label: 'Seleccionar...' },
  { value: 'UNIDAD', label: 'Unidad' },
  { value: 'CAJA', label: 'Caja' },
  { value: 'PAQUETE', label: 'Paquete' },
  { value: 'BOLSA', label: 'Bolsa' },
  { value: 'FRASCO', label: 'Frasco' },
  { value: 'TUBO', label: 'Tubo' },
  { value: 'LITRO', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'KILO', label: 'Kilogramo' },
  { value: 'GRAMO', label: 'Gramo' },
  { value: 'METRO', label: 'Metro' },
  { value: 'ROLLO', label: 'Rollo' },
  { value: 'PAR', label: 'Par' },
  { value: 'JUEGO', label: 'Juego' },
  { value: 'OTRO', label: 'Otro' },
];

const ProductoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [selectsLoading, setSelectsLoading] = useState(true);

  useEffect(() => {
    const loadSelects = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          api.get('/productos/categorias'),
          proveedorService.listar(),
        ]);
        const catData = catRes.data;
        setCategorias(Array.isArray(catData) ? catData : catData?.content || []);
        const provData = provRes.data;
        setProveedores(Array.isArray(provData) ? provData : provData?.content || []);
      } catch {
        toast.error('Error al cargar datos del formulario');
      } finally {
        setSelectsLoading(false);
      }
    };
    loadSelects();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProducto = async () => {
      setLoading(true);
      try {
        const response = await productoService.buscarPorId(id);
        const data = response.data;
        setForm({
          codigo: data.codigo || '',
          nombre: data.nombre || '',
          categoriaId: data.categoria?.id?.toString() || data.categoriaId?.toString() || '',
          descripcion: data.descripcion || '',
          unidadMedida: data.unidadMedida || '',
          stockActual: data.stockActual != null ? data.stockActual : '',
          stockMinimo: data.stockMinimo != null ? data.stockMinimo : '',
          precioCompra: data.precioCompra != null ? data.precioCompra : '',
          precioVenta: data.precioVenta != null ? data.precioVenta : '',
          fechaVencimiento: data.fechaVencimiento ? data.fechaVencimiento.split('T')[0] : '',
          proveedorId: data.proveedor?.id?.toString() || data.proveedorId?.toString() || '',
          lote: data.lote || '',
          activo: data.activo != null ? data.activo : true,
        });
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar datos del producto';
        toast.error(msg);
        navigate('/inventario');
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id, isEdit, navigate]);

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
    for (const field of requiredFields) {
      const val = form[field.key];
      if (val === '' || val === null || val === undefined || (typeof val === 'string' && !val.trim())) {
        newErrors[field.key] = `${field.label} es obligatorio`;
      }
    }
    if (form.stockActual !== '' && (isNaN(Number(form.stockActual)) || Number(form.stockActual) < 0)) {
      newErrors.stockActual = 'Stock actual debe ser un número válido';
    }
    if (form.stockMinimo !== '' && (isNaN(Number(form.stockMinimo)) || Number(form.stockMinimo) < 0)) {
      newErrors.stockMinimo = 'Stock mínimo debe ser un número válido';
    }
    if (form.precioCompra !== '' && (isNaN(Number(form.precioCompra)) || Number(form.precioCompra) < 0)) {
      newErrors.precioCompra = 'Precio de compra no válido';
    }
    if (form.precioVenta !== '' && (isNaN(Number(form.precioVenta)) || Number(form.precioVenta) < 0)) {
      newErrors.precioVenta = 'Precio de venta no válido';
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
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
        proveedorId: form.proveedorId ? Number(form.proveedorId) : undefined,
        stockActual: form.stockActual !== '' ? Number(form.stockActual) : undefined,
        stockMinimo: form.stockMinimo !== '' ? Number(form.stockMinimo) : undefined,
        precioCompra: form.precioCompra !== '' ? Number(form.precioCompra) : undefined,
        precioVenta: form.precioVenta !== '' ? Number(form.precioVenta) : undefined,
        descripcion: form.descripcion.trim() || undefined,
        lote: form.lote.trim() || undefined,
        fechaVencimiento: form.fechaVencimiento || undefined,
        unidadMedida: form.unidadMedida || undefined,
      };
      if (!payload.categoriaId) delete payload.categoriaId;
      if (!payload.proveedorId) delete payload.proveedorId;

      if (isEdit) {
        await productoService.actualizar(id, payload);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productoService.crear(payload);
        toast.success('Producto registrado exitosamente');
      }
      navigate('/inventario');
    } catch (error) {
      const msg = error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} producto`;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || selectsLoading) {
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
          <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-box-seam-fill'} me-2 text-primary`}></i>
          {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-container">
          <h5 className="form-title">
            <i className="bi bi-info-circle-fill me-2 text-primary"></i>
            Información del Producto
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Código <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.codigo ? 'is-invalid' : ''}`}
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  placeholder="Código del producto"
                  disabled={saving}
                />
                {errors.codigo && <div className="invalid-feedback">{errors.codigo}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Nombre <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  disabled={saving}
                />
                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Categoría <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.categoriaId ? 'is-invalid' : ''}`}
                  name="categoriaId"
                  value={form.categoriaId}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre || cat.categoria}</option>
                  ))}
                </select>
                {errors.categoriaId && <div className="invalid-feedback">{errors.categoriaId}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  name="descripcion"
                  rows={2}
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción del producto"
                  disabled={saving}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Unidad de Medida</label>
                <select
                  className="form-select"
                  name="unidadMedida"
                  value={form.unidadMedida}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {unidadMedidaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Lote</label>
                <input
                  type="text"
                  className="form-control"
                  name="lote"
                  value={form.lote}
                  onChange={handleChange}
                  placeholder="Número de lote"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <h5 className="form-title">
            <i className="bi bi-currency-dollar me-2 text-primary"></i>
            Control de Stock y Precios
          </h5>

          <div className="form-section">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Stock Actual</label>
                <input
                  type="number"
                  className={`form-control ${errors.stockActual ? 'is-invalid' : ''}`}
                  name="stockActual"
                  value={form.stockActual}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  disabled={saving}
                />
                {errors.stockActual && <div className="invalid-feedback">{errors.stockActual}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Stock Mínimo</label>
                <input
                  type="number"
                  className={`form-control ${errors.stockMinimo ? 'is-invalid' : ''}`}
                  name="stockMinimo"
                  value={form.stockMinimo}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  disabled={saving}
                />
                {errors.stockMinimo && <div className="invalid-feedback">{errors.stockMinimo}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Precio Compra</label>
                <div className="input-group">
                  <span className="input-group-text">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${errors.precioCompra ? 'is-invalid' : ''}`}
                    name="precioCompra"
                    value={form.precioCompra}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    disabled={saving}
                  />
                  {errors.precioCompra && <div className="invalid-feedback">{errors.precioCompra}</div>}
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label">Precio Venta <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${errors.precioVenta ? 'is-invalid' : ''}`}
                    name="precioVenta"
                    value={form.precioVenta}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    disabled={saving}
                  />
                  {errors.precioVenta && <div className="invalid-feedback">{errors.precioVenta}</div>}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  className="form-control"
                  name="fechaVencimiento"
                  value={form.fechaVencimiento}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Proveedor</label>
                <select
                  className="form-select"
                  name="proveedorId"
                  value={form.proveedorId}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Seleccionar...</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.razonSocial || prov.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="activo"
                    id="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="activo">Producto Activo</label>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/inventario')}
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
              <i className={`bi ${saving ? '' : isEdit ? 'bi-check-lg' : 'bi-box-seam'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Registrar Producto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;
