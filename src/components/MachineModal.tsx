import React, { useState } from 'react';
import {
  X,
  Cpu,
  Save,
  Clock,
  User,
  Building2,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  Machine,
  MaintenanceStaff,
  ConservationStatus,
  STORE_UNITS,
  STORE_SUB_DEPARTMENTS,
  StoreUnit,
  StoreSubDepartment,
} from '../types';

interface MachineModalProps {
  machine: Machine | null; // null = cadastrar novo
  staff: MaintenanceStaff[];
  defaultUnit?: string;
  defaultSubDept?: string;
  onClose: () => void;
  onSave: (data: Partial<Machine>) => Promise<void>;
}

const PRESET_FREQUENCIES = [
  { hours: 24, label: 'Diária (A cada 24h)' },
  { hours: 48, label: 'A cada 2 dias (48h)' },
  { hours: 72, label: 'A cada 3 dias (72h)' },
  { hours: 168, label: 'Semanal (A cada 7 dias)' },
  { hours: 360, label: 'Quinzenal (A cada 15 dias)' },
  { hours: 720, label: 'Mensal (A cada 30 dias)' },
];

export const MachineModal: React.FC<MachineModalProps> = ({
  machine,
  staff,
  defaultUnit,
  defaultSubDept,
  onClose,
  onSave,
}) => {
  const isEditing = !!machine;

  // Initial unit determination: Matriz, Preá or CD
  const getInitialUnit = (): StoreUnit => {
    if (machine?.unit && STORE_UNITS.includes(machine.unit as StoreUnit)) {
      return machine.unit as StoreUnit;
    }
    if (machine?.department) {
      const match = STORE_UNITS.find((u) => machine.department.includes(u));
      if (match) return match;
    }
    if (defaultUnit && STORE_UNITS.includes(defaultUnit as StoreUnit)) {
      return defaultUnit as StoreUnit;
    }
    return 'Matriz';
  };

  // Initial subDepartment determination: Expedição, Balcão, Caixa, Escritório, Salão
  const getInitialSubDept = (): StoreSubDepartment => {
    if (machine?.subDepartment && STORE_SUB_DEPARTMENTS.includes(machine.subDepartment as StoreSubDepartment)) {
      return machine.subDepartment as StoreSubDepartment;
    }
    if (machine?.department) {
      const match = STORE_SUB_DEPARTMENTS.find((s) => machine.department.includes(s));
      if (match) return match;
    }
    if (defaultSubDept && STORE_SUB_DEPARTMENTS.includes(defaultSubDept as StoreSubDepartment)) {
      return defaultSubDept as StoreSubDepartment;
    }
    return 'Balcão';
  };

  const [unit, setUnit] = useState<StoreUnit>(getInitialUnit());
  const [subDepartment, setSubDepartment] = useState<StoreSubDepartment>(getInitialSubDept());
  const [name, setName] = useState(machine?.name || '');
  const [frequencyHours, setFrequencyHours] = useState<number>(machine?.frequencyHours || 24);
  const [frequencyLabel, setFrequencyLabel] = useState(machine?.frequencyLabel || 'Diária (A cada 24h)');
  const [conservationStatus, setConservationStatus] = useState<ConservationStatus>(machine?.conservationStatus || 'bom');
  
  // Last cleaning info
  const [hasPreviousCleaning, setHasPreviousCleaning] = useState<boolean>(!!machine?.lastCleanedAt);
  const getNowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [lastCleanedAtInput, setLastCleanedAtInput] = useState<string>(
    machine?.lastCleanedAt ? new Date(machine.lastCleanedAt).toISOString().slice(0, 16) : getNowLocal()
  );
  const [lastCleanedByInput, setLastCleanedByInput] = useState<string>(
    machine?.lastCleanedBy || ''
  );

  const [assignedStaffName, setAssignedStaffName] = useState(machine?.assignedStaffName || '');
  const [assignedStaffPhone, setAssignedStaffPhone] = useState(machine?.assignedStaffPhone || '');
  const [assignedStaffEmail, setAssignedStaffEmail] = useState(machine?.assignedStaffEmail || '');
  const [notes, setNotes] = useState(machine?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const UNIT_INFO: Record<StoreUnit, { title: string; desc: string; icon: string }> = {
    Matriz: { title: 'Matriz', desc: 'Sede principal', icon: '🏢' },
    'Preá': { title: 'Preá', desc: 'Filial Preá', icon: '🏪' },
    CD: { title: 'CD', desc: 'Centro de Distribuição', icon: '📦' },
  };

  const SUBDEPT_INFO: Record<StoreSubDepartment, { label: string; icon: string }> = {
    'Expedição': { label: 'Expedição', icon: '🚚' },
    'Balcão': { label: 'Balcão', icon: '🛎️' },
    'Caixa': { label: 'Caixa', icon: '💳' },
    'Escritório': { label: 'Escritório', icon: '💻' },
    'Salão': { label: 'Salão', icon: '🛍️' },
  };

  const handleFrequencyChange = (hours: number, label: string) => {
    setFrequencyHours(hours);
    setFrequencyLabel(label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      const compositeDepartment = `${unit} • ${subDepartment}`;

      let lastCleanedAtIso = machine?.lastCleanedAt || new Date().toISOString();
      let lastCleanedBy = lastCleanedByInput.trim() || machine?.lastCleanedBy || 'Responsável Amilco';

      if (hasPreviousCleaning && lastCleanedAtInput) {
        lastCleanedAtIso = new Date(lastCleanedAtInput).toISOString();
      }

      await onSave({
        ...(machine || {}),
        name: name.trim(),
        unit,
        subDepartment,
        department: compositeDepartment,
        frequencyHours,
        frequencyLabel,
        conservationStatus,
        lastCleanedAt: lastCleanedAtIso,
        lastCleanedBy,
        assignedStaffName: assignedStaffName.trim(),
        assignedStaffPhone: assignedStaffPhone.trim(),
        assignedStaffEmail: assignedStaffEmail.trim(),
        notes: notes.trim(),
      });

      onClose();
    } catch (err) {
      console.error('Erro ao salvar computador:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#140608] via-[#0e0406] to-[#080203] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-700 to-rose-900 text-white border border-red-600/40 shadow-md">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Computador' : 'Cadastrar Novo Computador'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                COMPUTADORES AMILCO • Controle por Local e Subcampo
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
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          
          {/* 1. Pergunta Local / Unidade: Matriz, Preá ou CD */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-400" />
              <span>1. Em qual local fica este computador? *</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {STORE_UNITS.map((u) => {
                const info = UNIT_INFO[u];
                const isSelected = unit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-red-700 via-red-600 to-rose-700 text-white border-red-400/60 shadow-lg shadow-red-950/60 scale-[1.02]'
                        : 'bg-[#15070a] hover:bg-[#200a0f] text-slate-300 border-red-950/70 hover:border-red-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{info.icon}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-extrabold">{info.title}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                        {info.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pergunta Subcampo: Expedição, Balcão, Caixa, Escritório, Salão */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>2. Qual é o subcampo / setor no local? *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STORE_SUB_DEPARTMENTS.map((s) => {
                const info = SUBDEPT_INFO[s];
                const isSelected = subDepartment === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubDepartment(s)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white border-rose-400 shadow-md shadow-red-950/50'
                        : 'bg-[#130608] hover:bg-[#1c080d] text-slate-300 border-red-950/60'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span className="font-bold">{info.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 pl-0.5">
              Localização combinada: <strong className="text-red-300">{unit} • {subDepartment}</strong>
            </p>
          </div>

          {/* 3. Nome do Computador */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              3. Nome / Identificação do Computador *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Computador Caixa 01, PC Balcão Atendimento, Terminal Expedição..."
              className="w-full px-4 py-2.5 bg-black/90 border border-red-950/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 transition-all"
            />
            {/* Sugestões rápidas de nome */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
              {[
                `Computador ${subDepartment} 01`,
                `PC ${subDepartment} Principal`,
                `Terminal ${subDepartment}`,
                `Servidor ${subDepartment}`,
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setName(sug)}
                  className="px-2 py-0.5 text-[10px] rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-900/30 transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Estado de Conservação */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              4. Estado Atual de Conservação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'excelente', label: 'Excelente', desc: 'Novo / Perfeito', color: 'border-emerald-500 bg-emerald-950/30 text-emerald-300' },
                  { id: 'bom', label: 'Bom', desc: 'Operacional', color: 'border-blue-500 bg-blue-950/30 text-blue-300' },
                  { id: 'regular', label: 'Regular', desc: 'Requer atenção', color: 'border-amber-500 bg-amber-950/30 text-amber-300' },
                  { id: 'critico', label: 'Crítico', desc: 'Gabinete sujo/danos', color: 'border-red-600 bg-red-950/40 text-red-300' },
                ] as const
              ).map((status) => {
                const isSelected = conservationStatus === status.id;
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setConservationStatus(status.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? `${status.color} ring-1 ring-white/20 font-bold scale-[1.02]`
                        : 'bg-black/60 border-red-950/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{status.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">{status.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Frequência de Higienização */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span>5. Frequência Exigida de Limpeza</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_FREQUENCIES.map((freq) => {
                const isSelected = frequencyHours === freq.hours;
                return (
                  <button
                    key={freq.hours}
                    type="button"
                    onClick={() => handleFrequencyChange(freq.hours, freq.label)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'bg-red-950/80 text-white border-red-500 shadow-md shadow-red-950/50'
                        : 'bg-black/70 hover:bg-[#180a0e] text-slate-300 border-red-950/60'
                    }`}
                  >
                    <div>{freq.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Histórico da Última Limpeza */}
          <div className="p-3.5 rounded-2xl bg-black/70 border border-red-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>6. Dados da Última Limpeza</span>
              </span>
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPreviousCleaning}
                  onChange={(e) => setHasPreviousCleaning(e.target.checked)}
                  className="rounded border-red-800 text-red-600 focus:ring-0"
                />
                <span>Já foi limpo anteriormente</span>
              </label>
            </div>

            {hasPreviousCleaning && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Data e Hora do último procedimento
                  </label>
                  <input
                    type="datetime-local"
                    value={lastCleanedAtInput}
                    onChange={(e) => setLastCleanedAtInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-red-950/80 rounded-xl text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Quem realizou a limpeza?
                  </label>
                  <input
                    type="text"
                    value={lastCleanedByInput}
                    onChange={(e) => setLastCleanedByInput(e.target.value)}
                    placeholder="Nome do colaborador..."
                    className="w-full px-3 py-2 bg-black border border-red-950/80 rounded-xl text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Responsável pela Manutenção / Limpeza */}
          <div className="p-3.5 rounded-2xl bg-black/70 border border-red-950/60 space-y-2.5">
            <label className="block text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-red-400" />
              <span>7. Responsável pela Manutenção / Lembretes (Opcional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nome do responsável"
                value={assignedStaffName}
                onChange={(e) => setAssignedStaffName(e.target.value)}
                className="px-3 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
              <input
                type="text"
                placeholder="WhatsApp (ex: 88 99999-9999)"
                value={assignedStaffPhone}
                onChange={(e) => setAssignedStaffPhone(e.target.value)}
                className="px-3 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
              <input
                type="email"
                placeholder="E-mail do responsável"
                value={assignedStaffEmail}
                onChange={(e) => setAssignedStaffEmail(e.target.value)}
                className="px-3 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* 8. Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              8. Observações / Cuidados com o Equipamento (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cuidado com cabos de rede no chão, limpar ventoinha com pincel antiestático..."
              className="w-full px-3.5 py-2 bg-black/80 border border-red-950/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-black border border-red-950/60 hover:bg-red-950/30 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : isEditing ? 'Atualizar Computador' : 'Concluir Cadastro'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
