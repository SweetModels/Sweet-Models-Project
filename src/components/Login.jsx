import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Auth state change will be handled by onAuthStateChanged in App.jsx
    } catch (err) {
      const errorMessages = {
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/user-not-found': 'El correo no está registrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Correo inválido',
      };
      setError(errorMessages[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background Gradients - Apple Style */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <span className="text-4xl">💎</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Sweet Models</h1>
          <p className="text-purple-200 text-sm font-medium">Panel de Administración</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-white mb-8">
            {isSignup ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200 mb-2 group-focus-within:text-white transition-colors">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                required
              />
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200 mb-2 group-focus-within:text-white transition-colors">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl text-red-200 text-sm animate-shake">
                <span className="font-medium">⚠️ {error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                isSignup ? '✨ Registrarse' : '🚀 Entrar'
              )}
            </button>
          </form>

          {/* Toggle Signup/Login */}
          <div className="mt-8 text-center">
            <p className="text-purple-200 text-sm">
              {isSignup ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-white font-semibold hover:text-purple-300 transition-colors underline decoration-purple-400/50 hover:decoration-purple-300"
              >
                {isSignup ? 'Inicia Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-500/10 backdrop-blur-xl border border-blue-400/20 rounded-2xl">
            <p className="text-xs text-blue-200 leading-relaxed">
              <span className="font-semibold">💡 Nota:</span> Tu rol se asignará desde la base de datos. Contacta al administrador para permisos de Admin, Moderador o Modelo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-300/60 text-xs mt-6">
          © 2025 Sweet Models Studio · Cúcuta, Colombia
        </p>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

export default Login;
