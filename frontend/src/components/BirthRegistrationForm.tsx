import React, { useState, useEffect, CSSProperties } from 'react';
import { getNextNumberNaissance, createActeNaissance } from '../utils/api';

// =====================================================
// I. STYLES ET THÈME
// =====================================================

const THEME = {
  primary: '#48BB78', // Vert pour la naissance
  primaryDark: '#38A169',
  secondary: '#3182CE', // Bleu pour la navigation
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  text: '#2D3748',
  subtleText: '#718096',
  border: '#E2E8F0',
  error: '#E53E3E',
  success: '#38A169',
  shadow: '0 4px 6px rgba(0,0,0,0.07)',
};

// Styles communs
const STYLES: { [key: string]: CSSProperties } = {
    formContainer: {
        maxWidth: '1000px',
        margin: '30px auto',
        padding: '0',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
    },
    card: {
        background: THEME.cardBg,
        padding: '30px',
        borderRadius: '12px',
        boxShadow: THEME.shadow,
    },
    header: {
        background: THEME.primary,
        color: 'white',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: '0',
        fontSize: '2em',
        fontWeight: '700',
    },
    subTitle: {
        margin: '5px 0 0 0',
        opacity: '0.9',
    },
    sectionTitle: {
        color: THEME.text,
        marginBottom: '20px',
        fontSize: '1.5em',
        borderBottom: `2px solid ${THEME.border}`,
        paddingBottom: '10px',
        marginTop: '30px',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    buttonBase: {
        padding: '12px 25px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s, box-shadow 0.2s',
        border: 'none',
    },
};

// =====================================================
// II. INTERFACES ET TYPAGE
// =====================================================

interface BirthForm {
    nom: string; prenoms: string; date_naissance: string; heure_naissance: string;
    lieu_naissance: string; sexe: string;

    nom_pere: string; prenoms_pere: string; age_pere: number | string; profession_pere: string;
    domicile_pere: string; pere_date_naissance: string; pere_lieu_naissance: string;

    nom_mere: string; prenoms_mere: string; age_mere: number | string; profession_mere: string;
    domicile_mere: string; mere_date_naissance: string; mere_lieu_naissance: string;

    temoin1_nom: string; temoin1_prenoms: string; temoin1_age: number | string; temoin1_profession: string;
    temoin2_nom: string; temoin2_prenoms: string; temoin2_age: number | string; temoin2_profession: string;

    declarant_nom: string; declarant_prenoms: string; declarant_qualite: string;
    declarant_profession: string; declarant_date_naissance: string; declarant_lieu_naissance: string;
    declarant_domicile: string;

    date_declaration: string; heure_declaration: string; officier_etat_civil: string;
}

// =====================================================
// III. COMPOSANTS RÉUTILISABLES
// =====================================================

// Composant pour un champ de formulaire
const FormInput: React.FC<React.ComponentProps<'input'> & { label: string, smallText?: string }> = ({ label, smallText, ...props }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: THEME.text }}>
            {label} {props.required && <span style={{ color: THEME.error }}>*</span>}
        </label>
        <input
            {...props}
            style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
            }}
        />
        {smallText && <small style={{ color: THEME.subtleText, fontSize: '0.85em', display: 'block', marginTop: '5px' }}>{smallText}</small>}
    </div>
);

// Composant pour un champ de sélection
const FormSelect: React.FC<React.ComponentProps<'select'> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: THEME.text }}>
            {label} {props.required && <span style={{ color: THEME.error }}>*</span>}
        </label>
        <select
            {...props}
            style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: 'white',
                boxSizing: 'border-box',
            }}
        >
            {children}
        </select>
    </div>
);

// Composant de résumé pour l'étape de validation
const SummaryItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div style={{ marginBottom: '10px', padding: '8px 0', borderBottom: `1px dotted ${THEME.border}` }}>
        <strong style={{ color: THEME.secondary, minWidth: '150px', display: 'inline-block' }}>{label}:</strong>
        <span style={{ color: THEME.text }}>{value}</span>
    </div>
);


