import React, { useState } from 'react';
import { reporteService } from '../services/endpoints';
import { toast } from 'react-toastify';

const TIPOS_REPORTE = [
  { value: '', label: 'Seleccionar tipo de reporte...' },
  { value: 'PACIENTES', label: 'Pacientes' },
  { value: 'CITAS', label: 'Citas' },
  { value: 'TRATAMIENTOS', label: 'Tratamientos' },
  { value: 'INGRESOS', label: 'Ingresos' },
  { value: 'PAGOS', label: 'Pagos' },
  { value: 'DEUDAS', label: 'Deudas' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'PRODUCTOS_VENCIDOS', label: 'Productos Vencidos' },
  { value: 'MENSUAL', label: 'Reporte Mensual' },
  { value: 'ANUAL', label: 'Reporte Anual' },
];

const getAdditionalFilters = (tipo) => {
  switch (tipo) {
    case 'CITAS':
      return { paciente: '', odontologo: '', estado: '' };
    case 'PAGOS':
      return { paciente: '', metodoPago: '' };
    case 'DEUDAS':
      return { paciente: '' };
    case 'INGRESOS':
      return { metodoPago: '' };
    case 'TRATAMIENTOS':
      return { estado: '' };
    default:
      return {};
  }
};

const getFilterFields = (tipo) => {
  switch (tipo) {
    case 'CITAS':
      return [
        { key: 'paciente', label: 'Paciente', type: 'text', placeholder: 'Nombre del paciente' },
        { key: 'odontologo', label: 'Odontólogo', type: 'text', placeholder: 'Nombre del odontólogo' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['', 'PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA', 'NO_ASISTIO'] },
      ];
    case 'PAGOS':
      return [
        { key: 'paciente', label: 'Paciente', type: 'text', placeholder: 'Nombre del paciente' },
        { key: 'metodoPago', label: 'Método de Pago', type: 'text', placeholder: 'Efectivo, tarjeta, etc.' },
      ];
    case 'DEUDAS':
      return [
        { key: 'paciente', label: 'Paciente', type: 'text', placeholder: 'Nombre del paciente' },
      ];
    case 'INGRESOS':
      return [
        { key: 'metodoPago', label: 'Método de Pago', type: 'text', placeholder: 'Efectivo, tarjeta, etc.' },
      ];
    case 'TRATAMIENTOS':
      return [
        { key: 'estado', label: 'Estado', type: 'select', options: ['', 'PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'] },
      ];
    default:
      return [];
  }
};

const Reportes = () => {
  const [tipo, setTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtros, setFiltros] = useState({});
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState('');
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState('');

  const handleTipoChange = (e) => {
    const newTipo = e.target.value;
    setTipo(newTipo);
    setResultados(null);
    setError('');
    setFiltros(getAdditionalFilters(newTipo));
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const buildParams = () => {
    const params = {};
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    return params;
  };

  const handleGenerate = async () => {
    if (!tipo) {
      toast.warning('Seleccione un tipo de reporte');
      return;
    }
    setLoading(true);
    setError('');
    setResultados(null);
    try {
      const params = buildParams();
      const response = await reporteService.generate(tipo, params);
      setResultados(response.data);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al generar reporte';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!tipo) {
      toast.warning('Primero genere un reporte');
      return;
    }
    setExportLoading(format);
    try {
      const params = buildParams();
      let response;
      const label = format.toUpperCase();
      if (format === 'pdf') response = await reporteService.exportPdf(tipo, params);
      else if (format === 'excel') response = await reporteService.exportExcel(tipo, params);
      else response = await reporteService.exportCsv(tipo, params);

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipo.toLowerCase()}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Reporte exportado en ${label}`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Error al exportar en ${format.toUpperCase()}`);
    } finally {
      setExportLoading('');
    }
  };

  const filterFields = getFilterFields(tipo);
  const hasResults = resultados !== null;
  const isArray = Array.isArray(resultados);
  const isObject = typeof resultados === 'object' && resultados !== null && !isArray;
  const columns = hasResults && isArray && resultados.length > 0
    ? Object.keys(resultados[0]).filter((k) => k !== 'id')
    : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-file-earmark-bar-graph-fill me-2 text-primary"></i>Reportes
        </h2>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Tipo de Reporte <span className="text-danger">*</span></label>
              <select className="form-select" value={tipo} onChange={handleTipoChange}>
                {TIPOS_REPORTE.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Desde</label>
              <input type="date" className="form-control" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Hasta</label>
              <input type="date" className="form-control" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>

            {filterFields.map((field) => (
              <div key={field.key} className="col-md-3">
                <label className="form-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select className="form-select" name={field.key} value={filtros[field.key] || ''} onChange={handleFiltroChange}>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt || `Todos`}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    name={field.key}
                    value={filtros[field.key] || ''}
                    onChange={handleFiltroChange}
                    placeholder={field.placeholder || ''}
                  />
                )}
              </div>
            ))}

            <div className="col-12 d-flex gap-2 mt-3">
              <button className="btn btn-dental-primary d-inline-flex align-items-center gap-2" onClick={handleGenerate} disabled={loading || !tipo}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-play-fill"></i>
                )}
                {loading ? 'Generando...' : 'Generar'}
              </button>
              {hasResults && (
                <>
                  <button className="btn btn-danger d-inline-flex align-items-center gap-2" onClick={() => handleExport('pdf')} disabled={!!exportLoading}>
                    {exportLoading === 'pdf' ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-filetype-pdf"></i>}
                    PDF
                  </button>
                  <button className="btn btn-success d-inline-flex align-items-center gap-2" onClick={() => handleExport('excel')} disabled={!!exportLoading}>
                    {exportLoading === 'excel' ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-file-earmark-excel"></i>}
                    Excel
                  </button>
                  <button className="btn btn-secondary d-inline-flex align-items-center gap-2" onClick={() => handleExport('csv')} disabled={!!exportLoading}>
                    {exportLoading === 'csv' ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-filetype-csv"></i>}
                    CSV
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Generando reporte...</span>
            </div>
            <p className="mt-2 text-muted">Generando reporte, por favor espere...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
            <p className="mt-3 text-danger">{error}</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-5">
            <i className="bi bi-file-earmark-bar-graph" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">Seleccione un tipo de reporte y genere los resultados</p>
          </div>
        ) : isArray && resultados.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No se encontraron resultados para este reporte</p>
          </div>
        ) : isArray ? (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={row.id || idx}>
                    {columns.map((col) => (
                      <td key={col}>{row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isObject ? (
          <div className="p-4">
            {Object.entries(resultados).map(([key, value]) => (
              <div key={key} className="row mb-2">
                <div className="col-4 text-muted fw-semibold">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                </div>
                <div className="col-8">
                  {value !== null && value !== undefined ? String(value) : '-'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-muted">Resultado: {String(resultados)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
