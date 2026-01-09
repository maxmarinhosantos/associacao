'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Home, LogOut, FileText, User, BarChart3, Mail, FolderOpen, History, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { getUserProfile } = await import('@/lib/permissions')
      const profile = await getUserProfile()
      setUserProfile(profile?.perfil || null)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, permission: null },
    { href: '/funcionarios', label: 'Funcionários', icon: Users, permission: null },
    { href: '/associacoes', label: 'Associações', icon: FileText, permission: null },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3, permission: null },
    { href: '/comunicacoes', label: 'Comunicações', icon: Mail, permission: 'operador' },
    { href: '/documentos', label: 'Documentos', icon: FolderOpen, permission: null },
    { href: '/auditoria', label: 'Auditoria', icon: History, permission: 'operador' },
    { href: '/usuarios', label: 'Usuários', icon: Shield, permission: 'admin' },
    { href: '/configuracoes', label: 'Configurações', icon: Settings, permission: 'admin' },
    { href: '/perfil', label: 'Perfil', icon: User, permission: null },
  ].filter((item) => {
    if (!item.permission) return true
    if (item.permission === 'admin') return userProfile === 'admin'
    if (item.permission === 'operador') return userProfile === 'admin' || userProfile === 'operador'
    return true
  })

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gestão Associação</h1>
        <p className="text-gray-400 text-sm mt-1">Funcionários</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        onClick={signOut}
        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition w-full"
      >
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </div>
  )
}
