import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useCampusData, useToast } from '../../contexts/AppContexts';
import { ConfirmDialog, ErrorState, Field, Loading, Modal, Pagination, StatusBadge } from '../../components/common/ui';
import { locationFormSchema, type LocationForm } from '../../utils/schemas';
import type { Location } from '../../types';

const PAGE = 10;
const empty: LocationForm = { name: '', categoryId: '', buildingName: '', description: '', aliases: '', latitude: null, longitude: null,
  entranceLatitude: null, entranceLongitude: null, openingHours: '', accessibilityNotes: '', publicAccess: 'UNKNOWN', verificationStatus: 'NEEDS_CONFIRMATION', isPublished: false };

function LocationEditor({ initial, onClose, onSaved }: { initial: Location | null; onClose: () => void; onSaved: () => void }) {
  const { categories } = useCampusData();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LocationForm>({
    resolver: zodResolver(locationFormSchema) as never,
    defaultValues: initial ? { name: initial.name, categoryId: initial.categoryId ?? '', buildingName: initial.buildingName ?? '', description: initial.description ?? '',
      aliases: initial.aliases.join(', '), latitude: initial.latitude, longitude: initial.longitude, entranceLatitude: initial.entranceLatitude, entranceLongitude: initial.entranceLongitude,
      openingHours: initial.openingHours ?? '', accessibilityNotes: initial.accessibilityNotes ?? '', publicAccess: initial.publicAccess, verificationStatus: initial.verificationStatus, isPublished: initial.isPublished } : empty,
  });

  async function upload(): Promise<string | undefined> {
    if (!file) return undefined;
    if (!supabase) throw new Error('Storage is not configured');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) throw new Error('Photo must be JPG, PNG or WebP under 3 MB');
    const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    const { error } = await supabase.storage.from('location-images').upload(path, file, { contentType: file.type });
    if (error) throw new Error('Photo upload failed');
    return supabase.storage.from('location-images').getPublicUrl(path).data.publicUrl;
  }

  const submit = handleSubmit(async (v) => {
    setServerErr(null);
    try {
      const imageUrl = await upload();
      const body = { name: v.name, categoryId: v.categoryId || null, buildingName: v.buildingName || null, description: v.description || null,
        aliases: (v.aliases ?? '').split(',').map((s) => s.trim()).filter(Boolean), latitude: v.latitude, longitude: v.longitude,
        entranceLatitude: v.entranceLatitude, entranceLongitude: v.entranceLongitude, openingHours: v.openingHours || null,
        accessibilityNotes: v.accessibilityNotes || null, publicAccess: v.publicAccess, verificationStatus: v.verificationStatus, isPublished: v.isPublished,
        ...(imageUrl ? { imageUrl } : {}) };
      await api.saveLocation(body, initial?.id);
      toast('success', initial ? 'Location updated' : 'Location created'); onSaved(); onClose();
    } catch (e) { setServerErr(e instanceof ApiError ? `${e.message}${e.details ? ': ' + e.details.map((d) => d.message).join('; ') : ''}` : (e as Error).message); }
  });

  return (
    <Modal title={initial ? 'Edit location' : 'Add location'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Name *" error={errors.name?.message}><input className="input" {...register('name')} /></Field></div>
        <Field label="Category"><select className="input" {...register('categoryId')}><option value="">Uncategorised</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Building"><input className="input" {...register('buildingName')} /></Field>
        <div className="sm:col-span-2"><Field label="Description"><textarea className="input min-h-[80px]" {...register('description')} /></Field></div>
        <div className="sm:col-span-2"><Field label="Aliases (comma separated)"><input className="input" {...register('aliases')} /></Field></div>
        <Field label="Latitude (verified only)" error={errors.latitude?.message as string}><input className="input" inputMode="decimal" {...register('latitude')} /></Field>
        <Field label="Longitude" error={errors.longitude?.message as string}><input className="input" inputMode="decimal" {...register('longitude')} /></Field>
        <Field label="Entrance latitude" error={errors.entranceLatitude?.message as string}><input className="input" inputMode="decimal" {...register('entranceLatitude')} /></Field>
        <Field label="Entrance longitude" error={errors.entranceLongitude?.message as string}><input className="input" inputMode="decimal" {...register('entranceLongitude')} /></Field>
        <Field label="Opening hours (only if verified)"><input className="input" {...register('openingHours')} /></Field>
        <Field label="Public access"><select className="input" {...register('publicAccess')}><option value="UNKNOWN">Unknown</option><option value="PUBLIC">Public</option><option value="RESTRICTED">Restricted</option></select></Field>
        <div className="sm:col-span-2"><Field label="Accessibility notes (only if verified)"><textarea className="input" {...register('accessibilityNotes')} /></Field></div>
        <Field label="Verification status" error={errors.verificationStatus?.message}><select className="input" {...register('verificationStatus')}><option value="NEEDS_CONFIRMATION">Needs confirmation</option><option value="DEMO_ONLY">Demo only</option><option value="VERIFIED">Verified</option></select></Field>
        <Field label="Photo (JPG/PNG/WebP, ≤3 MB, only if authorised)"><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
        <label className="flex min-h-[44px] items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="h-5 w-5" {...register('isPublished')} />Published (visible to the public)</label>
        {serverErr && <p role="alert" className="field-error sm:col-span-2">{serverErr}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}

export default function AdminLocations() {
  const { reload } = useCampusData();
  const { toast } = useToast();
  const [rows, setRows] = useState<Location[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<Location | 'new' | null>(null);
  const [del, setDel] = useState<Location | null>(null);

  const load = useCallback(() => {
    setErr(null);
    api.locations({ q, page, pageSize: PAGE, includeUnpublished: true }, true).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e: Error) => setErr(e.message));
  }, [q, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const refreshAll = () => { load(); reload(); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><h2 className="mr-auto text-xl font-bold">Locations</h2>
        <input className="input !w-56" type="search" aria-label="Search locations" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button className="btn-primary" onClick={() => setEdit('new')}><Plus className="h-4 w-4" />Add</button></div>
      {err ? <ErrorState message={err} onRetry={load} /> : !rows ? <Loading /> :
        <div className="card overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-navy-700"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Pin</th><th className="p-3">Published</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((l) => <tr key={l.id} className="border-b border-slate-100 dark:border-navy-800">
            <td className="p-3 font-medium">{l.name}</td><td className="p-3">{l.category?.name ?? '—'}</td><td className="p-3"><StatusBadge status={l.verificationStatus} /></td>
            <td className="p-3">{l.latitude !== null ? 'Yes' : 'No'}</td><td className="p-3">{l.isPublished ? 'Yes' : 'No'}</td>
            <td className="flex gap-1 p-3"><button className="btn-ghost !min-h-[40px] p-2" aria-label={`Edit ${l.name}`} onClick={() => setEdit(l)}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost !min-h-[40px] p-2" aria-label={`Delete ${l.name}`} onClick={() => setDel(l)}><Trash2 className="h-4 w-4" /></button></td></tr>)}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center muted">No locations found.</td></tr>}</tbody></table></div>}
      <Pagination page={page} total={total} pageSize={PAGE} onPage={setPage} />
      {edit && <LocationEditor initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={refreshAll} />}
      {del && <ConfirmDialog danger title="Delete location" text={`Permanently delete “${del.name}”? Consider unpublishing instead. This cannot be undone.`} confirmLabel="Delete"
        onCancel={() => setDel(null)} onConfirm={async () => { try { await api.deleteLocation(del.id); toast('success', 'Location deleted'); setDel(null); refreshAll(); } catch (e) { toast('error', (e as Error).message); setDel(null); } }} />}
    </div>
  );
}
