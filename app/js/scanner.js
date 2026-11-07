/*
 * Anzol — Scanner (motor de regras).
 * Lê um texto (mensagem e/ou endereço) e devolve um NÍVEL DE RISCO com MOTIVOS.
 * Nunca dá veredito ("é golpe") e NUNCA abre links: só analisa o texto.
 *
 * Isto é REGRA (não é IA): cada motivo vem de uma regra explicável,
 * ligada a uma pista de app/data/signals.json e configurada em app/data/scanner-config.json.
 *
 * Funciona no navegador (window.AnzolScanner) e no Node.js (require).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolScanner = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- utilidades ----------

  // Minúsculas e sem acento, mantendo 1 caractere por caractere (para recortar o trecho original depois).
  function normalizar(texto) {
    var saida = '';
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      saida += c.length === 1 ? c : texto[i].toLowerCase().charAt(0) || ' ';
    }
    return saida;
  }

  // Distância de edição (quantas letras trocar/inserir/apagar para virar a outra palavra).
  function distancia(a, b) {
    var m = a.length, n = b.length, ant = [], atual, i, j;
    for (j = 0; j <= n; j++) ant[j] = j;
    for (i = 1; i <= m; i++) {
      atual = [i];
      for (j = 1; j <= n; j++) {
        atual[j] = Math.min(ant[j] + 1, atual[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      ant = atual;
    }
    return ant[n];
  }

  function ehIPv4(host) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
    return host.split('.').every(function (p) { return Number(p) <= 255; });
  }

  // ---------- endereços ----------

  // Acha endereços no texto: com ou sem http(s)://, com @ e com IP.
  var RE_ENDERECO = /(?:https?:\/\/)?(?:[^\s@\/]+@)?(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]|\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:\/[^\s]*)?/gi;

  function extrairEnderecos(texto) {
    var achados = [], m;
    RE_ENDERECO.lastIndex = 0;
    while ((m = RE_ENDERECO.exec(texto)) !== null) {
      var bruto = m[0].replace(/[.,;:!?)"'\]]+$/, '');
      var antes = m.index > 0 ? texto[m.index - 1] : ' ';
      if (/[a-z0-9_]/i.test(antes)) continue; // pedaço de outra palavra
      if (/^\d+(\.\d+)*$/.test(bruto) && !ehIPv4(bruto)) continue; // número comum, não endereço
      achados.push({ bruto: bruto, inicio: m.index, fim: m.index + bruto.length });
    }
    return achados;
  }

  // Finais que indicam que um texto é um domínio (usado para separar e-mail de truque com "@")
  var FINAIS_DE_DOMINIO = ['com', 'br', 'net', 'org', 'gov', 'edu', 'io', 'app', 'info', 'site', 'online', 'top', 'xyz', 'example', 'test', 'invalid'];

  // O endereço pertence à referência oficial? Vale o próprio domínio e os subdomínios dele
  // (ex.: detran.sp.gov.br pertence a gov.br; bb.com.br.golpe.test NÃO pertence a bb.com.br).
  function ehOficial(e, r) {
    return e.registravel === r.dominio || e.host === r.dominio || e.host.slice(-(r.dominio.length + 1)) === '.' + r.dominio;
  }

  function dominioRegistravel(labels, sufixos) {
    if (labels.length >= 3 && sufixos.indexOf(labels.slice(-2).join('.')) !== -1) return labels.slice(-3).join('.');
    return labels.slice(-2).join('.');
  }

  function decomporEndereco(bruto, cfgDominio) {
    var temEsquema = /^https?:\/\//i.test(bruto);
    var resto = bruto.replace(/^https?:\/\//i, '');
    var autoridade = resto.split(/[\/?#]/)[0];
    var temCaminho = resto.length > autoridade.length;
    var arroba = false, ehEmail = false, host = autoridade;
    if (autoridade.indexOf('@') !== -1) {
      var antesArroba = autoridade.slice(0, autoridade.lastIndexOf('@'));
      host = autoridade.slice(autoridade.lastIndexOf('@') + 1);
      // "nome@site.com" ou "nome.sobrenome@site.com" solto no texto é e-mail, não truque de endereço.
      // É truque quando o que vem antes do @ parece um DOMÍNIO (ex.: "banco.example@golpe.test") ou há caminho/esquema.
      var finalAntes = antesArroba.split('.').pop().toLowerCase();
      var pareceDominio = antesArroba.indexOf('.') !== -1 && FINAIS_DE_DOMINIO.indexOf(finalAntes) !== -1;
      ehEmail = !temEsquema && !temCaminho && !pareceDominio && antesArroba.indexOf(':') === -1;
      arroba = !ehEmail;
    }
    host = host.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
    var ip = ehIPv4(host);
    var labels = host.split('.');
    var registravel = ip ? host : dominioRegistravel(labels, cfgDominio.sufixos_publicos);
    var sub = ip ? '' : host.slice(0, Math.max(0, host.length - registravel.length - 1));
    return {
      original: bruto,
      https: /^https:\/\//i.test(bruto),
      host: host,
      ip: ip,
      email: ehEmail,
      arroba: arroba,
      registravel: registravel,
      subdominio: sub,
      tld: labels[labels.length - 1],
      rotulo: ip ? host : registravel.split('.')[0]
    };
  }

  function variantesHomoglifo(rotulo, pares) {
    var vars = {};
    pares.forEach(function (p) {
      if (rotulo.indexOf(p[0]) !== -1) vars[rotulo.split(p[0]).join(p[1])] = p;
    });
    var tudo = rotulo;
    pares.forEach(function (p) { tudo = tudo.split(p[0]).join(p[1]); });
    if (tudo !== rotulo) vars[tudo] = ['várias', 'trocas'];
    return vars;
  }

  // ---------- fábrica ----------

  function criarScanner(dados) {
    var sinais = {};
    dados.sinais.sinais.forEach(function (s) { sinais[s.id] = s; });
    var familiaPergunta = {};
    dados.sinais.familias.forEach(function (f) { familiaPergunta[f.id] = f.pergunta; });
    var cfg = dados.config;

    var padroes = {};
    Object.keys(cfg.texto.padroes).forEach(function (id) {
      if (!sinais[id]) throw new Error('scanner-config: sinal desconhecido "' + id + '"');
      padroes[id] = cfg.texto.padroes[id].map(function (p) { return new RegExp(p, 'm'); });
    });
    var reOrgaos = cfg.texto.orgaos_publicos_e_bancos.map(function (p) { return new RegExp(p); });
    var refs = cfg.referencias.lista.map(function (r) {
      var labels = r.dominio.split('.');
      var reg = dominioRegistravel(labels, cfg.dominio.sufixos_publicos);
      return { nome: r.nome, dominio: reg, rotulo: reg.split('.')[0], tld: labels[labels.length - 1], apelidos: r.apelidos, ficticio: r.ficticio };
    });

    function analisarEndereco(e, anotar) {
      var d = cfg.dominio;
      e.referencia_oficial = null;
      if (e.email) return e;

      if (e.ip) anotar('ip-no-dominio', e.original, 'O endereço usa números (' + e.host + ') no lugar de um nome.');
      if (e.arroba) anotar('arroba-na-url', e.original, 'Tudo antes do @ é ignorado: o destino real é ' + e.host + '.');
      if (e.host.split('.').some(function (l) { return l.indexOf('xn--') === 0; })) {
        anotar('punycode', e.host, 'Contém "xn--": pode usar letras de outro alfabeto que imitam letras comuns.');
      }
      if (d.encurtadores.indexOf(e.registravel) !== -1 || d.encurtadores.indexOf(e.host) !== -1) {
        anotar('encurtador', e.host, 'Link encurtado: esconde o destino real.');
      }
      if (e.ip) return e;

      refs.forEach(function (r) {
        if (ehOficial(e, r)) { e.referencia_oficial = r.nome; return; }
        var subLabels = e.subdominio ? e.subdominio.split('.') : [];
        var subComReferencia = ('.' + e.subdominio + '.').indexOf('.' + r.dominio + '.') !== -1;
        if (subComReferencia || subLabels.indexOf(r.rotulo) !== -1) {
          anotar('subdominio-enganoso', e.host, 'O nome "' + r.dominio + '" aparece só no começo; o dono real do endereço é ' + e.registravel + '.');
          return;
        }
        if (e.rotulo === r.rotulo) {
          anotar('tld-incomum', e.registravel, 'Mesmo nome de ' + r.nome + ', mas com final diferente do oficial (' + r.dominio + ').');
          return;
        }
        var vars = variantesHomoglifo(e.rotulo, d.homoglifos.pares);
        if (vars[r.rotulo]) {
          anotar('homoglifo', e.registravel, 'Parece "' + r.dominio + '", mas troca letras parecidas (' + vars[r.rotulo].join(' → ') + ').');
          return;
        }
        if (r.rotulo.length >= 5 && e.rotulo.length >= 5) {
          var dist = distancia(e.rotulo, r.rotulo);
          if (dist > 0 && dist <= d.distancia_parecido_maxima) {
            anotar('dominio-parecido', e.registravel, 'Difere de "' + r.dominio + '" em ' + dist + (dist === 1 ? ' letra.' : ' letras.'));
            return;
          }
          if (e.rotulo.indexOf(r.rotulo) !== -1) {
            anotar('dominio-parecido', e.registravel, 'Usa o nome "' + r.rotulo + '" dentro de outro endereço; o oficial é ' + r.dominio + '.');
          }
        }
      });
      if (e.referencia_oficial) return e;

      var hifens = (e.host.match(/-/g) || []).length;
      var pedacos = e.registravel.split(/[-.]/);
      var iscas = d.palavras_isca.filter(function (p) { return pedacos.indexOf(p) !== -1; });
      var motivosHifen = [];
      if (hifens > d.hifens_maximos) motivosHifen.push(hifens + ' hífens');
      if (e.host.length > d.comprimento_maximo_host) motivosHifen.push(e.host.length + ' caracteres');
      if (iscas.length) motivosHifen.push('palavras-isca: ' + iscas.join(', '));
      if (motivosHifen.length) anotar('excesso-hifens', e.host, 'Endereço montado com ' + motivosHifen.join('; ') + '.');

      if (d.tlds_incomuns.lista.indexOf(e.tld) !== -1) anotar('tld-incomum', e.registravel, 'Final ".' + e.tld + '" é pouco usado por bancos e órgãos brasileiros.');

      var naLista = (listasAtuais[e.host] || []).concat(listasAtuais[e.registravel] || []);
      if (naLista.length) {
        var nomes = naLista.map(function (l) { return l.fonte; }).filter(function (f, i, a) { return a.indexOf(f) === i; });
        anotar('lista-publica-phishing', e.host, 'Este endereço aparece em: ' + nomes.join(', ') + '. Isso indica relato anterior de phishing, não certeza.');
      }

      var dias = cfg.rdap_simulado.dominios[e.registravel];
      if (typeof dias === 'number' && dias <= cfg.rdap_simulado.dias_considerado_recente) {
        anotar('dominio-recente', e.registravel, 'SIMULAÇÃO: consulta de registro indica site criado há ' + dias + ' dias.', true);
      }
      return e;
    }

    var listasAtuais = {};

    // Endereços que valem consultar em listas externas (para a camada assíncrona)
    function alvosParaListas(texto) {
      return extrairEnderecos(String(texto || '').slice(0, 5000))
        .map(function (b) { return decomporEndereco(b.bruto, cfg.dominio); })
        .filter(function (e) { return !e.email; })
        .map(function (e) { return { host: e.host, registravel: e.registravel }; });
    }

    /** extras.listas: { dominio: [{fonte}] } vindo de AnzolListas (opcional). */
    function analisar(texto, extras) {
      listasAtuais = (extras && extras.listas) || {};
      texto = String(texto || '').slice(0, 5000);
      var achados = {}; // id -> {evidencias:[], simulado}
      function anotar(id, trecho, explicacao, simulado) {
        if (!sinais[id]) return;
        if (!achados[id]) achados[id] = { evidencias: [], simulado: false };
        var ja = achados[id].evidencias.some(function (ev) { return ev.trecho === trecho && ev.explicacao === explicacao; });
        if (!ja) achados[id].evidencias.push({ trecho: trecho, explicacao: explicacao || '' });
        if (simulado) achados[id].simulado = true;
      }

      // 1. Endereços
      var brutos = extrairEnderecos(texto);
      var enderecos = brutos.map(function (b) { return analisarEndereco(decomporEndereco(b.bruto, cfg.dominio), anotar); });
      var links = enderecos.filter(function (e) { return !e.email; });
      // Link que pertence a uma referência oficial não sustenta "autoridade" nem "canal incompatível"
      var linksSuspeitos = links.filter(function (e) { return !e.referencia_oficial; });

      // 2. Texto (com os endereços apagados, para não confundir palavras do link com o texto)
      var semLinks = texto.split('');
      brutos.forEach(function (b) { for (var i = b.inicio; i < b.fim; i++) semLinks[i] = ' '; });
      semLinks = semLinks.join('');
      var norm = normalizar(semLinks);
      Object.keys(padroes).forEach(function (id) {
        padroes[id].forEach(function (re) {
          var m = re.exec(norm);
          if (m) anotar(id, semLinks.substr(m.index, m[0].length).trim(), '');
        });
      });

      // 3. Regras combinadas
      var citaOrgao = reOrgaos.some(function (re) { return re.test(norm); });
      var pedidoForte = ['pede-codigo-senha', 'taxa-antecipada', 'pede-instalar-app'].filter(function (id) { return achados[id]; });
      if (citaOrgao && (linksSuspeitos.length || pedidoForte.length)) {
        anotar('canal-incompativel', linksSuspeitos.length ? linksSuspeitos[0].original : achados[pedidoForte[0]].evidencias[0].trecho,
          linksSuspeitos.length ? 'Órgão público ou banco mandando link por mensagem: esse não é o canal que costumam usar.'
                       : 'Órgão público ou banco pedindo código, taxa ou instalação por mensagem/ligação.');
      }
      refs.forEach(function (r) {
        var pos = -1, tam = 0;
        r.apelidos.some(function (a) {
          var re = new RegExp('\\b' + normalizar(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
          var m = re.exec(norm);
          if (m) { pos = m.index; tam = m[0].length; }
          return !!m;
        });
        if (pos === -1) return;
        // Citar a organização só é alerta quando o nome sustenta um pedido (link, código, taxa, app).
        if (linksSuspeitos.length || pedidoForte.length) anotar('autoridade', semLinks.substr(pos, tam), 'Usa o nome de ' + r.nome + ' para parecer oficial. Nome na mensagem não prova quem enviou.');
        links.forEach(function (e) {
          if (!ehOficial(e, r) && !e.ip) {
            anotar('remetente-nao-bate', e.registravel, 'A mensagem fala em ' + r.nome + ', mas o link aponta para ' + e.registravel + ' (oficial: ' + r.dominio + ').');
          }
        });
      });
      if (achados['sem-link-pagamento'] && (links.length || pedidoForte.length || achados['pagamento-fora-plataforma'])) {
        delete achados['sem-link-pagamento'];
      }
      if (achados['avisa-nao-compartilhar'] && achados['pede-codigo-senha']) delete achados['avisa-nao-compartilhar'];

      // Camada Radar (alerta passivo): vem de AnzolRadar.consultar, já com o estado de cada campanha
      ((extras && extras.radar) || []).forEach(function (m) {
        var c = m.campanha;
        if (c.estado === 'arquivada') return;
        var quem = 'reportada por ' + c.pessoas + (c.pessoas === 1 ? ' pessoa' : ' pessoas');
        if (c.estado === 'alerta_ativo' && m.como === 'exato') {
          anotar('radar-alerta-ativo', c.titulo, 'Campanha "' + c.titulo + '": ' + quem + ', alerta ativo. Motivo: ' + m.porque + '.');
        } else {
          anotar('radar-relatos', c.titulo, 'Lembra a campanha "' + c.titulo + '" (' + quem + ', ' + (c.estado === 'alerta_ativo' ? 'alerta ativo' : 'em observação') + '): ' + m.porque + '.');
        }
      });

      // 4. Pontuação (interna) e faixa
      var ids = Object.keys(achados);
      var pontos = 0;
      ids.forEach(function (id) { pontos += sinais[id].peso_inicial; });
      var familias = {};
      ids.forEach(function (id) { if (sinais[id].peso_inicial > 0) familias[sinais[id].familia] = true; });
      var sinergias = [];
      cfg.sinergias.forEach(function (s) {
        if (familias[s.se_familia] && familias[s.e_familia]) { pontos += s.bonus; sinergias.push(s.motivo); }
      });
      pontos = Math.max(0, Math.min(100, pontos));
      var faixa = pontos >= cfg.faixas.alto_a_partir_de ? 'alto' : pontos >= cfg.faixas.medio_a_partir_de ? 'medio' : 'baixo';

      // 5. Motivos legíveis, agrupados pelas 4 perguntas
      var motivos = ids.map(function (id) {
        var s = sinais[id];
        return {
          id: id, nome: s.nome, descricao: s.descricao, familia: s.familia,
          pergunta: familiaPergunta[s.familia], peso: s.peso_inicial,
          tipo: s.peso_inicial < 0 ? 'confianca' : 'alerta',
          simulado: achados[id].simulado, evidencias: achados[id].evidencias
        };
      }).sort(function (a, b) { return b.peso - a.peso; });

      var lembretes = [];
      if (links.some(function (e) { return e.https; })) lembretes.push('cadeado');
      if (achados['subdominio-enganoso'] || achados['dominio-parecido'] || achados['homoglifo']) lembretes.push('aparencia');

      return {
        faixa: faixa,
        pontuacao_interna: pontos,
        motivos: motivos,
        sinergias: sinergias,
        enderecos: links.map(function (e) {
          return { original: e.original, dono_real: e.registravel, referencia_oficial: e.referencia_oficial };
        }),
        lembretes: lembretes,
        aviso: faixa === 'baixo' ? cfg.avisos.baixo : cfg.avisos.geral,
        aviso_link: cfg.avisos.nunca_abre
      };
    }

    return { analisar: analisar, alvosParaListas: alvosParaListas };
  }

  return {
    criarScanner: criarScanner,
    _interno: { normalizar: normalizar, distancia: distancia, extrairEnderecos: extrairEnderecos }
  };
});
