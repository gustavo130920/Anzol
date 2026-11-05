// Testes do motor do jogo (sem dependências). Como rodar:  node tests/jogo.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(raiz, p), 'utf8'));
const { criarJogo } = require(path.join(raiz, 'app/js/jogo.js'));

const conteudo = ler('app/data/scenarios.json');
const sinais = ler('app/data/signals.json');
const config = ler('app/data/jogo-config.json');
const idsSinais = new Set(sinais.sinais.map((s) => s.id));

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

const { criarScanner } = require(path.join(raiz, 'app/js/scanner.js'));
const scanner = criarScanner({ sinais, config: ler('app/data/scanner-config.json') });
const detectar = (item) => scanner.analisar(item.dados.mensagem + (item.dados.link_exibido ? ' ' + item.dados.link_exibido : '')).motivos.map((m) => m.id);

let dataFalsa = new Date(2026, 10, 10, 12); // 10/11/2026
const novoJogo = () => criarJogo({ conteudo, sinais, config, detectar, agora: () => dataFalsa });
const avancarDias = (n) => { dataFalsa = new Date(dataFalsa.getTime() + n * 86400000); };

// Resposta perfeita para um item de mensagem
function respostaPerfeita(rodada) {
  const c = rodada.item.dados;
  return {
    classificacao: rodada.item.legitima ? 'legitima' : 'golpe',
    passo: rodada.opcoesPasso ? rodada.opcoesPasso.findIndex((p) => p.correto) : null,
    pistasMarcadas: c.pistas.map((p) => p.id),
    usouLupa: rodada.temLupa
  };
}

// 1. Níveis
let j = novoJogo();
ok(j.nivel(0).nome === 'Curioso' && j.nivel(59).nome === 'Curioso' && j.nivel(60).nome === 'Atento' && j.nivel(480).nome === 'Guardião', 'níveis seguem os limiares da configuração');
ok(j.nivel(480).proximo === null && j.nivel(480).progresso === 1, 'nível máximo não tem próximo');

// 2. Rodadas de todos os itens
let todasValidas = true, deterministico = true, passosOk = true, semClicarSemLink = true;
for (const item of j.itens) {
  const r = j.montarRodada(item.id);
  if (item.tipo !== 'mensagem') continue;
  const certas = item.dados.pistas.map((p) => p.id);
  const ids = r.candidatos.map((c) => c.id);
  if (new Set(ids).size !== ids.length || !certas.every((c) => ids.includes(c)) || ids.length !== certas.length + 3 || !ids.every((i) => idsSinais.has(i))) todasValidas = false;
  if (JSON.stringify(j.montarRodada(item.id).candidatos) !== JSON.stringify(r.candidatos)) deterministico = false;
  if (item.legitima ? r.opcoesPasso : (!r.opcoesPasso || r.opcoesPasso.filter((p) => p.correto).length !== 1)) passosOk = false;
  if (!r.temLupa && r.opcoesPasso && r.opcoesPasso.some((p) => /link/i.test(p.texto) && !p.correto)) semClicarSemLink = false;
}
ok(todasValidas, 'cada mensagem tem todas as pistas certas + 3 distratoras, sem repetição, todas existentes');
ok(deterministico, 'a ordem das pistas é sempre a mesma para o mesmo item');
ok(passosOk, 'golpes têm 1 passo certo entre as opções; legítimas não têm pergunta de passo');
ok(semClicarSemLink, 'sem link na mensagem, não aparece a opção "clicar no link"');
let distratorJusto = true;
for (const item of j.itens.filter((i) => i.tipo === 'mensagem')) {
  const r = j.montarRodada(item.id);
  const certas = item.dados.pistas.map((p) => p.id);
  const detectadas = detectar(item);
  const injustas = r.candidatos.map((c) => c.id).filter((id) => !certas.includes(id) && detectadas.includes(id));
  if (injustas.length) { distratorJusto = false; console.log('      ' + item.id + ': pista falsa injusta ' + injustas.join(', ')); }
}
ok(distratorJusto, 'nenhuma "pista falsa" é algo que o Scanner detecta na própria mensagem');

