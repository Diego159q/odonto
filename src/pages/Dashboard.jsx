import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { appointmentReminderMessage, buildWhatsAppUrl, downloadAppointmentIcs, getPatientNameFrom, getPatientPhoneFrom, paymentReminderMessage } from '../utils/noApiAutomation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const normalizeList = (data) => (Array.isArray(data) ? data : data?.content || []);

const formatCurrency = (value) => {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const localDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const shortDateParts = (dateStr) => {
  if (!dateStr) return { month: '--', day: '--' };
  const date = new Date(`${dateStr}${String(dateStr).includes('T') ? '' : 'T00:00:00'}`);
  return {
    month: date.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '').toUpperCase(),
    day: date.toLocaleDateString('es-PE', { day: '2-digit' }),
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasManana, setCitasManana] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [workLoading, setWorkLoading] = useState(true);

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
    const loadOperationalData = async () => {
      setWorkLoading(true);
      try {
        const [todayRes, tomorrowRes, deudasRes] = await Promise.allSettled([
          citaService.listar({ fechaDesde: localDate(), fechaHasta: localDate(), page: 0, size: 6 }),
          citaService.listar({ fechaDesde: localDate(1), fechaHasta: localDate(1), page: 0, size: 6 }),
          pagoService.deudasPendientes(),
        ]);
        if (todayRes.status === 'fulfilled') setCitasHoy(normalizeList(todayRes.value.data));
        if (tomorrowRes.status === 'fulfilled') setCitasManana(normalizeList(tomorrowRes.value.data));
        if (deudasRes.status === 'fulfilled') setDeudas(normalizeList(deudasRes.value.data).slice(0, 5));
      } finally {
        setWorkLoading(false);
      }
    };
    loadOperationalData();
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
  const chartLabels = ingresosMensuales.length > 0 ? ingresosMensuales.map((item) => item.mes || '') : ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
  const chartValues = ingresosMensuales.length > 0 ? ingresosMensuales.map((item) => item.total || 0) : [0, 0, 0, 0, 0, 0];
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Ingresos',
        data: chartValues,
        backgroundColor: '#2563EB',
        borderRadius: 7,
        barThickness: 18,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: '#CBD5E1' },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.12)' }, ticks: { color: '#94A3B8' } },
      x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { weight: 700 } } },
    },
  };

  const statCards = [
    { label: 'Citas hoy', value: d.citasDelDia ?? citasHoy.length, icon: 'event_available', color: 'blue', badge: '+ operativo', progress: 70 },
    { label: 'Pendientes', value: d.citasPendientes ?? citasManana.length, icon: 'person_add', color: 'amber', badge: 'Por confirmar', progress: 45 },
    { label: 'Cobrado hoy', value: formatCurrency(d.ingresosDelDia || 0), icon: 'payments', color: 'emerald', badge: 'Caja', progress: 82 },
    { label: 'Pacientes', value: d.totalPacientes ?? 0, icon: 'group', color: 'rose', badge: 'Base activa', progress: 35 },
  ];

  const nextStep = deudas.length > 0
    ? { label: 'Enviar recordatorios de pago', detail: `${deudas.length} paciente(s) con saldo pendiente`, to: '/pagos', icon: 'payments' }
    : citasManana.length > 0
      ? { label: 'Confirmar citas de manana', detail: `${citasManana.length} cita(s) por confirmar`, to: '/citas', icon: 'mark_chat_unread' }
      : citasHoy.length > 0
        ? { label: 'Revisar agenda de hoy', detail: `${citasHoy.length} cita(s) programada(s)`, to: '/calendario-citas', icon: 'calendar_today' }
        : { label: 'Registrar nueva cita', detail: 'No hay pendientes criticos por ahora', to: '/citas/nueva', icon: 'add_circle' };

  return (
    <div className="dashboard-page p-6 lg:p-8 space-y-8 animate-in text-slate-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-['Geist'] text-3xl lg:text-[40px] font-bold text-slate-950 dashboard-title tracking-tight leading-tight">
            Resumen de la clinica
          </h1>
          <p className="text-slate-500 font-['Inter'] text-base mt-1 dashboard-subtitle">
            Lo importante para atender, cobrar y confirmar sin complicarse.
          </p>
        </div>
        <div className="app-dark-panel bg-[#1E293B] px-4 py-2.5 rounded-xl flex items-center gap-2.5 border border-slate-700/60 shadow-xl shadow-slate-950/10">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">calendar_today</span>
          <span className="font-['Geist'] text-sm font-medium text-slate-200">{new Date().toLocaleDateString('es-PE')}</span>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-500/20 bg-blue-600 p-5 text-white shadow-xl shadow-blue-900/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">{nextStep.icon}</span>
          </div>
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-blue-100">Siguiente paso recomendado</p>
            <h2 className="m-0 mt-1 font-['Geist'] text-xl font-bold text-white">{nextStep.label}</h2>
            <p className="m-0 mt-1 text-sm text-blue-100">{nextStep.detail}</p>
          </div>
        </div>
        <button type="button" onClick={() => navigate(nextStep.to)} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 hover:bg-blue-50 self-start lg:self-auto">
          Ir ahora
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="app-dark-panel bg-[#1E293B] p-6 rounded-2xl shadow-2xl shadow-slate-950/15 border border-slate-700/50">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h3 className="font-['Geist'] text-xl font-bold text-white m-0">Rendimiento mensual</h3>
                <p className="text-sm text-slate-400 m-0 mt-1">Comparativa de ingresos registrados.</p>
              </div>
              <span className="app-dark-chip bg-slate-800 border border-slate-700 rounded-xl text-xs font-['Geist'] font-medium text-slate-200 py-2 px-3">Ultimos 6 meses</span>
            </div>
            <div className="h-64">
              {ingresosMensuales.length > 0 ? <Bar data={chartData} options={chartOptions} /> : <EmptyChart />}
            </div>
            <div className="mt-4 flex gap-6 items-center text-sm pt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600" /><span className="text-slate-300 text-xs">Ingresos</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-400" /><span className="text-slate-300 text-xs">Actividad clinica</span></div>
            </div>
          </section>

          <section className="app-dark-panel bg-[#1E293B] p-6 rounded-2xl shadow-2xl shadow-slate-950/15 border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-['Geist'] text-xl font-bold text-white m-0">Proximas citas</h3>
              <Link to="/calendario-citas" className="text-blue-400 font-['Geist'] font-medium text-sm hover:underline flex items-center gap-1 no-underline">
                Ver agenda completa <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="space-y-3">
              {workLoading ? <p className="py-8 text-center text-slate-500">Cargando citas...</p> : citasHoy.length === 0 ? <p className="py-8 text-center text-slate-500">No hay citas para hoy.</p> : citasHoy.slice(0, 4).map((cita) => <AppointmentRow key={cita.id} cita={cita} />)}
            </div>
          </section>
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <section className="app-dark-panel bg-[#1E293B] p-6 rounded-2xl shadow-2xl shadow-slate-950/15 border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-['Geist'] text-xl font-bold text-white m-0">Trabajo de hoy</h3>
              <button onClick={() => navigate('/citas/nueva')} className="material-symbols-outlined text-slate-300 hover:text-white p-1.5 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">add</button>
            </div>

            <div className="space-y-4">
              {deudas.length > 0 && (
                <div className="app-alert-panel bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex gap-3 items-start text-rose-200">
                  <span className="material-symbols-outlined text-rose-400 text-xl mt-0.5">warning</span>
                  <div className="min-w-0">
                    <p className="font-['Geist'] text-xs font-bold text-rose-400 m-0">Pagos pendientes</p>
                    <p className="text-xs text-slate-300 mt-0.5 mb-0">Hay {deudas.length} saldo(s) para seguimiento.</p>
                    <Link to="/pagos" className="mt-1.5 inline-block text-xs font-bold text-rose-400 underline hover:text-rose-300">Revisar ahora</Link>
                  </div>
                </div>
              )}

              <TaskLine label="Confirmar citas de manana" count={citasManana.length} to="/citas" doneText="Sin citas por confirmar" />
              <TaskLine label="Enviar recordatorios de pago" count={deudas.length} to="/pagos" doneText="Sin deudas visibles" />
              <TaskLine label="Revisar agenda de hoy" count={citasHoy.length} to="/calendario-citas" doneText="Agenda libre" />

              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <h4 className="font-['Geist'] text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ocupacion gabinetes</h4>
                <Occupancy label="Gabinete 01" value={citasHoy.length > 0 ? 85 : 20} color="blue" />
                <Occupancy label="Gabinete 02" value={citasManana.length > 0 ? 45 : 10} color="sky" />
              </div>
            </div>
          </section>

          <section className="app-dark-panel bg-[#1E293B] p-6 rounded-2xl shadow-2xl shadow-slate-950/15 border border-slate-700/50">
            <h3 className="font-['Geist'] text-xl font-bold text-white m-0">Acciones rapidas</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">Botones para las tareas mas comunes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction icon="calendar_add_on" label="Nueva cita" onClick={() => navigate('/citas/nueva')} />
              <QuickAction icon="person_add" label="Nuevo paciente" onClick={() => navigate('/pacientes/nuevo')} />
              <QuickAction icon="point_of_sale" label="Registrar pago" onClick={() => navigate('/pagos')} />
              <QuickAction icon="search" label="Buscar paciente" onClick={() => navigate('/pacientes')} />
            </div>
          </section>
        </aside>
      </div>

      <button onClick={() => navigate('/citas/nueva')} className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl shadow-blue-900/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group" title="Nueva cita">
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform">add</span>
      </button>

    </div>
  );
};

