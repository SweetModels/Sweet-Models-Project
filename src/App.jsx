import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Home from './pages/Home';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './components/Login';

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute user={user}>
            <Layout>
              <Home />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/reportes"
        element={
          <PrivateRoute user={user}>
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <PrivateRoute user={user}>
            <Layout>
              <Users />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <PrivateRoute user={user}>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
