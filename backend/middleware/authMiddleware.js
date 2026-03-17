// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// =====================================================
// MIDDLEWARE : Vérifier l'authentification (JWT)
// =====================================================
const authenticateToken = (req, res, next) => {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Accès refusé. Authentification requise.'
        });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ajouter les informations de l'utilisateur à la requête
        req.user = decoded;

        next(); // Passer au middleware suivant ou à la route
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré. Veuillez vous reconnecter.'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Token invalide'
        });
    }
};

// =====================================================
// MIDDLEWARE : Vérifier le rôle ADMIN
// =====================================================
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentification requise'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Droits administrateur requis.'
        });
    }

    next();
};

// =====================================================
// MIDDLEWARE : Vérifier le rôle AGENT ou ADMIN
// =====================================================
const requireAgent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentification requise'
        });
    }

    if (!['admin', 'agent'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Rôle agent ou admin requis.'
        });
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    authenticateToken,
    requireAdmin,
    requireAgent
};
