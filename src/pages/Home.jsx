import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { DollarSign, Users, Award, TrendingUp, Plus, Edit2, Trash2, Eye } from 'lucide-react';

// Constantes financieras
const TOKEN_TO_USD = 0.05;
const STUDIO_CUT_LOW = 0.40;
const STUDIO_CUT_HIGH = 0.35;
const TOKEN_THRESHOLD = 10000;

export default function Home() {
  const [trm, setTrm] = useState(4200);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingTokensValue, setEditingTokensValue] = useState('');
  
  // Form para crear grupo
  const [groupForm, setGroupForm] = useState({
    name: '',
    platform: 'Chaturbate',
    moderator: '',
    modelsCsv: '',
  });

  // Listener grupos
  useEffect(() => {
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
  }, []);

  // Funciones financieras
  const getStudioPercentage = useCallback((tokens) => {
    return tokens >= TOKEN_THRESHOLD ? STUDIO_CUT_HIGH : STUDIO_CUT_LOW;
  }, []);

  const calculateStudioEarningsCOP = useCallback((tokens, trmValue) => {
    const studioPct = getStudioPercentage(tokens);
    const studioTokens = tokens * studioPct;
    const studioUSD = studioTokens * TOKEN_TO_USD;
    return studioUSD * Math.max(0, trmValue - 300);
  }, [getStudioPercentage]);

  const calculateTalentPayrollCOP = useCallback((tokens, trmValue) => {
    const talentPct = 1 - getStudioPercentage(tokens);
    const talentTokens = tokens * talentPct;
    const talentUSD = talentTokens * TOKEN_TO_USD;
    return talentUSD * Math.max(0, trmValue - 300);
  }, [getStudioPercentage]);

  // Métricas globales
  const metrics = useMemo(() => {
    let totalTokens = 0;
    let grossUSD = 0;
    let studioCOP = 0;
    let payrollCOP = 0;

    for (const g of groups) {
      const tokens = Number(g.tokens || 0);
      totalTokens += tokens;
      grossUSD += tokens * TOKEN_TO_USD;
      studioCOP += calculateStudioEarningsCOP(tokens, trm);
      payrollCOP += calculateTalentPayrollCOP(tokens, trm);
    }

    const totalModerators = new Set(groups.map((g) => g.moderator).filter(Boolean)).size;
    const totalModels = new Set(groups.flatMap((g) => g.models || [])).size;

    return {
      totalGroups: groups.length,
      totalTokens,
      grossUSD,
      studioCOP,
      payrollCOP,
      totalModerators,
      totalModels,
    };
  }, [groups, trm, calculateStudioEarningsCOP, calculateTalentPayrollCOP]);

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

  // Handlers
  const handleCreateGroup = async () => {
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
  };

  const startEditTokens = (groupId, currentTokens) => {
    setEditingGroupId(groupId);
    setEditingTokensValue(String(currentTokens || 0));
  };

  const saveEditTokens = async (groupId) => {
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
  };

  const handleDeleteGroup = async (groupId) => {
    if (confirm('¿Estás seguro que quieres eliminar este grupo?')) {
      try {
        await deleteDoc(doc(db, 'groups', groupId));
      } catch (err) {
        console.error('Error deleting group:', err);
        alert('Error al eliminar el grupo');
      }
    }
  };

  const renderPlatformBadge = (platform) => {
    const colors = {
      Chaturbate: 'bg-blue-100 text-blue-800',
      MyFreeCams: 'bg-pink-100 text-pink-800',
      Stripchat: 'bg-purple-100 text-purple-800',
      BongaCams: 'bg-orange-100 text-orange-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header con TRM */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">TRM (COP/USD):</label>
          <input
            type="number"
            value={trm}
            onChange={(e) => setTrm(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>
      </div>

      {/* Tarjetas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Facturación Bruta USD */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 text-green-600" />
            <span className="text-xs px-3 py-1 bg-green-200 text-green-800 rounded-full font-bold">
              Ingreso
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2 font-semibold">Facturación Bruta</p>
          <p className="text-3xl font-bold text-green-700">
            {formatCurrency(metrics.grossUSD, 'USD')}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {metrics.totalTokens.toLocaleString()} tokens × ${TOKEN_TO_USD}
          </p>
        </div>

        {/* Ganancia Neta Studio COP */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <span className="text-xs px-3 py-1 bg-blue-200 text-blue-800 rounded-full font-bold">
              Ganancia
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2 font-semibold">Ganancia Neta Studio</p>
          <p className="text-3xl font-bold text-blue-700">
            {formatCurrency(metrics.studioCOP, 'COP')}
          </p>
          <p className="text-xs text-gray-600 mt-2">Tu dinero neto en pesos</p>
        </div>

        {/* Nómina a Pagar COP */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-orange-600" />
            <span className="text-xs px-3 py-1 bg-orange-200 text-orange-800 rounded-full font-bold">
              Gasto
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2 font-semibold">Nómina a Pagar</p>
          <p className="text-3xl font-bold text-orange-700">
            {formatCurrency(metrics.payrollCOP, 'COP')}
          </p>
          <p className="text-xs text-gray-600 mt-2">Pago a modelos y moderadores</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Total Grupos</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalGroups}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Total Tokens</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Moderadores</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalModerators}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <p className="text-gray-600 text-sm mb-1">Modelos</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalModels}</p>
        </div>
      </div>

      {/* Crear Grupo */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Crear Nuevo Grupo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre del grupo"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={groupForm.platform}
            onChange={(e) => setGroupForm({ ...groupForm, platform: e.target.value })}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Modelos (email1,email2,email3)"
            value={groupForm.modelsCsv}
            onChange={(e) => setGroupForm({ ...groupForm, modelsCsv: e.target.value })}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCreateGroup}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          Crear Grupo
        </button>
      </div>

      {/* Lista de Grupos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Grupos</h3>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {groups.length} grupos
          </span>
        </div>

        {loadingGroups ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando grupos...</p>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No hay grupos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const tokens = group.tokens || 0;
              const studioPct = getStudioPercentage(tokens);
              const studioEarnings = calculateStudioEarningsCOP(tokens, trm);

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${renderPlatformBadge(group.platform)}`}>
                        {group.platform}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditTokens(group.id, tokens)}
                        className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {group.moderator && (
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">Moderador:</span> {group.moderator}
                    </p>
                  )}

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Modelos ({(group.models || []).length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {(group.models || []).slice(0, 2).map((model) => (
                        <span key={model} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                          {model}
                        </span>
                      ))}
                      {(group.models || []).length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                          +{(group.models || []).length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Studio ({Math.round(studioPct * 100)}%):</span>
                      <span className="font-bold text-blue-700">{formatCurrency(studioEarnings, 'COP')}</span>
                    </div>
                  </div>

                  {editingGroupId === group.id ? (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <input
                        type="number"
                        value={editingTokensValue}
                        onChange={(e) => setEditingTokensValue(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tokens"
                      />
                      <button
                        onClick={() => saveEditTokens(group.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="px-3 py-2 bg-gray-300 text-gray-800 rounded-lg text-sm hover:bg-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tokens:</span>
                      <span className="text-xl font-bold text-blue-600">{tokens.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
