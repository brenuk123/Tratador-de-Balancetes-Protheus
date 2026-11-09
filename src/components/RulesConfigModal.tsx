import React, { useState } from 'react';
import { X, Plus, Trash2, SlidersHorizontal, Info, Check, RotateCcw } from 'lucide-react';
import { AccountNature, BalanceSignalConvention, NatureRule } from '../types/balancete.ts';
import { DEFAULT_NATURE_RULES } from '../utils/balanceteParser.ts';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: NatureRule[];
  signalConvention: BalanceSignalConvention;
  onSave: (rules: NatureRule[], convention: BalanceSignalConvention) => void;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  rules: initialRules,
  signalConvention: initialConvention,
  onSave,
}) => {
  const [rules, setRules] = useState<NatureRule[]>(initialRules);
  const [convention, setConvention] = useState<BalanceSignalConvention>(initialConvention);

  // Formulário para nova regra
  const [newPrefix, setNewPrefix] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newNature, setNewNature] = useState<AccountNature>('DEVEDORA');

  if (!isOpen) return null;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefix.trim()) return;

    const newRule: NatureRule = {
      id: `custom-${Date.now()}`,
      prefix: newPrefix.trim(),
      description: newDesc.trim() || `Regra Prefixo ${newPrefix.trim()}`,
      nature: newNature,
      isCustom: true,
    };

    setRules([newRule, ...rules]);
    setNewPrefix('');
    setNewDesc('');
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleResetDefaults = () => {
    setRules([...DEFAULT_NATURE_RULES]);
    setConvention('AUTO');
  };

  const handleSaveAndApply = () => {
    onSave(rules, convention);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Configuração de Regras de Natureza</h2>
              <p className="text-xs text-slate-400">
                Ajuste os prefixos de contas e convenções de sinal para identificação de saldo invertido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Caixa de Explicação da Regra */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Como funciona a identificação de natureza invertida:</span>
            </div>
            <p>
              • <strong>Contas de Natureza Devedora (ex: Ativo, Despesas):</strong> Devem possuir saldo atual Devedor (sufixo 'D' ou positivo). Caso apresentem saldo Credor ('C' ou negativo), serão sinalizadas em vermelho como <strong>Saldo Invertido</strong>.
            </p>
            <p>
              • <strong>Contas de Natureza Credora (ex: Passivo, PL, Receitas):</strong> Devem possuir saldo atual Credor (sufixo 'C' ou negativo). Caso apresentem saldo Devedor ('D' ou positivo), serão sinalizadas em vermelho como <strong>Saldo Invertido</strong>.
            </p>
            <p>
              • <strong>Contas Não Identificadas:</strong> Se a conta não coincidir com nenhum prefixo, ela não é marcada como invertida às cegas, ficando disponível para sua revisão.
            </p>
          </div>

          {/* Convenção de Sinal do Arquivo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Interpretação do Saldo Atual no Arquivo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                convention === 'AUTO' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="convention"
                  value="AUTO"
                  checked={convention === 'AUTO'}
                  onChange={() => setConvention('AUTO')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-slate-900">Detecção Automática (Recomendado)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Procura sufixos "D" e "C" no texto das células ou utiliza valores negativos.
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                convention === 'SUFFIX_DC' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="convention"
                  value="SUFFIX_DC"
                  checked={convention === 'SUFFIX_DC'}
                  onChange={() => setConvention('SUFFIX_DC')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-slate-900">Sufixos D / C no Texto</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Padrão clássico Protheus: "1.250,00 D" (Devedor) e "4.000,00 C" (Credor).
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                convention === 'NEGATIVE_CREDIT' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="convention"
                  value="NEGATIVE_CREDIT"
                  checked={convention === 'NEGATIVE_CREDIT'}
                  onChange={() => setConvention('NEGATIVE_CREDIT')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-slate-900">Negativo = Credor</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Valores positivos são Débito; valores negativos (-) ou entre parênteses são Crédito.
                  </div>
                </div>
              </label>

              <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                convention === 'NEGATIVE_DEBIT' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="convention"
                  value="NEGATIVE_DEBIT"
                  checked={convention === 'NEGATIVE_DEBIT'}
                  onChange={() => setConvention('NEGATIVE_DEBIT')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-slate-900">Negativo = Devedor</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Para planos onde valores credores são positivos e despesas/ativo negativos.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Adicionar Nova Regra ou Exceção de Prefixo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Adicionar Regra ou Exceção de Prefixo
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Exemplo: Adicionar prefixo <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">1.1.9</code> para contas retificadoras do ativo com natureza <strong className="text-orange-700">Credora</strong>.
            </p>
            <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Prefixo (ex: 1.1.9)"
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value)}
                className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <input
                type="text"
                placeholder="Descrição (ex: Retificadora)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-1"
              />
              <select
                value={newNature}
                onChange={(e) => setNewNature(e.target.value as AccountNature)}
                className="text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-semibold"
              >
                <option value="DEVEDORA">Devedora</option>
                <option value="CREDORA">Credora</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Lista de Regras Ativas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Regras de Classificação Ativas ({rules.length})
              </label>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão SPED/CFC</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 max-h-56 overflow-y-auto bg-white">
              {rules.map((rule) => (
                <div key={rule.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {rule.prefix}*
                    </span>
                    <span className="font-medium text-slate-800">{rule.description}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        rule.nature === 'DEVEDORA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {rule.nature}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      title="Excluir regra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar e Reprocessar Balancete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
