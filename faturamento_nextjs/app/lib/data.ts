import dadosFaturamentoCompleto from './dados_faturamento.json';

// Dados de faturamento completos - 22,366 registros, 626 empresas
export const dadosFaturamento = dadosFaturamentoCompleto as {
  metadata: {
    total_registros: number;
    empresas_unicas: number;
    periodo_inicio: string;
    periodo_fim: string;
    anos_disponiveis: string[];
    tarifas_regulatorias: {
      "2021": number;
      "2022": number;
      "2023": number;
      "2024": number;
    };
    data_processamento: string;
  };
  dados: {
    Razao_Social: string;
    Mes_Ano: string;
    Volume_Agua_m3: number;
    Valor_Total: number;
    Ano: string;
    Tarifa_Regulatoria: number;
    Valor_Regulatorio: number;
    Diferenca_Valor: number;
    Diferenca_Percentual: number;
  }[];
};

export type FaturamentoData = typeof dadosFaturamento;
export type RegistroFaturamento = {
  Razao_Social: string;
  Mes_Ano: string;
  Volume_Agua_m3: number;
  Valor_Total: number;
  Ano: string;
  Tarifa_Regulatoria: number;
  Valor_Regulatorio: number;
  Diferenca_Valor: number;
  Diferenca_Percentual: number;
};
