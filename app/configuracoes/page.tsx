'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Configuracao } from '@/types/database.types'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { getErrorMessage } from '@/lib/utils'
import {
  getAllConfigurations,
  updateConfigurations,
  getConfigurationsByCategory,
} from '@/lib/config'
import { getUserProfile, canManageUsers } from '@/lib/permissions'

const categoriasLabels: { [key: string]: string } = {
  geral: 'Geral',
  financeiro: 'Financeiro',
  email: 'Email',
  visual: 'Visual',
  automatizacao: 'Automação',
  notificacoes: 'Notificações',
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<{ [category: string]: Configuracao[] }>({})
  const [editedConfigs, setEditedConfigs] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadConfigs()
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const profile = await getUserProfile()
    setIsAdmin(canManageUsers(profile?.perfil || null))
  }

  async function loadConfigs() {
    setLoading(true)
    try {
      const grouped = await getConfigurationsByCategory()
      setConfigs(grouped)
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar configurações:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleConfigChange(chave: string, valor: string) {
    setEditedConfigs((prev) => ({
      ...prev,
      [chave]: valor,
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = Object.entries(editedConfigs).map(([chave, valor]) => ({
        chave,
        valor,
      }))

      const result = await updateConfigurations(updates)

      if (result.success) {
        showToast('Configurações salvas com sucesso!', 'success')
        setEditedConfigs({})
        await loadConfigs()
      } else {
        throw result.error
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao salvar configurações:', error)
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  function getConfigValue(config: Configuracao): string {
    return editedConfigs[config.chave] !== undefined
      ? editedConfigs[config.chave]
      : config.valor || ''
  }

  function hasChanges(): boolean {
    return Object.keys(editedConfigs).length > 0
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Settings className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </p>
            <p className="text-gray-600">
              Apenas administradores podem acessar as configurações do sistema.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Settings className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadConfigs}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Atualizar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(configs).map(([categoria, configsCategoria]) => (
              <div key={categoria} className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {categoriasLabels[categoria] || categoria}
                </h2>
                <div className="space-y-4">
                  {configsCategoria.map((config) => (
                    <div key={config.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {config.descricao || config.chave}
                      </label>
                      {config.tipo === 'boolean' ? (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getConfigValue(config) === 'true'}
                            onChange={(e) =>
                              handleConfigChange(config.chave, e.target.checked ? 'true' : 'false')
                            }
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">
                            {getConfigValue(config) === 'true' ? 'Ativado' : 'Desativado'}
                          </span>
                        </label>
                      ) : config.tipo === 'number' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={getConfigValue(config)}
                          onChange={(e) => handleConfigChange(config.chave, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : config.chave === 'cabeçalho_relatorios' ? (
                        <textarea
                          value={getConfigValue(config)}
                          onChange={(e) => handleConfigChange(config.chave, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getConfigValue(config)}
                          onChange={(e) => handleConfigChange(config.chave, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Chave: <code className="bg-gray-100 px-1 rounded">{config.chave}</code>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!hasChanges() && Object.keys(configs).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Nenhuma alteração pendente. Faça suas modificações acima e clique em "Salvar
                  Alterações".
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
