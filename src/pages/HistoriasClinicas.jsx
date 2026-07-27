import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { historiaClinicaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const HistoriasClinicas = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewHistoria, setViewHistoria] = useState(null);

  useEffect(() => {
    const fetchHistorias = async () => {
      setLoading(true);
      try {
        const response = await historiaClinicaService.listarPorPaciente(pacienteId);
        const data = response.data;
        setHistorias(Array.isArray(data) ? data : data.content || []);
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar historias clínicas';
        toast.error(msg);
        setHistorias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorias();
  }, [pacienteId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const renderDetailItem = (label, value) => (
    <div className="mb-2">
      <small className="text-muted d-block">{label}</small>
      <strong>{value || '-'}</strong>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-file-medical-fill me-2 text-primary"></i>Historias Clínicas
        </h2>
        <Link
          to={`/historias-clinicas/nueva/${pacienteId}`}
          className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Nueva Historia Clínica
        </Link>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="text-muted">
            {historias.length > 0 ? `${historias.length} registro(s)` : 'Sin resultados'}
          </span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : historias.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-file-earmark-medical" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No hay historias clínicas registradas para este paciente</p>
            <Link to={`/historias-clinicas/nueva/${pacienteId}`} className="btn btn-dental-primary">
              Registrar primera historia clínica
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-modern">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Motivo Consulta</th>
                  <th>Diagnóstico</th>
                  <th>Odontólogo</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historias.map((hc) => (
                  <tr key={hc.id}>
                    <td>{formatDate(hc.fechaAtencion)}</td>
                    <td>{hc.motivoConsulta || '-'}</td>
                    <td>{hc.diagnosticoGeneral || '-'}</td>
                    <td>
                      {hc.odontologo
                        ? `${hc.odontologo.nombre || hc.odontologo.nombres || ''} ${hc.odontologo.apellidos || ''}`.trim() || '-'
                        : hc.odontologoNombre || '-'}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-info"
                          title="Ver detalle"
                          onClick={() => setViewHistoria(hc)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Editar"
                          onClick={() => navigate(`/historias-clinicas/${hc.id}/editar`)}
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

      {viewHistoria && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalle de Historia Clínica
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewHistoria(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">{renderDetailItem('Fecha de Atención', formatDate(viewHistoria.fechaAtencion))}</div>
                  <div className="col-md-6">{renderDetailItem('Odontólogo', viewHistoria.odontologo ? `${viewHistoria.odontologo.nombre || viewHistoria.odontologo.nombres || ''} ${viewHistoria.odontologo.apellidos || ''}`.trim() : '-')}</div>
                  <div className="col-12">{renderDetailItem('Motivo de Consulta', viewHistoria.motivoConsulta)}</div>
                  <div className="col-12">{renderDetailItem('Enfermedad Actual', viewHistoria.enfermedadActual)}</div>
                  <div className="col-md-6">{renderDetailItem('Antecedentes Personales', viewHistoria.antecedentesPersonales)}</div>
                  <div className="col-md-6">{renderDetailItem('Antecedentes Familiares', viewHistoria.antecedentesFamiliares)}</div>
                  <div className="col-md-6">{renderDetailItem('Alergias', viewHistoria.alergias || 'Ninguna')}</div>
                  <div className="col-md-6">{renderDetailItem('Enfermedades Sistémicas', viewHistoria.enfermedadesSistemicas || 'Ninguna')}</div>
                  <div className="col-md-3">{renderDetailItem('Presión Arterial', viewHistoria.presionArterial)}</div>
                  <div className="col-md-3">{renderDetailItem('Peso (kg)', viewHistoria.peso)}</div>
                  <div className="col-md-3">{renderDetailItem('Talla (cm)', viewHistoria.talla)}</div>
                  <div className="col-md-3">{renderDetailItem('Temperatura (°C)', viewHistoria.temperatura)}</div>
                  <div className="col-12">{renderDetailItem('Diagnóstico General', viewHistoria.diagnosticoGeneral)}</div>
                  {viewHistoria.observaciones && <div className="col-12">{renderDetailItem('Observaciones', viewHistoria.observaciones)}</div>}
                  {viewHistoria.recomendaciones && <div className="col-12">{renderDetailItem('Recomendaciones', viewHistoria.recomendaciones)}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewHistoria(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriasClinicas;
