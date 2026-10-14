import React from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  FileText,
  Mail,
  Edit2,
  Trash2,
  Building2,
  Layers,
} from 'lucide-react';
import { Machine } from '../types';
import {
  calculateCleaningStatus,
  formatDateTime,
  getConservationBadgeClasses,
  getConservationLabel,
  getCleaningStatusBadgeClasses,
} from '../utils/machineUtils';

interface MachineCardProps {
  machine: Machine;
  onRecordCleaning: (machine: Machine) => void;
  onSendReminder: (machine: Machine) => void;
  onViewHistory: (machine: Machine) => void;
  onExportPdf: (machine: Machine) => void;
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  onRecordCleaning,
  onSendReminder,
  onViewHistory,
  onExportPdf,
  onEdit,
  onDelete,
}) => {
  const cleaningStatus = calculateCleaningStatus(machine);
  const statusBadge = getCleaningStatusBadgeClasses(cleaningStatus);
  const conservBadge = getConservationBadgeClasses(machine.conservationStatus);

  // Time remaining or overdue calculation
  const now = new Date().getTime();
  const nextTime = new Date(machine.nextCleaningAt).getTime();
  const diffHours = Math.round(((nextTime - now) / (1000 * 60 * 60)) * 10) / 10;

  let countdownText = '';
  if (cleaningStatus === 'atrasada') {
    const overdueH = Math.abs(diffHours);
    countdownText = `Atrasada há ${overdueH}h!`;
  } else if (diffHours <= 4) {
    countdownText = `Vence em ${diffHours}h`;
  } else if (diffHours <= 24) {
    countdownText = `Vence em ${Math.round(diffHours)}h`;
  } else {
    const days = Math.round(diffHours / 24);
    countdownText = `Vence em ~${days} dia(s)`;
  }

  // Parse location components
  const unit = machine.unit || machine.department?.split('•')[0]?.trim() || 'Matriz';
  const subDept = machine.subDepartment || machine.department?.split('•')[1]?.trim() || '';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b from-[#140608] via-[#0d0406] to-[#080203] p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
        cleaningStatus === 'atrasada'
          ? 'border-red-600/60 hover:border-red-500 shadow-red-950/40 ring-1 ring-red-600/30'
          : cleaningStatus === 'pendente'
          ? 'border-amber-600/50 hover:border-amber-500 shadow-amber-950/20'
          : 'border-red-950/70 hover:border-red-800/60 shadow-black/60'
      }`}
    >
      <div>
        {/* Top Header: Unidade e Subcampo + Status Higiene */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-red-950/70 px-2.5 py-1 rounded-lg border border-red-800/40">
              <Building2 className="w-3 h-3 text-red-400" />
              <span>{unit}</span>
            </span>
            {subDept && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-300 bg-[#1e0a0f] px-2.5 py-1 rounded-lg border border-red-950/60">
                <Layers className="w-3 h-3 text-rose-400" />
                <span>{subDept}</span>
              </span>
            )}
          </div>

          {/* Cleaning Status Badge */}
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cleaningStatus === 'atrasada'
                  ? 'bg-red-400 animate-ping'
                  : cleaningStatus === 'pendente'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{statusBadge.label}</span>
          </span>
        </div>

        {/* Nome do Computador */}
        <div className="mb-3.5">
          <h3 className="text-lg font-extrabold text-white group-hover:text-red-300 transition-colors">
            {machine.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Frequência de Limpeza: <strong className="text-slate-200">{machine.frequencyLabel}</strong>
          </p>
        </div>

        {/* Status de Conservação */}
        <div className="mb-3.5">
          <div className={`flex items-center justify-between p-2.5 rounded-xl border ${conservBadge.bg} ${conservBadge.border}`}>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${conservBadge.dot}`} />
              <span className="text-xs font-semibold text-slate-300">Conservação:</span>
            </div>
            <span className={`text-xs font-bold ${conservBadge.text}`}>
              {getConservationLabel(machine.conservationStatus)}
            </span>
          </div>
        </div>

        {/* Última Limpeza & Próxima Limpeza */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-black/80 p-3 rounded-2xl border border-red-950/60 mb-3.5">
          <div className="border-r border-red-950/60 pr-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-red-400" />
              <span>Última Limpeza</span>
            </span>
            <p className="font-semibold text-slate-100 mt-1">
              {formatDateTime(machine.lastCleanedAt)}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 truncate" title={machine.lastCleanedBy}>
              <User className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{machine.lastCleanedBy || 'Não informado'}</span>
            </p>
          </div>

          <div className="pl-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-rose-400" />
              <span>Próxima Limpeza</span>
            </span>
            <p className="font-semibold text-slate-100 mt-1">
              {formatDateTime(machine.nextCleaningAt)}
            </p>
            <p
              className={`text-[11px] font-bold mt-0.5 ${
                cleaningStatus === 'atrasada'
                  ? 'text-red-400'
                  : cleaningStatus === 'pendente'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {countdownText}
            </p>
          </div>
        </div>

        {/* Observações rápidas */}
        {machine.notes && (
          <p className="text-[11px] text-slate-400 italic line-clamp-1 mb-3">
            "{machine.notes}"
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-red-950/60 flex flex-col gap-2">
        
        {/* Main Action: Registrar Limpeza */}
        <button
          onClick={() => onRecordCleaning(machine)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-red-950/60 transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Registrar Limpeza Agora</span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          <button
            onClick={() => onSendReminder(machine)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-red-300 hover:text-white border border-red-950/60 text-[11px] font-medium transition-all"
            title="Enviar Lembrete por E-mail ou WhatsApp"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onViewHistory(machine)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-300 hover:text-white border border-red-950/60 text-[11px] font-medium transition-all"
            title="Ver Histórico de Limpezas"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onExportPdf(machine)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-300 hover:text-white border border-red-950/60 text-[11px] font-medium transition-all"
            title="Emitir Ficha em PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
          </button>

          <button
            onClick={() => onEdit(machine)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-400 hover:text-white border border-red-950/60 text-[11px] font-medium transition-all"
            title="Editar Computador"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Deseja realmente excluir ${machine.name}?`)) {
                onDelete(machine.id);
              }
            }}
            className="flex items-center justify-center py-2 rounded-lg bg-[#14080b] hover:bg-red-950/50 text-slate-500 hover:text-red-400 border border-red-950/60 text-[11px] font-medium transition-all"
            title="Excluir Computador"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
