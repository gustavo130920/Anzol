/*
 * Anzol — tela do Kit de provas.
 * Visão computacional NO APARELHO: OCR com Tesseract.js (carregado só quando a pessoa pede) e
 * impressão digital de imagem (dHash via canvas). As imagens ficam só na memória desta página.
 * Única dependência externa do projeto (OCR), prevista no plano; sem rede, o exemplo usa texto pré-extraído.
 */
(function () {
  'use strict';
  var TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var scanner, radar, raiz, provas = [], eventos = [], contador = 0, carregandoOcr = null;

  var EXEMPLO_TEXTO = [
    'SIMULAÇÃO — material educativo',
    'Banco Exemplar (fictício)',
    'Comprovante de transferência Pix',
    'Valor: R$ 1.150,00',
    'Data: 04/11/2026  Horário: 14:32',
    'Chave Pix: pix-custas-01@exemplo.test',
    'Destino: Escritório Exemplo Advocacia'
  ];

  function el(tag, classe, texto) { var n = document.createElement(tag); if (classe) n.className = classe; if (texto != null) n.textContent = texto; return n; }
  function botao(texto, classe, fn) { var b = el('button', classe || 'btn-secundario', texto); b.type = 'button'; b.addEventListener('click', fn); return b; }

  // ---------- imagens ----------
  function desenharExemplo(comprimido) {
    var c = document.createElement('canvas'); c.width = 760; c.height = 460;
    var g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#f2a900'; g.fillRect(0, 0, c.width, 54);
    g.fillStyle = '#1b1300'; g.font = 'bold 26px Arial'; g.fillText(EXEMPLO_TEXTO[0], 24, 37);
    g.fillStyle = '#0b3b66'; g.font = 'bold 30px Arial'; g.fillText(EXEMPLO_TEXTO[1], 24, 106);
    g.fillStyle = '#14181f'; g.font = '26px Arial';
    EXEMPLO_TEXTO.slice(2).forEach(function (t, i) { g.fillText(t, 24, 160 + i * 52); });
    g.save(); g.translate(430, 330); g.rotate(-0.35); g.fillStyle = 'rgba(179,38,30,0.12)'; g.font = 'bold 80px Arial'; g.fillText('SIMULAÇÃO', -260, 0); g.restore();
    if (!comprimido) return c.toDataURL('image/png');
    // "Mesmo print reenviado": menor e com compressão forte
    var m = document.createElement('canvas'); m.width = 380; m.height = 230;
    m.getContext('2d').drawImage(c, 0, 0, 380, 230);
    return m.toDataURL('image/jpeg', 0.45);
  }

  function carregarImagem(src) {
    return new Promise(function (ok, erro) { var img = new Image(); img.onload = function () { ok(img); }; img.onerror = erro; img.src = src; });
  }
  function impressao(img) {
    var c = document.createElement('canvas'); c.width = 9; c.height = 8;
    var g = c.getContext('2d'); g.drawImage(img, 0, 0, 9, 8);
    var d = g.getImageData(0, 0, 9, 8).data;
    return AnzolKit.dhash({ largura: 9, altura: 8, dados: Array.prototype.slice.call(d) });
  }

  function adicionarProva(src, opcoes) {
    return carregarImagem(src).then(function (img) {
      var p = { id: ++contador, src: src, img: img, hash: impressao(img), tipo: opcoes.tipo || 'comprovante', texto: '', extraido: null, exemplo: !!opcoes.exemplo, nome: opcoes.nome || ('Print ' + contador) };
      provas.push(p);
      render();
    });
  }

  // ---------- OCR (Tesseract.js, no aparelho) ----------
  function carregarTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (carregandoOcr) return carregandoOcr;
    carregandoOcr = new Promise(function (ok, erro) {
      var s = document.createElement('script');
      s.src = TESSERACT_URL; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = function () { window.Tesseract ? ok(window.Tesseract) : erro(new Error('OCR indisponível')); };
      s.onerror = function () { carregandoOcr = null; erro(new Error('Sem acesso à biblioteca de OCR (sem internet?)')); };
      document.head.appendChild(s);
    });
    return carregandoOcr;
  }
  function lerTexto(p, status) {
    status.textContent = 'Preparando a leitura (a imagem não sai do aparelho)…';
    return carregarTesseract().then(function (T) {
      return T.recognize(p.img, 'por', {
        logger: function (m) { if (m.status) status.textContent = 'Lendo: ' + m.status + (m.progress ? ' ' + Math.round(m.progress * 100) + '%' : ''); }
      });
    }).then(function (r) {
      p.texto = (r.data && r.data.text || '').trim();
      p.origemTexto = 'OCR no aparelho';
      if (!p.texto && p.exemplo) { p.texto = EXEMPLO_TEXTO.join('\n'); p.origemTexto = 'SIMULAÇÃO: texto pré-extraído'; }
    }).catch(function (e) {
      if (p.exemplo) { p.texto = EXEMPLO_TEXTO.join('\n'); p.origemTexto = 'SIMULAÇÃO: texto pré-extraído (' + e.message + ')'; }
      else { p.origemTexto = 'Não foi possível ler automaticamente (' + e.message + '). Digite os dados importantes no campo abaixo.'; }
    }).then(function () { extrairDaProva(p); render(); });
  }
  function extrairDaProva(p) {
    p.extraido = AnzolKit.extrair(p.texto, function (t) { return scanner.alvosParaListas(t); });
  }

  // ---------- agregação ----------
  function agregado() {
    var pag = [], tels = [], ends = [], chaves = [];
    provas.forEach(function (p) {
      var e = p.extraido; if (!e) return;
      e.telefones.forEach(function (t) { if (tels.indexOf(t) === -1) tels.push(t); });
      e.enderecos.forEach(function (t) { if (ends.indexOf(t) === -1) ends.push(t); });
      e.chaves_pix.forEach(function (c) { if (chaves.indexOf(c.valor) === -1) chaves.push(c.valor); });
      if (p.tipo === 'comprovante' && e.valores.length) pag.push({ valor: e.valores[0], data: e.datas[0] || null, hora: e.horas[0] || null, chave: e.chaves_pix[0] ? e.chaves_pix[0].valor : null, agendado: e.parece_agendado });
    });
    var evs = eventos.slice();
    provas.forEach(function (p) {
      var e = p.extraido; if (!e || !(e.datas.length || e.horas.length)) return;
      evs.push({ data: e.datas[0] || null, hora: e.horas[0] || null, descricao: p.nome + ' (' + p.tipo + ')' + (e.valores[0] ? ': R$ ' + e.valores[0] : ''), automatico: true });
    });
    return { pagamentos: pag, telefones: tels, enderecos: ends, chaves: chaves, eventos: AnzolKit.linhaDoTempo(evs) };
  }

  // ---------- tela ----------
  function render() {
    raiz.textContent = '';
    var c = el('div', 'cartao');
    var nav = el('div', 'acoes'); nav.appendChild(botao('← Caí no golpe', 'btn-leve', function () { location.hash = '#socorro'; })); c.appendChild(nav);
    c.appendChild(el('h2', null, 'Kit de provas'));
    c.appendChild(el('p', 'apoio', 'Junte prints e comprovantes. O Anzol lê o texto das imagens, organiza uma linha do tempo e monta um rascunho de relato para o banco e o boletim de ocorrência.'));
    var priv = el('p', 'mito');
    priv.appendChild(el('strong', null, 'Suas provas ficam com você. '));
    priv.appendChild(document.createTextNode('As imagens são lidas neste aparelho e não são salvas nem enviadas. Ao fechar a página, elas somem — baixe o rascunho antes.'));
    c.appendChild(priv);
    var lab = el('label', 'rotulo', 'Adicionar prints (imagens)');
    var inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.id = 'kit-arquivos';
    lab.htmlFor = 'kit-arquivos';
    inp.addEventListener('change', function () {
      Array.prototype.forEach.call(inp.files, function (f) {
        if (!/^image\//.test(f.type) || f.size > 15 * 1024 * 1024) return;
        var r = new FileReader();
        r.onload = function () { adicionarProva(r.result, { nome: f.name.slice(0, 40), tipo: 'conversa' }); };
        r.readAsDataURL(f);
      });
    });
    c.appendChild(lab); c.appendChild(inp);
    var ex = el('div', 'acoes');
    ex.appendChild(botao('Usar comprovante de exemplo (SIMULAÇÃO)', 'btn-secundario', function () { adicionarProva(desenharExemplo(false), { exemplo: true, tipo: 'comprovante', nome: 'Exemplo: comprovante' }); }));
    if (provas.some(function (p) { return p.exemplo; })) ex.appendChild(botao('Adicionar o mesmo print reenviado (comprimido)', 'btn-leve', function () { adicionarProva(desenharExemplo(true), { exemplo: true, tipo: 'comprovante', nome: 'Exemplo: mesmo print, reenviado' }); }));
    c.appendChild(ex);
    raiz.appendChild(c);

    provas.forEach(function (p) { raiz.appendChild(cartaoProva(p)); });
    if (provas.length) { raiz.appendChild(cartaoRascunho()); raiz.appendChild(cartaoRadar()); }
  }

  function cartaoProva(p) {
    var d = el('div', 'cartao prova');
    var topo = el('div', 'prova-topo');
    var im = el('img', 'miniatura'); im.src = p.src; im.alt = 'Prova: ' + p.nome;
    im.width = 120; im.height = Math.max(1, Math.round(120 * (p.img.naturalHeight || 1) / (p.img.naturalWidth || 1)));
    topo.appendChild(im);
    var info = el('div');
    info.appendChild(el('p', 'motivo-nome', p.nome + (p.exemplo ? ' ' : '')));
    if (p.exemplo) info.appendChild(el('span', 'selo', 'SIMULAÇÃO'));
    var sel = el('select'); sel.setAttribute('aria-label', 'Tipo de prova');
    [['conversa', 'Conversa'], ['comprovante', 'Comprovante'], ['site', 'Site ou anúncio'], ['outro', 'Outro']].forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; if (p.tipo === o[0]) op.selected = true; sel.appendChild(op); });
    sel.addEventListener('change', function () { p.tipo = sel.value; render(); });
    info.appendChild(sel);
    var dig = el('p', 'motivo-desc', 'Impressão digital da imagem: ');
    dig.appendChild(el('code', null, p.hash));
    info.appendChild(dig);
    var iguais = provas.filter(function (o) { return o.id !== p.id && AnzolKit.parecidas(o.hash, p.hash); });
    if (iguais.length) info.appendChild(el('p', 'evento-radar', 'Parece a mesma imagem que "' + iguais[0].nome + '" (distância ' + AnzolKit.distanciaHash(iguais[0].hash, p.hash) + ' de 64). Visão computacional: reconhece o mesmo print mesmo comprimido ou redimensionado.'));
    topo.appendChild(info);
    d.appendChild(topo);

    var status = el('p', 'motivo-desc', p.origemTexto || '');
    var ac = el('div', 'acoes');
    ac.appendChild(botao(p.texto ? 'Ler de novo' : 'Ler texto do print', 'btn-principal', function (ev) { ev.target.disabled = true; lerTexto(p, status); }));
    ac.appendChild(botao('Remover esta prova', 'btn-leve', function () {
      if (!confirm('Remover "' + p.nome + '" do Kit? A imagem não está salva em outro lugar.')) return;
      provas = provas.filter(function (o) { return o.id !== p.id; }); render();
    }));
    d.appendChild(ac);
    d.appendChild(status);
    var lt = el('label', 'rotulo-peq', 'Texto da imagem (confira e corrija):');
    var ta = el('textarea'); ta.rows = 4; ta.value = p.texto; ta.id = 'kit-texto-' + p.id; lt.htmlFor = ta.id;
    ta.addEventListener('change', function () { p.texto = ta.value; extrairDaProva(p); render(); });
    d.appendChild(lt); d.appendChild(ta);

    if (p.extraido) {
      var e = p.extraido;
      var ul = el('ul', 'lupa');
      [['Valor', e.valores.map(function (v) { return 'R$ ' + v; })], ['Data', e.datas.map(function (x) { var q = x.split('-'); return q[2] + '/' + q[1] + '/' + q[0]; })], ['Hora', e.horas],
       ['Chave Pix', e.chaves_pix.map(function (c) { return c.valor + ' (' + c.tipo + ')'; })], ['Telefone', e.telefones], ['Endereço de site', e.enderecos]].forEach(function (x) {
        if (!x[1].length) return;
        var li = el('li'); li.appendChild(el('strong', null, x[0] + ': ')); li.appendChild(document.createTextNode(x[1].join(' · '))); ul.appendChild(li);
      });
      if (!ul.children.length) ul.appendChild(el('li', null, 'Nenhum dado reconhecido. Você pode digitar no campo de texto acima.'));
      d.appendChild(el('p', 'motivo-nome', 'O que o Anzol encontrou:'));
      d.appendChild(ul);
      if (e.parece_agendado) d.appendChild(el('p', 'mito', 'Atenção: o comprovante fala em "agendado". Só o extrato do banco confirma que o dinheiro saiu ou entrou.'));
    }
    return d;
  }

  function cartaoRascunho() {
    var ag = agregado();
    var d = el('div', 'cartao');
    d.appendChild(el('h3', null, 'Linha do tempo'));
    var ul = el('ul', 'lupa');
    if (!ag.eventos.length) ul.appendChild(el('li', null, 'Leia o texto dos prints ou adicione eventos abaixo.'));
    ag.eventos.forEach(function (e) {
      var q = e.data ? e.data.split('-') : null;
      ul.appendChild(el('li', null, (q ? q[2] + '/' + q[1] + '/' + q[0] : 'sem data') + (e.hora ? ' ' + e.hora : '') + ' — ' + e.descricao + (e.automatico ? '' : ' (você)')));
    });
    d.appendChild(ul);
    var linha = el('div', 'linha-form');
    var fd = el('input'); fd.type = 'date'; fd.setAttribute('aria-label', 'Data do evento');
    var fh = el('input'); fh.type = 'time'; fh.setAttribute('aria-label', 'Hora do evento');
    linha.appendChild(fd); linha.appendChild(fh);
    d.appendChild(linha);
    var fdesc = el('input'); fdesc.type = 'text'; fdesc.placeholder = 'O que aconteceu? (ex.: recebi a mensagem)'; fdesc.className = 'campo'; fdesc.setAttribute('aria-label', 'Descrição do evento');
    d.appendChild(fdesc);
    var a1 = el('div', 'acoes');
    a1.appendChild(botao('Adicionar evento', 'btn-leve', function () { if (!fdesc.value.trim()) return; eventos.push({ data: fd.value || null, hora: fh.value || null, descricao: fdesc.value.trim().slice(0, 200) }); render(); }));
    d.appendChild(a1);

    d.appendChild(el('h3', null, 'Rascunho de relato (banco e BO)'));
    var sit = el('select'); sit.setAttribute('aria-label', 'Situação');
    var op0 = el('option', null, 'Situação (opcional)'); op0.value = ''; sit.appendChild(op0);
    (window.AnzolSocorroUI ? AnzolSocorroUI.situacoes() : []).forEach(function (s) { var op = el('option', null, s.titulo); op.value = s.titulo; sit.appendChild(op); });
    var canal = el('select'); canal.setAttribute('aria-label', 'Canal');
    ['Como fui abordado(a)? (opcional)', 'SMS', 'Aplicativo de mensagens', 'Ligação', 'E-mail', 'Anúncio ou rede social', 'Site'].forEach(function (t, i) { var op = el('option', null, t); op.value = i ? t : ''; canal.appendChild(op); });
    var l2 = el('div', 'linha-form'); l2.appendChild(sit); l2.appendChild(canal); d.appendChild(l2);
    var relato = el('textarea'); relato.rows = 3; relato.placeholder = 'Conte com suas palavras o que aconteceu.'; relato.setAttribute('aria-label', 'Relato');
    d.appendChild(relato);
    var saida = el('textarea'); saida.rows = 12; saida.className = 'rascunho'; saida.setAttribute('aria-label', 'Rascunho gerado'); saida.hidden = true;
    var a2 = el('div', 'acoes');
    var bCopiar = botao('Copiar', 'btn-leve', function () { saida.select(); try { navigator.clipboard.writeText(saida.value); bCopiar.textContent = 'Copiado ✓'; } catch (e) { document.execCommand('copy'); } });
    var bBaixar = botao('Baixar .txt', 'btn-leve', function () {
      var blob = new Blob([saida.value], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'anzol-rascunho-relato.txt';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    bCopiar.hidden = bBaixar.hidden = true;
    a2.appendChild(botao('Gerar rascunho', 'btn-principal', function () {
      saida.value = AnzolKit.rascunho({
        situacao: sit.value, canal: canal.value, relato: relato.value.trim(),
        pagamentos: ag.pagamentos, telefones: ag.telefones, enderecos: ag.enderecos,
        eventos: ag.eventos, provas: provas.map(function (p) { return { tipo: p.tipo }; })
      });
      saida.hidden = bCopiar.hidden = bBaixar.hidden = false;
    }));
    a2.appendChild(bCopiar); a2.appendChild(bBaixar);
    d.appendChild(a2);
    d.appendChild(saida);
    d.appendChild(el('p', 'motivo-desc', 'É um rascunho: revise, corrija e complete. Não é aconselhamento jurídico.'));
    return d;
  }

  function cartaoRadar() {
    var ag = agregado();
    var d = el('div', 'cartao');
    d.appendChild(el('h3', null, 'Ajudar outras pessoas (opcional)'));
    var inds = ag.chaves.concat(ag.telefones).concat(ag.enderecos);
    if (!inds.length) { d.appendChild(el('p', 'motivo-desc', 'Quando o Anzol encontrar chave Pix, telefone ou site do golpista, você poderá enviar só esses indicadores ao Radar.')); return d; }
    d.appendChild(el('p', null, 'Enviar ao Radar SÓ os indicadores do golpista. Suas imagens, seu nome e seus dados ficam com você.'));
    var ul = el('ul', 'lupa');
    ag.chaves.forEach(function () { ul.appendChild(el('li', null, 'chave Pix (vai protegida, como código)')); });
    ag.telefones.forEach(function () { ul.appendChild(el('li', null, 'telefone (vai protegido, como código)')); });
    ag.enderecos.forEach(function (e) { ul.appendChild(el('li', null, 'endereço de site: ' + e)); });
    d.appendChild(ul);
    var lab = el('label', 'consentimento');
    var cb = el('input'); cb.type = 'checkbox';
    lab.appendChild(cb); lab.appendChild(document.createTextNode(' Concordo em enviar só estes indicadores.'));
    d.appendChild(lab);
    var msg = el('p', 'motivo-desc');
    var ac = el('div', 'acoes');
    ac.appendChild(botao('Enviar ao Radar', 'btn-principal', function (ev) {
      ev.target.disabled = true;
      var texto = 'Indicadores do Kit de provas: ' + inds.join(' ');
      radar.relatar({ texto: texto, alvos: scanner.alvosParaListas(ag.enderecos.join(' ')), consentimento: cb.checked })
        .then(function (r) {
          msg.textContent = r.destino === 'campanha'
            ? 'Obrigado! Somou à campanha "' + r.campanha.titulo + '" (' + r.campanha.pessoas + ' pessoas).' + (r.mudouEstado ? ' O alerta foi ligado.' : '')
            : 'Obrigado! Entrou na fila de moderação do Radar (SIMULAÇÃO).';
        })
        .catch(function (e) { msg.textContent = e.message; ev.target.disabled = false; });
    }));
    d.appendChild(ac); d.appendChild(msg);
    return d;
  }

  window.AnzolKitUI = {
    iniciar: function (o) { scanner = o.scanner; radar = o.radar; raiz = document.getElementById('kit-raiz'); },
    mostrar: function () { if (scanner) render(); }
  };
})();
