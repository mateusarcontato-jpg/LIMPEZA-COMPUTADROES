import { Machine, CleaningStatus, ConservationStatus } from '../types';

export function calculateCleaningStatus(machine: Machine): CleaningStatus {
  if (!machine.nextCleaningAt) {
    return 'pendente';
  }

  const now = new Date().getTime();
  const nextTime = new Date(machine.nextCleaningAt).getTime();
  const diffHours = (nextTime - now) / (1000 * 60 * 60);

  if (now > nextTime) {
    return 'atrasada';
  } else if (diffHours <= 4) {
    return 'pendente';
  } else {
    return 'em_dia';
  }
}

export function calculateNextCleaningDate(lastCleanedIso: string, frequencyHours: number): string {
  const lastDate = new Date(lastCleanedIso);
  const nextDate = new Date(lastDate.getTime() + frequencyHours * 60 * 60 * 1000);
  return nextDate.toISOString();
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--/--/---- --:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--/--/---- --:--';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '--/--/----';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--/--/----';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--:--';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function getConservationLabel(status: ConservationStatus): string {
  switch (status) {
    case 'excelente':
      return 'Excelente (Novo / Perfeito)';
    case 'bom':
      return 'Bom (Operação Normal)';
    case 'regular':
      return 'Regular (Atenção / Desgaste)';
    case 'critico':
      return 'Crítico (Urgente / Risco)';
    default:
      return status;
  }
}

export function getConservationBadgeClasses(status: ConservationStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'excelente':
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-300',
        border: 'border-emerald-600/30',
        dot: 'bg-emerald-400',
      };
    case 'bom':
      return {
        bg: 'bg-slate-900/80',
        text: 'text-slate-200',
        border: 'border-slate-700/60',
        dot: 'bg-slate-400',
      };
    case 'regular':
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-300',
        border: 'border-amber-600/40',
        dot: 'bg-amber-400',
      };
    case 'critico':
      return {
        bg: 'bg-red-950/60',
        text: 'text-red-300',
        border: 'border-red-600/50',
        dot: 'bg-red-500 animate-pulse',
      };
  }
}

export function getCleaningStatusBadgeClasses(status: CleaningStatus): { label: string; bg: string; text: string; border: string; glow: string } {
  switch (status) {
    case 'em_dia':
      return {
        label: 'Em Dia',
        bg: 'bg-emerald-950/50',
        text: 'text-emerald-300',
        border: 'border-emerald-600/40',
        glow: 'shadow-emerald-950/30',
      };
    case 'pendente':
      return {
        label: 'Pendente Hoje',
        bg: 'bg-amber-950/50',
        text: 'text-amber-300',
        border: 'border-amber-600/40',
        glow: 'shadow-amber-950/30',
      };
    case 'atrasada':
      return {
        label: 'Atrasada!',
        bg: 'bg-red-950/70',
        text: 'text-red-200',
        border: 'border-red-600/60',
        glow: 'shadow-red-950/40',
      };
  }
}
