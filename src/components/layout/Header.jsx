import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick, theme, onToggleTheme }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#1E293B]/95 backdrop-blur border-b border-slate-700/50 flex items-center justify-between gap-4 px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="hidden md:block min-w-0">
          <div className="app-header-title font-['Geist'] text-lg font-bold text-white leading-none">DentalCare System</div>
          <p className="text-[11px] text-slate-500 mt-1">Gestion clinica integral</p>
        </div>

        <div className="hidden lg:flex items-center flex-1 max-w-xl bg-slate-900/80 border border-slate-700 rounded-2xl px-3 py-2.5 text-slate-500">
          <span className="material-symbols-outlined text-[20px]">search</span>
          <input
            type="search"
            placeholder="Buscar paciente, cita o tratamiento..."
            className="w-full bg-transparent border-0 px-2 text-sm text-slate-200 placeholder-slate-500 focus:shadow-none"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                navigate(`/pacientes?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/citas/nueva')}
          className="hidden sm:flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nueva cita
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors app-icon-button"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="material-symbols-outlined text-[22px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/configuracion')}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors app-icon-button"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
        <Link
          to="/notificaciones"
          className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">0</span>
        </Link>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block max-w-[150px]">
            <p className="text-sm font-medium text-white leading-none">{user?.nombre || 'Usuario'}</p>
            <p className="text-[11px] text-slate-400">{user?.rol || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
