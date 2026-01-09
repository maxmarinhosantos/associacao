'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Associacao, Funcionario } from '@/types/database.types'
import { Plus, Check, X, Calendar, FileText, Receipt, Play } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { getErrorMessage } from '@/lib/utils'
import { generateReciboPDF, generateComprovantePDF } from '@/lib/receipts'

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

export default function AssociacoesPage() {
  const [associacoes, setAssociacoes] = useState<AssociacaoComFuncionario[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAssociacao, setEditingAssociacao] = useState<AssociacaoComFuncionario | null>(null)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [advancedFilters, setAdvancedFilters] = useState<{
    statusPagamento?: string
    valorMin?: string
    valorMax?: string
  }>({})
  const { showToast } = useToast()

  useEffect(() => {
    loadFuncionarios()
    loadAssociacoes()
  }, [filtroAno, filtroMes])

  async function loadFuncionarios() {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('status', 'ativo')
        .order('nome', { ascending: true })

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  async function loadAssociacoes() {
    try {
      const { data, error } = await supabase
        .from('associacoes')
        .select('*, funcionarios(*)')
        .eq('ano', filtroAno)
        .eq('mes', filtroMes)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssociacoes((data as any) || [])
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar associações:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePagamento(associacao: AssociacaoComFuncionario) {
    try {
      const { error } = await supabase
        .from('associacoes')
        .update({
          pago: !associacao.pago,
          data_pagamento: !associacao.pago ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', associacao.id)

      if (error) throw error
      showToast(
        associacao.pago
          ? 'Pagamento marcado como pendente'
          : 'Pagamento marcado como pago',
        'success'
      )
      loadAssociacoes()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao atualizar pagamento:', error)
      showToast(errorMsg, 'error')
    }
  }

  const filteredAssociacoes = associacoes.filter((a) => {
    const matchesStatus =
      !advancedFilters.statusPagamento ||
      (advancedFilters.statusPagamento === 'pago' && a.pago) ||
      (advancedFilters.statusPagamento === 'pendente' && !a.pago)

    let matchesValor = true
    if (advancedFilters.valorMin) {
      const valorMin = parseFloat(advancedFilters.valorMin)
      if (!a.valor_mensalidade || a.valor_mensalidade < valorMin) {
        matchesValor = false
      }
    }
    if (advancedFilters.valorMax) {
      const valorMax = parseFloat(advancedFilters.valorMax)
      if (!a.valor_mensalidade || a.valor_mensalidade > valorMax) {
        matchesValor = false
      }
    }

    return matchesStatus && matchesValor
  })

  const statusPagamentoOptions = [
    { label: 'Pago', value: 'pago' },
    { label: 'Pendente', value: 'pendente' },
  ]

  // Paginação
  const totalPages = Math.ceil(filteredAssociacoes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAssociacoes = filteredAssociacoes.slice(startIndex, endIndex)

  // Resetar página quando filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [filtroAno, filtroMes])

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Associações</h1>
          <div className="flex space-x-3">
            <Link
              href="/associacoes/gerar-auto"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Play size={20} />
              <span>Gerar Automático</span>
            </Link>
            <button
              onClick={() => {
                setEditingAssociacao(null)
                setShowModal(true)
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Nova Associação</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
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

            <div className="flex items-end">
              <div className="w-full">
                <div className="text-sm text-gray-600">
                  Total: {filteredAssociacoes.length} | Pagas:{' '}
                  {filteredAssociacoes.filter((a) => a.pago).length} | Pendentes:{' '}
                  {filteredAssociacoes.filter((a) => !a.pago).length}
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Avançados */}
          <AdvancedFilters
            filters={advancedFilters}
            onFilterChange={setAdvancedFilters}
            onClear={() => setAdvancedFilters({})}
            statusOptions={statusPagamentoOptions}
            cargoOptions={[]}
            showStatus={true}
            showCargo={false}
            showDateRange={false}
          >
            {/* Filtros adicionais de valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Mínimo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={advancedFilters.valorMin || ''}
                  onChange={(e) =>
                    setAdvancedFilters({ ...advancedFilters, valorMin: e.target.value || undefined })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Máximo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={advancedFilters.valorMax || ''}
                  onChange={(e) =>
                    setAdvancedFilters({ ...advancedFilters, valorMax: e.target.value || undefined })
                  }
                  placeholder="9999.99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </AdvancedFilters>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Mensalidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAssociacoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma associação encontrada para este período
                    </td>
                  </tr>
                ) : (
                  paginatedAssociacoes.map((associacao) => (
                    <tr key={associacao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {associacao.funcionario?.nome || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {associacao.funcionario?.cpf || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {associacao.valor_mensalidade
                            ? `R$ ${associacao.valor_mensalidade.toFixed(2).replace('.', ',')}`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            associacao.pago
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {associacao.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {associacao.data_pagamento
                            ? format(new Date(associacao.data_pagamento), 'dd/MM/yyyy')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTogglePagamento(associacao)}
                            className={`flex items-center space-x-1 ${
                              associacao.pago
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {associacao.pago ? (
                              <>
                                <X size={18} />
                                <span>Pendente</span>
                              </>
                            ) : (
                              <>
                                <Check size={18} />
                                <span>Pago</span>
                              </>
                            )}
                          </button>
                          {associacao.pago && (
                            <>
                              <button
                                onClick={() => {
                                  const numeroRecibo = `REC-${associacao.id.substring(0, 8).toUpperCase()}`
                                  generateReciboPDF(associacao, numeroRecibo)
                                  showToast('Recibo gerado com sucesso!', 'success')
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Gerar Recibo"
                              >
                                <Receipt size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  generateComprovantePDF(associacao)
                                  showToast('Comprovante gerado com sucesso!', 'success')
                                }}
                                className="text-purple-600 hover:text-purple-900"
                                title="Gerar Comprovante"
                              >
                                <FileText size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredAssociacoes.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredAssociacoes.length}
              />
            )}
          </div>
        )}

        {showModal && (
          <AssociacaoModal
            associacao={editingAssociacao}
            funcionarios={funcionarios}
            anoInicial={filtroAno}
            mesInicial={filtroMes}
            onClose={() => {
              setShowModal(false)
              setEditingAssociacao(null)
            }}
            onSave={() => {
              loadAssociacoes()
              setShowModal(false)
              setEditingAssociacao(null)
            }}
          />
        )}
      </div>
    </Layout>
  )
}

function AssociacaoModal({
  associacao,
  funcionarios,
  anoInicial,
  mesInicial,
  onClose,
  onSave,
}: {
  associacao: AssociacaoComFuncionario | null
  funcionarios: Funcionario[]
  anoInicial: number
  mesInicial: number
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    funcionario_id: associacao?.funcionario_id || '',
    ano: associacao?.ano || anoInicial,
    mes: associacao?.mes || mesInicial,
    valor_mensalidade: associacao?.valor_mensalidade || 0,
    pago: associacao?.pago || false,
    data_pagamento: associacao?.data_pagamento
      ? new Date(associacao.data_pagamento).toISOString().split('T')[0]
      : '',
  })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (associacao) {
        // Atualizar
        const { error } = await supabase
          .from('associacoes')
          .update({
            ...formData,
            data_pagamento: formData.data_pagamento || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', associacao.id)

        if (error) throw error
        showToast('Associação atualizada com sucesso!', 'success')
      } else {
        // Criar
        const { error } = await supabase.from('associacoes').insert([
          {
            ...formData,
            data_pagamento: formData.data_pagamento || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
        showToast('Associação criada com sucesso!', 'success')
      }

      onSave()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao salvar associação:', error)
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {associacao ? 'Editar Associação' : 'Nova Associação'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funcionário *
              </label>
              <select
                required
                value={formData.funcionario_id}
                onChange={(e) => setFormData({ ...formData, funcionario_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Selecione um funcionário</option>
                {funcionarios.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.nome} - {func.cpf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano *
              </label>
              <input
                type="number"
                required
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mês *
              </label>
              <select
                required
                value={formData.mes}
                onChange={(e) => setFormData({ ...formData, mes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {meses.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Mensalidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_mensalidade}
                onChange={(e) =>
                  setFormData({ ...formData, valor_mensalidade: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status do Pagamento
              </label>
              <select
                value={formData.pago ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData({ ...formData, pago: e.target.value === 'true' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="false">Pendente</option>
                <option value="true">Pago</option>
              </select>
            </div>

            {formData.pago && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
