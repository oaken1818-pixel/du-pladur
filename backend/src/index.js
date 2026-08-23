require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// ─── Segurança ────────────────────────────────────────────────────────────

app.use(helmet());

const origins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175").split(",");
app.use(
  cors({
    origin: (origin, cb) => {
      // Permitir requests sem origin (ex: Postman) ou qualquer localhost / github.io
      if (
        !origin ||
        origins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".github.io")
      ) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origem ${origin} não permitida.`));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "2mb" }));

// Ficheiros estáticos (uploads)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", require("./routes/auth"));
app.use("/api/funcionarios", require("./routes/funcionarios"));
app.use("/api/obras", require("./routes/obras"));
app.use("/api/ponto", require("./routes/ponto"));
app.use("/api/escala", require("./routes/escala"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/documentos", require("./routes/documentos"));
app.use("/api/faturacao", require("./routes/faturacao"));
app.use("/api/ia-financeira", require("./routes/ia_financeira"));
app.use("/api/at", require("./routes/at_financas"));
app.use("/api/rh", require("./routes/rh_payroll"));

// ─── Health check ─────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "DU PLADUR API", version: "1.0.0" });
});

// ─── 404 ──────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// ─── Error handler ────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Erro interno do servidor." });
});

// ─── Start ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🏗️  DU PLADUR API a correr em http://localhost:${PORT}\n`);
});
