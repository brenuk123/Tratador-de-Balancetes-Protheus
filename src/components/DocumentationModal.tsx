import React from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, FileSpreadsheet, Terminal, Cpu, Download } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSample: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  onDownloadSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Manual de Operação e Regras de Higienização</h2>
              <p className="text-xs text-slate-400">
                Solução para balancetes exportados pelo TOTVS Protheus Contábil
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

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 1. Visão Geral da Solução */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              1. Visão Geral da Solução Proposta
            </h3>
            <p>
              O relatório padrão de balancete do Protheus Contábil (gerado através da rotina <code>CTBR040</code> ou emissão em planilha) costuma incluir quebras de impressão que criam repetições de cabeçalho e linhas em branco a cada bloco (aproximadamente 61 linhas). Além disso, as 6 primeiras linhas do arquivo contêm cabeçalhos textuais ou linhas vazias.
            </p>
            <p>
              Este programa processa o arquivo em memória no seu navegador:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Localiza de forma resiliente as colunas do balancete através do texto dos cabeçalhos, sem depender de linhas fixas;</li>
              <li>Elimina todas as linhas em branco e cabeçalhos intermediários repetidos;</li>
              <li>Reúne todas as contas e movimentações em uma tabela contínua;</li>
              <li>Preserva as linhas de totais (Total do Período e Total Geral) ao final do arquivo;</li>
              <li>Identifica contas com saldo de natureza invertida e destaca-as em vermelho na tela e no Excel exportado.</li>
            </ul>
          </section>

          {/* 2. Regras de Determinação da Natureza e Inversão de Saldo */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              2. Regras de Determinação de Natureza e Inversão
            </h3>
            <p>
              A determinação da natureza contábil é parametrizável pelo usuário e baseada nos padrões contábeis brasileiros (CFC / SPED Contábil):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 my-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-blue-900 block mb-1">Natureza Devedora (Ativo, Despesas, Custos)</span>
                <p className="text-[11px] text-slate-600">
                  Prefixos padrão: <code>1*</code> (Ativo), <code>4*</code> (Custos/Despesas), <code>6*</code> (Despesas Gerais), <code>9*</code> (Compensação).
                  <br />
                  <span className="text-red-700 font-semibold">Inversão:</span> Saldo atual marcado como <code>Credor ('C')</code> ou negativo.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-orange-900 block mb-1">Natureza Credora (Passivo, PL, Receitas)</span>
                <p className="text-[11px] text-slate-600">
                  Prefixos padrão: <code>2*</code> (Passivo), <code>3*</code> (Patrimônio Líquido), <code>5*</code> (Receitas), <code>7*</code> (Receitas Financeiras), <code>8*</code> (Resultado).
                  <br />
                  <span className="text-red-700 font-semibold">Inversão:</span> Saldo atual marcado como <code>Devedor ('D')</code> ou positivo.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Caso uma conta não coincida com os prefixos configurados, ela é classificada como <strong>"Natureza Não Identificada"</strong> (ícone âmbar), nunca sendo marcada como invertida sem a sua revisão.
            </p>
          </section>

          {/* 3. Expressões Regulares (Regex) Utilizadas */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              3. Expressões Regulares Utilizadas
            </h3>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1.5 overflow-x-auto">
              <div>
                <span className="text-emerald-400"># Detecção de Totais e Resumos:</span>
                <br />
                <code>/total\s+do\s+periodo|totais\s+gerais|total\s+geral|resumo\s+do\s+balancete/i</code>
              </div>
              <div className="pt-1">
                <span className="text-emerald-400"># Detecção de Bancos na Descrição:</span>
                <br />
                <code>/\b(itau|bradesco|santander|banco do brasil|bb|caixa|cef|sicoob|sicredi|safra|btg|inter|nubank)\b/i</code>
              </div>
              <div className="pt-1">
                <span className="text-emerald-400"># Extração de Agência e Conta Corrente:</span>
                <br />
                <code>Agência: /(?:ag[eê]ncia|ag\.?|ag:)\s*([0-9]{'{2,5}'}(?:-[0-9xX])?)/i</code>
                <br />
                <code>Conta C/C: /(?:c\/c|conta\s*corrente|conta|cc\.?)\s*([0-9]{'{4,12}'}(?:-[0-9xX])?)/i</code>
              </div>
              <div className="pt-1">
                <span className="text-emerald-400"># Extração de Indicador D/C ou Negativo:</span>
                <br />
                <code>/\b[0-9.,\s]+[DC]\b|\([0-9.,\s]+\)/i</code>
              </div>
            </div>
          </section>

          {/* 4. Como Executar e Exportar */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              4. Como Usar Passo a Passo
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600">
              <li>Arraste seu arquivo Excel exportado do Protheus ou clique em "Escolher Arquivo".</li>
              <li>Se o arquivo possuir várias planilhas, selecione a planilha desejada na caixa seletora.</li>
              <li>Revise as métricas de contas, linhas removidas e saldos invertidos nos cartões de resumo.</li>
              <li>Filtre a tabela por "Saldos Invertidos" para auditar as contas com desvio contábil.</li>
              <li>Se necessário, clique no botão "Ajustar Regras" para adicionar regras de prefixo da sua empresa.</li>
              <li>Clique em <strong>"Baixar Balancete Tratado (.XLSX)"</strong> para gerar a planilha limpa e formatada com os destaques em vermelho!</li>
            </ol>
          </section>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Arquivo Modelo do Protheus</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
