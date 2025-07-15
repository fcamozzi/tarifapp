
"use client"

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, FileText, TrendingUp, Calculator, Database } from 'lucide-react';
import { dadosFaturamento, type RegistroFaturamento } from '../lib/data';
import { formatarMoeda, formatarPercentual, formatarNumero } from '../lib/utils';
import { type DadosAgrupados, type EstatisticasEmpresa } from '../lib/types';

export default function FaturamentoApp() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [dadosAgrupados, setDadosAgrupados] = useState<DadosAgrupados[] | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasEmpresa | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Criar índices e otimizações usando useMemo para melhor performance
  const { empresas, dadosIndexados } = useMemo(() => {
    console.log('Processando dados completos...', dadosFaturamento.dados.length, 'registros');
    
    // Criar índice por empresa para lookup rápido
    const indexPorEmpresa = new Map<string, RegistroFaturamento[]>();
    const empresasUnicas = new Set<string>();
    
    dadosFaturamento.dados.forEach(item => {
      empresasUnicas.add(item.Razao_Social);
      
      if (!indexPorEmpresa.has(item.Razao_Social)) {
        indexPorEmpresa.set(item.Razao_Social, []);
      }
      indexPorEmpresa.get(item.Razao_Social)!.push(item);
    });
    
    // Ordenar empresas
    const empresasOrdenadas = Array.from(empresasUnicas).sort();
    
    console.log('Dados indexados:', empresasOrdenadas.length, 'empresas únicas');
    
    return {
      empresas: empresasOrdenadas,
      dadosIndexados: indexPorEmpresa
    };
  }, []);

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Função otimizada para agrupar dados por empresa e mês/ano usando índices
  const agruparDadosPorEmpresaEMes = (razaoSocial: string): DadosAgrupados[] | null => {
    // Usar dados indexados para lookup O(1) em vez de filtrar O(n)
    const dadosEmpresa = dadosIndexados.get(razaoSocial);
    
    if (!dadosEmpresa || dadosEmpresa.length === 0) {
      return null;
    }
    
    // Agrupar por Mes_Ano
    const agrupado: Record<string, DadosAgrupados> = {};
    
    dadosEmpresa.forEach(item => {
      const mesAno = item.Mes_Ano;
      
      if (!agrupado[mesAno]) {
        agrupado[mesAno] = {
          Mes_Ano: mesAno,
          Volume_Total_m3: 0,
          Valor_Total_Cobrado: 0,
          Valor_Regulatorio_Total: 0,
          Diferenca_Total: 0,
          Ano: item.Ano,
          Tarifa_Regulatoria: item.Tarifa_Regulatoria,
          registros: []
        };
      }
      
      agrupado[mesAno].Volume_Total_m3 += item.Volume_Agua_m3;
      agrupado[mesAno].Valor_Total_Cobrado += item.Valor_Total;
      agrupado[mesAno].Valor_Regulatorio_Total += item.Valor_Regulatorio;
      agrupado[mesAno].Diferenca_Total += item.Diferenca_Valor;
      agrupado[mesAno].registros.push(item);
    });
    
    // Converter para array e ordenar por data
    const resultado = Object.values(agrupado).sort((a, b) => {
      const [mesA, anoA] = a.Mes_Ano.split('/');
      const [mesB, anoB] = b.Mes_Ano.split('/');
      
      if (anoA !== anoB) {
        return parseInt(anoA) - parseInt(anoB);
      }
      return parseInt(mesA) - parseInt(mesB);
    });
    
    return resultado;
  };

  // Função para calcular estatísticas da empresa
  const calcularEstatisticasEmpresa = (dados: DadosAgrupados[]): EstatisticasEmpresa => {
    const totalRegistros = dados.reduce((sum, item) => sum + item.registros.length, 0);
    const diferencaTotal = dados.reduce((sum, item) => sum + item.Diferenca_Total, 0);
    
    return {
      totalRegistros,
      diferencaTotal
    };
  };

  // Função otimizada para processar dados quando empresa é selecionada
  const processarDadosEmpresa = async (razaoSocial: string) => {
    setIsLoading(true);
    
    // Delay reduzido devido à otimização dos dados indexados
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const dadosProcessados = agruparDadosPorEmpresaEMes(razaoSocial);
    
    if (dadosProcessados) {
      const estatisticasCalculadas = calcularEstatisticasEmpresa(dadosProcessados);
      setDadosAgrupados(dadosProcessados);
      setEstatisticas(estatisticasCalculadas);
    } else {
      setDadosAgrupados(null);
      setEstatisticas(null);
    }
    
    setIsLoading(false);
  };

  // Handler para mudança de empresa
  const handleEmpresaChange = (razaoSocial: string) => {
    setEmpresaSelecionada(razaoSocial);
    
    if (razaoSocial) {
      processarDadosEmpresa(razaoSocial);
    } else {
      setDadosAgrupados(null);
      setEstatisticas(null);
    }
  };

  // Carregamento inicial da aplicação
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-auto">
          <Database className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Carregando Sistema</h2>
          <p className="text-lg text-gray-600 mb-6">
            Processando {dadosFaturamento.metadata.total_registros.toLocaleString()} registros de {dadosFaturamento.metadata.empresas_unicas} empresas...
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">
            Período: {dadosFaturamento.metadata.periodo_inicio} - {dadosFaturamento.metadata.periodo_fim}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Container principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-blue-600 text-white p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Sistema de Consulta de Diferenças de Faturamento
            </h1>
            <p className="text-xl opacity-90 font-light mb-4">
              Análise de diferenças entre tarifas cobradas e tarifas regulatórias
            </p>
            <div className="flex justify-center gap-6 text-sm opacity-80">
              <span>📊 {dadosFaturamento.metadata.total_registros.toLocaleString()} registros</span>
              <span>🏢 {dadosFaturamento.metadata.empresas_unicas} empresas</span>
              <span>📅 {dadosFaturamento.metadata.periodo_inicio} - {dadosFaturamento.metadata.periodo_fim}</span>
            </div>
          </div>

          <div className="p-8">
            {/* Controles */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <label htmlFor="empresa-select" className="block text-xl font-semibold text-slate-700 mb-4">
                Selecione uma empresa ({empresas.length} disponíveis):
              </label>
              <div className="relative">
                <select
                  id="empresa-select"
                  value={empresaSelecionada}
                  onChange={(e) => handleEmpresaChange(e.target.value)}
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer pr-12"
                >
                  <option value="">-- Selecione uma empresa --</option>
                  {empresas.map(empresa => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 pointer-events-none" />
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 mb-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-xl text-gray-600">Processando dados da empresa...</p>
              </div>
            )}

            {/* Informações da empresa */}
            {!isLoading && estatisticas && empresaSelecionada && (
              <div className="mb-8 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-blue-600" />
                  Informações da Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Empresa:</span>
                    <span className="font-bold text-slate-800 text-right">{empresaSelecionada}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total de Registros:</span>
                    <span className="font-bold text-slate-800">{estatisticas.totalRegistros}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Diferença Total:</span>
                    <span className={`font-bold ${estatisticas.diferencaTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatarMoeda(estatisticas.diferencaTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de resultados */}
            {!isLoading && dadosAgrupados && dadosAgrupados.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 pb-4 border-b-2 border-blue-500 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                  Diferenças de Faturamento por Período
                </h3>
                <div className="overflow-x-auto rounded-xl shadow-lg">
                  <table className="w-full bg-white text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                        <th className="px-4 py-4 text-left font-semibold uppercase tracking-wider">Mês/Ano</th>
                        <th className="px-4 py-4 text-right font-semibold uppercase tracking-wider">Volume Total (m³)</th>
                        <th className="px-4 py-4 text-right font-semibold uppercase tracking-wider">Valor Cobrado</th>
                        <th className="px-4 py-4 text-right font-semibold uppercase tracking-wider">Valor Regulatório</th>
                        <th className="px-4 py-4 text-right font-semibold uppercase tracking-wider">Diferença Devida</th>
                        <th className="px-4 py-4 text-right font-semibold uppercase tracking-wider">Diferença (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosAgrupados.map((item, index) => {
                        const diferencaPercentual = item.Valor_Regulatorio_Total > 0 
                          ? ((item.Diferenca_Total / item.Valor_Regulatorio_Total) * 100) 
                          : 0;
                        
                        const isPositive = item.Diferenca_Total > 0;
                        const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                        
                        return (
                          <tr key={item.Mes_Ano} className={`${rowClass} hover:bg-blue-50 transition-colors duration-200`}>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {item.Mes_Ano}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatarNumero(item.Volume_Total_m3)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatarMoeda(item.Valor_Total_Cobrado)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatarMoeda(item.Valor_Regulatorio_Total)}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                              {formatarMoeda(item.Diferenca_Total)}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                              {formatarPercentual(diferencaPercentual)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sem dados */}
            {!isLoading && empresaSelecionada && (!dadosAgrupados || dadosAgrupados.length === 0) && (
              <div className="text-center p-12 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Calculator className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <p className="text-xl text-yellow-800">
                  Nenhum dado encontrado para a empresa selecionada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 bg-slate-800 text-white text-center p-6 rounded-2xl">
          <p className="text-sm opacity-90">
            &copy; 2024 Sistema de Análise de Faturamento - Desenvolvido para análise de diferenças tarifárias
          </p>
        </div>
      </div>
    </div>
  );
}
