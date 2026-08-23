const express = require("express");
const prisma = require("../config/prisma");
const { auth } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

/**
 * CRONOGRAMA & CAMINHO CRÍTICO DE OBRA (CPM)
 */

router.get("/:obraId", async (req, res) => {
  try {
    const { obraId } = req.params;

    // Tarefas padrão de exemplo com Caminho Crítico
    const tarefasExemplo = [
      { id: "t1", nome: "1. Preparação de Estaleiro & Marcação", duracaoDias: 3, dependenteDe: null, noCaminhoCritico: true, progressoPct: 100 },
      { id: "t2", nome: "2. Alvenaria de Tijolo / Divisórias", duracaoDias: 7, dependenteDe: "t1", noCaminhoCritico: true, progressoPct: 80 },
      { id: "t3", nome: "3. Roços & Tubagens Elétricas / Canalização", duracaoDias: 4, dependenteDe: "t2", noCaminhoCritico: false, progressoPct: 50 },
      { id: "t4", nome: "4. Montagem de Estrutura & Placas de Pladur", duracaoDias: 6, dependenteDe: "t2", noCaminhoCritico: true, progressoPct: 40 },
      { id: "t5", nome: "5. Barramento de Juntas & Enchimento", duracaoDias: 3, dependenteDe: "t4", noCaminhoCritico: true, progressoPct: 10 },
      { id: "t6", nome: "6. Pintura de Paredes & Tetos", duracaoDias: 5, dependenteDe: "t5", noCaminhoCritico: true, progressoPct: 0 },
      { id: "t7", nome: "7. Assentamento Cerâmico / Ladrilho", duracaoDias: 5, dependenteDe: "t3", noCaminhoCritico: false, progressoPct: 0 },
      { id: "t8", nome: "8. Limpeza Final & Entrega de Obra", duracaoDias: 2, dependenteDe: "t6", noCaminhoCritico: true, progressoPct: 0 },
    ];

    const duracaoTotalCaminhoCritico = tarefasExemplo
      .filter((t) => t.noCaminhoCritico)
      .reduce((acc, t) => acc + t.duracaoDias, 0);

    res.json({
      obraId,
      duracaoTotalCaminhoCriticoDias: duracaoTotalCaminhoCritico,
      tarefas: tarefasExemplo,
    });
  } catch (err) {
    console.error("[CRONOGRAMA ERROR]", err);
    res.status(500).json({ error: "Erro ao carregar cronograma." });
  }
});

module.exports = router;
