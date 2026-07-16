import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, Droplet, X } from 'lucide-react';
import { getNavigationForRole } from '../../config/navigation';

export default function Sidebar({ role, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const items = getNavigationForRole(role);

  return (
    <>
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          flex flex-col
          bg-white dark:bg-ink-900
          border-r border-ink-200 dark:border-ink-800
          transition-all duration-200 ease-in-out
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}
          w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-ink-200 dark:border-ink-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-mango-500 to-lime-500 text-white shrink-0">
              <Droplet size={18} fill="currentColor" />
            </span>
            {!collapsed && (
              <span className="font-display font-bold text-lg whitespace-nowrap">
                ODY
              </span>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-ink-700 dark:text-ink-100"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-1">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-mango-50 text-mango-600 dark:bg-mango-500/10 dark:text-mango-400'
                  : 'text-ink-700 hover:bg-ink-100 dark:text-ink-100/80 dark:hover:bg-ink-800'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-gradient-to-b from-mango-500 to-lime-500" />
                  )}
                  <Icon size={19} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2 h-12 px-4 border-t border-ink-200 dark:border-ink-800 text-ink-700 dark:text-ink-100/80 hover:bg-ink-100 dark:hover:bg-ink-800 text-sm"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>Contraer menú</span>}
        </button>
      </aside>
    </>
  );
}
