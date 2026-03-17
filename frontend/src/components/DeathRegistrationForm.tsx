import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // ✅ AJOUTÉ pour logout sur 401
import { getNextNumberDeces, createActeDeces } from '../utils/api'; // ✅ IMPORTS API.TS

interface DeathForm {
    nom: string; prenoms: string; date_naissance: string; lieu_naissance: string;
    age: number | string; sexe: string; profession: string; domicile: string;
    etat_matrimonial: 'celibataire' | 'marie' | 'divorce' | 'veuf' | '';
    defunt_fokontany: string;
    nom_pere: string; prenoms_pere: string; pere_date_naissance: string;
    pere_lieu_naissance: string; pere_profession: string; pere_statut: 'vivant' | 'decede' | '';
    nom_mere: string; prenoms_mere: string; mere_date_naissance: string;
    mere_lieu_naissance: string; mere_profession: string; mere_statut: 'vivant' | 'decede' | '';
    parents_adresse: string; fokontany: string;
    date_deces: string; heure_deces: string; lieu_deces: string; cause_deces: string;
    declarant_nom: string; declarant_prenoms: string; declarant_qualite: string;
    declarant_age: number | string; declarant_domicile: string; declarant_profession: string;
    declarant_date_naissance: string; declarant_lieu_naissance: string; declarant_fokontany: string;
    medecin_nom: string; medecin_prenoms: string; certificat_medical: boolean;
    date_declaration: string; heure_declaration: string; officier_etat_civil: string;
}

interface DeathRegistrationFormProps { onBack?: () => void; }

