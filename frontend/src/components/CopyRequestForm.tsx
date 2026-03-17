import React, { useState } from 'react';
// ✅ AJOUT : Imports API avec authentification
import { useAuth } from '../contexts/AuthContext';
import { 
  getActesNaissance, 
  getActesMariage, 
  getActesDeces, 
  searchActes,      // ✅ Corrigé : searchActes au lieu de searchGlobal
  createCopie       // ✅ Corrigé : createCopie au lieu de createCopyRequest
} from '../utils/api';

// =====================================================
// INTERFACES
// =====================================================
interface CopyRequest {
  type_acte: 'naissance' | 'mariage' | 'deces' | '';
  numero_acte: string;
  type_copie: 'premiere_copie' | 'duplicata' | '';
  demandeur_nom: string;
  demandeur_prenoms: string;
  demandeur_qualite: string;
  demandeur_piece_identite: string;
  motif_demande: string;
  observations: string;
  montant_paye: number | string;
  reference_paiement: string;
}

interface CopyRequestFormProps {
  onBack?: () => void;
}

// =====================================================
// COMPOSANT PRINCIPAL
// =====================================================
const CopyRequestForm: React.FC<CopyRequestFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<CopyRequest>({
    type_acte: '',
    numero_acte: '',
    type_copie: '',
    demandeur_nom: '',
    demandeur_prenoms: '',
    demandeur_qualite: '',
    demandeur_piece_identite: '',
    motif_demande: '',
    observations: '',
    montant_paye: '',
    reference_paiement: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedActe, setSelectedActe] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ AJOUT : Hook pour logout sur 401
  const { logout } = useAuth();

  // =====================================================
  // GESTION DES CHANGEMENTS
  // =====================================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ MODIFICATION : CHARGER LES ACTES RÉCENTS AVEC API.TS
  // =====================================================
  const fetchRecentActes = async (type: string) => {
    try {
      let data;
      
      if (type === 'naissance') {
        data = await getActesNaissance();
      } else if (type === 'mariage') {
        data = await getActesMariage();
      } else if (type === 'deces') {
        data = await getActesDeces();
      }
      
      if (data?.success) {
        setSearchResults(data.data);
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error('Erreur chargement actes:', error);
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      }
    }
  };

  // ✅ MODIFICATION : RECHERCHER UN ACTE AVEC API.TS
  // =====================================================
  const searchActe = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      alert('Veuillez saisir au moins 2 caractères');
      return;
    }

    if (!formData.type_acte) {
      alert('Veuillez d\'abord sélectionner le type d\'acte');
      return;
    }

    try {
      // ✅ Utiliser searchActes depuis api.ts (pas searchGlobal)
      const data = await searchActes(searchTerm, formData.type_acte);
      
      if (data.success && data.data.length > 0) {
        setSearchResults(data.data);
        setCurrentPage(1);
      } else {
        alert('Aucun acte trouvé');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Erreur recherche:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert('Erreur lors de la recherche');
      }
    }
  };

  // ✅ MODIFICATION : SOUMETTRE LE FORMULAIRE AVEC API.TS
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedActe) {
      alert('Veuillez d\'abord rechercher et sélectionner un acte');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // ✅ Préparer le payload SANS user_id (géré par le token)
      const payload = {
        ...formData,
        acte_id: selectedActe.id
        // ✅ user_id supprimé - récupéré depuis req.user.id côté backend
      };

      // ✅ Utiliser la fonction API avec token JWT automatique
      const data = await createCopie(payload);
      
      if (data.success) {
        setMessage(`✅ Demande de copie enregistrée avec succès ! Numéro : ${data.data.numero_copie}`);
        
        // Reset du formulaire
        setFormData({
          type_acte: '', numero_acte: '', type_copie: '',
          demandeur_nom: '', demandeur_prenoms: '', demandeur_qualite: '',
          demandeur_piece_identite: '', motif_demande: '', observations: '',
          montant_paye: '', reference_paiement: ''
        });
        setSelectedActe(null);
        setSearchResults([]);
        setSearchTerm('');
      } else {
        setMessage(`❌ Erreur : ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      
      // ✅ Gestion des erreurs spécifiques (401 = session expirée)
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        setMessage(`❌ Erreur : ${error.message || 'Impossible d\'enregistrer la demande'}`);
      }
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // =====================================================
  // PAGINATION (INCHANGÉ)
  // =====================================================
  const filteredResults = searchResults.filter(acte => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      acte.numero_acte?.toLowerCase().includes(search) ||
      acte.nom?.toLowerCase().includes(search) ||
      acte.prenoms?.toLowerCase().includes(search) ||
      acte.epoux_nom?.toLowerCase().includes(search) ||
      acte.epouse_nom?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

  // =====================================================
  // RENDU (INCHANGÉ - UI PARFAITE)
  // =====================================================
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
        
        {/* EN-TÊTE */}
        <div style={{
          background: 'linear-gradient(135deg, #9f7aea, #805ad5)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: '0', fontSize: '1.8em' }}>
              📋 Demande de Copie / Duplicata
            </h1>
            <p style={{ margin: '10px 0 0 0', opacity: '0.9' }}>
              Commune Urbaine de Fianarantsoa
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← Retour
            </button>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={{
            background: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
            color: message.startsWith('✅') ? '#155724' : '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 'bold',
            border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        {/* FORMULAIRE */}
        <div>
          {/* ÉTAPE 1: RECHERCHE DE L'ACTE */}
          <div style={{
            background: '#f7fafc',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>
              1. Recherche de l'acte
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type d'acte *
              </label>
              <select
                name="type_acte"
                value={formData.type_acte}
                onChange={(e) => {
                  handleInputChange(e);
                  if (e.target.value) {
                    fetchRecentActes(e.target.value);
                  }
                }}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Sélectionner un type</option>
                <option value="naissance">👶 Naissance</option>
                <option value="mariage">💍 Mariage</option>
                <option value="deces">⚰️ Décès</option>
              </select>
            </div>

            {formData.type_acte && (
              <>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchActe();
                      }
                    }}
                    placeholder="Rechercher par numéro ou nom..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={searchActe}
                    style={{
                      padding: '12px 24px',
                      background: '#9f7aea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🔍 Rechercher
                  </button>
                </div>

                {filteredResults.length > 0 && (
                  <div>
                    <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                      {filteredResults.length} acte(s) trouvé(s)
                    </p>
                    
                    {/* LISTE DES ACTES */}
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}>
                      {paginatedResults.map(acte => (
                        <div
                          key={acte.id}
                          onClick={() => {
                            setSelectedActe(acte);
                            setFormData(prev => ({ ...prev, numero_acte: acte.numero_acte }));
                          }}
                          style={{
                            padding: '15px',
                            borderBottom: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            background: selectedActe?.id === acte.id ? '#e6f7ff' : 'white',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedActe?.id !== acte.id) {
                              e.currentTarget.style.background = '#f7fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedActe?.id !== acte.id) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#9f7aea' }}>
                            {acte.numero_acte}
                          </div>
                          <div style={{ fontSize: '0.95em', color: '#2d3748' }}>
                            {acte.nom || acte.epoux_nom} {acte.prenoms || acte.epoux_prenoms}
                            {acte.epouse_nom && ` & ${acte.epouse_nom} ${acte.epouse_prenoms}`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '15px',
                        alignItems: 'center'
                      }}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: '8px 16px',
                            background: currentPage === 1 ? '#e2e8f0' : '#9f7aea',
                            color: currentPage === 1 ? '#a0aec0' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ← Précédent
                        </button>
                        
                        <span style={{
                          padding: '8px 16px',
                          fontWeight: 'bold',
                          color: '#2d3748'
                        }}>
                          Page {currentPage} / {totalPages}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '8px 16px',
                            background: currentPage === totalPages ? '#e2e8f0' : '#9f7aea',
                            color: currentPage === totalPages ? '#a0aec0' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Suivant →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedActe && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'white',
                border: '2px solid #9f7aea',
                borderRadius: '8px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#9f7aea' }}>
                  ✓ Acte sélectionné
                </h4>
                <p style={{ margin: '5px 0' }}>
                  <strong>Numéro:</strong> {selectedActe.numero_acte}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Type:</strong> {formData.type_acte}
                </p>
                {(selectedActe.nom || selectedActe.epoux_nom) && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Nom:</strong> {selectedActe.nom || selectedActe.epoux_nom} {selectedActe.prenoms || selectedActe.epoux_prenoms}
                  </p>
                )}
              </div>
            )}
          </div>
          {/* ÉTAPE 2: TYPE DE COPIE */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>
              2. Type de copie demandée
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <label style={{
                padding: '20px',
                border: formData.type_copie === 'premiere_copie' ? '2px solid #9f7aea' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: formData.type_copie === 'premiere_copie' ? '#f7fafc' : 'white',
                transition: 'all 0.3s'
              }}>
                <input
                  type="radio"
                  name="type_copie"
                  value="premiere_copie"
                  checked={formData.type_copie === 'premiere_copie'}
                  onChange={handleInputChange}
                  style={{ marginRight: '10px' }}
                />
                <strong>Première copie</strong>
                <p style={{ margin: '5px 0 0 25px', color: '#718096', fontSize: '0.9em' }}>
                  Première demande de copie de cet acte
                </p>
              </label>
              
              <label style={{
                padding: '20px',
                border: formData.type_copie === 'duplicata' ? '2px solid #9f7aea' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: formData.type_copie === 'duplicata' ? '#f7fafc' : 'white',
                transition: 'all 0.3s'
              }}>
                <input
                  type="radio"
                  name="type_copie"
                  value="duplicata"
                  checked={formData.type_copie === 'duplicata'}
                  onChange={handleInputChange}
                  style={{ marginRight: '10px' }}
                />
                <strong>Duplicata</strong>
                <p style={{ margin: '5px 0 0 25px', color: '#718096', fontSize: '0.9em' }}>
                  Nouvelle copie (perte, détérioration, etc.)
                </p>
              </label>
            </div>
          </div>

          {/* ÉTAPE 3: INFORMATIONS DU DEMANDEUR */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>
              3. Informations du demandeur
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nom *
                </label>
                <input
                  type="text"
                  name="demandeur_nom"
                  value={formData.demandeur_nom}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Prénoms *
                </label>
                <input
                  type="text"
                  name="demandeur_prenoms"
                  value={formData.demandeur_prenoms}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Qualité *
                </label>
                <select
                  name="demandeur_qualite"
                  value={formData.demandeur_qualite}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Sélectionner</option>
                  <option value="Intéressé">Intéressé(e)</option>
                  <option value="Père">Père</option>
                  <option value="Mère">Mère</option>
                  <option value="Enfant">Enfant</option>
                  <option value="Conjoint">Conjoint(e)</option>
                  <option value="Représentant légal">Représentant légal</option>
                  <option value="Mandataire">Mandataire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Pièce d'identité
                </label>
                <input
                  type="text"
                  name="demandeur_piece_identite"
                  value={formData.demandeur_piece_identite}
                  onChange={handleInputChange}
                  placeholder="CIN, Passeport..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Motif de la demande
              </label>
              <input
                type="text"
                name="motif_demande"
                value={formData.motif_demande}
                onChange={handleInputChange}
                placeholder="Ex: Mariage, Scolarité, Voyage..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Observations
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* ÉTAPE 4: PAIEMENT */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>
              4. Paiement
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Montant payé (Ar)
                </label>
                <input
                  type="number"
                  name="montant_paye"
                  value={formData.montant_paye}
                  onChange={handleInputChange}
                  placeholder="Ex: 5000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Référence de paiement
                </label>
                <input
                  type="text"
                  name="reference_paiement"
                  value={formData.reference_paiement}
                  onChange={handleInputChange}
                  placeholder="Numéro de reçu"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* BOUTON DE SOUMISSION */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '15px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedActe || !formData.type_copie}
              style={{
                padding: '14px 28px',
                background: (loading || !selectedActe || !formData.type_copie) ? '#a0aec0' : '#9f7aea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: (loading || !selectedActe || !formData.type_copie) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.3s'
              }}
            >
              {loading ? '⏳ Enregistrement...' : '✅ Enregistrer la demande'}
            </button>
          </div>

          {/* AIDE */}
          {!selectedActe && formData.type_acte && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              color: '#856404'
            }}>
              <strong>💡 Astuce :</strong> Utilisez la barre de recherche pour trouver rapidement un acte par son numéro ou le nom de la personne. Vous pouvez naviguer entre les pages avec les boutons Précédent/Suivant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CopyRequestForm;