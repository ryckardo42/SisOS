export interface Auditoria {
  id: string;
  user_id: string;
  fiscalizada: string;
  municipio: string | null;
  data_inicio: string | null;
  data_vencimento: string | null;
  ri: string | null;
  os: string | null;
  cnpj: string | null;
  me_epp: boolean;
  acidente_trabalho: boolean;
  embargo_interdicao: string | null;
  historico: string | null;
  status: "em_andamento" | "finalizada";
  created_at: string;
  updated_at: string;
  // Relations (optional, loaded separately)
  dets?: DET[];
  autos?: Auto[];
  atualizacoes?: Atualizacao[];
  pendencias?: Pendencia[];
}

export interface DET {
  id: string;
  auditoria_id: string;
  codigo: string;
  data_notificacao: string | null;
  data_entrega: string | null;
  conferido: boolean;
  created_at: string;
}

export interface Auto {
  id: string;
  auditoria_id: string;
  descricao: string;
  lavrado: boolean;
  created_at: string;
}

export interface Atualizacao {
  id: string;
  auditoria_id: string;
  texto: string;
  created_at: string;
}

export interface Pendencia {
  id: string;
  auditoria_id: string;
  descricao: string;
  realizada: boolean;
  created_at: string;
}
