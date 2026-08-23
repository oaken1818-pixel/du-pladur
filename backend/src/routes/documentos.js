const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const prisma = require("../config/prisma");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Configurar multer para upload de ficheiros
const uploadsDir = path.join(__dirname, "../../uploads/documentos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Máx 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".zip"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de ficheiro não suportado. Use PDF, PNG, JPG, DOCX ou ZIP."));
    }
  },
});

// GET /api/documentos/expirando — Lista documentos a expirar nos próximos 30 dias (para alertas)
router.get(
  "/expirando",
  authenticateToken,
  requireRole("ADMIN", "GESTOR", "CONTABILIDADE"),
  async (_req, res) => {
    try {
      const em30dias = new Date();
      em30dias.setDate(em30dias.getDate() + 30);

      const documentos = await prisma.documentoFuncionario.findMany({
        where: {
          dataValidade: {
            lte: em30dias,
          },
        },
        include: {
          funcionario: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { dataValidade: "asc" },
      });

      res.json(documentos);
    } catch (err) {
      console.error("[DOCUMENTOS EXPIRANDO]", err);
      res.status(500).json({ error: "Erro ao obter documentos prestes a expirar." });
    }
  }
);

// GET /api/documentos/funcionario/:funcionarioId — Lista documentos de um funcionário
router.get("/funcionario/:funcionarioId", authenticateToken, async (req, res) => {
  try {
    const { funcionarioId } = req.params;

    // Funcionário só pode ver os seus próprios documentos (a menos que seja Admin/Gestor)
    if (req.user.role === "FUNCIONARIO" && req.user.funcionario?.id !== funcionarioId) {
      return res.status(403).json({ error: "Sem permissão." });
    }

    const documentos = await prisma.documentoFuncionario.findMany({
      where: { funcionarioId },
      orderBy: { createdAt: "desc" },
    });

    res.json(documentos);
  } catch (err) {
    console.error("[DOCUMENTOS LISTAR]", err);
    res.status(500).json({ error: "Erro ao listar documentos." });
  }
});

// POST /api/documentos/funcionario/:funcionarioId — Upload de documento
router.post(
  "/funcionario/:funcionarioId",
  authenticateToken,
  requireRole("ADMIN", "GESTOR"),
  upload.single("ficheiro"),
  async (req, res) => {
    try {
      const { funcionarioId } = req.params;
      const { tipo, titulo, descricao, dataEmissao, dataValidade } = req.body;

      if (!titulo) {
        return res.status(400).json({ error: "O título do documento é obrigatório." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Ficheiro não fornecido." });
      }

      const ficheiroUrl = `/uploads/documentos/${req.file.filename}`;

      const doc = await prisma.documentoFuncionario.create({
        data: {
          funcionarioId,
          tipo: tipo || "CURSO_CERTIFICACAO",
          titulo,
          descricao,
          ficheiroUrl,
          nomeFicheiro: req.file.originalname,
          tamanhoBytes: req.file.size,
          dataEmissao: dataEmissao ? new Date(dataEmissao) : null,
          dataValidade: dataValidade ? new Date(dataValidade) : null,
          criadoPor: req.user.id,
        },
      });

      res.status(201).json(doc);
    } catch (err) {
      console.error("[DOCUMENTO CRIAR]", err);
      res.status(500).json({ error: err.message || "Erro ao guardar documento." });
    }
  }
);

// DELETE /api/documentos/:id — Apagar documento
router.delete(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "GESTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await prisma.documentoFuncionario.findUnique({ where: { id } });

      if (!doc) {
        return res.status(404).json({ error: "Documento não encontrado." });
      }

      // Tentar apagar ficheiro físico do disco
      const fullPath = path.join(__dirname, "../../", doc.ficheiroUrl);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      await prisma.documentoFuncionario.delete({ where: { id } });

      res.json({ message: "Documento apagado com sucesso." });
    } catch (err) {
      console.error("[DOCUMENTO APAGAR]", err);
      res.status(500).json({ error: "Erro ao apagar documento." });
    }
  }
);

module.exports = router;
