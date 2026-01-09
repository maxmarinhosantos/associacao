'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { Associacao, Funcionario } from '@/types/database.types'
import { Mail, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'
import {
  generateCobrancaEmail,
  generateLembreteEmail,
  generateConfirmacaoPagamentoEmail,
  generateInadimplenciaEmail,
  sendEmail,
} from '@/lib/email'
import { format } from 'date-fns'
import { formatCPF } from '@/lib/utils'

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

export default function ComunicacoesPage() {
  const [associacoes, setAssociacoes] = useState<AssociacaoComFuncionario[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('pendente')
  const { showToast } = useToast()

  useEffect(() => {
    loadAssociacoes()
  }, [filtroAno, filtroMes])

  async function loadAssociacoes() {
    setLoading(true)
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
      console.error('Erro ao carregar associações:', error)
      showToast('Erro ao carregar associações', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssociacoes = associacoes.filter((a) => {
    if (filtroStatus === 'pago') return a.pago
    if (filtroStatus === 'pendente') return !a.pago
    return true
  })

  async function enviarCobranca(associacao: AssociacaoComFuncionario) {
    if (!associacao.funcionario?.email) {
      showToast('Funcionário não possui email cadastrado', 'error')
      return
    }

    setSending(associacao.id)
    try {
      const template = generateCobrancaEmail(
        associacao.funcionario.nome,
        formatCPF(associacao.funcionario.cpf),
        meses[associacao.mes - 1],
        associacao.ano,
        associacao.valor_mensalidade || 0
      )

      await sendEmail({
        to: associacao.funcionario.email,
        subject: template.subject,
        html: template.html,
      })

      showToast('Email de cobrança enviado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      showToast('Erro ao enviar email', 'error')
    } finally {
      setSending(null)
    }
  }

  async function enviarLembrete(associacao: AssociacaoComFuncionario) {
    if (!associacao.funcionario?.email) {
      showToast('Funcionário não possui email cadastrado', 'error')
      return
    }

    setSending(associacao.id)
    try {
      // Calcular dias até vencimento (exemplo: 5 dias)
      const diasRestantes = 5

      const template = generateLembreteEmail(
        associacao.funcionario.nome,
        meses[associacao.mes - 1],
        associacao.ano,
        associacao.valor_mensalidade || 0,
        diasRestantes
      )

      await sendEmail({
        to: associacao.funcionario.email,
        subject: template.subject,
        html: template.html,
      })

      showToast('Lembrete enviado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      showToast('Erro ao enviar email', 'error')
    } finally {
      setSending(null)
    }
  }

  async function enviarConfirmacao(associacao: AssociacaoComFuncionario) {
    if (!associacao.funcionario?.email) {
      showToast('Funcionário não possui email cadastrado', 'error')
      return
    }

    if (!associacao.pago || !associacao.data_pagamento) {
      showToast('Esta associação não foi paga ainda', 'error')
      return
    }

    setSending(associacao.id)
    try {
      const template = generateConfirmacaoPagamentoEmail(
        associacao.funcionario.nome,
        meses[associacao.mes - 1],
        associacao.ano,
        associacao.valor_mensalidade || 0,
        format(new Date(associacao.data_pagamento), 'dd/MM/yyyy')
      )

      await sendEmail({
        to: associacao.funcionario.email,
        subject: template.subject,
        html: template.html,
      })

      showToast('Email de confirmação enviado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      showToast('Erro ao enviar email', 'error')
    } finally {
      setSending(null)
    }
  }

  async function enviarInadimplencia(associacao: AssociacaoComFuncionario) {
    if (!associacao.funcionario?.email) {
      showToast('Funcionário não possui email cadastrado', 'error')
      return
    }

    if (associacao.pago) {
      showToast('Esta associação já foi paga', 'error')
      return
    }

    setSending(associacao.id)
    try {
      // Calcular dias de atraso (exemplo)
      const diasAtraso = 10

      const template = generateInadimplenciaEmail(
        associacao.funcionario.nome,
        formatCPF(associacao.funcionario.cpf),
        meses[associacao.mes - 1],
        associacao.ano,
        associacao.valor_mensalidade || 0,
        diasAtraso
      )

      await sendEmail({
        to: associacao.funcionario.email,
        subject: template.subject,
        html: template.html,
      })

      showToast('Aviso de inadimplência enviado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      showToast('Erro ao enviar email', 'error')
    } finally {
      setSending(null)
    }
  }

  async function enviarEmailsEmLote(tipo: 'cobranca' | 'lembrete' | 'inadimplencia') {
    const associacoesParaEnviar = filteredAssociacoes.filter((a) => {
      if (!a.funcionario?.email) return false
      if (tipo === 'inadimplencia' && a.pago) return false
      return true
    })

    if (associacoesParaEnviar.length === 0) {
      showToast('Nenhuma associação encontrada para envio', 'warning')
      return
    }

    if (!confirm(`Deseja enviar ${associacoesParaEnviar.length} email(s)?`)) {
      return
    }

    setSending('lote')
    let enviados = 0
    let erros = 0

    for (const associacao of associacoesParaEnviar) {
      try {
        let template
        if (tipo === 'cobranca') {
          template = generateCobrancaEmail(
            associacao.funcionario.nome,
            formatCPF(associacao.funcionario.cpf),
            meses[associacao.mes - 1],
            associacao.ano,
            associacao.valor_mensalidade || 0
          )
        } else if (tipo === 'lembrete') {
          template = generateLembreteEmail(
            associacao.funcionario.nome,
            meses[associacao.mes - 1],
            associacao.ano,
            associacao.valor_mensalidade || 0,
            5 // dias restantes
          )
        } else if (tipo === 'inadimplencia') {
          template = generateInadimplenciaEmail(
            associacao.funcionario.nome,
            formatCPF(associacao.funcionario.cpf),
            meses[associacao.mes - 1],
            associacao.ano,
            associacao.valor_mensalidade || 0,
            10 // dias de atraso
          )
        }

        if (template && associacao.funcionario?.email) {
          await sendEmail({
            to: associacao.funcionario.email,
            subject: template.subject,
            html: template.html,
          })
          enviados++
        }
        // Delay entre envios para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        erros++
      }
    }

    setSending(null)
    showToast(
      `Envio concluído: ${enviados} enviados, ${erros} erros`,
      erros === 0 ? 'success' : 'warning'
    )
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Comunicações</h1>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value as 'todos' | 'pago' | 'pendente')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="pago">Pagos</option>
                <option value="pendente">Pendentes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadAssociacoes}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Atualizar
              </button>
            </div>
          </div>

          {/* Botões de envio em lote */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <button
              onClick={() => enviarEmailsEmLote('cobranca')}
              disabled={sending === 'lote'}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail size={18} />
              <span>Enviar Cobranças em Lote ({filteredAssociacoes.filter((a) => !a.pago).length})</span>
            </button>
            <button
              onClick={() => enviarEmailsEmLote('lembrete')}
              disabled={sending === 'lote'}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <Clock size={18} />
              <span>Enviar Lembretes</span>
            </button>
            <button
              onClick={() => enviarEmailsEmLote('inadimplencia')}
              disabled={sending === 'lote'}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <AlertTriangle size={18} />
              <span>Enviar Avisos de Inadimplência ({filteredAssociacoes.filter((a) => !a.pago).length})</span>
            </button>
          </div>
        </div>

        {/* Lista de associações */}
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
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
                {filteredAssociacoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma associação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredAssociacoes.map((associacao) => (
                    <tr key={associacao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {associacao.funcionario?.nome || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCPF(associacao.funcionario?.cpf || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {associacao.funcionario?.email || '-'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          {!associacao.pago && (
                            <>
                              <button
                                onClick={() => enviarCobranca(associacao)}
                                disabled={sending === associacao.id || !associacao.funcionario?.email}
                                className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                                title="Enviar Cobrança"
                              >
                                <Mail size={14} />
                                <span>Cobrança</span>
                              </button>
                              <button
                                onClick={() => enviarLembrete(associacao)}
                                disabled={sending === associacao.id || !associacao.funcionario?.email}
                                className="flex items-center space-x-1 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50 text-xs"
                                title="Enviar Lembrete"
                              >
                                <Clock size={14} />
                                <span>Lembrete</span>
                              </button>
                              <button
                                onClick={() => enviarInadimplencia(associacao)}
                                disabled={sending === associacao.id || !associacao.funcionario?.email}
                                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                                title="Aviso de Inadimplência"
                              >
                                <AlertTriangle size={14} />
                                <span>Inadimplente</span>
                              </button>
                            </>
                          )}
                          {associacao.pago && (
                            <button
                              onClick={() => enviarConfirmacao(associacao)}
                              disabled={sending === associacao.id || !associacao.funcionario?.email}
                              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                              title="Enviar Confirmação"
                            >
                              <CheckCircle size={14} />
                              <span>Confirmação</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </Layout>
  )
}
