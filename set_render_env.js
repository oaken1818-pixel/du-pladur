const API_KEY = "rnd_0MRmIeCVnUxGDThm2YT32pGzXD9H";
const SERVICE_ID = "srv-da5kgirm8hqs73d1c3d0";
const INTERNAL_DB_URL = "postgresql://du_pladur_user:VWQiAQRMRzYtbg9jGqU8KeIOqdHtrE9j@dpg-da5kgijm8hqs73d1c25g-a/du_pladur";

async function main() {
  console.log("⚙️ A configurar env-vars no Render...");

  const envVars = [
    { key: "DATABASE_URL", value: INTERNAL_DB_URL },
    { key: "JWT_SECRET", value: "du_pladur_super_secret_jwt_key_2026_pt_es_fr" },
    { key: "PORT", value: "3001" },
    { key: "NODE_ENV", value: "production" }
  ];

  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envVars),
  });

  const data = await res.json();
  console.log("✅ Env vars configuradas:", data.length ? "OK" : data);

  console.log("🚀 A disparar novo deploy no Render com DATABASE_URL conectada...");
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
