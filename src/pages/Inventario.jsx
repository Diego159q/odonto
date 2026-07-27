import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productoService, movimientoInventarioService } from '../services/endpoints';
import { toast } from 'react-toastify';
import api from '../services/api';

const Inventario = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [stats, setStats] = useState({ stockBajo: 0, proximosVencer: 0 });

  const [movimientoProducto, setMovimientoProducto] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  const [ajusteProducto, setAjusteProducto] = useState(null);
  const [ajusteForm, setAjusteForm] = useState({ cantidad: '', motivo: '' });
  const [ajustando, setAjustando] = useState(false);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoriaFilter) params.categoriaId = categoriaFilter;
      const response = await productoService.listar(params);
      const data = response.data;
      if (data.content) {
        setProductos(data.content);
      } else if (Array.isArray(data)) {
        setProductos(data);
      } else {
        setProductos([]);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar productos';
      toast.error(msg);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoriaFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const [stockRes, vencRes] = await Promise.all([
        productoService.stockBajo(),
        productoService.proximosVencer(30),
      ]);
      const stockData = stockRes.data;
      const vencData = vencRes.data;
      setStats({
        stockBajo: Array.isArray(stockData) ? stockData.length : stockData?.length || 0,
        proximosVencer: Array.isArray(vencData) ? vencData.length : vencData?.length || 0,
      });
    } catch {
    }
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/productos/categorias');
      const data = res.data;
      setCategorias(Array.isArray(data) ? data : data?.content || []);
    } catch {
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchProductos();
  };

  const openMovimientos = async (producto) => {
    setMovimientoProducto(producto);
    setMovimientos([]);
    setLoadingMovimientos(true);
    try {
      const res = await movimientoInventarioService.listarPorProducto(producto.id);
      const data = res.data;
      setMovimientos(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const openAjuste = (producto) => {
    setAjusteProducto(producto);
    setAjusteForm({ cantidad: '', motivo: '' });
  };

  const handleAjusteChange = (e) => {
    const { name, value } = e.target;
    setAjusteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAjustar = async () => {
    const cantidad = Number(ajusteForm.cantidad);
    if (!cantidad || cantidad === 0) {
      toast.warning('Ingrese una cantidad válida (positiva o negativa)');
      return;
    }
    if (!ajusteForm.motivo.trim()) {
      toast.warning('Ingrese un motivo');
      return;
    }
    setAjustando(true);
    try {
      await movimientoInventarioService.registrar({
        productoId: ajusteProducto.id,
        cantidad,
        motivo: ajusteForm.motivo.trim(),
        tipoMovimiento: cantidad > 0 ? 'ENTRADA' : 'SALIDA',
      });
      toast.success('Stock ajustado exitosamente');
      setAjusteProducto(null);
      fetchProductos();
      fetchStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al ajustar stock';
      toast.error(msg);
    } finally {
      setAjustando(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const renderEstadoBadge = (estado) => {
    const map = {
      ACTIVO: 'badge-activo',
      INACTIVO: 'badge-inactivo',
    };
    const cls = map[estado] || 'badge-activo';
    return <span className={`badge badge-status ${cls}`}>{estado || 'ACTIVO'}</span>;
  };

  const isVencimientoProximo = (fecha) => {
    if (!fecha) return false;
    const venc = new Date(fecha + (fecha.includes('T') ? '' : 'T00:00:00'));
    const hoy = new Date();
    const diff = (venc - hoy) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-box-seam-fill me-2 text-primary"></i>Inventario
        </h2>
        <Link to="/inventario/nuevo" className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nuevo Producto
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-warning">
            <div className="card-body d-flex align-items-center gap-3 py-3">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
              </div>
              <div>
                <h6 className="card-title mb-0">Productos con Stock Bajo</h6>
                <span className="fs-3 fw-bold text-warning">{stats.stockBajo}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-danger">
            <div className="card-body d-flex align-items-center gap-3 py-3">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                <i className="bi bi-clock-fill text-danger fs-5"></i>
              </div>
              <div>
                <h6 className="card-title mb-0">Productos Próximos a Vencer</h6>
                <span className="fs-3 fw-bold text-danger">{stats.proximosVencer}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="searchProducto">
              <i className="bi bi-search me-1"></i>Buscar
            </label>
            <div className="input-group">
              <input
                id="searchProducto"
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-dental-primary" onClick={() => fetchProductos()}>
                <i className="bi bi-search"></i>
              </button>
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="categoriaFilter">
              <i className="bi bi-funnel me-1"></i>Categoría
            </label>
            <select
              id="categoriaFilter"
              className="form-select"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre || cat.categoria}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {productos.length > 0
              ? `${productos.length} producto(s) encontrado(s)`
              : 'Sin resultados'}
          </span>
          {productos.length > 0 && (
            <span className="badge bg-primary">{productos.length} registros</span>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-box-seam" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">
              {searchTerm || categoriaFilter
                ? 'No se encontraron productos con esos criterios'
                : 'No hay productos registrados'}
            </p>
            {(searchTerm || categoriaFilter) ? (
              <button className="btn btn-outline-primary" onClick={() => { setSearchTerm(''); setCategoriaFilter(''); }}>
                Limpiar filtros
              </button>
            ) : (
              <Link to="/inventario/nuevo" className="btn btn-dental-primary">
                Registrar primer producto
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => {
                  const isLowStock = prod.stockActual != null && prod.stockMinimo != null && prod.stockActual < prod.stockMinimo;
                  return (
                    <tr key={prod.id} className={isLowStock ? 'table-danger' : ''}>
                      <td><span className="fw-semibold">{prod.codigo || '#' + prod.id}</span></td>
                      <td>{prod.nombre || '-'}</td>
                      <td>{prod.categoria?.nombre || prod.categoria || '-'}</td>
                      <td className={isLowStock ? 'fw-bold text-danger' : ''}>{prod.stockActual ?? '-'}</td>
                      <td>{prod.stockMinimo ?? '-'}</td>
                      <td>{prod.precioCompra != null ? `S/ ${Number(prod.precioCompra).toFixed(2)}` : '-'}</td>
                      <td>{prod.precioVenta != null ? `S/ ${Number(prod.precioVenta).toFixed(2)}` : '-'}</td>
                      <td className={isVencimientoProximo(prod.fechaVencimiento) ? 'text-danger fw-semibold' : ''}>
                        {formatDate(prod.fechaVencimiento)}
                      </td>
                      <td>{renderEstadoBadge(prod.activo != null ? (prod.activo ? 'ACTIVO' : 'INACTIVO') : prod.estado)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Editar"
                            onClick={() => navigate(`/inventario/${prod.id}/editar`)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="Movimientos"
                            onClick={() => openMovimientos(prod)}
                          >
                            <i className="bi bi-arrow-left-right"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="Ajustar Stock"
                            onClick={() => openAjuste(prod)}
                          >
                            <i className="bi bi-plus-slash-minus"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {movimientoProducto && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-left-right text-info me-2"></i>
                  Movimientos - {movimientoProducto.nombre}
                </h5>
                <button type="button" className="btn-close" onClick={() => setMovimientoProducto(null)}></button>
              </div>
              <div className="modal-body">
                {loadingMovimientos ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : movimientos.length === 0 ? (
                  <p className="text-muted text-center mb-0">No hay movimientos registrados para este producto.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-modern mb-0">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Cantidad</th>
                          <th>Motivo</th>
                          <th>Registrado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((mov) => (
                          <tr key={mov.id}>
                            <td>{formatDate(mov.fecha || mov.fechaMovimiento)}</td>
                            <td>
                              <span className={`badge ${mov.tipoMovimiento === 'ENTRADA' ? 'bg-success' : 'bg-danger'}`}>
                                {mov.tipoMovimiento || mov.tipo || '-'}
                              </span>
                            </td>
                            <td className={mov.cantidad > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                              {mov.cantidad != null ? (mov.cantidad > 0 ? '+' : '') + mov.cantidad : '-'}
                            </td>
                            <td>{mov.motivo || '-'}</td>
                            <td>{mov.usuario?.nombre || mov.usuario?.username || mov.registradoPor || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setMovimientoProducto(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ajusteProducto && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-slash-minus text-warning me-2"></i>
                  Ajustar Stock - {ajusteProducto.nombre}
                </h5>
                <button type="button" className="btn-close" onClick={() => !ajustando && setAjusteProducto(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-3 bg-light rounded">
                  <small className="text-muted d-block">Stock actual: <strong>{ajusteProducto.stockActual ?? 0}</strong></small>
                  <small className="text-muted d-block">Stock mínimo: <strong>{ajusteProducto.stockMinimo ?? 0}</strong></small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cantidad <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    name="cantidad"
                    value={ajusteForm.cantidad}
                    onChange={handleAjusteChange}
                    placeholder="Usa valores positivos para entrada, negativos para salida"
                    disabled={ajustando}
                  />
                  <small className="text-muted">Ej: 10 para entrada, -5 para salida</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Motivo <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    name="motivo"
                    rows={3}
                    value={ajusteForm.motivo}
                    onChange={handleAjusteChange}
                    placeholder="Ej: Compra a proveedor, ajuste por merma, etc."
                    disabled={ajustando}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setAjusteProducto(null)}
                  disabled={ajustando}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
                  onClick={handleAjustar}
                  disabled={ajustando || !ajusteForm.cantidad || !ajusteForm.motivo.trim()}
                >
                  {ajustando && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  {ajustando ? 'Ajustando...' : 'Ajustar Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
