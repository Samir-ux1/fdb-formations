const jwt = require('jsonwebtoken');

// 1. Vérifie si l'utilisateur a un Token valide
exports.verifyToken = (req, res, next) => {
  // On récupère le token dans l'en-tête de la requête
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer LE_TOKEN" -> "LE_TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Vous devez être connecté." });
  }

  try {
    // On décode le token avec notre clé secrète
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Les anciens jetons utilisent `id`, alors que les contrôleurs attendent `userId`.
    // Normaliser ici garde les jetons déjà émis compatibles avec toutes les routes.
    req.user = {
      ...verified,
      userId: verified.userId ?? verified.id,
      id: verified.id ?? verified.userId,
    };
    next(); // Le token est bon, on laisse passer à la suite !
  } catch (error) {
    res.status(400).json({ message: "Token invalide ou expiré." });
  }
};

// 2. Vérifie si l'utilisateur est un Instructeur
exports.isInstructor = (req, res, next) => {
  if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: "Accès refusé. Réservé aux instructeurs." });
  }
  next(); // C'est bien un instructeur, on laisse passer !
};
