-- DESIGNE decoração / Supabase
-- Execute TODO este ficheiro no Supabase Dashboard > SQL Editor (crie primeiro um projeto Supabase NOVO
-- e exclusivo para a DESIGNE decoração — NÃO reutilize o projeto de outro cliente).
-- Depois crie o primeiro utilizador em Authentication > Users e execute o INSERT
-- indicado no fim deste ficheiro com o UUID desse utilizador.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  categoria text not null default '',
  video_uid text not null default '',      -- UID do vídeo no Cloudflare Stream (ou URL de embed)
  thumbnail_url text,
  projeto_id uuid,
  movel_id uuid,
  destaque boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  categoria text not null default '',       -- Cozinhas, Guarda-fatos, Quartos, Salas, Racks, Painéis, Cômodas, Portas, Outros
  imagem_url text,
  preco numeric(14,2),                      -- pode ficar vazio: "Preço sob orçamento"
  disponivel boolean not null default true,
  destaque boolean not null default false,
  video_id uuid references public.videos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  categoria text not null default '',
  imagem_capa_url text,
  video_id uuid references public.videos(id) on delete set null,
  destaque boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos add constraint videos_projeto_fk foreign key (projeto_id) references public.projetos(id) on delete set null;
alter table public.videos add constraint videos_movel_fk foreign key (movel_id) references public.moveis(id) on delete set null;

create table if not exists public.projeto_fotos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  imagem_url text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  imagem_url text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_config (
  id integer primary key default 1,
  nome_empresa text not null default 'DESIGNE decoração',
  slogan text not null default 'Móveis feitos para transformar o seu espaço',
  telefone text not null default '+244937283518',
  whatsapp text not null default '244937283518',
  facebook text not null default 'https://www.facebook.com/profile.php?id=61594299960665',
  endereco text not null default 'Luanda, Angola',
  maps_link text not null default 'https://goo.gl/maps/QA4SUg5wVFsPjejg6?g_st=ac',
  hero_titulo text not null default 'Móveis planejados para transformar o seu espaço',
  hero_subtitulo text not null default 'Projetamos e fabricamos móveis sob medida, unindo funcionalidade, elegância e qualidade em cada detalhe.',
  sobre_titulo text not null default 'Fabricação sob medida, com acabamento de excelência.',
  sobre_texto text not null default 'A DESIGNE decoração cria móveis planejados — guarda-fatos, cozinhas, camas, cómodas, racks, painéis, portas e pérgolas — unindo design, funcionalidade e qualidade em cada projeto, do desenho ao acabamento final.',
  updated_at timestamptz not null default now(),
  constraint site_config_singleton check (id = 1)
);
insert into public.site_config (id) values (1) on conflict (id) do nothing;

create index if not exists moveis_disponivel_idx on public.moveis(disponivel);
create index if not exists moveis_categoria_idx on public.moveis(categoria);
create index if not exists moveis_created_at_idx on public.moveis(created_at desc);
create index if not exists projetos_ativo_idx on public.projetos(ativo);
create index if not exists projetos_destaque_idx on public.projetos(destaque);
create index if not exists projetos_created_at_idx on public.projetos(created_at desc);
create index if not exists projeto_fotos_projeto_idx on public.projeto_fotos(projeto_id, ordem);
create index if not exists videos_destaque_idx on public.videos(destaque);
create index if not exists videos_ativo_idx on public.videos(ativo);
create index if not exists servicos_ordem_idx on public.servicos(ordem);

alter table public.admin_users enable row level security;
alter table public.moveis enable row level security;
alter table public.projetos enable row level security;
alter table public.projeto_fotos enable row level security;
alter table public.videos enable row level security;
alter table public.servicos enable row level security;
alter table public.site_config enable row level security;

-- Helper usado pelas policies. SECURITY DEFINER evita dependência de policies recursivas.
create or replace function public.is_designe_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_designe_admin() from public;
grant execute on function public.is_designe_admin() to anon, authenticated;

-- admin_users: nenhum visitante pode listar administradores; o próprio utilizador
-- autenticado pode verificar se o seu UUID está autorizado.
drop policy if exists "admin can read own authorization" on public.admin_users;
create policy "admin can read own authorization"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- Móveis: leitura pública apenas dos disponíveis; administradores veem/gerem tudo.
drop policy if exists "public reads available moveis" on public.moveis;
create policy "public reads available moveis"
on public.moveis for select
to anon, authenticated
using (disponivel = true or public.is_designe_admin());

drop policy if exists "admins insert moveis" on public.moveis;
create policy "admins insert moveis" on public.moveis for insert to authenticated with check (public.is_designe_admin());
drop policy if exists "admins update moveis" on public.moveis;
create policy "admins update moveis" on public.moveis for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());
drop policy if exists "admins delete moveis" on public.moveis;
create policy "admins delete moveis" on public.moveis for delete to authenticated using (public.is_designe_admin());

-- Projetos: leitura pública apenas dos ativos; administradores gerem tudo.
drop policy if exists "public reads active projetos" on public.projetos;
create policy "public reads active projetos"
on public.projetos for select
to anon, authenticated
using (ativo = true or public.is_designe_admin());

drop policy if exists "admins insert projetos" on public.projetos;
create policy "admins insert projetos" on public.projetos for insert to authenticated with check (public.is_designe_admin());
drop policy if exists "admins update projetos" on public.projetos;
create policy "admins update projetos" on public.projetos for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());
drop policy if exists "admins delete projetos" on public.projetos;
create policy "admins delete projetos" on public.projetos for delete to authenticated using (public.is_designe_admin());

