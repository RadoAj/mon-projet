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

async function verifyUsers() {
    try {
        const users = [
            { email: 'admin@fianarantsoa.mg', password: 'admin123' },
            { email: 'agent@fianarantsoa.mg', password: 'agent123' }
        ];
        
        console.log('🔍 Vérification des utilisateurs de test...\n');
        
        for (const user of users) {
            const result = await pool.query(
                'SELECT email, mot_de_passe, role, actif FROM users WHERE email = $1',
                [user.email]
            );
            
            if (result.rows.length === 0) {
                console.log(`❌ ${user.email} : NON TROUVÉ`);
                continue;
            }
            
            const dbUser = result.rows[0];
            const isValid = await bcrypt.compare(user.password, dbUser.mot_de_passe);
            
            console.log(`${isValid ? '✅' : '❌'} ${user.email}`);
            console.log(`   Rôle: ${dbUser.role}`);
            console.log(`   Actif: ${dbUser.actif ? 'Oui' : 'Non'}`);
            console.log(`   Mot de passe "${user.password}": ${isValid ? 'VALIDE' : 'INVALIDE'}\n`);
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erreur:', error);
        await pool.end();
    }
}

verifyUsers();
