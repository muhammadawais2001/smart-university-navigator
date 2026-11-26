import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, Compass, Home, Map as MapIcon, Moon, Navigation, Search, Shield, Sun } from 'lucide-react';
import { useAuth, useTheme } from '../../contexts/AppContexts';
import { DISCLAIMER } from '../../config';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/explore', label: 'Explore', icon: Search },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/directions', label: 'Directions', icon: Navigation },
  { to: '/announcements', label: 'News', icon: Bell },
];
const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10'}`;

export default function Layout() {
  const { dark, toggle } = useTheme();
  const { isAdmin, session } = useAuth();
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[3000] focus:m-2 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <header className="sticky top-0 z-[1200] bg-navy-800 pt-[env(safe-area-inset-top)] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold"><Compass className="h-6 w-6 text-teal-400" aria-hidden /><span>Smart University Navigator</span></Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
            {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-white/10" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {!session && <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10">Admin login</Link>}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-5"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400">
        <p className="font-medium">{DISCLAIMER}</p>
        <p className="mt-1">Map data © <a className="underline" href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <Link className="underline" to="/report">Report incorrect information</Link> · <Link className="underline" to="/privacy">Privacy</Link></p>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-[1200] grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-navy-700 dark:bg-navy-900 md:hidden" aria-label="Mobile">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-teal-600' : 'text-slate-500'}`}>
            <n.icon className="h-5 w-5" aria-hidden />{n.label}
          </NavLink>
        ))}
      </nav>
      {isAdmin && <Link to="/admin" className="fixed bottom-20 right-3 z-[1100] rounded-full bg-navy-800 p-3 text-white shadow-lg md:hidden" aria-label="Admin dashboard"><Shield className="h-5 w-5" /></Link>}
    </div>
  );
}
