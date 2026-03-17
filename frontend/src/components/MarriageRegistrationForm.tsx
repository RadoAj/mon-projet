import React, { useState, useEffect } from 'react';
import { getNextNumberMariage, createActeMariage } from '../utils/api';

interface MarriageForm {
  // Époux
  epoux_nom: string;
  epoux_prenoms: string;
  epoux_date_naissance: string;
  epoux_lieu_naissance: string;
  epoux_profession: string;
  epoux_domicile: string;
  epoux_pere_nom: string;
  epoux_pere_prenoms: string;
  epoux_pere_profession: string;
  epoux_mere_nom: string;
  epoux_mere_prenoms: string;
  epoux_mere_profession: string;
  // Épouse
  epouse_nom: string;
  epouse_prenoms: string;
  epouse_date_naissance: string;
  epouse_lieu_naissance: string;
  epouse_profession: string;
  epouse_domicile: string;
  epouse_pere_nom: string;
  epouse_pere_prenoms: string;
  epouse_pere_profession: string;
  epouse_mere_nom: string;
  epouse_mere_prenoms: string;
  epouse_mere_profession: string;
  // Informations du mariage
  date_mariage: string;
  heure_mariage: string;
  lieu_mariage: string;
  regime_matrimonial: string;
  // Témoins (seulement 2, avec détails complets)
  temoin1_nom: string;
  temoin1_prenoms: string;
  temoin1_qualite: string;
  temoin1_profession: string;
  temoin1_date_naissance: string;
  temoin1_lieu_naissance: string;
  temoin1_domicile: string;
  temoin2_nom: string;
  temoin2_prenoms: string;
  temoin2_qualite: string;
  temoin2_profession: string;
  temoin2_date_naissance: string;
  temoin2_lieu_naissance: string;
  temoin2_domicile: string;
  // Métadonnées
  officier_etat_civil: string;
}

interface MarriageRegistrationFormProps {
  onBack?: () => void;
}

