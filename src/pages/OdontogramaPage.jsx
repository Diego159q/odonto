import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { odontogramaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADOS = [
  { value: 'SANO', label: 'Sano', cssClass: 'sano' },
  { value: 'CARIES', label: 'Caries', cssClass: 'caries' },
  { value: 'AUSENTE', label: 'Ausente', cssClass: 'ausente' },
  { value: 'EXTRACCION_INDICADA', label: 'Extracción Indicada', cssClass: 'tratamiento-pendiente' },
  { value: 'EXTRACCION_REALIZADA', label: 'Extracción Realizada', cssClass: 'tratamiento-realizado' },
  { value: 'CORONA', label: 'Corona', cssClass: 'tratamiento-realizado' },
  { value: 'PROTESIS', label: 'Prótesis', cssClass: 'tratamiento-realizado' },
  { value: 'IMPLANTE', label: 'Implante', cssClass: 'tratamiento-realizado' },
  { value: 'RESINA', label: 'Resina', cssClass: 'tratamiento-realizado' },
  { value: 'ENDODONCIA', label: 'Endodoncia', cssClass: 'tratamiento-realizado' },
  { value: 'FRACTURA', label: 'Fractura', cssClass: 'caries' },
  { value: 'SELLANTE', label: 'Sellante', cssClass: 'tratamiento-realizado' },
  { value: 'TRATAMIENTO_PENDIENTE', label: 'Tratamiento Pendiente', cssClass: 'tratamiento-pendiente' },
  { value: 'TRATAMIENTO_REALIZADO', label: 'Tratamiento Realizado', cssClass: 'tratamiento-realizado' },
  { value: 'OBSERVACION', label: 'Observación', cssClass: 'observacion' },
];

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const getEstadoCSS = (estado) => {
  const found = ESTADOS.find((e) => e.value === estado);
  return found ? found.cssClass : 'sano';
};

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [odontogramaId, setOdontogramaId] = useState(null);
  const [piezas, setPiezas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState('SANO');
  const [selectedObservacion, setSelectedObservacion] = useState('');

  useEffect(() => {
    const fetchOdontograma = async () => {
      setLoading(true);
      try {
        const response = await odontogramaService.buscarPorPaciente(pacienteId);
        const data = response.data;
        setOdontogramaId(data.id);
        const piezasMap = {};
        if (data.detalles && Array.isArray(data.detalles)) {
          data.detalles.forEach((det) => {
            piezasMap[det.numeroPieza] = {
              estado: det.estado || 'SANO',
              observacion: det.observacion || '',
            };
          });
        }
        setPiezas(piezasMap);
      } catch {
        setOdontogramaId(null);
        setPiezas({});
      } finally {
        setLoading(false);
      }
    };
    fetchOdontograma();
  }, [pacienteId]);

  const getToothState = (num) => piezas[num] || { estado: 'SANO', observacion: '' };

  const openToothModal = (num) => {
    const state = getToothState(num);
    setSelectedTooth(num);
    setSelectedEstado(state.estado);
    setSelectedObservacion(state.observacion || '');
  };

  const handleSaveTooth = () => {
    if (!selectedTooth) return;
    setPiezas((prev) => ({
      ...prev,
      [selectedTooth]: { estado: selectedEstado, observacion: selectedObservacion },
    }));
    setSelectedTooth(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const detalles = Object.entries(piezas).map(([num, state]) => ({
        numeroPieza: Number(num),
        estado: state.estado,
        observacion: state.observacion || '',
      }));

      if (odontogramaId) {
        await odontogramaService.actualizarEstadoPieza(odontogramaId, { detalles });
        toast.success('Odontograma actualizado exitosamente');
      } else {
        const response = await odontogramaService.crear({
          pacienteId: Number(pacienteId),
          detalles,
        });
        setOdontogramaId(response.data.id);
        toast.success('Odontograma creado exitosamente');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar odontograma';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderTooth = (num) => {
    const state = getToothState(num);
    const cssClass = getEstadoCSS(state.estado);
    return (
      <div
        key={num}
        className={`tooth ${cssClass}`}
        onClick={() => openToothModal(num)}
        title={`Pieza ${num}: ${state.estado}`}
      >
        <span>{num}</span>
        {state.estado !== 'SANO' && (
          <small style={{ fontSize: '0.6rem', lineHeight: 1 }}>{state.estado.substring(0, 4)}</small>
        )}
      </div>
    );
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
          <i className="bi bi-grid-3x3-gap-fill me-2 text-primary"></i>Odontograma
        </h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            <i className="bi bi-save"></i> {saving ? 'Guardando...' : 'Guardar Odontograma'}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left"></i> Volver
          </button>
        </div>
      </div>

      <div className="odontograma-container">
        <div className="text-center mb-3">
          <h6 className="fw-bold text-muted mb-0">Arcada Superior</h6>
        </div>
        <div className="d-flex justify-content-center flex-wrap mb-4">
          {UPPER_TEETH.map(renderTooth)}
        </div>

        <div className="text-center mb-3">
          <h6 className="fw-bold text-muted mb-0">Arcada Inferior</h6>
        </div>
        <div className="d-flex justify-content-center flex-wrap mb-4">
          {LOWER_TEETH.map(renderTooth)}
        </div>

        <hr />
        <div className="row g-2 justify-content-center">
          <div className="col-auto"><strong className="text-muted small">Leyenda:</strong></div>
          {ESTADOS.map((est) => (
            <div key={est.value} className="col-auto">
              <span
                className={`tooth ${est.cssClass}`}
                style={{ width: 'auto', height: 'auto', padding: '2px 8px', margin: '2px', fontSize: '0.7rem', cursor: 'default' }}
              >
                {est.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedTooth !== null && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>
                  Pieza Dental #{selectedTooth}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTooth(null)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Estado de la Pieza</label>
                <div className="row g-2 mb-3">
                  {ESTADOS.map((est) => (
                    <div key={est.value} className="col-6 col-md-4">
                      <button
                        type="button"
                        className={`btn btn-sm w-100 border ${
                          selectedEstado === est.value ? 'btn-dental-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setSelectedEstado(est.value)}
                      >
                        {est.label}
                      </button>
                    </div>
                  ))}
                </div>
                <label className="form-label">Observación</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={selectedObservacion}
                  onChange={(e) => setSelectedObservacion(e.target.value)}
                  placeholder="Observación opcional sobre esta pieza"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedTooth(null)}>
                  Cancelar
                </button>
                <button className="btn btn-dental-primary" onClick={handleSaveTooth}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontogramaPage;
