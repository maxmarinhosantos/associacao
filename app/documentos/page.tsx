'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Funcionario, Documento } from '@/types/database.types'
import { Plus, Upload, Download, Trash2, FileText, Search, X } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Pagination } from '@/components/Pagination'
import { getErrorMessage, formatCPF } from '@/lib/utils'
import { uploadFile, deleteFile, formatFileSize } from '@/lib/storage'
import { format } from 'date-fns'

const BUCKET_NAME = 'documentos'

const tiposDocumento = [
  { value: 'identidade', label: 'Identidade' },
  { value: 'cpf', label: 'CPF' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'carteirinha', label: 'Carteirinha' },
  { value: 'outro', label: 'Outro' },
]

export default function DocumentosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [documentos, setDocumentos] = useState<(Documento & { funcionario: Funcionario })[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; documento: Documento | null }>({
    isOpen: false,
    documento: null,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
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

      // Carregar documentos
      await loadDocumentos()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar dados:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadDocumentos() {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*, funcionarios(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocumentos((data as any) || [])
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar documentos:', error)
      showToast(errorMsg, 'error')
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.documento) return

    try {
      // Deletar arquivo do storage
      // Extrair o caminho do arquivo da URL
      const url = new URL(deleteConfirm.documento.arquivo_url)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex((part) => part === BUCKET_NAME)
      const filePath = pathParts.slice(bucketIndex + 1).join('/')
      
      await deleteFile(BUCKET_NAME, filePath)

      // Deletar registro do banco
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', deleteConfirm.documento.id)

      if (error) throw error

      showToast('Documento excluído com sucesso!', 'success')
      loadDocumentos()
      setDeleteConfirm({ isOpen: false, documento: null })
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao excluir documento:', error)
      showToast(errorMsg, 'error')
    }
  }

  const filteredDocumentos = documentos.filter((doc) => {
    const matchSearch =
      doc.funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchTipo = filtroTipo === 'todos' || doc.tipo === filtroTipo

    return matchSearch && matchTipo
  })

  const totalPages = Math.ceil(filteredDocumentos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocumentos = filteredDocumentos.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filtroTipo])

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <button
            onClick={() => {
              setSelectedFuncionario(null)
              setShowUploadModal(true)
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Documento</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por funcionário, nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos os Tipos</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
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
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDocumentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhum documento encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedDocumentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.funcionario?.nome || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCPF(doc.funcionario?.cpf || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{doc.nome}</div>
                        {doc.descricao && (
                          <div className="text-sm text-gray-500">{doc.descricao}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {tiposDocumento.find((t) => t.value === doc.tipo)?.label || doc.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {doc.arquivo_tamanho ? formatFileSize(doc.arquivo_tamanho) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={doc.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <FileText size={18} />
                          </a>
                          <a
                            href={doc.arquivo_url}
                            download
                            className="text-green-600 hover:text-green-900"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, documento: doc })}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredDocumentos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredDocumentos.length}
              />
            )}
          </div>
        )}

        {/* Modal de Upload */}
        {showUploadModal && (
          <UploadDocumentoModal
            funcionarios={funcionarios}
            selectedFuncionario={selectedFuncionario}
            onClose={() => {
              setShowUploadModal(false)
              setSelectedFuncionario(null)
            }}
            onUpload={() => {
              loadDocumentos()
              setShowUploadModal(false)
              setSelectedFuncionario(null)
            }}
          />
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, documento: null })}
          onConfirm={handleDelete}
          title="Excluir Documento"
          message={`Tem certeza que deseja excluir o documento "${deleteConfirm.documento?.nome}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </div>
    </Layout>
  )
}

function UploadDocumentoModal({
  funcionarios,
  selectedFuncionario,
  onClose,
  onUpload,
}: {
  funcionarios: Funcionario[]
  selectedFuncionario: Funcionario | null
  onClose: () => void
  onUpload: () => void
}) {
  const [formData, setFormData] = useState({
    funcionario_id: selectedFuncionario?.id || '',
    nome: '',
    tipo: 'outro' as Documento['tipo'],
    descricao: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      showToast('Selecione um arquivo', 'error')
      return
    }

    if (!formData.funcionario_id) {
      showToast('Selecione um funcionário', 'error')
      return
    }

    setUploading(true)

    try {
      // Upload do arquivo
      const funcionario = funcionarios.find((f) => f.id === formData.funcionario_id)
      const path = `funcionario-${formData.funcionario_id}`
      const { url, error: uploadError } = await uploadFile(file, BUCKET_NAME, path)

      if (uploadError) throw uploadError
      if (!url) throw new Error('Erro ao fazer upload do arquivo')

      // Criar registro no banco
      const { error: dbError } = await supabase.from('documentos').insert([
        {
          funcionario_id: formData.funcionario_id,
          nome: formData.nome || file.name,
          tipo: formData.tipo,
          descricao: formData.descricao || null,
          arquivo_url: url,
          arquivo_nome: file.name,
          arquivo_tamanho: file.size,
          created_at: new Date().toISOString(),
        },
      ])

      if (dbError) throw dbError

      showToast('Documento enviado com sucesso!', 'success')
      onUpload()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao enviar documento:', error)
      showToast(errorMsg, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Novo Documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
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
                  {func.nome} - {formatCPF(func.cpf)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              required
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Documento['tipo'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {tiposDocumento.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Documento
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Deixe em branco para usar o nome do arquivo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                    <span>Selecione um arquivo</span>
                    <input
                      type="file"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                {file && (
                  <p className="text-xs text-gray-500 mt-2">
                    {file.name} ({formatFileSize(file.size)})
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  PDF, JPG, PNG, DOC, DOCX até 10MB
                </p>
              </div>
            </div>
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
              disabled={uploading || !file}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
