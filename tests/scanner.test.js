// Testes do Scanner pelo Node.js (sem dependências).
// Como rodar (na pasta do projeto):  node tests/scanner.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(raiz, p), 'utf8'));

const { criarScanner } = require(path.join(raiz, 'app/js/scanner.js'));
const { rodarCasos } = require('./rodar-casos.js');

const scanner = criarScanner({ sinais: ler('app/data/signals.json'), config: ler('app/data/scanner-config.json') });
const resultados = rodarCasos(scanner, ler('tests/casos-scanner.json').casos);

let falhou = 0;
for (const r of resultados) {
  if (r.ok) console.log(`OK    ${r.id}  [${r.faixa}, ${r.pontos}]`);
  else { falhou++; console.log(`FALHA ${r.id}  [${r.faixa}, ${r.pontos}]  pistas: ${r.pistas.join(', ')}\n      - ${r.falhas.join('\n      - ')}`); }
}
console.log(`\n${resultados.length - falhou}/${resultados.length} casos passaram.`);
process.exit(falhou ? 1 : 0);
