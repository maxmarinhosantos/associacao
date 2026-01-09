// Funções para envio de emails
// Note: Esta implementação usa uma API route. Para produção, configure um serviço de email real

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Template de email de cobrança
export function generateCobrancaEmail(
  nome: string,
  cpf: string,
  mes: string,
  ano: number,
  valor: number,
  dataVencimento?: string
) {
  const valorFormatado = valor.toFixed(2).replace('.', ',')
  
  return {
    subject: `Cobrança de Mensalidade - ${mes}/${ano}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cobrança de Mensalidade</h1>
          </div>
          <div class="content">
            <p>Prezado(a) <strong>${nome}</strong>,</p>
            
            <p>Informamos que sua mensalidade de associação está disponível para pagamento:</p>
            
            <div class="info-box">
              <p><strong>Associado:</strong> ${nome}</p>
              <p><strong>CPF:</strong> ${cpf}</p>
              <p><strong>Período:</strong> ${mes}/${ano}</p>
              <p><strong>Valor:</strong> R$ ${valorFormatado}</p>
              ${dataVencimento ? `<p><strong>Vencimento:</strong> ${dataVencimento}</p>` : ''}
            </div>
            
            <p>Solicitamos o pagamento até a data de vencimento para manter sua associação em dia.</p>
            
            <p>Em caso de dúvidas, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Gestão de Associação de Funcionários</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

// Template de email de lembrete
export function generateLembreteEmail(
  nome: string,
  mes: string,
  ano: number,
  valor: number,
  diasRestantes: number
) {
  const valorFormatado = valor.toFixed(2).replace('.', ',')
  
  return {
    subject: `Lembrete: Mensalidade ${mes}/${ano} vence em ${diasRestantes} dia(s)`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .warning-box { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lembrete de Vencimento</h1>
          </div>
          <div class="content">
            <p>Prezado(a) <strong>${nome}</strong>,</p>
            
            <p>Lembramos que sua mensalidade vence em <strong>${diasRestantes} dia(s)</strong>.</p>
            
            <div class="warning-box">
              <p><strong>Período:</strong> ${mes}/${ano}</p>
              <p><strong>Valor:</strong> R$ ${valorFormatado}</p>
              <p><strong>Dias restantes:</strong> ${diasRestantes} dia(s)</p>
            </div>
            
            <p>Por favor, efetue o pagamento até a data de vencimento para evitar a suspensão dos serviços.</p>
            
            <p>Atenciosamente,<br>
            <strong>Gestão de Associação de Funcionários</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

// Template de email de confirmação de pagamento
export function generateConfirmacaoPagamentoEmail(
  nome: string,
  mes: string,
  ano: number,
  valor: number,
  dataPagamento: string
) {
  const valorFormatado = valor.toFixed(2).replace('.', ',')
  
  return {
    subject: `Pagamento Confirmado - ${mes}/${ano}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .success-box { background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Pagamento Confirmado</h1>
          </div>
          <div class="content">
            <p>Prezado(a) <strong>${nome}</strong>,</p>
            
            <p>Confirmamos o recebimento do pagamento da sua mensalidade:</p>
            
            <div class="success-box">
              <p><strong>Período:</strong> ${mes}/${ano}</p>
              <p><strong>Valor:</strong> R$ ${valorFormatado}</p>
              <p><strong>Data do Pagamento:</strong> ${dataPagamento}</p>
            </div>
            
            <p>Obrigado por manter sua associação em dia!</p>
            
            <p>Em caso de dúvidas, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Gestão de Associação de Funcionários</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

// Template de email de inadimplência
export function generateInadimplenciaEmail(
  nome: string,
  cpf: string,
  mes: string,
  ano: number,
  valor: number,
  diasAtraso: number
) {
  const valorFormatado = valor.toFixed(2).replace('.', ',')
  
  return {
    subject: `Aviso de Inadimplência - ${mes}/${ano}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .alert-box { background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠ Aviso de Inadimplência</h1>
          </div>
          <div class="content">
            <p>Prezado(a) <strong>${nome}</strong>,</p>
            
            <p>Informamos que sua mensalidade está em atraso há <strong>${diasAtraso} dia(s)</strong>.</p>
            
            <div class="alert-box">
              <p><strong>Associado:</strong> ${nome}</p>
              <p><strong>CPF:</strong> ${cpf}</p>
              <p><strong>Período:</strong> ${mes}/${ano}</p>
              <p><strong>Valor em Atraso:</strong> R$ ${valorFormatado}</p>
              <p><strong>Dias de Atraso:</strong> ${diasAtraso} dia(s)</p>
            </div>
            
            <p>Solicitamos o pagamento imediato para regularizar sua situação e evitar a suspensão dos serviços.</p>
            
            <p>Entre em contato conosco para negociar formas de pagamento ou esclarecer dúvidas.</p>
            
            <p>Atenciosamente,<br>
            <strong>Gestão de Associação de Funcionários</strong></p>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

// Função para enviar email via API route
export async function sendEmail(options: EmailOptions) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar email')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw error
  }
}
