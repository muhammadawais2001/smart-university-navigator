import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AppContexts';
import { Loading } from '../../components/common/ui';

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-navy-800 text-white dark:bg-teal-600' : 'hover:bg-slate-200 dark:hover:bg-navy-800'}`;

export default function AdminLayout() {
  const { loading, session, isAdmin, role, signOut } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <div role="alert" className="card p-6"><h1 className="text-xl font-bold">Access denied</h1><p className="muted mt-1">Your account does not have administrator permissions.</p><button className="btn-ghost mt-3" onClick={signOut}>Sign out</button></div>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Admin <span className="muted">({role})</span></h1>
        <button className="btn-ghost" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</button>
      </div>
      <nav className="flex flex-wrap gap-1" aria-label="Admin">
        <NavLink end to="/admin" className={tab}>Overview</NavLink><NavLink to="/admin/locations" className={tab}>Locations</NavLink>
        <NavLink to="/admin/announcements" className={tab}>Announcements</NavLink><NavLink to="/admin/feedback" className={tab}>Feedback</NavLink>
        <NavLink to="/admin/audit" className={tab}>Audit log</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
