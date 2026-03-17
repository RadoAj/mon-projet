import React, { useState, useEffect, useCallback } from 'react';
// ✅ AJOUT : Imports API avec authentification
import { useAuth } from '../contexts/AuthContext';
import { getCopies, deliverCopie, deleteCopie } from '../utils/api';

// =====================================================
// INTERFACES
// =====================================================
interface CopyDemand {
  id: number;
  numero_copie: string;
  type_acte: 'naissance' | 'mariage' | 'deces';
  acte_id: number;
  numero_acte: string;
  type_copie: 'premiere_copie' | 'duplicata';
  demandeur_nom: string;
  demandeur_prenoms: string;
  demandeur_qualite: string;
  demandeur_piece_identite?: string;
  date_demande: string;
  date_delivrance?: string;
  motif_demande?: string;
  observations?: string;
  montant_paye?: number;
  reference_paiement?: string;
  statut: 'en_attente' | 'delivree';
  delivre_par?: string;
  user_id?: number;
  date_creation: string;
}

interface CopyManagementProps {
  onBack?: () => void;
}

// =====================================================
// THÈME
// =====================================================
const THEME = {
  primary: '#9f7aea',
  primaryDark: '#805ad5',
  success: '#48bb78',
  warning: '#ed8936',
  danger: '#e53e3e',
  info: '#4299e1',
  background: '#f7fafc',
  cardBg: '#ffffff',
  text: '#2d3748',
  border: '#e2e8f0',
  shadow: '0 4px 6px rgba(0,0,0,0.07)'
};

