/*
 * Anzol — tela do Scanner. Monta o resultado só com textContent (nada vira HTML ou link clicável).
 */
(function () {
  'use strict';

  var PERGUNTAS = [
    { chave: 'o_que', titulo: 'O que pede?' },
    { chave: 'quem', titulo: 'Quem pede — e como pressiona?' },
    { chave: 'por_onde', titulo: 'Por onde veio?' },
    { chave: 'como_confirmo', titulo: 'Como confirmo por outro caminho?' }
  ];
  var FAIXAS = {
    alto: { titulo: 'Risco ALTO', icone: 'alerta', frase: function (n) { return 'Encontramos ' + n + ' motivos para desconfiar. Não clique, não pague e não passe códigos.'; } },
    medio: { titulo: 'Risco MÉDIO', icone: 'atencao', frase: function (n) { return 'Encontramos ' + n + (n === 1 ? ' motivo' : ' motivos') + ' para desconfiar. Confirme por outro caminho antes de agir.'; } },
    baixo: { titulo: 'Risco BAIXO', icone: 'ok', frase: function (n) { return n ? 'Poucos sinais de alerta — mas baixo risco não é garantia.' : 'Não encontramos sinais de alerta — mas baixo risco não é garantia.'; } }
  };
  var PASSOS = {
    alto: ['Não clique no link e não responda.', 'Não faça Pix ou pagamento e não passe códigos ou senhas.', 'Se quiser conferir, procure a organização ou a pessoa por um caminho que VOCÊ já conhece (app oficial, número do cartão, ligação para o contato antigo).'],
    medio: ['Pare antes de agir: não há pressa que justifique pular a confirmação.', 'Confirme por outro caminho: app oficial, site digitado por você ou ligação para o contato que você já tinha.'],
    baixo: ['Se aparecer pedido de dinheiro, código ou dados, confirme por outro caminho.']
  };

  var el = function (tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  };
  var icone = function (tipo) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48'); svg.setAttribute('class', 'risco-icone'); svg.setAttribute('aria-hidden', 'true');
    var d = {
      alerta: 'M24 4 L45 42 H3 Z M24 18 V29 M24 34 V36',
      atencao: 'M24 4 a20 20 0 1 0 0.01 0 Z M24 13 V27 M24 33 V35',
      ok: 'M24 4 a20 20 0 1 0 0.01 0 Z M14 25 L21 32 L34 17'
    }[tipo];
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '4'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return svg;
  };

  var estado = { scanner: null, mitos: {}, ultimo: null, listas: null, consultaId: 0 };

  function lerJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return r.json();
    });
  }

  function iniciar() {
    Promise.all([lerJSON('data/signals.json'), lerJSON('data/scanner-config.json'), lerJSON('data/scenarios.json'), lerJSON('data/jogo-config.json'),
                 lerJSON('data/radar-config.json'), lerJSON('data/radar-semente.json'), lerJSON('data/socorro.json'), lerJSON('data/escudo.json')])
      .then(function (d) {
        estado.radar = AnzolRadar.criarRadar({
          semente: d[5], config: d[4],
          armazenamento: {
            ler: function () { try { return JSON.parse(localStorage.getItem('anzol-radar-v1')); } catch (e) { return null; } },
            gravar: function (v) { try { localStorage.setItem('anzol-radar-v1', JSON.stringify(v)); } catch (e) { /* segue em memória */ } }
          }
        });
        window.__anzolRadar = estado.radar;
        estado.scanner = AnzolScanner.criarScanner({ sinais: d[0], config: d[1] });
        estado.listas = AnzolListas.criarConsulta({
          urlRecorte: 'data/listas/phishing-database-br.json',
          lerJSON: lerJSON,
          lerTexto: function (url) {
            return fetch(url, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) {
              if (!r.ok) throw new Error('HTTP ' + r.status);
              return r.text();
            });
          }
        });
        d[0].mitos.forEach(function (m) { estado.mitos[m.id] = m; });
        montarExemplos(d[2]);
        if (window.AnzolJogoUI) AnzolJogoUI.iniciar({ sinais: d[0], conteudo: d[2], jogoConfig: d[3], scanner: estado.scanner });
        if (window.AnzolRadarUI) AnzolRadarUI.iniciar({ radar: estado.radar, conteudo: d[2] });
        if (window.AnzolSocorroUI) AnzolSocorroUI.iniciar({ socorro: d[6], escudo: d[7] });
        if (window.AnzolKitUI) AnzolKitUI.iniciar({ scanner: estado.scanner, radar: estado.radar });
        if (window.AnzolPainelUI) AnzolPainelUI.iniciar({ radar: estado.radar, sinais: d[0] });
        rotear();
      })
      .catch(function (erro) {
        var r = document.getElementById('resultado');
        r.hidden = false; r.textContent = '';
        r.appendChild(el('p', null, 'Não foi possível carregar os dados do Anzol. Abra pelo servidor local (tools\\servidor.ps1) ou pelo site publicado.'));
        console.error(erro);
      });

    document.getElementById('form-scanner').addEventListener('submit', function (ev) { ev.preventDefault(); analisar(); });
    document.getElementById('btn-limpar').addEventListener('click', function () {
      document.getElementById('entrada').value = '';
      var r = document.getElementById('resultado'); r.hidden = true; r.textContent = '';
      if (window.speechSynthesis) speechSynthesis.cancel();
      document.getElementById('entrada').focus();
    });
    var claro = document.documentElement.getAttribute('data-theme') === 'light';
    aplicarTema(claro);
    document.getElementById('btn-tema').addEventListener('click', function () {
      claro = !claro; aplicarTema(claro);
      try { localStorage.setItem('anzol-tema', claro ? 'claro' : 'preto'); } catch (e) {}
    });
    var btnFonte = document.getElementById('btn-fonte');
    var grande = false;
    try { grande = localStorage.getItem('anzol-texto-grande') === '1'; } catch (e) {}
    aplicarFonte(grande);
    btnFonte.addEventListener('click', function () {
      grande = !grande; aplicarFonte(grande);
      try { localStorage.setItem('anzol-texto-grande', grande ? '1' : '0'); } catch (e) {}
    });
  }

  // Navegação entre abas pelo endereço (#scanner, #testes)
  function rotear() {
    var vista = (location.hash || '#scanner').slice(1);
    if (['scanner', 'testes', 'radar', 'socorro', 'kit', 'escudo', 'painel'].indexOf(vista) === -1) vista = 'scanner';
    document.querySelectorAll('.vista').forEach(function (v) { v.hidden = v.id !== 'vista-' + vista; });
    document.querySelectorAll('.aba[data-vista]').forEach(function (a) {
      var ativa = a.getAttribute('data-vista') === vista;
      a.classList.toggle('ativa', ativa);
      if (ativa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (vista === 'testes' && window.AnzolJogoUI) AnzolJogoUI.mostrar();
    if (vista === 'radar' && window.AnzolRadarUI) AnzolRadarUI.mostrar();
    if (vista === 'socorro' && window.AnzolSocorroUI) AnzolSocorroUI.mostrarSocorro();
    if (vista === 'escudo' && window.AnzolSocorroUI) AnzolSocorroUI.mostrarEscudo();
    if (vista === 'kit' && window.AnzolKitUI) AnzolKitUI.mostrar();
    if (vista === 'painel' && window.AnzolPainelUI) AnzolPainelUI.mostrar();
    // O Kit é parte do "Caí no golpe": destaca essa aba
    if (vista === 'kit') { var as = document.querySelector('.aba[data-vista="socorro"]'); if (as) { as.classList.add('ativa'); as.setAttribute('aria-current', 'page'); } }
  }
  window.addEventListener('hashchange', rotear);

  // Tema: preto (padrão) ou claro. Guardado no aparelho; a barra do navegador acompanha.
  function aplicarTema(claro) {
    var raizHtml = document.documentElement;
    if (claro) raizHtml.setAttribute('data-theme', 'light'); else raizHtml.removeAttribute('data-theme');
    var b = document.getElementById('btn-tema');
    b.setAttribute('aria-pressed', String(claro));
    b.setAttribute('aria-label', claro ? 'Usar tema preto' : 'Usar tema claro');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', claro ? '#f7f7f8' : '#000000');
    if (window.AnzolPainelUI && !document.getElementById('vista-painel').hidden) AnzolPainelUI.mostrar();
  }

  function aplicarFonte(grande) {
    document.documentElement.classList.toggle('texto-grande', grande);
    document.getElementById('btn-fonte').setAttribute('aria-pressed', String(grande));
  }

  function montarExemplos(dados) {
    var lista = document.getElementById('lista-exemplos');
    dados.cenarios.forEach(function (c) {
      var texto = c.mensagem.replace(/^\[Transcrição\]\s*/, '').replace(/^"|"$/g, '');
      if (c.link_exibido && texto.indexOf(c.link_exibido) === -1) texto += ' ' + c.link_exibido;
      adicionarChip(lista, c.titulo, texto);
    });
    // Um endereço enganoso de cada teste de domínio + um oficial, para comparar
    dados.testes_dominio.forEach(function (t) {
      var enganoso = t.opcoes.filter(function (o) { return !o.correto; })[0];
      if (enganoso) adicionarChip(lista, 'Endereço: ' + enganoso.endereco, enganoso.endereco);
    });
    var oficial = dados.testes_dominio[0].opcoes.filter(function (o) { return o.correto; })[0];
    if (oficial) adicionarChip(lista, 'Endereço oficial: ' + oficial.endereco, oficial.endereco);
  }

  function adicionarChip(lista, rotulo, texto) {
    var b = el('button', 'chip', rotulo);
    b.type = 'button'; b.setAttribute('role', 'listitem');
    b.addEventListener('click', function () {
      document.getElementById('entrada').value = texto;
      analisar();
    });
    lista.appendChild(b);
  }

  function analisar() {
    var texto = document.getElementById('entrada').value.trim();
    var r = document.getElementById('resultado');
    if (!estado.scanner) return;
    if (!texto) { document.getElementById('entrada').focus(); return; }
    var res = estado.scanner.analisar(texto);
    estado.ultimo = res;
    var alvos = estado.scanner.alvosParaListas(texto);
    var id = ++estado.consultaId;
    var ctx = { texto: texto, alvos: alvos, listas: alvos.length ? { carregando: true } : null, radar: estado.radar ? { carregando: true } : null };
    mostrar(res, r, ctx);
    r.hidden = false;
    r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    camadasExternas(texto, alvos, id, false);
  }

  // Camadas externas: listas públicas (comparação no aparelho) + Radar (alerta passivo)
  function camadasExternas(texto, alvos, id, atualizacao, avisoRelato) {
    var r = document.getElementById('resultado');
    var pListas = (alvos.length && estado.listas) ? estado.listas.consultar(alvos) : Promise.resolve(null);
    var pRadar = estado.radar ? estado.radar.consultar(texto, alvos).catch(function () { return []; }) : Promise.resolve(null);
    return Promise.all([pListas, pRadar]).then(function (v) {
      if (id !== estado.consultaId) return; // a pessoa já analisou outra coisa
      var infoListas = v[0], radar = v[1];
      var res2 = estado.scanner.analisar(texto, { listas: infoListas ? infoListas.achados : {}, radar: radar || [] });
      estado.ultimo = res2;
      mostrar(res2, r, { texto: texto, alvos: alvos, listas: infoListas, radar: radar, avisoRelato: avisoRelato }, true);
    });
  }

  var ESTADOS = { alerta_ativo: 'Alerta ativo', em_observacao: 'Em observação', arquivada: 'Arquivada' };

  function blocoRadar(ctx) {
    var g = el('div', 'grupo');
    g.appendChild(el('h3', null, 'Radar de golpes reportados'));
    if (ctx.radar && ctx.radar.carregando) { g.appendChild(el('p', 'motivo-desc', 'Comparando com campanhas já reportadas…')); return g; }
    if (ctx.avisoRelato) g.appendChild(el('p', 'evento-radar', ctx.avisoRelato));
    var lista = (ctx.radar || []);
    if (!lista.length) {
      g.appendChild(el('p', null, 'Nenhuma campanha parecida no Radar. Se você recebeu isso, relatar ajuda outras pessoas.'));
    } else {
      var ul = el('ul', 'lupa');
      lista.slice(0, 3).forEach(function (m) {
        var c = m.campanha;
        var li = el('li', 'radar-item');
        var topo = el('p', 'motivo-nome');
        topo.appendChild(el('span', 'estado-radar ' + c.estado, ESTADOS[c.estado]));
        topo.appendChild(document.createTextNode(' ' + c.titulo));
        li.appendChild(topo);
        li.appendChild(el('p', 'motivo-desc', 'Reportada por ' + c.pessoas + (c.pessoas === 1 ? ' pessoa' : ' pessoas') + ' · ' + (m.como === 'exato' ? 'correspondência exata' : 'parecida') + ': ' + m.porque + '.'));
        if (c.estado === 'arquivada') li.appendChild(el('p', 'motivo-desc', 'Campanha arquivada (sem relatos recentes ou contestada): não pesa no risco.'));
        var acoes = el('div', 'links-acao');
        var ver = el('a', 'btn-leve', 'Ver no Radar'); ver.href = '#radar'; acoes.appendChild(ver);
        if (c.cenario_id && window.AnzolJogoUI && AnzolJogoUI.itemDisponivel(c.cenario_id)) {
          var tr = el('button', 'btn-leve', 'Treinar com este golpe');
          tr.type = 'button';
          tr.addEventListener('click', function () { AnzolJogoUI.abrirItem(c.cenario_id); });
          acoes.appendChild(tr);
        }
        li.appendChild(acoes);
        ul.appendChild(li);
      });
      g.appendChild(ul);
    }
    g.appendChild(formRelato(ctx));
    g.appendChild(el('p', 'motivo-desc', estado.radar.config.linguagem.aviso + ' SIMULAÇÃO: neste protótipo o Radar fica no seu navegador; em produção, num banco em nuvem.'));
    return g;
  }

  function formRelato(ctx) {
    var d = el('details', 'relato');
    if (estado.ultimo && estado.ultimo.faixa !== 'baixo' && !ctx.avisoRelato) d.open = true;
    d.appendChild(el('summary', null, 'Recebeu isso? Relate em um toque'));
    var u = AnzolRadar._util;
    var previa = el('div', 'previa');
    previa.appendChild(el('p', 'motivo-desc', 'Vai para o Radar SÓ isto (dados pessoais removidos automaticamente — confira):'));
    previa.appendChild(el('p', 'previa-texto', u.sanitizar(ctx.texto)));
    var cont = u.extrairContatos(ctx.texto);
    var inds = ctx.alvos.map(function (a) { return 'endereço ' + a.registravel; })
      .concat(cont.telefones.map(function () { return 'telefone (vai protegido, como código)'; }))
      .concat(cont.emails.map(function () { return 'e-mail/chave Pix (vai protegido, como código)'; }));
    previa.appendChild(el('p', 'motivo-desc', 'Indicadores do golpista: ' + (inds.length ? inds.join(' · ') : 'só o texto')));
    d.appendChild(previa);

    var linha = el('div', 'linha-form');
    var canal = el('select'); canal.id = 'relato-canal';
    [['', 'Por onde chegou? (opcional)'], ['sms', 'SMS'], ['mensagem', 'Aplicativo de mensagens'], ['ligacao', 'Ligação'], ['email', 'E-mail'], ['anuncio', 'Anúncio / rede social']].forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; canal.appendChild(op);
    });
    var lc = el('label', 'rotulo-peq', 'Canal'); lc.htmlFor = 'relato-canal';
    var uf = el('select'); uf.id = 'relato-uf';
    var op0 = el('option', null, 'Estado (opcional)'); op0.value = ''; uf.appendChild(op0);
    'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').forEach(function (s) { var op = el('option', null, s); op.value = s; uf.appendChild(op); });
    var lu = el('label', 'rotulo-peq', 'UF'); lu.htmlFor = 'relato-uf';
    var b1 = el('div'); b1.appendChild(lc); b1.appendChild(canal);
    var b2 = el('div'); b2.appendChild(lu); b2.appendChild(uf);
    linha.appendChild(b1); linha.appendChild(b2);
    d.appendChild(linha);

    var lab = el('label', 'consentimento');
    var cb = el('input'); cb.type = 'checkbox'; cb.id = 'relato-ok';
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' Concordo em enviar só os indicadores acima. Minhas provas e dados ficam comigo.'));
    d.appendChild(lab);
    var msg = el('p', 'motivo-desc');
    var enviar = el('button', 'btn-principal', 'Enviar relato');
    enviar.type = 'button';
    enviar.addEventListener('click', function () {
      enviar.disabled = true;
      estado.radar.relatar({ texto: ctx.texto, alvos: ctx.alvos, canal: canal.value || null, uf: uf.value || null, consentimento: cb.checked })
        .then(function (res) {
          var aviso = res.destino === 'campanha'
            ? (res.mudouEstado
              ? 'Obrigado! Seu relato somou à campanha "' + res.campanha.titulo + '" e o alerta foi LIGADO: agora ' + res.campanha.pessoas + ' pessoas independentes reportaram.'
              : 'Obrigado! Seu relato somou à campanha "' + res.campanha.titulo + '" (' + res.campanha.pessoas + ' pessoas).')
            : 'Obrigado! Campanha nova para o Radar: seu relato entrou na fila de moderação (SIMULAÇÃO) e será revisado antes de virar alerta ou teste.';
          camadasExternas(ctx.texto, ctx.alvos, ++estado.consultaId, true, aviso);
        })
        .catch(function (e) { msg.textContent = e.message; enviar.disabled = false; });
    });
    var ac = el('div', 'acoes'); ac.appendChild(enviar);
    d.appendChild(ac);
    d.appendChild(msg);
    return d;
  }

  function blocoListas(info) {
    var g = el('div', 'grupo');
    g.appendChild(el('h3', null, 'Listas públicas de phishing'));
    if (info.carregando) {
      g.appendChild(el('p', 'motivo-desc', 'Consultando listas públicas… (seu link não é enviado: o Anzol baixa a lista e compara no seu aparelho)'));
      return g;
    }
    var achou = Object.keys(info.achados);
    g.appendChild(el('p', null, achou.length
      ? 'Este endereço aparece em lista pública de phishing (veja o motivo acima).'
      : 'Não apareceu nas listas consultadas. Listas demoram a incluir endereços novos: isso NÃO prova que o endereço é seguro.'));
    var ul = el('ul', 'lupa');
    info.fontes.forEach(function (f) {
      var quando = f.atualizado ? new Date(f.atualizado).toLocaleDateString('pt-BR') : '';
      ul.appendChild(el('li', null, f.ok
        ? f.fonte + ' — ' + f.total.toLocaleString('pt-BR') + ' endereços' + (quando ? ', atualizada em ' + quando : '')
        : f.fonte + ' — indisponível agora (' + f.erro + ')'));
    });
    g.appendChild(ul);
    g.appendChild(el('p', 'motivo-desc', 'Fontes: Phishing.Database (licença MIT; recorte .br guardado só como impressões digitais) e OpenPhish Community Feed (baixado na hora, uso acadêmico/pessoal).'));
    return g;
  }

  function mostrar(res, alvo, ctx, atualizacao) {
    ctx = ctx || {};
    var infoListas = ctx.listas;
    alvo.textContent = '';
    var alertas = res.motivos.filter(function (m) { return m.tipo === 'alerta'; });
    var confianca = res.motivos.filter(function (m) { return m.tipo === 'confianca'; });
    var f = FAIXAS[res.faixa];

    var topo = el('div', 'risco ' + res.faixa);
    topo.appendChild(icone(f.icone));
    var txt = el('div');
    var h = el('h2', 'risco-titulo', f.titulo); h.tabIndex = -1;
    txt.appendChild(h);
    txt.appendChild(el('p', 'risco-sub', f.frase(alertas.length)));
    topo.appendChild(txt);
    alvo.appendChild(topo);

    // Motivos agrupados pelas 4 perguntas
    PERGUNTAS.forEach(function (p) {
      var doGrupo = alertas.filter(function (m) { return m.pergunta === p.chave; });
      if (!doGrupo.length) return;
      var g = el('div', 'grupo');
      g.appendChild(el('h3', null, p.titulo));
      var ul = el('ul', 'motivos');
      doGrupo.forEach(function (m) { ul.appendChild(itemMotivo(m)); });
      g.appendChild(ul);
      alvo.appendChild(g);
    });
    if (res.sinergias.length) {
      var gs = el('div', 'grupo');
      gs.appendChild(el('h3', null, 'Combinação de sinais'));
      res.sinergias.forEach(function (s) { gs.appendChild(el('p', null, s)); });
      alvo.appendChild(gs);
    }
    if (confianca.length) {
      var gc = el('div', 'grupo');
      gc.appendChild(el('h3', null, 'Sinais a favor (não provam nada sozinhos)'));
      var ulc = el('ul', 'motivos');
      confianca.forEach(function (m) { ulc.appendChild(itemMotivo(m)); });
      gc.appendChild(ulc);
      alvo.appendChild(gc);
    }

    // Lupa de domínio
    if (res.enderecos.length) {
      var gl = el('div', 'grupo');
      gl.appendChild(el('h3', null, 'Lupa de domínio'));
      var ull = el('ul', 'lupa');
      res.enderecos.forEach(function (e) {
        var li = el('li');
        li.appendChild(el('span', null, 'Dono real do endereço: '));
        li.appendChild(el('code', null, e.dono_real));
        if (e.referencia_oficial) li.appendChild(el('span', null, ' — corresponde ao endereço de referência de ' + e.referencia_oficial + '. Mesmo assim, olhe o que a mensagem pede.'));
        ull.appendChild(li);
      });
      gl.appendChild(ull);
      gl.appendChild(el('p', 'motivo-desc', 'Dica: o dono do site é o trecho logo antes do final (.com.br, .test…), antes da primeira barra. O Anzol não abriu o link.'));
      alvo.appendChild(gl);
    }

    if (ctx.radar !== undefined && estado.radar) alvo.appendChild(blocoRadar(ctx));
    if (infoListas) alvo.appendChild(blocoListas(infoListas));

    // Mitos
    res.lembretes.forEach(function (id) {
      var m = estado.mitos[id];
      if (!m) return;
      var p = el('p', 'mito');
      p.appendChild(el('strong', null, 'Mito: ' + m.texto + ' '));
      p.appendChild(document.createTextNode(m.correcao));
      alvo.appendChild(p);
    });

    // O que fazer agora
    var ga = el('div', 'grupo');
    ga.appendChild(el('h3', null, 'O que fazer agora'));
    var ol = el('ol', 'passos');
    PASSOS[res.faixa].forEach(function (t) { ol.appendChild(el('li', null, t)); });
    ga.appendChild(ol);
    var links = el('div', 'links-acao');
    var ouvir = el('button', 'btn-secundario', 'Ouvir o resultado');
    ouvir.type = 'button';
    if (!('speechSynthesis' in window)) ouvir.hidden = true;
    ouvir.addEventListener('click', function () { falar(res); });
    links.appendChild(ouvir);
    var socorro = el('button', 'btn-secundario', 'Já cliquei ou paguei — e agora?');
    socorro.type = 'button';
    socorro.addEventListener('click', function () {
      location.hash = '#socorro';
    });
    links.appendChild(socorro);
    ga.appendChild(links);
    alvo.appendChild(ga);

    var aviso = el('p', 'aviso', res.aviso + ' ' + res.aviso_link);
    alvo.appendChild(aviso);
    if (!atualizacao) h.focus({ preventScroll: true });
  }

  function itemMotivo(m) {
    var li = el('li', 'motivo' + (m.tipo === 'confianca' ? ' confianca' : ''));
    var nome = el('p', 'motivo-nome', m.nome);
    if (m.simulado) nome.appendChild(el('span', 'tag-sim', 'SIMULAÇÃO'));
    li.appendChild(nome);
    var expl = m.evidencias.map(function (e) { return e.explicacao; }).filter(Boolean);
    li.appendChild(el('p', 'motivo-desc', expl.length ? expl[0] : m.descricao));
    var trechos = m.evidencias.map(function (e) { return e.trecho; }).filter(Boolean);
    if (trechos.length) {
      var ev = el('p', 'evidencia');
      ev.appendChild(document.createTextNode('No texto: '));
      trechos.slice(0, 3).forEach(function (t, i) {
        if (i) ev.appendChild(document.createTextNode(' · '));
        ev.appendChild(el('q', null, t));
      });
      li.appendChild(ev);
    }
    return li;
  }

  function falar(res) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    var partes = [FAIXAS[res.faixa].titulo.replace('ALTO', 'alto').replace('MÉDIO', 'médio').replace('BAIXO', 'baixo') + '.'];
    res.motivos.filter(function (m) { return m.tipo === 'alerta'; }).slice(0, 5).forEach(function (m) { partes.push(m.nome + '.'); });
    partes.push(PASSOS[res.faixa].join(' '));
    var u = new SpeechSynthesisUtterance(partes.join(' '));
    u.lang = 'pt-BR'; u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
