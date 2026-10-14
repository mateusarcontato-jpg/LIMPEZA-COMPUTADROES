import React, { useState } from 'react';
import {
  X,
  Bell,
  Radio,
  CheckCircle2,
  Mail,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Machine, NotificationLog } from '../types';
import {
  detectPendingCleanings,
  triggerBrowserPush,
  playAlertChime,
  buildBatchReminderEmail,
  openEmailClient,
} from '../services/notificationService';
import { formatDateTime } from '../utils/machineUtils';
import { logNotification } from '../services/machineService';

interface NotificationCenterModalProps {
  machines: Machine[];
  notifications: NotificationLog[];
  onClose: () => void;
  onSelectMachine: (machine: Machine) => void;
  onRefreshNotifications?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  machines,
  notifications,
  onClose,
  onSelectMachine,
  onRefreshNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'pendentes' | 'historico'>('pendentes');
  const [batchSent, setBatchSent] = useState(false);

  const pendingAlerts = detectPendingCleanings(machines);

  const handleTestChime = () => {
    playAlertChime();
  };

  const handleSendAllPush = async () => {
    for (const alert of pendingAlerts) {
      const title = alert.status === 'atrasada'
        ? `⚠️ URGENTE: ${alert.machine.name}`
        : `⏰ Pendente: ${alert.machine.name}`;
      const msg = `Higienização necessária no setor ${alert.machine.department}. Última: ${formatDateTime(alert.machine.lastCleanedAt)}`;
      
      triggerBrowserPush(title, msg);

      await logNotification({
        machineId: alert.machine.id,
        machineName: alert.machine.name,
        type: 'push',
        recipient: alert.machine.assignedStaffName || 'Equipe da Loja',
        title,
        message: msg,
        status: 'delivered',
        sentAt: new Date().toISOString(),
      });
    }

    playAlertChime();
    onRefreshNotifications();
    setBatchSent(true);
    setTimeout(() => setBatchSent(false), 3000);
  };

  const handleSendBatchEmail = async () => {
    const { subject, body } = buildBatchReminderEmail(pendingAlerts);
    openEmailClient('gerente.loja@cleanmachine.com.br', subject, body);

    await logNotification({
      type: 'email',
      recipient: 'gerente.loja@cleanmachine.com.br',
      title: subject,
      message: `Consolidado de ${pendingAlerts.length} equipamentos pendentes/atrasados enviado para a gerência.`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    onRefreshNotifications();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Central de Notificações e Lembretes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle de pendências sanitárias e disparos para responsáveis
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

        {/* Top Control Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-black p-1 rounded-xl border border-red-950/60">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pendentes'
                  ? 'bg-red-950/70 text-red-300 border border-red-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendências Ativas ({pendingAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'historico'
                  ? 'bg-red-950/70 text-red-300 border border-red-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Histórico de Envios ({notifications.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestChime}
              className="p-2 rounded-xl bg-[#14080b] hover:bg-[#200c12] text-slate-300 border border-red-950/60 text-xs transition-all"
              title="Testar Som de Alerta"
            >
              <Volume2 className="w-4 h-4 text-red-400" />
            </button>

            {pendingAlerts.length > 0 && (
              <>
                <button
                  onClick={handleSendAllPush}
                  className="px-3 py-1.5 rounded-xl bg-[#14080b] hover:bg-[#200c12] text-red-300 border border-red-950/60 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{batchSent ? 'Push Enviado!' : 'Disparar Push'}</span>
                </button>

                <button
                  onClick={handleSendBatchEmail}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail Consolidado</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'pendentes' && (
          <div className="mt-4 max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            {pendingAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                <p className="text-base font-bold text-slate-200">Excelente! Todas as higienizações estão em dia.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Nenhum equipamento pendente de limpeza neste momento.
                </p>
              </div>
            ) : (
              pendingAlerts.map((alert) => (
                <div
                  key={alert.machine.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    alert.status === 'atrasada'
                      ? 'bg-red-950/30 border-red-600/50 hover:border-red-500'
                      : 'bg-amber-950/30 border-amber-600/50 hover:border-amber-500'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-white">{alert.machine.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Parte da Loja: <strong className="text-slate-200">{alert.machine.department}</strong> • Responsável:{' '}
                        <strong className="text-slate-200">{alert.machine.assignedStaffName || 'Não atribuído'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          alert.status === 'atrasada'
                            ? 'bg-red-950/70 text-red-300 border border-red-600/50'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-600/50'
                        }`}
                      >
                        {alert.status === 'atrasada'
                          ? `Atrasada há ${Math.abs(alert.hoursDiff)}h`
                          : `Vence em ${alert.hoursDiff}h`}
                      </span>

                      <button
                        onClick={() => {
                          onClose();
                          onSelectMachine(alert.machine);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Higienizar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="mt-4 max-h-[55vh] overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Mail className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-400">Nenhum registro de lembrete enviado ainda.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ao disparar lembretes por e-mail ou push, eles ficarão registrados aqui para auditoria.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-black/60 border border-red-950/50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/40 text-red-300 border border-red-900/40">
                        {n.type}
                      </span>
                      <span className="font-semibold text-slate-200">{n.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{formatDateTime(n.sentAt)}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}

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