const MetricCard = ({ label, value, icon, color, badge, progress }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  const barMap = { blue: 'bg-blue-500', amber: 'bg-amber-400', emerald: 'bg-emerald-400', rose: 'bg-rose-500' };
  return (
    <section className="app-dark-panel metric-card bg-[#1E293B] p-5 rounded-2xl shadow-2xl shadow-slate-950/15 border border-slate-700/50 hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 min-h-[180px]">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorMap[color]}`}>{badge}</span>
      </div>
      <p className="text-slate-400 font-['Geist'] text-xs font-semibold uppercase tracking-wider m-0">{label}</p>
      <p className="font-['Geist'] text-3xl font-bold text-white mt-1 mb-0">{value}</p>
      <div className="app-progress-track mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barMap[color]} rounded-full`} style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
};

const EmptyChart = () => (
  <div className="h-full flex items-end justify-around gap-4 relative pt-4">
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
      <div className="w-full h-px bg-slate-600" /><div className="w-full h-px bg-slate-600" /><div className="w-full h-px bg-slate-600" /><div className="w-full h-px bg-slate-600" />
    </div>
    {[
      ['May', '40%', '60%'], ['Jun', '55%', '75%'], ['Jul', '35%', '45%'], ['Ago', '70%', '90%'], ['Sep', '60%', '80%'], ['Oct', '45%', '65%'],
    ].map(([month, h1, h2]) => (
      <div key={month} className="flex flex-col items-center gap-1.5 w-full max-w-[44px] h-full justify-end z-10">
        <div className="w-full flex items-end gap-1.5 h-full"><div className="w-1/2 bg-sky-400 rounded-t-md" style={{ height: h1 }} /><div className="w-1/2 bg-blue-600 rounded-t-md" style={{ height: h2 }} /></div>
        <span className="text-[11px] font-bold text-slate-400 uppercase">{month}</span>
      </div>
    ))}
  </div>
);