// 3. Correção e XP
const r1 = j.montarRodada('L3-01');
const c1 = j.corrigir(r1, respostaPerfeita(r1));
const esperado = 10 + 10 + 5 * r1.item.dados.pistas.length + 5;
ok(c1.acertou && c1.xp.total === esperado, `resposta perfeita no L3-01 vale ${esperado} XP (deu ${c1.xp.total})`);
const distratoras = r1.candidatos.filter((c) => !r1.item.dados.pistas.some((p) => p.id === c.id)).map((c) => c.id);
const c1b = j.corrigir(r1, { classificacao: 'golpe', passo: null, pistasMarcadas: distratoras, usouLupa: false });
ok(c1b.xp.partes.pistas === 0 && c1b.falsas.length === 3, 'marcar só pistas falsas não deixa o subtotal de pistas negativo');
const rLeg = j.montarRodada('L1-04');
const cLeg = j.corrigir(rLeg, { classificacao: 'golpe', pistasMarcadas: [] });
ok(!cLeg.acertou && cLeg.erro === 'falso_alarme', 'chamar uma legítima de golpe conta como falso alarme');
const cInt = j.corrigir(r1, { classificacao: 'legitima', pistasMarcadas: [] });
ok(!cInt.acertou && cInt.erro === 'interagiria', 'chamar um golpe de legítima conta como "interagiria"');

// 4. XP só na primeira vez
j = novoJogo();
const ra = j.montarRodada('L3-01');
const reg1 = j.registrar(ra, j.corrigir(ra, respostaPerfeita(ra)));
const reg2 = j.registrar(ra, j.corrigir(ra, respostaPerfeita(ra)));
ok(reg1.xpGanho === esperado && reg2.xpGanho === 0 && j.resumo().xp === esperado, 'XP só na primeira vez de cada item');

// 5. Teste do dia: bônus uma vez por dia
const td = j.testeDoDia();
ok(td.id && j.porId[td.id], 'teste do dia escolhe um item válido');
ok(!config.avaliacao.reteste.includes(td.id), 'teste do dia não usa itens reservados ao reteste');
const rtd = j.montarRodada(td.id);
const resp = rtd.item.tipo === 'mensagem' ? respostaPerfeita(rtd) : { opcao: rtd.item.dados.opcoes.findIndex((o) => o.correto), usouLupa: false };
const regTd = j.registrar(rtd, j.corrigir(rtd, resp));
const regTd2 = j.registrar(rtd, j.corrigir(rtd, resp));
ok(regTd.bonusDia === config.xp.teste_do_dia_bonus && regTd2.bonusDia === 0, 'bônus do teste do dia só uma vez');

// 6. Teste do dia mira a pista mais errada
dataFalsa = new Date(2026, 10, 10, 12);
j = novoJogo();
const rErr = j.montarRodada('L2-01');
j.registrar(rErr, j.corrigir(rErr, { classificacao: 'legitima', pistasMarcadas: [] })); // deixa passar todas as pistas
avancarDias(1);
const td2 = j.testeDoDia();
ok(/mais deixou passar/.test(td2.motivo), 'depois de errar, o teste do dia mira a pista mais deixada passar: ' + td2.id);

