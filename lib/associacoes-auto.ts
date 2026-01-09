import { supabase } from './supabase'
import { Funcionario, Associacao } from '@/types/database.types'
import { getNumberConfig } from './config'

// Gerar associações para todos os funcionários ativos do mês/ano atual
export async function gerarAssociacoesMensais(
  ano?: number,
  mes?: number
): Promise<{ success: boolean; criadas: number; errors: string[] }> {
  try {
    const hoje = new Date()
    const anoAtual = ano || hoje.getFullYear()
    const mesAtual = mes || hoje.getMonth() + 1

    // Buscar valor padrão da mensalidade
    const valorPadrao = await getNumberConfig('valor_mensalidade_padrao')

    // Buscar todos os funcionários ativos
    const { data: funcionarios, error: funcError } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('status', 'ativo')

    if (funcError) throw funcError

    if (!funcionarios || funcionarios.length === 0) {
      return { success: true, criadas: 0, errors: [] }
    }

    // Verificar quais funcionários já têm associação para o mês/ano
    const { data: associacoesExistentes, error: assocError } = await supabase
      .from('associacoes')
      .select('funcionario_id')
      .eq('ano', anoAtual)
      .eq('mes', mesAtual)

    if (assocError) throw assocError

    const idsComAssociacao = new Set(
      associacoesExistentes?.map((a) => a.funcionario_id) || []
    )

    // Filtrar funcionários que ainda não têm associação
    const funcionariosParaCriar = funcionarios.filter(
      (f) => !idsComAssociacao.has(f.id)
    )

    if (funcionariosParaCriar.length === 0) {
      return { success: true, criadas: 0, errors: ['Todas as associações já foram criadas'] }
    }

    // Criar associações em lote
    const novasAssociacoes = funcionariosParaCriar.map((func) => ({
      funcionario_id: func.id,
      ano: anoAtual,
      mes: mesAtual,
      valor_mensalidade: valorPadrao,
      pago: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('associacoes')
      .insert(novasAssociacoes)
      .select()

    if (error) throw error

    return {
      success: true,
      criadas: data?.length || 0,
      errors: [],
    }
  } catch (error) {
    console.error('Erro ao gerar associações:', error)
    return {
      success: false,
      criadas: 0,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
    }
  }
}

// Gerar associações para múltiplos meses
export async function gerarAssociacoesPeriodo(
  anoInicio: number,
  mesInicio: number,
  anoFim: number,
  mesFim: number
): Promise<{ success: boolean; criadas: number; errors: string[] }> {
  let totalCriadas = 0
  const errors: string[] = []

  let anoAtual = anoInicio
  let mesAtual = mesInicio

  while (
    anoAtual < anoFim ||
    (anoAtual === anoFim && mesAtual <= mesFim)
  ) {
    const result = await gerarAssociacoesMensais(anoAtual, mesAtual)
    totalCriadas += result.criadas
    errors.push(...result.errors)

    // Avançar para o próximo mês
    mesAtual++
    if (mesAtual > 12) {
      mesAtual = 1
      anoAtual++
    }
  }

  return {
    success: errors.length === 0,
    criadas: totalCriadas,
    errors,
  }
}

// Verificar se já existe associação para funcionário no mês/ano
export async function verificarAssociacaoExistente(
  funcionarioId: string,
  ano: number,
  mes: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('associacoes')
      .select('id')
      .eq('funcionario_id', funcionarioId)
      .eq('ano', ano)
      .eq('mes', mes)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Erro ao verificar associação:', error)
    return false
  }
}
