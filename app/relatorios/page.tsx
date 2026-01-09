'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Funcionario, Associacao } from '@/types/database.types'
import {
  FileText,
  Download,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  generateFuncionariosPDF,
  generateAssociacoesPDF,
  generateInadimplenciaPDF,
  generateRelatorioFinanceiroPDF,
  exportFuncionariosExcel,
  exportAssociacoesExcel,
} from '@/lib/reports'
import { useToast } from '@/components/Toast'

interface AssociacaoComFuncionario extends Associacao {
  funcionario: Funcionario
}

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export default function RelatoriosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [associacoes, setAssociacoes] = useState<AssociacaoComFuncionario[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Carregar funcionários
      const { data: funcData, error: funcError } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true })

      if (funcError) throw funcError
      setFuncionarios(funcData || [])

      // Carregar associações
      const { data: assocData, error: assocError } = await supabase
        .from('associacoes')
        .select('*, funcionarios(*)')
        .eq('ano', filtroAno)
        .eq('mes', filtroMes)

      if (assocError) throw assocError
      setAssociacoes((assocData as any) || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showToast('Erro ao carregar dados para relatórios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssociacoes()
  }, [filtroAno, filtroMes])

  async function loadAssociacoes() {
    try {
      const { data, error } = await supabase
        .from('associacoes')
        .select('*, funcionarios(*)')
        .eq('ano', filtroAno)
        .eq('mes', filtroMes)

      if (error) throw error
      setAssociacoes((data as any) || [])
    } catch (error) {
      console.error('Erro ao carregar associações:', error)
    }
  }

  const handleGeneratePDF = (type: string) => {
    try {
      const periodo = { ano: filtroAno, mes: filtroMes }
      
      switch (type) {
        case 'funcionarios':
          generateFuncionariosPDF(funcionarios)
          showToast('Relatório de funcionários gerado com sucesso!', 'success')
          break
        case 'associacoes':
          generateAssociacoesPDF(associacoes, periodo)
          showToast('Relatório de associações gerado com sucesso!', 'success')
          break
        case 'inadimplencia':
          generateInadimplenciaPDF(associacoes, periodo)
          showToast('Relatório de inadimplência gerado com sucesso!', 'success')
          break
        case 'financeiro':
          generateRelatorioFinanceiroPDF(associacoes, periodo)
          showToast('Relatório financeiro gerado com sucesso!', 'success')
          break
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      showToast('Erro ao gerar relatório', 'error')
    }
  }

  const handleExportExcel = (type: string) => {
    try {
      const periodo = { ano: filtroAno, mes: filtroMes }
      
      switch (type) {
        case 'funcionarios':
          exportFuncionariosExcel(funcionarios)
          showToast('Planilha de funcionários exportada com sucesso!', 'success')
          break
        case 'associacoes':
          exportAssociacoesExcel(associacoes, periodo)
          showToast('Planilha de associações exportada com sucesso!', 'success')
          break
      }
    } catch (error) {
      console.error('Erro ao exportar planilha:', error)
      showToast('Erro ao exportar planilha', 'error')
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Relatórios</h1>

        {/* Filtros de Período */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filtro de Período (para associações)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(
                  (ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês
              </label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {meses.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Relatório de Funcionários */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Funcionários
                </h3>
                <p className="text-sm text-gray-500">
                  {funcionarios.length} cadastrados
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleGeneratePDF('funcionarios')}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <Download size={18} />
                <span>Gerar PDF</span>
              </button>
              <button
                onClick={() => handleExportExcel('funcionarios')}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FileSpreadsheet size={18} />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Relatório de Associações */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Associações
                </h3>
                <p className="text-sm text-gray-500">
                  {meses[filtroMes - 1]}/{filtroAno}
                </p>
                <p className="text-sm text-gray-500">
                  {associacoes.length} registros
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleGeneratePDF('associacoes')}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <Download size={18} />
                <span>Gerar PDF</span>
              </button>
              <button
                onClick={() => handleExportExcel('associacoes')}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FileSpreadsheet size={18} />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Relatório de Inadimplência */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Inadimplência
                </h3>
                <p className="text-sm text-gray-500">
                  {meses[filtroMes - 1]}/{filtroAno}
                </p>
                <p className="text-sm text-red-600 font-semibold">
                  {associacoes.filter((a) => !a.pago).length} pendentes
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGeneratePDF('inadimplencia')}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <Download size={18} />
              <span>Gerar PDF</span>
            </button>
          </div>

          {/* Relatório Financeiro */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Financeiro Completo
                </h3>
                <p className="text-sm text-gray-500">
                  {meses[filtroMes - 1]}/{filtroAno}
                </p>
                <p className="text-sm text-gray-500">
                  Resumo financeiro detalhado
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGeneratePDF('financeiro')}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              <Download size={18} />
              <span>Gerar PDF</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">Gerando relatório...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
