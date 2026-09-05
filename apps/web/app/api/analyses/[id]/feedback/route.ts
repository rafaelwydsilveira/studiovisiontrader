import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { result, comment } = body;

    const analysis = await prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    const existingFeedback = await prisma.feedback.findUnique({ where: { analysisId: id } });
    if (existingFeedback) {
      return NextResponse.json({ error: "Feedback já foi dado para esta análise" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: { analysisId: id, result, comment },
    });

    // Recalculate all performance
    const allAnalyses = await prisma.analysis.findMany({
      include: { feedback: true },
      orderBy: { createdAt: "desc" },
    });

    const totalAnalyses = allAnalyses.length;
    const wins = allAnalyses.filter((a) => a.feedback?.result === "win");
    const losses = allAnalyses.filter((a) => a.feedback?.result === "loss");
    const winCount = wins.length;
    const lossCount = losses.length;
    const hitRate = totalAnalyses > 0 ? (winCount / totalAnalyses) * 100 : 0;

    // Efficiency
    const correctWithConf = wins.reduce((sum, a) => sum + a.confidence, 0);
    const efficiency = winCount > 0 ? correctWithConf / winCount : 0;

    // Consistency (streak)
    let maxStreak = 0, currentStreak = 0;
    for (const a of allAnalyses) {
      if (a.feedback?.result === "win") { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else if (a.feedback?.result === "loss") { currentStreak = 0; }
    }
    const consistency = totalAnalyses > 0 ? Math.min(100, (maxStreak / totalAnalyses) * 150) : 0;

    // Neural calibration
    const highConf = allAnalyses.filter((a) => a.confidence >= 70);
    const correctHighConf = highConf.filter((a) => a.feedback?.result === "win").length;
    const neuralCalibration = highConf.length > 0 ? (correctHighConf / highConf.length) * 100 : efficiency * 0.9;

    await prisma.performanceSnapshot.create({
      data: {
        totalAnalyses,
        wins: winCount,
        losses: lossCount,
        hitRate: Math.round(hitRate * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        consistency: Math.min(100, Math.round(consistency * 100) / 100),
        neuralCalibration: Math.min(100, Math.round(neuralCalibration * 100) / 100),
      },
    });

    // Generate AI lesson if hit rate below 60%
    if (hitRate < 60 && totalAnalyses >= 3) {
      await generateDeepAILesson(allAnalyses, hitRate, totalAnalyses, winCount, lossCount);
    }

    return NextResponse.json({ success: true, feedback, currentHitRate: Math.round(hitRate) });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Erro ao criar feedback" }, { status: 500 });
  }
}

async function generateDeepAILesson(
  allAnalyses: any[],
  hitRate: number,
  total: number,
  wins: number,
  losses: number
) {
  try {
    const lossAnalyses = allAnalyses.filter((a) => a.feedback?.result === "loss");
    const winAnalyses = allAnalyses.filter((a) => a.feedback?.result === "win");

    // --- Deep dimension analysis ---
    const dirLoss: Record<string, number> = {};
    const dirWin: Record<string, number> = {};
    const tendLoss: Record<string, number> = {};
    const tendWin: Record<string, number> = {};
    const riskLoss: Record<string, number> = {};
    const riskWin: Record<string, number> = {};
    const confLoss: number[] = [];
    const confWin: number[] = [];
    const patternLoss: Record<string, number> = {};
    const patternWin: Record<string, number> = {};
    const indicatorLoss: Record<string, number> = {};
    const indicatorWin: Record<string, number> = {};
    const tfLoss: Record<string, number> = {};
    const tfWin: Record<string, number> = {};

    lossAnalyses.forEach((a) => {
      dirLoss[a.direction] = (dirLoss[a.direction] || 0) + 1;
      tendLoss[a.tendency] = (tendLoss[a.tendency] || 0) + 1;
      riskLoss[a.risk] = (riskLoss[a.risk] || 0) + 1;
      confLoss.push(a.confidence);
      tfLoss[a.timeframe] = (tfLoss[a.timeframe] || 0) + 1;
      try { JSON.parse(a.patterns || "[]").forEach((p: string) => { patternLoss[p] = (patternLoss[p] || 0) + 1; }); } catch {}
      try { JSON.parse(a.indicators || "[]").forEach((i: any) => { const n = typeof i === "string" ? i : i.name; indicatorLoss[n] = (indicatorLoss[n] || 0) + 1; }); } catch {}
    });

    winAnalyses.forEach((a) => {
      dirWin[a.direction] = (dirWin[a.direction] || 0) + 1;
      tendWin[a.tendency] = (tendWin[a.tendency] || 0) + 1;
      riskWin[a.risk] = (riskWin[a.risk] || 0) + 1;
      confWin.push(a.confidence);
      tfWin[a.timeframe] = (tfWin[a.timeframe] || 0) + 1;
      try { JSON.parse(a.patterns || "[]").forEach((p: string) => { patternWin[p] = (patternWin[p] || 0) + 1; }); } catch {}
      try { JSON.parse(a.indicators || "[]").forEach((i: any) => { const n = typeof i === "string" ? i : i.name; indicatorWin[n] = (indicatorWin[n] || 0) + 1; }); } catch {}
    });

    const mistakes: string[] = [];
    const improvements: string[] = [];
    const patterns_to_avoid: string[] = [];
    const patterns_to_use: string[] = [];

    // Direction bias
    const callLosses = dirLoss["CALL"] || 0;
    const putLosses = dirLoss["PUT"] || 0;
    const callWins = dirWin["CALL"] || 0;
    const putWins = dirWin["PUT"] || 0;
    if (callLosses > putLosses + 1) {
      const callRate = callWins + callLosses > 0 ? Math.round((callWins / (callWins + callLosses)) * 100) : 0;
      mistakes.push(`CALL errou ${callLosses}x vs PUT ${putLosses}x (taxa CALL: ${callRate}%)`);
      improvements.push(`CALL está com baixo desempenho — ser mais rigoroso, exigir mais confirmações para CALL`);
    } else if (putLosses > callLosses + 1) {
      const putRate = putWins + putLosses > 0 ? Math.round((putWins / (putWins + putLosses)) * 100) : 0;
      mistakes.push(`PUT errou ${putLosses}x vs CALL ${callLosses}x (taxa PUT: ${putRate}%)`);
      improvements.push(`PUT está com baixo desempenho — ser mais rigoroso, exigir mais confirmações para PUT`);
    }

    // Tendency bias
    Object.entries(tendLoss).forEach(([tendency, count]) => {
      const w = tendWin[tendency] || 0;
      const total = w + count;
      if (total >= 2) {
        const rate = Math.round((w / total) * 100);
        if (rate < 50) {
          mistakes.push(`Tendência "${tendency}" acertou apenas ${rate}% (${w}/${total})`);
          improvements.push(`Evitar tendência "${tendency}" sem confirmação extra de indicadores`);
        }
      }
    });

    // Risk bias
    Object.entries(riskLoss).forEach(([risk, count]) => {
      const w = riskWin[risk] || 0;
      const total = w + count;
      if (total >= 2) {
        const rate = Math.round((w / total) * 100);
        if (rate < 50) {
          mistakes.push(`Risco "${risk}" acertou apenas ${rate}% (${w}/${total})`);
          if (risk === "Alto") improvements.push("Evitar análises com risco Alto");
          else improvements.push(`Ser mais cauteloso com risco "${risk}"`);
        }
      }
    });

    // Confidence bias
    const avgLossC = confLoss.length > 0 ? Math.round(confLoss.reduce((a, b) => a + b, 0) / confLoss.length) : 0;
    const avgWinC = confWin.length > 0 ? Math.round(confWin.reduce((a, b) => a + b, 0) / confWin.length) : 0;
    if (avgLossC > avgWinC + 5) {
      mistakes.push(`Confiança nos erros (${avgLossC}%) > nos acertos (${avgWinC}%) — overconfident`);
      improvements.push(`Reduzir confiança geral — máxima recomendada: ${Math.max(65, avgWinC + 5)}%`);
    }

    // Pattern analysis
    Object.entries(patternLoss).forEach(([pattern, count]) => {
      const w = patternWin[pattern] || 0;
      const total = w + count;
      if (count >= 2 && total >= 3) {
        const rate = Math.round((w / total) * 100);
        if (rate < 40) {
          mistakes.push(`Padrão "${pattern}" falhou ${count}x (${rate}% acerto)`);
          patterns_to_avoid.push(pattern);
        }
      }
    });

    // Pattern success
    Object.entries(patternWin).forEach(([pattern, count]) => {
      const l = patternLoss[pattern] || 0;
      const total = count + l;
      if (count >= 2 && total >= 3) {
        const rate = Math.round((count / total) * 100);
        if (rate >= 60) {
          patterns_to_use.push(`${pattern}(${rate}%)`);
        }
      }
    });

    // Indicator analysis
    Object.entries(indicatorLoss).forEach(([indicator, count]) => {
      const w = indicatorWin[indicator] || 0;
      const total = w + count;
      if (count >= 2 && total >= 3) {
        const rate = Math.round((w / total) * 100);
        if (rate < 40) {
          mistakes.push(`Indicador "${indicator}" errou ${count}x (${rate}% acerto)`);
        }
      }
    });

    // Timeframe analysis
    Object.entries(tfLoss).forEach(([tf, count]) => {
      const w = tfWin[tf] || 0;
      const total = w + count;
      if (total >= 2) {
        const rate = Math.round((w / total) * 100);
        if (rate < 40) {
          mistakes.push(`Timeframe ${tf}min acertou apenas ${rate}% (${w}/${total})`);
          improvements.push(`Timeframe ${tf}min com baixa performance — considerar usar timeframe maior`);
        }
      }
    });

    if (improvements.length === 0) improvements.push("Manter critérios atuais, aguardar mais dados para identificar padrões");
    if (mistakes.length === 0) mistakes.push("Dados insuficientes para identificar padrões específicos de erro");

    const prompt = `LIÇÃO AUTOMÁTICA (taxa atual: ${Math.round(hitRate)}%, mínimo: 60%):
DIREÇÕES: ${Object.entries(dirLoss).map(([d, c]) => `${d}=${c}erros`).join(", ")}
TENDÊNCIAS: ${Object.entries(tendLoss).map(([t, c]) => `${t}=${c}erros`).join(", ")}
RISCOS: ${Object.entries(riskLoss).map(([r, c]) => `${r}=${c}erros`).join(", ")}
ERROS: ${mistakes.join("; ")}
MELHORIAS: ${improvements.join("; ")}
PADRÕES EVITAR: ${patterns_to_avoid.join(", ") || "nenhum"}
PADRÕES USAR: ${patterns_to_use.join(", ") || "nenhum"}`;

    await prisma.aILesson.create({
      data: {
        hitRate: Math.round(hitRate * 100) / 100,
        totalAnalyses: total,
        wins,
        losses,
        patterns: JSON.stringify(patterns_to_avoid),
        mistakes: JSON.stringify(mistakes),
        improvements: JSON.stringify(improvements),
        prompt,
      },
    });

    console.log(`AI Lesson #${total}: ${mistakes.length} erros, ${improvements.length} correções, taxa=${Math.round(hitRate)}%`);
  } catch (error) {
    console.error("Error generating AI lesson:", error);
  }
}
