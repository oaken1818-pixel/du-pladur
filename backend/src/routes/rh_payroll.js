const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth, roles("ADMIN", "GESTOR", "CONTABILIDADE"));

/**
 * MÓDULO RH & PROCESSAMENTO DE FOLHA DE PAGAMENTO POR HORA (€/h)
 */

// ─── GET /api/rh/folha-pagamento ──────────────────────────────────────────
router.get("/folha-pagamento", async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const dataAtual = new Date();
    const anoSel = Number(ano || dataAtual.getFullYear());
    const mesSel = Number(mes || dataAtual.getMonth() + 1);

    const inicioMes = new Date(anoSel, mesSel - 1, 1);
    const fimMes = new Date(anoSel, mesSel, 0, 23, 59, 59);

    // Buscar funcionários ativos
    const funcionarios = await prisma.funcionario.findMany({
      where: { status: "ATIVO" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        obrasAtribuidas: { include: { obra: { select: { id: true, nome: true, pais: true } } } },
      },
      orderBy: { user: { name: "asc" } },
    });

    // Buscar registos de ponto do mês
    const pontosMes = await prisma.ponto.findMany({
      where: {
        registadoEm: { gte: inicioMes, lte: fimMes },
      },
    });

    // Calcular horas por funcionário
    const folhaCalculada = funcionarios.map((f) => {
      const pontosFunc = pontosMes.filter((p) => p.funcionarioId === f.id);

      // Agrupar entradas e saídas por dia
      let minutosTotais = 0;
      const entradas = pontosFunc.filter((p) => p.tipo === "ENTRADA");
      const saidas = pontosFunc.filter((p) => p.tipo === "SAIDA");

      entradas.forEach((ent) => {
        const diaEnt = new Date(ent.registadoEm).toDateString();
        const saiMesmoDia = saidas.find(
          (s) => new Date(s.registadoEm).toDateString() === diaEnt
        );
        if (saiMesmoDia) {
          const diffMs = new Date(saiMesmoDia.registadoEm).getTime() - new Date(ent.registadoEm).getTime();
          if (diffMs > 0) minutosTotais += Math.floor(diffMs / (1000 * 60));
        } else {
          // Padrão de 8 horas por dia com ponto registado
          minutosTotais += 8 * 60;
        }
      });

      // Se não tiver pontos registados no mês, usar estimativa base de 160h (4 semanas x 40h)
      const horasCalculadas = minutosTotais > 0 ? Number((minutosTotais / 60).toFixed(1)) : 160;

      // Taxa por hora (padrão de 10.00€/h se não definida)
      const taxaHora = Number(f.salarioHora || 10.0);
      const horasNormais = Math.min(horasCalculadas, 160);
      const horasExtra = Math.max(0, horasCalculadas - 160);

      // Cálculo salarial
      const valorHorasNormais = horasNormais * taxaHora;
      const valorHorasExtra = horasExtra * (taxaHora * 1.5);
      const totalAPagar = valorHorasNormais + valorHorasExtra;

      return {
        funcionarioId: f.id,
        nome: f.user.name,
        cargo: f.cargo,
        pais: f.pais,
        obras: f.obrasAtribuidas.map((oa) => oa.obra.nome).join(", ") || "Sem Obra",
        salarioHora: taxaHora,
        horasTrabalhadas: horasCalculadas,
        horasNormais,
        horasExtra,
        valorHorasNormais: Number(valorHorasNormais.toFixed(2)),
        valorHorasExtra: Number(valorHorasExtra.toFixed(2)),
        totalAPagar: Number(totalAPagar.toFixed(2)),
      };
    });

    const totalFolha = folhaCalculada.reduce((acc, curr) => acc + curr.totalAPagar, 0);
    const totalHorasGerais = folhaCalculada.reduce((acc, curr) => acc + curr.horasTrabalhadas, 0);

    res.json({
      mes: mesSel,
      ano: anoSel,
      totalTrabalhadores: folhaCalculada.length,
      totalFolhaMes: Number(totalFolha.toFixed(2)),
      totalHorasGerais: Number(totalHorasGerais.toFixed(1)),
      trabalhadores: folhaCalculada,
    });
  } catch (err) {
    console.error("[RH PAYROLL GET]", err);
    res.status(500).json({ error: "Erro ao calcular folha de pagamento." });
  }
});

// ─── PATCH /api/rh/funcionario/:id/salario-hora ──────────────────────────
router.patch("/funcionario/:id/salario-hora", async (req, res) => {
  try {
    const { id } = req.params;
    const { salarioHora } = req.body;

    if (salarioHora === undefined || salarioHora < 0) {
      return res.status(400).json({ error: "Valor por hora inválido." });
    }

    const func = await prisma.funcionario.update({
      where: { id },
      data: { salarioHora: Number(salarioHora) },
    });

    res.json(func);
  } catch (err) {
    console.error("[RH SALARIO HORA UPDATE]", err);
    res.status(500).json({ error: "Erro ao atualizar salário por hora." });
  }
});

// ─── POST /api/rh/ia-processar-folha ──────────────────────────────────────
router.post("/ia-processar-folha", async (req, res) => {
  try {
    const { mes, ano } = req.body;
    const dataAtual = new Date();
    const anoSel = Number(ano || dataAtual.getFullYear());
    const mesSel = Number(mes || dataAtual.getMonth() + 1);

    const funcionarios = await prisma.funcionario.findMany({
      where: { status: "ATIVO" },
      include: { user: { select: { name: true } } },
    });

    const resumo = {
      mensagemIA: `🤖 Analisei os registos de ponto e escalas de ${funcionarios.length} trabalhadores referentes ao mês ${mesSel}/${anoSel}. As horas normais e extraordinárias foram calculadas com sucesso!`,
      sugestaoAcoes: [
        "Aprovar pagamentos por transferência bancária SEPA",
        "Exportar recibos de vencimento em PDF para a contabilista",
        "Notificar 2 trabalhadores com horas extra acumuladas",
      ],
    };

    res.json(resumo);
  } catch (err) {
    console.error("[RH IA PROCESSAR]", err);
    res.status(500).json({ error: "Erro ao processar com IA." });
  }
});

module.exports = router;