// 7. Sequência diária com perdão
dataFalsa = new Date(2026, 10, 10, 12);
j = novoJogo();
const jogarAlgo = (id) => { const r = j.montarRodada(id); return j.registrar(r, j.corrigir(r, r.item.tipo === 'mensagem' ? respostaPerfeita(r) : { opcao: 0 })); };
jogarAlgo('L3-01');                      // dia 1
avancarDias(1); jogarAlgo('L2-01');      // dia 2 → 2
ok(j.resumo().sequencia.atual === 2, 'dias seguidos somam na sequência');
avancarDias(2); const rp = jogarAlgo('L1-01'); // pulou 1 dia → perdão → 3
ok(j.resumo().sequencia.atual === 3 && rp.usouPerdao, 'pular um dia usa o perdão e mantém a sequência');
avancarDias(2); jogarAlgo('L1-02');      // pulou de novo em menos de 7 dias → recomeça
ok(j.resumo().sequencia.atual === 1, 'segundo pulo em menos de 7 dias recomeça a sequência');
avancarDias(4);
ok(j.resumo().sequencia.atual === 0, 'sem jogar por vários dias, a sequência exibida é 0');

// 8. Selos
dataFalsa = new Date(2026, 10, 10, 12);
j = novoJogo();
const rs = j.montarRodada('L2-01');
const regS = j.registrar(rs, j.corrigir(rs, respostaPerfeita(rs)));
ok(regS.selosNovos.some((s) => s.id === 'selo-familia'), 'acertar o falso parente dá o selo "Família protegida"');
['D-01', 'D-02', 'D-03', 'D-04'].forEach((id) => { const r = j.montarRodada(id); j.registrar(r, j.corrigir(r, { opcao: r.item.dados.opcoes.findIndex((o) => o.correto) })); });
ok(j.resumo().selos.find((s) => s.id === 'selo-lupa').ganhoEm, 'acertar os 4 domínios dá o selo "Lupa afiada"');

// 9. Avaliação inicial e reteste
j = novoJogo();
ok(j.itensPratica().every((i) => !config.avaliacao.reteste.includes(i.id)), 'itens do reteste ficam fora da prática antes do reteste');
const ini = j.registrarAvaliacao('inicial', config.avaliacao.inicial.map((id) => ({ id, classificacao: 'legitima' })));
ok(ini.golpes === 3 && ini.interacoes === 3 && ini.taxa_interacao === 1 && ini.falsos_alarmes === 0, 'inicial: dizer "legítima" para tudo = interagiria com 3 de 3 golpes');
ok(!j.podeFazerReteste(), 'reteste bloqueado antes de praticar o suficiente');
j.itensPratica().slice(0, config.avaliacao.reteste_libera_apos_itens_praticados).forEach((i) => jogarAlgo(i.id));
ok(j.podeFazerReteste(), `reteste liberado depois de ${config.avaliacao.reteste_libera_apos_itens_praticados} itens praticados`);
const ret = j.registrarAvaliacao('reteste', config.avaliacao.reteste.map((id) => ({ id, classificacao: j.porId[id].legitima ? 'legitima' : 'golpe' })));
const cmp = j.resumo().comparacao;
ok(ret.taxa_interacao === 0 && cmp.antes.taxa_interacao === 1 && cmp.depois.taxa_interacao === 0, 'comparação antes × depois da taxa de interação');
ok(j.itensPratica().length === j.itens.length, 'depois do reteste, todos os itens voltam para a prática');

// 10. Persistência
const memoria = (() => { let v = null; return { ler: () => v, gravar: (x) => { v = JSON.parse(JSON.stringify(x)); } }; })();
const ja = criarJogo({ conteudo, sinais, config, armazenamento: memoria, agora: () => dataFalsa });
const rp1 = ja.montarRodada('L3-01'); ja.registrar(rp1, ja.corrigir(rp1, respostaPerfeita(rp1)));
const jb = criarJogo({ conteudo, sinais, config, armazenamento: memoria, agora: () => dataFalsa });
ok(jb.resumo().xp === ja.resumo().xp && jb.resumo().xp > 0, 'o progresso é salvo e recarregado');

console.log(`\n${falhas ? 'Houve ' + falhas + ' falha(s).' : 'Todos os testes do jogo passaram.'}`);
process.exit(falhas ? 1 : 0);
