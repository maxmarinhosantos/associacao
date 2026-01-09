import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Funcionario, Associacao } from '@/types/database.types'
import { format } from 'date-fns'

interface AssociacaoComFuncionario extends Associacao {
  funcionario: Funcionario
}

// Gerar relatório de funcionários em PDF
export function generateFuncionariosPDF(funcionarios: Funcionario[]) {
  const doc = new jsPDF()
  
  // Cabeçalho
  doc.setFontSize(18)
  doc.text('Relatório de Funcionários', 14, 20)
  doc.setFontSize(10)
  doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)
  doc.text(`Total de funcionários: ${funcionarios.length}`, 14, 34)

  // Tabela
  autoTable(doc, {
    startY: 40,
    head: [['Nome', 'CPF', 'Email', 'Cargo', 'Status']],
    body: funcionarios.map((f) => [
      f.nome,
      f.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      f.email,
      f.cargo || '-',
      f.status.charAt(0).toUpperCase() + f.status.slice(1),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  doc.save(`funcionarios-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Gerar relatório de associações em PDF
export function generateAssociacoesPDF(
  associacoes: AssociacaoComFuncionario[],
  periodo: { ano: number; mes: number }
) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Cabeçalho
  doc.setFontSize(18)
  doc.text('Relatório de Associações', 14, 20)
  doc.setFontSize(10)
  doc.text(`Período: ${meses[periodo.mes - 1]}/${periodo.ano}`, 14, 28)
  doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34)
  
  const total = associacoes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const pagas = associacoes.filter((a) => a.pago)
  const pendentes = associacoes.filter((a) => !a.pago)
  const totalPago = pagas.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const totalPendente = pendentes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)

  doc.text(`Total de associações: ${associacoes.length}`, 14, 40)
  doc.text(`Pagas: ${pagas.length} | Pendentes: ${pendentes.length}`, 14, 46)
  doc.text(`Valor Total: R$ ${total.toFixed(2).replace('.', ',')}`, 14, 52)
  doc.text(`Valor Pago: R$ ${totalPago.toFixed(2).replace('.', ',')} | Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 14, 58)

  // Tabela
  autoTable(doc, {
    startY: 64,
    head: [['Funcionário', 'CPF', 'Valor', 'Status', 'Data Pagamento']],
    body: associacoes.map((a) => [
      a.funcionario?.nome || 'N/A',
      a.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
      a.valor_mensalidade ? `R$ ${a.valor_mensalidade.toFixed(2).replace('.', ',')}` : '-',
      a.pago ? 'Pago' : 'Pendente',
      a.data_pagamento ? format(new Date(a.data_pagamento), 'dd/MM/yyyy') : '-',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  doc.save(`associacoes-${periodo.mes}-${periodo.ano}.pdf`)
}

// Gerar relatório de inadimplência em PDF
export function generateInadimplenciaPDF(
  associacoes: AssociacaoComFuncionario[],
  periodo: { ano: number; mes: number }
) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const pendentes = associacoes.filter((a) => !a.pago)

  // Cabeçalho
  doc.setFontSize(18)
  doc.text('Relatório de Inadimplência', 14, 20)
  doc.setFontSize(10)
  doc.text(`Período: ${meses[periodo.mes - 1]}/${periodo.ano}`, 14, 28)
  doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34)
  doc.text(`Total de inadimplentes: ${pendentes.length}`, 14, 40)
  
  const totalPendente = pendentes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  doc.text(`Valor Total Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 14, 46)

  // Tabela
  autoTable(doc, {
    startY: 52,
    head: [['Funcionário', 'CPF', 'Email', 'Telefone', 'Valor Pendente']],
    body: pendentes.map((a) => [
      a.funcionario?.nome || 'N/A',
      a.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
      a.funcionario?.email || '-',
      a.funcionario?.telefone || '-',
      a.valor_mensalidade ? `R$ ${a.valor_mensalidade.toFixed(2).replace('.', ',')}` : '-',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [239, 68, 68] },
  })

  doc.save(`inadimplencia-${periodo.mes}-${periodo.ano}.pdf`)
}

// Exportar funcionários para Excel
export function exportFuncionariosExcel(funcionarios: Funcionario[]) {
  const data = funcionarios.map((f) => ({
    Nome: f.nome,
    CPF: f.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    Email: f.email,
    Telefone: f.telefone || '-',
    Cargo: f.cargo || '-',
    'Data Admissão': f.data_admissao ? format(new Date(f.data_admissao), 'dd/MM/yyyy') : '-',
    'Data Adesão': f.data_adesao ? format(new Date(f.data_adesao), 'dd/MM/yyyy') : '-',
    Status: f.status.charAt(0).toUpperCase() + f.status.slice(1),
    Observações: f.observacoes || '-',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Funcionários')
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 30 }, // Nome
    { wch: 15 }, // CPF
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 20 }, // Cargo
    { wch: 15 }, // Data Admissão
    { wch: 15 }, // Data Adesão
    { wch: 12 }, // Status
    { wch: 40 }, // Observações
  ]
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `funcionarios-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

// Exportar associações para Excel
export function exportAssociacoesExcel(
  associacoes: AssociacaoComFuncionario[],
  periodo: { ano: number; mes: number }
) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const data = associacoes.map((a) => ({
    'Funcionário': a.funcionario?.nome || 'N/A',
    CPF: a.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
    Email: a.funcionario?.email || '-',
    Telefone: a.funcionario?.telefone || '-',
    Ano: a.ano,
    Mês: meses[a.mes - 1],
    'Valor Mensalidade': a.valor_mensalidade || 0,
    Status: a.pago ? 'Pago' : 'Pendente',
    'Data Pagamento': a.data_pagamento ? format(new Date(a.data_pagamento), 'dd/MM/yyyy') : '-',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Associações')
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 30 }, // Funcionário
    { wch: 15 }, // CPF
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 8 },  // Ano
    { wch: 12 }, // Mês
    { wch: 15 }, // Valor
    { wch: 12 }, // Status
    { wch: 15 }, // Data Pagamento
  ]
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `associacoes-${periodo.mes}-${periodo.ano}.xlsx`)
}

// Gerar relatório financeiro completo
export function generateRelatorioFinanceiroPDF(
  associacoes: AssociacaoComFuncionario[],
  periodo: { ano: number; mes: number }
) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Cabeçalho
  doc.setFontSize(18)
  doc.text('Relatório Financeiro', 14, 20)
  doc.setFontSize(10)
  doc.text(`Período: ${meses[periodo.mes - 1]}/${periodo.ano}`, 14, 28)
  doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 34)

  // Resumo
  const total = associacoes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const pagas = associacoes.filter((a) => a.pago)
  const pendentes = associacoes.filter((a) => !a.pago)
  const totalPago = pagas.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const totalPendente = pendentes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const percentualPago = total > 0 ? ((totalPago / total) * 100).toFixed(2) : '0.00'

  doc.setFontSize(12)
  doc.text('RESUMO FINANCEIRO', 14, 46)
  doc.setFontSize(10)
  doc.text(`Total de Associações: ${associacoes.length}`, 14, 54)
  doc.text(`Associações Pagas: ${pagas.length}`, 14, 60)
  doc.text(`Associações Pendentes: ${pendentes.length}`, 14, 66)
  doc.text(`Valor Total: R$ ${total.toFixed(2).replace('.', ',')}`, 14, 72)
  doc.text(`Valor Recebido: R$ ${totalPago.toFixed(2).replace('.', ',')}`, 14, 78)
  doc.text(`Valor Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 14, 84)
  doc.text(`Percentual Pago: ${percentualPago}%`, 14, 90)

  // Tabela detalhada
  ;(doc as any).autoTable({
    startY: 96,
    head: [['Funcionário', 'CPF', 'Valor', 'Status', 'Data Pagamento']],
    body: associacoes.map((a) => [
      a.funcionario?.nome || 'N/A',
      a.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
      a.valor_mensalidade ? `R$ ${a.valor_mensalidade.toFixed(2).replace('.', ',')}` : '-',
      a.pago ? 'Pago' : 'Pendente',
      a.data_pagamento ? format(new Date(a.data_pagamento), 'dd/MM/yyyy') : '-',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  doc.save(`relatorio-financeiro-${periodo.mes}-${periodo.ano}.pdf`)
}
