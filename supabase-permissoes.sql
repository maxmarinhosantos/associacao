-- Script para adicionar sistema de permissões e controle de acesso
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  perfil TEXT NOT NULL DEFAULT 'operador' CHECK (perfil IN ('admin', 'operador', 'visualizador')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_perfil ON user_profiles(perfil);
CREATE INDEX IF NOT EXISTS idx_user_profiles_ativo ON user_profiles(ativo);

-- Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON user_profiles;
CREATE POLICY "Admins podem ver todos os perfis"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND perfil = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON user_profiles;
CREATE POLICY "Admins podem atualizar perfis"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND perfil = 'admin'
    )
  );

-- Função para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, perfil)
  VALUES (NEW.id, NEW.email, 'operador');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION has_permission(required_perfil TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_perfil TEXT;
BEGIN
  SELECT perfil INTO user_perfil
  FROM user_profiles
  WHERE id = auth.uid() AND ativo = TRUE;

  IF user_perfil IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE required_perfil
    WHEN 'admin' THEN
      RETURN user_perfil = 'admin';
    WHEN 'operador' THEN
      RETURN user_perfil IN ('admin', 'operador');
    WHEN 'visualizador' THEN
      RETURN TRUE;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
