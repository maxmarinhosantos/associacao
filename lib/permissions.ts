import { supabase } from './supabase'

export type UserProfile = 'admin' | 'operador' | 'visualizador'

export interface UserProfileData {
  id: string
  email: string
  nome?: string
  perfil: UserProfile
  ativo: boolean
}

// Obter perfil do usuário atual
export async function getUserProfile(): Promise<UserProfileData | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao obter perfil:', error)
    return null
  }
}

// Verificar se usuário tem permissão
export function hasPermission(
  userProfile: UserProfile | null,
  requiredPermission: 'admin' | 'operador' | 'visualizador'
): boolean {
  if (!userProfile) return false

  const permissions: { [key in UserProfile]: string[] } = {
    admin: ['admin', 'operador', 'visualizador'],
    operador: ['operador', 'visualizador'],
    visualizador: ['visualizador'],
  }

  return permissions[userProfile]?.includes(requiredPermission) || false
}

// Verificar se pode criar
export function canCreate(profile: UserProfile | null): boolean {
  return hasPermission(profile, 'operador')
}

// Verificar se pode editar
export function canEdit(profile: UserProfile | null): boolean {
  return hasPermission(profile, 'operador')
}

// Verificar se pode deletar
export function canDelete(profile: UserProfile | null): boolean {
  return hasPermission(profile, 'admin')
}

// Verificar se pode exportar
export function canExport(profile: UserProfile | null): boolean {
  return hasPermission(profile, 'operador')
}

// Verificar se pode gerenciar usuários
export function canManageUsers(profile: UserProfile | null): boolean {
  return hasPermission(profile, 'admin')
}
