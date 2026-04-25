-- ============================================================
-- Family Hub — Fase 1: tabela profiles + trigger
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- 1. Tabela profiles
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  nome       text        not null,
  cor        text        not null default '#4f46e5',
  papel      text        not null default 'membro'
               check (papel in ('admin', 'membro', 'junior')),
  avatar_url text,
  criado_em  timestamptz not null default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

create policy "perfil visível pelo próprio usuário"
  on public.profiles for select
  using (auth.uid() = id);

create policy "perfil editável pelo próprio usuário"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Função: cria perfil automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'membro'
  );
  return new;
end;
$$;

-- 4. Trigger: dispara após inserção em auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
