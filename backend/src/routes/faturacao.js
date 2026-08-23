const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ─── GET /api/faturacao/stats ─────────────────────────────────────────────
router.get("/stats", roles("ADMIN", "GESTOR", "CONTABILIDADE"), async (_req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [faturasMes, faturasPendentes, faturasVencidas, faturasPagas] = await Promise.all([
      // Total faturado no mês
      prisma.fatura.aggregate({
        where: { createdAt: { gte: inicioMes } },
        _sum: { valorTotal: true },
        _count: true,
      }),
      // Pendentes de pagamento
      prisma.fatura.aggregate({
        where: { status: "EMITIDA", dataVencimento: { gte: hoje } },
        _sum: { valorTotal: true },
        _count: true,
      }),
      // Em atraso (vencidas)
      prisma.fatura.aggregate({
        where: { status: "EMITIDA", dataVencimento: { lt: hoje } },
        _sum: { valorTotal: true },
        _count: true,
      }),
      // Pagas total
      prisma.fatura.aggregate({
        where: { status: "PAGA" },
        _sum: { valorTotal: true },
        _count: true,
      }),
    ]);

    res.json({
      totalFaturadoMes: Number(faturasMes._sum.valorTotal || 0),
      totalPendentes: Number(faturasPendentes._sum.valorTotal || 0),
      totalVencidas: Number(faturasVencidas._sum.valorTotal || 0),
      totalPagas: Number(faturasPagas._sum.valorTotal || 0),
      qtdFaturasMes: faturasMes._count,
      qtdVencidas: faturasVencidas._count,
    });
  } catch (err) {
    console.error("[FATURACAO STATS]", err);
    res.status(500).json({ error: "Erro ao carregar estatísticas." });
  }
});

// ─── CLIENTES ─────────────────────────────────────────────────────────────

router.get("/clientes", roles("ADMIN", "GESTOR", "CONTABILIDADE"), async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { faturas: true } } },
    });
    res.json(clientes);
  } catch (err) {
    console.error("[CLIENTES LISTAR]", err);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

router.post("/clientes", roles("ADMIN", "GESTOR"), async (req, res) => {
  try {
    const { nome, nif, email, morada, cidade, pais, telefone } = req.body;
    if (!nome) return res.status(400).json({ error: "O nome do cliente é obrigatório." });

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        nif,
        email,
        morada,
        cidade,
        pais: pais || "PT",
        codigoPais: pais || "PT",
        telefone,
      },
    });
    res.status(201).json(cliente);
  } catch (err) {
    console.error("[CLIENTE CRIAR]", err);
    res.status(500).json({ error: "Erro ao criar cliente." });
  }
});

// ─── FATURAS & AUTOS DE MEDIÇÃO ──────────────────────────────────────────

router.get("/faturas", roles("ADMIN", "GESTOR", "CONTABILIDADE"), async (req, res) => {
  try {
    const { status, obraId, clienteId, tipo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (obraId) where.obraId = obraId;
    if (clienteId) where.clienteId = clienteId;
    if (tipo) where.tipo = tipo;

    const faturas = await prisma.fatura.findMany({
      where,
      include: {
        obra: { select: { id: true, nome: true, cidade: true, pais: true } },
        cliente: { select: { id: true, nome: true, nif: true } },
        itens: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(faturas);
  } catch (err) {
    console.error("[FATURAS LISTAR]", err);
    res.status(500).json({ error: "Erro ao listar faturas." });
  }
});

router.post("/faturas", roles("ADMIN", "GESTOR"), async (req, res) => {
  try {
    const {
      obraId,
      clienteId,
      tipo = "AUTO_MEDICAO",
      itens = [],
      retencaoGarantiaPct = 5,
      dataVencimento,
      notas,
    } = req.body;

    if (!itens.length) {
      return res.status(400).json({ error: "A fatura tem de conter pelo menos um item." });
    }

    // Calcular montantes
    let valorSemIva = 0;
    const itensComSubtotal = itens.map((item) => {
      const qtd = Number(item.quantidade || 1);
      const preco = Number(item.precoUnitario || 0);
      const subtotal = qtd * preco;
      valorSemIva += subtotal;
      return {
        descricao: item.descricao,
        quantidade: qtd,
        unidade: item.unidade || "m²",
        precoUnitario: preco,
        subtotal,
      };
    });

    // Inversão de IVA em obras (0%)
    const taxaIva = 0;
    const motivoIsencaoIva = "IVA - Inversão do sujeito passivo [Artigo 2.º n.º 1 al. j) do CIVA]";

    // Retenção de garantia (ex: 5%)
    const pctGarantia = Number(retencaoGarantiaPct || 0);
    const valorRetido = (valorSemIva * pctGarantia) / 100;
    const valorTotal = valorSemIva - valorRetido;

    // Gerar número de fatura único (ex: "AM 2026/001" ou "FT 2026/001")
    const count = await prisma.fatura.count();
    const prefixo = tipo === "AUTO_MEDICAO" ? "AM" : tipo === "PRO_FORMA" ? "PF" : "FT";
    const ano = new Date().getFullYear();
    const numero = `${prefixo} ${ano}/${String(count + 1).padStart(3, "0")}`;

    const vencimento = dataVencimento
      ? new Date(dataVencimento)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

    const fatura = await prisma.fatura.create({
      data: {
        numero,
        tipo,
        status: "EMITIDA",
        obraId,
        clienteId,
        valorSemIva,
        taxaIva,
        motivoIsencaoIva,
        retencaoGarantiaPct: pctGarantia,
        valorRetido,
        valorTotal,
        dataVencimento: vencimento,
        notas,
        criadoPor: req.user.userId,
        itens: {
          create: itensComSubtotal,
        },
      },
      include: {
        obra: true,
        cliente: true,
        itens: true,
      },
    });

    res.status(201).json(fatura);
  } catch (err) {
    console.error("[FATURA CRIAR]", err);
    res.status(500).json({ error: err.message || "Erro ao gerar fatura." });
  }
});

router.patch("/faturas/:id/pagar", roles("ADMIN", "GESTOR", "CONTABILIDADE"), async (req, res) => {
  try {
    const { id } = req.params;
    const fatura = await prisma.fatura.update({
      where: { id },
      data: {
        status: "PAGA",
        dataPagamento: new Date(),
      },
    });
    res.json(fatura);
  } catch (err) {
    console.error("[FATURA PAGAR]", err);
    res.status(500).json({ error: "Erro ao marcar como paga." });
  }
});

router.delete("/faturas/:id", roles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fatura.delete({ where: { id } });
    res.json({ message: "Fatura eliminada." });
  } catch (err) {
    console.error("[FATURA ELIMINAR]", err);
    res.status(500).json({ error: "Erro ao eliminar fatura." });
  }
});

module.exports = router;
