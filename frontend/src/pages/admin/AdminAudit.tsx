import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AuditLog } from '../../types';
import { ErrorState, Loading, Pagination } from '../../components/common/ui';

export default function AdminAudit() {
  const [rows, setRows] = useState<AuditLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.auditLogs({ page, pageSize: 20 }).then((r) => { setRows(r.data); setTotal(r.meta?.total ?? 0); }).catch((e: Error) => setErr(e.message)); }, [page]);
  if (err) return <ErrorState message={err} />;
  if (!rows) return <Loading />;
  return (
    <div className="space-y-3"><h2 className="text-xl font-bold">Audit log</h2>
      <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 dark:border-navy-700"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Entity</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-slate-100 dark:border-navy-800"><td className="p-3">{new Date(r.createdAt).toLocaleString()}</td><td className="p-3">{r.actorEmail ?? '—'}</td><td className="p-3 font-medium">{r.action}</td><td className="p-3">{r.entityType}</td></tr>)}</tbody></table></div>
      <Pagination page={page} total={total} pageSize={20} onPage={setPage} /></div>
  );
}
