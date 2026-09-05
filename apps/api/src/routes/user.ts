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

const settingsSchema = z.object({
  language: z.enum(["pt", "en"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notifications: z.boolean().optional(),
  defaultMarket: z.string().optional(),
  defaultTimeframe: z.string().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/settings", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      let settings = await prisma.userSettings.findUnique({ where: { userId: user.userId } });

      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId: user.userId },
        });
      }

      return reply.send(settings);
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao buscar configurações" });
    }
  });

  fastify.put("/settings", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = verifyToken(request);
      if (!user) return reply.status(401).send({ message: "Não autorizado" });

      const body = settingsSchema.parse(request.body);

      let settings = await prisma.userSettings.findUnique({ where: { userId: user.userId } });

      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId: user.userId, ...body },
        });
      } else {
        settings = await prisma.userSettings.update({
          where: { userId: user.userId },
          data: body,
        });
      }

      return reply.send(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos", errors: error.errors });
      }
      return reply.status(500).send({ message: "Erro ao atualizar configurações" });
    }
  });
}
