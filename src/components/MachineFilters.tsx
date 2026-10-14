import React from 'react';
import { Search, LayoutGrid, Table, X, ArrowUpDown, Filter } from 'lucide-react';
import { FilterOptions, STORE_UNITS, STORE_SUB_DEPARTMENTS } from '../types';

interface MachineFiltersProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  totalFiltered: number;
}

export const MachineFilters: React.FC<MachineFiltersProps> = ({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  totalFiltered,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.cleaningStatus !== 'todos' ||
    filters.conservationStatus !== 'todos' ||
    filters.unit !== 'todos' ||
    filters.subDepartment !== 'todos';

  const clearFilters = () => {
    setFilters({
      search: '',
      unit: 'todos',
      subDepartment: 'todos',
      cleaningStatus: 'todos',
      conservationStatus: 'todos',
    });
  };

  return (
    <div className="bg-[#0e0406]/90 rounded-2xl border border-red-950/60 p-3.5 mb-6 backdrop-blur-sm shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome do computador ou local..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-black/80 border border-red-950/70 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Cleaning Status */}
          <select
            value={filters.cleaningStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, cleaningStatus: e.target.value }))}
            className="px-3 py-2 bg-black/80 border border-red-950/70 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-red-600 transition-all"
          >
            <option value="todos">Status Higiene: Todos</option>
            <option value="em_dia">Em Dia (Verde)</option>
            <option value="pendente">Pendente Hoje (Amarelo)</option>
            <option value="atrasada">Atrasada! (Vermelho)</option>
          </select>

          {/* Conservation Status */}
          <select
            value={filters.conservationStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, conservationStatus: e.target.value }))}
            className="px-3 py-2 bg-black/80 border border-red-950/70 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-red-600 transition-all"
          >
            <option value="todos">Conservação: Todas</option>
            <option value="excelente">Excelente (Novo)</option>
            <option value="bom">Bom (Operacional)</option>
            <option value="regular">Regular (Atenção)</option>
            <option value="critico">Crítico (Manutenção)</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 px-2.5 py-2 bg-black/80 border border-red-950/70 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-red-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none"
            >
              <option value="urgencia">Mais Urgentes</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="local">Local (Matriz/Preá/CD)</option>
              <option value="ultima_limpeza">Última Limpeza (Recente)</option>
              <option value="conservacao">Estado de Conservação</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-2 text-xs text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/50 rounded-xl border border-red-800/40 transition-all flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}

          {/* Grid vs Table View Mode */}
          <div className="flex items-center bg-black/90 border border-red-950/70 rounded-xl p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Cartões"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Tabela Administrativa"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Counter summary */}
      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Mostrando <strong className="text-red-400">{totalFiltered}</strong> computador(es)
        </span>
      </div>
    </div>
  );
};