const DeathRegistrationForm: React.FC<DeathRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<DeathForm>({
    nom: '', prenoms: '', date_naissance: '', lieu_naissance: '',
    age: '', sexe: '', profession: '', domicile: '',
    etat_matrimonial: '', defunt_fokontany: '',
    nom_pere: '', prenoms_pere: '', pere_date_naissance: '', pere_lieu_naissance: '',
    pere_profession: '', pere_statut: '',
    nom_mere: '', prenoms_mere: '', mere_date_naissance: '', mere_lieu_naissance: '',
    mere_profession: '', mere_statut: '',
    parents_adresse: '', fokontany: 'Fianarantsoa I',
    date_deces: '', heure_deces: '', lieu_deces: 'Fianarantsoa', cause_deces: '',
    declarant_nom: '', declarant_prenoms: '', declarant_qualite: '',
    declarant_age: '', declarant_domicile: '', declarant_profession: '',
    declarant_date_naissance: '', declarant_lieu_naissance: '', declarant_fokontany: '',
    medecin_nom: '', medecin_prenoms: '', certificat_medical: false,
    date_declaration: new Date().toISOString().split('T')[0],
    heure_declaration: '16:00',
    officier_etat_civil: 'Maire de Fianarantsoa'
  });
  const [nextNumber, setNextNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  // ✅ USEAUTH POUR LOGOUT SUR 401
  const { logout } = useAuth();

  useEffect(() => { fetchNextNumber(); }, []);

  // ✅ FETCHNEXTNUMBER AVEC API.TS + TRY/CATCH
  const fetchNextNumber = async () => {
    try {
      const data = await getNextNumberDeces();
      setNextNumber(data.numero_acte); // Backend renvoie {success, numero_acte}
    } catch (error: any) {
      console.error('Erreur récupération numéro:', error);
      setMessage(`❌ Erreur: ${error.message}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // VALIDATION DES ÉTAPES (INCHANGÉE)
  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1: // Défunt
        return !!(formData.nom && formData.prenoms && formData.age && formData.sexe && formData.etat_matrimonial);
      case 2: // Parents (optionnel mais si rempli, statut obligatoire)
        if (formData.nom_pere && !formData.pere_statut) return false;
        if (formData.nom_mere && !formData.mere_statut) return false;
        return true;
      case 3: // Décès + Déclarant + MÉTADONNÉES
        return !!(formData.date_deces && formData.lieu_deces && formData.fokontany &&
                  formData.declarant_nom && formData.declarant_prenoms &&
                  formData.declarant_date_naissance && formData.declarant_lieu_naissance &&
                  formData.declarant_domicile &&
                  formData.date_declaration && formData.heure_declaration && formData.officier_etat_civil);
      case 4: // Validation
        return true;
      default:
        return true;
    }
  };

  // NAVIGATION AVEC VALIDATION (INCHANGÉE)
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setMessage(`❌ Veuillez remplir tous les champs obligatoires de l'étape ${currentStep}`);
      return;
    }
    setMessage('');
    setCurrentStep(currentStep + 1);
  };

  // ✅ HANDLESUBMIT AVEC API.TS + TRY/CATCH ROBUSTE + SUPPR USER_ID
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    // VALIDATION FINALE (INCHANGÉE)
    if (!formData.date_declaration || !formData.heure_declaration || !formData.officier_etat_civil) {
      setMessage('❌ Veuillez remplir les métadonnées (Date/Heure déclaration + Officier)');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      // ✅ PRÉPARER PAYLOAD SANS USER_ID (GÉRÉ PAR JWT)
      const payload = {
        ...formData,
        numero_acte: nextNumber,
        // ✅ user_id SUPPRIMÉ - récupéré depuis req.user.id côté backend
      };
      
      // ✅ UTILISER API.TS (TOKEN AUTO)
      const response = await createActeDeces(payload); // Renommé en 'response' pour clarté et utilisation
      
      // ✅ Vérification optionnelle du succès (adapte si ton backend renvoie {success: true})
      if (response?.success !== true) {
        throw new Error('Réponse API inattendue'); // Optionnel : relance l'erreur si pas de succès
      }
      
      setMessage(`✅ Acte de décès ${nextNumber} enregistré avec succès !`);
      // Reset formulaire (INCHANGÉ)
      setFormData({
        nom: '', prenoms: '', date_naissance: '', lieu_naissance: '',
        age: '', sexe: '', profession: '', domicile: '',
        etat_matrimonial: '', defunt_fokontany: '',
        nom_pere: '', prenoms_pere: '', pere_date_naissance: '', pere_lieu_naissance: '',
        pere_profession: '', pere_statut: '',
        nom_mere: '', prenoms_mere: '', mere_date_naissance: '', mere_lieu_naissance: '',
        mere_profession: '', mere_statut: '',
        parents_adresse: '', fokontany: 'Fianarantsoa I',
        date_deces: '', heure_deces: '', lieu_deces: 'Fianarantsoa', cause_deces: '',
        declarant_nom: '', declarant_prenoms: '', declarant_qualite: '',
        declarant_age: '', declarant_domicile: '', declarant_profession: '',
        declarant_date_naissance: '', declarant_lieu_naissance: '', declarant_fokontany: '',
        medecin_nom: '', medecin_prenoms: '', certificat_medical: false,
        date_declaration: new Date().toISOString().split('T')[0],
        heure_declaration: '16:00',
        officier_etat_civil: 'Maire de Fianarantsoa'
      });
      fetchNextNumber();
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Erreur:', error);
      // ✅ GESTION ERREURS SPÉCIFIQUE (COMME BIRTH/MARRIAGE)
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout(); // ✅ AUTO-LOGOUT SUR 401
        // Optionnel : navigate('/login') via useNavigate si besoin
      } else {
        setMessage(`❌ Erreur : ${error.message || 'Impossible d\'enregistrer l\'acte'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // RENDU (INCHANGÉ - UI PARFAITE)
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #718096, #4a5568)', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.8em' }}>📋 Enregistrement d'Acte de Décès</h1>
            <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Commune Urbaine de Fianarantsoa</p>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '1.1em' }}>Numéro d'acte : <strong>{nextNumber}</strong></p>
          </div>
          {onBack && (
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>← Retour</button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {['Défunt', 'Parents', 'Décès & Déclarant', 'Validation'].map((step, index) => (
            <div key={index} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: '8px', background: currentStep === index + 1 ? '#718096' : '#e2e8f0', color: currentStep === index + 1 ? 'white' : '#718096', margin: '0 5px', fontSize: '0.9em', fontWeight: currentStep === index + 1 ? 'bold' : 'normal', transition: 'all 0.3s' }}>
              {index + 1}. {step}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
         
          {/* ÉTAPE 1 : DÉFUNT */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px', borderBottom: '2px solid #718096', paddingBottom: '10px' }}>👤 Informations sur le défunt</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                  <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms *</label>
                  <input type="text" name="prenoms" value={formData.prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de naissance</label>
                  <input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Âge *</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sexe *</label>
                  <select name="sexe" value={formData.sexe} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }}>
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
              <div style={{ background: '#fff5f0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1em', color: '#c05621' }}>💍 État matrimonial *</label>
                <select name="etat_matrimonial" value={formData.etat_matrimonial} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '2px solid #ed8936', borderRadius: '6px', fontSize: '1.1em' }}>
                  <option value="">Sélectionner</option>
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="veuf">Veuf/Veuve</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lieu de naissance</label>
                  <input type="text" name="lieu_naissance" value={formData.lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#3182ce' }}>📍 Fokontany du défunt</label>
                  <input type="text" name="defunt_fokontany" value={formData.defunt_fokontany} onChange={handleInputChange} placeholder="Ex: Fianarantsoa II" style={{ width: '100%', padding: '10px', border: '2px solid #3182ce', borderRadius: '6px' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession</label>
                  <input type="text" name="profession" value={formData.profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Domicile</label>
                  <input type="text" name="domicile" value={formData.domicile} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          )}
          {/* ÉTAPE 2 : PARENTS */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px', borderBottom: '2px solid #718096', paddingBottom: '10px' }}>👨‍👩‍👦 Parents du défunt</h3>
              
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
                <h4 style={{ color: '#4a5568', marginBottom: '15px' }}>👨 Père</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                    <input type="text" name="nom_pere" value={formData.nom_pere} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms</label>
                    <input type="text" name="prenoms_pere" value={formData.prenoms_pere} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#38a169' }}>📅 Date de naissance</label>
                    <input type="date" name="pere_date_naissance" value={formData.pere_date_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #38a169', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#38a169' }}>📍 Lieu de naissance</label>
                    <input type="text" name="pere_lieu_naissance" value={formData.pere_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #38a169', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#38a169' }}>💼 Profession</label>
                    <input type="text" name="pere_profession" value={formData.pere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #38a169', borderRadius: '6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e53e3e' }}>💀 Statut du père</label>
                  <select name="pere_statut" value={formData.pere_statut} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #e53e3e', borderRadius: '6px' }}>
                    <option value="">Sélectionner</option>
                    <option value="vivant">✅ Vivant</option>
                    <option value="decede">💀 Décédé</option>
                  </select>
                </div>
              </div>
              <div style={{ background: '#fef5e7', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
                <h4 style={{ color: '#4a5568', marginBottom: '15px' }}>👩 Mère</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                    <input type="text" name="nom_mere" value={formData.nom_mere} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms</label>
                    <input type="text" name="prenoms_mere" value={formData.prenoms_mere} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d69e2e' }}>📅 Date de naissance</label>
                    <input type="date" name="mere_date_naissance" value={formData.mere_date_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #d69e2e', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d69e2e' }}>📍 Lieu de naissance</label>
                    <input type="text" name="mere_lieu_naissance" value={formData.mere_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #d69e2e', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d69e2e' }}>💼 Profession</label>
                    <input type="text" name="mere_profession" value={formData.mere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #d69e2e', borderRadius: '6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e53e3e' }}>💀 Statut de la mère</label>
                  <select name="mere_statut" value={formData.mere_statut} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '2px solid #e53e3e', borderRadius: '6px' }}>
                    <option value="">Sélectionner</option>
                    <option value="vivant">✅ Vivante</option>
                    <option value="decede">💀 Décédée</option>
                  </select>
                </div>
              </div>
              {(formData.pere_statut === 'vivant' || formData.mere_statut === 'vivant') && (
                <div style={{ background: '#e6fffa', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ color: '#2c7a7b', marginBottom: '15px' }}>🏠 Adresse des parents vivants</h4>
                  <textarea
                    name="parents_adresse"
                    value={formData.parents_adresse}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Adresse complète du/des parent(s) vivant(s)"
                    style={{ width: '100%', padding: '10px', border: '2px solid #38b2ac', borderRadius: '6px', resize: 'vertical' }}
                  />
                </div>
              )}
            </div>
          )}
          {/* ÉTAPE 3 : DÉCÈS & DÉCLARANT */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px', borderBottom: '2px solid #718096', paddingBottom: '10px' }}>⚰️ Informations sur le décès</h3>
              
              <div style={{ background: '#edf2f7', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1em', color: '#2d3748' }}>📍 Fokontany (lieu du décès) *</label>
                <select name="fokontany" value={formData.fokontany} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '2px solid #4299e1', borderRadius: '6px', fontSize: '1.1em', fontWeight: 'bold' }}>
                  <option value="Fianarantsoa I">Fianarantsoa I</option>
                  <option value="Fianarantsoa II">Fianarantsoa II</option>
                </select>
              </div>
              <div style={{ background: '#fff5f5', padding: '25px', borderRadius: '12px', marginBottom: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date du décès *</label>
                    <input type="date" name="date_deces" value={formData.date_deces} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #fc8181', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Heure du décès</label>
                    <input type="time" name="heure_deces" value={formData.heure_deces} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #fc8181', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lieu du décès *</label>
                    <input type="text" name="lieu_deces" value={formData.lieu_deces} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #fc8181', borderRadius: '6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cause du décès</label>
                  <textarea name="cause_deces" value={formData.cause_deces} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #fc8181', borderRadius: '6px', resize: 'vertical' }} />
                </div>
              </div>
              <h4 style={{ color: '#4a5568', marginBottom: '15px' }}>🩺 Médecin certificateur</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du médecin</label>
                  <input type="text" name="medecin_nom" value={formData.medecin_nom} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms du médecin</label>
                  <input type="text" name="medecin_prenoms" value={formData.medecin_prenoms} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" name="certificat_medical" checked={formData.certificat_medical} onChange={handleInputChange} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: 'bold' }}>✅ Certificat médical fourni</span>
                </label>
              </div>
              <h4 style={{ color: '#4a5568', marginBottom: '15px' }}>👤 Déclarant</h4>
              <div style={{ border: '2px solid #4299e1', padding: '20px', borderRadius: '8px', background: '#ebf8ff', marginBottom: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                    <input type="text" name="declarant_nom" value={formData.declarant_nom} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #4299e1', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms *</label>
                    <input type="text" name="declarant_prenoms" value={formData.declarant_prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #4299e1', borderRadius: '6px' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📅 Date de naissance *</label>
                    <input type="date" name="declarant_date_naissance" value={formData.declarant_date_naissance} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '2px solid #2b6cb0', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📍 Lieu de naissance *</label>
                    <input type="text" name="declarant_lieu_naissance" value={formData.declarant_lieu_naissance} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '2px solid #2b6cb0', borderRadius: '6px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏠 Domicile *</label>
                  <textarea name="declarant_domicile" value={formData.declarant_domicile} onChange={handleInputChange} required rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #4299e1', borderRadius: '6px', resize: 'vertical' }} />
                </div>
              </div>
              {/* MÉTADONNÉES DÉPLACÉES ICI (ÉTAPE 3) */}
              <div style={{ background: '#fff9e6', padding: '25px', borderRadius: '12px', border: '3px solid #f6ad55' }}>
                <h4 style={{ color: '#c05621', marginBottom: '20px', fontSize: '1.3em', textAlign: 'center' }}>
                  ⚠️ MÉTADONNÉES DE L'ACTE (OBLIGATOIRE)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1.1em' }}>📅 Date de déclaration *</label>
                    <input
                      type="date"
                      name="date_declaration"
                      value={formData.date_declaration}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '12px', border: '2px solid #ed8936', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1.1em' }}>⏰ Heure de déclaration *</label>
                    <input
                      type="time"
                      name="heure_declaration"
                      value={formData.heure_declaration}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '12px', border: '2px solid #ed8936', borderRadius: '8px', fontSize: '16px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1.1em' }}>🏛️ Officier d'État Civil *</label>
                  <input
                    type="text"
                    name="officier_etat_civil"
                    value={formData.officier_etat_civil}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Maire de Fianarantsoa"
                    style={{ width: '100%', padding: '14px', border: '2px solid #ed8936', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}
                  />
                </div>
                <div style={{ marginTop: '15px', padding: '12px', background: '#fef5e7', borderRadius: '6px', border: '1px solid #f6ad55' }}>
                  <p style={{ margin: 0, fontSize: '0.95em', color: '#744210' }}>
                    ℹ️ Ces informations seront enregistrées avec l'acte. Vérifiez bien avant de continuer.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* ÉTAPE 4 : VALIDATION (RÉSUMÉ SEULEMENT) */}
          {currentStep === 4 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px', borderBottom: '2px solid #718096', paddingBottom: '10px' }}>✅ Vérification finale</h3>
              
              <div style={{ background: '#f0fff4', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '2px solid #48bb78' }}>
                <h4 style={{ color: '#22543d', marginBottom: '15px', fontSize: '1.2em', textAlign: 'center' }}>
                  ✅ Toutes les informations ont été saisies
                </h4>
                <p style={{ textAlign: 'center', color: '#2f855a', fontSize: '1.05em' }}>
                  Acte N° <strong style={{ fontSize: '1.3em', color: '#22543d' }}>{nextNumber}</strong>
                </p>
              </div>
              <div style={{ background: '#f7fafc', padding: '25px', borderRadius: '12px', marginBottom: '25px' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '20px', fontSize: '1.3em' }}>
                  📋 Résumé de l'acte de décès
                </h4>
                
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ color: '#4a5568', marginBottom: '10px', fontSize: '1.1em' }}>⚰️ DÉFUNT</h5>
                  <p><strong>Nom complet :</strong> {formData.prenoms} {formData.nom}</p>
                  <p><strong>Sexe :</strong> {formData.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                  <p><strong>État matrimonial :</strong> {formData.etat_matrimonial}</p>
                  {formData.profession && <p><strong>Profession :</strong> {formData.profession}</p>}
                  {formData.date_naissance && <p><strong>Date naissance :</strong> {formData.date_naissance}</p>}
                  {formData.lieu_naissance && <p><strong>Lieu naissance :</strong> {formData.lieu_naissance}</p>}
                  {formData.domicile && <p><strong>Domicile :</strong> {formData.domicile}</p>}
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '20px' }}>
                  <h5 style={{ color: '#4a5568', marginBottom: '10px', fontSize: '1.1em' }}>👨‍👩‍👦 PARENTS</h5>
                  {(formData.prenoms_pere || formData.nom_pere) && (
                    <p><strong>Père :</strong> {formData.prenoms_pere} {formData.nom_pere}
                      {formData.pere_statut && <span style={{ marginLeft: '10px', color: formData.pere_statut === 'vivant' ? '#38a169' : '#e53e3e' }}>
                        ({formData.pere_statut === 'vivant' ? '✅ mbola velona' : '💀 efa maty'})
                      </span>}
                    </p>
                  )}
                  {(formData.prenoms_mere || formData.nom_mere) && (
                    <p><strong>Mère :</strong> {formData.prenoms_mere} {formData.nom_mere}
                      {formData.mere_statut && <span style={{ marginLeft: '10px', color: formData.mere_statut === 'vivant' ? '#38a169' : '#e53e3e' }}>
                        ({formData.mere_statut === 'vivant' ? '✅ mbola velona' : '💀 efa maty'})
                      </span>}
                    </p>
                  )}
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '20px' }}>
                  <h5 style={{ color: '#4a5568', marginBottom: '10px', fontSize: '1.1em' }}>📅 DÉCÈS</h5>
                  <p><strong>Date :</strong> {formData.date_deces}</p>
                  {formData.heure_deces && <p><strong>Heure :</strong> {formData.heure_deces}</p>}
                  <p><strong>Lieu :</strong> {formData.lieu_deces}</p>
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '20px' }}>
                  <h5 style={{ color: '#4a5568', marginBottom: '10px', fontSize: '1.1em' }}>👤 DÉCLARANT</h5>
                  <p><strong>Nom :</strong> {formData.declarant_prenoms} {formData.declarant_nom}</p>
                  <p><strong>Date naissance :</strong> {formData.declarant_date_naissance}</p>
                  <p><strong>Lieu naissance :</strong> {formData.declarant_lieu_naissance}</p>
                  <p><strong>Domicile :</strong> {formData.declarant_domicile}</p>
                </div>
                <div style={{ borderTop: '2px solid #ed8936', paddingTop: '15px', background: '#fffaf0', padding: '15px', borderRadius: '8px' }}>
                  <h5 style={{ color: '#c05621', marginBottom: '10px', fontSize: '1.1em' }}>📝 MÉTADONNÉES</h5>
                  <p><strong>Date de déclaration :</strong> {formData.date_declaration}</p>
                  <p><strong>Heure de déclaration :</strong> {formData.heure_declaration}</p>
                  <p><strong>Officier d'État Civil :</strong> {formData.officier_etat_civil}</p>
                </div>
              </div>
              {message && (
                <div style={{ background: message.includes('succès') ? '#c6f6d5' : '#fed7d7', color: message.includes('succès') ? '#22543d' : '#742a2a', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', fontSize: '1.1em', fontWeight: 'bold', border: message.includes('succès') ? '2px solid #38a169' : '2px solid #e53e3e' }}>
                  {message}
                </div>
              )}
            </div>
          )}
          {/* BOUTONS NAVIGATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '12px 30px', background: '#718096', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>
                ← Précédent
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} style={{ padding: '12px 30px', background: '#718096', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={loading} style={{ padding: '14px 40px', background: loading ? '#a0aec0' : '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontSize: '17px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                {loading ? '⏳ Enregistrement en cours...' : '✅ Enregistrer l\'Acte de Décès'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeathRegistrationForm;