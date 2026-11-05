// Atualiza o recorte local da lista pública Phishing.Database (licença MIT).
// Como rodar (na pasta do projeto):  node tools/atualizar-listas.js
//
// O que faz:
//  1. Baixa a lista de domínios de phishing ATIVOS do Phishing.Database (GitHub).
//  2. Mantém só os domínios .br (foco do Anzol).
//  3. Guarda cada domínio como "impressão digital" (SHA-256, 16 primeiros caracteres),
//     para o projeto não exibir nem distribuir domínios reais de golpe em texto legível.
//  4. Grava app/data/listas/phishing-database-br.json.
// Nenhum endereço da lista é aberto: só o arquivo de texto da lista é baixado.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FONTE = 'https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt';
const COMMITS = 'https://api.github.com/repos/Phishing-Database/Phishing.Database/commits?per_page=1&path=phishing-domains-ACTIVE.txt';
const DESTINO = path.join(__dirname, '..', 'app', 'data', 'listas', 'phishing-database-br.json');

const impressao = (dominio) => crypto.createHash('sha256').update(dominio).digest('hex').slice(0, 16);

(async () => {
  const resp = await fetch(FONTE);
  if (!resp.ok) throw new Error('Falha ao baixar a lista: HTTP ' + resp.status);
  const linhas = (await resp.text()).split(/\r?\n/);
  const br = [...new Set(linhas.map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#') && l.endsWith('.br')))];

  let atualizadoNaFonte = null;
  try {
    const c = await (await fetch(COMMITS, { headers: { 'User-Agent': 'anzol-academico' } })).json();
    atualizadoNaFonte = c[0] && c[0].commit && c[0].commit.committer && c[0].commit.committer.date;
  } catch (e) { /* data da fonte é opcional */ }

  const saida = {
    _sobre: 'Recorte .br da lista pública Phishing.Database, guardado só como impressões digitais (SHA-256, 16 caracteres hex) dos domínios. Gerado por tools/atualizar-listas.js.',
    fonte: 'Phishing.Database — phishing-domains-ACTIVE.txt',
    fonte_url: 'https://github.com/Phishing-Database/Phishing.Database',
    licenca: 'MIT — Copyright (c) 2018-2025 Mitchell Krog, Nissar Chababy e contribuidores do Phishing.Database. Fornecido "AS IS", sem garantias.',
    atualizado_na_fonte: atualizadoNaFonte,
    gerado_em: new Date().toISOString(),
    total_na_fonte: linhas.filter((l) => l.trim()).length,
    total_br: br.length,
    algoritmo: 'sha256-hex16',
    impressoes: br.map(impressao).sort()
  };
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, JSON.stringify(saida));
  console.log(`OK: ${br.length} domínios .br (de ${saida.total_na_fonte}) → ${path.relative(process.cwd(), DESTINO)} (${(fs.statSync(DESTINO).size / 1024).toFixed(0)} KB)`);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
