const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticação JWT.
 * Extrai o token do header Authorization: Bearer <token>
 * e coloca o payload em req.user.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role, name }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
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
