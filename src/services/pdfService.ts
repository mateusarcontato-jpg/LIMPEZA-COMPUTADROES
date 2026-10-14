import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Machine, CleaningLog } from '../types';
import {
  calculateCleaningStatus,
  formatDateTime,
  formatDate,
  getConservationLabel,
} from '../utils/machineUtils';

export function exportGeneralCleaningReportPdf(
  machines: Machine[],
  storeName: string = 'COMPUTADORES AMILCO'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = formatDateTime(now.toISOString());

  // Statistics calculation
  let emDia = 0;
  let pendente = 0;
  let atrasada = 0;
  let excelente = 0;
  let bom = 0;
  let regular = 0;
  let critico = 0;

  machines.forEach((m) => {
    const status = calculateCleaningStatus(m);
    if (status === 'em_dia') emDia++;
    else if (status === 'pendente') pendente++;
    else if (status === 'atrasada') atrasada++;

    if (m.conservationStatus === 'excelente') excelente++;
    else if (m.conservationStatus === 'bom') bom++;
    else if (m.conservationStatus === 'regular') regular++;
    else if (m.conservationStatus === 'critico') critico++;
  });

  const complianceRate = machines.length > 0
    ? Math.round((emDia / machines.length) * 100)
    : 100;

  // Header background
  doc.setFillColor(12, 3, 5); // very dark red-black
  doc.rect(0, 0, 297, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE HIGIENIZAÇÃO E CONSERVAÇÃO DE COMPUTADORES', 14, 13);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text(`${storeName} • Unidades: Matriz, Preá e CD • Controle Preventivo`, 14, 21);

  // Emission date on top right
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emitido em: ${dateStr}`, 283, 13, { align: 'right' });
  doc.text(`Total de Computadores: ${machines.length}`, 283, 21, { align: 'right' });

  // Metric Summary Cards
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 34, 269, 16, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  // Print summary KPIs
  const kpiY = 44;
  doc.text(`Status de Limpeza:`, 18, kpiY);

  doc.setTextColor(16, 185, 129); // green
  doc.text(`[OK] Em Dia: ${emDia}`, 52, kpiY);

  doc.setTextColor(217, 119, 6); // amber
  doc.text(`[!] Pendentes: ${pendente}`, 88, kpiY);

  doc.setTextColor(225, 29, 72); // rose
  doc.text(`[X] Atrasadas: ${atrasada}`, 126, kpiY);

  doc.setTextColor(30, 41, 59);
  doc.text(`Conformidade Geral: ${complianceRate}%`, 168, kpiY);

  doc.setTextColor(225, 29, 72);
  doc.text(`Computadores Críticos: ${critico}`, 220, kpiY);

  // Table rows
  const tableData = machines.map((m) => {
    const cStatus = calculateCleaningStatus(m);
    let statusLabel = 'Em Dia';
    if (cStatus === 'pendente') statusLabel = 'PENDENTE HOJE';
    if (cStatus === 'atrasada') statusLabel = 'ATRASADA!';

    let conservLabel = 'Bom';
    if (m.conservationStatus === 'excelente') conservLabel = 'Excelente';
    if (m.conservationStatus === 'regular') conservLabel = 'Regular (Atenção)';
    if (m.conservationStatus === 'critico') conservLabel = 'CRÍTICO';

    const unit = m.unit || m.department?.split('•')[0]?.trim() || 'Matriz';
    const subDept = m.subDepartment || m.department?.split('•')[1]?.trim() || '-';

    return [
      m.name,
      unit,
      subDept,
      m.frequencyLabel,
      formatDateTime(m.lastCleanedAt),
      m.lastCleanedBy || 'Não reg.',
      formatDateTime(m.nextCleaningAt),
      statusLabel,
      conservLabel,
    ];
  });

  autoTable(doc, {
    startY: 54,
    head: [
      [
        'Computador',
        'Unidade',
        'Subcampo',
        'Frequência',
        'Última Limpeza (Data/Hora)',
        'Responsável',
        'Próxima Prevista',
        'Status Higiene',
        'Conservação',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [185, 28, 28], // red-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 28 },
      4: { cellWidth: 38 },
      5: { cellWidth: 30 },
      6: { cellWidth: 38 },
      7: { cellWidth: 26, fontStyle: 'bold' },
      8: { cellWidth: 22, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight cleaning status
      if (data.section === 'body' && data.column.index === 7) {
        const text = String(data.cell.raw);
        if (text.includes('ATRASADA')) {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fillColor = [255, 241, 242];
        } else if (text.includes('PENDENTE')) {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fillColor = [254, 243, 199];
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }

      // Highlight conservation status
      if (data.section === 'body' && data.column.index === 8) {
        const text = String(data.cell.raw);
        if (text.includes('CRÍTICO')) {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('Regular')) {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (text.includes('Excelente')) {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
  });

  // Footer on all pages
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, 192, 283, 192);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'COMPUTADORES AMILCO - Gestão e Higienização de Equipamentos • Matriz, Preá e CD',
      14,
      197
    );
    doc.text(`Página ${i} de ${pageCount}`, 283, 197, { align: 'right' });
  }

  // Save PDF
  const filename = `Relatorio_Computadores_Amilco_${formatDate(now.toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

export function exportIndividualMachinePdf(
  machine: Machine,
  logs: CleaningLog[],
  storeName: string = 'COMPUTADORES AMILCO'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = formatDateTime(now.toISOString());
  const cleaningStatus = calculateCleaningStatus(machine);

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FICHA TÉCNICA E HISTÓRICO DE HIGIENIZAÇÃO', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(244, 63, 94);
  doc.text(`${storeName} • Prontuário Individual do Equipamento`, 14, 22);

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emissão: ${dateStr}`, 196, 18, { align: 'right' });

  // Machine Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 48, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(machine.name, 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const col1X = 18;
  const col2X = 110;

  doc.text(`• Unidade: ${machine.unit || 'Matriz'}`, col1X, 53);
  doc.text(`• Subcampo / Setor: ${machine.subDepartment || 'Balcão'}`, col1X, 59);
  doc.text(`• Local Completo: ${machine.department}`, col1X, 65);
  doc.text(`• Frequência de Limpeza: ${machine.frequencyLabel}`, col1X, 71);

  doc.text(`• Estado de Conservação: ${getConservationLabel(machine.conservationStatus)}`, col2X, 53);
  doc.text(`• Última Limpeza: ${formatDateTime(machine.lastCleanedAt)}`, col2X, 59);
  doc.text(`• Realizada por: ${machine.lastCleanedBy}`, col2X, 65);
  doc.text(`• Próxima Limpeza: ${formatDateTime(machine.nextCleaningAt)}`, col2X, 71);

  // Status indicator box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (cleaningStatus === 'atrasada') {
    doc.setFillColor(255, 228, 230);
    doc.setTextColor(225, 29, 72);
  } else if (cleaningStatus === 'pendente') {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(180, 83, 9);
  } else {
    doc.setFillColor(236, 253, 245);
    doc.setTextColor(5, 150, 105);
  }
  doc.roundedRect(18, 75, 174, 8, 1, 1, 'F');
  doc.text(
    `STATUS ATUAL: ${
      cleaningStatus === 'atrasada'
        ? '⚠️ LIMPEZA ATRASADA - PRIORIDADE MÁXIMA'
        : cleaningStatus === 'pendente'
        ? '⏰ LIMPEZA PROGRAMADA PARA HOJE'
        : '✓ HIGIENIZAÇÃO EM DIA E CONFORME'
    }`,
    22,
    80.5
  );

  // Responsável & Observações box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 90, 182, 30, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Responsável pela Manutenção / Contato:', 18, 97);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`${machine.assignedStaffName || 'Equipe Geral'} • Telefone/WhatsApp: ${machine.assignedStaffPhone || '-'} • E-mail: ${machine.assignedStaffEmail || '-'}`, 18, 103, { maxWidth: 174 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Observações e Recomendações:', 18, 110);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(machine.notes || 'Sem observações adicionais.', 18, 115, { maxWidth: 174 });

  // Cleaning history table
  const machineLogs = logs.filter((l) => l.machineId === machine.id);
  const tableData = machineLogs.map((l) => [
    formatDateTime(l.cleanedAt),
    l.cleanedBy,
    getConservationLabel(l.conservationStatus),
    `${l.durationMinutes || 20} min`,
    l.productsUsed || '-',
    l.notes || 'Sem ocorrências',
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Histórico de Limpezas Realizadas:', 14, 130);

  if (tableData.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum registro anterior cadastrado para este computador.', 14, 138);
  } else {
    autoTable(doc, {
      startY: 134,
      head: [
        [
          'Data e Hora',
          'Colaborador',
          'Conservação',
          'Duração',
          'Produtos Utilizados',
          'Observações',
        ],
      ],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [185, 28, 28], // red-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 30 },
        2: { cellWidth: 26 },
        3: { cellWidth: 16 },
        4: { cellWidth: 34 },
        5: { cellWidth: 44 },
      },
    });
  }

  // Footer on all pages
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, 280, 196, 280);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'COMPUTADORES AMILCO • Controle de Higienização e Manutenção de Equipamentos',
      14,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
  }

  const cleanName = machine.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Ficha_Higienizacao_${cleanName}_${formatDate(now.toISOString()).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
