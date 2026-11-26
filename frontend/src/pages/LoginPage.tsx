import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AppContexts';
import { loginSchema } from '../utils/schemas';
import { Field } from '../components/common/ui';

export default function LoginPage() {
  const { signIn, configured, isAdmin, session } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  if (session && isAdmin) return <Navigate to="/admin" replace />;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">Administrator sign in</h1>
      <p className="muted mb-4">For authorised campus-data administrators only.</p>
      {!configured && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>}
      <form className="card space-y-4 p-5" noValidate onSubmit={handleSubmit(async (v) => {
        setError(null);
        try { await signIn(v.email, v.password); nav('/admin'); } catch (e) { setError((e as Error).message); }
      })}>
        <Field label="Email" error={errors.email?.message}><input className="input" type="email" autoComplete="username" {...register('email')} /></Field>
        <Field label="Password" error={errors.password?.message}><input className="input" type="password" autoComplete="current-password" {...register('password')} /></Field>
        {error && <p role="alert" className="field-error">{error}</p>}
        <button className="btn-primary w-full" disabled={isSubmitting || !configured}>Sign in</button>
      </form>
      {session && !isAdmin && <p className="muted mt-3">You are signed in but your account does not have administrator permissions.</p>}
    </div>
  );
}
