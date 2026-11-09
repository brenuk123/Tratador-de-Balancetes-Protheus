/**
 * Motor de processamento e higienização de balancetes contábeis Protheus
 */

import type {
  AccountNature,
  AccountRow,
  BalanceSignalConvention,
  BalanceStatus,
  HeaderMapping,
  NatureRule,
} from '../types/balancete.ts';

// Regras padrão baseadas no Plano de Contas Referencial Brasileiro (SPED / CFC)
export const DEFAULT_NATURE_RULES: NatureRule[] = [
  { id: '1', prefix: '1', description: 'Ativo (Circulante e Não Circulante)', nature: 'DEVEDORA' },
  { id: '2', prefix: '2', description: 'Passivo (Circulante e Não Circulante)', nature: 'CREDORA' },
  { id: '3', prefix: '3', description: 'Patrimônio Líquido', nature: 'CREDORA' },
  { id: '4', prefix: '4', description: 'Custos e Despesas Operacionais', nature: 'DEVEDORA' },
  { id: '5', prefix: '5', description: 'Receitas Operacionais e Brutas', nature: 'CREDORA' },
  { id: '6', prefix: '6', description: 'Despesas Gerais e Administrativas', nature: 'DEVEDORA' },
  { id: '7', prefix: '7', description: 'Receitas Financeiras e Outras Receitas', nature: 'CREDORA' },
  { id: '8', prefix: '8', description: 'Apuração do Resultado do Exercício', nature: 'CREDORA' },
  { id: '9', prefix: '9', description: 'Contas de Compensação', nature: 'DEVEDORA' },
];

/**
 * Normaliza strings para comparação (remove acentos, espaços extras, lowercase)
 */
