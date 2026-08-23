const express = require("express");
const { z } = require("zod");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ─── Helpers ──────────────────────────────────────────────────────────────

// Calcula distância em metros entre dois pontos GPS (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── POST /api/ponto ──────────────────────────────────────────────────────
// Registar entrada ou saída (funcionário)

const pontoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA", "PAUSA_INICIO", "PAUSA_FIM"]),
  obraId: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  registadoOffline: z.boolean().default(false),
  registadoEm: z.string(), // ISO string — momento real do toque
  dispositivo: z.string().optional(),
});

router.post("/", async (req, res) => {
  const parsed = pontoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const d = parsed.data;

  // Obter funcionário do user autenticado
  const funcionario = await prisma.funcionario.findUnique({
    where: { userId: req.user.userId },
    include: {
      obrasAtribuidas: { where: { obraId: d.obraId, ativo: true } },
    },
  });

  if (!funcionario) {
    return res.status(404).json({ error: "Ficha de funcionário não encontrada." });
  }

  // Verificar se está atribuído a esta obra
  const atribuido = funcionario.obrasAtribuidas.length > 0;
  if (!atribuido) {
    return res.status(403).json({ error: "Não está atribuído a esta obra." });
  }

  // Verificar geofence se tiver GPS
  let distanciaObra = null;
  let status = "SINCRONIZADO";

  if (d.latitude != null && d.longitude != null) {
    const obra = await prisma.obra.findUnique({ where: { id: d.obraId } });
    if (obra.latitude && obra.longitude) {
      distanciaObra = haversine(d.latitude, d.longitude, obra.latitude, obra.longitude);
      if (distanciaObra > obra.geofenceRaio) {
        status = "FORA_AREA";
      }
    }
  }

  if (d.registadoOffline) status = "OFFLINE";

  const ponto = await prisma.ponto.create({
    data: {
      funcionarioId: funcionario.id,
      obraId: d.obraId,
      tipo: d.tipo,
      status,
      latitude: d.latitude,
      longitude: d.longitude,
      distanciaObra,
      dispositivo: d.dispositivo,
      registadoOffline: d.registadoOffline,
      sincronizadoEm: d.registadoOffline ? new Date() : null,
      registadoEm: new Date(d.registadoEm),
      ipAddress: req.ip,
    },
  });

  res.status(201).json({
    ponto,
    dentroArea: status !== "FORA_AREA",
    distanciaObra: distanciaObra ? Math.round(distanciaObra) : null,
  });
});

// ─── GET /api/ponto ───────────────────────────────────────────────────────
// Admin/Gestor: ver todos | Funcionário: ver os seus

router.get("/", async (req, res) => {
  const { funcionarioId, obraId, de, ate, status, tipo } = req.query;
  const where = {};

  // Funcionário só vê os seus próprios pontos
  if (req.user.role === "FUNCIONARIO") {
    const f = await prisma.funcionario.findUnique({ where: { userId: req.user.userId } });
    if (!f) return res.json([]);
    where.funcionarioId = f.id;
  } else {
    if (funcionarioId) where.funcionarioId = funcionarioId;
    if (obraId) where.obraId = obraId;
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;
  }

  if (de || ate) {
    where.registadoEm = {};
    if (de) where.registadoEm.gte = new Date(de);
    if (ate) where.registadoEm.lte = new Date(ate);
  }

  const pontos = await prisma.ponto.findMany({
    where,
    include: {
      funcionario: { include: { user: { select: { name: true } } } },
      obra: { select: { id: true, nome: true, cidade: true, pais: true } },
    },
    orderBy: { registadoEm: "desc" },
    take: 200,
  });

  res.json(pontos);
});

// ─── GET /api/ponto/hoje ──────────────────────────────────────────────────
// Status de ponto do dia para o funcionário logado

router.get("/hoje", async (req, res) => {
  const f = await prisma.funcionario.findUnique({ where: { userId: req.user.userId } });
  if (!f) return res.json({ entrada: null, saida: null, emServico: false });

  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  const pontos = await prisma.ponto.findMany({
    where: {
      funcionarioId: f.id,
      registadoEm: { gte: inicioDia, lt: fimDia },
    },
    include: { obra: { select: { id: true, nome: true } } },
    orderBy: { registadoEm: "asc" },
  });

  const entrada = pontos.find((p) => p.tipo === "ENTRADA");
  const saida = pontos.find((p) => p.tipo === "SAIDA");

  res.json({ pontos, entrada, saida, emServico: !!entrada && !saida });
});

// ─── PATCH /api/ponto/:id ─────────────────────────────────────────────────
// Admin corrige ponto manualmente

router.patch("/:id", roles("ADMIN", "GESTOR"), async (req, res) => {
  const { registadoEm, tipo, status, notaAdmin } = req.body;

  const ponto = await prisma.ponto.update({
    where: { id: req.params.id },
    data: {
      ...(registadoEm && { registadoEm: new Date(registadoEm) }),
      ...(tipo && { tipo }),
      status: "MANUAL",
      corrigidoPor: req.user.userId,
      ...(notaAdmin && { notaAdmin }),
    },
  });

  res.json(ponto);
});

module.exports = router;
