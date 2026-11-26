-- Manual RLS checks. Run in the Supabase SQL editor against a TEST project (not executed in CI here).
-- Each block should behave as the comment says. Wrap in a transaction and roll back.
begin;
set local role anon;
select count(*) as public_can_read_published from public.locations;           -- > 0 only for published rows
select count(*) as public_cannot_see_audit from public.audit_logs;            -- 0 rows
do $$ begin
  begin insert into public.locations (name, slug) values ('Hack', 'hack');
    raise exception 'FAIL: anon inserted a location';
  exception when insufficient_privilege or others then raise notice 'ok: anon insert blocked (%).', sqlerrm; end;
end $$;
insert into public.feedback_reports (type, description) values ('OTHER', 'RLS test feedback entry');  -- allowed
select count(*) as anon_cannot_read_feedback from public.feedback_reports;    -- 0 rows
rollback;
