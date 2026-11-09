import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Filter, 
  Building2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight,
  Calculator
} from 'lucide-react';
import { AccountRow, BalanceStatus } from '../types/balancete.ts';

interface BalanceteTableProps {
  rows: AccountRow[];
  totalizers: AccountRow[];
  onSelectAccount: (account: AccountRow) => void;
  activeFilter: 'ALL' | 'INVERTIDO' | 'NAO_IDENTIFICADO' | 'REGULAR' | 'TOTALIZADORES';
  setActiveFilter: (filter: 'ALL' | 'INVERTIDO' | 'NAO_IDENTIFICADO' | 'REGULAR' | 'TOTALIZADORES') => void;
}

export const BalanceteTable: React.FC<BalanceteTableProps> = ({
  rows,
  totalizers,
  onSelectAccount,
  activeFilter,
  setActiveFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Formatação de valores contábeis
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
  };

  // Filtragem e busca
  const filteredRows = useMemo(() => {
    let list: AccountRow[] = [];

    if (activeFilter === 'TOTALIZADORES') {
      list = [...totalizers];
    } else {
      list = [...rows];
      if (activeFilter === 'INVERTIDO') {
        list = list.filter((r) => r.status === 'INVERTIDO');
      } else if (activeFilter === 'NAO_IDENTIFICADO') {
        list = list.filter((r) => r.status === 'NAO_IDENTIFICADO');
      } else if (activeFilter === 'REGULAR') {
        list = list.filter((r) => r.status === 'REGULAR');
      }
    }

    if (!searchTerm.trim()) {
      return list;
    }

    const term = searchTerm.toLowerCase();
    return list.filter((r) => {
      const contaMatch = r.conta.toLowerCase().includes(term);
      const descMatch = r.descricao.toLowerCase().includes(term);
      const bankMatch = r.extractedMetadata?.banco?.toLowerCase().includes(term);
      return contaMatch || descMatch || bankMatch;
    });
  }, [rows, totalizers, activeFilter, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Contagens para os botões de filtro
  const counts = useMemo(() => {
    return {
      all: rows.length,
      inverted: rows.filter((r) => r.status === 'INVERTIDO').length,
      unidentified: rows.filter((r) => r.status === 'NAO_IDENTIFICADO').length,
      regular: rows.filter((r) => r.status === 'REGULAR').length,
      totals: totalizers.length,
    };
  }, [rows, totalizers]);

  const handleFilterClick = (filter: typeof activeFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
      {/* Barra Superior da Tabela: Filtros e Pesquisa */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        {/* Abas de Filtros */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleFilterClick('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Todas as Contas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterClick('INVERTIDO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'INVERTIDO'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-current" />
            <span>Saldos Invertidos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'INVERTIDO' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'
              }`}
            >
              {counts.inverted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterClick('NAO_IDENTIFICADO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'NAO_IDENTIFICADO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-current" />
            <span>Não Identificadas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'NAO_IDENTIFICADO' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {counts.unidentified}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterClick('REGULAR')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'REGULAR'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-current" />
            <span>Regulares</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === 'REGULAR' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {counts.regular}
            </span>
          </button>

          {counts.totals > 0 && (
            <button
              type="button"
              onClick={() => handleFilterClick('TOTALIZADORES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'TOTALIZADORES'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Totais ({counts.totals})</span>
            </button>
          )}
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar conta, descrição ou banco..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white border-b border-slate-700 font-semibold tracking-wide">
              <th className="py-3 px-3 w-16 text-center text-slate-400">Origem</th>
              <th className="py-3 px-3 min-w-[170px]">Conta Contábil</th>
              <th className="py-3 px-3 min-w-[260px]">Descrição da Conta</th>
              <th className="py-3 px-3 text-right min-w-[130px]">Saldo Anterior</th>
              <th className="py-3 px-3 text-right min-w-[110px]">Débito</th>
              <th className="py-3 px-3 text-right min-w-[110px]">Crédito</th>
              <th className="py-3 px-3 text-right min-w-[130px]">Saldo Atual</th>
              <th className="py-3 px-2 text-center w-14">Nat.</th>
              <th className="py-3 px-3 text-center min-w-[130px]">Esperada</th>
              <th className="py-3 px-3 text-center min-w-[140px]">Status</th>
              <th className="py-3 px-2 text-center w-14">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <Filter className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhuma conta encontrada com este filtro</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tente alterar os termos de pesquisa ou selecionar outra aba.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isInverted = row.status === 'INVERTIDO';
                const isUnidentified = row.status === 'NAO_IDENTIFICADO';
                const isTotalizer = row.isTotalizer;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isInverted
                        ? 'bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-600'
                        : isTotalizer
                        ? 'bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900'
                        : isUnidentified
                        ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Linha Original do Relatório */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      #{row.originalRowNumber}
                    </td>

                    {/* Código da Conta */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-semibold text-slate-900">
                        {row.conta || '—'}
                      </div>
                      {/* Se houver metadados bancários extraídos via regex */}
                      {row.extractedMetadata?.banco && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded w-fit border border-blue-200">
                          <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{row.extractedMetadata.banco}</span>
                          {row.extractedMetadata.agencia && <span>Ag {row.extractedMetadata.agencia}</span>}
                          {row.extractedMetadata.contaCorrente && <span>CC {row.extractedMetadata.contaCorrente}</span>}
                        </div>
                      )}
                    </td>

                    {/* Descrição */}
                    <td className="py-2.5 px-3">
                      <span className={`font-medium ${isInverted ? 'text-red-950 font-semibold' : 'text-slate-800'}`}>
                        {row.descricao || 'Sem descrição'}
                      </span>
                    </td>

                    {/* Saldo Anterior */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      <span>{formatCurrency(row.saldoAnteriorValue)}</span>
                      {row.saldoAnteriorNature && row.saldoAnteriorNature !== 'INDETERMINADO' && (
                        <span 
                          className="select-none text-[10px] ml-1 text-slate-400 font-sans font-semibold inline-block"
                          title="Máscara visual (não considerada ao copiar)"
                          aria-hidden="true"
                        >
                          {row.saldoAnteriorNature}
                        </span>
                      )}
                    </td>

                    {/* Débito */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.debitoValue !== 0 ? formatCurrency(row.debitoValue) : '—'}
                    </td>

                    {/* Crédito */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.creditoValue !== 0 ? formatCurrency(row.creditoValue) : '—'}
                    </td>

                    {/* Saldo Atual (DESTACADO EM VERMELHO SE INVERTIDO) */}
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      isInverted
                        ? 'text-red-700 text-sm bg-red-100/80 px-2 rounded'
                        : isTotalizer
                        ? 'text-slate-900 text-sm'
                        : 'text-slate-900'
                    }`}>
                      <span>{formatCurrency(row.saldoAtualValue)}</span>
                      {row.saldoAtualNature && row.saldoAtualNature !== 'ZERO' && row.saldoAtualNature !== 'INDETERMINADO' && (
                        <span 
                          className="select-none text-xs ml-1 font-semibold opacity-75 inline-block"
                          title="Máscara visual (não considerada ao copiar)"
                          aria-hidden="true"
                        >
                          {row.saldoAtualNature}
                        </span>
                      )}
                    </td>

                    {/* Natureza D/C Atual */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          row.saldoAtualNature === 'D'
                            ? 'bg-blue-100 text-blue-800'
                            : row.saldoAtualNature === 'C'
                            ? 'bg-orange-100 text-orange-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.saldoAtualNature}
                      </span>
                    </td>

                    {/* Natureza Esperada */}
                    <td className="py-2.5 px-3 text-center">
                      {isTotalizer ? (
                        <span className="text-slate-400 italic text-[11px]">Totalizador</span>
                      ) : row.naturezaEsperada === 'DEVEDORA' ? (
                        <span className="text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                          Devedora
                        </span>
                      ) : row.naturezaEsperada === 'CREDORA' ? (
                        <span className="text-orange-700 font-semibold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[11px]">
                          Credora
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                          Não Identificada
                        </span>
                      )}
                    </td>

                    {/* Status de Auditoria */}
                    <td className="py-2.5 px-3 text-center">
                      {isInverted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-600 text-white shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>SALDO INVERTIDO</span>
                        </span>
                      ) : isTotalizer ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          <Calculator className="w-3 h-3" />
                          <span>TOTAL</span>
                        </span>
                      ) : isUnidentified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <HelpCircle className="w-3 h-3" />
                          <span>REVISAR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Regular</span>
                        </span>
                      )}
                    </td>

                    {/* Ação individual */}
                    <td className="py-2.5 px-2 text-center">
                      {!isTotalizer && (
                        <button
                          type="button"
                          onClick={() => onSelectAccount(row)}
                          className="p-1 hover:bg-slate-200/80 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Ver detalhes ou ajustar natureza da conta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé com Paginação */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong>{paginatedRows.length}</strong> de <strong>{filteredRows.length}</strong> registros
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-500">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
