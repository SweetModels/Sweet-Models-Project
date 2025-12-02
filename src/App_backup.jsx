import { useState, useMemo, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, limit, query } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import Login from './components/Login';
import DollarStudioCard from './components/DollarStudioCard';
import Header from './components/Header';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // TRM editable by Admin
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

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(false);
      if (currentUser) {
        setUser(currentUser);
        setRoleLoading(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          setUserRole(userDocSnap.exists() ? (userDocSnap.data().role || 'model') : 'model');
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
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to 'groups' collection in realtime (only if user is authenticated)
  useEffect(() => {
    if (!user) return;

    setLoadingGroups(true);
    const groupsQuery = query(collection(db, 'groups'), limit(50));
    const unsub = onSnapshot(groupsQuery, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGroups(items);
      setLoadingGroups(false);
    }, (err) => {
      console.error('Error listening groups:', err);
      setLoadingGroups(false);
    });

    return () => unsub();
  }, [user]);

  const dollarStudio = trm - 300;

  // Helper: platform badge
  const PlatformBadge = ({ platform }) => {
    const colors = {
      'Chaturbate': 'bg-blue-50 text-blue-700',
      'Stripchat': 'bg-purple-50 text-purple-700',
      'Camsoda': 'bg-pink-50 text-pink-700',
    };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[platform] || 'bg-gray-50 text-gray-700'}`}>{platform}</span>;
  };

  // Filtered groups based on role
  const groupsToShow = useMemo(() => {
    if (userRole === 'admin') return groups;
    if (userRole === 'moderator') return groups.filter((g) => g.moderator === user?.email);
    return groups.filter((g) => (g.models || []).includes(user?.email || ''));
  }, [groups, userRole, user]);

  // Create group (admin only)
  const handleCreateGroup = useCallback(async () => {
    if (userRole !== 'admin') {
      alert('Acceso denegado: solo Admin puede crear grupos');
      return;
    }

    if (!groupForm.name.trim()) { alert('Nombre de grupo obligatorio'); return; }
    if (!groupForm.moderator.trim()) { alert('Nombre del moderador obligatorio'); return; }

    const modelsArray = groupForm.modelsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const members_count = 1 + modelsArray.length;

    try {
      await addDoc(collection(db, 'groups'), {
        name: groupForm.name.trim(),
        platform: groupForm.platform,
        moderator: groupForm.moderator.trim(),
        models: modelsArray,
        members_count,
        tokens: 0,
        createdAt: serverTimestamp(),
      });

      setGroupForm({ name: '', platform: 'Chaturbate', moderator: '', modelsCsv: '' });
      alert('Grupo creado correctamente');
    } catch (err) {
      console.error('Error creating group', err);
      alert('Error al crear grupo');
    }
  }, [userRole, groupForm]);

  // Edit tokens (Admin)
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingTokensValue, setEditingTokensValue] = useState('');

  const startEditTokens = useCallback((g) => {
    setEditingGroupId(g.id);
    setEditingTokensValue(String(g.tokens || 0));
  }, []);

  const cancelEditTokens = useCallback(() => {
    setEditingGroupId(null);
    setEditingTokensValue('');
  }, []);

  const saveEditTokens = useCallback(async (groupId) => {
    const val = Number(editingTokensValue || 0);
    try {
      await updateDoc(doc(db, 'groups', groupId), { tokens: val });
      setEditingGroupId(null);
      setEditingTokensValue('');
    } catch (err) {
      console.error('Error updating tokens', err);
      alert('Error al actualizar tokens');
    }
  }, [editingTokensValue]);

  // Delete group (admin only)
  const handleDeleteGroup = useCallback(async (groupId) => {
    if (userRole !== 'admin') {
      alert('Acceso denegado');
      return;
    }
    if (!window.confirm('¿Eliminar este grupo?')) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (err) {
      console.error(err);
      alert('Error eliminando grupo');
    }
  }, [userRole]);

  // Render group card details
  const renderGroupCard = (g) => {
    const members = g.members_count ?? (1 + (g.models ? g.models.length : 0));
    const tokens = Number(g.tokens || 0);
    const basePerMember = members > 0 ? (tokens / members) * dollarStudio : 0;
    const percentage = tokens >= 10000 ? 65 : 60;
    const finalPerMember = (basePerMember * percentage) / 100;

    return (
      <div key={g.id} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
              <PlatformBadge platform={g.platform} />
            </div>
            <p className="text-sm text-gray-500">Moderador: <span className="font-semibold text-gray-700">{g.moderator}</span></p>
            <p className="text-sm text-gray-500">Miembros: <span className="font-semibold">{members}</span></p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Tokens (grupo)</p>
            <p className="text-2xl font-bold text-gray-900">{tokens.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Pago estimado por miembro</p>
            <p className="text-xl font-semibold text-gray-900">${Math.round(finalPerMember).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 font-semibold">Modelos:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(g.models || []).map((m) => (
              <div key={m} className={`px-3 py-1 rounded-lg text-sm ${tokens >= 10000 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                {m} • <span className="font-semibold">${Math.round(finalPerMember).toLocaleString()}</span>
              </div>
            ))}
            {(!g.models || g.models.length === 0) && <div className="text-sm text-gray-400">No hay modelos registrados</div>}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <div>Plataforma: <span className="font-semibold text-gray-700">{g.platform}</span></div>
          <div className="flex items-center gap-2 mt-3">
            {userRole === 'admin' && (
              <>
                {editingGroupId === g.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editingTokensValue} onChange={(e) => setEditingTokensValue(e.target.value)} className="px-2 py-1 border rounded w-32" />
                    <button onClick={() => saveEditTokens(g.id)} className="bg-green-600 text-white px-3 py-1 rounded">Guardar</button>
                    <button onClick={cancelEditTokens} className="px-3 py-1 rounded border">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => startEditTokens(g)} className="px-3 py-1 rounded bg-yellow-50 hover:bg-yellow-100">✏️ Editar tokens</button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100">🗑️ Eliminar</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce"></div>
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-600 font-semibold">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show login if no user
  if (!user) {
    return <Login />;
  }

  // Show loading while fetching role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce"></div>
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-600 font-semibold">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Section with User Info and Logout */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administración - Grupos</h1>
            <p className="text-gray-600">Rol: <span className="font-semibold capitalize">{userRole}</span> • Usuario: {user.email}</p>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
          >
            🚪 Cerrar Sesión
          </button>
        </div>

        {/* TRM + Dólar Studio (editable solo para Admin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <label className="block text-sm font-semibold text-gray-700 mb-2">TRM del Día</label>
            <div className="flex items-center gap-3">
              <input type="number" value={trm} onChange={(e) => setTrm(Number(e.target.value))} disabled={userRole !== 'admin'} className={`flex-1 px-4 py-3 border rounded ${userRole !== 'admin' ? 'bg-gray-100' : 'focus:ring-2 focus:ring-blue-500'}`} />
              <span className="text-gray-500">$ COP</span>
            </div>
            {userRole !== 'admin' && <p className="text-xs text-gray-400 mt-2">Solo Admin puede editar la TRM</p>}
          </div>

          <DollarStudioCard dollarStudio={dollarStudio} />
        </div>

        {/* Admin: Crear Grupo */}
        {userRole === 'admin' && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
              <h2 className="text-xl font-bold mb-4">Crear Grupo</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input placeholder="Nombre del Grupo" value={groupForm.name} onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))} className="px-3 py-2 border rounded" />
                <select value={groupForm.platform} onChange={(e) => setGroupForm(prev => ({ ...prev, platform: e.target.value }))} className="px-3 py-2 border rounded">
                  <option>Chaturbate</option>
                  <option>Stripchat</option>
                  <option>Camsoda</option>
                </select>
                <input placeholder="Moderador" value={groupForm.moderator} onChange={(e) => setGroupForm(prev => ({ ...prev, moderator: e.target.value }))} className="px-3 py-2 border rounded" />
                <input placeholder="Modelos (separados por coma)" value={groupForm.modelsCsv} onChange={(e) => setGroupForm(prev => ({ ...prev, modelsCsv: e.target.value }))} className="px-3 py-2 border rounded" />
              </div>
              <div className="mt-4">
                <button onClick={handleCreateGroup} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Guardar Grupo</button>
              </div>
            </div>
          </div>
        )}

        {/* Groups list */}
        {loadingGroups ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">Cargando grupos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupsToShow.length === 0 && <div className="bg-white p-6 rounded shadow">No hay grupos para mostrar</div>}
            {groupsToShow.map(renderGroupCard)}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
