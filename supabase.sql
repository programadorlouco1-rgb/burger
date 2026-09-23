-- Cokylicious / Supabase
-- Executa TODO este ficheiro no Supabase Dashboard > SQL Editor, num projeto NOVO e exclusivo
-- da Cokylicious (NÃO reutilizes o projeto da DESIGNE decoração nem de outro cliente).
-- Depois cria o primeiro utilizador em Authentication > Users e corre o INSERT indicado
-- no fim deste ficheiro com o UUID desse utilizador.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  emoji text not null default '',
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references public.categorias(id) on delete set null,
  nome text not null,
  descricao text not null default '',
  ingredientes text not null default '',   -- separados por vírgula
  etiqueta text not null default '',        -- ex.: "Mais pedido", "Novo"
  imagem_url text,
  preco numeric(14,2),                      -- pode ficar vazio: mostra "XX.XXX Kz" (a definir)
  extras jsonb not null default '[]',       -- [{"nome":"Bacon","preco":500}]
  opcoes jsonb not null default '[]',       -- ["Sem cebola","Sem molho"]
  disponivel boolean not null default true,
  destaque boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  itens text not null default '',           -- descrição livre: "Hambúrguer + Batata + Bebida"
  etiqueta text not null default '',
  imagem_url text,
  preco numeric(14,2),
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.galeria (
  id uuid primary key default gen_random_uuid(),
  imagem_url text not null,
  legenda text not null default '',
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  estrelas integer not null default 5 check (estrelas between 1 and 5),
  comentario text not null default '',
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_config (
  id integer primary key default 1,
  nome_empresa text not null default 'Cokylicious',
  slogan text not null default 'Good burgers. Good mood.',
  telefone text not null default '',
  whatsapp text not null default '',
  instagram text not null default 'https://www.instagram.com/cokylicious/',
  facebook text not null default 'https://www.facebook.com/profile.php?id=100064158276116',
  endereco text not null default '',
  maps_link text not null default '',
  mapa_query text not null default 'Cokylicious Luanda',
  pagamentos text not null default '',
  hero_titulo text not null default 'A tua fome acaba aqui.',
  hero_subtitulo text not null default 'Hambúrgueres, combos e muito sabor preparados para deixar a tua fome sem argumentos.',
  sobre_titulo text not null default 'Mais que um burger.',
  sobre_texto text not null default 'Na Cokylicious acreditamos que uma boa refeição não precisa de cerimónia. Precisa de sabor.',
  horario jsonb not null default '[
    {"dia":"Segunda","abre":"","fecha":"","fechado":false},
    {"dia":"Terça","abre":"","fecha":"","fechado":false},
    {"dia":"Quarta","abre":"","fecha":"","fechado":false},
    {"dia":"Quinta","abre":"","fecha":"","fechado":false},
    {"dia":"Sexta","abre":"","fecha":"","fechado":false},
    {"dia":"Sábado","abre":"","fecha":"","fechado":false},
    {"dia":"Domingo","abre":"","fecha":"","fechado":false}
  ]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);
insert into public.site_config (id) values (1) on conflict (id) do nothing;

create index if not exists produtos_disponivel_idx on public.produtos(disponivel);
create index if not exists produtos_categoria_idx on public.produtos(categoria_id);
create index if not exists produtos_destaque_idx on public.produtos(destaque);
create index if not exists produtos_ordem_idx on public.produtos(ordem);
create index if not exists categorias_ativo_idx on public.categorias(ativo);
create index if not exists categorias_ordem_idx on public.categorias(ordem);
create index if not exists combos_ativo_idx on public.combos(ativo);
create index if not exists galeria_ativo_idx on public.galeria(ativo);
create index if not exists avaliacoes_ativo_idx on public.avaliacoes(ativo);

alter table public.admin_users enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.combos enable row level security;
alter table public.galeria enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.site_config enable row level security;

-- Helper usado pelas policies. SECURITY DEFINER evita dependência de policies recursivas.
create or replace function public.is_coky_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_coky_admin() from public;
grant execute on function public.is_coky_admin() to anon, authenticated;

-- admin_users: nenhum visitante pode listar administradores; o próprio utilizador
-- autenticado pode verificar se o seu UUID está autorizado.
drop policy if exists "admin can read own authorization" on public.admin_users;
create policy "admin can read own authorization"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- Categorias: leitura pública apenas das ativas; administradores gerem tudo.
drop policy if exists "public reads active categorias" on public.categorias;
create policy "public reads active categorias"
on public.categorias for select
to anon, authenticated
using (ativo = true or public.is_coky_admin());
drop policy if exists "admins insert categorias" on public.categorias;
create policy "admins insert categorias" on public.categorias for insert to authenticated with check (public.is_coky_admin());
drop policy if exists "admins update categorias" on public.categorias;
create policy "admins update categorias" on public.categorias for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());
drop policy if exists "admins delete categorias" on public.categorias;
create policy "admins delete categorias" on public.categorias for delete to authenticated using (public.is_coky_admin());

