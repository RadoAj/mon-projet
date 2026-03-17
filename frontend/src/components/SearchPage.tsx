import React, { useState, useEffect } from 'react';
import MentionsManager from './MentionsManager';
// ✅ IMPORT DES FONCTIONS API
import { 
  getActesNaissance, 
  getActesMariage, 
  getActesDeces,
  updateActeNaissance,
  updateActeMariage,
  updateActeDeces,
  deleteActeNaissance,
  deleteActeMariage,
  deleteActeDeces
} from '../utils/api';

interface Acte {
  id: number;
  numero_acte: string;
  nom?: string;
  prenoms?: string;
  epoux_nom?: string;
  epoux_prenoms?: string;
  epouse_nom?: string;
  epouse_prenoms?: string;
  date_naissance?: string;
  date_mariage?: string;
  date_deces?: string;
  date_creation: string;
  nom_pere?: string;
  prenoms_pere?: string;
  nom_mere?: string;
  prenoms_mere?: string;
  lieu_naissance?: string;
  lieu_mariage?: string;
  lieu_deces?: string;
  heure_naissance?: string;
  sexe?: string;
}

interface SearchPageProps {
  onBack?: () => void;
}

const THEME = {
  primary: '#4299e1',
  primaryLight: '#63b3ed',
  success: '#48bb78',
  warning: '#ed8936',
  danger: '#e53e3e',
  info: '#9f7aea',
  background: '#f7fafc',
  text: '#2d3748',
  border: '#e2e8f0'
};

