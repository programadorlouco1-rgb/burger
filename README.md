# DESIGNE decoração — Site + Painel Administrativo + Supabase

Site institucional para a DESIGNE decoração (móveis planejados, Luanda), adaptado a partir do
projeto WANDE fornecido (mesma arquitetura: HTML/CSS/JS puro + Supabase, sem frameworks).

## O que foi feito
- Identidade visual nova: verde escuro + dourado + tons de madeira, tipografia Playfair Display
  (títulos) + Manrope (texto), logótipo oficial aplicado no header, footer e favicon.
- Header público SEM o item "Vídeos" — os vídeos aparecem dentro dos móveis, dos projetos e de
  um bloco de destaque na home, nunca como página própria no menu.
- Catálogo de **Móveis** (`moveis.html`), com preço opcional ("Preço sob orçamento" quando vazio)
  e botão de vídeo opcional por móvel.
- **Projetos** (`projetos.html`) com galeria de fotos adicionais por projeto e vídeo opcional —
  ao clicar num projeto abre um modal com capa, descrição, fotos e o vídeo (quando existir).
- Bloco "Veja o nosso trabalho ganhar vida" na home, com o vídeo marcado como destaque no admin.
- Painel administrativo em `/admin`: Dashboard, Móveis, Projetos (+ fotos), Vídeos, Serviços,
  Configurações — tudo protegido por login e RLS no Supabase.
- WhatsApp (+244 937 283 518), Facebook e Google Maps já ligados, e editáveis em
  `admin/configuracoes.html` sem tocar no código.
- Schema `supabase.sql` completo, com RLS em todas as tabelas e buckets de Storage.

## Estrutura
```
/index.html            (home)
/moveis.html            (catálogo completo)
/projetos.html          (portfólio completo)
/assets/...
/admin/
  login.html
  redefinir-senha.html
  index.html            (dashboard)
  moveis.html
  projetos.html
  videos.html
  servicos.html
  configuracoes.html
/css/site.css
/css/admin.css
/js/supabase.js
/js/video-utils.js
/js/projeto-utils.js
/js/auth.js
/js/admin.js
/js/public.js
/js/moveis-page.js
/js/projetos-page.js
/js/lightbox.js
/cloudflare/stream-upload-worker.example.js   (opcional — ver secção Vídeos abaixo)
/supabase.sql
```

## Configuração pelo celular
1. Crie um projeto **novo** no Supabase (não reutilize o de outro cliente).
2. Vá a **SQL Editor** → **New query**.
3. Cole todo o conteúdo de `supabase.sql` e toque em **Run**.
4. Vá a **Project Settings → API** e copie:
   - Project URL
   - chave pública **anon** / **publishable**
5. Edite `js/supabase.js`:
   - `DESIGNE_SUPABASE_URL = "https://..."`
   - `DESIGNE_SUPABASE_ANON_KEY = "..."`
6. Nunca coloque `service_role` ou qualquer chave secreta nesse ficheiro.

## Primeiro administrador
1. Supabase → **Authentication → Users → Add user**.
2. Crie o e-mail e senha do proprietário.
3. Copie o UUID desse utilizador.
4. Supabase → **SQL Editor** e execute:
```sql
insert into public.admin_users(user_id) values ('UUID-DO-ADMIN');
```
5. Não habilite cadastro público (`signups`) para visitantes. O site não possui formulário de registo.

## Vídeos — como publicar (hoje, sem infraestrutura extra)
1. Faça upload do vídeo no **Cloudflare Stream** (dashboard da Cloudflare, ou pelo telemóvel em
   cloudflarestream.com/watch — funciona no browser do telemóvel, sem precisar de app).
2. Aguarde o processamento e copie o **UID do vídeo**.
3. No admin, vá a **Vídeos → + Adicionar vídeo**, cole o UID, escolha uma thumbnail, associe
   (opcionalmente) a um projeto ou móvel, e marque "Publicado".
4. Se preferir usar YouTube/Vimeo em vez do Cloudflare Stream, cole o link do vídeo no mesmo
   campo — o site reconhece automaticamente.
