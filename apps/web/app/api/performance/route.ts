import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allAnalyses = await prisma.analysis.findMany({
      include: { feedback: true },
      orderBy: { createdAt: "desc" },
    });

    const totalAnalyses = allAnalyses.length;
    const wins = allAnalyses.filter((a) => a.feedback?.result === "win").length;
    const losses = allAnalyses.filter((a) => a.feedback?.result === "loss").length;
    const pending = allAnalyses.filter((a) => !a.feedback).length;

    const hitRate = totalAnalyses > 0 ? (wins / totalAnalyses) * 100 : 0;

    const correctWithConfidence = allAnalyses
      .filter((a) => a.feedback?.result === "win")
      .reduce((sum, a) => sum + a.confidence, 0);
    const efficiency = wins > 0 ? correctWithConfidence / wins : 0;

    let maxStreak = 0;
    let currentStreak = 0;
    for (const analysis of allAnalyses) {
      if (analysis.feedback?.result === "win") {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (analysis.feedback?.result === "loss") {
        currentStreak = 0;
      }
    }
    const consistency = totalAnalyses > 0 ? (maxStreak / totalAnalyses) * 150 : 0;

    const highConfidenceAnalyses = allAnalyses.filter((a) => a.confidence >= 70);
    const correctHighConfidence = highConfidenceAnalyses.filter(
      (a) => a.feedback?.result === "win"
    ).length;
    const neuralCalibration =
      highConfidenceAnalyses.length > 0
        ? (correctHighConfidence / highConfidenceAnalyses.length) * 100
        : efficiency * 0.9;

    const recentAnalyses = allAnalyses.slice(0, 20).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      timeframe: a.timeframe,
      direction: a.direction,
      confidence: a.confidence,
      feedback: a.feedback?.result || null,
      createdAt: a.createdAt,
    }));

    const lastSnapshot = await prisma.performanceSnapshot.findFirst({
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalAnalyses,
        wins,
        losses,
        pending,
        hitRate: Math.round(hitRate * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        consistency: Math.min(100, Math.round(consistency * 100) / 100),
        neuralCalibration: Math.min(100, Math.round(neuralCalibration * 100) / 100),
        maxStreak,
      },
      recentAnalyses,
      lastSnapshot,
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    return NextResponse.json(
      { error: "Erro ao buscar performance" },
      { status: 500 }
    );
  }
}
