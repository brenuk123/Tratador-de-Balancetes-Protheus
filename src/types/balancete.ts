/**
 * Tipos e interfaces para o processamento de balancetes contábeis do Protheus
 */

export type AccountNature = 'DEVEDORA' | 'CREDORA' | 'NAO_IDENTIFICADA';

export type BalanceStatus = 'REGULAR' | 'INVERTIDO' | 'NAO_IDENTIFICADO' | 'TOTALIZADOR';

export type BalanceSignalConvention = 'AUTO' | 'SUFFIX_DC' | 'NEGATIVE_CREDIT' | 'NEGATIVE_DEBIT';

export interface NatureRule {
  id: string;
  prefix: string;
  description: string;
  nature: AccountNature;
  isCustom?: boolean;
}

export interface AccountRow {
  id: string;
  originalRowNumber: number;
  conta: string;
  descricao: string;
  saldoAnteriorRaw: string | number;
  saldoAnteriorValue: number;
  saldoAnteriorNature?: 'D' | 'C' | 'INDETERMINADO';
  debitoRaw: string | number;
  debitoValue: number;
  creditoRaw: string | number;
  creditoValue: number;
  saldoAtualRaw: string | number;
  saldoAtualValue: number;
  saldoAtualNature: 'D' | 'C' | 'ZERO' | 'INDETERMINADO';
  
  // Classificação contábil
  naturezaEsperada: AccountNature;
  status: BalanceStatus;
  isTotalizer: boolean;
  isSynthetica?: boolean;
  isAnalitica?: boolean;
  manualOverride?: boolean;
  
  // Metadados extraídos via Regex (bancos, agências, c/c, centro de custo)
  extractedMetadata?: {
    codigoLimpo?: string;
    banco?: string;
    agencia?: string;
    contaCorrente?: string;
  };
}

export interface HeaderMapping {
  contaIndex: number;
  descricaoIndex: number;
  saldoAnteriorIndex: number;
  debitoIndex: number;
  creditoIndex: number;
  saldoAtualIndex: number;
  naturezaSaldoIndex?: number;
  headerRowIndex: number;
  rawHeaderNames: string[];
}

export interface BalanceteParseResult {
  sheetName: string;
  allSheets: string[];
  headers: HeaderMapping | null;
  accounts: AccountRow[];
  totalizers: AccountRow[];
  allCleanRows: AccountRow[];
  
  stats: {
    totalOriginalRows: number;
    emptyRowsRemoved: number;
    repeatedHeadersRemoved: number;
    totalAccounts: number;
    regularAccounts: number;
    invertedAccounts: number;
    unidentifiedAccounts: number;
    totalizersCount: number;
  };
  
  detectedConvention: BalanceSignalConvention;
  warnings: string[];
}

export interface BalanceteConfig {
  rules: NatureRule[];
  signalConvention: BalanceSignalConvention;
  invertOnZero: boolean;
  accountOverrides: Record<string, AccountNature>;
}
