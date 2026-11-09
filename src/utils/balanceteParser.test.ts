import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRowEmpty,
  isHeaderRow,
  isTotalizerRow,
  parseAccountingValue,
  determineAccountNature,
  evaluateAccountStatus,
  extractAccountMetadata,
  processBalanceteRawRows,
  DEFAULT_NATURE_RULES,
} from './balanceteParser.ts';

test('isRowEmpty identifies empty or whitespace rows', () => {
  assert.equal(isRowEmpty([]), true);
  assert.equal(isRowEmpty([null, '', undefined, '   ']), true);
  assert.equal(isRowEmpty([null, '1.1.01', '']), false);
});

test('isHeaderRow identifies standard Protheus headers', () => {
  const headerRow = ['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual'];
  const result = isHeaderRow(headerRow);
  assert.equal(result.isHeader, true);
  assert.equal(result.mapping?.contaIndex, 0);
  assert.equal(result.mapping?.descricaoIndex, 1);
  assert.equal(result.mapping?.saldoAnteriorIndex, 2);
  assert.equal(result.mapping?.debitoIndex, 3);
  assert.equal(result.mapping?.creditoIndex, 4);
  assert.equal(result.mapping?.saldoAtualIndex, 5);

  const dataRow = ['1.1.01.001', 'CAIXA GERAL', '1.000,00 D', '500,00', '200,00', '1.300,00 D'];
  assert.equal(isHeaderRow(dataRow).isHeader, false);
});

test('isTotalizerRow detects totalizers correctly', () => {
  assert.equal(isTotalizerRow('', 'TOTAL DO PERÍODO'), true);
  assert.equal(isTotalizerRow('TOTAL', 'TOTAIS GERAIS'), true);
  assert.equal(isTotalizerRow('', 'RESUMO DO BALANCETE'), true);
  assert.equal(isTotalizerRow('1.1.01.001', 'BANCO DO BRASIL S/A'), false);
});

test('parseAccountingValue parses Brazilian formatted numbers and D/C indicators', () => {
  // Com sufixo D
  const val1 = parseAccountingValue('1.250,50 D');
  assert.equal(val1.value, 1250.5);
  assert.equal(val1.nature, 'D');

  // Com sufixo C
  const val2 = parseAccountingValue('3.400,75 C');
  assert.equal(val2.value, 3400.75);
  assert.equal(val2.nature, 'C');

  // Número puro no Excel
  const val3 = parseAccountingValue(500.25, undefined, 'NEGATIVE_CREDIT');
  assert.equal(val3.value, 500.25);
  assert.equal(val3.nature, 'D');

  // Negativo no Excel
  const val4 = parseAccountingValue(-800, undefined, 'NEGATIVE_CREDIT');
  assert.equal(val4.value, -800);
  assert.equal(val4.nature, 'C');

  // Parênteses (1.000,00)
  const val5 = parseAccountingValue('(1.000,00)');
  assert.equal(val5.value, -1000);
  assert.equal(val5.nature, 'C');

  // Zero
  const val6 = parseAccountingValue('0,00');
  assert.equal(val6.value, 0);
  assert.equal(val6.nature, 'ZERO');
});

test('determineAccountNature classifies accounts according to Brazilian standard rules', () => {
  // Ativo (1) -> DEVEDORA
  assert.equal(determineAccountNature('1.1.01.001', DEFAULT_NATURE_RULES), 'DEVEDORA');
  assert.equal(determineAccountNature('10101001', DEFAULT_NATURE_RULES), 'DEVEDORA');

  // Passivo (2) -> CREDORA
  assert.equal(determineAccountNature('2.1.01.001', DEFAULT_NATURE_RULES), 'CREDORA');

  // Patrimônio Líquido (3) -> CREDORA
  assert.equal(determineAccountNature('3.1.01.001', DEFAULT_NATURE_RULES), 'CREDORA');

  // Despesas (4) -> DEVEDORA
  assert.equal(determineAccountNature('4.1.01.001', DEFAULT_NATURE_RULES), 'DEVEDORA');

  // Receitas (5) -> CREDORA
  assert.equal(determineAccountNature('5.1.01.001', DEFAULT_NATURE_RULES), 'CREDORA');

  // Código desconhecido -> NAO_IDENTIFICADA
  assert.equal(determineAccountNature('X.99.001', DEFAULT_NATURE_RULES), 'NAO_IDENTIFICADA');
});

