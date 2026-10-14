/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { StoreSectionsBar } from './components/StoreSectionsBar';
import { MachineFilters } from './components/MachineFilters';
import { MachineCard } from './components/MachineCard';
import { MachineTable } from './components/MachineTable';
import { CleanModal } from './components/CleanModal';
import { MachineModal } from './components/MachineModal';
import { MachineHistoryModal } from './components/MachineHistoryModal';
import { StaffModal } from './components/StaffModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { EmailReminderModal } from './components/EmailReminderModal';

import {
  Machine,
  CleaningLog,
  MaintenanceStaff,
  NotificationLog,
  FilterOptions,
  STORE_UNITS,
  STORE_SUB_DEPARTMENTS,
  StoreUnit,
  StoreSubDepartment,
} from './types';
import {
  getLocalStoredMachines,
  getLocalStoredLogs,
  getLocalStoredStaff,
  getLocalStoredNotifications,
  subscribeToMachines,
  subscribeToCleaningLogs,
  subscribeToStaff,
  saveOrUpdateMachine,
  deleteMachine,
  recordCleaning,
  saveStaff,
  deleteStaff,
  clearAllStoreData,
} from './services/machineService';
import {
  detectPendingCleanings,
  triggerBrowserPush,
  buildBatchReminderEmail,
  openEmailClient,
} from './services/notificationService';
import { exportGeneralCleaningReportPdf, exportIndividualMachinePdf } from './services/pdfService';
import { calculateCleaningStatus } from './utils/machineUtils';
import { testConnection } from './firebase/config';
import { AlertTriangle, CheckCircle, Plus, Cpu, Building2, Layers, RotateCcw } from 'lucide-react';

