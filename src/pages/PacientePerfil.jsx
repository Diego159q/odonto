import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { citaService, pacienteService, pagoService, tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import { buildWhatsAppUrl, patientFollowUpMessage, postCareMessage } from '../utils/noApiAutomation';

const TABS = [
  { key: 'expediente', label: 'Expediente', icon: 'folder_open' },
  { key: 'info', label: 'Datos', icon: 'badge' },
  { key: 'citas', label: 'Citas', icon: 'event_available' },
  { key: 'tratamientos', label: 'Tratamientos', icon: 'medical_services' },
  { key: 'pagos', label: 'Pagos', icon: 'payments' },
];

const normalize = (data) => data?.content || (Array.isArray(data) ? data : []);

const formatCurrency = (value) => {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(`${dateStr}${dateStr.includes?.('T') ? '' : 'T00:00:00'}`).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const getFullName = (paciente) => `${paciente?.nombres || ''} ${paciente?.apellidos || ''}`.trim() || 'Paciente';
const getInitials = (paciente) => getFullName(paciente).split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

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
        toast.error(error.response?.data?.message || 'Error al cargar perfil del paciente');
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    fetchPaciente();
  }, [id, navigate]);

  useEffect(() => {
    if (!paciente) return;
    const loadTabData = async () => {
      setSubLoading(true);
      try {
        const shouldLoadAll = activeTab === 'expediente';
        const requests = [];
        if (shouldLoadAll || activeTab === 'citas') requests.push(citaService.listar({ pacienteId: id, page: 0, size: 10 }));
        else requests.push(Promise.resolve(null));
        if (shouldLoadAll || activeTab === 'tratamientos') requests.push(tratamientoService.listar({ pacienteId: id, page: 0, size: 10 }));
        else requests.push(Promise.resolve(null));
        if (shouldLoadAll || activeTab === 'pagos') requests.push(pagoService.listar({ pacienteId: id, page: 0, size: 10 }));
        else requests.push(Promise.resolve(null));

        const [citasRes, tratamientosRes, pagosRes] = await Promise.all(requests);
        if (citasRes) setCitas(normalize(citasRes.data));
        if (tratamientosRes) setTratamientos(normalize(tratamientosRes.data));
        if (pagosRes) setPagos(normalize(pagosRes.data));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar datos del paciente');
      } finally {
        setSubLoading(false);
      }
    };
    loadTabData();
  }, [activeTab, paciente, id]);

  const age = useMemo(() => {
    if (!paciente?.fechaNacimiento) return null;
    const birth = new Date(paciente.fechaNacimiento);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) years -= 1;
    return years;
  }, [paciente]);

  const events = useMemo(() => ([
    ...citas.map((cita) => ({
      id: `cita-${cita.id}`,
      fecha: cita.fecha,
      icon: 'event_available',
      color: 'blue',
      tipo: 'Cita',
      titulo: cita.motivo || 'Atencion registrada',
      detalle: cita.estado || 'Sin estado',
    })),
    ...tratamientos.map((tratamiento) => ({
      id: `tratamiento-${tratamiento.id}`,
      fecha: tratamiento.fechaInicio,
      icon: 'medical_services',
      color: 'emerald',
      tipo: 'Tratamiento',
      titulo: tratamiento.nombre || tratamiento.descripcion || 'Tratamiento registrado',
      detalle: tratamiento.estado || 'Sin estado',
    })),
    ...pagos.map((pago) => ({
      id: `pago-${pago.id}`,
      fecha: pago.fecha,
      icon: 'payments',
      color: 'amber',
      tipo: 'Pago',
      titulo: pago.concepto || 'Pago registrado',
      detalle: formatCurrency(pago.monto),
    })),
  ]).filter((item) => item.fecha).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8), [citas, tratamientos, pagos]);

  const totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);

  const exportExpedientePdf = () => {
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(16);
    doc.text('Expediente DentalCare', 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Paciente: ${getFullName(paciente)}`, 14, y); y += 7;
    doc.text(`DNI: ${paciente.dni || '-'}`, 14, y); y += 7;
    doc.text(`Telefono: ${paciente.telefono || '-'}`, 14, y); y += 10;
    doc.text(`Alergias: ${paciente.alergias || 'Ninguna registrada'}`, 14, y); y += 7;
    doc.text(`Condiciones: ${paciente.enfermedadesPrevias || 'Ninguna registrada'}`, 14, y); y += 10;
    doc.text('Movimientos recientes', 14, y); y += 8;
    if (events.length === 0) doc.text('Sin movimientos registrados.', 14, y);
    events.forEach((item) => {
      if (y > 275) { doc.addPage(); y = 16; }
      doc.text(`${formatDate(item.fecha)} - ${item.tipo}: ${item.titulo} (${item.detalle})`, 14, y);
      y += 6;
    });
    doc.save(`expediente-${paciente.id}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span>
          <p className="mt-3 text-sm">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) return null;

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl shadow-black/20">
        <div className="absolute right-[-70px] top-[-90px] h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute left-[35%] bottom-[-120px] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="h-24 w-24 rounded-[2rem] border border-blue-500/30 bg-blue-500/15 flex items-center justify-center text-3xl font-['Geist'] font-black text-blue-300 shadow-xl shadow-blue-950/30">
              {getInitials(paciente)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Expediente clinico</p>
              <h1 className="mt-2 font-['Geist'] text-3xl lg:text-5xl font-black tracking-tight text-white">{getFullName(paciente)}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge icon="tag" label={`Codigo #${paciente.id}`} />
                <Badge icon="badge" label={paciente.dni ? `DNI ${paciente.dni}` : 'Sin DNI'} />
                <Badge icon="cake" label={age !== null ? `${age} anos` : 'Edad no registrada'} />
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold ${(paciente.estado || 'ACTIVO') === 'ACTIVO' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                  <span className="material-symbols-outlined text-sm">verified</span>{paciente.estado || 'ACTIVO'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/citas/nueva?pacienteId=${paciente.id}`)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 flex items-center gap-2"><span className="material-symbols-outlined text-lg">calendar_add_on</span>Nueva cita</button>
            <button onClick={() => navigate(`/odontograma/paciente/${paciente.id}`)} className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-sm font-bold text-teal-300 hover:bg-teal-500/20 flex items-center gap-2"><span className="material-symbols-outlined text-lg">dentistry</span>Odontograma</button>
            <button onClick={() => navigate(`/pacientes/${paciente.id}/editar`)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-lg">edit</span>Editar</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <MetricCard icon="phone" label="Telefono" value={paciente.telefono || '-'} color="blue" />
        <MetricCard icon="bloodtype" label="Tipo sangre" value={paciente.tipoSangre || '-'} color="rose" />
        <MetricCard icon="medical_information" label="Tratamientos" value={tratamientos.length} color="emerald" />
        <MetricCard icon="payments" label="Pagado visible" value={formatCurrency(totalPagos)} color="amber" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-12 xl:col-span-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${activeTab === tab.key ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                <span className="material-symbols-outlined text-base">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>

          {subLoading ? (
            <Panel><div className="py-16 text-center text-slate-500"><span className="material-symbols-outlined text-4xl text-blue-400 animate-spin">progress_activity</span><p className="mt-2">Cargando...</p></div></Panel>
          ) : activeTab === 'expediente' ? (
            <Panel title="Linea de tiempo clinica" icon="timeline">
              {events.length === 0 ? <EmptyState text="Sin movimientos recientes." /> : <div className="space-y-3">{events.map((item) => <TimelineItem key={item.id} item={item} />)}</div>}
            </Panel>
          ) : activeTab === 'info' ? (
            <Panel title="Datos personales y medicos" icon="badge">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Info label="Nombres" value={paciente.nombres || '-'} />
                <Info label="Apellidos" value={paciente.apellidos || '-'} />
                <Info label="DNI" value={paciente.dni || '-'} />
                <Info label="Nacimiento" value={formatDate(paciente.fechaNacimiento)} />
                <Info label="Sexo" value={paciente.sexo || '-'} />
                <Info label="Estado civil" value={paciente.estadoCivil || '-'} />
                <Info label="Email" value={paciente.email || '-'} />
                <Info label="Direccion" value={paciente.direccion || '-'} />
                <Info label="Alergias" value={paciente.alergias || 'Ninguna'} />
                <Info label="Medicamentos" value={paciente.medicamentosActuales || 'Ninguno'} />
              </div>
            </Panel>
          ) : activeTab === 'citas' ? (
            <ListPanel title="Historial de citas" icon="event_available" empty="Sin citas registradas" items={citas} render={(cita) => <TimelineItem item={{ fecha: cita.fecha, tipo: cita.estado || 'Cita', titulo: cita.motivo || 'Cita programada', detalle: `${cita.horaInicio || '--:--'} - ${cita.horaFin || '--:--'}`, icon: 'event', color: 'blue' }} />} />
          ) : activeTab === 'tratamientos' ? (
            <ListPanel title="Tratamientos" icon="medical_services" empty="Sin tratamientos registrados" items={tratamientos} render={(tratamiento) => <TimelineItem item={{ fecha: tratamiento.fechaInicio, tipo: tratamiento.estado || 'Tratamiento', titulo: tratamiento.nombre || tratamiento.descripcion || 'Tratamiento', detalle: tratamiento.descripcion || '-', icon: 'medical_services', color: 'emerald' }} />} />
          ) : (
            <ListPanel title="Pagos" icon="payments" empty="Sin pagos registrados" items={pagos} render={(pago) => <TimelineItem item={{ fecha: pago.fecha, tipo: pago.concepto || 'Pago', titulo: formatCurrency(pago.monto), detalle: pago.metodoPago || pago.estado || '-', icon: 'payments', color: 'amber' }} />} />
          )}
        </main>

        <aside className="col-span-12 xl:col-span-4 space-y-6">
          <Panel title="Alertas clinicas" icon="notification_important">
            <div className="space-y-3">
              <Alert label="Alergias" value={paciente.alergias || 'Ninguna registrada'} tone={paciente.alergias ? 'rose' : 'emerald'} />
              <Alert label="Condiciones" value={paciente.enfermedadesPrevias || 'Ninguna registrada'} tone={paciente.enfermedadesPrevias ? 'amber' : 'emerald'} />
              <Alert label="Medicamentos" value={paciente.medicamentosActuales || 'Ninguno registrado'} tone={paciente.medicamentosActuales ? 'blue' : 'emerald'} />
            </div>
          </Panel>

          <Panel title="Acciones rapidas" icon="bolt">
            <div className="grid gap-2">
              <QuickAction to={`/historias-clinicas/nueva/${paciente.id}`} icon="note_add" label="Nueva nota clinica" />
              <QuickAction to={`/odontograma/paciente/${paciente.id}`} icon="dentistry" label="Abrir odontograma" />
              <QuickAction to={`/citas/nueva?pacienteId=${paciente.id}`} icon="calendar_add_on" label="Programar cita" />
              <a href={buildWhatsAppUrl({ phone: paciente.telefono, message: patientFollowUpMessage(paciente) })} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 no-underline"><span className="material-symbols-outlined">chat</span>WhatsApp control</a>
              <a href={buildWhatsAppUrl({ phone: paciente.telefono, message: postCareMessage(paciente) })} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 no-underline"><span className="material-symbols-outlined">fact_check</span>Indicaciones post</a>
              <button onClick={exportExpedientePdf} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm font-bold text-slate-200 hover:bg-slate-700"><span className="material-symbols-outlined">picture_as_pdf</span>Exportar PDF</button>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

const Badge = ({ icon, label }) => <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 font-bold text-slate-300"><span className="material-symbols-outlined text-sm">{icon}</span>{label}</span>;

const MetricCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-5 flex items-center gap-4 shadow-xl shadow-black/10"><div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${colors[color]}`}><span className="material-symbols-outlined">{icon}</span></div><div className="min-w-0"><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 truncate font-['Geist'] text-xl font-bold text-white">{value}</p></div></div>;
};

const Panel = ({ title, icon, children }) => <section className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-5 shadow-xl shadow-black/10">{title && <h2 className="mb-4 flex items-center gap-2 font-['Geist'] text-lg font-bold text-white"><span className="material-symbols-outlined text-blue-400">{icon}</span>{title}</h2>}{children}</section>;

const TimelineItem = ({ item }) => {
  const colors = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return <div className="grid grid-cols-[48px_1fr] gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4"><div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${colors[item.color] || colors.blue}`}><span className="material-symbols-outlined text-lg">{item.icon}</span></div><div><div className="flex flex-wrap items-center justify-between gap-2"><p className="m-0 font-bold text-white">{item.titulo}</p><span className="text-[11px] text-slate-500">{formatDate(item.fecha)}</span></div><p className="m-0 mt-1 text-xs font-bold uppercase tracking-wider text-blue-400">{item.tipo}</p><p className="m-0 mt-1 text-sm text-slate-400">{item.detalle}</p></div></div>;
};

const Info = ({ label, value }) => <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4"><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 mt-1 font-semibold text-white">{value}</p></div>;

const Alert = ({ label, value, tone }) => {
  const tones = { rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300', amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300', blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300', emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><p className="m-0 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p><p className="m-0 mt-1 text-sm font-semibold">{value}</p></div>;
};

const QuickAction = ({ to, icon, label }) => <Link to={to} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm font-bold text-slate-200 hover:bg-slate-700 no-underline"><span className="material-symbols-outlined text-blue-400">{icon}</span>{label}</Link>;

const ListPanel = ({ title, icon, items, empty, render }) => <Panel title={title} icon={icon}>{items.length === 0 ? <EmptyState text={empty} /> : <div className="space-y-3">{items.map((item) => <React.Fragment key={item.id}>{render(item)}</React.Fragment>)}</div>}</Panel>;

const EmptyState = ({ text }) => <div className="py-12 text-center text-slate-500"><span className="material-symbols-outlined text-5xl text-slate-600">inbox</span><p className="mt-2 text-sm">{text}</p></div>;

export default PacientePerfil;
