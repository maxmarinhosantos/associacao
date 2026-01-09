-- Script para adicionar sistema de configurações
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT,
  tipo TEXT NOT NULL DEFAULT 'text' CHECK (tipo IN ('text', 'number', 'boolean', 'json')),
  categoria TEXT NOT NULL DEFAULT 'geral',
  descricao TEXT,
  somente_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes(categoria);

-- Habilitar Row Level Security
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações públicas" ON configuracoes;
CREATE POLICY "Usuários autenticados podem ver configurações públicas"
  ON configuracoes FOR SELECT
  TO authenticated
  USING (somente_admin = FALSE OR (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND perfil = 'admin'
    )
  ));

DROP POLICY IF EXISTS "Admins podem gerenciar configurações" ON configuracoes;
CREATE POLICY "Admins podem gerenciar configurações"
  ON configuracoes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND perfil = 'admin'
    )
  );

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, categoria, descricao, somente_admin) VALUES
  ('valor_mensalidade_padrao', '50.00', 'number', 'financeiro', 'Valor padrão da mensalidade em R$', FALSE),
  ('dias_vencimento', '10', 'number', 'financeiro', 'Dia do mês para vencimento das mensalidades', FALSE),
  ('email_remetente', 'noreply@associacao.com', 'text', 'email', 'Email remetente padrão para comunicações', TRUE),
  ('nome_remetente', 'Associação de Funcionários', 'text', 'email', 'Nome do remetente nos emails', TRUE),
  ('logo_url', '', 'text', 'visual', 'URL do logo para relatórios', TRUE),
  ('nome_associacao', 'Associação de Funcionários', 'text', 'geral', 'Nome da associação', FALSE),
  ('gerar_associacoes_automatico', 'true', 'boolean', 'automatizacao', 'Gerar associações automaticamente no início do mês', TRUE),
  ('dias_alerta_vencimento', '5', 'number', 'notificacoes', 'Dias antes do vencimento para enviar alerta', FALSE),
  ('enviar_email_automatico', 'true', 'boolean', 'automatizacao', 'Enviar emails automáticos de cobrança', TRUE),
  ('cabeçalho_relatorios', '', 'text', 'visual', 'Texto do cabeçalho dos relatórios', TRUE)
ON CONFLICT (chave) DO NOTHING;
