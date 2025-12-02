import { useState, useMemo, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, limit, query } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import Login from './components/Login';
import {
  BarChart3,
  Users,
  TrendingUp,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Menu,
  X,
  ChevronRight,
  Activity,
  Award,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// ============================================
// CONSTANTES FINANCIERAS
// ============================================
const TOKEN_TO_USD = 0.05; // 1 Token = $0.05 USD
const STUDIO_CUT_LOW = 0.40; // 40% studio si grupo < 10k tokens
const STUDIO_CUT_HIGH = 0.35; // 35% studio si grupo >= 10k tokens
const TALENT_CUT_LOW = 1 - STUDIO_CUT_LOW; // 60% talento
const TALENT_CUT_HIGH = 1 - STUDIO_CUT_HIGH; // 65% talento

// ============================================
// FUNCIONES DE CÁLCULO FINANCIERO
// ============================================

/**
 * Calcula si el grupo está en rango bajo o alto
 */
const getStudioCutPercentage = (groupTokens) => {
  return groupTokens >= 10000 ? STUDIO_CUT_HIGH : STUDIO_CUT_LOW;
};

/**
 * Calcula tokens netos para cada miembro (antes de descuento)
 */
const calculateTokensPerMember = (totalTokens, membersCount) => {
  if (membersCount === 0) return 0;
  return totalTokens / membersCount;
};

/**
 * Calcula tokens netos después de descuento del estudio
 */
const calculateNetTokensPerMember = (tokensPerMember, groupTokens) => {
  const studioPercentage = getStudioCutPercentage(groupTokens);
  return tokensPerMember * (1 - studioPercentage);
};

/**
 * Convierte tokens a dólares
 */
const convertTokensToDollars = (tokens) => {
  return tokens * TOKEN_TO_USD;
};

/**
 * Convierte dólares a pesos usando TRM
 */
const convertDollarsToPesos = (dollars, trm) => {
  return dollars * (trm - 300);
};

/**
 * Calcula la ganancia bruta en USD del grupo
 */
const calculateGrossRevenueUSD = (groupTokens) => {
  return groupTokens * TOKEN_TO_USD;
};

/**
 * Calcula la ganancia neta del estudio en COP
 */
const calculateStudioEarningsCOP = (groupTokens, trm) => {
  const studioPercentage = getStudioCutPercentage(groupTokens);
  const studioTokens = groupTokens * studioPercentage;
  const studioUSD = studioTokens * TOKEN_TO_USD;
  return studioUSD * (trm - 300);
};

/**
 * Calcula la nómina total a pagar (talento) en COP
 */
const calculateTalentPayrollCOP = (groupTokens, trm) => {
  const talentPercentage = 1 - getStudioCutPercentage(groupTokens);
  const talentTokens = groupTokens * talentPercentage;
  const talentUSD = talentTokens * TOKEN_TO_USD;
  return talentUSD * (trm - 300);
};

/**
 * Formatea números como moneda
 */
const formatCurrency = (value, currency = 'COP') => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trm, setTrm] = useState(4200);

  // Groups from Firestore
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Admin create group form
  const [groupForm, setGroupForm] = useState({
    name: '',
    platform: 'Chaturbate',
    moderator: '',
    modelsCsv: '',
  });

  // Edit tokens state
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingTokensValue, setEditingTokensValue] = useState('');

  // Chart data - 7 días
  const chartData = useMemo(
    () => [
      { name: 'Lun', tokens: 2400, revenue: 2400 * TOKEN_TO_USD, studioCut: 2400 * 0.40 * TOKEN_TO_USD },
      { name: 'Mar', tokens: 3000, revenue: 3000 * TOKEN_TO_USD, studioCut: 3000 * 0.40 * TOKEN_TO_USD },
      { name: 'Mié', tokens: 2000, revenue: 2000 * TOKEN_TO_USD, studioCut: 2000 * 0.40 * TOKEN_TO_USD },
      { name: 'Jue', tokens: 2780, revenue: 2780 * TOKEN_TO_USD, studioCut: 2780 * 0.40 * TOKEN_TO_USD },
      { name: 'Vie', tokens: 1890, revenue: 1890 * TOKEN_TO_USD, studioCut: 1890 * 0.40 * TOKEN_TO_USD },
      { name: 'Sab', tokens: 2390, revenue: 2390 * TOKEN_TO_USD, studioCut: 2390 * 0.40 * TOKEN_TO_USD },
      { name: 'Dom', tokens: 3490, revenue: 3490 * TOKEN_TO_USD, studioCut: 3490 * 0.40 * TOKEN_TO_USD },
    ],
    []
  );

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setRoleLoading(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          setUserRole(userDocSnap.exists() ? userDocSnap.data().role || 'model' : 'model');
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole('model');
        } finally {
          setRoleLoading(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to groups collection
  useEffect(() => {
    if (!user) return;

    setLoadingGroups(true);
    const groupsQuery = query(collection(db, 'groups'), limit(50));
    const unsub = onSnapshot(
      groupsQuery,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGroups(items);
        setLoadingGroups(false);
      },
      (err) => {
        console.error('Error listening groups:', err);
        setLoadingGroups(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Filtered groups based on role
  const groupsToShow = useMemo(() => {
    if (userRole === 'admin') return groups;
    if (userRole === 'moderator') return groups.filter((g) => g.moderator === user?.email);
    return groups.filter((g) => (g.models || []).includes(user?.email || ''));
  }, [groups, userRole, user]);

  // ============================================
  // CÁLCULOS DE FINANZAS - KPIs
  // ============================================
  const financialMetrics = useMemo(() => {
    const totalTokens = groups.reduce((sum, g) => sum + (g.tokens || 0), 0);
    
    // Facturación Bruta en USD
    const grossRevenueUSD = totalTokens * TOKEN_TO_USD;
    
    // Ganancia Neta del Studio en COP
    const studioEarningsCOP = groups.reduce((sum, group) => {
      return sum + calculateStudioEarningsCOP(group.tokens || 0, trm);
    }, 0);
    
    // Nómina Total a Pagar en COP
    const talentPayrollCOP = groups.reduce((sum, group) => {
      return sum + calculateTalentPayrollCOP(group.tokens || 0, trm);
    }, 0);

    const totalModerators = new Set(groups.map((g) => g.moderator).filter(Boolean)).size;
    const totalModels = new Set(groups.flatMap((g) => g.models || [])).size;

    return {
      totalGroups: groups.length,
      totalTokens,
      grossRevenueUSD,
      studioEarningsCOP,
      talentPayrollCOP,
      totalModerators,
      totalModels,
      visibleGroups: groupsToShow.length,
    };
  }, [groups, trm, groupsToShow]);

  // Handlers
  const handleCreateGroup = useCallback(async () => {
    if (userRole !== 'admin') {
      alert('Acceso denegado: solo Admin puede crear grupos');
      return;
    }
    if (!groupForm.name.trim()) {
      alert('El nombre del grupo es requerido');
      return;
    }

    const modelsList = groupForm.modelsCsv
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m);

    try {
      await addDoc(collection(db, 'groups'), {
        name: groupForm.name,
        platform: groupForm.platform,
        moderator: groupForm.moderator,
        models: modelsList,
        tokens: 0,
        createdAt: serverTimestamp(),
      });
      setGroupForm({ name: '', platform: 'Chaturbate', moderator: '', modelsCsv: '' });
      alert('Grupo creado exitosamente');
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Error al crear el grupo');
    }
  }, [userRole, groupForm]);

  const startEditTokens = useCallback((groupId, currentTokens) => {
    setEditingGroupId(groupId);
    setEditingTokensValue(String(currentTokens || 0));
  }, []);

  const cancelEditTokens = useCallback(() => {
    setEditingGroupId(null);
    setEditingTokensValue('');
  }, []);

  const saveEditTokens = useCallback(
    async (groupId) => {
      if (userRole !== 'admin') {
        alert('Acceso denegado: solo Admin puede editar tokens');
        return;
      }

      const newTokens = parseInt(editingTokensValue, 10);
      if (isNaN(newTokens)) {
        alert('Ingresa un número válido');
        return;
      }

      try {
        await updateDoc(doc(db, 'groups', groupId), { tokens: newTokens });
        setEditingGroupId(null);
        setEditingTokensValue('');
      } catch (err) {
        console.error('Error updating tokens:', err);
        alert('Error al actualizar tokens');
      }
    },
    [editingTokensValue, userRole]
  );

  const handleDeleteGroup = useCallback(
    async (groupId) => {
      if (userRole !== 'admin') {
        alert('Acceso denegado: solo Admin puede eliminar grupos');
        return;
      }

      if (confirm('¿Estás seguro que quieres eliminar este grupo?')) {
        try {
          await deleteDoc(doc(db, 'groups', groupId));
        } catch (err) {
          console.error('Error deleting group:', err);
          alert('Error al eliminar el grupo');
        }
      }
    },
    [userRole]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, []);

  // Render platform badge
  const renderPlatformBadge = (platform) => {
    const colors = {
      Chaturbate: 'bg-blue-100 text-blue-800',
      MyFreeCams: 'bg-pink-100 text-pink-800',
      Stripchat: 'bg-purple-100 text-purple-800',
      BongaCams: 'bg-orange-100 text-orange-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  // Render group card
  const renderGroupCard = (group) => {
    const platformColor = renderPlatformBadge(group.platform);
    const groupTokens = group.tokens || 0;
    const studioPercentage = getStudioCutPercentage(groupTokens);
    const studioEarnings = calculateStudioEarningsCOP(groupTokens, trm);
    const talentPayroll = calculateTalentPayrollCOP(groupTokens, trm);

    return (
      <div
        key={group.id}
        className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {group.name}
            </h3>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${platformColor}`}>
              {group.platform}
            </span>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEditTokens(group.id, group.tokens)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Editar tokens"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => handleDeleteGroup(group.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Eliminar grupo"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {group.moderator && (
            <div className="text-sm">
              <span className="text-gray-600">Moderador:</span>
              <span className="ml-2 font-medium text-gray-900">{group.moderator}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-600">Modelos ({(group.models || []).length}):</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(group.models || []).slice(0, 3).map((model) => (
                <span key={model} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  {model}
                </span>
              ))}
              {(group.models || []).length > 3 && (
                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                  +{(group.models || []).length - 3} más
                </span>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="text-xs grid grid-cols-2 gap-2">
              <div className="bg-green-50 p-2 rounded">
                <span className="text-gray-600">Bruto (USD):</span>
                <p className="font-bold text-green-700">{formatCurrency(groupTokens * TOKEN_TO_USD, 'USD')}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="text-gray-600">Studio ({Math.round(studioPercentage * 100)}%):</span>
                <p className="font-bold text-blue-700">{formatCurrency(studioEarnings, 'COP')}</p>
              </div>
            </div>
          </div>
        </div>

        {editingGroupId === group.id ? (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <input
              type="number"
              value={editingTokensValue}
              onChange={(e) => setEditingTokensValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nuevos tokens"
            />
            <button
              onClick={() => saveEditTokens(group.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={cancelEditTokens}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">Tokens Totales:</span>
            <span className="text-2xl font-bold text-blue-600">{groupTokens.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SweetModels</h1>
                <p className="text-xs text-gray-600">Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-600 capitalize bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium">
                  {userRole}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* TRM Input - Admin Only */}
          {userRole === 'admin' && (
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">TRM (COP/USD):</label>
              <input
                type="number"
                value={trm}
                onChange={(e) => setTrm(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-gray-900 text-white transition-all duration-300 overflow-hidden hidden lg:block`}
        >
          <div className="p-6">
            <nav className="space-y-2">
              <div className="px-4 py-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Dashboard</span>
                </div>
              </div>
              <div className="text-xs uppercase text-gray-500 font-semibold px-4 py-3 mt-6">
                Secciones
              </div>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Grupos</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Usuarios</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Reportes</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-8">
          {/* ADMIN FINANCIAL DASHBOARD */}
          {userRole === 'admin' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Finanzas del Estudio</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Facturación Bruta USD */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 p-8 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-12 h-12 text-green-600" />
                      <span className="text-xs px-3 py-1 bg-green-200 text-green-800 rounded-full font-bold">
                        Ingreso
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">Facturación Bruta</p>
                    <p className="text-4xl font-bold text-green-700">
                      {formatCurrency(financialMetrics.grossRevenueUSD, 'USD')}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {financialMetrics.totalTokens.toLocaleString()} tokens × ${TOKEN_TO_USD}
                    </p>
                  </div>

                  {/* Ganancia Neta Studio COP */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-8 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <CreditCard className="w-12 h-12 text-blue-600" />
                      <span className="text-xs px-3 py-1 bg-blue-200 text-blue-800 rounded-full font-bold">
                        Ganancia
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">Ganancia Neta Studio</p>
                    <p className="text-4xl font-bold text-blue-700">
                      {formatCurrency(financialMetrics.studioEarningsCOP, 'COP')}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Tu dinero neto en pesos</p>
                  </div>

                  {/* Nómina a Pagar COP */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300 p-8 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-12 h-12 text-orange-600" />
                      <span className="text-xs px-3 py-1 bg-orange-200 text-orange-800 rounded-full font-bold">
                        Gasto
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">Nómina a Pagar</p>
                    <p className="text-4xl font-bold text-orange-700">
                      {formatCurrency(financialMetrics.talentPayrollCOP, 'COP')}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Pago a modelos y moderadores</p>
                  </div>
                </div>
              </div>

              {/* Línea divisoria */}
              <hr className="my-8 border-gray-300" />
            </>
          )}

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Grupos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-10 h-10 text-blue-100" />
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  +12%
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Grupos</p>
              <p className="text-4xl font-bold text-gray-900">{financialMetrics.totalGroups}</p>
              <p className="text-xs text-gray-500 mt-2">Grupos activos en el sistema</p>
            </div>

            {/* Total Tokens */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-green-300">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-10 h-10 text-green-100" />
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  +8%
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Tokens Totales</p>
              <p className="text-4xl font-bold text-gray-900">{financialMetrics.totalTokens.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Generados en todas las plataformas</p>
            </div>

            {/* Moderadores */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-purple-100" />
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  {financialMetrics.totalModerators}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Moderadores</p>
              <p className="text-4xl font-bold text-gray-900">{financialMetrics.totalModerators}</p>
              <p className="text-xs text-gray-500 mt-2">Activos en la plataforma</p>
            </div>

            {/* Modelos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-orange-300">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-10 h-10 text-orange-100" />
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                  {financialMetrics.totalModels}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Modelos</p>
              <p className="text-4xl font-bold text-gray-900">{financialMetrics.totalModels}</p>
              <p className="text-xs text-gray-500 mt-2">Registradas en el sistema</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Ingresos Diarios (7 Días)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => formatCurrency(value, 'USD')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Plataformas</h2>
              <div className="space-y-4">
                {['Chaturbate', 'Stripchat', 'MyFreeCams', 'BongaCams'].map((platform) => {
                  const platformGroups = groups.filter((g) => g.platform === platform).length;
                  const percentage = groups.length > 0 ? (platformGroups / groups.length) * 100 : 0;
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-700 font-medium">{platform}</span>
                        <span className="text-gray-900 font-bold">{platformGroups}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Create Group Section */}
          {userRole === 'admin' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Crear Nuevo Grupo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nombre del grupo"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={groupForm.platform}
                  onChange={(e) => setGroupForm({ ...groupForm, platform: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Chaturbate</option>
                  <option>MyFreeCams</option>
                  <option>Stripchat</option>
                  <option>BongaCams</option>
                </select>
                <input
                  type="email"
                  placeholder="Email del moderador"
                  value={groupForm.moderator}
                  onChange={(e) => setGroupForm({ ...groupForm, moderator: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Modelos (email1,email2,email3)"
                  value={groupForm.modelsCsv}
                  onChange={(e) => setGroupForm({ ...groupForm, modelsCsv: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCreateGroup}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
              >
                Crear Grupo
              </button>
            </div>
          )}

          {/* Groups List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Grupos</h2>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {groupsToShow.length} grupos visibles
              </span>
            </div>

            {loadingGroups ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando grupos...</p>
                </div>
              </div>
            ) : groupsToShow.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No hay grupos disponibles</p>
                <p className="text-sm text-gray-500 mt-1">Los grupos que crees aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupsToShow.map((group) => renderGroupCard(group))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
