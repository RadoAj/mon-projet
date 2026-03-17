import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
// ✅ AJOUT : Imports API avec authentification
import { useAuth } from '../contexts/AuthContext';
import { getStats } from '../utils/api';

// Définition des pages possibles
type CurrentPage = 'dashboard' | 'birth-form' | 'marriage-form' | 'death-form' | 'search' | 'copies' | 'copy-management' | 'users';

// Props corrigées pour accepter setCurrentPage
type DashboardProps = {
  onNavigate: React.Dispatch<React.SetStateAction<CurrentPage>>;
};

// ===============================================
// I. SYSTÈME DE DESIGN (Styles centralisés)
// ===============================================

const THEME = {
  primary: '#2A69AC', 
  primaryLight: '#4B88D0',
  background: '#F7F9FC', 
  cardBg: '#FFFFFF',
  text: '#2D3748', 
  sidebarBg: '#FFFFFF', 
  shadowLight: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  iconColor: '#718096',
};

const SIDEBAR_WIDTH_OPEN = '250px';
const SIDEBAR_WIDTH_CLOSED = '80px'; 

const getSidebarStyle = (isOpen: boolean): CSSProperties => ({
    width: isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
    background: THEME.sidebarBg,
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    transition: 'width 0.3s ease-in-out',
    padding: '20px 0',
    flexShrink: 0,
    overflowX: 'hidden',
    position: 'sticky',
    top: 0,
    height: '100vh',
});

const getToggleButtonStyle = (isOpen: boolean): CSSProperties => ({
    background: 'none', 
    border: 'none', 
    padding: isOpen ? '10px 20px' : '10px',
    textAlign: isOpen ? 'right' : 'center',
    cursor: 'pointer', 
    marginBottom: '20px',
    width: '100%',
    color: THEME.iconColor,
    transition: 'color 0.2s',
    outline: 'none',
});

const STYLES: { [key: string]: CSSProperties } = {
  mainLayout: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
    background: THEME.background,
  },
  contentWrapper: {
    flexGrow: 1, 
    padding: '30px',
    maxWidth: 'calc(100vw - 80px)',
    margin: '0 auto',
  },
  header: {
    background: THEME.primary,
    color: THEME.cardBg,
    padding: '35px 45px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: THEME.shadowLight,
    textAlign: 'center',
  },
  statusContainer: {
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '25px',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    fontWeight: '600',
    fontSize: '1em',
    border: '1px solid',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '25px',
    marginBottom: '40px',
  },
  statCardBase: {
    background: THEME.cardBg,
    padding: '30px',
    borderRadius: '12px',
    boxShadow: THEME.shadowLight,
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'default', 
    borderLeft: '4px solid transparent',
  },
};

// ===============================================
// II. COMPOSANTS ENFANTS
// ===============================================

const StatCard: React.FC<{ icon: string, value: number, label: string, color: string }> = ({ icon, value, label, color }) => (
  <div 
    style={{ 
      ...STYLES.statCardBase, 
      borderLeftColor: color,
      boxShadow: `0 0 0 1px ${color}1A, ${THEME.shadowLight}`,
      padding: '25px 30px',
    }}
  > 
    <div style={{ fontSize: '3.5em', marginBottom: '10px', color: color }}>{icon}</div>
    <h3 style={{ margin: '0', fontSize: '2.8em', color: THEME.text, fontWeight: '700' }}>
      {value}
    </h3>
    <p style={{ margin: '5px 0 0 0', color: THEME.text, fontWeight: '500', opacity: 0.8 }}>
      {label}
    </p>
  </div>
);

const NavButton: React.FC<{ icon: string, label: string, onClick: () => void, isOpen: boolean }> = ({ icon, label, onClick, isOpen }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        margin: '5px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: 'calc(100% - 20px)',
        color: THEME.text,
        fontWeight: '500',
    };

    const hoverStyle: CSSProperties = isHovered ? {
        background: `${THEME.primaryLight}1A`,
        color: THEME.primary,
        boxShadow: THEME.shadowLight,
    } : {};
    
    return (
        <button 
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ ...baseStyle, ...hoverStyle }}
        >
            <span style={{ fontSize: '1.5em', minWidth: '30px', marginRight: isOpen ? '15px' : '0' }}>{icon}</span>
            {isOpen && <span>{label}</span>}
        </button>
    );
};

