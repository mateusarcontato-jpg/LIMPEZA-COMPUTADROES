import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  MessageSquare,
  Radio,
  Check,
  Copy,
} from 'lucide-react';
import { Machine, MaintenanceStaff } from '../types';
import {
  buildMachineReminderEmail,
  openEmailClient,
  sendPushReminder,
} from '../services/notificationService';
import { logNotification } from '../services/machineService';
import { calculateCleaningStatus } from '../utils/machineUtils';

interface EmailReminderModalProps {
  machine: Machine | null;
  staff: MaintenanceStaff[];
  onClose: () => void;
  onNotificationSent?: () => void;
}

export const EmailReminderModal: React.FC<EmailReminderModalProps> = ({
  machine,
  staff,
  onClose,
  onNotificationSent,
}) => {
  if (!machine) return null;

  const initialEmailData = buildMachineReminderEmail(machine);

  const [recipient, setRecipient] = useState(initialEmailData.recipient);
  const [subject, setSubject] = useState(initialEmailData.subject);
  const [body, setBody] = useState(initialEmailData.body);
  const [copied, setCopied] = useState(false);
  const [pushSent, setPushSent] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);

  const cleaningStatus = calculateCleaningStatus(machine);

  const handleSendEmail = async () => {
    openEmailClient(recipient, subject, body);

    await logNotification({
      machineId: machine.id,
      machineName: machine.name,
      type: 'email',
      recipient,
      title: subject,
      message: body.slice(0, 300) + '...',
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    setEmailDispatched(true);
    if (onNotificationSent) onNotificationSent();
  };

  const handleSendPush = async () => {
    const success = await sendPushReminder(machine);
    setPushSent(true);
    if (onNotificationSent) onNotificationSent();
    setTimeout(() => setPushSent(false), 3000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const phoneClean = (machine.assignedStaffPhone || '').replace(/\D/g, '');
    const textEncoded = encodeURIComponent(`*${subject}*\n\n${body}`);
    const waUrl = phoneClean
      ? `https://wa.me/55${phoneClean}?text=${textEncoded}`
      : `https://wa.me/?text=${textEncoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f0709] border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-red-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/40">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Enviar Lembrete de Higienização
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispare avisos por e-mail, WhatsApp ou push para os responsáveis da loja
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

        {/* Machine Alert Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-black/70 border border-red-950/60 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-slate-200">
              {machine.name}
            </div>
            <div className="text-xs text-slate-400">
              Parte da Loja: {machine.department} • Frequência: {machine.frequencyLabel}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              cleaningStatus === 'atrasada'
                ? 'bg-red-950/70 text-red-300 border-red-600/50'
                : 'bg-amber-950/50 text-amber-300 border-amber-600/50'
            }`}
          >
            {cleaningStatus === 'atrasada' ? '⚠️ Limpeza Atrasada' : '⏰ Limpeza Pendente'}
          </span>
        </div>

        {/* Quick Send Options Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleSendPush}
            className="p-2.5 rounded-xl bg-[#14080b] hover:bg-[#200c12] border border-red-950/60 text-xs font-semibold text-red-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Radio className={`w-4 h-4 ${pushSent ? 'text-emerald-400' : 'text-red-400'}`} />
            <span>{pushSent ? 'Push Disparado!' : 'Disparar Push'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Enviar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyBody}
            className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-[#14080b] hover:bg-[#200c12] border border-red-950/60 text-xs font-semibold text-slate-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>

        {/* Email Editor */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destinatário (E-mail do Responsável)
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="responsavel@loja.com.br"
              className="w-full px-3 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-red-950/70 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Corpo da Mensagem
            </label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full font-mono text-[11px] leading-relaxed p-3 bg-black border border-red-950/70 rounded-xl text-slate-200 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-red-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {emailDispatched ? '✓ Lembrete registrado no histórico' : 'Clique para abrir no seu app de e-mail'}
          </span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-red-950 text-xs font-semibold text-slate-400 hover:text-white hover:bg-red-950/40 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-red-950/60 flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no E-mail</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
