-- ============================================================
-- Family Hub — Correção: perfis faltantes + política de insert
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- 1. Permite que o cliente crie o próprio perfil como fallback
--    (caso o trigger não tenha disparado no cadastro)
create policy "usuário pode inserir seu próprio perfil"
  on public.profiles for insert
  with check (id = auth.uid());

-- 2. Cria perfil para todos os usuários que ainda não têm um
insert into public.profiles (id, nome, papel)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'nome', split_part(u.email, '@', 1)),
  'membro'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