export function normalizeString(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Verifica se uma linha do Excel é completamente vazia
 */
export function isRowEmpty(rowValues: any[]): boolean {
  if (!rowValues || rowValues.length === 0) return true;
  return rowValues.every(val => {
    if (val === null || val === undefined) return true;
    const str = String(val).trim();
    return str.length === 0;
  });
}

/**
 * Identifica se uma linha é o cabeçalho do balancete
 */
export function isHeaderRow(rowValues: any[]): { isHeader: boolean; mapping: HeaderMapping | null } {
  if (!rowValues || rowValues.length < 4) return { isHeader: false, mapping: null };

  const normalizedCells = rowValues.map(v => normalizeString(v));
  
  let contaIndex = -1;
  let descricaoIndex = -1;
  let saldoAnteriorIndex = -1;
  let debitoIndex = -1;
  let creditoIndex = -1;
  let saldoAtualIndex = -1;
  let naturezaSaldoIndex = -1;

  for (let i = 0; i < normalizedCells.length; i++) {
    const cell = normalizedCells[i];
    if (!cell) continue;

    // Coluna Conta
    if (contaIndex === -1 && (cell === 'conta' || cell === 'codigo' || cell === 'cod conta' || cell === 'classificacao' || cell.startsWith('conta cont'))) {
      contaIndex = i;
      continue;
    }

    // Coluna Descrição
    if (descricaoIndex === -1 && (cell.includes('descri') || cell.includes('titulo') || cell === 'nome da conta' || cell === 'denominacao')) {
      descricaoIndex = i;
      continue;
    }

    // Coluna Saldo Anterior
    if (saldoAnteriorIndex === -1 && (
      (cell.includes('saldo') && (cell.includes('ant') || cell.includes('anterior'))) ||
      cell === 'sld ant' || cell === 'sld. ant' || cell === 'saldo inicial'
    )) {
      saldoAnteriorIndex = i;
      continue;
    }

    // Coluna Débito
    if (debitoIndex === -1 && (
      cell === 'debito' || cell === 'debitos' || cell === 'mov. debito' || cell === 'mov debito' || cell === 'vlr debito' || cell === 'movimento a debito'
    )) {
      debitoIndex = i;
      continue;
    }

    // Coluna Crédito
    if (creditoIndex === -1 && (
      cell === 'credito' || cell === 'creditos' || cell === 'mov. credito' || cell === 'mov credito' || cell === 'vlr credito' || cell === 'movimento a credito'
    )) {
      creditoIndex = i;
      continue;
    }

    // Coluna Saldo Atual / Final
    if (saldoAtualIndex === -1 && (
      (cell.includes('saldo') && (cell.includes('atual') || cell.includes('final') || cell.includes('periodo'))) ||
      cell === 'sld atual' || cell === 'sld. atual' || cell === 'saldo do periodo'
    )) {
      saldoAtualIndex = i;
      continue;
    }

    // Coluna adicional indicadora de D/C
    if (naturezaSaldoIndex === -1 && (cell === 'd/c' || cell === 'nat' || cell === 'natureza' || cell === 'd / c' || cell === 'situacao')) {
      naturezaSaldoIndex = i;
      continue;
    }
  }

  // Se encontrou as colunas chave (pelo menos Conta, Descrição, Saldo Anterior/Atual e Débito/Crédito)
  const matchesCount = [
    contaIndex !== -1,
    descricaoIndex !== -1,
    saldoAnteriorIndex !== -1,
    debitoIndex !== -1,
    creditoIndex !== -1,
    saldoAtualIndex !== -1,
  ].filter(Boolean).length;

  // No balancete Protheus clássico, Conta e Descrição com pelo menos 2 saldos/movimentos caracterizam o cabeçalho
  if (matchesCount >= 4 && (contaIndex !== -1 || descricaoIndex !== -1)) {
    // Se não encontrou explicitamente contaIndex ou descricaoIndex, atribui posições canônicas
    if (contaIndex === -1) contaIndex = 0;
    if (descricaoIndex === -1) descricaoIndex = 1;
    if (saldoAnteriorIndex === -1) saldoAnteriorIndex = 2;
    if (debitoIndex === -1) debitoIndex = 3;
    if (creditoIndex === -1) creditoIndex = 4;
    if (saldoAtualIndex === -1) saldoAtualIndex = 5;

    return {
      isHeader: true,
      mapping: {
        contaIndex,
        descricaoIndex,
        saldoAnteriorIndex,
        debitoIndex,
        creditoIndex,
        saldoAtualIndex,
        naturezaSaldoIndex: naturezaSaldoIndex !== -1 ? naturezaSaldoIndex : undefined,
        headerRowIndex: 0,
        rawHeaderNames: rowValues.map(v => String(v ?? '')),
      },
    };
  }

  return { isHeader: false, mapping: null };
}

/**
 * Verifica se a linha é um totalizador ou resumo contábil final do Protheus
 */
export function isTotalizerRow(contaCell: any, descCell: any): boolean {
  const normConta = normalizeString(contaCell);
  const normDesc = normalizeString(descCell);
  const combined = `${normConta} ${normDesc}`;

  const patterns = [
    /total\s+do\s+periodo/i,
    /total\s+periodo/i,
    /totais\s+do\s+periodo/i,
    /total\s+geral/i,
    /totais\s+gerais/i,
    /total\s+do\s+balancete/i,
    /resumo\s+do\s+periodo/i,
    /resumo\s+do\s+balancete/i,
    /resumo\s+geral/i,
    /resumo/i,
    /^totais/i,
    /^total$/i,
    /totalizador/i,
  ];

  return patterns.some(p => p.test(combined));
}

/**
 * Limpa e extrai o valor numérico contábil de células de texto ou números do Excel
 */
export function parseAccountingValue(
  cellValue: any,
  adjacentNatureCell?: any,
  convention: BalanceSignalConvention = 'AUTO'
): { value: number; nature: 'D' | 'C' | 'ZERO' | 'INDETERMINADO'; raw: string | number } {
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return { value: 0, nature: 'ZERO', raw: '' };
  }

  // Se já for número
  if (typeof cellValue === 'number') {
    if (cellValue === 0) return { value: 0, nature: 'ZERO', raw: cellValue };

    let nature: 'D' | 'C' | 'ZERO' | 'INDETERMINADO' = 'INDETERMINADO';

    // Verificar se há uma célula adjacente com D/C
    if (adjacentNatureCell) {
      const adjStr = normalizeString(adjacentNatureCell).toUpperCase();
      if (adjStr === 'D' || adjStr.startsWith('DEB')) nature = 'D';
      else if (adjStr === 'C' || adjStr.startsWith('CRED')) nature = 'C';
    }

    if (nature === 'INDETERMINADO') {
      if (convention === 'NEGATIVE_CREDIT') {
        nature = cellValue < 0 ? 'C' : 'D';
      } else if (convention === 'NEGATIVE_DEBIT') {
        nature = cellValue < 0 ? 'D' : 'C';
      } else {
        // Padrão contábil no Excel: positivo devedor, negativo credor
        nature = cellValue < 0 ? 'C' : 'D';
      }
    }

    return {
      value: cellValue,
      nature,
      raw: cellValue,
    };
  }

  const str = String(cellValue).trim();
  if (str === '') return { value: 0, nature: 'ZERO', raw: str };

  // Verifica sufixos ou prefixos 'D' ou 'C' no Protheus (ex: "1.250,50 D", "3.400,00 C", "1500D", "(C)")
  let explicitNature: 'D' | 'C' | null = null;
  const upper = str.toUpperCase();

  // Testar regex no texto
  if (/\b[0-9.,\s]+D\b|\(D\)/i.test(upper) || upper.endsWith(' D') || upper.endsWith('D')) {
    explicitNature = 'D';
  } else if (/\b[0-9.,\s]+C\b|\(C\)/i.test(upper) || upper.endsWith(' C') || upper.endsWith('C')) {
    explicitNature = 'C';
  }

  // Se tem célula adjacente
  if (!explicitNature && adjacentNatureCell) {
    const adj = normalizeString(adjacentNatureCell).toUpperCase();
    if (adj === 'D' || adj.startsWith('DEB')) explicitNature = 'D';
    else if (adj === 'C' || adj.startsWith('CRED')) explicitNature = 'C';
  }

  // Verifica se é valor entre parênteses: (1.500,00) que significa negativo/crédito
  const isParenthesized = /^\s*\(.*\)\s*$/.test(str);

  // Extrair somente dígitos, ponto, vírgula e sinal
  let cleanNumberStr = str
    .replace(/[^\d.,\-()]/g, '')
    .replace(/[()]/g, '')
    .trim();

  // Converter formato brasileiro 1.234.567,89 para padrão JS float 1234567.89
  let numericValue = 0;
  if (cleanNumberStr.includes(',') && cleanNumberStr.includes('.')) {
    // Ex: 1.250,50
    cleanNumberStr = cleanNumberStr.replace(/\./g, '').replace(',', '.');
  } else if (cleanNumberStr.includes(',')) {
    // Ex: 1250,50
    cleanNumberStr = cleanNumberStr.replace(',', '.');
  }

  numericValue = parseFloat(cleanNumberStr);
  if (isNaN(numericValue)) {
    return { value: 0, nature: 'ZERO', raw: str };
  }

  if (isParenthesized && numericValue > 0) {
    numericValue = -numericValue;
  }

  if (numericValue === 0) {
    return { value: 0, nature: 'ZERO', raw: str };
  }

  let finalNature: 'D' | 'C' | 'ZERO' | 'INDETERMINADO' = 'INDETERMINADO';

  if (explicitNature) {
    finalNature = explicitNature;
  } else if (convention === 'NEGATIVE_CREDIT') {
    finalNature = numericValue < 0 ? 'C' : 'D';
  } else if (convention === 'NEGATIVE_DEBIT') {
    finalNature = numericValue < 0 ? 'D' : 'C';
  } else {
    // Se não há convenção forçada e não há sufixo D/C, usa convenção de sinal
    finalNature = numericValue < 0 ? 'C' : 'D';
  }

  return {
    value: numericValue,
    nature: finalNature,
    raw: str,
  };
}

