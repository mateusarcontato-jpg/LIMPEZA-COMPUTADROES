export type ConservationStatus = 'excelente' | 'bom' | 'regular' | 'critico';

export type CleaningStatus = 'em_dia' | 'pendente' | 'atrasada';

export type StoreUnit = 'Matriz' | 'Preá' | 'CD';
export type StoreSubDepartment = 'Expedição' | 'Balcão' | 'Caixa' | 'Escritório' | 'Salão';

export const STORE_UNITS: StoreUnit[] = ['Matriz', 'Preá', 'CD'];
export const STORE_SUB_DEPARTMENTS: StoreSubDepartment[] = [
  'Expedição',
  'Balcão',
  'Caixa',
  'Escritório',
  'Salão',
];

export interface Machine {
  id: string;
  name: string; // Identificação do Computador / Equipamento
  unit: StoreUnit | string; // Matriz | Preá | CD
  subDepartment: StoreSubDepartment | string; // Expedição | Balcão | Caixa | Escritório | Salão
  department: string; // Ex: 'Matriz • Balcão' ou 'Preá • Expedição'
  frequencyHours: number; // Intervalo em horas (ex: 24h, 48h, 168h)
  frequencyLabel: string; // Ex: "Diária", "Semanal", etc.
  conservationStatus: ConservationStatus; // 'excelente' | 'bom' | 'regular' | 'critico'
  lastCleanedAt: string; // ISO 8601 string
  lastCleanedBy: string; // Nome de quem limpou
  nextCleaningAt: string; // ISO 8601 string
  checklist?: string[]; // Itens verificados
  notes?: string; // Observações rápidas
  assignedStaffName?: string; // Responsável pela manutenção
  assignedStaffEmail?: string;
  assignedStaffPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningLog {
  id: string;
  machineId: string;
  machineName: string;
  cleanedAt: string; // Data e hora da limpeza realizada
  cleanedBy: string; // Nome do colaborador responsável
  conservationStatus: ConservationStatus; // Estado avaliado durante a limpeza
  productsUsed?: string; // Produtos utilizados
  checklistCompleted: boolean;
  checklistItems: string[];
  durationMinutes: number; // Tempo de execução da limpeza
  notes: string;
  createdAt: string;
}

export interface MaintenanceStaff {
  id: string;
  name: string;
  role: string; // Cargo
  email: string;
  phone: string;
  department: string;
  shift: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  machineId?: string;
  machineName?: string;
  type: 'email' | 'push' | 'system';
  recipient: string;
  title: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
}

export interface FilterOptions {
  search: string;
  unit: string; // 'todos' | 'Matriz' | 'Preá' | 'CD'
  subDepartment: string; // 'todos' | 'Expedição' | 'Balcão' | 'Caixa' | 'Escritório' | 'Salão'
  conservationStatus: string;
  cleaningStatus: string;
}
