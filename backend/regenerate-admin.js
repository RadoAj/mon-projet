const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'etat_civil_fianarantsoa',
    password: process.env.DB_PASSWORD || 'noname888',
    port: process.env.DB_PORT || 5432,
});

async function regenerateAdmin() {
    try {
        console.log('🔐 Régénération du mot de passe admin...\n');
        
        // Générer un NOUVEAU hash
        const newHash = await bcrypt.hash('admin123', 10);
        
        console.log('📝 Nouveau hash généré:');
        console.log(newHash);
        console.log(`📏 Longueur: ${newHash.length} caractères\n`);
        
        // TEST IMMÉDIAT : Vérifier que le hash fonctionne
        const testCompare = await bcrypt.compare('admin123', newHash);
        console.log('🧪 Test de comparaison:');
        console.log(`   bcrypt.compare('admin123', newHash) = ${testCompare ? '✅ VALIDE' : '❌ INVALIDE'}\n`);
        
        if (!testCompare) {
            console.error('❌ ERREUR CRITIQUE : Le hash généré ne fonctionne pas !');
            await pool.end();
            return;
        }
        
        // Mettre à jour dans la BDD
        const result = await pool.query(
            `UPDATE users 
             SET mot_de_passe = $1 
             WHERE email = 'admin@fianarantsoa.mg'
             RETURNING id, email, role`,
            [newHash]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ Aucun utilisateur trouvé avec cet email');
        } else {
            console.log('✅ Admin mis à jour:', result.rows[0]);
            console.log('\n🎉 Tu peux maintenant te connecter avec:');
            console.log('   Email: admin@fianarantsoa.mg');
            console.log('   Mot de passe: admin123');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erreur:', error);
        await pool.end();
    }
}

regenerateAdmin();
