import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#1E293B] border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="font-['Geist'] text-lg font-bold text-white hidden md:block">
          DentalCare System
        </h1>
      </div>
      <div className="flex items-center gap-3">
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
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-none">{user?.nombre || 'Usuario'}</p>
            <p className="text-[11px] text-slate-400">{user?.rol || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;