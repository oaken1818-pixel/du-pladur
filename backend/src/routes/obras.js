const express = require("express");
const { z } = require("zod");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ─── GET /api/obras ───────────────────────────────────────────────────────

router.get("/", roles("ADMIN", "GESTOR", "ENCARREGADO"), async (req, res) => {
  const { status, pais, q } = req.query;
  const where = {};
  if (status) where.status = status;
  if (pais) where.pais = pais;
  if (q) where.nome = { contains: q };

  const obras = await prisma.obra.findMany({
    where,
    include: {
      funcionarios: {
        where: { ativo: true },
        include: { funcionario: { include: { user: { select: { name: true } } } } },
      },
      _count: { select: { pontos: true, producoes: true } },
    },
    orderBy: { dataInicio: "desc" },
  });

  res.json(obras);
});

// ─── GET /api/obras/:id ───────────────────────────────────────────────────

router.get("/:id", roles("ADMIN", "GESTOR", "ENCARREGADO"), async (req, res) => {
  const obra = await prisma.obra.findUnique({
    where: { id: req.params.id },
    include: {
      funcionarios: {
        where: { ativo: true },
        include: {
          funcionario: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });
  if (!obra) return res.status(404).json({ error: "Obra não encontrada." });
  res.json(obra);
});

// ─── POST /api/obras ──────────────────────────────────────────────────────

const obraSchema = z.object({
  nome: z.string().min(2),
  cliente: z.string().optional(),
  descricao: z.string().optional(),
  morada: z.string().optional(),
  cidade: z.string().optional(),
  pais: z.string().default("PT"),
  codigoPais: z.string().default("PT"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geofenceRaio: z.number().default(200),
  dataInicio: z.string(),
  dataFimPrevista: z.string().optional(),
  orcamento: z.number().optional(),
  responsavelId: z.string().optional(),
});

router.post("/", roles("ADMIN", "GESTOR"), async (req, res) => {
  const parsed = obraSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const d = parsed.data;
  const obra = await prisma.obra.create({
    data: {
      ...d,
      dataInicio: new Date(d.dataInicio),
      dataFimPrevista: d.dataFimPrevista ? new Date(d.dataFimPrevista) : null,
    },
  });
  res.status(201).json(obra);
});

// ─── PATCH /api/obras/:id ─────────────────────────────────────────────────

router.patch("/:id", roles("ADMIN", "GESTOR"), async (req, res) => {
  const allowed = [
    "nome", "cliente", "descricao", "morada", "cidade", "pais", "codigoPais",
    "latitude", "longitude", "geofenceRaio", "dataFimPrevista", "orcamento",
    "status", "responsavelId",
  ];

  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "dataFimPrevista") data[key] = new Date(req.body[key]);
      else data[key] = req.body[key];
    }
  }

  const obra = await prisma.obra.update({
    where: { id: req.params.id },
    data,
  });
  res.json(obra);
});

// ─── GET /api/obras/:id/stats ─────────────────────────────────────────────
// Estatísticas rápidas de uma obra (para dashboard)

router.get("/:id/stats", roles("ADMIN", "GESTOR", "ENCARREGADO"), async (req, res) => {
  const obraId = req.params.id;
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  const [pontosHoje, totalFuncionarios, producaoHoje, materiaisConsumidos] = await Promise.all([
    prisma.ponto.count({
      where: { obraId, tipo: "ENTRADA", registadoEm: { gte: inicioDia, lt: fimDia } },
    }),
    prisma.obraFuncionario.count({ where: { obraId, ativo: true } }),
    prisma.registoProducao.aggregate({
      where: { obraId, data: { gte: inicioDia, lt: fimDia } },
      _sum: { quantidade: true },
    }),
    prisma.movimentoMaterial.aggregate({
      where: { obraId, tipo: "SAIDA" },
      _sum: { quantidade: true },
    }),
  ]);

  res.json({
    funcionariosHoje: pontosHoje,
    totalFuncionarios,
    producaoHoje: producaoHoje._sum.quantidade || 0,
    materiaisConsumidos: materiaisConsumidos._sum.quantidade || 0,
  });
});

module.exports = router;
