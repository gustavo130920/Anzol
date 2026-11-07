#!/usr/bin/env node
/*
 * Anzol — grava um vídeo de passeio por todas as funcionalidades (sem baixar nada).
 *
 * Como funciona, em linguagem simples:
 *   1. Abre o Microsoft Edge "invisível" (headless), num perfil novo e vazio (como janela anônima).
 *   2. Controla o app pelo protocolo de depuração do navegador: clica, digita e rola a página,
 *      com um cursor desenhado e uma legenda em cada etapa.
 *   3. Guarda as imagens da tela que o próprio navegador envia (screencast).
 *   4. Monta o vídeo .webm dentro do próprio Edge (canvas + MediaRecorder) e salva o arquivo.
 *
 * Pré-requisitos: Node 22+ e o servidor local ligado:
 *   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
 * Uso:
 *   node tools/gravar-passeio.js [endereço do app] [arquivo de saída]
 *   (padrão: http://localhost:8080/app/  →  docs/slides/media/passeio.webm)
 * Velocidade: o vídeo final é acelerado 1,6× (mude com a variável VELOCIDADE, ex.: VELOCIDADE=1 = tempo real).
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const APP = process.argv[2] || 'http://localhost:8080/app/';
const SAIDA = path.resolve(process.argv[3] || path.join(__dirname, '..', 'docs', 'slides', 'media', 'passeio.webm'));
const LARG = 1280, ALT = 720;
const VEL = Math.max(0.5, Math.min(3, Number(process.env.VELOCIDADE) || 1.6));
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(p => fs.existsSync(p));

const espera = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/* ---------- conexão com o navegador (Chrome DevTools Protocol) ---------- */
class Conexao {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pend = new Map(); this.ouvintes = {}; }
  abrir() {
    return new Promise((ok, erro) => {
      this.ws.onopen = ok; this.ws.onerror = erro;
      this.ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.id && this.pend.has(m.id)) {
          const { ok: res, erro: rej } = this.pend.get(m.id); this.pend.delete(m.id);
          m.error ? rej(new Error(m.error.message)) : res(m.result);
        } else if (m.method && this.ouvintes[m.method]) this.ouvintes[m.method](m.params);
      };
    });
  }
  enviar(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, erro) => this.pend.set(id, { ok, erro }));
  }
  em(evento, fn) { this.ouvintes[evento] = fn; }
}

/* ---------- ajudantes que rodam DENTRO da página (cursor, legenda, cliques) ---------- */
const AJUDANTES = `
window.__p = (function () {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const cur = document.createElement('div');
  cur.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  Object.assign(cur.style, { position: 'fixed', left: '640px', top: '360px', zIndex: 2147483647, pointerEvents: 'none',
    transition: 'left .6s ease, top .6s ease', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.6))' });
  const leg = document.createElement('div');
  Object.assign(leg.style, { position: 'fixed', left: '50%', bottom: '18px', transform: 'translateX(-50%)', zIndex: 2147483646,
    pointerEvents: 'none', background: 'rgba(0,0,0,.88)', color: '#f5f5f5', border: '2px solid #ff4f8b', borderRadius: '999px',
    padding: '10px 24px', font: '700 20px "Atkinson Hyperlegible", system-ui, sans-serif', whiteSpace: 'nowrap',
    transition: 'opacity .3s', opacity: '0' });
  document.body.append(cur, leg);
  function achar(texto, escopo) {
    const raiz = typeof escopo === 'string' ? document.querySelector(escopo) : (escopo || document);
    const lista = [...raiz.querySelectorAll('button, a, summary, label, input[type=checkbox]')]
      .filter(e => e.offsetParent !== null || e.tagName === 'SUMMARY');
    const e = lista.find(e => (e.textContent || '').replace(/\\s+/g, ' ').includes(texto));
    if (!e) throw new Error('Não achei: ' + texto);
    return e;
  }
  async function focar(e, bloco) {
    e.scrollIntoView({ behavior: 'smooth', block: bloco || 'center', inline: 'nearest' }); await w(650);
    if (window.scrollX) window.scrollTo({ left: 0, top: window.scrollY }); // nunca rolar de lado no vídeo
    const r = e.getBoundingClientRect();
    cur.style.left = (r.left + Math.min(r.width / 2, 60)) + 'px'; cur.style.top = (r.top + r.height / 2) + 'px'; await w(500);
  }
  async function clicar(texto, escopo, pausa) {
    const e = typeof texto === 'string' ? achar(texto, escopo) : texto;
    await focar(e);
    cur.animate([{ transform: 'scale(1)' }, { transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 250 });
    e.click(); await w(pausa == null ? 900 : pausa);
  }
  async function digitar(seletor, texto) {
    const e = document.querySelector(seletor); await focar(e); e.focus(); e.value = '';
    for (const c of texto) { e.value += c; e.dispatchEvent(new Event('input', { bubbles: true })); await w(28); }
    await w(500);
  }
  async function legenda(t) { leg.style.opacity = '0'; await w(300); leg.textContent = t; leg.style.opacity = '1'; await w(400); }
  async function rolar(px, pausa) { window.scrollBy({ top: px, behavior: 'smooth' }); await w(pausa || 1400); }
  async function topo() { window.scrollTo({ top: 0, behavior: 'smooth' }); await w(1000); }
  async function ate(fn, max) { const t0 = Date.now(); while (Date.now() - t0 < (max || 15000)) { if (fn()) return true; await w(250); } throw new Error('Tempo esgotado'); }
  async function pairar(seletor, n) {
    const e = document.querySelectorAll(seletor)[n || 0]; await focar(e);
    e.dispatchEvent(new MouseEvent('mouseenter')); await w(1800);
  }
  return { w, achar, focar, clicar, digitar, legenda, rolar, topo, ate, pairar };
})();`;

