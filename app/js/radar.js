/*
 * Anzol — Radar: banco de INDICADORES de golpes reportados, agrupados em campanhas.
 * Princípio: indicadores, nunca acusações. Alerta passivo (aparece quando a pessoa usa o Scanner).
 *
 * O que é REGRA: estados, limiares, independência, revisão humana, validade, comparação exata.
 * O que é IA leve: agrupar variantes por similaridade de texto (trigramas + TF-IDF + cosseno)
 *                  e por semelhança de domínio.
 * SIMULAÇÃO: neste protótipo o banco fica no navegador (semente + relatos locais).
 * Funciona no navegador (window.AnzolRadar) e no Node (testes).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolRadar = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HORA = 3600 * 1000, DIA = 24 * HORA;

  // ---------- utilidades ----------
  function cripto() {
    if (typeof crypto !== 'undefined' && crypto.subtle) return crypto;
    if (typeof require === 'function') return require('crypto').webcrypto;
    throw new Error('Sem suporte a criptografia neste ambiente');
  }
  function hmac(segredo, texto) {
    var c = cripto(), enc = new TextEncoder();
    return c.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (k) { return c.subtle.sign('HMAC', k, enc.encode(texto)); })
      .then(function (b) {
        return Array.prototype.slice.call(new Uint8Array(b), 0, 16).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
  }
  function normalizar(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function distancia(a, b) {
    var m = a.length, n = b.length, ant = [], at, i, j;
    for (j = 0; j <= n; j++) ant[j] = j;
    for (i = 1; i <= m; i++) {
      at = [i];
      for (j = 1; j <= n; j++) at[j] = Math.min(ant[j] + 1, at[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      ant = at;
    }
    return ant[n];
  }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- IA leve: TF-IDF de trigramas + cosseno ----------
  function trigramas(texto) {
    var t = ' ' + normalizar(texto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    var c = {};
    for (var i = 0; i + 3 <= t.length; i++) { var g = t.substr(i, 3); c[g] = (c[g] || 0) + 1; }
    return c;
  }
  function criarIndiceTexto(documentos) {
    // documentos: [{ chave, texto }]
    var df = {}, vetores = [];
    documentos.forEach(function (d) {
      var tf = trigramas(d.texto);
      Object.keys(tf).forEach(function (g) { df[g] = (df[g] || 0) + 1; });
      vetores.push({ chave: d.chave, tf: tf });
    });
    var N = documentos.length;
    function idf(g) { return Math.log((N + 1) / ((df[g] || 0) + 1)) + 1; }
    function pesar(tf) {
      var v = {}, norma = 0;
      Object.keys(tf).forEach(function (g) { v[g] = tf[g] * idf(g); norma += v[g] * v[g]; });
      return { v: v, norma: Math.sqrt(norma) || 1 };
    }
    vetores.forEach(function (d) { d.p = pesar(d.tf); });
    return {
      parecidos: function (texto) {
        var q = pesar(trigramas(texto));
        return vetores.map(function (d) {
          var s = 0;
          Object.keys(q.v).forEach(function (g) { if (d.p.v[g]) s += q.v[g] * d.p.v[g]; });
          return { chave: d.chave, similaridade: s / (q.norma * d.p.norma) };
        }).sort(function (a, b) { return b.similaridade - a.similaridade; });
      }
    };
  }

  // ---------- extração de indicadores de um texto ----------
  var RE_TELEFONE = /(?:\+?55[\s-]?)?\(?\b(\d{2})\)?[\s-]?(9?\d{4})[\s-]?(\d{4})\b/g;
  var RE_EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
  var RE_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

  function extrairContatos(texto) {
    var tels = [], m;
    RE_TELEFONE.lastIndex = 0;
    while ((m = RE_TELEFONE.exec(texto)) !== null) tels.push(m[1] + m[2] + m[3]);
    var emails = (String(texto).match(RE_EMAIL) || []).map(function (e) { return e.toLowerCase(); });
    return { telefones: tels, emails: emails };
  }

  // Remove dados pessoais antes de guardar um relato (o indicador do golpista é extraído antes)
  function sanitizar(texto) {
    return String(texto || '').slice(0, 1000)
      .replace(RE_EMAIL, '[e-mail removido]')
      .replace(RE_CPF, '[CPF removido]')
      .replace(RE_TELEFONE, '[telefone removido]')
      .replace(/\b([Ss]r|[Ss]ra|[Ss]rta|[Dd]r|[Dd]ra|[Dd]ona|[Ss]eu)\.?\s+[A-ZÀ-Ú][a-zà-ú]+(\s+[A-ZÀ-Ú][a-zà-ú]+)*/g, '$1 [nome removido]')
      .replace(/\b\d{6,}\b/g, '[número removido]');
  }

  // ---------- fábrica ----------
  function criarRadar(o) {
    var cfg = o.config, regras = cfg.regras;
    var agora = o.agora || function () { return new Date(); };
    var armazenamento = o.armazenamento || (function () { var v = null; return { ler: function () { return v; }, gravar: function (x) { v = copia(x); } }; })();
    var segredo = cfg.hash.segredo_demo;
    var carregadoEm = agora().getTime();

    // Estado local (o que o usuário fez neste aparelho)
    var local;
    try { local = armazenamento.ler(); } catch (e) { local = null; }
    if (!local || local.versao !== 1) local = { versao: 1, usuario: 'eu-' + Math.random().toString(36).slice(2, 10), relatos: [], campanhasNovas: [], fila: [], moderacao: {}, rascunhos: [] };
    function salvar() { try { armazenamento.gravar(local); } catch (e) { /* segue em memória */ } }

    // Campanhas da semente, com relatos convertidos para datas reais
    var semente = o.semente.campanhas.map(function (c) {
      var cc = copia(c);
      cc.origem = 'semente';
      cc.relatos = c.relatos.map(function (r, i) {
        return { id: c.id + '-s' + i, quando: carregadoEm - r[0] * HORA, uf: r[1], usuario: r[2], origem: 'semente' };
      });
      return cc;
    });

    function todasCampanhas() {
      var lista = semente.concat(local.campanhasNovas.map(copia));
      return lista.map(function (c) {
        var extras = local.relatos.filter(function (r) { return r.campanha_id === c.id; });
        var m = local.moderacao[c.id] || {};
        var cc = copia(c);
        cc.relatos = c.relatos.concat(extras);
        if (m.revisado) cc.revisado_por_moderador = true;
        if (m.contestacao_aceita) cc.contestacao_aceita = m.contestacao_aceita;
        return calcular(cc);
      });
    }

    // ---------- regras de estado ----------
    function calcular(c) {
      var t = agora().getTime();
      var rs = c.relatos.slice().sort(function (a, b) { return a.quando - b.quando; });
      var ultimo = rs.length ? rs[rs.length - 1].quando : null;
      // Primeiro momento em que houve N relatos independentes dentro de uma janela de 24 h
      var ativadaEm = null, janela = regras.janela_alerta_horas * HORA;
      for (var i = 0; i < rs.length && !ativadaEm; i++) {
        var us = {};
        for (var j = i; j < rs.length && rs[j].quando - rs[i].quando <= janela; j++) {
          us[rs[j].usuario] = true;
          if (Object.keys(us).length >= regras.relatos_independentes_para_alerta) { ativadaEm = rs[j].quando; break; }
        }
      }
      var tipos = (c.indicadores || []).map(function (ind) { return cfg.confiabilidade[ind.tipo] || { pessoa: false, pode_alertar_sozinho: true }; });
      var soPessoa = tipos.length > 0 && tipos.every(function (x) { return x.pessoa; });
      // Indicadores que nunca alertam sozinhos (ex.: número de ligação, que pode ser falsificado)
      var nenhumAlertaSozinho = tipos.length > 0 && tipos.every(function (x) { return x.pode_alertar_sozinho === false; });
      var precisaRevisao = soPessoa && !c.revisado_por_moderador && !nenhumAlertaSozinho;
      var arquivadaPorTempo = ultimo != null && (t - ultimo) > regras.dias_sem_relato_para_arquivar * DIA;

      var estado, motivo;
      if (c.contestacao_aceita) { estado = 'arquivada'; motivo = 'Contestação aceita na revisão.'; }
      else if (arquivadaPorTempo) { estado = 'arquivada'; motivo = 'Sem relatos novos há mais de ' + regras.dias_sem_relato_para_arquivar + ' dias.'; }
      else if (nenhumAlertaSozinho && !c.fonte_oficial) { estado = 'em_observacao'; motivo = 'Indicador de baixa confiabilidade: o número de uma ligação pode ser falsificado e ser o de uma instituição real. O Radar alerta sobre o padrão do golpe, nunca sobre o número.'; }
      else if ((c.fonte_oficial || ativadaEm) && !precisaRevisao) { estado = 'alerta_ativo'; motivo = c.fonte_oficial ? 'Confirmado por fonte oficial.' : 'Vários relatos independentes em pouco tempo.'; }
      else if (precisaRevisao && (c.fonte_oficial || ativadaEm)) { estado = 'em_observacao'; motivo = 'Aguardando revisão humana (indicadores de pessoa: podem ser de vítima ou de terceiro).'; }
      else { estado = 'em_observacao'; motivo = 'Há relatos, mas ainda não o bastante para um alerta.'; }

      var ult7 = rs.filter(function (r) { return t - r.quando <= 7 * DIA; }).length;
      var ant7 = rs.filter(function (r) { return t - r.quando > 7 * DIA && t - r.quando <= 14 * DIA; }).length;
      var emAlta = ult7 >= cfg.tendencia.minimo_relatos && ult7 >= cfg.tendencia.fator_alta * Math.max(1, ant7);
      var independentes = {};
      rs.forEach(function (r) { independentes[r.usuario] = true; });
      var ufs = {};
      rs.forEach(function (r) { if (r.uf) ufs[r.uf] = (ufs[r.uf] || 0) + 1; });

      c.estado = estado;
      c.motivo_estado = motivo;
      c.ativada_em = ativadaEm;
      c.ultimo_relato = ultimo;
      c.primeiro_relato = rs.length ? rs[0].quando : null;
      c.valida_ate = ultimo != null ? ultimo + regras.dias_sem_relato_para_arquivar * DIA : null;
      c.total_relatos = rs.length;
      c.pessoas = Object.keys(independentes).length;
      c.ultimos_7_dias = ult7;
      c.em_alta = emAlta;
      c.ufs = Object.keys(ufs).map(function (u) { return { uf: u, n: ufs[u] }; }).sort(function (a, b) { return b.n - a.n; });
      c.precisa_revisao = precisaRevisao;
      return c;
    }

    // ---------- índice de similaridade de texto (IA leve) ----------
    function indiceTexto(campanhas) {
      var docs = [];
      campanhas.forEach(function (c) { (c.textos_modelo || []).forEach(function (t) { docs.push({ chave: c.id, texto: t }); }); });
      return criarIndiceTexto(docs);
    }

    function palavrasDominio(d) { return d.split(/[-.]/).filter(function (p) { return p.length >= 3 && ['test', 'example', 'invalid', 'com', 'br'].indexOf(p) === -1; }); }
    function dominioParecido(a, b) {
      if (a === b) return null;
      var ra = a.split('.')[0], rb = b.split('.')[0];
      var d = distancia(ra, rb);
      if (ra.length >= 6 && d <= cfg.similaridade.distancia_dominio_maxima) return 'nome a ' + d + (d === 1 ? ' letra' : ' letras') + ' de ' + b;
      var pa = palavrasDominio(a), pb = palavrasDominio(b);
      var inter = pa.filter(function (p) { return pb.indexOf(p) !== -1; }).length;
      var uniao = pa.concat(pb.filter(function (p) { return pa.indexOf(p) === -1; })).length || 1;
      if (inter / uniao >= cfg.similaridade.limiar_dominio_palavras) return 'mesmas palavras de ' + b;
      return null;
    }

    /**
     * Compara um texto (e os endereços já extraídos pelo Scanner) com o Radar.
     * alvos: [{host, registravel}] · canal: 'ligacao' muda o tipo do telefone (baixa confiabilidade).
     * Devolve Promise de [{ campanha, como: 'exato'|'parecido', porque, similaridade }].
     */
    function consultar(texto, alvos, canal) {
      var campanhas = todasCampanhas();
      var contatos = extrairContatos(texto);
      return Promise.all(
        contatos.telefones.map(function (t) { return hmac(segredo, 'tel:' + t); })
          .concat(contatos.emails.map(function (e) { return hmac(segredo, 'pix:' + e); }))
      ).then(function (hashes) {
        var achados = {};
        function marcar(c, como, porque, sim) {
          var a = achados[c.id];
          if (!a || (a.como === 'parecido' && como === 'exato')) achados[c.id] = { campanha: c, como: como, porque: porque, similaridade: sim || 1 };
        }
        var dominios = [];
        (alvos || []).forEach(function (a) { dominios.push(a.registravel); if (a.host !== a.registravel) dominios.push(a.host); });

        campanhas.forEach(function (c) {
          (c.indicadores || []).forEach(function (ind) {
            if (ind.tipo === 'dominio') {
              dominios.forEach(function (d) {
                if (d === ind.valor) marcar(c, 'exato', 'mesmo endereço já reportado (' + ind.valor + ')');
                else { var p = dominioParecido(d, ind.valor); if (p) marcar(c, 'parecido', 'endereço parecido: ' + p); }
              });
            } else if (ind.hash && hashes.indexOf(ind.hash) !== -1) {
              if (ind.tipo === 'telefone_ligacao' || canal === 'ligacao') {
                marcar(c, 'parecido', 'o número já apareceu em relatos, mas número de ligação pode ser falsificado (confiabilidade baixa)');
              } else marcar(c, 'exato', 'mesmo ' + (ind.tipo === 'chave_pix' ? 'chave Pix' : 'telefone') + ' já reportado (protegido)');
            }
          });
        });
        if (normalizar(texto).replace(/[^a-z]/g, '').length >= 20) {
          var porCampanha = {};
          indiceTexto(campanhas).parecidos(texto).forEach(function (r) {
            if (!porCampanha[r.chave] || r.similaridade > porCampanha[r.chave]) porCampanha[r.chave] = r.similaridade;
          });
          campanhas.forEach(function (c) {
            var s = porCampanha[c.id] || 0;
            if (s >= cfg.similaridade.limiar_texto) marcar(c, 'parecido', 'texto parecido com variantes já reportadas (' + Math.round(s * 100) + '% de semelhança)', s);
          });
        }
        return Object.keys(achados).map(function (k) { return achados[k]; })
          .sort(function (a, b) { return (b.como === 'exato') - (a.como === 'exato') || b.similaridade - a.similaridade; });
      });
    }

    // ---------- relato em um toque ----------
    function relatar(dados) {
      // dados: { texto, alvos, canal, uf, consentimento, contatosDoGolpista: [telefones/e-mails confirmados pela pessoa] }
      // PRIVACIDADE: telefone e e-mail só viram indicador se a pessoa marcar que são do golpista.
      // Uma mensagem pode conter o e-mail ou o número da própria vítima — esses nunca vão ao Radar.
      if (!dados.consentimento) return Promise.reject(new Error('Marque que concorda em enviar só os indicadores do golpista.'));
      var t = agora().getTime();
      var hoje = local.relatos.filter(function (r) { return t - r.quando < DIA; }).length + local.fila.filter(function (f) { return f.tipo === 'relato' && t - f.quando < DIA; }).length;
      if (hoje >= regras.limite_relatos_por_usuario_por_dia) return Promise.reject(new Error('Limite de relatos por dia atingido. Obrigado pela ajuda!'));

      var confirmados = (dados.contatosDoGolpista || []).map(function (c) { return String(c).toLowerCase(); });
      var todosContatos = extrairContatos(dados.texto);
      var contatos = {
        telefones: todosContatos.telefones.filter(function (x) { return confirmados.indexOf(x) !== -1; }),
        emails: todosContatos.emails.filter(function (x) { return confirmados.indexOf(x) !== -1; })
      };
      var tipoTel = dados.canal === 'ligacao' ? 'telefone_ligacao' : 'telefone_mensagem';
      return Promise.all(
        contatos.telefones.map(function (x) { return hmac(segredo, 'tel:' + x).then(function (h) { return { tipo: tipoTel, hash: h, rotulo: tipoTel === 'telefone_ligacao' ? 'número exibido na ligação (protegido; pode ser falsificado)' : 'telefone (protegido)' }; }); })
          .concat(contatos.emails.map(function (x) { return hmac(segredo, 'pix:' + x).then(function (h) { return { tipo: 'chave_pix', hash: h, rotulo: 'chave Pix/e-mail (protegido)' }; }); }))
      ).then(function (indPessoa) {
        var indicadores = (dados.alvos || []).map(function (a) { return { tipo: 'dominio', valor: a.registravel }; }).concat(indPessoa);
        return consultar(dados.texto, dados.alvos, dados.canal).then(function (achados) {
          var relato = {
            id: 'R-' + t.toString(36), quando: t, uf: dados.uf || null, canal: dados.canal || null,
            usuario: local.usuario, origem: 'usuario', texto: sanitizar(dados.texto), indicadores: indicadores
          };
          var exato = achados.filter(function (a) { return a.como === 'exato' && a.campanha.estado !== 'arquivada'; })[0];
          if (exato) {
            var antes = exato.campanha.estado;
            relato.campanha_id = exato.campanha.id;
            local.relatos.push(relato);
            salvar();
            var depois = todasCampanhas().filter(function (c) { return c.id === exato.campanha.id; })[0];
            return { destino: 'campanha', campanha: depois, estadoAntes: antes, mudouEstado: antes !== depois.estado, porque: exato.porque };
          }
          var sugestao = achados[0] || null;
          local.fila.push({
            id: 'F-' + t.toString(36), tipo: 'relato', quando: t, relato: relato,
            sugestao: sugestao ? { campanha_id: sugestao.campanha.id, titulo: sugestao.campanha.titulo, porque: sugestao.porque } : null
          });
          salvar();
          return { destino: 'fila', sugestao: sugestao };
        });
      });
    }

    // ---------- moderação (SIMULAÇÃO) ----------
    function fila() { return copia(local.fila); }
    function contestar(campanhaId, motivo) {
      var t = agora().getTime();
      local.fila.push({ id: 'F-' + t.toString(36) + 'c', tipo: 'contestacao', quando: t, campanha_id: campanhaId, motivo: String(motivo || '').slice(0, 300) });
      salvar();
    }
    function moderar(filaId, acao, opcoes) {
      opcoes = opcoes || {};
      var idx = local.fila.findIndex(function (f) { return f.id === filaId; });
      if (idx === -1) throw new Error('Item da fila não encontrado');
      var item = local.fila[idx], t = agora().getTime(), resultado = { acao: acao };
      if (item.tipo === 'relato') {
        if (acao === 'vincular') {
          item.relato.campanha_id = opcoes.campanha_id || (item.sugestao && item.sugestao.campanha_id);
          local.relatos.push(item.relato);
          resultado.campanha_id = item.relato.campanha_id;
        } else if (acao === 'nova') {
          var id = 'C-U' + t.toString(36).toUpperCase();
          local.campanhasNovas.push({
            id: id, titulo: opcoes.titulo || 'Nova campanha reportada', familia: opcoes.familia || 'a-classificar', cenario_id: null,
            fonte_oficial: null, origem: 'usuario', indicadores: item.relato.indicadores, textos_modelo: [item.relato.texto], relatos: []
          });
          item.relato.campanha_id = id;
          local.relatos.push(item.relato);
          resultado.campanha_id = id;
          if (opcoes.criarRascunho) {
            local.rascunhos.push({
              id: 'RASC-' + id, campanha_id: id, criado_em: t,
              mensagem: item.relato.texto,
              gabarito: 'Golpe (gabarito vem do estado do Radar quando houver alerta ativo ou fonte oficial — nunca por votação)',
              status: 'rascunho: precisa de revisão antes de entrar no jogo'
            });
          }
        }
        // 'rejeitar' só remove da fila
      } else if (item.tipo === 'contestacao') {
        local.moderacao[item.campanha_id] = local.moderacao[item.campanha_id] || {};
        if (acao === 'aceitar') local.moderacao[item.campanha_id].contestacao_aceita = { quando: t, motivo: item.motivo };
      }
      if (acao === 'revisar' && opcoes.campanha_id) {
        local.moderacao[opcoes.campanha_id] = local.moderacao[opcoes.campanha_id] || {};
        local.moderacao[opcoes.campanha_id].revisado = true;
      }
      local.fila.splice(idx, 1);
      salvar();
      return resultado;
    }
    function marcarRevisada(campanhaId) {
      local.moderacao[campanhaId] = local.moderacao[campanhaId] || {};
      local.moderacao[campanhaId].revisado = true;
      salvar();
    }
    function rascunhos() { return copia(local.rascunhos); }

    // ---------- números para o painel ----------
    function estatisticas() {
      var cs = todasCampanhas();
      var porEstado = { em_observacao: 0, alerta_ativo: 0, arquivada: 0 };
      var porUf = {}, porFamilia = {}, tempos = [];
      cs.forEach(function (c) {
        porEstado[c.estado]++;
        c.ufs.forEach(function (u) { porUf[u.uf] = (porUf[u.uf] || 0) + u.n; });
        porFamilia[c.familia] = (porFamilia[c.familia] || 0) + c.total_relatos;
        if (c.ativada_em && c.primeiro_relato) tempos.push((c.ativada_em - c.primeiro_relato) / HORA);
      });
      var meusRelatos = local.relatos.length + local.fila.filter(function (f) { return f.tipo === 'relato'; }).length;
      var batiam = local.relatos.filter(function (r) { return r.campanha_id && !/^C-U/.test(r.campanha_id); }).length;
      return {
        campanhas: cs.length, por_estado: porEstado, por_uf: porUf, por_familia: porFamilia,
        horas_ate_alerta_media: tempos.length ? tempos.reduce(function (a, b) { return a + b; }, 0) / tempos.length : null,
        relatos_do_usuario: meusRelatos, relatos_que_batiam_com_campanha: batiam,
        contestacoes_aceitas: Object.keys(local.moderacao).filter(function (k) { return local.moderacao[k].contestacao_aceita; }).length
      };
    }

    function reiniciar() {
      local = { versao: 1, usuario: local.usuario, relatos: [], campanhasNovas: [], fila: [], moderacao: {}, rascunhos: [] };
      salvar();
    }

    return {
      campanhas: todasCampanhas, consultar: consultar, relatar: relatar, fila: fila, contestar: contestar,
      moderar: moderar, marcarRevisada: marcarRevisada, rascunhos: rascunhos, estatisticas: estatisticas, reiniciar: reiniciar,
      config: cfg
    };
  }

  return { criarRadar: criarRadar, _util: {
    // Mesmo formato usado internamente (só dígitos para telefone; e-mail em minúsculas)
    contatosNormalizados: function (texto) { return extrairContatos(texto); }, sanitizar: sanitizar, extrairContatos: extrairContatos, criarIndiceTexto: criarIndiceTexto, hmac: hmac } };
});
