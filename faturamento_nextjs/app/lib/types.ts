
import { type RegistroFaturamento } from './data';

export interface DadosAgrupados {
  Mes_Ano: string;
  Volume_Total_m3: number;
  Valor_Total_Cobrado: number;
  Valor_Regulatorio_Total: number;
  Diferenca_Total: number;
  Ano: string;
  Tarifa_Regulatoria: number;
  registros: RegistroFaturamento[];
}

export interface EstatisticasEmpresa {
  totalRegistros: number;
  diferencaTotal: number;
}

export interface FaturamentoAppProps {
  // Props podem ser adicionadas aqui se necessário
}
