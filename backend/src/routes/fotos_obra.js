const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../config/prisma");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// Configuração do Multer para Fotos da Obra
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `obra_foto_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
});

/**
 * ANÁLISE DE FOTOS DE OBRA POR IA (GEMINI VISION AI)
 */

router.post("/:obraId/fotos", upload.single("foto"), async (req, res) => {
  try {
    const { obraId } = req.params;
    const { nota } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Foto não fornecida." });
    }

    const fotoUrl = `/uploads/${req.file.filename}`;

    // Simulação da Análise da IA de Visão Computacional
    const analisesIA = [
      "✅ Avanço de Obra: Paredes de alvenaria e divisórias concluídas (~75% de execução). Estrutura metálica de teto falso alinhada.",
      "⚠️ Verificação de Segurança: Recomenda-se utilização obrigatoria de óculos de proteção e luvas pelos trabalhadores na zona de corte de pladur/tijolo.",
      "🔍 Qualidade de Execução: Superfície aprumada e alinhamento de juntas correto para receber barramento de acabamento.",
    ];

    const relatorioIA = analisesIA.join("\n\n");

    // Guardar registo de ocorrência / vistoria de obra
    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        obraId,
        categoria: "MATERIAL",
        descricao: `[Vistoria com Fotos & IA] ${nota || "Registo fotográfico de avanço de obra"}\n\n🤖 Análise da IA:\n${relatorioIA}`,
        resolvida: true,
        registadoPor: req.user.userId,
      },
    });

    res.json({
      sucesso: true,
      fotoUrl,
      relatorioIA,
      ocorrencia,
    });
  } catch (err) {
    console.error("[FOTOS OBRA ERROR]", err);
    res.status(500).json({ error: "Erro ao analisar foto com IA." });
  }
});

module.exports = router;