test('evaluateAccountStatus correctly flags inverted accounts', () => {
  // Ativo com saldo devedor -> REGULAR
  assert.equal(evaluateAccountStatus('DEVEDORA', 'D'), 'REGULAR');

  // Ativo com saldo credor -> INVERTIDO!
  assert.equal(evaluateAccountStatus('DEVEDORA', 'C'), 'INVERTIDO');

  // Passivo com saldo credor -> REGULAR
  assert.equal(evaluateAccountStatus('CREDORA', 'C'), 'REGULAR');

  // Passivo com saldo devedor -> INVERTIDO!
  assert.equal(evaluateAccountStatus('CREDORA', 'D'), 'INVERTIDO');

  // Saldo zero -> REGULAR
  assert.equal(evaluateAccountStatus('DEVEDORA', 'ZERO'), 'REGULAR');
  assert.equal(evaluateAccountStatus('CREDORA', 'ZERO'), 'REGULAR');

  // Natureza não identificada -> NAO_IDENTIFICADO (não marca como invertido automaticamente!)
  assert.equal(evaluateAccountStatus('NAO_IDENTIFICADA', 'D'), 'NAO_IDENTIFICADO');
  assert.equal(evaluateAccountStatus('NAO_IDENTIFICADA', 'C'), 'NAO_IDENTIFICADO');
});

test('extractAccountMetadata extracts bank, agency and account number via Regex', () => {
  const meta = extractAccountMetadata('1.1.1.02.0001', 'BANCO DO BRASIL S/A AG 1234-5 C/C 98765-4');
  assert.equal(meta.banco, 'BANCO DO BRASIL');
  assert.equal(meta.agencia, '1234-5');
  assert.equal(meta.contaCorrente, '98765-4');
  assert.equal(meta.codigoLimpo, '1.1.1.02.0001');
});

test('processBalanceteRawRows filters empty rows, removes repeated headers, and preserves totals', () => {
  const rawRows: any[][] = [
    // 6 linhas vazias iniciais típicas do Protheus
    [],
    ['', '', ''],
    [],
    [],
    [],
    [],
    // Linha 7: Cabeçalho
    ['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual'],
    // Contas normais
    ['1.1.01.0001', 'CAIXA GERAL', '1.000,00 D', '500,00', '200,00', '1.300,00 D'], // Regular
    ['1.1.01.0002', 'BANCO CONTA ESTOUROU', '500,00 D', '0,00', '1.000,00', '500,00 C'], // Invertido!
    // Linhas vazias + cabeçalho repetido da página seguinte do Protheus
    [],
    [],
    [],
    ['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual'],
    // Mais contas
    ['2.1.01.0001', 'FORNECEDORES NACIONAIS', '10.000,00 C', '2.000,00', '5.000,00', '13.000,00 C'], // Regular
    ['2.1.01.0002', 'FORNECEDOR ADIANTAMENTO INVERTIDO', '2.000,00 C', '5.000,00', '0,00', '3.000,00 D'], // Invertido!
    // Totalizadores finais
    ['', 'TOTAL DO PERÍODO', '11.500,00', '7.500,00', '6.200,00', '14.800,00'],
    ['', 'TOTAL GERAL', '11.500,00', '7.500,00', '6.200,00', '14.800,00'],
  ];

  const result = processBalanceteRawRows(rawRows);

  assert.equal(result.headers !== null, true);
  assert.equal(result.accounts.length, 4);
  assert.equal(result.totalizers.length, 2);
  assert.equal(result.allCleanRows.length, 6);
  assert.equal(result.stats.emptyRowsRemoved > 0, true);
  assert.equal(result.stats.repeatedHeadersRemoved, 1);
  assert.equal(result.stats.invertedAccounts, 2); // 1 do ativo credor, 1 do passivo devedor
  assert.equal(result.stats.regularAccounts, 2);
  assert.equal(result.accounts[1].status, 'INVERTIDO');
  assert.equal(result.accounts[3].status, 'INVERTIDO');
});

