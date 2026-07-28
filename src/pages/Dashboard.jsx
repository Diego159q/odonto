import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, citaService, pagoService } from '../services/endpoints';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import AiXrayModal from '../components/AiXrayModal';
import { appointmentReminderMessage, buildWhatsAppUrl, downloadAppointmentIcs, getPatientNameFrom, getPatientPhoneFrom, paymentReminderMessage } from '../utils/noApiAutomation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const statCards = [
  { key: 'citasDelDia', label: 'Citas hoy', icon: 'event_available', accent: 'blue', hint: '+ operativo' },
  { key: 'citasPendientes', label: 'Pendientes', icon: 'pending_actions', accent: 'amber', hint: 'por confirmar' },
  { key: 'totalPacientes', label: 'Pacientes', icon: 'group', accent: 'emerald', hint: 'base activa' },
  { key: 'ingresosDelDia', label: 'Cobrado hoy', icon: 'payments', accent: 'purple', hint: 'caja diaria' },
];

const quickActions = [
  { to: '/calendario-citas', icon: 'calendar_add_on', label: 'Agendar cita', hint: 'Abrir agenda' },
  { to: '/pacientes/nuevo', icon: 'person_add', label: 'Nuevo paciente', hint: 'Registrar ficha' },
  { to: '/pacientes', icon: 'manage_search', label: 'Buscar paciente', hint: 'Ver expediente' },
  { to: '/pagos', icon: 'point_of_sale', label: 'Registrar pago', hint: 'Control de saldos' },
];

