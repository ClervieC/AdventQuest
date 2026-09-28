-- =====================================================================
-- Retours des testeurs : marquer un retour comme traité (archive)
-- Un retour traité n'est pas supprimé : il reste consultable dans l'archive
-- et peut être remis « à traiter ».
-- Idempotente : peut être rejouée sans erreur.
-- =====================================================================

alter table public.feedback add column if not exists resolved_at timestamptz;

-- La liste renvoie maintenant aussi resolved_at (null = à traiter).
-- On la recrée pour que son type de retour suive la nouvelle colonne de la table.
drop function if exists public.admin_list_feedback(integer);
create function public.admin_list_feedback(p_limit integer default 200)
returns setof public.feedback
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  return query select * from public.feedback order by created_at desc limit least(greatest(p_limit, 1), 1000);
end;
$$;

-- Marquer un retour comme traité (p_resolved = true) ou le remettre à traiter (false)
create or replace function public.admin_set_feedback_resolved(p_id bigint, p_resolved boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'not_admin'; end if;
  update public.feedback
  set resolved_at = case when p_resolved then coalesce(resolved_at, now()) else null end
  where id = p_id;
end;
$$;

revoke execute on function public.admin_list_feedback(integer) from public, anon;
grant execute on function public.admin_list_feedback(integer) to authenticated;
revoke execute on function public.admin_set_feedback_resolved(bigint, boolean) from public, anon;
grant execute on function public.admin_set_feedback_resolved(bigint, boolean) to authenticated;
