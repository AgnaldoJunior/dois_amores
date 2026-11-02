-- =============================================================================
-- Avatar ilustrado: a pessoa escolhe entre a foto e um avatar montado no app.
-- avatar_config guarda as escolhas (índices das paletas e ids das opções);
-- o app valida o formato (src/lib/avatar/config.ts) e cai para a foto se algo
-- estiver errado.
-- =============================================================================

alter table public.profiles
  add column avatar_mode text not null default 'photo'
    check (avatar_mode in ('photo', 'illustrated')),
  add column avatar_config jsonb
    check (avatar_config is null or (jsonb_typeof(avatar_config) = 'object' and pg_column_size(avatar_config) <= 1024));

grant update (avatar_mode, avatar_config) on public.profiles to authenticated;
