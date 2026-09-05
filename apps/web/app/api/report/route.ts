import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allAnalyses = await prisma.analysis.findMany({
      include: { feedback: true },
      orderBy: { createdAt: "desc" },
    });

    const total = allAnalyses.length;
    const wins = allAnalyses.filter((a) => a.feedback?.result === "win");
    const losses = allAnalyses.filter((a) => a.feedback?.result === "loss");
    const pending = allAnalyses.filter((a) => !a.feedback);
    const hitRate = total > 0 ? (wins.length / total) * 100 : 0;

    // --- Direction analysis ---
    const dirWin: Record<string, number> = {};
    const dirLoss: Record<string, number> = {};
    wins.forEach((a) => { dirWin[a.direction] = (dirWin[a.direction] || 0) + 1; });
    losses.forEach((a) => { dirLoss[a.direction] = (dirLoss[a.direction] || 0) + 1; });

    const directionAnalysis = Object.keys({ ...dirWin, ...dirLoss }).map((dir) => {
      const w = dirWin[dir] || 0;
      const l = dirLoss[dir] || 0;
      const total = w + l;
      return {
        direction: dir,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    });

    // --- Tendency analysis ---
    const tendWin: Record<string, number> = {};
    const tendLoss: Record<string, number> = {};
    wins.forEach((a) => { tendWin[a.tendency] = (tendWin[a.tendency] || 0) + 1; });
    losses.forEach((a) => { tendLoss[a.tendency] = (tendLoss[a.tendency] || 0) + 1; });

    const tendencyAnalysis = Object.keys({ ...tendWin, ...tendLoss }).map((t) => {
      const w = tendWin[t] || 0;
      const l = tendLoss[t] || 0;
      const total = w + l;
      return {
        tendency: t,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    });

    // --- Risk analysis ---
    const riskWin: Record<string, number> = {};
    const riskLoss: Record<string, number> = {};
    wins.forEach((a) => { riskWin[a.risk] = (riskWin[a.risk] || 0) + 1; });
    losses.forEach((a) => { riskLoss[a.risk] = (riskLoss[a.risk] || 0) + 1; });

    const riskAnalysis = Object.keys({ ...riskWin, ...riskLoss }).map((r) => {
      const w = riskWin[r] || 0;
      const l = riskLoss[r] || 0;
      const total = w + l;
      return {
        risk: r,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    });

    // --- Confidence analysis ---
    const winConfidences = wins.map((a) => a.confidence);
    const lossConfidences = losses.map((a) => a.confidence);
    const avgWinConf = winConfidences.length > 0
      ? Math.round(winConfidences.reduce((a, b) => a + b, 0) / winConfidences.length)
      : 0;
    const avgLossConf = lossConfidences.length > 0
      ? Math.round(lossConfidences.reduce((a, b) => a + b, 0) / lossConfidences.length)
      : 0;

    // Confidence ranges
    const confRanges = [
      { label: "60-69%", min: 60, max: 69 },
      { label: "70-79%", min: 70, max: 79 },
      { label: "80-89%", min: 80, max: 89 },
      { label: "90-100%", min: 90, max: 100 },
    ];

    const confidenceAnalysis = confRanges.map((range) => {
      const rangeWins = wins.filter((a) => a.confidence >= range.min && a.confidence <= range.max).length;
      const rangeLosses = losses.filter((a) => a.confidence >= range.min && a.confidence <= range.max).length;
      const rangeTotal = rangeWins + rangeLosses;
      return {
        range: range.label,
        wins: rangeWins,
        losses: rangeLosses,
        total: rangeTotal,
        hitRate: rangeTotal > 0 ? Math.round((rangeWins / rangeTotal) * 100) : 0,
      };
    });

    // --- Pattern analysis ---
    const patternWin: Record<string, number> = {};
    const patternLoss: Record<string, number> = {};
    wins.forEach((a) => {
      try {
        JSON.parse(a.patterns || "[]").forEach((p: string) => {
          patternWin[p] = (patternWin[p] || 0) + 1;
        });
      } catch {}
    });
    losses.forEach((a) => {
      try {
        JSON.parse(a.patterns || "[]").forEach((p: string) => {
          patternLoss[p] = (patternLoss[p] || 0) + 1;
        });
      } catch {}
    });

    const patternAnalysis = Object.keys({ ...patternWin, ...patternLoss }).map((p) => {
      const w = patternWin[p] || 0;
      const l = patternLoss[p] || 0;
      const total = w + l;
      return {
        pattern: p,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);

    // --- Indicator analysis ---
    const indicatorWin: Record<string, number> = {};
    const indicatorLoss: Record<string, number> = {};
    wins.forEach((a) => {
      try {
        JSON.parse(a.indicators || "[]").forEach((i: any) => {
          const name = typeof i === "string" ? i : i.name;
          indicatorWin[name] = (indicatorWin[name] || 0) + 1;
        });
      } catch {}
    });
    losses.forEach((a) => {
      try {
        JSON.parse(a.indicators || "[]").forEach((i: any) => {
          const name = typeof i === "string" ? i : i.name;
          indicatorLoss[name] = (indicatorLoss[name] || 0) + 1;
        });
      } catch {}
    });

    const indicatorAnalysis = Object.keys({ ...indicatorWin, ...indicatorLoss }).map((ind) => {
      const w = indicatorWin[ind] || 0;
      const l = indicatorLoss[ind] || 0;
      const total = w + l;
      return {
        indicator: ind,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);

    // --- Timeframe analysis ---
    const tfWin: Record<string, number> = {};
    const tfLoss: Record<string, number> = {};
    wins.forEach((a) => { tfWin[a.timeframe] = (tfWin[a.timeframe] || 0) + 1; });
    losses.forEach((a) => { tfLoss[a.timeframe] = (tfLoss[a.timeframe] || 0) + 1; });

    const timeframeAnalysis = Object.keys({ ...tfWin, ...tfLoss }).map((tf) => {
      const w = tfWin[tf] || 0;
      const l = tfLoss[tf] || 0;
      const total = w + l;
      return {
        timeframe: tf,
        wins: w,
        losses: l,
        total,
        hitRate: total > 0 ? Math.round((w / total) * 100) : 0,
      };
    });

    // --- Detailed losses (last 15) ---
    const detailedLosses = losses.slice(0, 15).map((a) => {
      let indicators: any[] = [];
      let patterns: string[] = [];
      try { indicators = JSON.parse(a.indicators || "[]"); } catch {}
      try { patterns = JSON.parse(a.patterns || "[]"); } catch {}
      return {
        direction: a.direction,
        confidence: a.confidence,
        tendency: a.tendency,
        risk: a.risk,
        patterns,
        indicators: indicators.map((i: any) => (typeof i === "string" ? i : i.name)),
        supportLevel: a.supportLevel,
        resistanceLevel: a.resistanceLevel,
        volatility: a.volatility,
        timeframe: a.timeframe,
        justification: a.justification,
        createdAt: a.createdAt,
      };
    });

    // --- Detailed wins (last 10) ---
    const detailedWins = wins.slice(0, 10).map((a) => {
      let indicators: any[] = [];
      let patterns: string[] = [];
      try { indicators = JSON.parse(a.indicators || "[]"); } catch {}
      try { patterns = JSON.parse(a.patterns || "[]"); } catch {}
      return {
        direction: a.direction,
        confidence: a.confidence,
        tendency: a.tendency,
        risk: a.risk,
        patterns,
        indicators: indicators.map((i: any) => (typeof i === "string" ? i : i.name)),
        supportLevel: a.supportLevel,
        resistanceLevel: a.resistanceLevel,
        volatility: a.volatility,
        timeframe: a.timeframe,
        justification: a.justification,
        createdAt: a.createdAt,
      };
    });

    // --- Streak analysis ---
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    allAnalyses.forEach((a) => {
      if (a.feedback?.result === "win") {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (a.feedback?.result === "loss") {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    // --- Last 5 lessons ---
    const lessons = await prisma.aILesson.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentLessons = lessons.map((l) => ({
      hitRate: l.hitRate,
      totalAnalyses: l.totalAnalyses,
      mistakes: JSON.parse(l.mistakes || "[]"),
      improvements: JSON.parse(l.improvements || "[]"),
      createdAt: l.createdAt,
    }));

    // --- Recommendation summary ---
    const worstDirection = directionAnalysis
      .filter((d) => d.total >= 2)
      .sort((a, b) => a.hitRate - b.hitRate)[0];

    const worstTendency = tendencyAnalysis
      .filter((t) => t.total >= 2)
      .sort((a, b) => a.hitRate - b.hitRate)[0];

    const worstRisk = riskAnalysis
      .filter((r) => r.total >= 2)
      .sort((a, b) => a.hitRate - b.hitRate)[0];

    const worstConfidenceRange = confidenceAnalysis
      .filter((c) => c.total >= 2)
      .sort((a, b) => a.hitRate - b.hitRate)[0];

    const bestPatterns = patternAnalysis
      .filter((p) => p.total >= 2 && p.hitRate >= 60)
      .slice(0, 5);

    const worstPatterns = patternAnalysis
      .filter((p) => p.total >= 2 && p.hitRate < 50)
      .slice(0, 5);

    const report = {
      summary: {
        total,
        wins: wins.length,
        losses: losses.length,
        pending: pending.length,
        hitRate: Math.round(hitRate * 100) / 100,
        maxWinStreak,
        maxLossStreak,
        avgWinConfidence: avgWinConf,
        avgLossConfidence: avgLossConf,
      },
      directionAnalysis,
      tendencyAnalysis,
      riskAnalysis,
      confidenceAnalysis,
      patternAnalysis,
      indicatorAnalysis,
      timeframeAnalysis,
      detailedLosses,
      detailedWins,
      recentLessons,
      recommendations: {
        worstDirection: worstDirection ? `${worstDirection.direction} (${worstDirection.hitRate}% acerto, ${worstDirection.losses} erros)` : null,
        worstTendency: worstTendency ? `${worstTendency.tendency} (${worstTendency.hitRate}% acerto, ${worstTendency.losses} erros)` : null,
        worstRisk: worstRisk ? `${worstRisk.risk} (${worstRisk.hitRate}% acerto, ${worstRisk.losses} erros)` : null,
        worstConfidenceRange: worstConfidenceRange ? `${worstConfidenceRange.range} (${worstConfidenceRange.hitRate}% acerto)` : null,
        bestPatterns: bestPatterns.map((p) => `${p.pattern} (${p.hitRate}% acerto)`),
        worstPatterns: worstPatterns.map((p) => `${p.pattern} (${p.hitRate}% acerto)`),
      },
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}