test('selectBestBalanceteSheet ignores parameters sheet and selects balancete sheet', async () => {
  const { selectBestBalanceteSheet } = await import('./excelReader.ts');
  const ExcelJS = (await import('exceljs')).default;

  const wb = new ExcelJS.Workbook();
  const wsParams = wb.addWorksheet('Parâmetros de Impressão');
  wsParams.addRow(['TOTVS - CTBR040']);
  wsParams.addRow(['Data Emissão:', '19/10/2026']);
  wsParams.addRow(['Período:', '01/01/2026 a 31/01/2026']);

  const wsBalancete = wb.addWorksheet('Balancete Mod 1');
  wsBalancete.addRow(['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual']);
  wsBalancete.addRow(['1.1.01.001', 'CAIXA GERAL', '1.000,00 D', '0,00', '0,00', '1.000,00 D']);

  const selection = selectBestBalanceteSheet(wb);
  assert.equal(selection.sheetName, 'Balancete Mod 1');
  assert.equal(selection.wasAutoSelected, true);
});

test('isAnalyticalAccount correctly detects analytical leaf accounts vs synthetic accounts', async () => {
  const { isAnalyticalAccount } = await import('./balanceteParser.ts');
  const contas = [
    '1',
    '1.1',
    '1.1.01',
    '1.1.01.0001',
    '1.1.01.0002',
    '1.1.02',
    '1.1.02.0001',
  ];

  assert.equal(isAnalyticalAccount('1', contas), false);
  assert.equal(isAnalyticalAccount('1.1', contas), false);
  assert.equal(isAnalyticalAccount('1.1.01', contas), false);
  assert.equal(isAnalyticalAccount('1.1.01.0001', contas), true);
  assert.equal(isAnalyticalAccount('1.1.01.0002', contas), true);
  assert.equal(isAnalyticalAccount('1.1.02', contas), false);
  assert.equal(isAnalyticalAccount('1.1.02.0001', contas), true);

  // Validação com o plano real do Protheus fornecido na imagem do usuário
  const userProtheusContas = [
    '1',
    '1.1',
    '1.1.0.1',
    '1.1.0.10.1',
    '1.1.0.10.100.001',
    '1.1.0.10.2',
    '1.1.0.10.200.007',
    '1.1.0.2',
    '1.1.0.20.1',
    '1.1.0.20.10',
    '1.1.0.20.100.005',
    '1.1.0.20.100.012',
  ];

  const { isSyntheticAccount } = await import('./balanceteParser.ts');
  // Sintéticas (grupos) devem ser true
  assert.equal(isSyntheticAccount('1', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.1', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.10.1', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.10.2', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.2', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.20.1', userProtheusContas), true);
  assert.equal(isSyntheticAccount('1.1.0.20.10', userProtheusContas), true);

  // Analíticas (folha) devem ser false para sintética e true para analítica
  assert.equal(isSyntheticAccount('1.1.0.10.100.001', userProtheusContas), false);
  assert.equal(isSyntheticAccount('1.1.0.10.200.007', userProtheusContas), false);
  assert.equal(isSyntheticAccount('1.1.0.20.100.005', userProtheusContas), false);
  assert.equal(isSyntheticAccount('1.1.0.20.100.012', userProtheusContas), false);
});
