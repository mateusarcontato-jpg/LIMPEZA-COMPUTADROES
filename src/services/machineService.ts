import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Machine, CleaningLog, MaintenanceStaff, NotificationLog, ConservationStatus } from '../types';
import { calculateNextCleaningDate } from '../utils/machineUtils';

const MACHINES_COLLECTION = 'machines';
const CLEANING_LOGS_COLLECTION = 'cleaning_logs';
const STAFF_COLLECTION = 'staff';
const NOTIFICATIONS_COLLECTION = 'notifications';
const SECTIONS_COLLECTION = 'store_sections';

// LocalStorage Keys
const STORAGE_MACHINES_KEY = 'cleanmachine_machines_data';
const STORAGE_LOGS_KEY = 'cleanmachine_logs_data';
const STORAGE_STAFF_KEY = 'cleanmachine_staff_data';
const STORAGE_NOTIF_KEY = 'cleanmachine_notif_data';
const STORAGE_SECTIONS_KEY = 'cleanmachine_sections_data';

// Default initial store units/parts (Matriz, Preá, CD)
export const DEFAULT_STORE_SECTIONS: string[] = [
  'Matriz',
  'Preá',
  'CD',
];

// Initial baseline: completely clean (empty) as requested by user
export function getLocalStoredMachines(): Machine[] {
  try {
    const raw = localStorage.getItem(STORAGE_MACHINES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local machines:', e);
  }
  return [];
}

export function saveLocalMachines(machines: Machine[]) {
  try {
    localStorage.setItem(STORAGE_MACHINES_KEY, JSON.stringify(machines));
  } catch (e) {
    console.error('Error saving local machines:', e);
  }
}

export function getLocalStoredLogs(): CleaningLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local logs:', e);
  }
  return [];
}

export function saveLocalLogs(logs: CleaningLog[]) {
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving local logs:', e);
  }
}

export function getLocalStoredStaff(): MaintenanceStaff[] {
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local staff:', e);
  }
  return [];
}

export function saveLocalStaff(staff: MaintenanceStaff[]) {
  try {
    localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(staff));
  } catch (e) {
    console.error('Error saving local staff:', e);
  }
}

export function getLocalStoredSections(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_SECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local sections:', e);
  }
  return DEFAULT_STORE_SECTIONS;
}

export function saveLocalSections(sections: string[]) {
  try {
    localStorage.setItem(STORAGE_SECTIONS_KEY, JSON.stringify(sections));
  } catch (e) {
    console.error('Error saving local sections:', e);
  }
}

export function getLocalStoredNotifications(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIF_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local notifications:', e);
  }
  return [];
}

export function saveLocalNotifications(notifs: NotificationLog[]) {
  try {
    localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Error saving local notifications:', e);
  }
}

// Subscribe to real-time updates from Firestore
export function subscribeToMachines(callback: (machines: Machine[]) => void) {
  const colRef = collection(db, MACHINES_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const list: Machine[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Machine);
      });
      saveLocalMachines(list);
      callback(list);
    },
    (error) => {
      console.warn('Firestore onSnapshot machines error (falling back to local):', error.message);
      callback(getLocalStoredMachines());
    }
  );

  return unsubscribe;
}

export function subscribeToCleaningLogs(callback: (logs: CleaningLog[]) => void) {
  const colRef = collection(db, CLEANING_LOGS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const list: CleaningLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as CleaningLog);
      });
      list.sort((a, b) => new Date(b.cleanedAt).getTime() - new Date(a.cleanedAt).getTime());
      saveLocalLogs(list);
      callback(list);
    },
    (error) => {
      console.warn('Firestore onSnapshot logs error (falling back to local):', error.message);
      callback(getLocalStoredLogs());
    }
  );

  return unsubscribe;
}

export function subscribeToStaff(callback: (staff: MaintenanceStaff[]) => void) {
  const colRef = collection(db, STAFF_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const list: MaintenanceStaff[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as MaintenanceStaff);
      });
      saveLocalStaff(list);
      callback(list);
    },
    (error) => {
      console.warn('Firestore onSnapshot staff error:', error.message);
      callback(getLocalStoredStaff());
    }
  );

  return unsubscribe;
}

