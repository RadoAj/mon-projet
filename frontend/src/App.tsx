// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';

// ✅ Composant wrapper pour protéger MainApp
const ProtectedMainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Afficher MainApp si authentifié
  return <MainApp />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route publique : Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Route protégée : MainApp (ton système existant) */}
            <Route path="/*" element={<ProtectedMainApp />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;