// =====================================================
// IV. COMPOSANT PRINCIPAL
// =====================================================

const BirthRegistrationForm = ({ onBack }: { onBack?: () => void }) => {
    const defaultFormData: BirthForm = {
        nom: '', prenoms: '', date_naissance: '', heure_naissance: '',
        lieu_naissance: '', sexe: '',

        nom_pere: '', prenoms_pere: '', age_pere: '', profession_pere: '',
        domicile_pere: '', pere_date_naissance: '', pere_lieu_naissance: '',

        nom_mere: '', prenoms_mere: '', age_mere: '', profession_mere: '',
        domicile_mere: '', mere_date_naissance: '', mere_lieu_naissance: '',

        temoin1_nom: '', temoin1_prenoms: '', temoin1_age: '', temoin1_profession: '',
        temoin2_nom: '', temoin2_prenoms: '', temoin2_age: '', temoin2_profession: '',

        declarant_nom: '', declarant_prenoms: '', declarant_qualite: '',
        declarant_profession: '', declarant_date_naissance: '', declarant_lieu_naissance: '',
        declarant_domicile: '',

        date_declaration: new Date().toISOString().split('T')[0],
        heure_declaration: new Date().toTimeString().split(' ')[0].substring(0, 5), // Heure actuelle
        officier_etat_civil: 'Nom Officier par défaut' // Remplacer par une valeur réelle si possible
    };

    const [formData, setFormData] = useState<BirthForm>(defaultFormData);
    const [nextNumber, setNextNumber] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [currentStep, setCurrentStep] = useState(1);

    // ✅ Fonction pour récupérer le prochain numéro d'acte (avec authentification)
    useEffect(() => {
        const fetchNextNumber = async () => {
            try {
                const data = await getNextNumberNaissance();
                setNextNumber(data.numero_acte);
            } catch (error: any) {
                console.error('Erreur récupération numéro:', error);
                setMessage(`❌ Erreur: ${error.message}`);
            }
        };
        fetchNextNumber();
    }, []);

    // Gestion des changements d'entrée
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ Soumission du formulaire (avec authentification)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep !== 4) return; // Empêche la soumission si ce n'est pas l'étape finale

        setLoading(true);
        setMessage('');

        try {
            // ✅ Préparer les données sans user_id (géré par le token)
            const payload = {
                ...formData,
                numero_acte: nextNumber
                // ✅ user_id supprimé - récupéré depuis req.user.id côté backend
            };
            
            // ✅ Utiliser la fonction API avec token JWT
            await createActeNaissance(payload);

            setMessage(`✅ Acte de naissance ${nextNumber} enregistré avec succès !`);
            setFormData(defaultFormData); // Réinitialiser
            
            // ✅ Récupérer le nouveau numéro pour la prochaine saisie
            const newNumber = await getNextNumberNaissance();
            setNextNumber(newNumber.numero_acte);
            
            setCurrentStep(1);
        } catch (error: any) {
            console.error('Erreur:', error);
            
            // ✅ Gestion des erreurs spécifiques
            if (error.message.includes('401') || error.message.includes('token')) {
                setMessage('❌ Session expirée. Veuillez vous reconnecter.');
            } else {
                setMessage(`❌ Erreur : ${error.message || 'Impossible d\'enregistrer l\'acte'}`);
            }
        } finally {
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Navigation par étapes
    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // =====================================================
    // V. RENDU DU FORMULAIRE
    // =====================================================

    return (
        <div style={STYLES.formContainer}>
            <div style={STYLES.card}>
                
                {/* En-tête de la carte */}
                <div style={STYLES.header}>
                    <div style={{ textAlign: 'left' }}>
                        <h1 style={STYLES.title}>
                            👶 {currentStep === 4 ? 'Validation et Soumission' : "Nouvel Acte de Naissance"}
                        </h1>
                        <p style={STYLES.subTitle}>
                            Commune Urbaine de Fianarantsoa
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 5px 0', opacity: '0.8', fontSize: '0.9em' }}>
                            Acte N°: <strong>{nextNumber || 'Chargement...'}</strong>
                        </p>
                        {onBack && (
                            <button onClick={onBack} style={{
                                ...STYLES.buttonBase,
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '8px 16px',
                            }}>
                                ← Retour au Tableau de Bord
                            </button>
                        )}
                    </div>
                </div>

                {/* Message de notification */}
                {message && (
                    <div style={{
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        backgroundColor: message.startsWith('✅') ? `${THEME.success}1A` : `${THEME.error}1A`,
                        color: message.startsWith('✅') ? THEME.success : THEME.error,
                        border: `1px solid ${message.startsWith('✅') ? THEME.success : THEME.error}`,
                        fontWeight: '600'
                    }}>
                        {message}
                    </div>
                )}

                {/* Indicateur d'étapes professionnel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: `2px solid ${THEME.border}` }}>
                    {['Enfant', 'Parents', 'Témoins & Déclarant', 'Validation'].map((step, index) => {
                        const stepNum = index + 1;
                        const isCurrent = currentStep === stepNum;
                        const isCompleted = currentStep > stepNum;
                        
                        return (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    padding: '10px',
                                    position: 'relative',
                                    cursor: isCompleted ? 'pointer' : 'default',
                                    color: isCurrent ? THEME.secondary : isCompleted ? THEME.text : THEME.subtleText,
                                    fontWeight: '600',
                                    borderBottom: isCurrent ? `4px solid ${THEME.secondary}` : '4px solid transparent',
                                    transition: 'border-color 0.3s, color 0.3s',
                                    marginBottom: '-2px', // Pour aligner la bordure
                                }}
                                onClick={() => isCompleted ? setCurrentStep(stepNum) : null}
                            >
                                <span style={{ marginRight: '5px' }}>
                                    {isCompleted ? '✔️' : isCurrent ? stepNum : stepNum}
                                </span> 
                                <span style={{ display: 'inline-block', transition: 'opacity 0.2s' }}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ÉTAPE 1: INFORMATIONS DE L'ENFANT */}
                    {currentStep === 1 && (
                        <div>
                            <h3 style={STYLES.sectionTitle}>📝 Informations de l'enfant</h3>
                            
                            <div style={STYLES.gridContainer}>
                                <FormInput 
                                    label="Nom de famille" type="text" name="nom" value={formData.nom} 
                                    onChange={handleInputChange} required placeholder="Nom de famille"
                                />
                                <FormInput 
                                    label="Prénoms" type="text" name="prenoms" value={formData.prenoms} 
                                    onChange={handleInputChange} required placeholder="Prénoms de l'enfant"
                                />
                            </div>
                            
                            <div style={STYLES.gridContainer}>
                                <FormInput 
                                    label="Date de naissance" type="date" name="date_naissance" 
                                    value={formData.date_naissance} onChange={handleInputChange} required 
                                />
                                <FormInput 
                                    label="Heure de naissance" type="time" name="heure_naissance" 
                                    value={formData.heure_naissance} onChange={handleInputChange} 
                                    smallText="Sera converti en heure malgache"
                                />
                                <FormSelect
                                    label="Sexe" name="sexe" value={formData.sexe} 
                                    onChange={handleInputChange} required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </FormSelect>
                            </div>

                            <FormInput 
                                label="Lieu de naissance" type="text" name="lieu_naissance" 
                                value={formData.lieu_naissance} onChange={handleInputChange} required 
                                placeholder="Ville, District, Province"
                            />
                        </div>
                    )}

                    {/* ÉTAPE 2: PARENTS */}
                    {currentStep === 2 && (
                        <div>
                            <h3 style={STYLES.sectionTitle}>👨‍👩‍👧 Informations des parents</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* ============= PÈRE ============= */}
                                <div style={{ border: `1px solid ${THEME.secondary}`, padding: '20px', borderRadius: '8px', background: '#f7fafc' }}>
                                    <h4 style={{ color: THEME.secondary, marginBottom: '20px', fontSize: '1.2em', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px' }}>👨 Père</h4>
                                    
                                    <FormInput label="Nom" type="text" name="nom_pere" value={formData.nom_pere} onChange={handleInputChange} placeholder="Nom" />
                                    <FormInput label="Prénoms" type="text" name="prenoms_pere" value={formData.prenoms_pere} onChange={handleInputChange} placeholder="Prénoms" />
                                    
                                    <div style={STYLES.gridContainer}>
                                        <FormInput label="Âge" type="number" name="age_pere" value={formData.age_pere} onChange={handleInputChange} placeholder="Âge" />
                                        <FormInput label="Date naissance" type="date" name="pere_date_naissance" value={formData.pere_date_naissance} onChange={handleInputChange} />
                                    </div>
                                    <FormInput label="Lieu de naissance" type="text" name="pere_lieu_naissance" value={formData.pere_lieu_naissance} onChange={handleInputChange} placeholder="Lieu de naissance complet" />
                                    <FormInput label="Profession" type="text" name="profession_pere" value={formData.profession_pere} onChange={handleInputChange} placeholder="Profession" />
                                    <div style={{ marginTop: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: THEME.text }}>Domicile</label>
                                        <textarea
                                            name="domicile_pere" value={formData.domicile_pere} onChange={handleInputChange} rows={2}
                                            placeholder="Adresse complète"
                                            style={{ width: '100%', padding: '8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>

                                {/* ============= MÈRE ============= */}
                                <div style={{ border: `1px solid ${THEME.primary}`, padding: '20px', borderRadius: '8px', background: '#f0fff4' }}>
                                    <h4 style={{ color: THEME.primary, marginBottom: '20px', fontSize: '1.2em', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px' }}>👩 Mère</h4>
                                    
                                    <FormInput label="Nom" type="text" name="nom_mere" value={formData.nom_mere} onChange={handleInputChange} placeholder="Nom" />
                                    <FormInput label="Prénoms" type="text" name="prenoms_mere" value={formData.prenoms_mere} onChange={handleInputChange} placeholder="Prénoms" />
                                    
                                    <div style={STYLES.gridContainer}>
                                        <FormInput label="Âge" type="number" name="age_mere" value={formData.age_mere} onChange={handleInputChange} placeholder="Âge" />
                                        <FormInput label="Date naissance" type="date" name="mere_date_naissance" value={formData.mere_date_naissance} onChange={handleInputChange} />
                                    </div>
                                    <FormInput label="Lieu de naissance" type="text" name="mere_lieu_naissance" value={formData.mere_lieu_naissance} onChange={handleInputChange} placeholder="Lieu de naissance complet" />
                                    <FormInput label="Profession" type="text" name="profession_mere" value={formData.profession_mere} onChange={handleInputChange} placeholder="Profession" />
                                    <div style={{ marginTop: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: THEME.text }}>Domicile</label>
                                        <textarea
                                            name="domicile_mere" value={formData.domicile_mere} onChange={handleInputChange} rows={2}
                                            placeholder="Adresse complète"
                                            style={{ width: '100%', padding: '8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3: TÉMOINS ET DÉCLARANT */}
                    {currentStep === 3 && (
                        <div>
                            <h3 style={STYLES.sectionTitle}>👥 Témoins et Déclarant</h3>
                            
                            {/* TÉMOINS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                {/* Témoin 1 */}
                                <div style={{ border: `1px solid ${THEME.border}`, padding: '20px', borderRadius: '8px', background: THEME.cardBg }}>
                                    <h4 style={{ color: THEME.primary, marginBottom: '15px' }}>Témoin 1</h4>
                                    <FormInput label="Nom" type="text" name="temoin1_nom" value={formData.temoin1_nom} onChange={handleInputChange} />
                                    <FormInput label="Prénoms" type="text" name="temoin1_prenoms" value={formData.temoin1_prenoms} onChange={handleInputChange} />
                                    <div style={STYLES.gridContainer}>
                                        <FormInput label="Âge" type="number" name="temoin1_age" value={formData.temoin1_age} onChange={handleInputChange} />
                                        <FormInput label="Profession" type="text" name="temoin1_profession" value={formData.temoin1_profession} onChange={handleInputChange} />
                                    </div>
                                </div>
                                
                                {/* Témoin 2 */}
                                <div style={{ border: `1px solid ${THEME.border}`, padding: '20px', borderRadius: '8px', background: THEME.cardBg }}>
                                    <h4 style={{ color: THEME.primary, marginBottom: '15px' }}>Témoin 2</h4>
                                    <FormInput label="Nom" type="text" name="temoin2_nom" value={formData.temoin2_nom} onChange={handleInputChange} />
                                    <FormInput label="Prénoms" type="text" name="temoin2_prenoms" value={formData.temoin2_prenoms} onChange={handleInputChange} />
                                    <div style={STYLES.gridContainer}>
                                        <FormInput label="Âge" type="number" name="temoin2_age" value={formData.temoin2_age} onChange={handleInputChange} />
                                        <FormInput label="Profession" type="text" name="temoin2_profession" value={formData.temoin2_profession} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            {/* DÉCLARANT */}
                            <div style={{ border: `2px solid ${THEME.secondary}`, padding: '25px', borderRadius: '8px', background: '#e6f0ff' }}>
                                <h4 style={{ color: THEME.secondary, marginBottom: '20px', fontSize: '1.3em', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px' }}>
                                    📋 Déclarant (Informations Complètes)
                                </h4>
                                
                                <div style={STYLES.gridContainer}>
                                    <FormInput label="Nom" type="text" name="declarant_nom" value={formData.declarant_nom} onChange={handleInputChange} required />
                                    <FormInput label="Prénoms" type="text" name="declarant_prenoms" value={formData.declarant_prenoms} onChange={handleInputChange} required />
                                    <FormSelect label="Qualité" name="declarant_qualite" value={formData.declarant_qualite} onChange={handleInputChange} required>
                                        <option value="">Sélectionner</option>
                                        <option value="Père">Père</option>
                                        <option value="Mère">Mère</option>
                                        <option value="Médecin">Médecin</option>
                                        <option value="Autre">Autre</option>
                                    </FormSelect>
                                </div>
                                
                                <FormInput label="Profession" type="text" name="declarant_profession" value={formData.declarant_profession} onChange={handleInputChange} placeholder="Profession du déclarant" />
                                
                                <div style={STYLES.gridContainer}>
                                    <FormInput label="Date naissance" type="date" name="declarant_date_naissance" value={formData.declarant_date_naissance} onChange={handleInputChange} />
                                    <FormInput label="Lieu de naissance" type="text" name="declarant_lieu_naissance" value={formData.declarant_lieu_naissance} onChange={handleInputChange} placeholder="Lieu de naissance" />
                                </div>
                                
                                <div style={{ marginTop: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: THEME.text }}>Domicile</label>
                                    <textarea
                                        name="declarant_domicile" value={formData.declarant_domicile} onChange={handleInputChange} rows={2}
                                        placeholder="Adresse complète du déclarant"
                                        style={{ width: '100%', padding: '8px', border: `1px solid ${THEME.border}`, borderRadius: '4px', resize: 'vertical' }}
                                        required
                                    />
                                </div>
                                
                                <h4 style={{ ...STYLES.sectionTitle, marginTop: '20px' }}>Métadonnées de la Déclaration</h4>
                                <div style={STYLES.gridContainer}>
                                    <FormInput 
                                        label="Date de la Déclaration" type="date" name="date_declaration" 
                                        value={formData.date_declaration} onChange={handleInputChange} required 
                                    />
                                    <FormInput 
                                        label="Heure de la Déclaration" type="time" name="heure_declaration" 
                                        value={formData.heure_declaration} onChange={handleInputChange} required 
                                    />
                                    <FormInput 
                                        label="Officier d'État Civil" type="text" name="officier_etat_civil" 
                                        value={formData.officier_etat_civil} onChange={handleInputChange} required 
                                        placeholder="Nom de l'Officier"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 4: RÉCAPITULATIF ET VALIDATION */}
                    {currentStep === 4 && (
                        <div>
                            <h3 style={STYLES.sectionTitle}>✨ Récapitulatif et Validation (Acte N° {nextNumber})</h3>
                            
                            <div style={{ background: '#f7fafc', padding: '25px', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                                
                                {/* ENFANT */}
                                <h4 style={{ color: THEME.primaryDark, marginTop: '0', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '5px' }}>👶 Enfant</h4>
                                <div style={STYLES.gridContainer}>
                                    <div>
                                        <SummaryItem label="Nom(s)" value={`${formData.nom} ${formData.prenoms}`} />
                                        <SummaryItem label="Sexe" value={formData.sexe === 'M' ? 'Masculin' : formData.sexe === 'F' ? 'Féminin' : 'N/A'} />
                                    </div>
                                    <div>
                                        <SummaryItem label="Né(e) le" value={formData.date_naissance} />
                                        <SummaryItem label="À" value={`${formData.heure_naissance} à ${formData.lieu_naissance}`} />
                                    </div>
                                </div>
                                
                                {/* PARENTS */}
                                <h4 style={{ color: THEME.secondary, borderBottom: `1px solid ${THEME.border}`, paddingBottom: '5px', marginTop: '15px' }}>👨‍👩‍👧 Parents</h4>
                                <div style={STYLES.gridContainer}>
                                    <div>
                                        <SummaryItem label="Père" value={`${formData.nom_pere} ${formData.prenoms_pere}`} />
                                        <SummaryItem label="Mère" value={`${formData.nom_mere} ${formData.prenoms_mere}`} />
                                    </div>
                                    <div>
                                        <SummaryItem label="Prof. Père" value={formData.profession_pere} />
                                        <SummaryItem label="Prof. Mère" value={formData.profession_mere} />
                                    </div>
                                </div>

                                {/* DÉCLARANT */}
                                <h4 style={{ color: THEME.secondary, borderBottom: `1px solid ${THEME.border}`, paddingBottom: '5px', marginTop: '15px' }}>📋 Déclarant</h4>
                                <div style={STYLES.gridContainer}>
                                    <div>
                                        <SummaryItem label="Nom & Prénoms" value={`${formData.declarant_nom} ${formData.declarant_prenoms}`} />
                                        <SummaryItem label="Qualité" value={formData.declarant_qualite} />
                                    </div>
                                    <div>
                                        <SummaryItem label="Date Déclaration" value={`${formData.date_declaration} à ${formData.heure_declaration}`} />
                                        <SummaryItem label="Officier" value={formData.officier_etat_civil} />
                                    </div>
                                </div>

                                <blockquote style={{
                                    marginTop: '25px',
                                    padding: '15px',
                                    borderLeft: `5px solid ${THEME.error}`,
                                    backgroundColor: '#fff7f7',
                                    color: THEME.error,
                                    fontSize: '0.95em'
                                }}>
                                    **ATTENTION :** Veuillez vérifier toutes les informations. Une fois soumis, l'acte est enregistré dans le registre.
                                </blockquote>
                            </div>
                        </div>
                    )}

                    {/* ================================================= */}
                    {/* BOUTONS DE NAVIGATION */}
                    {/* ================================================= */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                style={{
                                    ...STYLES.buttonBase,
                                    background: '#718096',
                                    color: 'white',
                                    opacity: loading ? 0.6 : 1,
                                }}
                                disabled={loading}
                            >
                                ← Étape Précédente
                            </button>
                        )}
                        
                        {currentStep < 4 && (
                            <button
                                type="button"
                                onClick={nextStep}
                                style={{
                                    ...STYLES.buttonBase,
                                    background: THEME.secondary,
                                    color: 'white',
                                    marginLeft: currentStep === 1 ? 'auto' : '0', // Aligner à droite si c'est la première étape
                                }}
                            >
                                Étape Suivante →
                            </button>
                        )}

                        {currentStep === 4 && (
                            <button
                                type="submit"
                                style={{
                                    ...STYLES.buttonBase,
                                    background: THEME.primaryDark,
                                    color: 'white',
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Enregistrement...' : '✅ ENREGISTRER L\'ACTE'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BirthRegistrationForm;