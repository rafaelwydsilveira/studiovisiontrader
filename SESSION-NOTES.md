# Study Analyzer - Session Notes

## Status: Gemini API integrado e funcionando

## O que foi feito nesta sessão

### Gemini API - Correções
- Modelo original `gemini-2.0-flash` foi descontinuado pela Google (404)
- Testamos `gemini-2.5-flash` - também descontinuado para novos usuários
- **Modelo final: `gemini-3.6-flash`** - confirmado funcionando via teste de endpoint
- Gemini 3.6 Flash tem "thinking" habilitado por padrão - configuração `thinkingLevel: "minimal"` adicionada para respostas limpas
- Variável `GEMINI_API_KEY` lida em runtime (dentro do handler) em vez de module-level
- Parse de resposta atualizado para filtrar partes de "thought" do thinking

### Erros corrigidos
1. **404 no Gemini**: Modelos descontinuados → trocado para `gemini-3.6-flash`
2. **Variável duplicada `parts`**: Renomeada para `responseParts` na resposta do Gemini
3. **Build quebrando**: Erro de tipo `errorMsg` não definido → removido
4. **Debug temporário removido**: alert(), endpoint test-gemini, logs extras

### Configuração Gemini API
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`
- generationConfig: `{ temperature, maxOutputTokens: 4096, thinkingConfig: { thinkingLevel: "minimal" } }`
- Response parsing: filtra `thought` parts, pega primeira parte com texto

## Fluxo completo (confirmado funcionando)
1. Usuário faz upload/print de gráfico → `POST /api/analyze`
2. `buildPerformanceContext()` monta contexto com dados do relatório + lições
3. Envia para Gemini 3.6 Flash → resposta JSON com análise técnica
4. Salva no banco (PostgreSQL/Supabase) via Prisma
5. Usuário marca Acertei/Errei/Rejeitar → `POST /api/analyses/[id]/feedback`
6. Feedback atualiza PerformanceSnapshot
7. Se hit rate < 60% e >= 3 análises → `generateDeepAILesson()` cria lição
8. Próxima análise inclui lição no prompt → ciclo de auto-aprendizado

## Dados do projeto
- **Deploy**: https://studiovisiontrader-web.vercel.app/
- **GitHub**: https://github.com/rafaelwydsilveira/studiovisiontrader
- **Supabase**: https://rwbyrwzawtkbzsnxsgiq.supabase.co
- **Banco**: PostgreSQL no Supabase (sa-east-1, port 5432)
- **Prisma**: importa de `@prisma/client`
- **Tables**: Analysis, Feedback, PerformanceSnapshot, AILesson

## Arquivos principais
- `apps/web/app/page.tsx` - UI principal (~820 linhas)
- `apps/web/app/api/analyze/route.ts` - Gemini proxy com auto-aprendizado
- `apps/web/app/api/report/route.ts` - Relatório de performance completo
- `apps/web/app/api/analyses/[id]/feedback/route.ts` - Feedback + lições
- `apps/web/prisma/schema.prisma` - Schema PostgreSQL
- `apps/web/lib/prisma.ts` - Singleton Prisma

## Próximos passos
- Testar fluxo completo com dados reais (análises + feedback + lições)
- Verificar se lições aparecem no relatório (`/api/report`)
- Verificar se lições melhoram previsões ao longo do tempo
- Possíveis melhorias: UI, mais indicadores, gráficos de evolução
