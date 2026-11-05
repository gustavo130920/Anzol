/*
 * Anzol — motor do jogo (camada fina de gamificação sobre os cenários).
 * Lógica pura: não desenha nada na tela. Funciona no navegador (window.AnzolJogo) e no Node (testes).
 * Pilares: pensar devagar · evidência antes de decisão · aprender com golpe real · errar sem vergonha.
 * Sem bônus por tempo. Sem ranking. Parâmetros em app/data/jogo-config.json (iniciais, sem validação).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolJogo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- utilidades ----------
  function hashTexto(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function aleatorio(semente) { // mulberry32: sequência pseudoaleatória repetível
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function embaralhar(lista, chave) {
    var r = aleatorio(hashTexto(String(chave))), a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }
  function dataLocal(d) { return d.getFullYear() + '-' + doisDigitos(d.getMonth() + 1) + '-' + doisDigitos(d.getDate()); }
  function diasEntre(a, b) {
    var pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  function armazenamentoMemoria() {
    var guardado = null;
    return { ler: function () { return guardado; }, gravar: function (v) { guardado = copia(v); } };
  }

  // ---------- fábrica ----------
  function criarJogo(o) {
    var cfg = o.config;
    var conteudo = o.conteudo;
    var armazenamento = o.armazenamento || armazenamentoMemoria();
    var agora = o.agora || function () { return new Date(); };
    var sinais = {};
    o.sinais.sinais.forEach(function (s) { sinais[s.id] = s; });

    // Todos os itens num formato só
    var itens = [];
    conteudo.cenarios.forEach(function (c) { itens.push({ id: c.id, tipo: 'mensagem', familia: c.familia, legitima: c.legitima, nivel: c.nivel, dados: c }); });
    conteudo.testes_dominio.forEach(function (t) { itens.push({ id: t.id, tipo: 'dominio', familia: 'dominio', legitima: false, nivel: t.nivel, dados: t }); });
    conteudo.testes_procedimento.forEach(function (t) { itens.push({ id: t.id, tipo: 'procedimento', familia: 'procedimento', legitima: false, nivel: t.nivel, dados: t }); });
    var porId = {};
    itens.forEach(function (i) { porId[i.id] = i; });

    function novoEstado() {
      return {
        versao: 1, xp: 0, feitos: {}, errosPista: {},
        sequencia: { atual: 0, melhor: 0, ultimoDia: null, perdaoEm: null },
        testeDoDia: { data: null, id: null, feito: false, motivo: null },
        avaliacoes: { inicial: null, reteste: null },
        selos: {}
      };
    }
    var estado;
    try { estado = armazenamento.ler(); } catch (e) { estado = null; }
    if (!estado || estado.versao !== 1) estado = novoEstado();
    function salvar() { try { armazenamento.gravar(estado); } catch (e) { /* sem armazenamento: segue em memória */ } }
    function hoje() { return dataLocal(agora()); }

    // ---------- níveis ----------
    function nivel(xp) {
      if (xp == null) xp = estado.xp;
      var n = cfg.niveis, i = 0;
      while (i + 1 < n.length && xp >= n[i + 1].xp_minimo) i++;
      var prox = n[i + 1] || null;
      return {
        indice: i, nome: n[i].nome, frase: n[i].frase, xp: xp,
        proximo: prox ? prox.nome : null,
        faltam: prox ? prox.xp_minimo - xp : 0,
        progresso: prox ? (xp - n[i].xp_minimo) / (prox.xp_minimo - n[i].xp_minimo) : 1
      };
    }

    // ---------- conjunto de prática ----------
    function idsReteste() { return cfg.avaliacao.reteste; }
    function itensPratica() {
      var bloqueados = estado.avaliacoes.reteste ? [] : idsReteste();
      return itens.filter(function (i) { return bloqueados.indexOf(i.id) === -1; });
    }
    function praticados() { return Object.keys(estado.feitos).length; }

    // ---------- rodada (o que mostrar ao jogador) ----------
    function montarRodada(id) {
      var item = porId[id];
      if (!item) throw new Error('Item desconhecido: ' + id);
      var r = { item: item, temLupa: false };
      if (item.tipo === 'mensagem') {
        var c = item.dados;
        var certas = c.pistas.map(function (p) { return p.id; });
        r.temLupa = !!c.link_exibido;
        var familiasDistrator = ['psicologica', 'pedido', 'canal'].concat(r.temLupa ? ['tecnica'] : []);
        // Nunca usar como "pista falsa" algo que esteja de fato na mensagem ou seja parecido com uma pista certa
        var proibidas = {};
        certas.forEach(function (p) { proibidas[p] = true; });
        ((cfg.sinais_parecidos && cfg.sinais_parecidos.grupos) || []).forEach(function (g) {
          if (g.some(function (p) { return certas.indexOf(p) !== -1; })) g.forEach(function (p) { proibidas[p] = true; });
        });
        if (o.detectar) o.detectar(item).forEach(function (p) { proibidas[p] = true; });
        var distratores = embaralhar(o.sinais.sinais.filter(function (s) {
          return s.peso_inicial > 0 && familiasDistrator.indexOf(s.familia) !== -1 && !proibidas[s.id] &&
                 s.detectavel_por.indexOf('externo') === -1 && s.detectavel_por.indexOf('imagem') === -1;
        }), 'distr-' + id).slice(0, 3).map(function (s) { return s.id; });
        r.candidatos = embaralhar(certas.concat(distratores), 'cand-' + id).map(function (sid) {
          return { id: sid, nome: sinais[sid].nome, familia: sinais[sid].familia };
        });
        if (!item.legitima) {
          var errados = cfg.passos_errados.filter(function (p) { return r.temLupa || !p.precisa_link; });
          errados = embaralhar(errados, 'passo-' + id).slice(0, 2).map(function (p) { return { texto: p.texto, correto: false, explicacao: p.explicacao }; });
          r.opcoesPasso = embaralhar([{ texto: conteudo.decisoes[c.decisao_correta], correto: true, explicacao: c.feedback }].concat(errados), 'ordem-' + id);
        }
      }
      return r;
    }

    // ---------- correção ----------
    function corrigirMensagem(rodada, resp) {
      var item = rodada.item, c = item.dados, x = cfg.xp;
      var certas = c.pistas.map(function (p) { return p.id; });
      var marcadas = resp.pistasMarcadas || [];
      var acertos = marcadas.filter(function (p) { return certas.indexOf(p) !== -1; });
      var falsas = marcadas.filter(function (p) { return certas.indexOf(p) === -1; });
      var perdidas = certas.filter(function (p) { return marcadas.indexOf(p) === -1; });
      var classificacaoOk = (resp.classificacao === 'golpe') === !item.legitima;
      var passoEscolhido = (rodada.opcoesPasso && resp.passo != null) ? rodada.opcoesPasso[resp.passo] : null;
      var passoOk = !item.legitima && resp.classificacao === 'golpe' && !!(passoEscolhido && passoEscolhido.correto);
      var partes = {
        classificacao: classificacaoOk ? x.classificacao_correta : 0,
        passo: passoOk ? x.passo_correto : 0,
        pistas: Math.max(0, acertos.length * x.pista_correta + falsas.length * x.pista_falsa),
        lupa: resp.usouLupa && rodada.temLupa ? x.lupa_antes_de_decidir : 0
      };
      var total = partes.classificacao + partes.passo + partes.pistas + partes.lupa;
      return {
        tipo: 'mensagem',
        acertou: classificacaoOk && (item.legitima || passoOk),
        classificacaoOk: classificacaoOk,
        passoOk: passoOk,
        passoEscolhido: passoEscolhido,
        erro: classificacaoOk ? null : (item.legitima ? 'falso_alarme' : 'interagiria'),
        acertos: acertos, falsas: falsas, perdidas: perdidas,
        xp: { partes: partes, total: total }
      };
    }
    function corrigirDominio(rodada, resp) {
      var t = rodada.item.dados, op = t.opcoes[resp.opcao];
      var ok = !!(op && op.correto);
      var partes = { dominio: ok ? cfg.xp.dominio_correto : 0, lupa: resp.usouLupa ? cfg.xp.lupa_antes_de_decidir : 0 };
      return { tipo: 'dominio', acertou: ok, escolhida: op, perdidas: [], xp: { partes: partes, total: partes.dominio + partes.lupa } };
    }
    function corrigirProcedimento(rodada, resp) {
      var t = rodada.item.dados, op = t.opcoes[resp.opcao];
      var ok = !!(op && op.correto);
      return { tipo: 'procedimento', acertou: ok, escolhida: op, perdidas: [], xp: { partes: { procedimento: ok ? cfg.xp.procedimento_correto : 0 }, total: ok ? cfg.xp.procedimento_correto : 0 } };
    }
    function corrigir(rodada, resp) {
      var t = rodada.item.tipo;
      return t === 'mensagem' ? corrigirMensagem(rodada, resp) : t === 'dominio' ? corrigirDominio(rodada, resp) : corrigirProcedimento(rodada, resp);
    }

    // ---------- sequência diária com perdão ----------
    function atualizarSequencia(dia) {
      var s = estado.sequencia;
      s.usouPerdaoHoje = false;
      if (s.ultimoDia === dia) return;
      if (!s.ultimoDia) s.atual = 1;
      else {
        var d = diasEntre(s.ultimoDia, dia);
        if (d === 1) s.atual++;
        else if (d === 2 && (!s.perdaoEm || diasEntre(s.perdaoEm, dia) >= cfg.sequencia.perdao_a_cada_dias)) {
          s.atual++; s.perdaoEm = dia; s.usouPerdaoHoje = true;
        } else s.atual = 1;
      }
      s.ultimoDia = dia;
      s.melhor = Math.max(s.melhor, s.atual);
    }
    function sequencia() {
      var s = copia(estado.sequencia), dia = hoje();
      // Se já passou do prazo (mais de 2 dias, ou 2 dias sem perdão disponível), a sequência exibida é 0
      if (s.ultimoDia) {
        var d = diasEntre(s.ultimoDia, dia);
        var perdaoDisponivel = !s.perdaoEm || diasEntre(s.perdaoEm, dia) >= cfg.sequencia.perdao_a_cada_dias;
        if (d > 2 || (d === 2 && !perdaoDisponivel)) s.atual = 0;
        s.jogouHoje = d === 0;
      }
      return s;
    }

    // ---------- selos ----------
    function acertouAlgumaVez(id) { return !!(estado.feitos[id] && estado.feitos[id].acertouAlgumaVez); }
    function avaliarSelos() {
      var novos = [];
      cfg.selos.forEach(function (s) {
        if (estado.selos[s.id]) return;
        var ganhou = false;
        if (s.regra === 'acertar_familias') {
          ganhou = s.familias.every(function (f) {
            return itens.some(function (i) { return i.familia === f && acertouAlgumaVez(i.id); });
          });
        } else if (s.regra === 'acertar_legitimas') {
          ganhou = itens.filter(function (i) { return i.tipo === 'mensagem' && i.legitima && acertouAlgumaVez(i.id); }).length >= s.quantidade;
        } else if (s.regra === 'acertar_tipo') {
          ganhou = itens.filter(function (i) { return i.tipo === s.tipo && acertouAlgumaVez(i.id); }).length >= s.quantidade;
        }
        if (ganhou) { estado.selos[s.id] = hoje(); novos.push(s); }
      });
      return novos;
    }
    function selos() {
      return cfg.selos.map(function (s) { return { id: s.id, nome: s.nome, descricao: s.descricao, ganhoEm: estado.selos[s.id] || null }; });
    }

    // ---------- registrar uma rodada de prática ----------
    function registrar(rodada, correcao) {
      var id = rodada.item.id, dia = hoje();
      atualizarSequencia(dia);
      var antes = nivel();
      var primeira = !estado.feitos[id];
      var ganho = primeira ? correcao.xp.total : 0;
      var bonusDia = 0;
      var td = estado.testeDoDia;
      if (td.data === dia && td.id === id && !td.feito) { td.feito = true; bonusDia = cfg.xp.teste_do_dia_bonus; }
      estado.xp += ganho + bonusDia;
      var f = estado.feitos[id] || (estado.feitos[id] = { primeira: { acertou: correcao.acertou, xp: ganho, data: dia }, tentativas: 0, acertouAlgumaVez: false });
      f.tentativas++;
      f.ultimoAcerto = correcao.acertou;
      f.acertouAlgumaVez = f.acertouAlgumaVez || correcao.acertou;
      (correcao.perdidas || []).forEach(function (p) { estado.errosPista[p] = (estado.errosPista[p] || 0) + 1; });
      var selosNovos = avaliarSelos();
      var depois = nivel();
      salvar();
      return {
        primeiraVez: primeira, xpGanho: ganho, bonusDia: bonusDia, nivelAntes: antes, nivelDepois: depois,
        subiuNivel: depois.indice > antes.indice, selosNovos: selosNovos, sequencia: sequencia(),
        usouPerdao: !!estado.sequencia.usouPerdaoHoje
      };
    }

    // ---------- teste do dia ----------
    function pistaMaisErrada() {
      var melhor = null;
      Object.keys(estado.errosPista).forEach(function (p) { if (!melhor || estado.errosPista[p] > estado.errosPista[melhor]) melhor = p; });
      return melhor;
    }
    function testeDoDia() {
      var dia = hoje(), td = estado.testeDoDia;
      if (td.data === dia && porId[td.id]) return copia(td);
      var pool = itensPratica();
      var alvo = pistaMaisErrada(), motivo, candidatos = [];
      if (alvo) {
        candidatos = pool.filter(function (i) {
          return i.tipo === 'mensagem' && !acertouAlgumaVez(i.id) && i.dados.pistas.some(function (p) { return p.id === alvo; });
        });
        if (candidatos.length) motivo = 'Treina a pista "' + sinais[alvo].nome + '", a que você mais deixou passar. (Escolha feita por regra simples.)';
      }
      if (!candidatos.length) {
        candidatos = pool.filter(function (i) { return !estado.feitos[i.id]; });
        motivo = 'Um item que você ainda não fez.';
      }
      if (!candidatos.length) { candidatos = pool; motivo = 'Revisão sorteada para hoje.'; }
      var escolhido = candidatos[hashTexto(dia) % candidatos.length];
      estado.testeDoDia = { data: dia, id: escolhido.id, feito: false, motivo: motivo };
      salvar();
      return copia(estado.testeDoDia);
    }

    // ---------- teste inicial e reteste ----------
    function itensAvaliacao(tipo) {
      return cfg.avaliacao[tipo].map(function (id) { return porId[id]; });
    }
    function podeFazerReteste() {
      return !!estado.avaliacoes.inicial && !estado.avaliacoes.reteste && praticados() >= cfg.avaliacao.reteste_libera_apos_itens_praticados;
    }
    function registrarAvaliacao(tipo, respostas) {
      var golpes = 0, interacoes = 0, legitimas = 0, falsos = 0;
      respostas.forEach(function (r) {
        var item = porId[r.id];
        if (item.legitima) { legitimas++; if (r.classificacao === 'golpe') falsos++; }
        else { golpes++; if (r.classificacao !== 'golpe') interacoes++; }
      });
      var resultado = {
        data: hoje(), respostas: respostas, golpes: golpes, interacoes: interacoes, legitimas: legitimas, falsos_alarmes: falsos,
        taxa_interacao: golpes ? interacoes / golpes : 0,
        taxa_falso_alarme: legitimas ? falsos / legitimas : 0
      };
      estado.avaliacoes[tipo] = resultado;
      salvar();
      return copia(resultado);
    }
    function comparacao() {
      var a = estado.avaliacoes;
      if (!a.inicial || !a.reteste) return null;
      return {
        antes: { taxa_interacao: a.inicial.taxa_interacao, taxa_falso_alarme: a.inicial.taxa_falso_alarme },
        depois: { taxa_interacao: a.reteste.taxa_interacao, taxa_falso_alarme: a.reteste.taxa_falso_alarme }
      };
    }

    function resumo() {
      return {
        xp: estado.xp, nivel: nivel(), sequencia: sequencia(), selos: selos(),
        praticados: praticados(), totalPratica: itensPratica().length,
        feitos: copia(estado.feitos), avaliacoes: copia(estado.avaliacoes),
        podeFazerReteste: podeFazerReteste(), comparacao: comparacao(),
        bloqueadosAteReteste: estado.avaliacoes.reteste ? [] : idsReteste().slice()
      };
    }
    function reiniciar() { estado = novoEstado(); salvar(); }

    return {
      itens: itens, porId: porId, nivel: nivel, itensPratica: itensPratica, montarRodada: montarRodada,
      corrigir: corrigir, registrar: registrar, testeDoDia: testeDoDia, itensAvaliacao: itensAvaliacao,
      podeFazerReteste: podeFazerReteste, registrarAvaliacao: registrarAvaliacao, comparacao: comparacao,
      resumo: resumo, reiniciar: reiniciar
    };
  }

  return { criarJogo: criarJogo, _util: { diasEntre: diasEntre, embaralhar: embaralhar, dataLocal: dataLocal } };
});
