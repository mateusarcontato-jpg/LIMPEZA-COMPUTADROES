import React from 'react';
import {
  X,
  Clock,
  User,
  FileDown,
  CheckCircle2,
  FlaskConical,
  ListChecks,
  Calendar,
} from 'lucide-react';
import { Machine, CleaningLog } from '../types';
import {
  formatDateTime,
  getConservationBadgeClasses,
  getConservationLabel,
} from '../utils/machineUtils';

interface MachineHistoryModalProps {
  machine: Machine | null;
  logs: CleaningLog[];
  onClose: () => void;
  onExportPdf: (machine: Machine) => void;
  onNewCleaning: (machine: Machine) => void;
}

export const MachineHistoryModal: React.FC<MachineHistoryModalProps> = ({
  machine,
  logs,
  onClose,
  onExportPdf,
  onNewCleaning,
}) => {
  if (!machine) return null;

  const machineLogs = logs.filter((l) => l.machineId === machine.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{machine.name}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Parte da Loja: <span className="text-slate-200">{machine.department}</span> • Frequência: {machine.frequencyLabel}
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

        {/* Action bar */}
        <div className="mt-4 flex items-center justify-between bg-black/60 p-3 rounded-2xl border border-red-950/50">
          <div className="text-xs text-slate-300">
            Total de registros: <strong className="text-red-400">{machineLogs.length}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportPdf(machine)}
              className="px-3 py-1.5 rounded-xl bg-[#14080b] hover:bg-[#200c12] text-red-300 border border-red-950/60 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNewCleaning(machine);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <span>+ Nova Higienização</span>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="mt-4 max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {machineLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-400">Nenhum registro de higienização anterior encontrado.</p>
              <p className="text-xs text-slate-500 mt-1">
                Clique no botão "Registrar Limpeza Agora" para registrar a primeira auditoria deste equipamento.
              </p>
            </div>
          ) : (
            machineLogs.map((log) => {
              const badge = getConservationBadgeClasses(log.conservationStatus);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-black/60 border border-red-950/50 hover:border-red-900/50 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        <span>{formatDateTime(log.cleanedAt)}</span>
                      </div>
                      <span className="text-xs text-slate-500">•</span>
                      <div className="flex items-center space-x-1 text-xs text-slate-400">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{log.cleanedBy}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">
                        Duração: <strong>{log.durationMinutes} min</strong>
                      </span>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{getConservationLabel(log.conservationStatus).split(' ')[0]}</span>
                      </span>
                    </div>
                  </div>

                  {log.productsUsed && (
                    <div className="flex items-start space-x-1.5 text-xs text-slate-400 mt-1">
                      <FlaskConical className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Produtos:</strong> {log.productsUsed}
                      </span>
                    </div>
                  )}

                  {log.checklistItems && log.checklistItems.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-300 mb-1">
                        <ListChecks className="w-3.5 h-3.5 text-red-400" />
                        <span>Procedimentos executados ({log.checklistItems.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {log.checklistItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#14080b] border border-red-950/60 text-[10px] text-slate-300"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.notes && (
                    <div className="mt-2 p-2 rounded-xl bg-black border border-red-950/60 text-xs text-slate-300 italic">
                      "{log.notes}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-red-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
