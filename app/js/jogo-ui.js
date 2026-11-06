/*
 * Anzol — telas do jogo (Testes). Usa AnzolJogo (regras) e AnzolScanner (lupa de domínio).
 * Tudo é montado com textContent: nenhum endereço vira link clicável.
 */
(function () {
  'use strict';

  var CANAIS = {
    sms: 'SMS', whatsapp: 'Aplicativo de mensagens', anuncio_rede_social: 'Anúncio em rede social',
    ligacao_transcricao: 'Ligação (transcrição)'
  };
  var TIPOS = { mensagem: 'Mensagem', dominio: 'Qual é o endereço verdadeiro?', procedimento: 'Qual o próximo passo?' };
  var jogo, scanner, conteudo, cfg, raiz, perguntas;

  // ---------- utilidades de DOM ----------
  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function botao(texto, classe, aoClicar) {
    var b = el('button', classe || 'btn-secundario', texto);
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
  }
  function limpar() { raiz.textContent = ''; window.scrollTo({ top: raiz.offsetTop - 12, behavior: 'smooth' }); }
  function focarTitulo() { var h = raiz.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function sorteio(lista, chave) { return lista[Math.abs(hash(chave)) % lista.length]; }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function donoReal(endereco) {
    var a = scanner.alvosParaListas(endereco);
    return a.length ? a[0].registravel : endereco;
  }
  function seloSimulacao() { return el('span', 'selo', 'SIMULAÇÃO'); }

  // ---------- início ----------
  function inicio() {
    limpar();
    var r = jogo.resumo();

    var cab = el('div', 'cartao');
    var h = el('h2', null, 'Testes: treine antes que o golpe chegue');
    cab.appendChild(h);
    cab.appendChild(el('p', 'apoio', 'Cenários baseados em golpes reais, com organizações fictícias. Aqui o XP premia investigar, não ser rápido. Errar é de graça.'));

    // Nível
    var nv = r.nivel;
    var bloco = el('div', 'nivel');
    bloco.appendChild(el('p', 'nivel-nome', 'Nível: ' + nv.nome));
    bloco.appendChild(el('p', 'motivo-desc', nv.frase));
    var barra = el('progress', 'barra-xp');
    barra.max = 1; barra.value = nv.progresso;
    barra.setAttribute('aria-label', 'Progresso até o próximo nível');
    bloco.appendChild(barra);
    bloco.appendChild(el('p', 'motivo-desc', r.xp + ' XP' + (nv.proximo ? ' · faltam ' + nv.faltam + ' para ' + nv.proximo : ' · nível máximo')));
    var seq = r.sequencia;
    bloco.appendChild(el('p', 'motivo-desc', 'Sequência: ' + seq.atual + (seq.atual === 1 ? ' dia' : ' dias') + (seq.jogouHoje ? ' (hoje já conta)' : '') + ' · perder um dia não zera (1 perdão por semana).'));
    cab.appendChild(bloco);
    raiz.appendChild(cab);

    // Teste inicial
    if (!r.avaliacoes.inicial) {
      var ini = el('div', 'cartao destaque');
      ini.appendChild(el('h3', null, 'Comece pelo teste inicial'));
      ini.appendChild(el('p', null, '5 mensagens, sem dicas. Serve para medir de onde você parte — depois, o reteste mostra quanto você evoluiu.'));
      var acoes = el('div', 'acoes');
      acoes.appendChild(botao('Fazer o teste inicial', 'btn-principal', function () { avaliacao('inicial'); }));
      ini.appendChild(acoes);
      raiz.appendChild(ini);
    }

    // Reteste / comparação
    if (r.podeFazerReteste) {
      var ret = el('div', 'cartao destaque');
      ret.appendChild(el('h3', null, 'Reteste liberado'));
      ret.appendChild(el('p', null, 'Você já praticou bastante. Faça o reteste (5 mensagens novas, sem dicas) e compare com o seu começo.'));
      var a2 = el('div', 'acoes');
      a2.appendChild(botao('Fazer o reteste', 'btn-principal', function () { avaliacao('reteste'); }));
      ret.appendChild(a2);
      raiz.appendChild(ret);
    }
    if (r.comparacao) raiz.appendChild(cartaoComparacao(r.comparacao));

    // Teste do dia
    var td = jogo.testeDoDia();
    var item = jogo.porId[td.id];
    var cd = el('div', 'cartao');
    cd.appendChild(el('h3', null, 'Teste do dia' + (td.feito ? ' — feito ✓' : '')));
    cd.appendChild(el('p', null, tituloItem(item)));
    cd.appendChild(el('p', 'motivo-desc', td.motivo + (td.feito ? '' : ' Vale +' + cfg.xp.teste_do_dia_bonus + ' XP de bônus.')));
    var a3 = el('div', 'acoes');
    a3.appendChild(botao(td.feito ? 'Rever' : 'Fazer agora', td.feito ? 'btn-secundario' : 'btn-principal', function () { abrir(td.id); }));
    cd.appendChild(a3);
    raiz.appendChild(cd);

    // Lista de itens
    var lista = el('div', 'cartao');
    lista.appendChild(el('h3', null, 'Todos os testes (' + r.praticados + ' de ' + r.totalPratica + ' feitos)'));
    ['mensagem', 'dominio', 'procedimento'].forEach(function (tipo) {
      lista.appendChild(el('p', 'subtitulo', TIPOS[tipo]));
      var grade = el('div', 'grade-itens');
      jogo.itens.filter(function (i) { return i.tipo === tipo; }).forEach(function (i) {
        var bloqueado = r.bloqueadosAteReteste.indexOf(i.id) !== -1;
        var f = r.feitos[i.id];
        var marca = f ? (f.acertouAlgumaVez ? '✓ ' : '• ') : '';
        var b = botao(marca + tituloItem(i), 'item-jogo' + (f && f.acertouAlgumaVez ? ' feito' : ''), function () { abrir(i.id); });
        if (bloqueado) { b.disabled = true; b.textContent = '🔒 Reservado para o reteste'; }
        b.setAttribute('aria-label', (bloqueado ? 'Reservado para o reteste' : tituloItem(i)) + (f ? (f.acertouAlgumaVez ? ', acertado' : ', feito') : ''));
        grade.appendChild(b);
      });
      lista.appendChild(grade);
    });
    raiz.appendChild(lista);

    // Selos
    var cs = el('div', 'cartao');
    cs.appendChild(el('h3', null, 'Selos'));
    var gs = el('div', 'grade-selos');
    r.selos.forEach(function (s) {
      var d = el('div', 'selo-jogo' + (s.ganhoEm ? ' ganho' : ''));
      d.appendChild(el('p', 'selo-nome', (s.ganhoEm ? '★ ' : '☆ ') + s.nome));
      d.appendChild(el('p', 'motivo-desc', s.descricao));
      gs.appendChild(d);
    });
    cs.appendChild(gs);
    raiz.appendChild(cs);

    var rod = el('div', 'cartao nota');
    rod.appendChild(el('p', 'motivo-desc', 'XP, níveis e selos são parâmetros iniciais, sem validação. Seu progresso fica só neste aparelho. Não há ranking: cada um no seu ritmo.'));
    rod.appendChild(botao('Recomeçar meu progresso', 'btn-leve', function () {
      if (confirm('Apagar todo o seu progresso neste aparelho?')) { jogo.reiniciar(); inicio(); }
    }));
    raiz.appendChild(rod);
    focarTitulo();
  }

  function tituloItem(i) {
    if (i.tipo === 'mensagem') return i.dados.titulo;
    if (i.tipo === 'dominio') return 'Endereço verdadeiro: ' + i.dados.organizacao_ficticia;
    return 'Próximo passo: ' + i.dados.situacao.split(/[.?]/)[0];
  }

  function cartaoComparacao(c) {
    var d = el('div', 'cartao destaque');
    d.appendChild(el('h3', null, 'Sua evolução'));
    var pct = function (x) { return Math.round(x * 100) + '%'; };
    var t = el('table', 'tabela');
    var cab = el('tr'); ['', 'Antes', 'Depois'].forEach(function (x) { cab.appendChild(el('th', null, x)); }); t.appendChild(cab);
    var l1 = el('tr'); [ 'Golpes que você trataria como legítimos', pct(c.antes.taxa_interacao), pct(c.depois.taxa_interacao)].forEach(function (x) { l1.appendChild(el('td', null, x)); }); t.appendChild(l1);
    var l2 = el('tr'); [ 'Legítimas que você trataria como golpe', pct(c.antes.taxa_falso_alarme), pct(c.depois.taxa_falso_alarme)].forEach(function (x) { l2.appendChild(el('td', null, x)); }); t.appendChild(l2);
    d.appendChild(t);
    d.appendChild(el('p', 'motivo-desc', 'Amostra pequena (5 mensagens em cada teste): é um indicador, não uma medida científica.'));
    return d;
  }

  // ---------- cartão de mensagem (cenário) ----------
  function cartaoMensagem(c) {
    var d = el('div', 'msg');
    var topo = el('div', 'msg-topo');
    topo.appendChild(el('span', 'msg-canal', CANAIS[c.canal] || c.canal));
    topo.appendChild(seloSimulacao());
    d.appendChild(topo);
    d.appendChild(el('p', 'msg-de', 'De: ' + c.organizacao_ficticia));
    d.appendChild(el('p', 'msg-texto', c.mensagem));
    if (c.imagem_descricao) d.appendChild(el('p', 'msg-extra', 'Imagem anexada (descrição): ' + c.imagem_descricao));
    if (c.link_exibido) {
      var l = el('p', 'msg-link');
      l.appendChild(el('span', null, 'Endereço na mensagem (não clicável): '));
      l.appendChild(el('code', null, c.link_exibido));
      d.appendChild(l);
    }
    if (c.contexto_simulado) d.appendChild(el('p', 'msg-extra', 'Contexto: ' + c.contexto_simulado));
    return d;
  }

  function cabecalhoItem(item, modo) {
    var topo = el('div', 'cartao');
    var nav = el('div', 'acoes');
    nav.appendChild(botao('← Voltar', 'btn-leve', inicio));
    topo.appendChild(nav);
    var h = el('h2', null, item.tipo === 'mensagem' ? item.dados.titulo : TIPOS[item.tipo]);
    topo.appendChild(h);
    var infos = [TIPOS[item.tipo], 'nível ' + item.nivel];
    var f = jogo.resumo().feitos[item.id];
    if (f) infos.push('revisão (sem XP)');
    topo.appendChild(el('p', 'motivo-desc', infos.join(' · ')));
    return topo;
  }

  // ---------- abrir um item ----------
  function abrir(id) {
    var item = jogo.porId[id];
    if (item.tipo === 'mensagem') telaMensagem(item);
    else if (item.tipo === 'dominio') telaDominio(item);
    else telaProcedimento(item);
  }

  function telaMensagem(item) {
    limpar();
    var rodada = jogo.montarRodada(item.id);
    var resp = { pistasMarcadas: [], usouLupa: false, classificacao: null, passo: null };
    var card = cabecalhoItem(item);
    card.appendChild(cartaoMensagem(item.dados));

    // 1. Investigar
    card.appendChild(el('h3', null, '1. Investigue'));
    card.appendChild(el('p', 'motivo-desc', 'Marque as pistas que você encontra nesta mensagem — sinais de alerta ou sinais a favor. Pistas certas valem XP; pistas que não estão lá descontam um pouco.'));
    var chips = el('div', 'chips');
    rodada.candidatos.forEach(function (c) {
      var b = botao(c.nome, 'chip pista', function () {
        var i = resp.pistasMarcadas.indexOf(c.id);
        if (i === -1) resp.pistasMarcadas.push(c.id); else resp.pistasMarcadas.splice(i, 1);
        b.setAttribute('aria-pressed', String(i === -1));
      });
      b.setAttribute('aria-pressed', 'false');
      chips.appendChild(b);
    });
    card.appendChild(chips);
    if (rodada.temLupa) {
      var lupaRes = el('p', 'lupa-resultado');
      lupaRes.hidden = true;
      var bl = botao('🔍 Usar a lupa de domínio', 'btn-secundario', function () {
        resp.usouLupa = true;
        lupaRes.hidden = false;
        lupaRes.textContent = '';
        lupaRes.appendChild(el('span', null, 'Dono real do endereço: '));
        lupaRes.appendChild(el('code', null, donoReal(item.dados.link_exibido)));
        lupaRes.appendChild(el('span', null, ' — é o trecho logo antes do final, antes da primeira barra.'));
        bl.disabled = true;
      });
      var al = el('div', 'acoes'); al.appendChild(bl); card.appendChild(al); card.appendChild(lupaRes);
    }

    // 2. Decidir
    card.appendChild(el('h3', null, '2. Decida'));
    card.appendChild(el('p', null, 'Esta mensagem é golpe ou legítima?'));
    var dec = el('div', 'acoes');
    var passos = el('div', 'passos-escolha');
    passos.hidden = true;
    var bGolpe = botao('Golpe', 'btn-principal', function () {
      resp.classificacao = 'golpe';
      bGolpe.setAttribute('aria-pressed', 'true'); bLeg.setAttribute('aria-pressed', 'false');
      if (item.legitima) return finalizar();
      passos.hidden = false;
      passos.querySelector('button').focus();
    });
    var bLeg = botao('Legítima', 'btn-principal', function () {
      resp.classificacao = 'legitima';
      finalizar();
    });
    dec.appendChild(bGolpe); dec.appendChild(bLeg);
    card.appendChild(dec);
    if (rodada.opcoesPasso) {
      passos.appendChild(el('p', null, 'E qual seria o seu próximo passo?'));
      rodada.opcoesPasso.forEach(function (op, i) {
        passos.appendChild(botao(op.texto, 'opcao', function () { resp.passo = i; finalizar(); }));
      });
      card.appendChild(passos);
    }
    raiz.appendChild(card);
    focarTitulo();

    function finalizar() {
      var correcao = jogo.corrigir(rodada, resp);
      var registro = jogo.registrar(rodada, correcao);
      feedbackMensagem(item, rodada, resp, correcao, registro);
    }
  }

  function blocoEventos(registro, correcao) {
    var d = el('div', 'eventos');
    var x = registro.primeiraVez ? '+' + registro.xpGanho + ' XP' : 'Revisão: sem XP (o XP vale na primeira vez)';
    if (registro.bonusDia) x += ' · +' + registro.bonusDia + ' XP do teste do dia';
    d.appendChild(el('p', 'xp-ganho', x));
    if (registro.primeiraVez && correcao.xp && correcao.xp.partes) {
      var p = correcao.xp.partes, nomes = { classificacao: 'decisão', passo: 'próximo passo', pistas: 'pistas', lupa: 'lupa antes de decidir', dominio: 'endereço certo', procedimento: 'passo certo' };
      var partes = Object.keys(p).filter(function (k) { return p[k]; }).map(function (k) { return nomes[k] + ' +' + p[k]; });
      if (partes.length) d.appendChild(el('p', 'motivo-desc', partes.join(' · ')));
    }
    if (registro.subiuNivel) d.appendChild(el('p', 'evento', 'Novo nível: ' + registro.nivelDepois.nome + '! ' + registro.nivelDepois.frase));
    registro.selosNovos.forEach(function (s) { d.appendChild(el('p', 'evento', 'Selo conquistado: ★ ' + s.nome)); });
    if (registro.usouPerdao) d.appendChild(el('p', 'motivo-desc', 'Você pulou um dia, mas o perdão semanal manteve sua sequência.'));
    return d;
  }

  function rodapeFeedback(item) {
    var a = el('div', 'acoes');
    var prox = proximoItem(item.id);
    if (prox) a.appendChild(botao('Próximo teste →', 'btn-principal', function () { abrir(prox); }));
    a.appendChild(botao('Voltar ao início', 'btn-secundario', inicio));
    return a;
  }
  function proximoItem(atual) {
    var r = jogo.resumo();
    var pool = jogo.itensPratica().filter(function (i) { return i.id !== atual; });
    var naoFeito = pool.filter(function (i) { return !r.feitos[i.id]; })[0];
    return naoFeito ? naoFeito.id : null;
  }

  function feedbackMensagem(item, rodada, resp, correcao, registro) {
    limpar();
    var c = item.dados;
    var card = el('div', 'cartao');
    var titulo = correcao.acertou ? sorteio(cfg.mensagens.acerto, item.id) :
      correcao.erro === 'falso_alarme' ? cfg.mensagens.falso_alarme : sorteio(cfg.mensagens.erro, item.id);
    var faixa = el('div', 'risco ' + (correcao.acertou ? 'baixo' : 'medio'));
    var tt = el('div');
    tt.appendChild(el('h2', 'risco-titulo', correcao.acertou ? 'Acertou' : (correcao.classificacaoOk ? 'Meio caminho' : 'Não foi dessa vez')));
    tt.appendChild(el('p', 'risco-sub', (item.legitima ? 'Esta mensagem era LEGÍTIMA. ' : 'Esta mensagem era GOLPE. ') + titulo));
    faixa.appendChild(tt);
    card.appendChild(faixa);
    card.appendChild(blocoEventos(registro, correcao));

    if (correcao.classificacaoOk && !item.legitima && !correcao.passoOk && correcao.passoEscolhido) {
      var pe = el('p', 'mito');
      pe.appendChild(el('strong', null, 'Sobre o passo que você escolheu: '));
      pe.appendChild(document.createTextNode(correcao.passoEscolhido.explicacao + ' O melhor caminho: ' + conteudo.decisoes[c.decisao_correta]));
      card.appendChild(pe);
    }

    // Pistas
    card.appendChild(el('h3', null, 'As pistas desta mensagem'));
    var ul = el('ul', 'motivos');
    c.pistas.forEach(function (p) {
      var marcou = resp.pistasMarcadas.indexOf(p.id) !== -1;
      var nomeSinal = (rodada.candidatos.filter(function (x) { return x.id === p.id; })[0] || {}).nome || p.id;
      var li = el('li', 'motivo' + (item.legitima ? ' confianca' : ''));
      li.appendChild(el('p', 'motivo-nome', (marcou ? '✓ ' : '○ ') + nomeSinal + (marcou ? '' : ' — você deixou passar')));
      var ev = el('p', 'evidencia'); ev.appendChild(document.createTextNode('Trecho: ')); ev.appendChild(el('q', null, p.trecho));
      li.appendChild(ev);
      li.appendChild(el('p', 'motivo-desc', p.explicacao));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    if (correcao.falsas.length) {
      var nomes = correcao.falsas.map(function (id) { return (rodada.candidatos.filter(function (x) { return x.id === id; })[0] || {}).nome; });
      card.appendChild(el('p', 'motivo-desc', 'Você marcou pistas que não estavam aqui: ' + nomes.join(', ') + '. Sem problema — olhar com calma é o treino.'));
    }

    // 4 perguntas
    card.appendChild(el('h3', null, 'As 4 perguntas'));
    var ol = el('dl', 'quatro-resp');
    ['quem', 'o_que', 'por_onde', 'como_confirmo'].forEach(function (k) {
      ol.appendChild(el('dt', null, perguntas[k]));
      ol.appendChild(el('dd', null, c.perguntas[k]));
    });
    card.appendChild(ol);
    card.appendChild(el('p', 'mito', c.feedback));
    var base = el('p', 'aviso', 'Baseado em: ' + c.baseado_em + (c.fonte_url ? ' Fonte: ' + c.fonte_url : ''));
    card.appendChild(base);
    card.appendChild(rodapeFeedback(item));
    raiz.appendChild(card);
    focarTitulo();
  }

  // ---------- domínio ----------
  function telaDominio(item) {
    limpar();
    var t = item.dados, rodada = jogo.montarRodada(item.id), usouLupa = false;
    var card = cabecalhoItem(item);
    var en = el('p', 'enunciado', t.enunciado);
    card.appendChild(en);
    card.appendChild(seloSimulacao());
    var lista = el('div', 'opcoes-lista');
    var donos = [];
    t.opcoes.forEach(function (op, i) {
      var linha = el('div', 'opcao-dominio');
      var b = botao('', 'opcao', function () {
        var correcao = jogo.corrigir(rodada, { opcao: i, usouLupa: usouLupa });
        feedbackDominio(item, correcao, jogo.registrar(rodada, correcao), i);
      });
      b.appendChild(el('code', null, op.endereco));
      linha.appendChild(b);
      var d = el('p', 'lupa-resultado'); d.hidden = true;
      d.appendChild(el('span', null, 'Dono real: '));
      d.appendChild(el('code', null, donoReal(op.endereco)));
      linha.appendChild(d);
      donos.push(d);
      lista.appendChild(linha);
    });
    var bl = botao('🔍 Usar a lupa de domínio', 'btn-secundario', function () {
      usouLupa = true; bl.disabled = true;
      donos.forEach(function (d) { d.hidden = false; });
    });
    var a = el('div', 'acoes'); a.appendChild(bl);
    card.appendChild(a);
    card.appendChild(el('p', 'motivo-desc', 'Escolha o endereço que pertence de verdade à organização. Os endereços são exemplos e não abrem.'));
    card.appendChild(lista);
    raiz.appendChild(card);
    focarTitulo();
  }

  function feedbackDominio(item, correcao, registro, escolhida) {
    limpar();
    var t = item.dados;
    var card = el('div', 'cartao');
    var faixa = el('div', 'risco ' + (correcao.acertou ? 'baixo' : 'medio'));
    var tt = el('div');
    tt.appendChild(el('h2', 'risco-titulo', correcao.acertou ? 'Acertou' : 'Não foi dessa vez'));
    tt.appendChild(el('p', 'risco-sub', 'O endereço oficial é ' + t.dominio_oficial + ' (fictício).'));
    faixa.appendChild(tt);
    card.appendChild(faixa);
    card.appendChild(blocoEventos(registro, correcao));
    var ul = el('ul', 'motivos');
    t.opcoes.forEach(function (op, i) {
      var li = el('li', 'motivo' + (op.correto ? ' confianca' : ''));
      var n = el('p', 'motivo-nome', (op.correto ? '✓ Verdadeiro' : '✗ Imitação') + (i === escolhida ? ' (sua escolha)' : ''));
      li.appendChild(n);
      var cd = el('p', 'evidencia'); cd.appendChild(el('q', null, op.endereco)); li.appendChild(cd);
      li.appendChild(el('p', 'motivo-desc', op.explicacao));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    card.appendChild(el('p', 'mito', 'Dica da lupa: ' + t.dica_lupa));
    card.appendChild(rodapeFeedback(item));
    raiz.appendChild(card);
    focarTitulo();
  }

  // ---------- procedimento ----------
  function telaProcedimento(item) {
    limpar();
    var t = item.dados, rodada = jogo.montarRodada(item.id);
    var card = cabecalhoItem(item);
    card.appendChild(el('p', 'enunciado', t.situacao));
    card.appendChild(seloSimulacao());
    card.appendChild(el('p', 'motivo-desc', 'Pergunta-chave: ' + perguntas[t.pergunta_chave]));
    var lista = el('div', 'opcoes-lista');
    t.opcoes.forEach(function (op, i) {
      lista.appendChild(botao(op.texto, 'opcao', function () {
        var correcao = jogo.corrigir(rodada, { opcao: i });
        feedbackProcedimento(item, correcao, jogo.registrar(rodada, correcao), i);
      }));
    });
    card.appendChild(lista);
    raiz.appendChild(card);
    focarTitulo();
  }

  function feedbackProcedimento(item, correcao, registro, escolhida) {
    limpar();
    var t = item.dados;
    var card = el('div', 'cartao');
    var faixa = el('div', 'risco ' + (correcao.acertou ? 'baixo' : 'medio'));
    var tt = el('div');
    tt.appendChild(el('h2', 'risco-titulo', correcao.acertou ? 'Acertou' : 'Não foi dessa vez'));
    tt.appendChild(el('p', 'risco-sub', t.situacao));
    faixa.appendChild(tt);
    card.appendChild(faixa);
    card.appendChild(blocoEventos(registro, correcao));
    var ul = el('ul', 'motivos');
    t.opcoes.forEach(function (op, i) {
      var li = el('li', 'motivo' + (op.correto ? ' confianca' : ''));
      li.appendChild(el('p', 'motivo-nome', (op.correto ? '✓ ' : '✗ ') + op.texto + (i === escolhida ? ' (sua escolha)' : '')));
      li.appendChild(el('p', 'motivo-desc', op.explicacao));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    if (t.aviso) card.appendChild(el('p', 'mito', t.aviso));
    if (t.fonte_url) card.appendChild(el('p', 'aviso', 'Fonte: ' + t.fonte_url));
    card.appendChild(rodapeFeedback(item));
    raiz.appendChild(card);
    focarTitulo();
  }

  // ---------- teste inicial / reteste ----------
  function avaliacao(tipo) {
    var itens = jogo.itensAvaliacao(tipo), respostas = [], i = 0;
    function passo() {
      limpar();
      var item = itens[i];
      var card = el('div', 'cartao');
      var nav = el('div', 'acoes'); nav.appendChild(botao('← Sair', 'btn-leve', inicio)); card.appendChild(nav);
      card.appendChild(el('h2', null, (tipo === 'inicial' ? 'Teste inicial' : 'Reteste') + ' — ' + (i + 1) + ' de ' + itens.length));
      card.appendChild(el('p', 'motivo-desc', 'Sem dicas agora: responda como faria no dia a dia. O resultado aparece no final.'));
      card.appendChild(cartaoMensagem(item.dados));
      card.appendChild(el('p', null, 'Você trataria esta mensagem como golpe ou como legítima?'));
      var a = el('div', 'acoes');
      ['golpe', 'legitima'].forEach(function (cl) {
        a.appendChild(botao(cl === 'golpe' ? 'Golpe' : 'Legítima', 'btn-principal', function () {
          respostas.push({ id: item.id, classificacao: cl });
          i++;
          if (i < itens.length) passo(); else fim();
        }));
      });
      card.appendChild(a);
      raiz.appendChild(card);
      focarTitulo();
    }
    function fim() {
      var res = jogo.registrarAvaliacao(tipo, respostas);
      limpar();
      var card = el('div', 'cartao');
      card.appendChild(el('h2', null, tipo === 'inicial' ? 'Seu ponto de partida' : 'Reteste concluído'));
      card.appendChild(el('p', null, 'Golpes reconhecidos: ' + (res.golpes - res.interacoes) + ' de ' + res.golpes + '.'));
      card.appendChild(el('p', null, 'Mensagens legítimas reconhecidas: ' + (res.legitimas - res.falsos_alarmes) + ' de ' + res.legitimas + '.'));
      card.appendChild(el('p', 'motivo-desc', tipo === 'inicial'
        ? 'Não importa o resultado: agora é treinar. As explicações aparecem em cada teste.'
        : 'Compare com o seu começo abaixo.'));
      var comp = jogo.comparacao();
      if (comp) card.appendChild(cartaoComparacao(comp));
      var ul = el('ul', 'motivos');
      respostas.forEach(function (r) {
        var it = jogo.porId[r.id];
        var certo = (r.classificacao === 'golpe') === !it.legitima;
        var li = el('li', 'motivo' + (certo ? ' confianca' : ''));
        li.appendChild(el('p', 'motivo-nome', (certo ? '✓ ' : '✗ ') + it.dados.titulo + ' — era ' + (it.legitima ? 'legítima' : 'golpe')));
        li.appendChild(el('p', 'motivo-desc', it.dados.feedback));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      var a = el('div', 'acoes');
      a.appendChild(botao('Ir para os testes', 'btn-principal', inicio));
      card.appendChild(a);
      raiz.appendChild(card);
      focarTitulo();
    }
    passo();
  }

  // ---------- inicialização ----------
  function armazenamentoLocal() {
    var CHAVE = 'anzol-jogo-v1';
    return {
      ler: function () { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; } },
      gravar: function (v) { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* modo privado: segue em memória */ } }
    };
  }

  window.AnzolJogoUI = {
    iniciar: function (o) {
      conteudo = o.conteudo; cfg = o.jogoConfig; scanner = o.scanner; perguntas = o.sinais.perguntas;
      raiz = document.getElementById('jogo-raiz');
      jogo = AnzolJogo.criarJogo({
        conteudo: conteudo, sinais: o.sinais, config: cfg, armazenamento: armazenamentoLocal(),
        // O mesmo motor de sinais do Scanner impede pistas "falsas" que na verdade estão na mensagem
        detectar: function (item) {
          var c = item.dados;
          return scanner.analisar(c.mensagem + (c.link_exibido ? ' ' + c.link_exibido : '')).motivos.map(function (m) { return m.id; });
        }
      });
      window.__anzolJogo = jogo; // ajuda a depurar e testar
    },
    mostrar: function () {
      if (!jogo) return;
      if (pendente) { var p = pendente; pendente = null; abrir(p); } else inicio();
    },
    // Item disponível para prática (os do reteste ficam reservados até o reteste)
    itemDisponivel: function (id) {
      return !!jogo && !!jogo.porId[id] && jogo.resumo().bloqueadosAteReteste.indexOf(id) === -1;
    },
    // Abre um teste específico (usado pelo Radar: "Treinar com este golpe")
    abrirItem: function (id) {
      pendente = id;
      if (location.hash === '#testes') window.AnzolJogoUI.mostrar(); else location.hash = '#testes';
    }
  };
  var pendente = null;
})();
