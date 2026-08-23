const API_KEY = "rnd_0MRmIeCVnUxGDThm2YT32pGzXD9H";
const SERVICE_ID = "srv-da5kgirm8hqs73d1c3d0";

async function main() {
  const buildCommand = "npm install && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss && node scripts/seed.js";

  console.log("🛠️ A atualizar buildCommand do Render...");

  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceDetails: {
        envSpecificDetails: {
          buildCommand,
        },
      },
    }),
  });

  const data = await res.json();
  console.log("✅ Serviço Render atualizado:", data.id || data);

  console.log("🚀 A iniciar novo deploy no Render...");
  const resDeploy = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const dataDeploy = await resDeploy.json();
  console.log("✅ Deploy iniciado:", dataDeploy.id, dataDeploy.status);
}

main().catch(console.error);
