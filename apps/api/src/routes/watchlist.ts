import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { z } from "zod";
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

const createWatchlistSchema = z.object({
  name: z.string().min(1),
  assets: z.array(z.string()).optional(),
});

const addAssetSchema = z.object({
  asset: z.string().min(1),
});

export async function watchlistRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const watchlists = await prisma.watchlist.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(watchlists.map((w) => ({ ...w, assets: JSON.parse(w.assets) })));
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao listar watchlists" });
    }
  });

  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const body = createWatchlistSchema.parse(request.body);

      const watchlist = await prisma.watchlist.create({
        data: {
          userId: user.userId,
          name: body.name,
          assets: JSON.stringify(body.assets || []),
        },
      });

      return reply.status(201).send({ ...watchlist, assets: JSON.parse(watchlist.assets) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos", errors: error.errors });
      }
      return reply.status(500).send({ message: "Erro ao criar watchlist" });
    }
  });

  fastify.post("/:id/assets", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { id } = request.params as { id: string };
      const body = addAssetSchema.parse(request.body);

      const watchlist = await prisma.watchlist.findFirst({
        where: { id, userId: user.userId },
      });

      if (!watchlist) return reply.status(404).send({ message: "Watchlist não encontrada" });

      const assets = JSON.parse(watchlist.assets) as string[];
      if (!assets.includes(body.asset)) {
        assets.push(body.asset);
        await prisma.watchlist.update({
          where: { id },
          data: { assets: JSON.stringify(assets) },
        });
      }

      const updated = await prisma.watchlist.findUnique({ where: { id } });
      return reply.send({ ...updated!, assets: JSON.parse(updated!.assets) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos", errors: error.errors });
      }
      return reply.status(500).send({ message: "Erro ao adicionar ativo" });
    }
  });

  fastify.delete("/:id/assets/:asset", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { id, asset } = request.params as { id: string; asset: string };

      const watchlist = await prisma.watchlist.findFirst({
        where: { id, userId: user.userId },
      });

      if (!watchlist) return reply.status(404).send({ message: "Watchlist não encontrada" });

      const assets = (JSON.parse(watchlist.assets) as string[]).filter((a) => a !== asset);
      await prisma.watchlist.update({
        where: { id },
        data: { assets: JSON.stringify(assets) },
      });

      const updated = await prisma.watchlist.findUnique({ where: { id } });
      return reply.send({ ...updated!, assets: JSON.parse(updated!.assets) });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao remover ativo" });
    }
  });

  fastify.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const { id } = request.params as { id: string };

      const watchlist = await prisma.watchlist.findFirst({
        where: { id, userId: user.userId },
      });

      if (!watchlist) return reply.status(404).send({ message: "Watchlist não encontrada" });

      await prisma.watchlist.delete({ where: { id } });
      return reply.send({ message: "Watchlist excluída com sucesso" });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao excluir watchlist" });
    }
  });
}
