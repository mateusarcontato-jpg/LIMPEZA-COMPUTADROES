import React from 'react';
import { Building2, Layers, CheckCircle2 } from 'lucide-react';
import { Machine, STORE_UNITS, STORE_SUB_DEPARTMENTS, StoreUnit, StoreSubDepartment } from '../types';

interface StoreSectionsBarProps {
  activeUnit: string; // 'todos' | 'Matriz' | 'Preá' | 'CD'
  onSelectUnit: (unit: string) => void;
  activeSubDept: string; // 'todos' | 'Expedição' | 'Balcão' | 'Caixa' | 'Escritório' | 'Salão'
  onSelectSubDept: (subDept: string) => void;
  machines: Machine[];
}

export const StoreSectionsBar: React.FC<StoreSectionsBarProps> = ({
  activeUnit,
  onSelectUnit,
  activeSubDept,
  onSelectSubDept,
  machines,
}) => {
  // Unit counts
  const unitCounts = machines.reduce((acc, m) => {
    const u = m.unit || (m.department?.split('•')[0]?.trim()) || 'Matriz';
    acc[u] = (acc[u] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // SubDept counts (filtered by current activeUnit if selected, or overall)
  const machinesInUnit = activeUnit === 'todos' 
    ? machines 
    : machines.filter((m) => (m.unit || m.department) === activeUnit || m.department?.includes(activeUnit));

  const subDeptCounts = machinesInUnit.reduce((acc, m) => {
    const s = m.subDepartment || (m.department?.split('•')[1]?.trim()) || 'Balcão';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const UNIT_ICONS: Record<string, string> = {
    Matriz: '🏢',
    'Preá': '🏪',
    CD: '📦',
  };

  const SUBDEPT_ICONS: Record<string, string> = {
    'Expedição': '🚚',
    'Balcão': '🛎️',
    'Caixa': '💳',
    'Escritório': '💻',
    'Salão': '🛍️',
  };

  return (
    <div className="mb-6 rounded-3xl border border-red-950/60 bg-gradient-to-b from-[#140608]/90 via-[#0d0406]/90 to-[#080203]/90 p-4 shadow-xl backdrop-blur-md">
      
      {/* 1. Nível 1: Local / Unidade */}
      <div className="mb-3.5 pb-3.5 border-b border-red-950/60">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              1. Selecione a Unidade / Local:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Matriz, Preá ou CD)
            </span>
          </div>
          {activeUnit !== 'todos' && (
            <button
              onClick={() => onSelectUnit('todos')}
              className="text-[11px] text-red-400 hover:text-red-300 underline font-medium"
            >
              Ver todas unidades
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Todas as Unidades */}
          <button
            onClick={() => onSelectUnit('todos')}
            className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeUnit === 'todos'
                ? 'bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white shadow-lg shadow-red-950/60 border border-red-500/40'
                : 'bg-[#15070a] hover:bg-[#200a0f] text-slate-300 border border-red-950/70 hover:border-red-900/50'
            }`}
          >
            <span>🌐 Todas as Unidades</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeUnit === 'todos' ? 'bg-black/40 text-white font-extrabold' : 'bg-red-950/50 text-slate-400'}`}>
              {machines.length}
            </span>
          </button>

          {/* Matriz, Preá, CD */}
          {STORE_UNITS.map((unit) => {
            const count = unitCounts[unit] || 0;
            const isSelected = activeUnit === unit;

            return (
              <button
                key={unit}
                onClick={() => onSelectUnit(unit)}
                className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white shadow-lg shadow-red-950/60 border border-red-500/40 scale-[1.02]'
                    : 'bg-[#15070a] hover:bg-[#200a0f] text-slate-300 border border-red-950/70 hover:border-red-900/50'
                }`}
              >
                <span>{UNIT_ICONS[unit]} {unit}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/40 text-white font-extrabold' : 'bg-red-950/50 text-red-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Nível 2: Subcampo / Setor */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              2. Subcampos do Local:
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Expedição, Balcão, Caixa, Escritório ou Salão)
            </span>
          </div>
          {activeSubDept !== 'todos' && (
            <button
              onClick={() => onSelectSubDept('todos')}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
            >
              Ver todos subcampos
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {/* Todos os Subcampos */}
          <button
            onClick={() => onSelectSubDept('todos')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubDept === 'todos'
                ? 'bg-gradient-to-r from-rose-700 to-red-800 text-white shadow-md border border-rose-500/40'
                : 'bg-[#120508] hover:bg-[#1a080c] text-slate-300 border border-red-950/60'
            }`}
          >
            <span>Todos os Subcampos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300">
              {machinesInUnit.length}
            </span>
          </button>

          {/* Expedição, Balcão, Caixa, Escritório, Salão */}
          {STORE_SUB_DEPARTMENTS.map((subDept) => {
            const count = subDeptCounts[subDept] || 0;
            const isSelected = activeSubDept === subDept;

            return (
              <button
                key={subDept}
                onClick={() => onSelectSubDept(subDept)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-700 to-red-800 text-white shadow-md border border-rose-500/40'
                    : 'bg-[#120508] hover:bg-[#1a080c] text-slate-300 border border-red-950/60'
                }`}
              >
                <span>{SUBDEPT_ICONS[subDept]} {subDept}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/40 text-white' : 'bg-red-950/50 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
