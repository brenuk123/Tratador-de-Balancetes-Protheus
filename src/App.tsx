/**
 * Aplicativo para Tratamento de Balancetes Exportados pelo TOTVS Protheus
 */

import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { 
  AccountNature, 
  AccountRow, 
  BalanceSignalConvention, 
  BalanceteParseResult, 
  NatureRule 
} from './types/balancete.ts';
import { DEFAULT_NATURE_RULES } from './utils/balanceteParser.ts';
import { loadExcelWorkbook, parseBalanceteFromWorkbook, selectBestBalanceteSheet } from './utils/excelReader.ts';
import { exportTreatedBalanceteToExcel } from './utils/excelExporter.ts';
import { createProtheusSampleWorkbook, getProtheusSampleBuffer } from './utils/sampleDataGenerator.ts';

import { Navbar } from './components/Navbar.tsx';
import { UploadSection } from './components/UploadSection.tsx';
import { SummaryCards } from './components/SummaryCards.tsx';
import { BalanceteTable } from './components/BalanceteTable.tsx';
import { RulesConfigModal } from './components/RulesConfigModal.tsx';
import { AccountDetailModal } from './components/AccountDetailModal.tsx';
import { DocumentationModal } from './components/DocumentationModal.tsx';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<BalanceteParseResult | null>(null);

  const [rules, setRules] = useState<NatureRule[]>(DEFAULT_NATURE_RULES);
  const [signalConvention, setSignalConvention] = useState<BalanceSignalConvention>('AUTO');
  const [accountOverrides, setAccountOverrides] = useState<Record<string, AccountNature>>({});

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INVERTIDO' | 'NAO_IDENTIFICADO' | 'REGULAR' | 'TOTALIZADORES'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reprocessa os dados se as regras, convenção ou overrides mudarem
  const reprocessData = async (
    wb: ExcelJS.Workbook,
    sheetName: string,
    currentRules: NatureRule[],
    convention: BalanceSignalConvention,
    overrides: Record<string, AccountNature>
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await parseBalanceteFromWorkbook(wb, sheetName, {
        rules: currentRules,
        signalConvention: convention,
        accountOverrides: overrides,
      });

      setParseResult(result);
      if (!result.headers) {
        setErrorMessage(
          'Não foi possível localizar o cabeçalho com as colunas Conta, Descrição, Saldo Anterior, Débito, Crédito e Saldo Atual nesta planilha. Verifique se o arquivo é um balancete exportado pelo Protheus.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar balancete');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar arquivo do usuário
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFileName(file.name);
    setAccountOverrides({});

    try {
      const { sheetNames, workbook: loadedWb } = await loadExcelWorkbook(file);
      if (sheetNames.length === 0) {
        throw new Error('O arquivo Excel não contém nenhuma planilha.');
      }

      setWorkbook(loadedWb);
      const { sheetName: targetSheet, wasAutoSelected } = selectBestBalanceteSheet(loadedWb);
      setSelectedSheet(targetSheet);

      await reprocessData(loadedWb, targetSheet, rules, signalConvention, {});
      
      if (sheetNames.length > 1) {
        setSuccessToast(`Arquivo carregado: 1ª planilha (${sheetNames[0]}) ignorada e foco direcionado para a 2ª planilha (${targetSheet})!`);
      } else {
        setSuccessToast(`Arquivo ${file.name} carregado com sucesso!`);
      }
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMessage(`Falha ao ler o arquivo: ${err.message || 'Arquivo corrompido ou formato incompatível'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Troca de planilha
  const handleSheetChange = async (sheetName: string) => {
    if (!workbook) return;
    setSelectedSheet(sheetName);
    await reprocessData(workbook, sheetName, rules, signalConvention, accountOverrides);
  };

  // Carregar dados de teste do modelo Protheus
  const handleLoadSample = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setFileName('balancete_modelo_protheus.xlsx');
    setAccountOverrides({});

    try {
      const sampleWb = await createProtheusSampleWorkbook();
      setWorkbook(sampleWb);
      const { sheetName: targetSheet } = selectBestBalanceteSheet(sampleWb);
      setSelectedSheet(targetSheet);

      await reprocessData(sampleWb, targetSheet, rules, signalConvention, {});
      setSuccessToast('Balancete modelo carregado: 1ª aba de Parâmetros ignorada e 2ª aba (Balancete) aberta automaticamente!');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMessage(`Erro ao carregar modelo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Baixar o arquivo modelo bruto do Protheus
  const handleDownloadSampleFile = async () => {
    try {
      const buffer = await getProtheusSampleBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'balancete_modelo_protheus_original.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(`Erro ao gerar download do modelo: ${err.message}`);
    }
  };

  // Salvar regras alteradas no modal
  const handleSaveRules = async (newRules: NatureRule[], newConvention: BalanceSignalConvention) => {
    setRules(newRules);
    setSignalConvention(newConvention);

    if (workbook && selectedSheet) {
      await reprocessData(workbook, selectedSheet, newRules, newConvention, accountOverrides);
      setSuccessToast('Regras de natureza atualizadas e aplicadas!');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Ajustar override de uma conta específica
  const handleSetAccountNature = async (conta: string, nature: AccountNature | 'RESET') => {
    const newOverrides = { ...accountOverrides };
    if (nature === 'RESET') {
      delete newOverrides[conta];
    } else {
      newOverrides[conta] = nature;
    }
    setAccountOverrides(newOverrides);

    if (workbook && selectedSheet) {
      await reprocessData(workbook, selectedSheet, rules, signalConvention, newOverrides);
    }
  };

  // Exportar Excel tratado com células destacadas em vermelho
  const handleExport = async () => {
    if (!parseResult) return;
    setIsExporting(true);
    try {
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'balancete_protheus';
      const cleanFileName = `${baseName}_TRATADO.xlsx`;
      await exportTreatedBalanceteToExcel(parseResult, cleanFileName);
      setSuccessToast(`Balancete tratado exportado: ${cleanFileName}`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Erro ao exportar arquivo: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Resetar estado
  const handleReset = () => {
    setWorkbook(null);
    setParseResult(null);
    setFileName(null);
    setSelectedSheet('');
    setErrorMessage(null);
    setActiveFilter('ALL');
  };

  // Filtro rápido clicando no card de invertidas
  const handleFilterInverted = () => {
    setActiveFilter('INVERTIDO');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onLoadSample={handleLoadSample}
        isLoading={isLoading}
        hasData={!!parseResult}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notificação Toast de Sucesso */}
        {successToast && (
          <div className="mb-4 p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-100 hover:text-white text-sm px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-950">Atenção ao Processar Balancete</h3>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-600 hover:text-red-900 font-bold px-2 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Seção de Upload / Seleção de Arquivo e Planilha */}
        <UploadSection
          onFileUpload={handleFileUpload}
          onSheetChange={handleSheetChange}
          onLoadSample={handleLoadSample}
          parseResult={parseResult}
          selectedSheet={selectedSheet}
          fileName={fileName}
          isLoading={isLoading}
        />

        {/* Exibição dos Dados Tratados */}
        {parseResult && parseResult.headers && (
          <>
            {/* Cartões de Métricas e Auditoria */}
            <SummaryCards
              stats={parseResult.stats}
              onExport={handleExport}
              onOpenRules={() => setIsRulesModalOpen(true)}
              onFilterInverted={handleFilterInverted}
              isExporting={isExporting}
            />

            {/* Tabela Contínua Tratada */}
            <BalanceteTable
              rows={parseResult.accounts}
              totalizers={parseResult.totalizers}
              onSelectAccount={(acc) => setSelectedAccount(acc)}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </>
        )}
      </main>

      {/* Modais */}
      <RulesConfigModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        signalConvention={signalConvention}
        onSave={handleSaveRules}
      />

      <AccountDetailModal
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onSetAccountNature={handleSetAccountNature}
      />

      <DocumentationModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onDownloadSample={handleDownloadSampleFile}
      />

      {/* Rodapé simples */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Tratador de Balancetes Protheus • Processamento em memória 100% no seu navegador
          </span>
          <button
            type="button"
            onClick={() => setIsDocsModalOpen(true)}
            className="text-blue-600 hover:underline cursor-pointer font-medium"
          >
            Ver documentação e regex
          </button>
        </div>
      </footer>
    </div>
  );
}
