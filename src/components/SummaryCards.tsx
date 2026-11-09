import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Layers, 
  Trash2, 
  Download, 
  SlidersHorizontal 
} from 'lucide-react';
import { BalanceteParseResult } from '../types/balancete.ts';

interface SummaryCardsProps {
  stats: BalanceteParseResult['stats'];
  onExport: () => void;
  onOpenRules: () => void;
  onFilterInverted: () => void;
  isExporting: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  onExport,
  onOpenRules,
  onFilterInverted,
  isExporting,
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total de Contas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Válidas</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalAccounts}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Reunidas em tabela contínua
          </div>
        </div>

        {/* Saldos Regulares */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldos Regulares</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.regularAccounts}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">
            Natureza contábil compatível
          </div>
        </div>

        {/* Saldos Invertidos (Destaque Vermelho) */}
        <div 
          onClick={onFilterInverted}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            stats.invertedAccounts > 0
              ? 'bg-red-50/70 border-red-200 hover:border-red-300 hover:bg-red-50 ring-1 ring-red-200/50'
              : 'bg-white border-slate-200'
          }`}
          title="Clique para filtrar contas com saldo invertido"
        >
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              Saldos Invertidos
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-red-700">{stats.invertedAccounts}</div>
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {stats.invertedAccounts > 0 ? 'Requer atenção imediata' : 'Nenhuma anomalia'}
          </div>
        </div>

        {/* Natureza Não Identificada */}
        <div 
          onClick={onOpenRules}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            stats.unidentifiedAccounts > 0
              ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
              : 'bg-white border-slate-200'
          }`}
          title="Clique para configurar as regras do plano de contas"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Não Identificadas</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.unidentifiedAccounts}</div>
          <div className="text-[11px] text-amber-600 mt-1">
            Revisar regras do plano
          </div>
        </div>

        {/* Linhas Removidas (Higienização) */}
        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Higienização</span>
            <Trash2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700">
            {stats.emptyRowsRemoved + stats.repeatedHeadersRemoved}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.repeatedHeadersRemoved} cabeçalhos + {stats.emptyRowsRemoved} vazias
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xs">
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">Relatório Pronto: </span>
          {stats.totalAccounts} contas reunidas sem quebras de página + {stats.totalizersCount} linhas de totais preservadas.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ajustar Regras</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Balancete Tratado (.XLSX)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
