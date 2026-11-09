import React from 'react';
import { X, Building2, AlertTriangle, CheckCircle2, HelpCircle, Save } from 'lucide-react';
import { AccountNature, AccountRow } from '../types/balancete.ts';

interface AccountDetailModalProps {
  account: AccountRow | null;
  onClose: () => void;
  onSetAccountNature: (conta: string, nature: AccountNature | 'RESET') => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  onClose,
  onSetAccountNature,
}) => {
  if (!account) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(val));
  };

  const isInverted = account.status === 'INVERTIDO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Linha original #{account.originalRowNumber}
            </span>
            <h2 className="text-base font-bold font-mono text-emerald-400">{account.conta}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="text-slate-500 font-semibold block mb-0.5">Descrição da Conta</label>
            <p className="text-sm font-bold text-slate-900">{account.descricao}</p>
          </div>

          {/* Dados bancários extraídos via Regex */}
          {account.extractedMetadata && (account.extractedMetadata.banco || account.extractedMetadata.agencia) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-blue-900">
              <div className="flex items-center gap-1.5 font-bold">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Dados Bancários Detectados via Regex</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Banco</span>
                  <span className="font-semibold text-slate-800">{account.extractedMetadata.banco || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Agência</span>
                  <span className="font-semibold text-slate-800">{account.extractedMetadata.agencia || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Conta Corrente</span>
                  <span className="font-semibold text-slate-800">{account.extractedMetadata.contaCorrente || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Movimentações */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Saldo Anterior</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(account.saldoAnteriorValue)}
                <span className="text-slate-400 font-sans text-xs ml-1">{account.saldoAnteriorNature}</span>
              </span>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isInverted ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={isInverted ? 'text-red-700 font-semibold block' : 'text-slate-500 block'}>
                Saldo Atual
              </span>
              <span className={`font-mono font-bold text-sm ${isInverted ? 'text-red-700' : 'text-slate-900'}`}>
                {formatCurrency(account.saldoAtualValue)}
                <span className="font-sans text-xs ml-1">
                  ({account.saldoAtualNature === 'ZERO' ? 'Zero' : account.saldoAtualNature})
                </span>
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Débitos do Período</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(account.debitoValue)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Créditos do Período</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(account.creditoValue)}
              </span>
            </div>
          </div>

          {/* Status Atual e Auditoria */}
          <div className="pt-2">
            <div className="p-3 rounded-xl border flex items-start gap-3 bg-slate-50 border-slate-200">
              {isInverted ? (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : account.status === 'NAO_IDENTIFICADO' ? (
                <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-slate-900">
                  {isInverted
                    ? 'Saldo Invertido em Relação à Natureza'
                    : account.status === 'NAO_IDENTIFICADO'
                    ? 'Natureza Não Determinada Automaticamente'
                    : 'Saldo Regular em Conformidade'}
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Natureza esperada pela regra:{' '}
                  <strong>{account.naturezaEsperada}</strong> • Natureza do saldo atual:{' '}
                  <strong>{account.saldoAtualNature}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ajuste manual individual */}
          <div className="pt-2 border-t border-slate-200">
            <label className="font-bold text-slate-800 block mb-1.5">
              Ajustar / Forçar Natureza Desta Conta
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetAccountNature(account.conta, 'DEVEDORA');
                  onClose();
                }}
                className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  account.naturezaEsperada === 'DEVEDORA' && account.manualOverride
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Forçar Devedora
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetAccountNature(account.conta, 'CREDORA');
                  onClose();
                }}
                className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  account.naturezaEsperada === 'CREDORA' && account.manualOverride
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                Forçar Credora
              </button>

              {account.manualOverride && (
                <button
                  type="button"
                  onClick={() => {
                    onSetAccountNature(account.conta, 'RESET');
                    onClose();
                  }}
                  className="py-2 px-3 rounded-lg text-slate-600 hover:bg-slate-200 border border-slate-300 font-medium cursor-pointer"
                  title="Restaurar regra geral"
                >
                  Restaurar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
