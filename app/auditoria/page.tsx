'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { AuditoriaLog } from '@/types/database.types'
import { History, Search, Filter, Eye, X } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { getErrorMessage } from '@/lib/utils'
import { format } from 'date-fns'

const acoesLabels: { [key: string]: string } = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  VIEW: 'Visualização',
  EXPORT: 'Exportação',
  EMAIL: 'Envio de Email',
}

const acoesColors: { [key: string]: string } = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-purple-100 text-purple-800',
  EMAIL: 'bg-yellow-100 text-yellow-800',
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroAcao, setFiltroAcao] = useState<string>('todos')
  const [filtroTabela, setFiltroTabela] = useState<string>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('auditoria_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000) // Limitar a 1000 logs mais recentes

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar logs:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tabela?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchAcao = filtroAcao === 'todos' || log.acao === filtroAcao
    const matchTabela = filtroTabela === 'todos' || log.tabela === filtroTabela

    return matchSearch && matchAcao && matchTabela
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  // Obter listas únicas para filtros
  const acoesUnicas = Array.from(new Set(logs.map((l) => l.acao))).sort()
  const tabelasUnicas = Array.from(new Set(logs.map((l) => l.tabela))).sort()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filtroAcao, filtroTabela])

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <History className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Auditoria e Logs</h1>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por usuário, tabela ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ação
              </label>
              <select
                value={filtroAcao}
                onChange={(e) => setFiltroAcao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todas as Ações</option>
                {acoesUnicas.map((acao) => (
                  <option key={acao} value={acao}>
                    {acoesLabels[acao] || acao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tabela
              </label>
              <select
                value={filtroTabela}
                onChange={(e) => setFiltroTabela(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todas as Tabelas</option>
                {tabelasUnicas.map((tabela) => (
                  <option key={tabela} value={tabela}>
                    {tabela}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de logs */}
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
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabela
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Nenhum log encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(log.created_at), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.usuario_email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            acoesColors[log.acao] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {acoesLabels[log.acao] || log.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.tabela}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono text-xs">
                          {log.registro_id?.substring(0, 8) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredLogs.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredLogs.length}
              />
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedLog && (
          <LogDetailsModal
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>
    </Layout>
  )
}

function LogDetailsModal({
  log,
  onClose,
}: {
  log: AuditoriaLog
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data/Hora
              </label>
              <p className="text-sm text-gray-900">
                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <p className="text-sm text-gray-900">{log.usuario_email || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação
              </label>
              <p className="text-sm text-gray-900">
                {acoesLabels[log.acao] || log.acao}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tabela
              </label>
              <p className="text-sm text-gray-900">{log.tabela}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registro ID
              </label>
              <p className="text-sm text-gray-900 font-mono">{log.registro_id || 'N/A'}</p>
            </div>

            {log.ip_address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address
                </label>
                <p className="text-sm text-gray-900">{log.ip_address}</p>
              </div>
            )}
          </div>

          {log.dados_anteriores && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dados Anteriores
              </label>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(log.dados_anteriores, null, 2)}
              </pre>
            </div>
          )}

          {log.dados_novos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dados Novos
              </label>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(log.dados_novos, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
