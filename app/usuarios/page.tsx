'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserProfileData } from '@/lib/permissions'
import { Plus, Edit, Trash2, Search, X, Shield } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Pagination } from '@/components/Pagination'
import { getErrorMessage } from '@/lib/utils'
import { getUserProfile, hasPermission, canManageUsers } from '@/lib/permissions'
import { useAuth } from '@/lib/auth-context'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserProfileData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<UserProfileData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; usuario: UserProfileData | null }>({
    isOpen: false,
    usuario: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
  const { showToast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadCurrentProfile()
    loadUsuarios()
  }, [])

  async function loadCurrentProfile() {
    const profile = await getUserProfile()
    setCurrentUserProfile(profile?.perfil || null)

    if (!canManageUsers(profile?.perfil || null)) {
      showToast('Você não tem permissão para acessar esta página', 'error')
      return
    }
  }

  async function loadUsuarios() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao carregar usuários:', error)
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.usuario) return

    if (deleteConfirm.usuario.id === user?.id) {
      showToast('Você não pode excluir seu próprio perfil', 'error')
      setDeleteConfirm({ isOpen: false, usuario: null })
      return
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', deleteConfirm.usuario.id)

      if (error) throw error

      // Também deletar do auth.users (requer permissões especiais)
      showToast('Perfil excluído com sucesso!', 'success')
      loadUsuarios()
      setDeleteConfirm({ isOpen: false, usuario: null })
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao excluir usuário:', error)
      showToast(errorMsg, 'error')
    }
  }

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (!canManageUsers(currentUserProfile)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Shield className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </p>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página.
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <button
            onClick={() => {
              setEditingUsuario(null)
              setShowModal(true)
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de usuários */}
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perfil
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
                {paginatedUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{usuario.nome || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            usuario.perfil === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : usuario.perfil === 'operador'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usuario.perfil === 'admin'
                            ? 'Administrador'
                            : usuario.perfil === 'operador'
                            ? 'Operador'
                            : 'Visualizador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            usuario.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingUsuario(usuario)
                              setShowModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          {usuario.id !== user?.id && (
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, usuario })}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredUsuarios.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredUsuarios.length}
              />
            )}
          </div>
        )}

        {showModal && (
          <UsuarioModal
            usuario={editingUsuario}
            onClose={() => {
              setShowModal(false)
              setEditingUsuario(null)
            }}
            onSave={() => {
              loadUsuarios()
              setShowModal(false)
              setEditingUsuario(null)
            }}
          />
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, usuario: null })}
          onConfirm={handleDelete}
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário ${deleteConfirm.usuario?.email}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </div>
    </Layout>
  )
}

function UsuarioModal({
  usuario,
  onClose,
  onSave,
}: {
  usuario: UserProfileData | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    email: usuario?.email || '',
    nome: usuario?.nome || '',
    perfil: usuario?.perfil || 'operador',
    ativo: usuario?.ativo !== undefined ? usuario.ativo : true,
  })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (usuario) {
        // Atualizar
        const { error } = await supabase
          .from('user_profiles')
          .update({
            nome: formData.nome || null,
            perfil: formData.perfil,
            ativo: formData.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', usuario.id)

        if (error) throw error
        showToast('Usuário atualizado com sucesso!', 'success')
      } else {
        // Não podemos criar usuários aqui - devem ser criados via auth
        showToast('Use a página de registro para criar novos usuários', 'info')
        return
      }

      onSave()
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.error('Erro ao salvar usuário:', error)
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">O email não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perfil *
            </label>
            <select
              required
              value={formData.perfil}
              onChange={(e) => setFormData({ ...formData, perfil: e.target.value as UserProfile })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="visualizador">Visualizador</option>
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Visualizador: apenas visualizar | Operador: criar/editar | Admin: acesso total
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
