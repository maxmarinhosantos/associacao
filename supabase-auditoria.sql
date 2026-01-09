-- Script para adicionar sistema de auditoria
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email TEXT,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON auditoria_logs(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria_logs(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_logs(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ver logs
DROP POLICY IF EXISTS "Usuários autenticados podem ver logs" ON auditoria_logs;
CREATE POLICY "Usuários autenticados podem ver logs"
  ON auditoria_logs FOR SELECT
  TO authenticated
  USING (true);

-- Função para criar trigger de auditoria em funcionários
CREATE OR REPLACE FUNCTION audit_funcionarios()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_novos)
    VALUES (
      auth.uid(),
      'CREATE',
      'funcionarios',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos)
    VALUES (
      auth.uid(),
      'UPDATE',
      'funcionarios',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores)
    VALUES (
      auth.uid(),
      'DELETE',
      'funcionarios',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers
DROP TRIGGER IF EXISTS funcionarios_audit_trigger ON funcionarios;
CREATE TRIGGER funcionarios_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION audit_funcionarios();

-- Função para criar trigger de auditoria em associações
CREATE OR REPLACE FUNCTION audit_associacoes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_novos)
    VALUES (
      auth.uid(),
      'CREATE',
      'associacoes',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos)
    VALUES (
      auth.uid(),
      'UPDATE',
      'associacoes',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores)
    VALUES (
      auth.uid(),
      'DELETE',
      'associacoes',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers
DROP TRIGGER IF EXISTS associacoes_audit_trigger ON associacoes;
CREATE TRIGGER associacoes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON associacoes
  FOR EACH ROW EXECUTE FUNCTION audit_associacoes();

-- Função para criar trigger de auditoria em documentos
CREATE OR REPLACE FUNCTION audit_documentos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_novos)
    VALUES (
      auth.uid(),
      'CREATE',
      'documentos',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos)
    VALUES (
      auth.uid(),
      'UPDATE',
      'documentos',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_logs (usuario_id, acao, tabela, registro_id, dados_anteriores)
    VALUES (
      auth.uid(),
      'DELETE',
      'documentos',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers
DROP TRIGGER IF EXISTS documentos_audit_trigger ON documentos;
CREATE TRIGGER documentos_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documentos
  FOR EACH ROW EXECUTE FUNCTION audit_documentos();
