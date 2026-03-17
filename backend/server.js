const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// ✅ IMPORTS AUTHENTIFICATION
const authRoutes = require('./routes/authRoutes');
const { authenticateToken, requireAgent, requireAdmin } = require('./middleware/authMiddleware');

// Import des routes PDF
const pdfRoutes = require('./routes/pdfRoutes');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const bcrypt = require('bcryptjs'); // Ajoute cet import en haut si absent
// Configuration de la base de données PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'etat_civil_fianarantsoa',
    password: process.env.DB_PASSWORD || 'noname888',
    port: process.env.DB_PORT || 5432,
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Partager le pool avec les routes
app.locals.pool = pool;

// Test de connexion à la base de données
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err);
    } else {
        console.log('✅ Connexion réussie à PostgreSQL');
        release();
    }
});

// =====================================================
// FONCTION UTILITAIRE DE FORMATAGE DES DATES
// =====================================================
function formatDateToFrench(dateStr, timeStr = null) {
    if (!dateStr) return null;
    try {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        const dateOptions = {
            timeZone: 'Indian/Antananarivo',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        let formatted = date.toLocaleDateString('fr-FR', dateOptions);
        if (timeStr && timeStr.trim() !== '') {
            formatted += ` à ${timeStr}`;
        }
        return formatted;
    } catch (err) {
        console.error('Erreur formatage date:', dateStr, err);
        return dateStr;
    }
}

// =====================================================
// ROUTES PUBLIQUES (pas d'authentification)
// =====================================================

// Route de base
app.get('/', (req, res) => {
    res.json({
        message: 'API État Civil - Commune Urbaine de Fianarantsoa',
        version: '2.1.0',
        status: 'active',
        new_features: ['PDF Generation v2.0', 'Authentification JWT', 'Protection des routes']
    });
});

// Test de la base de données (PUBLIC)
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = $1', ['public']);
        const params = await pool.query('SELECT * FROM parametres_systeme');
       
        res.json({
            success: true,
            message: 'Base de données connectée',
            tables_count: result.rows[0].total_tables,
            commune_info: params.rows
        });
    } catch (error) {
        console.error('Erreur test DB:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur de connexion à la base de données',
            error: error.message
        });
    }
});

// ✅ ROUTES D'AUTHENTIFICATION (PUBLIQUES)
app.use('/api/auth', authRoutes);

// =====================================================
// ROUTES PROTÉGÉES (authentification requise)
// =====================================================

// =====================================================
// 1. GESTION DES UTILISATEURS (ADMIN SEULEMENT)
// =====================================================
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, nom, prenoms, email, role, actif,
                TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation,
                TO_CHAR(derniere_connexion, 'YYYY-MM-DD HH24:MI:SS') as derniere_connexion
            FROM users
            ORDER BY nom
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// ✅ Créer un utilisateur (Admin uniquement) - MODIFIÉ
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    const { nom, prenoms, email, mot_de_passe, role } = req.body;
    
    // Validation
    if (!nom || !prenoms || !email || !mot_de_passe) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tous les champs sont obligatoires' 
        });
    }
    
    try {
        // Vérifier si l'email existe déjà
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        
        // Insérer le nouvel utilisateur (admin ou agent)
        const result = await pool.query(`
            INSERT INTO users (nom, prenoms, email, mot_de_passe, role, actif, date_creation)
            VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
            RETURNING id, nom, prenoms, email, role, actif, 
                      TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
        `, [nom.trim().toUpperCase(), prenoms.trim(), email.trim().toLowerCase(), hashedPassword, role || 'agent']);
        
        console.log('✅ Nouvel utilisateur créé:', result.rows[0].email, '- Rôle:', result.rows[0].role);
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            message: `${role === 'admin' ? 'Administrateur' : 'Agent'} créé avec succès`
        });
    } catch (error) {
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Modifier un utilisateur (Admin uniquement) - AVEC PROTECTION ADMIN
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { nom, prenoms, email, actif, mot_de_passe } = req.body;
    
    try {
        // Vérifier que l'utilisateur existe
        const userCheck = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        const targetRole = userCheck.rows[0].role;
        
        // ✅ NOUVELLE RÈGLE : Un admin ne peut modifier QUE son propre compte admin
        // Si la cible est un admin ET que ce n'est pas lui-même → REFUS
        if (targetRole === 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez pas modifier le compte d\'un autre administrateur'
            });
        }
        
        // ✅ Si un nouveau mot de passe est fourni, le hacher
        let updateQuery;
        let updateParams;
        
        if (mot_de_passe && mot_de_passe.trim() !== '') {
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            updateQuery = `
                UPDATE users 
                SET nom = $1, prenoms = $2, email = $3, actif = $4, mot_de_passe = $5
                WHERE id = $6
                RETURNING id, nom, prenoms, email, role, actif,
                          TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation,
                          TO_CHAR(derniere_connexion, 'YYYY-MM-DD HH24:MI:SS') as derniere_connexion
            `;
            updateParams = [nom.trim().toUpperCase(), prenoms.trim(), email.trim().toLowerCase(), actif, hashedPassword, id];
        } else {
            updateQuery = `
                UPDATE users 
                SET nom = $1, prenoms = $2, email = $3, actif = $4
                WHERE id = $5
                RETURNING id, nom, prenoms, email, role, actif,
                          TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation,
                          TO_CHAR(derniere_connexion, 'YYYY-MM-DD HH24:MI:SS') as derniere_connexion
            `;
            updateParams = [nom.trim().toUpperCase(), prenoms.trim(), email.trim().toLowerCase(), actif, id];
        }
        
        const result = await pool.query(updateQuery, updateParams);
        
        console.log('✅ Utilisateur modifié:', result.rows[0].email, mot_de_passe ? '(mot de passe changé)' : '');
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            message: 'Utilisateur modifié avec succès'
        });
    } catch (error) {
        console.error('Erreur modification utilisateur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Supprimer un utilisateur DÉFINITIVEMENT (Admin uniquement) - AVEC PROTECTION ADMIN
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Vérifier que l'utilisateur existe
        const userCheck = await pool.query(
            'SELECT email, role FROM users WHERE id = $1',
            [id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        const targetRole = userCheck.rows[0].role;
        
        // ✅ NOUVELLE RÈGLE : Un admin ne peut supprimer QUE son propre compte admin
        // Si la cible est un admin ET que ce n'est pas lui-même → REFUS
        if (targetRole === 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer le compte d\'un autre administrateur'
            });
        }
        
        // ✅ SUPPRESSION DÉFINITIVE
        const result = await pool.query(`
            DELETE FROM users 
            WHERE id = $1
            RETURNING id, nom, prenoms, email, role
        `, [id]);
        
        console.log('⚠️ Utilisateur supprimé DÉFINITIVEMENT:', result.rows[0].email);
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            message: 'Utilisateur supprimé définitivement'
        });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 2. GESTION DES PERSONNES (PROTÉGÉ)
