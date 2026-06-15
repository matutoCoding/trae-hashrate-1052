import { NavLink } from 'react-router-dom';
import { ClipboardList, Search, AlertTriangle, FolderKanban, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: '特征录入', icon: ClipboardList },
  { to: '/match', label: '比对研判', icon: Search },
  { to: '/risk', label: '风险警示', icon: AlertTriangle },
  { to: '/archive', label: '踏查档案', icon: FolderKanban },
  { to: '/gallery', label: '入门图鉴', icon: BookOpen },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-mushroom-200 shadow-[0_-4px_20px_rgba(26,77,46,0.08)] safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300',
                isActive
                  ? 'text-forest-800 bg-forest-100 scale-105'
                  : 'text-mushroom-600 hover:text-forest-700 hover:bg-mushroom-100'
              )
            }
          >
            <Icon className="w-5 h-5" strokeWidth={isActive => isActive ? 2.5 : 2 as any} />
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
