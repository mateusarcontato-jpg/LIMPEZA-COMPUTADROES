import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  FileDown,
  Plus,
  Users,
  Radio,
  AlertTriangle,
  RotateCcw,
  Building2,
  Cpu,
} from 'lucide-react';
import { Machine, MaintenanceStaff } from '../types';
import { getPushPermissionStatus, requestPushPermission } from '../services/notificationService';

interface HeaderProps {
  machines: Machine[];
  staff: MaintenanceStaff[];
  overdueCount: number;
  pendingCount: number;
  onOpenNewMachine: () => void;
  onOpenStaff: () => void;
  onOpenNotifications: () => void;
  onExportGeneralPdf: () => void;
  onBatchReminder: () => void;
  onResetAllData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  machines,
  staff,
  overdueCount,
  pendingCount,
  onOpenNewMachine,
  onOpenStaff,
  onOpenNotifications,
  onExportGeneralPdf,
  onBatchReminder,
  onResetAllData,
}) => {
  const [pushStatus, setPushStatus] = useState<NotificationPermission>(getPushPermissionStatus());

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setPushStatus(perm);
  };

  const totalUrgent = overdueCount + pendingCount;

  return (
    <header className="sticky top-0 z-30 border-b border-red-950/70 bg-[#080203]/90 backdrop-blur-md shadow-lg shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Store Parts summary */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-black p-[1.5px] shadow-lg shadow-red-950/60">
              <div className="w-full h-full bg-[#0c0305] rounded-[14px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-red-300 bg-clip-text text-transparent">
                  COMPUTADORES AMILCO
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-red-950/80 text-red-300 border border-red-700/40">
                  Matriz • Preá • CD
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Gestão de Higienização de Computadores por Local e Subcampos
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Native Push Notification Toggle */}
            <button
              onClick={handleEnablePush}
              title={pushStatus === 'granted' ? 'Notificações Push Ativas' : 'Ativar Notificações Push no Navegador'}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                pushStatus === 'granted'
                  ? 'bg-red-950/50 text-red-300 border-red-700/40'
                  : 'bg-black/60 hover:bg-[#180a0e] text-slate-400 hover:text-white border-red-950/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${pushStatus === 'granted' ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{pushStatus === 'granted' ? 'Push Ativo' : 'Ativar Push'}</span>
            </button>

            {/* Notification Center Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl bg-[#120508] hover:bg-[#1c080d] text-slate-300 hover:text-white border border-red-950/60 transition-colors"
              title="Central de Alertas e Notificações"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {totalUrgent > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md shadow-red-950/60 animate-bounce">
                  {totalUrgent}
                </span>
              )}
            </button>

            {/* Export General PDF */}
            <button
              onClick={onExportGeneralPdf}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#120508] hover:bg-[#1c080d] text-slate-200 hover:text-white border border-red-950/60 text-xs font-semibold transition-all shadow-sm"
              title="Emitir Relatório Geral de Higienização em PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-red-400" />
              <span>Emitir PDF</span>
            </button>

            {/* Quick Batch Email to Manager */}
            {totalUrgent > 0 && (
              <button
                onClick={onBatchReminder}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border border-amber-800/40 text-xs font-semibold transition-all"
                title="Disparar Lembrete Geral de Limpezas Pendentes"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Cobrar Limpezas</span>
              </button>
            )}

            {/* Manage Staff */}
            <button
              onClick={onOpenStaff}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#120508] hover:bg-[#1c080d] text-slate-300 hover:text-white border border-red-950/60 text-xs font-semibold transition-all"
              title="Equipe de Manutenção / Higienização"
            >
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>Equipe ({staff.length})</span>
            </button>

            {/* Zerar Plataforma */}
            <button
              onClick={() => {
                if (window.confirm('Deseja zerar todos os computadores para recadastrar do zero?')) {
                  onResetAllData();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-[#120508] hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-red-950/60 text-xs font-medium transition-all"
              title="Zerar todos os computadores cadastrados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Zerar Plataforma</span>
            </button>

            {/* Primary Action: Cadastrar Computador */}
            <button
              onClick={onOpenNewMachine}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-extrabold shadow-lg shadow-red-950/60 transition-all active:scale-[0.98] border border-red-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Computador</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
