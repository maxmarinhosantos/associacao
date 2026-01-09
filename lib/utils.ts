// Validação de CPF
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1+$/.test(cleanCPF)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

  return true
}

// Formatar CPF
export function formatCPF(value: string): string {
  const cleanValue = value.replace(/\D/g, '')
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return value
}

// Formatar telefone
export function formatPhone(value: string): string {
  const cleanValue = value.replace(/\D/g, '')
  if (cleanValue.length <= 10) {
    return cleanValue.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  } else {
    return cleanValue.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }
}

// Obter mensagem de erro do Supabase
export function getErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido'

  // Erros de autenticação
  if (error.message) {
    if (error.message.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login'
    }
    if (error.message.includes('User already registered')) {
      return 'Este email já está cadastrado'
    }
    if (error.message.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres'
    }
    if (error.message.includes('duplicate key value')) {
      return 'Este CPF já está cadastrado'
    }
    return error.message
  }

  return 'Ocorreu um erro. Tente novamente.'
}
