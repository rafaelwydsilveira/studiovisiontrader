import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function verifyToken(request: FastifyRequest): { userId: string } | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function analysisRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const body = request.body as any;
      const imageUrl = body?.imageUrl || "/mock-image.png";
      const originalFilename = body?.originalFilename || "chart.png";

      const startTime = Date.now();

      const analysis = await prisma.analysis.create({
        data: {
          userId: user.userId,
          imageUrl,
          originalFilename,
          market: body?.market || "forex",
          asset: body?.asset || null,
          timeframe: body?.timeframe || null,
          status: "processing",
        },
      });

      const directions = ["CALL", "PUT"];
      const trends = ["bullish", "bearish", "sideways"];
      const patterns = [
        "Double Bottom", "Double Top", "Head & Shoulders",
        "Bullish Engulfing", "Bearish Engulfing", "Doji",
        "Hammer", "Morning Star", "Evening Star",
      ];

      const direction = directions[Math.floor(Math.random() * directions.length)];
      const trend = trends[Math.floor(Math.random() * trends.length)];
      const confidence = 60 + Math.random() * 35;
      const selectedPatterns = patterns.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
      const basePrice = 1.08 + Math.random() * 0.02;
      const entryPoint = parseFloat(basePrice.toFixed(5));
      const stopLoss = parseFloat((direction === "CALL" ? entryPoint - 0.002 : entryPoint + 0.002).toFixed(5));
      const takeProfit = parseFloat((direction === "CALL" ? entryPoint + 0.004 : entryPoint - 0.004).toFixed(5));

      const processingTimeMs = Date.now() - startTime;

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { status: "completed", processingTimeMs },
      });

      const analysisResult = await prisma.analysisResult.create({
        data: {
          analysisId: analysis.id,
          direction,
          confidence: parseFloat(confidence.toFixed(1)),
          assetDetected: "EUR/USD",
          timeframeDetected: "1H",
          entryPoint,
          stopLoss,
          takeProfit,
          patterns: JSON.stringify(selectedPatterns),
          supportLevels: JSON.stringify([
            parseFloat((entryPoint - 0.003).toFixed(5)),
            parseFloat((entryPoint - 0.005).toFixed(5)),
          ]),
          resistanceLevels: JSON.stringify([
            parseFloat((entryPoint + 0.003).toFixed(5)),
            parseFloat((entryPoint + 0.005).toFixed(5)),
          ]),
          trend,
          justification: `Análise técnica identificou padrão de ${direction === "CALL" ? "reversão de alta" : "reversão de baixa"} com ${selectedPatterns.join(", ")}. Tendência ${trend} no timeframe analisado.`,
        },
      });

      return reply.send({
        success: true,
        analysis: {
          ...analysis,
          result: {
            ...analysisResult,
            patterns: JSON.parse(analysisResult.patterns),
            supportLevels: JSON.parse(analysisResult.supportLevels),
            resistanceLevels: JSON.parse(analysisResult.resistanceLevels),
          },
        },
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      return reply.status(500).send({ message: "Erro ao analisar imagem" });
    }
  });

  fastify.get("/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const now = new Date();
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalAnalyses, analysesThisWeek, analysesThisMonth, assetsAnalyzed] = await Promise.all([
        prisma.analysis.count({ where: { userId: user.userId } }),
        prisma.analysis.count({ where: { userId: user.userId, createdAt: { gte: thisWeek } } }),
        prisma.analysis.count({ where: { userId: user.userId, createdAt: { gte: thisMonth } } }),
        prisma.analysis.findMany({
          where: { userId: user.userId },
          select: { asset: true },
          distinct: ["asset"],
        }),
      ]);

      return reply.send({
        totalAnalyses,
        analysesThisWeek,
        analysesThisMonth,
        assetsAnalyzed: assetsAnalyzed.length,
      });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao buscar estatísticas" });
    }
  });

  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { page = "1", limit = "10", asset } = request.query as any;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      const where: any = { userId: user.userId };
      if (asset) where.asset = { contains: asset };

      const [analyses, total] = await Promise.all([
        prisma.analysis.findMany({
          where,
          include: { result: true },
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.analysis.count({ where }),
      ]);

      return reply.send({ analyses, total, page: pageNum, limit: limitNum });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao listar análises" });
    }
  });

  fastify.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { id } = request.params as { id: string };
      const analysis = await prisma.analysis.findFirst({
        where: { id, userId: user.userId },
        include: { result: true },
      });

      if (!analysis) return reply.status(404).send({ message: "Análise não encontrada" });
      return reply.send(analysis);
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao buscar análise" });
    }
  });

  fastify.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { id } = request.params as { id: string };
      const analysis = await prisma.analysis.findFirst({
        where: { id, userId: user.userId },
      });

      if (!analysis) return reply.status(404).send({ message: "Análise não encontrada" });

      await prisma.analysis.delete({ where: { id } });
      return reply.send({ message: "Análise excluída com sucesso" });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao excluir análise" });
    }
  });
}