const accentClasses = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const formatCurrency = (value) => {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const offset = tomorrow.getTimezoneOffset();
  return new Date(tomorrow.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const normalizeList = (data) => (Array.isArray(data) ? data : data?.content || []);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasManana, setCitasManana] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getDashboard();
        setData(response.data);
      } catch (err) {
        const msg = err.response?.data?.message || 'Error al cargar el dashboard';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const loadHomeWork = async () => {
      setHomeLoading(true);
      const today = getToday();
      const tomorrow = getTomorrow();
      try {
        const [citasRes, citasMananaRes, deudasRes] = await Promise.allSettled([
          citaService.listar({ fechaDesde: today, fechaHasta: today, page: 0, size: 6 }),
          citaService.listar({ fechaDesde: tomorrow, fechaHasta: tomorrow, page: 0, size: 6 }),
          pagoService.deudasPendientes(),
        ]);
        if (citasRes.status === 'fulfilled') setCitasHoy(normalizeList(citasRes.value.data));
        if (citasMananaRes.status === 'fulfilled') setCitasManana(normalizeList(citasMananaRes.value.data));
        if (deudasRes.status === 'fulfilled') setDeudas(normalizeList(deudasRes.value.data).slice(0, 6));
      } finally {
        setHomeLoading(false);
      }
    };
    loadHomeWork();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span>
          <p className="mt-3 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-rose-400">warning</span>
          <p className="mt-3 text-slate-200">{error}</p>
          <button className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const d = data || {};
  const ingresosMensuales = d.ingresosMensuales || [];
  const citasAtendidas = d.citasAtendidas ?? 0;
  const citasCanceladas = d.citasCanceladas ?? 0;
  const pacientesPorMes = d.pacientesPorMes || [];
  const getValue = (key) => (key.startsWith('ingresos') ? formatCurrency(d[key]) : d[key] ?? 0);

  const chartText = '#CBD5E1';
  const chartGrid = 'rgba(148, 163, 184, 0.14)';
  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: chartText } },
    scales: {
      y: { beginAtZero: true, grid: { color: chartGrid }, ticks: { color: chartText } },
      x: { grid: { display: false }, ticks: { color: chartText } },
    },
  };
  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: chartText, padding: 18, usePointStyle: true } } },
    cutout: '65%',
  };
  const barData = {
    labels: ingresosMensuales.map((item) => item.mes || ''),
    datasets: [{ label: 'Ingresos', data: ingresosMensuales.map((item) => item.total || 0), backgroundColor: '#2563EB', borderRadius: 8 }],
  };
  const doughnutData = {
    labels: ['Atendidas', 'Canceladas'],
    datasets: [{ data: [citasAtendidas, citasCanceladas], backgroundColor: ['#10B981', '#F43F5E'], borderWidth: 0 }],
  };
  const lineData = {
    labels: pacientesPorMes.map((item) => item.mes || ''),
    datasets: [{ label: 'Pacientes', data: pacientesPorMes.map((item) => item.total || 0), fill: true, backgroundColor: 'rgba(14, 165, 233, 0.13)', borderColor: '#38BDF8', tension: 0.4, pointBackgroundColor: '#38BDF8' }],
  };

  return (
    <div className="p-8 space-y-8 animate-in text-slate-300">
      <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Panel principal</p>
          <h1 className="font-['Geist'] text-3xl lg:text-[40px] font-bold text-white tracking-tight leading-tight mt-2">Resumen de la clinica</h1>
          <p className="text-slate-400 mt-1">Indicadores, agenda y alertas operativas en un solo lugar.</p>
        </div>
        <div className="bg-[#1E293B] px-4 py-2.5 rounded-xl flex items-center gap-2.5 border border-slate-700/60">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">calendar_today</span>
          <span className="font-['Geist'] text-sm font-medium text-slate-200">{new Date().toLocaleDateString('es-PE')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.key} className="bg-[#1E293B] p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 hover:-translate-y-1 transition-all shadow-xl shadow-black/10">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-xl border ${accentClasses[card.accent]}`}>
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">{card.hint}</span>
            </div>
            <p className="text-slate-400 font-['Geist'] text-xs font-semibold uppercase tracking-wider">{card.label}</p>
            <p className="font-['Geist'] text-3xl font-bold text-white mt-1">{getValue(card.key)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to} className="group rounded-2xl border border-slate-700/50 bg-[#1E293B] p-4 text-slate-300 no-underline hover:border-blue-500/50 hover:text-white transition-all">
            <span className="material-symbols-outlined text-blue-400 text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
            <p className="mt-3 mb-1 font-semibold text-white">{action.label}</p>
            <p className="m-0 text-xs text-slate-400">{action.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-['Geist'] text-xl font-bold text-white">Ingresos mensuales</h3>
                <p className="text-sm text-slate-400">Evolucion financiera del consultorio.</p>
              </div>
            </div>
            {ingresosMensuales.length > 0 ? <Bar data={barData} options={chartOptions} /> : <p className="py-12 text-center text-slate-500">No hay datos disponibles</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <WorkCard title="Agenda de hoy" icon="calendar_day" to="/calendario-citas" loading={homeLoading} empty="No hay citas para hoy">
              {citasHoy.map((cita) => (
                <ReminderRow key={cita.id} cita={cita} />
              ))}
            </WorkCard>

            <WorkCard title="Confirmar manana" icon="mark_chat_unread" to="/citas" loading={homeLoading} empty="No hay citas para confirmar">
              {citasManana.map((cita) => (
                <ReminderRow key={cita.id} cita={cita} compact />
              ))}
            </WorkCard>

            <WorkCard title="Pagos pendientes" icon="warning" to="/pagos" loading={homeLoading} empty="No hay deudas pendientes">
              {deudas.map((deuda, index) => (
                <div key={deuda.id || index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/80 transition-all text-slate-300">
                  <span className="w-24 font-bold text-amber-400">{formatCurrency(deuda.saldo || deuda.deuda || deuda.montoPendiente || 0)}</span>
                  <Link to="/pagos" className="min-w-0 flex-1 no-underline"><strong className="block text-white truncate">{getPatientNameFrom(deuda)}</strong><small className="text-slate-400">{deuda.tratamientoNombre || deuda.concepto || 'Saldo pendiente'}</small></Link>
                  <a href={buildWhatsAppUrl({ phone: getPatientPhoneFrom(deuda), message: paymentReminderMessage(deuda) })} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-300 no-underline hover:bg-emerald-500/20">WhatsApp</a>
                </div>
              ))}
            </WorkCard>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700/50">
            <h3 className="font-['Geist'] text-xl font-bold text-white mb-4">Atendidas vs canceladas</h3>
            {(citasAtendidas > 0 || citasCanceladas > 0) ? <Doughnut data={doughnutData} options={doughnutOptions} /> : <p className="py-12 text-center text-slate-500">No hay datos disponibles</p>}
          </div>

          <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700/50">
            <h3 className="font-['Geist'] text-xl font-bold text-white mb-4">Pacientes por mes</h3>
            {pacientesPorMes.length > 0 ? <Line data={lineData} options={chartOptions} /> : <p className="py-12 text-center text-slate-500">No hay datos disponibles</p>}
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 min-h-[180px] p-6 flex flex-col justify-between text-white shadow-xl shadow-blue-900/30">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-blue-200">auto_awesome</span>
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Nueva funcion IA</span>
              </div>
              <h3 className="font-['Geist'] text-xl font-bold leading-snug text-white">Analisis de radiografias</h3>
              <p className="text-xs text-blue-100 mt-1">Prototipo asistido para deteccion rapida de hallazgos clinicos.</p>
            </div>
            <button onClick={() => setAiOpen(true)} className="mt-4 bg-white text-blue-900 px-4 py-2.5 rounded-xl font-bold text-xs self-start hover:bg-slate-100 transition-all flex items-center gap-1.5">
              Probar ahora <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <AiXrayModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

const WorkCard = ({ title, icon, to, loading, empty, children }) => (
  <div className="bg-[#1E293B] rounded-2xl border border-slate-700/50 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
      <h3 className="font-['Geist'] text-base font-bold text-white flex items-center gap-2 m-0">
        <span className="material-symbols-outlined text-blue-400">{icon}</span>
        {title}
      </h3>
      <Link to={to} className="text-xs font-semibold text-blue-400 hover:text-blue-300 no-underline">Ver</Link>
    </div>
    <div className="p-2 min-h-[170px]">
      {loading ? <p className="py-10 text-center text-slate-500">Cargando...</p> : React.Children.count(children) === 0 ? <p className="py-10 text-center text-slate-500">{empty}</p> : children}
    </div>
  </div>
);

const ReminderRow = ({ cita, compact }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/80 transition-all text-slate-300">
    <span className="w-14 shrink-0 text-center font-bold text-blue-400">{cita.horaInicio || cita.hora || '--:--'}</span>
    <Link to="/citas" className="min-w-0 flex-1 no-underline">
      <strong className="block text-white truncate">{getPatientNameFrom(cita)}</strong>
      <small className="text-slate-400">{compact ? cita.estado || 'Por confirmar' : cita.motivo || cita.estado || 'Cita programada'}</small>
    </Link>
    <div className="flex shrink-0 gap-1">
      <a href={buildWhatsAppUrl({ phone: getPatientPhoneFrom(cita), message: appointmentReminderMessage(cita) })} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-300 no-underline hover:bg-emerald-500/20">WA</a>
      <button type="button" onClick={() => downloadAppointmentIcs(cita)} className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/20">ICS</button>
    </div>
  </div>
);

export default Dashboard;
