# Sistema de Gestão de Associação de Funcionários

Sistema web desenvolvido em Next.js 14 e Supabase para gestão da associação de funcionários.

## Funcionalidades

- ✅ Autenticação de usuários (login/registro)
- ✅ Dashboard com estatísticas
- ✅ Gestão completa de funcionários (CRUD)
- ✅ Gestão de associações mensais
- ✅ Controle de pagamentos
- ✅ Interface moderna e responsiva

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Supabase** - Backend (Banco de dados e Autenticação)
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. No painel do Supabase, vá em **SQL Editor** e execute os seguintes comandos:

```sql
-- Criar tabela de funcionários
CREATE TABLE funcionarios (
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
CREATE TABLE associacoes (
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
CREATE INDEX idx_funcionarios_status ON funcionarios(status);
CREATE INDEX idx_associacoes_funcionario ON associacoes(funcionario_id);
CREATE INDEX idx_associacoes_ano_mes ON associacoes(ano, mes);

-- Habilitar Row Level Security (RLS)
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (permitir todas as operações para usuários autenticados)
CREATE POLICY "Usuários autenticados podem ver funcionários"
  ON funcionarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir funcionários"
  ON funcionarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar funcionários"
  ON funcionarios FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar funcionários"
  ON funcionarios FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem ver associações"
  ON associacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir associações"
  ON associacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar associações"
  ON associacoes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar associações"
  ON associacoes FOR DELETE
  TO authenticated
  USING (true);
```

3. Copie as credenciais do Supabase:
   - Vá em **Settings** > **API**
   - Copie a **URL** e a **anon/public key**

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Executar o projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
├── app/                    # Páginas e rotas (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── funcionarios/      # Gestão de funcionários
│   ├── associacoes/       # Gestão de associações
│   └── login/             # Página de autenticação
├── components/            # Componentes reutilizáveis
├── lib/                   # Configurações e utilitários
│   ├── supabase.ts       # Cliente Supabase
│   └── auth-context.tsx  # Context de autenticação
└── types/                 # Tipos TypeScript
```

## Uso

1. Acesse o sistema e crie uma conta na página de login
2. No dashboard, visualize estatísticas gerais
3. Em Funcionários, adicione e gerencie os funcionários
4. Em Associações, gerencie as mensalidades mensais
5. Marque associações como pagas ou pendentes

## Licença

MIT
