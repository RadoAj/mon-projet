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

async function createTestUsers() {
    try {
        console.log('🔐 Création des utilisateurs de test...\n');

        const users = [
            {
                nom: 'RASOLOFO',
                prenoms: 'Jean',
                email: 'admin@fianarantsoa.mg',
                plainPassword: 'admin123',
                role: 'admin'
            },
            {
                nom: 'RAKOTO',
                prenoms: 'Marie',
                email: 'agent@fianarantsoa.mg',
                plainPassword: 'agent123',
                role: 'agent'
            }
        ];

        for (const user of users) {
            // Hash du mot de passe
            const hashedPassword = await bcrypt.hash(user.plainPassword, 10);
            
            // Vérification immédiate
            const testCompare = await bcrypt.compare(user.plainPassword, hashedPassword);
            if (!testCompare) {
                console.error(`❌ ERREUR : Hash invalide pour ${user.email}`);
                continue;
            }

            // Insertion en BDD
            await pool.query(`
                INSERT INTO users (nom, prenoms, email, mot_de_passe, role, actif)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) 
                DO UPDATE SET mot_de_passe = $4, actif = true
            `, [user.nom, user.prenoms, user.email, hashedPassword, user.role, true]);

            console.log(`✅ ${user.role.toUpperCase()} créé : ${user.email} / ${user.plainPassword}`);
        }

        console.log('\n🎉 Utilisateurs de test créés avec succès !');
        console.log('\n📝 COMPTES DE TEST :');
        console.log('   Admin: admin@fianarantsoa.mg / admin123');
        console.log('   Agent: agent@fianarantsoa.mg / agent123');

        await pool.end();
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        await pool.end();
    }
}

createTestUsers();