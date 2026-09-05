import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);

      let user = await prisma.user.findUnique({ where: { email: body.email } });

      if (!user) {
        const passwordHash = await bcrypt.hash(body.password, 10);
        user = await prisma.user.create({
          data: {
            email: body.email,
            name: body.email.split("@")[0],
            passwordHash,
          },
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos", errors: error.errors });
      }
      return reply.status(500).send({ message: "Erro interno do servidor" });
    }
  });

  fastify.post("/register", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);

      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return reply.status(409).send({ message: "Email já cadastrado" });
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash,
        },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: "Dados inválidos", errors: error.errors });
      }
      return reply.status(500).send({ message: "Erro interno do servidor" });
    }
  });

  fastify.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ message: "Token não fornecido" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return reply.status(404).send({ message: "Usuário não encontrado" });
      }

      return reply.send({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      });
    } catch (error) {
      return reply.status(401).send({ message: "Token inválido" });
    }
  });

  fastify.post("/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ message: "Logout realizado com sucesso" });
  });
}