-- Produtos: leitura pública apenas dos disponíveis; administradores gerem tudo.
drop policy if exists "public reads available produtos" on public.produtos;
create policy "public reads available produtos"
on public.produtos for select
to anon, authenticated
using (disponivel = true or public.is_coky_admin());
drop policy if exists "admins insert produtos" on public.produtos;
create policy "admins insert produtos" on public.produtos for insert to authenticated with check (public.is_coky_admin());
drop policy if exists "admins update produtos" on public.produtos;
create policy "admins update produtos" on public.produtos for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());
drop policy if exists "admins delete produtos" on public.produtos;
create policy "admins delete produtos" on public.produtos for delete to authenticated using (public.is_coky_admin());

-- Combos: leitura pública apenas dos ativos; administradores gerem tudo.
drop policy if exists "public reads active combos" on public.combos;
create policy "public reads active combos"
on public.combos for select
to anon, authenticated
using (ativo = true or public.is_coky_admin());
drop policy if exists "admins insert combos" on public.combos;
create policy "admins insert combos" on public.combos for insert to authenticated with check (public.is_coky_admin());
drop policy if exists "admins update combos" on public.combos;
create policy "admins update combos" on public.combos for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());
drop policy if exists "admins delete combos" on public.combos;
create policy "admins delete combos" on public.combos for delete to authenticated using (public.is_coky_admin());

-- Galeria: leitura pública apenas das ativas; administradores gerem tudo.
drop policy if exists "public reads active galeria" on public.galeria;
create policy "public reads active galeria"
on public.galeria for select
to anon, authenticated
using (ativo = true or public.is_coky_admin());
drop policy if exists "admins insert galeria" on public.galeria;
create policy "admins insert galeria" on public.galeria for insert to authenticated with check (public.is_coky_admin());
drop policy if exists "admins update galeria" on public.galeria;
create policy "admins update galeria" on public.galeria for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());
drop policy if exists "admins delete galeria" on public.galeria;
create policy "admins delete galeria" on public.galeria for delete to authenticated using (public.is_coky_admin());

-- Avaliações: leitura pública apenas das ativas; administradores gerem tudo.
drop policy if exists "public reads active avaliacoes" on public.avaliacoes;
create policy "public reads active avaliacoes"
on public.avaliacoes for select
to anon, authenticated
using (ativo = true or public.is_coky_admin());
drop policy if exists "admins insert avaliacoes" on public.avaliacoes;
create policy "admins insert avaliacoes" on public.avaliacoes for insert to authenticated with check (public.is_coky_admin());
drop policy if exists "admins update avaliacoes" on public.avaliacoes;
create policy "admins update avaliacoes" on public.avaliacoes for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());
drop policy if exists "admins delete avaliacoes" on public.avaliacoes;
create policy "admins delete avaliacoes" on public.avaliacoes for delete to authenticated using (public.is_coky_admin());

-- Configurações do site: leitura pública, escrita só administradores.
drop policy if exists "public reads site_config" on public.site_config;
create policy "public reads site_config" on public.site_config for select to anon, authenticated using (true);
drop policy if exists "admins update site_config" on public.site_config;
create policy "admins update site_config" on public.site_config for update to authenticated using (public.is_coky_admin()) with check (public.is_coky_admin());

-- Storage: buckets públicos para leitura. Escrita/eliminação somente admin.
insert into storage.buckets (id, name, public)
values ('produtos','produtos',true), ('combos','combos',true), ('galeria','galeria',true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public reads coky images" on storage.objects;
create policy "public reads coky images"
on storage.objects for select
to public
using (bucket_id in ('produtos','combos','galeria'));

drop policy if exists "admins upload coky images" on storage.objects;
create policy "admins upload coky images"
on storage.objects for insert
to authenticated
with check (bucket_id in ('produtos','combos','galeria') and public.is_coky_admin());

drop policy if exists "admins update coky images" on storage.objects;
create policy "admins update coky images"
on storage.objects for update
to authenticated
using (bucket_id in ('produtos','combos','galeria') and public.is_coky_admin())
with check (bucket_id in ('produtos','combos','galeria') and public.is_coky_admin());

drop policy if exists "admins delete coky images" on storage.objects;
create policy "admins delete coky images"
on storage.objects for delete
to authenticated
using (bucket_id in ('produtos','combos','galeria') and public.is_coky_admin());

-- SEED de categorias (edita/substitui tudo depois pelo admin). Executa este bloco apenas UMA vez.
insert into public.categorias (nome, emoji, ordem) values
('Hambúrgueres','',1),
('Acompanhamentos','🍟',2),
('Bebidas','🥤',3),
('Frango','🍗',4),
('Especiais','🔥',5),
('Sobremesas','🍰',6)
on conflict do nothing;

-- PRIMEIRO ADMIN:
-- 1) Supabase Dashboard > Authentication > Users > Add user.
-- 2) Confirma o utilizador (se aplicável) e copia o UUID.
-- 3) Executa:
-- insert into public.admin_users(user_id) values ('COLOQUE-AQUI-O-UUID-DO-UTILIZADOR');
--
-- Não crie uma policy que permita INSERT público em admin_users.
