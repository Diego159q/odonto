import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pacienteService, citaService, tratamientoService, pagoService } from '../services/endpoints';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';

const TABS = [
  { key: 'expediente', label: 'Expediente', icon: 'bi-folder2-open' },
  { key: 'info', label: 'Datos', icon: 'bi-person-badge' },
  { key: 'citas', label: 'Historial de Citas', icon: 'bi-calendar-check' },
  { key: 'clinicas', label: 'Historias Clinicas', icon: 'bi-file-medical' },
  { key: 'odontograma', label: 'Odontograma', icon: 'bi-grid-3x3-gap-fill' },
  { key: 'tratamientos', label: 'Tratamientos', icon: 'bi-heart-pulse' },
  { key: 'pagos', label: 'Pagos', icon: 'bi-cash-coin' },
];

const PacientePerfil = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expediente');

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
    if (!paciente || activeTab === 'info' || activeTab === 'clinicas' || activeTab === 'odontograma') return;
    const loadTabData = async () => {
      setSubLoading(true);
      try {
        if (activeTab === 'expediente') {
          const [citasRes, tratamientosRes, pagosRes] = await Promise.all([
            citaService.listar({ pacienteId: id, page: 0, size: 10 }),
            tratamientoService.listar({ pacienteId: id, page: 0, size: 10 }),
            pagoService.listar({ pacienteId: id, page: 0, size: 10 }),
          ]);
          setCitas(citasRes.data.content || citasRes.data || []);
          setTratamientos(tratamientosRes.data.content || tratamientosRes.data || []);
          setPagos(pagosRes.data.content || pagosRes.data || []);
        } else if (activeTab === 'citas') {
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

  const cleanPhone = (phone) => String(phone || '').replace(/\D/g, '');

  const getWhatsappUrl = () => {
    const phone = cleanPhone(paciente?.telefono);
    const text = encodeURIComponent(`Hola ${paciente?.nombres || ''}, le escribimos de DentalCare para coordinar su atencion.`);
    return phone ? `https://wa.me/51${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  const exportExpedientePdf = () => {
    const doc = new jsPDF();
    const fullName = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();
    let y = 16;
    doc.setFontSize(16);
    doc.text('Expediente DentalCare', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Paciente: ${fullName || '-'}`, 14, y); y += 7;
    doc.text(`Telefono: ${paciente.telefono || '-'}`, 14, y); y += 7;
    doc.text(`DNI: ${paciente.dni || '-'}`, 14, y); y += 10;
    doc.setFontSize(13);
    doc.text('Datos importantes', 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Alergias: ${paciente.alergias || 'Ninguna registrada'}`, 14, y); y += 6;
    doc.text(`Condiciones: ${paciente.enfermedadesPrevias || 'Ninguna registrada'}`, 14, y); y += 6;
    doc.text(`Medicamentos: ${paciente.medicamentosActuales || 'Ninguno registrado'}`, 14, y); y += 10;
    doc.setFontSize(13);
    doc.text('Movimientos recientes', 14, y); y += 8;
    doc.setFontSize(10);
    if (expedienteEventos.length === 0) {
      doc.text('Sin movimientos registrados.', 14, y);
    } else {
      expedienteEventos.forEach((item) => {
        if (y > 275) { doc.addPage(); y = 16; }
        doc.text(`${formatDate(item.fecha)} - ${item.tipo}: ${item.titulo} (${item.detalle})`, 14, y);
        y += 6;
      });
    }
    doc.save(`expediente-${paciente.id}.pdf`);
  };
  const expedienteEventos = [
    ...citas.map((cita) => ({
      id: `cita-${cita.id}`,
      fecha: cita.fecha,
      icon: 'bi-calendar-check',
      color: 'primary',
      tipo: 'Cita',
      titulo: cita.motivo || 'Atencion registrada',
      detalle: cita.estado || 'Sin estado',
    })),
    ...tratamientos.map((tratamiento) => ({
      id: `tratamiento-${tratamiento.id}`,
      fecha: tratamiento.fechaInicio,
      icon: 'bi-heart-pulse',
      color: 'success',
      tipo: 'Tratamiento',
      titulo: tratamiento.nombre || tratamiento.descripcion || 'Tratamiento registrado',
      detalle: tratamiento.estado || 'Sin estado',
    })),
    ...pagos.map((pago) => ({
      id: `pago-${pago.id}`,
      fecha: pago.fecha,
      icon: 'bi-cash-coin',
      color: 'warning',
      tipo: 'Pago',
      titulo: pago.concepto || 'Pago registrado',
      detalle: formatCurrency(pago.monto),
    })),
  ]
    .filter((item) => item.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 8);
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

      {activeTab === 'expediente' && (
        <div className="expediente-grid">
          <div className="expediente-main">
            <div className="card expediente-summary-card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                  <div>
                    <span className="expediente-kicker">Expediente del paciente</span>
                    <h3 className="expediente-name">{paciente.nombres} {paciente.apellidos}</h3>
                    <p className="text-muted mb-0">
                      {paciente.telefono || 'Sin telefono'} {paciente.dni ? `- DNI ${paciente.dni}` : ''}
                    </p>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link to={`/historias-clinicas/nueva/${paciente.id}`} className="btn btn-dental-primary d-inline-flex align-items-center gap-2">
                      <i className="bi bi-file-medical"></i> Nueva nota clinica
                    </Link>
                    <a href={getWhatsappUrl()} target="_blank" rel="noreferrer" className="btn btn-outline-success d-inline-flex align-items-center gap-2">
                      <i className="bi bi-whatsapp"></i> WhatsApp
                    </a>
                    <button type="button" onClick={exportExpedientePdf} className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                      <i className="bi bi-filetype-pdf"></i> PDF
                    </button>
                    <Link to={`/pacientes/${paciente.id}/editar`} className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                      <i className="bi bi-pencil"></i> Actualizar datos
                    </Link>
                  </div>
                </div>

                <div className="expediente-alerts mt-4">
                  <div className="expediente-alert">
                    <small>Alergias</small>
                    <strong>{paciente.alergias || 'Ninguna registrada'}</strong>
                  </div>
                  <div className="expediente-alert">
                    <small>Condiciones</small>
                    <strong>{paciente.enfermedadesPrevias || 'Ninguna registrada'}</strong>
                  </div>
                  <div className="expediente-alert">
                    <small>Medicamentos</small>
                    <strong>{paciente.medicamentosActuales || 'Ninguno registrado'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span><i className="bi bi-clock-history me-2 text-primary"></i>Linea de tiempo reciente</span>
                {subLoading && <span className="spinner-border spinner-border-sm text-primary" role="status"></span>}
              </div>
              <div className="card-body p-0">
                {expedienteEventos.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-journal-medical" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                    <p className="mt-3 text-muted mb-3">Todavia no hay movimientos en este expediente</p>
                    <Link to={`/historias-clinicas/nueva/${paciente.id}`} className="btn btn-dental-primary">
                      Registrar primera nota
                    </Link>
                  </div>
                ) : (
                  <div className="expediente-timeline">
                    {expedienteEventos.map((item) => (
                      <div key={item.id} className="expediente-event">
                        <div className={`expediente-event-icon text-${item.color}`}>
                          <i className={`bi ${item.icon}`}></i>
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <strong>{item.titulo}</strong>
                            <span className="badge bg-light text-dark">{item.tipo}</span>
                          </div>
                          <small className="text-muted">{formatDate(item.fecha)} - {item.detalle}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="expediente-side">
            <div className="card">
              <div className="card-header">
                <i className="bi bi-lightning-charge-fill me-2 text-primary"></i>Acciones rapidas
              </div>
              <div className="list-group list-group-flush expediente-actions">
                <Link to={`/citas/nueva?pacienteId=${paciente.id}`} className="list-group-item list-group-item-action">
                  <i className="bi bi-calendar-plus"></i> Agendar cita
                </Link>
                <Link to={`/tratamientos/nuevo?pacienteId=${paciente.id}`} className="list-group-item list-group-item-action">
                  <i className="bi bi-heart-pulse"></i> Nuevo tratamiento
                </Link>
                <Link to={`/historias-clinicas/paciente/${paciente.id}`} className="list-group-item list-group-item-action">
                  <i className="bi bi-file-medical"></i> Ver historias clinicas
                </Link>
                <Link to={`/odontograma/paciente/${paciente.id}`} className="list-group-item list-group-item-action">
                  <i className="bi bi-grid-3x3-gap-fill"></i> Odontograma
                </Link>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <i className="bi bi-sticky-fill me-2 text-primary"></i>Notas importantes
              </div>
              <div className="card-body">
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {paciente.observaciones || 'Sin notas importantes. Puedes agregarlas editando el paciente.'}
                </p>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <i className="bi bi-paperclip me-2 text-primary"></i>Documentos y fotos
              </div>
              <div className="card-body">
                <div className="expediente-upload-placeholder">
                  <i className="bi bi-cloud-arrow-up"></i>
                  <strong>Fotos, radiografias o expedientes antiguos</strong>
                  <small>Listo para conectar almacenamiento. Por ahora puedes guardar el resumen en notas clinicas.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
