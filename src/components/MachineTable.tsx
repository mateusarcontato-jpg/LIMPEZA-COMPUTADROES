import React from 'react';
import {
  Sparkles,
  Mail,
  FileText,
  Clock,
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

interface MachineTableProps {
  machines: Machine[];
  onRecordCleaning: (machine: Machine) => void;
  onSendReminder: (machine: Machine) => void;
  onViewHistory: (machine: Machine) => void;
  onExportPdf: (machine: Machine) => void;
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
}

export const MachineTable: React.FC<MachineTableProps> = ({
  machines,
  onRecordCleaning,
  onSendReminder,
  onViewHistory,
  onExportPdf,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-3xl border border-red-950/60 bg-gradient-to-b from-[#120508]/90 to-[#080203]/90 shadow-xl backdrop-blur-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#170609] text-slate-300 font-semibold uppercase tracking-wider border-b border-red-950/60">
          <tr>
            <th className="py-3.5 px-4">Computador</th>
            <th className="py-3.5 px-4">Unidade</th>
            <th className="py-3.5 px-4">Subcampo</th>
            <th className="py-3.5 px-4">Frequência</th>
            <th className="py-3.5 px-4">Última Limpeza (Data/Hora)</th>
            <th className="py-3.5 px-4">Responsável</th>
            <th className="py-3.5 px-4">Próxima Limpeza</th>
            <th className="py-3.5 px-4">Status Higiene</th>
            <th className="py-3.5 px-4">Conservação</th>
            <th className="py-3.5 px-4 text-center">Ações Rápidas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-red-950/40 text-slate-200">
          {machines.map((machine) => {
            const cleaningStatus = calculateCleaningStatus(machine);
            const statusBadge = getCleaningStatusBadgeClasses(cleaningStatus);
            const conservBadge = getConservationBadgeClasses(machine.conservationStatus);

            const unit = machine.unit || machine.department?.split('•')[0]?.trim() || 'Matriz';
            const subDept = machine.subDepartment || machine.department?.split('•')[1]?.trim() || '-';

            return (
              <tr
                key={machine.id}
                className="hover:bg-[#1f0a0f]/50 transition-colors group"
              >
                {/* Nome do Computador */}
                <td className="py-3.5 px-4 font-bold text-white group-hover:text-red-300 transition-colors">
                  {machine.name}
                </td>

                {/* Unidade */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center space-x-1 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-800/40 text-red-200 font-bold">
                    <Building2 className="w-3 h-3 text-red-400" />
                    <span>{unit}</span>
                  </span>
                </td>

                {/* Subcampo */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center space-x-1 bg-[#1e0a0f] px-2.5 py-1 rounded-md border border-red-950/60 text-slate-300">
                    <Layers className="w-3 h-3 text-rose-400" />
                    <span>{subDept}</span>
                  </span>
                </td>

                {/* Frequência */}
                <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                  {machine.frequencyLabel}
                </td>

                {/* Última Limpeza (Data e Hora) */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-100">
                    {formatDateTime(machine.lastCleanedAt)}
                  </div>
                </td>

                {/* Responsável */}
                <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                  {machine.lastCleanedBy || 'Não registrado'}
                </td>

                {/* Próxima Limpeza */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-300">
                    {formatDateTime(machine.nextCleaningAt)}
                  </div>
                </td>

                {/* Status Higiene */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
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
                </td>

                {/* Conservação */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${conservBadge.bg} ${conservBadge.text} ${conservBadge.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${conservBadge.dot}`} />
                    <span>{getConservationLabel(machine.conservationStatus)}</span>
                  </span>
                </td>

                {/* Ações Rápidas */}
                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    {/* Registrar Limpeza */}
                    <button
                      onClick={() => onRecordCleaning(machine)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white shadow-sm"
                      title="Registrar Limpeza Concluída"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Lembrete */}
                    <button
                      onClick={() => onSendReminder(machine)}
                      className="p-1.5 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-red-300 hover:text-white border border-red-950/60"
                      title="Enviar Lembrete por E-mail ou WhatsApp"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    {/* Histórico */}
                    <button
                      onClick={() => onViewHistory(machine)}
                      className="p-1.5 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-300 hover:text-white border border-red-950/60"
                      title="Histórico de Limpezas"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>

                    {/* Ficha PDF */}
                    <button
                      onClick={() => onExportPdf(machine)}
                      className="p-1.5 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-300 hover:text-white border border-red-950/60"
                      title="Emitir Ficha em PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => onEdit(machine)}
                      className="p-1.5 rounded-lg bg-[#14080b] hover:bg-[#200c12] text-slate-400 hover:text-white border border-red-950/60"
                      title="Editar Computador"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir ${machine.name}?`)) {
                          onDelete(machine.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-[#14080b] hover:bg-red-950/50 text-slate-500 hover:text-red-400 border border-red-950/60"
                      title="Excluir Computador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
