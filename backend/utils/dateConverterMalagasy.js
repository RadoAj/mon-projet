// backend/utils/dateConverterMalagasy.js
// =====================================================
// CONVERTISSEUR DE DATES ET HEURES - FORMAT OFFICIEL MALGACHE
// =====================================================

const MOIS_MALGACHE = {
    '01': 'Janoary', '02': 'Febroary', '03': 'Marsa', '04': 'Avrily',
    '05': 'Mey', '06': 'Jona', '07': 'Jolay', '08': 'Aogositra',
    '09': 'Septambra', '10': 'Oktobra', '11': 'Novambra', '12': 'Desambra'
};

// Nombres de 0 à 9
const UNITES = {
    '0': '', '1': 'iraika', '2': 'roa', '3': 'telo', '4': 'efatra',
    '5': 'dimy', '6': 'enina', '7': 'fito', '8': 'valo', '9': 'sivy'
};

// Dizaines
const DIZAINES = {
    '10': 'folo', '20': 'roapolo', '30': 'telopolo', '40': 'efapolo',
    '50': 'dimapolo', '60': 'enipolo', '70': 'fitopolo', '80': 'valopolo', '90': 'sivifolo'
};

// Centaines
const CENTAINES = {
    '100': 'zato', '200': 'roan-jato', '300': 'telon-jato', '400': 'efajato',
    '500': 'dimanjato', '600': 'eninjato', '700': 'fiton-jato', '800': 'valon-jato', '900': 'sivin-jato'
};

/**
 * Convertit un nombre de 1 à 31 en malgache
 */
function convertirJour(jour) {
    const j = parseInt(jour);
    
    // Cas spéciaux
    if (j === 1) return 'voalohany';
    if (j === 10) return 'folo';
    if (j === 20) return 'roapolo';
    if (j === 30) return 'telopolo';
    
    // Nombres de 2 à 9
    if (j < 10) {
        return UNITES[j.toString()];
    }
    
    // Nombres de 11 à 19
    if (j > 10 && j < 20) {
        const unite = j - 10;
        return `${UNITES[unite.toString()]} ambin'ny folo`;
    }
    
    // Nombres de 21 à 29, 31
    const dizaine = Math.floor(j / 10) * 10;
    const unite = j % 10;
    
    if (unite === 0) {
        return DIZAINES[dizaine.toString()];
    }
    
    return `${UNITES[unite.toString()]} amby ${DIZAINES[dizaine.toString()]}`;
}

/**
 * Convertit une année (1900-2099) en malgache
 */
function convertirAnnee(annee) {
    const a = parseInt(annee);
    
    // Années 1900-1999
    if (a >= 1900 && a < 2000) {
        const reste = a - 1900;
        
        if (reste === 0) return 'sivanjato sy arivo';
        
        const centaines = Math.floor(reste / 100) * 100;
        const dizaines = Math.floor((reste % 100) / 10) * 10;
        const unites = reste % 10;
        
        let resultat = 'arivo';
        
        // Ajouter centaines
        if (centaines > 0) {
            const c = centaines / 100;
            if (c === 9) resultat = 'sivanjato sy ' + resultat;
            else if (c === 8) resultat = 'valon-jato sy ' + resultat;
            else if (c === 7) resultat = 'fiton-jato sy ' + resultat;
            else if (c === 6) resultat = 'eninjato sy ' + resultat;
            else if (c === 5) resultat = 'dimanjato sy ' + resultat;
        } else {
            resultat = 'sivanjato sy ' + resultat;
        }
        
        // Ajouter dizaines
        if (dizaines > 0) {
            if (dizaines === 90) resultat = 'sivifolo sy ' + resultat;
            else if (dizaines === 80) resultat = 'valopolo sy ' + resultat;
            else if (dizaines === 70) resultat = 'fitopolo sy ' + resultat;
            else if (dizaines === 60) resultat = 'enipolo sy ' + resultat;
            else if (dizaines === 50) resultat = 'dimapolo sy ' + resultat;
            else if (dizaines === 40) resultat = 'efapolo sy ' + resultat;
            else if (dizaines === 30) resultat = 'telopolo sy ' + resultat;
            else if (dizaines === 20) resultat = 'roapolo sy ' + resultat;
            else if (dizaines === 10) resultat = 'folo sy ' + resultat;
        }
        
        // Ajouter unités
        if (unites > 0) {
            if (dizaines > 0) {
                resultat = `${UNITES[unites.toString()]} amby ${resultat}`;
            } else {
                resultat = `${UNITES[unites.toString()]} sy ${resultat}`;
            }
        }
        
        return resultat;
    }
    
    // Années 2000-2099
    if (a >= 2000 && a < 2100) {
        const reste = a - 2000;
        
        if (reste === 0) return 'roa arivo';
        
        const dizaines = Math.floor(reste / 10) * 10;
        const unites = reste % 10;
        
        let resultat = 'roa arivo';
        
        // Cas simples: 2001-2009
        if (reste < 10) {
            return `${UNITES[reste.toString()]} sy ${resultat}`;
        }
        
        // Cas 2010, 2020, 2030...
        if (unites === 0) {
            return `${DIZAINES[dizaines.toString()]} sy ${resultat}`;
        }
        
        // Cas 2011-2099
        return `${UNITES[unites.toString()]} amby ${DIZAINES[dizaines.toString()]} sy ${resultat}`;
    }
    
    return a.toString();
}

