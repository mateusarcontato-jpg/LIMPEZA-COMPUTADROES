import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react';
import { MaintenanceStaff } from '../types';

interface StaffModalProps {
  staff: MaintenanceStaff[];
  onClose: () => void;
  onSaveStaff: (member: Partial<MaintenanceStaff>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  staff,
  onClose,
  onSaveStaff,
  onDeleteStaff,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Operador de Higienização');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Geral');
  const [shift, setShift] = useState('Manhã');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsSaving(true);

    try {
      await onSaveStaff({
        name,
        role,
        email,
        phone,
        department,
        shift,
      });

      setName('');
      setEmail('');
      setPhone('');
      setShowForm(false);
    } catch (err) {
      console.error('Erro ao adicionar colaborador:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Equipe de Higienização e Manutenção
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Contatos que recebem os lembretes automáticos e notificações push
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
        {!showForm ? (
          <div className="mt-4 flex justify-between items-center bg-black/60 p-3 rounded-2xl border border-red-950/50">
            <span className="text-xs text-slate-300">
              Total de colaboradores: <strong className="text-red-400">{staff.length}</strong>
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Responsável</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-2xl bg-black border border-red-950/60 space-y-3">
            <div className="font-bold text-xs text-slate-200">Cadastrar Novo Responsável</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-1.5 bg-[#14080b] border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Função / Cargo</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Operador de Padaria"
                  className="w-full px-3 py-1.5 bg-[#14080b] border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">E-mail para Lembretes *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: carlos@loja.com.br"
                  className="w-full px-3 py-1.5 bg-[#14080b] border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3 py-1.5 bg-[#14080b] border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-xl border border-red-950 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* Staff List */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
          {staff.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhum responsável cadastrado ainda. Clique em "+ Novo Responsável" para cadastrar.
            </div>
          ) : (
            staff.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-2xl bg-black/60 border border-red-950/50 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-sm text-slate-100">{member.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    <span className="text-red-400 font-medium">{member.role}</span>
                    <span> • {member.department}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{member.email}</span>
                    </span>
                    {member.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${member.email}`}
                    className="p-2 rounded-xl bg-[#14080b] hover:bg-[#200c12] text-red-300 border border-red-950/60 transition-all text-xs"
                    title="Enviar E-mail"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => onDeleteStaff(member.id)}
                    className="p-2 rounded-xl bg-[#14080b] hover:bg-red-950 text-slate-400 hover:text-red-400 border border-red-950/60 transition-all text-xs"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
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
