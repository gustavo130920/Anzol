// Testes do simulador de senha (Escudo · Proteja suas contas).
// Como rodar:  node tests/senha.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const S = require(path.join(raiz, 'app/js/senha.js'));
const escudo = JSON.parse(fs.readFileSync(path.join(raiz, 'app/data/escudo.json'), 'utf8'));
const c = escudo.contas;

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

// 1. Alfabeto e combinações
ok(S.alfabeto(c.tipos, ['minusculas']) === 26, 'só minúsculas = 26 caracteres');
ok(S.alfabeto(c.tipos, ['minusculas', 'maiusculas', 'numeros', 'simbolos']) === 95, 'todos os tipos = 95 (teclado + espaço)');
ok(Math.abs(S.log10Combinacoes(10, 6) - 6) < 1e-9, '6 números = 1 milhão de combinações');

// 2. Números por extenso
ok(S.numeroGrande(6) === '1 milhão', '10^6 = "1 milhão": ' + S.numeroGrande(6));
ok(S.numeroGrande(Math.log10(6.634e15)) === '6,6 quatrilhões', '95^8 ≈ "6,6 quatrilhões": ' + S.numeroGrande(Math.log10(6.634e15)));
ok(S.numeroGrande(Math.log10(999.96e6)) === '1 bilhão', 'arredondamento sobe de escala: ' + S.numeroGrande(Math.log10(999.96e6)));
ok(/seguido de/.test(S.numeroGrande(40)), 'números enormes viram "1 seguido de N zeros"');

// 3. Tempos (velocidade da Hive Systems 2026)
const v = c.ataque.tentativas_por_segundo;
ok(v === 138675, 'velocidade de ataque registrada: ' + v + ' tentativas/s');
const tempo = (tam, tipos) => S.avaliar(c, { modo: 'caracteres', tamanho: tam, tipos }).tempo;
ok(tempo(6, ['numeros']) === '7 segundos', '6 números (1 milhão ÷ 138.675/s) = 7 segundos: ' + tempo(6, ['numeros']));
// 26^8 / 138675 ≈ 1,5 milhão de segundos ≈ 17 dias (a Hive publica "~2 semanas" para o mesmo caso)
ok(tempo(8, ['minusculas']) === '17 dias', '8 minúsculas ≈ 17 dias (Hive: ~2 semanas): ' + tempo(8, ['minusculas']));
// 52^8 / 138675 ≈ 12 anos (a Hive publica ~23 anos com METADE da frota: confere)
ok(tempo(8, ['minusculas', 'maiusculas']) === '12 anos', '8 maiúsculas+minúsculas ≈ 12 anos: ' + tempo(8, ['minusculas', 'maiusculas']));
ok(/idade do universo/.test(tempo(20, ['minusculas', 'maiusculas', 'numeros', 'simbolos'])), '20 caracteres de todos os tipos passa da idade do universo');

ok(S.tempoTexto(Math.log10(6.5e6 * 365.25 * 24 * 3600 * v), v) === '6,5 milhões de anos', 'português: "milhões DE anos"');
ok(S.tempoTexto(Math.log10(3000 * 365.25 * 24 * 3600 * v), v) === '3 mil anos', 'português: "3 mil anos"');

// 4. A lição principal: tamanho pesa mais que símbolo
const curtaComplexa = S.avaliar(c, { modo: 'caracteres', tamanho: 8, tipos: ['minusculas', 'maiusculas', 'numeros', 'simbolos'] });
const longaSimples = S.avaliar(c, { modo: 'caracteres', tamanho: 12, tipos: ['minusculas'] });
ok(longaSimples.log10 > curtaComplexa.log10, '12 minúsculas é mais forte que 8 com todos os tipos');
const frase5 = S.avaliar(c, { modo: 'frase', palavras: 5 });
ok(frase5.log10 > curtaComplexa.log10 && frase5.unidade === 'palavra', 'frase-senha de 5 palavras sorteadas é mais forte que 8 com todos os tipos');

// 5. Conteúdo: fontes e avisos obrigatórios
ok(c.simulador.aviso_nunca_digite && /Nunca digite/.test(c.simulador.aviso_nunca_digite), 'aviso: nunca digitar a senha real');
ok(c.avisos.some((a) => /vazou/.test(a)), 'aviso: senha vazada ou repetida cai na hora');
ok(c.ataque.fonte && c.regras.fonte && c.duas_etapas.fonte, 'simulador, regras e duas etapas têm fonte');
ok(c.pouco_conhecidas.itens.every((i) => i.verificado_em), 'todas as proteções pouco conhecidas têm data de verificação');
ok(escudo.checklist.itens.length === 5 && escudo.checklist.extras.length === 2, 'checklist: 5 ações principais + 2 extras');

console.log(falhas ? `${falhas} teste(s) falharam.` : 'Todos os testes do simulador de senha passaram.');
process.exit(falhas ? 1 : 0);
