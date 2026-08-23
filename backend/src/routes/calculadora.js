const express = require("express");
const { auth, roles } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

/**
 * CALCULADORA DE MATERIAIS OAKEN BUILD
 * Suporte para todas as especialidades: Pedreiros, Pintores, Ladrilhadores, Plaquistas, Concreto
 */

router.post("/calcular", async (req, res) => {
  try {
    const { especialidade, areaM2, alturaM, compM, dimencaoTijolo, demasPintura } = req.body;

    const area = Number(areaM2 || (alturaM && compM ? alturaM * compM : 0));
    if (area <= 0) {
      return res.status(400).json({ error: "Área em m² inválida para o cálculo." });
    }

    let resultado = {};

    switch (especialidade) {
      // 🧱 PEDREIRO — ALVENARIA & TIJOLO (Sacos de 25kg Padrão Europa)
      case "PEDREIRO": {
        // Tijolo padrão 19x19x9 cm (~25 tijolos/m²)
        const qtdTijolos = Math.ceil(area * 25 * 1.05); // +5% quebra
        const sacosCimento25kg = Math.ceil((area * 12) / 25); // Sacos de 25kg (Padrão Europa)
        const m3Areia = Number((area * 0.02).toFixed(2));

        resultado = {
          especialidade: "PEDREIRO",
          titulo: "Alvenaria de Tijolo & Argamassa",
          areaM2: area,
          itens: [
            { material: "Tijolos Furados (19x19x9)", quantidade: qtdTijolos, unidade: "un", nota: "Inclui 5% de margem de quebra" },
            { material: "Sacos de Cimento (25kg)", quantidade: sacosCimento25kg, unidade: "sacos", nota: "Padrão Europa (25kg) para traço 1:4" },
            { material: "Areia Fina/Média", quantidade: m3Areia, unidade: "m³", nota: "Volume para assentamento" },
          ],
        };
        break;
      }

      // 🎨 PINTOR — PINTURA & ACABAMENTOS
      case "PINTOR": {
        const demaos = Number(demasPintura || 2);
        const rendimentoLitroM2 = 10; // 1L cobre 10m² por demão
        const litrosTinta = Number(((area * demaos) / rendimentoLitroM2).toFixed(1));
        const baldes15L = Math.ceil(litrosTinta / 15);
        const litrosPrimario = Number((area / 12).toFixed(1));

        resultado = {
          especialidade: "PINTOR",
          titulo: "Pintura de Paredes & Tetos",
          areaM2: area,
          demaos,
          itens: [
            { material: "Tinta Plástica / Acrílica", quantidade: litrosTinta, unidade: "Litros", nota: `Para ${demaos} demãos (${baldes15L} baldes de 15L)` },
            { material: "Primário Fixador", quantidade: litrosPrimario, unidade: "Litros", nota: "1 demão preparatória" },
            { material: "Fita de Pintor (50m)", quantidade: Math.ceil(area / 15), unidade: "rolos", nota: "Proteção de rodapés e caixilhos" },
          ],
        };
        break;
      }

      // 🔲 LADRILHADOR — CERÂMICA & AZULEJO
      case "LADRILHADOR": {
        const areaComQuebra = area * 1.10; // +10% quebra/cortes
        const caixasCeramica = Math.ceil(areaComQuebra / 1.44); // caixa padrão 1.44m²
        const kgCimentoCola = Math.ceil(area * 4.5); // 4.5kg/m²
        const kgBetumeJuntas = Number((area * 0.4).toFixed(1)); // 0.4kg/m²

        resultado = {
          especialidade: "LADRILHADOR",
          titulo: "Revestimento Cerâmico & Azulejo",
          areaM2: area,
          itens: [
            { material: "Piso Cerâmico / Azulejo (m²)", quantidade: Number(areaComQuebra.toFixed(1)), unidade: "m²", nota: `~${caixasCeramica} caixas (+10% para cortes)` },
            { material: "Cimento-Cola (Sacos 25kg)", quantidade: Math.ceil(kgCimentoCola / 25), unidade: "sacos", nota: `${kgCimentoCola} kg totais (Sacos 25kg)` },
            { material: "Betume de Juntas (Kg)", quantidade: kgBetumeJuntas, unidade: "kg", nota: "Para juntas de 2mm a 3mm" },
            { material: "Cruzetas / Espaçadores", quantidade: Math.ceil(area * 30), unidade: "un", nota: "Espaçadores de nivelamento" },
          ],
        };
        break;
      }

      // 🛠️ PLAQUISTA — PLADUR & TETOS FALSOS (Separação Técnica de Montantes vs Raias)
      case "PLAQUISTA": {
        const alt = Number(alturaM || 2.8);
        const comp = Number(compM || area / alt);

        // Montantes: Verticais a cada 60cm de eixo
        const numMontantes = Math.ceil(comp / 0.60) + 1;
        const mlMontantes = numMontantes * alt;
        const varasMontantes3m = Math.ceil(mlMontantes / 3);

        // Raias/Canais: Horizontais (Piso + Teto + Laterais)
        const mlRaias = (comp * 2) + (alt * 2);
        const varasRaias3m = Math.ceil((mlRaias * 1.05) / 3);

        // Placas de Pladur 1.20m x 2.50m (3.0m²)
        const qtdPlacas = Math.ceil(area / 3.0);
        const parafusos = Math.ceil(area * 28);
        const kgMassaJuntas = Number((area * 0.8).toFixed(1));

        resultado = {
          especialidade: "PLAQUISTA",
          titulo: "Pladur / Tetos Falsos & Divisórias",
          areaM2: area,
          itens: [
            { material: "Placas de Pladur (1.20x2.50m)", quantidade: qtdPlacas, unidade: "placas", nota: `${(qtdPlacas * 3).toFixed(1)} m² totais (com margem)` },
            { material: "Montantes Verticais (Varas de 3m)", quantidade: varasMontantes3m, unidade: "varas", nota: `${Math.round(mlMontantes)}m lineares (Espaçamento 60cm entre eixos)` },
            { material: "Raias Horizontais (Varas de 3m)", quantidade: varasRaias3m, unidade: "varas", nota: `${Math.round(mlRaias)}m lineares (Perímetro Piso + Teto + Laterais)` },
            { material: "Parafusos TTPC 25mm", quantidade: parafusos, unidade: "un", nota: "Para fixação das placas no perfil" },
            { material: "Massa de Juntas (Kg)", quantidade: kgMassaJuntas, unidade: "kg", nota: "Para 3 demãos de barramento" },
            { material: "Fita de Juntas (150m)", quantidade: Math.ceil(area / 40), unidade: "rolos", nota: "Fita de papel microperfurada" },
          ],
        };
        break;
      }

      default:
        return res.status(400).json({ error: "Especialidade não reconhecida." });
    }

    res.json(resultado);
  } catch (err) {
    console.error("[CALCULADORA ERROR]", err);
    res.status(500).json({ error: "Erro ao calcular materiais." });
  }
});

module.exports = router;
