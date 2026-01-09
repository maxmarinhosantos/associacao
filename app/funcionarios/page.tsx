'use client'

import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Funcionario } from '@/types/database.types'
import { Plus, Edit, Trash2, Search, History, X, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Pagination } from '@/components/Pagination'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { formatCPF, formatPhone, validateCPF, getErrorMessage } from '@/lib/utils'
import { generateExtratoFuncionarioPDF } from '@/lib/receipts'
import { Associacao } from '@/types/database.types'
import { getUserProfile, canEdit, canDelete } from '@/lib/permissions'

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; funcionario: Funcionario | null }>({
    isOpen: false,
    funcionario: null,
  })
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [advancedFilters, setAdvancedFilters] = useState<{
    status?: string
    cargo?: string
    dataInicio?: string
    dataFim?: string
  }>({})
  const [userProfile, setUserProfile] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadFuncionarios()
    loadUserProfile()
  }, [])

  async function loadUserProfile() {
    try {
      const profile = await getUserProfile()
      const perfil = profile?.perfil || null
      setUserProfile(perfil)
      setProfileLoaded(true)
      
      // Se não tem perfil cadastrado, assumir que é operador (comportamento padrão)
      // Se não, usar o perfil real
      if (!perfil) {
        console.log('Perfil não encontrado, assumindo permissões de operador')
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      // Em caso de erro, permitir acesso (assumir operador/admin)
      setUserProfile(null)
      setProfileLoaded(true)
    }
  }
  
  // Mostrar botões se:
  // - Não carregou ainda (mostra por padrão)
  // - Perfil é null (não cadastrado - permite edição por padrão)
  // - Tem permissão (operador ou admin)
  // Esconder apenas se carregou E perfil é visualizador
  const canEditFunc = !profileLoaded || userProfile === null || canEdit(userProfile as any)
  const canDeleteFunc = !profileLoaded || userProfile === null || canDelete(userProfile as any)

  async function loadFuncionarios() {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar funcionários:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.funcionario) return

    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', deleteConfirm.funcionario.id)

      if (error) throw error
      showToast('Funcionário excluído com sucesso!', 'success')
      loadFuncionarios()
      setDeleteConfirm({ isOpen: false, funcionario: null })
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao excluir funcionário:', error)
      showToast(errorMsg, 'error')
    }
  }

  const filteredFuncionarios = funcionarios.filter((f) => {
    // Busca textual
    const matchesSearch =
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtros avançados
    const matchesStatus = !advancedFilters.status || f.status === advancedFilters.status
    const matchesCargo = !advancedFilters.cargo || f.cargo === advancedFilters.cargo

    let matchesDateRange = true
    if (advancedFilters.dataInicio || advancedFilters.dataFim) {
      if (f.data_admissao) {
        const dataAdmissao = new Date(f.data_admissao)
        if (advancedFilters.dataInicio) {
          const dataInicio = new Date(advancedFilters.dataInicio)
          if (dataAdmissao < dataInicio) matchesDateRange = false
        }
        if (advancedFilters.dataFim) {
          const dataFim = new Date(advancedFilters.dataFim)
          if (dataAdmissao > dataFim) matchesDateRange = false
        }
      } else {
        matchesDateRange = false
      }
    }

    return matchesSearch && matchesStatus && matchesCargo && matchesDateRange
  })

  // Obter listas únicas para filtros
  const cargosUnicos = Array.from(
    new Set(funcionarios.map((f) => f.cargo).filter((c) => c))
  ).sort()

  const statusOptions = [
    { label: 'Ativo', value: 'ativo' },
    { label: 'Inativo', value: 'inativo' },
    { label: 'Suspenso', value: 'suspenso' },
  ]

  const cargoOptions = cargosUnicos.map((cargo) => ({
    label: cargo!,
    value: cargo!,
  }))

  // Paginação
  const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFuncionarios = filteredFuncionarios.slice(startIndex, endIndex)

  // Resetar página quando buscar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Funcionários</h1>
          {canEditFunc && (
            <button
              onClick={() => {
                setEditingFuncionario(null)
                setShowModal(true)
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Novo Funcionário</span>
            </button>
          )}
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros Avançados */}
        <AdvancedFilters
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          onClear={() => setAdvancedFilters({})}
          statusOptions={statusOptions}
          cargoOptions={cargoOptions}
          showStatus={true}
          showCargo={true}
          showDateRange={true}
        />

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
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedFuncionarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                    </td>
                  </tr>
                ) : (
                  paginatedFuncionarios.map((funcionario) => (
                    <tr key={funcionario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{funcionario.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatCPF(funcionario.cpf)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{funcionario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{funcionario.cargo || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            funcionario.status === 'ativo'
                              ? 'bg-green-100 text-green-800'
                              : funcionario.status === 'suspenso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {funcionario.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedFuncionario(funcionario)
                              setShowHistoryModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver histórico"
                          >
                            <History size={18} />
                          </button>
                          {canEditFunc && (
                            <button
                              onClick={() => {
                                setEditingFuncionario(funcionario)
                                setShowModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {canDeleteFunc && (
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, funcionario })}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredFuncionarios.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredFuncionarios.length}
              />
            )}
          </div>
        )}

        {showModal && (
          <FuncionarioModal
            funcionario={editingFuncionario}
            onClose={() => {
              setShowModal(false)
              setEditingFuncionario(null)
            }}
            onSave={() => {
              loadFuncionarios()
              setShowModal(false)
              setEditingFuncionario(null)
            }}
          />
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, funcionario: null })}
          onConfirm={handleDelete}
          title="Excluir Funcionário"
          message={`Tem certeza que deseja excluir ${deleteConfirm.funcionario?.nome}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />

        {showHistoryModal && selectedFuncionario && (
          <HistoryModal
            funcionario={selectedFuncionario}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedFuncionario(null)
            }}
          />
        )}
      </div>
    </Layout>
  )
}

function FuncionarioModal({
  funcionario,
  onClose,
  onSave,
}: {
  funcionario: Funcionario | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    nome: funcionario?.nome || '',
    cpf: funcionario?.cpf || '',
    email: funcionario?.email || '',
    telefone: funcionario?.telefone || '',
    cargo: funcionario?.cargo || '',
    data_admissao: funcionario?.data_admissao || '',
    data_adesao: funcionario?.data_adesao || '',
    status: funcionario?.status || 'ativo',
    observacoes: funcionario?.observacoes || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validar CPF
    const cleanCPF = formData.cpf.replace(/\D/g, '')
    if (cleanCPF.length === 11 && !validateCPF(cleanCPF)) {
      setErrors({ cpf: 'CPF inválido' })
      return
    }

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        cpf: cleanCPF,
      }

      if (funcionario) {
        // Atualizar
        const { error } = await supabase
          .from('funcionarios')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', funcionario.id)

        if (error) throw error
        showToast('Funcionário atualizado com sucesso!', 'success')
      } else {
        // Criar
        const { error } = await supabase.from('funcionarios').insert([
          {
            ...dataToSave,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
        showToast('Funcionário criado com sucesso!', 'success')
      }

      onSave()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao salvar funcionário:', error)
      showToast(errorMsg, 'error')
      if (errorMsg.includes('CPF')) {
        setErrors({ cpf: errorMsg })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={formatCPF(formData.cpf)}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value)
                  setFormData({ ...formData, cpf: formatted })
                  if (errors.cpf) setErrors({ ...errors, cpf: '' })
                }}
                maxLength={14}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cpf ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formatPhone(formData.telefone)}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData({ ...formData, telefone: formatted })
                }}
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Admissão
              </label>
              <input
                type="date"
                value={formData.data_admissao}
                onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Adesão
              </label>
              <input
                type="date"
                value={formData.data_adesao}
                onChange={(e) => setFormData({ ...formData, data_adesao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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

function HistoryModal({
  funcionario,
  onClose,
}: {
  funcionario: Funcionario
  onClose: () => void
}) {
  const [associacoes, setAssociacoes] = useState<Associacao[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadHistory()
  }, [funcionario])

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from('associacoes')
        .select('*')
        .eq('funcionario_id', funcionario.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })

      if (error) throw error
      setAssociacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de Associações
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {funcionario.nome} - {formatCPF(funcionario.cpf)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                generateExtratoFuncionarioPDF(funcionario, associacoes)
                showToast('Extrato gerado com sucesso!', 'success')
              }}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              <Download size={18} />
              <span>Gerar Extrato PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : associacoes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma associação encontrada para este funcionário.
            </p>
          ) : (
            <div className="space-y-3">
              {associacoes.map((assoc) => (
                <div
                  key={assoc.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {meses[assoc.mes - 1]} / {assoc.ano}
                    </p>
                    <p className="text-sm text-gray-600">
                      {assoc.valor_mensalidade
                        ? `R$ ${assoc.valor_mensalidade.toFixed(2).replace('.', ',')}`
                        : 'Valor não informado'}
                    </p>
                    {assoc.data_pagamento && (
                      <p className="text-xs text-gray-500 mt-1">
                        Pago em: {format(new Date(assoc.data_pagamento), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assoc.pago
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {assoc.pago ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
