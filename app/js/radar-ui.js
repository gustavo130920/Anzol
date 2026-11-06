/*
 * Anzol — tela do Radar (campanhas, fila de moderação SIMULADA, rascunhos de teste).
 * Linguagem: "reportada por N pessoas", nunca "é golpista". Nada vira link clicável, exceto navegação interna.
 */
(function () {
  'use strict';
  var radar, conteudo, raiz, filtro = 'todas', aviso = null;
  var ESTADOS = { alerta_ativo: 'Alerta ativo', em_observacao: 'Em observação', arquivada: 'Arquivada' };

  function el(tag, classe, texto) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function botao(texto, classe, fn) { var b = el('button', classe || 'btn-leve', texto); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function data(ms) { return ms ? new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'; }
  function dataHora(ms) { return new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function recarregar(msg) { aviso = msg || null; render(); }

  function render() {
    raiz.textContent = '';
    var campanhas = radar.campanhas();
    var est = radar.estatisticas();

    // Cabeçalho
    var cab = el('div', 'cartao');
    cab.appendChild(el('h2', null, 'Radar: golpes reportados agora'));
    var p = el('p', 'apoio');
    p.appendChild(document.createTextNode('Quando o mesmo golpe aparece para pessoas diferentes, o alerta já está ligado para a próxima. O Radar guarda '));
    p.appendChild(el('strong', null, 'indicadores, nunca acusações'));
    p.appendChild(document.createTextNode(': endereços, e telefones e chaves Pix só protegidos (como código).'));
    cab.appendChild(p);
    cab.appendChild(el('span', 'selo', 'SIMULAÇÃO — campanhas modeladas em alertas reais, com indicadores fictícios'));
    var resumo = el('div', 'resumo-radar');
    [['alerta_ativo', est.por_estado.alerta_ativo], ['em_observacao', est.por_estado.em_observacao], ['arquivada', est.por_estado.arquivada]].forEach(function (x) {
      var d = el('div', 'resumo-item ' + x[0]);
      d.appendChild(el('p', 'resumo-num', String(x[1])));
      d.appendChild(el('p', 'motivo-desc', ESTADOS[x[0]]));
      resumo.appendChild(d);
    });
    cab.appendChild(resumo);
    if (aviso) cab.appendChild(el('p', 'evento-radar', aviso));
    raiz.appendChild(cab);

    // Filtro + campanhas
    var lista = el('div', 'cartao');
    lista.appendChild(el('h3', null, 'Campanhas'));
    var chips = el('div', 'chips');
    [['todas', 'Todas'], ['alerta_ativo', 'Alerta ativo'], ['em_observacao', 'Em observação'], ['arquivada', 'Arquivadas']].forEach(function (f) {
      var b = botao(f[1], 'chip pista', function () { filtro = f[0]; render(); });
      b.setAttribute('aria-pressed', String(filtro === f[0]));
      chips.appendChild(b);
    });
    lista.appendChild(chips);
    var ordem = { alerta_ativo: 0, em_observacao: 1, arquivada: 2 };
    campanhas.filter(function (c) { return filtro === 'todas' || c.estado === filtro; })
      .sort(function (a, b) { return ordem[a.estado] - ordem[b.estado] || (b.ultimo_relato || 0) - (a.ultimo_relato || 0); })
      .forEach(function (c) { lista.appendChild(cartaoCampanha(c)); });
    raiz.appendChild(lista);

    raiz.appendChild(visaoModerador(campanhas));

    var rod = el('div', 'cartao nota');
    rod.appendChild(el('h3', null, 'Como o Radar decide'));
    var ul = el('ul', 'passos');
    ['Alerta ativo: quando há fonte oficial OU vários relatos de pessoas diferentes em pouco tempo (relatos repetidos da mesma pessoa contam uma vez).',
     'Telefone e chave Pix podem ser de uma vítima (conta clonada) ou de um terceiro: precisam de revisão humana antes de virar alerta.',
     'Número de LIGAÇÃO nunca gera alerta sozinho: o número exibido pode ser falsificado e ser o de uma instituição real.',
     'Variantes do mesmo golpe são agrupadas por semelhança de texto e de endereço (IA leve: trigramas + TF-IDF).',
     'Todo alerta expira sem relatos novos e pode ser contestado.'].forEach(function (t) { ul.appendChild(el('li', null, t)); });
    rod.appendChild(ul);
    rod.appendChild(el('p', 'motivo-desc', radar.config.linguagem.aviso));
    rod.appendChild(botao('Recomeçar o Radar deste aparelho', 'btn-leve', function () {
      if (confirm('Apagar os relatos e decisões de moderação feitos neste aparelho?')) { radar.reiniciar(); recarregar('Radar recomeçado: só os dados de demonstração.'); }
    }));
    raiz.appendChild(rod);
  }

  function cartaoCampanha(c) {
    var d = el('div', 'campanha ' + c.estado);
    var t = el('p', 'motivo-nome');
    t.appendChild(el('span', 'estado-radar ' + c.estado, ESTADOS[c.estado]));
    t.appendChild(document.createTextNode(' ' + c.titulo));
    d.appendChild(t);
    var info = 'Reportada por ' + c.pessoas + (c.pessoas === 1 ? ' pessoa' : ' pessoas') + ' · ' + c.ultimos_7_dias + ' nos últimos 7 dias';
    if (c.em_alta) info += ' · ↑ em alta';
    d.appendChild(el('p', 'motivo-desc', info));
    if (c.ufs.length) d.appendChild(el('p', 'motivo-desc', 'Onde mais aparece: ' + c.ufs.slice(0, 4).map(function (u) { return u.uf + ' (' + u.n + ')'; }).join(', ')));
    d.appendChild(el('p', 'motivo-desc', c.motivo_estado + (c.estado !== 'arquivada' && c.valida_ate ? ' Válida até ' + data(c.valida_ate) + ' se não houver relatos novos.' : '')));
    if (c.fonte_oficial) d.appendChild(el('p', 'motivo-desc', 'Fonte oficial do padrão: ' + c.fonte_oficial.nome + ' — ' + c.fonte_oficial.url));
    var inds = el('p', 'evidencia');
    inds.appendChild(document.createTextNode('Indicadores: '));
    (c.indicadores || []).forEach(function (i, k) {
      if (k) inds.appendChild(document.createTextNode(' · '));
      inds.appendChild(el('q', null, i.tipo === 'dominio' ? i.valor : (i.rotulo || i.tipo)));
    });
    d.appendChild(inds);
    var acoes = el('div', 'links-acao');
    if (c.cenario_id && window.AnzolJogoUI) {
      if (AnzolJogoUI.itemDisponivel(c.cenario_id)) acoes.appendChild(botao('Treinar com este golpe', 'btn-leve', function () { AnzolJogoUI.abrirItem(c.cenario_id); }));
      else acoes.appendChild(el('span', 'motivo-desc', 'Treino deste golpe: reservado para o reteste.'));
    }
    if (c.estado !== 'arquivada') acoes.appendChild(botao('Contestar este alerta', 'btn-leve', function (ev) {
      ev.target.disabled = true;
      formInline(d, {
        id: 'contestar-' + c.id,
        ajuda: radar.config.linguagem.contestacao,
        rotulo: 'Motivo da contestação (sem dados pessoais)',
        multilinha: true,
        textoOk: 'Enviar contestação',
        aoCancelar: function () { ev.target.disabled = false; },
        aoConfirmar: function (motivo) {
          radar.contestar(c.id, motivo);
          recarregar('Contestação registrada: vai para revisão humana (veja a visão do moderador abaixo).');
        }
      });
    }));
    d.appendChild(acoes);
    return d;
  }

  // Formulário dentro da própria tela (no lugar de prompt(), que é ruim no celular e sem estilo)
  function formInline(alvo, o) {
    var f = el('form', 'form-inline');
    if (o.ajuda) f.appendChild(el('p', 'motivo-desc', o.ajuda));
    var lab = el('label', 'rotulo-peq', o.rotulo); lab.htmlFor = o.id;
    var campo = o.multilinha ? el('textarea') : el('input');
    campo.id = o.id; campo.name = o.id; campo.className = 'campo'; campo.autocomplete = 'off';
    if (o.multilinha) campo.rows = 3; else campo.type = 'text';
    campo.maxLength = 300; campo.value = o.valorInicial || '';
    var erro = el('p', 'erro-campo'); erro.id = o.id + '-erro'; erro.setAttribute('role', 'alert'); erro.hidden = true;
    campo.setAttribute('aria-describedby', erro.id);
    campo.addEventListener('input', function () { erro.hidden = true; campo.removeAttribute('aria-invalid'); });
    f.appendChild(lab); f.appendChild(campo); f.appendChild(erro);
    var a = el('div', 'acoes');
    var ok = el('button', 'btn-principal', o.textoOk); ok.type = 'submit';
    var cancelar = botao('Cancelar', 'btn-leve', function () { f.remove(); if (o.aoCancelar) o.aoCancelar(); });
    a.appendChild(ok); a.appendChild(cancelar);
    f.appendChild(a);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = campo.value.trim();
      if (!v) {
        campo.setAttribute('aria-invalid', 'true');
        erro.textContent = 'Escreva pelo menos algumas palavras antes de enviar.';
        erro.hidden = false;
        campo.focus();
        return;
      }
      o.aoConfirmar(v);
    });
    alvo.appendChild(f);
    campo.focus();
    return f;
  }

  function visaoModerador(campanhas) {
    var m = el('div', 'cartao moderacao');
    m.appendChild(el('h3', null, 'Visão do moderador'));
    m.appendChild(el('p', 'motivo-desc', 'SIMULAÇÃO: em produção, esta fila fica com uma equipe de revisão. Aqui você pode testar o fluxo.'));
    var fila = radar.fila();
    var revisar = campanhas.filter(function (c) { return c.precisa_revisao && c.estado !== 'arquivada'; });
    if (!fila.length && !revisar.length) m.appendChild(el('p', null, 'Fila vazia. Relate algo pelo Scanner para ver como funciona.'));

    fila.forEach(function (f) {
      var d = el('div', 'item-fila');
      if (f.tipo === 'relato') {
        d.appendChild(el('p', 'motivo-nome', 'Relato novo · ' + dataHora(f.quando) + (f.relato.uf ? ' · ' + f.relato.uf : '')));
        d.appendChild(el('p', 'previa-texto', f.relato.texto));
        d.appendChild(el('p', 'motivo-desc', 'Indicadores: ' + (f.relato.indicadores.map(function (i) { return i.tipo === 'dominio' ? i.valor : i.rotulo; }).join(' · ') || 'só texto')));
        if (f.sugestao) d.appendChild(el('p', 'motivo-desc', 'Sugestão: parece a campanha "' + f.sugestao.titulo + '" — ' + f.sugestao.porque + '.'));
        var a = el('div', 'links-acao');
        if (f.sugestao) a.appendChild(botao('Juntar à campanha sugerida', 'btn-leve', function () {
          radar.moderar(f.id, 'vincular'); recarregar('Relato juntado à campanha "' + f.sugestao.titulo + '".');
        }));
        a.appendChild(botao('Criar campanha nova + rascunho de teste', 'btn-leve', function (ev) {
          ev.target.disabled = true;
          formInline(d, {
            id: 'campanha-' + f.id,
            rotulo: 'Nome da campanha (descreva o padrão do golpe, nunca uma pessoa)',
            valorInicial: 'Nova campanha reportada',
            textoOk: 'Criar campanha',
            aoCancelar: function () { ev.target.disabled = false; },
            aoConfirmar: function (titulo) {
              radar.moderar(f.id, 'nova', { titulo: titulo, criarRascunho: true });
              recarregar('Campanha criada (em observação) e rascunho de teste gerado — o teste só entra no jogo depois de revisado.');
            }
          });
        }));
        a.appendChild(botao('Rejeitar', 'btn-leve', function () { radar.moderar(f.id, 'rejeitar'); recarregar('Relato rejeitado.'); }));
        d.appendChild(a);
      } else {
        var c = campanhas.filter(function (x) { return x.id === f.campanha_id; })[0];
        d.appendChild(el('p', 'motivo-nome', 'Contestação · ' + (c ? c.titulo : f.campanha_id)));
        d.appendChild(el('p', 'previa-texto', f.motivo || '(sem motivo informado)'));
        var a2 = el('div', 'links-acao');
        a2.appendChild(botao('Aceitar (arquivar alerta)', 'btn-leve', function () { radar.moderar(f.id, 'aceitar'); recarregar('Contestação aceita: campanha arquivada.'); }));
        a2.appendChild(botao('Manter alerta', 'btn-leve', function () { radar.moderar(f.id, 'manter'); recarregar('Contestação analisada: alerta mantido.'); }));
        d.appendChild(a2);
      }
      m.appendChild(d);
    });

    revisar.forEach(function (c) {
      var d = el('div', 'item-fila');
      d.appendChild(el('p', 'motivo-nome', 'Aguardando revisão humana · ' + c.titulo));
      d.appendChild(el('p', 'motivo-desc', 'Os indicadores são de pessoa (telefone/chave Pix). Antes de ligar o alerta, alguém precisa verificar se não é uma vítima ou uma conta de terceiro.'));
      var a = el('div', 'links-acao');
      a.appendChild(botao('Revisei: liberar alerta', 'btn-leve', function () { radar.marcarRevisada(c.id); recarregar('Campanha revisada.'); }));
      d.appendChild(a);
      m.appendChild(d);
    });

    var rasc = radar.rascunhos();
    if (rasc.length) {
      m.appendChild(el('h3', null, 'Rascunhos de teste (do Radar para o jogo)'));
      rasc.forEach(function (r) {
        var d = el('div', 'item-fila');
        d.appendChild(el('p', 'motivo-nome', r.status));
        d.appendChild(el('p', 'previa-texto', r.mensagem));
        d.appendChild(el('p', 'motivo-desc', 'Gabarito: ' + r.gabarito));
        m.appendChild(d);
      });
    }
    return m;
  }

  window.AnzolRadarUI = {
    iniciar: function (o) { radar = o.radar; conteudo = o.conteudo; raiz = document.getElementById('radar-raiz'); },
    mostrar: function () { if (radar) { aviso = null; render(); } }
  };
})();
