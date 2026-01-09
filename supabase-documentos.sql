-- Script para adicionar suporte a documentos
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('identidade', 'cpf', 'comprovante', 'carteirinha', 'outro')),
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_tamanho INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_documentos_funcionario ON documentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);

-- Habilitar Row Level Security
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Usuários autenticados podem ver documentos" ON documentos;
CREATE POLICY "Usuários autenticados podem ver documentos"
  ON documentos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir documentos" ON documentos;
CREATE POLICY "Usuários autenticados podem inserir documentos"
  ON documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar documentos" ON documentos;
CREATE POLICY "Usuários autenticados podem atualizar documentos"
  ON documentos FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar documentos" ON documentos;
CREATE POLICY "Usuários autenticados podem deletar documentos"
  ON documentos FOR DELETE
  TO authenticated
  USING (true);
