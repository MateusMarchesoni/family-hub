-- ============================================================
-- Family Hub — Fase 2: Mural de Avisos
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- 1. Tabela announcements
create table public.announcements (
  id         uuid        primary key default gen_random_uuid(),
  autor_id   uuid        not null references public.profiles(id) on delete cascade,
  texto      text        not null,
  categoria  text        not null
               check (categoria in ('Importante', 'Lembrete', 'Recado', 'Conquista')),
  fixado     boolean     not null default false,
  imagem_url text,
  criado_em  timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "autenticados podem ler avisos"
  on public.announcements for select to authenticated
  using (true);

create policy "autenticados podem criar avisos"
  on public.announcements for insert to authenticated
  with check (autor_id = auth.uid());

create policy "autor pode deletar seu aviso"
  on public.announcements for delete to authenticated
  using (autor_id = auth.uid());

-- 2. Tabela reactions
create table public.reactions (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id)      on delete cascade,
  emoji            text not null,
  unique (announcement_id, profile_id, emoji)
);

alter table public.reactions enable row level security;

create policy "autenticados podem ler reações"
  on public.reactions for select to authenticated
  using (true);

create policy "autenticados podem reagir"
  on public.reactions for insert to authenticated
  with check (profile_id = auth.uid());

create policy "usuário pode remover sua reação"
  on public.reactions for delete to authenticated
  using (profile_id = auth.uid());
