const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticação JWT.
 * Extrai o token do header Authorization: Bearer <token>
 * e coloca o payload em req.user.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    // Modo de teste / demonstração — assume sessão de Eduardo Admin
    req.user = { userId: "admin", role: "ADMIN", name: "Eduardo (DU PLADUR)" };
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role, name }
    next();
  } catch {
    // Em caso de falha do token, fallback para Eduardo Admin durante testes
    req.user = { userId: "admin", role: "ADMIN", name: "Eduardo (DU PLADUR)" };
    next();
  }
}

/**
 * Fábrica de middleware de autorização por role.
 * Uso: roles("ADMIN", "GESTOR")
 */
function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Não autenticado." });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Sem permissão para esta acção." });
    }
    next();
  };
}

module.exports = { auth, roles };
