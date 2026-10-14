import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  FlaskConical,
  ListChecks,
  FileCheck2,
} from 'lucide-react';
import { Machine, MaintenanceStaff, ConservationStatus } from '../types';

interface CleanModalProps {
  machine: Machine | null;
  staff: MaintenanceStaff[];
  onClose: () => void;
  onSubmit: (params: {
    machineId: string;
    cleanedBy: string;
    cleanedAt: string;
    conservationStatus: ConservationStatus;
    productsUsed: string;
    checklistCompleted: boolean;
    checklistItems: string[];
    durationMinutes: number;
    notes: string;
  }) => Promise<void>;
}

export const CleanModal: React.FC<CleanModalProps> = ({
  machine,
  staff,
  onClose,
  onSubmit,
}) => {
  if (!machine) return null;

  const getNowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [cleanedAtInput, setCleanedAtInput] = useState<string>(getNowLocal());
  const [cleanedBy, setCleanedBy] = useState<string>(machine.assignedStaffName || staff[0]?.name || 'Operador da Loja');
  const [conservationStatus, setConservationStatus] = useState<ConservationStatus>(machine.conservationStatus || 'bom');
  const [productsUsed, setProductsUsed] = useState<string>('Álcool Isopropílico e Pano Microfibra');
  const machineChecklist = machine.checklist || [];
  const [checklistState, setChecklistState] = useState<{ [key: string]: boolean }>(
    machineChecklist.reduce((acc, item) => ({ ...acc, [item]: true }), {})
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleChecklistItem = (item: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const allChecklistDone = machineChecklist.length === 0 || machineChecklist.every((item) => checklistState[item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const completedItems = machineChecklist.filter((item) => checklistState[item]);
      const isoDate = new Date(cleanedAtInput).toISOString();

      await onSubmit({
        machineId: machine.id,
        cleanedBy,
        cleanedAt: isoDate,
        conservationStatus,
        productsUsed,
        checklistCompleted: allChecklistDone,
        checklistItems: completedItems,
        durationMinutes: Number(durationMinutes),
        notes,
      });

      onClose();
    } catch (err) {
      console.error('Erro ao registrar limpeza:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Registrar Higienização Concluída
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {machine.name} • Parte da Loja: <span className="text-slate-200">{machine.department}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-red-950/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Data/Hora & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span>Data e Hora da Higienização</span>
              </label>
              <input
                type="datetime-local"
                value={cleanedAtInput}
                onChange={(e) => setCleanedAtInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-red-400" />
                <span>Responsável Técnico / Operador</span>
              </label>
              <input
                type="text"
                value={cleanedBy}
                onChange={(e) => setCleanedBy(e.target.value)}
                placeholder="Nome de quem executou a limpeza..."
                className="w-full px-3.5 py-2.5 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Status de Conservação */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Status de Conservação Avaliado Após a Limpeza:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'excelente', label: 'Excelente', desc: 'Como novo', active: 'bg-emerald-950/60 border-emerald-500 text-emerald-300' },
                { id: 'bom', label: 'Bom', desc: 'Operação normal', active: 'bg-slate-900 border-slate-500 text-slate-200' },
                { id: 'regular', label: 'Regular', desc: 'Atenção / Desgaste', active: 'bg-amber-950/60 border-amber-500 text-amber-300' },
                { id: 'critico', label: 'Crítico', desc: 'Risco / Manutenção', active: 'bg-red-950/70 border-red-500 text-red-300' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setConservationStatus(opt.id as ConservationStatus)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    conservationStatus === opt.id
                      ? opt.active
                      : 'bg-black border-red-950/60 text-slate-400 hover:border-red-900/50'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Produtos e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-red-400" />
                <span>Produtos Químicos Utilizados</span>
              </label>
              <input
                type="text"
                value={productsUsed}
                onChange={(e) => setProductsUsed(e.target.value)}
                placeholder="Ex: Detergente neutro clorado, álcool 70%"
                className="w-full px-3.5 py-2.5 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tempo Gasto (minutos)</span>
              </label>
              <input
                type="number"
                min="5"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Checklist */}
          {machine.checklist && machine.checklist.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-red-400" />
                  <span>Checklist de Procedimentos Executados</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {Object.values(checklistState).filter(Boolean).length} de {machineChecklist.length} concluídos
                </span>
              </label>
              <div className="space-y-2 bg-black/70 p-3.5 rounded-2xl border border-red-950/50">
                {machineChecklist.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#15080b] cursor-pointer transition-colors text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!!checklistState[item]}
                      onChange={() => toggleChecklistItem(item)}
                      className="w-4 h-4 rounded text-red-600 bg-black border-red-950 focus:ring-red-600 focus:ring-offset-black"
                    />
                    <span className={checklistState[item] ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações Técnicas / Condições Notadas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Borracha de vedação lubrificada. Nenhuma avaria mecânica."
              className="w-full px-3.5 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-red-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-red-950 text-xs font-semibold text-slate-400 hover:text-white hover:bg-red-950/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-950/60 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Concluir Higienização'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
