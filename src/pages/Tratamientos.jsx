import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;
const ESTADOS = ['', 'PLANIFICADO', 'EN_PROCESO', 'TERMINADO', 'CANCELADO', 'PENDIENTE_PAGO'];
const STATUS = {
  PLANIFICADO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  EN_PROCESO: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  TERMINADO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELADO: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  PENDIENTE_PAGO: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

const formatCurrency = (value) => {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getPatientName = (trat) => {
  if (trat.paciente) return `${trat.paciente.nombres || ''} ${trat.paciente.apellidos || ''}`.trim() || 'Paciente';
  return trat.pacienteNombre || 'Paciente';
};

const Tratamientos = () => {
  const navigate = useNavigate();
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [viewTratamiento, setViewTratamiento] = useState(null);
  const [changeEstadoId, setChangeEstadoId] = useState(null);
  const [changeEstadoValue, setChangeEstadoValue] = useState('');
  const [changeEstadoLoading, setChangeEstadoLoading] = useState(false);

  const fetchTratamientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (searchPaciente.trim()) params.search = searchPaciente.trim();
      if (filterEstado) params.estado = filterEstado;
      const response = await tratamientoService.listar(params);
      const data = response.data;
      if (data.content) {
        setTratamientos(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setTratamientos(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setTratamientos([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar tratamientos');
      setTratamientos([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchPaciente, filterEstado]);

  useEffect(() => { fetchTratamientos(); }, [fetchTratamientos]);
  useEffect(() => { setPage(0); }, [searchPaciente, filterEstado]);

  const stats = useMemo(() => {
    const enProceso = tratamientos.filter((t) => t.estado === 'EN_PROCESO').length;
    const terminados = tratamientos.filter((t) => t.estado === 'TERMINADO').length;
    const pendientePago = tratamientos.filter((t) => t.estado === 'PENDIENTE_PAGO').length;
    const total = tratamientos.reduce((sum, t) => sum + Number(t.precioFinal || t.precio || t.costoTotal || 0), 0);
    return [
      { label: 'Tratamientos', value: totalElements || tratamientos.length, icon: 'medical_services', color: 'blue' },
      { label: 'En proceso', value: enProceso, icon: 'pending_actions', color: 'amber' },
      { label: 'Terminados', value: terminados, icon: 'task_alt', color: 'emerald' },
      { label: 'Pipeline visible', value: formatCurrency(total), icon: 'payments', color: pendientePago ? 'purple' : 'blue' },
    ];
  }, [tratamientos, totalElements]);

  const handleChangeEstado = async () => {
    if (!changeEstadoId || !changeEstadoValue) return;
    setChangeEstadoLoading(true);
    try {
      await tratamientoService.actualizarEstado(changeEstadoId, { estado: changeEstadoValue });
      toast.success('Estado actualizado exitosamente');
      setChangeEstadoId(null);
      setChangeEstadoValue('');
      fetchTratamientos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setChangeEstadoLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
    return <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-700/60 bg-slate-800/40"><button disabled={page === 0} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>{pages.map((p) => <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-xs font-bold ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{p + 1}</button>)}<button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button></div>;
  };

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Area clinica</p>
          <h1 className="font-['Geist'] text-3xl lg:text-4xl font-black text-white tracking-tight mt-2">Tratamientos</h1>
          <p className="text-sm text-slate-400 mt-1">Gestiona tratamientos, sesiones, costos, estados y avance clinico.</p>
        </div>
        <Link to="/tratamientos/nuevo" className="self-start xl:self-auto rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 flex items-center gap-2 no-underline"><span className="material-symbols-outlined text-lg">add</span>Nuevo tratamiento</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">{stats.map((s) => <StatCard key={s.label} {...s} />)}</div>

      <section className="rounded-3xl border border-slate-700/50 bg-[#1E293B] shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 bg-slate-800/40 grid grid-cols-1 lg:grid-cols-[1fr_240px_auto] gap-3">
          <div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span><input value={searchPaciente} onChange={(e) => setSearchPaciente(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchTratamientos()} placeholder="Buscar por paciente..." className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-10 text-sm text-white placeholder-slate-500 focus:border-blue-500" />{searchPaciente && <button onClick={() => setSearchPaciente('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><span className="material-symbols-outlined text-lg">close</span></button>}</div>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500"><option value="">Todos los estados</option>{ESTADOS.filter(Boolean).map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select>
          <div className="flex gap-2"><button onClick={fetchTratamientos} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">search</span>Buscar</button><button onClick={() => { setSearchPaciente(''); setFilterEstado(''); }} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">ink_eraser</span>Limpiar</button></div>
        </div>

        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400"><span>{totalElements > 0 ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements}` : 'Sin resultados'}</span><span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 font-bold">Modulo clinico</span></div>

        {loading ? <Loading text="Cargando tratamientos..." /> : tratamientos.length === 0 ? <EmptyState clear={() => { setSearchPaciente(''); setFilterEstado(''); }} hasFilter={Boolean(searchPaciente || filterEstado)} /> : (
          <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead className="bg-slate-800/80 border-b border-slate-700/60"><tr>{['Paciente', 'Tratamiento', 'Pieza', 'Sesiones', 'Precio', 'Estado', 'Avance', 'Acciones'].map((h) => <th key={h} className={`px-6 py-3.5 text-xs font-['Geist'] font-bold text-slate-400 uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : ''}`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-700/40">{tratamientos.map((trat) => {
            const avance = trat.numeroSesiones > 0 ? Math.round(((trat.sesionesRealizadas || 0) / trat.numeroSesiones) * 100) : 0;
            return <tr key={trat.id} className="hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4"><span className="block font-bold text-white text-sm">{getPatientName(trat)}</span><span className="block text-xs text-slate-400">Tratamiento #{trat.id}</span></td><td className="px-6 py-4 text-sm font-semibold text-white max-w-[240px] truncate">{trat.nombre || trat.descripcion || '-'}</td><td className="px-6 py-4 text-xs text-slate-400">{trat.piezaDental || trat.pieza || '-'}</td><td className="px-6 py-4 text-xs text-slate-300">{trat.sesionesRealizadas || 0}/{trat.numeroSesiones || 0}</td><td className="px-6 py-4 text-sm font-bold text-blue-400">{formatCurrency(trat.precioFinal || trat.precio || trat.costoTotal || 0)}</td><td className="px-6 py-4"><StatusBadge estado={trat.estado} /></td><td className="px-6 py-4 min-w-[150px]"><div className="h-2 rounded-full bg-slate-900 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(avance, 100)}%` }} /></div><span className="text-[10px] text-slate-500 font-bold">{avance}%</span></td><td className="px-6 py-4"><div className="flex justify-end gap-1.5"><IconButton icon="visibility" color="text-sky-400" onClick={() => setViewTratamiento(trat)} /><IconButton icon="edit" color="text-emerald-400" onClick={() => navigate(`/tratamientos/${trat.id}/editar`)} /><IconButton icon="sync_alt" color="text-amber-400" onClick={() => { setChangeEstadoId(trat.id); setChangeEstadoValue(trat.estado || 'PLANIFICADO'); }} /></div></td></tr>;
          })}</tbody></table></div>
        )}
        {renderPagination()}
      </section>

      {viewTratamiento && <ViewModal tratamiento={viewTratamiento} onClose={() => setViewTratamiento(null)} />}
      {changeEstadoId && <EstadoModal value={changeEstadoValue} onChange={setChangeEstadoValue} onClose={() => setChangeEstadoId(null)} onConfirm={handleChangeEstado} loading={changeEstadoLoading} />}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const map = { blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20', amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20', emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  return <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-5 flex items-center gap-4 shadow-xl shadow-black/10"><div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${map[color]}`}><span className="material-symbols-outlined">{icon}</span></div><div><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 font-['Geist'] text-2xl font-black text-white">{value}</p></div></div>;
};
const StatusBadge = ({ estado }) => <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS[estado] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>{estado || '-'}</span>;
const IconButton = ({ icon, color, onClick }) => <button type="button" onClick={onClick} className={`p-2 rounded-xl ${color} hover:bg-slate-700/70`}><span className="material-symbols-outlined text-lg">{icon}</span></button>;
const Loading = ({ text }) => <div className="py-24 text-center text-slate-500"><span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span><p className="mt-3 text-sm">{text}</p></div>;
const EmptyState = ({ hasFilter, clear }) => <div className="py-24 text-center text-slate-500"><div className="mx-auto w-20 h-20 rounded-3xl border border-slate-700/60 bg-slate-800/70 flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-slate-500">ecg_heart</span></div><p className="mt-5 text-lg font-semibold text-slate-300">{hasFilter ? 'No se encontraron tratamientos con esos criterios' : 'No hay tratamientos registrados'}</p><div className="mt-4 flex justify-center gap-2">{hasFilter && <button className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700" onClick={clear}>Limpiar filtros</button>}<Link to="/tratamientos/nuevo" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 no-underline">Crear primer tratamiento</Link></div></div>;
const BaseModal = ({ title, children, onClose }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className="w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300"><div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4 mb-5"><h3 className="font-['Geist'] text-xl font-bold text-white m-0">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button></div>{children}</div></div>;
const Info = ({ label, value }) => <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-3"><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 mt-1 font-semibold text-white">{value}</p></div>;
const ViewModal = ({ tratamiento, onClose }) => <BaseModal title="Detalle de tratamiento" onClose={onClose}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Info label="Paciente" value={getPatientName(tratamiento)} /><Info label="Tratamiento" value={tratamiento.nombre || tratamiento.descripcion || '-'} /><Info label="Pieza" value={tratamiento.piezaDental || tratamiento.pieza || '-'} /><Info label="Sesiones" value={`${tratamiento.sesionesRealizadas || 0}/${tratamiento.numeroSesiones || 0}`} /><Info label="Precio" value={formatCurrency(tratamiento.precioFinal || tratamiento.precio || tratamiento.costoTotal || 0)} /><Info label="Estado" value={tratamiento.estado || '-'} /></div><div className="flex justify-end mt-6"><button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button></div></BaseModal>;
const EstadoModal = ({ value, onChange, onClose, onConfirm, loading }) => <BaseModal title="Cambiar estado" onClose={onClose}><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nuevo estado</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500">{ESTADOS.filter(Boolean).map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select><div className="flex justify-end gap-2 mt-5"><button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cancelar</button><button onClick={onConfirm} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60">{loading ? 'Guardando...' : 'Guardar'}</button></div></BaseModal>;

export default Tratamientos;
