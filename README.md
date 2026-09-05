# Study Analyzer

Ferramenta de estudo de análise técnica com inteligência artificial.

## Sobre

O Study Analyzer é uma plataforma educacional que permite aos usuários enviar screenshots de gráficos financeiros e receber análises técnicas automatizadas usando inteligência artificial.

### Funcionalidades

- **Upload de Gráfico**: Envie screenshots de qualquer plataforma de trading
- **Análise com IA**: Receba análise detalhada com CALL/PUT, confiança e níveis
- **Modo Estudo**: Aprenda sobre padrões e indicadores com explicações detalhadas
- **Glossário Interativo**: Consulte termos técnicos de análise técnica
- **Histórico**: Acompanhe suas análises anteriores
- **Estatísticas**: Veja seu desempenho ao longo do tempo
- **Watchlist**: Monitore seus ativos de interesse

## Stack Tecnológica

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (State Management)
- React Hook Form + Zod (Forms)

### Backend
- Fastify
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (Autenticação)

### Infraestrutura
- Vercel (Frontend)
- Railway/Render (Backend)
- Supabase (Banco de Dados)
- Cloudflare R2 (Storage)

## Estrutura do Projeto

```
study-analyzer/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── app/               # App Router
│   │   ├── components/        # Componentes React
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilitários
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # Tipos TypeScript
│   └── api/                    # Backend Fastify
│       ├── src/
│       │   ├── routes/        # Rotas da API
│       │   ├── services/      # Serviços
│       │   └── middleware/    # Middleware
│       └── prisma/            # Schema do banco
├── packages/
│   └── shared/                 # Código compartilhado
└── docs/                       # Documentação
```

## Como Rodar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- PostgreSQL (ou usar Supabase)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/study-analyzer.git

# Entrar na pasta
cd study-analyzer

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Rodar o banco de dados (opcional - usando Prisma)
cd apps/api
npx prisma db push

# Voltar à raiz
cd ../..

# Rodar o projeto
npm run dev
```

### Acessos

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

## Funcionalidades Implementadas

### Fase 1 - Estrutura ✅
- [x] Monorepo com Turborepo
- [x] Configuração Next.js
- [x] Configuração Fastify
- [x] Tailwind CSS + shadcn/ui

### Fase 2 - Autenticação ✅
- [x] Página de Login
- [x] Página de Registro
- [x] JWT Auth

### Fase 3 - Interface ✅
- [x] Layout principal
- [x] Header com navegação
- [x] Sidebar
- [x] Dashboard com stats

### Fase 4 - Upload e Análise ✅
- [x] Componente de upload
- [x] Preview de imagem
- [x] Integração com IA (mock)
- [x] Exibição de resultados

### Fase 5 - Funcionalidades ✅
- [x] Histórico de análises
- [x] Detalhe da análise
- [x] Watchlist
- [x] Configurações
- [x] Estatísticas
- [x] Modo Estudo

## Próximos Passos

- [ ] Integrar com OpenAI Vision API real
- [ ] Adicionar upload para Cloudflare R2
- [ ] Implementar banco de dados PostgreSQL
- [ ] Adicionar testes
- [ ] Deploy em produção
- [ ] Modo Estudo completo com explicações detalhadas
- [ ] Gamificação (badges, XP)
- [ ] Multi-idioma (PT/EN)

## Licença

MIT
