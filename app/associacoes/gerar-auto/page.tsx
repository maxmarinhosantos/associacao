'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useRouter } from 'next/navigation'
import { Play, Calendar, ArrowLeft, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { gerarAssociacoesMensais, gerarAssociacoesPeriodo } from '@/lib/associacoes-auto'
import { getUserProfile, canEdit } from '@/lib/permissions'
import { getBooleanConfig } from '@/lib/config'

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

export default function GerarAssociacoesAutoPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [canAccess, setCanAccess] = useState(true)
  const [formData, setFormData] = useState({
    tipo: 'mes_atual' as 'mes_atual' | 'mes_especifico' | 'periodo',
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    anoInicio: new Date().getFullYear(),
    mesInicio: new Date().getMonth() + 1,
    anoFim: new Date().getFullYear(),
    mesFim: new Date().getMonth() + 1,
  })

  useEffect(() => {
    checkPermissions()
  }, [])

  async function checkPermissions() {
    const profile = await getUserProfile()
    if (!canEdit(profile?.perfil || null)) {
      setCanAccess(false)
      showToast('Você não tem permissão para acessar esta página', 'error')
    }
  }

  async function handleGenerate() {
    setGenerating(true)

    try {
      let result

      if (formData.tipo === 'mes_atual') {
        result = await gerarAssociacoesMensais()
      } else if (formData.tipo === 'mes_especifico') {
        result = await gerarAssociacoesMensais(formData.ano, formData.mes)
      } else {
        result = await gerarAssociacoesPeriodo(
          formData.anoInicio,
          formData.mesInicio,
          formData.anoFim,
          formData.mesFim
        )
      }

      if (result.success) {
        if (result.criadas > 0) {
          showToast(
            `Associações geradas com sucesso! ${result.criadas} associação(ões) criada(s).`,
            'success'
          )
          setTimeout(() => {
            router.push('/associacoes')
          }, 2000)
        } else {
          showToast('Nenhuma associação nova foi criada. Todas já existem.', 'info')
        }
      } else {
        throw new Error(result.errors.join(', '))
      }
    } catch (error: any) {
      console.error('Erro ao gerar associações:', error)
      showToast(error.message || 'Erro ao gerar associações', 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (!canAccess) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Play className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</p>
            <p className="text-gray-600">
              Você não tem permissão para gerar associações automaticamente.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-center space-x-3 mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerar Associações Automaticamente</h1>
            <p className="text-gray-600 mt-1">
              Crie associações mensais para todos os funcionários ativos
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Tipo de geração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Geração
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo"
                  value="mes_atual"
                  checked={formData.tipo === 'mes_atual'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Mês Atual (Automático)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo"
                  value="mes_especifico"
                  checked={formData.tipo === 'mes_especifico'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Mês Específico</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tipo"
                  value="periodo"
                  checked={formData.tipo === 'periodo'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Período (Múltiplos Meses)</span>
              </label>
            </div>
          </div>

          {/* Mês específico */}
          {formData.tipo === 'mes_especifico' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={(e) =>
                    setFormData({ ...formData, ano: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="2020"
                  max="2100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                <select
                  value={formData.mes}
                  onChange={(e) =>
                    setFormData({ ...formData, mes: parseInt(e.target.value) })
                  }
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
          )}

          {/* Período */}
          {formData.tipo === 'periodo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Início
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ano</label>
                    <input
                      type="number"
                      value={formData.anoInicio}
                      onChange={(e) =>
                        setFormData({ ...formData, anoInicio: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mês</label>
                    <select
                      value={formData.mesInicio}
                      onChange={(e) =>
                        setFormData({ ...formData, mesInicio: parseInt(e.target.value) })
                      }
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data Fim</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ano</label>
                    <input
                      type="number"
                      value={formData.anoFim}
                      onChange={(e) =>
                        setFormData({ ...formData, anoFim: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mês</label>
                    <select
                      value={formData.mesFim}
                      onChange={(e) =>
                        setFormData({ ...formData, mesFim: parseInt(e.target.value) })
                      }
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
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Informação:</strong> O sistema irá criar associações apenas para funcionários
              ativos que ainda não possuem associação no(s) período(s) selecionado(s). O valor da
              mensalidade será obtido das configurações do sistema.
            </p>
          </div>

          {/* Botão gerar */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Gerar Associações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
