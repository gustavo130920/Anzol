// Roda todos os testes automáticos do Anzol, um depois do outro.
// Como rodar (na pasta do projeto):  node tests/rodar-todos.js
// Usado também pela nuvem (GitHub Actions): se algum falhar, o site NÃO é publicado.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const testes = ['dados', 'scanner', 'listas', 'jogo', 'radar', 'kit'];
let falhou = [];
for (const t of testes) {
  const r = spawnSync(process.execPath, [path.join(__dirname, t + '.test.js')], { encoding: 'utf8' });
  const ultima = (r.stdout || '').trim().split('\n').pop();
  const passou = r.status === 0;
  console.log((passou ? 'OK    ' : 'FALHA ') + t.padEnd(8) + ' ' + ultima);
  if (!passou) { falhou.push(t); console.log(r.stdout + (r.stderr || '')); }
}
console.log(falhou.length ? `\n${falhou.length} conjunto(s) com falha: ${falhou.join(', ')}` : `\nTodos os ${testes.length} conjuntos de testes passaram.`);
process.exit(falhou.length ? 1 : 0);