const MarriageRegistrationForm: React.FC<MarriageRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<MarriageForm>({
    epoux_nom: '',
    epoux_prenoms: '',
    epoux_date_naissance: '',
    epoux_lieu_naissance: '',
    epoux_profession: '',
    epoux_domicile: '',
    epoux_pere_nom: '',
    epoux_pere_prenoms: '',
    epoux_pere_profession: '',
    epoux_mere_nom: '',
    epoux_mere_prenoms: '',
    epoux_mere_profession: '',
    epouse_nom: '',
    epouse_prenoms: '',
    epouse_date_naissance: '',
    epouse_lieu_naissance: '',
    epouse_profession: '',
    epouse_domicile: '',
    epouse_pere_nom: '',
    epouse_pere_prenoms: '',
    epouse_pere_profession: '',
    epouse_mere_nom: '',
    epouse_mere_prenoms: '',
    epouse_mere_profession: '',
    date_mariage: '',
    heure_mariage: '',
    lieu_mariage: 'Mairie de Fianarantsoa',
    regime_matrimonial: 'Communauté de biens',
    temoin1_nom: '',
    temoin1_prenoms: '',
    temoin1_qualite: '',
    temoin1_profession: '',
    temoin1_date_naissance: '',
    temoin1_lieu_naissance: '',
    temoin1_domicile: '',
    temoin2_nom: '',
    temoin2_prenoms: '',
    temoin2_qualite: '',
    temoin2_profession: '',
    temoin2_date_naissance: '',
    temoin2_lieu_naissance: '',
    temoin2_domicile: '',
    officier_etat_civil: 'Maire de Fianarantsoa'
  });
  const [nextNumber, setNextNumber] = useState<string>('');
  const [currentActeNumber, setCurrentActeNumber] = useState<string>(''); // Pour conserver le numéro de l'acte créé pour le PDF
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [createdActeId, setCreatedActeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const data = await getNextNumberMariage();
        setNextNumber(data.numero_acte);
      } catch (error: any) {
        console.error('Erreur récupération numéro:', error);
        setMessage(`❌ Erreur: ${error.message}`);
      }
    };
    fetchNextNumber();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setCreatedActeId(null);
    try {
      const data = await createActeMariage({ ...formData, numero_acte: nextNumber });
      setMessage(`✅ Acte de mariage ${nextNumber} enregistré avec succès !`);
      setCreatedActeId(data.id);
      setCurrentActeNumber(nextNumber); // Conserver le numéro actuel pour le PDF
      
      setFormData({
        epoux_nom: '', epoux_prenoms: '', epoux_date_naissance: '', epoux_lieu_naissance: '',
        epoux_profession: '', epoux_domicile: '', epoux_pere_nom: '', epoux_pere_prenoms: '',
        epoux_pere_profession: '', epoux_mere_nom: '', epoux_mere_prenoms: '', epoux_mere_profession: '',
        epouse_nom: '', epouse_prenoms: '', epouse_date_naissance: '', epouse_lieu_naissance: '',
        epouse_profession: '', epouse_domicile: '', epouse_pere_nom: '', epouse_pere_prenoms: '',
        epouse_pere_profession: '', epouse_mere_nom: '', epouse_mere_prenoms: '', epouse_mere_profession: '',
        date_mariage: '', heure_mariage: '', lieu_mariage: 'Mairie de Fianarantsoa', regime_matrimonial: 'Communauté de biens',
        temoin1_nom: '', temoin1_prenoms: '', temoin1_qualite: '', temoin1_profession: '',
        temoin1_date_naissance: '', temoin1_lieu_naissance: '', temoin1_domicile: '',
        temoin2_nom: '', temoin2_prenoms: '', temoin2_qualite: '', temoin2_profession: '',
        temoin2_date_naissance: '', temoin2_lieu_naissance: '', temoin2_domicile: '',
        officier_etat_civil: 'Maire de Fianarantsoa'
      });
      
      const newNumber = await getNextNumberMariage();
      setNextNumber(newNumber.numero_acte);
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Erreur:', error);
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
      } else {
        setMessage(`❌ Erreur : ${error.message || 'Impossible d\'enregistrer l\'acte'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!createdActeId) return;
    try {
      const response = await fetch(`https://mon-projet-upde.onrender.com/api/pdf/mariage/${createdActeId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `acte_mariage_${currentActeNumber}.pdf`; // Utiliser le numéro conservé
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setMessage('❌ Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      setMessage('❌ Erreur lors de la génération du PDF');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(135deg, #ed8936, #dd6b20)', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: '0', fontSize: '1.8em' }}>💍 Enregistrement d'Acte de Mariage</h1>
            <p style={{ margin: '10px 0 0 0', opacity: '0.9' }}>Commune Urbaine de Fianarantsoa</p>
            <p style={{ margin: '5px 0 0 0', opacity: '0.8' }}>Numéro d'acte : <strong>{nextNumber || 'Chargement...'}</strong></p>
          </div>
          {onBack && <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>← Retour</button>}
        </div>
        {message && (
          <div style={{ background: message.includes('succès') ? '#d4edda' : '#f8d7da', color: message.includes('succès') ? '#155724' : '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${message.includes('succès') ? '#c3e6cb' : '#f5c6cb'}` }}>
            {message}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {['Époux & Épouse', 'Mariage', 'Témoins', 'Validation'].map((step, index) => (
            <div key={index} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', background: currentStep === index + 1 ? '#ed8936' : '#e2e8f0', color: currentStep === index + 1 ? 'white' : '#718096', margin: '0 5px', fontSize: '0.9em', fontWeight: currentStep === index + 1 ? 'bold' : 'normal' }}>
              {index + 1}. {step}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* ÉTAPE 1 : ÉPOUX & ÉPOUSE */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>Informations des futurs époux</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* ÉPOUX */}
                <div style={{ border: '2px solid #4299e1', padding: '25px', borderRadius: '12px' }}>
                  <h4 style={{ color: '#4299e1', marginBottom: '20px', fontSize: '1.3em' }}>👨 ÉPOUX</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                    <input type="text" name="epoux_nom" value={formData.epoux_nom} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms *</label>
                    <input type="text" name="epoux_prenoms" value={formData.epoux_prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de naissance *</label>
                    <input type="date" name="epoux_date_naissance" value={formData.epoux_date_naissance} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lieu de naissance</label>
                    <input type="text" name="epoux_lieu_naissance" value={formData.epoux_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession</label>
                    <input type="text" name="epoux_profession" value={formData.epoux_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Domicile</label>
                    <textarea name="epoux_domicile" value={formData.epoux_domicile} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', resize: 'vertical' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du père</label>
                    <input type="text" name="epoux_pere_nom" value={formData.epoux_pere_nom} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms du père</label>
                    <input type="text" name="epoux_pere_prenoms" value={formData.epoux_pere_prenoms} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession du père</label>
                    <input type="text" name="epoux_pere_profession" value={formData.epoux_pere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de la mère</label>
                    <input type="text" name="epoux_mere_nom" value={formData.epoux_mere_nom} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms de la mère</label>
                    <input type="text" name="epoux_mere_prenoms" value={formData.epoux_mere_prenoms} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession de la mère</label>
                    <input type="text" name="epoux_mere_profession" value={formData.epoux_mere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                </div>
                
                {/* ÉPOUSE */}
                <div style={{ border: '2px solid #ed8936', padding: '25px', borderRadius: '12px' }}>
                  <h4 style={{ color: '#ed8936', marginBottom: '20px', fontSize: '1.3em' }}>👩 ÉPOUSE</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                    <input type="text" name="epouse_nom" value={formData.epouse_nom} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms *</label>
                    <input type="text" name="epouse_prenoms" value={formData.epouse_prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de naissance *</label>
                    <input type="date" name="epouse_date_naissance" value={formData.epouse_date_naissance} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lieu de naissance</label>
                    <input type="text" name="epouse_lieu_naissance" value={formData.epouse_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession</label>
                    <input type="text" name="epouse_profession" value={formData.epouse_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Domicile</label>
                    <textarea name="epouse_domicile" value={formData.epouse_domicile} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', resize: 'vertical' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du père</label>
                    <input type="text" name="epouse_pere_nom" value={formData.epouse_pere_nom} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms du père</label>
                    <input type="text" name="epouse_pere_prenoms" value={formData.epouse_pere_prenoms} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession du père</label>
                    <input type="text" name="epouse_pere_profession" value={formData.epouse_pere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de la mère</label>
                    <input type="text" name="epouse_mere_nom" value={formData.epouse_mere_nom} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms de la mère</label>
                    <input type="text" name="epouse_mere_prenoms" value={formData.epouse_mere_prenoms} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profession de la mère</label>
                    <input type="text" name="epouse_mere_profession" value={formData.epouse_mere_profession} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ÉTAPE 2 : INFORMATIONS DU MARIAGE */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>Informations du mariage</h3>
              
              <div style={{ background: '#f7fafc', padding: '30px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Date du mariage *</label>
                    <input type="date" name="date_mariage" value={formData.date_mariage} onChange={handleInputChange} required style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Heure du mariage *</label>
                    <input type="time" name="heure_mariage" value={formData.heure_mariage} onChange={handleInputChange} required style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '25px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Lieu du mariage *</label>
                    <input type="text" name="lieu_mariage" value={formData.lieu_mariage} onChange={handleInputChange} required style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>Régime matrimonial</label>
                    <select name="regime_matrimonial" value={formData.regime_matrimonial} onChange={handleInputChange} style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' }}>
                      <option value="Communauté de biens">Communauté de biens</option>
                      <option value="Séparation de biens">Séparation de biens</option>
                      <option value="Participation aux acquêts">Participation aux acquêts</option>
                      <option value="Communauté universelle">Communauté universelle</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ÉTAPE 3 : TÉMOINS */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>Témoins du mariage (2 témoins requis)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* TÉMOIN 1 */}
                <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px' }}>
                  <h5 style={{ color: '#48bb78', marginBottom: '15px' }}>Témoin 1</h5>
                  <input type="text" name="temoin1_nom" placeholder="Nom *" value={formData.temoin1_nom} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin1_prenoms" placeholder="Prénoms *" value={formData.temoin1_prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin1_qualite" placeholder="Qualité (ami, parent, etc.) *" value={formData.temoin1_qualite} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin1_profession" placeholder="Profession" value={formData.temoin1_profession} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="date" name="temoin1_date_naissance" value={formData.temoin1_date_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin1_lieu_naissance" placeholder="Lieu de naissance" value={formData.temoin1_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <textarea name="temoin1_domicile" placeholder="Domicile" value={formData.temoin1_domicile} onChange={handleInputChange} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                </div>
                
                {/* TÉMOIN 2 */}
                <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px' }}>
                  <h5 style={{ color: '#48bb78', marginBottom: '15px' }}>Témoin 2</h5>
                  <input type="text" name="temoin2_nom" placeholder="Nom *" value={formData.temoin2_nom} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin2_prenoms" placeholder="Prénoms *" value={formData.temoin2_prenoms} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin2_qualite" placeholder="Qualité (ami, parent, etc.) *" value={formData.temoin2_qualite} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin2_profession" placeholder="Profession" value={formData.temoin2_profession} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="date" name="temoin2_date_naissance" value={formData.temoin2_date_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input type="text" name="temoin2_lieu_naissance" placeholder="Lieu de naissance" value={formData.temoin2_lieu_naissance} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                  <textarea name="temoin2_domicile" placeholder="Domicile" value={formData.temoin2_domicile} onChange={handleInputChange} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          )}
          {/* ÉTAPE 4 : VALIDATION */}
          {currentStep === 4 && (
            <div>
              <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>Validation et Enregistrement</h3>
              
              <div style={{ background: '#f7fafc', padding: '25px', borderRadius: '12px', marginBottom: '25px' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '20px' }}>Résumé de l'acte de mariage : <strong style={{ color: '#ed8936' }}>{nextNumber}</strong></h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                  <div>
                    <h5 style={{ color: '#4299e1', marginBottom: '10px' }}>ÉPOUX</h5>
                    <p><strong>Nom :</strong> {formData.epoux_nom}</p>
                    <p><strong>Prénoms :</strong> {formData.epoux_prenoms}</p>
                    <p><strong>Date de naissance :</strong> {formData.epoux_date_naissance}</p>
                    <p><strong>Lieu de naissance :</strong> {formData.epoux_lieu_naissance}</p>
                    <p><strong>Profession :</strong> {formData.epoux_profession}</p>
                    <p><strong>Domicile :</strong> {formData.epoux_domicile}</p>
                    <p><strong>Père :</strong> {formData.epoux_pere_nom} {formData.epoux_pere_prenoms} ({formData.epoux_pere_profession})</p>
                    <p><strong>Mère :</strong> {formData.epoux_mere_nom} {formData.epoux_mere_prenoms} ({formData.epoux_mere_profession})</p>
                  </div>
                  
                  <div>
                    <h5 style={{ color: '#ed8936', marginBottom: '10px' }}>ÉPOUSE</h5>
                    <p><strong>Nom :</strong> {formData.epouse_nom}</p>
                    <p><strong>Prénoms :</strong> {formData.epouse_prenoms}</p>
                    <p><strong>Date de naissance :</strong> {formData.epouse_date_naissance}</p>
                    <p><strong>Lieu de naissance :</strong> {formData.epouse_lieu_naissance}</p>
                    <p><strong>Profession :</strong> {formData.epouse_profession}</p>
                    <p><strong>Domicile :</strong> {formData.epouse_domicile}</p>
                    <p><strong>Père :</strong> {formData.epouse_pere_nom} {formData.epouse_pere_prenoms} ({formData.epouse_pere_profession})</p>
                    <p><strong>Mère :</strong> {formData.epouse_mere_nom} {formData.epouse_mere_prenoms} ({formData.epouse_mere_profession})</p>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginBottom: '20px' }}>
                  <p><strong>Date et heure du mariage :</strong> {formData.date_mariage} à {formData.heure_mariage}</p>
                  <p><strong>Lieu du mariage :</strong> {formData.lieu_mariage}</p>
                  <p><strong>Régime matrimonial :</strong> {formData.regime_matrimonial}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <h5 style={{ color: '#48bb78', marginBottom: '10px' }}>Témoin 1</h5>
                    <p><strong>Nom et Prénoms :</strong> {formData.temoin1_nom} {formData.temoin1_prenoms}</p>
                    <p><strong>Qualité :</strong> {formData.temoin1_qualite}</p>
                    <p><strong>Profession :</strong> {formData.temoin1_profession}</p>
                    <p><strong>Date de naissance :</strong> {formData.temoin1_date_naissance}</p>
                    <p><strong>Lieu de naissance :</strong> {formData.temoin1_lieu_naissance}</p>
                    <p><strong>Domicile :</strong> {formData.temoin1_domicile}</p>
                  </div>
                  <div>
                    <h5 style={{ color: '#48bb78', marginBottom: '10px' }}>Témoin 2</h5>
                    <p><strong>Nom et Prénoms :</strong> {formData.temoin2_nom} {formData.temoin2_prenoms}</p>
                    <p><strong>Qualité :</strong> {formData.temoin2_qualite}</p>
                    <p><strong>Profession :</strong> {formData.temoin2_profession}</p>
                    <p><strong>Date de naissance :</strong> {formData.temoin2_date_naissance}</p>
                    <p><strong>Lieu de naissance :</strong> {formData.temoin2_lieu_naissance}</p>
                    <p><strong>Domicile :</strong> {formData.temoin2_domicile}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Officier d'État Civil *</label>
                <input type="text" name="officier_etat_civil" value={formData.officier_etat_civil} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '16px' }} />
              </div>
              
              {createdActeId && (
                <button type="button" onClick={downloadPdf} style={{ padding: '12px 24px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
                  📄 Télécharger PDF (Format Officiel)
                </button>
              )}
            </div>
          )}
          {/* BOUTONS DE NAVIGATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '12px 24px', background: '#718096', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer' }}>
                ← Précédent
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {currentStep < 4 ? (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)} style={{ padding: '12px 24px', background: '#ed8936', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer' }}>
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={loading} style={{ padding: '12px 24px', background: loading ? '#a0aec0' : '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Enregistrement...' : '✅ Enregistrer l\'Acte'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarriageRegistrationForm;