import React from 'react';
import { FileSpreadsheet, HelpCircle, SlidersHorizontal, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenDocs: () => void;
  onOpenRules: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  hasData: boolean;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDocs,
  onOpenRules,
  onLoadSample,
  isLoading,
  hasData,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold text-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Tratador de Balancetes
              </h1>
              <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                TOTVS Protheus
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Higienização de cabeçalhos repetidos e auditoria de saldos invertidos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors disabled:opacity-50 cursor-pointer"
            title="Carrega balancete de teste com estrutura real do Protheus"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Carregar Balancete de Exemplo</span>
            <span className="sm:hidden">Exemplo</span>
          </button>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Ajustar regras de natureza contábil das contas"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Regras de Natureza</span>
            <span className="md:hidden">Regras</span>
          </button>

          <button
            type="button"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Instruções de uso e funcionamento da higienização"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Instruções</span>
          </button>

          {hasData && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 text-slate-400 hover:text-red-300 hover:bg-red-950/40 border border-slate-700 transition-colors cursor-pointer"
              title="Limpar arquivo atual"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">Novo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
