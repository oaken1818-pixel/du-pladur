require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A criar dados iniciais do DU PLADUR...\n");

  // Admin principal — Eduardo
  const adminHash = await bcrypt.hash("dupladur2024", 12);
  const admin = await prisma.user.upsert({
    where: { email: "eduardo@dupladur.pt" },
    update: {},
    create: {
      email: "eduardo@dupladur.pt",
      passwordHash: adminHash,
      name: "Eduardo",
      role: "ADMIN",
      funcionario: {
        create: {
          cargo: "Administrador",
          dataContratacao: new Date("2020-01-01"),
          pais: "PT",
          tipoContrato: "EFETIVO",
        },
      },
    },
  });
  console.log(`✅ Admin criado: eduardo@dupladur.pt / dupladur2024`);

  // Funcionários de exemplo
  const funcionarioHash = await bcrypt.hash("dupladur123", 12);

  const funcionarios = [
    { name: "João Silva", email: "joao@dupladur.pt", cargo: "Plaquista", pais: "PT" },
    { name: "Carlos Santos", email: "carlos@dupladur.pt", cargo: "Plaquista Sénior", pais: "PT" },
    { name: "Pedro Alves", email: "pedro@dupladur.pt", cargo: "Encarregado", pais: "ES" },
    { name: "Marcos Ferreira", email: "marcos@dupladur.pt", cargo: "Plaquista", pais: "PT" },
    { name: "André Costa", email: "andre@dupladur.pt", cargo: "Ajudante", pais: "PT" },
  ];

  for (const f of funcionarios) {
    await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        email: f.email,
        passwordHash: funcionarioHash,
        name: f.name,
        role: f.cargo === "Encarregado" ? "ENCARREGADO" : "FUNCIONARIO",
        funcionario: {
          create: {
            cargo: f.cargo,
            dataContratacao: new Date("2023-01-15"),
            pais: f.pais,
            tipoContrato: "EFETIVO",
            jornadaSemanal: 40,
            salario: f.cargo.includes("Sénior") ? 1500 : 1200,
          },
        },
      },
    });
    console.log(`✅ Funcionário: ${f.name} (${f.email})`);
  }

  // Obras de exemplo (multi-país)
  const obras = [
    {
      nome: "Escritório Lyon Centro",
      cliente: "Groupe Immobilier SA",
      cidade: "Lyon",
      pais: "França",
      codigoPais: "FR",
      latitude: 45.7640,
      longitude: 4.8357,
      geofenceRaio: 300,
      dataInicio: new Date("2026-06-01"),
      dataFimPrevista: new Date("2026-10-30"),
      orcamento: 45000,
      status: "ATIVA",
    },
    {
      nome: "Apartamentos Madrid Norte",
      cliente: "Inmobiliaria Iberica",
      cidade: "Madrid",
      pais: "Espanha",
      codigoPais: "ES",
      latitude: 40.4168,
      longitude: -3.7038,
      geofenceRaio: 250,
      dataInicio: new Date("2026-07-15"),
      dataFimPrevista: new Date("2026-11-15"),
      orcamento: 32000,
      status: "ATIVA",
    },
    {
      nome: "Moradia Lisboa Cascais",
      cliente: "Particular - Rui Mendes",
      cidade: "Cascais",
      pais: "Portugal",
      codigoPais: "PT",
      latitude: 38.6979,
      longitude: -9.4215,
      geofenceRaio: 200,
      dataInicio: new Date("2026-08-01"),
      dataFimPrevista: new Date("2026-09-30"),
      orcamento: 18000,
      status: "ATIVA",
    },
    {
      nome: "Hotel Barcelona",
      cliente: "Hotels Group SL",
      cidade: "Barcelona",
      pais: "Espanha",
      codigoPais: "ES",
      latitude: 41.3851,
      longitude: 2.1734,
      geofenceRaio: 350,
      dataInicio: new Date("2026-05-01"),
      dataFimPrevista: new Date("2026-08-31"),
      orcamento: 60000,
      status: "ATIVA",
    },
  ];

  const obrasCreadas = [];
  for (const o of obras) {
    const obra = await prisma.obra.upsert({
      where: { id: o.nome }, // dummy — upsert por nome não funciona, usar create
      update: {},
      create: o,
    }).catch(() => prisma.obra.create({ data: o }));
    obrasCreadas.push(obra);
    console.log(`✅ Obra: ${o.nome} (${o.pais})`);
  }

  console.log("\n🎉 Seed concluído!\n");
  console.log("─────────────────────────────────────────");
  console.log("Acesso Admin: eduardo@dupladur.pt / dupladur2024");
  console.log("Acesso Funcionário: joao@dupladur.pt / dupladur123");
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
