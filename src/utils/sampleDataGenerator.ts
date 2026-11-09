/**
 * Gerador de balancete exemplo fiel ao formato de exportação do TOTVS Protheus
 * Inclui as duas planilhas típicas do Protheus:
 * 1. Parâmetros de Impressão (deve ser ignorada pelo tratador)
 * 2. Balancete (onde estão as contas e movimentações contábeis)
 */

import ExcelJS from 'exceljs';

export async function createProtheusSampleWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  // 1ª Planilha: Parâmetros de Impressão do Protheus (deve ser ignorada automaticamente)
  const wsParams = wb.addWorksheet('Parâmetros');
  wsParams.addRow(['TOTVS - Linha Protheus', '', 'SIGACTB - Contabilidade Gerencial']);
  wsParams.addRow(['Programa:', 'CTBR040 - Balancete Modelo 1']);
  wsParams.addRow(['Data Emissão:', '19/10/2026 14:00:00']);
  wsParams.addRow(['Empresa / Filial:', '01 / 0101 - MATRIZ']);
  wsParams.addRow(['Período:', '01/01/2026 a 31/01/2026']);
  wsParams.addRow(['Moeda:', '01 - Real']);
  wsParams.addRow(['Conta Inicial / Final:', '1 até 9.9.9.99.9999']);
  wsParams.addRow(['Centro de Custo:', '000000001 até 999999999']);
  wsParams.addRow(['Configuração Livros:', '001']);
  wsParams.addRow(['Quebra de Linhas:', '60 linhas por página']);
  wsParams.addRow([]);
  wsParams.addRow(['AVISO:', 'Esta aba contém apenas os parâmetros da impressão e deve ser ignorada.']);

  // 2ª Planilha: Balancete Contábil
  const ws = wb.addWorksheet('Balancete Mod 1');

  // As primeiras 6 linhas no Protheus vêm vazias ou com cabeçalho de impressão
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);

  // Linha 7: Cabeçalho inicial
  ws.addRow(['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual']);

  // Página 1: Ativo
  const page1Rows = [
    ['1', 'ATIVO TOTAL', '1.050.000,00 D', '420.500,00', '390.200,00', '1.080.300,00 D'],
    ['1.1', 'ATIVO CIRCULANTE', '850.000,00 D', '380.000,00', '350.000,00', '880.000,00 D'],
    ['1.1.1', 'DISPONIBILIDADES', '340.000,00 D', '190.000,00', '165.000,00', '365.000,00 D'],
    ['1.1.1.01.0001', 'CAIXA GERAL DA MATRIZ', '15.200,00 D', '45.000,00', '38.000,00', '22.200,00 D'],
    ['1.1.1.02.0001', 'BANCO DO BRASIL AG 1234-5 C/C 98765-4', '180.500,00 D', '95.000,00', '82.000,00', '193.500,00 D'],
    ['1.1.1.02.0002', 'BANCO ITAU AG 0456 C/C 44521-9', '154.300,00 D', '50.000,00', '40.000,00', '164.300,00 D'],
    ['1.1.1.02.0003', 'BANCO BRADESCO S/A C/C 12093-2', '10.000,00 D', '0,00', '25.000,00', '15.000,00 C'], // INVERTIDO (Conta corrente no cheque especial)
    ['1.1.2', 'CLIENTES E CONTAS A RECEBER', '290.000,00 D', '110.000,00', '105.000,00', '295.000,00 D'],
    ['1.1.2.01.0001', 'CLIENTES NACIONAIS MATRIZ', '220.000,00 D', '90.000,00', '85.000,00', '225.000,00 D'],
    ['1.1.2.01.0002', 'DUPLICATAS A RECEBER SP', '70.000,00 D', '20.000,00', '20.000,00', '70.000,00 D'],
    ['1.1.3', 'ESTOQUES', '220.000,00 D', '80.000,00', '80.000,00', '220.000,00 D'],
    ['1.1.3.01.0001', 'MERCADORIAS PARA REVENDA', '160.000,00 D', '60.000,00', '60.000,00', '160.000,00 D'],
    ['1.1.3.01.0002', 'MATERIAIS DE EMBALAGEM', '60.000,00 D', '20.000,00', '20.000,00', '60.000,00 D'],
    ['1.2', 'ATIVO NAO CIRCULANTE', '200.000,00 D', '40.500,00', '40.200,00', '200.300,00 D'],
    ['1.2.1.01.0001', 'VEICULOS OPERACIONAIS', '120.000,00 D', '30.000,00', '0,00', '150.000,00 D'],
    ['1.2.1.01.0002', 'MAQUINAS E EQUIPAMENTOS', '80.000,00 D', '10.500,00', '40.200,00', '50.300,00 D'],
  ];

  page1Rows.forEach(r => ws.addRow(r));

  // Padrão do Protheus: salto de página com 6 linhas vazias e repetição do cabeçalho
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);

  // Cabeçalho repetido da página 2
  ws.addRow(['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual']);

  // Página 2: Passivo
  const page2Rows = [
    ['2', 'PASSIVO TOTAL', '620.000,00 C', '195.000,00', '215.000,00', '640.000,00 C'],
    ['2.1', 'PASSIVO CIRCULANTE', '450.000,00 C', '170.000,00', '180.000,00', '460.000,00 C'],
    ['2.1.1', 'FORNECEDORES', '250.000,00 C', '90.000,00', '100.000,00', '260.000,00 C'],
    ['2.1.1.01.0001', 'FORNECEDOR METALURGICA ABC', '140.000,00 C', '45.000,00', '55.000,00', '150.000,00 C'],
    ['2.1.1.01.0002', 'FORNECEDOR EMBALAGENS BRASIL', '110.000,00 C', '25.000,00', '45.000,00', '130.000,00 C'],
    ['2.1.1.01.0003', 'FORNECEDOR BETA LOGISTICA', '15.000,00 C', '40.000,00', '5.000,00', '20.000,00 D'], // INVERTIDO (Passivo com saldo devedor por adiantamento)
    ['2.1.2', 'OBRIGACOES TRABALHISTAS', '110.000,00 C', '50.000,00', '55.000,00', '115.000,00 C'],
    ['2.1.2.01.0001', 'SALARIOS E ORDENADOS A PAGAR', '85.000,00 C', '35.000,00', '40.000,00', '90.000,00 C'],
    ['2.1.2.01.0002', 'INSS A RECOLHER', '15.000,00 C', '10.000,00', '10.000,00', '15.000,00 C'],
    ['2.1.2.01.0003', 'FGTS A RECOLHER', '10.000,00 C', '5.000,00', '5.000,00', '10.000,00 C'],
    ['2.1.3', 'OBRIGACOES TRIBUTARIAS', '90.000,00 C', '30.000,00', '25.000,00', '85.000,00 C'],
    ['2.1.3.01.0001', 'ICMS A RECOLHER', '55.000,00 C', '20.000,00', '15.000,00', '50.000,00 C'],
    ['2.1.3.01.0002', 'PIS / COFINS A RECOLHER', '35.000,00 C', '10.000,00', '10.000,00', '35.000,00 C'],
    ['2.2', 'PASSIVO NAO CIRCULANTE', '170.000,00 C', '25.000,00', '35.000,00', '180.000,00 C'],
    ['2.2.1.01.0001', 'FINANCIAMENTO BANCARIO BNDES', '170.000,00 C', '25.000,00', '35.000,00', '180.000,00 C'],
  ];

  page2Rows.forEach(r => ws.addRow(r));

  // 6 linhas vazias + repetição do cabeçalho página 3
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);

  // Cabeçalho repetido da página 3
  ws.addRow(['Conta', 'Descrição', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual']);

  // Página 3: Patrimônio Líquido, Receitas, Despesas e Conta Não Identificada
  const page3Rows = [
    ['3', 'PATRIMONIO LIQUIDO', '430.000,00 C', '0,00', '10.000,00', '440.000,00 C'],
    ['3.1.1.01.0001', 'CAPITAL SOCIAL INTEGRALIZADO', '350.000,00 C', '0,00', '0,00', '350.000,00 C'],
    ['3.1.2.01.0001', 'RESERVA LEGAL DE LUCROS', '80.000,00 C', '0,00', '10.000,00', '90.000,00 C'],
    ['4', 'CUSTOS E DESPESAS OPERACIONAIS', '0,00', '185.000,00', '15.000,00', '170.000,00 D'],
    ['4.1.1.01.0001', 'CUSTO DAS MERCADORIAS VENDIDAS', '0,00', '120.000,00', '0,00', '120.000,00 D'],
    ['4.1.2.01.0001', 'DESPESAS ADMINISTRATIVAS GERAIS', '0,00', '65.000,00', '15.000,00', '50.000,00 D'],
    ['5', 'RECEITAS OPERACIONAIS', '0,00', '20.000,00', '190.000,00', '170.000,00 C'],
    ['5.1.1.01.0001', 'RECEITA BRUTA DE VENDAS', '0,00', '0,00', '190.000,00', '190.000,00 C'],
    ['5.1.2.01.0001', 'DEDUCOES DA RECEITA BRUTA', '0,00', '20.000,00', '0,00', '20.000,00 D'],
    ['X99.01', 'CONTA TRANSITORIA DE INTEGRACAO PROTHEUS', '0,00', '1.500,00', '0,00', '1.500,00 D'], // NATUREZA NÃO IDENTIFICADA
  ];

  page3Rows.forEach(r => ws.addRow(r));

  // Totais do Período e Total Geral (ao final do relatório Protheus)
  ws.addRow(['', 'TOTAL DO PERÍODO', '2.100.000,00', '820.500,00', '810.200,00', '2.110.300,00']);
  ws.addRow(['', 'TOTAL GERAL', '2.100.000,00', '820.500,00', '810.200,00', '2.110.300,00']);

  return wb;
}

/**
 * Retorna o buffer binário do balancete exemplo
 */
export async function getProtheusSampleBuffer(): Promise<ArrayBuffer> {
  const wb = await createProtheusSampleWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
