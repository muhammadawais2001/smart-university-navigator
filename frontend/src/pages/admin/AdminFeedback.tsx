import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/AppContexts';
import { EmptyState, ErrorState, Loading, Pagination } from '../../components/common/ui';
import type { FeedbackReport, FeedbackStatus } from '../../types';
import { FEEDBACK_LABEL, fmtDate } from '../../utils/format';

const STATUSES: FeedbackStatus[] = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];
export default function AdminFeedback() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FeedbackReport[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => { api.feedback({ page, pageSize: 10, status }).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e: Error) => setErr(e.message)); }, [page, status]);
  useEffect(load, [load]);
  async function set(f: FeedbackReport, s: FeedbackStatus) {
    try { await api.updateFeedback(f.id, { status: s, adminNotes: f.adminNotes }); toast('success', `Marked ${s.toLowerCase()}`); load(); } catch (e) { toast('error', (e as Error).message); }
  }
  if (err) return <ErrorState message={err} onRetry={load} />;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><h2 className="mr-auto text-xl font-bold">Feedback reports</h2>
        <select className="input !w-44" aria-label="Filter status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      {!rows ? <Loading /> : rows.length === 0 ? <EmptyState title="No reports" /> :
        <ul className="space-y-2">{rows.map((f) => <li key={f.id} className="card p-4 text-sm">
          <p className="font-semibold">{FEEDBACK_LABEL[f.type]}{f.location && ` · ${f.location.name}`}</p>
          <p className="muted">{fmtDate(f.createdAt)}{f.contact && ` · ${f.contact}`}</p>
          <p className="mt-1 whitespace-pre-line">{f.description}</p>
          <label className="mt-2 flex items-center gap-2"><span className="label !mb-0">Status</span>
            <select className="input !w-40" value={f.status} onChange={(e) => set(f, e.target.value as FeedbackStatus)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label></li>)}</ul>}
      <Pagination page={page} total={total} pageSize={10} onPage={setPage} />
    </div>
  );
}