// =====================================================
// COMPOSANT PRINCIPAL
// =====================================================
const CopyManagement: React.FC<CopyManagementProps> = ({ onBack }) => {
  const [demandes, setDemandes] = useState<CopyDemand[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'en_attente' | 'delivree'>('tous');
  const [filtreTypeActe, setFiltreTypeActe] = useState<'tous' | 'naissance' | 'mariage' | 'deces'>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string>('');
  const [selectedDemande, setSelectedDemande] = useState<CopyDemand | null>(null);

  // ✅ AJOUT : Hook pour logout sur 401
  const { logout } = useAuth();

  // ✅ MODIFICATION : CHARGEMENT DES DEMANDES AVEC API.TS + useCallback
  // =====================================================
  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      // ✅ Utiliser getCopies depuis api.ts
      const data = await getCopies();
      
      if (data.success) {
        setDemandes(data.data);
        if (data.data.length === 0) {
          setMessage('ℹ️ Aucune demande de copie enregistrée pour le moment');
        }
      } else {
        setMessage('❌ Erreur lors du chargement des demandes');
      }
    } catch (error: any) {
      console.error('Erreur chargement demandes:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        setMessage('❌ Impossible de charger les demandes. Vérifiez que le serveur backend est démarré.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]); // ✅ Dépendance ajoutée

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]); // ✅ Dépendance ajoutée

  // =====================================================
  // FILTRAGE DES DEMANDES (INCHANGÉ)
  // =====================================================
  const demandesFiltrees = demandes.filter(demande => {
    if (filtreStatut !== 'tous' && demande.statut !== filtreStatut) {
      return false;
    }
    
    if (filtreTypeActe !== 'tous' && demande.type_acte !== filtreTypeActe) {
      return false;
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        demande.numero_copie.toLowerCase().includes(search) ||
        demande.numero_acte.toLowerCase().includes(search) ||
        demande.demandeur_nom.toLowerCase().includes(search) ||
        demande.demandeur_prenoms.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // ✅ MODIFICATION : DÉLIVRER UNE COPIE AVEC API.TS
  // =====================================================
  const handleDelivrer = async (demande: CopyDemand) => {
    if (!window.confirm(`Confirmer la délivrance de la copie ${demande.numero_copie} ?`)) {
      return;
    }

    const delivrePar = prompt('Votre nom complet (agent délivrant) :');
    if (!delivrePar || delivrePar.trim() === '') {
      alert('❌ Le nom de l\'agent est obligatoire');
      return;
    }

    try {
      // ✅ Utiliser deliverCopie depuis api.ts (pas delivre_par dans body)
      const data = await deliverCopie(demande.id, delivrePar.trim());
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la délivrance');
      }

      await genererPDF(demande);
      setMessage(`✅ Copie ${demande.numero_copie} délivrée avec succès !`);
      fetchDemandes();
      
    } catch (error: any) {
      console.error('Erreur délivrance:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert(`❌ Erreur : ${error.message}`);
      }
    }
  };

  // =====================================================
  // GÉNÉRER LE PDF (INCHANGÉ - Requiert route spécifique)
  // =====================================================
  const genererPDF = async (demande: CopyDemand) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://mon-projet-upde.onrender.com/api/pdf/copie', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type_acte: demande.type_acte,
          acte_id: demande.acte_id,
          demandeur_nom: demande.demandeur_nom,
          demandeur_prenoms: demande.demandeur_prenoms,
          type_copie: demande.type_copie
        })
      });

      if (!response.ok) {
        throw new Error('Erreur génération PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${demande.type_copie}_${demande.numero_acte}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      
      // ✅ Gestion erreur 401 pour PDF
      if (error.message.includes('401') || error.message.includes('token')) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert('⚠️ Copie délivrée mais erreur lors de la génération du PDF');
      }
    }
  };

  // ✅ MODIFICATION : SUPPRIMER UNE DEMANDE AVEC API.TS
  // =====================================================
  const handleSupprimer = async (demande: CopyDemand) => {
    if (!window.confirm(`⚠️ Êtes-vous sûr de vouloir supprimer la demande ${demande.numero_copie} ?\n\nCette action est irréversible !`)) {
      return;
    }

    try {
      // ✅ Utiliser deleteCopie depuis api.ts
      const data = await deleteCopie(demande.id);
      
      if (data.success) {
        setMessage(`✅ Demande ${demande.numero_copie} supprimée avec succès`);
        fetchDemandes();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert(`❌ Erreur : ${error.message}`);
      }
    }
  };

  // =====================================================
  // STATISTIQUES (INCHANGÉ)
  // =====================================================
  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    delivrees: demandes.filter(d => d.statut === 'delivree').length,
    premiere_copie: demandes.filter(d => d.type_copie === 'premiere_copie').length,
    duplicata: demandes.filter(d => d.type_copie === 'duplicata').length
  };
  
  // =====================================================
  // RENDU (INCHANGÉ - UI PARFAITE)
  // =====================================================
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: THEME.cardBg,
        padding: '30px',
        borderRadius: '12px',
        boxShadow: THEME.shadow
      }}>
        
        {/* EN-TÊTE */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
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
              📋 Gestion des Copies et Duplicata
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
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
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← Retour au Dashboard
            </button>
          )}
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={{
            background: message.startsWith('✅') ? '#d4edda' : message.startsWith('ℹ️') ? '#d1ecf1' : '#f8d7da',
            color: message.startsWith('✅') ? '#155724' : message.startsWith('ℹ️') ? '#0c5460' : '#721c24',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '25px',
            fontWeight: 'bold',
            border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : message.startsWith('ℹ️') ? '#bee5eb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        {/* STATISTIQUES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: THEME.info + '1A',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${THEME.info}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: THEME.info }}>
              {stats.total}
            </div>
            <div style={{ color: THEME.text, fontWeight: '600' }}>Total demandes</div>
          </div>

          <div style={{
            background: THEME.warning + '1A',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${THEME.warning}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: THEME.warning }}>
              {stats.en_attente}
            </div>
            <div style={{ color: THEME.text, fontWeight: '600' }}>En attente</div>
          </div>

          <div style={{
            background: THEME.success + '1A',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${THEME.success}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: THEME.success }}>
              {stats.delivrees}
            </div>
            <div style={{ color: THEME.text, fontWeight: '600' }}>Délivrées</div>
          </div>

          <div style={{
            background: THEME.primary + '1A',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${THEME.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: THEME.primary, marginBottom: '5px' }}>
              1ère copie: {stats.premiere_copie}
            </div>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: THEME.primaryDark }}>
              Duplicata: {stats.duplicata}
            </div>
          </div>
        </div>

        {/* FILTRES */}
        <div style={{
          background: THEME.background,
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: THEME.text }}>
            🔍 Filtres et Recherche
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Statut
              </label>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">⏳ En attente</option>
                <option value="delivree">✅ Délivrées</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type d'acte
              </label>
              <select
                value={filtreTypeActe}
                onChange={(e) => setFiltreTypeActe(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="tous">Tous les types</option>
                <option value="naissance">👶 Naissance</option>
                <option value="mariage">💍 Mariage</option>
                <option value="deces">⚰️ Décès</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° copie, N° acte, nom..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{
            marginTop: '15px',
            color: THEME.text,
            fontSize: '0.95em',
            textAlign: 'right'
          }}>
            <strong>{demandesFiltrees.length}</strong> résultat(s) affiché(s)
          </div>
        </div>

        {/* TABLE DES DEMANDES */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '50px',
            color: THEME.text,
            fontSize: '1.2em'
          }}>
            ⏳ Chargement des demandes...
          </div>
        ) : demandesFiltrees.length === 0 ? (
          <div style={{
            background: THEME.background,
            padding: '50px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#718096'
          }}>
            <p style={{ margin: 0, fontSize: '1.2em' }}>
              {demandes.length === 0 
                ? 'Aucune demande enregistrée. Créez des demandes via "Demande de Copie".' 
                : 'Aucune demande ne correspond aux critères'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ background: THEME.primary, color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>N° Copie</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>N° Acte</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Demandeur</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Date demande</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Statut</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandesFiltrees.map((demande, index) => (
                  <tr
                    key={demande.id}
                    style={{
                      borderBottom: `1px solid ${THEME.border}`,
                      background: index % 2 === 0 ? 'white' : THEME.background,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4f8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : THEME.background}
                  >
                    <td style={{ padding: '15px', fontWeight: 'bold', color: THEME.primary }}>
                      {demande.numero_copie}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        background: demande.type_copie === 'premiere_copie' ? THEME.success + '1A' : THEME.info + '1A',
                        color: demande.type_copie === 'premiere_copie' ? THEME.success : THEME.info,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.85em',
                        fontWeight: 'bold'
                      }}>
                        {demande.type_copie === 'premiere_copie' ? '1ère copie' : 'Duplicata'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '1.2em' }}>
                          {demande.type_acte === 'naissance' ? '👶' : 
                           demande.type_acte === 'mariage' ? '💍' : '⚰️'}
                        </span>
                        {demande.numero_acte}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {demande.demandeur_nom} {demande.demandeur_prenoms}
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#718096' }}>
                          {demande.demandeur_qualite}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px', fontSize: '0.9em' }}>
                      {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {demande.statut === 'en_attente' ? (
                        <span style={{
                          background: THEME.warning + '1A',
                          color: THEME.warning,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}>
                          ⏳ En attente
                        </span>
                      ) : (
                        <span style={{
                          background: THEME.success + '1A',
                          color: THEME.success,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}>
                          ✅ Délivrée
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedDemande(demande)}
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
                        >
                          👁️ Voir
                        </button>
                        
                        {demande.statut === 'en_attente' && (
                          <button
                            onClick={() => handleDelivrer(demande)}
                            style={{
                              padding: '8px 12px',
                              background: THEME.success,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold'
                            }}
                          >
                            ✅ Délivrer
                          </button>
                        )}
                        
                        {demande.statut === 'delivree' && (
                          <button
                            onClick={() => genererPDF(demande)}
                            style={{
                              padding: '8px 12px',
                              background: THEME.primaryDark,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold'
                            }}
                          >
                            📄 PDF
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSupprimer(demande)}
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
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL DÉTAILS - Suite identique au code original... */}
        {selectedDemande && (
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
            overflow: 'auto'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '700px',
              width: '90%',
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
                  📋 Détails de la demande
                </h2>
                <button
                  onClick={() => setSelectedDemande(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#718096'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                display: 'grid',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '10px 20px',
                  alignItems: 'center'
                }}>
                  <strong>N° Copie:</strong>
                  <span style={{ color: THEME.primary, fontWeight: 'bold', fontSize: '1.1em' }}>
                    {selectedDemande.numero_copie}
                  </span>

                  <strong>Type de copie:</strong>
                  <span style={{
                    background: selectedDemande.type_copie === 'premiere_copie' ? THEME.success + '1A' : THEME.info + '1A',
                    color: selectedDemande.type_copie === 'premiere_copie' ? THEME.success : THEME.info,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    {selectedDemande.type_copie === 'premiere_copie' ? '1ère copie' : 'Duplicata'}
                  </span>

                  <strong>Type d'acte:</strong>
                  <span>{selectedDemande.type_acte}</span>

                  <strong>N° Acte:</strong>
                  <span style={{ fontWeight: 'bold' }}>{selectedDemande.numero_acte}</span>

                  <strong>Demandeur:</strong>
                  <span>{selectedDemande.demandeur_nom} {selectedDemande.demandeur_prenoms}</span>

                  <strong>Qualité:</strong>
                  <span>{selectedDemande.demandeur_qualite}</span>

                  {selectedDemande.demandeur_piece_identite && (
                    <>
                      <strong>Pièce d'identité:</strong>
                      <span>{selectedDemande.demandeur_piece_identite}</span>
                    </>
                  )}

                  <strong>Date demande:</strong>
                  <span>{new Date(selectedDemande.date_demande).toLocaleDateString('fr-FR')}</span>

                  {selectedDemande.motif_demande && (
                    <>
                      <strong>Motif:</strong>
                      <span>{selectedDemande.motif_demande}</span>
                    </>
                  )}

                  {selectedDemande.observations && (
                    <>
                      <strong>Observations:</strong>
                      <span>{selectedDemande.observations}</span>
                    </>
                  )}

                  {selectedDemande.montant_paye && (
                    <>
                      <strong>Montant payé:</strong>
                      <span>{selectedDemande.montant_paye} Ar</span>
                    </>
                  )}

                  {selectedDemande.reference_paiement && (
                    <>
                      <strong>Référence paiement:</strong>
                      <span>{selectedDemande.reference_paiement}</span>
                    </>
                  )}

                  <strong>Statut:</strong>
                  <span>
                    {selectedDemande.statut === 'en_attente' ? (
                      <span style={{
                        background: THEME.warning + '1A',
                        color: THEME.warning,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        ⏳ En attente
                      </span>
                    ) : (
                      <span style={{
                        background: THEME.success + '1A',
                        color: THEME.success,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}>
                        ✅ Délivrée
                      </span>
                    )}
                  </span>

                  {selectedDemande.date_delivrance && (
                    <>
                      <strong>Date délivrance:</strong>
                      <span>{new Date(selectedDemande.date_delivrance).toLocaleDateString('fr-FR')}</span>
                    </>
                  )}

                  {selectedDemande.delivre_par && (
                    <>
                      <strong>Délivré par:</strong>
                      <span style={{ fontWeight: 'bold' }}>{selectedDemande.delivre_par}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: `1px solid ${THEME.border}`
              }}>
                {selectedDemande.statut === 'en_attente' && (
                  <button
                    onClick={() => {
                      handleDelivrer(selectedDemande);
                      setSelectedDemande(null);
                    }}
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
                  >
                    ✅ Délivrer cette copie
                  </button>
                )}

                {selectedDemande.statut === 'delivree' && (
                  <button
                    onClick={() => {
                      genererPDF(selectedDemande);
                      setSelectedDemande(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: THEME.primaryDark,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    📄 Télécharger le PDF
                  </button>
                )}

                <button
                  onClick={() => setSelectedDemande(null)}
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
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyManagement;