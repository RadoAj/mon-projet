// backend/utils/pdfGenerator.js - VERSION COMPLÈTE NAISSANCE + MARIAGE
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { 
    formatDateMalgache, 
    formatDateCourteMalgache,
    getDateActuelleMalgache,
    convertirHeureMalgache 
} = require('./dateConverterMalagasy');

// =====================================================
// CONFIGURATION
// =====================================================
const COMMUNE_CONFIG = {
    pays: 'REPOBLIKAN\'I MADAGASIKARA',
    devise: 'Fitiavana-Tanindrazana-Fandrosoana',
    region: 'REGION HAUTE MATSIATRA',
    commune: 'Commune Urbaine',
    ville: 'Fianarantsoa'
};

// =====================================================
// FONCTION : Générer QR Code
// =====================================================
async function generateQRCode(data) {
    try {
        const qrDataURL = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 100,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        return qrDataURL;
    } catch (err) {
        console.error('Erreur QR Code:', err);
        return null;
    }
}

// =====================================================
// GÉNÉRATION PDF : ACTE DE NAISSANCE
// =====================================================
async function generateActeNaissancePDF(acte, mentions = []) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 60, left: 50, right: 50 },
                bufferPages: true
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            let yPos = 50;
            
            // EN-TÊTE
            const headerX = 50;
            const headerWidth = 300;
            
            doc.fontSize(11).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.pays, headerX, yPos, { width: headerWidth, align: 'left' });
            yPos += 14;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(COMMUNE_CONFIG.devise, headerX, yPos, { width: headerWidth, align: 'left' });
            yPos += 18;
            doc.fontSize(10).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.region, headerX, yPos, { width: headerWidth, align: 'left' });
            yPos += 14;
            doc.fontSize(10).font('Helvetica')
               .text(COMMUNE_CONFIG.commune, headerX, yPos, { width: headerWidth, align: 'left' });
            yPos += 12;
            doc.fontSize(9).font('Helvetica')
               .text('De', headerX, yPos, { width: headerWidth, align: 'left' });
            yPos += 12;
            doc.fontSize(10).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.ville, headerX, yPos, { width: headerWidth, align: 'left' });
            
            // ENCADRÉ LÉGAL
            const legalBoxX = 380;
            const legalBoxY = 50;
            const legalBoxWidth = 165;
            const legalBoxHeight = 45;
            
            doc.rect(legalBoxX, legalBoxY, legalBoxWidth, legalBoxHeight).lineWidth(1).stroke();
            doc.fontSize(6.5).font('Helvetica')
               .text('Teny midina laharana faha-788-MJ/CAB Taona ny 29', legalBoxX + 5, legalBoxY + 5, { width: legalBoxWidth - 10 })
               .text(`Desambra 1961 Ny Nataon'ny Minisitra ny Fitsarana`, legalBoxX + 5, legalBoxY + 14, { width: legalBoxWidth - 10 })
               .text(' sy ny Mpitahiry ny kasem-panjakana', legalBoxX + 5, legalBoxY + 23, { width: legalBoxWidth - 10 });
            
            yPos += 35;
            
            // TITRE
            doc.fontSize(12).font('Helvetica-Bold')
               .text('KOPIA SORA-PIANKOHONANA', 50, yPos, { width: 495, align: 'center' });
            doc.fontSize(10).font('Helvetica-Bold')
               .text('RD', 500, yPos, { align: 'right' });
            
            yPos += 35;
            
            // SECTION RD (GAUCHE)
            const rdX = 50;
            const rdWidth = 170;
            let rdY = yPos;
            
            doc.fontSize(10).font('Helvetica-Bold')
               .text(`N° ${acte.numero_acte || 'XXX'}`, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 22;
            doc.fontSize(8).font('Helvetica').text('Tamin\'ny', rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 14;
            
            let dateFormatCourt = '';
            if (acte.date_naissance) {
                const dateObj = new Date(acte.date_naissance);
                const jour = String(dateObj.getDate()).padStart(2, '0');
                const mois = String(dateObj.getMonth() + 1).padStart(2, '0');
                const annee = dateObj.getFullYear();
                dateFormatCourt = `${jour}/${mois}/${annee}`;
            }
            doc.text(dateFormatCourt, rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 20;
            
            doc.fontSize(9).font('Helvetica-Bold').text('FAHATERAHANA', rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 16;

            doc.fontSize(8).font('Helvetica').text('_________________', rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 18;

            const nomMajuscule = (acte.nom || '').toUpperCase();
            const prenomsFormates = acte.prenoms || '';
            const nomComplet = ` ${nomMajuscule} ${prenomsFormates}`.trim();
            
            doc.fontSize(8).font('Helvetica-Bold')
               .text(nomComplet, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 25;
            
            doc.fontSize(8).font('Helvetica').text('_________________', rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 18;
            
            const dateCourte = formatDateCourteMalgache(acte.date_naissance);
            doc.text(dateCourte, rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 35;
            
            doc.fontSize(6.5).font('Helvetica')
               .text('Tsy asiana hajia araka ny', rdX, rdY,{ width: rdWidth, align: 'center' });
            rdY += 10;
            doc.text('andininy faha-416 CG', rdX, rdY,{ width: rdWidth, align: 'center' });
            
            // CONTENU PRINCIPAL
            const contentX = rdX + rdWidth + 25;
            const contentWidth = 495 - contentX + 50;
            let contentY = yPos;
            
            const sexe = acte.sexe === 'M' ? 'zazalahy' : 'zazavavy';
            const heureMalgache = acte.heure_naissance ? convertirHeureMalgache(acte.heure_naissance) : '';
            const lieuNaissance = acte.lieu_naissance || 'Fianarantsoa';
            const anneeActe = acte.annee || new Date(acte.date_naissance).getFullYear();
            const dateMalgache = formatDateMalgache(acte.date_naissance);
            
            // PARAGRAPHE 1
            let p1 = `---- Nalaina tamin'ny bokim-piankohonana ao amin'ny Kaominina ${COMMUNE_CONFIG.ville} Renivohitra taona ${anneeActe}, izao soratra manaraka izao`;
            doc.fontSize(9).font('Helvetica').text(p1, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p1, { width: contentWidth, lineGap: 3 }) + 12;
            
            // PARAGRAPHE 2
            let p2 = `----Tamin'ny ${dateMalgache}`;
            if (heureMalgache) p2 += `, Tamin'ny ${heureMalgache}`;
            p2 += `, no teraka tao amin'ny trano fampitarehan'i ${lieuNaissance} : ${nomComplet}, ${sexe}`;
            
            if (acte.nom_pere || acte.nom_mere) {
                p2 += `, zanakan'i`;
                if (acte.nom_pere) {
                    p2 += ` ${(acte.nom_pere || '').toUpperCase()} ${acte.prenoms_pere || ''}`;
                    if (acte.profession_pere) p2 += `, ${acte.profession_pere}`;
                    if (acte.pere_lieu_naissance) p2 += ` teraka tao ${acte.pere_lieu_naissance}`;
                    if (acte.pere_date_naissance) p2 += ` tamin'ny ${formatDateMalgache(acte.pere_date_naissance)}`;
                }
                if (acte.nom_mere) {
                    if (acte.nom_pere) p2 += ', sy ';
                    p2 += ` ${(acte.nom_mere || '').toUpperCase()} ${acte.prenoms_mere || ''}`;
                    if (acte.profession_mere) p2 += `, ${acte.profession_mere}`;
                    if (acte.mere_lieu_naissance) p2 += ` teraka tao ${acte.mere_lieu_naissance}`;
                    if (acte.mere_date_naissance) p2 += ` tamin'ny ${formatDateMalgache(acte.mere_date_naissance)}`;
                }
                const domicile = acte.domicile_pere || acte.domicile_mere;
                if (domicile) p2 += ` monina ao ${domicile}`;
            }
            p2 += '.------------------------------------';
            
            doc.text(p2, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p2, { width: contentWidth, lineGap: 3 }) + 12;
            
            // PARAGRAPHE 3
            const dateDeclaration = acte.date_declaration || acte.date_naissance;
            const heureDeclaration = acte.heure_declaration ? convertirHeureMalgache(acte.heure_declaration) : '';
            
            let p3 = `----Nosoratana androany ${formatDateMalgache(dateDeclaration)}`;
            if (heureDeclaration) p3 += `,tamin'ny ${heureDeclaration}`;
            p3 += ', araka ny fanambarana nataon-i ';
            
            if (acte.declarant_nom) {
                p3 += ` ${(acte.declarant_nom || '').toUpperCase()} ${acte.declarant_prenoms || ''}`;
                if (acte.declarant_profession) p3 += `, ${acte.declarant_profession}`;
                if (acte.declarant_date_naissance) p3 += `, teraka tamin'ny ${formatDateMalgache(acte.declarant_date_naissance)}`;
                if (acte.declarant_lieu_naissance) p3 += ` tao ${acte.declarant_lieu_naissance}`;
                if (acte.declarant_domicile) p3 += `, monina ao ${acte.declarant_domicile}`;
                p3 += ', ';
            }
            
            const officier = acte.officier_etat_civil || `Ben'ny Tanàna Mpiandraikitra ny Sorampiankohonana`;
            p3 += `izay miara-manao sonia aminay ${officier}, Ben'ny Tanàna  Mpiandraikitra ny Sorampiankohonana ao amin'ny Kaominin'I ${COMMUNE_CONFIG.ville} Renivohitra rehefa novakiana taminy ity soratra ity. -----------------`;
            
            doc.text(p3, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p3, { width: contentWidth, lineGap: 3 }) + 18;
            
            // SORATRA MANARAKA
            doc.fontSize(8).text('-'.repeat(30) + 'SORATRA MANARAKA' + '-'.repeat(30), 50, contentY, { width: 495, align: 'center' });
            contentY += 18;
            
            doc.fontSize(9).font('Helvetica-Bold').text('SORATRA ANTSISINY:', 50, contentY, { width: 495, align: 'center' });
            contentY += 14;
            
            if (mentions && mentions.length > 0) {
                mentions.forEach((mention) => {
                    doc.fontSize(8).font('Helvetica').text(mention.contenu, 50, contentY, { width: 495, align: 'center' });
                    contentY += 18;
                });
            } else {
                doc.fontSize(8).font('Helvetica-Oblique').text('Tsy misy.', 50, contentY, { width: 495, align: 'center' });
                contentY += 14;
            }
            
            contentY += 20;
            
            // PIED DE PAGE
            const dateSortieMalgache = formatDateMalgache(new Date());
            doc.fontSize(8).font('Helvetica')
               .text(`Kopia manotolo nadika tamin'ny boky androany ${dateSortieMalgache},`, 50, contentY, { width: 495, align: 'center' });
            contentY += 12;
            doc.text(`, tao Fianarantsoa.`, 50, contentY, { width: 495, align: 'center' });
            contentY += 25;
            
            doc.fontSize(9).font('Helvetica-Bold').text('NY MPIANDRAIKITRA NY SORA-PIANKOHONANA', 50, contentY, { width: 495, align: 'center' });
            contentY += 40;
            
            // QR CODE
            const qrCode = await generateQRCode(`https://etatcivil-fianarantsoa.mg/verify/${acte.numero_acte}`);
            if (qrCode) {
                const qrImage = Buffer.from(qrCode.split(',')[1], 'base64');
                doc.image(qrImage, 50, contentY, { width: 90, height: 90 });
                doc.fontSize(6).text('Code de vérification', 45, contentY + 95, { width: 100, align: 'center' });
            }
            
            doc.end();
            
        } catch (error) {
            console.error('Erreur PDF naissance:', error);
            reject(error);
        }
    });
}

// =====================================================
// GÉNÉRATION PDF : ACTE DE MARIAGE
// =====================================================
async function generateActeMariagePDF(acte, mentions = []) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 60, left: 50, right: 50 },
                bufferPages: true
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            let yPos = 50;
            
            // EN-TÊTE
            const headerX = 50;
            doc.fontSize(11).font('Helvetica-Bold').text(COMMUNE_CONFIG.pays, headerX, yPos, { width: 300, align: 'left' });
            yPos += 14;
            doc.fontSize(9).font('Helvetica-Oblique').text(COMMUNE_CONFIG.devise, headerX, yPos, { width: 300, align: 'left' });
            yPos += 18;
            doc.fontSize(10).font('Helvetica-Bold').text(COMMUNE_CONFIG.region, headerX, yPos, { width: 300, align: 'left' });
            yPos += 14;
            doc.fontSize(10).font('Helvetica').text(COMMUNE_CONFIG.commune, headerX, yPos, { width: 300, align: 'left' });
            yPos += 12;
            doc.fontSize(9).text('De', headerX, yPos, { width: 300, align: 'left' });
            yPos += 12;
            doc.fontSize(10).font('Helvetica-Bold').text(COMMUNE_CONFIG.ville, headerX, yPos, { width: 300, align: 'left' });
            
            // ENCADRÉ LÉGAL
            const legalBoxX = 380, legalBoxY = 50, legalBoxWidth = 165, legalBoxHeight = 45;
            doc.rect(legalBoxX, legalBoxY, legalBoxWidth, legalBoxHeight).lineWidth(1).stroke();
            doc.fontSize(6.5).font('Helvetica')
               .text(`Teny midina laharana faha-788-MJ/CAB Tamin'ny 29`, legalBoxX + 5, legalBoxY + 5, { width: legalBoxWidth - 10 })
               .text('Desambra 1961 Ny\'nataon\'ny Minisitra ny Fitsarana ', legalBoxX + 5, legalBoxY + 14, { width: legalBoxWidth - 10 })
               .text('sy ny Mpitahiry ny kasem-panjakana', legalBoxX + 5, legalBoxY + 23, { width: legalBoxWidth - 10 });
            
            yPos += 35;
            
            // TITRE
            doc.fontSize(12).font('Helvetica-Bold').text('KOPIA SORA-PIANKOHONANA', 50, yPos, { width: 495, align: 'center' });
            yPos += 35;
            
            // SECTION RD (MARIAGE)
            const rdX = 50, rdWidth = 170;
            let rdY = yPos;
            
            doc.fontSize(10).font('Helvetica-Bold').text(`N° ${acte.numero_acte || 'XXX'}`, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 25;
            doc.fontSize(9).font('Helvetica-Bold').text('FANAMBADIANA', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 20;
            
            doc.fontSize(8).font('Helvetica').text('_________________', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 18;

            const nomEpouxMaj = (acte.epoux_nom || '').toUpperCase();
            const prenomsEpoux = acte.epoux_prenoms || '';
            doc.fontSize(8).font('Helvetica-Bold').text(`${nomEpouxMaj} ${prenomsEpoux} `, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 20;
            doc.fontSize(8).font('Helvetica').text('Sy', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 16;
            
            const nomEpouseMaj = (acte.epouse_nom || '').toUpperCase();
            const prenomsEpouse = acte.epouse_prenoms || '';
            doc.fontSize(8).font('Helvetica-Bold').text(`${nomEpouseMaj} ${prenomsEpouse}`, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 25;
            doc.fontSize(8).font('Helvetica').text('_________________', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 18;
            
            const dateMariageCourte = formatDateCourteMalgache(acte.date_mariage);
            doc.text(dateMariageCourte, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 35;
            doc.fontSize(6.5).text('Tsy asiana hajia araka ny andininy', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 10;
            doc.text('faha-416 CG', rdX, rdY, { width: rdWidth, align: 'center' });
            
            // CONTENU PRINCIPAL (6 PARAGRAPHES)
            const contentX = rdX + rdWidth + 25;
            const contentWidth = 495 - contentX + 50;
            let contentY = yPos;
            
            const anneeMariage = acte.annee || new Date(acte.date_mariage).getFullYear();
            const dateMalagasyMariage = formatDateMalgache(acte.date_mariage);
            const heureMalagasyMariage = acte.heure_mariage ? convertirHeureMalgache(acte.heure_mariage) : '';
            
            // P1
            let p1 = `---- Nalaina tamin'ny bokim-piankohonana ao amin'ny Kaominina ${COMMUNE_CONFIG.ville} Renivohitra taona ${anneeMariage}, izao soratra manaraka izao-----------`;
            doc.fontSize(9).font('Helvetica').text(p1, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p1, { width: contentWidth, lineGap: 3 }) + 12;
            
            // P2
            let p2 = `----Androany ${dateMalagasyMariage}`;
            if (heureMalagasyMariage) p2 += `, tamin'ny ${heureMalagasyMariage}`;
            p2 += `, dia tonga teo anatrehanay ${acte.officier_etat_civil || 'Mpiandraikitra ny Sorampiankohonana'}, Mpiandraikitra ny sora-piankohonana amin'ny kaominini ${COMMUNE_CONFIG.ville} Renivohitra ----------------`;
            doc.text(p2, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p2, { width: contentWidth, lineGap: 3 }) + 12;
            
            // P3 - ÉPOUX
            let p3 = `---- ${nomEpouxMaj} ${prenomsEpoux}`;
            if (acte.epoux_profession) p3 += `, ${acte.epoux_profession}`;
            if (acte.epoux_date_naissance) p3 += ` Mizaka ny zom-pirenena Malagasy, teraka tamin'ny ${formatDateMalgache(acte.epoux_date_naissance)}`;
            if (acte.epoux_lieu_naissance) p3 += ` tao ${acte.epoux_lieu_naissance}`;
            if (acte.epoux_domicile) p3 += `, monina ao ${acte.epoux_domicile}`;
            if (acte.epoux_pere_nom || acte.epoux_mere_nom) {
                p3 += `, zanakan'i`;
                if (acte.epoux_pere_nom) {
                    p3 += ` ${(acte.epoux_pere_nom || '').toUpperCase()} ${acte.epoux_pere_prenoms || ''}`;
                    if (acte.epoux_pere_profession) p3 += `, ${acte.epoux_pere_profession}`;
                }
                if (acte.epoux_mere_nom) {
                    if (acte.epoux_pere_nom) p3 += ' sy ';
                    p3 += ` ${(acte.epoux_mere_nom || '').toUpperCase()} ${acte.epoux_mere_prenoms || ''}`;
                    if (acte.epoux_mere_profession) p3 += `, ${acte.epoux_mere_profession}`;
                }
            }
            p3 += '.----------------';
            doc.text(p3, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p3, { width: contentWidth, lineGap: 3 }) + 12;
            
            // P4 - ÉPOUSE
            let p4 = `----${nomEpouseMaj} ${prenomsEpouse}`;
            if (acte.epouse_profession) p4 += `, ${acte.epouse_profession}`;
            if (acte.epouse_date_naissance) p4 += ` Mizaka ny zom-pirenena Malagasy, teraka tamin'ny ${formatDateMalgache(acte.epouse_date_naissance)}`;
            if (acte.epouse_lieu_naissance) p4 += ` tao ${acte.epouse_lieu_naissance}`;
            if (acte.epouse_domicile) p4 += `, monina ao ${acte.epouse_domicile}`;
            if (acte.epouse_pere_nom || acte.epouse_mere_nom) {
                p4 += `, zanakan'i`;
                if (acte.epouse_pere_nom) {
                    p4 += ` ${(acte.epouse_pere_nom || '').toUpperCase()} ${acte.epouse_pere_prenoms || ''}`;
                    if (acte.epouse_pere_profession) p4 += `, ${acte.epouse_pere_profession}`;
                }
                if (acte.epouse_mere_nom) {
                    if (acte.epouse_pere_nom) p4 += ' sy ';
                    p4 += ` ${(acte.epouse_mere_nom || '').toUpperCase()} ${acte.epouse_mere_prenoms || ''}`;
                    if (acte.epouse_mere_profession) p4 += `, ${acte.epouse_mere_profession}`;
                }
            }
            p4 += '.----------------';
            doc.text(p4, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p4, { width: contentWidth, lineGap: 3 }) + 12;
            
            // P5
            let p5 = `----Samy milaza izy ireo fa mifanaiky ny hifampakatra, ka dia nambaranay tamin'ny anaran'ny lalàna fa mpivady izy ireo hatramin'izao. -----------------`;
            doc.text(p5, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p5, { width: contentWidth, lineGap: 3 }) + 12;
            
            // P6 - TÉMOINS
            let p6 = `----Ny fanoratana dia natao teo anatrehan'i `;
            if (acte.temoin1_nom) {
                p6 += ` ${(acte.temoin1_nom || '').toUpperCase()} ${acte.temoin1_prenoms || ''}`;
                if (acte.temoin1_profession) p6 += `, ${acte.temoin1_profession}`;
                if (acte.temoin1_date_naissance) p6 += `, teraka tamin'ny ${formatDateMalgache(acte.temoin1_date_naissance)}`;
                if (acte.temoin1_lieu_naissance) p6 += ` tao ${acte.temoin1_lieu_naissance}`;
                if (acte.temoin1_domicile) p6 += `, monina ao ${acte.temoin1_domicile}`;
            }
            if (acte.temoin2_nom) {
                if (acte.temoin1_nom) p6 += ', sy ';
                p6 += ` ${(acte.temoin2_nom || '').toUpperCase()} ${acte.temoin2_prenoms || ''}`;
                if (acte.temoin2_profession) p6 += `, ${acte.temoin2_profession}`;
                if (acte.temoin2_date_naissance) p6 += `, teraka tamin'ny ${formatDateMalgache(acte.temoin2_date_naissance)}`;
                if (acte.temoin2_lieu_naissance) p6 += ` tao ${acte.temoin2_lieu_naissance}`;
                if (acte.temoin2_domicile) p6 += `, monina ao ${acte.temoin2_domicile}`;
            }
            p6 += ', ka rehefa novakiana tamin\'ireo ity soratra ity, dia miara-manao sonia aminay izy mivady sy ireo vavolombelona.--------------------';
            doc.text(p6, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p6, { width: contentWidth, lineGap: 3 }) + 18;
            
            // SORATRA MANARAKA
            doc.fontSize(8).text('-'.repeat(30) + 'SORATRA MANARAKA' + '-'.repeat(30), 50, contentY, { width: 495, align: 'center' });
            contentY += 18;
            doc.fontSize(9).font('Helvetica-Bold').text('SORATRA ANTSISINY:', 50, contentY, { width: 495, align: 'center' });
            contentY += 14;
            
            if (mentions && mentions.length > 0) {
                mentions.forEach((mention) => {
                    doc.fontSize(8).font('Helvetica').text(mention.contenu, 50, contentY, { width: 495, align: 'center' });
                    contentY += 18;
                });
            } else {
                doc.fontSize(8).font('Helvetica-Oblique').text('Tsy misy.', 50, contentY, { width: 495, align: 'center' });
                contentY += 14;
            }
            
            contentY += 8;
            
            // PIED DE PAGE
            const dateSortieMalgache = formatDateMalgache(new Date());
            doc.fontSize(8).font('Helvetica')
               .text(`Kopia manotolo nadika tamin'ny boky androany ${dateSortieMalgache},`, 50, contentY, { width: 495, align: 'center' });
            contentY += 12;
            doc.text(`, tao Fianarantsoa.`, 50, contentY, { width: 495, align: 'center' });
            contentY += 25;
        
            doc.fontSize(9).font('Helvetica-Bold').text('NY MPIANDRAIKITRA NY SORA-PIANKOHONANA', 50, contentY, { width: 495, align: 'center' });
            contentY += 20;
            
            // QR CODE
            const qrCode = await generateQRCode(`https://etatcivil-fianarantsoa.mg/verify/${acte.numero_acte}`);
            if (qrCode) {
                const qrImage = Buffer.from(qrCode.split(',')[1], 'base64');
                doc.image(qrImage, 50, contentY, { width: 90, height: 90 });
            }
            
            doc.end();
            
        } catch (error) {
            console.error('Erreur PDF mariage:', error);
            reject(error);
        }
    });
}

// =====================================================
// GÉNÉRATION PDF : ACTE DE DÉCÈS - VERSION FINALE
// ✅ État matrimonial + Statuts parents + En-tête centré avec tirets
// =====================================================
async function generateActeDecesPDF(acte, mentions = []) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margins: { top: 50, bottom: 60, left: 50, right: 50 },
                bufferPages: true
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            let yPos = 50;
            
            // ═══════════════════════════════════════════════════════════
            // EN-TÊTE (FORMAT STANDARD - GAUCHE)
            // ═══════════════════════════════════════════════════════════
            const headerX = 50;
            
            doc.fontSize(11).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.pays, headerX, yPos, { width: 300, align: 'left' });
            yPos += 14;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(COMMUNE_CONFIG.devise, headerX, yPos, { width: 300, align: 'left' });
            yPos += 18;
            doc.fontSize(10).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.region, headerX, yPos, { width: 300, align: 'left' });
            yPos += 14;
            doc.fontSize(10).font('Helvetica')
               .text(COMMUNE_CONFIG.commune, headerX, yPos, { width: 300, align: 'left' });
            yPos += 12;
            doc.fontSize(9).text('De', headerX, yPos, { width: 300, align: 'left' });
            yPos += 12;
            doc.fontSize(10).font('Helvetica-Bold')
               .text(COMMUNE_CONFIG.ville, headerX, yPos, { width: 300, align: 'left' });
            
            // ENCADRÉ LÉGAL (DROITE)
            const legalBoxX = 380, legalBoxY = 50, legalBoxWidth = 165, legalBoxHeight = 45;
            doc.rect(legalBoxX, legalBoxY, legalBoxWidth, legalBoxHeight).lineWidth(1).stroke();
            doc.fontSize(6.5).font('Helvetica')
               .text(`Teny midina laharana faha-788-MJ/CAB Tamin'ny 29`, legalBoxX + 5, legalBoxY + 5, { width: legalBoxWidth - 10 })
               .text(`Desambra 1961 Nataon'ny Minisitra ny Fitsarana sy `, legalBoxX + 5, legalBoxY + 14, { width: legalBoxWidth - 10 })
               .text('ny Mpitahiry ny kasem-panjakana', legalBoxX + 5, legalBoxY + 23, { width: legalBoxWidth - 10 });
            
            yPos += 35;
            
            // TITRE
            doc.fontSize(12).font('Helvetica-Bold')
               .text("KOPIAN'NY SORA-PIANKOHONANA", 50, yPos, { width: 495, align: 'center' });
            yPos += 35;
            
            // ═══════════════════════════════════════════════════════════
            // SECTION RD (GAUCHE)
            // ═══════════════════════════════════════════════════════════
            const rdX = 50, rdWidth = 170;
            let rdY = yPos;
            
            doc.fontSize(8).font('Helvetica-Bold')
               .text('RD', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 20;
            
            doc.fontSize(10).font('Helvetica-Bold')
               .text(`N° ${acte.numero_acte || 'XXX'}`, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 25;
            
            doc.fontSize(8).font('Helvetica')
               .text('Tamin\'ny', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 14;
            
            let dateDeclFormatCourt = '';
            const dateDoc = acte.date_declaration || new Date();
            if (dateDoc) {
                const dateObj = new Date(dateDoc);
                const jour = String(dateObj.getDate()).padStart(2, '0');
                const mois = String(dateObj.getMonth() + 1).padStart(2, '0');
                const annee = dateObj.getFullYear();
                dateDeclFormatCourt = `${jour}/${mois}/${annee}`;
            }
            doc.text(dateDeclFormatCourt, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 20;
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('FAHAFATESANA', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 18;
            
            doc.fontSize(8).font('Helvetica')
               .text('_________________', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 18;
            
            const prenomsDefunt = acte.prenoms || '';
            const nomDefuntMaj = (acte.nom || '').toUpperCase();
            const nomCompletDefunt = ` ${nomDefuntMaj} ${prenomsDefunt}`.trim();
            
            doc.fontSize(8).font('Helvetica-Bold')
               .text(nomCompletDefunt, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 25;
            
            doc.fontSize(8).font('Helvetica')
               .text('_________________', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 18;
            
            const dateDecesCourte = formatDateCourteMalgache(acte.date_deces);
            doc.text(dateDecesCourte, rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 35;
            
            doc.fontSize(6.5).text('Tsy asiana hajia araka ny', rdX, rdY, { width: rdWidth, align: 'center' });
            rdY += 10;
            doc.text('andininy faha-416 CG', rdX, rdY, { width: rdWidth, align: 'center' });
            
            // ═══════════════════════════════════════════════════════════
            // CONTENU PRINCIPAL (3 PARAGRAPHES)
            // ═══════════════════════════════════════════════════════════
            const contentX = rdX + rdWidth + 25;
            const contentWidth = 495 - contentX + 50;
            let contentY = yPos;
            
            const anneeDeces = acte.annee || new Date(acte.date_deces).getFullYear();
            const dateDecesMalgache = formatDateMalgache(acte.date_deces);
            const heureDecesMalgache = acte.heure_deces ? convertirHeureMalgache(acte.heure_deces) : '';
            const lieuDeces = acte.lieu_deces || 'Fianarantsoa';
            const sexe = acte.sexe === 'M' ? 'lehilahy' : 'vehivavy';
            
            // ═══════════════════════════════════════════════════════════
            // PARAGRAPHE 1 - INTRODUCTION
            // ═══════════════════════════════════════════════════════════
            let p1 = `---- Nalaina tamin'ny bokim-piankohonana ao amin'ny Kaominina ${COMMUNE_CONFIG.ville} Renivohitra taona ${anneeDeces}, izao soratra manaraka izao`;
            
            doc.fontSize(9).font('Helvetica')
               .text(p1, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p1, { width: contentWidth, lineGap: 3 }) + 12;
            
            // ═══════════════════════════════════════════════════════════
            // PARAGRAPHE 2 - DÉCÈS + DÉFUNT + PARENTS
            // ✅ AVEC ÉTAT MATRIMONIAL + STATUTS PARENTS
            // ═══════════════════════════════════════════════════════════
            let p2 = `-----Tamin'ny ${dateDecesMalgache}`;
            if (heureDecesMalgache) {
                p2 += `, ${heureDecesMalgache}`;
            }
            p2 += ` no maty tao ${lieuDeces}: ${nomCompletDefunt}, ${sexe}`;
            
            // ✅ ÉTAT MATRIMONIAL DU DÉFUNT
            if (acte.etat_matrimonial) {
                const etatMalgache = {
                    'celibataire': 'tsy manambady',
                    'marie': 'manambady',
                    'divorce': 'nisara-panambadiana',
                    'veuf': 'maty vady'
                };
                p2 += `, ${etatMalgache[acte.etat_matrimonial] || acte.etat_matrimonial}`;
            }
            
            // Profession
            if (acte.profession) {
                p2 += `, ${acte.profession}`;
            }
            
            // Date + lieu naissance défunt
            if (acte.date_naissance) {
                p2 += `, teraka tamin'ny ${formatDateMalgache(acte.date_naissance)}`;
            }
            if (acte.lieu_naissance) {
                p2 += ` tao ${acte.lieu_naissance}`;
            }
            
            // Domicile
            if (acte.domicile) {
                p2 += `, monina tao ${acte.domicile}`;
            }
            
            // ✅ PARENTS AVEC STATUTS (vivant/décédé)
            if (acte.prenoms_pere || acte.nom_pere || acte.prenoms_mere || acte.nom_mere) {
                p2 += `, zanak'i `;
                
                // Père
                if (acte.prenoms_pere || acte.nom_pere) {
                    p2 += `  ${(acte.nom_pere || '').toUpperCase()} ${acte.prenoms_pere || ''}`.trim();
                    
                    // ✅ STATUT PÈRE
                    if (acte.pere_statut === 'decede') {
                        p2 += ' izay efa maty';
                    } else if (acte.pere_statut === 'vivant') {
                        p2 += ' izay mbola velona ';
                    }
                }
                
                // Mère
                if (acte.prenoms_mere || acte.nom_mere) {
                    if (acte.prenoms_pere || acte.nom_pere) p2 += ' sy ';
                    p2 += ` ${(acte.nom_mere || '').toUpperCase()} ${acte.prenoms_mere || ''}`.trim();
                    
                    // ✅ STATUT MÈRE
                    if (acte.mere_statut === 'decede') {
                        p2 += ' izay efa maty ';
                    } else if (acte.mere_statut === 'vivant') {
                        p2 += ' izay mbola velona ';
                    }
                }
            }
            
            p2 += '.----------';
            
            doc.text(p2, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p2, { width: contentWidth, lineGap: 3 }) + 12;
            
            // ═══════════════════════════════════════════════════════════
            // PARAGRAPHE 3 - DÉCLARATION + DÉCLARANT + OFFICIER
            // ═══════════════════════════════════════════════════════════
            const dateDeclaration = acte.date_declaration || acte.date_deces;
            const heureDeclaration = acte.heure_declaration ? convertirHeureMalgache(acte.heure_declaration) : '';
            
            let p3 = `-----Nosoratana androany ${formatDateMalgache(dateDeclaration)}`;
            if (heureDeclaration) {
                p3 += `, ${heureDeclaration}`;
            }
            
            p3 += ' araka ny fanambarana nataon\'i ';
            
            // DÉCLARANT COMPLET
            if (acte.declarant_prenoms || acte.declarant_nom) {
                p3 += `${(acte.declarant_nom || '').toUpperCase()} ${acte.declarant_prenoms || ''}`.trim();
                
                if (acte.declarant_lieu_naissance) {
                    p3 += `, teraka tao ${acte.declarant_lieu_naissance}`;
                }
                
                if (acte.declarant_date_naissance) {
                    p3 += ` tamin'ny ${formatDateMalgache(acte.declarant_date_naissance)}`;
                }
                
                if (acte.declarant_domicile) {
                    p3 += `, monina ao ${acte.declarant_domicile}`;
                }
                
                p3 += ', ';
            }
            
            // OFFICIER
            const officierNomComplet = acte.officier_etat_civil || 'Ben\'ny Tanàna Mpiandraikitra ny sorampiankohonana';
            p3 += `izay miara manao Sonia aminay ${officierNomComplet}, Ben'ny Tanàna Mpiandraikitra ny soram-piankohonana ao amin'ny Kaominin'i ${COMMUNE_CONFIG.ville} Renivohitra, rehefa novakiana taminy ity soratra ity.-------------------------`;
            
            doc.text(p3, contentX, contentY, { width: contentWidth, align: 'justify', lineGap: 3 });
            contentY += doc.heightOfString(p3, { width: contentWidth, lineGap: 3 }) + 18;
            
            // ═══════════════════════════════════════════════════════════
            // SORATRA MANARAKA
            // ═══════════════════════════════════════════════════════════
            doc.fontSize(8)
               .text('-'.repeat(30) + 'SORATRA MANARAKA' + '-'.repeat(30), 50, contentY, { width: 495, align: 'center' });
            contentY += 18;
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('SORATRA ANTSISINY:', 50, contentY, { width: 495, align: 'center' });
            contentY += 14;
            
            if (mentions && mentions.length > 0) {
                mentions.forEach((mention) => {
                    doc.fontSize(8).font('Helvetica')
                       .text(mention.contenu, 50, contentY, { width: 495, align: 'center' });
                    contentY += 18;
                });
            } else {
                doc.fontSize(8).font('Helvetica-Oblique')
                   .text('Tsy misy.', 50, contentY, { width: 495, align: 'center' });
                contentY += 14;
            }
            
            contentY += 20;
            
            // ═══════════════════════════════════════════════════════════
            // PIED DE PAGE
            // ═══════════════════════════════════════════════════════════
            const dateSortieMalgache = formatDateMalgache(new Date());
            doc.fontSize(8).font('Helvetica')
               .text(`Kopia manotolo nadika tamin'ny boky androany ${dateSortieMalgache} tao ${COMMUNE_CONFIG.ville}.`, 50, contentY, { width: 495, align: 'center' });
            contentY += 25;
            
            doc.fontSize(9).font('Helvetica-Bold')
               .text('NY MPIANDRAIKITRA NY SORA-PIANKOHONANA', 50, contentY, { width: 495, align: 'center' });
            contentY += 40;
            
            // ═══════════════════════════════════════════════════════════
            // QR CODE (BAS GAUCHE)
            // ═══════════════════════════════════════════════════════════
            const qrCode = await generateQRCode(`https://etatcivil-fianarantsoa.mg/verify/${acte.numero_acte}`);
            if (qrCode) {
                const qrImage = Buffer.from(qrCode.split(',')[1], 'base64');
                doc.image(qrImage, 50, contentY, { width: 90, height: 90 });
                doc.fontSize(6).text('Code de vérification', 45, contentY + 95, { width: 100, align: 'center' });
            }
            
            doc.end();
            
        } catch (error) {
            console.error('Erreur PDF décès:', error);
            reject(error);
        }
    });
}
// =====================================================
// EXPORT
// =====================================================
module.exports = {
    generateActeNaissancePDF,
    generateActeMariagePDF,
    generateActeDecesPDF,  // ✅ VERSION CORRIGÉE
    generateQRCode
};