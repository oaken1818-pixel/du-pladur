const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth, roles("ADMIN", "GESTOR"));

// ─── GET /api/dashboard ───────────────────────────────────────────────────
// Dashboard principal do Eduardo — visão geral da empresa

router.get("/", async (req, res) => {
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  const [
    totalFuncionarios,
    funcionariosAtivos,
    funcionariosFerias,
    obraAtivas,
    pontosHoje,
    solicitacoesPendentes,
    ocorrenciasAbertas,
    producaoHoje,
    obrasComStats,
  ] = await Promise.all([
    // Total funcionários
    prisma.funcionario.count(),

    // Ativos hoje (bateram entrada)
    prisma.ponto.groupBy({
      by: ["funcionarioId"],
      where: { tipo: "ENTRADA", registadoEm: { gte: inicioDia, lt: fimDia } },
    }).then((r) => r.length),

    // De férias
    prisma.funcionario.count({ where: { status: "FERIAS" } }),

    // Obras ativas
    prisma.obra.findMany({
      where: { status: "ATIVA" },
      select: { id: true, nome: true, cidade: true, pais: true, codigoPais: true },
    }),

    // Pontos hoje (para calcular ausências)
    prisma.ponto.findMany({
      where: { tipo: "ENTRADA", registadoEm: { gte: inicioDia, lt: fimDia } },
      select: { funcionarioId: true, status: true, distanciaObra: true },
    }),

    // Solicitações pendentes de material
    prisma.solicitacaoMaterial.count({ where: { status: "PENDENTE" } }),

    // Ocorrências por resolver
    prisma.ocorrencia.count({ where: { resolvida: false } }),

    // Produção total hoje
    prisma.registoProducao.aggregate({
      where: { data: { gte: inicioDia, lt: fimDia } },
      _sum: { quantidade: true },
    }),

    // Stats por obra ativa
    prisma.obra.findMany({
      where: { status: "ATIVA" },
      include: {
        funcionarios: { where: { ativo: true }, select: { id: true } },
        _count: {
          select: {
            pontos: { where: { tipo: "ENTRADA", registadoEm: { gte: inicioDia, lt: fimDia } } },
          },
        },
        producoes: {
          where: { data: { gte: inicioDia, lt: fimDia } },
          select: { quantidade: true },
        },
      },
    }),
  ]);

  // Calcular horas trabalhadas hoje (simplificado: # entradas * jornada média)
  const horasTrabalhadas = pontosHoje.length * 8;

  // Montar stats por obra
  const obras = obrasComStats.map((o) => ({
    id: o.id,
    nome: o.nome,
    cidade: o.cidade,
    pais: o.pais,
    codigoPais: o.codigoPais,
    totalEquipa: o.funcionarios.length,
    presentesHoje: o._count.pontos,
    producaoHoje: o.producoes.reduce((acc, p) => acc + Number(p.quantidade), 0),
  }));

  // Alertas ativos
  const alertas = [];
  if (solicitacoesPendentes > 0) {
    alertas.push({
      tipo: "danger",
      mensagem: `${solicitacoesPendentes} pedido(s) de material por aprovar`,
    });
  }
  if (ocorrenciasAbertas > 0) {
    alertas.push({
      tipo: "warning",
      mensagem: `${ocorrenciasAbertas} ocorrência(s) por resolver`,
    });
  }

  // Documentos a caducar nos próximos 30 dias
  const em30dias = new Date();
  em30dias.setDate(em30dias.getDate() + 30);
  const docsExpirando = await prisma.documentoFuncionario.count({
    where: { dataValidade: { lte: em30dias } },
  });
  if (docsExpirando > 0) {
    alertas.push({
      tipo: "warning",
      mensagem: `${docsExpirando} documento(s)/curso(s) de funcionário(s) a caducar ou caducados`,
    });
  }

  res.json({
    hoje: {
      data: hoje.toISOString(),
      totalFuncionarios,
      funcionariosPresentes: funcionariosAtivos,
      funcionariosAusentes: totalFuncionarios - funcionariosAtivos - funcionariosFerias,
      funcionariosFerias,
      horasTrabalhadas,
      producaoTotal: producaoHoje._sum.quantidade || 0,
      obrasAtivas: obraAtivas.length,
    },
    alertas,
    obras,
  });
});

module.exports = router;