// Clear all data completely (reset function requested by user)
export async function clearAllStoreData(): Promise<void> {
  // Wipe LocalStorage
  localStorage.removeItem(STORAGE_MACHINES_KEY);
  localStorage.removeItem(STORAGE_LOGS_KEY);
  localStorage.removeItem(STORAGE_NOTIF_KEY);

  // Clean Firestore collections
  try {
    const snapMachines = await getDocs(collection(db, MACHINES_COLLECTION));
    for (const d of snapMachines.docs) {
      await deleteDoc(d.ref);
    }

    const snapLogs = await getDocs(collection(db, CLEANING_LOGS_COLLECTION));
    for (const d of snapLogs.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {
    console.warn('Erro ao limpar Firestore:', e);
  }
}

// Machine Operations
export async function saveOrUpdateMachine(machine: Partial<Machine> & { id?: string }): Promise<Machine> {
  const nowIso = new Date().toISOString();
  const id = machine.id || `maq-${Date.now()}`;
  const frequencyHours = machine.frequencyHours || 24;
  const lastCleanedAt = machine.lastCleanedAt || nowIso;
  const nextCleaningAt = machine.nextCleaningAt || calculateNextCleaningDate(lastCleanedAt, frequencyHours);

  const unit = machine.unit || machine.department?.split('•')[0]?.trim() || 'Matriz';
  const subDepartment = machine.subDepartment || machine.department?.split('•')[1]?.trim() || 'Balcão';
  const department = machine.department || `${unit} • ${subDepartment}`;

  const fullMachine: Machine = {
    id,
    name: machine.name || 'Computador Amilco',
    unit,
    subDepartment,
    department,
    frequencyHours,
    frequencyLabel: machine.frequencyLabel || `${frequencyHours}h`,
    conservationStatus: machine.conservationStatus || 'bom',
    lastCleanedAt,
    lastCleanedBy: machine.lastCleanedBy || 'Responsável',
    nextCleaningAt,
    checklist: machine.checklist || ['Limpeza externa de gabinete', 'Sanitização de teclado e mouse', 'Verificação de ventilação'],
    notes: machine.notes || '',
    assignedStaffName: machine.assignedStaffName || '',
    assignedStaffEmail: machine.assignedStaffEmail || '',
    assignedStaffPhone: machine.assignedStaffPhone || '',
    createdAt: machine.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // Local update
  const current = getLocalStoredMachines();
  const index = current.findIndex((m) => m.id === id);
  if (index >= 0) {
    current[index] = fullMachine;
  } else {
    current.unshift(fullMachine);
  }
  saveLocalMachines(current);

  // Firestore update
  try {
    await setDoc(doc(db, MACHINES_COLLECTION, id), fullMachine);
  } catch (error) {
    console.warn('Firestore write machine error:', error);
  }

  return fullMachine;
}

export async function deleteMachine(id: string): Promise<void> {
  const current = getLocalStoredMachines().filter((m) => m.id !== id);
  saveLocalMachines(current);

  try {
    await deleteDoc(doc(db, MACHINES_COLLECTION, id));
  } catch (error) {
    console.warn('Firestore delete machine error:', error);
  }
}

// Record a new Cleaning Event
export async function recordCleaning({
  machineId,
  cleanedBy,
  cleanedAt,
  conservationStatus,
  productsUsed,
  checklistCompleted,
  checklistItems,
  durationMinutes,
  notes,
}: {
  machineId: string;
  cleanedBy: string;
  cleanedAt: string;
  conservationStatus: ConservationStatus;
  productsUsed: string;
  checklistCompleted: boolean;
  checklistItems: string[];
  durationMinutes: number;
  notes: string;
}): Promise<CleaningLog> {
  const currentMachines = getLocalStoredMachines();
  const machine = currentMachines.find((m) => m.id === machineId);
  if (!machine) {
    throw new Error('Máquina não encontrada');
  }

  const logId = `log-${Date.now()}`;
  const log: CleaningLog = {
    id: logId,
    machineId,
    machineName: machine.name,
    cleanedAt,
    cleanedBy,
    conservationStatus,
    productsUsed,
    checklistCompleted,
    checklistItems,
    durationMinutes,
    notes,
    createdAt: new Date().toISOString(),
  };

  // Update logs
  const logs = getLocalStoredLogs();
  logs.unshift(log);
  saveLocalLogs(logs);

  try {
    await setDoc(doc(db, CLEANING_LOGS_COLLECTION, logId), log);
  } catch (error) {
    console.warn('Firestore write log error:', error);
  }

  // Update machine status, last cleaned date/time and next cleaning date/time
  const nextCleaningAt = calculateNextCleaningDate(cleanedAt, machine.frequencyHours);
  const updatedMachine: Machine = {
    ...machine,
    lastCleanedAt: cleanedAt,
    lastCleanedBy: cleanedBy,
    nextCleaningAt,
    conservationStatus,
    updatedAt: new Date().toISOString(),
  };

  const mIndex = currentMachines.findIndex((m) => m.id === machineId);
  if (mIndex >= 0) {
    currentMachines[mIndex] = updatedMachine;
    saveLocalMachines(currentMachines);
  }

  try {
    await setDoc(doc(db, MACHINES_COLLECTION, machineId), updatedMachine);
  } catch (error) {
    console.warn('Firestore update machine after clean error:', error);
  }

  return log;
}

// Staff Operations
export async function saveStaff(staffMember: Partial<MaintenanceStaff> & { id?: string }): Promise<MaintenanceStaff> {
  const id = staffMember.id || `staff-${Date.now()}`;
  const fullStaff: MaintenanceStaff = {
    id,
    name: staffMember.name || 'Responsável',
    role: staffMember.role || 'Operador de Higienização',
    email: staffMember.email || 'responsavel@loja.com.br',
    phone: staffMember.phone || '',
    department: staffMember.department || 'Geral',
    shift: staffMember.shift || 'Manhã',
    createdAt: staffMember.createdAt || new Date().toISOString(),
  };

  const list = getLocalStoredStaff();
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) {
    list[idx] = fullStaff;
  } else {
    list.push(fullStaff);
  }
  saveLocalStaff(list);

  try {
    await setDoc(doc(db, STAFF_COLLECTION, id), fullStaff);
  } catch (error) {
    console.warn('Firestore write staff error:', error);
  }

  return fullStaff;
}

export async function deleteStaff(id: string): Promise<void> {
  const list = getLocalStoredStaff().filter((s) => s.id !== id);
  saveLocalStaff(list);

  try {
    await deleteDoc(doc(db, STAFF_COLLECTION, id));
  } catch (error) {
    console.warn('Firestore delete staff error:', error);
  }
}

// Log notification sent
export async function logNotification(notif: Omit<NotificationLog, 'id'>): Promise<NotificationLog> {
  const id = `notif-${Date.now()}`;
  const fullNotif: NotificationLog = {
    id,
    ...notif,
  };

  const list = getLocalStoredNotifications();
  list.unshift(fullNotif);
  saveLocalNotifications(list);

  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), fullNotif);
  } catch (error) {
    console.warn('Firestore write notif error:', error);
  }

  return fullNotif;
}
