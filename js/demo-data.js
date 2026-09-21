/* Cokylicious — DADOS DE EXEMPLO (modo demo)
   Usados apenas quando o Supabase não está configurado (js/supabase.js) ou falha.
   Tudo aqui é PLACEHOLDER: preços "null" aparecem como "XX.XXX Kz" e as fotos são o desenho
   assets/placeholder-burger.svg. Quando o Supabase estiver ligado, o site usa os dados do painel. */
(function(){
  var IMG = "assets/placeholder-burger.svg";
  var EX = "Descrição de exemplo — edita no painel.";

  var horario = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"].map(function(d){
    return { dia: d, abre: "", fecha: "", fechado: false };
  });

  window.COKY_DEMO = {
    config: {
      nome_empresa: "Cokylicious",
      slogan: "Good burgers. Good mood.",
      telefone: "+244 900 000 000",              // PLACEHOLDER
      whatsapp: "244900000000",                  // PLACEHOLDER — só números, com indicativo
      instagram: "https://www.instagram.com/cokylicious/",
      facebook: "https://www.facebook.com/profile.php?id=100064158276116",
      endereco: "Rua de Benguela, Luanda",       // A CONFIRMAR com o proprietário (há outra referência: Rua B3, "Bês")
      maps_link: "",                             // vazio = gera o link "Como chegar" a partir de mapa_query
      mapa_query: "Cokylicious Rua de Benguela Luanda",
      pagamentos: "Métodos de pagamento a confirmar com a Cokylicious.",
      hero_titulo: "A tua fome acaba aqui.",
      hero_subtitulo: "Hambúrgueres, combos e muito sabor preparados para deixar a tua fome sem argumentos.",
      sobre_titulo: "Mais que um burger.",
      sobre_texto: "Na Cokylicious acreditamos que uma boa refeição não precisa de cerimónia. Precisa de sabor.",
      horario: horario
    },

    categorias: [
      { id: "c1", nome: "Hambúrgueres",     emoji: "🍔", ordem: 1 },
      { id: "c2", nome: "Acompanhamentos",  emoji: "🍟", ordem: 2 },
      { id: "c3", nome: "Bebidas",          emoji: "🥤", ordem: 3 },
      { id: "c4", nome: "Frango",           emoji: "🍗", ordem: 4 },
      { id: "c5", nome: "Especiais",        emoji: "🔥", ordem: 5 },
      { id: "c6", nome: "Sobremesas",       emoji: "🍰", ordem: 6 }
    ],

    produtos: [
      { id: "p1", categoria_id: "c1", nome: "Coky Burger", etiqueta: "Mais pedido", destaque: true,
        descricao: "Carne grelhada, queijo, molho especial e ingredientes frescos.",
        ingredientes: "Pão, carne grelhada, queijo, molho especial, alface, tomate",
        preco: null, imagem_url: IMG,
        extras: [ { nome: "Queijo extra", preco: null }, { nome: "Bacon", preco: null } ],
        opcoes: ["Sem cebola", "Sem molho", "Bem passado"] },
      { id: "p2", categoria_id: "c1", nome: "Burger Duplo", etiqueta: "Novo", destaque: true,
        descricao: EX, ingredientes: "Pão, 2 carnes, queijo, molho especial", preco: null, imagem_url: IMG,
        extras: [ { nome: "Queijo extra", preco: null } ], opcoes: ["Sem cebola"] },
      { id: "p3", categoria_id: "c1", nome: "Cheese Burger", etiqueta: "", destaque: true,
        descricao: EX, ingredientes: "Pão, carne, queijo derretido", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p4", categoria_id: "c2", nome: "Batata Frita", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "Batata, sal", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p5", categoria_id: "c2", nome: "Anéis de Cebola", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "Cebola panada", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p6", categoria_id: "c3", nome: "Coca-Cola", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p7", categoria_id: "c3", nome: "Água", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p8", categoria_id: "c4", nome: "Frango Crocante", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "Frango panado", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p9", categoria_id: "c5", nome: "Especial da Casa", etiqueta: "Novo", destaque: false,
        descricao: EX, ingredientes: "", preco: null, imagem_url: IMG, extras: [], opcoes: [] },
      { id: "p10", categoria_id: "c6", nome: "Brownie", etiqueta: "", destaque: false,
        descricao: EX, ingredientes: "Chocolate", preco: null, imagem_url: IMG, extras: [], opcoes: [] }
    ],

    combos: [
      { id: "k1", nome: "Combo Solo",    itens: "Hambúrguer + Batata + Bebida",                       etiqueta: "Mais pedido", preco: null, imagem_url: IMG },
      { id: "k2", nome: "Combo Duplo",   itens: "2 Hambúrgueres + Batata + 2 Bebidas",                etiqueta: "",            preco: null, imagem_url: IMG },
      { id: "k3", nome: "Combo Família", itens: "Vários hambúrgueres + acompanhamentos + bebidas",    etiqueta: "",            preco: null, imagem_url: IMG }
    ],

    galeria: [1, 2, 3, 4, 5, 6].map(function(n){ return { id: "g" + n, imagem_url: IMG, legenda: "Foto de exemplo " + n }; }),

    avaliacoes: [
      { id: "a1", nome: "Nome do cliente", estrelas: 5, comentario: "Comentário do cliente (exemplo) — substitui pelo texto real." },
      { id: "a2", nome: "Nome do cliente", estrelas: 5, comentario: "Comentário do cliente (exemplo) — substitui pelo texto real." },
      { id: "a3", nome: "Nome do cliente", estrelas: 5, comentario: "Comentário do cliente (exemplo) — substitui pelo texto real." }
    ]
  };
})();
