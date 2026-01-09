export interface Funcionario {
  id: string
  nome: string
  cpf: string
  email: string
  telefone?: string
  cargo?: string
  data_admissao?: string
  data_adesao?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Associacao {
  id: string
  funcionario_id: string
  ano: number
  mes: number
  valor_mensalidade?: number
  pago: boolean
  data_pagamento?: string
  created_at: string
  updated_at: string
}

export interface Documento {
  id: string
  funcionario_id: string
  nome: string
  tipo: 'identidade' | 'cpf' | 'comprovante' | 'carteirinha' | 'outro'
  descricao?: string
  arquivo_url: string
  arquivo_nome: string
  arquivo_tamanho?: number
  created_at: string
  created_by?: string
}

export interface AuditoriaLog {
  id: string
  usuario_id?: string
  usuario_email?: string
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'EMAIL'
  tabela: string
  registro_id?: string
  dados_anteriores?: any
  dados_novos?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Configuracao {
  id: string
  chave: string
  valor: string
  tipo: 'text' | 'number' | 'boolean' | 'json'
  categoria: string
  descricao?: string
  somente_admin: boolean
  created_at: string
  updated_at: string
}
