import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { citaService, usuarioService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADO_STYLES = {
  PENDIENTE: 'bg-amber-500/10 border-amber-500 text-amber-400',
  CONFIRMADA: 'bg-blue-600 text-white border-blue-500',
  ATENDIDA: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
  CANCELADA: 'bg-rose-500/10 border-rose-500 text-rose-400',
  REPROGRAMADA: 'bg-purple-500/10 border-purple-500 text-purple-400',
  NO_ASISTIO: 'bg-slate-500/10 border-slate-500 text-slate-400',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPacienteName = (cita) => {
  if (cita.paciente) return `${cita.paciente.nombres || ''} ${cita.paciente.apellidos || ''}`.trim() || 'Sin paciente';
  return cita.pacienteNombre || cita.paciente || 'Sin paciente';
};

const getOdontologoName = (cita) => {
  if (cita.odontologo) return `${cita.odontologo.nombre || cita.odontologo.nombres || ''} ${cita.odontologo.apellidos || ''}`.trim();
  return cita.odontologoNombre || '';
};

const buildMonthGrid = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const firstMondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstMondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

const CalendarioCitas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [odontologos, setOdontologos] = useState([]);
  const [odontologoFilter, setOdontologoFilter] = useState('');
  const [selectedCita, setSelectedCita] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [viewMode, setViewMode] = useState('mes');

  const fetchOdontologos = useCallback(async () => {
    try {
      const response = await usuarioService.listar({ rol: 'ODONTOLOGA' });
      const data = response.data;
      setOdontologos(data.content || (Array.isArray(data) ? data : []));
    } catch {
      // no critico
    }
  }, []);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (odontologoFilter) params.odontologoId = odontologoFilter;
      const response = await citaService.listar(params);
      const data = response.data;
      setCitas(data.content || (Array.isArray(data) ? data : []));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar citas');
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [odontologoFilter]);

  useEffect(() => {
    fetchOdontologos();
  }, [fetchOdontologos]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const eventsByDate = useMemo(() => {
    return citas.reduce((acc, cita) => {
      if (!cita.fecha || cita.estado === 'CANCELADA') return acc;
      acc[cita.fecha] = acc[cita.fecha] || [];
      acc[cita.fecha].push(cita);
      return acc;
    }, {});
  }, [citas]);

  const monthDays = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const selectedEvents = eventsByDate[selectedDate] || [];
  const todayKey = toDateKey(new Date());
  const monthTitle = `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const moveMonth = (amount) => {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const goToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toDateKey(now));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-8 min-h-[calc(100vh-64px)] flex flex-col xl:flex-row gap-6 animate-in text-slate-300">
      <section className="flex-grow flex flex-col gap-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Agenda clinica</p>
            <h1 className="font-['Geist'] text-3xl font-bold text-white tracking-tight mt-2">Agenda de citas</h1>
            <p className="text-sm text-slate-400">{monthTitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 py-2.5 px-3 min-w-[180px]"
              value={odontologoFilter}
              onChange={(e) => setOdontologoFilter(e.target.value)}
            >
              <option value="">Todos los odontologos</option>
              {odontologos.map((odo) => (
                <option key={odo.id} value={odo.id}>{odo.nombre || odo.nombres || ''} {odo.apellidos || ''}</option>
              ))}
            </select>

            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700/60">
              {['mes', 'semana', 'dia'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <button type="button" onClick={() => navigate('/citas/nueva')} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-500">
              <span className="material-symbols-outlined text-sm">add</span>
              Nueva cita
            </button>
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => moveMonth(-1)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white"><span className="material-symbols-outlined">chevron_left</span></button>
              <button type="button" onClick={goToday} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700">Hoy</button>
              <button type="button" onClick={() => moveMonth(1)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
            <h2 className="font-['Geist'] text-lg font-bold text-white m-0">{monthTitle}</h2>
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color="bg-amber-400" label="Pendiente" />
              <LegendDot color="bg-blue-500" label="Confirmada" />
              <LegendDot color="bg-emerald-400" label="Atendida" />
            </div>
          </div>

          <div className="grid grid-cols-7 bg-slate-800/90 border-b border-slate-700/50 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2.5 font-['Geist'] text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-500">
              <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span>
              <p className="mt-3 text-sm">Cargando citas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-[118px] sm:auto-rows-[135px]">
              {monthDays.map((date) => {
                const key = toDateKey(date);
                const dayEvents = eventsByDate[key] || [];
                const inMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = key === selectedDate;
                const isToday = key === todayKey;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`border-r border-b border-slate-700/40 p-2 flex flex-col gap-1 text-left transition-all relative overflow-hidden ${isSelected ? 'bg-slate-800/95 ring-2 ring-inset ring-blue-500 z-10' : inMonth ? 'hover:bg-slate-800/50' : 'bg-slate-900/40 text-slate-600'}`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-400' : isToday ? 'text-emerald-400' : inMonth ? 'text-slate-300' : 'text-slate-600'}`}>{date.getDate()}</span>
                    {dayEvents.slice(0, 3).map((cita) => (
                      <span key={cita.id} className={`block rounded-lg border-l-2 px-1.5 py-1 text-[10px] font-bold leading-tight truncate ${ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE}`}>
                        {cita.horaInicio || '--:--'} {getPacienteName(cita)}
                      </span>
                    ))}
                    {dayEvents.length > 3 && <span className="text-[10px] text-slate-500 font-bold">+{dayEvents.length - 3} mas</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-[#1E293B] rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <div className="flex justify-between items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-3xl">event</span>
            </div>
            <button type="button" onClick={() => navigate(`/citas/nueva?fecha=${selectedDate}`)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500">Agregar</button>
          </div>

          <div className="mt-4">
            <h3 className="font-['Geist'] text-xl font-bold text-white">{formatDate(selectedDate)}</h3>
            <p className="text-xs font-semibold text-blue-400 mt-0.5">{selectedEvents.length} citas programadas</p>
          </div>

          <div className="mt-5 space-y-3">
            {selectedEvents.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-center text-sm text-slate-500">No hay citas para este dia.</div>
            ) : selectedEvents.map((cita) => (
              <button key={cita.id} type="button" onClick={() => setSelectedCita(cita)} className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/50 text-left transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white text-sm m-0">{getPacienteName(cita)}</p>
                    <p className="text-xs text-slate-400 m-0">{cita.motivo || 'Cita programada'}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE}`}>{cita.estado || 'PENDIENTE'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {cita.horaInicio || '--:--'} - {cita.horaFin || '--:--'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20 flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400"><span className="material-symbols-outlined text-xl">trending_up</span></div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider m-0">Total visible</p>
            <p className="font-['Geist'] text-2xl font-bold text-white leading-tight m-0">{citas.length} <span className="text-xs font-normal text-slate-400">citas</span></p>
          </div>
        </div>
      </aside>

      {selectedCita && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300">
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div>
                <h3 className="font-['Geist'] text-xl font-bold text-white">Detalle de cita</h3>
                <p className="text-xs text-slate-400">{formatDate(selectedCita.fecha)}</p>
              </div>
              <button onClick={() => setSelectedCita(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 text-sm">
              <Info label="Paciente" value={getPacienteName(selectedCita)} />
              <Info label="Odontologo" value={getOdontologoName(selectedCita) || '-'} />
              <Info label="Horario" value={`${selectedCita.horaInicio || '--:--'} - ${selectedCita.horaFin || '--:--'}`} />
              <Info label="Estado" value={selectedCita.estado || 'PENDIENTE'} />
              <div className="sm:col-span-2"><Info label="Motivo" value={selectedCita.motivo || '-'} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700/60">
              <button onClick={() => setSelectedCita(null)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button>
              <button onClick={() => navigate(`/citas/${selectedCita.id}/editar`)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Editar cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <span className="flex items-center gap-1.5 text-slate-400"><span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}</span>
);

const Info = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">{label}</p>
    <p className="font-semibold text-white m-0 mt-1">{value}</p>
  </div>
);

export default CalendarioCitas;
