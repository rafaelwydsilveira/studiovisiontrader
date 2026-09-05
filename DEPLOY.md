# Deploy - Supabase + Vercel

## Passo 1: Criar conta no Supabase

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **"New project"**
3. Preencha:
   - **Organization**: crie uma ou selecione existente
   - **Project name**: `study-analyzer`
   - **Database Password**: crie uma senha forte (anote!)
   - **Region**: selecione a mais próxima (Brazil = São Paulo)
4. Aguarde o projeto ser criado (~2 minutos)

## Passo 2: Pegar credenciais do Supabase

1. No painel do projeto, vá em **Settings** → **Database**
2. Copie a **Connection string** → **URI**
3. O formato será: `postgresql://postgres.[ref]:[senha]@aws-0-[region].pooler.supabase.com:6543/postgres`

## Passo 3: Criar tabelas no Supabase

1. No painel, vá em **SQL Editor**
2. Cole e execute este SQL:

```sql
-- Tabela de análises
CREATE TABLE "Analysis" (
  "id" TEXT NOT NULL DEFAULT cuid(),
  "fileName" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL,
  "imageData" TEXT,
  "direction" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "tendency" TEXT NOT NULL,
  "risk" TEXT NOT NULL,
  "tendencyDesc" TEXT NOT NULL,
  "indicators" TEXT NOT NULL DEFAULT '[]',
  "patterns" TEXT NOT NULL DEFAULT '[]',
  "supportLevel" TEXT NOT NULL,
  "resistanceLevel" TEXT NOT NULL,
  "volatility" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "entryTime" TEXT NOT NULL,
  "warning" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- Tabela de feedback
CREATE TABLE "Feedback" (
  "id" TEXT NOT NULL DEFAULT cuid(),
  "analysisId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Feedback_analysisId_key" UNIQUE ("analysisId"),
  CONSTRAINT "Feedback_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela de snapshots de performance
CREATE TABLE "PerformanceSnapshot" (
  "id" TEXT NOT NULL DEFAULT cuid(),
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalAnalyses" INTEGER NOT NULL,
  "wins" INTEGER NOT NULL,
  "losses" INTEGER NOT NULL,
  "hitRate" DOUBLE PRECISION NOT NULL,
  "efficiency" DOUBLE PRECISION NOT NULL,
  "consistency" DOUBLE PRECISION NOT NULL,
  "neuralCalibration" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- Tabela de lições da IA
CREATE TABLE "AILesson" (
  "id" TEXT NOT NULL DEFAULT cuid(),
  "hitRate" DOUBLE PRECISION NOT NULL,
  "totalAnalyses" INTEGER NOT NULL,
  "wins" INTEGER NOT NULL,
  "losses" INTEGER NOT NULL,
  "patterns" TEXT NOT NULL DEFAULT '[]',
  "mistakes" TEXT NOT NULL DEFAULT '[]',
  "improvements" TEXT NOT NULL DEFAULT '[]',
  "prompt" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AILesson_pkey" PRIMARY KEY ("id")
);

-- Índices para performance
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");
CREATE INDEX "Feedback_analysisId_idx" ON "Feedback"("analysisId");
CREATE INDEX "PerformanceSnapshot_date_idx" ON "PerformanceSnapshot"("date");
CREATE INDEX "AILesson_createdAt_idx" ON "AILesson"("createdAt");
```

## Passo 4: Criar conta no Vercel

1. Acesse https://vercel.com e crie uma conta (pode usar GitHub)
2. Clique em **"Add New..."** → **"Project"**

## Passo 5: Conectar repositório GitHub

1. Faça push do projeto para o GitHub:
```bash
cd study-analyzer
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/study-analyzer.git
git push -u origin main
```

2. No Vercel, importe o repositório `study-analyzer`

## Passo 6: Configurar variáveis de ambiente no Vercel

No painel do Vercel, vá em **Settings** → **Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[senha]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `GEMINI_API_KEY` | `sua_chave_gemini` |

## Passo 7: Configurar build do Vercel

No painel do Vercel, vá em **Settings** → **General**:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && npm install && cd apps/web && npx prisma generate && npx next build`
- **Output Directory**: `.next`

## Passo 8: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Pronto! Seu site estará online em `https://study-analyzer.vercel.app`

## Variáveis de ambiente (resumo)

```
DATABASE_URL=postgresql://postgres.xxx:senha@aws-0-us-east-1.pooler.supabase.com:6543/postgres
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_APP_NAME=Study Analyzer
```

## Comandos úteis

```bash
# Gerar Prisma Client
npx prisma generate

# Push schema para o banco
npx prisma db push

# Ver dados no banco
npx prisma studio

# Build local
npm run build
```
