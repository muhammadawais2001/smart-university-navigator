import { db } from '../config/supabase.js';

/** Append-only audit trail. Never pass passwords, tokens or secrets in `details`. */
export async function audit(actorId: string, action: string, entityType: string, entityId: string | null, details: Record<string, unknown> = {}) {
  const { error } = await db().from('audit_logs').insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details });
  if (error) console.error('[audit] failed to write log:', error.code);
}
