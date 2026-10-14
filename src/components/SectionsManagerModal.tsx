import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Machine } from '../types';

interface SectionsManagerModalProps {
  sections: string[];
  machines: Machine[];
  onClose: () => void;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
}

export const SectionsManagerModal: React.FC<SectionsManagerModalProps> = ({
  sections,
  machines,
  onClose,
  onAddSection,
  onRemoveSection,
}) => {
  const [newSection, setNewSection] = useState('');

  const machineCountBySection = machines.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    onAddSection(newSection.trim());
    setNewSection('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Partes da Loja (Setores)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Organize as máquinas de acordo com a divisão física da sua loja
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

        {/* Add new part */}
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            required
            placeholder="Nome da nova parte da loja (ex: Padaria, Açougue...)"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Sections List */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {sections.map((sec) => {
            const count = machineCountBySection[sec] || 0;

            return (
              <div
                key={sec}
                className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-red-950/50 hover:border-red-900/50 transition-all text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="font-semibold text-slate-200">{sec}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-400 bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-900/30">
                    {count} máquina(s)
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSection(sec)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remover esta parte da loja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-red-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-white text-xs font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