/**
 * Determina a natureza esperada de uma conta baseando-se no código da conta e nas regras configuradas
 */
export function determineAccountNature(
  conta: string,
  rules: NatureRule[] = DEFAULT_NATURE_RULES,
  overrides?: Record<string, AccountNature>
): AccountNature {
  if (!conta) return 'NAO_IDENTIFICADA';

  // Verificar se há override individual da conta
  const trimmedConta = conta.trim();
  if (overrides && overrides[trimmedConta]) {
    return overrides[trimmedConta];
  }

  // Normalizar código da conta removendo caracteres não alfanuméricos para análise de prefixo
  // Ex: "1.1.01.001" -> prefixo "1" ou "1.1"
  const cleanCode = trimmedConta.replace(/[^0-9a-zA-Z]/g, '');
  if (!cleanCode) return 'NAO_IDENTIFICADA';

  // Ordenar regras das mais específicas (maior prefixo) para as mais gerais (menor prefixo)
  const sortedRules = [...rules].sort((a, b) => b.prefix.length - a.prefix.length);

  for (const rule of sortedRules) {
    const cleanPrefix = rule.prefix.replace(/[^0-9a-zA-Z]/g, '');
    if (cleanCode.startsWith(cleanPrefix) || trimmedConta.startsWith(rule.prefix)) {
      return rule.nature;
    }
  }

  return 'NAO_IDENTIFICADA';
}

