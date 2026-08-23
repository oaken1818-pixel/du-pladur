const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();

// Todos os endpoints requerem autenticação
router.use(auth);

// ─── GET /api/funcionarios ────────────────────────────────────────────────
// Admin/Gestor/Encarregado vêem a lista

router.get("/", roles("ADMIN", "GESTOR", "ENCARREGADO"), async (req, res) => {
  const { status, obraId, q } = req.query;

  const where = {};
  if (status) where.status = status;
  if (q) {
    where.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }
  if (obraId) {
    where.obrasAtribuidas = {
      some: { obraId, ativo: true },
    };
  }

  const funcionarios = await prisma.funcionario.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
      obrasAtribuidas: {
        where: { ativo: true },
        include: { obra: { select: { id: true, nome: true, cidade: true, pais: true } } },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  res.json(funcionarios);
});

// ─── GET /api/funcionarios/:id ────────────────────────────────────────────

router.get("/:id", roles("ADMIN", "GESTOR", "ENCARREGADO"), async (req, res) => {
  const f = await prisma.funcionario.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
      obrasAtribuidas: {
        include: { obra: true },
      },
    },
  });
  if (!f) return res.status(404).json({ error: "Funcionário não encontrado." });
  res.json(f);
});

// ─── POST /api/funcionarios ───────────────────────────────────────────────
// Cria user + ficha de funcionário

const criarSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "GESTOR", "ENCARREGADO", "FUNCIONARIO", "CONTABILIDADE"]).default("FUNCIONARIO"),
  cargo: z.string().min(1),
  nif: z.string().optional(),
  telefone: z.string().optional(),
  morada: z.string().optional(),
  pais: z.string().default("PT"),
  salario: z.number().optional(),
  tipoContrato: z.enum(["EFETIVO", "PRAZO_CERTO", "TEMPORARIO", "ESTAGIO", "OUTRO"]).default("EFETIVO"),
  jornadaSemanal: z.number().default(40),
  dataContratacao: z.string(),
  dataNascimento: z.string().optional(),
});

router.post("/", roles("ADMIN"), async (req, res) => {
  const parsed = criarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const d = parsed.data;

  // Verificar email único
  const existe = await prisma.user.findUnique({ where: { email: d.email } });
  if (existe) return res.status(409).json({ error: "Este email já está em uso." });

  const passwordHash = await bcrypt.hash(d.password, 12);

  const result = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      passwordHash,
      role: d.role,
      funcionario: {
        create: {
          cargo: d.cargo,
          nif: d.nif,
          telefone: d.telefone,
          morada: d.morada,
          pais: d.pais,
          salario: d.salario,
          tipoContrato: d.tipoContrato,
          jornadaSemanal: d.jornadaSemanal,
          dataContratacao: new Date(d.dataContratacao),
          dataNascimento: d.dataNascimento ? new Date(d.dataNascimento) : null,
        },
      },
    },
    include: { funcionario: true },
  });

  res.status(201).json(result);
});

// ─── PATCH /api/funcionarios/:id ─────────────────────────────────────────

const atualizarSchema = z.object({
  name: z.string().min(2).optional(),
  cargo: z.string().optional(),
  telefone: z.string().optional(),
  morada: z.string().optional(),
  pais: z.string().optional(),
  salario: z.number().optional(),
  tipoContrato: z.enum(["EFETIVO", "PRAZO_CERTO", "TEMPORARIO", "ESTAGIO", "OUTRO"]).optional(),
  jornadaSemanal: z.number().optional(),
  status: z.enum(["ATIVO", "INATIVO", "FERIAS", "LICENCA", "SUSPENDIDO"]).optional(),
  nif: z.string().optional(),
}).strict();

router.patch("/:id", roles("ADMIN", "GESTOR"), async (req, res) => {
  const parsed = atualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { name, ...fichaData } = parsed.data;

  const f = await prisma.funcionario.findUnique({ where: { id: req.params.id } });
  if (!f) return res.status(404).json({ error: "Funcionário não encontrado." });

  const updated = await prisma.funcionario.update({
    where: { id: req.params.id },
    data: {
      ...fichaData,
      ...(name && { user: { update: { name } } }),
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.json(updated);
});

// ─── POST /api/funcionarios/:id/atribuir-obra ────────────────────────────

router.post("/:id/atribuir-obra", roles("ADMIN", "GESTOR"), async (req, res) => {
  const { obraId } = req.body;
  if (!obraId) return res.status(400).json({ error: "obraId obrigatório." });

  // Se já existir, reativar
  const existente = await prisma.obraFuncionario.findUnique({
    where: { obraId_funcionarioId: { obraId, funcionarioId: req.params.id } },
  });

  if (existente) {
    const updated = await prisma.obraFuncionario.update({
      where: { id: existente.id },
      data: { ativo: true, dataFim: null },
    });
    return res.json(updated);
  }

  const novo = await prisma.obraFuncionario.create({
    data: { obraId, funcionarioId: req.params.id },
  });
  res.status(201).json(novo);
});

module.exports = router;