-- Fotos de projeto: seguem a visibilidade do projeto pai.
drop policy if exists "public reads fotos of visible projetos" on public.projeto_fotos;
create policy "public reads fotos of visible projetos"
on public.projeto_fotos for select
to anon, authenticated
using (
  public.is_designe_admin()
  or exists (select 1 from public.projetos p where p.id = projeto_id and p.ativo = true)
);

drop policy if exists "admins insert fotos" on public.projeto_fotos;
create policy "admins insert fotos" on public.projeto_fotos for insert to authenticated with check (public.is_designe_admin());
drop policy if exists "admins update fotos" on public.projeto_fotos;
create policy "admins update fotos" on public.projeto_fotos for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());
drop policy if exists "admins delete fotos" on public.projeto_fotos;
create policy "admins delete fotos" on public.projeto_fotos for delete to authenticated using (public.is_designe_admin());

-- Vídeos: leitura pública apenas dos ativos; escrita/gestão só administradores.
drop policy if exists "public reads active videos" on public.videos;
create policy "public reads active videos"
on public.videos for select
to anon, authenticated
using (ativo = true or public.is_designe_admin());

drop policy if exists "admins insert videos" on public.videos;
create policy "admins insert videos" on public.videos for insert to authenticated with check (public.is_designe_admin());
drop policy if exists "admins update videos" on public.videos;
create policy "admins update videos" on public.videos for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());
drop policy if exists "admins delete videos" on public.videos;
create policy "admins delete videos" on public.videos for delete to authenticated using (public.is_designe_admin());

-- Serviços: leitura pública apenas dos ativos; escrita só administradores.
drop policy if exists "public reads active servicos" on public.servicos;
create policy "public reads active servicos"
on public.servicos for select
to anon, authenticated
using (ativo = true or public.is_designe_admin());

drop policy if exists "admins insert servicos" on public.servicos;
create policy "admins insert servicos" on public.servicos for insert to authenticated with check (public.is_designe_admin());
drop policy if exists "admins update servicos" on public.servicos;
create policy "admins update servicos" on public.servicos for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());
drop policy if exists "admins delete servicos" on public.servicos;
create policy "admins delete servicos" on public.servicos for delete to authenticated using (public.is_designe_admin());

-- Configurações do site: leitura pública, escrita só administradores.
drop policy if exists "public reads site_config" on public.site_config;
create policy "public reads site_config" on public.site_config for select to anon, authenticated using (true);
drop policy if exists "admins update site_config" on public.site_config;
create policy "admins update site_config" on public.site_config for update to authenticated using (public.is_designe_admin()) with check (public.is_designe_admin());

-- Storage: buckets públicos para leitura. Escrita/eliminação somente admin.
insert into storage.buckets (id, name, public)
values ('moveis','moveis',true), ('projetos','projetos',true), ('servicos','servicos',true), ('videos','videos',true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public reads designe images" on storage.objects;
create policy "public reads designe images"
on storage.objects for select
to public
using (bucket_id in ('moveis','projetos','servicos','videos'));

drop policy if exists "admins upload designe images" on storage.objects;
create policy "admins upload designe images"
on storage.objects for insert
to authenticated
with check (bucket_id in ('moveis','projetos','servicos','videos') and public.is_designe_admin());

drop policy if exists "admins update designe images" on storage.objects;
create policy "admins update designe images"
on storage.objects for update
to authenticated
using (bucket_id in ('moveis','projetos','servicos','videos') and public.is_designe_admin())
with check (bucket_id in ('moveis','projetos','servicos','videos') and public.is_designe_admin());

drop policy if exists "admins delete designe images" on storage.objects;
create policy "admins delete designe images"
on storage.objects for delete
to authenticated
using (bucket_id in ('moveis','projetos','servicos','videos') and public.is_designe_admin());

-- SEED de serviços (10 categorias pedidas). Execute este bloco apenas UMA vez (não há
-- restrição de unicidade no título, por isso repetir a execução duplica as linhas).
-- Pode editar/substituir tudo depois pelo admin.
insert into public.servicos (titulo, descricao, ordem) values
('Móveis planejados','Soluções sob medida para cada ambiente da sua casa.',1),
('Cozinhas','Cozinhas planejadas com funcionalidade e acabamento premium.',2),
('Guarda-fatos','Organização e elegância com design personalizado.',3),
('Camas e quartos','Camas e móveis de quarto planejados para o seu conforto.',4),
('Racks e painéis','Racks e painéis de TV em madeira, com acabamento sob medida.',5),
('Cómodas','Cómodas planejadas para otimizar o seu espaço.',6),
('Portas','Portas sob medida com acabamento em madeira.',7),
('Pérgolas','Estruturas em madeira para áreas externas e lazer.',8),
('Fabricação sob medida','Projetos personalizados do desenho à instalação.',9),
('Acabamentos','Acabamentos de qualidade em cada detalhe do seu móvel.',10)
on conflict do nothing;

-- PRIMEIRO ADMIN:
-- 1) Supabase Dashboard > Authentication > Users > Add user.
-- 2) Confirme o utilizador (se aplicável) e copie o UUID.
-- 3) Execute:
-- insert into public.admin_users(user_id) values ('COLOQUE-AQUI-O-UUID-DO-UTILIZADOR');
--
-- Não crie uma policy que permita INSERT público em admin_users.
