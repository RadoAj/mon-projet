// frontend/src/components/UserManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../contexts/AuthContext';
interface User {
  id: number;
  nom: string;
  prenoms: string;
  email: string;
  role: 'admin' | 'agent';
  actif: boolean;
  date_creation?: string;
  derniere_connexion?: string;
}

interface UserManagementProps {
  onBack: () => void;
}

const THEME = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F9FAFB',
  border: '#E5E7EB'
};

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    email: '',
    mot_de_passe: '',
    role: 'agent' as 'agent' | 'admin',
    actif: true
  });

  // Charger les utilisateurs
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement utilisateurs:', error);
      if (error.message.includes('401') || error.message.includes('Session expirée')) {
        alert('⚠️ Session expirée. Veuillez vous reconnecter.');
      } else {
        alert('❌ Erreur lors du chargement des utilisateurs');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Ouvrir modal ajout
  const handleAdd = (role: 'agent' | 'admin') => {
    setModalMode('add');
    setFormData({
      nom: '',
      prenoms: '',
      email: '',
      mot_de_passe: '',
      role: role,
      actif: true
    });
    setShowModal(true);
  };

  // Ouvrir modal édition
  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      nom: user.nom,
      prenoms: user.prenoms,
      email: user.email,
      mot_de_passe: '', // Vide par défaut (optionnel)
      role: user.role,
      actif: user.actif
    });
    setShowModal(true);
  };

  // Sauvegarder
  const handleSave = async () => {
    // Validation
    if (!formData.nom || !formData.prenoms || !formData.email) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (modalMode === 'add' && !formData.mot_de_passe) {
      alert('❌ Le mot de passe est obligatoire pour la création');
      return;
    }

    if (formData.mot_de_passe && formData.mot_de_passe.length < 6) {
      alert('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      if (modalMode === 'add') {
        const response = await createUser(formData);
        if (response.success) {
          alert(`✅ ${formData.role === 'admin' ? 'Administrateur' : 'Agent'} créé avec succès`);
          fetchUsers();
          setShowModal(false);
        }
      } else if (modalMode === 'edit' && selectedUser) {
        // ✅ Envoyer le mot de passe seulement s'il est rempli
        const updateData: any = {
          nom: formData.nom,
          prenoms: formData.prenoms,
          email: formData.email,
          actif: formData.actif
        };
        
        if (formData.mot_de_passe) {
          updateData.mot_de_passe = formData.mot_de_passe;
        }

        const response = await updateUser(selectedUser.id, updateData);
        if (response.success) {
          alert('✅ Utilisateur modifié avec succès');
          fetchUsers();
          setShowModal(false);
        }
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      alert(`❌ Erreur : ${error.message}`);
    }
  };

  // Désactiver/Réactiver
  const handleToggleStatus = async (user: User) => {
    const action = user.actif ? 'désactiver' : 'réactiver';
    if (!window.confirm(`⚠️ Confirmer la ${action}ion de ${user.prenoms} ${user.nom} ?`)) {
      return;
    }

    try {
      const response = await updateUser(user.id, {
        ...user,
        actif: !user.actif
      });
      if (response.success) {
        alert(`✅ Utilisateur ${action}é avec succès`);
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Erreur toggle status:', error);
      alert(`❌ Erreur : ${error.message}`);
    }
  };

  // ✅ Supprimer définitivement
  const handleDelete = async (user: User) => {
    if (!window.confirm(`⚠️ ATTENTION : Supprimer définitivement ${user.prenoms} ${user.nom} ?\n\n⚠️ Cette action est IRRÉVERSIBLE !\n\nTous les actes créés par cet utilisateur resteront en base mais sans lien vers son compte.`)) {
      return;
    }

    // Double confirmation
    if (!window.confirm(`⚠️ CONFIRMATION FINALE\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer définitivement ce compte ?\n\n${user.email}`)) {
      return;
    }

    try {
      const response = await deleteUser(user.id);
      if (response.success) {
        alert('✅ Utilisateur supprimé définitivement');
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      alert(`❌ Erreur : ${error.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: THEME.background, padding: '30px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#111827' }}>
                👥 Gestion des Utilisateurs
              </h1>
              <p style={{ margin: 0, color: '#6B7280' }}>
                Administrez les comptes du système
              </p>
            </div>
            <button
              onClick={onBack}
              style={{
                padding: '10px 20px',
                background: '#F3F4F6',
                border: '1px solid ' + THEME.border,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              ← Retour
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, color: '#6B7280' }}>
            <strong>{users.length}</strong> utilisateur(s) enregistré(s)
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#F3F4F6',
                border: '1px solid ' + THEME.border,
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔄 Actualiser
            </button>
            {/* ✅ Bouton Ajouter Admin */}
            <button
              onClick={() => handleAdd('admin')}
              style={{
                padding: '10px 20px',
                background: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              👑 Ajouter un Admin
            </button>
            {/* ✅ Bouton Ajouter Agent */}
            <button
              onClick={() => handleAdd('agent')}
              style={{
                padding: '10px 20px',
                background: THEME.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              + Ajouter un Agent
            </button>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
            ⏳ Chargement...
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid ' + THEME.border }}>
                    Nom & Prénoms
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid ' + THEME.border }}>
                    Email
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid ' + THEME.border }}>
                    Rôle
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid ' + THEME.border }}>
                    Statut
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid ' + THEME.border }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid ' + THEME.border }}>
                    <td style={{ padding: '15px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>
                           {user.nom} {user.prenoms}
                        </p>
                        {user.date_creation && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                            Créé le {new Date(user.date_creation).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#374151' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.role === 'admin' ? '#F3E8FF' : '#DBEAFE',
                        color: user.role === 'admin' ? '#7C3AED' : '#1E40AF'
                      }}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Agent'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.actif ? '#D1FAE5' : '#FEE2E2',
                        color: user.actif ? '#065F46' : '#991B1B'
                      }}>
                        {user.actif ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={{
                            padding: '6px 12px',
                            background: THEME.warning,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          style={{
                            padding: '6px 12px',
                            background: user.actif ? THEME.warning : THEME.success,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title={user.actif ? 'Désactiver' : 'Réactiver'}
                        >
                          {user.actif ? '🔒' : '🔓'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          style={{
                            padding: '6px 12px',
                            background: THEME.danger,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Supprimer définitivement"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ajout/Édition */}
      {showModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>
              {modalMode === 'add' 
                ? (formData.role === 'admin' ? '👑 Ajouter un Admin' : '➕ Ajouter un Agent')
                : '✏️ Modifier l\'Utilisateur'}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid ' + THEME.border,
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="RAKOTO"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Prénoms *
              </label>
              <input
                type="text"
                value={formData.prenoms}
                onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid ' + THEME.border,
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Jean"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid ' + THEME.border,
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="agent@fianarantsoa.mg"
                disabled={modalMode === 'edit'}
              />
            </div>

            {/* ✅ Mot de passe (obligatoire en création, optionnel en édition) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Mot de passe {modalMode === 'add' ? '*' : '(optionnel - laisser vide pour ne pas changer)'}
              </label>
              <input
                type="password"
                value={formData.mot_de_passe}
                onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid ' + THEME.border,
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder={modalMode === 'add' ? 'Minimum 6 caractères' : 'Nouveau mot de passe (min. 6 caractères)'}
              />
              {modalMode === 'edit' && (
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                  💡 Laissez vide pour conserver le mot de passe actuel
                </p>
              )}
            </div>

            {/* ✅ Afficher le rôle en création */}
            {modalMode === 'add' && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: formData.role === 'admin' ? '#F3E8FF' : '#DBEAFE',
                borderRadius: '8px' 
              }}>
                <p style={{ margin: 0, fontWeight: '600', color: formData.role === 'admin' ? '#7C3AED' : '#1E40AF' }}>
                  {formData.role === 'admin' ? '👑 Rôle : Administrateur' : '👤 Rôle : Agent'}
                </p>
              </div>
            )}

            {modalMode === 'edit' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: '500' }}>Compte actif</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: THEME.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                💾 Enregistrer
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid ' + THEME.border,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;