// =====================================================
app.get('/api/personnes', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, nom, prenoms,
                TO_CHAR(date_naissance, 'YYYY-MM-DD') as date_naissance,
                lieu_naissance, sexe, nationalite, profession, domicile,
                nom_pere, prenoms_pere, profession_pere,
                nom_mere, prenoms_mere, profession_mere,
                TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
            FROM personnes
            ORDER BY nom, prenoms
            LIMIT 50
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération personnes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/personnes', authenticateToken, requireAgent, async (req, res) => {
    const { nom, prenoms, date_naissance, lieu_naissance, sexe, nationalite, profession, domicile, nom_pere, prenoms_pere, profession_pere, nom_mere, prenoms_mere, profession_mere } = req.body;
   
    try {
        const result = await pool.query(`
            INSERT INTO personnes (nom, prenoms, date_naissance, lieu_naissance, sexe, nationalite, profession, domicile, nom_pere, prenoms_pere, profession_pere, nom_mere, prenoms_mere, profession_mere)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [nom, prenoms, date_naissance, lieu_naissance, sexe, nationalite, profession, domicile, nom_pere, prenoms_pere, profession_pere, nom_mere, prenoms_mere, profession_mere]);
       
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur création personne:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 3. GESTION DES ACTES DE NAISSANCE (PROTÉGÉ)
// =====================================================
app.get('/api/actes/naissance', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                an.id, an.numero_acte, an.annee, an.nom, an.prenoms,
                TO_CHAR(an.date_naissance, 'YYYY-MM-DD') as date_naissance,
                TO_CHAR(an.heure_naissance, 'HH24:MI') as heure_naissance,
                an.lieu_naissance, an.sexe,
                an.nom_pere, an.prenoms_pere, an.age_pere, an.profession_pere, an.domicile_pere,
                TO_CHAR(an.pere_date_naissance, 'YYYY-MM-DD') as pere_date_naissance,
                an.pere_lieu_naissance,
                an.nom_mere, an.prenoms_mere, an.age_mere, an.profession_mere, an.domicile_mere,
                TO_CHAR(an.mere_date_naissance, 'YYYY-MM-DD') as mere_date_naissance,
                an.mere_lieu_naissance,
                an.temoin1_nom, an.temoin1_prenoms, an.temoin1_age, an.temoin1_profession,
                an.temoin2_nom, an.temoin2_prenoms, an.temoin2_age, an.temoin2_profession,
                an.declarant_nom, an.declarant_prenoms, an.declarant_qualite,
                an.declarant_profession, TO_CHAR(an.declarant_date_naissance, 'YYYY-MM-DD') as declarant_date_naissance,
                an.declarant_lieu_naissance, an.declarant_domicile,
                TO_CHAR(an.date_declaration, 'YYYY-MM-DD') as date_declaration,
                TO_CHAR(an.heure_declaration, 'HH24:MI') as heure_declaration,
                an.officier_etat_civil, an.user_id,
                TO_CHAR(an.date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation,
                TO_CHAR(an.date_modification, 'YYYY-MM-DD HH24:MI:SS') as date_modification
            FROM actes_naissance an
            ORDER BY an.date_creation DESC
            LIMIT 50
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération actes naissance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/actes/naissance/next-number', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
       
        const result = await pool.query(`
            SELECT numero_acte
            FROM actes_naissance
            WHERE annee = $1
            ORDER BY id DESC
            LIMIT 1
        `, [currentYear]);
       
        let nextNumber = 1;
       
        if (result.rows.length > 0) {
            const lastNumber = result.rows[0].numero_acte;
            const numberPart = lastNumber.split('-')[1];
            nextNumber = parseInt(numberPart) + 1;
        }
       
        const numeroActe = `N${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
       
        res.json({ success: true, numero_acte: numeroActe });
    } catch (error) {
        console.error('Erreur génération numéro naissance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ MODIFICATION : Utiliser req.user.id au lieu de req.body.user_id
app.post('/api/actes/naissance', authenticateToken, requireAgent, async (req, res) => {
    const {
        numero_acte, personne_id, nom, prenoms,
        date_naissance, heure_naissance, lieu_naissance, sexe,
        nom_pere, prenoms_pere, age_pere, profession_pere, domicile_pere,
        pere_date_naissance, pere_lieu_naissance,
        nom_mere, prenoms_mere, age_mere, profession_mere, domicile_mere,
        mere_date_naissance, mere_lieu_naissance,
        temoin1_nom, temoin1_prenoms, temoin1_age, temoin1_profession,
        temoin2_nom, temoin2_prenoms, temoin2_age, temoin2_profession,
        declarant_nom, declarant_prenoms, declarant_qualite,
        declarant_profession, declarant_date_naissance,
        declarant_lieu_naissance, declarant_domicile,
        date_declaration, heure_declaration, officier_etat_civil
    } = req.body;
   
    try {
        const annee = new Date(date_naissance).getFullYear();
       
        const result = await pool.query(`
            INSERT INTO actes_naissance (
                numero_acte, annee, personne_id, nom, prenoms,
                date_naissance, heure_naissance, lieu_naissance, sexe,
                nom_pere, prenoms_pere, age_pere, profession_pere, domicile_pere,
                pere_date_naissance, pere_lieu_naissance,
                nom_mere, prenoms_mere, age_mere, profession_mere, domicile_mere,
                mere_date_naissance, mere_lieu_naissance,
                temoin1_nom, temoin1_prenoms, temoin1_age, temoin1_profession,
                temoin2_nom, temoin2_prenoms, temoin2_age, temoin2_profession,
                declarant_nom, declarant_prenoms, declarant_qualite,
                declarant_profession, declarant_date_naissance,
                declarant_lieu_naissance, declarant_domicile,
                date_declaration, heure_declaration,
                officier_etat_civil, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42
            ) RETURNING *
        `, [
            numero_acte, annee, personne_id, nom, prenoms,
            date_naissance, heure_naissance, lieu_naissance, sexe,
            nom_pere, prenoms_pere, age_pere, profession_pere, domicile_pere,
            pere_date_naissance, pere_lieu_naissance,
            nom_mere, prenoms_mere, age_mere, profession_mere, domicile_mere,
            mere_date_naissance, mere_lieu_naissance,
            temoin1_nom, temoin1_prenoms, temoin1_age, temoin1_profession,
            temoin2_nom, temoin2_prenoms, temoin2_age, temoin2_profession,
            declarant_nom, declarant_prenoms, declarant_qualite,
            declarant_profession, declarant_date_naissance,
            declarant_lieu_naissance, declarant_domicile,
            date_declaration, heure_declaration, 
            officier_etat_civil, req.user.id // ✅ UTILISER LE USER_ID DU TOKEN
        ]);
       
        res.json({ success: true, data: result.rows[0] });
       
    } catch (error) {
        console.error('Erreur création acte naissance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ DELETE NAISSANCE - Avec suppression cascade des copies
app.delete('/api/actes/naissance/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); // Utiliser une transaction
    
    try {
        await client.query('BEGIN');
        
        // 1. Récupérer l'acte pour le message de confirmation
        const acteResult = await client.query(
            'SELECT numero_acte, nom, prenoms FROM actes_naissance WHERE id = $1',
            [id]
        );
        
        if (acteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de naissance non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        
        // 2. Supprimer les copies/duplicata associées
        const copiesResult = await client.query(
            'DELETE FROM copies_delivrees WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_copie',
            ['naissance', id]
        );
        
        // 3. Supprimer les mentions en marge
        const mentionsResult = await client.query(
            'DELETE FROM mentions_marge WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_mention',
            ['naissance', id]
        );
        
        // 4. Supprimer l'acte lui-même
        await client.query('DELETE FROM actes_naissance WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        console.log(`✅ Acte ${acte.numero_acte} supprimé avec ${copiesResult.rows.length} copies et ${mentionsResult.rows.length} mentions`);
        
        res.json({ 
            success: true, 
            message: `Acte ${acte.numero_acte} supprimé avec succès`,
            details: {
                acte: `${acte.nom} ${acte.prenoms}`,
                copies_supprimees: copiesResult.rows.length,
                mentions_supprimees: mentionsResult.rows.length
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur suppression naissance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression de l\'acte',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// ✅ PUT NAISSANCE - Avec mise à jour des copies
app.put('/api/actes/naissance/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const {
        numero_acte, nom, prenoms, date_naissance, heure_naissance, lieu_naissance, sexe,
        nom_pere, prenoms_pere, age_pere, profession_pere, domicile_pere,
        pere_date_naissance, pere_lieu_naissance,
        nom_mere, prenoms_mere, age_mere, profession_mere, domicile_mere,
        mere_date_naissance, mere_lieu_naissance,
        temoin1_nom, temoin1_prenoms, temoin1_age, temoin1_profession,
        temoin2_nom, temoin2_prenoms, temoin2_age, temoin2_profession,
        declarant_nom, declarant_prenoms, declarant_qualite,
        declarant_profession, declarant_date_naissance,
        declarant_lieu_naissance, declarant_domicile,
        date_declaration, heure_declaration, officier_etat_civil
    } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Mettre à jour l'acte
        const result = await client.query(`
            UPDATE actes_naissance SET
                numero_acte = $1, nom = $2, prenoms = $3,
                date_naissance = $4, heure_naissance = $5, lieu_naissance = $6, sexe = $7,
                nom_pere = $8, prenoms_pere = $9, age_pere = $10, profession_pere = $11, domicile_pere = $12,
                pere_date_naissance = $13, pere_lieu_naissance = $14,
                nom_mere = $15, prenoms_mere = $16, age_mere = $17, profession_mere = $18, domicile_mere = $19,
                mere_date_naissance = $20, mere_lieu_naissance = $21,
                temoin1_nom = $22, temoin1_prenoms = $23, temoin1_age = $24, temoin1_profession = $25,
                temoin2_nom = $26, temoin2_prenoms = $27, temoin2_age = $28, temoin2_profession = $29,
                declarant_nom = $30, declarant_prenoms = $31, declarant_qualite = $32,
                declarant_profession = $33, declarant_date_naissance = $34,
                declarant_lieu_naissance = $35, declarant_domicile = $36,
                date_declaration = $37, heure_declaration = $38, officier_etat_civil = $39,
                date_modification = CURRENT_TIMESTAMP
            WHERE id = $40
            RETURNING *
        `, [
            numero_acte, nom, prenoms, date_naissance, heure_naissance, lieu_naissance, sexe,
            nom_pere, prenoms_pere, age_pere, profession_pere, domicile_pere,
            pere_date_naissance, pere_lieu_naissance,
            nom_mere, prenoms_mere, age_mere, profession_mere, domicile_mere,
            mere_date_naissance, mere_lieu_naissance,
            temoin1_nom, temoin1_prenoms, temoin1_age, temoin1_profession,
            temoin2_nom, temoin2_prenoms, temoin2_age, temoin2_profession,
            declarant_nom, declarant_prenoms, declarant_qualite,
            declarant_profession, declarant_date_naissance,
            declarant_lieu_naissance, declarant_domicile,
            date_declaration, heure_declaration, officier_etat_civil,
            id
        ]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Acte non trouvé' });
        }

        // 2. Mettre à jour le numéro d'acte dans les copies associées (si modifié)
        const copiesUpdateResult = await client.query(`
            UPDATE copies_delivrees 
            SET numero_acte = $1
            WHERE type_acte = 'naissance' AND acte_id = $2 AND numero_acte != $1
            RETURNING numero_copie
        `, [numero_acte, id]);

        await client.query('COMMIT');
        
        console.log(`✅ Acte ${numero_acte} modifié - ${copiesUpdateResult.rows.length} copies mises à jour`);

        res.json({ 
            success: true, 
            data: result.rows[0], 
            message: 'Acte modifié avec succès',
            copies_updated: copiesUpdateResult.rows.length
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur modification naissance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la modification',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// =====================================================
// 4. GESTION DES ACTES DE MARIAGE (PROTÉGÉ)
// =====================================================
app.get('/api/actes/mariage', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, numero_acte, annee,
                epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance, epoux_profession, epoux_domicile,
                epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession, epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
                epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance, epouse_profession, epouse_domicile,
                epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession, epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
                TO_CHAR(date_mariage, 'YYYY-MM-DD') as date_mariage,
                TO_CHAR(heure_mariage, 'HH24:MI') as heure_mariage,
                lieu_mariage, regime_matrimonial,
                temoin1_nom, temoin1_prenoms, temoin1_qualite, temoin1_profession, TO_CHAR(temoin1_date_naissance, 'YYYY-MM-DD') as temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
                temoin2_nom, temoin2_prenoms, temoin2_qualite, temoin2_profession, TO_CHAR(temoin2_date_naissance, 'YYYY-MM-DD') as temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
                officier_etat_civil,
                TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
            FROM actes_mariage
            ORDER BY date_creation DESC
            LIMIT 50
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération mariages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/actes/mariage/next-number', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
       
        const result = await pool.query(`
            SELECT numero_acte
            FROM actes_mariage
            WHERE annee = $1
            ORDER BY id DESC
            LIMIT 1
        `, [currentYear]);
       
        let nextNumber = 1;
       
        if (result.rows.length > 0 && result.rows[0].numero_acte) {
            const lastNumber = result.rows[0].numero_acte;
            const numberPart = lastNumber.split('-')[1];
            const parsed = parseInt(numberPart);
            if (!isNaN(parsed)) {
                nextNumber = parsed + 1;
            }
        }
       
        const numeroActe = `M${currentYear}-${String(nextNumber).padStart(4, '0')}`;
       
        res.json({ success: true, numero_acte: numeroActe });
    } catch (error) {
        console.error('Erreur génération numéro mariage:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ MODIFICATION : Utiliser req.user.id
app.post('/api/actes/mariage', authenticateToken, requireAgent, async (req, res) => {
    const {
        numero_acte,
        epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance,
        epoux_profession, epoux_domicile,
        epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession,
        epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
        epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance,
        epouse_profession, epouse_domicile,
        epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession,
        epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
        date_mariage, heure_mariage, lieu_mariage, regime_matrimonial,
        temoin1_nom, temoin1_prenoms, temoin1_qualite,
        temoin1_profession, temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
        temoin2_nom, temoin2_prenoms, temoin2_qualite,
        temoin2_profession, temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
        officier_etat_civil
    } = req.body;
   
    try {
        const annee = new Date(date_mariage).getFullYear();
       
        const result = await pool.query(`
            INSERT INTO actes_mariage (
                numero_acte, annee,
                epoux_id, epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance,
                epoux_profession, epoux_domicile,
                epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession,
                epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
                epouse_id, epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance,
                epouse_profession, epouse_domicile,
                epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession,
                epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
                date_mariage, heure_mariage, lieu_mariage, regime_matrimonial,
                temoin1_nom, temoin1_prenoms, temoin1_qualite,
                temoin1_profession, temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
                temoin2_nom, temoin2_prenoms, temoin2_qualite,
                temoin2_profession, temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
                officier_etat_civil, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                $41, $42, $43, $44, $45, $46, $47, $48
            ) RETURNING *
        `, [
            numero_acte, annee,
            null, epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance,
            epoux_profession, epoux_domicile,
            epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession,
            epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
            null, epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance,
            epouse_profession, epouse_domicile,
            epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession,
            epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
            date_mariage, heure_mariage, lieu_mariage, regime_matrimonial,
            temoin1_nom, temoin1_prenoms, temoin1_qualite,
            temoin1_profession, temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
            temoin2_nom, temoin2_prenoms, temoin2_qualite,
            temoin2_profession, temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
            officier_etat_civil, req.user.id // ✅ UTILISER LE USER_ID DU TOKEN
        ]);
       
        res.json({ success: true, data: result.rows[0] });
       
    } catch (error) {
        console.error('Erreur création acte mariage:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.detail
        });
    }
});

// ✅ DELETE MARIAGE - Avec suppression cascade des copies
app.delete('/api/actes/mariage/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const acteResult = await client.query(
            'SELECT numero_acte, epoux_nom, epoux_prenoms, epouse_nom, epouse_prenoms FROM actes_mariage WHERE id = $1',
            [id]
        );
        
        if (acteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de mariage non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        
        const copiesResult = await client.query(
            'DELETE FROM copies_delivrees WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_copie',
            ['mariage', id]
        );
        
        const mentionsResult = await client.query(
            'DELETE FROM mentions_marge WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_mention',
            ['mariage', id]
        );
        
        await client.query('DELETE FROM actes_mariage WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        console.log(`✅ Acte ${acte.numero_acte} supprimé avec ${copiesResult.rows.length} copies et ${mentionsResult.rows.length} mentions`);
        
        res.json({ 
            success: true, 
            message: `Acte ${acte.numero_acte} supprimé avec succès`,
            details: {
                acte: `${acte.epoux_nom} ${acte.epoux_prenoms} & ${acte.epouse_nom} ${acte.epouse_prenoms}`,
                copies_supprimees: copiesResult.rows.length,
                mentions_supprimees: mentionsResult.rows.length
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur suppression mariage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression de l\'acte',
            error: error.message 
        });
    } finally {
        client.release();
    }
});


// ✅ PUT MARIAGE - Avec mise à jour des copies
app.put('/api/actes/mariage/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const {
        numero_acte,
        epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance,
        epoux_profession, epoux_domicile,
        epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession,
        epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
        epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance,
        epouse_profession, epouse_domicile,
        epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession,
        epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
        date_mariage, heure_mariage, lieu_mariage, regime_matrimonial,
        temoin1_nom, temoin1_prenoms, temoin1_qualite,
        temoin1_profession, temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
        temoin2_nom, temoin2_prenoms, temoin2_qualite,
        temoin2_profession, temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
        officier_etat_civil
    } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const result = await client.query(`
            UPDATE actes_mariage SET
                numero_acte = $1,
                epoux_nom = $2, epoux_prenoms = $3, epoux_date_naissance = $4, epoux_lieu_naissance = $5,
                epoux_profession = $6, epoux_domicile = $7,
                epoux_pere_nom = $8, epoux_pere_prenoms = $9, epoux_pere_profession = $10,
                epoux_mere_nom = $11, epoux_mere_prenoms = $12, epoux_mere_profession = $13,
                epouse_nom = $14, epouse_prenoms = $15, epouse_date_naissance = $16, epouse_lieu_naissance = $17,
                epouse_profession = $18, epouse_domicile = $19,
                epouse_pere_nom = $20, epouse_pere_prenoms = $21, epouse_pere_profession = $22,
                epouse_mere_nom = $23, epouse_mere_prenoms = $24, epouse_mere_profession = $25,
                date_mariage = $26, heure_mariage = $27, lieu_mariage = $28, regime_matrimonial = $29,
                temoin1_nom = $30, temoin1_prenoms = $31, temoin1_qualite = $32,
                temoin1_profession = $33, temoin1_date_naissance = $34, temoin1_lieu_naissance = $35, temoin1_domicile = $36,
                temoin2_nom = $37, temoin2_prenoms = $38, temoin2_qualite = $39,
                temoin2_profession = $40, temoin2_date_naissance = $41, temoin2_lieu_naissance = $42, temoin2_domicile = $43,
                officier_etat_civil = $44,
                date_modification = CURRENT_TIMESTAMP
            WHERE id = $45
            RETURNING *
        `, [
            numero_acte,
            epoux_nom, epoux_prenoms, epoux_date_naissance, epoux_lieu_naissance,
            epoux_profession, epoux_domicile,
            epoux_pere_nom, epoux_pere_prenoms, epoux_pere_profession,
            epoux_mere_nom, epoux_mere_prenoms, epoux_mere_profession,
            epouse_nom, epouse_prenoms, epouse_date_naissance, epouse_lieu_naissance,
            epouse_profession, epouse_domicile,
            epouse_pere_nom, epouse_pere_prenoms, epouse_pere_profession,
            epouse_mere_nom, epouse_mere_prenoms, epouse_mere_profession,
            date_mariage, heure_mariage, lieu_mariage, regime_matrimonial,
            temoin1_nom, temoin1_prenoms, temoin1_qualite,
            temoin1_profession, temoin1_date_naissance, temoin1_lieu_naissance, temoin1_domicile,
            temoin2_nom, temoin2_prenoms, temoin2_qualite,
            temoin2_profession, temoin2_date_naissance, temoin2_lieu_naissance, temoin2_domicile,
            officier_etat_civil,
            id
        ]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Acte non trouvé' });
        }

        const copiesUpdateResult = await client.query(`
            UPDATE copies_delivrees 
            SET numero_acte = $1
            WHERE type_acte = 'mariage' AND acte_id = $2 AND numero_acte != $1
            RETURNING numero_copie
        `, [numero_acte, id]);

        await client.query('COMMIT');
        
        console.log(`✅ Acte ${numero_acte} modifié - ${copiesUpdateResult.rows.length} copies mises à jour`);

        res.json({ 
            success: true, 
            data: result.rows[0], 
            message: 'Acte modifié avec succès',
            copies_updated: copiesUpdateResult.rows.length
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur modification mariage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la modification',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// =====================================================
// 5. GESTION DES ACTES DE DÉCÈS (PROTÉGÉ)
// =====================================================
app.get('/api/actes/deces', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, numero_acte, annee, nom, prenoms,
                TO_CHAR(date_naissance, 'YYYY-MM-DD') as date_naissance,
                lieu_naissance, age, sexe, profession, domicile,
                nom_pere, prenoms_pere, pere_profession, TO_CHAR(pere_date_naissance, 'YYYY-MM-DD') as pere_date_naissance, pere_lieu_naissance,
                nom_mere, prenoms_mere, mere_profession, TO_CHAR(mere_date_naissance, 'YYYY-MM-DD') as mere_date_naissance, mere_lieu_naissance,
                TO_CHAR(date_deces, 'YYYY-MM-DD') as date_deces,
                TO_CHAR(heure_deces, 'HH24:MI') as heure_deces,
                lieu_deces, cause_deces,
                declarant_nom, declarant_prenoms, declarant_qualite, declarant_age, declarant_domicile,
                declarant_profession, TO_CHAR(declarant_date_naissance, 'YYYY-MM-DD') as declarant_date_naissance, declarant_lieu_naissance,
                medecin_nom, medecin_prenoms, certificat_medical,
                TO_CHAR(date_declaration, 'YYYY-MM-DD') as date_declaration,
                TO_CHAR(heure_declaration, 'HH24:MI') as heure_declaration,
                officier_etat_civil,
                TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
            FROM actes_deces
            ORDER BY date_creation DESC
            LIMIT 50
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération décès:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/actes/deces/next-number', authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
       
        const result = await pool.query(`
            SELECT numero_acte
            FROM actes_deces
            WHERE annee = $1
            ORDER BY id DESC
            LIMIT 1
        `, [currentYear]);
       
        let nextNumber = 1;
       
        if (result.rows.length > 0 && result.rows[0].numero_acte) {
            const lastNumber = result.rows[0].numero_acte;
            const numberPart = lastNumber.split('-')[1];
            const parsed = parseInt(numberPart);
            if (!isNaN(parsed)) {
                nextNumber = parsed + 1;
            }
        }
       
        const numeroActe = `D${currentYear}-${String(nextNumber).padStart(4, '0')}`;
       
        res.json({ success: true, numero_acte: numeroActe });
    } catch (error) {
        console.error('Erreur génération numéro décès:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ MODIFICATION : Utiliser req.user.id
app.post('/api/actes/deces', authenticateToken, requireAgent, async (req, res) => {
    console.log('📥 Données reçues pour acte de décès:', JSON.stringify(req.body, null, 2));

    const {
        numero_acte, nom, prenoms, date_naissance, lieu_naissance, sexe, profession, domicile,
        age, etat_matrimonial, defunt_fokontany,
        nom_pere, prenoms_pere, pere_profession, pere_date_naissance, pere_lieu_naissance,
        pere_statut,
        nom_mere, prenoms_mere, mere_profession, mere_date_naissance, mere_lieu_naissance,
        mere_statut,
        parents_adresse,
        date_deces, heure_deces, lieu_deces, cause_deces,
        fokontany,
        declarant_nom, declarant_prenoms, declarant_qualite, declarant_age, declarant_domicile,
        declarant_profession, declarant_date_naissance, declarant_lieu_naissance,
        declarant_fokontany,
        medecin_nom, medecin_prenoms, certificat_medical,
        date_declaration, heure_declaration, officier_etat_civil
    } = req.body;

    try {
        if (!date_deces) {
            return res.status(400).json({ 
                success: false, 
                message: 'La date de décès est obligatoire' 
            });
        }
        
        if (!date_declaration || !heure_declaration || !officier_etat_civil) {
            return res.status(400).json({ 
                success: false, 
                message: '❌ Les métadonnées sont obligatoires : date_declaration, heure_declaration, officier_etat_civil' 
            });
        }
        
        const dateObj = new Date(date_deces);
        const annee = dateObj.getFullYear();
        const ageInt = age && age !== '' ? parseInt(age) : null;
        const declarantAgeInt = declarant_age && declarant_age !== '' ? parseInt(declarant_age) : null;
        
        console.log('✅ Données validées, insertion en cours...');
        
        const result = await pool.query(`
            INSERT INTO actes_deces (
                numero_acte, annee, defunt_id,
                nom, prenoms, date_naissance, lieu_naissance, age, sexe, profession, domicile,
                etat_matrimonial, defunt_fokontany,
                nom_pere, prenoms_pere, pere_profession, pere_date_naissance, pere_lieu_naissance, pere_statut,
                nom_mere, prenoms_mere, mere_profession, mere_date_naissance, mere_lieu_naissance, mere_statut,
                parents_adresse,
                date_deces, heure_deces, lieu_deces, cause_deces, fokontany,
                declarant_nom, declarant_prenoms, declarant_qualite, declarant_age, declarant_domicile,
                declarant_profession, declarant_date_naissance, declarant_lieu_naissance, declarant_fokontany,
                medecin_nom, medecin_prenoms, certificat_medical,
                date_declaration, heure_declaration, officier_etat_civil, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                $41, $42, $43, $44, $45, $46, $47
            ) RETURNING *
        `, [
            numero_acte, annee, null,
            nom, prenoms, date_naissance, lieu_naissance, ageInt, sexe, profession, domicile,
            etat_matrimonial, defunt_fokontany,
            nom_pere, prenoms_pere, pere_profession, pere_date_naissance, pere_lieu_naissance, pere_statut,
            nom_mere, prenoms_mere, mere_profession, mere_date_naissance, mere_lieu_naissance, mere_statut,
            parents_adresse,
            date_deces, heure_deces, lieu_deces, cause_deces, fokontany,
            declarant_nom, declarant_prenoms, declarant_qualite, declarantAgeInt, declarant_domicile,
            declarant_profession, declarant_date_naissance, declarant_lieu_naissance, declarant_fokontany,
            medecin_nom, medecin_prenoms, certificat_medical,
            date_declaration, heure_declaration, officier_etat_civil, req.user.id // ✅ UTILISER LE USER_ID DU TOKEN
        ]);
        
        console.log('✅ Acte de décès enregistré avec succès:', result.rows[0].numero_acte);
        
        res.json({ 
            success: true, 
            data: result.rows[0],
            message: `Acte de décès ${result.rows[0].numero_acte} créé avec succès`
        });
        
    } catch (error) {
        console.error('❌ Erreur création acte décès:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            details: error.detail,
            hint: error.hint
        });
    }
});

// ✅ DELETE DÉCÈS - Avec suppression cascade des copies
app.delete('/api/actes/deces/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const acteResult = await client.query(
            'SELECT numero_acte, nom, prenoms FROM actes_deces WHERE id = $1',
            [id]
        );
        
        if (acteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de décès non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        
        const copiesResult = await client.query(
            'DELETE FROM copies_delivrees WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_copie',
            ['deces', id]
        );
        
        const mentionsResult = await client.query(
            'DELETE FROM mentions_marge WHERE type_acte = $1 AND acte_id = $2 RETURNING numero_mention',
            ['deces', id]
        );
        
        await client.query('DELETE FROM actes_deces WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        console.log(`✅ Acte ${acte.numero_acte} supprimé avec ${copiesResult.rows.length} copies et ${mentionsResult.rows.length} mentions`);
        
        res.json({ 
            success: true, 
            message: `Acte ${acte.numero_acte} supprimé avec succès`,
            details: {
                acte: `${acte.nom} ${acte.prenoms}`,
                copies_supprimees: copiesResult.rows.length,
                mentions_supprimees: mentionsResult.rows.length
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur suppression décès:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression de l\'acte',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// ✅ PUT DÉCÈS - Avec mise à jour des copies
app.put('/api/actes/deces/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const {
        numero_acte, nom, prenoms, date_naissance, lieu_naissance, sexe, profession, domicile,
        age, etat_matrimonial, defunt_fokontany,
        nom_pere, prenoms_pere, pere_profession, pere_date_naissance, pere_lieu_naissance, pere_statut,
        nom_mere, prenoms_mere, mere_profession, mere_date_naissance, mere_lieu_naissance, mere_statut,
        parents_adresse,
        date_deces, heure_deces, lieu_deces, cause_deces, fokontany,
        declarant_nom, declarant_prenoms, declarant_qualite, declarant_age, declarant_domicile,
        declarant_profession, declarant_date_naissance, declarant_lieu_naissance, declarant_fokontany,
        medecin_nom, medecin_prenoms, certificat_medical,
        date_declaration, heure_declaration, officier_etat_civil
    } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const ageInt = age && age !== '' ? parseInt(age) : null;
        const declarantAgeInt = declarant_age && declarant_age !== '' ? parseInt(declarant_age) : null;

        const result = await client.query(`
            UPDATE actes_deces SET
                numero_acte = $1, nom = $2, prenoms = $3, date_naissance = $4, lieu_naissance = $5, 
                age = $6, sexe = $7, profession = $8, domicile = $9,
                etat_matrimonial = $10, defunt_fokontany = $11,
                nom_pere = $12, prenoms_pere = $13, pere_profession = $14, pere_date_naissance = $15, 
                pere_lieu_naissance = $16, pere_statut = $17,
                nom_mere = $18, prenoms_mere = $19, mere_profession = $20, mere_date_naissance = $21, 
                mere_lieu_naissance = $22, mere_statut = $23,
                parents_adresse = $24,
                date_deces = $25, heure_deces = $26, lieu_deces = $27, cause_deces = $28, fokontany = $29,
                declarant_nom = $30, declarant_prenoms = $31, declarant_qualite = $32, declarant_age = $33, 
                declarant_domicile = $34, declarant_profession = $35, declarant_date_naissance = $36, 
                declarant_lieu_naissance = $37, declarant_fokontany = $38,
                medecin_nom = $39, medecin_prenoms = $40, certificat_medical = $41,
                date_declaration = $42, heure_declaration = $43, officier_etat_civil = $44,
                date_modification = CURRENT_TIMESTAMP
            WHERE id = $45
            RETURNING *
        `, [
            numero_acte, nom, prenoms, date_naissance, lieu_naissance,
            ageInt, sexe, profession, domicile,
            etat_matrimonial, defunt_fokontany,
            nom_pere, prenoms_pere, pere_profession, pere_date_naissance, pere_lieu_naissance, pere_statut,
            nom_mere, prenoms_mere, mere_profession, mere_date_naissance, mere_lieu_naissance, mere_statut,
            parents_adresse,
            date_deces, heure_deces, lieu_deces, cause_deces, fokontany,
            declarant_nom, declarant_prenoms, declarant_qualite, declarantAgeInt, declarant_domicile,
            declarant_profession, declarant_date_naissance, declarant_lieu_naissance, declarant_fokontany,
            medecin_nom, medecin_prenoms, certificat_medical,
            date_declaration, heure_declaration, officier_etat_civil,
            id
        ]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Acte non trouvé' });
        }

        const copiesUpdateResult = await client.query(`
            UPDATE copies_delivrees 
            SET numero_acte = $1
            WHERE type_acte = 'deces' AND acte_id = $2 AND numero_acte != $1
            RETURNING numero_copie
        `, [numero_acte, id]);

        await client.query('COMMIT');
        
        console.log(`✅ Acte ${numero_acte} modifié - ${copiesUpdateResult.rows.length} copies mises à jour`);

        res.json({ 
            success: true, 
            data: result.rows[0], 
            message: 'Acte modifié avec succès',
            copies_updated: copiesUpdateResult.rows.length
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur modification décès:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la modification',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// =====================================================
// 6. COPIES & DUPLICATA (PROTÉGÉ)
// =====================================================
app.post('/api/copies', authenticateToken, requireAgent, async (req, res) => {
    const {
        type_acte, acte_id, numero_acte, type_copie,
        demandeur_nom, demandeur_prenoms, demandeur_qualite, demandeur_piece_identite,
        motif_demande, observations, montant_paye, reference_paiement
    } = req.body;
   
    try {
        const currentYear = new Date().getFullYear();
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM copies_delivrees
            WHERE EXTRACT(YEAR FROM date_demande) = $1
        `, [currentYear]);
       
        const nextNumber = parseInt(result.rows[0].count) + 1;
        const numeroCopie = `C${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
       
        const insertResult = await pool.query(`
            INSERT INTO copies_delivrees (
                numero_copie, type_acte, acte_id, numero_acte, type_copie,
                demandeur_nom, demandeur_prenoms, demandeur_qualite, demandeur_piece_identite,
                motif_demande, observations, montant_paye, reference_paiement,
                user_id, statut
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            ) RETURNING *
        `, [
            numeroCopie, type_acte, acte_id, numero_acte, type_copie,
            demandeur_nom, demandeur_prenoms, demandeur_qualite, demandeur_piece_identite,
            motif_demande, observations, montant_paye, reference_paiement,
            req.user.id, 'en_attente' // ✅ UTILISER LE USER_ID DU TOKEN
        ]);
       
        res.json({ success: true, data: insertResult.rows[0] });
    } catch (error) {
        console.error('Erreur création demande copie:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/copies', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, numero_copie, type_acte, acte_id, numero_acte, type_copie,
                demandeur_nom, demandeur_prenoms, demandeur_qualite, demandeur_piece_identite,
                TO_CHAR(date_demande, 'YYYY-MM-DD') as date_demande,
                TO_CHAR(date_delivrance, 'YYYY-MM-DD') as date_delivrance,
                motif_demande, observations, montant_paye, reference_paiement,
                statut, delivre_par, user_id,
                TO_CHAR(date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
            FROM copies_delivrees
            ORDER BY date_demande DESC
            LIMIT 100
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération copies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/copies/:id/deliver', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    const { delivre_par } = req.body;
   
    try {
        const result = await pool.query(`
            UPDATE copies_delivrees
            SET statut = 'delivree',
                date_delivrance = CURRENT_DATE,
                delivre_par = $1
            WHERE id = $2
            RETURNING *
        `, [delivre_par, id]);
       
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur délivrance copie:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/copies/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM copies_delivrees WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande non trouvée' });
        }
        
        res.json({ success: true, message: 'Demande supprimée avec succès', data: result.rows[0] });
    } catch (error) {
        console.error('Erreur suppression demande:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 7. RECHERCHE GLOBALE (PROTÉGÉ)
// =====================================================
app.get('/api/search', authenticateToken, async (req, res) => {
    const { query, type } = req.query;
    if (!query || query.length < 2) {
        return res.json({ success: false, message: 'Requête trop courte' });
    }
    try {
        let results = [];
        const searchPattern = `%${query.toLowerCase()}%`;
        
        if (!type || type === 'personnes' || type === 'all') {
            const personnes = await pool.query(`
                SELECT
                    id, nom, prenoms,
                    TO_CHAR(date_naissance, 'YYYY-MM-DD') as date_naissance,
                    lieu_naissance, 'personne' as type
                FROM personnes
                WHERE LOWER(nom) LIKE $1 OR LOWER(prenoms) LIKE $1
                LIMIT 10
            `, [searchPattern]);
            results = results.concat(personnes.rows);
        }
        
        if (!type || type === 'naissance' || type === 'all') {
            const naissances = await pool.query(`
                SELECT
                    id, numero_acte, nom, prenoms, nom_pere, prenoms_pere,
                    nom_mere, prenoms_mere,
                    TO_CHAR(date_naissance, 'YYYY-MM-DD') as date_naissance,
                    TO_CHAR(heure_naissance, 'HH24:MI') as heure_naissance,
                    lieu_naissance,
                    TO_CHAR(date_declaration, 'YYYY-MM-DD') as date_declaration,
                    'naissance' AS type
                FROM actes_naissance
                WHERE LOWER(nom) LIKE $1
                OR LOWER(prenoms) LIKE $1
                OR LOWER(nom_pere) LIKE $1
                OR LOWER(prenoms_pere) LIKE $1
                OR LOWER(nom_mere) LIKE $1
                OR LOWER(prenoms_mere) LIKE $1
                OR LOWER(numero_acte) LIKE $1
                LIMIT 10
            `, [searchPattern]);
            results = results.concat(naissances.rows);
        }
        
        if (!type || type === 'mariage' || type === 'all') {
            const mariages = await pool.query(`
                SELECT id, numero_acte, epoux_nom, epoux_prenoms,
                       epouse_nom, epouse_prenoms,
                       TO_CHAR(date_mariage, 'YYYY-MM-DD') as date_mariage,
                       'mariage' as type
                FROM actes_mariage
                WHERE LOWER(epoux_nom) LIKE $1
                   OR LOWER(epoux_prenoms) LIKE $1
                   OR LOWER(epouse_nom) LIKE $1
                   OR LOWER(epouse_prenoms) LIKE $1
                   OR LOWER(numero_acte) LIKE $1
                LIMIT 10
            `, [searchPattern]);
            results = results.concat(mariages.rows);
        }
        
        if (!type || type === 'deces' || type === 'all') {
            const deces = await pool.query(`
                SELECT id, numero_acte, nom, prenoms,
                       TO_CHAR(date_deces, 'YYYY-MM-DD') as date_deces,
                       TO_CHAR(heure_deces, 'HH24:MI') as heure_deces,
                       age, lieu_deces, 'deces' as type
                FROM actes_deces
                WHERE LOWER(nom) LIKE $1
                   OR LOWER(prenoms) LIKE $1
                   OR LOWER(numero_acte) LIKE $1
                LIMIT 10
            `, [searchPattern]);
            results = results.concat(deces.rows);
        }
        
        results = results.map(item => {
            if (item.type === 'naissance' && item.date_naissance) {
                item.date_naissance = formatDateToFrench(
                    item.date_naissance,
                    item.heure_naissance || null
                );
            }
            if (item.type === 'deces' && item.date_deces) {
                item.date_deces = formatDateToFrench(
                    item.date_deces,
                    item.heure_deces || null
                );
            }
            if (item.type === 'mariage' && item.date_mariage) {
                item.date_mariage = formatDateToFrench(item.date_mariage, null);
            }
            return item;
        });
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Erreur recherche:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 8. MENTIONS EN MARGE (PROTÉGÉ)
// =====================================================
app.get('/api/mentions/:type_acte/:acte_id', authenticateToken, async (req, res) => {
    const { type_acte, acte_id } = req.params;
   
    try {
        const result = await pool.query(`
            SELECT
                m.id, m.numero_mention,
                TO_CHAR(m.date_mention, 'YYYY-MM-DD') as date_mention,
                m.type_acte, m.acte_id, m.numero_acte_concerne,
                m.type_mention, m.contenu, m.reference_acte, m.user_id,
                u.nom as user_nom, u.prenoms as user_prenoms,
                TO_CHAR(m.date_creation, 'YYYY-MM-DD HH24:MI:SS') as date_creation
            FROM mentions_marge m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.type_acte = $1 AND m.acte_id = $2
            ORDER BY m.date_mention DESC
        `, [type_acte, acte_id]);
       
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erreur récupération mentions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/mentions', authenticateToken, requireAgent, async (req, res) => {
    const {
        type_acte, acte_id, numero_acte_concerne, type_mention,
        contenu, reference_acte
    } = req.body;
   
    try {
        const countResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM mentions_marge
            WHERE type_acte = $1 AND acte_id = $2
        `, [type_acte, acte_id]);
       
        const nextNumber = parseInt(countResult.rows[0].count) + 1;
        const numeroMention = `MEN-${nextNumber.toString().padStart(3, '0')}`;
       
        const result = await pool.query(`
            INSERT INTO mentions_marge (
                numero_mention, date_mention, type_acte, acte_id,
                numero_acte_concerne, type_mention, contenu,
                reference_acte, user_id
            ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            numeroMention, type_acte, acte_id, numero_acte_concerne,
            type_mention, contenu, reference_acte, req.user.id // ✅ UTILISER LE USER_ID DU TOKEN
        ]);
       
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur création mention:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/mentions/:id', authenticateToken, requireAgent, async (req, res) => {
    const { id } = req.params;
   
    try {
        const result = await pool.query(`
            DELETE FROM mentions_marge
            WHERE id = $1
            RETURNING *
        `, [id]);
       
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mention non trouvée' });
        }
       
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur suppression mention:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Fonction utilitaire pour ajouter des mentions automatiques
async function ajouterMentionAutomatique(type_acte, acte_id, numero_acte_concerne, type_mention, contenu, reference_acte, user_id) {
    try {
        const countResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM mentions_marge
            WHERE type_acte = $1 AND acte_id = $2
        `, [type_acte, acte_id]);
       
        const nextNumber = parseInt(countResult.rows[0].count) + 1;
        const numeroMention = `MEN-${nextNumber.toString().padStart(3, '0')}`;
       
        await pool.query(`
            INSERT INTO mentions_marge (
                numero_mention, date_mention, type_acte, acte_id,
                numero_acte_concerne, type_mention, contenu,
                reference_acte, user_id
            ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8)
        `, [
            numeroMention, type_acte, acte_id, numero_acte_concerne,
            type_mention, contenu, reference_acte, user_id
        ]);
       
        console.log(`✓ Mention ${type_mention} ajoutée sur l'acte ${numero_acte_concerne}`);
    } catch (error) {
        console.error('Erreur ajout mention automatique:', error);
    }
}

// =====================================================
// 9. STATISTIQUES (PUBLIC - optionnel)
// =====================================================
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM personnes'),
            pool.query('SELECT COUNT(*) as count FROM actes_naissance'),
            pool.query('SELECT COUNT(*) as count FROM actes_mariage'),
            pool.query('SELECT COUNT(*) as count FROM actes_deces'),
            pool.query('SELECT COUNT(*) as count FROM copies_delivrees WHERE date_delivrance IS NOT NULL'),
        ]);
       
        const result = {
            personnes: parseInt(stats[0].rows[0].count),
            naissances: parseInt(stats[1].rows[0].count),
            mariages: parseInt(stats[2].rows[0].count),
            deces: parseInt(stats[3].rows[0].count),
            copies_delivrees: parseInt(stats[4].rows[0].count)
        };
       
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Erreur statistiques:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// 10. ROUTES PDF (PROTÉGÉ)
// =====================================================
app.use('/api', authenticateToken, pdfRoutes);

// =====================================================
// GESTION DES ERREURS
// =====================================================
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Route 404 - doit être en dernier
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// =====================================================
// DÉMARRAGE DU SERVEUR
// =====================================================
app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur le port ${port}`);
    console.log(`📍 API disponible sur http://localhost:${port}`);
    console.log(`🔐 Authentification JWT activée`);
    console.log(`📄 Génération PDF v2.0 - Format Officiel Activée`);
    console.log(`🏛️  Commune Urbaine de Fianarantsoa - Système État Civil`);
    console.log(`\n📋 Comptes de test :`);
    console.log(`   👤 Admin: admin@fianarantsoa.mg / admin123`);
    console.log(`   👤 Agent: agent@fianarantsoa.mg / agent123`);
});

module.exports = app;