export default function App() {
  // Store Data States (starts completely zerado as requested by user)
  const [machines, setMachines] = useState<Machine[]>(getLocalStoredMachines());
  const [logs, setLogs] = useState<CleaningLog[]>(getLocalStoredLogs());
  const [staff, setStaff] = useState<MaintenanceStaff[]>(getLocalStoredStaff());
  const [notifications, setNotifications] = useState<NotificationLog[]>(getLocalStoredNotifications());

  // Location filter: Unidade (Matriz, Preá, CD) & Subcampo (Expedição, Balcão, Caixa, Escritório, Salão)
  const [activeUnit, setActiveUnit] = useState<string>('todos');
  const [activeSubDept, setActiveSubDept] = useState<string>('todos');

  // General Filter & Layout States
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    unit: 'todos',
    subDepartment: 'todos',
    cleaningStatus: 'todos',
    conservationStatus: 'todos',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<string>('urgencia');

  // Modals States
  const [cleanModalMachine, setCleanModalMachine] = useState<Machine | null>(null);
  const [machineModalTarget, setMachineModalTarget] = useState<Machine | null | 'new'>(null);
  const [historyModalMachine, setHistoryModalMachine] = useState<Machine | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState<boolean>(false);
  const [emailReminderMachine, setEmailReminderMachine] = useState<Machine | null>(null);

  // Floating notification toast
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (title: string, text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ title, text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    testConnection();

    // Auto-zero the platform once on boot as requested by user
    const hasBeenZeroed = localStorage.getItem('amilco_zeroed_v2');
    if (!hasBeenZeroed) {
      clearAllStoreData().then(() => {
        setMachines([]);
        setLogs([]);
        setNotifications([]);
        localStorage.setItem('amilco_zeroed_v2', 'true');
      });
    }

    const unsubMachines = subscribeToMachines((updated) => {
      setMachines(updated);
    });

    const unsubLogs = subscribeToCleaningLogs((updated) => {
      setLogs(updated);
    });

    const unsubStaff = subscribeToStaff((updated) => {
      setStaff(updated);
    });

    return () => {
      unsubMachines();
      unsubLogs();
      unsubStaff();
    };
  }, []);

  // Background automated notification checker
  useEffect(() => {
    if (machines.length === 0) return;

    const checkAlerts = () => {
      const pending = detectPendingCleanings(machines);
      const overdue = pending.filter((p) => p.status === 'atrasada');
      if (overdue.length > 0) {
        triggerBrowserPush(
          `⚠️ ${overdue.length} Computador(es) com Limpeza Atrasada!`,
          `Equipamento(s): ${overdue.map((o) => o.machine.name).slice(0, 2).join(', ')}...`
        );
      }
    };

    const timer = setTimeout(checkAlerts, 2000);
    const interval = setInterval(checkAlerts, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [machines]);

  // Urgent counts
  const { overdueCount, pendingCount } = useMemo(() => {
    let overdue = 0;
    let pending = 0;
    machines.forEach((m) => {
      const status = calculateCleaningStatus(m);
      if (status === 'atrasada') overdue++;
      else if (status === 'pendente') pending++;
    });
    return { overdueCount: overdue, pendingCount: pending };
  }, [machines]);

  // Filtered & Sorted Machines
  const filteredMachines = useMemo(() => {
    return machines
      .filter((m) => {
        // 1. Filter by Active Unit (Matriz, Preá, CD)
        if (activeUnit !== 'todos') {
          const mUnit = m.unit || m.department?.split('•')[0]?.trim();
          if (mUnit !== activeUnit && !m.department?.includes(activeUnit)) {
            return false;
          }
        }

        // 2. Filter by Active SubDepartment (Expedição, Balcão, Caixa, Escritório, Salão)
        if (activeSubDept !== 'todos') {
          const mSub = m.subDepartment || m.department?.split('•')[1]?.trim();
          if (mSub !== activeSubDept && !m.department?.includes(activeSubDept)) {
            return false;
          }
        }

        // 3. Search query
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchName = m.name?.toLowerCase().includes(q);
          const matchDept = m.department?.toLowerCase().includes(q);
          const matchUnit = m.unit?.toLowerCase().includes(q);
          const matchSub = m.subDepartment?.toLowerCase().includes(q);
          if (!matchName && !matchDept && !matchUnit && !matchSub) {
            return false;
          }
        }

        // 4. Cleaning status filter
        if (filters.cleaningStatus !== 'todos') {
          const cStatus = calculateCleaningStatus(m);
          if (cStatus !== filters.cleaningStatus) {
            return false;
          }
        }

        // 5. Conservation status filter
        if (filters.conservationStatus !== 'todos') {
          if (m.conservationStatus !== filters.conservationStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgencia') {
          const order = { atrasada: 0, pendente: 1, em_dia: 2 };
          const statA = order[calculateCleaningStatus(a)];
          const statB = order[calculateCleaningStatus(b)];
          if (statA !== statB) return statA - statB;
          return new Date(a.nextCleaningAt).getTime() - new Date(b.nextCleaningAt).getTime();
        }
        if (sortBy === 'nome') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'local') {
          return a.department.localeCompare(b.department);
        }
        if (sortBy === 'ultima_limpeza') {
          return new Date(b.lastCleanedAt).getTime() - new Date(a.lastCleanedAt).getTime();
        }
        if (sortBy === 'conservacao') {
          const cOrder = { critico: 0, regular: 1, bom: 2, excelente: 3 };
          return cOrder[a.conservationStatus] - cOrder[b.conservationStatus];
        }
        return 0;
      });
  }, [machines, activeUnit, activeSubDept, filters, sortBy]);

  // Reset entire platform
  const handleResetPlatform = async () => {
    await clearAllStoreData();
    setMachines([]);
    setLogs([]);
    setNotifications([]);
    setActiveUnit('todos');
    setActiveSubDept('todos');
    showToast('Plataforma Zerada', 'Todos os computadores foram limpos. Você pode iniciar o cadastro do zero agora.', 'success');
  };

  // Save or update machine
  const handleSaveMachine = async (data: Partial<Machine>) => {
    try {
      await saveOrUpdateMachine(data);
      showToast(
        data.id ? 'Computador Atualizado' : 'Computador Cadastrado',
        `Equipamento "${data.name}" salvo com sucesso em ${data.department}.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao Salvar', 'Não foi possível salvar os dados do computador.', 'alert');
    }
  };

  // Delete machine
  const handleDeleteMachine = async (id: string) => {
    try {
      await deleteMachine(id);
      showToast('Computador Excluído', 'O equipamento foi removido do sistema.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao Excluir', 'Não foi possível excluir o computador.', 'alert');
    }
  };

  // Record completed cleaning
  const handleRecordCleaning = async (params: {
    machineId: string;
    cleanedBy: string;
    cleanedAt: string;
    conservationStatus: any;
    productsUsed: string;
    checklistCompleted: boolean;
    checklistItems: string[];
    durationMinutes: number;
    notes: string;
  }) => {
    try {
      await recordCleaning(params);
      showToast(
        'Higienização Registrada!',
        `Limpeza concluída com sucesso por ${params.cleanedBy}. Próximo ciclo recalculado.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Erro ao Registrar', 'Ocorreu um erro ao salvar a higienização.', 'alert');
    }
  };

  // Send batch email reminder
  const handleBatchReminder = () => {
    const pendingAlerts = detectPendingCleanings(machines);
    if (pendingAlerts.length === 0) {
      showToast('Tudo em Dia!', 'Não há equipamentos com limpeza pendente ou atrasada no momento.', 'success');
      return;
    }
    const { subject, body } = buildBatchReminderEmail(pendingAlerts);
    openEmailClient('gerente@amilco.com.br', subject, body);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090203] via-[#0d0406] to-[#060102] text-slate-100 flex flex-col selection:bg-red-700 selection:text-white">
      
      {/* Top Header */}
      <Header
        machines={machines}
        staff={staff}
        overdueCount={overdueCount}
        pendingCount={pendingCount}
        onOpenNewMachine={() => setMachineModalTarget('new')}
        onOpenStaff={() => setIsStaffModalOpen(true)}
        onOpenNotifications={() => setIsNotifCenterOpen(true)}
        onExportGeneralPdf={() => exportGeneralCleaningReportPdf(machines)}
        onBatchReminder={handleBatchReminder}
        onResetAllData={handleResetPlatform}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* KPI Summary Cards */}
        <DashboardStats
          machines={machines}
          onFilterCleaningStatus={(status) => setFilters((prev) => ({ ...prev, cleaningStatus: status }))}
          onFilterConservationStatus={(status) => setFilters((prev) => ({ ...prev, conservationStatus: status }))}
          selectedCleaningStatus={filters.cleaningStatus}
          selectedConservationStatus={filters.conservationStatus}
        />

        {/* Hierarchical Store Selection: 1. Unidade (Matriz, Preá, CD) • 2. Subcampo (Expedição, Balcão, Caixa, Escritório, Salão) */}
        <StoreSectionsBar
          activeUnit={activeUnit}
          onSelectUnit={setActiveUnit}
          activeSubDept={activeSubDept}
          onSelectSubDept={setActiveSubDept}
          machines={machines}
        />

        {/* Filters and Search Bar */}
        <MachineFilters
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalFiltered={filteredMachines.length}
        />

        {/* Machines List / Grid or Empty State */}
        {filteredMachines.length === 0 ? (
          <div className="rounded-3xl border border-red-950/70 bg-gradient-to-b from-[#130508]/80 via-[#0d0305]/80 to-[#070102]/80 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm my-6">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 to-rose-950 p-[1.5px] shadow-xl shadow-red-950/60 mb-4 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0305] rounded-[22px] flex items-center justify-center">
                <Cpu className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {machines.length === 0 ? (
              <>
                <h3 className="text-xl font-extrabold text-white">
                  Plataforma Zerada e Pronta para Uso
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed">
                  Bem-vindo ao <strong className="text-red-300">COMPUTADORES AMILCO</strong>. A plataforma está pronta para você começar a cadastrar os equipamentos da sua loja por campos: escolha se é <strong className="text-white">Matriz, Preá ou CD</strong> e defina o subcampo (<strong className="text-white">Expedição, Balcão, Caixa, Escritório ou Salão</strong>).
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setMachineModalTarget('new')}
                    className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-xl shadow-red-950/70 transition-all active:scale-[0.98] border border-red-500/40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Primeiro Computador</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white">
                  Nenhum computador encontrado com os filtros selecionados
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
                  Não encontramos computadores para o local "{activeUnit !== 'todos' ? activeUnit : 'Todas Unidades'}" / "{activeSubDept !== 'todos' ? activeSubDept : 'Todos Subcampos'}".
                </p>
                <div className="mt-5 flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setActiveUnit('todos');
                      setActiveSubDept('todos');
                      setFilters({
                        search: '',
                        unit: 'todos',
                        subDepartment: 'todos',
                        cleaningStatus: 'todos',
                        conservationStatus: 'todos',
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#14080b] hover:bg-[#200c12] text-xs font-semibold text-red-300 border border-red-950/60"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={() => setMachineModalTarget('new')}
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-xs font-bold text-white shadow"
                  >
                    + Cadastrar neste Local
                  </button>
                </div>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onRecordCleaning={(m) => setCleanModalMachine(m)}
                onSendReminder={(m) => setEmailReminderMachine(m)}
                onViewHistory={(m) => setHistoryModalMachine(m)}
                onExportPdf={(m) => exportIndividualMachinePdf(m, logs)}
                onEdit={(m) => setMachineModalTarget(m)}
                onDelete={handleDeleteMachine}
              />
            ))}
          </div>
        ) : (
          <MachineTable
            machines={filteredMachines}
            onRecordCleaning={(m) => setCleanModalMachine(m)}
            onSendReminder={(m) => setEmailReminderMachine(m)}
            onViewHistory={(m) => setHistoryModalMachine(m)}
            onExportPdf={(m) => exportIndividualMachinePdf(m, logs)}
            onEdit={(m) => setMachineModalTarget(m)}
            onDelete={handleDeleteMachine}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-red-950/50 bg-[#080203] py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-200">COMPUTADORES AMILCO</span>
            <span className="text-red-500">•</span>
            <span>Matriz, Preá e CD</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Controle de Higienização, Limpeza Periódica e Status de Conservação
          </p>
        </div>
      </footer>

      {/* Modals */}

      {/* 1. Modal: Registrar Limpeza Concluída */}
      {cleanModalMachine && (
        <CleanModal
          machine={cleanModalMachine}
          staff={staff}
          onClose={() => setCleanModalMachine(null)}
          onSubmit={handleRecordCleaning}
        />
      )}

      {/* 2. Modal: Cadastrar ou Editar Computador */}
      {machineModalTarget && (
        <MachineModal
          machine={machineModalTarget === 'new' ? null : machineModalTarget}
          staff={staff}
          defaultUnit={activeUnit !== 'todos' ? activeUnit : 'Matriz'}
          defaultSubDept={activeSubDept !== 'todos' ? activeSubDept : 'Balcão'}
          onClose={() => setMachineModalTarget(null)}
          onSave={handleSaveMachine}
        />
      )}

      {/* 3. Modal: Histórico de Limpezas */}
      {historyModalMachine && (
        <MachineHistoryModal
          machine={historyModalMachine}
          logs={logs}
          onClose={() => setHistoryModalMachine(null)}
          onExportPdf={(m) => exportIndividualMachinePdf(m, logs)}
          onNewCleaning={(m) => {
            setHistoryModalMachine(null);
            setCleanModalMachine(m);
          }}
        />
      )}

      {/* 4. Modal: Gestão de Equipe */}
      {isStaffModalOpen && (
        <StaffModal
          staff={staff}
          onClose={() => setIsStaffModalOpen(false)}
          onSaveStaff={async (staffMember) => {
            await saveStaff(staffMember);
            showToast('Colaborador Salvo', `${staffMember.name} foi adicionado à equipe.`, 'success');
          }}
          onDeleteStaff={async (id) => {
            await deleteStaff(id);
            showToast('Colaborador Removido', 'Membro removido da equipe.', 'success');
          }}
        />
      )}

      {/* 5. Modal: Central de Notificações & Lembretes */}
      {isNotifCenterOpen && (
        <NotificationCenterModal
          machines={machines}
          notifications={notifications}
          onClose={() => setIsNotifCenterOpen(false)}
          onSelectMachine={(m: Machine) => {
            setIsNotifCenterOpen(false);
            setEmailReminderMachine(m);
          }}
        />
      )}

      {/* 6. Modal: Lembrete E-mail / WhatsApp */}
      {emailReminderMachine && (
        <EmailReminderModal
          machine={emailReminderMachine}
          staff={staff}
          onClose={() => setEmailReminderMachine(null)}
          onNotificationSent={() => {
            showToast('Lembrete Registrado', 'A notificação foi salva no histórico.', 'success');
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 bg-[#160609] border border-red-700/60 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-red-950/80 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="p-1 rounded-full bg-red-600/30 text-red-400">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold">{toastMessage.title}</p>
            <p className="text-[11px] text-slate-300">{toastMessage.text}</p>
          </div>
        </div>
      )}

    </div>
  );
}
