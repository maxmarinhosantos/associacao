import { supabase } from './supabase'

// Upload de arquivo para Supabase Storage
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string; error: any }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = fileName

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Obter URL pública do arquivo
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return { url: '', error }
  }
}

// Deletar arquivo do Supabase Storage
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return false
  }
}

// Baixar arquivo
export async function downloadFile(bucket: string, path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    return null
  }
}

// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
