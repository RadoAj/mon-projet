import React, { useState, useEffect, useCallback } from 'react';
// ✅ AJOUT : Imports API avec authentification
import { useAuth } from '../contexts/AuthContext';
import { getMentions, createMention, deleteMention } from '../utils/api';

interface Mention {
  id: number;
  numero_mention: string;
  date_mention: string;
  type_mention: string;
  contenu: string;
  reference_acte?: string;
  user_nom?: string;
  user_prenoms?: string;
}

interface MentionsManagerProps {
  typeActe: 'naissance' | 'mariage' | 'deces';
  acteId: number;
  numeroActe: string;
  readOnly?: boolean;
}

const MentionsManager: React.FC<MentionsManagerProps> = ({ 
  typeActe, 
  acteId, 
  numeroActe,
  readOnly = false 
}) => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMention, setNewMention] = useState({
    type_mention: '',
    contenu: '',
    reference_acte: ''
  });

  // ✅ AJOUT : Hook pour logout sur 401
  const { logout } = useAuth();

  // ✅ MODIFICATION : fetchMentions avec API.TS + useCallback
  const fetchMentions = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Utiliser getMentions depuis api.ts
      const data = await getMentions(typeActe, acteId);
      
      if (data.success) {
        setMentions(data.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement mentions:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [typeActe, acteId, logout]);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  // ✅ MODIFICATION : handleAddMention avec API.TS (SANS user_id)
  const handleAddMention = async () => {
    if (!newMention.type_mention || !newMention.contenu) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // ✅ Préparer le payload SANS user_id (géré par le token)
      const payload = {
        type_acte: typeActe,
        acte_id: acteId,
        numero_acte_concerne: numeroActe,
        ...newMention
        // ✅ user_id supprimé - récupéré depuis req.user.id côté backend
      };

      // ✅ Utiliser createMention depuis api.ts
      const data = await createMention(payload);
      
      if (data.success) {
        alert('✅ Mention ajoutée avec succès !');
        setNewMention({ type_mention: '', contenu: '', reference_acte: '' });
        setShowAddForm(false);
        fetchMentions();
      } else {
        alert(`❌ Erreur : ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur ajout mention:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert('Erreur lors de l\'ajout de la mention');
      }
    }
  };

  // ✅ MODIFICATION : handleDeleteMention avec API.TS
  const handleDeleteMention = async (mentionId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette mention ?')) {
      return;
    }

    try {
      // ✅ Utiliser deleteMention depuis api.ts
      const data = await deleteMention(mentionId);
      
      if (data.success) {
        alert('✅ Mention supprimée avec succès');
        fetchMentions();
      } else {
        alert(`❌ Erreur : ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur suppression mention:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token')) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        logout();
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getMentionColor = (type: string) => {
    switch (type) {
      case 'mariage': return '#ed8936';
      case 'deces': return '#718096';
      case 'divorce': return '#e53e3e';
      case 'adoption': return '#9f7aea';
      case 'reconnaissance': return '#48bb78';
      case 'rectification': return '#4299e1';
      default: return '#a0aec0';
    }
  };

  return (
    <div style={{
      background: '#f7fafc',
      padding: '25px',
      borderRadius: '12px',
      marginTop: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#2d3748' }}>
          📝 Mentions en marge ({mentions.length})
        </h3>
        
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              background: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {showAddForm ? '✕ Annuler' : '+ Ajouter une mention'}
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && !readOnly && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #48bb78'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
            Nouvelle mention
          </h4>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type de mention *
              </label>
              <select
                value={newMention.type_mention}
                onChange={(e) => setNewMention({ ...newMention, type_mention: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              >
                <option value="">Sélectionner un type</option>
                <option value="mariage">Mariage</option>
                <option value="divorce">Divorce</option>
                <option value="deces">Décès</option>
                <option value="adoption">Adoption</option>
                <option value="reconnaissance">Reconnaissance</option>
                <option value="rectification">Rectification</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Contenu de la mention *
              </label>
              <textarea
                value={newMention.contenu}
                onChange={(e) => setNewMention({ ...newMention, contenu: e.target.value })}
                rows={4}
                placeholder="Ex: Marié(e) le 15/10/2025 avec RAKOTO Jean. Acte de mariage M2025-0001."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Référence de l'acte (optionnel)
              </label>
              <input
                type="text"
                value={newMention.reference_acte}
                onChange={(e) => setNewMention({ ...newMention, reference_acte: e.target.value })}
                placeholder="Ex: M2025-0001"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '10px 20px',
                  background: '#cbd5e0',
                  color: '#2d3748',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAddMention}
                style={{
                  padding: '10px 20px',
                  background: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Enregistrer la mention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des mentions */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
          Chargement des mentions...
        </div>
      ) : mentions.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#718096'
        }}>
          <p style={{ margin: 0 }}>Aucune mention en marge pour cet acte</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {mentions.map((mention) => (
            <div
              key={mention.id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${getMentionColor(mention.type_mention)}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{
                    background: getMentionColor(mention.type_mention),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {mention.type_mention}
                  </span>
                  <span style={{ color: '#718096', fontSize: '0.9em' }}>
                    {mention.numero_mention}
                  </span>
                  <span style={{ color: '#a0aec0', fontSize: '0.85em' }}>
                    • {new Date(mention.date_mention).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {!readOnly && (
                  <button
                    onClick={() => handleDeleteMention(mention.id)}
                    style={{
                      background: '#fed7d7',
                      color: '#c53030',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85em'
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <p style={{
                margin: '0 0 10px 0',
                color: '#2d3748',
                lineHeight: '1.6'
              }}>
                {mention.contenu}
              </p>

              {mention.reference_acte && (
                <p style={{
                  margin: '0',
                  color: '#718096',
                  fontSize: '0.9em'
                }}>
                  <strong>Référence :</strong> {mention.reference_acte}
                </p>
              )}

              {mention.user_nom && (
                <p style={{
                  margin: '5px 0 0 0',
                  color: '#a0aec0',
                  fontSize: '0.85em',
                  fontStyle: 'italic'
                }}>
                  Ajouté par {mention.user_nom} {mention.user_prenoms}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionsManager;