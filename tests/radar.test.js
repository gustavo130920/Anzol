// Testes do Radar (sem rede; só dados fictícios). Como rodar:  node tests/radar.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(raiz, p), 'utf8'));
const { criarRadar, _util } = require(path.join(raiz, 'app/js/radar.js'));
const { criarScanner } = require(path.join(raiz, 'app/js/scanner.js'));

const config = ler('app/data/radar-config.json');
const semente = ler('app/data/radar-semente.json');
const scanner = criarScanner({ sinais: ler('app/data/signals.json'), config: ler('app/data/scanner-config.json') });
const alvos = (t) => scanner.alvosParaListas(t);

let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };

(async () => {
  let relogio = new Date(2026, 10, 10, 12).getTime();
  const agora = () => new Date(relogio);
  const memoria = () => { let v = null; return { ler: () => v, gravar: (x) => { v = JSON.parse(JSON.stringify(x)); } }; };
  let radar = criarRadar({ semente, config, agora, armazenamento: memoria() });
  const estado = (id) => radar.campanhas().find((c) => c.id === id);

  // 1. Estados iniciais
  ok(estado('C-CNH').estado === 'alerta_ativo' && /fonte oficial/.test(estado('C-CNH').motivo_estado), 'C-CNH: alerta ativo por fonte oficial');
  ok(estado('C-PARENTE').estado === 'alerta_ativo', 'C-PARENTE: alerta ativo por 3+ relatos independentes em 24 h (revisado)');
  ok(estado('C-LOJA').estado === 'em_observacao', 'C-LOJA: em observação (só 2 relatos em 24 h)');
  ok(estado('C-CENTRAL').estado === 'em_observacao' && /falsificado/.test(estado('C-CENTRAL').motivo_estado), 'C-CENTRAL: número de ligação nunca vira alerta (pode ser falsificado)');
  radar.marcarRevisada('C-CENTRAL');
  ok(estado('C-CENTRAL').estado === 'em_observacao', 'C-CENTRAL: nem a revisão humana transforma número de ligação em alerta');
  ok(!estado('C-CNH').em_alta && !estado('C-ADV').em_alta && estado('C-PARENTE').em_alta, 'tendência: CNH e advogado estáveis, falso parente em alta');
  ok(estado('C-ENTREGA').estado === 'arquivada', 'C-ENTREGA: arquivada por falta de relatos recentes');
  ok(estado('C-VALORES').em_alta, 'C-VALORES: tendência de alta detectada');

  // 2. Comparação exata e parecida
  const tCnh = 'DETEX informa: sua CNH será SUSPENSA em 24h. Regularize agora: regulariza-cnh-detex.test';
  let r = await radar.consultar(tCnh, alvos(tCnh));
  ok(r[0] && r[0].campanha.id === 'C-CNH' && r[0].como === 'exato', 'mesmo domínio → campanha C-CNH, comparação exata');

  const tVariante = 'Atenção: a sua habilitação vai ser suspensa amanhã por pendência. Regularize hoje para evitar a cassação.';
  r = await radar.consultar(tVariante, alvos(tVariante));
  ok(r.length && r[0].campanha.id === 'C-CNH' && r[0].como === 'parecido', `variante de texto sem link → C-CNH por similaridade (IA leve: ${r[0] && Math.round(r[0].similaridade * 100)}%)`);
  ok(!r.some((x) => x.campanha.id === 'C-LOJA'), 'a variante da CNH não é confundida com a campanha da loja');

  const tDom = 'regularizar-cnh-detex.test';
  r = await radar.consultar(tDom, alvos(tDom));
  ok(r.some((x) => x.campanha.id === 'C-CNH' && x.como === 'parecido'), 'domínio parecido (1 letra) → C-CNH como parecido');

  const tTel = 'Oi mãe, esse é meu número novo (11) 90000-0002, me faz um Pix?';
  r = await radar.consultar(tTel, alvos(tTel));
  ok(r[0] && r[0].campanha.id === 'C-PARENTE' && r[0].como === 'exato', 'telefone já reportado (comparado por HMAC) → C-PARENTE exato');

  const tLig = 'Recebi ligação do número (31) 90000-0004 dizendo ser do banco';
  r = await radar.consultar(tLig, alvos(tLig), 'ligacao');
  const lig = r.find((x) => x.campanha.id === 'C-CENTRAL');
  ok(lig && lig.como === 'parecido' && /falsificado/.test(lig.porque), 'número de ligação nunca é "exato": avisa que pode ser falsificado');

  const tLegit = 'Entregas Rápidas Exemplo: seu pedido da Loja Vitrine saiu para entrega hoje. Acompanhe pelo app da loja onde você comprou.';
  r = await radar.consultar(tLegit, alvos(tLegit));
  ok(!r.some((x) => x.como === 'exato'), 'mensagem legítima não bate de forma exata com nenhuma campanha' + (r.length ? ` (parecidas: ${r.map((x) => x.campanha.id + ' ' + Math.round(x.similaridade * 100) + '%').join(', ')})` : ''));

  // 3. Relato em um toque que liga o alerta (o momento do vídeo)
  const tLoja = 'Liquidação Loja Vitrine: tênis por R$ 89, só hoje, pagamento só por Pix: lojavitrine-oficial-liquida.test';
  const rel = await radar.relatar({ texto: tLoja, alvos: alvos(tLoja), canal: 'anuncio', uf: 'SP', consentimento: true });
  ok(rel.destino === 'campanha' && rel.campanha.id === 'C-LOJA' && rel.mudouEstado && rel.campanha.estado === 'alerta_ativo', 'relato com domínio conhecido soma à C-LOJA e liga o alerta (3º relato independente em 24 h)');
  const pessoasAntes = estado('C-LOJA').pessoas;
  await radar.relatar({ texto: tLoja, alvos: alvos(tLoja), consentimento: true });
  ok(estado('C-LOJA').pessoas === pessoasAntes && estado('C-LOJA').total_relatos === pessoasAntes + 1, 'relatos repetidos do mesmo usuário não contam como pessoas diferentes');

  // 3b. Privacidade: telefone/e-mail só entram se a pessoa marcar que são do golpista
  {
    const r2 = criarRadar({ semente, config, agora, armazenamento: memoria() });
    const tVit = 'Olá vitima.teste@exemplo.test, seu número (11) 98888-7777 foi sorteado: liberacao-premio-agora.test';
    await r2.relatar({ texto: tVit, alvos: alvos(tVit), consentimento: true });
    const semConfirmar = r2.fila()[0].relato.indicadores.map((i) => i.tipo);
    ok(!semConfirmar.includes('chave_pix') && !semConfirmar.some((t) => t.startsWith('telefone')), 'sem confirmação, e-mail e telefone da mensagem NÃO viram indicador (podem ser da vítima)');
    const tGolp = 'Pague a taxa pela chave golpista.teste@exemplo.test: liberacao-premio-agora.test';
    await r2.relatar({ texto: tGolp, alvos: alvos(tGolp), consentimento: true, contatosDoGolpista: ['golpista.teste@exemplo.test'] });
    const conf = r2.fila()[1].relato.indicadores;
    ok(conf.some((i) => i.tipo === 'chave_pix' && /^[0-9a-f]{32}$/.test(i.hash)) && !JSON.stringify(conf).includes('golpista.teste'), 'confirmado pela pessoa: vira indicador, só como HMAC');
  }

  // 4. Consentimento e limite por dia
  let erro = null;
  try { await radar.relatar({ texto: tLoja, alvos: alvos(tLoja), consentimento: false }); } catch (e) { erro = e; }
  ok(erro && /concorda/.test(erro.message), 'sem consentimento, o relato não é enviado');
  for (let i = 0; i < 5; i++) { try { await radar.relatar({ texto: 'teste ' + i + ' outro-endereco-' + i + '.test', alvos: alvos('outro-endereco-' + i + '.test'), consentimento: true }); } catch (e) { erro = e; } }
  ok(erro && /Limite/.test(erro.message), 'limite de relatos por usuário por dia (anti-abuso)');

  // 5. Fila de moderação: campanha nova + rascunho de teste
  relogio += 2 * 86400000;
  radar = criarRadar({ semente, config, agora, armazenamento: memoria() });
  const tNovo = 'Seu benefício de R$ 600 foi aprovado. Para liberar, pague a taxa de cadastro: beneficio-liberado-agora.test';
  const relNovo = await radar.relatar({ texto: tNovo, alvos: alvos(tNovo), consentimento: true });
  ok(relNovo.destino === 'fila', 'relato sem campanha conhecida vai para a fila de moderação');
  const item = radar.fila()[0];
  radar.moderar(item.id, 'nova', { titulo: 'Benefício falso com taxa', familia: 'dinheiro-inesperado', criarRascunho: true });
  const nova = radar.campanhas().find((c) => c.titulo === 'Benefício falso com taxa');
  ok(nova && nova.estado === 'em_observacao' && radar.rascunhos().length === 1, 'moderador cria campanha nova (em observação) e um rascunho de teste');
  ok(!/Liberar/.test(radar.rascunhos()[0].status) && /revis/.test(radar.rascunhos()[0].status), 'rascunho de teste precisa de revisão antes de entrar no jogo');

  // 6. Contestação aceita arquiva
  radar.contestar('C-VALORES', 'O domínio é de uma empresa real (teste)');
  const cont = radar.fila().find((f) => f.tipo === 'contestacao');
  radar.moderar(cont.id, 'aceitar');
  ok(estado('C-VALORES') === undefined || radar.campanhas().find((c) => c.id === 'C-VALORES').estado === 'arquivada', 'contestação aceita arquiva a campanha');

  // 7. Arquivamento por tempo
  radar = criarRadar({ semente, config, agora, armazenamento: memoria() });
  const camp = (id) => radar.campanhas().find((c) => c.id === id);
  relogio += 15 * 86400000; // 15 dias depois
  ok(camp('C-LOJA').estado === 'arquivada' && camp('C-CNH').estado === 'arquivada', 'só domínio: arquiva após 14 dias sem relato (inclusive com fonte oficial: o alerta expira)');
  ok(camp('C-PARENTE').estado !== 'arquivada', 'telefone de mensagem: ainda válido aos 15 dias (prazo 30)');
  relogio += 25 * 86400000; // 40 dias no total
  ok(camp('C-PARENTE').estado === 'arquivada', 'telefone de mensagem: arquiva após 30 dias');
  ok(camp('C-ADV').estado !== 'arquivada' && camp('C-VALORES').estado !== 'arquivada', 'campanha com chave Pix: ainda válida aos 40 dias (prazo 90, cobre a janela de 80 dias do MED)');
  ok(camp('C-VALORES').dias_validade === 90, 'campanha com domínio + chave Pix usa o maior prazo (90)');
  relogio += 60 * 86400000; // 100 dias no total
  ok(radar.campanhas().every((c) => c.estado === 'arquivada'), 'sem relatos por 100 dias, todas as campanhas arquivam');

  // 8. Privacidade
  const s = _util.sanitizar('Sra. Maria, CPF 123.456.789-00, ligue (11) 98888-7777 ou escreva para fulana@exemplo.test');
  ok(!/Maria|123\.456|98888|fulana@/.test(s), 'relato guardado sem nome, CPF, telefone ou e-mail: ' + s);
  const bruto = JSON.stringify(semente);
  ok(!/9000000\d|@exemplo\.test/.test(bruto), 'semente não guarda telefone nem chave Pix legíveis (só HMAC)');
  const doms = semente.campanhas.flatMap((c) => c.indicadores.filter((i) => i.tipo === 'dominio').map((i) => i.valor));
  ok(doms.every((d) => /\.(test|example|invalid)$/.test(d)), 'todos os domínios da semente usam TLD reservado');
  ok((await _util.hmac(config.hash.segredo_demo, 'tel:11900000002')) === 'a0deaa7b78f4db20e80a26c3dad7cea8', 'HMAC do app igual ao usado na semente');

  // 9. Estatísticas
  radar = criarRadar({ semente, config, agora: () => new Date(2026, 10, 10, 12), armazenamento: memoria() });
  const est = radar.estatisticas();
  ok(est.campanhas === 7 && est.por_estado.alerta_ativo >= 3 && est.por_uf.SP > 0, `estatísticas para o painel: ${JSON.stringify(est.por_estado)}`);

  console.log(`\n${falhas ? 'Houve ' + falhas + ' falha(s).' : 'Todos os testes do Radar passaram.'}`);
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
