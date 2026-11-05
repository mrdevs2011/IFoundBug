-- FoundBug V5: sync security-critical functions from V2 into production.
-- Found 2026-11-05: production still ran older bodies without permission/visibility checks.
-- Bodies are copied verbatim from V2_PUBLIC_MODEL.sql. CREATE OR REPLACE keeps existing grants.

begin;

create or replace function public.ifb_bug_visible(p_bug uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ifb_bugs b
                 where b.id = p_bug
                   and ((b.share_token is null and not b.is_sensitive and exists (
                          select 1 from public.ifb_projects p where p.id = b.project_id and p.is_public))
                        or b.reported_by = public.ifb_my_profile_id()
                        or public.ifb_is_member(b.project_id)))
$$;

create or replace function public.ifb_update_bug_status(target_bug_id uuid, new_status text)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  if not public.ifb_can_triage(v_bug.project_id) then raise exception 'Only the project team can change status'; end if;
  if v_bug.status = new_status then return v_bug; end if;
  update public.ifb_bugs set status = new_status, resolved_at = case when new_status = 'FIXED' then now() else null end
    where id = target_bug_id returning * into v_bug;
  insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
    values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', new_status));
  return v_bug;
end; $$;

create or replace function public.ifb_update_bug_criteria(target_bug_id uuid, new_criteria jsonb)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype; v_all_checked boolean; v_old_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if new_criteria is null or jsonb_typeof(new_criteria) <> 'array' or jsonb_array_length(new_criteria) > 100 then
    raise exception 'Acceptance criteria must be an array with at most 100 items';
  end if;
  if exists (select 1 from jsonb_array_elements(new_criteria) item
             where jsonb_typeof(item) <> 'object'
                or jsonb_typeof(item->'text') <> 'string'
                or length(item->>'text') > 500
                or (item ? 'checked' and jsonb_typeof(item->'checked') <> 'boolean')) then
    raise exception 'Each acceptance criterion must contain text and an optional boolean checked field';
  end if;
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  if not public.ifb_can_triage(v_bug.project_id) then
    raise exception 'Only project team members can update acceptance criteria';
  end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  v_old_status := v_bug.status;
  v_all_checked := jsonb_array_length(new_criteria) > 0
    and not exists (select 1 from jsonb_array_elements(new_criteria) as criteria(item) where coalesce(item->>'checked', 'false') <> 'true');
  update public.ifb_bugs
     set acceptance_criteria = new_criteria,
         status = case when v_all_checked and status not in ('FIXED','CLOSED','WONT_FIX') then 'READY_FOR_QA' else status end
   where id = target_bug_id returning * into v_bug;
  if v_bug.status is distinct from v_old_status then
    insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
    values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', v_bug.status, 'source', 'acceptance_criteria'));
  end if;
  return v_bug;
end; $$;

create or replace function public.ifb_toggle_bug_upvote(target_bug_id uuid, user_id_str text, reproduced_flag boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing uuid; v_existing_reproduced boolean; v_upvotes integer; v_reproduced integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ifb_bug_visible(target_bug_id) then raise exception 'Bug not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_bug_id::text || ':' || auth.uid()::text, 0));
  select id, is_reproduced into v_existing, v_existing_reproduced
    from public.ifb_bug_upvotes where bug_id = target_bug_id and user_identifier = auth.uid()::text for update;
  if v_existing is not null then
    delete from public.ifb_bug_upvotes where id = v_existing;
    update public.ifb_bugs set upvotes_count = greatest(0, upvotes_count - 1),
      reproduced_count = case when v_existing_reproduced then greatest(0, reproduced_count - 1) else reproduced_count end
      where id = target_bug_id returning upvotes_count, reproduced_count into v_upvotes, v_reproduced;
    return jsonb_build_object('voted', false, 'upvotes', v_upvotes, 'reproduced', v_reproduced);
  end if;
  insert into public.ifb_bug_upvotes(bug_id, user_identifier, is_reproduced)
    values (target_bug_id, auth.uid()::text, reproduced_flag);
  update public.ifb_bugs set upvotes_count = upvotes_count + 1,
    reproduced_count = reproduced_count + case when reproduced_flag then 1 else 0 end
    where id = target_bug_id returning upvotes_count, reproduced_count into v_upvotes, v_reproduced;
  return jsonb_build_object('voted', true, 'upvotes', v_upvotes, 'reproduced', v_reproduced);
end; $$;

create or replace function public.ifb_increment_bug_views(target_bug_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ifb_bug_visible(target_bug_id) then raise exception 'Bug not found'; end if;
  update public.ifb_bugs set views_count = views_count + 1 where id = target_bug_id;
end; $$;

commit;