const AppointmentRow = ({ cita }) => {
  const date = shortDateParts(cita.fecha);
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/80 transition-all group border border-transparent hover:border-slate-700">
      <div className="app-dark-chip w-12 h-12 flex flex-col items-center justify-center bg-slate-800 text-slate-300 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <span className="text-[10px] font-bold uppercase">{date.month}</span>
        <span className="font-bold text-lg leading-none">{date.day}</span>
      </div>
      <Link to="/citas" className="flex-grow min-w-0 no-underline">
        <p className="font-['Geist'] font-semibold text-white text-sm m-0 truncate">{getPatientNameFrom(cita)}</p>
        <p className="text-xs text-slate-400 m-0">{cita.motivo || 'Cita odontologica'} - {cita.horaInicio || cita.hora || '--:--'}</p>
      </Link>
      <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">{cita.estado || 'Pendiente'}</span>
      <a href={buildWhatsAppUrl({ phone: getPatientPhoneFrom(cita), message: appointmentReminderMessage(cita) })} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-300 no-underline hover:bg-emerald-500/20">WA</a>
      <button type="button" onClick={() => downloadAppointmentIcs(cita)} className="material-symbols-outlined text-slate-400 hover:text-white p-1">event_upcoming</button>
    </div>
  );
};

const TaskLine = ({ label, count, to, doneText }) => (
  <Link to={to} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-all border border-transparent hover:border-slate-700/50 no-underline">
    <span className={`w-4 h-4 rounded border ${count > 0 ? 'bg-blue-600 border-blue-500' : 'app-dark-chip border-slate-600 bg-slate-800'}`} />
    <span className="text-sm text-slate-200 flex-1">{count > 0 ? label : doneText}</span>
    <span className="text-xs font-bold text-blue-400">{count}</span>
  </Link>
);

const QuickAction = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick} className="app-dark-chip rounded-xl border border-slate-700 bg-slate-800/70 p-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors">
    <span className="material-symbols-outlined text-blue-400 align-middle mr-2 text-lg">{icon}</span>
    {label}
  </button>
);

const Occupancy = ({ label, value, color }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1"><span className="text-slate-300 font-medium">{label}</span><span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-sky-400'}`}>{value}%</span></div>
    <div className="app-progress-track h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-sky-400'}`} style={{ width: `${value}%` }} /></div>
  </div>
);

export default Dashboard;
