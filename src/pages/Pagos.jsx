import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { pacienteService, pagoService, tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const PAGE_SIZE = 10;
const METODOS_PAGO = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
const initialForm = { pacienteId: '', tratamientoId: '', montoTotal: '', montoPagado: '', metodoPago: 'EFECTIVO', numeroOperacion: '', observaciones: '' };

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(`${dateStr}${dateStr.includes?.('T') ? '' : 'T00:00:00'}`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPatientName = (item) => {
  if (item.paciente) return `${item.paciente.nombres || ''} ${item.paciente.apellidos || ''}`.trim() || 'Paciente';
  return item.pacienteNombre || item.paciente || 'Paciente';
};

const Pagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filtros, setFiltros] = useState({ paciente: '', fechaDesde: '', fechaHasta: '', metodoPago: '' });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');
  const [selectedTratamiento, setSelectedTratamiento] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);
  const [viewPago, setViewPago] = useState(null);
  const [summary, setSummary] = useState({ totalIngresos: 0, ingresosDia: 0, ingresosMes: 0, deudasPendientes: 0 });

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filtros.paciente.trim()) params.paciente = filtros.paciente.trim();
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
      if (filtros.metodoPago) params.metodoPago = filtros.metodoPago;
      const response = await pagoService.listar(params);
      const data = response.data;
      if (data.content) {
        setPagos(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setPagos(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setPagos([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar pagos');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [page, filtros]);

  useEffect(() => { fetchPagos(); }, [fetchPagos]);
  useEffect(() => { setPage(0); }, [filtros]);

  useEffect(() => {
    const loadSummary = async () => {
      const [ingresosDiaRes, deudasRes] = await Promise.allSettled([pagoService.ingresosDia(), pagoService.deudasPendientes()]);
      if (ingresosDiaRes.status === 'fulfilled') {
        const data = ingresosDiaRes.value.data;
        setSummary((prev) => ({ ...prev, ingresosDia: data.ingresosDia || data.total || 0, ingresosMes: data.ingresosMes || 0, totalIngresos: data.totalIngresos || 0 }));
      }
      if (deudasRes.status === 'fulfilled') {
        const data = deudasRes.value.data;
        const list = Array.isArray(data) ? data : data.content || [];
        setSummary((prev) => ({ ...prev, deudasPendientes: list.reduce((sum, item) => sum + Number(item.saldo || item.deuda || 0), 0) }));
      }
    };
    loadSummary();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setPacientes([]); return; }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await pacienteService.buscar(searchTerm.trim());
        const data = response.data;
        setPacientes(Array.isArray(data) ? data : data.content || []);
        setShowPacienteDropdown(true);
      } catch { setPacientes([]); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!showModal || !form.pacienteId) { setTratamientos([]); return; }
    const loadTratamientos = async () => {
      try {
        const response = await tratamientoService.listar({ pacienteId: form.pacienteId });
        const data = response.data;
        setTratamientos(Array.isArray(data) ? data : data.content || []);
      } catch { setTratamientos([]); }
    };
    loadTratamientos();
  }, [showModal, form.pacienteId]);

  const visibleTotal = useMemo(() => pagos.reduce((sum, pago) => sum + Number(pago.montoPagado || pago.monto || 0), 0), [pagos]);
  const saldoCalculado = () => Math.max(0, (parseFloat(form.montoTotal) || 0) - (parseFloat(form.montoPagado) || 0));

  const selectPaciente = (paciente) => {
    setForm((prev) => ({ ...prev, pacienteId: paciente.id, tratamientoId: '', montoTotal: '' }));
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setSelectedTratamiento(null);
    setSearchTerm('');
    setShowPacienteDropdown(false);
    setErrors((prev) => ({ ...prev, pacienteId: '' }));
  };

  const selectTratamiento = (trat) => {
    const amount = trat.costoTotal || trat.monto || trat.precioFinal || trat.precio || 0;
    setForm((prev) => ({ ...prev, tratamientoId: trat.id, montoTotal: amount }));
    setSelectedTratamiento(`${trat.codigo || trat.nombre || 'Tratamiento'} - ${formatCurrency(amount)}`);
    setErrors((prev) => ({ ...prev, tratamientoId: '' }));
  };

  const openModal = () => {
    setForm(initialForm);
    setErrors({});
    setSearchTerm('');
    setSelectedPacienteName('');
    setSelectedTratamiento(null);
    setShowModal(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.pacienteId) newErrors.pacienteId = 'Seleccione un paciente';
    if (!form.tratamientoId) newErrors.tratamientoId = 'Seleccione un tratamiento';
    if (!form.montoTotal || parseFloat(form.montoTotal) <= 0) newErrors.montoTotal = 'Monto total invalido';
    if (form.montoPagado === '' || parseFloat(form.montoPagado) < 0) newErrors.montoPagado = 'Monto pagado invalido';
    if (parseFloat(form.montoPagado) > parseFloat(form.montoTotal)) newErrors.montoPagado = 'No puede pagar mas que el total';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) { toast.error('Corrige los errores del formulario'); return; }
    setSaving(true);
    try {
      await pagoService.crear({ pacienteId: form.pacienteId, tratamientoId: form.tratamientoId, montoTotal: parseFloat(form.montoTotal), montoPagado: parseFloat(form.montoPagado), metodoPago: form.metodoPago, numeroOperacion: form.numeroOperacion.trim() || undefined, observaciones: form.observaciones.trim() || undefined });
      toast.success('Pago registrado exitosamente');
      setShowModal(false);
      fetchPagos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    } finally { setSaving(false); }
  };

  const clearFilters = () => setFiltros({ paciente: '', fechaDesde: '', fechaHasta: '', metodoPago: '' });

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
    return <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-700/60 bg-slate-800/40"><button disabled={page === 0} onClick={() => setPage(page - 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_left</span></button>{pages.map((p) => <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-xs font-bold ${p === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{p + 1}</button>)}<button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button></div>;
  };

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Caja y finanzas</p><h1 className="font-['Geist'] text-3xl lg:text-4xl font-black text-white tracking-tight mt-2">Pagos</h1><p className="text-sm text-slate-400 mt-1">Control de ingresos, deudas, metodos de pago y movimientos de caja.</p></div><button onClick={openModal} className="self-start xl:self-auto rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 flex items-center gap-2"><span className="material-symbols-outlined text-lg">add</span>Nuevo pago</button></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5"><StatCard icon="account_balance_wallet" label="Total ingresos" value={formatCurrency(summary.totalIngresos || visibleTotal)} color="emerald" /><StatCard icon="today" label="Ingresos del dia" value={formatCurrency(summary.ingresosDia)} color="blue" /><StatCard icon="calendar_month" label="Ingresos del mes" value={formatCurrency(summary.ingresosMes)} color="cyan" /><StatCard icon="warning" label="Deudas pendientes" value={formatCurrency(summary.deudasPendientes)} color="rose" /></div>

      <section className="rounded-3xl border border-slate-700/50 bg-[#1E293B] shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 bg-slate-800/40 grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_220px_auto] gap-3"><FilterInput placeholder="Buscar paciente..." value={filtros.paciente} onChange={(v) => setFiltros((p) => ({ ...p, paciente: v }))} icon="search" /><FilterInput type="date" value={filtros.fechaDesde} onChange={(v) => setFiltros((p) => ({ ...p, fechaDesde: v }))} /><FilterInput type="date" value={filtros.fechaHasta} onChange={(v) => setFiltros((p) => ({ ...p, fechaHasta: v }))} /><select value={filtros.metodoPago} onChange={(e) => setFiltros((p) => ({ ...p, metodoPago: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500"><option value="">Todos los metodos</option>{METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}</select><div className="flex gap-2"><button onClick={fetchPagos} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500">Buscar</button><button onClick={clearFilters} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">Limpiar</button></div></div>

        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400"><span>{totalElements > 0 ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalElements)} de ${totalElements}` : 'Sin resultados'}</span><span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 font-bold">Movimientos</span></div>

        {loading ? <Loading text="Cargando pagos..." /> : pagos.length === 0 ? <EmptyState hasFilter={Boolean(filtros.paciente || filtros.fechaDesde || filtros.fechaHasta || filtros.metodoPago)} clear={clearFilters} create={openModal} /> : <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead className="bg-slate-800/80 border-b border-slate-700/60"><tr>{['Paciente', 'Fecha', 'Monto', 'Metodo', 'Operacion', 'Saldo', 'Acciones'].map((h) => <th key={h} className={`px-6 py-3.5 text-xs font-['Geist'] font-bold text-slate-400 uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : ''}`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-700/40">{pagos.map((pago) => <tr key={pago.id} className="hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4"><span className="block font-bold text-white text-sm">{getPatientName(pago)}</span><span className="block text-xs text-slate-400">Pago #{pago.id}</span></td><td className="px-6 py-4 text-xs text-slate-400">{formatDate(pago.fecha)}</td><td className="px-6 py-4 text-sm font-black text-emerald-400">{formatCurrency(pago.montoPagado || pago.monto)}</td><td className="px-6 py-4"><span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">{pago.metodoPago || '-'}</span></td><td className="px-6 py-4 text-xs text-slate-400">{pago.numeroOperacion || '-'}</td><td className="px-6 py-4 text-sm font-bold text-amber-400">{formatCurrency(pago.saldo || 0)}</td><td className="px-6 py-4"><div className="flex justify-end"><IconButton icon="visibility" color="text-sky-400" onClick={() => setViewPago(pago)} /></div></td></tr>)}</tbody></table></div>}
        {renderPagination()}
      </section>

      {showModal && <PaymentModal form={form} setForm={setForm} errors={errors} saving={saving} onClose={() => !saving && setShowModal(false)} onSubmit={handleSubmit} searchTerm={searchTerm} setSearchTerm={setSearchTerm} pacientes={pacientes} showPacienteDropdown={showPacienteDropdown} setShowPacienteDropdown={setShowPacienteDropdown} selectPaciente={selectPaciente} selectedPacienteName={selectedPacienteName} tratamientos={tratamientos} selectedTratamiento={selectedTratamiento} selectTratamiento={selectTratamiento} saldo={saldoCalculado()} />}
      {viewPago && <ViewModal pago={viewPago} onClose={() => setViewPago(null)} />}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => { const map = { emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20', cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }; return <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-5 flex items-center gap-4 shadow-xl shadow-black/10"><div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${map[color]}`}><span className="material-symbols-outlined">{icon}</span></div><div><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 font-['Geist'] text-2xl font-black text-white">{value}</p></div></div>; };
const FilterInput = ({ icon, value, onChange, ...props }) => <div className="relative">{icon && <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">{icon}</span>}<input {...props} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 ${icon ? 'pl-11' : 'px-3'} pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500`} /></div>;
const IconButton = ({ icon, color, onClick }) => <button type="button" onClick={onClick} className={`p-2 rounded-xl ${color} hover:bg-slate-700/70`}><span className="material-symbols-outlined text-lg">{icon}</span></button>;
const Loading = ({ text }) => <div className="py-24 text-center text-slate-500"><span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span><p className="mt-3 text-sm">{text}</p></div>;
const EmptyState = ({ hasFilter, clear, create }) => <div className="py-24 text-center text-slate-500"><div className="mx-auto w-20 h-20 rounded-3xl border border-slate-700/60 bg-slate-800/70 flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-slate-500">credit_card</span></div><p className="mt-5 text-lg font-semibold text-slate-300">{hasFilter ? 'No se encontraron pagos con esos criterios' : 'No hay pagos registrados'}</p><div className="mt-4 flex justify-center gap-2">{hasFilter && <button className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700" onClick={clear}>Limpiar filtros</button>}<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500" onClick={create}>Crear primer pago</button></div></div>;
const BaseModal = ({ title, children, onClose, max = 'max-w-3xl' }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className={`w-full ${max} max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300`}><div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4 mb-5"><h3 className="font-['Geist'] text-xl font-bold text-white m-0">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button></div>{children}</div></div>;
const Info = ({ label, value }) => <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-3"><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 mt-1 font-semibold text-white">{value}</p></div>;
const PaymentModal = ({ form, setForm, errors, saving, onClose, onSubmit, searchTerm, setSearchTerm, pacientes, showPacienteDropdown, setShowPacienteDropdown, selectPaciente, selectedPacienteName, tratamientos, selectedTratamiento, selectTratamiento, saldo }) => <BaseModal title="Registrar pago" onClose={onClose} max="max-w-5xl"><form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="lg:col-span-2 space-y-4"><SearchBox label="Paciente" value={selectedPacienteName || searchTerm} onChange={(v) => { setSearchTerm(v); if (form.pacienteId) setForm((p) => ({ ...p, pacienteId: '', tratamientoId: '', montoTotal: '' })); }} placeholder="Buscar paciente..." error={errors.pacienteId} dropdown={showPacienteDropdown && pacientes.length > 0 && pacientes.map((p) => <button key={p.id} type="button" onMouseDown={() => selectPaciente(p)} className="w-full text-left px-4 py-3 hover:bg-slate-700"><span className="block text-sm font-bold text-white">{p.nombres} {p.apellidos}</span><span className="text-xs text-slate-400">DNI: {p.dni || '-'}</span></button>)} onFocus={() => pacientes.length > 0 && setShowPacienteDropdown(true)} onBlur={() => window.setTimeout(() => setShowPacienteDropdown(false), 180)} /><div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tratamiento</label><select value={form.tratamientoId} onChange={(e) => { const trat = tratamientos.find((t) => String(t.id) === e.target.value); if (trat) selectTratamiento(trat); }} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500"><option value="">Seleccionar tratamiento...</option>{tratamientos.map((t) => <option key={t.id} value={t.id}>{t.nombre || t.descripcion || `Tratamiento ${t.id}`}</option>)}</select>{errors.tratamientoId && <p className="mt-1 text-xs text-rose-400">{errors.tratamientoId}</p>}{selectedTratamiento && <p className="mt-2 text-xs text-blue-400">{selectedTratamiento}</p>}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Monto total" type="number" value={form.montoTotal} error={errors.montoTotal} onChange={(v) => setForm((p) => ({ ...p, montoTotal: v }))} /><Input label="Monto pagado" type="number" value={form.montoPagado} error={errors.montoPagado} onChange={(v) => setForm((p) => ({ ...p, montoPagado: v }))} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Metodo</label><select value={form.metodoPago} onChange={(e) => setForm((p) => ({ ...p, metodoPago: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500">{METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div><Input label="Operacion" value={form.numeroOperacion} onChange={(v) => setForm((p) => ({ ...p, numeroOperacion: v }))} /></div><div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Observaciones</label><textarea rows={3} value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500" /></div></div><aside className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 h-fit space-y-4"><h3 className="font-['Geist'] text-lg font-bold text-white m-0">Resumen</h3><SummaryRow label="Total" value={formatCurrency(form.montoTotal || 0)} /><SummaryRow label="Pagado" value={formatCurrency(form.montoPagado || 0)} /><div className="border-t border-blue-500/20 pt-4"><SummaryRow label="Saldo" value={formatCurrency(saldo)} strong /></div><button disabled={saving} type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? 'Guardando...' : 'Registrar pago'}</button></aside></form></BaseModal>;
const SearchBox = ({ label, value, onChange, placeholder, error, dropdown, onFocus, onBlur }) => <div className="relative"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500" />{error && <p className="mt-1 text-xs text-rose-400">{error}</p>}{dropdown && <div className="absolute z-[120] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl custom-scrollbar">{dropdown}</div>}</div>;
const Input = ({ label, value, onChange, error, ...props }) => <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</label><input {...props} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500" />{error && <p className="mt-1 text-xs text-rose-400">{error}</p>}</div>;
const SummaryRow = ({ label, value, strong }) => <div className="flex items-center justify-between gap-4"><span className="text-sm text-blue-200">{label}</span><span className={`font-['Geist'] ${strong ? 'text-2xl font-black text-white' : 'font-bold text-white'}`}>{value}</span></div>;
const ViewModal = ({ pago, onClose }) => <BaseModal title="Detalle de pago" onClose={onClose}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Info label="Paciente" value={getPatientName(pago)} /><Info label="Fecha" value={formatDate(pago.fecha)} /><Info label="Monto" value={formatCurrency(pago.montoPagado || pago.monto)} /><Info label="Metodo" value={pago.metodoPago || '-'} /><Info label="Operacion" value={pago.numeroOperacion || '-'} /><Info label="Observaciones" value={pago.observaciones || '-'} /></div><div className="flex justify-end mt-6"><button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button></div></BaseModal>;

export default Pagos;