/* ---------- o roteiro do passeio ---------- */
const VARIANTE = 'Queima de estoque Loja Vitrine: tênis de R$ 499 por R$ 79. Só hoje! Pagamento apenas por Pix. lojavitrine-queima-estoque.test';
const PASSOS = [
  ['Abertura', `await __p.w(1500); await __p.legenda('Anzol — aprender a reconhecer golpes e se proteger'); await __p.w(3200);`],
  ['Scanner', `
    await __p.legenda('1 · Scanner: recebi um anúncio suspeito e colo aqui');
    await __p.clicar('Use um exemplo');
    await __p.clicar('Liquidação imperdível', '#lista-exemplos', 1500);
    await __p.legenda('Risco com motivos — o Anzol nunca abre o link');
    await __p.focar(document.getElementById('resultado'), 'start'); await __p.w(2000);
    await __p.rolar(420, 2200); await __p.rolar(420, 2200);`],
  ['Radar: relato', `
    await __p.legenda('2 · Radar: 3 pessoas já relataram — relato em um toque');
    await __p.clicar('Relate em um toque', '#resultado', 1500);
    await __p.rolar(260, 1500);
    await __p.clicar('Concordo em enviar', '#resultado', 600);
    await __p.clicar('Enviar relato', '#resultado', 1200);
    await __p.legenda('Com o 4º relato independente, o alerta é LIGADO');
    await __p.ate(() => [...document.querySelectorAll('#resultado p')].some(p => /LIGADO/.test(p.textContent)), 8000);
    await __p.focar([...document.querySelectorAll('#resultado p')].find(p => /LIGADO/.test(p.textContent))); await __p.w(3000);`],
  ['Radar: tela', `
    await __p.clicar('Ver no Radar', '#resultado', 1500);
    await __p.legenda('Indicadores, nunca acusações: "reportada por N pessoas"');
    await __p.rolar(300, 2500);
    await __p.clicar('Alerta ativo', '#radar-raiz', 2000);
    await __p.clicar('Todas', '#radar-raiz', 1000);`],
  ['IA leve', `
    await __p.legenda('3 · IA leve: uma variante do golpe chega por outra pessoa');
    location.hash = 'scanner'; await __p.w(900); await __p.topo();
    await __p.digitar('#entrada', ${JSON.stringify(VARIANTE)});
    await __p.clicar('Analisar', '#form-scanner', 1500);
    await __p.clicar('Relate em um toque', '#resultado', 1000);
    await __p.clicar('Concordo em enviar', '#resultado', 600);
    await __p.clicar('Enviar relato', '#resultado', 1500);
    location.hash = 'radar'; await __p.w(900);
    await __p.legenda('Moderação: o Radar sugere juntar à campanha (texto parecido)');
    await __p.focar(__p.achar('Juntar à campanha sugerida', '#radar-raiz')); await __p.w(1200);
    await __p.rolar(-120, 2500);
    await __p.clicar('Juntar à campanha sugerida', '#radar-raiz', 1500);`],
  ['Treino', `
    await __p.legenda('4 · Testes: treino com o mesmo golpe real');
    await __p.topo();
    const treinar = [...document.querySelectorAll('#radar-raiz button')].find(b => {
      if (!/Treinar/.test(b.textContent)) return false;
      let e = b; for (let i = 0; i < 4 && e; i++) { e = e.parentElement; if (e && /Loja Vitrine/.test(e.textContent) && !/Taxa de reentrega/.test(e.textContent)) return true; }
      return false;
    });
    await __p.clicar(treinar, null, 1500);
    await __p.rolar(380, 1500);
    for (const t of ['Site criado', 'Pede Pix', 'Urgência', 'Oferta boa']) await __p.clicar(t, '#jogo-raiz', 500);
    await __p.legenda('Investigar vale mais que ser rápido: lupa de domínio');
    await __p.clicar('lupa de domínio', '#jogo-raiz', 2500);
    await __p.clicar('Golpe', '#jogo-raiz', 1200);
    await __p.legenda('E o próximo passo certo: confirmar por outro caminho');
    await __p.clicar('Não comprar', '#jogo-raiz', 1500);
    await __p.legenda('XP por pistas e por usar a lupa — sem bônus por pressa');
    await __p.rolar(300, 3500);`],
  ['Domínio e procedimento', `
    await __p.clicar('Voltar ao início', '#jogo-raiz', 1200);
    await __p.legenda('Níveis, sequência com perdão, teste do dia e reteste');
    await __p.topo(); await __p.rolar(250, 2500);
    await __p.legenda('Teste de domínio: qual endereço é o verdadeiro?');
    await __p.clicar('Endereço verdadeiro: Loja Vitrine', '#jogo-raiz', 1500);
    await __p.clicar('lojavitrine.example', '#jogo-raiz', 2500);
    await __p.rolar(300, 2500);
    await __p.clicar('Voltar ao início', '#jogo-raiz', 1000);
    await __p.legenda('Teste de procedimento: o que fazer agora?');
    await __p.clicar('Você recebe ligação', '#jogo-raiz', 1500);
    await __p.clicar('Desligar e ligar você mesmo', '#jogo-raiz', 2500);
    await __p.rolar(300, 2500);`],
  ['Caí no golpe', `
    location.hash = 'socorro'; await __p.w(800); await __p.topo();
    await __p.legenda('5 · Caí no golpe: escolho o que aconteceu');
    await __p.w(1500);
    await __p.clicar('Fiz um Pix ou pagamento', '#socorro-raiz', 1500);
    await __p.legenda('Passos por urgência, só canais oficiais, sem promessa de recuperar');
    await __p.rolar(400, 2500); await __p.rolar(400, 2500); await __p.rolar(400, 2500);`],
  ['Kit de provas', `
    await __p.legenda('6 · Kit de provas: o comprovante é lido no próprio aparelho');
    await __p.clicar('Abrir o Kit de provas', '#socorro-raiz', 1500);
    await __p.clicar('Usar comprovante de exemplo', '#kit-raiz', 1500);
    await __p.clicar('Ler texto do print', '#kit-raiz', 300);`],
  ['Kit: resultado', `
    await __p.legenda('Visão computacional: valor, data e chave Pix extraídos');
    await __p.focar(__p.achar('Gerar rascunho', '#kit-raiz')); await __p.rolar(-260, 3500);
    await __p.clicar('Gerar rascunho', '#kit-raiz', 1500);
    await __p.legenda('Rascunho para o banco e o boletim — a pessoa revisa');
    await __p.rolar(350, 3000);`],
  ['Escudo', `
    location.hash = 'escudo'; await __p.w(800); await __p.topo();
    await __p.legenda('7 · Escudo: 5 ações reais e 8 cartões de 1 minuto');
    await __p.w(1200);
    await __p.clicar(document.querySelectorAll('#escudo-raiz input[type=checkbox]')[0], null, 800);
    await __p.clicar(document.querySelectorAll('#escudo-raiz input[type=checkbox]')[1], null, 1200);
    await __p.rolar(450, 2500); await __p.rolar(450, 2500);`],
  ['Escudo: contas', `
    await __p.legenda('Proteja suas contas: simulador de senha, sem campo de senha');
    await __p.focar(document.getElementById('titulo-contas'), 'start'); await __p.w(1500);
    const faixa = document.querySelector('.secao-contas input[type=range]');
    await __p.focar(faixa); await __p.w(800);
    for (const v of [10, 12, 15, 16]) { faixa.value = v; faixa.dispatchEvent(new Event('input', { bubbles: true })); await __p.w(900); }
    await __p.legenda('Tamanho pesa mais que símbolo; duas etapas e mais proteções');
    await __p.rolar(450, 2500); await __p.rolar(450, 2500); await __p.rolar(450, 2500);`],
  ['Painel', `
    location.hash = 'painel'; await __p.w(1000); await __p.topo();
    await __p.legenda('8 · Painel: cada número diz de onde vem (real, simulação, aparelho)');
    await __p.w(1500); await __p.rolar(330, 2000);
    await __p.pairar('#painel-raiz svg rect.alvo', 0);
    await __p.rolar(450, 2500); await __p.rolar(450, 2500);`],
  ['Acessibilidade', `
    await __p.topo();
    await __p.legenda('9 · Acessível: texto maior e tema claro');
    await __p.clicar(document.getElementById('btn-fonte'), null, 2000);
    await __p.clicar(document.getElementById('btn-fonte'), null, 800);
    await __p.clicar(document.getElementById('btn-tema'), null, 2200);
    await __p.clicar(document.getElementById('btn-tema'), null, 800);
    location.hash = 'scanner'; await __p.w(800);
    await __p.legenda('Antes de agir: quem pede? o que pede? por onde veio? como confirmo?');
    await __p.w(5000);`]
];

