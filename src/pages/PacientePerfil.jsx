import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pacienteService, citaService, tratamientoService, pagoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const TABS = [
  { key: 'info', label: 'Información Personal', icon: 'bi-person-badge' },
  { key: 'citas', label: 'Historial de Citas', icon: 'bi-calendar-check' },
  { key: 'clinicas', label: 'Historias Clínicas', icon: 'bi-file-medical' },
  { key: 'odontograma', label: 'Odontograma', icon: 'bi-grid-3x3-gap-fill' },
  { key: 'tratamientos', label: 'Tratamientos', icon: 'bi-heart-pulse' },
  { key: 'pagos', label: 'Pagos', icon: 'bi-cash-coin' },
];

const PacientePerfil = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  const [citas, setCitas] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchPaciente = async () => {
      setLoading(true);
      try {
        const response = await pacienteService.buscarPorId(id);
        setPaciente(response.data);
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar perfil del paciente';
        toast.error(msg);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    fetchPaciente();
  }, [id, navigate]);

  useEffect(() => {
    if (!paciente || activeTab === 'info') return;
    const loadTabData = async () => {
      setSubLoading(true);
      try {
        if (activeTab === 'citas') {
          const res = await citaService.listar({ pacienteId: id, page: 0, size: 10 });
          setCitas(res.data.content || res.data || []);
        } else if (activeTab === 'tratamientos') {
          const res = await tratamientoService.listar({ pacienteId: id, page: 0, size: 10 });
          setTratamientos(res.data.content || res.data || []);
        } else if (activeTab === 'pagos') {
          const res = await pagoService.listar({ pacienteId: id, page: 0, size: 10 });
          setPagos(res.data.content || res.data || []);
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al cargar datos';
        toast.error(msg);
      } finally {
        setSubLoading(false);
      }
    };
    loadTabData();
  }, [activeTab, paciente, id]);

  const calculateAge = () => {
    if (!paciente?.fechaNacimiento) return null;
    const birth = new Date(paciente.fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const renderEstadoBadge = (estado) => {
    const map = {
      ACTIVO: 'badge-activo',
      INACTIVO: 'badge-inactivo',
      CONFIRMADA: 'badge-confirmada',
      PENDIENTE: 'badge-pendiente',
      ATENDIDA: 'badge-atendida',
      CANCELADA: 'badge-cancelada',
      NO_ASISTIO: 'badge-no_asistio',
      EN_PROCESO: 'badge-en_proceso',
      TERMINADO: 'badge-terminado',
      BORRADOR: 'badge-borrador',
    };
    const cls = map[estado] || 'badge-activo';
    return <span className={`badge badge-status ${cls}`}>{estado}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    if (value == null) return '$0';
    return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const infoFields = [
    { label: 'Nombres', value: paciente?.nombres },
    { label: 'Apellidos', value: paciente?.apellidos },
    { label: 'DNI', value: paciente?.dni },
    { label: 'Fecha de Nacimiento', value: formatDate(paciente?.fechaNacimiento) },
    { label: 'Edad', value: calculateAge() !== null ? `${calculateAge()} años` : '-' },
    { label: 'Sexo', value: paciente?.sexo || '-' },
    { label: 'Estado Civil', value: paciente?.estadoCivil || '-' },
    { label: 'Tipo de Sangre', value: paciente?.tipoSangre || '-' },
    { label: 'Teléfono', value: paciente?.telefono },
    { label: 'Email', value: paciente?.email },
    { label: 'Dirección', value: paciente?.direccion || '-' },
    { label: 'Distrito', value: paciente?.distrito || '-' },
    { label: 'Ciudad', value: paciente?.ciudad || '-' },
    { label: 'Contacto de Emergencia', value: paciente?.contactoEmergencia || '-' },
    { label: 'Tel. Emergencia', value: paciente?.telefonoEmergencia || '-' },
    { label: 'Ocupación', value: paciente?.ocupacion || '-' },
    { label: 'Alergias', value: paciente?.alergias || 'Ninguna' },
    { label: 'Enfermedades Previas', value: paciente?.enfermedadesPrevias || 'Ninguna' },
    { label: 'Medicamentos Actuales', value: paciente?.medicamentosActuales || 'Ninguno' },
    { label: 'Estado', value: renderEstadoBadge(paciente?.estado) },
  ];

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

  if (!paciente) {
    return (
      <div className="fade-in">
        <div className="loading-container">
          <div className="text-center">
            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3 text-muted">Paciente no encontrado</p>
            <button className="btn btn-dental-primary mt-2" onClick={() => navigate('/pacientes')}>
              Volver a Pacientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title mb-1">
            <i className="bi bi-person-fill me-2 text-primary"></i>
            {paciente.nombres} {paciente.apellidos}
          </h2>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Código: #{paciente.id}</span>
            {renderEstadoBadge(paciente.estado)}
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-dental-success d-inline-flex align-items-center gap-2"
            onClick={() => navigate(`/citas/nueva?pacienteId=${paciente.id}`)}
          >
            <i className="bi bi-calendar-plus"></i> Nueva Cita
          </button>
          <button
            className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
            onClick={() => navigate(`/pacientes/${paciente.id}/editar`)}
          >
            <i className="bi bi-pencil"></i> Editar
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs nav-tabs-dental">
        {TABS.map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`bi ${tab.icon} me-1`}></i> {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === 'info' && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <i className="bi bi-info-circle-fill me-2 text-primary"></i>Datos Generales
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {infoFields.map((field, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="mb-0">
                        <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>{field.label}</small>
                        <span className="fw-medium">{field.value || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <i className="bi bi-chat-dots-fill me-2 text-primary"></i>Observaciones
              </div>
              <div className="card-body p-4">
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {paciente.observaciones || 'Sin observaciones registradas'}
                </p>
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-header">
                <i className="bi bi-activity me-2 text-primary"></i>Información Médica
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Alergias</small>
                  <span>{paciente.alergias || 'Ninguna'}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Enfermedades Previas</small>
                  <span>{paciente.enfermedadesPrevias || 'Ninguna'}</span>
                </div>
                <div className="mb-0">
                  <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Medicamentos Actuales</small>
                  <span>{paciente.medicamentosActuales || 'Ninguno'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'citas' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-calendar-check me-2 text-primary"></i>Historial de Citas</span>
            <Link to={`/citas/nueva?pacienteId=${paciente.id}`} className="btn btn-sm btn-dental-primary">
              <i className="bi bi-plus-lg"></i> Nueva Cita
            </Link>
          </div>
          <div className="card-body p-0">
            {subLoading ? (
              <div className="loading-container" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : citas.length === 0 ? (
              <p className="text-center text-muted py-4 mb-0">No hay citas registradas</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-modern mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Motivo</th>
                      <th>Odontóloga</th>
                      <th>Estado</th>
                      <th className="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citas.map((cita) => (
                      <tr key={cita.id}>
                        <td>{formatDate(cita.fecha)}</td>
                        <td>{cita.hora || '-'}</td>
                        <td>{cita.motivo || '-'}</td>
                        <td>{cita.odontologaNombre || cita.odontologa || '-'}</td>
                        <td>{renderEstadoBadge(cita.estado)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/citas/${cita.id}`)}
                            title="Ver cita"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'clinicas' && (
        <div className="card">
          <div className="card-header">
            <i className="bi bi-file-medical me-2 text-primary"></i>Historias Clínicas
          </div>
          <div className="card-body text-center py-5">
            <i className="bi bi-file-earmark-medical" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">Accede al módulo de historias clínicas para este paciente</p>
            <Link
              to={`/historias-clinicas/paciente/${paciente.id}`}
              className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-right-circle"></i> Ir a Historias Clínicas
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'odontograma' && (
        <div className="card">
          <div className="card-header">
            <i className="bi bi-grid-3x3-gap-fill me-2 text-primary"></i>Odontograma
          </div>
          <div className="card-body text-center py-5">
            <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">Accede al odontograma dental de este paciente</p>
            <Link
              to={`/odontograma/paciente/${paciente.id}`}
              className="btn btn-dental-primary d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-right-circle"></i> Ir a Odontograma
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'tratamientos' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><i className="bi bi-heart-pulse me-2 text-primary"></i>Tratamientos</span>
            <Link to={`/tratamientos/nuevo?pacienteId=${paciente.id}`} className="btn btn-sm btn-dental-success">
              <i className="bi bi-plus-lg"></i> Nuevo Tratamiento
            </Link>
          </div>
          <div className="card-body p-0">
            {subLoading ? (
              <div className="loading-container" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : tratamientos.length === 0 ? (
              <p className="text-center text-muted py-4 mb-0">No hay tratamientos registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-modern mb-0">
                  <thead>
                    <tr>
                      <th>Tratamiento</th>
                      <th>Diagnóstico</th>
                      <th>Fecha Inicio</th>
                      <th>Estado</th>
                      <th className="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tratamientos.map((trat) => (
                      <tr key={trat.id}>
                        <td>{trat.nombre || trat.descripcion || '-'}</td>
                        <td>{trat.diagnostico || '-'}</td>
                        <td>{formatDate(trat.fechaInicio)}</td>
                        <td>{renderEstadoBadge(trat.estado)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/tratamientos/${trat.id}`)}
                            title="Ver tratamiento"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pagos' && (
        <div className="card">
          <div className="card-header">
            <i className="bi bi-cash-coin me-2 text-primary"></i>Historial de Pagos
          </div>
          <div className="card-body p-0">
            {subLoading ? (
              <div className="loading-container" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : pagos.length === 0 ? (
              <p className="text-center text-muted py-4 mb-0">No hay pagos registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-modern mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{formatDate(pago.fecha)}</td>
                        <td>{pago.concepto || '-'}</td>
                        <td className="fw-semibold">{formatCurrency(pago.monto)}</td>
                        <td>{pago.metodoPago || '-'}</td>
                        <td>{renderEstadoBadge(pago.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PacientePerfil;
