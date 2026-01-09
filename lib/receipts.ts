import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Associacao, Funcionario } from '@/types/database.types'
import { format } from 'date-fns'

interface AssociacaoComFuncionario extends Associacao {
  funcionario: Funcionario
}

// Gerar recibo de pagamento
export function generateReciboPDF(
  associacao: AssociacaoComFuncionario,
  numeroRecibo: string
) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGAMENTO', 105, 30, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nº ${numeroRecibo}`, 105, 38, { align: 'center' })

  // Informações do recibo
  const yStart = 50
  let yPos = yStart

  doc.setFont('helvetica', 'bold')
  doc.text('Recebi de:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(associacao.funcionario?.nome || 'N/A', 20, yPos + 7)
  doc.text(`CPF: ${associacao.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'}`, 20, yPos + 14)

  yPos += 30

  doc.setFont('helvetica', 'bold')
  doc.text('Referente à mensalidade de:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`${meses[associacao.mes - 1]}/${associacao.ano}`, 20, yPos + 7)

  yPos += 20

  doc.setFont('helvetica', 'bold')
  doc.text('O valor de:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  const valorTexto = associacao.valor_mensalidade
    ? `R$ ${associacao.valor_mensalidade.toFixed(2).replace('.', ',')}`
    : 'R$ 0,00'
  doc.text(valorTexto, 20, yPos + 8)

  doc.setFontSize(10)
  yPos += 25

  doc.setFont('helvetica', 'bold')
  doc.text('Data do pagamento:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  const dataPagamento = associacao.data_pagamento
    ? format(new Date(associacao.data_pagamento), 'dd/MM/yyyy')
    : format(new Date(), 'dd/MM/yyyy')
  doc.text(dataPagamento, 20, yPos + 7)

  yPos += 25

  doc.setFont('helvetica', 'bold')
  doc.text('Forma de pagamento:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text('_____________________________', 20, yPos + 7)

  yPos += 30

  // Linha de assinatura
  doc.line(20, yPos, 190, yPos)
  doc.setFontSize(10)
  doc.text('Assinatura', 105, yPos + 10, { align: 'center' })

  // Data de emissão
  doc.setFontSize(8)
  doc.text(
    `Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    105,
    280,
    { align: 'center' }
  )

  doc.save(`recibo-${numeroRecibo}.pdf`)
}

// Gerar extrato financeiro por funcionário
export function generateExtratoFuncionarioPDF(
  funcionario: Funcionario,
  associacoes: Associacao[]
) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('EXTRATO FINANCEIRO', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Funcionário: ${funcionario.nome}`, 20, 30)
  doc.text(`CPF: ${funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`, 20, 37)
  doc.text(`Data de emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 44)

  // Resumo
  const associacoesOrdenadas = [...associacoes].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano
    return b.mes - a.mes
  })

  const total = associacoes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const pagas = associacoes.filter((a) => a.pago)
  const pendentes = associacoes.filter((a) => !a.pago)
  const totalPago = pagas.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)
  const totalPendente = pendentes.reduce((sum, a) => sum + (a.valor_mensalidade || 0), 0)

  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO:', 20, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de mensalidades: ${associacoes.length}`, 20, 63)
  doc.text(`Pagas: ${pagas.length} | Pendentes: ${pendentes.length}`, 20, 70)
  doc.text(`Valor Total: R$ ${total.toFixed(2).replace('.', ',')}`, 20, 77)
  doc.text(`Valor Pago: R$ ${totalPago.toFixed(2).replace('.', ',')}`, 20, 84)
  doc.text(`Valor Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 20, 91)

  // Tabela de movimentações
  autoTable(doc, {
    startY: 98,
    head: [['Período', 'Valor', 'Status', 'Data Pagamento']],
    body: associacoesOrdenadas.map((a) => [
      `${meses[a.mes - 1]}/${a.ano}`,
      a.valor_mensalidade ? `R$ ${a.valor_mensalidade.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
      a.pago ? 'Pago' : 'Pendente',
      a.data_pagamento ? format(new Date(a.data_pagamento), 'dd/MM/yyyy') : '-',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
    },
  })

  const fileName = `extrato-${funcionario.nome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}

// Gerar comprovante de pagamento
export function generateComprovantePDF(associacao: AssociacaoComFuncionario) {
  const doc = new jsPDF()
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROVANTE DE PAGAMENTO', 105, 25, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  let yPos = 40

  // Informações do pagamento
  const info = [
    ['Funcionário:', associacao.funcionario?.nome || 'N/A'],
    ['CPF:', associacao.funcionario?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'],
    ['Período:', `${meses[associacao.mes - 1]}/${associacao.ano}`],
    ['Valor:', associacao.valor_mensalidade ? `R$ ${associacao.valor_mensalidade.toFixed(2).replace('.', ',')}` : 'R$ 0,00'],
    ['Status:', associacao.pago ? 'Pago' : 'Pendente'],
    ['Data do Pagamento:', associacao.data_pagamento ? format(new Date(associacao.data_pagamento), 'dd/MM/yyyy HH:mm') : '-'],
    ['Data de Emissão:', format(new Date(), 'dd/MM/yyyy HH:mm')],
  ]

  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, yPos)
    yPos += 10
  })

  // QR Code placeholder (pode ser implementado depois)
  yPos += 10
  doc.setDrawColor(200, 200, 200)
  doc.rect(20, yPos, 60, 60)
  doc.setFontSize(8)
  doc.text('QR Code', 50, yPos + 35, { align: 'center' })

  doc.setFontSize(8)
  doc.text(
    'Este comprovante pode ser usado como recibo',
    105,
    280,
    { align: 'center' }
  )

  const fileName = `comprovante-${associacao.funcionario?.nome?.replace(/\s+/g, '-').toLowerCase()}-${associacao.mes}-${associacao.ano}.pdf`
  doc.save(fileName)
}
