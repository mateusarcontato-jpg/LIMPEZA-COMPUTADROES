import { Machine, MaintenanceStaff, NotificationLog } from '../types';
import { calculateCleaningStatus, formatDateTime, getConservationLabel } from '../utils/machineUtils';
import { logNotification } from './machineService';

export interface PendingAlert {
  machine: Machine;
  status: 'pendente' | 'atrasada';
  hoursDiff: number; // Negativo se atrasado, positivo se faltam X horas
}

export function detectPendingCleanings(machines: Machine[]): PendingAlert[] {
  const alerts: PendingAlert[] = [];
  const now = new Date().getTime();

  for (const m of machines) {
    const status = calculateCleaningStatus(m);
    if (status === 'atrasada' || status === 'pendente') {
      const nextTime = new Date(m.nextCleaningAt).getTime();
      const hoursDiff = (nextTime - now) / (1000 * 60 * 60);
      alerts.push({
        machine: m,
        status,
        hoursDiff: Math.round(hoursDiff * 10) / 10,
      });
    }
  }

  // Sort by urgency: most overdue first
  alerts.sort((a, b) => a.hoursDiff - b.hoursDiff);
  return alerts;
}

// Browser Push Notification API
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações de desktop.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Erro ao solicitar permissão de push:', e);
    return 'denied';
  }
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

export function triggerBrowserPush(title: string, body: string): boolean {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `clean-${Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (e) {
    console.warn('Erro ao disparar notificação push nativa:', e);
    return false;
  }
}

// Subtle audio chime for in-app alert using Web Audio API
export function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio might be blocked if user hasn't interacted yet
  }
}

// Build pre-filled email content
export function buildMachineReminderEmail(machine: Machine, staffEmail?: string) {
  const recipient = staffEmail || machine.assignedStaffEmail || 'manutencao@lojaclean.com.br';
  const status = calculateCleaningStatus(machine);
  const isUrgent = status === 'atrasada';

  const subject = `[${isUrgent ? 'URGENTE: LIMPEZA ATRASADA' : 'LEMBRETE: LIMPEZA PENDENTE'}] ${machine.name} - Parte da Loja: ${machine.department}`;

  const body = `Olá, responsável pela higienização e manutenção,

Informamos que o equipamento abaixo está com o ciclo de higienização ${isUrgent ? 'ATRASADO' : 'PENDENTE DE REALIZAÇÃO'}:

==================================================
DADOS DO EQUIPAMENTO:
• Equipamento: ${machine.name}
• Parte da Loja / Setor: ${machine.department}
• Frequência Exigida: ${machine.frequencyLabel}
• Estado de Conservação Atual: ${getConservationLabel(machine.conservationStatus)}
==================================================
CONTROLE DE HIGIENIZAÇÃO:
• Última Limpeza Realizada: ${formatDateTime(machine.lastCleanedAt)}
• Realizada Por: ${machine.lastCleanedBy}
• Produtos Recomendados: Álcool Isopropílico e Pano Microfibra

CHECKLIST DE HIGIENIZAÇÃO:
${(machine.checklist || []).map((item, idx) => `  [ ] ${idx + 1}. ${item}`).join('\n')}

Observações do Equipamento:
"${machine.notes || 'Sem observações adicionais.'}"
==================================================

Por favor, realize o procedimento conforme os protocolos sanitários e registre a conclusão no painel administrativo de COMPUTADORES AMILCO para atualização dos relatórios oficiais.

Atenciosamente,
Sistema Administrativo COMPUTADORES AMILCO - Gestão de Equipamentos da Loja
`.trim();

  return { recipient, subject, body };
}

// Build batch email for manager
export function buildBatchReminderEmail(alerts: PendingAlert[]) {
  const subject = `[ALERTA DE HIGIENIZAÇÃO] ${alerts.length} Equipamento(s) com Limpeza Pendente ou Atrasada`;

  const items = alerts
    .map(
      (a, i) =>
        `${i + 1}. [${a.status === 'atrasada' ? 'ATRASADA' : 'PENDENTE'}] ${a.machine.name}
   - Parte da Loja: ${a.machine.department}
   - Responsável: ${a.machine.assignedStaffName || 'Não atribuído'}
   - Última limpeza: ${formatDateTime(a.machine.lastCleanedAt)}
   - Conservação: ${getConservationLabel(a.machine.conservationStatus)}`
    )
    .join('\n\n');

  const body = `Prezada Equipe de Gestão e Manutenção,

Segue o relatório consolidado de equipamentos que exigem atenção imediata de higienização na loja:

${items}

Solicitamos aos responsáveis de cada setor que priorizem estes procedimentos para garantir a conformidade sanitária e evitar multas ou danos aos equipamentos.

Painel COMPUTADORES AMILCO: ${typeof window !== 'undefined' ? window.location.origin : ''}
`.trim();

  return { subject, body };
}

// Trigger mailto client
export function openEmailClient(recipient: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    window.location.href = mailtoUrl;
  } catch (e) {
    console.error('Erro ao abrir cliente de email:', e);
  }
}

// Send automated push + log to firestore
export async function sendPushReminder(machine: Machine): Promise<boolean> {
  const status = calculateCleaningStatus(machine);
  const isOverdue = status === 'atrasada';
  const title = isOverdue
    ? `⚠️ Limpeza Atrasada: ${machine.name}`
    : `⏰ Limpeza Pendente: ${machine.name}`;
  const message = `${machine.name} (${machine.department}). Última limpeza: ${formatDateTime(machine.lastCleanedAt)}. Conservação: ${getConservationLabel(machine.conservationStatus)}.`;

  const pushSent = triggerBrowserPush(title, message);

  await logNotification({
    machineId: machine.id,
    machineName: machine.name,
    type: 'push',
    recipient: machine.assignedStaffName || 'Todos os Técnicos',
    title,
    message,
    status: pushSent ? 'delivered' : 'sent',
    sentAt: new Date().toISOString(),
  });

  return pushSent;
}

// Dispatch Email reminder and log
export async function dispatchEmailReminder(machine: Machine, customEmail?: string): Promise<void> {
  const { recipient, subject, body } = buildMachineReminderEmail(machine, customEmail);

  openEmailClient(recipient, subject, body);

  await logNotification({
    machineId: machine.id,
    machineName: machine.name,
    type: 'email',
    recipient,
    title: subject,
    message: `Lembrete de higienização disparado para ${recipient} referente a ${machine.name}.`,
    status: 'sent',
    sentAt: new Date().toISOString(),
  });
}
