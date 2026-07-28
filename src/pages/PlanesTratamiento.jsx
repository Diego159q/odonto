import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { pacienteService, planTratamientoService, diagnosticoService, tratamientoService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADOS = ['BORRADOR', 'PENDIENTE_APROBACION', 'ACEPTADO', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];

const statusClass = {
  BORRADOR: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  PENDIENTE_APROBACION: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ACEPTADO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  EN_PROGRESO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  COMPLETADO: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  CANCELADO: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const formatCurrency = (value) => {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getPatientName = (plan) => {
  if (plan.paciente) return `${plan.paciente.nombres || ''} ${plan.paciente.apellidos || ''}`.trim() || 'Paciente';
  return plan.pacienteNombre || 'Paciente';
};

const getPlanTreatments = (plan) => plan.tratamientos || plan.detalles || plan.items || [];

const PlanesTratamiento = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [searchTermPaciente, setSearchTermPaciente] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteName, setSelectedPacienteName] = useState('');
  const [formPacienteId, setFormPacienteId] = useState('');
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState('');
  const [tratamientosDisponibles, setTratamientosDisponibles] = useState([]);
  const [selectedTratamientos, setSelectedTratamientos] = useState([]);
  const [searchTratamiento, setSearchTratamiento] = useState('');
  const [showTratamientoDropdown, setShowTratamientoDropdown] = useState(false);
  const [descuentoPlan, setDescuentoPlan] = useState('0');
  const [adelantoPlan, setAdelantoPlan] = useState('0');
  const [viewPlan, setViewPlan] = useState(null);
  const [aceptarPlanId, setAceptarPlanId] = useState(null);
  const [aceptarLoading, setAceptarLoading] = useState(false);

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchPaciente.trim()) params.search = searchPaciente.trim();
      const response = await planTratamientoService.listar(params);
      const data = response.data;
      setPlanes(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar planes de tratamiento');
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }, [searchPaciente]);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  useEffect(() => {
    const loadDiagnosticos = async () => {
      try {
        const response = await diagnosticoService.listar();
        const data = response.data;
        setDiagnosticos(Array.isArray(data) ? data : data.content || []);
      } catch {
        // No bloquea la pantalla.
      }
    };
    loadDiagnosticos();
  }, []);

  useEffect(() => {
    if (!searchTermPaciente.trim()) {
      setPacientes([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await pacienteService.buscar(searchTermPaciente.trim());
        const data = response.data;
        setPacientes(Array.isArray(data) ? data : data.content || []);
        setShowPacienteDropdown(true);
      } catch {
        setPacientes([]);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTermPaciente]);

  useEffect(() => {
    if (!searchTratamiento.trim()) {
      setTratamientosDisponibles([]);
      return;
    }
    const timeout = window.setTimeout(async () => {
      try {
        const response = await tratamientoService.listar({ search: searchTratamiento.trim(), page: 0, size: 20 });
        const data = response.data;
        setTratamientosDisponibles(data.content || (Array.isArray(data) ? data : []));
        setShowTratamientoDropdown(true);
      } catch {
        setTratamientosDisponibles([]);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTratamiento]);

  const totals = useMemo(() => {
    const total = selectedTratamientos.reduce((sum, treatment) => sum + (parseFloat(treatment.precio) || 0), 0);
    const descuento = parseFloat(descuentoPlan) || 0;
    const adelanto = parseFloat(adelantoPlan) || 0;
    return { total, descuento, adelanto, saldo: Math.max(0, total - descuento - adelanto) };
  }, [selectedTratamientos, descuentoPlan, adelantoPlan]);

  const stats = useMemo(() => {
    const accepted = planes.filter((plan) => ['ACEPTADO', 'EN_PROGRESO', 'COMPLETADO'].includes(plan.estado)).length;
    const pending = planes.filter((plan) => ['BORRADOR', 'PENDIENTE_APROBACION'].includes(plan.estado)).length;
    const totalAmount = planes.reduce((sum, plan) => sum + Number(plan.total || 0), 0);
    const balance = planes.reduce((sum, plan) => sum + Number(plan.saldo || 0), 0);
    return [
      { label: 'Planes visibles', value: planes.length, icon: 'description', color: 'blue' },
      { label: 'Aceptados', value: accepted, icon: 'task_alt', color: 'emerald' },
      { label: 'Pendientes', value: pending, icon: 'pending_actions', color: 'amber' },
      { label: 'Saldo total', value: formatCurrency(balance || totalAmount), icon: 'payments', color: 'purple' },
    ];
  }, [planes]);

  const selectPaciente = (paciente) => {
    setSelectedPacienteName(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim());
    setFormPacienteId(paciente.id);
    setSearchTermPaciente('');
    setShowPacienteDropdown(false);
  };

  const addTratamiento = (tratamiento) => {
    if (selectedTratamientos.find((item) => item.tratamientoId === tratamiento.id)) {
      toast.warning('Este tratamiento ya esta agregado');
      return;
    }
    setSelectedTratamientos((current) => [
      ...current,
      { tratamientoId: tratamiento.id, nombre: tratamiento.nombre, precio: tratamiento.precioFinal || tratamiento.precio || '0' },
    ]);
    setSearchTratamiento('');
    setShowTratamientoDropdown(false);
  };

  const resetForm = () => {
    setFormPacienteId('');
    setSelectedPacienteName('');
    setSearchTermPaciente('');
    setSelectedDiagnostico('');
    setSelectedTratamientos([]);
    setDescuentoPlan('0');
    setAdelantoPlan('0');
    setSearchTratamiento('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCreatePlan = async () => {
    if (!formPacienteId) {
      toast.warning('Debe seleccionar un paciente');
      return;
    }
    if (selectedTratamientos.length === 0) {
      toast.warning('Debe agregar al menos un tratamiento');
      return;
    }
    setSaving(true);
    try {
      await planTratamientoService.crear({
        pacienteId: formPacienteId,
        diagnosticoId: selectedDiagnostico ? Number(selectedDiagnostico) : undefined,
        tratamientos: selectedTratamientos.map((item) => ({ tratamientoId: item.tratamientoId, precioAplicado: parseFloat(item.precio) || 0 })),
        descuento: totals.descuento,
        adelanto: totals.adelanto,
        total: totals.total,
        saldo: totals.saldo,
      });
      toast.success('Plan de tratamiento creado exitosamente');
      setShowModal(false);
      fetchPlanes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear plan de tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleAceptarPlan = async () => {
    if (!aceptarPlanId) return;
    setAceptarLoading(true);
    try {
      await planTratamientoService.aceptar(aceptarPlanId);
      toast.success('Plan aceptado por el paciente');
      setAceptarPlanId(null);
      fetchPlanes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al aceptar plan');
    } finally {
      setAceptarLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Planificacion clinica</p>
          <h1 className="font-['Geist'] text-3xl lg:text-4xl font-black text-white tracking-tight mt-2">Planes de tratamiento</h1>
          <p className="text-sm text-slate-400 mt-1">Presupuestos clinicos, aprobaciones, saldos y tratamientos por paciente.</p>
        </div>
        <button onClick={openCreateModal} className="self-start xl:self-auto rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <section className="rounded-3xl border border-slate-700/50 bg-[#1E293B] shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-slate-800/40">
          <div className="relative flex-1 max-w-2xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
            <input
              value={searchPaciente}
              onChange={(event) => setSearchPaciente(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && fetchPlanes()}
              placeholder="Buscar por paciente..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-11 text-sm text-white placeholder-slate-500 focus:border-blue-500"
            />
            {searchPaciente && <button onClick={() => setSearchPaciente('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><span className="material-symbols-outlined text-lg">close</span></button>}
          </div>
          <div className="flex gap-2">
            <button onClick={fetchPlanes} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">search</span>Buscar</button>
            <button onClick={() => setSearchPaciente('')} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">ink_eraser</span>Limpiar</button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>{planes.length > 0 ? `${planes.length} registro(s)` : 'Sin resultados'}</span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 font-bold">Pipeline clinico</span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-500"><span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span><p className="mt-3 text-sm">Cargando planes...</p></div>
        ) : planes.length === 0 ? (
          <EmptyState search={searchPaciente} clear={() => setSearchPaciente('')} create={openCreateModal} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/80 border-b border-slate-700/60">
                <tr>
                  {['Paciente', 'Diagnostico', 'Total', 'Adelanto', 'Saldo', 'Estado', 'Acciones'].map((header) => <th key={header} className={`px-6 py-3.5 text-xs font-['Geist'] font-bold text-slate-400 uppercase tracking-wider ${header === 'Acciones' ? 'text-right' : ''}`}>{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {planes.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4"><button onClick={() => setViewPlan(plan)} className="text-left"><span className="block font-bold text-white text-sm hover:text-blue-400">{getPatientName(plan)}</span><span className="block text-xs text-slate-400">Plan #{plan.id}</span></button></td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[240px] truncate">{plan.diagnostico?.nombre || plan.diagnosticoNombre || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{formatCurrency(plan.total)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-400">{formatCurrency(plan.adelanto || 0)}</td>
                    <td className="px-6 py-4 text-sm font-black text-amber-400">{formatCurrency(plan.saldo)}</td>
                    <td className="px-6 py-4"><StatusBadge estado={plan.estado} /></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-1.5"><IconButton icon="visibility" color="text-sky-400" onClick={() => setViewPlan(plan)} />{!['ACEPTADO', 'COMPLETADO', 'CANCELADO'].includes(plan.estado) && <IconButton icon="check_circle" color="text-emerald-400" onClick={() => setAceptarPlanId(plan.id)} />}<IconButton icon="print" color="text-slate-400" onClick={() => toast.info('Generacion de PDF proximamente')} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <PlanModal
          saving={saving}
          onClose={() => !saving && setShowModal(false)}
          selectedPacienteName={selectedPacienteName}
          searchTermPaciente={searchTermPaciente}
          setSearchTermPaciente={(value) => { setSearchTermPaciente(value); if (formPacienteId) { setFormPacienteId(''); setSelectedPacienteName(''); } }}
          pacientes={pacientes}
          showPacienteDropdown={showPacienteDropdown}
          setShowPacienteDropdown={setShowPacienteDropdown}
          selectPaciente={selectPaciente}
          diagnosticos={diagnosticos}
          selectedDiagnostico={selectedDiagnostico}
          setSelectedDiagnostico={setSelectedDiagnostico}
          searchTratamiento={searchTratamiento}
          setSearchTratamiento={setSearchTratamiento}
          tratamientosDisponibles={tratamientosDisponibles}
          showTratamientoDropdown={showTratamientoDropdown}
          setShowTratamientoDropdown={setShowTratamientoDropdown}
          addTratamiento={addTratamiento}
          selectedTratamientos={selectedTratamientos}
          setSelectedTratamientos={setSelectedTratamientos}
          descuentoPlan={descuentoPlan}
          setDescuentoPlan={setDescuentoPlan}
          adelantoPlan={adelantoPlan}
          setAdelantoPlan={setAdelantoPlan}
          totals={totals}
          onSave={handleCreatePlan}
        />
      )}

      {viewPlan && <ViewPlanModal plan={viewPlan} onClose={() => setViewPlan(null)} onAccept={() => { setAceptarPlanId(viewPlan.id); setViewPlan(null); }} />}
      {aceptarPlanId && <ConfirmAcceptModal loading={aceptarLoading} onClose={() => setAceptarPlanId(null)} onConfirm={handleAceptarPlan} />}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-5 flex items-center gap-4 shadow-xl shadow-black/10"><div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${colors[color]}`}><span className="material-symbols-outlined">{icon}</span></div><div><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 font-['Geist'] text-2xl font-black text-white">{value}</p></div></div>;
};

const StatusBadge = ({ estado }) => <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass[estado] || statusClass.BORRADOR}`}>{estado || 'BORRADOR'}</span>;
const IconButton = ({ icon, color, onClick }) => <button type="button" onClick={onClick} className={`p-2 rounded-xl ${color} hover:bg-slate-700/70`}><span className="material-symbols-outlined text-lg">{icon}</span></button>;

const EmptyState = ({ search, clear, create }) => <div className="py-24 text-center text-slate-500"><div className="mx-auto w-20 h-20 rounded-3xl border border-slate-700/60 bg-slate-800/70 flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-slate-500">clinical_notes</span></div><p className="mt-5 text-lg font-semibold text-slate-300">{search ? 'No se encontraron planes con ese paciente' : 'No hay planes de tratamiento registrados'}</p><div className="mt-4 flex justify-center gap-2">{search && <button className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700" onClick={clear}>Limpiar busqueda</button>}<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500" onClick={create}>Crear primer plan</button></div></div>;

const PlanModal = ({ saving, onClose, selectedPacienteName, searchTermPaciente, setSearchTermPaciente, pacientes, showPacienteDropdown, setShowPacienteDropdown, selectPaciente, diagnosticos, selectedDiagnostico, setSelectedDiagnostico, searchTratamiento, setSearchTratamiento, tratamientosDisponibles, showTratamientoDropdown, setShowTratamientoDropdown, addTratamiento, selectedTratamientos, setSelectedTratamientos, descuentoPlan, setDescuentoPlan, adelantoPlan, setAdelantoPlan, totals, onSave }) => (
  <BaseModal title="Nuevo plan de tratamiento" icon="add_circle" onClose={onClose} max="max-w-5xl">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBox label="Paciente" value={selectedPacienteName || searchTermPaciente} placeholder="Buscar paciente..." onChange={setSearchTermPaciente} disabled={saving} onFocus={() => pacientes.length > 0 && setShowPacienteDropdown(true)} onBlur={() => window.setTimeout(() => setShowPacienteDropdown(false), 180)} dropdown={showPacienteDropdown && pacientes.length > 0 && pacientes.map((paciente) => <button key={paciente.id} type="button" onMouseDown={() => selectPaciente(paciente)} className="w-full text-left px-4 py-3 hover:bg-slate-700"><span className="block text-sm font-bold text-white">{paciente.nombres} {paciente.apellidos}</span><span className="text-xs text-slate-400">DNI: {paciente.dni || '-'}</span></button>)} />
          <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Diagnostico</label><select value={selectedDiagnostico} onChange={(e) => setSelectedDiagnostico(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white focus:border-blue-500"><option value="">Sin diagnostico asociado</option>{diagnosticos.map((diagnostico) => <option key={diagnostico.id} value={diagnostico.id}>{diagnostico.nombre || diagnostico.descripcion}</option>)}</select></div>
        </div>

        <SearchBox label="Agregar tratamiento" value={searchTratamiento} placeholder="Buscar tratamiento..." onChange={setSearchTratamiento} disabled={saving} onFocus={() => tratamientosDisponibles.length > 0 && setShowTratamientoDropdown(true)} onBlur={() => window.setTimeout(() => setShowTratamientoDropdown(false), 180)} dropdown={showTratamientoDropdown && tratamientosDisponibles.length > 0 && tratamientosDisponibles.map((tratamiento) => <button key={tratamiento.id} type="button" onMouseDown={() => addTratamiento(tratamiento)} className="w-full text-left px-4 py-3 hover:bg-slate-700"><span className="block text-sm font-bold text-white">{tratamiento.nombre}</span><span className="text-xs text-slate-400">{formatCurrency(tratamiento.precioFinal || tratamiento.precio || 0)}</span></button>)} />

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 overflow-hidden">
          {selectedTratamientos.length === 0 ? <div className="py-12 text-center text-slate-500"><span className="material-symbols-outlined text-4xl">playlist_add</span><p className="mt-2 text-sm">Agrega tratamientos al plan.</p></div> : selectedTratamientos.map((item, index) => <div key={`${item.tratamientoId}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-700/50 p-4 last:border-0"><div><p className="m-0 font-bold text-white">{item.nombre}</p><p className="m-0 text-xs text-slate-400">Tratamiento #{item.tratamientoId}</p></div><div className="flex items-center gap-2"><input type="number" value={item.precio} onChange={(e) => setSelectedTratamientos((current) => current.map((t, i) => i === index ? { ...t, precio: e.target.value } : t))} className="w-32 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button type="button" onClick={() => setSelectedTratamientos((current) => current.filter((_, i) => i !== index))} className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"><span className="material-symbols-outlined">delete</span></button></div></div>)}
        </div>
      </div>

      <aside className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 h-fit space-y-4">
        <h3 className="font-['Geist'] text-lg font-bold text-white m-0">Resumen financiero</h3>
        <SummaryRow label="Subtotal" value={formatCurrency(totals.total)} />
        <MoneyInput label="Descuento" value={descuentoPlan} onChange={setDescuentoPlan} disabled={saving} />
        <MoneyInput label="Adelanto" value={adelantoPlan} onChange={setAdelantoPlan} disabled={saving} />
        <div className="border-t border-blue-500/20 pt-4"><SummaryRow label="Saldo" value={formatCurrency(totals.saldo)} strong /></div>
        <button disabled={saving} onClick={onSave} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? 'Guardando...' : 'Crear plan'}</button>
      </aside>
    </div>
  </BaseModal>
);

const SearchBox = ({ label, value, placeholder, onChange, disabled, onFocus, onBlur, dropdown }) => <div className="relative"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur} disabled={disabled} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500" />{dropdown && <div className="absolute z-[120] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl custom-scrollbar">{dropdown}</div>}</div>;
const MoneyInput = ({ label, value, onChange, disabled }) => <div><label className="block text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">{label}</label><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-blue-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white" /></div>;
const SummaryRow = ({ label, value, strong }) => <div className="flex items-center justify-between gap-4"><span className="text-sm text-blue-200">{label}</span><span className={`font-['Geist'] ${strong ? 'text-2xl font-black text-white' : 'font-bold text-white'}`}>{value}</span></div>;

const ViewPlanModal = ({ plan, onClose, onAccept }) => {
  const treatments = getPlanTreatments(plan);
  return <BaseModal title={`Plan #${plan.id}`} icon="clinical_notes" onClose={onClose}><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Info label="Paciente" value={getPatientName(plan)} /><Info label="Diagnostico" value={plan.diagnostico?.nombre || plan.diagnosticoNombre || '-'} /><Info label="Total" value={formatCurrency(plan.total)} /><Info label="Saldo" value={formatCurrency(plan.saldo)} /><Info label="Estado" value={plan.estado || 'BORRADOR'} /></div><div className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/50 overflow-hidden"><div className="px-4 py-3 border-b border-slate-700/60 text-xs font-bold uppercase tracking-wider text-slate-400">Tratamientos incluidos</div>{treatments.length === 0 ? <p className="p-4 text-sm text-slate-500 m-0">Sin detalle de tratamientos.</p> : treatments.map((item, index) => <div key={index} className="flex justify-between gap-3 p-4 border-b border-slate-700/40 last:border-0"><span className="text-sm font-semibold text-white">{item.nombre || item.tratamiento?.nombre || `Tratamiento ${index + 1}`}</span><span className="text-sm font-bold text-blue-400">{formatCurrency(item.precioAplicado || item.precio || item.tratamiento?.precio || 0)}</span></div>)}</div><div className="flex justify-end gap-2 mt-6"><button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cerrar</button>{!['ACEPTADO', 'COMPLETADO', 'CANCELADO'].includes(plan.estado) && <button onClick={onAccept} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Aceptar plan</button>}</div></BaseModal>;
};

const ConfirmAcceptModal = ({ loading, onClose, onConfirm }) => <BaseModal title="Aceptar plan" icon="task_alt" onClose={onClose} max="max-w-md"><p className="text-sm text-slate-300">Confirmas que el paciente acepto este plan de tratamiento?</p><div className="flex justify-end gap-2 mt-6"><button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cancelar</button><button onClick={onConfirm} disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">{loading ? 'Procesando...' : 'Aceptar'}</button></div></BaseModal>;

const BaseModal = ({ title, icon, onClose, children, max = 'max-w-3xl' }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className={`w-full ${max} max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300`}><div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4 mb-5"><h3 className="font-['Geist'] text-xl font-bold text-white m-0 flex items-center gap-2"><span className="material-symbols-outlined text-blue-400">{icon}</span>{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button></div>{children}</div></div>;
const Info = ({ label, value }) => <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-3"><p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="m-0 mt-1 font-semibold text-white">{value}</p></div>;

export default PlanesTratamiento;
