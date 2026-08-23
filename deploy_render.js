const RENDER_TOKEN = "rnd_0MRmIeCVnUxGDThm2YT32pGzXD9H";
const OWNER_ID = "tea-d9jk59kvikkc73b8jji0";
const REPO_URL = "https://github.com/oaken1818-pixel/du-pladur";

async function renderApi(path, options = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RENDER_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`[Render API Error ${res.status}]`, JSON.stringify(data, null, 2));
    throw new Error(data.message || `Render API error ${res.status}`);
  }
  return data;
}

async function deploy() {
  console.log("🚀 A iniciar deploy automático do DU PLADUR no Render...");

  // 1. Criar PostgreSQL Database
  console.log("\n📦 1. A criar Base de Dados PostgreSQL no Render...");
  let db;
  try {
    db = await renderApi("/postgres", {
      method: "POST",
      body: JSON.stringify({
        ownerId: OWNER_ID,
        name: "du-pladur-db",
        databaseName: "du_pladur",
        databaseUser: "du_pladur_user",
        plan: "free",
        region: "frankfurt",
        version: "16",
      }),
    });
    console.log(`✅ Base de Dados criada! ID: ${db.id}`);
  } catch (e) {
    console.log("ℹ️ A procurar Base de Dados no Render...");
    const dbs = await renderApi(`/postgres?ownerId=${OWNER_ID}`);
    db = dbs.find((x) => x.name === "du-pladur-db") || dbs[0]?.postgres;
    if (db) console.log(`✅ Base de dados encontrada! ID: ${db.id}`);
  }

  // 2. Criar Web Service da API
  console.log("\n⚡ 2. A criar Web Service para a API no Render...");
  const jwtSecret = `du-pladur-jwt-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const jwtRefreshSecret = `du-pladur-refresh-${Math.random().toString(36).slice(2)}-${Date.now()}`;

  const envVars = [
    { key: "NODE_ENV", value: "production" },
    { key: "PORT", value: "3001" },
    { key: "JWT_SECRET", value: jwtSecret },
    { key: "JWT_REFRESH_SECRET", value: jwtRefreshSecret },
    { key: "ALLOWED_ORIGINS", value: "https://oaken1818-pixel.github.io,http://localhost:5173,http://localhost:5174,http://localhost:5175" },
  ];

  if (db?.connectionInfo?.internalConnectionString) {
    envVars.push({ key: "DATABASE_URL", value: db.connectionInfo.internalConnectionString });
  }

  const servicePayload = {
    type: "web_service",
    name: "du-pladur-api",
    ownerId: OWNER_ID,
    repo: REPO_URL,
    autoDeploy: "yes",
    branch: "main",
    rootDir: "backend",
    serviceDetails: {
      env: "node",
      plan: "free",
      region: "frankfurt",
      envSpecificDetails: {
        buildCommand: "npm install && npx prisma generate && npx prisma db push --schema=prisma/schema.prisma && node scripts/seed.js",
        startCommand: "npm start",
      },
      envVars,
    },
  };

  let service;
  try {
    service = await renderApi("/services", {
      method: "POST",
      body: JSON.stringify(servicePayload),
    });
    console.log(`✅ Web Service criado com sucesso! ID: ${service.service?.id}`);
  } catch (e) {
    console.log("ℹ️ A procurar serviço no Render...");
    const services = await renderApi(`/services?ownerId=${OWNER_ID}`);
    service = services.find((s) => s.service?.name === "du-pladur-api");
  }

  const slug = service?.service?.slug || "du-pladur-api";
  const serviceUrl = `https://${slug}.onrender.com`;
  console.log("\n🎉 Deploy concluído no Render!");
  console.log(`🔗 API URL: ${serviceUrl}`);

  return serviceUrl;
}

deploy().catch(console.error);
