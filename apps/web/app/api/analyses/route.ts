import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - List all analyses
export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      include: { feedback: true },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, analyses });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return NextResponse.json(
      { error: "Erro ao buscar análises" },
      { status: 500 }
    );
  }
}

// DELETE - Delete analysis by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido" },
        { status: 400 }
      );
    }

    const existing = await prisma.analysis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    await prisma.analysis.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { error: "Erro ao excluir análise" },
      { status: 500 }
    );
  }
}

// POST - Create new analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileName,
      timeframe,
      imageData,
      direction,
      confidence,
      tendency,
      risk,
      tendencyDescription,
      indicators,
      patterns,
      levels,
      recommendation,
      entryTime,
      warning,
      justification,
    } = body;

    const analysis = await prisma.analysis.create({
      data: {
        fileName,
        timeframe,
        imageData,
        direction,
        confidence,
        tendency,
        risk,
        tendencyDesc: tendencyDescription,
        indicators: JSON.stringify(indicators),
        patterns: JSON.stringify(patterns),
        supportLevel: levels?.support || "Não identificado",
        resistanceLevel: levels?.resistance || "Não identificado",
        volatility: levels?.volatility || "Média",
        recommendation,
        entryTime,
        warning,
        justification: justification || "",
      },
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Error creating analysis:", error);
    return NextResponse.json(
      { error: "Erro ao criar análise" },
      { status: 500 }
    );
  }
}
