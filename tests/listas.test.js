// Testes da camada de listas públicas (sem rede e sem domínios reais).
// Como rodar:  node tests/listas.test.js
'use strict';
const path = require('path');
const crypto = require('crypto');
const { criarConsulta, impressao } = require(path.join(__dirname, '..', 'app', 'js', 'listas.js'));

const esperado = (d) => crypto.createHash('sha256').update(d).digest('hex').slice(0, 16);
let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

(async () => {
  // 1. A impressão do app é igual à do script gerador
  ok((await impressao('golpe-exemplo.test')) === esperado('golpe-exemplo.test'), 'impressão SHA-256/16 igual à do tools/atualizar-listas.js');

  // 2. Consulta com listas falsas (só .test)
  const recorte = { total_br: 2, atualizado_na_fonte: '2026-10-02T00:00:00Z', impressoes: [esperado('registrado-na-lista.test')] };
  const feed = 'https://pagina.invadida.test/caminho/x\nhttps://outro-golpe.test/login\nlixo-sem-url';
  const consulta = criarConsulta({
    urlRecorte: 'x', urlOpenPhish: 'y',
    lerJSON: async () => recorte,
    lerTexto: async () => feed
  });
  const r = await consulta.consultar([
    { host: 'www.registrado-na-lista.test', registravel: 'registrado-na-lista.test' },
    { host: 'outro-golpe.test', registravel: 'outro-golpe.test' },
    { host: 'site-limpo.test', registravel: 'site-limpo.test' },
    { host: 'blog.invadida.test', registravel: 'invadida.test' }
  ]);
  ok(r.achados['registrado-na-lista.test'] && r.achados['registrado-na-lista.test'][0].fonte === 'Phishing.Database', 'Phishing.Database: acha pelo domínio registrável');
  ok(r.achados['outro-golpe.test'] && r.achados['outro-golpe.test'][0].fonte === 'OpenPhish', 'OpenPhish: acha pelo host exato');
  ok(!r.achados['site-limpo.test'], 'domínio fora das listas não é marcado');
  ok(!r.achados['blog.invadida.test'] && !r.achados['invadida.test'], 'OpenPhish: não marca o site inteiro por causa de uma página invadida');
  ok(r.fontes.every((f) => f.ok), 'as duas fontes respondem com status');

  // 3. Fonte fora do ar não derruba a consulta
  const comFalha = criarConsulta({ urlRecorte: 'x', lerJSON: async () => recorte, lerTexto: async () => { throw new Error('sem rede'); } });
  const r2 = await comFalha.consultar([{ host: 'site-limpo.test', registravel: 'site-limpo.test' }]);
  ok(r2.fontes.some((f) => !f.ok && /sem rede/.test(f.erro)), 'OpenPhish fora do ar: devolve erro sem quebrar');

  // 4. O recorte real gerado tem o formato certo (sem abrir nada)
  const real = require(path.join(__dirname, '..', 'app', 'data', 'listas', 'phishing-database-br.json'));
  ok(real.algoritmo === 'sha256-hex16' && real.impressoes.every((h) => /^[0-9a-f]{16}$/.test(h)), `recorte real: ${real.impressoes.length} impressões no formato certo, sem domínios legíveis`);
  ok(/MIT/.test(real.licenca), 'recorte real: aviso de licença MIT presente');

  console.log(`\n${falhas ? 'Houve ' + falhas + ' falha(s).' : 'Todos os testes de listas passaram.'}`);
  process.exit(falhas ? 1 : 0);
})();
