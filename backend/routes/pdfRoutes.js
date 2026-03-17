// backend/routes/pdfRoutes.js - VERSION CORRIGÉE
const express = require('express');
const { 
    generateActeNaissancePDF, 
    generateActeMariagePDF, 
    generateActeDecesPDF 
} = require('../utils/pdfGenerator');

const router = express.Router();

// ✅ MIDDLEWARE : Récupérer le pool partagé depuis app.locals
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
// ROUTE : Générer PDF Acte de Naissance
// =====================================================
router.get('/pdf/naissance/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const acteResult = await req.pool.query(`
            SELECT * FROM actes_naissance WHERE id = $1
        `, [id]);
        
        if (acteResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de naissance non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        acte.type_acte = 'naissance';
        
        const mentionsResult = await req.pool.query(`
            SELECT contenu, date_mention 
            FROM mentions_marge 
            WHERE type_acte = 'naissance' AND acte_id = $1
            ORDER BY date_mention DESC
        `, [id]);
        
        const mentions = mentionsResult.rows;
        
        const pdfBuffer = await generateActeNaissancePDF(acte, mentions);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=acte_naissance_${acte.numero_acte}.pdf`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Erreur génération PDF naissance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération du PDF',
            error: error.message 
        });
    }
});

// =====================================================
// ROUTE : Générer PDF Acte de Mariage
// =====================================================
router.get('/pdf/mariage/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const acteResult = await req.pool.query(`
            SELECT * FROM actes_mariage WHERE id = $1
        `, [id]);
        
        if (acteResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de mariage non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        acte.type_acte = 'mariage';
        
        const mentionsResult = await req.pool.query(`
            SELECT contenu, date_mention 
            FROM mentions_marge 
            WHERE type_acte = 'mariage' AND acte_id = $1
            ORDER BY date_mention DESC
        `, [id]);
        
        const mentions = mentionsResult.rows;
        
        const pdfBuffer = await generateActeMariagePDF(acte, mentions);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=acte_mariage_${acte.numero_acte}.pdf`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Erreur génération PDF mariage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération du PDF',
            error: error.message 
        });
    }
});

// =====================================================
// ROUTE : Générer PDF Acte de Décès
// =====================================================
router.get('/pdf/deces/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const acteResult = await req.pool.query(`
            SELECT * FROM actes_deces WHERE id = $1
        `, [id]);
        
        if (acteResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte de décès non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        acte.type_acte = 'deces';
        
        const mentionsResult = await req.pool.query(`
            SELECT contenu, date_mention 
            FROM mentions_marge 
            WHERE type_acte = 'deces' AND acte_id = $1
            ORDER BY date_mention DESC
        `, [id]);
        
        const mentions = mentionsResult.rows;
        
        const pdfBuffer = await generateActeDecesPDF(acte, mentions);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=acte_deces_${acte.numero_acte}.pdf`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Erreur génération PDF décès:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération du PDF',
            error: error.message 
        });
    }
});

