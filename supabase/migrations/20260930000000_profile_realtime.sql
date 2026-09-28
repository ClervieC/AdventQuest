-- =====================================================================
-- Temps réel sur les profils : quand l'admin change le rôle ou les jours d'un testeur,
-- l'appli du joueur est prévenue et se met à jour tout de suite (sans relancer l'appli).
-- La policy « Chacun lit son profil » s'applique : chaque joueur ne reçoit que sa propre ligne.
-- Idempotente : peut être rejouée sans erreur.
-- =====================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
