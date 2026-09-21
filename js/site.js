/* Cokylicious — dados (Supabase ou demo) + renderização do site.
   Depende de: demo-data.js, cart.js (window.Coky) e, opcionalmente, supabase.js. */
(function(){
  "use strict";

  var Coky = window.Coky, esc = Coky.esc, priceLabel = Coky.priceLabel, fmt = Coky.fmt;
  var D = window.COKY_DEMO;
  var sb = window.designeSupabase;
  var IMG = "assets/placeholder-burger.svg";

  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function(o){ return JSON.parse(JSON.stringify(o)); };

  // Estado da página. Coky.cfg aponta sempre para S.cfg (o carrinho lê o número de WhatsApp daí).
  var S = { cfg: clone(D.config), categorias: [], produtos: [], combos: [], galeria: [], avaliacoes: [], demo: false, cat: null };
  Coky.cfg = S.cfg;

  /* =========================================================
     1) DADOS
     ========================================================= */
  function useDemo(){
    S.demo = true;
    ["categorias", "produtos", "combos", "galeria", "avaliacoes"].forEach(function(k){ S[k] = clone(D[k]); });
  }

  async function loadData(){
    if (!sb) { useDemo(); return; }
    try {
      var r = await Promise.all([
        sb.from("site_config").select("*").eq("id", 1).maybeSingle(),
        sb.from("categorias").select("*").eq("ativo", true).order("ordem"),
        sb.from("produtos").select("*").eq("disponivel", true).order("ordem").order("created_at"),
        sb.from("combos").select("*").eq("ativo", true).order("ordem").order("created_at"),
        sb.from("galeria").select("*").eq("ativo", true).order("ordem").order("created_at", { ascending: false }),
        sb.from("avaliacoes").select("*").eq("ativo", true).order("ordem").order("created_at", { ascending: false })
      ]);
      var bad = r.filter(function(x){ return x.error; })[0];
      if (bad) throw bad.error;
      // só sobrepõe o que o painel preencheu; o resto fica com o valor de exemplo
      Object.keys(r[0].data || {}).forEach(function(k){
        var v = r[0].data[k];
        if (v !== null && v !== "") S.cfg[k] = v;
      });
      S.categorias = r[1].data || []; S.produtos = r[2].data || []; S.combos = r[3].data || [];
      S.galeria = r[4].data || [];    S.avaliacoes = r[5].data || [];
    } catch (e) {
      console.warn("[Cokylicious] Supabase indisponível — a mostrar dados de exemplo.", e);
      useDemo();
    }
  }

  /* =========================================================
     2) CONFIGURAÇÃO → HTML
     ========================================================= */
  function applyConfig(){
    var c = S.cfg;
    $$("[data-cfg]").forEach(function(el){
      var v = c[el.dataset.cfg];
      if (v != null && v !== "") el.textContent = v;
    });
    var wa = String(c.whatsapp || "").replace(/\D/g, "");
    var tel = String(c.telefone || "").replace(/[^\d+]/g, "");
    var dir = c.maps_link || "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(c.mapa_query || c.endereco || "");
    var links = { ig: c.instagram, fb: c.facebook, wa: "https://wa.me/" + wa, tel: "tel:" + tel, dir: dir };
    $$("[data-href]").forEach(function(a){ var h = links[a.dataset.href]; if (h) a.href = h; });
    $$("[data-wa-text]").forEach(function(a){
      a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(a.dataset.waText.replace("{nome}", c.nome_empresa || "Cokylicious"));
    });
    var map = $("#mapFrame");
    if (map) map.src = "https://www.google.com/maps?q=" + encodeURIComponent(c.mapa_query || c.endereco || "Luanda, Angola") + "&output=embed";
    renderHours();
  }

  function renderHours(){
    var h = Array.isArray(S.cfg.horario) && S.cfg.horario.length ? S.cfg.horario : D.config.horario;
    var today = (new Date().getDay() + 6) % 7;            // 0 = Segunda … 6 = Domingo
    var label = function(r){ return r.fechado ? "Fechado" : (r.abre || "XX:XX") + " às " + (r.fecha || "XX:XX"); };
    var list = $("#hoursList");
    if (list) list.innerHTML = h.map(function(r, i){
      return "<li" + (i === today ? ' class="today"' : "") + "><span>" + esc(r.dia) + "</span><b>" + esc(label(r)) + "</b></li>";
    }).join("");
    var t = $("#todayHours"); if (t && h[today]) t.textContent = label(h[today]);
  }

  /* =========================================================
     3) MENU, DESTAQUES, COMBOS, GALERIA, AVALIAÇÕES
     ========================================================= */
  function catEmoji(id){
    var c = S.categorias.filter(function(x){ return String(x.id) === String(id); })[0];
    return (c && c.emoji) || "🍔";
  }
  function tagHtml(t){ return t ? '<span class="tag">' + esc(t) + "</span>" : ""; }

  function cardHtml(p){
    var ingr = p.ingredientes ? '<p class="ingr">' + esc(p.ingredientes) + "</p>" : "";
    return '<article class="card" data-reveal>' +
      '<button class="card-media" type="button" data-open="' + esc(p.id) + '" aria-label="Ver ' + esc(p.nome) + '">' +
        '<img src="' + esc(p.imagem_url || IMG) + '" alt="' + esc(p.nome) + '" loading="lazy" width="600" height="600">' + tagHtml(p.etiqueta) +
      "</button>" +
      '<div class="card-body">' +
        '<h3 class="card-title"><button type="button" data-open="' + esc(p.id) + '">' + esc(p.nome) + "</button></h3>" +
        '<p class="desc">' + esc(p.descricao || "") + "</p>" + ingr +
        '<div class="card-foot"><span class="price">' + priceLabel(p.preco) + "</span>" +
        '<button class="btn btn-red btn-sm" type="button" data-add="' + esc(p.id) + '">+ ADICIONAR</button></div>' +
      "</div></article>";
  }

  function comboHtml(k){
    return '<article class="card combo" data-reveal>' +
      '<div class="card-media"><img src="' + esc(k.imagem_url || IMG) + '" alt="' + esc(k.nome) + '" loading="lazy" width="600" height="600">' + tagHtml(k.etiqueta) + "</div>" +
      '<div class="card-body">' +
        '<h3 class="card-title display">' + esc(k.nome) + "</h3>" +
        '<p class="desc">' + esc(k.itens || k.descricao || "") + "</p>" +
        '<div class="card-foot"><span class="price">' + priceLabel(k.preco) + "</span>" +
        '<button class="btn btn-yellow btn-sm" type="button" data-add-combo="' + esc(k.id) + '">+ ADICIONAR</button></div>' +
      "</div></article>";
  }

  function renderFeatured(){
    var sec = $("#destaques"), box = $("#featured");
    if (!sec || !box) return;
    var list = S.produtos.filter(function(p){ return p.destaque; });
    if (!list.length) list = S.produtos.slice(0, 3);
    list = list.slice(0, 6);
    sec.hidden = !list.length;
    box.innerHTML = list.map(cardHtml).join("");
    reveal(box);
  }

  function renderMenu(){
    var tabs = $("#tabs"), grid = $("#menuGrid");
    if (!tabs || !grid) return;
    if (!S.produtos.length) {
      tabs.innerHTML = "";
      grid.innerHTML = '<p class="empty">O menu está a ser preparado. Volta já já! 🍔</p>';
      return;
    }
    if (!S.cat && S.categorias.length) S.cat = String(S.categorias[0].id);
    tabs.innerHTML = S.categorias.map(function(c){
      var on = String(c.id) === S.cat;
      return '<button class="tab' + (on ? " on" : "") + '" type="button" role="tab" aria-selected="' + on + '" data-tab="' + esc(c.id) + '">' +
        '<span aria-hidden="true">' + esc(c.emoji || "") + "</span> " + esc(c.nome) + "</button>";
    }).join("") + (S.combos.length ? '<a class="tab" href="#combos"><span aria-hidden="true">🎁</span> Combos</a>' : "");
    var list = S.produtos.filter(function(p){ return String(p.categoria_id) === S.cat; });
    grid.innerHTML = list.length ? list.map(cardHtml).join("") : '<p class="empty">Ainda não há itens nesta categoria.</p>';
    reveal(grid);
  }

  function renderCombos(){
    var sec = $("#combos"), box = $("#combosGrid");
    if (!sec || !box) return;
    sec.hidden = !S.combos.length;
    box.innerHTML = S.combos.map(comboHtml).join("");
    reveal(box);
  }

  function renderGallery(){
    var sec = $("#galeria"), box = $("#galleryGrid");
    if (!sec || !box) return;
    sec.hidden = !S.galeria.length;
    box.innerHTML = S.galeria.slice(0, 9).map(function(g){
      return '<a class="tile" data-reveal data-href="ig" href="' + esc(S.cfg.instagram) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(g.imagem_url || IMG) + '" alt="' + esc(g.legenda || "Foto Cokylicious") + '" loading="lazy" width="400" height="400"></a>';
    }).join("");
    reveal(box);
  }

  function renderReviews(){
    var sec = $("#avaliacoes"), box = $("#reviewsList");
    if (!sec || !box) return;
    sec.hidden = !S.avaliacoes.length;
    box.innerHTML = S.avaliacoes.map(function(a){
      var n = Math.max(1, Math.min(5, parseInt(a.estrelas, 10) || 5));
      return '<figure class="review" data-reveal><div class="stars" aria-label="' + n + ' de 5 estrelas">' +
        "★★★★★".slice(0, n) + '<span class="off">' + "★★★★★".slice(0, 5 - n) + "</span></div>" +
        "<blockquote>" + esc(a.comentario) + "</blockquote><figcaption>" + esc(a.nome) + "</figcaption></figure>";
    }).join("");
    reveal(box);
  }

  /* =========================================================
     4) MODAL DO PRODUTO
     ========================================================= */
  var M = null, modalFocus = null;

  function openProduct(id){
    var p = S.produtos.filter(function(x){ return String(x.id) === String(id); })[0];
    if (!p) return;
    var extras = Array.isArray(p.extras) ? p.extras : [];
    var opcoes = Array.isArray(p.opcoes) ? p.opcoes : [];
    M = { p: p, qty: 1, extras: extras };

    var img = $("#pmImg"); img.src = p.imagem_url || IMG; img.alt = p.nome;
    $("#pmTag").innerHTML = tagHtml(p.etiqueta);
    $("#pmName").textContent = p.nome;
    $("#pmDesc").textContent = p.descricao || "";
    var ingr = String(p.ingredientes || "").split(/[,\n]/).map(function(s){ return s.trim(); }).filter(Boolean);
    $("#pmIngr").innerHTML = ingr.length ? "<h4>Ingredientes</h4><ul class=\"chips\">" + ingr.map(function(i){ return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" : "";
    $("#pmOpcoes").innerHTML = opcoes.length ? "<h4>Personaliza</h4>" + opcoes.map(function(o){
      return '<label class="check"><input type="checkbox" name="opc" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>";
    }).join("") : "";
    $("#pmExtras").innerHTML = extras.length ? "<h4>Extras</h4>" + extras.map(function(e, i){
      return '<label class="check"><input type="checkbox" name="ext" value="' + i + '"><span>' + esc(e.nome) + "</span><em>+ " + (e.preco == null ? "XX Kz" : fmt(e.preco)) + "</em></label>";
    }).join("") : "";
    $("#pmQty").textContent = "1";
    updateModalPrice();

    modalFocus = document.activeElement;
    $("#pmodal").hidden = false;
    document.body.classList.add("no-scroll");
    $("#pmClose").focus();
  }

  function closeProduct(){
    var m = $("#pmodal"); if (!m || m.hidden) return;
    m.hidden = true; M = null;
    document.body.classList.remove("no-scroll");
    if (modalFocus && modalFocus.focus) modalFocus.focus();
  }

  function selectedExtras(){
    return $$('#pmodal input[name="ext"]:checked').map(function(i){ return M.extras[+i.value]; });
  }
  function selectedOpcoes(){
    return $$('#pmodal input[name="opc"]:checked').map(function(i){ return i.value; });
  }
  function updateModalPrice(){
    if (!M) return;
    var ex = selectedExtras();
    var unpriced = M.p.preco == null || ex.some(function(e){ return e.preco == null; });
    var unit = (M.p.preco == null ? 0 : Number(M.p.preco)) + ex.reduce(function(s, e){ return s + (Number(e.preco) || 0); }, 0);
    var label = unpriced ? "XX.XXX Kz" : fmt(unit * M.qty);
    $("#pmPrice").textContent = label;
    $("#pmAdd").textContent = "ADICIONAR AO CARRINHO · " + label;
  }

  function addFromModal(){
    if (!M) return;
    Coky.cart.add({
      kind: "produto", id: M.p.id, nome: M.p.nome, emoji: catEmoji(M.p.categoria_id), preco: M.p.preco,
      qty: M.qty, extras: selectedExtras(), opcoes: selectedOpcoes()
    });
    closeProduct();
  }

  /* =========================================================
     5) INTERAÇÃO
     ========================================================= */
  function quickAdd(id){
    var p = S.produtos.filter(function(x){ return String(x.id) === String(id); })[0];
    if (p) Coky.cart.add({ kind: "produto", id: p.id, nome: p.nome, emoji: catEmoji(p.categoria_id), preco: p.preco, qty: 1 });
  }
  function addCombo(id){
    var k = S.combos.filter(function(x){ return String(x.id) === String(id); })[0];
    if (k) Coky.cart.add({ kind: "combo", id: k.id, nome: k.nome, emoji: "🎁", preco: k.preco, qty: 1 });
  }

  function bind(){
    document.addEventListener("click", function(e){
      var t;
      if ((t = e.target.closest("[data-open]"))) { openProduct(t.dataset.open); return; }
      if ((t = e.target.closest("[data-add]"))) { quickAdd(t.dataset.add); return; }
      if ((t = e.target.closest("[data-add-combo]"))) { addCombo(t.dataset.addCombo); return; }
      if ((t = e.target.closest("[data-tab]"))) { S.cat = t.dataset.tab; renderMenu(); return; }
      if (e.target.closest("#pmClose") || e.target.id === "pmodal") { closeProduct(); return; }
      if (e.target.closest("#pmAdd")) { addFromModal(); return; }
      if ((t = e.target.closest("[data-qty]"))) {
        if (M) { M.qty = Math.max(1, Math.min(99, M.qty + (+t.dataset.qty))); $("#pmQty").textContent = M.qty; updateModalPrice(); }
        return;
      }
      // PEDIR AGORA: com itens no carrinho abre o pedido; senão leva ao menu (href="#menu")
      if (e.target.closest("[data-order]") && Coky.cart.count() > 0) { e.preventDefault(); Coky.cart.open(); return; }
      // PEDIR DELIVERY
      if (e.target.closest("[data-delivery]")) {
        e.preventDefault();
        if (Coky.cart.count() > 0) { Coky.cart.setTipo("Delivery"); Coky.cart.open(); }
        else { Coky.toast("Escolhe o que queres e envia o pedido 🛵"); var m = $("#menu"); if (m) m.scrollIntoView({ behavior: "smooth" }); }
        return;
      }
      // menu mobile
      if (e.target.closest("#menuBtn")) { toggleNav(); return; }
      if (e.target.closest("#mnav a")) { toggleNav(false); }
    });
    document.addEventListener("change", function(e){ if (e.target.closest("#pmodal")) updateModalPrice(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") { closeProduct(); toggleNav(false); } });
  }

  function toggleNav(force){
    var nav = $("#mnav"), btn = $("#menuBtn");
    if (!nav) return;
    var open = typeof force === "boolean" ? force : nav.hidden;
    nav.hidden = !open;
    btn.setAttribute("aria-expanded", open);
  }

  // revelar ao rolar (respeita prefers-reduced-motion)
  var io;
  function reveal(root){
    var els = $$("[data-reveal]:not(.in)", root);
    var still = !("IntersectionObserver" in window) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (still) { els.forEach(function(e){ e.classList.add("in"); }); return; }
    io = io || new IntersectionObserver(function(es){
      es.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    els.forEach(function(e){ io.observe(e); });
  }

  // link ativo na navbar
  function spy(){
    if (!("IntersectionObserver" in window)) return;
    var links = $$("[data-nav]");
    var so = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if (!en.isIntersecting) return;
        links.forEach(function(a){ a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(function(a){ var s = $(a.getAttribute("href")); if (s) so.observe(s); });
  }

  /* =========================================================
     6) ARRANQUE
     ========================================================= */
  async function init(){
    bind();
    reveal();
    spy();
    await loadData();
    applyConfig(); renderFeatured(); renderMenu(); renderCombos(); renderGallery(); renderReviews();
    if (S.demo) console.info("[Cokylicious] MODO DEMO: dados de exemplo (js/demo-data.js). Liga o Supabase em js/supabase.js.");
    if (String(S.cfg.whatsapp) === "244900000000") console.warn("[Cokylicious] O número de WhatsApp ainda é o de exemplo.");
  }

  // exposto para testes / consola
  Coky.site = { state: S, openProduct: openProduct, renderMenu: renderMenu };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
