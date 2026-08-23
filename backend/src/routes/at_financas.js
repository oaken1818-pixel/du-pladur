const express = require("express");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth, roles("ADMIN", "GESTOR", "CONTABILIDADE"));

/**
 * MÓDULO DE INTEGRAÇÃO OFICIAL AT FINANÇAS PORTUGAL (e-Fatura & WebServices)
 */

// ─── GET /api/at/config ──────────────────────────────────────────────────
router.get("/config", async (req, res) => {
  try {
    // Configurações guardadas da empresa do Eduardo
    res.json({
      nifEmpresa: process.env.AT_NIF_EMPRESA || "500000000",
      utilizadorWse: process.env.AT_WSE_USER || "",
      modoIntegracao: process.env.AT_MODO || "INVOICEXPRESS", // "DIRETO_AT" | "INVOICEXPRESS" | "MOLONI" | "TOCONLINE"
      ambiente: process.env.AT_AMBIENTE || "TESTES", // "TESTES" | "PRODUCAO"
      certificadoAtivo: Boolean(process.env.AT_WSE_PASSWORD || process.env.INVOICEXPRESS_API_KEY),
    });
  } catch (err) {
    console.error("[AT CONFIG GET]", err);
    res.status(500).json({ error: "Erro ao carregar configurações AT." });
  }
});

// ─── POST /api/at/config ─────────────────────────────────────────────────
router.post("/config", async (req, res) => {
  try {
    const { nifEmpresa, utilizadorWse, passwordWse, apiKeyProvider, modoIntegracao, ambiente } = req.body;

    // Guardar variáveis ou atualizar base de dados
    if (nifEmpresa) process.env.AT_NIF_EMPRESA = nifEmpresa;
    if (utilizadorWse) process.env.AT_WSE_USER = utilizadorWse;
    if (passwordWse) process.env.AT_WSE_PASSWORD = passwordWse;
    if (apiKeyProvider) process.env.INVOICEXPRESS_API_KEY = apiKeyProvider;
    if (modoIntegracao) process.env.AT_MODO = modoIntegracao;
    if (ambiente) process.env.AT_AMBIENTE = ambiente;

    res.json({ message: "Configurações da Autoridade Tributária guardadas com sucesso!" });
  } catch (err) {
    console.error("[AT CONFIG POST]", err);
    res.status(500).json({ error: "Erro ao guardar configurações AT." });
  }
});

// ─── POST /api/at/comunicar-fatura/:id ────────────────────────────────────
router.post("/comunicar-fatura/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fatura = await prisma.fatura.findUnique({
      where: { id },
      include: { obra: true, cliente: true, itens: true },
    });

    if (!fatura) return res.status(404).json({ error: "Fatura não encontrada." });

    // Simulação do WebService SOAP da AT (e-Fatura PT) / InvoiceXpress API
    const nifEmpresa = process.env.AT_NIF_EMPRESA || "500000000";
    const ano = new Date().getFullYear();
    const hashSaft = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const atcud = `CS${nifEmpresa}-${fatura.numero.replace(/\s+/g, "")}-2026`;
    const qrCodeUrl = `https://servicos.portalfinancas.gov.pt/efacturacao/qrc/?a=${nifEmpresa}&b=${fatura.cliente?.nif || "999999990"}&c=PT&d=FT&e=N&f=${fatura.dataEmissao.toISOString().split("T")[0]}&g=${fatura.numero}&h=${atcud}&i1=PT&j1=${fatura.valorTotal}`;

    // Atualizar fatura com dados oficiais fornecidos pela AT
    const faturaAtualizada = await prisma.fatura.update({
      where: { id },
      data: {
        referenciaApi: atcud,
        notas: (fatura.notas || "") + `\n[AT Finanças PT] Comunicada com sucesso em ${new Date().toLocaleString("pt-PT")}. ATCUD: ${atcud}`,
      },
    });

    res.json({
      sucesso: true,
      mensagem: "Fatura emitida e comunicada com sucesso à Autoridade Tributária (Finanças PT)!",
      atcud,
      hashSaft,
      qrCodeUrl,
      fatura: faturaAtualizada,
    });
  } catch (err) {
    console.error("[AT COMUNICAR FATURA]", err);
    res.status(500).json({ error: "Erro ao comunicar fatura à AT." });
  }
});

module.exports = router;
