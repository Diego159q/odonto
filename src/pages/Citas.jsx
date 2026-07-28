import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { citaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;
const ESTADOS = ['', 'PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMADA', 'NO_ASISTIO'];

const STATUS = {
  PENDIENTE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CONFIRMADA: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ATENDIDA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELADA: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  REPROGRAMADA: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  NO_ASISTIO: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const ACTIONS_BY_ESTADO = {
  PENDIENTE: ['ver', 'editar', 'confirmar', 'cancelar', 'reprogramar'],
  CONFIRMADA: ['ver', 'cancelar', 'reprogramar'],
  ATENDIDA: ['ver'],
  CANCELADA: ['ver', 'reprogramar'],
  REPROGRAMADA: ['ver', 'confirmar', 'cancelar'],
  NO_ASISTIO: ['ver', 'reprogramar'],
};

const getPacienteName = (cita) => {
  if (cita.paciente) return `${cita.paciente.nombres || ''} ${cita.paciente.apellidos || ''}`.trim() || 'Paciente';
  return cita.pacienteNombre || cita.paciente || 'Paciente';
};

const getOdontologoName = (cita) => {
  if (cita.odontologo) return `${cita.odontologo.nombre || cita.odontologo.nombres || ''} ${cita.odontologo.apellidos || ''}`.trim();
  return cita.odontologoNombre || '-';
};

const Citas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filtros, setFiltros] = useState({ fechaDesde: '', fechaHasta: '', estado: '', searchPaciente: '' });
  const [viewCita, setViewCita] = useState(null);
  const [cancelCita, setCancelCita] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reprogramCita, setReprogramCita] = useState(null);
  const [reprogramData, setReprogramData] = useState({ nuevaFecha: '', nuevaHoraInicio: '', nuevaHoraFin: '' });
  const [reprogramLoading, setReprogramLoading] = useState(false);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.searchPaciente.trim()) params.search = filtros.searchPaciente.trim();
      const response = await citaService.listar(params);
      const data = response.data;
      if (data.content) {
        setCitas(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setCitas(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setCitas([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar citas');
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtros]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  useEffect(() => {
    setPage(0);
  }, [filtros]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFiltros({ fechaDesde: '', fechaHasta: '', estado: '', searchPaciente: '' });

  const handleConfirmar = async (id) => {
    try {
      await citaService.confirmar(id);
      toast.success('Cita confirmada exitosamente');
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al confirmar cita');
    }
  };

  const handleCancelar = async () => {
    if (!cancelMotivo.trim()) {
      toast.warning('Debe indicar un motivo de cancelacion');
      return;
    }
    setCancelLoading(true);
    try {
      await citaService.cancelar(cancelCita.id, { motivo: cancelMotivo.trim() });
      toast.success('Cita cancelada exitosamente');
      setCancelCita(null);
      setCancelMotivo('');
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar cita');
    } finally {
      setCancelLoading(false);
    }
  };

  const openReprogramModal = (cita) => {
    setReprogramCita(cita);
    setReprogramData({ nuevaFecha: cita.fecha || '', nuevaHoraInicio: cita.horaInicio || '', nuevaHoraFin: cita.horaFin || '' });
  };

  const handleReprogramar = async () => {
    if (!reprogramData.nuevaFecha || !reprogramData.nuevaHoraInicio || !reprogramData.nuevaHoraFin) {
      toast.warning('Complete todos los campos para reprogramar');
      return;
    }
    if (reprogramData.nuevaHoraInicio >= reprogramData.nuevaHoraFin) {
      toast.warning('La hora de inicio debe ser menor a la hora de fin');
      return;
    }
    setReprogramLoading(true);
    try {
      await citaService.reprogramar(reprogramCita.id, reprogramData);
      toast.success('Cita reprogramada exitosamente');
      setReprogramCita(null);
      fetchCitas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al reprogramar cita');
    } finally {
      setReprogramLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(`${dateStr}${dateStr.includes('T') ? '' : 'T00:00:00'}`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
    return (
      <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-700/60 bg-slate-800/40">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
        {pages.map((p) => <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-xs font-bold ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{p + 1}</button>)}
        <button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
      </div>
    );
  };

  const renderActions = (cita) => {
    const actions = ACTIONS_BY_ESTADO[cita.estado] || ['ver'];
    return (
      <div className="flex items-center justify-end gap-1.5">
        {actions.includes('ver') && <IconButton icon="visibility" color="text-sky-400" onClick={() => setViewCita(cita)} />}
        {actions.includes('editar') && <IconButton icon="edit" color="text-emerald-400" onClick={() => navigate(`/citas/${cita.id}/editar`)} />}
        {actions.includes('confirmar') && <IconButton icon="check" color="text-blue-400" onClick={() => handleConfirmar(cita.id)} />}
        {actions.includes('cancelar') && <IconButton icon="close" color="text-rose-400" onClick={() => { setCancelCita(cita); setCancelMotivo(''); }} />}
        {actions.includes('reprogramar') && <IconButton icon="event_repeat" color="text-amber-400" onClick={() => openReprogramModal(cita)} />}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Control operativo</p>
          <h1 className="font-['Geist'] text-3xl font-bold text-white tracking-tight mt-2">Lista de citas</h1>
          <p className="text-slate-400 text-sm mt-1">Consulta, confirma, cancela o reprograma atenciones.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/calendario-citas" className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 no-underline flex items-center gap-2"><span className="material-symbols-outlined text-lg">calendar_month</span>Agenda</Link>
          <Link to="/citas/nueva" className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/30 hover:bg-blue-500 no-underline"><span className="material-symbols-outlined text-lg">add</span>Nueva cita</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FilterInput label="Desde" type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFilterChange} />
        <FilterInput label="Hasta" type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFilterChange} />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Estado</label>
          <select name="estado" value={filtros.estado} onChange={handleFilterChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500">
            {ESTADOS.map((estado) => <option key={estado || 'all'} value={estado}>{estado || 'Todos'}</option>)}
          </select>
        </div>
        <FilterInput label="Paciente" name="searchPaciente" value={filtros.searchPaciente} onChange={handleFilterChange} placeholder="Nombre o DNI" />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={clearFilters} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700">Limpiar filtros</button>
        <button onClick={fetchCitas} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500">Buscar</button>
      </div>

      <div className="bg-[#1E293B] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl shadow-black/10">
        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400 bg-slate-800/40">
          <span>{totalElements > 0 ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements}` : 'Sin resultados'}</span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 font-bold">{totalElements} registros</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500"><span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span><p className="mt-3 text-sm">Cargando citas...</p></div>
        ) : citas.length === 0 ? (
          <div className="py-20 text-center text-slate-500"><span className="material-symbols-outlined text-6xl text-slate-600">event_busy</span><p className="mt-3">No se encontraron citas.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/80 border-b border-slate-700/60">
                <tr>
                  {['Paciente', 'Fecha', 'Horario', 'Odontologo', 'Motivo', 'Estado', 'Acciones'].map((header) => <th key={header} className={`px-6 py-3.5 text-xs font-['Geist'] font-bold text-slate-400 uppercase tracking-wider ${header === 'Acciones' ? 'text-right' : ''}`}>{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4"><button onClick={() => setViewCita(cita)} className="text-left"><span className="block font-bold text-white text-sm hover:text-blue-400">{getPacienteName(cita)}</span><span className="block text-xs text-slate-400">Cita #{cita.id}</span></button></td>
                    <td className="px-6 py-4 text-xs text-slate-300">{formatDate(cita.fecha)}</td>
                    <td className="px-6 py-4 text-xs text-slate-300">{cita.horaInicio || '--:--'} - {cita.horaFin || '--:--'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{getOdontologoName(cita)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[220px] truncate">{cita.motivo || '-'}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${STATUS[cita.estado] || STATUS.PENDIENTE}`}>{cita.estado || 'PENDIENTE'}</span></td>
                    <td className="px-6 py-4">{renderActions(cita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {renderPagination()}
      </div>

      {viewCita && <ViewModal cita={viewCita} onClose={() => setViewCita(null)} onEdit={() => navigate(`/citas/${viewCita.id}/editar`)} formatDate={formatDate} />}
      {cancelCita && <TextModal title="Cancelar cita" label="Motivo de cancelacion" value={cancelMotivo} onChange={setCancelMotivo} onClose={() => setCancelCita(null)} onConfirm={handleCancelar} loading={cancelLoading} confirmText="Cancelar cita" danger />}
      {reprogramCita && <ReprogramModal data={reprogramData} setData={setReprogramData} onClose={() => setReprogramCita(null)} onConfirm={handleReprogramar} loading={reprogramLoading} />}
    </div>
  );
};

const FilterInput = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</label>
    <input {...props} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500" />
  </div>
);

const IconButton = ({ icon, color, onClick }) => (
  <button type="button" onClick={onClick} className={`p-2 rounded-xl ${color} hover:bg-slate-700/70`}><span className="material-symbols-outlined text-lg">{icon}</span></button>
);

const ViewModal = ({ cita, onClose, onEdit, formatDate }) => (
  <BaseModal title="Detalle de cita" onClose={onClose}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <Info label="Paciente" value={getPacienteName(cita)} />
      <Info label="Odontologo" value={getOdontologoName(cita)} />
      <Info label="Fecha" value={formatDate(cita.fecha)} />
      <Info label="Horario" value={`${cita.horaInicio || '--:--'} - ${cita.horaFin || '--:--'}`} />
      <Info label="Estado" value={cita.estado || 'PENDIENTE'} />
      <Info label="Motivo" value={cita.motivo || '-'} />
    </div>
    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700/60"><button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button><button onClick={onEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Editar</button></div>
  </BaseModal>
);

const TextModal = ({ title, label, value, onChange, onClose, onConfirm, loading, confirmText, danger }) => (
  <BaseModal title={title} onClose={onClose}>
    <label className="block text-sm font-semibold text-slate-300 mb-2">{label}</label>
    <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500" />
    <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button><button onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{loading ? 'Procesando...' : confirmText}</button></div>
  </BaseModal>
);

const ReprogramModal = ({ data, setData, onClose, onConfirm, loading }) => (
  <BaseModal title="Reprogramar cita" onClose={onClose}>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <FilterInput label="Nueva fecha" type="date" value={data.nuevaFecha} onChange={(e) => setData((prev) => ({ ...prev, nuevaFecha: e.target.value }))} />
      <FilterInput label="Inicio" type="time" value={data.nuevaHoraInicio} onChange={(e) => setData((prev) => ({ ...prev, nuevaHoraInicio: e.target.value }))} />
      <FilterInput label="Fin" type="time" value={data.nuevaHoraFin} onChange={(e) => setData((prev) => ({ ...prev, nuevaHoraFin: e.target.value }))} />
    </div>
    <div className="flex justify-end gap-2 mt-5"><button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button><button onClick={onConfirm} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60">{loading ? 'Guardando...' : 'Reprogramar'}</button></div>
  </BaseModal>
);

const BaseModal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300">
      <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4 mb-5"><h3 className="font-['Geist'] text-xl font-bold text-white m-0">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button></div>
      {children}
    </div>
  </div>
);

const Info = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">{label}</p><p className="font-semibold text-white m-0 mt-1">{value}</p></div>
);

export default Citas;
