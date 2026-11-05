/*
 * Executor dos casos de teste do Scanner. Usado pelo Node (tests/scanner.test.js)
 * e pelo navegador (tests/index.html). Sem dependências.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolTestes = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function rodarCasos(scanner, casos) {
    return casos.map(function (c) {
      var r = scanner.analisar(c.texto);
      var ids = r.motivos.map(function (m) { return m.id; });
      var falhas = [];
      if (r.faixa !== c.faixa) falhas.push('faixa "' + r.faixa + '" (esperado "' + c.faixa + '"), pontuação interna ' + r.pontuacao_interna);
      (c.deve_ter || []).forEach(function (id) { if (ids.indexOf(id) === -1) falhas.push('faltou a pista "' + id + '"'); });
      (c.nao_pode_ter || []).forEach(function (id) { if (ids.indexOf(id) !== -1) falhas.push('apareceu a pista proibida "' + id + '"'); });
      if (typeof c.enderecos === 'number' && r.enderecos.length !== c.enderecos) falhas.push(r.enderecos.length + ' endereços achados (esperado ' + c.enderecos + ')');
      if (c.oficial && !r.enderecos.some(function (e) { return e.referencia_oficial === c.oficial; })) falhas.push('não reconheceu o domínio oficial de ' + c.oficial);
      return { id: c.id, ok: falhas.length === 0, falhas: falhas, faixa: r.faixa, pontos: r.pontuacao_interna, pistas: ids };
    });
  }
  return { rodarCasos: rodarCasos };
});
