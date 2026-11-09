/**
 * Exportador de balancete higienizado em formato Excel (.xlsx) usando ExcelJS.
 * Gera o layout fiel à exportação solicitada:
 * - Apenas 6 colunas: Conta, Descricao, Saldo anterior, Debito, Credito, Saldo atual
 * - Cabeçalho sem cores (fundo transparente/branco com linha preta)
 * - Contas viradas (invertidas) destacadas em vermelho
 */

import ExcelJS from 'exceljs';
import { BalanceteParseResult } from '../types/balancete.ts';

/**
 * Formata valores de saldo anterior e saldo atual com notação contábil Protheus
 */
function formatBalanceValue(
  value: number,
  nature?: 'D' | 'C' | 'ZERO' | 'INDETERMINADO',
  raw?: any
): string {
  // Se for zero
  if (value === 0) {
    return '0,00';
  }

  // Se já for uma string válida terminando com D ou C
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.endsWith(' D') || trimmed.endsWith(' C') || trimmed.endsWith('D') || trimmed.endsWith('C')) {
      return trimmed;
    }
  }

  const formattedNum = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (nature === 'D' || nature === 'C') {
    return `${formattedNum} ${nature}`;
  }

  return formattedNum;
}

/**
 * Formata valores de débito e crédito no formato Protheus (traço '-' quando zerado)
 */
function formatMovementValue(value: number, raw?: any): string {
  if (value === 0) {
    return '-';
  }

  if (typeof raw === 'string' && raw.trim() === '-') {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

export async function exportTreatedBalanceteToExcel(
  parseResult: BalanceteParseResult,
  filename = 'balancete_protheus_tratado.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tratador de Balancetes Protheus';
  workbook.lastModifiedBy = 'Tratador de Balancetes Protheus';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Aba única do Balancete Tratado sem linhas de grade
  const worksheet = workbook.addWorksheet(parseResult.sheetName || 'Balancete', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }],
  });

  // Apenas as 6 colunas exatamente como na imagem
  worksheet.columns = [
    { header: 'Conta', key: 'conta', width: 22 },
    { header: 'Descricao', key: 'descricao', width: 48 },
    { header: 'Saldo anterior', key: 'saldoAnterior', width: 20 },
    { header: 'Debito', key: 'debito', width: 16 },
    { header: 'Credito', key: 'credito', width: 16 },
    { header: 'Saldo atual', key: 'saldoAtual', width: 20 },
  ];

  // Cabeçalho sem cores (fundo transparente/branco), texto padrão preto e borda inferior preta
  const headerRow = worksheet.getRow(1);
  headerRow.height = 20;

  headerRow.eachCell((cell, colNumber) => {
    // Sem cor de fundo
    cell.fill = {
      type: 'pattern',
      pattern: 'none',
    };

    // Fonte preta padrão, sem cor de fundo
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF000000' },
    };

    // Alinhamentos conforme imagem: Conta e Descricao à esquerda, valores à direita
    if (colNumber === 1 || colNumber === 2) {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }

    // Linha inferior preta do cabeçalho
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
    };
  });

  // Linhas das contas
  parseResult.allCleanRows.forEach((row) => {
    const isInverted = row.status === 'INVERTIDO';
    const isTotalizer = row.isTotalizer;

    // Remover os pontos da conta contábil deixando apenas os números (mantendo como texto para não perder zeros à esquerda nem converter para notação científica)
    let exportedConta = row.conta || '';
    if (!isTotalizer && exportedConta) {
      const onlyNumbers = String(exportedConta).replace(/[^0-9]/g, '');
      exportedConta = onlyNumbers.length > 0 ? onlyNumbers : String(exportedConta).replace(/\./g, '').trim();
    }

    const rowData = {
      conta: exportedConta,
      descricao: row.descricao,
      saldoAnterior: Math.abs(row.saldoAnteriorValue),
      debito: row.debitoValue !== 0 ? Math.abs(row.debitoValue) : 0,
      credito: row.creditoValue !== 0 ? Math.abs(row.creditoValue) : 0,
      saldoAtual: Math.abs(row.saldoAtualValue),
    };

    const addedRow = worksheet.addRow(rowData);
    addedRow.height = 19;

    // Alinhamento e máscara visual das células
    const contaCell = addedRow.getCell('conta');
    contaCell.alignment = { vertical: 'middle', horizontal: 'left' };
    contaCell.numFmt = '@'; // Formato texto no Excel para preservar dígitos da conta

    addedRow.getCell('descricao').alignment = { vertical: 'middle', horizontal: 'left' };

    // Máscara visual do Saldo Anterior (o valor é numérico puro, "D" ou "C" é apenas máscara)
    const cellSaldoAnt = addedRow.getCell('saldoAnterior');
    cellSaldoAnt.alignment = { vertical: 'middle', horizontal: 'right' };
    if (row.saldoAnteriorValue === 0) {
      cellSaldoAnt.numFmt = '#,##0.00;(#,##0.00);"0,00"';
    } else if (row.saldoAnteriorNature === 'D') {
      cellSaldoAnt.numFmt = '#,##0.00 "D";(#,##0.00 "D");"0,00"';
    } else if (row.saldoAnteriorNature === 'C') {
      cellSaldoAnt.numFmt = '#,##0.00 "C";(#,##0.00 "C");"0,00"';
    } else {
      cellSaldoAnt.numFmt = '#,##0.00;(#,##0.00);"0,00"';
    }

    // Débito e Crédito com traço '-' quando zerados
    const cellDebito = addedRow.getCell('debito');
    cellDebito.alignment = { vertical: 'middle', horizontal: 'right' };
    cellDebito.numFmt = '#,##0.00;(#,##0.00);"-"';

    const cellCredito = addedRow.getCell('credito');
    cellCredito.alignment = { vertical: 'middle', horizontal: 'right' };
    cellCredito.numFmt = '#,##0.00;(#,##0.00);"-"';

    // Máscara visual do Saldo Atual: "D" ou "C" visível, mas valor puro numérico ao copiar
    const cellSaldoAtual = addedRow.getCell('saldoAtual');
    cellSaldoAtual.alignment = { vertical: 'middle', horizontal: 'right' };
    if (row.saldoAtualValue === 0) {
      cellSaldoAtual.numFmt = '#,##0.00;(#,##0.00);"0,00"';
    } else if (row.saldoAtualNature === 'D') {
      cellSaldoAtual.numFmt = '#,##0.00 "D";(#,##0.00 "D");"0,00"';
    } else if (row.saldoAtualNature === 'C') {
      cellSaldoAtual.numFmt = '#,##0.00 "C";(#,##0.00 "C");"0,00"';
    } else {
      cellSaldoAtual.numFmt = '#,##0.00;(#,##0.00);"0,00"';
    }

    const isSynthetica = !!row.isSynthetica;

    // Estilo de fonte conforme classificação
    if (isInverted) {
      // Se for conta com saldo virado (invertido): destacar em VERMELHO
      // Negrito apenas se for sintética
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'none',
        };
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: isSynthetica,
          color: { argb: 'FFFF0000' }, // Vermelho
        };
      });
    } else if (isTotalizer) {
      // Linha de totais: negrito preto com borda dupla inferior
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FF000000' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
        };
      });
    } else if (isSynthetica) {
      // Contas SINTÉTICAS: em NEGRITO quando exportar conforme solicitado pelo usuário
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FF000000' },
        };
      });
    } else {
      // Contas ANALÍTICAS: NÃO devem estar em negrito (fonte regular normal)
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: false,
          color: { argb: 'FF000000' },
        };
      });
    }
  });

  // Gerar o buffer e disparar download no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
