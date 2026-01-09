import { supabase } from './supabase'
import { Configuracao } from '@/types/database.types'

// Obter todas as configurações
export async function getAllConfigurations(): Promise<Configuracao[]> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('categoria', { ascending: true })
      .order('chave', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
    return []
  }
}

// Obter configuração por chave
export async function getConfiguration(chave: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', chave)
      .single()

    if (error) throw error
    return data?.valor || null
  } catch (error) {
    console.error(`Erro ao carregar configuração ${chave}:`, error)
    return null
  }
}

// Obter valor numérico
export async function getNumberConfig(chave: string): Promise<number> {
  const valor = await getConfiguration(chave)
  return valor ? parseFloat(valor) : 0
}

// Obter valor booleano
export async function getBooleanConfig(chave: string): Promise<boolean> {
  const valor = await getConfiguration(chave)
  return valor === 'true'
}

// Atualizar configuração
export async function updateConfiguration(
  chave: string,
  valor: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('configuracoes')
      .update({
        valor,
        updated_at: new Date().toISOString(),
      })
      .eq('chave', chave)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    return { success: false, error }
  }
}

// Atualizar múltiplas configurações
export async function updateConfigurations(
  updates: { chave: string; valor: string }[]
): Promise<{ success: boolean; error?: any }> {
  try {
    for (const update of updates) {
      const result = await updateConfiguration(update.chave, update.valor)
      if (!result.success) {
        return result
      }
    }
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return { success: false, error }
  }
}

// Obter configurações agrupadas por categoria
export async function getConfigurationsByCategory(): Promise<{
  [category: string]: Configuracao[]
}> {
  const configs = await getAllConfigurations()
  const grouped: { [category: string]: Configuracao[] } = {}

  configs.forEach((config) => {
    if (!grouped[config.categoria]) {
      grouped[config.categoria] = []
    }
    grouped[config.categoria].push(config)
  })

  return grouped
}
