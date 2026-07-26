export interface FleetRow {
  placa: string;
  mlp: string;
  regional: string;
  svc: string;
  statusVec: string;
  statusVeiculo: string;
  statusAgendamento: string;
  diasOffline: number | null;
  ultimaComunicacao: string;
  estado: string;
  endereco: string;
  ticket: string;
  status: string;
  statusDetalhado: string;
  dataAgendamentoInicial: string;
  dataReagendamento: string;
  qtdReagendamentos: number | null;
  dataComunicacao: string;
  dataHoraOffline: string;
  os: string;
  reincidente: number | null;
  observacoes: string;
  visibilidadeDash: string;
}

export interface TicketRow {
  placa: string;
  statusGeotab: string;
  temChamado: string;
  qtdChamados: number | null;
  chamadoPrincipal: string;
  abertoEm: string;
  ultimaAcao: string;
  diasDesdeUltimaAcao: number | null;
  situacao: string;
  prioridadeGuerra: string;
  acaoSugerida: string;
  cliente: string;
  clienteOrigem: string;
  responsavel: string;
  statusOriginal: string;
  statusNorm: string;
  justificativa: string;
}

export interface ActionableRow {
  placa: string;
  cliente: string;
  regional: string;
  statusVec: string;
  diasOffline: number | null;
  temChamado: string;
  prioridadeGuerra: string;
  situacao: string;
  responsavel: string;
  acaoSugerida: string;
}
