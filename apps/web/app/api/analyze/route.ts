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
  const dirStats = Object.keys({ ...dirWin, ...dirLoss }).map((d) => {
    const w = dirWin[d] || 0; const l = dirLoss[d] || 0; const t = w + l;
    return `${d}: ${w} acertos, ${l} erros (${t > 0 ? Math.round((w / t) * 100) : 0}%)`;
  });

  // Tendency analysis
  const tendWin: Record<string, number> = {};
  const tendLoss: Record<string, number> = {};
  wins.forEach((a) => { tendWin[a.tendency] = (tendWin[a.tendency] || 0) + 1; });
  losses.forEach((a) => { tendLoss[a.tendency] = (tendLoss[a.tendency] || 0) + 1; });
  const tendStats = Object.keys({ ...tendWin, ...tendLoss }).map((t) => {
    const w = tendWin[t] || 0; const l = tendLoss[t] || 0; const tt = w + l;
    return `${t}: ${w} acertos, ${l} erros (${tt > 0 ? Math.round((w / tt) * 100) : 0}%)`;
  });

  // Risk analysis
  const riskWin: Record<string, number> = {};
  const riskLoss: Record<string, number> = {};
  wins.forEach((a) => { riskWin[a.risk] = (riskWin[a.risk] || 0) + 1; });
  losses.forEach((a) => { riskLoss[a.risk] = (riskLoss[a.risk] || 0) + 1; });
  const riskStats = Object.keys({ ...riskWin, ...riskLoss }).map((r) => {
    const w = riskWin[r] || 0; const l = riskLoss[r] || 0; const t = w + l;
    return `${r}: ${w} acertos, ${l} erros (${t > 0 ? Math.round((w / t) * 100) : 0}%)`;
  });

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
    .slice(0, 5)
    .map(([p, c]) => `${p}(${c}x)`);

  // Last 5 detailed losses
  const recentLosses = losses.slice(0, 5).map((a) => {
    let indicators: any[] = []; let patterns: string[] = [];
    try { indicators = JSON.parse(a.indicators || "[]"); } catch {}
    try { patterns = JSON.parse(a.patterns || "[]"); } catch {}
    return `DIR=${a.direction} CONF=${a.confidence}% TEND=${a.tendency} RISCO=${a.risk} PADROES=[${patterns.join(",")}] IND=[${indicators.map((i: any) => i.name).join(",")}] SUP=${a.supportLevel} RES=${a.resistanceLevel} VOL=${a.volatility}`;
  });

  // Last 5 detailed wins
  const recentWins = wins.slice(0, 5).map((a) => {
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

  // Previous lesson
  let lessonBlock = "";
  if (latestLesson) {
    const mistakes = JSON.parse(latestLesson.mistakes || "[]");
    const improvements = JSON.parse(latestLesson.improvements || "[]");
    lessonBlock = `
LIÇÃO APRENDA DA ÚLTIMA VEZ (taxa era ${latestLesson.hitRate}%):
  Erros: ${mistakes.join("; ")}
  Correções: ${improvements.join("; ")}`;
  }

  const isLow = hitRate < 60;

  const context = `
========== RELATÓRIO COMPLETO DE PERFORMANCE DA IA ==========
RESUMO: ${total} análises | ${wins.length} acertos | ${losses.length} erros | Taxa: ${Math.round(hitRate)}%
Sequência máxima de acertos: ${maxWinStreak} | Sequência máxima de erros: ${maxLossStreak}
Confiança média nos acertos: ${avgWinConf}% | nos erros: ${avgLossConf}%

--- ANÁLISE POR DIREÇÃO ---
${dirStats.join("\n")}

--- ANÁLISE POR TENDÊNCIA ---
${tendStats.join("\n")}

--- ANÁLISE POR RISCO ---
${riskStats.join("\n")}

--- PADRÕES QUE MAIS ERRARAM ---
${topLossPatterns.length > 0 ? topLossPatterns.join(", ") : "Sem dados"}

--- ÚLTIMOS 5 ERROS DETALHADOS ---
${recentLosses.length > 0 ? recentLosses.map((l, i) => `  ${i + 1}. ${l}`).join("\n") : "Sem erros registrados"}

--- ÚLTIMOS 5 ACERTOS DETALHADOS ---
${recentWins.length > 0 ? recentWins.map((w, i) => `  ${i + 1}. ${w}`).join("\n") : "Sem acertos registrados"}
${lessonBlock}

========== INSTRUÇÕES OBRIGATÓRIAS ==========
${isLow ? `⚠️ ATENÇÃO CRÍTICA: Taxa de acerto BAIXA (${Math.round(hitRate)}%). Você DEVE seguir estas regras:
1. REDUZA confiança para no máximo 70%
2. Só recomende operação se MÍNIMO 3 indicadores confirmarem a direção
3. ${dirLoss["CALL"] > (dirLoss["PUT"] || 0) ? "CALL errou mais — seja MUITO rigoroso com CALL" : ""}
4. ${dirLoss["PUT"] > (dirLoss["CALL"] || 0) ? "PUT errou mais — seja MUITO rigoroso com PUT" : ""}
5. ${(() => { const tf = tendLoss["Fraca"] || 0; const tw = tendWin["Fraca"] || 0; return (tf > 2 && tw < tf) ? "Tendência Fraca errou muito — EVITE sinais Fracos" : ""; })()}
6. Se confiança média dos erros (${avgLossConf}%) > dos acertos (${avgWinConf}%), você está SOBRECONFIANTE — reduza
7. Verifique distância dos níveis de suporte/resistência:Entry points longe de suporte/resistência = maior risco
8. Prefira NÃO OPERAR a dar sinal incerto` : `Taxa aceitável (${Math.round(hitRate)}%). Mantenha o padrão, mas sempre busque melhorar.`}

REGRAS GERAIS:
- Use os padrões que mais ACERTAM como referência
- Evite padrões que mais ERRAM
- Considere volatilidade: alta volatilidade = mais cautela
- Considere timeframe: timeframes menores = mais ruído
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

    const prompt = `Você é um analista técnico de trading com sistema de AUTO-APRENDIZADO.
Analise este gráfico e forneça análise técnica detalhada.

${performanceContext}

FORMATO OBRIGATÓRIO (JSON válido, sem texto extra):
{
  "direction": "CALL" ou "PUT",
  "confidence": número 60-95,
  "tendency": "Fraca", "Moderada" ou "Forte",
  "risk": "Baixo", "Moderado" ou "Alto",
  "tendencyDescription": "descrição da tendência",
  "indicators": [{"name": "indicador", "description": "descrição"}],
  "patterns": ["padrões gráficos identificados"],
  "levels": {"support": "suporte", "resistance": "resistência", "volatility": "volatilidade"},
  "recommendation": "COMPRA (CALL)" ou "VENDA (PUT)" ou "NÃO OPERAR",
  "entryTime": "horário estimado",
  "warning": "aviso importante",
  "justification": "justificativa técnica detalhada"
}

Timeframe: ${timeframe} minutos.
Analise velas, indicadores, suporte/resistência, tendência, volume e volatilidade.
Considere OBRIGATORIAMENTE o relatório de performance acima para melhorar suas previsões.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { temperature: hitRate < 60 ? 0.2 : 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json({ error: `Erro na API do Gemini: ${response.status}`, details: errorText }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "Resposta vazia da API" }, { status: 500 });
    }

    let jsonStr = text;
    if (text.includes("```json")) jsonStr = text.split("```json")[1].split("```")[0];
    else if (text.includes("```")) jsonStr = text.split("```")[1].split("```")[0];
    jsonStr = jsonStr.trim();

    try {
      const analysis = JSON.parse(jsonStr);
      const minutes = parseInt(timeframe) || 5;
      analysis.entryTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
