/*
 * Anzol — Kit de provas (lógica pura, sem tela).
 * Visão computacional:
 *  - OCR (leitura do texto do print) é feito na tela com Tesseract.js, NO APARELHO; aqui só tratamos o texto lido.
 *  - "Impressão digital" da imagem (dHash): reduz a imagem a 9x8 tons de cinza e compara vizinhos;
 *    imagens quase iguais (mesmo print cortado/comprimido) ficam com impressões parecidas.
 * Tudo fica no aparelho. Nada é enviado sem a pessoa pedir.
 * Funciona no navegador (window.AnzolKit) e no Node (testes).
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.AnzolKit = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- extração do texto lido (OCR) ----------
  var RE = {
    valor: /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    data: /\b(\d{2})\/(\d{2})\/(\d{4})\b/g,
    hora: /\b([01]\d|2[0-3])[:h]([0-5]\d)(?::[0-5]\d)?\b/g,
    email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    aleatoria: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
    cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
    telefone: /(?:\+?55[\s-]?)?\(?\b(\d{2})\)?[\s-]?(9\d{4})[\s-]?(\d{4})\b/g
  };
  function todos(re, texto, fn) {
    var out = [], m;
    re.lastIndex = 0;
    while ((m = re.exec(texto)) !== null) out.push(fn ? fn(m) : m[0]);
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  /**
   * texto: texto lido do print. extrairEnderecos (opcional): função do Scanner que devolve [{registravel}].
   * Devolve só o que foi encontrado; a pessoa confere e corrige na tela.
   */
  // Corrige trocas comuns do OCR antes de extrair (ex.: "@" lido como "(Q", "(a", "©")
  function corrigirOcr(texto) {
    return String(texto || '')
      .replace(/([a-z0-9._-])\s?(?:\(\s?[Qqa@]|©|®|\(\))\s?([a-z0-9-]+\.[a-z]{2,})/gi, '$1@$2')
      .replace(/R\s?\$\s?/g, 'R$ ')
      .replace(/(\d)\s?[,.]\s?(\d{2})\b/g, function (m, a, b) { return m.indexOf(',') !== -1 ? a + ',' + b : m; });
  }

  function extrair(texto, extrairEnderecos) {
    texto = corrigirOcr(texto);
    var temPix = /\bpix\b/i.test(texto);
    var emails = todos(RE.email, texto).map(function (e) { return e.toLowerCase(); });
    var aleatorias = todos(RE.aleatoria, texto).map(function (e) { return e.toLowerCase(); });
    var chaves = [];
    // Chave Pix: chave aleatória sempre; e-mail, CPF/CNPJ e telefone só quando o texto fala em Pix
    aleatorias.forEach(function (c) { chaves.push({ tipo: 'aleatória', valor: c }); });
    if (temPix) {
      var linhaChave = (texto.match(/chave[^\n]*/i) || [''])[0];
      emails.forEach(function (e) { if (!linhaChave || linhaChave.toLowerCase().indexOf(e) !== -1 || emails.length === 1) chaves.push({ tipo: 'e-mail', valor: e }); });
      todos(RE.cpf, linhaChave).forEach(function (c) { chaves.push({ tipo: 'CPF', valor: c }); });
      todos(RE.cnpj, linhaChave).forEach(function (c) { chaves.push({ tipo: 'CNPJ', valor: c }); });
      // Se a leitura saiu torta, ainda guardamos o que vem depois de "Chave Pix:" para a pessoa conferir
      var depois = linhaChave.match(/chave(?:\s+pix)?\s*[:\-]\s*(\S{4,80})/i);
      if (depois && !chaves.some(function (c) { return depois[1].toLowerCase().indexOf(c.valor) !== -1; })) {
        chaves.push({ tipo: 'confira', valor: depois[1].replace(/[.,;]+$/, '') });
      }
    }
    var datas = todos(RE.data, texto, function (m) { return m[3] + '-' + m[2] + '-' + m[1]; })
      .filter(function (d) { var p = d.split('-').map(Number); return p[1] >= 1 && p[1] <= 12 && p[2] >= 1 && p[2] <= 31; });
    var horas = todos(RE.hora, texto, function (m) { return m[1] + ':' + m[2]; });
    var semAleatorias = texto.replace(RE.aleatoria, ' ');
    var telefones = todos(RE.telefone, semAleatorias, function (m) { return '(' + m[1] + ') ' + m[2] + '-' + m[3]; });
    var enderecos = extrairEnderecos ? extrairEnderecos(texto.replace(RE.email, ' ')).map(function (a) { return a.registravel; }) : [];
    return {
      valores: todos(RE.valor, texto, function (m) { return m[1]; }),
      datas: datas,
      horas: horas,
      chaves_pix: chaves,
      telefones: telefones,
      emails: emails,
      enderecos: enderecos.filter(function (v, i, a) { return a.indexOf(v) === i; }),
      menciona_pix: temPix,
      parece_agendado: /\bagendad/i.test(texto)
    };
  }

  // ---------- impressão digital da imagem (dHash) ----------
  /** pixels: { largura: 9, altura: 8, dados: [r,g,b,a, ...] } já reduzidos para 9x8. Devolve 16 caracteres hex. */
  function dhash(pixels) {
    var cinza = [];
    for (var i = 0; i < pixels.largura * pixels.altura; i++) {
      var r = pixels.dados[i * 4], g = pixels.dados[i * 4 + 1], b = pixels.dados[i * 4 + 2];
      cinza.push(0.299 * r + 0.587 * g + 0.114 * b);
    }
    var bits = '';
    for (var y = 0; y < pixels.altura; y++) {
      for (var x = 0; x < pixels.largura - 1; x++) {
        bits += cinza[y * pixels.largura + x] > cinza[y * pixels.largura + x + 1] ? '1' : '0';
      }
    }
    var hex = '';
    for (var k = 0; k < bits.length; k += 4) hex += parseInt(bits.substr(k, 4), 2).toString(16);
    return hex;
  }
  /** Quantos bits diferem (0 = idênticas; até ~10 de 64 = muito parecidas). */
  function distanciaHash(a, b) {
    var d = 0;
    for (var i = 0; i < a.length; i++) {
      var x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      while (x) { d += x & 1; x >>= 1; }
    }
    return d;
  }
  function parecidas(a, b, limite) { return distanciaHash(a, b) <= (limite == null ? 10 : limite); }

  // ---------- linha do tempo e rascunho ----------
  /** eventos: [{ data: 'AAAA-MM-DD'|null, hora: 'HH:MM'|null, descricao }] → ordenados (sem data vão para o fim). */
  function linhaDoTempo(eventos) {
    return eventos.slice().sort(function (a, b) {
      var ka = (a.data || '9999-99-99') + ' ' + (a.hora || '99:99');
      var kb = (b.data || '9999-99-99') + ' ' + (b.hora || '99:99');
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }
  function dataBR(d) { if (!d) return 'data não informada'; var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  /** dados: { situacao, canal, relato, pagamentos:[{valor,data,hora,chave}], telefones:[], enderecos:[], eventos:[], provas:[{tipo}] } */
  function rascunho(dados) {
    var L = [];
    L.push('RASCUNHO — revise e corrija antes de usar. Este texto não é aconselhamento jurídico.');
    L.push('');
    L.push('RELATO DE GOLPE');
    if (dados.situacao) L.push('Situação: ' + dados.situacao);
    if (dados.canal) L.push('Como fui abordado(a): ' + dados.canal);
    L.push('');
    L.push('O que aconteceu:');
    L.push(dados.relato ? dados.relato : '[descreva com suas palavras]');
    if (dados.pagamentos && dados.pagamentos.length) {
      L.push('');
      L.push('Pagamentos feitos:');
      dados.pagamentos.forEach(function (p) {
        L.push('- R$ ' + (p.valor || '[valor]') + ' em ' + dataBR(p.data) + (p.hora ? ' às ' + p.hora : '') + (p.chave ? ', para a chave Pix ' + p.chave : ''));
      });
    }
    var contatos = (dados.telefones || []).concat(dados.enderecos || []);
    if (contatos.length) {
      L.push('');
      L.push('Contatos e endereços usados pelo golpista: ' + contatos.join('; '));
    }
    var ev = linhaDoTempo(dados.eventos || []);
    if (ev.length) {
      L.push('');
      L.push('Linha do tempo:');
      ev.forEach(function (e) { L.push('- ' + dataBR(e.data) + (e.hora ? ' ' + e.hora : '') + ': ' + e.descricao); });
    }
    if (dados.provas && dados.provas.length) {
      L.push('');
      L.push('Provas que guardei: ' + dados.provas.length + ' imagem(ns) — ' + dados.provas.map(function (p) { return p.tipo; }).join(', ') + '.');
    }
    L.push('');
    L.push('Pedido ao banco: registrar a contestação da operação' + (dados.pagamentos && dados.pagamentos.length ? ' (no caso de Pix, pelo Mecanismo Especial de Devolução — MED)' : '') + ' e informar o número do protocolo.');
    return L.join('\n');
  }

  return { extrair: extrair, dhash: dhash, distanciaHash: distanciaHash, parecidas: parecidas, linhaDoTempo: linhaDoTempo, rascunho: rascunho };
});
