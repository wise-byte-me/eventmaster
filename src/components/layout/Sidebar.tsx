import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, CreditCard, IdCard,
  ScanLine, CalendarClock, Layers, Building2, Activity,
  Plug, Receipt, UserCog, Settings, LogOut, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const nav = [
  { label: 'Dashboard',    to: '/',            icon: LayoutDashboard },
  { label: 'Events',       to: '/events',      icon: CalendarDays },
  { label: 'People',       to: '/people',      icon: Users },
  { label: 'Credentials',  to: '/credentials', icon: IdCard },
  { label: 'Cards',        to: '/cards',       icon: CreditCard },
  { label: 'Check-In',     to: '/checkin',     icon: ScanLine },
  { label: 'Planner',      to: '/planner',     icon: CalendarClock },
  { label: 'Sessions',     to: '/sessions',    icon: Layers },
  { label: 'Expo',         to: '/expo',        icon: Building2 },
  { label: 'Pulse',        to: '/pulse',       icon: Activity },
  { label: 'Integrations', to: '/integrations',icon: Plug },
  { label: 'Billing',      to: '/billing',     icon: Receipt },
  { label: 'Team',         to: '/team',        icon: UserCog },
  { label: 'Settings',     to: '/settings',    icon: Settings },
];

export function Sidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Zap size={15} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Event Table</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(({ label, to, icon: Icon }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">{user?.email}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 w-full rounded"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
