import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function buildPerformanceContext(): Promise<{ context: string; hitRate: number }> {
  const allAnalyses = await prisma.analysis.findMany({
    include: { feedback: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = allAnalyses.length;
  const wins = allAnalyses.filter((a) => a.feedback?.result === "win");
  const losses = allAnalyses.filter((a) => a.feedback?.result === "loss");
  const hitRate = total > 0 ? (wins.length / total) * 100 : 100;

  const latestLesson = await prisma.aILesson.findFirst({ orderBy: { createdAt: "desc" } });

  if (total === 0) {
    return { context: "", hitRate: 100 };
  }

  // Direction analysis
  const dirWin: Record<string, number> = {};
  const dirLoss: Record<string, number> = {};
  wins.forEach((a) => { dirWin[a.direction] = (dirWin[a.direction] || 0) + 1; });
  losses.forEach((a) => { dirLoss[a.direction] = (dirLoss[a.direction] || 0) + 1; });

  // Tendency analysis
  const tendWin: Record<string, number> = {};
  const tendLoss: Record<string, number> = {};
  wins.forEach((a) => { tendWin[a.tendency] = (tendWin[a.tendency] || 0) + 1; });
  losses.forEach((a) => { tendLoss[a.tendency] = (tendLoss[a.tendency] || 0) + 1; });

  // Risk analysis
  const riskWin: Record<string, number> = {};
  const riskLoss: Record<string, number> = {};
  wins.forEach((a) => { riskWin[a.risk] = (riskWin[a.risk] || 0) + 1; });
  losses.forEach((a) => { riskLoss[a.risk] = (riskLoss[a.risk] || 0) + 1; });

  // Confidence analysis
  const winConfs = wins.map((a) => a.confidence);
  const lossConfs = losses.map((a) => a.confidence);
  const avgWinConf = winConfs.length > 0 ? Math.round(winConfs.reduce((a, b) => a + b, 0) / winConfs.length) : 0;
  const avgLossConf = lossConfs.length > 0 ? Math.round(lossConfs.reduce((a, b) => a + b, 0) / lossConfs.length) : 0;

  // Pattern analysis (top loss patterns)
  const patternLoss: Record<string, number> = {};
  losses.forEach((a) => {
    try { JSON.parse(a.patterns || "[]").forEach((p: string) => { patternLoss[p] = (patternLoss[p] || 0) + 1; }); } catch {}
  });
  const topLossPatterns = Object.entries(patternLoss)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c}x erros)`);

  // Pattern success
  const patternWin: Record<string, number> = {};
  wins.forEach((a) => {
    try { JSON.parse(a.patterns || "[]").forEach((p: string) => { patternWin[p] = (patternWin[p] || 0) + 1; }); } catch {}
  });
  const topWinPatterns = Object.entries(patternWin)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([p, c]) => `${p}(${c}x acertos)`);

  // Last 3 detailed losses (reduced from 5)
  const recentLosses = losses.slice(0, 3).map((a) => {
    let indicators: any[] = []; let patterns: string[] = [];
    try { indicators = JSON.parse(a.indicators || "[]"); } catch {}
    try { patterns = JSON.parse(a.patterns || "[]"); } catch {}
    return `DIR=${a.direction} CONF=${a.confidence}% TEND=${a.tendency} RISCO=${a.risk} PADROES=[${patterns.join(",")}] IND=[${indicators.map((i: any) => i.name).join(",")}]`;
  });

  // Streak
  let maxWinStreak = 0, maxLossStreak = 0, curW = 0, curL = 0;
  allAnalyses.forEach((a) => {
    if (a.feedback?.result === "win") { curW++; curL = 0; maxWinStreak = Math.max(maxWinStreak, curW); }
    else if (a.feedback?.result === "loss") { curL++; curW = 0; maxLossStreak = Math.max(maxLossStreak, curL); }
    else { curW = 0; curL = 0; }
  });

  // Previous lesson (condensed)
  let lessonBlock = "";
  if (latestLesson) {
    const improvements = JSON.parse(latestLesson.improvements || "[]");
    lessonBlock = `LIÇÃO ANTERIOR: ${improvements.slice(0, 3).join("; ")}`;
  }

  const isLow = hitRate < 60;

  const context = `
HISTÓRICO: ${total} análises | ${wins.length}V/${losses.length}D | Taxa: ${Math.round(hitRate)}%
Confiança média: acertos=${avgWinConf}% erros=${avgLossConf}%
Sequência: ${maxWinStreak}W / ${maxLossStreak}L

DIREÇÃO: ${Object.entries(dirWin).map(([d, w]) => `${d}=${w}W/${dirLoss[d] || 0}D`).join(" | ")}
TENDÊNCIA: ${Object.entries(tendWin).map(([t, w]) => `${t}=${w}W/${tendLoss[t] || 0}D`).join(" | ")}
RISCO: ${Object.entries(riskWin).map(([r, w]) => `${r}=${w}W/${riskLoss[r] || 0}D`).join(" | ")}

PADRÕES QUE ERRAM: ${topLossPatterns.length > 0 ? topLossPatterns.join(", ") : "Nenhum"}
PADRÕES QUE ACERTAM: ${topWinPatterns.length > 0 ? topWinPatterns.join(", ") : "Nenhum"}

ERROS RECENTES: ${recentLosses.length > 0 ? recentLosses.join(" | ") : "Nenhum"}
${lessonBlock}

REGRAS CRÍTICAS:
${isLow ? `- TAXA BAIXA (${Math.round(hitRate)}%): Máximo confiança 70%, mínimo 3 indicadores confirmando
- NÃO OPERAR se incerto — melhor perder oportunidade que entrar em erro
- Ser mais exigente em CALL/PUT com mais erros` : `- Manter critérios, sempre buscar melhoria`}
- Evite padrões que mais erram listados acima
- Use timeframe para julgar ruído (menor = mais ruído)
- Considere volatilidade: alta = mais cautela
- Responda APENAS com JSON válido`;

  return { context, hitRate };
}

export async function POST(request: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chave da API Gemini não configurada" }, { status: 500 });
    }

    const body = await request.json();
    const { image, timeframe } = body;

    if (!image) {
      return NextResponse.json({ error: "Imagem não fornecida" }, { status: 400 });
    }

    const parts = image.split(",");
    if (parts.length < 2) {
      return NextResponse.json({ error: "Formato de imagem inválido" }, { status: 400 });
    }

    const base64Data = parts[1];
    const mimeTypeMatch = parts[0].match(/data:([^;]+)/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";

    const { context: performanceContext, hitRate } = await buildPerformanceContext();

    const prompt = `ANALISADOR TÉCNICO DE GRÁFIOS FINANCEIROS — SISTEMA COM AUTO-APRENDIZADO

CONTEXTO DO SEU DESEMPENHO ANTERIOR:
${performanceContext}

═══════════════════════════════════════════════════
ANÁLISE OBRIGATÓRIA PASSO A PASSO (Siga esta ordem):
═══════════════════════════════════════════════════

PASSO 1 — IDENTIFIQUE A TENDÊNCIA PRINCIPAL:
- Olhe as últimas 10-15 velas: estão subindo, descendo ou laterais?
- Identifique a direção predominante (ALTA, BAIXA, LATERAL)
- Se lateral = NÃO OPERAR (recomendação: "NÃO OPERAR")

PASSO 2 — IDENTIFIQUE SUPORTE E RESISTÊNCIA:
- Marque os níveis mais recentes onde o preço parou de cair (suporte)
- Marque os níveis mais recentes onde o preço parou de subir (resistência)
- O preço está mais perto de qual nível? Isso indica para onde pode ir

PASSO 3 — ANALISE OS INDICADORES TÉCNICOS:
- RSI: Acima de 70 = sobrecomprado (PUT mais provável), abaixo de 30 = sobrevendido (CALL mais provável)
- MACD: Cruza pra cima = CALL, cruza pra baixo = PUT
- Médias Móveis: Preço acima = tendência de alta, abaixo = tendência de baixa
- Volume: Volume crescente confirma a tendência

PASSO 4 — IDENTIFIQUE PADRÕES DE VELAS:
- Engolfo de alta/baixa, Doji, Martelo, Estrela Cadente
- Padrões de reversão são mais confiáveis que continuações

PASSO 5 — AVALIE O RISCO:
- Alta volatilidade = risco Alto
- Tendência clara = risco Baixo/Moderado
- Tendência lateral = risco Alto (NÃO OPERAR)

PASSO 6 — DECIDA A DIREÇÃO:
- CALL: Só se pelo menos 3 dos 5 passos anteriores confirmarem alta
- PUT: Só se pelo menos 3 dos 5 passos anteriores confirmarem baixa
- NÃO OPERAR: Se não houver clareza suficiente

═══════════════════════════════════════════════════
TIMEFRAME: ${timeframe} minutos
═══════════════════════════════════════════════════

═══════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON válido, sem texto adicional):
═══════════════════════════════════════════════════
{
  "direction": "CALL" ou "PUT",
  "confidence": número 50-85 (seja realista, não inflacione),
  "tendency": "Fraca" ou "Moderada" ou "Forte",
  "risk": "Baixo" ou "Moderado" ou "Alto",
  "tendencyDescription": "descrição objetiva da tendência identificada",
  "indicators": [{"name": "nome do indicador", "description": "leitura do indicador"}],
  "patterns": ["padrões de velas identificados"],
  "levels": {"support": "nível de suporte", "resistance": "nível de resistência", "volatility": "Baixa/Média/Alta"},
  "recommendation": "COMPRA (CALL)" ou "VENDA (PUT)" ou "NÃO OPERAR",
  "entryTime": "horário de entrada estimado",
  "warning": "aviso de risco se houver",
  "justification": "justificativa técnica em 2-3 frases explicando o porquê da decisão"
}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: {
          temperature: hitRate < 60 ? 0.1 : 0.3,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: "none" },
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json({ error: `Erro na API do Gemini: ${response.status}`, details: errorText }, { status: 500 });
    }

    const data = await response.json();
    const responseParts = data.candidates?.[0]?.content?.parts || [];
    const text = responseParts.find((p: any) => p.text && !p.thought)?.text || responseParts[0]?.text || "";

    if (!text) {
      return NextResponse.json({ error: "Resposta vazia da API" }, { status: 500 });
    }

    let jsonStr = text;
    if (text.includes("```json")) jsonStr = text.split("```json")[1].split("```")[0];
    else if (text.includes("```")) jsonStr = text.split("```")[1].split("```")[0];
    jsonStr = jsonStr.trim();

    try {
      const analysis = JSON.parse(jsonStr);

      // Validate required fields
      const requiredFields = ["direction", "confidence", "tendency", "risk", "recommendation"];
      for (const field of requiredFields) {
        if (!analysis[field]) {
          analysis[field] = field === "direction" ? "CALL" : field === "confidence" ? 65 : field === "recommendation" ? "NÃO OPERAR" : "Moderado";
        }
      }

      // Validate direction
      if (!["CALL", "PUT"].includes(analysis.direction)) {
        analysis.direction = "CALL";
      }

      // Validate confidence range (50-85)
      analysis.confidence = Math.max(50, Math.min(85, parseInt(analysis.confidence) || 65));

      // Validate tendency
      if (!["Fraca", "Moderada", "Forte"].includes(analysis.tendency)) {
        analysis.tendency = "Moderada";
      }

      // Validate risk
      if (!["Baixo", "Moderado", "Alto"].includes(analysis.risk)) {
        analysis.risk = "Moderado";
      }

      // Validate recommendation
      if (!["COMPRA (CALL)", "VENDA (PUT)", "NÃO OPERAR"].includes(analysis.recommendation)) {
        analysis.recommendation = "NÃO OPERAR";
      }

      // If low hit rate, enforce max confidence 70%
      if (hitRate < 60 && analysis.confidence > 70) {
        analysis.confidence = 70;
      }

      // Set entry time
      const minutes = parseInt(timeframe) || 5;
      analysis.entryTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      // Ensure arrays exist
      if (!Array.isArray(analysis.indicators)) analysis.indicators = [];
      if (!Array.isArray(analysis.patterns)) analysis.patterns = [];

      return NextResponse.json({ success: true, analysis, currentHitRate: Math.round(hitRate) });
    } catch (parseError) {
      console.error("Parse error:", parseError, "Raw text:", text);
      return NextResponse.json({ error: "Erro ao processar resposta da IA", raw: text }, { status: 500 });
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
