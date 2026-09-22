# Cokylicious — Site + Menu digital + Carrinho + Painel Administrativo

Site da hamburgueria **Cokylicious** (Luanda), construído a partir do projeto anterior da
DESIGNE decoração (mesma arquitetura: HTML/CSS/JS puro + Supabase, sem frameworks). O que era
da DESIGNE decoração foi movido para `_legado-designe/` (nada foi apagado — ver secção abaixo).

## O que existe hoje
- **Home de secção única** (`index.html`): navbar, hero, marquee de marca, destaques, menu
  digital por categorias (com modal de produto, extras e opções), combos, delivery, WhatsApp,
  sobre nós, bloco "Feito em Luanda", galeria/Instagram, redes sociais, avaliações, localização +
  mapa + horário, FAQ, footer e barra fixa no mobile.
- **Carrinho de pedido** (`js/cart.js`): guarda o pedido no `localStorage` do telemóvel, soma
  quantidades/extras, e monta a mensagem que é enviada por WhatsApp (`wa.me`) com um clique.
- **Modo demo**: enquanto o Supabase não estiver ligado (ou se a ligação falhar), o site funciona
  sozinho com dados de exemplo em `js/demo-data.js` — nunca fica com uma página vazia.
- **Painel administrativo** em `/admin`: Dashboard, Produtos, Categorias, Combos, Galeria,
  Avaliações, Configurações (dados da empresa + horário + contas de administrador) — tudo
  protegido por login e RLS no Supabase.
- Todos os **preços são opcionais**: se ficarem vazios, o site mostra "XX.XXX Kz" em vez de
  inventar um valor — assim nada aparece com um preço que não corresponde à realidade.
- Todas as **fotos são placeholders** (`assets/placeholder-burger.svg`, um desenho, não uma
  foto real) até carregares fotos verdadeiras da Cokylicious pelo admin.
- Schema `supabase.sql` completo, com RLS em todas as tabelas e buckets de Storage.

## O que foi movido para `_legado-designe/`
Conteúdo específico da DESIGNE decoração (móveis planejados) que não faz sentido para uma
hamburgueria: `moveis.html`, `projetos.html`, `videos.html`, as páginas de admin equivalentes
(`moveis.html`, `projetos.html`, `videos.html`, `servicos.html`), os scripts só usados por elas
(`motion.js`, `lightbox.js`, `moveis-page.js`, `projetos-page.js`, `videos-page.js`,
`video-utils.js`, `projeto-utils.js`), a pasta `assets/` original (10 fotos de móveis) e a pasta
`cloudflare/` (upload de vídeos). Nada foi apagado — podes recuperar ou apagar definitivamente
quando quiseres.

## Estrutura
```
/index.html
/assets/placeholder-burger.svg
/assets/favicon.svg
/admin/
  login.html
  redefinir-senha.html
  index.html            (dashboard)
  produtos.html
  categorias.html
  combos.html
  galeria.html
  avaliacoes.html
  configuracoes.html
/css/site.css
/css/admin.css
/js/supabase.js
/js/demo-data.js        (dados de exemplo, modo demo)
/js/cart.js             (carrinho + mensagem de WhatsApp)
/js/site.js             (renderização do site público)
/js/auth.js
/js/admin.js
/supabase.sql
/supabase/functions/admin-users/index.ts
/_legado-designe/       (tudo o que era da DESIGNE decoração)
```

## Configuração pelo celular
1. Cria um projeto **novo** no Supabase (não reutilizes o de outro cliente).
2. Vai a **SQL Editor** → **New query**.
3. Cola todo o conteúdo de `supabase.sql` e toca em **Run**.
4. Vai a **Project Settings → API** e copia:
   - Project URL
   - chave pública **anon** / **publishable**
5. Edita `js/supabase.js`:
   - `DESIGNE_SUPABASE_URL = "https://..."`
   - `DESIGNE_SUPABASE_ANON_KEY = "..."`
   (o prefixo `DESIGNE_` é herdado do projeto anterior — só o nome da variável, não os dados.)
6. Nunca coloques `service_role` ou qualquer chave secreta nesse ficheiro.
7. Até fazeres isto, o site funciona sozinho em **modo demo**.

