/*
 * Anzol — telas de Primeiros socorros ("Caí no golpe, e agora?") e do Escudo.
 * Conteúdo vem de app/data/socorro.json e app/data/escudo.json (fontes e datas em cada item).
 * Endereços oficiais aparecem como TEXTO para a pessoa digitar (o hábito que o Anzol ensina).
 */
(function () {
  'use strict';
  var socorro, escudo, raizS, raizE, triagemAtual = null;
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
    // Uma triagem por visita à aba: navegar entre situações não conta de novo,
    // e o tempo até falar com o banco é medido desde a PRIMEIRA abertura.
    if (triagemAtual === null) {
      dados.aberturas.push({ situacao: id, aberta_em: Date.now(), contato_banco_em: null });
      if (dados.aberturas.length > 50) dados.aberturas.shift();
      triagemAtual = dados.aberturas.length - 1;
    } else if (dados.aberturas[triagemAtual]) {
      dados.aberturas[triagemAtual].situacao = id;
    }
    gravarLocal(CH_S, dados);
    var idxAbertura = triagemAtual;
    var abertura = dados.aberturas[idxAbertura];

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
        var info = el('p', 'motivo-desc');
        if (p.marca_contato_banco) {
          acoes.appendChild(botao('Já falei com o banco', 'btn-leve', function () {
            var d = lerLocal(CH_S, { aberturas: [], feitos: {} });
            var a = d.aberturas[idxAbertura] || abertura;
            a.contato_banco_em = Date.now();
            d.aberturas[idxAbertura] = a; gravarLocal(CH_S, d);
            var min = Math.max(0, Math.round((a.contato_banco_em - a.aberta_em) / 60000));
            info.textContent = 'Anotado: você falou com o banco ' + (min < 1 ? 'em menos de 1 minuto' : min + ' min') + ' depois de abrir esta página. (Indicador anônimo, fica só neste aparelho.)';
            cb.checked = true; cb.dispatchEvent(new Event('change'));
          }));
        }
        if (p.abre_kit) acoes.appendChild(botao('Abrir o Kit de provas', 'btn-leve', function () { location.hash = '#kit'; }));
        if (p.vai_para) {
          var alvo = socorro.situacoes.filter(function (z) { return z.id === p.vai_para; })[0];
          acoes.appendChild(botao('Sim → ' + alvo.titulo, 'btn-leve', function () { abrirSituacao(p.vai_para); }));
        }
        // Botões e aviso montados uma vez, sempre na mesma ordem
        if (acoes.children.length) li.appendChild(acoes);
        if (p.marca_contato_banco) li.appendChild(info);
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
    function listaAcoes(itens) {
      var ul = el('ul', 'checklist');
      itens.forEach(function (i) {
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
      return ul;
    }
    ck.appendChild(listaAcoes(escudo.checklist.itens));
    if (escudo.checklist.extras) {
      ck.appendChild(el('h4', null, escudo.checklist.extras_titulo));
      ck.appendChild(listaAcoes(escudo.checklist.extras));
    }
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
      if (c.veja_tambem === 'contas' && escudo.contas) {
        d.appendChild(botao('Mais em "' + escudo.contas.titulo + '", abaixo', 'btn-leve', function () {
          var alvo = document.getElementById('titulo-contas'); if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
      }
      if ('speechSynthesis' in window) d.appendChild(botao('Ouvir', 'btn-leve', function () { falar(c.titulo + '. ' + c.frase + ' ' + c.itens.join(' ')); }));
      g.appendChild(d);
    });
    raizE.appendChild(g);
    if (escudo.contas) secaoContas(escudo.contas);
  }

  function fonteItem(f, data) {
    if (!f) return el('p', 'fonte', 'Conteúdo próprio do Anzol (boa prática) · revisado em ' + dataBR(data));
    return el('p', 'fonte', 'Fonte: ' + f.nome + (f.url ? ' — ' + f.url : '') + (data ? ' · verificado em ' + dataBR(data) : ''));
  }

  // "Proteja suas contas": simulador de senha (sem campo de senha) + duas etapas + proteções pouco conhecidas
  function secaoContas(c) {
    var sec = el('section', 'cartao secao-contas');
    sec.setAttribute('aria-labelledby', 'titulo-contas');
    var h = el('h2', null, c.titulo); h.id = 'titulo-contas'; sec.appendChild(h);
    sec.appendChild(el('p', 'apoio', c.intro));

    // Simulador
    var sim = el('div', 'simulador');
    sim.appendChild(el('h3', null, c.simulador.titulo));
    sim.appendChild(el('p', 'motivo-desc', c.simulador.explica));
    var escolha = { modo: 'caracteres', tamanho: 8, tipos: ['minusculas', 'numeros'], palavras: 4 };

    var modos = el('div', 'modos-senha'); modos.setAttribute('role', 'group'); modos.setAttribute('aria-label', 'Tipo de senha');
    var bCar = botao('Senha de caracteres', 'btn-leve', function () { escolha.modo = 'caracteres'; atualizar(); });
    var bFra = botao('Frase-senha (palavras)', 'btn-leve', function () { escolha.modo = 'frase'; atualizar(); });
    modos.appendChild(bCar); modos.appendChild(bFra); sim.appendChild(modos);

    function controleFaixa(rotulo, min, max, chave) {
      var lab = el('label', 'faixa');
      var txt = el('span'); lab.appendChild(txt);
      var r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.value = escolha[chave];
      r.addEventListener('input', function () { escolha[chave] = Number(r.value); atualizar(); });
      lab.appendChild(r);
      return { no: lab, texto: function () { txt.textContent = rotulo + ': ' + escolha[chave]; } };
    }
    var cTam = controleFaixa('Tamanho (caracteres)', 6, 20, 'tamanho');
    var cPal = controleFaixa('Quantidade de palavras', 3, 6, 'palavras');
    var caixaCar = el('div'); caixaCar.appendChild(cTam.no);
    var tiposF = el('fieldset', 'tipos-senha'); tiposF.appendChild(el('legend', null, 'Tipos de caractere'));
    c.tipos.forEach(function (t) {
      var l = el('label'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = escolha.tipos.indexOf(t.id) >= 0;
      cb.addEventListener('change', function () {
        escolha.tipos = cb.checked ? escolha.tipos.concat(t.id) : escolha.tipos.filter(function (x) { return x !== t.id; });
        if (!escolha.tipos.length) { escolha.tipos = [t.id]; cb.checked = true; } // pelo menos um tipo
        atualizar();
      });
      l.appendChild(cb); l.appendChild(document.createTextNode(' ' + t.nome + ' (' + t.quantidade + ')'));
      tiposF.appendChild(l);
    });
    caixaCar.appendChild(tiposF);
    var caixaFra = el('div'); caixaFra.appendChild(cPal.no); caixaFra.appendChild(el('p', 'motivo-desc', c.frase_senha.explica));
    sim.appendChild(caixaCar); sim.appendChild(caixaFra);

    var res = el('div', 'resultado-senha'); res.setAttribute('aria-live', 'polite');
    sim.appendChild(res);
    sim.appendChild(el('p', 'motivo-desc', c.ataque.descricao));
    sim.appendChild(fonteItem(c.ataque.fonte, c.ataque.verificado_em));
    var av = el('ul', 'avisos'); c.avisos.forEach(function (a) { av.appendChild(el('li', null, a)); });
    sim.appendChild(av);
    sim.appendChild(el('p', 'aviso-forte', c.simulador.aviso_nunca_digite));
    sec.appendChild(sim);

    function atualizar() {
      var frase = escolha.modo === 'frase';
      bCar.setAttribute('aria-pressed', String(!frase)); bFra.setAttribute('aria-pressed', String(frase));
      caixaCar.hidden = frase; caixaFra.hidden = !frase;
      cTam.texto(); cPal.texto();
      var r = window.AnzolSenha.avaliar(c, escolha);
      res.textContent = '';
      var grande = el('p', 'tempo-senha', r.tempo); res.appendChild(grande);
      res.appendChild(el('p', null, 'para testar todas as combinações (' + r.combinacoes + ').'));
      res.appendChild(el('p', 'motivo-desc', 'Cada ' + r.unidade + ' a mais multiplica o trabalho do atacante por ' + r.vezes_por_unidade.toLocaleString('pt-BR') + '.'));
    }
    atualizar();

    // Regras atuais de senha
    var rg = el('div'); rg.appendChild(el('h3', null, c.regras.titulo));
    var ulr = el('ul', 'passos'); c.regras.itens.forEach(function (t) { ulr.appendChild(el('li', null, t)); }); rg.appendChild(ulr);
    rg.appendChild(fonteItem(c.regras.fonte, c.regras.verificado_em));
    sec.appendChild(rg);

    // Duas etapas
    var de = el('div'); de.appendChild(el('h3', null, c.duas_etapas.titulo));
    var ol = el('ol', 'passos');
    c.duas_etapas.itens.forEach(function (i) { var li = el('li'); li.appendChild(el('strong', null, i.nome + ': ')); li.appendChild(document.createTextNode(i.texto)); ol.appendChild(li); });
    de.appendChild(ol);
    var uld = el('ul', 'passos'); c.duas_etapas.dicas.forEach(function (t) { uld.appendChild(el('li', null, t)); }); de.appendChild(uld);
    de.appendChild(fonteItem(c.duas_etapas.fonte, c.duas_etapas.verificado_em));
    sec.appendChild(de);

    // Pouco conhecidas
    var pc = el('div'); pc.appendChild(el('h3', null, c.pouco_conhecidas.titulo));
    var g2 = el('div', 'grade-cartoes');
    c.pouco_conhecidas.itens.forEach(function (i) {
      var d = el('article', 'cartao cartao-escudo');
      d.appendChild(el('h4', null, i.nome));
      d.appendChild(el('p', null, i.texto));
      d.appendChild(fonteItem(i.fonte, i.verificado_em));
      g2.appendChild(d);
    });
    pc.appendChild(g2);
    sec.appendChild(pc);
    raizE.appendChild(sec);
  }

  window.AnzolSocorroUI = {
    iniciar: function (o) { socorro = o.socorro; escudo = o.escudo; raizS = document.getElementById('socorro-raiz'); raizE = document.getElementById('escudo-raiz'); },
    mostrarSocorro: function () { if (socorro) { triagemAtual = null; inicioSocorro(); } },
    mostrarEscudo: function () { if (escudo) renderEscudo(); },
    situacoes: function () { return socorro ? socorro.situacoes.map(function (s) { return { id: s.id, titulo: s.titulo }; }) : []; },
    // Indicador para o painel: minutos entre abrir a triagem e falar com o banco (autodeclarado)
    indicadores: function () {
      var d = lerLocal(CH_S, { aberturas: [] });
      var tempos = d.aberturas.filter(function (a) { return a.contato_banco_em; }).map(function (a) { return (a.contato_banco_em - a.aberta_em) / 60000; });
      var e = lerLocal(CH_E, { checklist: {} });
      var principais = escudo ? escudo.checklist.itens.filter(function (i) { return e.checklist[i.id]; }).length : Object.keys(e.checklist).length;
      return { aberturas: d.aberturas.length, minutos_ate_banco: tempos, checklist_feitos: principais };
    }
  };
})();
