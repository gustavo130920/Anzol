/*
 * Anzol — telas de Primeiros socorros ("Caí no golpe, e agora?") e do Escudo.
 * Conteúdo vem de app/data/socorro.json e app/data/escudo.json (fontes e datas em cada item).
 * Endereços oficiais aparecem como TEXTO para a pessoa digitar (o hábito que o Anzol ensina).
 */
(function () {
  'use strict';
  var socorro, escudo, raizS, raizE;
  var CH_S = 'anzol-socorro-v1', CH_E = 'anzol-escudo-v1';

  function el(tag, classe, texto) { var n = document.createElement(tag); if (classe) n.className = classe; if (texto != null) n.textContent = texto; return n; }
  function botao(texto, classe, fn) { var b = el('button', classe || 'btn-secundario', texto); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function lerLocal(ch, padrao) { try { return JSON.parse(localStorage.getItem(ch)) || padrao; } catch (e) { return padrao; } }
  function gravarLocal(ch, v) { try { localStorage.setItem(ch, JSON.stringify(v)); } catch (e) { /* segue em memória */ } }
  function dataBR(iso) { if (!iso) return ''; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function falar(texto) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-BR'; u.rate = 0.95; speechSynthesis.speak(u);
  }
  function linhaFonte(chaveOuFonte) {
    var f = typeof chaveOuFonte === 'string' ? socorro.fontes[chaveOuFonte] : chaveOuFonte;
    if (!f) return null;
    return el('p', 'fonte', 'Fonte: ' + f.nome + (f.url ? ' — ' + f.url : '') + (f.verificado_em ? ' (verificado em ' + dataBR(f.verificado_em) + ')' : ''));
  }

  // ---------- Primeiros socorros ----------
  function inicioSocorro() {
    raizS.textContent = '';
    var c = el('div', 'cartao');
    c.appendChild(el('h2', null, 'Caí no golpe, e agora?'));
    c.appendChild(el('p', 'apoio', 'Respire. Escolha o que aconteceu e siga os passos na ordem. Os primeiros minutos importam.'));
    var av = el('ul', 'avisos');
    socorro.avisos_fixos.forEach(function (a) { av.appendChild(el('li', null, a)); });
    c.appendChild(av);
    c.appendChild(el('h3', null, 'O que aconteceu?'));
    var g = el('div', 'grade-situacoes');
    socorro.situacoes.forEach(function (s) {
      var b = botao('', 'situacao', function () { abrirSituacao(s.id); });
      b.appendChild(el('span', 'situacao-titulo', s.titulo));
      b.appendChild(el('span', 'motivo-desc', s.resumo));
      g.appendChild(b);
    });
    c.appendChild(g);
    raizS.appendChild(c);
    raizS.appendChild(cartaoApoio());
    var h = raizS.querySelector('h2'); h.tabIndex = -1; h.focus({ preventScroll: true });
  }

  function abrirSituacao(id) {
    var s = socorro.situacoes.filter(function (x) { return x.id === id; })[0];
    var dados = lerLocal(CH_S, { aberturas: [], feitos: {} });
    var abertura = { situacao: id, aberta_em: Date.now(), contato_banco_em: null };
    dados.aberturas.push(abertura);
    if (dados.aberturas.length > 50) dados.aberturas.shift();
    gravarLocal(CH_S, dados);
    var idxAbertura = dados.aberturas.length - 1;

    raizS.textContent = '';
    var c = el('div', 'cartao');
    var nav = el('div', 'acoes'); nav.appendChild(botao('← Outras situações', 'btn-leve', inicioSocorro)); c.appendChild(nav);
    c.appendChild(el('h2', null, s.titulo));
    c.appendChild(el('p', 'apoio', s.resumo));
    var falarTudo = [s.titulo + '.'];
    var feitos = (dados.feitos[id] || []);

    ['agora', 'hoje', 'depois'].forEach(function (urg) {
      var passos = s.passos.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.urgencia === urg; });
      if (!passos.length) return;
      c.appendChild(el('h3', 'urgencia ' + urg, socorro.urgencias[urg]));
      var ol = el('ol', 'plano');
      passos.forEach(function (x) {
        var p = x.p;
        falarTudo.push(p.titulo + '. ' + p.texto);
        var li = el('li', 'passo-socorro');
        var lab = el('label', 'passo-topo');
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = feitos.indexOf(x.i) !== -1;
        cb.addEventListener('change', function () {
          var d = lerLocal(CH_S, { aberturas: [], feitos: {} });
          var f = d.feitos[id] || [];
          if (cb.checked && f.indexOf(x.i) === -1) f.push(x.i);
          if (!cb.checked) f = f.filter(function (n) { return n !== x.i; });
          d.feitos[id] = f; gravarLocal(CH_S, d);
        });
        lab.appendChild(cb);
        lab.appendChild(el('strong', null, ' ' + p.titulo));
        li.appendChild(lab);
        li.appendChild(el('p', null, p.texto));
        li.appendChild(el('p', 'motivo-desc', 'Por quê: ' + p.por_que));
        var fl = p.fonte ? linhaFonte(p.fonte) : null;
        if (fl) li.appendChild(fl);
        var acoes = el('div', 'links-acao');
        if (p.marca_contato_banco) {
          var info = el('p', 'motivo-desc');
          acoes.appendChild(botao('Já falei com o banco', 'btn-leve', function () {
            var d = lerLocal(CH_S, { aberturas: [], feitos: {} });
            var a = d.aberturas[idxAbertura] || abertura;
            a.contato_banco_em = Date.now();
            d.aberturas[idxAbertura] = a; gravarLocal(CH_S, d);
            var min = Math.max(0, Math.round((a.contato_banco_em - a.aberta_em) / 60000));
            info.textContent = 'Anotado: você falou com o banco ' + (min < 1 ? 'em menos de 1 minuto' : min + ' min') + ' depois de abrir esta página. (Indicador anônimo, fica só neste aparelho.)';
            cb.checked = true; cb.dispatchEvent(new Event('change'));
          }));
          li.appendChild(acoes);
          li.appendChild(info);
        }
        if (p.abre_kit) { acoes.appendChild(botao('Abrir o Kit de provas', 'btn-leve', function () { location.hash = '#kit'; })); li.appendChild(acoes); }
        if (p.vai_para) {
          var alvo = socorro.situacoes.filter(function (z) { return z.id === p.vai_para; })[0];
          acoes.appendChild(botao('Sim → ' + alvo.titulo, 'btn-leve', function () { abrirSituacao(p.vai_para); }));
          li.appendChild(acoes);
        }
        ol.appendChild(li);
      });
      c.appendChild(ol);
    });

    if (s.observacao) c.appendChild(el('p', 'mito', s.observacao));
    var ac = el('div', 'acoes');
    if ('speechSynthesis' in window) ac.appendChild(botao('Ouvir os passos', 'btn-secundario', function () { falar(falarTudo.join(' ')); }));
    ac.appendChild(botao('Abrir o Kit de provas', 'btn-secundario', function () { location.hash = '#kit'; }));
    c.appendChild(ac);
    raizS.appendChild(c);

    var n = el('div', 'cartao');
    n.appendChild(el('h3', null, socorro.se_nao_resolver.titulo));
    var ul = el('ol', 'passos');
    socorro.se_nao_resolver.passos.forEach(function (t) { ul.appendChild(el('li', null, t)); });
    n.appendChild(ul);
    n.appendChild(el('p', 'motivo-desc', socorro.se_nao_resolver.nota));
    var fn = linhaFonte(socorro.se_nao_resolver.fonte); if (fn) n.appendChild(fn);
    raizS.appendChild(n);
    raizS.appendChild(cartaoApoio());
    var h = raizS.querySelector('h2'); h.tabIndex = -1; h.focus({ preventScroll: true });
    window.scrollTo({ top: raizS.offsetTop - 12 });
  }

  function cartaoApoio() {
    var a = el('div', 'cartao nota');
    a.appendChild(el('h3', null, socorro.apoio.titulo));
    a.appendChild(el('p', null, socorro.apoio.texto));
    var f = linhaFonte(socorro.apoio.fonte); if (f) a.appendChild(f);
    a.appendChild(el('p', 'fonte', 'Leitura recomendada: ' + socorro.fontes.certbr.nome + ' — ' + socorro.fontes.certbr.url));
    return a;
  }

  // ---------- Escudo ----------
  function renderEscudo() {
    raizE.textContent = '';
    var cab = el('div', 'cartao');
    cab.appendChild(el('h2', null, 'Escudo: o básico que protege'));
    cab.appendChild(el('p', 'apoio', '8 cartões de cerca de 1 minuto e 5 ações para fazer hoje. Regras mudam: cada cartão mostra a fonte e quando foi verificado.'));
    raizE.appendChild(cab);

    // Checklist
    var est = lerLocal(CH_E, { checklist: {} });
    var ck = el('div', 'cartao destaque');
    var feitos = escudo.checklist.itens.filter(function (i) { return est.checklist[i.id]; }).length;
    ck.appendChild(el('h3', null, escudo.checklist.titulo + ' — ' + feitos + ' de ' + escudo.checklist.itens.length));
    var barra = el('progress', 'barra-xp'); barra.max = escudo.checklist.itens.length; barra.value = feitos;
    barra.setAttribute('aria-label', 'Ações concluídas');
    ck.appendChild(barra);
    var ul = el('ul', 'checklist');
    escudo.checklist.itens.forEach(function (i) {
      var li = el('li');
      var lab = el('label', 'passo-topo');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!est.checklist[i.id];
      cb.addEventListener('change', function () {
        var e = lerLocal(CH_E, { checklist: {} });
        if (cb.checked) e.checklist[i.id] = new Date().toISOString().slice(0, 10); else delete e.checklist[i.id];
        gravarLocal(CH_E, e); renderEscudo();
      });
      lab.appendChild(cb); lab.appendChild(el('strong', null, ' ' + i.texto));
      li.appendChild(lab);
      li.appendChild(el('p', 'motivo-desc', 'Como: ' + i.como));
      ul.appendChild(li);
    });
    ck.appendChild(ul);
    ck.appendChild(el('p', 'motivo-desc', escudo.checklist.nota));
    raizE.appendChild(ck);

    // Cartões
    var g = el('div', 'grade-cartoes');
    escudo.cartoes.forEach(function (c, n) {
      var d = el('article', 'cartao cartao-escudo');
      d.appendChild(el('p', 'num-cartao', (n + 1) + ' de ' + escudo.cartoes.length));
      d.appendChild(el('h3', null, c.titulo));
      d.appendChild(el('p', 'frase-escudo', c.frase));
      var l = el('ul', 'passos');
      c.itens.forEach(function (t) { l.appendChild(el('li', null, t)); });
      d.appendChild(l);
      d.appendChild(el('p', 'fonte', 'Fonte: ' + c.fonte.nome + (c.fonte.url ? ' — ' + c.fonte.url : '') + ' · verificado em ' + dataBR(c.verificado_em)));
      if ('speechSynthesis' in window) d.appendChild(botao('Ouvir', 'btn-leve', function () { falar(c.titulo + '. ' + c.frase + ' ' + c.itens.join(' ')); }));
      g.appendChild(d);
    });
    raizE.appendChild(g);
  }

  window.AnzolSocorroUI = {
    iniciar: function (o) { socorro = o.socorro; escudo = o.escudo; raizS = document.getElementById('socorro-raiz'); raizE = document.getElementById('escudo-raiz'); },
    mostrarSocorro: function () { if (socorro) inicioSocorro(); },
    mostrarEscudo: function () { if (escudo) renderEscudo(); },
    situacoes: function () { return socorro ? socorro.situacoes.map(function (s) { return { id: s.id, titulo: s.titulo }; }) : []; },
    // Indicador para o painel: minutos entre abrir a triagem e falar com o banco (autodeclarado)
    indicadores: function () {
      var d = lerLocal(CH_S, { aberturas: [] });
      var tempos = d.aberturas.filter(function (a) { return a.contato_banco_em; }).map(function (a) { return (a.contato_banco_em - a.aberta_em) / 60000; });
      var e = lerLocal(CH_E, { checklist: {} });
      return { aberturas: d.aberturas.length, minutos_ate_banco: tempos, checklist_feitos: Object.keys(e.checklist).length };
    }
  };
})();
