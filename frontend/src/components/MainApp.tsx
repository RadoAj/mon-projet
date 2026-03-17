// frontend/src/components/MainApp.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Imports de tes composants existants
import Dashboard from './Dashboard';
import BirthRegistrationForm from './BirthRegistrationForm';
import SearchPage from './SearchPage';
import MarriageRegistrationForm from './MarriageRegistrationForm';
import DeathRegistrationForm from './DeathRegistrationForm';
import CopyRequestForm from './CopyRequestForm';
import CopyManagement from './CopyManagement';
import UserManagement from './UserManagement'; // ✅ NOUVEAU COMPOSANT

// ✅ Ajout du type 'users'
type CurrentPage = 'dashboard' | 'birth-form' | 'marriage-form' | 'death-form' | 'search' | 'copies' | 'copy-management' | 'users';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('dashboard');
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'birth-form':
        return <BirthRegistrationForm onBack={() => setCurrentPage('dashboard')} />;
      case 'marriage-form':
        return <MarriageRegistrationForm onBack={() => setCurrentPage('dashboard')} />;
      case 'death-form':
        return <DeathRegistrationForm onBack={() => setCurrentPage('dashboard')} />;
      case 'search':
        return <SearchPage onBack={() => setCurrentPage('dashboard')} />;
      case 'copies':
        return <CopyRequestForm onBack={() => setCurrentPage('dashboard')} />;
      case 'copy-management':
        return <CopyManagement onBack={() => setCurrentPage('dashboard')} />;
      case 'users':
        return <UserManagement onBack={() => setCurrentPage('dashboard')} />; // ✅ NOUVELLE PAGE
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* ✅ HEADER AVEC DÉCONNEXION ET GESTION UTILISATEURS */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          {/* Logo et titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#4F46E5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                État Civil
              </h1>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Fianarantsoa
              </p>
            </div>
          </div>

          {/* Infos utilisateur et actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <>
                {/* Infos utilisateur */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                    {user.prenoms} {user.nom}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    {user.email}
                  </p>
                </div>

                {/* Badge rôle */}
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: isAdmin ? '#F3E8FF' : '#DBEAFE',
                  color: isAdmin ? '#7C3AED' : '#1E40AF'
                }}>
                  {isAdmin ? '👑 Admin' : '👤 Agent'}
                </span>

                {/* ✅ BOUTON GESTION UTILISATEURS (Admin uniquement) */}
                {isAdmin && (
                  <button
                    onClick={() => setCurrentPage('users')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: currentPage === 'users' ? '#EEF2FF' : '#F9FAFB',
                      color: '#4F46E5',
                      border: '1px solid #C7D2FE',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== 'users') {
                        e.currentTarget.style.background = '#EEF2FF';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== 'users') {
                        e.currentTarget.style.background = '#F9FAFB';
                      }
                    }}
                    title="Gérer les utilisateurs"
                  >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Utilisateurs
                  </button>
                )}

                {/* Bouton déconnexion */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#FEE2E2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#FEF2F2';
                  }}
                  title="Se déconnecter"
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ✅ CONTENU PRINCIPAL (ton système existant + nouvelle page users) */}
      <div>
        {renderCurrentPage()}
      </div>
    </div>
  );
};

export default MainApp;