/**
 * ✅ NOUVELLE FONCTION : Convertit une heure (format HH:MM ou HH:MM:SS) en malgache
 * Exemples:
 * - "13:00" → "iraika ora tolakandro" (1h PM)
 * - "16:30" → "efatra ora sy sasany hariva" (4h30 PM)
 * - "08:00" → "valo ora maraina" (8h AM)
 */
function convertirHeureMalgache(heureStr) {
    if (!heureStr) return '';
    
    try {
        // Parser l'heure
        const parts = heureStr.split(':');
        let heure = parseInt(parts[0]);
        const minutes = parts.length > 1 ? parseInt(parts[1]) : 0;
        
        // Déterminer période (maraina, tolakandro, hariva, alina)
        let periode = '';
        let heureAffichee = heure;
        
        if (heure >= 0 && heure < 6) {
            periode = 'alina';
        } else if (heure >= 6 && heure < 12) {
            periode = 'maraina';
        } else if (heure >= 12 && heure < 13) {
            periode = 'mitataovovoana'; // midi
            heureAffichee = 12;
        } else if (heure >= 13 && heure < 18) {
            periode = 'tolakandro';
            heureAffichee = heure - 12;
        } else {
            periode = 'hariva';
            heureAffichee = heure - 12;
        }
        
        // Convertir l'heure en malgache
        let heureText = '';
        if (heureAffichee === 1) heureText = 'iraika';
        else if (heureAffichee === 2) heureText = 'roa';
        else if (heureAffichee === 3) heureText = 'telo';
        else if (heureAffichee === 4) heureText = 'efatra';
        else if (heureAffichee === 5) heureText = 'dimy';
        else if (heureAffichee === 6) heureText = 'enina';
        else if (heureAffichee === 7) heureText = 'fito';
        else if (heureAffichee === 8) heureText = 'valo';
        else if (heureAffichee === 9) heureText = 'sivy';
        else if (heureAffichee === 10) heureText = 'folo';
        else if (heureAffichee === 11) heureText = 'iraika ambin\'ny folo';
        else if (heureAffichee === 12) heureText = 'roa ambin\'ny folo';
        
        // Ajouter "ora"
        let resultat = `${heureText} ora`;
        
        // Ajouter minutes si présentes
        if (minutes === 15) {
            resultat += ' sy ampahefany';
        } else if (minutes === 30) {
            resultat += ' sy sasany';
        } else if (minutes === 45) {
            resultat += ' sy telo ampahefany';
        } else if (minutes > 0) {
            const minutesText = convertirJour(minutes);
            resultat += ` sy ${minutesText} minitra`;
        }
        
        // Ajouter période
        resultat += ` ${periode}`;
        
        return resultat;
        
    } catch (error) {
        console.error('Erreur conversion heure:', error);
        return heureStr;
    }
}

/**
 * Fonction principale : Convertit une date YYYY-MM-DD en format malgache complet
 * Exemple: "2025-03-23" → "telo amby roapolo Marsa taona dimy amby roapolo sy roa arivo"
 */
function formatDateMalgache(dateStr) {
    if (!dateStr) return '';
    
    try {
        // Support des formats YYYY-MM-DD et objets Date
        let dateParts;
        
        if (dateStr instanceof Date) {
            const y = dateStr.getFullYear();
            const m = String(dateStr.getMonth() + 1).padStart(2, '0');
            const d = String(dateStr.getDate()).padStart(2, '0');
            dateParts = [y, m, d];
        } else if (typeof dateStr === 'string') {
            dateParts = dateStr.split('-');
        } else {
            return dateStr.toString();
        }
        
        const [year, month, day] = dateParts;
        
        const jourMalgache = convertirJour(day);
        const moisMalgache = MOIS_MALGACHE[month];
        const anneeMalgache = convertirAnnee(year);
        
        return `${jourMalgache} ${moisMalgache} taona ${anneeMalgache}`;
        
    } catch (error) {
        console.error('Erreur conversion date:', error);
        return dateStr.toString();
    }
}

/**
 * ✅ NOUVELLE FONCTION : Format date COURTE pour encadré (ex: "16 Avrily 1998")
 */
function formatDateCourteMalgache(dateStr) {
    if (!dateStr) return '';
    
    try {
        let dateParts;
        
        if (dateStr instanceof Date) {
            const y = dateStr.getFullYear();
            const m = String(dateStr.getMonth() + 1).padStart(2, '0');
            const d = String(dateStr.getDate()).padStart(2, '0');
            dateParts = [y, m, d];
        } else if (typeof dateStr === 'string') {
            dateParts = dateStr.split('-');
        } else {
            return dateStr.toString();
        }
        
        const [year, month, day] = dateParts;
        
        const jourNum = parseInt(day);
        const moisMalgache = MOIS_MALGACHE[month];
        
        return `${jourNum} ${moisMalgache} ${year}`;
        
    } catch (error) {
        return dateStr;
    }
}

/**
 * Obtenir la date actuelle en format malgache complet
 */
function getDateActuelleMalgache() {
    const maintenant = new Date();
    return formatDateMalgache(maintenant);
}

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    formatDateMalgache,
    formatDateCourteMalgache,
    getDateActuelleMalgache,
    convertirJour,
    convertirAnnee,
    convertirHeureMalgache,  // ✅ NOUVEAU
    MOIS_MALGACHE
};