// ===============================================
// III. COMPOSANT PRINCIPAL (Dashboard)
// ===============================================

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    personnes: 0,
    naissances: 0,
    mariages: 0,
    deces: 0,
    copies_delivrees: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState('En test...');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  // ✅ AJOUT : Hook pour logout sur 401
  const { logout } = useAuth();
  
  // ✅ MODIFICATION : Couleurs adaptées aux nouvelles stats
  const STAT_COLORS = {
    Naissances: '#48BB78', 
    Mariages: '#ECC94B', 
    Deces: '#90A4AE', 
    Copies: '#9F7AEA', // ✅ Couleur violette pour les copies
  };

  // ✅ MODIFICATION : fetchStats avec gestion d'erreur améliorée
  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      
      if (data.success) {
        setStats(data.data);
        setError(null);
        setServerStatus('Connecté');
      } else {
        setError('Erreur lors de la récupération des statistiques');
        setServerStatus('Erreur API');
      }
    } catch (error: any) {
      console.error('Erreur stats:', error);
      
      // ✅ Gestion erreur 401
      if (error.message.includes('401') || error.message.includes('token') || error.message.includes('Session expirée')) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setServerStatus('Session expirée');
        // Auto-redirection vers login après 2 secondes
        setTimeout(() => {
          logout();
        }, 2000);
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Serveur backend non accessible. Vérifiez que le serveur Node.js tourne sur le port 5000.');
        setServerStatus('Déconnecté');
      } else {
        setError(`Erreur: ${error.message}`);
        setServerStatus('Erreur');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const testServerConnection = useCallback(async () => {
     try {
       console.log('Test de connexion au serveur...');
       const response = await fetch('https://mon-projet-upde.onrender.com');
       
       if (response.ok) {
           setServerStatus('Connexion en cours...');
           fetchStats(); 
       } else {
           throw new Error(`Statut HTTP: ${response.status}`);
       }
     } catch (error) {
       console.error('Erreur de connexion:', error);
       setServerStatus('Déconnecté');
       setError('Serveur backend non accessible. Vérifiez que le serveur Node.js tourne sur le port 5000.');
       setLoading(false);
     }
  }, [fetchStats]);

  useEffect(() => {
    testServerConnection(); 
  }, [testServerConnection]);

  const statusColors = serverStatus === 'Connecté' ? {
    bg: '#EBF4F5', 
    text: STAT_COLORS.Naissances,
    border: '#B2F5EA', 
    icon: '✅',
  } : serverStatus === 'Session expirée' ? {
    bg: '#FEF2F2', 
    text: '#E53E3E',
    border: '#FED7D7', 
    icon: '⚠️',
  } : {
    bg: '#FEF2F2', 
    text: '#E53E3E',
    border: '#FED7D7', 
    icon: '❌',
  };

  return (
    <div style={STYLES.mainLayout}>
      
      {/* 1. SIDEBAR (Navigation Latérale) */}
      <nav style={getSidebarStyle(isSidebarOpen)}> 
        
        {/* BOUTON DE BASCULE PROFESSIONNEL */}
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={getToggleButtonStyle(isSidebarOpen)}
        >
            <span style={{ fontSize: '1.2em' }}>
                {isSidebarOpen ? '«' : '»'}
            </span>
        </button>

        {/* Logo/Titre */}
        <div style={{
            padding: '0 20px', 
            marginBottom: '30px', 
            textAlign: isSidebarOpen ? 'left' : 'center',
        }}>
            <h3 style={{ 
                margin: 0, 
                color: THEME.primary, 
                fontSize: isSidebarOpen ? '1.5em' : '1em',
                fontWeight: '800',
            }}>
                {isSidebarOpen ? 'e-ÉtatCivil' : 'EC'}
            </h3>
            {isSidebarOpen && <p style={{ margin: 0, fontSize: '0.8em', color: THEME.text, opacity: 0.7 }}>Actions</p>}
        </div>

        {/* Liens de navigation */}
        <div style={{ padding: isSidebarOpen ? '0' : '0 5px' }}>
            <NavButton 
                icon="📊" label="Tableau de Bord" onClick={() => onNavigate('dashboard')} isOpen={isSidebarOpen}
            />
            <hr style={{ margin: '15px 10px', borderTop: `1px solid ${THEME.background}` }} />
            <NavButton 
                icon="✍️" label="Nouvelle Naissance" onClick={() => onNavigate('birth-form')} isOpen={isSidebarOpen}
            />
            <NavButton 
                icon="🎉" label="Nouveau Mariage" onClick={() => onNavigate('marriage-form')} isOpen={isSidebarOpen}
            />
            <NavButton 
                icon="⚰️" label="Nouveau Décès" onClick={() => onNavigate('death-form')} isOpen={isSidebarOpen}
            />
            <hr style={{ margin: '15px 10px', borderTop: `1px solid ${THEME.background}` }} />
            <NavButton 
                icon="🖨️" label="Demande de Copie" onClick={() => onNavigate('copies')} isOpen={isSidebarOpen}
            />
            <NavButton 
              icon="📋" 
              label="Gestion Copies" onClick={() => onNavigate('copy-management')} isOpen={isSidebarOpen}
            />
            <hr style={{ margin: '15px 10px', borderTop: `1px solid ${THEME.background}` }} />
            <NavButton 
                icon="🔎" label="Recherche Avancée" onClick={() => onNavigate('search')} isOpen={isSidebarOpen}
            />
        </div>
      </nav>

      {/* 2. CONTENU PRINCIPAL */}
      <main style={STYLES.contentWrapper}>
        <div style={{ maxWidth: '100%'}}>
            
            {/* EN-TÊTE PROFESSIONNEL */}
            <div style={STYLES.header}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em', fontWeight: '800' }}>
                    Système de Gestion de l'État Civil
                </h1>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4em', opacity: '0.9', fontWeight: '400' }}>
                    Commune Urbaine de Fianarantsoa
                </h2>
            </div>

            {/* STATUS DE CONNEXION ET ERREURS */}
            <div style={{
                ...STYLES.statusContainer,
                background: statusColors.bg,
                color: statusColors.text,
                borderColor: statusColors.border,
            }}>
                <strong>
                    {statusColors.icon} Statut du serveur: {serverStatus}
                </strong>
                {(serverStatus === 'Déconnecté' || serverStatus === 'Erreur') && (
                <button 
                    onClick={testServerConnection}
                    style={{
                    padding: '8px 15px',
                    background: statusColors.text,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background 0.2s',
                    marginLeft: '10px'
                    }}
                >
                    Réessayer la connexion
                </button>
                )}
            </div>

            {error && (
                <div style={{
                    background: '#FEF2F2',
                    color: '#E53E3E',
                    border: '1px solid #FED7D7',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span><strong>⚠️ Erreur:</strong> {error}</span>
                    {error.includes('Session expirée') && (
                        <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
                            Redirection automatique...
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em', color: THEME.text }}>
                ⏳ Chargement des données...
                </div>
            ) : (
                <>
                {/* 3. STATISTIQUES */}
                <h2 style={{textAlign: 'center', padding: '50px', margin: '0 0 20px 0', color: THEME.text, fontSize: '1.8em', fontWeight: '600' }}>
                    Statistiques Actuelles des Actes
                </h2>
                <div style={STYLES.statsGrid}>
                    <StatCard 
                    icon="👶" value={stats.naissances} label="Actes de Naissance" color={STAT_COLORS.Naissances} 
                    />
                    <StatCard 
                    icon="💍" value={stats.mariages} label="Actes de Mariage" color={STAT_COLORS.Mariages} 
                    />
                    <StatCard 
                    icon="🕊️" value={stats.deces} label="Actes de Décès" color={STAT_COLORS.Deces} 
                    />
                    {/* ✅ MODIFICATION : Remplacer "Personnes" par "Copies Délivrées" */}
                    <StatCard 
                    icon="📄" value={stats.copies_delivrees} label="Copies Délivrées" color={STAT_COLORS.Copies} 
                    />
                </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;