// =====================================================
// ROUTE : Générer PDF par numéro d'acte
// =====================================================
router.get('/pdf/numero/:numero_acte', async (req, res) => {
    const { numero_acte } = req.params;
    
    try {
        let typeActe = '';
        let tableName = '';
        let generatePDF = null;
        
        if (numero_acte.startsWith('N')) {
            typeActe = 'naissance';
            tableName = 'actes_naissance';
            generatePDF = generateActeNaissancePDF;
        } else if (numero_acte.startsWith('M')) {
            typeActe = 'mariage';
            tableName = 'actes_mariage';
            generatePDF = generateActeMariagePDF;
        } else if (numero_acte.startsWith('D')) {
            typeActe = 'deces';
            tableName = 'actes_deces';
            generatePDF = generateActeDecesPDF;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Numéro d\'acte invalide' 
            });
        }
        
        const acteResult = await req.pool.query(`
            SELECT * FROM ${tableName} WHERE numero_acte = $1
        `, [numero_acte]);
        
        if (acteResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        acte.type_acte = typeActe;
        
        const mentionsResult = await req.pool.query(`
            SELECT contenu, date_mention 
            FROM mentions_marge 
            WHERE type_acte = $1 AND acte_id = $2
            ORDER BY date_mention DESC
        `, [typeActe, acte.id]);
        
        const mentions = mentionsResult.rows;
        
        const pdfBuffer = await generatePDF(acte, mentions);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=acte_${typeActe}_${numero_acte}.pdf`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Erreur génération PDF:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération du PDF',
            error: error.message 
        });
    }
});

// =====================================================
// ROUTE : Vérifier un acte par QR Code
// =====================================================
router.get('/verify/:numero_acte', async (req, res) => {
    const { numero_acte } = req.params;
    
    try {
        let typeActe = '';
        let tableName = '';
        
        if (numero_acte.startsWith('N')) {
            typeActe = 'naissance';
            tableName = 'actes_naissance';
        } else if (numero_acte.startsWith('M')) {
            typeActe = 'mariage';
            tableName = 'actes_mariage';
        } else if (numero_acte.startsWith('D')) {
            typeActe = 'deces';
            tableName = 'actes_deces';
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Numéro d\'acte invalide' 
            });
        }
        
        const result = await req.pool.query(`
            SELECT id, numero_acte, 
                   TO_CHAR(date_creation, 'YYYY-MM-DD') as date_creation 
            FROM ${tableName} 
            WHERE numero_acte = $1
        `, [numero_acte]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte non trouvé',
                verified: false
            });
        }
        
        res.json({ 
            success: true, 
            verified: true,
            message: 'Acte authentique',
            data: {
                numero_acte: result.rows[0].numero_acte,
                type: typeActe,
                date_creation: result.rows[0].date_creation
            }
        });
        
    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la vérification',
            error: error.message 
        });
    }
});

// =====================================================
// ROUTE : Générer PDF pour copie/duplicata
// =====================================================
router.post('/pdf/copie', async (req, res) => {
    const { type_acte, acte_id, demandeur_nom, demandeur_prenoms, type_copie } = req.body;
    
    try {
        if (!type_acte || !acte_id || !demandeur_nom || !demandeur_prenoms || !type_copie) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tous les champs sont obligatoires' 
            });
        }
        
        let tableName = '';
        let generatePDF = null;
        
        if (type_acte === 'naissance') {
            tableName = 'actes_naissance';
            generatePDF = generateActeNaissancePDF;
        } else if (type_acte === 'mariage') {
            tableName = 'actes_mariage';
            generatePDF = generateActeMariagePDF;
        } else if (type_acte === 'deces') {
            tableName = 'actes_deces';
            generatePDF = generateActeDecesPDF;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Type d\'acte invalide' 
            });
        }
        
        const acteResult = await req.pool.query(`
            SELECT * FROM ${tableName} WHERE id = $1
        `, [acte_id]);
        
        if (acteResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Acte non trouvé' 
            });
        }
        
        const acte = acteResult.rows[0];
        acte.type_acte = type_acte;
        
        const mentionsResult = await req.pool.query(`
            SELECT contenu, date_mention 
            FROM mentions_marge 
            WHERE type_acte = $1 AND acte_id = $2
            ORDER BY date_mention DESC
        `, [type_acte, acte_id]);
        
        const mentions = mentionsResult.rows;
        
        const currentYear = new Date().getFullYear();
        const copiesCountResult = await req.pool.query(`
            SELECT COUNT(*) as count 
            FROM copies_delivrees 
            WHERE EXTRACT(YEAR FROM date_demande) = $1
        `, [currentYear]);
        
        const nextNumber = parseInt(copiesCountResult.rows[0].count) + 1;
        const numeroCopie = `C${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
        
        await req.pool.query(`
            INSERT INTO copies_delivrees (
                numero_copie, type_acte, acte_id, numero_acte, type_copie,
                demandeur_nom, demandeur_prenoms, statut, date_delivrance
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'delivree', CURRENT_DATE)
        `, [numeroCopie, type_acte, acte_id, acte.numero_acte, type_copie, 
            demandeur_nom, demandeur_prenoms]);
        
        const pdfBuffer = await generatePDF(acte, mentions);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type_acte}_${type_copie}_${acte.numero_acte}.pdf`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Erreur génération copie:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération de la copie',
            error: error.message 
        });
    }
});

module.exports = router;