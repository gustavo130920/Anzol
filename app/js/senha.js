/*
 * Anzol — simulador de força de senha (lógica pura; roda no navegador e no Node).
 *
 * NÃO recebe senha nenhuma: só o TAMANHO e os TIPOS de caractere escolhidos nos controles.
 * Conta quantas combinações existem e estima o tempo de um ataque de força bruta no PIOR caso
 * (a senha certa é a última tentativa), com uma velocidade de ataque informada em escudo.json.
 * Vale para senha ALEATÓRIA: palavras, nomes, datas e senhas vazadas caem muito mais rápido.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolSenha = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ANO = 365.25 * 24 * 3600;

  // Tamanho do "alfabeto": soma dos tipos escolhidos (ex.: minúsculas 26 + números 10 = 36)
  function alfabeto(tipos, escolhidos) {
    return tipos.filter(function (t) { return escolhidos.indexOf(t.id) >= 0; })
      .reduce(function (s, t) { return s + t.quantidade; }, 0);
  }

  // Combinações em log10 (evita números grandes demais para o computador)
  function log10Combinacoes(base, tamanho) { return base > 1 ? tamanho * Math.log10(base) : 0; }

  // Escreve 10^x em palavras: "6,6 quatrilhões"
  var ESCALAS = ['', 'mil', 'milhões', 'bilhões', 'trilhões', 'quatrilhões', 'quintilhões', 'sextilhões',
    'septilhões', 'octilhões', 'nonilhões', 'decilhões'];
  var ESCALAS_SING = ['', 'mil', 'milhão', 'bilhão', 'trilhão', 'quatrilhão', 'quintilhão', 'sextilhão',
    'septilhão', 'octilhão', 'nonilhão', 'decilhão'];
  function numeroGrande(log10) {
    if (log10 < 3) return String(Math.round(Math.pow(10, log10)));
    var grupo = Math.floor(log10 / 3);
    if (grupo >= ESCALAS.length) return '1 seguido de ' + Math.floor(log10) + ' zeros';
    var v = Math.pow(10, log10 - grupo * 3);
    var txt = v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace('.', ',').replace(',0', '');
    if (txt === '1000') { grupo++; txt = '1'; if (grupo >= ESCALAS.length) return '1 seguido de ' + (grupo * 3) + ' zeros'; }
    return txt + ' ' + (txt === '1' ? ESCALAS_SING[grupo] : ESCALAS[grupo]);
  }

  // Tempo no pior caso, em palavras simples
  function tempoTexto(log10Combos, porSegundo) {
    var log10Seg = log10Combos - Math.log10(porSegundo);
    var seg = Math.pow(10, log10Seg);
    if (log10Seg < 0) return 'menos de 1 segundo';
    if (seg < 60) return Math.round(seg) + ' segundos';
    if (seg < 3600) return Math.round(seg / 60) + ' minutos';
    if (seg < 86400) return Math.round(seg / 3600) + ' horas';
    if (seg < ANO) { var d = Math.round(seg / 86400); return d + (d === 1 ? ' dia' : ' dias'); }
    var log10Anos = log10Seg - Math.log10(ANO);
    if (log10Anos > Math.log10(13.8e9)) return 'mais que a idade do universo (13,8 bilhões de anos)';
    var anos = numeroGrande(log10Anos);
    if (/(lhão|lhões)$/.test(anos)) return anos + ' de anos'; // "6,5 milhões de anos"
    return anos + (anos === '1' ? ' ano' : ' anos');
  }

  // Resultado completo para os controles escolhidos
  function avaliar(cfg, escolha) {
    var base, tamanho, porUnidade;
    if (escolha.modo === 'frase') {
      base = cfg.frase_senha.palavras_na_lista; tamanho = escolha.palavras; porUnidade = 'palavra';
    } else {
      base = alfabeto(cfg.tipos, escolha.tipos); tamanho = escolha.tamanho; porUnidade = 'caractere';
    }
    var log10 = log10Combinacoes(base, tamanho);
    return {
      base: base,
      tamanho: tamanho,
      log10: log10,
      combinacoes: numeroGrande(log10),
      // quanto um caractere (ou palavra) a mais multiplica a dificuldade
      vezes_por_unidade: base,
      unidade: porUnidade,
      tempo: tempoTexto(log10, cfg.ataque.tentativas_por_segundo)
    };
  }

  return { alfabeto: alfabeto, log10Combinacoes: log10Combinacoes, numeroGrande: numeroGrande, tempoTexto: tempoTexto, avaliar: avaliar };
});
