import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/AppContexts';
import { ConfirmDialog, ErrorState, Field, Loading, Modal } from '../../components/common/ui';
import { announcementFormSchema, type AnnouncementForm } from '../../utils/schemas';
import type { Announcement } from '../../types';
import { fmtDate } from '../../utils/format';

function Editor({ initial, onClose, onSaved }: { initial: Announcement | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: { title: initial?.title ?? '', description: initial?.description ?? '', category: initial?.category ?? '', expiresAt: initial?.expiresAt?.slice(0, 10) ?? '', isPublished: initial?.isPublished ?? false },
  });
  return (
    <Modal title={initial ? 'Edit announcement' : 'New announcement'} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={handleSubmit(async (v) => {
        try {
          await api.saveAnnouncement({ title: v.title, description: v.description, category: v.category || null, isPublished: v.isPublished,
            expiresAt: v.expiresAt ? new Date(`${v.expiresAt}T23:59:59`).toISOString() : null }, initial?.id);
          toast('success', 'Announcement saved'); onSaved(); onClose();
        } catch (e) { toast('error', (e as Error).message); }
      })}>
        <Field label="Title *" error={errors.title?.message}><input className="input" {...register('title')} /></Field>
        <Field label="Description *" error={errors.description?.message}><textarea className="input min-h-[120px]" {...register('description')} /></Field>
        <Field label="Category"><input className="input" {...register('category')} /></Field>
        <Field label="Expiry date (optional)"><input className="input" type="date" {...register('expiresAt')} /></Field>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" {...register('isPublished')} />Published</label>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>Save</button></div>
      </form>
    </Modal>
  );
}

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<Announcement | 'new' | null>(null);
  const [del, setDel] = useState<Announcement | null>(null);
  const load = useCallback(() => { api.announcements({ includeAll: true, pageSize: 100 }, true).then((r) => setRows(r.data)).catch((e: Error) => setErr(e.message)); }, []);
  useEffect(load, [load]);
  const toggle = async (a: Announcement) => { try { await api.saveAnnouncement({ isPublished: !a.isPublished }, a.id); toast('success', a.isPublished ? 'Unpublished' : 'Published'); load(); } catch (e) { toast('error', (e as Error).message); } };
  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <div className="flex items-center"><h2 className="mr-auto text-xl font-bold">Announcements</h2><button className="btn-primary" onClick={() => setEdit('new')}><Plus className="h-4 w-4" />New</button></div>
      {rows.length === 0 && <p className="muted">No announcements yet.</p>}
      <ul className="space-y-2">{rows.map((a) => <li key={a.id} className="card flex flex-wrap items-center gap-2 p-3">
        <div className="mr-auto"><p className="font-semibold">{a.title}</p><p className="muted">{a.isPublished ? 'Published' : 'Draft'} · {fmtDate(a.publishedAt)}{a.expiresAt && ` · expires ${fmtDate(a.expiresAt)}`}</p></div>
        <button className="btn-ghost" onClick={() => toggle(a)}>{a.isPublished ? 'Unpublish' : 'Publish'}</button>
        <button className="btn-ghost" aria-label={`Edit ${a.title}`} onClick={() => setEdit(a)}><Pencil className="h-4 w-4" /></button>
        <button className="btn-ghost" aria-label={`Delete ${a.title}`} onClick={() => setDel(a)}><Trash2 className="h-4 w-4" /></button></li>)}</ul>
      {edit && <Editor initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={load} />}
      {del && <ConfirmDialog danger title="Delete announcement" text={`Delete “${del.title}” permanently?`} confirmLabel="Delete" onCancel={() => setDel(null)}
        onConfirm={async () => { try { await api.deleteAnnouncement(del.id); toast('success', 'Deleted'); load(); } catch (e) { toast('error', (e as Error).message); } setDel(null); }} />}
    </div>
  );
}
