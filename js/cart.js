/* Cokylicious — utilitários, carrinho (localStorage) e envio do pedido por WhatsApp.
   Este ficheiro deve carregar ANTES de site.js. Expõe window.Coky. */
(function(){
  "use strict";

  var KEY = "coky_cart_v1";
  var TIPOS = ["Delivery", "Levantar no local"];

  /* ---------- utilitários ---------- */
  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
  }
  // 12000 -> "12.000 Kz"
  function fmt(n){
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " Kz";
  }
  // preço vazio = placeholder claramente editável
  function priceLabel(p){ return (p == null || p === "") ? "XX.XXX Kz" : fmt(p); }

  var $ = function(s){ return document.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var state = { items: [], tipo: TIPOS[0], notes: "" };
  var Coky = { esc: esc, fmt: fmt, priceLabel: priceLabel, cfg: {}, state: state };
  window.Coky = Coky;

  /* ---------- contas (funções puras, fáceis de testar) ---------- */
  function unitPrice(i){
    return (i.preco == null ? 0 : Number(i.preco)) +
      i.extras.reduce(function(s, e){ return s + (Number(e.preco) || 0); }, 0);
  }
  function isUnpriced(i){
    return i.preco == null || i.extras.some(function(e){ return e.preco == null; });
  }
  function totals(items){
    var sum = items.reduce(function(s, i){ return s + unitPrice(i) * i.qty; }, 0);
    var unpriced = items.some(isUnpriced);
    return { sum: sum, unpriced: unpriced, ui: unpriced ? "XX.XXX Kz" : fmt(sum), msg: unpriced ? "a confirmar" : fmt(sum) };
  }
  // mesma linha = mesmo produto + mesmos extras + mesmas opções (assim as quantidades somam)
  function keyOf(i){
    return [i.kind, i.id,
      i.extras.map(function(e){ return e.nome; }).sort().join(","),
      i.opcoes.slice().sort().join(",")].join("|");
  }
  function buildMessage(items, tipo, notes, nome){
    var lines = items.map(function(i){
      var l = (i.emoji || "") + " " + i.nome + " x" + i.qty;
      i.extras.forEach(function(e){ l += "\n   + " + e.nome; });
      i.opcoes.forEach(function(o){ l += "\n   • " + o; });
      return l;
    });
    var m = "Olá, " + (nome || "Cokylicious") + "! Quero fazer o seguinte pedido:\n\n" +
      lines.join("\n") + "\n\nTotal: " + totals(items).msg + "\n\nTipo: " + tipo;
    var n = String(notes || "").trim();
    if (n) m += "\n\n" + (tipo === TIPOS[0] ? "Morada / notas" : "Notas") + ": " + n;
    return m;
  }

  /* ---------- persistência ---------- */
  function valid(i){
    return i && typeof i.nome === "string" && typeof i.key === "string" && isFinite(i.qty) && i.qty > 0 &&
      Array.isArray(i.extras) && Array.isArray(i.opcoes);
  }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function load(){
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && Array.isArray(r.items)) {
        state.items = r.items.filter(valid);
        state.tipo = TIPOS.indexOf(r.tipo) >= 0 ? r.tipo : TIPOS[0];
        state.notes = String(r.notes || "");
      }
    } catch (e) {}
  }

  /* ---------- operações ---------- */
  function count(){ return state.items.reduce(function(s, i){ return s + i.qty; }, 0); }

  function add(item){
    var it = {
      kind: item.kind || "produto", id: String(item.id), nome: item.nome, emoji: item.emoji || "",
      preco: item.preco == null ? null : Number(item.preco),
      qty: Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1)),
      extras: (item.extras || []).slice(), opcoes: (item.opcoes || []).slice()
    };
    it.key = keyOf(it);
    var found = state.items.filter(function(x){ return x.key === it.key; })[0];
    if (found) found.qty = Math.min(99, found.qty + it.qty); else state.items.push(it);
    save(); render();
    toast(it.nome + " adicionado ao pedido");
  }
  function setQty(key, qty){
    var i = state.items.filter(function(x){ return x.key === key; })[0];
    if (!i) return;
    if (qty <= 0) state.items = state.items.filter(function(x){ return x !== i; });
    else i.qty = Math.min(99, qty);
    save(); render();
  }
  function clear(){ state.items = []; save(); render(); }
  function setTipo(t){ if (TIPOS.indexOf(t) >= 0) { state.tipo = t; save(); render(); } }

  /* ---------- UI: toast ---------- */
  var toastTimer;
  function toast(msg){
    var el = $("#toast"); if (!el) return;
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 2400);
  }

  /* ---------- UI: gaveta do carrinho ---------- */
  var lastFocus = null;
  function open(){
    var d = $("#cart"); if (!d) return;
    lastFocus = document.activeElement;
    $("#overlay").hidden = false; d.hidden = false;
    document.body.classList.add("no-scroll");
    var c = $("#cartClose"); if (c) c.focus();
  }
  function close(){
    var d = $("#cart"); if (!d || d.hidden) return;
    d.hidden = true; $("#overlay").hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function render(){
    var n = count();
    $$("[data-cart-count]").forEach(function(b){ b.textContent = n; b.hidden = n === 0; });

    var box = $("#cartItems"); if (!box) return;
    if (!state.items.length) {
      box.innerHTML = '<p class="cart-empty">O teu pedido está vazio.<br>Escolhe algo do menu </p>';
    } else {
      box.innerHTML = state.items.map(function(i){
        var sub = i.extras.map(function(e){ return "+ " + esc(e.nome); })
          .concat(i.opcoes.map(function(o){ return "• " + esc(o); })).join("<br>");
        var line = isUnpriced(i) ? "XX.XXX Kz" : fmt(unitPrice(i) * i.qty);
        return '<div class="cart-item"><div class="ci-main"><b>' + esc(i.emoji) + " " + esc(i.nome) + "</b>" +
          (sub ? '<small>' + sub + "</small>" : "") + "<span class=\"ci-price\">" + line + "</span></div>" +
          '<div class="qty" role="group" aria-label="Quantidade de ' + esc(i.nome) + '">' +
          '<button type="button" data-act="dec" data-key="' + esc(i.key) + '" aria-label="Menos">−</button>' +
          "<span>" + i.qty + "</span>" +
          '<button type="button" data-act="inc" data-key="' + esc(i.key) + '" aria-label="Mais">+</button></div>' +
          '<button class="ci-rm" type="button" data-act="rm" data-key="' + esc(i.key) + '" aria-label="Remover ' + esc(i.nome) + '">✕</button></div>';
      }).join("");
    }
    var t = $("#cartTotal"); if (t) t.textContent = totals(state.items).ui;
    $$('input[name="tipo"]').forEach(function(r){ r.checked = r.value === state.tipo; });
    var notes = $("#cartNotes");
    if (notes) {
      if (notes.value !== state.notes) notes.value = state.notes;
      notes.placeholder = state.tipo === TIPOS[0] ? "Morada, ponto de referência, notas…" : "Notas (opcional)";
    }
    var lab = $("#cartNotesLabel"); if (lab) lab.textContent = state.tipo === TIPOS[0] ? "Morada e notas" : "Notas";
  }

  function send(){
    if (!state.items.length) { toast("O teu pedido está vazio. Escolhe algo do menu!"); return; }
    var num = String(Coky.cfg.whatsapp || "").replace(/\D/g, "");
    if (!num) { toast("WhatsApp ainda não configurado."); return; }
    var text = buildMessage(state.items, state.tipo, state.notes, Coky.cfg.nome_empresa);
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  }

  /* ---------- ligações ---------- */
  function init(){
    load(); render();
    document.addEventListener("click", function(e){
      if (e.target.closest("[data-cart-open]")) { e.preventDefault(); open(); return; }
      if (e.target.closest("#cartClose") || e.target.id === "overlay") { close(); return; }
      if (e.target.closest("#cartSend")) { send(); return; }
      if (e.target.closest("#cartClear")) { clear(); return; }
      var b = e.target.closest("[data-act]");
      if (b) {
        var i = state.items.filter(function(x){ return x.key === b.dataset.key; })[0];
        if (!i) return;
        if (b.dataset.act === "inc") setQty(i.key, i.qty + 1);
        else if (b.dataset.act === "dec") setQty(i.key, i.qty - 1);
        else if (b.dataset.act === "rm") setQty(i.key, 0);
      }
    });
    document.addEventListener("change", function(e){
      if (e.target.name === "tipo") setTipo(e.target.value);
    });
    document.addEventListener("input", function(e){
      if (e.target.id === "cartNotes") { state.notes = e.target.value; save(); }
    });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
  }

  Coky.toast = toast;
  Coky.cart = { add: add, setQty: setQty, clear: clear, setTipo: setTipo, open: open, close: close, count: count,
    totals: totals, buildMessage: buildMessage, send: send, render: render, TIPOS: TIPOS };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