5. Marque "Vídeo em destaque" para ele aparecer no bloco "Veja o nosso trabalho ganhar vida" na
   home — só pode haver um vídeo em destaque de cada vez (o admin desmarca o anterior sozinho).
6. Antes de publicar em produção, edite `js/video-utils.js` e troque `customer-CODIGO` pelo seu
   customer code do Cloudflare Stream (aparece no painel do Stream, ao lado de qualquer vídeo).

**Upload direto do telemóvel, sem sair do painel admin (opcional, próximo passo):** o ficheiro
`cloudflare/stream-upload-worker.example.js` é um ponto de partida para um Cloudflare Worker que
gera URLs de upload direto para o Stream, permitindo mandar o vídeo sem sair do painel admin da
DESIGNE decoração. Não está implantado — precisa de uma conta Cloudflare Stream, de um API Token e
de `wrangler deploy`. Até lá, o fluxo manual acima (passos 1–5) já funciona hoje.

## Criar utilizadores no painel (sem ir ao Supabase)
Em **Configurações → Contas de administrador** pode ver, criar e remover utilizadores. Cada utilizador
criado tem acesso completo ao painel. Para isto funcionar, crie **uma vez** a função `admin-users`
no Supabase (ela guarda a chave secreta no servidor — nunca no site):
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome: `admin-users`. Cole todo o código de `supabase/functions/admin-users/index.ts`.
3. Clique em **Deploy**.
4. Se ao usar o painel aparecer o erro "Invalid JWT", abra as definições da função e desligue
   **Verify JWT** (a função valida o login e a permissão de administrador por conta própria).

## Ícones e ficheiros
- Os ícones do site e do painel são SVG inline (sprite no início de cada página, `<use href="#i-nome">`).
  Para usar um ícone novo, adicione um `<symbol id="i-nome">` ao sprite.
- Nos formulários do admin, o botão nativo "Escolher arquivo" é substituído automaticamente por um
  botão com ícone (`js/admin.js`).

## Teste
- Abra `/admin/login.html`.
- Use o e-mail/senha do utilizador criado.
- Deve entrar em `/admin/index.html`.
- Publique um móvel com foto do telefone — deve aparecer em `/moveis.html` e na home.
- Publique um projeto com foto de capa, depois adicione fotos extra e, opcionalmente, associe um
  vídeo — abra o projeto no site público para confirmar que a galeria e o vídeo aparecem.
- Publique um vídeo e marque-o como destaque — deve aparecer na home, na secção "Veja o nosso
  trabalho ganhar vida".

## Observações importantes
- Para produção, publique o site em HTTPS (Vercel, Netlify, GitHub Pages, hospedagem própria etc.).
- A chave pública (anon) pode ficar visível no frontend; a segurança real vem das RLS/policies.
- As imagens são públicas porque o site precisa de as mostrar sem autenticação. Escrita e exclusão
  são restritas por RLS de Storage a administradores.
- As fotos incluídas (`assets/*.jpg`) são as fotos de teste fornecidas — substitua-as pelo admin
  assim que tiver fotos reais dos móveis e projetos da DESIGNE decoração.
- Este projeto **não reutiliza** a base de dados Supabase do cliente WANDE (usado como ponto de
  partida) — configure um projeto Supabase novo e exclusivo, como indicado acima.

## Possíveis erros
**"Configure primeiro o Supabase"** → preencha `js/supabase.js` com URL e chave pública.

**"E-mail ou senha inválidos"** → confirme o utilizador em Authentication → Users.

**"Este utilizador não está autorizado"** → confira se o UUID existe em `public.admin_users`.

**Erro de RLS ao guardar** → confirme que `supabase.sql` foi executado inteiro e que o utilizador
está em `admin_users`.

**Upload de imagem falha** → confirme que os buckets `moveis`, `projetos`, `servicos` e `videos`
existem (o `supabase.sql` já os cria) e que as policies de Storage foram criadas.

**O vídeo não reproduz** → confirme que trocou `customer-CODIGO` em `js/video-utils.js` pelo seu
customer code do Cloudflare Stream, ou que colou uma URL de embed válida (YouTube/Vimeo).

**Site publicado em subpasta** → os links públicos/admin são relativos; mantenha a estrutura de
pastas intacta.
