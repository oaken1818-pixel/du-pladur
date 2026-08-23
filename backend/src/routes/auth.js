const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../config/prisma");

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────

function signAccess(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Password obrigatória."),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  // Guardar refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Token em falta." });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: "Refresh token inválido." });
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date() || !stored.user.active) {
    return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
  }

  // Rotação do refresh token
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const newRefresh = signRefresh(stored.user);
  const newExpires = new Date();
  newExpires.setDate(newExpires.getDate() + 30);
  await prisma.refreshToken.create({
    data: { userId: stored.user.id, token: newRefresh, expiresAt: newExpires },
  });

  res.json({
    accessToken: signAccess(stored.user),
    refreshToken: newRefresh,
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ ok: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────

const { auth } = require("../middleware/auth");

router.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      funcionario: {
        select: {
          id: true,
          cargo: true,
          status: true,
          obrasAtribuidas: {
            where: { ativo: true },
            select: { obra: { select: { id: true, nome: true, cidade: true, pais: true } } },
          },
        },
      },
    },
  });
  res.json(user);
});

module.exports = router;
