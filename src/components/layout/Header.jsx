import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick, theme, onToggleTheme }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-[86px] bg-[#0F172A] border-b border-slate-700/50 flex items-center justify-between gap-4 px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center flex-1 max-w-[385px] bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-500 shadow-inner focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <span className="material-symbols-outlined text-[20px]">search</span>
          <input
            type="search"
            placeholder="Buscar pacientes, citas, DNI..."
            className="w-full bg-transparent border-0 px-2 text-sm text-white placeholder-slate-500 outline-none focus:shadow-none focus:ring-0"
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
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700 app-icon-button"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="material-symbols-outlined text-[22px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/configuracion')}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700 app-icon-button"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
        <Link
          to="/notificaciones"
          className="relative p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">0</span>
        </Link>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700/60">
          <div className="hidden sm:block text-right max-w-[180px]">
            <p className="text-sm font-['Geist'] font-semibold text-white leading-tight m-0">{user?.nombre || 'Usuario'}</p>
            <p className="text-xs text-slate-400 m-0">{user?.rol || 'ADMINISTRADOR'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-400/70 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <span className="hidden md:inline material-symbols-outlined text-slate-400 text-sm">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