## Primeiro administrador
1. Supabase → **Authentication → Users → Add user**.
2. Cria o e-mail e senha do proprietário da Cokylicious.
3. Copia o UUID desse utilizador.
4. Supabase → **SQL Editor** e executa:
```sql
insert into public.admin_users(user_id) values ('UUID-DO-ADMIN');
```
5. Não habilites cadastro público (`signups`) para visitantes. O site não tem formulário de registo.

## Criar utilizadores no painel (sem ir ao Supabase)
Em **Configurações → Contas de administrador** dá para ver, criar e remover utilizadores. Cada
utilizador criado tem acesso completo ao painel. Para isto funcionar, cria **uma vez** a função
`admin-users` no Supabase (ela guarda a chave secreta no servidor — nunca no site):
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome: `admin-users`. Cola todo o código de `supabase/functions/admin-users/index.ts`.
3. Clica em **Deploy**.
4. Se ao usar o painel aparecer o erro "Invalid JWT", abre as definições da função e desliga
   **Verify JWT** (a função valida o login e a permissão de administrador por conta própria).

## Antes de publicar em produção — checklist
1. **Configurações**: preenche o WhatsApp real (hoje é `244900000000`, um número de exemplo), o
   telefone, a morada, o Instagram/Facebook, os textos do hero/sobre e o horário de funcionamento.
2. **Categorias**: confirma/edita as 6 categorias de exemplo (Hambúrgueres, Acompanhamentos,
   Bebidas, Frango, Especiais, Sobremesas).
3. **Produtos**: apaga os 10 produtos de exemplo (ou edita-os) e publica o menu real, com fotos e
   preços verdadeiros. Extras e opções de personalização são opcionais por produto.
4. **Combos**: idem.
5. **Galeria**: troca as fotos de exemplo por fotos reais (equipa, cozinha, hambúrgueres,
   clientes) — usadas na secção "Segue a fome" e na secção "Sobre nós".
6. **Avaliações**: substitui os depoimentos de exemplo por avaliações reais de clientes.
7. No `index.html`, troca a foto do hero (`assets/placeholder-burger.svg`) por uma foto real —
   procura o comentário `TROCAR` no ficheiro para encontrar rapidamente todos os pontos com
   imagens de exemplo.

## Ícones e ficheiros
- Os ícones do site e do painel são SVG inline (sprite no início de cada página, `<use href="#i-nome">`).
  Para usar um ícone novo, adiciona um `<symbol id="i-nome">` ao sprite.
- Nos formulários do admin, o botão nativo "Escolher arquivo" é substituído automaticamente por um
  botão com ícone (`js/admin.js`).

## Teste
- Abre `/index.html` (ou `/admin/login.html` para o painel).
- Sem Supabase configurado, o site já mostra o menu de exemplo — confirma que o carrinho soma
  quantidades e que "Pedir pelo WhatsApp" abre o `wa.me` com a mensagem correta.
- Com Supabase configurado: entra no painel, publica uma categoria, depois um produto com foto —
  deve aparecer no menu do site público em poucos segundos (recarrega a página).
- Testa o fluxo completo: abrir um produto → escolher extras/opções → adicionar ao carrinho →
  abrir o carrinho → escolher "Delivery" ou "Levantar no local" → enviar pelo WhatsApp.

## Observações importantes
- Para produção, publica o site em HTTPS (Vercel, Netlify, GitHub Pages, hospedagem própria etc.).
- A chave pública (anon) pode ficar visível no frontend; a segurança real vem das RLS/policies.
- As imagens são públicas porque o site precisa de as mostrar sem autenticação. Escrita e exclusão
  são restritas por RLS de Storage a administradores.
- Este projeto **não reutiliza** a base de dados Supabase da DESIGNE decoração (nem de nenhum
  outro cliente) — configura um projeto Supabase novo e exclusivo, como indicado acima.

## Possíveis erros
**"Configure primeiro o Supabase"** → preenche `js/supabase.js` com URL e chave pública.

**"E-mail ou senha inválidos"** → confirma o utilizador em Authentication → Users.

**"Este utilizador não está autorizado"** → confere se o UUID existe em `public.admin_users`.

**Erro de RLS ao guardar** → confirma que `supabase.sql` foi executado inteiro e que o utilizador
está em `admin_users`.

**Upload de imagem falha** → confirma que os buckets `produtos`, `combos` e `galeria` existem (o
`supabase.sql` já os cria) e que as policies de Storage foram criadas.

**Site publicado em subpasta** → os links públicos/admin são relativos; mantém a estrutura de
pastas intacta.
