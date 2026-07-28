import React, { useState } from 'react';

const SAMPLE_RESULTS = [
  {
    id: 'rx-1',
    title: 'Periapical #16 - #17',
    type: 'Periapical',
    confidence: 96.8,
    summary: 'Posible lesion cariosa oclusal en pieza #16 y restauracion estable en #17.',
    findings: [
      { tooth: 16, severity: 'media', issue: 'Caries oclusal', recommendation: 'Restauracion con resina fotocurable.' },
      { tooth: 17, severity: 'baja', issue: 'Restauracion intacta', recommendation: 'Control en 6 meses.' },
    ],
  },
  {
    id: 'rx-2',
    title: 'Bitewing cuadrante 4',
    type: 'Bitewing',
    confidence: 98.2,
    summary: 'Ligera perdida osea crestal y sospecha de caries interproximal incipiente.',
    findings: [
      { tooth: 45, severity: 'alta', issue: 'Caries interproximal', recommendation: 'Evaluacion clinica y restauracion preventiva.' },
      { tooth: 46, severity: 'baja', issue: 'Implante integrado', recommendation: 'Profilaxis de mantenimiento.' },
    ],
  },
];

const AiXrayModal = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState(SAMPLE_RESULTS[0]);
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const runAnalysis = () => {
    setAnalyzing(true);
    window.setTimeout(() => setAnalyzing(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl text-slate-300">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-['Geist'] text-xl font-bold text-white">Analisis IA de radiografias</h3>
              <p className="text-xs text-slate-400">Modulo demostrativo para apoyo diagnostico.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seleccionar placa</p>
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_RESULTS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`rounded-2xl border p-3 text-left transition-all ${selected.id === item.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'}`}
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.type}</p>
                </button>
              ))}
            </div>

            <div className="aspect-video rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <span className="material-symbols-outlined text-7xl text-blue-400/80">radiology</span>
                <p className="text-xs text-slate-500 mt-2">Vista previa radiografica</p>
              </div>
            </div>

            <button
              type="button"
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className={`material-symbols-outlined ${analyzing ? 'animate-spin' : ''}`}>{analyzing ? 'progress_activity' : 'psychology'}</span>
              {analyzing ? 'Analizando densidades...' : 'Ejecutar analisis IA'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Informe asistido</p>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
                Confianza {selected.confidence}%
              </span>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
              <p className="mb-1 text-xs font-bold uppercase text-blue-400">Resumen</p>
              {selected.summary}
            </div>

            <div className="space-y-3">
              {selected.findings.map((finding) => (
                <div key={`${selected.id}-${finding.tooth}`} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white">Pieza #{finding.tooth} - {finding.issue}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${finding.severity === 'alta' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {finding.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{finding.recommendation}</p>
                </div>
              ))}
            </div>

            <button type="button" onClick={onClose} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
              Adjuntar a ficha clinica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiXrayModal;
