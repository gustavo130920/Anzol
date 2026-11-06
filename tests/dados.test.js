// Verificação dos dados (mesmas regras de tests/validar-dados.ps1, para rodar também na nuvem/Linux).
// Como rodar:  node tests/dados.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const lerTexto = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');
const ler = (p) => JSON.parse(lerTexto(p));

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

const sinais = ler('app/data/signals.json');
const dados = ler('app/data/scenarios.json');
const ids = sinais.sinais.map((s) => s.id);
const familias = sinais.familias.map((f) => f.id);
ok(new Set(ids).size === ids.length, 'ids de pistas sem repetição (' + ids.length + ' pistas)');
ok(sinais.sinais.every((s) => familias.includes(s.familia)), 'toda pista pertence a uma família existente');

const cen = dados.cenarios;
ok(cen.length === 12 && cen.filter((c) => !c.legitima).length === 8 && cen.filter((c) => c.legitima).length === 4, '12 cenários: 8 golpes e 4 legítimos');
ok(dados.testes_dominio.length === 4 && dados.testes_procedimento.length === 3, '4 testes de domínio e 3 de procedimento');
const todos = cen.concat(dados.testes_dominio, dados.testes_procedimento);
ok(todos.every((i) => i.rotulo === 'SIMULAÇÃO — material educativo'), 'todo item tem o rótulo de simulação');
ok(cen.every((c) => c.pistas.every((p) => ids.includes(p.id))), 'toda pista dos cenários existe no motor de sinais');
ok(cen.every((c) => dados.decisoes[c.decisao_correta]), 'toda decisão correta existe');
ok(cen.every((c) => ['quem', 'o_que', 'por_onde', 'como_confirmo'].every((k) => c.perguntas[k])), 'todo cenário responde às 4 perguntas');
ok(dados.testes_dominio.concat(dados.testes_procedimento).every((t) => t.opcoes.filter((o) => o.correto).length === 1), 'todo teste tem exatamente 1 resposta certa');

// Segurança: domínios citados nos cenários só com TLD reservado (fontes reais ficam de fora)
const semFontes = lerTexto('app/data/scenarios.json').replace(/"fonte_url"\s*:\s*"[^"]*"/g, '');
const dominios = [...new Set((semFontes.match(/\b([a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).map((d) => d.toLowerCase()))];
const proibidos = dominios.filter((d) => !['test', 'example', 'invalid', 'json', 'md'].includes(d.split('.').pop()));
ok(proibidos.length === 0, 'cenários só usam domínios reservados' + (proibidos.length ? ': ' + proibidos.join(', ') : ''));
const radar = ler('app/data/radar-semente.json');
ok(radar.campanhas.every((c) => c.indicadores.filter((i) => i.tipo === 'dominio').every((i) => /\.(test|example|invalid)$/.test(i.valor))), 'Radar semeado só com domínios reservados');

console.log(`\n${falhas ? 'Houve ' + falhas + ' falha(s).' : 'Todos os dados conferem.'}`);
process.exit(falhas ? 1 : 0);