const SearchPage: React.FC<SearchPageProps> = ({ onBack }) => {
  const [typeActe, setTypeActe] = useState<'naissance' | 'mariage' | 'deces'>('naissance');
  const [actes, setActes] = useState<Acte[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActe, setSelectedActe] = useState<any>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // ✅ CORRECTION : Utiliser les fonctions API avec token
  const fetchActes = async () => {
    setLoading(true);
    try {
      let response;
      
      if (typeActe === 'naissance') {
        response = await getActesNaissance();
      } else if (typeActe === 'mariage') {
        response = await getActesMariage();
      } else {
        response = await getActesDeces();
      }
      
      if (response.success) {
        setActes(response.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement actes:', error);
      
      // ✅ Gestion erreur 401 : Redirection login
      if (error.message.includes('Session expirée') || error.message.includes('401')) {
        alert('⚠️ Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
      } else {
        alert('❌ Erreur lors du chargement des actes');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeActe]);

  const actesFiltres = actes.filter(acte => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      acte.numero_acte?.toLowerCase().includes(search) ||
      acte.nom?.toLowerCase().includes(search) ||
      acte.prenoms?.toLowerCase().includes(search) ||
      acte.epoux_nom?.toLowerCase().includes(search) ||
      acte.epoux_prenoms?.toLowerCase().includes(search) ||
      acte.epouse_nom?.toLowerCase().includes(search) ||
      acte.epouse_prenoms?.toLowerCase().includes(search)
    );
  });

  const handleModifier = (acte: Acte) => {
    setSelectedActe({ ...acte, type: typeActe });
    setShowMentions(false);
    setEditMode(true);
  };

  // ✅ CORRECTION : Utiliser les fonctions API avec token
  const handleSauvegarder = async () => {
    if (!selectedActe) return;

    try {
      let response;
      
      if (typeActe === 'naissance') {
        response = await updateActeNaissance(selectedActe.id, selectedActe);
      } else if (typeActe === 'mariage') {
        response = await updateActeMariage(selectedActe.id, selectedActe);
      } else {
        response = await updateActeDeces(selectedActe.id, selectedActe);
      }
      
      if (response.success) {
        alert('✅ Acte modifié avec succès');
        setSelectedActe(null);
        setEditMode(false);
        fetchActes();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Erreur modification:', error);
      
      if (error.message.includes('Session expirée') || error.message.includes('401')) {
        alert('⚠️ Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
      } else {
        alert(`❌ Erreur : ${error.message}`);
      }
    }
  };

  // ✅ CORRECTION : Utiliser les fonctions API avec token
  const handleSupprimer = async (acte: Acte) => {
    if (!window.confirm(`⚠️ Confirmer la suppression de l'acte ${acte.numero_acte} ?\n\nCette action est irréversible !`)) {
      return;
    }

    try {
      let response;
      
      if (typeActe === 'naissance') {
        response = await deleteActeNaissance(acte.id);
      } else if (typeActe === 'mariage') {
        response = await deleteActeMariage(acte.id);
      } else {
        response = await deleteActeDeces(acte.id);
      }
      
      if (response.success) {
        alert('✅ Acte supprimé avec succès');
        fetchActes();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      
      if (error.message.includes('Session expirée') || error.message.includes('401')) {
        alert('⚠️ Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
      } else {
        alert(`❌ Erreur : ${error.message}`);
      }
    }
  };

  const getNomComplet = (acte: Acte) => {
    if (typeActe === 'mariage') {
      return `${acte.epoux_nom || ''} ${acte.epoux_prenoms || ''} & ${acte.epouse_nom || ''} ${acte.epouse_prenoms || ''}`;
    }
    return `${acte.nom || ''} ${acte.prenoms || ''}`;
  };

  const getDate = (acte: Acte) => {
    if (typeActe === 'naissance') return acte.date_naissance;
    if (typeActe === 'mariage') return acte.date_mariage;
    if (typeActe === 'deces') return acte.date_deces;
    return '';
  };

  return (
    <>
      <div style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', sans-serif",
        background: THEME.background
      }}>
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '30px', flex: '0 0 auto' }}>
              <div style={{
                background: `linear-gradient(135deg, ${THEME.primary}, #3182ce)`,
                color: 'white',
                padding: '25px',
                borderRadius: '8px',
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8em' }}>
                    📋 Consultation et Gestion des Actes
                  </h1>
                  <p style={{ margin: 0, opacity: 0.9 }}>
                    Commune Urbaine de Fianarantsoa
                  </p>
                </div>
                {onBack && (
                  <button onClick={onBack} style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}>
                    ← Retour
                  </button>
                )}
              </div>

              <div style={{
                background: THEME.background,
                padding: '25px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr auto',
                  gap: '15px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Type d'acte
                    </label>
                    <select
                      value={typeActe}
                      onChange={(e) => setTypeActe(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="naissance">👶 Actes de Naissance</option>
                      <option value="mariage">💍 Actes de Mariage</option>
                      <option value="deces">⚰️ Actes de Décès</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Rechercher dans la liste
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="N° acte, nom, prénoms..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <button
                    onClick={fetchActes}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: THEME.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    {loading ? '⏳' : '🔄'} Actualiser
                  </button>
                </div>

                <div style={{
                  marginTop: '15px',
                  color: THEME.text,
                  fontSize: '0.95em',
                  textAlign: 'right'
                }}>
                  <strong>{actesFiltres.length}</strong> acte(s) affiché(s) sur {actes.length}
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 auto', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingLeft: '30px', paddingRight: '30px', paddingBottom: '30px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em', color: '#718096' }}>
                  ⏳ Chargement des actes...
                </div>
              ) : actesFiltres.length === 0 ? (
                <div style={{ background: THEME.background, padding: '50px', borderRadius: '8px', textAlign: 'center', color: '#718096' }}>
                  <p style={{ margin: 0, fontSize: '1.2em' }}>
                    {actes.length === 0 ? 'Aucun acte enregistré pour ce type' : 'Aucun résultat pour cette recherche'}
                  </p>
                </div>
              ) : (
                <div style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      background: THEME.primary,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <tr>
                        <th style={{
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          color: 'white',
                          borderBottom: `2px solid ${THEME.primaryLight}`
                        }}>N° Acte</th>
                        <th style={{
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          color: 'white',
                          borderBottom: `2px solid ${THEME.primaryLight}`
                        }}>{typeActe === 'mariage' ? 'Époux & Épouse' : 'Nom & Prénoms'}</th>
                        <th style={{
                          padding: '15px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          color: 'white',
                          borderBottom: `2px solid ${THEME.primaryLight}`
                        }}>
                          {typeActe === 'naissance' ? 'Date naissance' : typeActe === 'mariage' ? 'Date mariage' : 'Date décès'}
                        </th>
                        <th style={{
                          padding: '15px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: 'white',
                          borderBottom: `2px solid ${THEME.primaryLight}`
                        }}>Actions</th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {actesFiltres.map((acte, index) => (
                        <tr
                          key={acte.id}
                          style={{
                            borderBottom: `1px solid ${THEME.border}`,
                            background: index % 2 === 0 ? 'white' : THEME.background,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4f8'}
                          onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : THEME.background}
                        >
                          <td style={{ padding: '15px', fontWeight: 'bold', color: THEME.primary }}>
                            {acte.numero_acte}
                          </td>
                          <td style={{ padding: '15px' }}>{getNomComplet(acte)}</td>
                          <td style={{ padding: '15px', fontSize: '0.9em' }}>
                            {getDate(acte) ? new Date(getDate(acte)!).toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  setSelectedActe({ ...acte, type: typeActe });
                                  setShowMentions(false);
                                  setEditMode(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  background: THEME.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9em',
                                  fontWeight: 'bold'
                                }}
                              >👁️ Voir</button>

                              <button
                                onClick={() => handleModifier(acte)}
                                style={{
                                  padding: '8px 12px',
                                  background: THEME.warning,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9em',
                                  fontWeight: 'bold'
                                }}
                              >✏️ Modifier</button>

                              <button
                                onClick={() => {
                                  setSelectedActe({ ...acte, type: typeActe });
                                  setShowMentions(true);
                                  setEditMode(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  background: THEME.info,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9em',
                                  fontWeight: 'bold'
                                }}
                              >📝 Mentions</button>

                              <button
                                onClick={() => handleSupprimer(acte)}
                                style={{
                                  padding: '8px 12px',
                                  background: THEME.danger,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9em',
                                  fontWeight: 'bold'
                                }}
                              >🗑️ Supprimer</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedActe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: `2px solid ${THEME.border}`
            }}>
              <h2 style={{ margin: 0, color: THEME.text }}>
                {showMentions ? '📝 Mentions en marge' : editMode ? '✏️ Modifier l\'acte' : '📋 Détails de l\'acte'}
              </h2>
              <button
                onClick={() => {
                  setSelectedActe(null);
                  setEditMode(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >×</button>
            </div>

            {showMentions ? (
              <MentionsManager
                typeActe={selectedActe.type}
                acteId={selectedActe.id}
                numeroActe={selectedActe.numero_acte}
                readOnly={false}
              />
            ) : editMode ? (
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ background: THEME.background, padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, color: THEME.primary }}>Informations principales</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>N° Acte</label>
                      <input
                        type="text"
                        value={selectedActe.numero_acte || ''}
                        onChange={(e) => setSelectedActe({...selectedActe, numero_acte: e.target.value})}
                        style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                      />
                    </div>
                    {typeActe !== 'mariage' && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                          <input
                            type="text"
                            value={selectedActe.nom || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, nom: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms</label>
                          <input
                            type="text"
                            value={selectedActe.prenoms || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, prenoms: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </>
                    )}
                    {typeActe === 'naissance' && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de naissance</label>
                          <input
                            type="date"
                            value={selectedActe.date_naissance || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, date_naissance: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lieu de naissance</label>
                          <input
                            type="text"
                            value={selectedActe.lieu_naissance || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, lieu_naissance: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {typeActe !== 'mariage' && (
                    <>
                      <h3 style={{ color: THEME.primary }}>Père</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du père</label>
                          <input
                            type="text"
                            value={selectedActe.nom_pere || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, nom_pere: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms du père</label>
                          <input
                            type="text"
                            value={selectedActe.prenoms_pere || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, prenoms_pere: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </div>

                      <h3 style={{ color: THEME.primary }}>Mère</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de la mère</label>
                          <input
                            type="text"
                            value={selectedActe.nom_mere || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, nom_mere: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms de la mère</label>
                          <input
                            type="text"
                            value={selectedActe.prenoms_mere || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, prenoms_mere: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {typeActe === 'mariage' && (
                    <>
                      <h3 style={{ color: THEME.primary }}>Époux</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                          <input
                            type="text"
                            value={selectedActe.epoux_nom || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, epoux_nom: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms</label>
                          <input
                            type="text"
                            value={selectedActe.epoux_prenoms || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, epoux_prenoms: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </div>

                      <h3 style={{ color: THEME.primary }}>Épouse</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                          <input
                            type="text"
                            value={selectedActe.epouse_nom || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, epouse_nom: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénoms</label>
                          <input
                            type="text"
                            value={selectedActe.epouse_prenoms || ''}
                            onChange={(e) => setSelectedActe({...selectedActe, epouse_prenoms: e.target.value})}
                            style={{ width: '100%', padding: '10px', border: `1px solid ${THEME.border}`, borderRadius: '6px' }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSauvegarder}
                    style={{
                      padding: '12px 24px',
                      background: THEME.success,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >💾 Sauvegarder</button>

                  <button
                    onClick={() => setEditMode(false)}
                    style={{
                      padding: '12px 24px',
                      background: '#cbd5e0',
                      color: THEME.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >Annuler</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: THEME.background, padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', alignItems: 'center' }}>
                    <strong>N° Acte:</strong>
                    <span style={{ color: THEME.primary, fontWeight: 'bold', fontSize: '1.1em' }}>
                      {selectedActe.numero_acte}
                    </span>

                    <strong>Type:</strong>
                    <span style={{
                      background: THEME.primary + '1A',
                      color: THEME.primary,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {selectedActe.type === 'naissance' ? '👶 Naissance' :
                       selectedActe.type === 'mariage' ? '💍 Mariage' : '⚰️ Décès'}
                    </span>

                    <strong>Nom complet:</strong>
                    <span>{getNomComplet(selectedActe)}</span>

                    <strong>Date:</strong>
                    <span>
                      {getDate(selectedActe) 
                        ? new Date(getDate(selectedActe)!).toLocaleDateString('fr-FR') 
                        : 'N/A'}
                    </span>

                    {selectedActe.nom_pere && (
                      <>
                        <strong>Père:</strong>
                        <span>{selectedActe.nom_pere} {selectedActe.prenoms_pere}</span>
                      </>
                    )}

                    {selectedActe.nom_mere && (
                      <>
                        <strong>Mère:</strong>
                        <span>{selectedActe.nom_mere} {selectedActe.prenoms_mere}</span>
                      </>
                    )}

                    <strong>Date enregistrement:</strong>
                    <span>
                      {new Date(selectedActe.date_creation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: '12px 24px',
                      background: THEME.warning,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >✏️ Modifier</button>

                  <button
                    onClick={() => {
                      setShowMentions(true);
                      setEditMode(false);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: THEME.info,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >📝 Voir les mentions</button>
                  <button
                    onClick={() => {
                      setSelectedActe(null);
                      setEditMode(false);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#cbd5e0',
                      color: THEME.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >Fermer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchPage;