import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { odontogramaService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ESTADOS = [
  { value: 'SANO', label: 'Sano', color: 'emerald', icon: 'check_circle' },
  { value: 'CARIES', label: 'Caries', color: 'rose', icon: 'cancel' },
  { value: 'AUSENTE', label: 'Ausente', color: 'slate', icon: 'close' },
  { value: 'EXTRACCION_INDICADA', label: 'Extraccion indicada', color: 'amber', icon: 'warning' },
  { value: 'EXTRACCION_REALIZADA', label: 'Extraccion realizada', color: 'blue', icon: 'done_all' },
  { value: 'CORONA', label: 'Corona', color: 'amber', icon: 'workspace_premium' },
  { value: 'PROTESIS', label: 'Protesis', color: 'purple', icon: 'construction' },
  { value: 'IMPLANTE', label: 'Implante', color: 'teal', icon: 'anchor' },
  { value: 'RESINA', label: 'Resina', color: 'sky', icon: 'build' },
  { value: 'ENDODONCIA', label: 'Endodoncia', color: 'purple', icon: 'healing' },
  { value: 'FRACTURA', label: 'Fractura', color: 'rose', icon: 'crisis_alert' },
  { value: 'SELLANTE', label: 'Sellante', color: 'cyan', icon: 'shield' },
  { value: 'TRATAMIENTO_PENDIENTE', label: 'Tratamiento pendiente', color: 'amber', icon: 'pending_actions' },
  { value: 'TRATAMIENTO_REALIZADO', label: 'Tratamiento realizado', color: 'blue', icon: 'task_alt' },
  { value: 'OBSERVACION', label: 'Observacion', color: 'yellow', icon: 'sticky_note_2' },
];

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const colorClasses = {
  emerald: 'border-emerald-500/70 bg-emerald-500/15 text-emerald-400',
  rose: 'border-rose-500/70 bg-rose-500/15 text-rose-400',
  slate: 'border-slate-600 bg-slate-800/80 text-slate-500 line-through',
  amber: 'border-amber-500/70 bg-amber-500/15 text-amber-400',
  blue: 'border-blue-500/70 bg-blue-500/15 text-blue-400',
  purple: 'border-purple-500/70 bg-purple-500/15 text-purple-400',
  teal: 'border-teal-500/70 bg-teal-500/15 text-teal-400',
  sky: 'border-sky-500/70 bg-sky-500/15 text-sky-400',
  cyan: 'border-cyan-500/70 bg-cyan-500/15 text-cyan-400',
  yellow: 'border-yellow-500/70 bg-yellow-500/15 text-yellow-400',
};

const getEstadoConfig = (estado) => ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [odontogramaId, setOdontogramaId] = useState(null);
  const [piezas, setPiezas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState('SANO');
  const [selectedObservacion, setSelectedObservacion] = useState('');

  useEffect(() => {
    const fetchOdontograma = async () => {
      setLoading(true);
      try {
        const response = await odontogramaService.buscarPorPaciente(pacienteId);
        const data = response.data;
        setOdontogramaId(data.id);
        const piezasMap = {};
        if (data.detalles && Array.isArray(data.detalles)) {
          data.detalles.forEach((det) => {
            piezasMap[det.numeroPieza] = {
              estado: det.estado || 'SANO',
              observacion: det.observacion || '',
            };
          });
        }
        setPiezas(piezasMap);
      } catch {
        setOdontogramaId(null);
        setPiezas({});
      } finally {
        setLoading(false);
      }
    };
    fetchOdontograma();
  }, [pacienteId]);

  const getToothState = (num) => piezas[num] || { estado: 'SANO', observacion: '' };

  const openToothModal = (num) => {
    const state = getToothState(num);
    setSelectedTooth(num);
    setSelectedEstado(state.estado);
    setSelectedObservacion(state.observacion || '');
  };

  const handleSaveTooth = () => {
    if (!selectedTooth) return;
    setPiezas((prev) => ({
      ...prev,
      [selectedTooth]: { estado: selectedEstado, observacion: selectedObservacion },
    }));
    setSelectedTooth(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const detalles = Object.entries(piezas).map(([num, state]) => ({
        numeroPieza: Number(num),
        estado: state.estado,
        observacion: state.observacion || '',
      }));

      if (odontogramaId) {
        await odontogramaService.actualizarEstadoPieza(odontogramaId, { detalles });
        toast.success('Odontograma actualizado exitosamente');
      } else {
        const response = await odontogramaService.crear({ pacienteId: Number(pacienteId), detalles });
        setOdontogramaId(response.data.id);
        toast.success('Odontograma creado exitosamente');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar odontograma';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderTooth = (num) => {
    const state = getToothState(num);
    const config = getEstadoConfig(state.estado);
    const isSelected = selectedTooth === num;
    return (
      <button
        type="button"
        key={num}
        onClick={() => openToothModal(num)}
        title={`Pieza ${num}: ${config.label}`}
        className={`min-w-[54px] rounded-xl border-2 p-2 transition-all ${colorClasses[config.color]} ${isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'}`}
      >
        <span className="block text-[11px] font-bold">#{num}</span>
        <span className="material-symbols-outlined block text-2xl leading-none">{config.icon}</span>
      </button>
    );
  };

  const renderArch = (title, sideA, sideB) => (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{title}</span>
        <span className="text-[10px] font-bold uppercase text-slate-500">FDI</span>
      </div>
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-2">{sideA.map(renderTooth)}</div>
        <div className="w-px bg-blue-500/30 mx-1" />
        <div className="flex gap-2">{sideB.map(renderTooth)}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">progress_activity</span>
          <p className="mt-3 text-sm">Cargando odontograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in text-slate-300">
      <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Historia dental</p>
          <h1 className="font-['Geist'] text-3xl font-bold text-white tracking-tight mt-2">Odontograma digital</h1>
          <p className="text-sm text-slate-400">Registro grafico por pieza dental y estado clinico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSaveAll} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60 flex items-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">save</span>}
            {saving ? 'Guardando...' : 'Guardar odontograma'}
          </button>
          <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-8 rounded-2xl border border-slate-700/50 bg-[#1E293B] p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Selecciona una pieza para editar</p>
            <div className="space-y-5">
              {renderArch('Arcada superior', UPPER_RIGHT, UPPER_LEFT)}
              {renderArch('Arcada inferior', LOWER_RIGHT, LOWER_LEFT)}
            </div>
          </div>
        </section>

        <aside className="col-span-12 xl:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-700/50 bg-[#1E293B] p-6">
            <h3 className="font-['Geist'] text-lg font-bold text-white mb-3">Leyenda clinica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {ESTADOS.map((est) => (
                <button
                  type="button"
                  key={est.value}
                  onClick={() => setSelectedEstado(est.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${colorClasses[est.color]}`}
                >
                  <span className="material-symbols-outlined text-base">{est.icon}</span>
                  {est.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedTooth !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div>
                <h3 className="font-['Geist'] text-xl font-bold text-white">Pieza dental #{selectedTooth}</h3>
                <p className="text-xs text-slate-400">Selecciona estado y observacion clinica.</p>
              </div>
              <button onClick={() => setSelectedTooth(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="pt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Estado de la pieza</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ESTADOS.map((est) => (
                    <button
                      key={est.value}
                      type="button"
                      onClick={() => setSelectedEstado(est.value)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${selectedEstado === est.value ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {est.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Observacion</label>
                <textarea
                  rows={3}
                  value={selectedObservacion}
                  onChange={(e) => setSelectedObservacion(e.target.value)}
                  placeholder="Detalle clinico opcional para esta pieza"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-700/60 pt-4 mt-5">
              <button onClick={() => setSelectedTooth(null)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700">Cancelar</button>
              <button onClick={handleSaveTooth} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontogramaPage;