/**
 * Extrai dados bancários e transacionais da conta e descrição via Regex
 */
export function extractAccountMetadata(conta: string, descricao: string) {
  const fullText = `${conta} ${descricao}`;
  
  // Banco (ex: Banco do Brasil, Bradesco, Itaú, Santander, Caixa, Sicoob, Sicredi, Safra, etc.)
  const bancoMatch = fullText.match(/\b(itau|bradesco|santander|banco do brasil|bb|caixa|cef|sicoob|sicredi|safra|btg|inter|nubank|banrisul)\b/i);
  
  // Agência (ex: Ag 1234, Agência 1234-5, Ag.: 1234)
  const agenciaMatch = fullText.match(/(?:ag[eê]ncia|ag\.?|ag:)\s*([0-9]{2,5}(?:-[0-9xX])?)/i);
  
  // Conta Corrente (ex: C/C 12345-6, Conta 98765-4, CC: 12345)
  const ccMatch = fullText.match(/(?:c\/c|conta\s*corrente|conta|cc\.?|c\/c:)\s*([0-9]{4,12}(?:-[0-9xX])?)/i);

  // Código contábil estruturado limpo (ex: 1.1.01.02.0001)
  const codeMatch = conta.match(/[0-9]+(?:\.[0-9]+)+/);

  return {
    codigoLimpo: codeMatch ? codeMatch[0] : conta.trim(),
    banco: bancoMatch ? bancoMatch[0].toUpperCase() : undefined,
    agencia: agenciaMatch ? agenciaMatch[1] : undefined,
    contaCorrente: ccMatch ? ccMatch[1] : undefined,
  };
}

/**
 * Avalia o status da conta (REGULAR, INVERTIDO, NAO_IDENTIFICADO)
 */
/**
 * Determina se uma conta contábil é Sintética (conta de agrupamento/grau superior, que consolida subcontas)
 * ou Analítica (conta folha que recebe lançamentos).
 */
export function isSyntheticAccount(conta: string, allContas: string[]): boolean {
  if (!conta) return false;
  const trimmed = conta.trim();
  if (!trimmed) return false;

  // 1. Contas de primeiro nível ou muito curtas (ex: "1", "1.1", "2", "2.1") são sempre sintéticas
  if (trimmed.length <= 1 || trimmed === '1.1' || trimmed === '2.1' || trimmed === '3.1' || trimmed === '4.1' || trimmed === '5.1') {
    return true;
  }

  // 2. Verificação com pontos: se outra conta do relatório começa com `trimmed + '.'`
  const dotPrefix = trimmed + '.';
  const hasDotChildren = allContas.some(other => {
    const o = other.trim();
    return o.startsWith(dotPrefix) && o !== trimmed;
  });
  if (hasDotChildren) {
    return true;
  }

  // 3. Verificação por prefixo de dígitos (padrão Protheus: ex: 1.1.0.1 tem dígitos 1101, pai de 1.1.0.10.1 com dígitos 110101)
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length > 0) {
    const hasDigitChildren = allContas.some(other => {
      const otherDigits = other.trim().replace(/\D/g, '');
      return otherDigits.startsWith(digits) && otherDigits.length > digits.length;
    });
    if (hasDigitChildren) {
      return true;
    }
  }

  return false;
}

