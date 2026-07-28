import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { pacienteService } from '../services/endpoints';
import { toast } from 'react-toastify';
import { buildWhatsAppUrl, patientFollowUpMessage } from '../utils/noApiAutomation';

const PAGE_SIZE = 10;

const getPatientName = (paciente) => `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim() || 'Paciente sin nombre';
const getInitials = (paciente) => {
  const fullName = getPatientName(paciente);
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const statusClass = (estado) => {
  if (estado === 'INACTIVO') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
};

const Pacientes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await pacienteService.listar(params);
      const data = response.data;
      if (data.content) {
        setPacientes(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setPacientes(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setPacientes([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar pacientes');
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const stats = useMemo(() => {
    const activos = pacientes.filter((p) => (p.estado || 'ACTIVO') === 'ACTIVO').length;
    const inactivos = pacientes.filter((p) => p.estado === 'INACTIVO').length;
    return [
      { label: 'Total pacientes', value: totalElements || pacientes.length, icon: 'group', color: 'blue' },
      { label: 'Activos visibles', value: activos, icon: 'verified', color: 'emerald' },
      { label: 'Inactivos visibles', value: inactivos, icon: 'block', color: 'rose' },
      { label: 'Pagina actual', value: `${page + 1}/${Math.max(totalPages, 1)}`, icon: 'view_list', color: 'amber' },
    ];
  }, [pacientes, page, totalElements, totalPages]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await pacienteService.eliminar(deleteId);
      toast.success('Paciente eliminado exitosamente');
      setDeleteId(null);
      if (pacientes.length === 1 && page > 0) setPage(page - 1);
      else fetchPacientes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar paciente');
    } finally {
      setDeleting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
    return (
      <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-700/60 bg-slate-800/40">
        <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30">
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-xs font-bold ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
            {p + 1}
          </button>
        ))}
        <button type="button" disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30">
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    );
  };

  const renderActions = (paciente) => (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" title="Enviar WhatsApp" onClick={() => window.open(buildWhatsAppUrl({ phone: paciente.telefono, message: patientFollowUpMessage(paciente) }), '_blank', 'noopener,noreferrer')} className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10">
        <span className="material-symbols-outlined text-lg">chat</span>
      </button>
      <button type="button" title="Abrir expediente" onClick={() => navigate(`/pacientes/${paciente.id}`)} className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10">
        <span className="material-symbols-outlined text-lg">folder_open</span>
      </button>
      <button type="button" title="Odontograma" onClick={() => navigate(`/odontograma/paciente/${paciente.id}`)} className="p-2 rounded-xl text-teal-400 hover:bg-teal-500/10">
        <span className="material-symbols-outlined text-lg">dentistry</span>
      </button>
      <button type="button" title="Editar" onClick={() => navigate(`/pacientes/${paciente.id}/editar`)} className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10">
        <span className="material-symbols-outlined text-lg">edit</span>
      </button>
      <button type="button" title="Eliminar" onClick={() => setDeleteId(paciente.id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10">
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  );

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Base clinica</p>
          <h1 className="font-['Geist'] text-3xl font-bold text-white tracking-tight mt-2">Gestion de pacientes</h1>
          <p className="text-slate-400 text-sm mt-1">Administra expedientes, odontogramas y datos de contacto.</p>
        </div>
        <Link to="/pacientes/nuevo" className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/30 hover:bg-blue-500 no-underline self-start md:self-auto">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Nuevo paciente
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1E293B] p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4 shadow-xl shadow-black/10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : stat.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider m-0">{stat.label}</p>
              <p className="text-2xl font-['Geist'] font-bold text-white m-0">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1E293B] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl shadow-black/10">
        <div className="p-4 border-b border-slate-700/60 flex flex-wrap items-center gap-3 justify-between bg-slate-800/40">
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPacientes()}
              placeholder="Buscar por nombre, DNI o telefono..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchPacientes} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">search</span>
              Buscar
            </button>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/60">
              <button type="button" onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
              </button>
              <button type="button" onClick={() => setViewMode('grid')} className={`px-2.5 py-1 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>{totalElements > 0 ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements}` : 'Sin resultados'}</span>
          {totalElements > 0 && <span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 font-bold">{totalElements} registros</span>}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span>
            <p className="mt-3 text-sm">Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="material-symbols-outlined text-6xl text-slate-600">group</span>
            <p className="mt-3">{searchTerm ? 'No se encontraron pacientes con ese criterio.' : 'No hay pacientes registrados.'}</p>
            <Link to="/pacientes/nuevo" className="inline-flex mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 no-underline">Registrar paciente</Link>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/80 border-b border-slate-700/60">
                <tr>
                  {['Paciente', 'DNI', 'Telefono', 'Email', 'Estado', 'Acciones'].map((header) => (
                    <th key={header} className={`px-6 py-3.5 text-xs font-['Geist'] font-bold text-slate-400 uppercase tracking-wider ${header === 'Acciones' ? 'text-right' : ''}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {pacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => navigate(`/pacientes/${paciente.id}`)} className="flex items-center gap-3 text-left">
                        <span className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">{getInitials(paciente)}</span>
                        <span>
                          <span className="block font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{getPatientName(paciente)}</span>
                          <span className="block text-xs text-slate-400">Codigo #{paciente.id}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">{paciente.dni || '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-300">{paciente.telefono || '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{paciente.email || '-'}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass(paciente.estado)}`}>{paciente.estado || 'ACTIVO'}</span></td>
                    <td className="px-6 py-4">{renderActions(paciente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pacientes.map((paciente) => (
              <div key={paciente.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 hover:border-slate-600 transition-all shadow-md">
                <div className="flex justify-between items-start gap-3">
                  <button type="button" onClick={() => navigate(`/pacientes/${paciente.id}`)} className="flex items-center gap-3 text-left min-w-0">
                    <span className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">{getInitials(paciente)}</span>
                    <span className="min-w-0">
                      <span className="block font-bold text-white text-sm truncate">{getPatientName(paciente)}</span>
                      <span className="block text-xs text-slate-400">#{paciente.id} / {paciente.dni || 'sin DNI'}</span>
                    </span>
                  </button>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusClass(paciente.estado)}`}>{paciente.estado || 'ACTIVO'}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 text-slate-300">
                  <p className="m-0"><strong className="text-slate-400">Telefono:</strong> {paciente.telefono || '-'}</p>
                  <p className="m-0"><strong className="text-slate-400">Email:</strong> {paciente.email || '-'}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => window.open(buildWhatsAppUrl({ phone: paciente.telefono, message: patientFollowUpMessage(paciente) }), '_blank', 'noopener,noreferrer')} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">WhatsApp</button>
                  <button type="button" onClick={() => navigate(`/odontograma/paciente/${paciente.id}`)} className="rounded-xl bg-slate-700/80 hover:bg-slate-700 text-blue-400 text-xs font-semibold py-2 border border-slate-600/50">Odonto</button>
                  <button type="button" onClick={() => navigate(`/pacientes/${paciente.id}`)} className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 shadow-md">Expediente</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {renderPagination()}
      </div>

      {deleteId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="font-['Geist'] text-lg font-bold text-white m-0">Eliminar paciente</h3>
                <p className="text-xs text-slate-400 m-0">Esta accion no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-5">Seguro que deseas eliminar este paciente?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-60">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacientes;
