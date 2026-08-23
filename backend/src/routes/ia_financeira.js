const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth, roles("ADMIN", "GESTOR"));

/**
 * AGENTE DE IA FINANCEIRO — DU PLADUR
 * Processa instruções em linguagem natural para gerar Autos de Medição / Faturas.
 */
router.post("/processar", async (req, res) => {
  try {
    const { prompt, obraId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Instrução não fornecida à IA." });

    // Obter obras e clientes existentes para correspondência
    const [obras, clientes] = await Promise.all([
      prisma.obra.findMany({ select: { id: true, nome: true, cidade: true, pais: true, cliente: true } }),
      prisma.cliente.findMany({ select: { id: true, nome: true, nif: true } }),
    ]);

    // Extrair valores numéricos da mensagem (ex: 15000, 350 m2, 45€)
    const matchesValores = prompt.match(/\b\d+([.,]\d+)?\b/g) || [];
    const numeros = matchesValores.map((v) => parseFloat(v.replace(",", ".")));

    let obraTarget = obras.find((o) => prompt.toLowerCase().includes(o.nome.toLowerCase())) ||
      obras.find((o) => o.id === obraId) ||
      obras[0];

    let valorPrincipal = numeros.sort((a, b) => b - a)[0] || 5000;
    let qtd = prompt.toLowerCase().includes("m2") || prompt.toLowerCase().includes("m²")
      ? numeros[1] || 100
      : 1;

    let precoUni = qtd > 1 ? Number((valorPrincipal / qtd).toFixed(2)) : valorPrincipal;

    // Sugestão estruturada da IA
    const sugestao = {
      tipo: prompt.toLowerCase().includes("pro-forma") || prompt.toLowerCase().includes("proforma")
        ? "PRO_FORMA"
        : prompt.toLowerCase().includes("fatura")
        ? "FATURA"
        : "AUTO_MEDICAO",
      obraId: obraTarget?.id,
      obraNome: obraTarget?.nome || "Obra Principal",
      clienteNome: obraTarget?.cliente || clientes[0]?.nome || "Cliente Empresa SA",
      item: {
        descricao: `Medição Mensal de Trabalhos: Montagem de Pladur / Divisórias (${obraTarget?.nome || "Obra"})`,
        quantidade: qtd,
        unidade: "m²",
        precoUnitario: precoUni,
        subtotal: valorPrincipal,
      },
      retencaoGarantiaPct: 5,
      taxaIva: 0,
      motivoIsencaoIva: "IVA - Inversão do sujeito passivo [Artigo 2.º n.º 1 al. j) do CIVA]",
      valorSemIva: valorPrincipal,
      valorRetido: Number((valorPrincipal * 0.05).toFixed(2)),
      valorTotal: Number((valorPrincipal * 0.95).toFixed(2)),
      mensagemIA: `🤖 Entendido! Preparei a minuta de ${
        prompt.toLowerCase().includes("pro-forma") ? "Fatura Pro-Forma" : "Auto de Medição"
      } para a obra "${obraTarget?.nome || "Obra"}" no valor de ${valorPrincipal.toLocaleString("pt-PT")} € (com 0% IVA Inversão de Sujeito Passivo e 5% de retenção de garantia). Pretendes confirmar a emissão?`,
    };

    res.json(sugestao);
  } catch (err) {
    console.error("[IA FINANCEIRA ERROR]", err);
    res.status(500).json({ error: "Erro ao processar instrução da IA." });
  }
});

module.exports = router;
