const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ─── GET /api/escala ──────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const { semana, obraId, funcionarioId } = req.query;

  // Calcular início e fim da semana se fornecida
  let dateFilter = {};
  if (semana) {
    const inicio = new Date(semana);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
    dateFilter = { gte: inicio, lt: fim };
  }

  const where = {};
  if (Object.keys(dateFilter).length) where.data = dateFilter;
  if (obraId) where.obraId = obraId;

  // Funcionário só vê a sua escala
  if (req.user.role === "FUNCIONARIO") {
    const f = await prisma.funcionario.findUnique({ where: { userId: req.user.userId } });
    if (f) where.funcionarioId = f.id;
  } else if (funcionarioId) {
    where.funcionarioId = funcionarioId;
  }

  const escalas = await prisma.escala.findMany({
    where,
    include: {
      funcionario: { include: { user: { select: { name: true } } } },
      obra: { select: { id: true, nome: true, cidade: true, pais: true, codigoPais: true } },
    },
    orderBy: [{ data: "asc" }, { horaEntrada: "asc" }],
  });

  res.json(escalas);
});

// ─── POST /api/escala ─────────────────────────────────────────────────────

router.post("/", roles("ADMIN", "GESTOR"), async (req, res) => {
  const { funcionarioId, obraId, data, horaEntrada, horaSaida, nota } = req.body;
  if (!funcionarioId || !obraId || !data) {
    return res.status(400).json({ error: "funcionarioId, obraId e data são obrigatórios." });
  }

  const escala = await prisma.escala.upsert({
    where: {
      funcionarioId_data_obraId: {
        funcionarioId,
        data: new Date(data),
        obraId,
      },
    },
    update: {
      horaEntrada: horaEntrada || "08:00",
      horaSaida: horaSaida || "17:00",
      nota,
      status: "PLANEADA",
    },
    create: {
      funcionarioId,
      obraId,
      data: new Date(data),
      horaEntrada: horaEntrada || "08:00",
      horaSaida: horaSaida || "17:00",
      nota,
      criadoPor: req.user.userId,
    },
    include: {
      funcionario: { include: { user: { select: { name: true } } } },
      obra: { select: { id: true, nome: true, cidade: true, pais: true } },
    },
  });

  res.status(201).json(escala);
});

// ─── DELETE /api/escala/:id ───────────────────────────────────────────────

router.delete("/:id", roles("ADMIN", "GESTOR"), async (req, res) => {
  await prisma.escala.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
