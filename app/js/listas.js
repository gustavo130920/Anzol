/*
 * Anzol — consulta a listas públicas de phishing (camada externa do Scanner).
 * PRIVACIDADE: o endereço da pessoa NUNCA é enviado. O app baixa a lista e compara no próprio aparelho.
 *
 * Fontes:
 *  - Phishing.Database (MIT): recorte .br guardado só como impressões digitais (app/data/listas/).
 *  - OpenPhish Community Feed: baixado AO VIVO pelo navegador de quem usa; não guardamos cópia
 *    (os termos proíbem redistribuir; uso pessoal/acadêmico).
 * Listas demoram a incluir endereços novos: NÃO aparecer numa lista não prova nada.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolListas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OPENPHISH_URL = 'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt';
  var CACHE_MS = 30 * 60 * 1000;

  function cripto() {
    if (typeof crypto !== 'undefined' && crypto.subtle) return crypto;
    if (typeof require === 'function') return require('crypto').webcrypto;
    throw new Error('Sem suporte a SHA-256 neste ambiente');
  }

  // Impressão digital: SHA-256 do domínio, 16 primeiros caracteres hex (igual a tools/atualizar-listas.js)
  function impressao(dominio) {
    var dados = new TextEncoder().encode(String(dominio).toLowerCase());
    return cripto().subtle.digest('SHA-256', dados).then(function (h) {
      return Array.prototype.slice.call(new Uint8Array(h), 0, 8).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  function hostDeUrl(linha) {
    try { return new URL(linha.trim()).hostname.toLowerCase(); } catch (e) { return null; }
  }

  /**
   * opcoes.lerJSON(url) e opcoes.lerTexto(url) devolvem Promises (permite testar sem rede).
   */
  function criarConsulta(opcoes) {
    var recorte = null, openphish = null;

    function carregarRecorte() {
      if (recorte) return Promise.resolve(recorte);
      return opcoes.lerJSON(opcoes.urlRecorte).then(function (d) {
        recorte = { dados: d, conjunto: new Set(d.impressoes) };
        return recorte;
      });
    }
    function carregarOpenPhish() {
      if (openphish && Date.now() - openphish.quando < CACHE_MS) return Promise.resolve(openphish);
      return opcoes.lerTexto(opcoes.urlOpenPhish || OPENPHISH_URL).then(function (txt) {
        var hosts = new Set();
        txt.split(/\r?\n/).forEach(function (l) { var h = hostDeUrl(l); if (h) hosts.add(h); });
        openphish = { hosts: hosts, quando: Date.now() };
        return openphish;
      });
    }

    /**
     * alvos: [{ host, registravel }]. Devolve { achados: {dominio: [{fonte}]}, fontes: [...status] }.
     * Compara o host exato (OpenPhish e Phishing.Database) e o domínio registrável (só Phishing.Database,
     * que lista domínios). O OpenPhish lista URLs completas, muitas em sites legítimos invadidos:
     * por isso ali só vale o host exato.
     */
    function consultar(alvos) {
      var achados = {};
      function marcar(chave, fonte) {
        (achados[chave] = achados[chave] || []);
        if (!achados[chave].some(function (a) { return a.fonte === fonte; })) achados[chave].push({ fonte: fonte });
      }
      var pd = carregarRecorte().then(function (r) {
        var pedidos = [];
        alvos.forEach(function (a) {
          [a.host, a.registravel].forEach(function (d) {
            if (!d) return;
            pedidos.push(impressao(d).then(function (imp) { if (r.conjunto.has(imp)) marcar(d, 'Phishing.Database'); }));
          });
        });
        return Promise.all(pedidos).then(function () {
          return { fonte: 'Phishing.Database (recorte .br)', ok: true, total: r.dados.total_br, atualizado: r.dados.atualizado_na_fonte };
        });
      }).catch(function (e) { return { fonte: 'Phishing.Database (recorte .br)', ok: false, erro: String(e.message || e) }; });

      var op = carregarOpenPhish().then(function (o) {
        alvos.forEach(function (a) { if (o.hosts.has(a.host)) marcar(a.host, 'OpenPhish'); });
        return { fonte: 'OpenPhish (ao vivo)', ok: true, total: o.hosts.size, atualizado: new Date(o.quando).toISOString() };
      }).catch(function (e) { return { fonte: 'OpenPhish (ao vivo)', ok: false, erro: String(e.message || e) }; });

      return Promise.all([pd, op]).then(function (fontes) { return { achados: achados, fontes: fontes }; });
    }

    return { consultar: consultar };
  }

  return { criarConsulta: criarConsulta, impressao: impressao };
});
