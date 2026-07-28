import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Inicio de sesion exitoso');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Credenciales invalidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 md:p-8 text-slate-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      <main className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 min-h-[650px] rounded-3xl overflow-hidden bg-[#1E293B] shadow-2xl relative z-10 border border-slate-700/60">
        <section className="relative hidden md:flex flex-col items-center justify-center p-12 bg-slate-900/60 border-r border-slate-700/60">
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-3xl">dentistry</span>
            <span className="font-['Geist'] text-2xl font-bold text-white tracking-tight">DentalCare</span>
          </div>

          <div className="text-center space-y-4 mt-8">
            <div className="mx-auto w-28 h-28 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-2xl shadow-blue-950/30">
              <span className="material-symbols-outlined text-blue-400 text-7xl">dentistry</span>
            </div>
            <h1 className="font-['Geist'] text-3xl font-bold text-white">Cuidamos tu sonrisa</h1>
            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Gestion clinica avanzada para agenda, pacientes, odontograma, pagos y reportes.
            </p>
            <div className="flex flex-col gap-3 mt-6 text-left text-xs text-slate-400">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <span className="material-symbols-outlined text-blue-400">verified</span>
                <span>Historial clinico centralizado</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <span className="material-symbols-outlined text-blue-400">calendar_month</span>
                <span>Agenda inteligente de citas</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <span className="material-symbols-outlined text-blue-400">analytics</span>
                <span>Indicadores y reportes en tiempo real</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center md:text-left">
              <h2 className="font-['Geist'] text-2xl font-bold text-white">Iniciar sesion</h2>
              <p className="text-sm text-slate-400 mt-1">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electronico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Contrasena</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena"
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">
                  Olvidaste tu contrasena?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} DentalCare. Todos los derechos reservados.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
