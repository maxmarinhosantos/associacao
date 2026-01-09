'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Funcionario, Associacao } from '@/types/database.types'
import { Users, DollarSign, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { getErrorMessage } from '@/lib/utils'
import {
  EvolucaoPagamentosChart,
  ReceitaMensalChart,
  StatusDistribuicaoChart,
  ComparativoAnualChart,
  FuncionariosStatusChart,
} from '@/components/Charts'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFuncionarios: 0,
    funcionariosAtivos: 0,
    associacoesPagas: 0,
    associacoesPendentes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({
    evolucaoMensal: [] as any[],
    receitaMensal: [] as any[],
    statusDistribuicao: [] as any[],
    comparativoAnual: [] as any[],
    funcionariosStatus: [] as any[],
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Buscar funcionários
      const { data: funcionarios, error: funcError } = await supabase
        .from('funcionarios')
        .select('*')

      if (funcError) throw funcError

      // Buscar associações do mês atual
      const hoje = new Date()
      const { data: associacoesMesAtual, error: assocError } = await supabase
        .from('associacoes')
        .select('*')
        .eq('ano', hoje.getFullYear())
        .eq('mes', hoje.getMonth() + 1)

      if (assocError) throw assocError

      // Buscar todas as associações dos últimos 6 meses
      const { data: associacoesRecentes, error: assocRecentesError } = await supabase
        .from('associacoes')
        .select('*')
        .eq('ano', hoje.getFullYear())
        .gte('mes', hoje.getMonth() - 5)
        .order('mes', { ascending: true })

      if (assocRecentesError) throw assocRecentesError

      // Buscar associações dos últimos 3 anos para comparativo
      const { data: associacoesAnuais, error: assocAnuaisError } = await supabase
        .from('associacoes')
        .select('*')
        .gte('ano', hoje.getFullYear() - 2)
        .order('ano', { ascending: true })

      if (assocAnuaisError) throw assocAnuaisError

      setStats({
        totalFuncionarios: funcionarios?.length || 0,
        funcionariosAtivos:
          funcionarios?.filter((f) => f.status === 'ativo').length || 0,
        associacoesPagas: associacoesMesAtual?.filter((a) => a.pago).length || 0,
        associacoesPendentes: associacoesMesAtual?.filter((a) => !a.pago).length || 0,
      })

      // Preparar dados para gráficos
      const meses = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ]

      // Evolução mensal (últimos 6 meses)
      const evolucaoMensal: any[] = []
      for (let i = 5; i >= 0; i--) {
        const mesRef = hoje.getMonth() - i
        const mesNumero = mesRef < 0 ? mesRef + 12 : mesRef
        const mesAssociacoes = associacoesRecentes?.filter(
          (a) => a.mes === mesNumero + 1
        ) || []
        evolucaoMensal.push({
          mes: meses[mesNumero],
          pagas: mesAssociacoes.filter((a) => a.pago).length,
          pendentes: mesAssociacoes.filter((a) => !a.pago).length,
        })
      }

      // Receita mensal
      const receitaMensal: any[] = []
      for (let i = 5; i >= 0; i--) {
        const mesRef = hoje.getMonth() - i
        const mesNumero = mesRef < 0 ? mesRef + 12 : mesRef
        const mesAssociacoes = associacoesRecentes?.filter(
          (a) => a.mes === mesNumero + 1
        ) || []
        receitaMensal.push({
          mes: meses[mesNumero],
          recebido: mesAssociacoes
            .filter((a) => a.pago)
            .reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0),
          pendente: mesAssociacoes
            .filter((a) => !a.pago)
            .reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0),
        })
      }

      // Distribuição de status (mês atual)
      const statusDistribuicao = [
        {
          name: 'Pagas',
          value: associacoesMesAtual?.filter((a) => a.pago).length || 0,
        },
        {
          name: 'Pendentes',
          value: associacoesMesAtual?.filter((a) => !a.pago).length || 0,
        },
      ]

      // Comparativo anual
      const anos = [...new Set(associacoesAnuais?.map((a) => a.ano) || [])]
      const comparativoAnual = anos.map((ano) => {
        const anoAssociacoes = associacoesAnuais?.filter((a) => a.ano === ano) || []
        return {
          ano: ano.toString(),
          total: anoAssociacoes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0),
          recebido: anoAssociacoes
            .filter((a) => a.pago)
            .reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0),
        }
      })

      // Funcionários por status
      const funcionariosStatus = [
        {
          name: 'Ativos',
          value: funcionarios?.filter((f) => f.status === 'ativo').length || 0,
        },
        {
          name: 'Inativos',
          value: funcionarios?.filter((f) => f.status === 'inativo').length || 0,
        },
        {
          name: 'Suspensos',
          value: funcionarios?.filter((f) => f.status === 'suspenso').length || 0,
        },
      ]

      setChartData({
        evolucaoMensal,
        receitaMensal,
        statusDistribuicao: statusDistribuicao.filter((item) => item.value > 0),
        comparativoAnual,
        funcionariosStatus: funcionariosStatus.filter((item) => item.value > 0),
      })
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar estatísticas:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total de Funcionários"
                value={stats.totalFuncionarios}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Funcionários Ativos"
                value={stats.funcionariosAtivos}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Associações Pagas"
                value={stats.associacoesPagas}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Associações Pendentes"
                value={stats.associacoesPendentes}
                icon={XCircle}
                color="red"
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Evolução de Pagamentos */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="text-primary-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Evolução de Pagamentos (Últimos 6 Meses)
                  </h2>
                </div>
                {chartData.evolucaoMensal.length > 0 ? (
                  <EvolucaoPagamentosChart data={chartData.evolucaoMensal} />
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
                )}
              </div>

              {/* Distribuição de Status */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="text-primary-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Status das Associações (Mês Atual)
                  </h2>
                </div>
                {chartData.statusDistribuicao.length > 0 ? (
                  <StatusDistribuicaoChart data={chartData.statusDistribuicao} />
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
                )}
              </div>

              {/* Receita Mensal */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="text-primary-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Receita Mensal (Últimos 6 Meses)
                  </h2>
                </div>
                {chartData.receitaMensal.length > 0 ? (
                  <ReceitaMensalChart data={chartData.receitaMensal} />
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
                )}
              </div>

              {/* Funcionários por Status */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="text-primary-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Distribuição de Funcionários
                  </h2>
                </div>
                {chartData.funcionariosStatus.length > 0 ? (
                  <FuncionariosStatusChart data={chartData.funcionariosStatus} />
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
                )}
              </div>
            </div>

            {/* Comparativo Anual */}
            {chartData.comparativoAnual.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="text-primary-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Comparativo Anual
                  </h2>
                </div>
                <ComparativoAnualChart data={chartData.comparativoAnual} />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: any
  color: 'blue' | 'green' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
