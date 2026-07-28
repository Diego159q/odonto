import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const mainNav = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['ADMINISTRADOR', 'ODONTOLOGA', 'RECEPCIONISTA'] },
  { path: '/calendario-citas', icon: 'calendar_month', label: 'Agenda', roles: ['ADMINISTRADOR', 'ODONTOLOGA', 'RECEPCIONISTA'] },
  { path: '/pacientes', icon: 'group', label: 'Pacientes', roles: ['ADMINISTRADOR', 'ODONTOLOGA', 'RECEPCIONISTA'] },
  { path: '/tratamientos', icon: 'heart_plus', label: 'Tratamientos', roles: ['ADMINISTRADOR', 'ODONTOLOGA'] },
  { path: '/pagos', icon: 'payments', label: 'Pagos', roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
];

const secondaryNav = [
  { path: '/citas', icon: 'calendar_check', label: 'Lista Citas', roles: ['ADMINISTRADOR', 'ODONTOLOGA', 'RECEPCIONISTA'] },
  { path: '/diagnosticos', icon: 'biopsy', label: 'Diagnósticos', roles: ['ADMINISTRADOR', 'ODONTOLOGA'] },
  { path: '/planes-tratamiento', icon: 'description', label: 'Planes', roles: ['ADMINISTRADOR', 'ODONTOLOGA'] },
  { path: '/recetas', icon: 'medication', label: 'Recetas', roles: ['ADMINISTRADOR', 'ODONTOLOGA'] },
  { path: '/inventario', icon: 'inventory_2', label: 'Inventario', roles: ['ADMINISTRADOR'] },
  { path: '/proveedores', icon: 'local_shipping', label: 'Proveedores', roles: ['ADMINISTRADOR'] },
  { path: '/usuarios', icon: 'badge', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { path: '/reportes', icon: 'bar_chart', label: 'Reportes', roles: ['ADMINISTRADOR'] },
  { path: '/configuracion', icon: 'settings', label: 'Configuración', roles: ['ADMINISTRADOR'] },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-[#1E293B] flex flex-col py-6 px-4 z-50 border-r border-slate-700/50 shadow-2xl shadow-black/30 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
          <span className="material-symbols-outlined text-[26px]">dentistry</span>
        </div>
        <div className="flex flex-col">
          <span className="font-['Geist'] text-2xl font-bold text-white tracking-tight leading-none">
            DentalCare
          </span>
          <span className="font-['Geist'] text-xs text-slate-400 mt-0.5 font-medium">
            {user?.rol?.toLowerCase() === 'administrador' ? 'Administrador' : user?.rol || 'Gestión Clínica'}
          </span>
        </div>
        <button type="button" onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">
          Principal
        </div>
        {mainNav.filter(item => hasRole(item.roles)).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border-l-4 border-blue-500 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {secondaryNav.filter(item => hasRole(item.roles)).length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1 pt-4">
              Más Opciones
            </div>
            {secondaryNav.filter(item => hasRole(item.roles)).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border-l-4 border-blue-500 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-slate-700/50 pt-4 space-y-2">
        <button
          onClick={() => { navigate('/citas/nueva'); onClose?.(); }}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-['Geist'] font-semibold text-sm mb-3 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Nueva cita</span>
        </button>
        <button
          onClick={() => { navigate('/notificaciones'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span>Notificaciones</span>
        </button>
        <button
          onClick={() => { navigate('/perfil'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span>Mi Perfil</span>
        </button>
        <button
          onClick={() => { logout(); navigate('/login'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[20px] text-rose-400">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
