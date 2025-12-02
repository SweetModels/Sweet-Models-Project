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
      { name: 'Lun', tokens: 2400, revenue: 1200, models: 12 },
      { name: 'Mar', tokens: 3000, revenue: 1500, models: 14 },
      { name: 'Mié', tokens: 2000, revenue: 1000, models: 10 },
      { name: 'Jue', tokens: 2780, revenue: 1390, models: 13 },
      { name: 'Vie', tokens: 1890, revenue: 945, models: 9 },
      { name: 'Sab', tokens: 2390, revenue: 1195, models: 11 },
      { name: 'Dom', tokens: 3490, revenue: 1745, models: 16 },
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

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTokens = groups.reduce((sum, g) => sum + (g.tokens || 0), 0);
    const totalModerators = new Set(groups.map((g) => g.moderator).filter(Boolean)).size;
    const totalModels = new Set(groups.flatMap((g) => g.models || [])).size;

    return {
      totalGroups: groups.length,
      totalTokens,
      totalModerators,
      totalModels,
      visibleGroups: groupsToShow.length,
      avgTokensPerGroup: groups.length > 0 ? Math.round(totalTokens / groups.length) : 0,
    };
  }, [groups, groupsToShow]);

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
            <span className="text-sm text-gray-600">Tokens:</span>
            <span className="text-2xl font-bold text-blue-600">{group.tokens}</span>
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
          {/* KPI Cards - Bento Grid */}
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
              <p className="text-4xl font-bold text-gray-900">{kpis.totalGroups}</p>
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
              <p className="text-4xl font-bold text-gray-900">{kpis.totalTokens.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Ingresos acumulados</p>
            </div>

            {/* Moderadores */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-purple-100" />
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  {kpis.totalModerators}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Moderadores</p>
              <p className="text-4xl font-bold text-gray-900">{kpis.totalModerators}</p>
              <p className="text-xs text-gray-500 mt-2">Activos en la plataforma</p>
            </div>

            {/* Modelos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-orange-300">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-10 h-10 text-orange-100" />
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                  {kpis.totalModels}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Modelos</p>
              <p className="text-4xl font-bold text-gray-900">{kpis.totalModels}</p>
              <p className="text-xs text-gray-500 mt-2">Registradas en el sistema</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Tokens por Día (7 Días)</h2>
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
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
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