/* ---------- montagem do vídeo dentro do navegador ---------- */
const MONTADOR = `
window.__m = (function () {
  const c = document.createElement('canvas'); c.width = ${LARG}; c.height = ${ALT};
  document.body.style.margin = '0'; document.body.append(c);
  const ctx = c.getContext('2d'); let ultimo = null, partes = [], gravador, blob;
  setInterval(() => { if (ultimo) ctx.drawImage(ultimo, 0, 0, c.width, c.height); }, 100);
  return {
    iniciar() {
      const tipo = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      gravador = new MediaRecorder(c.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 1800000 });
      gravador.ondataavailable = e => e.data.size && partes.push(e.data);
      gravador.start(1000); return tipo;
    },
    async quadro(b64) {
      const bin = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
      ultimo = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
      ctx.drawImage(ultimo, 0, 0, c.width, c.height);
    },
    parar() { return new Promise(ok => { gravador.onstop = () => { blob = new Blob(partes, { type: 'video/webm' }); ok(blob.size); }; gravador.stop(); }); },
    async pedaco(ini, fim) {
      const buf = new Uint8Array(await blob.slice(ini, fim).arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    }
  };
})();`;

async function principal() {
  if (!EDGE) throw new Error('Edge/Chrome não encontrado.');
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'anzol-passeio-'));
  // Porta 0 = o navegador escolhe uma porta livre e a anota no perfil (evita cair num Edge antigo).
  const nav = spawn(EDGE, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`,
    `--window-size=${LARG},${ALT}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    'about:blank'], { stdio: 'ignore' });
  let porta;
  try {
    let alvos;
    for (let i = 0; i < 60 && !alvos; i++) {
      try {
        porta = porta || Number(fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
        alvos = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
      } catch { await espera(250); }
    }
    if (!alvos) throw new Error('O navegador não respondeu.');
    const pagina = alvos.find(t => t.type === 'page');
    const cdp = new Conexao(pagina.webSocketDebuggerUrl); await cdp.abrir();
    await cdp.enviar('Page.enable'); await cdp.enviar('Runtime.enable');
    await cdp.enviar('Emulation.setDeviceMetricsOverride', { width: LARG, height: ALT, deviceScaleFactor: 1, mobile: false });
    const avaliar = async (expr) => {
      const r = await cdp.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };

    log('Abrindo', APP);
    await cdp.enviar('Page.navigate', { url: APP + '#scanner' });
    await espera(2500);
    await avaliar(`document.fonts.ready.then(() => true)`);

    // Gravação da tela
    const quadros = []; const cortes = []; let gravando = true;
    cdp.em('Page.screencastFrame', p => {
      if (gravando) quadros.push({ t: Date.now(), d: p.data });
      cdp.enviar('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
    });
    await avaliar(AJUDANTES + '; true');
    await cdp.enviar('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: LARG, maxHeight: ALT, everyNthFrame: 1 });
    await espera(500);

    const capitulos = [];
    for (const [nome, js] of PASSOS) {
      capitulos.push({ nome, t: Date.now() });
      log('Passo:', nome);
      await avaliar(`(async () => { ${js} })()`);
      if (nome === 'Kit de provas') {
        // A leitura (OCR) pode demorar; esse trecho de espera é cortado do vídeo.
        const c0 = Date.now() + 1500;
        await avaliar(`__p.ate(() => /Gerar rascunho/.test(document.getElementById('kit-raiz').innerText), 90000)`);
        await espera(600);
        if (Date.now() - c0 > 1000) cortes.push([c0, Date.now() - 400]);
      }
    }
    await espera(800);
    gravando = false;
    await cdp.enviar('Page.stopScreencast');
    const fimGravacao = Date.now();
    log(`Gravação: ${quadros.length} quadros.`);

    // Linha do tempo sem os cortes
    const tempoSemCortes = t => t - cortes.reduce((s, [a, b]) => s + (t > b ? b - a : t > a ? t - a : 0), 0);
    const dentroDeCorte = t => cortes.some(([a, b]) => t > a && t < b);
    const usados = quadros.filter(q => !dentroDeCorte(q.t));
    const t0 = tempoSemCortes(usados[0].t);
    const noVideo = t => (tempoSemCortes(t) - t0) / VEL; // posição do quadro no vídeo final (ms)
    const duracao = noVideo(fimGravacao);
    log(`Montando vídeo de ~${Math.round(duracao / 1000)} s (${VEL}× mais rápido; a montagem leva esse tempo)…`);

    await cdp.enviar('Page.navigate', { url: 'about:blank' }); await espera(800);
    await avaliar(MONTADOR + '; true');
    const tipo = await avaliar('__m.iniciar()');
    const inicio = Date.now();
    for (let i = 0; i < usados.length; i++) {
      const q = usados[i];
      const alvo = inicio + noVideo(q.t);
      const falta = alvo - Date.now(); if (falta > 0) await espera(falta);
      // Atrasado e o próximo quadro já venceu? Pula este (evita acumular atraso).
      if (i + 1 < usados.length && Date.now() > inicio + noVideo(usados[i + 1].t)) continue;
      await avaliar(`__m.quadro(${JSON.stringify(q.d)})`);
    }
    const falta = inicio + duracao - Date.now(); if (falta > 0) await espera(falta);
    const tamanho = await avaliar('__m.parar()');
    const pedacos = [];
    for (let i = 0; i < tamanho; i += 4 * 1024 * 1024) pedacos.push(Buffer.from(await avaliar(`__m.pedaco(${i}, ${i + 4 * 1024 * 1024})`), 'base64'));
    fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
    fs.writeFileSync(SAIDA, Buffer.concat(pedacos));

    // Capítulos (para a edição e para os slides)
    const caps = capitulos.map(c => {
      const s = Math.max(0, Math.round(noVideo(c.t) / 1000));
      return `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}  ${c.nome}`;
    });
    fs.writeFileSync(SAIDA.replace(/\.webm$/, '-capitulos.txt'), caps.join('\n') + '\n');
    log(`Pronto: ${SAIDA} (${(tamanho / 1048576).toFixed(1)} MB, ${tipo}, ~${Math.round(duracao / 1000)} s)`);
    console.log(caps.join('\n'));
  } finally {
    // Fecha o navegador inteiro pelo próprio protocolo (no Windows, o Edge se solta do processo
    // que o abriu, e kill()/taskkill deixam processos para trás).
    try {
      const versao = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json();
      const b = new Conexao(versao.webSocketDebuggerUrl); await b.abrir();
      b.enviar('Browser.close').catch(() => {});
    } catch { /* navegador já fechado */ }
    nav.kill();
    await espera(2000);
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* perfil temporário */ }
  }
}

principal().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
