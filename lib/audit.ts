import { supabase } from './supabase'
import { useAuth } from './auth-context'

// Registrar ação manual na auditoria
export async function logAuditAction(
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'EMAIL',
  tabela: string,
  registroId?: string,
  dadosAnteriores?: any,
  dadosNovos?: any
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('auditoria_logs').insert([
      {
        usuario_id: user?.id || null,
        usuario_email: user?.email || null,
        acao,
        tabela,
        registro_id: registroId || null,
        dados_anteriores: dadosAnteriores || null,
        dados_novos: dadosNovos || null,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error)
    }

    return { data, error }
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
    return { data: null, error }
  }
}
