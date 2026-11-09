/**
 * Leitor de arquivos Excel (.xlsx / .xls) usando ExcelJS
 */

import ExcelJS from 'exceljs';
import type {
  BalanceteConfig,
  BalanceteParseResult,
} from '../types/balancete.ts';
import { isHeaderRow, processBalanceteRawRows } from './balanceteParser.ts';

export interface ReadWorkbookResult {
  sheetNames: string[];
  workbook: ExcelJS.Workbook;
}

/**
 * Lê uma pasta de trabalho Excel a partir de um File ou ArrayBuffer
 */
export async function loadExcelWorkbook(fileOrBuffer: File | ArrayBuffer): Promise<ReadWorkbookResult> {
  const workbook = new ExcelJS.Workbook();
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  await workbook.xlsx.load(buffer);

  const sheetNames: string[] = [];
  workbook.eachSheet(sheet => {
    sheetNames.push(sheet.name);
  });

  return { sheetNames, workbook };
}

/**
 * Extrai a matriz 2D bruta de uma planilha do Excel
 */
export function extractRawRowsFromSheet(sheet: ExcelJS.Worksheet): any[][] {
  const rows: any[][] = [];
  const maxRow = sheet.lastRow ? sheet.lastRow.number : (sheet.rowCount || 0);

  for (let r = 1; r <= maxRow; r++) {
    const row = sheet.getRow(r);
    const rowValues: any[] = [];
    
    // As colunas no ExcelJS começam em 1
    const colCount = Math.max(row.actualCellCount || 0, row.cellCount || 0, 8);
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      let value = cell.value;

      // Tratar objetos de fórmula ou hiperlink
      if (value && typeof value === 'object') {
        if ('result' in value) {
          value = (value as any).result;
        } else if ('text' in value) {
          value = (value as any).text;
        } else if ('richText' in value) {
          value = (value as any).richText.map((rt: any) => rt.text).join('');
        }
      }

      // Tratar números formatados com sufixo D/C
      if (cell.numFmt && typeof value === 'number') {
        const fmt = cell.numFmt.toLowerCase();
        if (fmt.includes('\"d\"') || fmt.includes('"d"')) {
          value = `${value} D`;
        } else if (fmt.includes('\"c\"') || fmt.includes('"c"')) {
          value = `${value} C`;
        }
      }

      rowValues.push(value);
    }

    rows.push(rowValues);
  }

  return rows;
}

/**
 * Identifica a planilha mais adequada para o balancete.
 * O Protheus frequentemente exporta a 1ª planilha apenas com parâmetros de impressão
 * e a 2ª planilha com o balancete de fato.
 */
export function selectBestBalanceteSheet(
  workbook: ExcelJS.Workbook,
  preferredSheetName?: string
): { sheetName: string; sheetNames: string[]; wasAutoSelected: boolean } {
  const sheetNames: string[] = [];
  workbook.eachSheet((sheet) => sheetNames.push(sheet.name));

  if (sheetNames.length === 0) {
    return { sheetName: '', sheetNames: [], wasAutoSelected: false };
  }

  // Se o usuário selecionou uma planilha explicitamente e ela existe
  if (preferredSheetName && sheetNames.includes(preferredSheetName)) {
    return { sheetName: preferredSheetName, sheetNames, wasAutoSelected: false };
  }

  // Se há apenas 1 planilha
  if (sheetNames.length === 1) {
    return { sheetName: sheetNames[0], sheetNames, wasAutoSelected: false };
  }

  // Se há 2 ou mais planilhas:
  // Primeiro, inspecionar se alguma planilha possui o cabeçalho do balancete
  let sheetWithBalanceteHeader: string | null = null;
  let secondSheetCandidate: string = sheetNames[1]; // Padrão Protheus: segunda planilha

  for (let i = 0; i < sheetNames.length; i++) {
    const sName = sheetNames[i];
    const ws = workbook.getWorksheet(sName);
    if (!ws) continue;

    // Verificar se as primeiras 30 linhas possuem o cabeçalho de balancete
    const maxScanRow = Math.min(ws.lastRow?.number || ws.rowCount || 0, 35);
    for (let r = 1; r <= maxScanRow; r++) {
      const row = ws.getRow(r);
      const values: any[] = [];
      const colCount = Math.max(row.actualCellCount || 0, 8);
      for (let c = 1; c <= colCount; c++) {
        values.push(row.getCell(c).value);
      }
      const { isHeader } = isHeaderRow(values);
      if (isHeader) {
        sheetWithBalanceteHeader = sName;
        break;
      }
    }

    if (sheetWithBalanceteHeader) {
      break;
    }
  }

  // Se encontrou a planilha com cabeçalho contábil, usa ela
  if (sheetWithBalanceteHeader) {
    return { sheetName: sheetWithBalanceteHeader, sheetNames, wasAutoSelected: true };
  }

  // Caso contrário, no padrão Protheus com 2 ou mais planilhas, foca na segunda planilha
  // ignorando a primeira (que são os parâmetros de impressão)
  return { sheetName: secondSheetCandidate, sheetNames, wasAutoSelected: true };
}

/**
 * Processa a planilha selecionada do balancete
 */
export async function parseBalanceteFromWorkbook(
  workbook: ExcelJS.Workbook,
  selectedSheetName?: string,
  config?: Partial<BalanceteConfig>
): Promise<BalanceteParseResult> {
  const { sheetName: targetSheetName, sheetNames } = selectBestBalanceteSheet(
    workbook,
    selectedSheetName
  );

  const worksheet = workbook.getWorksheet(targetSheetName);

  if (!worksheet) {
    throw new Error(`Planilha "${targetSheetName}" não encontrada no arquivo.`);
  }

  const rawRows = extractRawRowsFromSheet(worksheet);
  const parseOutput = processBalanceteRawRows(
    rawRows,
    config?.rules,
    config?.signalConvention || 'AUTO',
    config?.accountOverrides
  );

  return {
    sheetName: targetSheetName,
    allSheets: sheetNames,
    ...parseOutput,
  };
}
