import React, { useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BalanceteParseResult } from '../types/balancete.ts';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onSheetChange: (sheetName: string) => void;
  onLoadSample: () => void;
  parseResult: BalanceteParseResult | null;
  selectedSheet: string;
  fileName: string | null;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onSheetChange,
  onLoadSample,
  parseResult,
  selectedSheet,
  fileName,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      {!parseResult ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 sm:p-12 text-center transition-colors bg-slate-50/50 hover:bg-blue-50/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-file-input"
          />

          <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Selecione o arquivo Excel do balancete Protheus
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
            Arraste seu arquivo <span className="font-semibold text-slate-700">.xlsx</span> ou <span className="font-semibold text-slate-700">.xls</span> exportado pelo Protheus Contábil (rotina CTBR040 ou similar) para higienização automática.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label
              htmlFor="excel-file-input"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Escolher Arquivo do Computador</span>
            </label>

            <button
              type="button"
              onClick={onLoadSample}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Testar com Balancete Modelo Protheus</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80 max-w-2xl mx-auto text-left grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Remove cabeçalhos repetidos:</strong> Identifica as colunas em cada salto de página e mantém apenas um único cabeçalho no início.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Preserva totalizadores:</strong> Mantém linhas de "Total do Período" e "Total Geral" intactas na base do relatório.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Elimina linhas em branco:</strong> Higieniza as 6 linhas vazias no topo e entre as quebras de página.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Destaca saldo invertido:</strong> Detecta contas devedoras com saldo credor e vice-versa, marcando em vermelho.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-base">
                  {fileName || 'Balancete Carregado'}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Processado com Sucesso
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {parseResult.stats.totalOriginalRows} linhas brutas analisadas • Cabeçalho identificado na linha { (parseResult.headers?.headerRowIndex ?? 0) + 1 }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {parseResult.allSheets && parseResult.allSheets.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
                <Layers className="w-4 h-4 text-slate-500 ml-1" />
                <label htmlFor="sheet-select" className="font-semibold text-slate-700">
                  Planilha Ativa:
                </label>
                <select
                  id="sheet-select"
                  value={selectedSheet}
                  onChange={(e) => onSheetChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {parseResult.allSheets.map((s, idx) => {
                    const isParam = idx === 0 || s.toLowerCase().includes('param');
                    const isBal = idx === 1 || s.toLowerCase().includes('balanc');
                    const label = isParam
                      ? `${s} (1ª Aba - Parâmetros)`
                      : isBal
                      ? `${s} (Balancete Contábil)`
                      : s;
                    return (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            >
              Trocar Arquivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {parseResult && parseResult.warnings.length > 0 && (
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            {parseResult.warnings.map((w, idx) => (
              <p key={idx}>{w}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