export function isAnalyticalAccount(conta: string, allContas: string[]): boolean {
  return !isSyntheticAccount(conta, allContas);
}

export function evaluateAccountStatus(
  naturezaEsperada: AccountNature,
  saldoAtualNature: 'D' | 'C' | 'ZERO' | 'INDETERMINADO'
): BalanceStatus {
  if (naturezaEsperada === 'NAO_IDENTIFICADA') {
    return 'NAO_IDENTIFICADO';
  }

  if (saldoAtualNature === 'ZERO' || saldoAtualNature === 'INDETERMINADO') {
    return 'REGULAR';
  }

  // Contas de natureza devedora com saldo credor -> INVERTIDO
  if (naturezaEsperada === 'DEVEDORA' && saldoAtualNature === 'C') {
    return 'INVERTIDO';
  }

  // Contas de natureza credora com saldo devedor -> INVERTIDO
  if (naturezaEsperada === 'CREDORA' && saldoAtualNature === 'D') {
    return 'INVERTIDO';
  }

  return 'REGULAR';
}

/**
 * Processa uma matriz bruta de linhas extraídas da planilha do Protheus
 */
export function processBalanceteRawRows(
  rows: any[][],
  rules: NatureRule[] = DEFAULT_NATURE_RULES,
  convention: BalanceSignalConvention = 'AUTO',
  overrides?: Record<string, AccountNature>
): {
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
} {
  const warnings: string[] = [];
  const accounts: AccountRow[] = [];
  const totalizers: AccountRow[] = [];

  let primaryHeader: HeaderMapping | null = null;
  let emptyRowsRemoved = 0;
  let repeatedHeadersRemoved = 0;
  let foundDCInFile = false;
  let foundNegativeInFile = false;

  // Primeiro passo: localizar o cabeçalho primário
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (isRowEmpty(row)) {
      emptyRowsRemoved++;
      continue;
    }

    const { isHeader, mapping } = isHeaderRow(row);
    if (isHeader && mapping) {
      primaryHeader = {
        ...mapping,
        headerRowIndex: r,
      };
      break;
    }
  }

  if (!primaryHeader) {
    warnings.push('Não foi possível identificar automaticamente as colunas de cabeçalho do balancete. O arquivo pode não ser um balancete do Protheus ou possui estrutura atípica.');
    return {
      headers: null,
      accounts: [],
      totalizers: [],
      allCleanRows: [],
      stats: {
        totalOriginalRows: rows.length,
        emptyRowsRemoved,
        repeatedHeadersRemoved: 0,
        totalAccounts: 0,
        regularAccounts: 0,
        invertedAccounts: 0,
        unidentifiedAccounts: 0,
        totalizersCount: 0,
      },
      detectedConvention: convention,
      warnings,
    };
  }

  // Segundo passo: iterar a partir da linha imediatamente posterior ao primeiro cabeçalho
  const startRow = primaryHeader.headerRowIndex + 1;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];

    // Verificar se é linha vazia
    if (isRowEmpty(row)) {
      emptyRowsRemoved++;
      continue;
    }

    // Verificar se é cabeçalho repetido
    const { isHeader } = isHeaderRow(row);
    if (isHeader) {
      repeatedHeadersRemoved++;
      continue;
    }

    // Extrair valores das colunas
    const contaCell = row[primaryHeader.contaIndex] ?? '';
    const descCell = row[primaryHeader.descricaoIndex] ?? '';
    const sldAntCell = row[primaryHeader.saldoAnteriorIndex] ?? '';
    const debCell = row[primaryHeader.debitoIndex] ?? '';
    const credCell = row[primaryHeader.creditoIndex] ?? '';
    const sldAtuCell = row[primaryHeader.saldoAtualIndex] ?? '';
    const natCell = primaryHeader.naturezaSaldoIndex !== undefined ? row[primaryHeader.naturezaSaldoIndex] : undefined;

    // Verificar se é uma linha de totalizador
    const isTotalizer = isTotalizerRow(contaCell, descCell);

    // Parse de saldos
    const parsedSldAnt = parseAccountingValue(sldAntCell, natCell, convention);
    const parsedDeb = parseAccountingValue(debCell, undefined, convention);
    const parsedCred = parseAccountingValue(credCell, undefined, convention);
    const parsedSldAtu = parseAccountingValue(sldAtuCell, natCell, convention);

    if (parsedSldAtu.nature === 'D' || parsedSldAtu.nature === 'C') {
      foundDCInFile = true;
    }
    if (typeof parsedSldAtu.raw === 'number' && parsedSldAtu.raw < 0) {
      foundNegativeInFile = true;
    }

    const contaStr = String(contaCell).trim();
    const descStr = String(descCell).trim();

    // Se nem conta nem descrição existem e não há valores contábeis, é ruído
    if (!contaStr && !descStr && parsedSldAtu.value === 0 && parsedDeb.value === 0 && parsedCred.value === 0) {
      emptyRowsRemoved++;
      continue;
    }

    // Extrair metadados e natureza esperada
    const metadata = extractAccountMetadata(contaStr, descStr);
    const naturezaEsperada = isTotalizer ? 'NAO_IDENTIFICADA' : determineAccountNature(contaStr, rules, overrides);
    const status = isTotalizer ? 'TOTALIZADOR' : evaluateAccountStatus(naturezaEsperada, parsedSldAtu.nature);

    const accountRow: AccountRow = {
      id: `row-${r}-${contaStr || 'sem-codigo'}`,
      originalRowNumber: r + 1,
      conta: contaStr,
      descricao: descStr,
      saldoAnteriorRaw: sldAntCell,
      saldoAnteriorValue: parsedSldAnt.value,
      saldoAnteriorNature: parsedSldAnt.nature === 'ZERO' ? undefined : (parsedSldAnt.nature as 'D' | 'C' | 'INDETERMINADO'),
      debitoRaw: debCell,
      debitoValue: parsedDeb.value,
      creditoRaw: credCell,
      creditoValue: parsedCred.value,
      saldoAtualRaw: sldAtuCell,
      saldoAtualValue: parsedSldAtu.value,
      saldoAtualNature: parsedSldAtu.nature,
      naturezaEsperada,
      status,
      isTotalizer,
      extractedMetadata: metadata,
      manualOverride: overrides && overrides[contaStr] ? true : false,
    };

    if (isTotalizer) {
      totalizers.push(accountRow);
    } else {
      accounts.push(accountRow);
    }
  }

  // Classificar contas analíticas vs sintéticas na hierarquia do plano de contas
  const allAccountContas = accounts.map(a => a.conta);
  accounts.forEach(account => {
    const isAnalitica = isAnalyticalAccount(account.conta, allAccountContas);
    account.isAnalitica = isAnalitica;
    account.isSynthetica = !isAnalitica;
  });

  // Ordem final de apresentação: todas as contas preservando a ordem original + totalizadores preservados no final
  const allCleanRows = [...accounts, ...totalizers];

  // Métricas
  const totalAccounts = accounts.length;
  const regularAccounts = accounts.filter(a => a.status === 'REGULAR').length;
  const invertedAccounts = accounts.filter(a => a.status === 'INVERTIDO').length;
  const unidentifiedAccounts = accounts.filter(a => a.status === 'NAO_IDENTIFICADO').length;

  let detectedConvention = convention;
  if (convention === 'AUTO') {
    if (foundDCInFile) {
      detectedConvention = 'SUFFIX_DC';
    } else if (foundNegativeInFile) {
      detectedConvention = 'NEGATIVE_CREDIT';
    } else {
      detectedConvention = 'SUFFIX_DC';
    }
  }

  return {
    headers: primaryHeader,
    accounts,
    totalizers,
    allCleanRows,
    stats: {
      totalOriginalRows: rows.length,
      emptyRowsRemoved,
      repeatedHeadersRemoved,
      totalAccounts,
      regularAccounts,
      invertedAccounts,
      unidentifiedAccounts,
      totalizersCount: totalizers.length,
    },
    detectedConvention,
    warnings,
  };
}
