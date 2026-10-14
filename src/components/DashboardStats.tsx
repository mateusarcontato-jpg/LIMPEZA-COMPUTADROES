import React from 'react';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Machine } from '../types';
import { calculateCleaningStatus } from '../utils/machineUtils';

interface DashboardStatsProps {
  machines: Machine[];
  onFilterCleaningStatus: (status: string) => void;
  onFilterConservationStatus: (status: string) => void;
  selectedCleaningStatus: string;
  selectedConservationStatus: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  machines,
  onFilterCleaningStatus,
  onFilterConservationStatus,
  selectedCleaningStatus,
  selectedConservationStatus,
}) => {
  let emDia = 0;
  let pendente = 0;
  let atrasada = 0;
  let critico = 0;
  let regular = 0;

  machines.forEach((m) => {
    const status = calculateCleaningStatus(m);
    if (status === 'em_dia') emDia++;
    else if (status === 'pendente') pendente++;
    else if (status === 'atrasada') atrasada++;

    if (m.conservationStatus === 'critico') critico++;
    else if (m.conservationStatus === 'regular') regular++;
  });

  const total = machines.length;
  const complianceRate = total > 0 ? Math.round((emDia / total) * 100) : 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
      
      {/* 1. Total Computadores */}
      <div
        onClick={() => {
          onFilterCleaningStatus('todos');
          onFilterConservationStatus('todos');
        }}
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
          selectedCleaningStatus === 'todos' && selectedConservationStatus === 'todos'
            ? 'bg-gradient-to-br from-[#1a080c] to-[#0c0305] border-red-700/60 shadow-lg shadow-black/80 ring-1 ring-red-700/40'
            : 'bg-[#100508]/80 hover:bg-[#18080c] border-red-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Total Geral
          </span>
          <div className="p-2 rounded-xl bg-red-950/50 text-red-300 border border-red-900/40">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {total}
          </span>
          <span className="text-xs text-slate-400">computadores</span>
        </div>
        <div className="mt-2.5 text-[11px] text-slate-400 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span>Matriz, Preá e CD</span>
        </div>
      </div>

      {/* 2. Higienização Em Dia */}
      <div
        onClick={() => onFilterCleaningStatus(selectedCleaningStatus === 'em_dia' ? 'todos' : 'em_dia')}
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
          selectedCleaningStatus === 'em_dia'
            ? 'bg-gradient-to-br from-emerald-950/50 to-[#0c0305] border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
            : 'bg-[#100508]/80 hover:bg-[#18080c] border-red-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300/90 uppercase tracking-wider">
            Limpeza Em Dia
          </span>
          <div className="p-2 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight">
            {emDia}
          </span>
          <span className="text-xs text-emerald-400/80">em conformidade</span>
        </div>
        <div className="mt-2.5 text-[11px] text-emerald-400/90 font-medium flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{complianceRate}% dos equipamentos</span>
        </div>
      </div>

      {/* 3. Limpeza Pendente Hoje */}
      <div
        onClick={() => onFilterCleaningStatus(selectedCleaningStatus === 'pendente' ? 'todos' : 'pendente')}
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
          selectedCleaningStatus === 'pendente'
            ? 'bg-gradient-to-br from-amber-950/50 to-[#0c0305] border-amber-500/50 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
            : 'bg-[#100508]/80 hover:bg-[#18080c] border-red-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300/90 uppercase tracking-wider">
            Pendente Hoje
          </span>
          <div className="p-2 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-800/40">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
            {pendente}
          </span>
          <span className="text-xs text-amber-400/80">a realizar</span>
        </div>
        <div className="mt-2.5 text-[11px] text-amber-400/90 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Vencem nas próximas 24h</span>
        </div>
      </div>

      {/* 4. Limpeza Atrasada */}
      <div
        onClick={() => onFilterCleaningStatus(selectedCleaningStatus === 'atrasada' ? 'todos' : 'atrasada')}
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
          selectedCleaningStatus === 'atrasada'
            ? 'bg-gradient-to-br from-red-950/60 to-[#0c0305] border-red-500/60 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40'
            : 'bg-[#100508]/80 hover:bg-[#18080c] border-red-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300/90 uppercase tracking-wider">
            Atrasada!
          </span>
          <div className="p-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
            {atrasada}
          </span>
          <span className="text-xs text-rose-400/80">fora do prazo</span>
        </div>
        <div className="mt-2.5 text-[11px] text-rose-400 font-semibold flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Exige ação imediata</span>
        </div>
      </div>

      {/* 5. Estado Crítico */}
      <div
        onClick={() => onFilterConservationStatus(selectedConservationStatus === 'critico' ? 'todos' : 'critico')}
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer col-span-2 lg:col-span-1 ${
          selectedConservationStatus === 'critico'
            ? 'bg-gradient-to-br from-red-950/60 to-[#0c0305] border-red-600/60 shadow-lg shadow-red-950/40 ring-1 ring-red-600/40'
            : 'bg-[#100508]/80 hover:bg-[#18080c] border-red-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Conservação Crítica
          </span>
          <div className="p-2 rounded-xl bg-red-950/40 text-red-300 border border-red-800/40">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight">
            {critico}
          </span>
          <span className="text-xs text-slate-400">computadores</span>
        </div>
        <div className="mt-2.5 text-[11px] text-red-400/90 flex items-center space-x-1.5">
          <span>{regular} em estado regular</span>
        </div>
      </div>

    </div>
  );
};
