/*
 * Anzol — Painel (Análise de dados). Gráficos em SVG puro, sem bibliotecas.
 * Regras de visualização: uma série por gráfico (uma cor), barras finas com valor na ponta,
 * dica ao passar o mouse/tocar, tabela equivalente para cada gráfico, modo escuro com cores próprias.
 * Fontes dos números: Radar (dados de demonstração SIMULADOS), jogo/socorro/escudo (dados DESTE aparelho)
 * e o funil de referência REAL (GASA 2026).
 */
(function () {
  'use strict';
  var radar, sinais, raiz, dias = 14, dica;
  var NS = 'http://www.w3.org/2000/svg';
  var DIA = 86400000;
  var FAMILIAS = {
    'link-sms-orgao-publico': 'SMS de órgão público', 'falso-advogado': 'Falso advogado', 'falso-parente': 'Falso parente',
    'loja-anuncio-falso': 'Loja falsa', 'dinheiro-inesperado': 'Dinheiro inesperado', 'falsa-central': 'Falsa central',
    'taxa-entrega': 'Taxa de entrega', 'a-classificar': 'A classificar'
  };

  function el(tag, classe, texto) { var n = document.createElement(tag); if (classe) n.className = classe; if (texto != null) n.textContent = texto; return n; }
  function svg(tag, attrs) { var n = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
  function num(n) { return Number(n).toLocaleString('pt-BR'); }
  function selo(texto, classe) { return el('span', 'selo-dado ' + (classe || ''), texto); }

  // ---------- dica (tooltip) ----------
  function mostrarDica(alvo, texto) {
    if (!dica) { dica = el('div', 'dica-grafico'); dica.setAttribute('role', 'status'); document.body.appendChild(dica); }
    dica.textContent = texto;
    var r = alvo.getBoundingClientRect();
    dica.style.left = Math.min(window.innerWidth - 220, Math.max(8, r.left + r.width / 2 - 100)) + 'px';
    dica.style.top = (window.scrollY + r.top - 40) + 'px';
    dica.hidden = false;
  }
  function esconderDica() { if (dica) dica.hidden = true; }

  // ---------- barras horizontais (uma série) ----------
  // Largura real disponível: o gráfico é desenhado no tamanho da tela (texto nunca encolhe)
  function larguraDisponivel() { return Math.max(280, Math.min(700, (raiz.clientWidth || 640) - 44)); }

  function barrasHorizontais(dados, opcoes) {
    // dados: [{ rotulo, valor }]. Tela estreita: nome acima da barra.
    var largura = larguraDisponivel(), estreito = largura < 480;
    var linha = estreito ? 44 : 30, esq = estreito ? 0 : (opcoes.esquerda || 150), dir = 44;
    var altura = dados.length * linha + 8;
    var max = Math.max.apply(null, dados.map(function (d) { return d.valor; }).concat([1]));
    var s = svg('svg', { viewBox: '0 0 ' + largura + ' ' + altura, width: largura, class: 'grafico', role: 'img', 'aria-label': opcoes.titulo + '. Detalhes na tabela abaixo.' });
    s.appendChild(svg('line', { x1: esq, y1: 0, x2: esq, y2: altura - 4, class: 'eixo' }));
    dados.forEach(function (d, i) {
      var y = i * linha + (estreito ? 22 : 6), w = Math.max(d.valor > 0 ? 3 : 0, (largura - esq - dir) * d.valor / max), h = 16;
      var t = estreito
        ? svg('text', { x: 2, y: y - 6, class: 'rotulo-eixo' })
        : svg('text', { x: esq - 8, y: y + h / 2 + 5, 'text-anchor': 'end', class: 'rotulo-eixo' });
      t.textContent = d.rotulo; s.appendChild(t);
      if (w > 0) {
        // ponta arredondada de 4px, base reta no eixo
        var p = svg('path', { d: 'M' + esq + ' ' + y + ' h' + Math.max(0, w - 4) + ' a4 4 0 0 1 4 4 v' + (h - 8) + ' a4 4 0 0 1 -4 4 h-' + Math.max(0, w - 4) + ' z', class: 'barra' });
        s.appendChild(p);
      }
      var v = svg('text', { x: esq + w + 6, y: y + h / 2 + 5, class: 'valor-barra' }); v.textContent = num(d.valor) + (opcoes.sufixo || ''); s.appendChild(v);
      var alvo = svg('rect', { x: 0, y: y - 6, width: largura, height: linha, class: 'alvo', tabindex: 0 });
      var txt = d.rotulo + ': ' + num(d.valor) + (opcoes.sufixo || '') + (opcoes.unidade ? ' ' + opcoes.unidade : '');
      alvo.addEventListener('mouseenter', function () { mostrarDica(alvo, txt); });
      alvo.addEventListener('focus', function () { mostrarDica(alvo, txt); });
      alvo.addEventListener('mouseleave', esconderDica);
      alvo.addEventListener('blur', esconderDica);
      s.appendChild(alvo);
    });
    return s;
  }

  // ---------- colunas por dia (uma série) ----------
  function colunasPorDia(serie, titulo) {
    // serie: [{ dia: Date, valor }]
    var largura = larguraDisponivel(), altura = 190, topo = 18, base = 30, esq = 34;
    var max = Math.max.apply(null, serie.map(function (d) { return d.valor; }).concat([1]));
    var passo = Math.max(1, Math.ceil(max / 4));
    var teto = passo * 4;
    var s = svg('svg', { viewBox: '0 0 ' + largura + ' ' + altura, width: largura, class: 'grafico', role: 'img', 'aria-label': titulo + '. Detalhes na tabela abaixo.' });
    var alturaUtil = altura - topo - base;
    for (var g = 0; g <= 4; g++) {
      var yv = topo + alturaUtil - alturaUtil * g / 4;
      s.appendChild(svg('line', { x1: esq, y1: yv, x2: largura, y2: yv, class: g === 0 ? 'eixo' : 'grade' }));
      var tt = svg('text', { x: esq - 6, y: yv + 4, 'text-anchor': 'end', class: 'rotulo-eixo' }); tt.textContent = num(passo * g); s.appendChild(tt);
    }
    var banda = (largura - esq) / serie.length, w = Math.min(24, banda - 4);
    serie.forEach(function (d, i) {
      var x = esq + i * banda + (banda - w) / 2, h = alturaUtil * d.valor / teto, y = topo + alturaUtil - h;
      if (h > 0) s.appendChild(svg('path', { d: 'M' + x + ' ' + (topo + alturaUtil) + ' v-' + Math.max(0, h - 4) + ' a4 4 0 0 1 4 -4 h' + (w - 8) + ' a4 4 0 0 1 4 4 v' + Math.max(0, h - 4) + ' z', class: 'barra' }));
      var rotulo = d.dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (i % Math.ceil(serie.length / Math.max(3, Math.floor(largura / 90))) === 0 || i === serie.length - 1) {
        var t = svg('text', { x: x + w / 2, y: altura - 10, 'text-anchor': 'middle', class: 'rotulo-eixo' }); t.textContent = rotulo; s.appendChild(t);
      }
      var alvo = svg('rect', { x: esq + i * banda, y: topo, width: banda, height: alturaUtil, class: 'alvo', tabindex: 0 });
      var txt = rotulo + ': ' + d.valor + (d.valor === 1 ? ' relato' : ' relatos');
      alvo.addEventListener('mouseenter', function () { mostrarDica(alvo, txt); });
      alvo.addEventListener('focus', function () { mostrarDica(alvo, txt); });
      alvo.addEventListener('mouseleave', esconderDica);
      alvo.addEventListener('blur', esconderDica);
      s.appendChild(alvo);
    });
    // rótulo seletivo: só o último dia
    var ult = serie[serie.length - 1];
    var hU = alturaUtil * ult.valor / teto;
    var tU = svg('text', { x: esq + (serie.length - 1) * banda + banda / 2, y: topo + alturaUtil - hU - 6, 'text-anchor': 'middle', class: 'valor-barra' }); tU.textContent = ult.valor; s.appendChild(tU);
    return s;
  }

  // ---------- funil (3 etapas, rampa ordinal de um tom) ----------
  function funil(etapas) {
    var largura = larguraDisponivel(), estreito = largura < 560, linha = estreito ? 62 : 46, esq = 0;
    var s = svg('svg', { viewBox: '0 0 ' + largura + ' ' + (etapas.length * linha), width: largura, class: 'grafico', role: 'img', 'aria-label': 'Funil do golpe no Brasil (GASA 2026). Detalhes na tabela abaixo.' });
    etapas.forEach(function (e, i) {
      var w = Math.max(40, (estreito ? largura - 4 : largura - 330) * e.valor / 100), y = i * linha + (estreito ? 24 : 4);
      s.appendChild(svg('rect', { x: esq, y: y, width: w, height: 28, rx: 4, class: 'funil-' + (i + 1) }));
      var t = estreito ? svg('text', { x: 2, y: y - 7, class: 'valor-barra' }) : svg('text', { x: w + 10, y: y + 19, class: 'valor-barra' });
      t.textContent = e.valor + '% ' + e.rotulo; s.appendChild(t);
      var alvo = svg('rect', { x: 0, y: y - 4, width: largura, height: linha, class: 'alvo', tabindex: 0 });
      alvo.addEventListener('mouseenter', function () { mostrarDica(alvo, e.dica); });
      alvo.addEventListener('focus', function () { mostrarDica(alvo, e.dica); });
      alvo.addEventListener('mouseleave', esconderDica);
      alvo.addEventListener('blur', esconderDica);
      s.appendChild(alvo);
    });
    return s;
  }

  function tabela(cabecalho, linhas) {
    var d = el('details', 'tabela-dados');
    d.appendChild(el('summary', null, 'Ver como tabela'));
    var t = el('table', 'tabela');
    var tr = el('tr'); cabecalho.forEach(function (c) { tr.appendChild(el('th', null, c)); }); t.appendChild(tr);
    linhas.forEach(function (l) { var r = el('tr'); l.forEach(function (c) { r.appendChild(el('td', null, String(c))); }); t.appendChild(r); });
    d.appendChild(t);
    return d;
  }

  function cartaoGrafico(titulo, subtitulo, etiquetas, conteudo, tab, vazio) {
    var c = el('section', 'cartao grafico-cartao');
    var h = el('h3', null, titulo); c.appendChild(h);
    var linhaEt = el('div', 'etiquetas'); etiquetas.forEach(function (e) { linhaEt.appendChild(e); }); c.appendChild(linhaEt);
    if (subtitulo) c.appendChild(el('p', 'motivo-desc', subtitulo));
    if (vazio) c.appendChild(el('p', 'vazio', vazio)); else { c.appendChild(conteudo); if (tab) c.appendChild(tab); }
    return c;
  }

  function tile(rotulo, valor, detalhe, etiqueta) {
    var t = el('div', 'tile');
    t.appendChild(el('p', 'tile-rotulo', rotulo));
    t.appendChild(el('p', 'tile-valor', valor));
    if (detalhe) t.appendChild(el('p', 'tile-detalhe', detalhe));
    if (etiqueta) t.appendChild(etiqueta);
    return t;
  }

  // ---------- cálculo ----------
  function relatosNoPeriodo() {
    var agora = Date.now(), lista = [];
    radar.campanhas().forEach(function (c) {
      c.relatos.forEach(function (r) { if (agora - r.quando <= dias * DIA) lista.push({ quando: r.quando, uf: r.uf, familia: c.familia, origem: r.origem }); });
    });
    return lista;
  }

  function render() {
    raiz.textContent = '';
    var est = radar.estatisticas();
    var campanhas = radar.campanhas();
    var relatos = relatosNoPeriodo();
    var jogo = window.__anzolJogo ? window.__anzolJogo.resumo() : null;
    var soc = window.AnzolSocorroUI ? AnzolSocorroUI.indicadores() : { aberturas: 0, minutos_ate_banco: [], checklist_feitos: 0 };

    var cab = el('div', 'cartao');
    cab.appendChild(el('h2', null, 'Painel: o que os dados mostram'));
    cab.appendChild(el('p', 'apoio', 'Análise de dados do Anzol. Cada bloco diz de onde vem o número: dados REAIS de pesquisa, dados de DEMONSTRAÇÃO (simulados) ou dados DESTE APARELHO.'));
    var filtro = el('div', 'chips');
    filtro.setAttribute('role', 'group'); filtro.setAttribute('aria-label', 'Período do Radar');
    [7, 14, 30].forEach(function (n) {
      var b = el('button', 'chip pista', 'Últimos ' + n + ' dias'); b.type = 'button';
      b.setAttribute('aria-pressed', String(dias === n));
      b.addEventListener('click', function () { dias = n; render(); });
      filtro.appendChild(b);
    });
    cab.appendChild(el('p', 'rotulo-peq', 'Período (Radar):'));
    cab.appendChild(filtro);
    raiz.appendChild(cab);

    // Destaques
    var tiles = el('div', 'tiles');
    tiles.appendChild(tile('Campanhas com alerta ativo', num(est.por_estado.alerta_ativo), 'de ' + est.campanhas + ' no Radar', selo('SIMULAÇÃO', 'sim')));
    tiles.appendChild(tile('Relatos no período', num(relatos.length), 'últimos ' + dias + ' dias', selo('SIMULAÇÃO', 'sim')));
    tiles.appendChild(tile('Tempo médio até o alerta', est.horas_ate_alerta_media == null ? '—' : est.horas_ate_alerta_media >= 48 ? (est.horas_ate_alerta_media / 24).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' dias' : Math.round(est.horas_ate_alerta_media) + ' h', 'do 1º relato ao alerta ligado por relatos independentes', selo('SIMULAÇÃO', 'sim')));
    var cmp = jogo && jogo.comparacao;
    tiles.appendChild(tile('Sua evolução', cmp ? Math.round(cmp.antes.taxa_interacao * 100) + '% → ' + Math.round(cmp.depois.taxa_interacao * 100) + '%' : (jogo && jogo.avaliacoes.inicial ? Math.round(jogo.avaliacoes.inicial.taxa_interacao * 100) + '% → ?' : '—'),
      cmp ? 'golpes tratados como legítimos: teste inicial → reteste' : 'faça o teste inicial e o reteste na aba Testes', selo('DESTE APARELHO', 'local')));
    raiz.appendChild(tiles);

    // Funil real
    var etapas = [
      { rotulo: 'tiveram contato com golpe', valor: 81, dica: '81% dos adultos pesquisados tiveram contato com golpe (GASA 2026).' },
      { rotulo: 'interagiram (calculado: 81% × 56%)', valor: 45, dica: '56% de quem encontra um golpe interage. 81% × 56% ≈ 45% do total (cálculo nosso sobre os números do GASA 2026).' },
      { rotulo: 'perderam dinheiro', valor: 10, dica: '25% de quem interage perde dinheiro — 10% do total (GASA 2026).' }
    ];
    raiz.appendChild(cartaoGrafico('O funil do golpe no Brasil', 'É aqui que o Anzol atua: diminuir a passagem de "contato" para "interação" (Testes e Scanner) e de "interação" para "perda" (Caí no golpe). Fonte: GASA — O Estado dos Golpes Brasil 2026, pesquisa online com 1.170 adultos (números extrapolados).',
      [selo('DADO REAL · GASA 2026', 'real')], funil(etapas),
      tabela(['Etapa', '% do total', 'Origem'], [['Contato com golpe', '81%', 'GASA 2026'], ['Interagiram', '≈45%', 'cálculo: 81% × 56% (GASA 2026)'], ['Perderam dinheiro', '10%', 'GASA 2026']])));

    // Relatos por dia
    var serie = [], hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    for (var i = dias - 1; i >= 0; i--) {
      var ini = hoje.getTime() - i * DIA;
      serie.push({ dia: new Date(ini), valor: relatos.filter(function (r) { return r.quando >= ini && r.quando < ini + DIA; }).length });
    }
    raiz.appendChild(cartaoGrafico('Relatos por dia', 'Tendência dos relatos recebidos pelo Radar. O último dia está destacado.',
      [selo('SIMULAÇÃO', 'sim')], colunasPorDia(serie, 'Relatos por dia'),
      tabela(['Dia', 'Relatos'], serie.map(function (d) { return [d.dia.toLocaleDateString('pt-BR'), d.valor]; }))));

    // Por UF
    var porUf = {};
    relatos.forEach(function (r) { if (r.uf) porUf[r.uf] = (porUf[r.uf] || 0) + 1; });
    var ufs = Object.keys(porUf).map(function (u) { return { rotulo: u, valor: porUf[u] }; }).sort(function (a, b) { return b.valor - a.valor; });
    var topUf = ufs.slice(0, 8);
    if (ufs.length > 8) topUf.push({ rotulo: 'Outros', valor: ufs.slice(8).reduce(function (s, x) { return s + x.valor; }, 0) });
    raiz.appendChild(cartaoGrafico('Relatos por estado', 'Região grosseira (só a UF), informada de forma opcional no relato.',
      [selo('SIMULAÇÃO', 'sim')], barrasHorizontais(topUf, { titulo: 'Relatos por estado', esquerda: 80, unidade: 'relatos' }),
      tabela(['UF', 'Relatos'], ufs.map(function (u) { return [u.rotulo, u.valor]; })), ufs.length ? null : 'Sem relatos no período.'));

    // Por família
    var porFam = {};
    relatos.forEach(function (r) { porFam[r.familia] = (porFam[r.familia] || 0) + 1; });
    var fams = Object.keys(porFam).map(function (f) { return { rotulo: FAMILIAS[f] || f, valor: porFam[f] }; }).sort(function (a, b) { return b.valor - a.valor; });
    raiz.appendChild(cartaoGrafico('Relatos por tipo de golpe', 'Ajuda a escolher quais cenários de teste criar primeiro.',
      [selo('SIMULAÇÃO', 'sim')], barrasHorizontais(fams, { titulo: 'Relatos por tipo de golpe', esquerda: 170, unidade: 'relatos' }),
      tabela(['Tipo', 'Relatos'], fams.map(function (f) { return [f.rotulo, f.valor]; })), fams.length ? null : 'Sem relatos no período.'));

    // Estados do Radar (lista curta, não precisa de gráfico)
    var estC = el('section', 'cartao');
    estC.appendChild(el('h3', null, 'Saúde do Radar'));
    estC.appendChild(el('div', 'etiquetas')).appendChild(selo('SIMULAÇÃO + DESTE APARELHO', 'sim'));
    var ul = el('ul', 'lupa');
    [['Em observação', est.por_estado.em_observacao], ['Alerta ativo', est.por_estado.alerta_ativo], ['Arquivadas', est.por_estado.arquivada],
     ['Relatos enviados por você', est.relatos_do_usuario], ['…que já batiam com campanha conhecida', est.relatos_que_batiam_com_campanha],
     ['Contestações aceitas (falsos positivos corrigidos)', est.contestacoes_aceitas]].forEach(function (x) {
      var li = el('li'); li.appendChild(el('strong', null, num(x[1]) + ' ')); li.appendChild(document.createTextNode(x[0])); ul.appendChild(li);
    });
    estC.appendChild(ul);
    raiz.appendChild(estC);

    // Aprendizado: pistas mais deixadas passar
    var erros = jogo ? Object.keys(jogo.errosPista || {}).map(function (id) { return { rotulo: (sinais[id] || {}).nome || id, valor: jogo.errosPista[id] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 6) : [];
    raiz.appendChild(cartaoGrafico('Pistas que você mais deixou passar', 'O teste do dia usa isso para escolher o próximo treino (regra simples, não IA).',
      [selo('DESTE APARELHO', 'local')], barrasHorizontais(erros, { titulo: 'Pistas mais deixadas passar', esquerda: 230, unidade: 'vezes' }),
      tabela(['Pista', 'Vezes que passou despercebida'], erros.map(function (e) { return [e.rotulo, e.valor]; })), erros.length ? null : 'Ainda sem dados: jogue alguns testes na aba Testes.'));

    // Proteção: escudo e socorro
    var pr = el('section', 'cartao');
    pr.appendChild(el('h3', null, 'Proteção em ação'));
    pr.appendChild(el('div', 'etiquetas')).appendChild(selo('DESTE APARELHO', 'local'));
    var med = soc.minutos_ate_banco.slice().sort(function (a, b) { return a - b; });
    var mediana = med.length ? med[Math.floor(med.length / 2)] : null;
    var t2 = el('div', 'tiles');
    t2.appendChild(tile('Ações do Escudo feitas', soc.checklist_feitos + ' de 5', 'checklist de proteção real'));
    t2.appendChild(tile('Triagens abertas', num(soc.aberturas), 'na aba Caí no golpe'));
    t2.appendChild(tile('Tempo até falar com o banco', mediana != null ? (mediana < 1 ? '< 1 min' : Math.round(mediana) + ' min') : '—', 'mediana, autodeclarado ("Já falei com o banco")'));
    pr.appendChild(t2);
    var meter = el('div', 'meter'); meter.setAttribute('role', 'meter'); meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '5'); meter.setAttribute('aria-valuenow', String(soc.checklist_feitos)); meter.setAttribute('aria-label', 'Ações do Escudo feitas');
    var fill = el('div', 'meter-fill'); fill.style.width = (soc.checklist_feitos / 5 * 100) + '%'; meter.appendChild(fill);
    pr.appendChild(meter);
    raiz.appendChild(pr);

    var nota = el('div', 'cartao nota');
    nota.appendChild(el('p', 'motivo-desc', 'Este painel mostra os indicadores que o Anzol mediria em produção. No protótipo, o Radar usa dados de demonstração e os indicadores pessoais ficam só neste aparelho (nada é enviado). Amostras pequenas não têm valor estatístico.'));
    raiz.appendChild(nota);
  }

  var espera = null;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () { if (raiz && !document.getElementById('vista-painel').hidden) render(); }, 200);
  });

  window.AnzolPainelUI = {
    iniciar: function (o) { radar = o.radar; sinais = {}; o.sinais.sinais.forEach(function (s) { sinais[s.id] = s; }); raiz = document.getElementById('painel-raiz'); },
    mostrar: function () { if (radar) render(); }
  };
})();
