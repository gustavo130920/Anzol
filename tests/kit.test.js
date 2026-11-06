// Testes do Kit de provas e do conteúdo de Primeiros socorros/Escudo.
// Como rodar:  node tests/kit.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(raiz, p), 'utf8'));
const kit = require(path.join(raiz, 'app/js/kit.js'));
const { criarScanner } = require(path.join(raiz, 'app/js/scanner.js'));
const scanner = criarScanner({ sinais: ler('app/data/signals.json'), config: ler('app/data/scanner-config.json') });

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

// 1. Extração do texto de um comprovante (SIMULAÇÃO, dados fictícios)
const comprovante = `SIMULAÇÃO — Banco Exemplar
Comprovante de transferência Pix
Valor: R$ 1.150,00
Data: 04/11/2026  Horário: 14:32
Chave Pix: pix-custas-01@exemplo.test
Destino: Escritório Exemplo`;
const e = kit.extrair(comprovante, (t) => scanner.alvosParaListas(t));
ok(e.valores[0] === '1.150,00', 'valor extraído: R$ ' + e.valores[0]);
ok(e.datas[0] === '2026-11-04' && e.horas[0] === '14:32', 'data e hora extraídas: ' + e.datas[0] + ' ' + e.horas[0]);
ok(e.chaves_pix.length === 1 && e.chaves_pix[0].valor === 'pix-custas-01@exemplo.test', 'chave Pix (e-mail) extraída');
ok(e.enderecos.length === 0, 'e-mail não é confundido com endereço de site');

const conversa = 'Oi mãe, troquei de número (11) 90000-0002. Me faz um Pix? Chave aleatória 123e4567-e89b-12d3-a456-426614174000. Site: regulariza-cnh-detex.test 09h15';
const e2 = kit.extrair(conversa, (t) => scanner.alvosParaListas(t));
ok(e2.telefones[0] === '(11) 90000-0002', 'telefone extraído e padronizado');
ok(e2.chaves_pix.some((c) => c.tipo === 'aleatória'), 'chave aleatória reconhecida');
ok(e2.enderecos[0] === 'regulariza-cnh-detex.test', 'endereço de site extraído');
ok(e2.horas[0] === '09:15', 'hora no formato 09h15 reconhecida');
ok(kit.extrair('Pix agendado para amanhã').parece_agendado, 'percebe comprovante "agendado"');
// Texto real lido pelo OCR no teste do navegador: "@" virou "(Q"
const ocrTorto = 'Comprovante de transferência Pix\nValor: R$ 1.150,00\nChave Pix: pix-custas-01(Qexemplo.test\nDestino: Escritório Exemplo';
const e3 = kit.extrair(ocrTorto, (t) => scanner.alvosParaListas(t));
ok(e3.chaves_pix.some((c) => c.valor === 'pix-custas-01@exemplo.test'), 'corrige "@" lido como "(Q" pelo OCR e reconhece a chave Pix');
ok(e3.enderecos.length === 0, 'ruído do OCR não vira endereço de site falso');
const e4 = kit.extrair('Pix enviado. Chave Pix: chave#estranha123', null);
ok(e4.chaves_pix.some((c) => c.tipo === 'confira' && c.valor === 'chave#estranha123'), 'chave ilegível fica marcada como "confira"');
ok(kit.extrair('Data 31/13/2026').datas.length === 0, 'data inválida é ignorada');

// 2. Impressão digital (dHash)
function imagem(fn) { const d = []; for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { const v = fn(x, y); d.push(v, v, v, 255); } return { largura: 9, altura: 8, dados: d }; }
const onda = (x, y) => 128 + 100 * Math.sin(x * 1.3 + y * 0.7);
const a = kit.dhash(imagem((x, y) => Math.round(onda(x, y))));
const aRuido = kit.dhash(imagem((x, y) => Math.round(onda(x, y) * 0.97 + 4))); // mais escura/clara, como print comprimido
const b = kit.dhash(imagem((x, y) => Math.round(128 + 100 * Math.cos(x * 0.6 - y * 1.9))));
ok(a.length === 16 && /^[0-9a-f]+$/.test(a) && a !== '0000000000000000' && a !== 'ffffffffffffffff', 'impressão digital com 16 caracteres hex e padrão real: ' + a);
ok(kit.parecidas(a, aRuido), 'mesma imagem com pequena alteração → parecida (distância ' + kit.distanciaHash(a, aRuido) + ')');
ok(!kit.parecidas(a, b), 'imagens diferentes → não parecidas (distância ' + kit.distanciaHash(a, b) + ')');

// 3. Linha do tempo e rascunho
const lt = kit.linhaDoTempo([{ data: '2026-11-04', hora: '14:32', descricao: 'Pix' }, { data: null, descricao: 'sem data' }, { data: '2026-11-04', hora: '09:00', descricao: 'primeiro contato' }]);
ok(lt[0].descricao === 'primeiro contato' && lt[2].descricao === 'sem data', 'linha do tempo em ordem, eventos sem data no fim');
const r = kit.rascunho({ situacao: 'Fiz um Pix', canal: 'Aplicativo de mensagens', pagamentos: [{ valor: '1.150,00', data: '2026-11-04', hora: '14:32', chave: 'pix-custas-01@exemplo.test' }], eventos: lt, provas: [{ tipo: 'comprovante' }] });
ok(/^RASCUNHO/.test(r) && /não é aconselhamento jurídico/.test(r) && /MED/.test(r) && /04\/11\/2026 às 14:32/.test(r), 'rascunho com aviso, pagamento, MED e datas no formato brasileiro');
ok(!/vai recuperar|garantid/i.test(r), 'rascunho não promete recuperação');

// 4. Conteúdo de Primeiros socorros e Escudo (regras do projeto)
const socorro = ler('app/data/socorro.json');
const escudo = ler('app/data/escudo.json');
const ids = socorro.situacoes.map((s) => s.id);
ok(socorro.situacoes.length === 6, '6 situações de triagem');
let fontesOk = true, vaiParaOk = true;
socorro.situacoes.forEach((s) => s.passos.forEach((p) => {
  if (p.fonte && !socorro.fontes[p.fonte]) fontesOk = false;
  if (p.vai_para && !ids.includes(p.vai_para)) vaiParaOk = false;
}));
ok(fontesOk, 'todo passo com fonte aponta para uma fonte cadastrada');
ok(vaiParaOk, 'todo "vai para" aponta para uma situação existente');
ok(Object.values(socorro.fontes).every((f) => f.verificado_em), 'toda fonte tem data de verificação');
const tudo = JSON.stringify(socorro) + JSON.stringify(escudo);
ok(!/voc[eê] vai recuperar|recupera[cç][aã]o garantida|garantimos|100% seguro|voc[eê] est[aá] protegid/i.test(tudo), 'nenhuma promessa de recuperação ou de proteção total');
ok(socorro.avisos_fixos.some((a) => /não promete/.test(a)) && socorro.avisos_fixos.some((a) => /aconselhamento jurídico/.test(a)) && socorro.avisos_fixos.some((a) => /recupera/.test(a)), 'avisos fixos: sem promessa, sem aconselhamento jurídico, golpe da recuperação');
ok(escudo.cartoes.length === 8 && escudo.cartoes.every((c) => c.fonte && c.verificado_em), '8 cartões do Escudo, todos com fonte e data');
ok(escudo.checklist.itens.length === 5, 'checklist com 5 ações reais');

console.log(`\n${falhas ? 'Houve ' + falhas + ' falha(s).' : 'Todos os testes do Kit e do conteúdo passaram.'}`);
process.exit(falhas ? 1 : 0);
