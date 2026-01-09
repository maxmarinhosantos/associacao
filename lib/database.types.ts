export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      funcionarios: {
        Row: {
          id: string
          nome: string
          cpf: string
          email: string
          telefone: string | null
          cargo: string | null
          data_admissao: string | null
          data_adesao: string | null
          status: 'ativo' | 'inativo' | 'suspenso'
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          email: string
          telefone?: string | null
          cargo?: string | null
          data_admissao?: string | null
          data_adesao?: string | null
          status?: 'ativo' | 'inativo' | 'suspenso'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          email?: string
          telefone?: string | null
          cargo?: string | null
          data_admissao?: string | null
          data_adesao?: string | null
          status?: 'ativo' | 'inativo' | 'suspenso'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      associacoes: {
        Row: {
          id: string
          funcionario_id: string
          ano: number
          mes: number
          valor_mensalidade: number | null
          pago: boolean
          data_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          funcionario_id: string
          ano: number
          mes: number
          valor_mensalidade?: number | null
          pago?: boolean
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          funcionario_id?: string
          ano?: number
          mes?: number
          valor_mensalidade?: number | null
          pago?: boolean
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
