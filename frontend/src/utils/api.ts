// frontend/src/utils/api.ts
const API_BASE_URL = 'https://mon-projet-upde.onrender.com/api';

// ✅ Fonction pour récupérer le token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// ✅ Fonction pour créer les headers avec le token + logs détaillés
const getAuthHeaders = (): HeadersInit => {
  const token = getToken();

  // 🔍 LOGS DE DÉBOGAGE TOKEN
  console.log('🔑 Token récupéré:', token ? 'OUI' : 'NON');
  if (token) {
    console.log('📦 Token complet (début):', token.substring(0, 30) + '...');
  } else {
    console.log('📦 Token complet: undefined');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  console.log('📦 Headers envoyés:', headers);
  return headers;
};

// ✅ Fonction GET générique améliorée
export const apiGet = async (endpoint: string) => {
  try {
    const headers = getAuthHeaders();
    console.log('📤 Requête GET vers:', `${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers
    });

    console.log('📥 Réponse status:', response.status);

    // Gestion centralisée du 401
    if (response.status === 401) {
      console.error('❌ Erreur 401 : Token invalide, expiré ou manquant');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Réponse KO:', data);
      throw new Error(data.message || 'Erreur serveur');
    }

    console.log('✅ Données reçues pour', endpoint, ':', data);
    return data;
  } catch (error: any) {
    console.error(`❌ Erreur GET ${endpoint}:`, error);
    throw error;
  }
};

// ✅ POST générique avec logs
export const apiPost = async (endpoint: string, body: any) => {
  try {
    const headers = getAuthHeaders();
    console.log('📤 Requête POST vers:', `${API_BASE_URL}${endpoint}`);
    console.log('📦 Body envoyé:', body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    console.log('📥 Réponse status:', response.status);

    if (response.status === 401) {
      console.error('❌ 401 sur POST → déconnexion');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur POST:', data);
      throw new Error(data.message || 'Erreur lors de l\'envoi');
    }

    console.log('✅ POST réussi:', data);
    return data;
  } catch (error: any) {
    console.error(`❌ Erreur POST ${endpoint}:`, error);
    throw error;
  }
};

// ✅ PUT générique avec logs
export const apiPut = async (endpoint: string, body: any) => {
  try {
    const headers = getAuthHeaders();
    console.log('📤 Requête PUT vers:', `${API_BASE_URL}${endpoint}`);
    console.log('📦 Body envoyé:', body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    console.log('📥 Réponse status:', response.status);

    if (response.status === 401) {
      console.error('❌ 401 sur PUT → déconnexion');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur PUT:', data);
      throw new Error(data.message || 'Erreur lors de la mise à jour');
    }

    console.log('✅ PUT réussi:', data);
    return data;
  } catch (error: any) {
    console.error(`❌ Erreur PUT ${endpoint}:`, error);
    throw error;
  }
};

// ✅ DELETE générique avec logs
export const apiDelete = async (endpoint: string) => {
  try {
    const headers = getAuthHeaders();
    console.log('📤 Requête DELETE vers:', `${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });

    console.log('📥 Réponse status:', response.status);

    if (response.status === 401) {
      console.error('❌ 401 sur DELETE → déconnexion');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la suppression');
    }

    console.log('✅ DELETE réussi');
    return data;
  } catch (error: any) {
    console.error(`❌ Erreur DELETE ${endpoint}:`, error);
    throw error;
  }
};

// ===========================================================================
// Fonctions spécifiques (elles utilisent maintenant les versions logguées)
// ===========================================================================

// Actes de naissance
export const getActesNaissance = () => apiGet('/actes/naissance');
export const getNextNumberNaissance = () => apiGet('/actes/naissance/next-number');
export const createActeNaissance = (data: any) => apiPost('/actes/naissance', data);
export const updateActeNaissance = (id: number, data: any) => apiPut(`/actes/naissance/${id}`, data);
export const deleteActeNaissance = (id: number) => apiDelete(`/actes/naissance/${id}`);

// Actes de mariage
export const getActesMariage = () => apiGet('/actes/mariage');
export const getNextNumberMariage = () => apiGet('/actes/mariage/next-number');
export const createActeMariage = (data: any) => apiPost('/actes/mariage', data);
export const updateActeMariage = (id: number, data: any) => apiPut(`/actes/mariage/${id}`, data);
export const deleteActeMariage = (id: number) => apiDelete(`/actes/mariage/${id}`);

// Actes de décès
export const getActesDeces = () => apiGet('/actes/deces');
export const getNextNumberDeces = () => apiGet('/actes/deces/next-number');
export const createActeDeces = (data: any) => apiPost('/actes/deces', data);
export const updateActeDeces = (id: number, data: any) => apiPut(`/actes/deces/${id}`, data);
export const deleteActeDeces = (id: number) => apiDelete(`/actes/deces/${id}`);

// Copies
export const getCopies = () => apiGet('/copies');
export const createCopie = (data: any) => apiPost('/copies', data);
export const deliverCopie = (id: number, delivrePar: string) =>
  apiPut(`/copies/${id}/deliver`, { delivre_par: delivrePar });
export const deleteCopie = (id: number) => apiDelete(`/copies/${id}`);

// Mentions en marge
export const getMentions = (typeActe: string, acteId: number) =>
  apiGet(`/mentions/${typeActe}/${acteId}`);
export const createMention = (data: any) => apiPost('/mentions', data);
export const deleteMention = (id: number) => apiDelete(`/mentions/${id}`);

// Recherche
export const searchActes = (query: string, type?: string) => {
  const params = new URLSearchParams({ query });
  if (type) params.append('type', type);
  return apiGet(`/search?${params.toString()}`);
};

// Statistiques
export const getStats = () => apiGet('/stats');

// PDF (avec logs aussi)
export const downloadPDF = async (typeActe: string, acteId: number) => {
  const token = getToken();
  console.log('📄 Tentative de génération PDF pour:', typeActe, acteId);
  console.log('🔑 Token pour PDF:', token ? 'présent' : 'absent');

  const response = await fetch(`${API_BASE_URL}/generate-pdf/${typeActe}/${acteId}`, {
    method: 'GET',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  console.log('📥 PDF response status:', response.status);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Erreur lors de la génération du PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acte_${typeActe}_${acteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  console.log('✅ PDF téléchargé avec succès');
};

// ✅ NOUVEAU : Gestion des utilisateurs (Admin uniquement)
export const getUsers = () => apiGet('/users');
export const createUser = (data: any) => apiPost('/users', data);
export const updateUser = (id: number, data: any) => apiPut(`/users/${id}`, data);
export const deleteUser = (id: number) => apiDelete(`/users/${id}`);