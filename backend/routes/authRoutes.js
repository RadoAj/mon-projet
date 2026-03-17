// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// =====================================================
// MIDDLEWARE : Récupérer le pool depuis app.locals
// =====================================================
router.use((req, res, next) => {
    if (!req.app.locals.pool) {
        return res.status(500).json({
            success: false,
            message: 'Pool de connexion non disponible'
        });
    }
    req.pool = req.app.locals.pool;
    next();
});

// =====================================================
// ROUTE : POST /api/auth/login
// =====================================================
router.post('/login', async (req, res) => {
    const { email, mot_de_passe } = req.body;

    // Validation des champs
    if (!email || !mot_de_passe) {
        return res.status(400).json({
            success: false,
            message: 'Email et mot de passe requis'
        });
    }

    try {
        // 1. Rechercher l'utilisateur dans la base de données
        const result = await req.pool.query(
            `SELECT id, nom, prenoms, email, mot_de_passe, role, actif 
             FROM users 
             WHERE LOWER(email) = LOWER($1)`,
            [email.trim()]
        );

        // 2. Vérifier si l'utilisateur existe
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];

        // 3. Vérifier si le compte est actif
        if (!user.actif) {
            return res.status(403).json({
                success: false,
                message: 'Compte désactivé. Contactez l\'administrateur.'
            });
        }

        // 4. Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // 5. Générer le token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Token valide 8 heures
        );

        // 6. Mettre à jour la dernière connexion
        await req.pool.query(
            'UPDATE users SET derniere_connexion = NOW() WHERE id = $1',
            [user.id]
        );

        // 7. Retourner le token et les infos utilisateur (SANS le mot de passe)
        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenoms: user.prenoms,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Erreur login:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion',
            error: error.message
        });
    }
});

// =====================================================
// ROUTE : GET /api/auth/verify
// Vérifier si le token est toujours valide
// =====================================================
router.get('/verify', async (req, res) => {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token manquant'
        });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer les infos à jour depuis la BDD
        const result = await req.pool.query(
            `SELECT id, nom, prenoms, email, role, actif 
             FROM users 
             WHERE id = $1`,
            [decoded.id]
        );

        if (result.rows.length === 0 || !result.rows[0].actif) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé ou compte désactivé'
            });
        }

        res.json({
            success: true,
            user: {
                id: result.rows[0].id,
                nom: result.rows[0].nom,
                prenoms: result.rows[0].prenoms,
                email: result.rows[0].email,
                role: result.rows[0].role
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré. Veuillez vous reconnecter.'
            });
        }

        res.status(401).json({
            success: false,
            message: 'Token invalide'
        });
    }
});

// =====================================================
// ROUTE : POST /api/auth/logout (optionnel)
// Le logout se fait principalement côté client
// =====================================================
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Déconnexion réussie'
    });
});

module.exports = router;
