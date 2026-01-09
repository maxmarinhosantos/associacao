-- Script de configuração do banco de dados Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT,
  data_admissao DATE,
  data_adesao DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de associações
CREATE TABLE IF NOT EXISTS associacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_mensalidade DECIMAL(10, 2),
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funcionario_id, ano, mes)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_associacoes_funcionario ON associacoes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_associacoes_ano_mes ON associacoes(ano, mes);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_email ON funcionarios(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para funcionários
DROP POLICY IF EXISTS "Usuários autenticados podem ver funcionários" ON funcionarios;
CREATE POLICY "Usuários autenticados podem ver funcionários"
  ON funcionarios FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir funcionários" ON funcionarios;
CREATE POLICY "Usuários autenticados podem inserir funcionários"
  ON funcionarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar funcionários" ON funcionarios;
CREATE POLICY "Usuários autenticados podem atualizar funcionários"
  ON funcionarios FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar funcionários" ON funcionarios;
CREATE POLICY "Usuários autenticados podem deletar funcionários"
  ON funcionarios FOR DELETE
  TO authenticated
  USING (true);

-- Políticas de segurança para associações
DROP POLICY IF EXISTS "Usuários autenticados podem ver associações" ON associacoes;
CREATE POLICY "Usuários autenticados podem ver associações"
  ON associacoes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir associações" ON associacoes;
CREATE POLICY "Usuários autenticados podem inserir associações"
  ON associacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar associações" ON associacoes;
CREATE POLICY "Usuários autenticados podem atualizar associações"
  ON associacoes FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar associações" ON associacoes;
CREATE POLICY "Usuários autenticados podem deletar associações"
  ON associacoes FOR DELETE
  TO authenticated
  USING (true);
