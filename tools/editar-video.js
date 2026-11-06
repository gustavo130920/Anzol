#!/usr/bin/env node
/*
 * Anzol — monta o vídeo-pitch final: slides + demonstração em tela cheia + a sua narração.
 *
 * Como funciona, em linguagem simples:
 *   1. Lê docs/video/trechos.json: cada trecho = um arquivo de áudio + um slide (ou um pedaço do vídeo de demonstração).
 *   2. Abre o Edge "invisível" e tira uma foto de cada slide usado.
 *   3. Toca cada áudio e, ao mesmo tempo, mostra a imagem certa. O trecho dura exatamente o tempo da sua fala
 *      (+ uma pequena pausa). Na demonstração, o vídeo acelera ou desacelera para caber na fala.
 *   4. Grava tudo (imagem + som) num .webm em Full HD, que o YouTube aceita.
 *
 * Pré-requisitos: Node 22+ e o servidor local ligado:
 *   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
 * Uso:
 *   node tools/editar-video.js [pasta dos áudios] [arquivo de saída]
 *   (padrão: gravacao/audio  →  gravacao/video-final.webm)
 * Os áudios se chamam pelo id do trecho: 02.m4a, 03.m4a, 09a.m4a ... (aceita m4a, mp3, wav, ogg, opus, webm, aac).
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SITE = 'http://localhost:8080/';
const PASTA_AUDIO = path.resolve(process.argv[2] || path.join(RAIZ, 'gravacao', 'audio'));
const SAIDA = path.resolve(process.argv[3] || path.join(RAIZ, 'gravacao', 'video-final.webm'));
const LARG = 1920, ALT = 1080;
const EXTENSOES = ['.m4a', '.mp3', '.wav', '.ogg', '.opus', '.webm', '.aac'];
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(p => fs.existsSync(p));

const espera = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

class Conexao {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pend = new Map(); }
  abrir() {
    return new Promise((ok, erro) => {
      this.ws.onopen = ok; this.ws.onerror = erro;
      this.ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.id && this.pend.has(m.id)) {
          const { ok: res, erro: rej } = this.pend.get(m.id); this.pend.delete(m.id);
          m.error ? rej(new Error(m.error.message)) : res(m.result);
        }
      };
    });
  }
  enviar(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, erro) => this.pend.set(id, { ok, erro }));
  }
}

/* ---------- montador: roda dentro do navegador ---------- */
const MONTADOR = `
window.__m = (function () {
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#000';
  const c = document.createElement('canvas'); c.width = ${LARG}; c.height = ${ALT}; document.body.append(c);
  const ctx = c.getContext('2d');
  const anterior = document.createElement('canvas'); anterior.width = c.width; anterior.height = c.height;
  const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.preload = 'auto';
  Object.assign(video.style, { position: 'fixed', left: '-9999px', width: '640px' }); document.body.append(video);
  const audio = new AudioContext({ sampleRate: 48000 });
  const destino = audio.createMediaStreamDestination();
  const comp = audio.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.connect(destino);
  const sons = {}, imagens = {};
  let fonte = null, trocaEm = 0, fimDemo = Infinity, gravador, partes = [], blob;
  const w = ms => new Promise(r => setTimeout(r, ms));
  const b64bin = b64 => Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));

  function etiqueta() {
    const t = 'SIMULAÇÃO — material educativo';
    ctx.font = '700 26px "Atkinson Hyperlegible", system-ui, sans-serif';
    const lw = ctx.measureText(t).width + 40, x = c.width - lw - 28, y = 24;
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.strokeStyle = '#ff4f8b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x, y, lw, 46, 23); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f5f5f5'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + 20, y + 24);
  }
  function desenhar() {
    if (!fonte) return;
    if (fonte === video && video.currentTime >= fimDemo) video.pause();
    const a = Math.min(1, (performance.now() - trocaEm) / 300);
    ctx.globalAlpha = 1; ctx.drawImage(anterior, 0, 0);
    ctx.globalAlpha = a; ctx.drawImage(fonte, 0, 0, c.width, c.height); ctx.globalAlpha = 1;
    if (fonte === video) etiqueta();
  }
  setInterval(desenhar, 33);

  return {
    async carregarVideo(url) {
      const b = await (await fetch(url, { cache: 'no-store' })).blob();
      video.src = URL.createObjectURL(b);
      await new Promise((ok, erro) => { video.onloadeddata = ok; video.onerror = () => erro(new Error('vídeo da demonstração não abriu')); });
      return true;
    },
    async carregarAudio(id, b64) {
      const buf = await audio.decodeAudioData(b64bin(b64).buffer);
      let pico = 0;
      for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < d.length; i += 4) pico = Math.max(pico, Math.abs(d[i])); }
      sons[id] = { buf, ganho: pico > 0 ? Math.min(8, 0.89 / pico) : 1 };
      return buf.duration;
    },
    async carregarImagem(id, b64) { imagens[id] = await createImageBitmap(new Blob([b64bin(b64)], { type: 'image/jpeg' })); return true; },
    iniciar() {
      const tipo = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const fluxo = new MediaStream([...c.captureStream(30).getVideoTracks(), ...destino.stream.getAudioTracks()]);
      gravador = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 4500000, audioBitsPerSecond: 160000 });
      gravador.ondataavailable = e => e.data.size && partes.push(e.data);
      return audio.resume().then(() => { gravador.start(1000); return tipo; });
    },
    async tocar(t, pausa) {
      const som = t.id && sons[t.id];
      const dur = som ? som.buf.duration : (t.silencio_s || 2);
      const total = dur + 2 * pausa;
      // troca de imagem com transição curta
      const a = anterior.getContext('2d'); a.clearRect(0, 0, c.width, c.height); a.drawImage(c, 0, 0);
      if (t.demo) {
        video.pause(); video.currentTime = t.demo[0];
        await Promise.race([new Promise(ok => video.addEventListener('seeked', ok, { once: true })), w(4000)]);
        fimDemo = t.demo[1];
        video.playbackRate = Math.max(0.5, Math.min(2.5, (t.demo[1] - t.demo[0]) / total));
        fonte = video; trocaEm = performance.now(); await video.play();
      } else {
        fonte = imagens['s' + t.slide]; trocaEm = performance.now();
      }
      if (som) {
        const s = audio.createBufferSource(); s.buffer = som.buf;
        const g = audio.createGain(); g.gain.value = som.ganho; s.connect(g); g.connect(comp);
        s.start(audio.currentTime + pausa);
      }
      await w(total * 1000);
      return { dur, total, ritmo: t.demo ? video.playbackRate : null };
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
  const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs', 'video', 'trechos.json'), 'utf8'));
  const pausa = cfg.pausa_entre_trechos_s || 0.35;

  // Localiza os áudios
  const faltando = [];
  for (const t of cfg.trechos) {
    const arq = EXTENSOES.map(e => path.join(PASTA_AUDIO, t.id + e)).find(p => fs.existsSync(p));
    if (arq) t.arquivo = arq; else if (!t.opcional) faltando.push(t.id);
  }
  if (faltando.length) throw new Error(`Faltam áudios em ${PASTA_AUDIO}: ${faltando.join(', ')}`);

  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'anzol-edicao-'));
  const nav = spawn(EDGE, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`,
    `--window-size=${LARG},${ALT}`, '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
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
    const cdp = new Conexao(alvos.find(t => t.type === 'page').webSocketDebuggerUrl); await cdp.abrir();
    await cdp.enviar('Page.enable');
    await cdp.enviar('Emulation.setDeviceMetricsOverride', { width: LARG, height: ALT, deviceScaleFactor: 1, mobile: false });
    const avaliar = async (expr) => {
      const r = await cdp.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };

    // 1. Fotos dos slides
    const slidesUsados = [...new Set(cfg.trechos.filter(t => t.slide).map(t => t.slide))];
    log(`Fotografando ${slidesUsados.length} slides…`);
    await cdp.enviar('Page.navigate', { url: SITE + 'docs/slides/index.html#1' });
    await espera(2500);
    await avaliar('document.fonts.ready.then(() => true)');
    const fotos = {};
    for (const n of slidesUsados) {
      await avaliar(`location.hash = '#${n}'; true`);
      await espera(1600); // espera as animações de entrada terminarem
      fotos[n] = (await cdp.enviar('Page.captureScreenshot', { format: 'jpeg', quality: 92 })).data;
    }

    // 2. Prepara o montador (na mesma origem, para ler o vídeo da demonstração)
    await avaliar(`document.querySelectorAll('video').forEach(v => v.pause()); true`);
    await avaliar(MONTADOR + '; true');
    if (cfg.trechos.some(t => t.demo)) await avaliar(`__m.carregarVideo('${SITE}docs/slides/media/passeio.webm')`);
    for (const n of slidesUsados) await avaliar(`__m.carregarImagem('s${n}', '${fotos[n]}')`);
    let previsto = 0;
    for (const t of cfg.trechos) {
      if (t.arquivo) {
        const b64 = fs.readFileSync(t.arquivo).toString('base64');
        t.dur = await avaliar(`__m.carregarAudio('${t.id}', '${b64}')`);
      } else t.dur = t.silencio_s || 2;
      previsto += t.dur + 2 * pausa;
    }
    log(`Duração prevista: ${mmss(previsto)}${previsto > 300 ? '  ⚠ PASSA DE 5:00 — encurte a fala antes de entregar!' : ''}`);

    // 3. Grava em tempo real
    const tipo = await avaliar('__m.iniciar()');
    const tempos = []; let pos = 0;
    for (const t of cfg.trechos) {
      const r = await avaliar(`__m.tocar(${JSON.stringify({ id: t.arquivo ? t.id : null, slide: t.slide, demo: t.demo, silencio_s: t.silencio_s })}, ${pausa})`);
      tempos.push(`${mmss(pos).padStart(5)}  ${t.id.padEnd(4)} ${t.demo ? `demo ${t.demo[0]}–${t.demo[1]} s (ritmo ${r.ritmo.toFixed(2)}×)` : 'slide ' + t.slide}  · fala ${r.dur.toFixed(1)} s`);
      log('Trecho', t.id, `(${r.dur.toFixed(1)} s)`);
      pos += r.total;
    }
    await espera(500);
    const tamanho = await avaliar('__m.parar()');
    const pedacos = [];
    for (let i = 0; i < tamanho; i += 4 * 1024 * 1024) pedacos.push(Buffer.from(await avaliar(`__m.pedaco(${i}, ${i + 4 * 1024 * 1024})`), 'base64'));
    fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
    fs.writeFileSync(SAIDA, Buffer.concat(pedacos));
    const resumo = [`Vídeo: ${path.basename(SAIDA)} · ${mmss(pos)} · ${(tamanho / 1048576).toFixed(1)} MB · ${tipo}`,
      pos > 300 ? '⚠ PASSA DE 5:00' : 'Dentro do limite de 5:00', '', 'Início  trecho', ...tempos];
    fs.writeFileSync(SAIDA.replace(/\.webm$/, '-tempos.txt'), resumo.join('\n') + '\n');
    log('Pronto.'); console.log(resumo.join('\n'));
  } finally {
    try {
      const versao = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json();
      const b = new Conexao(versao.webSocketDebuggerUrl); await b.abrir();
      b.enviar('Browser.close').catch(() => {});
    } catch { /* já fechado */ }
    nav.kill();
    await espera(2000);
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* perfil temporário */ }
  }
}

principal().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
